/**
 * Pure browse/rank helpers shared by the list page and @nostrschool/nip-search: filtering,
 * sorting, facet counts, query shortcuts and rank fusion. No IO, no model — instant and testable.
 */
import type { NipSpecVariant } from "./spec.ts";
import { NIP_SPEC_VARIANTS } from "./spec.ts";
import type { NipId, NipMeta, NipStatus } from "./types.ts";
import { NIP_STATUSES, normalizeNipId } from "./types.ts";

/** A NIP as the list page shows it: corpus metadata + what its spec defines. */
export interface NipListing extends NipMeta {
  readonly variant: NipSpecVariant;
  /** The spec is still a stub (no editor yet). */
  readonly todo: boolean;
}

/** Empty/omitted arrays mean "any". All given facets must match (AND); values within one facet OR. */
export interface NipFilters {
  readonly statuses?: readonly NipStatus[];
  readonly variants?: readonly NipSpecVariant[];
  /** Only NIPs that need relay support. */
  readonly relay?: boolean;
  /** NIPs that define (kinds table) or show (examples) this kind. */
  readonly kind?: number;
  /** NIPs whose examples use this tag name. */
  readonly tag?: string;
  /** NIPs that build on (link to or name) this NIP, e.g. "44" → NIP-17, NIP-46, NIP-59… */
  readonly dependsOn?: NipId;
}

/** True if the NIP defines (README kinds table, ranges included) or shows this kind. */
export const nipCoversKind = (nip: NipMeta, kind: number): boolean =>
  nip.kinds.some((k) => (k.to === undefined ? k.kind === kind : kind >= k.kind && kind <= k.to)) ||
  nip.exampleKinds.includes(kind);

export const matchesFilters = (nip: NipListing, f: NipFilters): boolean =>
  (f.statuses === undefined || f.statuses.length === 0 || f.statuses.includes(nip.status)) &&
  (f.variants === undefined || f.variants.length === 0 || f.variants.includes(nip.variant)) &&
  (f.relay !== true || nip.relay) &&
  (f.kind === undefined || nipCoversKind(nip, f.kind)) &&
  (f.tag === undefined || nip.tags.includes(f.tag)) &&
  (f.dependsOn === undefined || nip.mentions.includes(f.dependsOn));

export const filterNips = <T extends NipListing>(nips: readonly T[], f: NipFilters): readonly T[] =>
  nips.filter((n) => matchesFilters(n, f));

export type NipSort = "id" | "title" | "updated";
export const NIP_SORTS: readonly NipSort[] = ["id", "title", "updated"];

/**
 * Ids sort as hex numbers, which matches the README order (59 < 5A < 60, 78 < 7D < 84, 99 < A0).
 * "updated" is newest first, unknown dates last; ties fall back to id order.
 */
export const compareNipIds = (a: NipId, b: NipId): number =>
  Number.parseInt(a, 16) - Number.parseInt(b, 16);

export const sortNips = <T extends NipMeta>(
  nips: readonly T[],
  sort: NipSort,
  locale = "en",
): readonly T[] =>
  [...nips].sort((a, b) => {
    const byId = compareNipIds(a.id, b.id);
    if (sort === "title") return a.title.localeCompare(b.title, locale) || byId;
    if (sort === "updated") return (b.updatedAt ?? "").localeCompare(a.updatedAt ?? "") || byId;
    return byId;
  });

export interface NipFacetCounts {
  readonly statuses: { readonly [S in NipStatus]: number };
  readonly variants: { readonly [V in NipSpecVariant]: number };
  readonly relay: number;
}

export const facetCounts = (nips: readonly NipListing[]): NipFacetCounts => ({
  statuses: Object.fromEntries(
    NIP_STATUSES.map((s) => [s, nips.filter((n) => n.status === s).length]),
  ) as { readonly [S in NipStatus]: number },
  variants: Object.fromEntries(
    NIP_SPEC_VARIANTS.map((v) => [v, nips.filter((n) => n.variant === v).length]),
  ) as { readonly [V in NipSpecVariant]: number },
  relay: nips.filter((n) => n.relay).length,
});

/** A search query split into exact shortcuts and the free text left for lexical/semantic search. */
export interface ParsedNipQuery {
  /** Free text with shortcuts removed, whitespace-collapsed. */
  readonly text: string;
  /** "57", "nip-57", "NIP 5a" → NIP ids to pin to the top. */
  readonly ids: readonly NipId[];
  /** "kind:9735", "k:1" → kinds. */
  readonly kinds: readonly number[];
  /** "#e", "tag:imeta" → tag names. */
  readonly tags: readonly string[];
}

/**
 * Recognises shortcuts in a query: `kind:N`/`k:N`/`kind N`, `#tag`/`tag:name`, and NIP numbers.
 * An explicit "nip-57"/"NIP57" is consumed; a bare "57" or "5A" is pinned but also kept in the
 * free text (it may mean a kind or a word). Letter-only ids ("EE", "BE") only count when written
 * in capitals, so prose like "be" is never hijacked. With `knownIds`, unknown ids are ignored.
 * With `isKnownKind`, a bare number of 3+ digits that is a registered kind ("9735") also counts as
 * a kind (kept in the text too); shorter numbers stay NIP ids, and unregistered ones (a year) stay text.
 */
export const parseNipQuery = (
  query: string,
  knownIds?: ReadonlySet<NipId>,
  isKnownKind?: (kind: number) => boolean,
): ParsedNipQuery => {
  const ids: NipId[] = [];
  const kinds: number[] = [];
  const tags: string[] = [];
  const rest: string[] = [];
  const known = (id: NipId | undefined): id is NipId =>
    id !== undefined && (knownIds === undefined || knownIds.has(id));
  const words = query
    .trim()
    .split(/\s+/)
    .filter((w) => w !== "");
  const KIND_NUMBER = /^\d{1,5}$/;
  for (let i = 0; i < words.length; i++) {
    const word = words[i] ?? "";
    const next = words[i + 1];
    // "kind 9735": people type a space as often as a colon; consume both words.
    if (/^kind$/i.test(word) && next !== undefined && KIND_NUMBER.test(next)) {
      kinds.push(Number(next));
      i++;
      continue;
    }
    const kind = /^k(?:ind)?:(\d{1,5})$/i.exec(word)?.[1];
    const tag = /^(?:#|tag:)([A-Za-z0-9_-]{1,24})$/i.exec(word)?.[1];
    const explicitRaw = /^nip[-_]?([0-9a-f]{1,2})$/i.exec(word)?.[1];
    const explicit = explicitRaw === undefined ? undefined : normalizeNipId(explicitRaw);
    const bare =
      /^\d{1,2}$|^(?=.*\d)[0-9a-f]{2}$/i.test(word) || /^[A-F]{2}$/.test(word) ? word : undefined;
    if (kind !== undefined) kinds.push(Number(kind));
    else if (tag !== undefined) tags.push(tag);
    else if (known(explicit)) ids.push(explicit);
    else {
      const id = bare === undefined ? undefined : normalizeNipId(bare);
      if (known(id)) ids.push(id);
      else if (/^\d{3,5}$/.test(word) && isKnownKind?.(Number(word)) === true)
        kinds.push(Number(word));
      rest.push(word);
    }
  }
  return {
    text: rest.join(" "),
    ids: [...new Set(ids)],
    kinds: [...new Set(kinds)],
    tags: [...new Set(tags)],
  };
};

export interface RankedId {
  readonly id: string;
}

export interface FusedRank {
  readonly id: string;
  readonly score: number;
}

/**
 * Reciprocal rank fusion: score(id) = Σ weight_i / (k + rank_i). Robust to the lexical and
 * semantic scores living on different scales, which is why hybrid search merges ranks, not
 * scores. `k` = 60 is the usual constant; ties keep first-seen order.
 */
export const fuseRankings = (
  rankings: readonly (readonly RankedId[])[],
  options: { readonly k?: number; readonly weights?: readonly number[] } = {},
): readonly FusedRank[] => {
  const k = options.k ?? 60;
  const scores = new Map<string, number>();
  rankings.forEach((list, i) => {
    const weight = options.weights?.[i] ?? 1;
    list.forEach((item, rank) => {
      scores.set(item.id, (scores.get(item.id) ?? 0) + weight / (k + rank + 1));
    });
  });
  return [...scores.entries()]
    .map(([id, score]) => ({ id, score }))
    .sort((a, b) => b.score - a.score);
};

export interface NipRelations<T extends NipMeta> {
  /** NIPs this one links to or names (what it builds on), in id order. */
  readonly dependencies: readonly T[];
  /** NIPs that link to or name this one, in id order. */
  readonly dependents: readonly T[];
}

/** Resolves a NIP's `mentions` / `mentionedBy` ids to entries of `nips` (unknown ids dropped). */
export const nipRelations = <T extends NipMeta>(
  nips: readonly T[],
  nip: NipMeta,
): NipRelations<T> => {
  const resolve = (ids: readonly NipId[]) =>
    sortNips(
      nips.filter((n) => ids.includes(n.id)),
      "id",
    );
  return { dependencies: resolve(nip.mentions), dependents: resolve(nip.mentionedBy) };
};
