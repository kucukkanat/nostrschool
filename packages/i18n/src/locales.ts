export const LOCALES = ["en", "es"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

/** Each locale's name in its own language (for the language switcher). */
export const LOCALE_NAMES: Readonly<Record<Locale, string>> = { en: "English", es: "Español" };

/** BCP-47 tags for Intl APIs. */
export const LOCALE_TAGS: Readonly<Record<Locale, string>> = { en: "en-US", es: "es-ES" };

export const isLocale = (value: unknown): value is Locale =>
  typeof value === "string" && (LOCALES as readonly string[]).includes(value);
