/**
 * Shared by the tests: the REAL committed embeddings and self-hosted model (no mocks), loaded
 * from disk the way the embed script does.
 */
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { listNips } from "@nostrschool/nips/specs";
import { createLocalBackend, type SemanticBackend } from "./backend.ts";
import type { EmbeddingsIndex, EmbeddingsManifest } from "./types.ts";
import { decodeEmbeddings } from "./vectors.ts";

export const MODELS_DIR = join(import.meta.dir, "../../../apps/site/public/models/");
export const ORT_DIR = join(MODELS_DIR, "ort/");
export const DATA_DIR = join(import.meta.dir, "data");

export const EMBEDDINGS_BIN_URL = pathToFileURL(join(DATA_DIR, "embeddings.bin")).href;
export const LISTINGS = listNips();

export const readManifest = async (): Promise<EmbeddingsManifest> =>
  (await Bun.file(join(DATA_DIR, "embeddings.json")).json()) as EmbeddingsManifest;

export const readIndex = async (): Promise<EmbeddingsIndex> =>
  decodeEmbeddings(
    await readManifest(),
    await Bun.file(join(DATA_DIR, "embeddings.bin")).arrayBuffer(),
  );

export const localBackend = (): SemanticBackend =>
  createLocalBackend({
    embedder: { localModelPath: MODELS_DIR, wasmBaseUrl: ORT_DIR },
    loadIndex: readIndex,
  });

/**
 * The test preload installs happy-dom, whose `fetch` cannot read file: URLs. Files that fetch the
 * vectors swap in the runtime's own `fetch`, as the real worker has, and restore it after.
 * Swapping (not unregistering happy-dom) keeps the shared window alive: re-registering would hand
 * later test files a new `localStorage`/`document` that modules loaded earlier never see.
 */
export const withoutDom = (): {
  readonly before: () => void;
  readonly after: () => void;
} => {
  const domFetch = globalThis.fetch;
  return {
    before: () => {
      globalThis.fetch = Bun.fetch;
    },
    after: () => {
      globalThis.fetch = domFetch;
    },
  };
};

export const ids = (xs: readonly { readonly id: string }[]): readonly string[] =>
  xs.map((x) => x.id);
