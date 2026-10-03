/**
 * The NipSearch object: lexical search is synchronous; `search()` adds the semantic side when a
 * backend is available, and degrades to lexical (never fails) when it is not.
 */
import { type NipId, type NipListing, parseNipQuery } from "@nostrschool/nips";
import { err, ok, type Result } from "@nostrschool/protocol";
import { atom } from "nanostores";
import type { SemanticBackend } from "./backend.ts";
import { NIP_DEFINITIONS, type NipDefinitions } from "./definitions.ts";
import { createLexicalIndex, type SearchLocale } from "./lexical.ts";
import { aggregateByNip, DEFAULT_TUNING, type RankTuning, rankResults } from "./rank.ts";
import type {
  NipSearch,
  NipSearchError,
  NipSearchQuery,
  NipSearchResult,
  SemanticState,
} from "./types.ts";

/** Chunks fetched per query before grouping by NIP (≈ 10 per NIP for the top 20 NIPs). */
const CHUNK_DEPTH = 200;

export interface HybridSearchOptions {
  readonly listings: readonly NipListing[];
  /** Page locale for the lexical side (titles, summaries, hints, stop words). Default "en". */
  readonly locale?: SearchLocale;
  /** A backend, or the state to report when there is none (`unavailable` + reason). */
  readonly semantic: SemanticBackend | SemanticState;
  readonly tuning?: RankTuning;
  /** Which NIP defines which identifier. Default: the committed table (definitions.ts). */
  readonly definitions?: NipDefinitions;
  /**
   * Checked before each load attempt: returns an `unavailable` state when the model must not or
   * cannot load right now (offline, Save-Data). Not memoised, so a later search retries.
   */
  readonly availability?: () => SemanticState | undefined;
}

/**
 * The text the model embeds. "nostr"/"nip" are lexical stop words; for the model they are worse:
 * every passage is about nostr, so the word only drags the query toward NIP-21 ("nostr:" URIs)
 * and NIP-05 ("publish a website on nostr" ranked 21, 05, 15 before the NIP about websites).
 */
export const semanticQueryText = (text: string): string => {
  const stripped = text
    .replace(/\b(nostr|nip)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  return stripped === "" ? text : stripped;
};

const isBackend = (x: SemanticBackend | SemanticState): x is SemanticBackend => "query" in x;

const aborted = (): Result<never, NipSearchError> =>
  err({ code: "aborted", message: "a newer search replaced this one" });

export const createHybridSearch = (options: HybridSearchOptions): NipSearch => {
  const { listings } = options;
  const tuning = options.tuning ?? DEFAULT_TUNING;
  const definitions = options.definitions ?? NIP_DEFINITIONS;
  const knownIds: ReadonlySet<NipId> = new Set(listings.map((n) => n.id));
  // A bare "9735" pins its NIP only when a listing's kinds table registers it, so years and
  // other numbers stay plain text.
  const isKnownKind = (kind: number): boolean =>
    listings.some((n) =>
      n.kinds.some((k) => (k.to === undefined ? k.kind === kind : kind >= k.kind && kind <= k.to)),
    );
  const index = createLexicalIndex(listings, {
    locale: options.locale ?? "en",
    definitions,
  });
  const backend = isBackend(options.semantic) ? options.semantic : undefined;
  const $semantic = atom<SemanticState>(
    isBackend(options.semantic) ? { status: "idle" } : options.semantic,
  );

  const run = (query: NipSearchQuery) => {
    const parsed = parseNipQuery(query.text, knownIds, isKnownKind);
    const lexical = parsed.text === "" ? [] : index.search(parsed.text);
    return { parsed, lexical };
  };

  const lexical = (query: NipSearchQuery): NipSearchResult =>
    rankResults({ query, listings, tuning, definitions, ...run(query) });

  let warming: Promise<Result<void, NipSearchError>> | undefined;
  const warmup = (): Promise<Result<void, NipSearchError>> => {
    if (backend === undefined)
      return Promise.resolve(
        err({ code: "semantic-unavailable", message: $semantic.get().reason ?? "disabled" }),
      );
    const blocked = options.availability?.();
    if (warming === undefined && blocked !== undefined) {
      $semantic.set(blocked);
      return Promise.resolve(
        err({ code: "semantic-unavailable", message: blocked.reason ?? "unavailable" }),
      );
    }
    warming ??= (async () => {
      $semantic.set({ status: "loading" });
      const loaded = await backend.load((progress) =>
        $semantic.set({ status: "loading", progress }),
      );
      $semantic.set(
        loaded.ok
          ? { status: "ready" }
          : {
              status: "error",
              reason:
                loaded.error.code === "embeddings-failed" ? "embeddings-failed" : "model-failed",
            },
      );
      return loaded;
    })();
    return warming;
  };

  const search: NipSearch["search"] = async (query, opts = {}) => {
    const { parsed, lexical: lexicalMatches } = run(query);
    const lexicalOnly = () =>
      ok(rankResults({ query, listings, tuning, definitions, parsed, lexical: lexicalMatches }));
    // A function, not a narrowed property: the signal can flip during every await below.
    const isAborted = () => opts.signal?.aborted === true;
    if (isAborted()) return aborted();
    if (backend === undefined || parsed.text === "") return lexicalOnly();
    const ready = await warmup();
    if (isAborted()) return aborted();
    if (!ready.ok) return lexicalOnly();
    const chunks = await backend.query(semanticQueryText(parsed.text), CHUNK_DEPTH);
    if (isAborted()) return aborted();
    if (!chunks.ok) return lexicalOnly();
    return ok(
      rankResults({
        query,
        listings,
        tuning,
        definitions,
        parsed,
        lexical: lexicalMatches,
        semantic: aggregateByNip(chunks.value, tuning),
      }),
    );
  };

  return {
    lexical,
    search,
    warmup,
    $semantic,
    dispose: () => {
      backend?.dispose();
      warming = undefined;
    },
  };
};
