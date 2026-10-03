/**
 * Cuts the NIP corpus into passages for embedding. One "about" passage per NIP (title + summary)
 * so short queries match the NIP as a whole, then one passage per section, long sections split
 * into overlapping word windows. MiniLM was trained on ≤ 128-token inputs and truncates longer
 * text, so ~110-word windows keep every word inside what the model actually reads.
 */
import type { NipDocument } from "@nostrschool/nips";
import { stripInlineMarkdown } from "@nostrschool/nips/corpus/parse.ts";
import type { EmbeddingChunk } from "./types.ts";

export interface ChunkOptions {
  /** Words per window. */
  readonly windowWords?: number;
  /** Words shared by consecutive windows, so a sentence cut at a border still lands whole once. */
  readonly overlapWords?: number;
  /** Sections with fewer prose words (only a code example, a lone link) are skipped. */
  readonly minWords?: number;
  /** Snippet length in characters. */
  readonly snippetChars?: number;
}

/** A passage to embed: the stored metadata plus the (longer) text the model sees. */
export interface PreparedChunk {
  readonly chunk: EmbeddingChunk;
  readonly embedText: string;
}

const FENCE = /^\s*(```|~~~)/;

/**
 * Section markdown → prose. Fenced code (JSON examples, signatures) is dropped: it is mostly hex
 * and punctuation, which only blurs the sentence embedding. Tables and lists keep their words.
 */
export const markdownToPlainText = (markdown: string): string => {
  let inFence = false;
  const lines: string[] = [];
  for (const line of markdown.split("\n")) {
    if (FENCE.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const text = line
      .replace(/^\s*(?:[-*+]|\d+\.)\s+/, "")
      .replace(/^\s*>\s?/, "")
      .replace(/^\s*\|?[\s:|-]+\|?\s*$/, "")
      .replace(/\|/g, " ");
    lines.push(text);
  }
  return stripInlineMarkdown(lines.join(" "));
};

/** Splits words into windows of `size` advancing by `size - overlap`; never yields empty windows. */
export const wordWindows = (text: string, size: number, overlap: number): readonly string[] => {
  const words = text.split(/\s+/).filter((w) => w !== "");
  if (words.length === 0) return [];
  const step = Math.max(1, size - overlap);
  const out: string[] = [];
  for (let start = 0; ; start += step) {
    out.push(words.slice(start, start + size).join(" "));
    if (start + size >= words.length) break;
  }
  return out;
};

/** Cuts at a word boundary and adds an ellipsis when shortened. */
export const snippetOf = (text: string, max: number): string => {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const space = cut.lastIndexOf(" ");
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[\s,;:.]+$/, "")}…`;
};

const SKIPPED_SECTIONS = /^(changes|changelog|license|copyright)$/i;

/** Our own text about a NIP, beyond the spec markdown. */
export interface NipExtras {
  /** Extra summaries (our i18n English summary), appended to the "about" passage. */
  readonly summaries?: readonly string[];
  /**
   * Search hints (aliases.ts). Each becomes its OWN short passage: appended to the about text
   * they were diluted by the summaries and "send sats" did not reach NIP-57.
   */
  readonly hints?: readonly string[];
}

export const chunkNip = (
  doc: NipDocument,
  options: ChunkOptions = {},
  extras: NipExtras = {},
): readonly PreparedChunk[] => {
  const size = options.windowWords ?? 110;
  const overlap = options.overlapWords ?? 25;
  const minWords = options.minWords ?? 6;
  const snippetChars = options.snippetChars ?? 180;
  const name = `NIP-${doc.id} ${doc.title}`;
  const unique = [
    ...new Set([doc.summary, ...(extras.summaries ?? [])].filter((s) => s.trim() !== "")),
  ];
  const intro = (id: string, embedText: string): PreparedChunk => ({
    chunk: {
      id: `${doc.id}:${id}`,
      nip: doc.id,
      sectionId: "intro",
      heading: doc.title,
      text: snippetOf(doc.summary === "" ? doc.title : doc.summary, snippetChars),
    },
    embedText,
  });
  const about = intro("about", [name, ...unique].join(". "));
  const hints = (extras.hints ?? []).map((hint, i) => intro(`hint:${i}`, `${doc.title}: ${hint}`));
  const sections = doc.sections
    .filter((s) => !SKIPPED_SECTIONS.test(s.heading))
    .flatMap((section) => {
      const prose = markdownToPlainText(section.markdown);
      if (prose.split(" ").length < minWords) return [];
      const heading = section.heading === "" ? doc.title : section.heading;
      return wordWindows(prose, size, overlap).map(
        (window, i): PreparedChunk => ({
          chunk: {
            id: `${doc.id}:${section.id}:${i}`,
            nip: doc.id,
            sectionId: section.id,
            heading,
            text: snippetOf(window, snippetChars),
          },
          embedText: `${doc.title} — ${heading}: ${window}`,
        }),
      );
    });
  return [about, ...hints, ...sections];
};

/** Every NIP's passages, in corpus order, with our extras per NIP. */
export const chunkCorpus = (
  docs: readonly NipDocument[],
  options: ChunkOptions = {},
  extras: (id: string) => NipExtras = () => ({}),
): readonly PreparedChunk[] => docs.flatMap((doc) => chunkNip(doc, options, extras(doc.id)));
