import { describe, expect, test } from "bun:test";
import type { EmbeddingsManifest } from "./types.ts";
import {
  cosineTopK,
  decodeEmbeddings,
  EmbeddingsFormatError,
  normalize,
  quantizeInt8,
} from "./vectors.ts";

const manifest = (n: number, dims: number, scales?: number[]): EmbeddingsManifest => ({
  version: 1,
  model: "m",
  dims,
  commit: "c",
  textHash: "h",
  chunks: Array.from({ length: n }, (_, i) => ({
    id: `x:${i}`,
    nip: "01",
    sectionId: "intro",
    heading: "h",
    text: "t",
  })),
  scales: scales ?? Array.from({ length: n }, () => 1 / 127),
});

describe("normalize / quantizeInt8", () => {
  test("unit length; zero stays zero", () => {
    const v = normalize(Float32Array.from([3, 4]));
    expect([...v].map((x) => Number(x.toFixed(6)))).toEqual([0.6, 0.8]);
    expect([...normalize(new Float32Array(3))]).toEqual([0, 0, 0]);
  });

  test("max |v| maps to ±127 and dequantises close to the unit vector", () => {
    const q = quantizeInt8(Float32Array.from([1, -2, 0.5]));
    expect(Math.max(...[...q.data].map(Math.abs))).toBe(127);
    const unit = normalize(Float32Array.from([1, -2, 0.5]));
    [...q.data].forEach((x, i) => {
      expect(Math.abs(x * q.scale - (unit[i] ?? 0))).toBeLessThan(0.005);
    });
  });

  test("zero vector → scale 0, all zeros", () => {
    const q = quantizeInt8(new Float32Array(4));
    expect(q.scale).toBe(0);
    expect([...q.data]).toEqual([0, 0, 0, 0]);
  });
});

describe("decodeEmbeddings", () => {
  test("accepts matching sizes", () => {
    const index = decodeEmbeddings(manifest(2, 3), new ArrayBuffer(6));
    expect(index.vectors.length).toBe(6);
  });

  test("rejects wrong byte length or scale count", () => {
    expect(() => decodeEmbeddings(manifest(2, 3), new ArrayBuffer(5))).toThrow(
      EmbeddingsFormatError,
    );
    expect(() => decodeEmbeddings(manifest(2, 3, [1]), new ArrayBuffer(6))).toThrow(
      /1 scales for 2 chunks/,
    );
  });
});

describe("cosineTopK", () => {
  const rows = [Float32Array.from([1, 0]), Float32Array.from([0, 1]), Float32Array.from([1, 1])];
  const quantized = rows.map(quantizeInt8);
  const bytes = new Int8Array(6);
  quantized.forEach((q, i) => {
    bytes.set(q.data, i * 2);
  });
  const index = decodeEmbeddings(
    manifest(
      3,
      2,
      quantized.map((q) => q.scale),
    ),
    bytes.buffer,
  );

  test("best first, k-limited, similarity ≈ cosine", () => {
    const top = cosineTopK(normalize(Float32Array.from([1, 0.1])), index, 2);
    expect(top.map((t) => t.chunk)).toEqual([0, 2]);
    expect(top[0]?.similarity).toBeCloseTo(0.995, 2);
    expect(cosineTopK(Float32Array.from([1, 0]), index, 0)).toEqual([]);
    expect(cosineTopK(Float32Array.from([1, 0]), index, -1)).toEqual([]);
  });

  test("dimension mismatch is a programmer error", () => {
    expect(() => cosineTopK(Float32Array.from([1, 0, 0]), index, 1)).toThrow(/3 dims/);
  });
});
