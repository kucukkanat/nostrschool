/**
 * The sentence model, loaded through transformers.js from LOCAL files only — a filesystem path
 * in Bun (embed script, tests) or the self-hosted `public/models/` URL in the browser worker.
 * `allowRemoteModels = false` guarantees no request ever reaches huggingface.co or a CDN.
 */
import { DEFAULT_MODEL_ID } from "./types.ts";

export interface EmbedderConfig {
  /** Directory (Bun) or base URL (browser) holding `<modelId>/…`. */
  readonly localModelPath: string;
  /** Base URL of `ort-wasm-simd-threaded.{mjs,wasm}` (browser only; Bun uses onnxruntime-node). */
  readonly wasmBaseUrl?: string;
  readonly modelId?: string;
  /** 0–1 download progress of the model files. */
  readonly onProgress?: (progress: number) => void;
}

export type Embed = (texts: readonly string[]) => Promise<readonly Float32Array[]>;

/** The quantized ONNX file (`onnx/model_quantized.onnx`). */
export const MODEL_DTYPE = "q8";

const MIN_TRACKED_BYTES = 1_000_000;

interface ProgressInfo {
  readonly status: string;
  readonly file?: string;
  readonly loaded?: number;
  readonly total?: number;
}

const isProgressInfo = (x: unknown): x is ProgressInfo =>
  typeof x === "object" && x !== null && "status" in x;

/**
 * Folds per-file progress events into one non-decreasing 0–1 number. Files under 1 MB (config,
 * tokenizer) are ignored: they finish instantly and would flash "100%" before the 23 MB model
 * file even starts. Never decreasing, because a later file growing the total must not make the
 * bar jump backwards.
 */
export const progressTracker = (report: (progress: number) => void) => {
  const files = new Map<string, { loaded: number; total: number }>();
  let last = 0;
  return (info: unknown): void => {
    if (!isProgressInfo(info) || info.status !== "progress" || info.file === undefined) return;
    if ((info.total ?? 0) < MIN_TRACKED_BYTES) return;
    files.set(info.file, { loaded: info.loaded ?? 0, total: info.total ?? 0 });
    const sum = [...files.values()].reduce(
      (acc, f) => ({ loaded: acc.loaded + f.loaded, total: acc.total + f.total }),
      { loaded: 0, total: 0 },
    );
    const progress = Math.min(1, sum.loaded / sum.total);
    if (progress <= last) return;
    last = progress;
    report(progress);
  };
};

/**
 * transformers.js 4.3 skips its local-file lookup when `localModelPath` is an absolute http(s)
 * URL (it then reports the tokenizer missing and the first query throws), so a same-origin URL
 * is reduced to its root-relative path. Other values (paths, other origins) pass through.
 */
export const toLocalModelPath = (path: string, origin: string | undefined): string => {
  if (origin === undefined || !URL.canParse(path)) return path;
  const url = new URL(path);
  return url.origin === origin ? `${url.pathname}${url.search}` : path;
};

/** `base` + `file` with exactly one slash between: site href helpers may drop a trailing slash. */
export const joinUrl = (base: string, file: string): string =>
  `${base.endsWith("/") ? base : `${base}/`}${file}`;

/**
 * transformers.js 4.3 streams large files into the Cache API without catching its errors, so a
 * full or tiny storage quota (private windows, low-storage phones, parallel test contexts) fails
 * the whole load with "network error". Retry once straight from the network: the self-hosted
 * files still come from the site, just without the persistent copy.
 */
export const withoutCacheOnFailure = async <T>(
  env: { useBrowserCache: boolean },
  load: () => Promise<T>,
): Promise<T> => {
  try {
    return await load();
  } catch (error) {
    if (!env.useBrowserCache) throw error;
    env.useBrowserCache = false;
    return load();
  }
};

export const createEmbedder = async (config: EmbedderConfig): Promise<Embed> => {
  const { env, pipeline } = await import("@huggingface/transformers");
  env.allowRemoteModels = false;
  env.allowLocalModels = true;
  env.localModelPath = toLocalModelPath(config.localModelPath, globalThis.location?.origin);
  const wasm = env.backends.onnx.wasm;
  // Only onnxruntime-web reads wasmPaths; under onnxruntime-node (Bun) setting them would make
  // transformers.js try to pre-fetch the wasm for nothing.
  const usesWasmRuntime = env.backends.onnx.versions?.web !== undefined;
  if (config.wasmBaseUrl !== undefined && wasm !== undefined && usesWasmRuntime) {
    wasm.wasmPaths = {
      mjs: joinUrl(config.wasmBaseUrl, "ort-wasm-simd-threaded.mjs"),
      wasm: joinUrl(config.wasmBaseUrl, "ort-wasm-simd-threaded.wasm"),
    };
    // GitHub Pages cannot send COOP/COEP headers, so SharedArrayBuffer threads are unavailable.
    wasm.numThreads = 1;
  }
  const load = () =>
    pipeline("feature-extraction", config.modelId ?? DEFAULT_MODEL_ID, {
      dtype: MODEL_DTYPE,
      ...(config.onProgress === undefined
        ? {}
        : { progress_callback: progressTracker(config.onProgress) }),
    });
  const extractor = await withoutCacheOnFailure(env, load);
  return async (texts) => {
    if (texts.length === 0) return [];
    const output = await extractor([...texts], { pooling: "mean", normalize: true });
    const [rows = 0, dims = 0] = output.dims;
    const { data } = output;
    if (!(data instanceof Float32Array))
      throw new Error(`feature-extraction returned ${output.type}, expected float32`);
    return Array.from({ length: rows }, (_, i) => data.slice(i * dims, (i + 1) * dims));
  };
};
