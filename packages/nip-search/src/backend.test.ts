import { describe, expect, test } from "bun:test";
import { createLocalBackend } from "./backend.ts";
import { localBackend, MODELS_DIR, readIndex } from "./test-support.ts";

describe("createLocalBackend", () => {
  test("query loads on demand; load is shared; dispose allows a fresh load", async () => {
    const backend = localBackend();
    const [a, b] = await Promise.all([backend.load(), backend.load()]);
    expect(a).toEqual({ ok: true, value: undefined });
    expect(b).toEqual(a);
    const r = await backend.query("emoji reactions to a note", 5);
    expect(r.ok && r.value.length).toBe(5);
    expect(r.ok && r.value[0]?.chunk.nip).toBe("25");
    backend.dispose();
    expect((await backend.query("zaps", 1)).ok).toBe(true);
  }, 60_000);

  test("embeddings from another model are refused", async () => {
    const backend = createLocalBackend({
      embedder: { localModelPath: MODELS_DIR, modelId: "Xenova/other-model" },
      loadIndex: readIndex,
    });
    const r = await backend.query("zaps", 1);
    expect(r).toMatchObject({ ok: false, error: { code: "embeddings-failed" } });
    expect(!r.ok && r.error.message).toContain("Xenova/all-MiniLM-L6-v2");
  });
});
