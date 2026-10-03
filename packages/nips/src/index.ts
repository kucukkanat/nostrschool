/**
 * @nostrschool/nips — NIP metadata, the NipSpec schema, the validator and browse helpers.
 * Browser-safe: carries only `data/index.json` (metadata). Full markdown: `@nostrschool/nips/corpus`
 * (build time). Every spec: `@nostrschool/nips/specs` (build time; pass one spec to an island).
 */
import indexJson from "./data/index.json" with { type: "json" };
import { type NipRelations, nipCoversKind, nipRelations } from "./search.ts";
import type { KindRegistryRow, NipId, NipIndex, NipMeta, NipStatus } from "./types.ts";

export {
  getNipStrings,
  NIP_RANGES,
  type NipRange,
  type NipStrings,
  nipRange,
} from "@nostrschool/i18n";
export * from "./build.ts";
export * from "./search.ts";
export * from "./spec.ts";
export * from "./types.ts";
export * from "./validate.ts";

// Produced by scripts/snapshot-nips.ts; corpus.test.ts checks the shape behind this widening.
export const NIP_INDEX: NipIndex = indexJson as NipIndex;

/** Every NIP id in the snapshot, in README order (hex order). */
export const NIP_IDS: readonly NipId[] = NIP_INDEX.nips.map((n) => n.id);

const byId = new Map(NIP_INDEX.nips.map((n) => [n.id, n]));

export const getNipMeta = (id: NipId): NipMeta | undefined => byId.get(id);

/** README kinds-table rows covering `kind` (ranges included), with the NIPs that define it. */
export const kindRegistryRows = (kind: number): readonly KindRegistryRow[] =>
  NIP_INDEX.kinds.filter((k) =>
    k.to === undefined ? k.kind === kind : kind >= k.kind && kind <= k.to,
  );

/** NIPs that define (kinds table, ranges included) or show (examples) `kind`, in id order. */
export const nipsForKind = (kind: number): readonly NipMeta[] =>
  NIP_INDEX.nips.filter((n) => nipCoversKind(n, kind));

/** NIPs with one of the given statuses, in id order. */
export const nipsWithStatus = (...statuses: readonly NipStatus[]): readonly NipMeta[] =>
  NIP_INDEX.nips.filter((n) => statuses.includes(n.status));

/** What a NIP builds on and what builds on it; undefined for an id not in the snapshot. */
export const getNipRelations = (id: NipId): NipRelations<NipMeta> | undefined => {
  const nip = byId.get(id);
  return nip === undefined ? undefined : nipRelations(NIP_INDEX.nips, nip);
};
