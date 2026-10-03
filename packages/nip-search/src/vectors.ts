/**
 * Int8 vector storage and cosine ranking. Pure, no model: shared by the embedding script, the
 * browser worker and tests.
 */
import type { EmbeddingsIndex, EmbeddingsManifest, QuantizedVector, ScoredChunk } from "./types.ts";

/** Returns a unit-length copy (a zero vector stays zero). */
export const normalize = (vector: Float32Array): Float32Array => {
  const norm = Math.hypot(...vector);
  return norm === 0 ? new Float32Array(vector) : vector.map((v) => v / norm);
};

/** L2-normalises then quantises to int8 with a per-vector scale (max |v| → 127). */
export const quantizeInt8 = (vector: Float32Array): QuantizedVector => {
  const unit = normalize(vector);
  const max = unit.reduce((m, v) => Math.max(m, Math.abs(v)), 0);
  // A zero vector gets scale 0 so it scores 0 against everything instead of NaN.
  const scale = max === 0 ? 0 : max / 127;
  const data = Int8Array.from(unit, (v) => (scale === 0 ? 0 : Math.round(v / scale)));
  return { data, scale };
};

export class EmbeddingsFormatError extends Error {
  override readonly name = "EmbeddingsFormatError";
}

/**
 * Decodes the committed manifest + binary vectors. Throws EmbeddingsFormatError when the bytes do
 * not match the manifest — that is a build bug (stale `embed:nips`), never user input.
 */
export const decodeEmbeddings = (
  manifest: EmbeddingsManifest,
  bytes: ArrayBuffer,
): EmbeddingsIndex => {
  const expected = manifest.chunks.length * manifest.dims;
  if (manifest.scales.length !== manifest.chunks.length)
    throw new EmbeddingsFormatError(
      `embeddings: ${manifest.scales.length} scales for ${manifest.chunks.length} chunks`,
    );
  if (bytes.byteLength !== expected)
    throw new EmbeddingsFormatError(
      `embeddings: expected ${expected} bytes (${manifest.chunks.length} × ${manifest.dims}), got ${bytes.byteLength}`,
    );
  return { manifest, vectors: new Int8Array(bytes) };
};

/** Cosine top-k of a normalised query vector against every chunk, best first. */
export const cosineTopK = (
  query: Float32Array,
  index: EmbeddingsIndex,
  k: number,
): readonly ScoredChunk[] => {
  const { dims, scales } = index.manifest;
  if (query.length !== dims)
    throw new EmbeddingsFormatError(`embeddings: query has ${query.length} dims, index ${dims}`);
  const scored: ScoredChunk[] = scales.map((scale, chunk) => {
    let dot = 0;
    const offset = chunk * dims;
    for (let d = 0; d < dims; d++) dot += (query[d] ?? 0) * (index.vectors[offset + d] ?? 0);
    return { chunk, similarity: dot * scale };
  });
  return scored.sort((a, b) => b.similarity - a.similarity).slice(0, Math.max(0, k));
};
