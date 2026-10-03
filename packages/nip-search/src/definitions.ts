/**
 * Which NIP DEFINES an identifier, as opposed to merely mentioning it. "supported_nips" appears
 * in seven NIPs, but only NIP-11 lays it out in its relay-information document; the others say
 * "add 40 to `supported_nips`". A pasted field name should land on the definition first.
 *
 * Pure extraction from spec markdown (build time, see build.ts) into a small committed table
 * (`data/definitions.json`, browser-safe), read by the lexical index and the ranking.
 */
import type { NipId } from "@nostrschool/nips";
import { fail, ok, type ProtocolError, type Result } from "@nostrschool/protocol";
import definitionsJson from "./data/definitions.json" with { type: "json" };

/** term → NIPs that define it with a strength, strongest first. */
export interface NipDefinitions {
  readonly version: 1;
  /** NIP corpus commit the table was extracted from (must equal NIP_INDEX.source.commit). */
  readonly commit: string;
  readonly terms: { readonly [term: string]: readonly (readonly [nip: NipId, strength: number])[] };
}

/**
 * How strongly a markdown construct says "this is where X is defined". A heading or a bold term
 * introduces a concept; a table row or a list item that starts with `x` is a field/tag
 * reference; a JSON key in an example shows a document's shape (weaker: examples repeat keys).
 */
export const DEFINITION_WEIGHTS = {
  heading: 3,
  table: 2,
  list: 2,
  bold: 2,
  boldContext: 1,
  json: 1,
} as const;

/**
 * Terms defined in more NIPs than this are generic ("content", "name") and can't point at one
 * NIP, so they are left out (keeps the table small; plain BM25 handles them).
 */
export const MAX_DEFINERS = 4;

/**
 * Where the markdown has no structural signal for the definition people mean. `lud06`/`lud16`
 * are the profile's lightning-address fields (LNURL LUD-06/16); NIP-57 is the NIP that tells
 * clients to read them to zap. NIP-47 also lists a `lud16` connection-URI parameter, which is
 * why structure alone would pick it.
 */
export const DEFINITION_OVERRIDES: { readonly [term: string]: NipId } = {
  lud06: "57",
  lud16: "57",
};
const OVERRIDE_STRENGTH = 100;
const MAX_REPEATS = 2;
const BASE_NIP: NipId = "01";

/** Lower-case identifier-like text: letters/digits joined by `_ . : / -` ("nostr.json"). */
const IDENTIFIER = /^[a-z0-9][a-z0-9_.:/-]*$/;
const MAX_TERM_LENGTH = 40;

const termOf = (raw: string): string | undefined => {
  const t = raw.trim().toLowerCase();
  return t.length <= MAX_TERM_LENGTH && IDENTIFIER.test(t) && /[a-z]/.test(t) ? t : undefined;
};

/** Defined term → strength for one NIP's markdown. */
export const extractDefinitions = (markdown: string): ReadonlyMap<string, number> => {
  const found: (readonly [string, keyof typeof DEFINITION_WEIGHTS])[] = [];
  const add = (raw: string | undefined, construct: keyof typeof DEFINITION_WEIGHTS) => {
    const t = raw === undefined ? undefined : termOf(raw);
    if (t !== undefined) found.push([t, construct]);
  };
  const blocks = markdown.match(/```[\s\S]*?```/g) ?? [];
  for (const block of blocks)
    for (const m of block.matchAll(/"([A-Za-z][\w.-]*)"\s*:/g)) add(m[1], "json");
  const prose = markdown.replace(/```[\s\S]*?```/g, "");
  for (const m of prose.matchAll(/^\s*[-*+]\s+(?:\*\*)?(?:the\s+)?`([^`]+)`/gim)) add(m[1], "list");
  for (const m of prose.matchAll(/^\|\s*`([^`]+)`/gm)) add(m[1], "table");
  for (const m of prose.matchAll(/^#+\s+(.*)$/gm)) {
    // Code spans plus identifiers inside longer text ("`/.well-known/nostr.json?name=…`"),
    // each term once per heading.
    const heading = m[1] ?? "";
    const code = [...heading.matchAll(/`([^`]+)`/g)].map((c) => c[1] ?? "");
    const idents = heading.match(/[\w-]+(?:[_.][\w-]+)+/g) ?? [];
    for (const t of new Set([...code, ...idents].map((x) => x.toLowerCase()))) add(t, "heading");
  }
  for (const sentence of prose.split(/\n|(?<=\.)\s+/)) {
    const bold = [...sentence.matchAll(/\*\*([A-Za-z][\w-]*)\*\*/g)];
    for (const m of bold) add(m[1], "bold");
    // "events are **addressable** by their `kind`, `pubkey` and `d` tag value": the code in a
    // sentence that bolds a new term is part of that definition.
    if (bold.length > 0) for (const m of sentence.matchAll(/`([^`]+)`/g)) add(m[1], "boldContext");
  }
  // Repetition adds a little, but a word bolded in every paragraph is emphasis, not twenty
  // definitions: each construct counts at most MAX_REPEATS times per term.
  const seen = new Map<string, number>();
  const strengths = new Map<string, number>();
  for (const [t, construct] of found) {
    const key = `${t}\0${construct}`;
    const n = (seen.get(key) ?? 0) + 1;
    seen.set(key, n);
    if (n <= MAX_REPEATS) strengths.set(t, (strengths.get(t) ?? 0) + DEFINITION_WEIGHTS[construct]);
  }
  return strengths;
};

export interface DefinitionSource {
  readonly id: NipId;
  readonly markdown: string;
  /** NIPs this one links to. */
  readonly mentions: readonly NipId[];
}

/**
 * The table for a whole corpus. A NIP that links to another NIP defining the same term is reusing
 * that definition (NIP-29 shows a NIP-11 document with `supported_nips`), so it is dropped,
 * unless the two link to each other. Overrides then take the top spot.
 */
export const buildDefinitionTable = (
  docs: readonly DefinitionSource[],
  commit: string,
  overrides: { readonly [term: string]: NipId } = DEFINITION_OVERRIDES,
): NipDefinitions => {
  const perNip = new Map(docs.map((d) => [d.id, extractDefinitions(d.markdown)]));
  // Every NIP builds on NIP-01 whether or not it links it, so `content`, `pubkey` or the `d` tag
  // in another NIP reuse NIP-01's definitions.
  const mentions = new Map(
    docs.map((d) => [d.id, new Set(d.id === BASE_NIP ? d.mentions : [BASE_NIP, ...d.mentions])]),
  );
  const byTerm = new Map<string, Map<NipId, number>>(
    Object.keys(overrides).map((term) => [term, new Map()]),
  );
  for (const [id, defs] of perNip)
    for (const [term, strength] of defs)
      byTerm.set(term, (byTerm.get(term) ?? new Map()).set(id, strength));
  const reuses = (a: NipId, b: NipId): boolean =>
    a !== b && (mentions.get(a)?.has(b) ?? false) && !(mentions.get(b)?.has(a) ?? false);
  const terms = new Map<string, (readonly [NipId, number])[]>();
  for (const [term, definers] of byTerm) {
    const ids = [...definers.keys()];
    const owned = new Map([...definers].filter(([id]) => !ids.some((other) => reuses(id, other))));
    const override = Object.hasOwn(overrides, term) ? overrides[term] : undefined;
    if (override !== undefined) owned.set(override, OVERRIDE_STRENGTH);
    if (owned.size > 0 && owned.size <= MAX_DEFINERS) terms.set(term, sortDefiners([...owned]));
  }
  return {
    version: 1,
    commit,
    terms: Object.fromEntries([...terms].sort(([a], [b]) => (a < b ? -1 : 1))),
  };
};

const sortDefiners = (xs: readonly (readonly [NipId, number])[]): (readonly [NipId, number])[] =>
  [...xs].sort(([a, sa], [b, sb]) => sb - sa || (a < b ? -1 : a > b ? 1 : 0));

const isDefiners = (x: unknown): x is readonly (readonly [NipId, number])[] =>
  Array.isArray(x) &&
  x.every(
    (d: unknown) =>
      Array.isArray(d) && d.length === 2 && typeof d[0] === "string" && typeof d[1] === "number",
  );

/** Validates a definitions table (the committed JSON is data from disk, so it is checked). */
export const parseDefinitions = (
  x: unknown,
): Result<NipDefinitions, ProtocolError<"invalid-definitions">> => {
  if (typeof x !== "object" || x === null) return fail("invalid-definitions", "not an object");
  const { version, commit, terms } = x as { [k: string]: unknown };
  if (version !== 1 || typeof commit !== "string" || typeof terms !== "object" || terms === null)
    return fail("invalid-definitions", "expected { version: 1, commit, terms }");
  const bad = Object.entries(terms).find(([, d]) => !isDefiners(d));
  return bad === undefined
    ? ok({ version, commit, terms: terms as NipDefinitions["terms"] })
    : fail("invalid-definitions", `terms["${bad[0]}"] must be [nip, strength] pairs`);
};

const committed = parseDefinitions(definitionsJson);
// The committed file is generated and tested; a broken one is a build bug, so fail loud.
if (!committed.ok) throw new Error(`data/definitions.json: ${committed.error.message}`);

/** The committed table (`bun run --cwd packages/nip-search definitions` rebuilds it). */
export const NIP_DEFINITIONS: NipDefinitions = committed.value;

/** NIP id → the terms it defines (for the lexical index). */
export const termsByNip = (defs: NipDefinitions): ReadonlyMap<NipId, readonly string[]> => {
  const out = new Map<NipId, string[]>();
  for (const [term, definers] of Object.entries(defs.terms))
    for (const [id] of definers) out.set(id, [...(out.get(id) ?? []), term]);
  return out;
};

/**
 * Query words that look like an identifier a person pasted rather than prose: snake_case or
 * dotted ("supported_nips", "nostr.json"), letters mixed with digits ("lud16"), or anything in
 * quotes or backticks (`"d"`, "`relays`"), which is how people write a field or tag name.
 * Surrounding punctuation is stripped. Unquoted plain words never count, so "relays" in a
 * sentence does not pin a NIP.
 */
export const identifierTerms = (text: string): readonly string[] =>
  text.split(/\s+/).flatMap((raw) => {
    const quoted = /^["'`].*[a-z0-9].*["'`][^a-z0-9]*$/i.test(raw);
    const w = raw.toLowerCase().replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, "");
    const shaped =
      /^[a-z0-9]+(?:[_.][a-z0-9]+)+$/.test(w) ||
      (/^[a-z0-9]+$/.test(w) && /[a-z]/.test(w) && /\d/.test(w));
    return w !== "" && (shaped || quoted) ? [w] : [];
  });

/**
 * The NIPs that define `term` most strongly (ties all count): the "first/most prominent"
 * definition, which a typed identifier pins above everything else.
 */
export const primaryDefiners = (defs: NipDefinitions, term: string): readonly NipId[] => {
  // hasOwn: a parsed JSON object inherits "constructor" & co.
  const definers = Object.hasOwn(defs.terms, term) ? (defs.terms[term] ?? []) : [];
  const best = definers[0]?.[1];
  return definers.filter(([, s]) => s === best).map(([id]) => id);
};
