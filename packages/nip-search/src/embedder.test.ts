import { describe, expect, test } from "bun:test";
import {
  createEmbedder,
  joinUrl,
  progressTracker,
  toLocalModelPath,
  withoutCacheOnFailure,
} from "./embedder.ts";
import { MODELS_DIR } from "./test-support.ts";

describe("progressTracker", () => {
  test("sums bytes over big files; never decreases; ignores small files and other events", () => {
    const seen: number[] = [];
    const track = progressTracker((p) => seen.push(p));
    const MB = 1_000_000;
    track(null);
    track({ status: "initiate", file: "a" });
    track({ status: "progress" });
    track({ status: "progress", file: "a" });
    track({ status: "progress", file: "config.json", loaded: 600, total: 600 });
    track({ status: "progress", file: "a", loaded: 5 * MB, total: 10 * MB });
    track({ status: "progress", file: "b", loaded: 0, total: 30 * MB });
    track({ status: "progress", file: "b", loaded: 30 * MB, total: 30 * MB });
    track({ status: "progress", file: "a", loaded: 20 * MB, total: 10 * MB });
    expect(seen).toEqual([0.5, 0.875, 1]);
  });
});

describe("toLocalModelPath", () => {
  test("same-origin URLs become root-relative; paths and other origins pass through", () => {
    const origin = "https://kucukkanat.github.io";
    expect(toLocalModelPath(`${origin}/nostrschool/models/`, origin)).toBe("/nostrschool/models/");
    expect(toLocalModelPath("/nostrschool/models/", origin)).toBe("/nostrschool/models/");
    expect(toLocalModelPath("https://cdn.example/models/", origin)).toBe(
      "https://cdn.example/models/",
    );
    expect(toLocalModelPath(`${origin}/models/`, undefined)).toBe(`${origin}/models/`);
  });
});

describe("joinUrl", () => {
  test("puts exactly one slash between base and file", () => {
    expect(joinUrl("/nostrschool/models/ort", "a.mjs")).toBe("/nostrschool/models/ort/a.mjs");
    expect(joinUrl("/nostrschool/models/ort/", "a.mjs")).toBe("/nostrschool/models/ort/a.mjs");
  });
});

describe("withoutCacheOnFailure", () => {
  test("retries once without the browser cache, then reports the real failure", async () => {
    const env = { useBrowserCache: true };
    const seen: boolean[] = [];
    const flaky = async () => {
      seen.push(env.useBrowserCache);
      if (env.useBrowserCache) throw new Error("network error");
      return "loaded";
    };
    expect(await withoutCacheOnFailure(env, flaky)).toBe("loaded");
    expect(seen).toEqual([true, false]);
    const broken = async (): Promise<string> => {
      throw new Error("missing model");
    };
    await expect(withoutCacheOnFailure(env, broken)).rejects.toThrow("missing model");
    await expect(withoutCacheOnFailure({ useBrowserCache: true }, broken)).rejects.toThrow(
      "missing model",
    );
  });
});

describe("createEmbedder (real model)", () => {
  test("unit vectors; paraphrases closer than unrelated text; progress reported", async () => {
    const progress: number[] = [];
    const embed = await createEmbedder({
      localModelPath: MODELS_DIR,
      onProgress: (p) => progress.push(p),
    });
    expect(await embed([])).toEqual([]);
    const [a, b, c] = await embed(["delete my note", "remove a post", "chess game notation"]);
    if (a === undefined || b === undefined || c === undefined) throw new Error("missing vector");
    const dot = (x: Float32Array, y: Float32Array) => x.reduce((s, v, i) => s + v * (y[i] ?? 0), 0);
    expect(a.length).toBe(384);
    expect(dot(a, a)).toBeCloseTo(1, 4);
    expect(dot(a, b)).toBeGreaterThan(dot(a, c));
    expect(progress.every((p) => p >= 0 && p <= 1)).toBe(true);
  }, 60_000);
});
