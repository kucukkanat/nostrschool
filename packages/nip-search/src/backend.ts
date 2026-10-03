/**
 * The semantic side behind one small interface, so the same search logic runs with the model in
 * a browser Web Worker (worker-backend.ts) or in-process (Bun: embed script, quality tests, and
 * inside the worker itself).
 */
import { err, ok, type Result } from "@nostrschool/protocol";
import { createEmbedder, type Embed, type EmbedderConfig } from "./embedder.ts";
import type { SemanticChunkHit } from "./rank.ts";
import type { EmbeddingsIndex, NipSearchError } from "./types.ts";
import { cosineTopK } from "./vectors.ts";

export interface SemanticBackend {
  /** Loads model + vectors. Idempotent: concurrent and later calls share the first load. */
  load(onProgress?: (progress: number) => void): Promise<Result<void, NipSearchError>>;
  /** Top-k chunks for the text; loads first if needed. */
  query(text: string, k: number): Promise<Result<readonly SemanticChunkHit[], NipSearchError>>;
  dispose(): void;
}

export interface LocalBackendOptions {
  readonly embedder: EmbedderConfig;
  readonly loadIndex: () => Promise<EmbeddingsIndex>;
}

const message = (e: unknown): string => (e instanceof Error ? e.message : String(e));

export const createLocalBackend = (options: LocalBackendOptions): SemanticBackend => {
  let loading:
    | Promise<Result<{ embed: Embed; index: EmbeddingsIndex }, NipSearchError>>
    | undefined;
  const load = (onProgress?: (p: number) => void) => {
    loading ??= (async () => {
      const index = await options.loadIndex().then(
        (i) => ok(i),
        (e: unknown) => err<NipSearchError>({ code: "embeddings-failed", message: message(e) }),
      );
      if (!index.ok) return index;
      if (index.value.manifest.model !== (options.embedder.modelId ?? index.value.manifest.model))
        return err<NipSearchError>({
          code: "embeddings-failed",
          message: `embeddings were built with ${index.value.manifest.model}, not ${options.embedder.modelId}`,
        });
      return createEmbedder({
        ...options.embedder,
        modelId: index.value.manifest.model,
        ...(onProgress === undefined ? {} : { onProgress }),
      }).then(
        (embed) => ok({ embed, index: index.value }),
        (e: unknown) => err<NipSearchError>({ code: "model-failed", message: message(e) }),
      );
    })();
    return loading;
  };
  return {
    load: async (onProgress) => {
      const loaded = await load(onProgress);
      return loaded.ok ? ok(undefined) : loaded;
    },
    query: async (text, k) => {
      const loaded = await load();
      if (!loaded.ok) return loaded;
      const { embed, index } = loaded.value;
      // An inference failure must become a typed error: a rejected promise in the worker would
      // leave the page's query unanswered forever.
      const embedded = await embed([text]).then(
        ([v]) => (v === undefined ? err("the model returned no vector") : ok(v)),
        (e: unknown) => err(message(e)),
      );
      if (!embedded.ok) return err({ code: "model-failed", message: embedded.error });
      const vector = embedded.value;
      return ok(
        cosineTopK(vector, index, k).flatMap(({ chunk, similarity }) => {
          const meta = index.manifest.chunks[chunk];
          return meta === undefined ? [] : [{ chunk: meta, similarity }];
        }),
      );
    },
    dispose: () => {
      loading = undefined;
    },
  };
};
