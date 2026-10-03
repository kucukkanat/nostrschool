/** Builds the data the shell islands render, from the course outline + dictionary + href helper. */
import { getDictionary, LOCALES, type Locale } from "@nostrschool/i18n";
import { CHAPTERS } from "~/lib/chapters";
import { href, switchLocale } from "~/lib/href";
import type { ChapterLink } from "../types.ts";

export const chapterLinks = (locale: Locale): readonly ChapterLink[] => {
  const dict = getDictionary(locale).chapters;
  return CHAPTERS.map((c) => ({
    slug: c.slug,
    nn: c.nn,
    order: c.order,
    title: dict[c.key].title,
    summary: dict[c.key].summary,
    href: href(locale, `learn/${c.slug}`),
  }));
};

export const TOOL_SLUGS = ["keys", "event-inspector", "filter-playground", "kinds"] as const;
export type ToolSlug = (typeof TOOL_SLUGS)[number];

export interface ToolLink {
  readonly id: ToolSlug | "glossary";
  readonly title: string;
  readonly description: string;
  readonly href: string;
}

const TOOL_KEYS = {
  keys: "keys",
  "event-inspector": "eventInspector",
  "filter-playground": "filterPlayground",
  kinds: "kinds",
} as const satisfies Record<ToolSlug, string>;

/** The four tools plus the glossary, which is reference material of the same flavour. */
export const toolLinks = (locale: Locale): readonly ToolLink[] => {
  const t = getDictionary(locale).common;
  return [
    ...TOOL_SLUGS.map((slug) => ({
      id: slug,
      title: t.tools[TOOL_KEYS[slug]],
      description: t.toolCards[TOOL_KEYS[slug]],
      href: href(locale, `tools/${slug}`),
    })),
    {
      id: "glossary",
      title: t.glossary.title,
      description: t.toolCards.glossary,
      href: href(locale, "glossary"),
    },
  ];
};

/** `<link rel="alternate" hreflang>` targets for the current page in every locale. */
export const alternateLinks = (
  pathname: string,
): readonly { readonly locale: Locale; readonly href: string }[] =>
  LOCALES.map((locale) => ({ locale, href: switchLocale(pathname, locale) }));
