/**
 * Builds packages/nip-search/src/data/embeddings.{json,bin} from @nostrschool/nips/corpus with
 * the same sentence model the browser loads (CONTRACTS.md §3.11 → nip-search), and keeps the
 * self-hosted model + onnxruntime-web files in apps/site/public/models/ in place.
 *
 *   bun run embed:nips              # fetch missing model files, sync ort wasm, embed
 *   bun run embed:nips -- --assets  # only model files + ort wasm (no embedding)
 *   bun run embed:nips -- --check   # exit 1 if the committed embeddings are stale
 *
 * Model files are downloaded once from huggingface.co at a pinned revision and checked against
 * pinned SHA-256 hashes; the browser only ever loads our copies. Run after `snapshot:nips`.
 */
import { createHash } from "node:crypto";
import { copyFile, mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import {
  prepareCorpusChunks,
  stalenessReasons,
  textHash,
} from "../packages/nip-search/src/build.ts";
import { createEmbedder } from "../packages/nip-search/src/embedder.ts";
import { DEFAULT_MODEL_ID, type EmbeddingsManifest } from "../packages/nip-search/src/types.ts";
import { quantizeInt8 } from "../packages/nip-search/src/vectors.ts";
import { NIP_INDEX } from "../packages/nips/src/index.ts";

const ROOT = join(import.meta.dir, "..");
const MODELS_DIR = join(ROOT, "apps/site/public/models");
const DATA_DIR = join(ROOT, "packages/nip-search/src/data");
const MODEL_REVISION = "751bff37182d3f1213fa05d7196b954e230abad9";
const MODEL_FILES: readonly { readonly path: string; readonly sha256: string }[] = [
  {
    path: "config.json",
    sha256: "7135149f7cffa1a573466c6e4d8423ed73b62fd2332c575bf738a0d033f70df7",
  },
  {
    path: "tokenizer.json",
    sha256: "da0e79933b9ed51798a3ae27893d3c5fa4a201126cef75586296df9b4d2c62a0",
  },
  {
    path: "tokenizer_config.json",
    sha256: "9261e7d79b44c8195c1cada2b453e55b00aeb81e907a6664974b4d7776172ab3",
  },
  {
    path: "onnx/model_quantized.onnx",
    sha256: "afdb6f1a0e45b715d0bb9b11772f032c399babd23bfc31fed1c170afc848bdb1",
  },
];
/** Plain CPU runtime only: the jsep/jspi/asyncify variants add ~70 MB we never use. */
const ORT_FILES = ["ort-wasm-simd-threaded.mjs", "ort-wasm-simd-threaded.wasm"] as const;
const BATCH = 32;

const sha256 = (bytes: Uint8Array): string => createHash("sha256").update(bytes).digest("hex");

const readIfExists = async (path: string): Promise<Uint8Array | undefined> => {
  const file = Bun.file(path);
  return (await file.exists()) ? new Uint8Array(await file.arrayBuffer()) : undefined;
};

const ensureModelFiles = async (): Promise<void> => {
  for (const { path, sha256: expected } of MODEL_FILES) {
    const target = join(MODELS_DIR, DEFAULT_MODEL_ID, path);
    const existing = await readIfExists(target);
    if (existing !== undefined && sha256(existing) === expected) continue;
    const url = `https://huggingface.co/${DEFAULT_MODEL_ID}/resolve/${MODEL_REVISION}/${path}`;
    console.log(`embed-nips: downloading ${url}`);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`embed-nips: ${url} → HTTP ${response.status}`);
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (sha256(bytes) !== expected) throw new Error(`embed-nips: ${path} hash mismatch`);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, bytes);
  }
};

/** Copies the wasm runtime from the onnxruntime-web that transformers.js itself depends on. */
const ortDistDir = (): string => {
  const transformers = Bun.resolveSync("@huggingface/transformers", ROOT);
  return dirname(Bun.resolveSync("onnxruntime-web", dirname(transformers)));
};

const syncOrtFiles = async (): Promise<void> => {
  const ortDist = ortDistDir();
  await mkdir(join(MODELS_DIR, "ort"), { recursive: true });
  for (const file of ORT_FILES) await copyFile(join(ortDist, file), join(MODELS_DIR, "ort", file));
};

/** Every reason the committed model files, ort wasm or embeddings are out of date. */
const check = async (): Promise<readonly string[]> => {
  const reasons: string[] = [];
  for (const { path, sha256: expected } of MODEL_FILES) {
    const bytes = await readIfExists(join(MODELS_DIR, DEFAULT_MODEL_ID, path));
    if (bytes === undefined || sha256(bytes) !== expected) reasons.push(`model file ${path}`);
  }
  const ortDist = ortDistDir();
  for (const file of ORT_FILES) {
    const [ours, theirs] = await Promise.all([
      readIfExists(join(MODELS_DIR, "ort", file)),
      readIfExists(join(ortDist, file)),
    ]);
    if (ours === undefined || theirs === undefined || sha256(ours) !== sha256(theirs))
      reasons.push(`ort/${file} differs from the installed onnxruntime-web`);
  }
  const manifestFile = Bun.file(join(DATA_DIR, "embeddings.json"));
  if (!(await manifestFile.exists())) return [...reasons, "no embeddings.json"];
  return [...reasons, ...stalenessReasons((await manifestFile.json()) as EmbeddingsManifest)];
};

const embedAll = async (): Promise<void> => {
  const prepared = prepareCorpusChunks();
  const embed = await createEmbedder({ localModelPath: `${MODELS_DIR}/` });
  const vectors: Float32Array[] = [];
  for (let i = 0; i < prepared.length; i += BATCH) {
    vectors.push(...(await embed(prepared.slice(i, i + BATCH).map((c) => c.embedText))));
    process.stdout.write(`\rembed-nips: ${vectors.length}/${prepared.length} passages`);
  }
  process.stdout.write("\n");
  const quantized = vectors.map(quantizeInt8);
  const dims = vectors[0]?.length ?? 0;
  const manifest: EmbeddingsManifest = {
    version: 1,
    model: DEFAULT_MODEL_ID,
    dims,
    commit: NIP_INDEX.source.commit,
    textHash: textHash(prepared),
    chunks: prepared.map((c) => c.chunk),
    // 6 significant digits: well below int8 resolution, and keeps the JSON small.
    scales: quantized.map((q) => Number(q.scale.toPrecision(6))),
  };
  const bin = new Int8Array(quantized.length * dims);
  quantized.forEach((q, i) => {
    bin.set(q.data, i * dims);
  });
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(join(DATA_DIR, "embeddings.json"), `${JSON.stringify(manifest)}\n`);
  await writeFile(join(DATA_DIR, "embeddings.bin"), bin);
  console.log(
    `embed-nips: ${manifest.chunks.length} passages × ${dims} dims → ${bin.byteLength} bytes`,
  );
};

const args = new Set(process.argv.slice(2));
if (args.has("--check")) {
  const reasons = await check();
  for (const reason of reasons) console.error(`embed-nips: stale: ${reason}`);
  if (reasons.length === 0) console.log("embed-nips: model, runtime and embeddings are up to date");
  process.exit(reasons.length === 0 ? 0 : 1);
}
await ensureModelFiles();
await syncOrtFiles();
if (!args.has("--assets")) await embedAll();
