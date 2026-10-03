# @nostrschool/i18n

Locales (`en` default, `es`), typed dictionaries and the glossary. English is the source of truth:
every `es` file is typed `typeof en…`, so a missing or extra key is a **type error**, not a blank
string in production.

Every snippet below is runnable from `packages/i18n` (`bun -e '<snippet>'`, or paste into a `.ts`
file) and is executed by `src/readme.test.ts`, which compares each `console.log` against its
`// →` comment — so the README cannot drift from the code.

## Locales

```ts
import { DEFAULT_LOCALE, LOCALES, LOCALE_NAMES, LOCALE_TAGS, fallbackLocale, isLocale } from "@nostrschool/i18n";

console.log(LOCALES.join(","));        // → en,es
console.log(DEFAULT_LOCALE);           // → en
console.log(LOCALE_NAMES.es);          // → Español
console.log(LOCALE_TAGS.es);           // → es-ES
// Narrow untrusted input (route params, localStorage) before using it as a Locale.
console.log(isLocale("es"));           // → true
console.log(isLocale("fr"));           // → false
// Untranslated content (e.g. an MDX chapter with no es file) falls back to English.
console.log(fallbackLocale("es"));     // → en
```

## Reading strings

`getDictionary` is preferred in components: plain property access, autocompleted and type-checked.
`useTranslations` is for string keys (e.g. keys stored in data) and interpolates `{param}`s.

```ts
import { format, getDictionary, useTranslations } from "@nostrschool/i18n";

const dict = getDictionary("es");
console.log(dict.ui.copy.copied);                             // → ¡Copiado!

const t = useTranslations("en");
console.log(t("common.chapter.chapter", { n: 3 }));          // → Chapter 3
console.log(useTranslations("es")("common.chapter.chapter", { n: 3 })); // → Capítulo 3

// Unknown placeholders stay visible so they're caught in QA instead of silently vanishing.
console.log(format("Hi {name}, {missing}", { name: "Alice" })); // → Hi Alice, {missing}
```

A key that is not a string at runtime (e.g. `t("common.nav" as never)`) throws — fail loud.

## Plurals and formatting

`plural(locale, count, message, params?)` picks the form with `Intl.PluralRules` and injects
`{count}`. A `PluralMessage` is `{ one, other, zero? }`; `zero` wins when `count === 0`.

```ts
import { formatDate, formatNumber, getDictionary, plural } from "@nostrschool/i18n";

const items = getDictionary("en").ui.json.items;              // { one: "{count} item", other: "{count} items" }
console.log(plural("en", 1, items));                          // → 1 item
console.log(plural("en", 2, items));                          // → 2 items
console.log(plural("es", 1, getDictionary("es").ui.json.items)); // → 1 elemento
console.log(plural("en", 0, { zero: "No relays", one: "{count} relay", other: "{count} relays" })); // → No relays
// Extra params are interpolated alongside {count}.
console.log(plural("en", 3, { one: "{count} note by {who}", other: "{count} notes by {who}" }, { who: "fiatjaf" })); // → 3 notes by fiatjaf

console.log(formatNumber("en", 1234567.891));                 // → 1,234,567.891
console.log(formatNumber("es", 1234567.891));                 // → 1.234.567,891
console.log(formatNumber("en", 0.42, { style: "percent" }));  // → 42%
// Default is { dateStyle: "medium" }; pass a timeZone when output must be deterministic.
console.log(formatDate("en", Date.UTC(2009, 0, 3), { dateStyle: "medium", timeZone: "UTC" })); // → Jan 3, 2009
```

## Glossary

```ts
import { GLOSSARY_CHAPTERS, GLOSSARY_IDS, getGlossary, getGlossaryEntry, isGlossaryId } from "@nostrschool/i18n";

console.log(GLOSSARY_IDS.includes("relay"));                  // → true
console.log(getGlossaryEntry("en", "relay").term);            // → Relay
console.log(getGlossary("es").relay.seeAlso?.[0]);            // → client
console.log(GLOSSARY_CHAPTERS.relay);                         // → ch04
// Narrow untrusted ids (e.g. a URL hash) before lookup.
console.log(isGlossaryId("relay"), isGlossaryId("blockchain")); // → true false
```

Entries are `{ term, short, long, seeAlso?, nips? }`; `short` is the hover-card text, `long` the
glossary-page body.

## Layout

```
src/locales.ts                       LOCALES, DEFAULT_LOCALE, LOCALE_NAMES, LOCALE_TAGS, isLocale
src/types.ts                         PluralMessage, MessageParams, MessagePath
src/locales/<loc>/{common,ui,diagrams,charts,mascot,kinds}.ts
src/locales/<loc>/chapters/NN.ts     exports chNN = { title, summary, …your keys }
src/locales/<loc>/index.ts           wiring only
src/glossary/{ids,en,es}.ts          GLOSSARY_IDS (final list) + one Glossary per locale
```

## Adding a key

1. Add it to the `en` file you own (e.g. `src/locales/en/chapters/04.ts`). Use `{param}`
   placeholders, or a `{ one, other }` object for counts:

   ```ts
   export const ch04 = {
     title: "Relays",
     summary: "…",
     connected: "Connected to {url}",
     relayCount: { one: "{count} relay", other: "{count} relays" },
   };
   ```

2. Add the **same key** to the matching `es` file with the English text and a `// TODO(es)`
   comment. This minimal, additive edit is the only change non-translators may make in `es`:

   ```ts
   connected: "Connected to {url}", // TODO(es)
   relayCount: { one: "{count} relay", other: "{count} relays" }, // TODO(es)
   ```

3. Read it: `getDictionary(locale).chapters.ch04.connected`, or
   `plural(locale, n, getDictionary(locale).chapters.ch04.relayCount)`.
4. Check: `bun run typecheck` (from the repo root) fails if `en` and `es` disagree.

## Adding a locale

1. Add the code to `LOCALES` and an entry to `LOCALE_NAMES` / `LOCALE_TAGS` in `src/locales.ts`.
2. Copy `src/locales/es/` and `src/glossary/es.ts` to the new code, translate, and keep each file
   typed `typeof en…`.
3. Register the dictionary and glossary in the `dictionaries` / `glossaries` maps in
   `src/index.ts` (both are `Record<Locale, …>`, so the compiler points at what's missing).
4. Add the locale to Astro's `i18n.locales` in `apps/site/astro.config.ts` and add
   `apps/site/src/content/chapters/<loc>/` (missing chapters fall back via `fallbackLocale`).

## Commands

```bash
bun test packages/i18n                 # unit tests (dictionary parity, glossary, README snippets)
bun run --cwd packages/i18n typecheck  # en/es shape parity is enforced here
```
