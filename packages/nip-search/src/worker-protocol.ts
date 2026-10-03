/**
 * Messages between the page and the search worker, and the worker's message handler as a plain
 * function so it can be exercised in-process (tests) as well as inside a real Worker.
 */
import { createLocalBackend, type SemanticBackend } from "./backend.ts";
import type { SemanticChunkHit } from "./rank.ts";
import type { EmbeddingsManifest, NipSearchError } from "./types.ts";
import { decodeEmbeddings } from "./vectors.ts";

export interface WorkerLoadConfig {
  readonly modelBaseUrl: string;
  readonly wasmBaseUrl: string;
  readonly modelId?: string;
  /** Absolute URL of embeddings.bin (resolved by the page's bundler). */
  readonly embeddingsUrl: string;
}

export type ToWorker =
  | { readonly type: "load"; readonly config: WorkerLoadConfig }
  | { readonly type: "query"; readonly id: number; readonly text: string; readonly k: number };

export type FromWorker =
  | { readonly type: "progress"; readonly progress: number }
  | { readonly type: "loaded" }
  | { readonly type: "load-failed"; readonly error: NipSearchError }
  | { readonly type: "result"; readonly id: number; readonly hits: readonly SemanticChunkHit[] }
  | { readonly type: "query-failed"; readonly id: number; readonly error: NipSearchError };

const fetchBytes = async (url: string): Promise<ArrayBuffer> => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`GET ${url} → HTTP ${response.status}`);
  return response.arrayBuffer();
};

/**
 * Handles one message; `post` sends replies. The manifest is passed in (the worker bundles it)
 * while the vectors are fetched, keeping the binary out of the JS bundle.
 */
export const createWorkerHandler = (
  manifest: EmbeddingsManifest,
  post: (message: FromWorker) => void,
): ((message: ToWorker) => Promise<void>) => {
  let backend: SemanticBackend | undefined;
  return async (message) => {
    if (message.type === "load") {
      const { config } = message;
      backend ??= createLocalBackend({
        embedder: {
          localModelPath: config.modelBaseUrl,
          wasmBaseUrl: config.wasmBaseUrl,
          ...(config.modelId === undefined ? {} : { modelId: config.modelId }),
        },
        loadIndex: async () => decodeEmbeddings(manifest, await fetchBytes(config.embeddingsUrl)),
      });
      const loaded = await backend.load((progress) => post({ type: "progress", progress }));
      post(loaded.ok ? { type: "loaded" } : { type: "load-failed", error: loaded.error });
      return;
    }
    if (backend === undefined) {
      post({
        type: "query-failed",
        id: message.id,
        error: { code: "semantic-unavailable", message: "query before load" },
      });
      return;
    }
    const result = await backend.query(message.text, message.k);
    post(
      result.ok
        ? { type: "result", id: message.id, hits: result.value }
        : { type: "query-failed", id: message.id, error: result.error },
    );
  };
};
