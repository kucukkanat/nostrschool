/**
 * Glossary lookup for hover-cards. Entries are authored concurrently (and translations lag), so a
 * term may have no definition yet: we degrade to the English definition, then to a "pending"
 * card that still shows the term name and the glossary link, never a blank or a crash.
 */
import {
  DEFAULT_LOCALE,
  type GlossaryEntry,
  type GlossaryId,
  getGlossaryEntry,
  type Locale,
} from "@nostrschool/i18n";

export type TermCard =
  | {
      readonly status: "ok";
      readonly term: string;
      readonly short: string;
      readonly source: Locale;
    }
  | { readonly status: "pending"; readonly term: string };

// The type says every id has an entry, but files are edited in parallel: treat runtime gaps as real.
const lookup = (locale: Locale, id: GlossaryId): GlossaryEntry | undefined =>
  getGlossaryEntry(locale, id) as GlossaryEntry | undefined;

const hasText = (s: string | undefined): s is string => s !== undefined && s.trim() !== "";

export const resolveTerm = (locale: Locale, id: GlossaryId): TermCard => {
  const local = lookup(locale, id);
  const fallback = lookup(DEFAULT_LOCALE, id);
  const term = [local?.term, fallback?.term].find(hasText) ?? id;
  if (hasText(local?.short)) return { status: "ok", term, short: local.short, source: locale };
  if (hasText(fallback?.short))
    return { status: "ok", term, short: fallback.short, source: DEFAULT_LOCALE };
  return { status: "pending", term };
};
