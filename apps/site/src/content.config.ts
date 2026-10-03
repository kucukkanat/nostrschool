import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { CHAPTER_SLUGS } from "./lib/chapters.ts";

/**
 * Chapters: one MDX file per locale, id = "<locale>/<NN-slug>" (e.g. "en/02-keys").
 * We set generateId because the glob loader would otherwise use the frontmatter `slug`,
 * which is identical across locales.
 */
const chapters = defineCollection({
  loader: glob({
    pattern: "**/*.mdx",
    base: "./src/content/chapters",
    generateId: ({ entry }) => entry.replace(/\.mdx$/, ""),
  }),
  schema: z.object({
    order: z.number().int().min(1).max(12),
    slug: z.enum(CHAPTER_SLUGS),
    title: z.string().min(1),
    summary: z.string().min(1),
    estimatedMinutes: z.number().int().positive(),
    /** NIP ids discussed, e.g. ["01", "19"]. */
    nips: z.array(z.string().regex(/^[0-9A-F]{2}$/)),
    takeaways: z.array(z.string().min(1)).min(1),
    /** Speech-bubble line for the mascot at the top of the chapter. */
    mascotIntro: z.string().optional(),
  }),
});

export const collections = { chapters };
