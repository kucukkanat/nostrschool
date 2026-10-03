/**
 * `@nostrschool/nips/corpus` — the full snapshot with markdown and sections (~1.4 MB).
 * Build-time only (Astro pages, scripts, tests): never import it from a client island.
 */
import corpusJson from "./data/corpus.json" with { type: "json" };
import type { NipCorpus, NipDocument, NipId } from "./types.ts";

export { type RenderNipOptions, renderNipMarkdown } from "./markdown.ts";

// The JSON is produced by scripts/snapshot-nips.ts from the typed parser; corpus.test.ts checks
// its shape, so this one widening is guarded rather than trusted.
export const NIP_CORPUS: NipCorpus = corpusJson as NipCorpus;

const byId = new Map(NIP_CORPUS.nips.map((n) => [n.id, n]));

export const getNipDocument = (id: NipId): NipDocument | undefined => byId.get(id);
