/**
 * @nostrschool/nip-search — hybrid NIP search. Lexical (MiniSearch: fuzzy + prefix over title,
 * hints, summary, headings, kinds and tags) is instant; semantic search lazy-loads a small
 * sentence model in a Web Worker from SELF-HOSTED files on first use and ranks precomputed int8
 * chunk embeddings by cosine similarity; both scores are fused per NIP (see rank.ts).
 */
export * from "./aliases.ts";
export * from "./backend.ts";
export * from "./browser.ts";
export * from "./chunk.ts";
export * from "./definitions.ts";
export * from "./embedder.ts";
export * from "./lexical.ts";
export * from "./rank.ts";
export * from "./search.ts";
export * from "./types.ts";
export * from "./vectors.ts";
export * from "./worker-backend.ts";
export type { FromWorker, ToWorker, WorkerLoadConfig } from "./worker-protocol.ts";
export { createWorkerHandler } from "./worker-protocol.ts";
