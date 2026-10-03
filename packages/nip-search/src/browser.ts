/**
 * `createNipSearch` for the site: the semantic side runs in a Web Worker that loads the model
 * from the self-hosted `public/models/` files on first use (search or focus), never on page load.
 */
import type { SemanticBackend } from "./backend.ts";
import { createHybridSearch } from "./search.ts";
import type { NipSearch, NipSearchOptions, SemanticState } from "./types.ts";
import { createWorkerBackend } from "./worker-backend.ts";

export interface BrowserCapabilities {
  readonly worker: boolean;
  readonly wasm: boolean;
  readonly online: boolean;
  readonly saveData: boolean;
}

/** Why semantic search cannot run with these capabilities, or undefined when it can. */
export const semanticBlocker = (caps: BrowserCapabilities): SemanticState | undefined => {
  if (!caps.worker || !caps.wasm) return { status: "unavailable", reason: "unsupported" };
  if (caps.saveData) return { status: "unavailable", reason: "save-data" };
  if (!caps.online) return { status: "unavailable", reason: "offline" };
  return undefined;
};

export const detectCapabilities = (): BrowserCapabilities => {
  const nav: (Navigator & { connection?: { saveData?: boolean } }) | undefined =
    typeof navigator === "undefined" ? undefined : navigator;
  return {
    worker: typeof Worker !== "undefined",
    wasm: typeof WebAssembly !== "undefined",
    online: nav?.onLine ?? true,
    saveData: nav?.connection?.saveData === true,
  };
};

export const createNipSearch = (options: NipSearchOptions): NipSearch => {
  const { listings, semantic } = options;
  const base = { listings, locale: options.locale ?? "en" };
  if (semantic === undefined || semantic === false)
    return createHybridSearch({ ...base, semantic: { status: "unavailable", reason: "disabled" } });
  const unsupported = semanticBlocker({ ...detectCapabilities(), online: true, saveData: false });
  if (unsupported !== undefined) return createHybridSearch({ ...base, semantic: unsupported });
  const backend: SemanticBackend = createWorkerBackend(
    {
      modelBaseUrl: semantic.modelBaseUrl,
      wasmBaseUrl: semantic.wasmBaseUrl,
      ...(semantic.modelId === undefined ? {} : { modelId: semantic.modelId }),
      embeddingsUrl: new URL("./data/embeddings.bin", import.meta.url).href,
    },
    // Literal `new Worker(new URL(…, import.meta.url))` so Vite bundles the worker.
    () => new Worker(new URL("./worker.ts", import.meta.url), { type: "module" }),
  );
  return createHybridSearch({
    ...base,
    semantic: backend,
    availability: () => semanticBlocker(detectCapabilities()),
  });
};
