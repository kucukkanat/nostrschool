/**
 * The worker protocol over a REAL MessageChannel (handler on one port, backend on the other),
 * plus a real Bun Worker running worker.ts. Workers that loaded onnxruntime-node are never
 * terminated here: Bun 1.3 aborts the process when such a worker is terminated (a Bun NAPI bug,
 * not ours), so dispose() is exercised over the MessageChannel instead.
 */
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import {
  EMBEDDINGS_BIN_URL,
  MODELS_DIR,
  ORT_DIR,
  readManifest,
  withoutDom,
} from "./test-support.ts";
import { createWorkerBackend, type WorkerLike } from "./worker-backend.ts";
import { createWorkerHandler, type FromWorker, type ToWorker } from "./worker-protocol.ts";

const dom = withoutDom();
beforeAll(dom.before);
afterAll(dom.after);

const CONFIG = {
  modelBaseUrl: MODELS_DIR,
  wasmBaseUrl: ORT_DIR,
  embeddingsUrl: EMBEDDINGS_BIN_URL,
};
const MODEL_TIMEOUT = 60_000;

/** A WorkerLike whose other end runs the real handler in this thread. */
const channelWorker = async (): Promise<WorkerLike & { readonly closed: () => boolean }> => {
  const { port1, port2 } = new MessageChannel();
  const handle = createWorkerHandler(await readManifest(), (m: FromWorker) => port2.postMessage(m));
  port2.onmessage = (e: MessageEvent<ToWorker>) => {
    void handle(e.data);
  };
  let closed = false;
  const worker: WorkerLike & { readonly closed: () => boolean } = {
    postMessage: (m) => port1.postMessage(m),
    onmessage: null,
    // A MessagePort has no script that could fail to load, so onerror never fires here.
    onerror: null,
    terminate: () => {
      closed = true;
      port1.close();
      port2.close();
    },
    closed: () => closed,
  };
  port1.onmessage = (e: MessageEvent<FromWorker>) => worker.onmessage?.(e);
  return worker;
};

describe("createWorkerHandler", () => {
  test(
    "query before load fails; load reports progress then loaded",
    async () => {
      const out: FromWorker[] = [];
      const handle = createWorkerHandler(await readManifest(), (m) => out.push(m));
      await handle({ type: "query", id: 1, text: "zaps", k: 3 });
      expect(out.shift()).toMatchObject({
        type: "query-failed",
        id: 1,
        error: { code: "semantic-unavailable" },
      });
      await handle({ type: "load", config: { ...CONFIG, modelId: "Xenova/all-MiniLM-L6-v2" } });
      expect(out.at(-1)).toEqual({ type: "loaded" });
      await handle({ type: "query", id: 2, text: "lightning tips", k: 3 });
      const result = out.at(-1);
      expect(result?.type === "result" && result.hits.length).toBe(3);
    },
    MODEL_TIMEOUT,
  );

  test("a missing embeddings file → load-failed; later queries fail too", async () => {
    const out: FromWorker[] = [];
    const handle = createWorkerHandler(await readManifest(), (m) => out.push(m));
    await handle({
      type: "load",
      config: { ...CONFIG, embeddingsUrl: `${EMBEDDINGS_BIN_URL}.missing` },
    });
    expect(out.at(-1)).toMatchObject({ type: "load-failed", error: { code: "embeddings-failed" } });
    await handle({ type: "query", id: 3, text: "zaps", k: 1 });
    expect(out.at(-1)).toMatchObject({ type: "query-failed", id: 3 });
  });
});

describe("createWorkerBackend over a MessageChannel", () => {
  test(
    "load + concurrent queries correlate by id; dispose settles and terminates",
    async () => {
      const worker = await channelWorker();
      let spawned = 0;
      const backend = createWorkerBackend(CONFIG, () => {
        spawned++;
        return worker;
      });
      const progress: number[] = [];
      expect(await backend.load((p) => progress.push(p))).toEqual({ ok: true, value: undefined });
      const [a, b] = await Promise.all([
        backend.query("emoji reaction", 2),
        backend.query("zap receipt", 2),
      ]);
      expect(a.ok && a.value[0]?.chunk.nip).toBe("25");
      expect(b.ok && b.value[0]?.chunk.nip).toBe("57");
      expect(spawned).toBe(1);
      // One query already posted to the worker, one still waiting for the (resolved) load.
      const posted = backend.query("posted before dispose", 1);
      await Bun.sleep(0);
      const waiting = backend.query("never posted", 1);
      backend.dispose();
      expect(await posted).toMatchObject({ ok: false, error: { code: "aborted" } });
      expect(await waiting).toMatchObject({ ok: false, error: { code: "aborted" } });
      expect(worker.closed()).toBe(true);
    },
    MODEL_TIMEOUT,
  );

  test("a failing load fails queries too", async () => {
    const worker = await channelWorker();
    const backend = createWorkerBackend(
      { ...CONFIG, embeddingsUrl: "file:///nope.bin" },
      () => worker,
    );
    const r = await backend.query("zaps", 1);
    expect(r).toMatchObject({ ok: false, error: { code: "embeddings-failed" } });
  });
});

describe("real Bun Worker", () => {
  test(
    "worker.ts answers queries",
    async () => {
      const backend = createWorkerBackend(
        CONFIG,
        () =>
          new Worker(new URL("./worker.ts", import.meta.url), {
            type: "module",
          }),
      );
      const r = await backend.query("verify my domain name", 3);
      expect(r.ok && r.value.map((h) => h.chunk.nip)).toContain("05");
    },
    MODEL_TIMEOUT,
  );

  test("a worker script that cannot load → model-failed (no hang)", async () => {
    const backend = createWorkerBackend(
      CONFIG,
      () =>
        new Worker(new URL("./does-not-exist.ts", import.meta.url), {
          type: "module",
        }),
    );
    expect(await backend.load()).toMatchObject({ ok: false, error: { code: "model-failed" } });
    backend.dispose();
  });
});
