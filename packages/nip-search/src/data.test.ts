/**
 * The committed artifacts agree with each other and with the corpus. Full freshness (our edited
 * summaries/hints changing the embedded text) is `bun run embed:nips -- --check`, kept out of
 * `bun test` so spec authors editing summaries do not break every test run until re-embedding.
 */
import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import { NIP_INDEX } from "@nostrschool/nips";
import { prepareCorpusChunks, stalenessReasons, textHash } from "./build.ts";
import { DATA_DIR, MODELS_DIR, readIndex, readManifest } from "./test-support.ts";
import { DEFAULT_MODEL_ID } from "./types.ts";

describe("committed embeddings", () => {
  test("built from the pinned corpus with the default model; sizes agree", async () => {
    const index = await readIndex();
    const { manifest } = index;
    expect(manifest.version).toBe(1);
    expect(manifest.model).toBe(DEFAULT_MODEL_ID);
    expect(manifest.dims).toBe(384);
    expect(manifest.commit).toBe(NIP_INDEX.source.commit);
    expect(index.vectors.length).toBe(manifest.chunks.length * manifest.dims);
    expect(manifest.textHash).toMatch(/^[0-9a-f]{64}$/);
  });

  test("one passage set per corpus NIP, same ids and snippets as the chunker produces", async () => {
    const manifest = await readManifest();
    const expected = prepareCorpusChunks().map((c) => c.chunk);
    expect(manifest.chunks).toEqual(expected);
    expect(new Set(manifest.chunks.map((c) => c.nip)).size).toBe(NIP_INDEX.nips.length);
    // Compact: well under a megabyte each, as they ship to the browser.
    expect(Bun.file(join(DATA_DIR, "embeddings.bin")).size).toBeLessThan(1_000_000);
    expect(Bun.file(join(DATA_DIR, "embeddings.json")).size).toBeLessThan(1_000_000);
  });

  test("stalenessReasons names what changed", async () => {
    const manifest = await readManifest();
    const reasons = stalenessReasons({ ...manifest, model: "x", commit: "y", textHash: "z" });
    expect(reasons).toHaveLength(3);
    expect(reasons[0]).toContain("model x");
    expect(reasons[1]).toContain("corpus commit y");
    expect(stalenessReasons({ ...manifest, textHash: textHash(prepareCorpusChunks()) })).toEqual(
      [],
    );
  });
});

describe("self-hosted model files", () => {
  test("model, tokenizer and the plain CPU wasm runtime are in public/models", async () => {
    for (const path of [
      `${DEFAULT_MODEL_ID}/config.json`,
      `${DEFAULT_MODEL_ID}/tokenizer.json`,
      `${DEFAULT_MODEL_ID}/tokenizer_config.json`,
      `${DEFAULT_MODEL_ID}/onnx/model_quantized.onnx`,
      "ort/ort-wasm-simd-threaded.mjs",
      "ort/ort-wasm-simd-threaded.wasm",
    ])
      expect(await Bun.file(join(MODELS_DIR, path)).exists()).toBe(true);
    // Only the plain runtime: the jsep/jspi/asyncify variants are ~70 MB we never load.
    const ort = await Array.fromAsync(new Bun.Glob("*").scan(join(MODELS_DIR, "ort")));
    expect(ort.sort()).toEqual(["ort-wasm-simd-threaded.mjs", "ort-wasm-simd-threaded.wasm"]);
  });
});
