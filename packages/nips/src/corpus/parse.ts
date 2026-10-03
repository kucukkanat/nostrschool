/**
 * Pure parsers from the nostr-protocol/nips markdown to corpus data. No IO: the snapshot script
 * (scripts/snapshot-nips.ts) does git and files, these functions are tested against real NIP text.
 *
 * The repo has no machine-readable index, so this is deliberately tolerant: a NIP whose header
 * does not follow the usual shape still gets an entry, just with fewer facets (null maturity…).
 */
import type {
  KindRegistryRow,
  MessageDirection,
  MessageRegistryRow,
  NipCorpus,
  NipCorpusSource,
  NipDocument,
  NipId,
  NipIndex,
  NipKindRef,
  NipMaturity,
  NipMessageRef,
  NipMeta,
  NipRequirement,
  NipSection,
  NipStatus,
  NipUnrecommended,
} from "../types.ts";
import { isNipId } from "../types.ts";

export interface ReadmeListEntry {
  readonly id: NipId;
  readonly title: string;
  readonly unrecommended?: NipUnrecommended;
}

const LINKED_ID = /\]\((?:\.\/)?([0-9A-Fa-f]{2})\.md(?:#[^)]*)?\)/g;

const linkedIds = (text: string): readonly NipId[] =>
  unique([...text.matchAll(LINKED_ID)].map((m) => (m[1] ?? "").toUpperCase()).filter(isNipId));

const unique = <T>(xs: readonly T[]): T[] => [...new Set(xs)];

/** Removes inline markdown (code ticks, emphasis, links, images, html) → plain text. */
export const stripInlineMarkdown = (text: string): string =>
  text
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]*)\]\[[^\]]*\]/g, "$1")
    // Real HTML tags only: placeholders like `<local-part>` or <event-id> are spec prose.
    .replace(/<\/?[a-zA-Z][a-zA-Z0-9]*(?:\s[^>]*)?\/?>/g, "")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(^|[^\w*])[*_]([^*_\s][^*_]*?)[*_](?=[^\w*]|$)/g, "$1$2")
    .replace(/~~(.*?)~~/g, "$1")
    .replace(/\s+/g, " ")
    .trim();

/** "- [NIP-01: Basic protocol](01.md)" and the struck-through "~~…~~ --- **unrecommended**: …". */
export const parseReadmeList = (readme: string): readonly ReadmeListEntry[] => {
  const list = sectionBody(readme, "List");
  return list
    .split("\n")
    .map((line) => /^- (~~)?\[NIP-([0-9A-F]{2}): (.+?)\]\(\2\.md\)(.*)$/.exec(line.trim()))
    .flatMap((m) => {
      if (m === null) return [];
      const [, struck, id = "", title = "", rest = ""] = m;
      const reasonMatch = /\*\*unrecommended\*\*:?\s*(.*?)(~~)?$/.exec(rest);
      const reasonRaw = reasonMatch?.[1] ?? "";
      const unrecommended: NipUnrecommended | undefined =
        struck !== undefined || reasonMatch !== null
          ? {
              reason: stripInlineMarkdown(reasonRaw).replace(/\s*~~$/, ""),
              replacedBy: linkedIds(reasonRaw).filter((x) => x !== id),
            }
          : undefined;
      return [
        {
          id,
          title: stripInlineMarkdown(title),
          ...(unrecommended === undefined ? {} : { unrecommended }),
        },
      ];
    });
};

/** Body of a `## Heading` section of the README (until the next level-2 heading). */
const sectionBody = (markdown: string, heading: string): string => {
  const start = markdown.search(new RegExp(`^## ${heading}\\s*$`, "im"));
  if (start < 0) return "";
  const rest = markdown.slice(start).split("\n").slice(1).join("\n");
  const end = rest.search(/^## /m);
  return end < 0 ? rest : rest.slice(0, end);
};

const tableRows = (markdown: string): readonly (readonly string[])[] =>
  markdown
    .split("\n")
    .filter((l) => l.trim().startsWith("|"))
    .map((l) =>
      l
        .trim()
        .replace(/^\||\|$/g, "")
        .split("|")
        .map((c) => c.trim()),
    )
    .filter((cells) => !cells.every((c) => /^:?-+:?$/.test(c)))
    .slice(1);

/** "`1630`-`1633`" → [1630, 1633]; "`39000-9`" → [39000, 39009]; "`0`" → [0]. */
export const parseKindCell = (cell: string): { kind: number; to?: number } | undefined => {
  const m = /^(\d+)(?:\s*-\s*(\d+))?$/.exec(cell.replace(/`/g, "").trim());
  if (m === null) return undefined;
  const kind = Number(m[1]);
  if (m[2] === undefined) return { kind };
  const tail = m[2];
  const head = String(kind);
  const to =
    tail.length < head.length
      ? Number(head.slice(0, head.length - tail.length) + tail)
      : Number(tail);
  return to > kind ? { kind, to } : { kind };
};

export const parseKindsTable = (readme: string): readonly KindRegistryRow[] =>
  tableRows(sectionBody(readme, "Event Kinds")).flatMap((cells) => {
    const [kindCell = "", description = "", nipCell = ""] = cells;
    const parsed = parseKindCell(kindCell);
    if (parsed === undefined) return [];
    const nips = linkedIds(nipCell);
    const external = nips.length === 0 && nipCell !== "" ? stripInlineMarkdown(nipCell) : undefined;
    return [
      {
        ...parsed,
        description: stripInlineMarkdown(description),
        nips,
        ...(external === undefined ? {} : { external: external.replace(/^\[|\]$/g, "") }),
      },
    ];
  });

/** Kinds-table cells that flag a single NIP as deprecated: "[96](96.md) (deprecated)". */
const deprecatedNipsInCell = (readme: string): ReadonlyMap<number, readonly NipId[]> =>
  new Map(
    tableRows(sectionBody(readme, "Event Kinds")).flatMap((cells) => {
      const parsed = parseKindCell(cells[0] ?? "");
      const cell = cells[2] ?? "";
      return parsed !== undefined && /\(deprecated\)/i.test(cell)
        ? [[parsed.kind, linkedIds(cell)] as const]
        : [];
    }),
  );

export const parseMessageTables = (readme: string): readonly MessageRegistryRow[] => {
  const body = sectionBody(readme, "Message types");
  const part = (heading: string, direction: MessageDirection): MessageRegistryRow[] => {
    const start = body.search(new RegExp(`^### ${heading}\\s*$`, "im"));
    if (start < 0) return [];
    const rest = body.slice(start).split("\n").slice(1).join("\n");
    const end = rest.search(/^### /m);
    return tableRows(end < 0 ? rest : rest.slice(0, end)).flatMap(
      ([type = "", desc = "", nip = ""]) =>
        type === ""
          ? []
          : [
              {
                type: type.replace(/`/g, ""),
                direction,
                description: stripInlineMarkdown(desc),
                nips: linkedIds(nip),
              },
            ],
    );
  };
  return [
    ...part("Client to Relay", "client-to-relay"),
    ...part("Relay to Client", "relay-to-client"),
  ];
};

export interface NipHeader {
  readonly title: string;
  readonly statusTags: readonly string[];
}

const STATUS_LINE = /^(?:`[a-z-]+`\s*)+$/;
const KNOWN_STATUS_TAGS = new Set([
  "draft",
  "final",
  "mandatory",
  "optional",
  "relay",
  "unrecommended",
]);

/**
 * Header shape: "NIP-01\n======\n\nTitle\n-----\n\n`draft` `optional` `relay`". Some NIPs put a
 * warning blockquote first, some have no status line or "**Status:** Draft" instead.
 */
export const parseNipHeader = (markdown: string): NipHeader => {
  const lines = markdown.split("\n").map((l) => l.trim());
  const nipLine = lines.findIndex((l) => /^NIP-[0-9A-F]{2}$/i.test(l));
  // nipLine is -1 without a "NIP-XX" line, so the search then starts at the first line.
  const titleIndex = lines.findIndex(
    (l, i) => i > nipLine && l !== "" && !/^=+$/.test(l) && !/^-+$/.test(l),
  );
  const title =
    titleIndex < 0 ? "" : stripInlineMarkdown(lines[titleIndex] ?? "").replace(/^#+\s*/, "");
  const window = lines.slice(Math.max(titleIndex, 0), Math.max(titleIndex, 0) + 8);
  const statusLine = window.find((l) => STATUS_LINE.test(l));
  const fromTicks =
    statusLine === undefined ? [] : [...statusLine.matchAll(/`([a-z-]+)`/g)].map((m) => m[1] ?? "");
  const boldStatus = window
    .map((l) => /^\*\*Status:\*\*\s*(\w+)/i.exec(l)?.[1]?.toLowerCase())
    .find((s) => s !== undefined);
  const statusTags = unique([
    ...fromTicks,
    ...(boldStatus === undefined ? [] : [boldStatus]),
  ]).filter((t) => KNOWN_STATUS_TAGS.has(t));
  return { title, statusTags };
};

/** GitHub's heading anchor algorithm (lower-case, drop punctuation, spaces → dashes). */
export const slugifyHeading = (heading: string): string =>
  stripInlineMarkdown(heading)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, "")
    .trim()
    .replace(/\s/g, "-");

const FENCE = /^(```|~~~)/;

/**
 * Splits the NIP into heading-delimited sections. The file header (NIP-XX / title / status) is
 * dropped; text before the first real heading becomes the "intro" section. Headings inside
 * code fences are ignored. Duplicate slugs get -1, -2… like GitHub.
 */
export const parseSections = (markdown: string): readonly NipSection[] => {
  const lines = markdown.split("\n");
  const body = dropHeader(lines);
  const sections: { heading: string; level: number; lines: string[] }[] = [
    { heading: "", level: 0, lines: [] },
  ];
  let inFence = false;
  for (let i = 0; i < body.length; i++) {
    const line = body[i] ?? "";
    if (FENCE.test(line.trim())) inFence = !inFence;
    const atx = inFence ? null : /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);
    const next = body[i + 1]?.trim() ?? "";
    // A setext underline needs ≥ 3 chars and a non-list text line above it.
    const setext =
      !inFence && /^(=+|-+)$/.test(next) && next.length >= 3 && !/^(\s*$|[-*|>])/.test(line);
    if (atx !== null)
      sections.push({ heading: atx[2] ?? "", level: (atx[1] ?? "#").length, lines: [] });
    else if (setext) {
      sections.push({ heading: line.trim(), level: next.startsWith("=") ? 1 : 2, lines: [] });
      i++;
    } else sections[sections.length - 1]?.lines.push(line);
  }
  const seen = new Map<string, number>();
  return sections
    .map((s) => ({ ...s, markdown: s.lines.join("\n").trim() }))
    .filter((s) => s.level > 0 || s.markdown !== "")
    .map((s) => {
      const base = s.level === 0 ? "intro" : slugifyHeading(s.heading) || "section";
      const n = seen.get(base) ?? 0;
      seen.set(base, n + 1);
      return {
        id: n === 0 ? base : `${base}-${n}`,
        heading: stripInlineMarkdown(s.heading),
        level: s.level,
        markdown: s.markdown,
      };
    });
};

/** The NIP markdown without its "NIP-XX / title / status" header block. */
export const stripNipHeader = (markdown: string): string =>
  dropHeader(markdown.split("\n")).join("\n");

/** Lines after the NIP-XX / title / status header (a warning blockquote above it is dropped too). */
const dropHeader = (lines: readonly string[]): readonly string[] => {
  const nipLine = lines.findIndex((l) => /^NIP-[0-9A-F]{2}\s*$/i.test(l.trim()));
  if (nipLine < 0) return lines;
  let i = nipLine + 1;
  const skip = (re: RegExp) => {
    while (i < lines.length && re.test((lines[i] ?? "").trim())) i++;
  };
  skip(/^=+$|^$/);
  // Title line + its underline, if setext.
  if (i < lines.length && /^-+$/.test((lines[i + 1] ?? "").trim())) i += 2;
  skip(/^$/);
  if (
    STATUS_LINE.test((lines[i] ?? "").trim()) ||
    /^\*\*Status:\*\*/i.test((lines[i] ?? "").trim())
  )
    i++;
  return lines.slice(i);
};

const proseParagraphs = (markdown: string): readonly string[] => {
  const out: string[] = [];
  let inFence = false;
  for (const block of markdown.split(/\n\s*\n/)) {
    const lines = block.split("\n");
    const fences = lines.filter((l) => FENCE.test(l.trim())).length;
    const wasInFence = inFence;
    if (fences % 2 === 1) inFence = !inFence;
    if (wasInFence || fences > 0) continue;
    const text = block.trim();
    if (
      text === "" ||
      /^(#|>|\||- |\* |\d+\. |<|`[a-z-]+`|\*\*Status)/.test(text) ||
      /^(=+|-+)$/.test(text)
    )
      continue;
    out.push(stripInlineMarkdown(text));
  }
  return out;
};

/** First prose paragraph of the NIP body, cut at a sentence boundary to ≤ max chars. */
export const extractSummary = (markdown: string, max = 320): string => {
  const sections = parseSections(markdown);
  const paragraphs = sections
    .filter((s) => !/^(changes|changelog)$/i.test(s.heading))
    .flatMap((s) => proseParagraphs(s.markdown));
  // Prefer a real sentence; "Moved to NIP-01." stubs only have a short one.
  const first = paragraphs.find((p) => p.length >= 30) ?? paragraphs[0];
  if (first === undefined) return "";
  if (first.length <= max) return first;
  const cut = first.slice(0, max);
  const sentence = cut.lastIndexOf(". ");
  return sentence > max / 3 ? cut.slice(0, sentence + 1) : `${cut.slice(0, cut.lastIndexOf(" "))}…`;
};

const MESSAGE_TYPES = new Set([
  "EVENT",
  "REQ",
  "CLOSE",
  "CLOSED",
  "EOSE",
  "OK",
  "NOTICE",
  "AUTH",
  "COUNT",
  "NEG-OPEN",
  "NEG-MSG",
  "NEG-CLOSE",
  "NEG-ERR",
]);
const TAG_NAME = /^(?:[A-Za-z0-9_-]{1,24})$/;

const codeBlocks = (markdown: string): readonly string[] =>
  [...markdown.matchAll(/^(```|~~~)[^\n]*\n([\s\S]*?)^\1\s*$/gm)].map((m) => m[2] ?? "");

/**
 * Tag names used in the NIP's examples: nested arrays in code blocks (`[["e", …], ["p", …]]`)
 * and inline code that starts with a tag (`["e", <id>]`). Message types are excluded.
 */
export const extractTags = (markdown: string): readonly string[] => {
  const fromBlocks = codeBlocks(markdown).flatMap((code) =>
    [...code.matchAll(/(?:\[|,)\s*\[\s*"([^"\n]*)"\s*[,\]]/g)].map((m) => m[1] ?? ""),
  );
  const fromInline = [...markdown.matchAll(/`\[\s*"([^"\n]*)"\s*[,\]]/g)].map((m) => m[1] ?? "");
  return unique([...fromBlocks, ...fromInline])
    .filter((t) => TAG_NAME.test(t) && !MESSAGE_TYPES.has(t))
    .sort((a, b) => a.localeCompare(b, "en"));
};

const VERB = /^[A-Z][A-Z0-9]*(?:-[A-Z0-9]+)*$/;

/**
 * First element of every top-level array in a code block: `["NEG-OPEN", <id>, …]` → "NEG-OPEN".
 * Nested arrays (tags such as `["HEAD", …]` inside "tags") are skipped by tracking bracket depth;
 * brackets inside strings do not count.
 */
const topLevelVerbs = (code: string): readonly string[] => {
  const verbs: string[] = [];
  let depth = 0;
  let inString = false;
  for (let i = 0; i < code.length; i++) {
    const ch = code[i];
    if (inString) {
      if (ch === "\\") i++;
      else if (ch === '"') inString = false;
    } else if (ch === '"') inString = true;
    else if (ch === "[") {
      const verb =
        depth === 0 ? /^\[\s*"([^"\n]{2,32})"\s*[,\]]/.exec(code.slice(i))?.[1] : undefined;
      if (verb !== undefined && VERB.test(verb)) verbs.push(verb);
      depth++;
    } else if (ch === "]") depth = Math.max(0, depth - 1);
  }
  return verbs;
};

/** "### Initial message (client to relay):" → directions; "(bidirectional)" → both. */
const directionsIn = (context: string): readonly MessageDirection[] => {
  if (/bidirectional|both directions/i.test(context)) return ["client-to-relay", "relay-to-client"];
  const c2r = /client[- ]to[- ]relay/i.test(context);
  const r2c = /relay[- ]to[- ]client/i.test(context);
  return [
    ...(c2r ? (["client-to-relay"] as const) : []),
    ...(r2c ? (["relay-to-client"] as const) : []),
  ];
};

/**
 * Wire messages a NIP defines only in its body (NIP-77's NEG-OPEN/NEG-MSG/…), which the README
 * "Message types" table does not list: top-level `["VERB", …]` arrays in code blocks whose
 * direction is stated by the heading above them. Verbs in `exclude` (the README registry, whose
 * rows are authoritative) are skipped, as are arrays with no stated direction — a guessed
 * direction would mislead more than a missing row.
 */
export const extractBodyMessages = (
  markdown: string,
  exclude: ReadonlySet<string> = new Set(),
): readonly NipMessageRef[] => {
  const refs = [...markdown.matchAll(/^(```|~~~)[^\n]*\n([\s\S]*?)^\1\s*$/gm)].flatMap((m) => {
    const before = markdown.slice(0, m.index);
    const headingAt = before.search(/^#{1,6} [^\n]*\n(?![\s\S]*^#{1,6} )/m);
    const heading =
      headingAt < 0 ? "" : (/^#{1,6} ([^\n]*)/.exec(before.slice(headingAt))?.[1] ?? "");
    const context = headingAt < 0 ? before.slice(-400) : before.slice(headingAt);
    const description = stripInlineMarkdown(heading.replace(/\s*\([^)]*\)\s*:?\s*$|:\s*$/, ""));
    return topLevelVerbs(m[2] ?? "")
      .filter((type) => !exclude.has(type))
      .flatMap((type) =>
        directionsIn(context).map((direction) => ({ type, direction, description })),
      );
  });
  // One ref per (type, direction); a later code block for the same message (an example) adds nothing.
  return refs.filter(
    (r, i) => refs.findIndex((x) => x.type === r.type && x.direction === r.direction) === i,
  );
};

/** Every `"kind": N` in code blocks, sorted and unique. */
export const extractExampleKinds = (markdown: string): readonly number[] =>
  unique(
    codeBlocks(markdown).flatMap((code) =>
      [...code.matchAll(/"kind"\s*:\s*(\d{1,6})\b/g)].map((m) => Number(m[1])),
    ),
  ).sort((a, b) => a - b);

/** NIPs referenced by link ("(19.md)", "(./19.md)") or by name ("NIP-19", "NIP 5A", "nip-01"). */
export const extractMentions = (
  markdown: string,
  self: NipId,
  known: ReadonlySet<NipId>,
): readonly NipId[] => {
  const named = [...markdown.matchAll(/\bNIP[- ]?([0-9A-F]{1,2})\b/gi)].map((m) => {
    const raw = (m[1] ?? "").toUpperCase();
    return raw.length === 1 ? `0${raw}` : raw;
  });
  return unique([...linkedIds(markdown), ...named])
    .filter((id) => id !== self && known.has(id))
    .sort();
};

const IDENT = /^[A-Za-z0-9_:./#?=&@+-]{2,40}$/;

/**
 * Identifier-like inline code outside code blocks (`supported_nips`, `nostrconnect://`,
 * `max_message_length`), unique in first-seen order. Keyword search indexes them so a developer
 * can paste a field name; prose-like or purely numeric spans are dropped to keep the index small.
 */
export const extractIdents = (markdown: string): readonly string[] =>
  unique(
    [...markdown.replace(/^(```|~~~)[^\n]*\n[\s\S]*?^\1\s*$/gm, "").matchAll(/`([^`\n]{2,40})`/g)]
      .map((m) => (m[1] ?? "").trim())
      .filter((x) => IDENT.test(x) && !/^[\d.:-]+$/.test(x)),
  );

const wordCount = (markdown: string): number =>
  markdown.split(/\s+/).filter((w) => w !== "").length;

export interface SnapshotInput {
  readonly source: NipCorpusSource;
  readonly readme: string;
  readonly files: readonly {
    readonly id: NipId;
    readonly markdown: string;
    readonly updatedAt: string | null;
  }[];
}

const statusOf = (
  statusTags: readonly string[],
  listed: boolean,
  unrecommended: NipUnrecommended | undefined,
  movedTo: NipId | undefined,
): NipStatus => {
  if (movedTo !== undefined || (!listed && unrecommended === undefined)) return "deprecated";
  if (unrecommended !== undefined || statusTags.includes("unrecommended")) return "unrecommended";
  return statusTags.includes("final") ? "final" : "draft";
};

/** "Moved to [NIP-01](01.md)." / "Renamed to … and moved to [NIP-01](01.md)." stubs. */
const movedTarget = (sections: readonly NipSection[]): NipId | undefined => {
  const body = sections
    .map((s) => s.markdown)
    .join("\n")
    .trim();
  if (body.length > 200) return undefined;
  const m = /moved to \[NIP-([0-9A-F]{2})\]/i.exec(body);
  return m?.[1];
};

/** Assembles the full corpus from the README + every NIP file. Pure and deterministic. */
export const buildCorpus = (input: SnapshotInput): NipCorpus => {
  const list = new Map(parseReadmeList(input.readme).map((e) => [e.id, e]));
  const kinds = parseKindsTable(input.readme);
  const deprecatedKinds = deprecatedNipsInCell(input.readme);
  const readmeMessages = parseMessageTables(input.readme);
  const files = [...input.files].sort((a, b) => a.id.localeCompare(b.id, "en"));
  // README rows first; then verbs only a NIP body defines, one row per (type, direction).
  const registered = new Set(readmeMessages.map((m) => m.type));
  const bodyRows = new Map<string, MessageRegistryRow>();
  for (const f of files)
    for (const ref of extractBodyMessages(f.markdown, registered)) {
      const key = `${ref.type} ${ref.direction}`;
      const row = bodyRows.get(key);
      bodyRows.set(key, { ...ref, nips: unique([...(row?.nips ?? []), f.id]) });
    }
  const messages = [...readmeMessages, ...bodyRows.values()];
  const known = new Set(files.map((f) => f.id));
  const mentionsOf = new Map(files.map((f) => [f.id, extractMentions(f.markdown, f.id, known)]));

  const nips = files.map((file): NipDocument => {
    const header = parseNipHeader(file.markdown);
    const entry = list.get(file.id);
    const sections = parseSections(file.markdown);
    const movedTo = movedTarget(sections);
    const unrecommended = entry?.unrecommended;
    const statusTags = header.statusTags;
    const maturity: NipMaturity | null = statusTags.includes("final")
      ? "final"
      : statusTags.includes("draft")
        ? "draft"
        : null;
    const requirement: NipRequirement | null = statusTags.includes("mandatory")
      ? "mandatory"
      : statusTags.includes("optional")
        ? "optional"
        : null;
    const nipKinds: NipKindRef[] = kinds
      .filter((k) => k.nips.includes(file.id))
      .map((k) => ({
        kind: k.kind,
        ...(k.to === undefined ? {} : { to: k.to }),
        description: k.description,
        ...(deprecatedKinds.get(k.kind)?.includes(file.id) === true ? { deprecated: true } : {}),
      }));
    const nipMessages: NipMessageRef[] = messages
      .filter((m) => m.nips.includes(file.id))
      .map(({ type, direction, description }) => ({ type, direction, description }));
    return {
      id: file.id,
      title: entry?.title ?? header.title,
      summary: extractSummary(file.markdown),
      status: statusOf(statusTags, entry !== undefined, unrecommended, movedTo),
      maturity,
      requirement,
      relay: statusTags.includes("relay"),
      statusTags,
      listed: entry !== undefined,
      ...(unrecommended === undefined ? {} : { unrecommended }),
      ...(movedTo === undefined ? {} : { movedTo }),
      kinds: nipKinds,
      exampleKinds: extractExampleKinds(file.markdown),
      messages: nipMessages,
      tags: extractTags(file.markdown),
      idents: extractIdents(file.markdown),
      mentions: mentionsOf.get(file.id) ?? [],
      mentionedBy: files
        .filter((f) => mentionsOf.get(f.id)?.includes(file.id) === true)
        .map((f) => f.id),
      headings: sections.filter((s) => s.level >= 1 && s.level <= 3).map((s) => s.heading),
      url: `${input.source.repo}/blob/${input.source.commit}/${file.id}.md`,
      updatedAt: file.updatedAt,
      wordCount: wordCount(file.markdown),
      markdown: file.markdown,
      sections,
    };
  });
  return { source: input.source, nips, kinds, messages };
};

/** Drops markdown and sections: the browser-safe index. */
export const toIndex = (corpus: NipCorpus): NipIndex => ({
  source: corpus.source,
  nips: corpus.nips.map(({ markdown: _m, sections: _s, ...meta }): NipMeta => meta),
  kinds: corpus.kinds,
  messages: corpus.messages,
});
