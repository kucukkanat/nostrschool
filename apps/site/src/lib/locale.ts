import { isLocale, LOCALES, type Locale } from "@nostrschool/i18n";

/** getStaticPaths for `[locale]` routes. */
export const localeStaticPaths = () => LOCALES.map((locale) => ({ params: { locale } }));

/** Narrows `Astro.params.locale`; throws at build time on anything unexpected (fail loud). */
export const assertLocale = (value: string | undefined): Locale => {
  if (!isLocale(value)) throw new Error(`Unknown locale route param: ${String(value)}`);
  return value;
};
