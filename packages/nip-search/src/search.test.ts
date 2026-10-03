import { describe, expect, test } from "bun:test";
import { createLocalBackend } from "./backend.ts";
import { createHybridSearch, semanticQueryText } from "./search.ts";
import { LISTINGS, localBackend, MODELS_DIR, ORT_DIR, readIndex } from "./test-support.ts";
import type { SemanticState } from "./types.ts";

const MODEL_TIMEOUT = 60_000;

describe("semanticQueryText", () => {
  test("drops nostr/nip, which every passage is about; keeps a query made only of them", () => {
    expect(semanticQueryText("publish a website on Nostr")).toBe("publish a website on");
    expect(semanticQueryText("NIP for polls")).toBe("for polls");
    expect(semanticQueryText("nostr")).toBe("nostr");
    expect(semanticQueryText("nostrudel")).toBe("nostrudel");
  });
});

describe("lexical-only search", () => {
  const search = createHybridSearch({
    listings: LISTINGS,
    semantic: { status: "unavailable", reason: "disabled" },
  });

  test("a locale adds that locale's titles to keyword search", async () => {
    const es = createHybridSearch({
      listings: LISTINGS,
      locale: "es",
      semantic: { status: "unavailable", reason: "disabled" },
    });
    const r = await es.search({ text: "encuestas" });
    expect(r.ok && r.value.hits[0]?.id).toBe("88");
  });

  test("a bare registered kind number pins the NIP defining it; other numbers do not", () => {
    expect(search.lexical({ text: "9735" }).hits[0]).toMatchObject({ id: "57", pinned: true });
    expect(search.lexical({ text: "kind 9735" }).hits[0]).toMatchObject({ id: "57", pinned: true });
    expect(search.lexical({ text: "2024" }).hits.some((h) => h.pinned)).toBe(false);
  });

  test("an identifier pins the NIP defining it; an empty table turns that off", () => {
    expect(search.lexical({ text: "supported_nips" }).hits[0]).toMatchObject({
      id: "11",
      pinned: true,
    });
    const plain = createHybridSearch({
      listings: LISTINGS,
      semantic: { status: "unavailable", reason: "disabled" },
      definitions: { version: 1, commit: "", terms: {} },
    });
    expect(plain.lexical({ text: "supported_nips" }).hits.some((h) => h.pinned)).toBe(false);
  });

  test("reports the given state; search resolves lexical; warmup explains why not", async () => {
    expect(search.$semantic.get()).toEqual({ status: "unavailable", reason: "disabled" });
    const r = await search.search({ text: "zaps" });
    expect(r.ok && r.value.mode).toBe("lexical");
    expect(r.ok && r.value.hits[0]?.id).toBe("57");
    expect(await search.warmup()).toEqual({
      ok: false,
      error: { code: "semantic-unavailable", message: "disabled" },
    });
    expect(search.lexical({ text: "zaps", limit: 1 }).hits.map((h) => h.id)).toEqual(["57"]);
    search.dispose();
  });

  test("an already-aborted signal wins", async () => {
    const controller = new AbortController();
    controller.abort();
    const r = await search.search({ text: "zaps" }, { signal: controller.signal });
    expect(r).toMatchObject({ ok: false, error: { code: "aborted" } });
  });
});

describe("hybrid search with the real model", () => {
  test(
    "idle → loading → ready, then hybrid results with snippets",
    async () => {
      const search = createHybridSearch({ listings: LISTINGS, semantic: localBackend() });
      const states: SemanticState[] = [];
      const unsubscribe = search.$semantic.subscribe((s) => states.push(s));
      expect(search.$semantic.get()).toEqual({ status: "idle" });
      const r = await search.search({ text: "remove a post I published" });
      unsubscribe();
      expect(states.map((s) => s.status)).toEqual(
        expect.arrayContaining(["idle", "loading", "ready"]),
      );
      expect(r.ok && r.value.mode).toBe("hybrid");
      const hits = r.ok ? r.value.hits : [];
      expect(hits.slice(0, 3).map((h) => h.id)).toContain("09");
      const semantic = hits.find((h) => h.semanticRank !== undefined);
      expect(semantic?.similarity).toBeGreaterThan(0.25);
      expect(semantic?.snippet?.text.length).toBeGreaterThan(0);
      // Empty free text never touches the model.
      const browse = await search.search({ text: "" });
      expect(browse.ok && browse.value.mode).toBe("lexical");
      expect(await search.warmup()).toEqual({ ok: true, value: undefined });
      // Gibberish: nothing clears the meaning-only threshold, so the "no results" state shows.
      for (const text of ["zzqxw nonsense", "qwrtp"]) {
        const nonsense = await search.search({ text });
        expect(nonsense.ok && nonsense.value.hits).toEqual([]);
      }
      search.dispose();
    },
    MODEL_TIMEOUT,
  );

  test(
    "a signal aborted while the model loads → aborted",
    async () => {
      const search = createHybridSearch({ listings: LISTINGS, semantic: localBackend() });
      const controller = new AbortController();
      const pending = search.search({ text: "zaps" }, { signal: controller.signal });
      controller.abort();
      expect(await pending).toMatchObject({ ok: false, error: { code: "aborted" } });
      search.dispose();
    },
    MODEL_TIMEOUT,
  );

  test(
    "availability blocks loading (offline) and is re-checked on the next attempt",
    async () => {
      let online = false;
      const search = createHybridSearch({
        listings: LISTINGS,
        semantic: localBackend(),
        availability: () => (online ? undefined : { status: "unavailable", reason: "offline" }),
      });
      const r = await search.search({ text: "zaps" });
      expect(r.ok && r.value.mode).toBe("lexical");
      expect(search.$semantic.get()).toEqual({ status: "unavailable", reason: "offline" });
      online = true;
      expect((await search.warmup()).ok).toBe(true);
      expect(search.$semantic.get().status).toBe("ready");
    },
    MODEL_TIMEOUT,
  );

  test("broken embeddings → error state, keyword search still answers", async () => {
    const search = createHybridSearch({
      listings: LISTINGS,
      semantic: createLocalBackend({
        embedder: { localModelPath: MODELS_DIR, wasmBaseUrl: ORT_DIR },
        loadIndex: () => Promise.reject(new Error("404")),
      }),
    });
    const r = await search.search({ text: "zaps" });
    expect(r.ok && r.value.mode).toBe("lexical");
    expect(search.$semantic.get()).toEqual({ status: "error", reason: "embeddings-failed" });
  });

  test(
    "missing model files → error state with model-failed",
    async () => {
      const search = createHybridSearch({
        listings: LISTINGS,
        semantic: createLocalBackend({
          embedder: { localModelPath: "/nonexistent/models/" },
          loadIndex: readIndex,
        }),
      });
      expect((await search.search({ text: "zaps" })).ok).toBe(true);
      expect(search.$semantic.get()).toEqual({ status: "error", reason: "model-failed" });
    },
    MODEL_TIMEOUT,
  );
});
