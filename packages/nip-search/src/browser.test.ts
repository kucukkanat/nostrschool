import { describe, expect, test } from "bun:test";
import { createNipSearch, detectCapabilities, semanticBlocker } from "./browser.ts";
import { LISTINGS, MODELS_DIR, ORT_DIR } from "./test-support.ts";

const ALL = { worker: true, wasm: true, online: true, saveData: false };

describe("semanticBlocker", () => {
  test("unsupported > save-data > offline > ok", () => {
    expect(semanticBlocker(ALL)).toBeUndefined();
    expect(semanticBlocker({ ...ALL, worker: false, saveData: true })?.reason).toBe("unsupported");
    expect(semanticBlocker({ ...ALL, wasm: false })?.reason).toBe("unsupported");
    expect(semanticBlocker({ ...ALL, saveData: true, online: false })?.reason).toBe("save-data");
    expect(semanticBlocker({ ...ALL, online: false })).toEqual({
      status: "unavailable",
      reason: "offline",
    });
  });

  test("detectCapabilities reads the runtime", () => {
    expect(detectCapabilities()).toEqual({
      worker: typeof Worker !== "undefined",
      wasm: true,
      online: navigator.onLine,
      saveData: false,
    });
  });
});

describe("createNipSearch", () => {
  test("semantic off → lexical with reason disabled", async () => {
    for (const semantic of [false, undefined] as const) {
      const search = createNipSearch(
        semantic === undefined ? { listings: LISTINGS } : { listings: LISTINGS, semantic },
      );
      expect(search.$semantic.get()).toEqual({ status: "unavailable", reason: "disabled" });
      expect(search.lexical({ text: "zaps" }).hits[0]?.id).toBe("57");
    }
    const es = createNipSearch({ listings: LISTINGS, locale: "es" });
    expect(es.lexical({ text: "encuestas" }).hits[0]?.id).toBe("88");
  });

  test("no Worker → unavailable/unsupported", () => {
    const original = globalThis.Worker;
    // Real removal of the global (restored below), not a mock: the same check a worker-less
    // browser hits.
    Reflect.deleteProperty(globalThis, "Worker");
    try {
      const search = createNipSearch({
        listings: LISTINGS,
        semantic: { modelBaseUrl: "/m/", wasmBaseUrl: "/o/" },
      });
      expect(search.$semantic.get()).toEqual({ status: "unavailable", reason: "unsupported" });
    } finally {
      globalThis.Worker = original;
    }
  });

  test("with a Worker: idle until the first search, then hybrid via worker.ts", async () => {
    const search = createNipSearch({
      listings: LISTINGS,
      semantic: {
        modelBaseUrl: MODELS_DIR,
        wasmBaseUrl: ORT_DIR,
        modelId: "Xenova/all-MiniLM-L6-v2",
      },
    });
    expect(search.$semantic.get()).toEqual({ status: "idle" });
    const r = await search.search({ text: "long-form blog posts" });
    expect(r.ok && r.value.mode).toBe("hybrid");
    expect(r.ok && r.value.hits[0]?.id).toBe("23");
    // No dispose(): see worker.test.ts (Bun aborts when terminating an onnxruntime worker).
  }, 60_000);
});
