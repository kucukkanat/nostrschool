/**
 * Hybrid ranking, pure: chunk similarities → one score per NIP, lexical and semantic scores
 * fused, query shortcuts pinned on top, filters and limit applied.
 *
 * Why score fusion and not reciprocal rank fusion (`fuseRankings`): lexical OR-matching returns
 * long lists whose first place can be a single incidental word ("forget everything about me" →
 * some NIP mentioning "everything"), and RRF gives that rank 1 the same weight as a confident
 * one. Normalising each side to its best score keeps the confidence: on the quality sets
 * (quality.test.ts) RRF scored 39/40 + 26/30 top-3, this 40/40 + 28/30.
 */
import {
  compareNipIds,
  type FusedRank,
  filterNips,
  type NipId,
  type NipListing,
  nipCoversKind,
  type ParsedNipQuery,
} from "@nostrschool/nips";
import { slugifyHeading } from "@nostrschool/nips/corpus/parse.ts";
import {
  identifierTerms,
  NIP_DEFINITIONS,
  type NipDefinitions,
  primaryDefiners,
} from "./definitions.ts";
import type { LexicalMatch } from "./lexical.ts";
import type {
  EmbeddingChunk,
  NipSearchHit,
  NipSearchQuery,
  NipSearchResult,
  SearchSnippet,
} from "./types.ts";

export interface SemanticChunkHit {
  readonly chunk: EmbeddingChunk;
  readonly similarity: number;
}

export interface SemanticNipHit {
  readonly id: NipId;
  /** Best chunk similarity (what the UI may show). */
  readonly similarity: number;
  /** Ranking score: best chunk plus a little credit for further matching chunks. */
  readonly score: number;
  readonly snippet: SearchSnippet;
}

export interface RankTuning {
  /** NIPs whose best chunk is below this are noise for MiniLM and are dropped. */
  readonly minSimilarity: number;
  /** Credit for the 2nd-best chunk: a NIP about the topic matches in several places. */
  readonly secondChunkWeight: number;
  /** Semantic NIPs entering the fusion. */
  readonly semanticDepth: number;
  /** Fusion weights [lexical, semantic] (each side normalised to its best = 1). */
  readonly weights: readonly [number, number];
  /**
   * A NIP found by meaning alone (no keyword match) must be at least this similar. MiniLM gives
   * gibberish ("qwrtp") 0.25–0.36 against some passage, so without it nonsense never shows the
   * "no results" state, and Spanish queries (the model is English) drown keyword hits in noise.
   */
  readonly semanticOnlyMinSimilarity: number;
}

/** Tuned on the quality set in test/quality.test.ts (top-3 hit rate). */
export const DEFAULT_TUNING: RankTuning = {
  minSimilarity: 0.25,
  secondChunkWeight: 0.15,
  semanticDepth: 20,
  weights: [1, 2],
  semanticOnlyMinSimilarity: 0.4,
};

const toSnippet = (c: EmbeddingChunk): SearchSnippet => ({
  sectionId: c.sectionId,
  heading: c.heading,
  text: c.text,
});

/** Groups chunk hits by NIP, best first. Input order does not matter. */
export const aggregateByNip = (
  hits: readonly SemanticChunkHit[],
  tuning: RankTuning = DEFAULT_TUNING,
): readonly SemanticNipHit[] => {
  const byNip = new Map<NipId, SemanticChunkHit[]>();
  for (const hit of [...hits].sort((a, b) => b.similarity - a.similarity))
    byNip.set(hit.chunk.nip, [...(byNip.get(hit.chunk.nip) ?? []), hit]);
  return [...byNip.values()]
    .flatMap(([best, second]) =>
      best === undefined || best.similarity < tuning.minSimilarity
        ? []
        : [
            {
              id: best.chunk.nip,
              similarity: best.similarity,
              score: best.similarity + tuning.secondChunkWeight * (second?.similarity ?? 0),
              snippet: toSnippet(best.chunk),
            },
          ],
    )
    .sort((a, b) => b.score - a.score);
};

/**
 * Shortcut matches in query order: explicit NIP ids, then NIPs covering a `kind:N` (defining
 * NIPs before ones that only show the kind in an example), then NIPs using a `#tag`, then NIPs
 * defining a wire message typed in upper case ("CLOSED", "OK"). Only the exact upper-case form
 * pins, so "ok" in ordinary prose does not; it is needed because "message" in a query otherwise
 * ranks every NIP titled "… Messages" above NIP-01, which defines them. Last, an identifier
 * typed as such ("supported_nips", "nostr.json", "lud16") pins the NIP that defines it most
 * prominently (definitions.ts), so it beats the many NIPs that mention it in passing.
 */
export const pinnedIds = (
  parsed: ParsedNipQuery,
  listings: readonly NipListing[],
  definitions: NipDefinitions = NIP_DEFINITIONS,
): readonly NipId[] => {
  const byId = [...listings].sort((a, b) => compareNipIds(a.id, b.id));
  const defines = (n: NipListing, kind: number) =>
    n.kinds.some((k) => (k.to === undefined ? k.kind === kind : kind >= k.kind && kind <= k.to));
  const kindIds = parsed.kinds.flatMap((kind) => {
    const covering = byId.filter((n) => nipCoversKind(n, kind));
    return [
      ...covering.filter((n) => defines(n, kind)),
      ...covering.filter((n) => !defines(n, kind)),
    ].map((n) => n.id);
  });
  const tagIds = parsed.tags.flatMap((tag) =>
    byId.filter((n) => n.tags.includes(tag)).map((n) => n.id),
  );
  const messageTypes = new Set(parsed.text.split(/\s+/).filter((w) => /^[A-Z][A-Z-]+$/.test(w)));
  const messageIds =
    messageTypes.size === 0
      ? []
      : byId.filter((n) => n.messages.some((m) => messageTypes.has(m.type))).map((n) => n.id);
  const listed = new Set(listings.map((n) => n.id));
  const definerIds = identifierTerms(parsed.text)
    .flatMap((term) => primaryDefiners(definitions, term))
    .filter((id) => listed.has(id));
  return [...new Set([...parsed.ids, ...kindIds, ...tagIds, ...messageIds, ...definerIds])];
};

/** First heading of the NIP that contains a lexically matched term (lower-cased). */
const headingSnippet = (
  listing: NipListing | undefined,
  match: LexicalMatch | undefined,
): SearchSnippet | undefined => {
  const terms = match?.fields["headings"];
  if (listing === undefined || terms === undefined) return undefined;
  const heading = listing.headings.find((h) =>
    terms.some((t) => h.toLowerCase().includes(t.toLowerCase())),
  );
  // Heading-only matches carry no passage text; the UI shows the heading as the jump target.
  return heading === undefined
    ? undefined
    : { sectionId: slugifyHeading(heading), heading, text: "" };
};

/**
 * weight_lex × lexScore / bestLexScore + weight_sem × (score − floor) / (bestScore − floor):
 * each side's best hit counts 1, and semantic hits near the noise floor count ~0.
 * Inputs are best-first; ties keep lexical-first order.
 */
export const fuseScores = (
  lexical: readonly { readonly id: NipId; readonly score: number }[],
  semantic: readonly { readonly id: NipId; readonly score: number }[],
  tuning: RankTuning = DEFAULT_TUNING,
): readonly FusedRank[] => {
  const [lexWeight, semWeight] = tuning.weights;
  const topLex = Math.max(Number.EPSILON, lexical[0]?.score ?? 0);
  const floor = tuning.minSimilarity;
  const semRange = Math.max(Number.EPSILON, (semantic[0]?.score ?? 0) - floor);
  const scores = new Map<NipId, number>();
  for (const m of lexical) scores.set(m.id, (lexWeight * m.score) / topLex);
  for (const m of semantic)
    scores.set(m.id, (scores.get(m.id) ?? 0) + (semWeight * (m.score - floor)) / semRange);
  return [...scores].map(([id, score]) => ({ id, score })).sort((a, b) => b.score - a.score);
};

export interface RankInput {
  readonly query: NipSearchQuery;
  readonly parsed: ParsedNipQuery;
  readonly listings: readonly NipListing[];
  readonly lexical: readonly LexicalMatch[];
  /** Omitted for a lexical-only result. */
  readonly semantic?: readonly SemanticNipHit[];
  readonly tuning?: RankTuning;
  /** Default: the committed definitions table. */
  readonly definitions?: NipDefinitions;
}

export const rankResults = (input: RankInput): NipSearchResult => {
  const { query, parsed, listings } = input;
  const tuning = input.tuning ?? DEFAULT_TUNING;
  const mode = input.semantic === undefined ? "lexical" : "hybrid";
  const allowed = filterNips(listings, query.filters ?? {});
  const allowedIds = new Set(allowed.map((n) => n.id));
  const listingById = new Map(listings.map((n) => [n.id, n]));
  const pins = pinnedIds(parsed, allowed, input.definitions);
  const lexical = input.lexical.filter((m) => allowedIds.has(m.id));
  const semantic = (input.semantic ?? [])
    .filter((m) => allowedIds.has(m.id))
    .slice(0, tuning.semanticDepth);
  const lexicalById = new Map(lexical.map((m, rank) => [m.id, { m, rank }]));
  const semanticById = new Map(semantic.map((m, rank) => [m.id, { m, rank }]));
  const fused = fuseScores(lexical, semantic, tuning);
  const freeText = parsed.text.trim() !== "";

  const confident = (id: NipId): boolean =>
    lexicalById.has(id) ||
    (semanticById.get(id)?.m.similarity ?? 0) >= tuning.semanticOnlyMinSimilarity;
  const ordered: readonly { readonly id: NipId; readonly score: number }[] = freeText
    ? fused.filter((f) => confident(f.id))
    : pins.length > 0
      ? []
      : // Nothing typed: browse everything that passes the filters, in README order.
        [...allowed].sort((a, b) => compareNipIds(a.id, b.id)).map((n) => ({ id: n.id, score: 0 }));
  const top = ordered[0]?.score ?? 0;
  const pinSet = new Set(pins);
  const hits = [
    ...pins.map((id, i) => ({ id, score: top + pins.length - i, pinned: true })),
    ...ordered.filter((o) => !pinSet.has(o.id)).map((o) => ({ ...o, pinned: false })),
  ].map(({ id, score, pinned }): NipSearchHit => {
    const lex = lexicalById.get(id);
    const sem = semanticById.get(id);
    const snippet = sem?.m.snippet ?? headingSnippet(listingById.get(id), lex?.m);
    return {
      id,
      score,
      pinned,
      terms: lex?.m.terms ?? [],
      ...(lex === undefined ? {} : { lexicalRank: lex.rank }),
      ...(sem === undefined ? {} : { semanticRank: sem.rank, similarity: sem.m.similarity }),
      ...(snippet === undefined ? {} : { snippet }),
    };
  });
  return {
    query,
    hits: query.limit === undefined ? hits : hits.slice(0, Math.max(0, query.limit)),
    mode,
  };
};
