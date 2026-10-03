/**
 * Build-time only (imports the 1.4 MB corpus): the exact passages `embed:nips` embeds, and the
 * staleness check shared by the script and the tests. Not exported from the package index, so
 * it never reaches a browser bundle.
 */
import { createHash } from "node:crypto";
import { getNipStrings, NIP_INDEX } from "@nostrschool/nips";
import { NIP_CORPUS } from "@nostrschool/nips/corpus";
import { searchHints } from "./aliases.ts";
import { chunkCorpus, type PreparedChunk } from "./chunk.ts";
import { buildDefinitionTable, type NipDefinitions } from "./definitions.ts";
import { DEFAULT_MODEL_ID, type EmbeddingsManifest } from "./types.ts";

/** NIP passages plus our English summary (in the about passage) and one passage per search hint. */
export const prepareCorpusChunks = (): readonly PreparedChunk[] =>
  chunkCorpus(NIP_CORPUS.nips, {}, (id) => ({
    summaries: [getNipStrings("en", id)?.summary ?? ""],
    hints: searchHints(id),
  }));

export const textHash = (chunks: readonly PreparedChunk[]): string =>
  createHash("sha256")
    .update(chunks.map((c) => c.embedText).join("\0"))
    .digest("hex");

/** Why the committed embeddings no longer match the corpus/summaries/hints, or [] when fresh. */
export const stalenessReasons = (manifest: EmbeddingsManifest): readonly string[] => {
  const expected = prepareCorpusChunks();
  return [
    ...(manifest.model === DEFAULT_MODEL_ID
      ? []
      : [`model ${manifest.model} ≠ ${DEFAULT_MODEL_ID}`]),
    ...(manifest.commit === NIP_INDEX.source.commit
      ? []
      : [`corpus commit ${manifest.commit} ≠ ${NIP_INDEX.source.commit}`]),
    ...(manifest.textHash === textHash(expected) &&
    JSON.stringify(manifest.chunks) === JSON.stringify(expected.map((c) => c.chunk))
      ? []
      : ["passages changed (corpus, summaries or search hints edited)"]),
  ];
};

/** The definitions table for the pinned corpus (see definitions.ts). */
export const buildDefinitions = (): NipDefinitions =>
  buildDefinitionTable(NIP_CORPUS.nips, NIP_INDEX.source.commit);

/** `data/definitions.json` exactly as committed: one term per line keeps diffs readable. */
export const definitionsFileText = (defs: NipDefinitions = buildDefinitions()): string =>
  `{\n  "version": ${defs.version},\n  "commit": ${JSON.stringify(defs.commit)},\n  "terms": {\n${Object.entries(
    defs.terms,
  )
    .map(([term, definers]) => `    ${JSON.stringify(term)}: ${JSON.stringify(definers)}`)
    .join(",\n")}\n  }\n}\n`;
