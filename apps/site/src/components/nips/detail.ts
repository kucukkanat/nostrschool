/**
 * Pure helpers for the /nips/<id> page and the list's "taught in the course" facet: course
 * chapter mapping, prev/next and related-NIP grouping. Build-time only callers, but no Astro
 * imports, so they are unit-tested in Bun.
 */
import {
  type NipId,
  type NipMeta,
  type NipRelation,
  normalizeNipId,
  type RelatedNip,
} from "@nostrschool/nips";
import type { CourseLink, CourseMap } from "./browse.ts";

export interface ChapterNips {
  readonly nn: string;
  readonly title: string;
  readonly href: string;
  /** Frontmatter `nips` ("01", "5A"); normalised here, unknown spellings dropped. */
  readonly nips: readonly string[];
}

/** NIP id → chapters teaching it, in course order (one entry per chapter). */
export const buildCourseMap = (chapters: readonly ChapterNips[]): CourseMap => {
  const map = new Map<NipId, CourseLink[]>();
  for (const { nn, title, href, nips } of [...chapters].sort((a, b) => a.nn.localeCompare(b.nn)))
    for (const raw of new Set(nips)) {
      const id = normalizeNipId(raw);
      if (id === undefined) continue;
      map.set(id, [...(map.get(id) ?? []), { nn, title, href }]);
    }
  return Object.fromEntries(map);
};

/** Previous/next NIP in README order (ids as given). */
export const nipNeighbors = (
  ids: readonly NipId[],
  id: NipId,
): { readonly prev?: NipId; readonly next?: NipId } => {
  const i = ids.indexOf(id);
  if (i === -1) return {};
  const prev = ids[i - 1];
  const next = ids[i + 1];
  return { ...(prev === undefined ? {} : { prev }), ...(next === undefined ? {} : { next }) };
};

export const RELATION_ORDER: readonly NipRelation[] = [
  "depends-on",
  "extends",
  "replaces",
  "replaced-by",
  "used-by",
  "see-also",
];

export interface RelatedEntry {
  readonly nip: NipId;
  readonly relation: NipRelation;
  readonly explain?: string;
}

/**
 * The spec's curated relations (with their explanations), plus the corpus links the spec didn't
 * mention: NIPs this one refers to become `see-also` (a link in prose doesn't say why), NIPs
 * referring to it become `used-by`. Only ids in `known` are kept so every entry has a page.
 */
export const relatedEntries = (
  related: readonly RelatedNip[],
  meta: Pick<NipMeta, "id" | "mentions" | "mentionedBy">,
  known: ReadonlySet<NipId>,
  explain: (key: string) => string | undefined,
): readonly RelatedEntry[] => {
  const curated: RelatedEntry[] = related
    .filter((r) => known.has(r.nip) && r.nip !== meta.id)
    .map((r) => {
      const text = r.explain === undefined ? undefined : explain(r.explain);
      return { nip: r.nip, relation: r.relation, ...(text === undefined ? {} : { explain: text }) };
    });
  const seen = new Set(curated.map((r) => r.nip));
  const fromCorpus = (ids: readonly NipId[], relation: NipRelation): RelatedEntry[] =>
    ids
      .filter((id) => known.has(id) && id !== meta.id && !seen.has(id))
      .map((id) => {
        seen.add(id);
        return { nip: id, relation };
      });
  const extra = [
    ...fromCorpus(meta.mentions, "see-also"),
    ...fromCorpus(meta.mentionedBy, "used-by"),
  ];
  return [...curated, ...extra].sort(
    (a, b) => RELATION_ORDER.indexOf(a.relation) - RELATION_ORDER.indexOf(b.relation),
  );
};

/** Entries grouped by relation, in RELATION_ORDER, empty groups omitted. */
export const groupRelated = (
  entries: readonly RelatedEntry[],
): readonly { readonly relation: NipRelation; readonly entries: readonly RelatedEntry[] }[] =>
  RELATION_ORDER.flatMap((relation) => {
    const group = entries.filter((e) => e.relation === relation);
    return group.length === 0 ? [] : [{ relation, entries: group }];
  });
