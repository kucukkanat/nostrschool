import type { ChapterSlug } from "~/lib/chapters";

/**
 * A chapter as the shell islands need it. Astro precomputes titles and links (with the base path)
 * so islands stay dumb and need no dictionary lookup per chapter.
 */
export interface ChapterLink {
  readonly slug: ChapterSlug;
  readonly nn: string;
  readonly order: number;
  readonly title: string;
  readonly summary: string;
  readonly href: string;
}
