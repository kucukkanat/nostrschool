/**
 * Public types of @nostrschool/nip-search. Owner: embeddings agent (implementation); these
 * signatures are the contract the NIP list page codes against.
 */
import type { NipFilters, NipId, NipListing } from "@nostrschool/nips";
import type { Result } from "@nostrschool/protocol";
import type { ReadableAtom } from "nanostores";
import type { SearchLocale } from "./lexical.ts";

/** The sentence model; the SAME model embeds the corpus (scripts/embed-nips.ts) and queries. */
export const DEFAULT_MODEL_ID = "Xenova/all-MiniLM-L6-v2";

export interface SemanticConfig {
  /**
   * Base URL of the self-hosted model files: `assetHref("models/")`, holding
   * `<modelId>/{config.json,tokenizer.json,tokenizer_config.json,onnx/model_quantized.onnx}`.
   * Never a third-party host: transformers.js runs with `allowRemoteModels = false`.
   */
  readonly modelBaseUrl: string;
  /** Base URL of the self-hosted onnxruntime-web wasm files: `assetHref("models/ort/")`. */
  readonly wasmBaseUrl: string;
  /** Default DEFAULT_MODEL_ID. Must match the model the committed embeddings were built with. */
  readonly modelId?: string;
}

export interface NipSearchOptions {
  /** What to search (from `listNips()`, passed to the island as a prop). */
  readonly listings: readonly NipListing[];
  /**
   * The page locale ("en" default). A non-English locale also indexes that locale's NIP titles and
   * summaries (what the cards show) for keyword search; the model stays English.
   */
  readonly locale?: SearchLocale;
  /** Omit or `false` for lexical-only search (tests, no-JS fallbacks, reduced data). */
  readonly semantic?: SemanticConfig | false;
}

/**
 * Semantic side, observable so the UI can say what is happening:
 * idle → (first search or warmup) loading → ready; or unavailable (no WebAssembly, offline,
 * Save-Data) / error (model failed). Lexical search works in every state.
 */
export type SemanticStatus = "idle" | "loading" | "ready" | "unavailable" | "error";

export interface SemanticState {
  readonly status: SemanticStatus;
  /** 0–1 while loading, when the download size is known. */
  readonly progress?: number;
  /** Why it is unavailable / failed, for the UI copy and logs. */
  readonly reason?:
    | "offline"
    | "unsupported"
    | "save-data"
    | "disabled"
    | "model-failed"
    | "embeddings-failed";
}

export interface NipSearchQuery {
  readonly text: string;
  readonly filters?: NipFilters;
  /** Default: all matches. */
  readonly limit?: number;
}

/** The passage that matched best (semantic chunk or lexical field), for the result snippet. */
export interface SearchSnippet {
  readonly sectionId: string;
  readonly heading: string;
  readonly text: string;
}

export interface NipSearchHit {
  readonly id: NipId;
  /** Fused score; only meaningful for ordering within one result. */
  readonly score: number;
  /** 0-based ranks in each source, when the NIP appeared there. */
  readonly lexicalRank?: number;
  readonly semanticRank?: number;
  /** Cosine similarity of the best chunk, when semantic search ran. */
  readonly similarity?: number;
  /** Pinned by a query shortcut ("57", "kind:9735"). */
  readonly pinned: boolean;
  /** Query terms that matched lexically (for highlighting). */
  readonly terms: readonly string[];
  readonly snippet?: SearchSnippet;
}

export interface NipSearchResult {
  readonly query: NipSearchQuery;
  readonly hits: readonly NipSearchHit[];
  /** Which sources produced this result. */
  readonly mode: "lexical" | "hybrid";
}

export interface NipSearchError {
  readonly code: "aborted" | "semantic-unavailable" | "model-failed" | "embeddings-failed";
  readonly message: string;
}

export interface NipSearch {
  /** Instant, synchronous lexical search (fuzzy, prefix, field-boosted) + shortcuts + filters. */
  lexical(query: NipSearchQuery): NipSearchResult;
  /**
   * Hybrid search: lexical immediately merged with semantic when the model is ready (loads it
   * on first call). Never fails because of the model: when semantic is unavailable it resolves
   * `ok` with `mode: "lexical"`. `err` only for `aborted` (a newer keystroke won).
   */
  search(
    query: NipSearchQuery,
    options?: { readonly signal?: AbortSignal },
  ): Promise<Result<NipSearchResult, NipSearchError>>;
  /** Starts loading the model + embeddings (e.g. on search-box focus). Idempotent. */
  warmup(): Promise<Result<void, NipSearchError>>;
  readonly $semantic: ReadableAtom<SemanticState>;
  /** Releases the model worker / session. */
  dispose(): void;
}

// ── Committed embeddings (built by scripts/embed-nips.ts) ──────────────────────────────────────

/** One embedded passage: a NIP section (long sections split), plus the NIP's title+summary. */
export interface EmbeddingChunk {
  readonly id: string;
  readonly nip: NipId;
  readonly sectionId: string;
  readonly heading: string;
  /** Short plain-text excerpt for the result snippet (not the full embedded text). */
  readonly text: string;
}

/**
 * `src/data/embeddings.json` (metadata) + `src/data/embeddings.bin` (vectors: chunks.length ×
 * dims int8, row-major; vector_i ≈ int8_i × scales[i], L2-normalised before quantisation).
 */
export interface EmbeddingsManifest {
  readonly version: 1;
  readonly model: string;
  readonly dims: number;
  /** NIP corpus commit the chunks were cut from (must equal NIP_INDEX.source.commit). */
  readonly commit: string;
  /** SHA-256 of every embedded text (NUL-joined): detects edited summaries/hints, not just ids. */
  readonly textHash: string;
  readonly chunks: readonly EmbeddingChunk[];
  readonly scales: readonly number[];
}

export interface EmbeddingsIndex {
  readonly manifest: EmbeddingsManifest;
  readonly vectors: Int8Array;
}

export interface QuantizedVector {
  readonly data: Int8Array;
  readonly scale: number;
}

export interface ScoredChunk {
  readonly chunk: number;
  readonly similarity: number;
}
