/**
 * The course outline. Single source for routes, nav, prev/next and E2E.
 * URL: /<locale>/learn/<slug>/ · MDX: src/content/chapters/<locale>/<dir>.mdx ·
 * components: src/components/chapters/<dir>/ · strings: getDictionary(locale).chapters[key]
 */
import type { ChapterKey } from "@nostrschool/i18n";

export const CHAPTER_SLUGS = [
  "why-nostr",
  "keys",
  "events",
  "relays",
  "filters",
  "kinds",
  "social-graph",
  "private-messages",
  "zaps",
  "signing",
  "ecosystem",
  "trade-offs",
] as const;

export type ChapterSlug = (typeof CHAPTER_SLUGS)[number];

export interface ChapterRef {
  /** 1-based order. */
  readonly order: number;
  readonly slug: ChapterSlug;
  /** Two-digit number, e.g. "02". */
  readonly nn: string;
  /** Folder/file stem, e.g. "02-keys". */
  readonly dir: string;
  /** i18n dictionary key, e.g. "ch02". */
  readonly key: ChapterKey;
}

const toRef = (slug: ChapterSlug, i: number): ChapterRef => {
  const nn = String(i + 1).padStart(2, "0");
  return { order: i + 1, slug, nn, dir: `${nn}-${slug}`, key: `ch${nn}` as ChapterKey };
};

// Non-empty tuple type, so `CHAPTERS[0]` is a ChapterRef (no runtime emptiness checks downstream).
const [firstSlug, ...restSlugs] = CHAPTER_SLUGS;
export const CHAPTERS: readonly [ChapterRef, ...ChapterRef[]] = [
  toRef(firstSlug, 0),
  ...restSlugs.map((slug, i) => toRef(slug, i + 1)),
];

export const getChapter = (slug: string): ChapterRef | undefined =>
  CHAPTERS.find((c) => c.slug === slug);

/** Previous and next chapters for navigation. */
export const neighbors = (
  slug: ChapterSlug,
): { readonly prev?: ChapterRef; readonly next?: ChapterRef } => {
  const i = CHAPTERS.findIndex((c) => c.slug === slug);
  const prev = CHAPTERS[i - 1];
  const next = CHAPTERS[i + 1];
  return { ...(prev ? { prev } : {}), ...(next ? { next } : {}) };
};
