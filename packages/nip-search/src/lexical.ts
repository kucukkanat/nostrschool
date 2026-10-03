/**
 * Instant keyword search over NIP metadata with MiniSearch: fuzzy (typos) and prefix (as you
 * type) matching, field boosts so a title hit beats a passing mention, and stop words dropped so
 * natural-language queries ("how do I delete my note") rank on the words that matter.
 *
 * Locale-aware: the cards on /es/nips show our Spanish title and summary, so a Spanish index also
 * holds those (plus Spanish-only hints and stop words) — a visitor must find the title they see.
 */
import { getNipStrings, type NipId, type NipListing } from "@nostrschool/nips";
import MiniSearch, { type SearchResult } from "minisearch";
import { searchHints, searchHintsFor } from "./aliases.ts";
import {
  identifierTerms,
  NIP_DEFINITIONS,
  type NipDefinitions,
  termsByNip,
} from "./definitions.ts";

/** A site locale ("en", "es"), as `getNipStrings` takes it. */
export type SearchLocale = Parameters<typeof getNipStrings>[0];

interface LexicalDoc {
  readonly id: NipId;
  readonly nip: string;
  readonly title: string;
  readonly localTitle: string;
  readonly hints: string;
  readonly localHints: string;
  readonly summary: string;
  readonly localSummary: string;
  readonly headings: string;
  readonly kinds: string;
  readonly tags: string;
  readonly messages: string;
  readonly idents: string;
}

const FIELDS = [
  "nip",
  "title",
  "localTitle",
  "hints",
  "localHints",
  "summary",
  "localSummary",
  "headings",
  "kinds",
  "tags",
  "messages",
  "idents",
] as const;

const BOOST: { readonly [F in (typeof FIELDS)[number]]?: number } = {
  nip: 3,
  title: 4,
  localTitle: 4,
  hints: 3,
  // Few, curated, title-like phrasings in a short field (BM25 favours it over the long hints).
  localHints: 4,
  summary: 1.5,
  localSummary: 1.5,
  kinds: 1.5,
  // Inline code from the spec (`nprofile`, `supported_nips`): precise, but many per NIP.
  idents: 0.7,
};

/**
 * Weight of a match on a term the NIP DEFINES (definitions.ts), so the definition outranks NIPs
 * that only mention it. A separate exact-match index: prefix matching there would let "block"
 * hit NIP-86's `blockip` with a definition's weight.
 */
const DEFINES_WEIGHT = 1;

const words = (s: string): ReadonlySet<string> => new Set(s.split(" "));

/** Common English function words plus "nip"/"nostr", which every NIP matches. */
export const STOP_WORDS: ReadonlySet<string> = words(
  "a an and are as at be by can do does for from has have how i in into is it its me my of on " +
    "or our so that the their them then there these this to us was we what when where which who " +
    "why will with you your want wants way make nostr nip",
);

/** Spanish function words (accents folded, as `processTerm` folds them). */
export const STOP_WORDS_ES: ReadonlySet<string> = words(
  "de del la el los las un una unos unas mi mis tu tus con por para que como en y o u al se su " +
    "sus lo le les es son quiero quieres puedo hacer",
);

const stopWordsFor = (locale: SearchLocale): ReadonlySet<string> =>
  locale === "en" ? STOP_WORDS : new Set([...STOP_WORDS, ...STOP_WORDS_ES]);

/** Lower-case and strip accents, so "relé"/"rele" and "cómo"/"como" are the same term. */
const fold = (term: string): string =>
  term
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Mn}/gu, "");

const termProcessor =
  (stop: ReadonlySet<string>) =>
  (term: string): string | null => {
    const t = fold(term);
    return t === "" || stop.has(t) ? null : t;
  };

/**
 * A word that carries no meaning in either site language ("with", "the", "de", "la", "cómo"):
 * accents, case and surrounding punctuation ignored. For UI highlighting, which must not mark
 * words the search itself ignores, whatever the page locale.
 */
export const isStopWord = (word: string): boolean => {
  const t = fold(word).replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");
  return STOP_WORDS.has(t) || STOP_WORDS_ES.has(t);
};

/** The English term processor (kept for callers that tokenise like the index does). */
export const processTerm = termProcessor(STOP_WORDS);

/**
 * MiniSearch's default word split plus whole snake_case identifiers: "max_message_length" also
 * matches as one term (on top of its parts, boosted below), so a pasted field name finds the NIP
 * that defines it rather than every NIP about "messages".
 */
export const tokenize = (text: string): string[] => [
  ...text.split(/[\n\r\p{Z}\p{P}]+/u).filter((t) => t !== ""),
  ...(text.match(/[\p{L}\p{N}]+(?:_[\p{L}\p{N}]+)+/gu) ?? []),
];

/** Whitespace-separated words without surrounding punctuation: `"supported_nips",` → supported_nips. */
export const wholeTerms = (text: string): string[] =>
  text
    .split(/\s+/)
    .map((w) => w.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, ""))
    .filter((w) => w !== "");

/** In a query, a whole identifier counts triple and its parts ("message") a third. */
export const identifierBoost = (term: string, _i: number, terms: readonly string[]): number =>
  term.includes("_")
    ? 3
    : terms.some((t) => t.includes("_") && t.split("_").includes(term))
      ? 1 / 3
      : 1;

export const toLexicalDoc = (n: NipListing, locale: SearchLocale = "en"): LexicalDoc => {
  const local = locale === "en" ? undefined : getNipStrings(locale, n.id);
  return {
    id: n.id,
    nip: `${n.id} nip-${n.id} nip${n.id}`,
    title: n.title,
    localTitle: local?.title ?? "",
    hints: searchHints(n.id).join(" · "),
    localHints: searchHintsFor(locale, n.id).join(" · "),
    summary: n.summary,
    localSummary: local?.summary ?? "",
    headings: n.headings.join(" · "),
    kinds: n.kinds
      .map((k) => `${k.kind}${k.to === undefined ? "" : ` ${k.to}`} ${k.description}`)
      .concat(n.exampleKinds.map(String))
      .join(" · "),
    tags: n.tags.join(" "),
    messages: n.messages.map((m) => `${m.type} ${m.description}`).join(" · "),
    idents: n.idents.join(" "),
  };
};

export interface LexicalMatch {
  readonly id: NipId;
  readonly score: number;
  /** Indexed terms that matched (for highlighting; lower-case, accents folded). */
  readonly terms: readonly string[];
  /** Field → matched terms, to pick a snippet. */
  readonly fields: { readonly [field: string]: readonly string[] };
}

export interface LexicalIndex {
  search(text: string): readonly LexicalMatch[];
}

export interface LexicalOptions {
  /** Locale of the page: adds its titles, summaries, hints and stop words. Default "en". */
  readonly locale?: SearchLocale;
  /** Which NIP defines which term. Default: the committed table. */
  readonly definitions?: NipDefinitions;
}

const toMatch = (r: SearchResult): LexicalMatch => {
  const fields: { [field: string]: string[] } = {};
  for (const [term, inFields] of Object.entries(r.match))
    for (const f of inFields) fields[f] = [...(fields[f] ?? []), term];
  return { id: String(r.id), score: r.score, terms: r.terms, fields };
};

export const createLexicalIndex = (
  listings: readonly NipListing[],
  options: LexicalOptions = {},
): LexicalIndex => {
  const locale = options.locale ?? "en";
  const processTerm = termProcessor(stopWordsFor(locale));
  const mini = new MiniSearch<LexicalDoc>({
    fields: [...FIELDS],
    processTerm,
    tokenize,
    searchOptions: {
      tokenize,
      boost: BOOST,
      boostTerm: identifierBoost,
      // Typos only on longer words: fuzzy "zap" would also match "map", "cap"…
      fuzzy: (term) => (term.length > 4 ? 0.2 : false),
      prefix: (term) => term.length > 2,
      combineWith: "OR",
    },
  });
  mini.addAll(listings.map((n) => toLexicalDoc(n, locale)));
  const defined = termsByNip(options.definitions ?? NIP_DEFINITIONS);
  const definitions = new MiniSearch<{ readonly id: NipId; readonly defines: string }>({
    fields: ["defines"],
    processTerm,
    // Whole identifiers only, on both sides: "block" must not match `block_hash`.
    tokenize: wholeTerms,
    searchOptions: { tokenize: wholeTerms, combineWith: "OR" },
  });
  definitions.addAll(
    listings.map((n) => ({ id: n.id, defines: (defined.get(n.id) ?? []).join(" ") })),
  );
  return {
    search: (text) => {
      const keyword = mini.search(text).map(toMatch);
      // Only words typed as identifiers ("supported_nips", `"d"`): a plain "relay" bolded in
      // some NIP's prose is emphasis, not the definition a reader is after.
      const idents = identifierTerms(text);
      const defined = idents.length === 0 ? [] : definitions.search(idents.join(" ")).map(toMatch);
      // BM25 sums over many fields dwarf one short field, so a definition is scaled to the best
      // keyword score: the best-defined NIP gains DEFINES_WEIGHT × the top keyword hit.
      const scale = (keyword[0]?.score ?? 1) / (defined[0]?.score ?? 1);
      const byId = new Map(keyword.map((m) => [m.id, m]));
      for (const d of defined) {
        const m = byId.get(d.id);
        byId.set(d.id, {
          id: d.id,
          score: (m?.score ?? 0) + DEFINES_WEIGHT * scale * d.score,
          terms: [...new Set([...(m?.terms ?? []), ...d.terms])],
          fields: { ...m?.fields, ...d.fields },
        });
      }
      return [...byId.values()].sort((a, b) => b.score - a.score);
    },
  };
};
