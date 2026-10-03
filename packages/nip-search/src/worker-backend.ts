/**
 * Page side of the search worker: a SemanticBackend whose calls are messages. The worker is only
 * created on the first `load()`, so merely rendering the search box downloads nothing.
 */
import { err, ok, type Result } from "@nostrschool/protocol";
import type { SemanticBackend } from "./backend.ts";
import type { SemanticChunkHit } from "./rank.ts";
import type { NipSearchError } from "./types.ts";
import type { FromWorker, ToWorker, WorkerLoadConfig } from "./worker-protocol.ts";

/** The subset of the DOM Worker we use (Bun's Worker satisfies it too, for tests). */
export interface WorkerLike {
  postMessage(message: ToWorker): void;
  onmessage: ((event: MessageEvent<FromWorker>) => void) | null;
  onerror: ((event: ErrorEvent) => void) | null;
  terminate(): void;
}

type QueryResult = Result<readonly SemanticChunkHit[], NipSearchError>;

export const createWorkerBackend = (
  config: WorkerLoadConfig,
  spawn: () => WorkerLike,
): SemanticBackend => {
  let worker: WorkerLike | undefined;
  let loading: Promise<Result<void, NipSearchError>> | undefined;
  const progressListeners = new Set<(p: number) => void>();
  const pending = new Map<number, (r: QueryResult) => void>();
  let nextId = 0;

  const start = (): Promise<Result<void, NipSearchError>> =>
    new Promise((resolve) => {
      const w = spawn();
      worker = w;
      const fail = (error: NipSearchError) => {
        resolve(err(error));
        for (const settle of pending.values()) settle(err(error));
        pending.clear();
      };
      w.onmessage = ({ data }) => {
        if (data.type === "progress") for (const l of progressListeners) l(data.progress);
        else if (data.type === "loaded") resolve(ok(undefined));
        else if (data.type === "load-failed") fail(data.error);
        else {
          pending.get(data.id)?.(data.type === "result" ? ok(data.hits) : err(data.error));
          pending.delete(data.id);
        }
      };
      // A worker script that fails to load or throws at top level never answers.
      w.onerror = (event) =>
        fail({ code: "model-failed", message: event.message || "search worker crashed" });
      w.postMessage({ type: "load", config });
    });

  const load: SemanticBackend["load"] = (onProgress) => {
    if (onProgress !== undefined) progressListeners.add(onProgress);
    loading ??= start();
    return loading;
  };

  return {
    load,
    query: async (text, k) => {
      const loaded = await load();
      if (!loaded.ok) return loaded;
      const w = worker;
      // dispose() ran while this query waited for the load.
      if (w === undefined) return err({ code: "aborted", message: "search disposed" });
      const id = nextId++;
      return new Promise<QueryResult>((resolve) => {
        pending.set(id, resolve);
        w.postMessage({ type: "query", id, text, k });
      });
    },
    dispose: () => {
      worker?.terminate();
      worker = undefined;
      loading = undefined;
      for (const settle of pending.values())
        settle(err({ code: "aborted", message: "search disposed" }));
      pending.clear();
      progressListeners.clear();
    },
  };
};
