/**
 * @nostrschool/i18n — locales, typed dictionaries and the glossary.
 *
 * English is the source of truth; every other locale's files are typed as `typeof en…`, so a
 * missing or extra key is a type error. Components are locale-agnostic and take a `locale` prop.
 */

import { glossaryEn } from "./glossary/en.ts";
import { glossaryEs } from "./glossary/es.ts";
import {
  GLOSSARY_IDS,
  type Glossary,
  type GlossaryEntry,
  type GlossaryId,
} from "./glossary/ids.ts";
import { en } from "./locales/en/index.ts";
import { es } from "./locales/es/index.ts";
import { DEFAULT_LOCALE, LOCALE_TAGS, type Locale } from "./locales.ts";
import { type NipStrings, nipRange, nipStringsKey } from "./nips.ts";
import type { MessageParams, MessagePath, PluralMessage } from "./types.ts";

/** Which chapter teaches each glossary term (powers the glossary page's chapter filter). */
export { GLOSSARY_CHAPTERS } from "./glossary/en.ts";
export {
  DEFAULT_LOCALE,
  isLocale,
  LOCALE_NAMES,
  LOCALE_TAGS,
  LOCALES,
  type Locale,
} from "./locales.ts";
export {
  NIP_RANGES,
  type NipRange,
  type NipStrings,
  type NipStringsRange,
  nipRange,
  nipStringsKey,
} from "./nips.ts";
export type { MessageParams, MessagePath, PluralMessage } from "./types.ts";
export { GLOSSARY_IDS, type Glossary, type GlossaryEntry, type GlossaryId };

/** The full message tree. Shape = English dictionary. */
export type Dictionary = typeof en;
/** Every string message key, e.g. "common.nav.learn" or "chapters.ch02.title". */
export type MessageKey = MessagePath<Dictionary>;
/** Chapter dictionary keys: "ch01" … "ch12". */
export type ChapterKey = keyof Dictionary["chapters"];

const dictionaries: Readonly<Record<Locale, Dictionary>> = { en, es };
const glossaries: Readonly<Record<Locale, Glossary>> = { en: glossaryEn, es: glossaryEs };

/** The whole typed dictionary for a locale — the most ergonomic way to read strings in components. */
export const getDictionary = (locale: Locale): Dictionary => dictionaries[locale];

/** Replaces `{name}` placeholders. Unknown placeholders are left intact so they're visible in QA. */
export const format = (template: string, params?: MessageParams): string =>
  params === undefined
    ? template
    : template.replace(/\{(\w+)\}/g, (match, name: string) => {
        const value = params[name];
        return value === undefined ? match : String(value);
      });

const lookup = (dict: Dictionary, key: string): unknown =>
  key
    .split(".")
    .reduce<unknown>(
      (node, part) =>
        typeof node === "object" && node !== null
          ? (node as Record<string, unknown>)[part]
          : undefined,
      dict,
    );

/**
 * Returns a `t(key, params?)` bound to a locale. Keys are type-checked; a key that resolves to
 * a non-string at runtime throws (fail loud — it means the dictionary is malformed).
 */
export const useTranslations =
  (locale: Locale) =>
  (key: MessageKey, params?: MessageParams): string => {
    const value = lookup(dictionaries[locale], key);
    if (typeof value !== "string")
      throw new Error(`i18n: "${key}" is not a string in locale "${locale}"`);
    return format(value, params);
  };

/** Picks the plural form via Intl.PluralRules and interpolates `{count}` (plus extra params). */
export const plural = (
  locale: Locale,
  count: number,
  message: PluralMessage,
  params?: MessageParams,
): string => {
  const form =
    count === 0 && message.zero !== undefined
      ? message.zero
      : new Intl.PluralRules(LOCALE_TAGS[locale]).select(count) === "one"
        ? message.one
        : message.other;
  return format(form, { count, ...params });
};

export const formatNumber = (
  locale: Locale,
  value: number,
  options?: Intl.NumberFormatOptions,
): string => new Intl.NumberFormat(LOCALE_TAGS[locale], options).format(value);

export const formatDate = (
  locale: Locale,
  date: Date | number,
  options?: Intl.DateTimeFormatOptions,
): string =>
  new Intl.DateTimeFormat(LOCALE_TAGS[locale], options ?? { dateStyle: "medium" }).format(date);

export const getGlossary = (locale: Locale): Glossary => glossaries[locale];

export const getGlossaryEntry = (locale: Locale, id: GlossaryId): GlossaryEntry =>
  glossaries[locale][id];

export const isGlossaryId = (value: unknown): value is GlossaryId =>
  typeof value === "string" && (GLOSSARY_IDS as readonly string[]).includes(value);

/** Locale to fall back to for untranslated content (MDX chapters). */
export const fallbackLocale = (_locale: Locale): Locale => DEFAULT_LOCALE;

/**
 * Strings for one NIP ("01", "7D") from its range file, or undefined when the id has no entry
 * (a NIP added by a newer snapshot before its strings were written).
 */
export const getNipStrings = (locale: Locale, id: string): NipStrings | undefined => {
  const range: { readonly [key: string]: NipStrings } = dictionaries[locale].nips[nipRange(id)];
  return range[nipStringsKey(id)];
};
