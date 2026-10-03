/**
 * Web Worker entry: model inference and the cosine scan stay off the main thread so typing
 * never stutters. Created by worker-backend.ts with `new Worker(new URL("./worker.ts", …))`.
 */
import manifestJson from "./data/embeddings.json" with { type: "json" };
import type { EmbeddingsManifest } from "./types.ts";
import { createWorkerHandler, type FromWorker, type ToWorker } from "./worker-protocol.ts";

const scope = globalThis as unknown as {
  postMessage(message: FromWorker): void;
  onmessage: ((event: MessageEvent<ToWorker>) => void) | null;
};

const handle = createWorkerHandler(manifestJson as EmbeddingsManifest, (m) => scope.postMessage(m));
scope.onmessage = (event) => {
  void handle(event.data);
};
