/**
 * Build-time only (astro:content): which course chapters teach each NIP, from the English
 * chapters' frontmatter `nips` (the canonical outline; translated chapters mirror it). The
 * mapping itself is the pure, tested `buildCourseMap`.
 */

import { getCollection } from "astro:content";
import { getDictionary, type Locale } from "@nostrschool/i18n";
import { getChapter } from "~/lib/chapters";
import { href } from "~/lib/href";
import type { CourseMap } from "./browse.ts";
import { buildCourseMap } from "./detail.ts";

export const loadCourseMap = async (locale: Locale): Promise<CourseMap> => {
  const dict = getDictionary(locale);
  const chapters = await getCollection("chapters", (e) => e.id.startsWith("en/"));
  return buildCourseMap(
    chapters.flatMap((entry) => {
      const ref = getChapter(entry.data.slug);
      return ref === undefined
        ? []
        : [
            {
              nn: ref.nn,
              title: dict.chapters[ref.key].title,
              href: href(locale, `learn/${ref.slug}`),
              nips: entry.data.nips,
            },
          ];
    }),
  );
};
