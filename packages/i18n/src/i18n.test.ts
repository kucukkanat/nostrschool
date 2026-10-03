import { describe, expect, test } from "bun:test";
import {
  format,
  formatNumber,
  GLOSSARY_IDS,
  getDictionary,
  getGlossary,
  getGlossaryEntry,
  isGlossaryId,
  isLocale,
  LOCALES,
  plural,
  useTranslations,
} from "./index.ts";

/** Collects every leaf path so we can compare locale shapes at runtime too. */
const leafPaths = (node: unknown, prefix = ""): string[] =>
  typeof node === "object" && node !== null
    ? Object.entries(node).flatMap(([k, v]) => leafPaths(v, `${prefix}${k}.`))
    : [prefix.slice(0, -1)];

describe("dictionaries", () => {
  test("every locale has exactly the English keys", () => {
    const enKeys = leafPaths(getDictionary("en")).sort();
    for (const locale of LOCALES) expect(leafPaths(getDictionary(locale)).sort()).toEqual(enKeys);
  });
  test("t() interpolates and fails loud on non-string keys", () => {
    const t = useTranslations("en");
    expect(t("common.chapter.chapter", { n: 3 })).toBe("Chapter 3");
    expect(t("chapters.ch02.title")).toBe("Identity is a keypair");
    // @ts-expect-error — not a string leaf
    expect(() => t("common.nav")).toThrow();
  });
  test("format keeps unknown placeholders visible", () => {
    expect(format("{a} {b}", { a: 1 })).toBe("1 {b}");
    expect(format("plain")).toBe("plain");
  });
  test("plural", () => {
    const m = { one: "{count} item", other: "{count} items", zero: "nothing" };
    expect(plural("en", 1, m)).toBe("1 item");
    expect(plural("en", 2, m)).toBe("2 items");
    expect(plural("en", 0, m)).toBe("nothing");
    expect(plural("es", 0, { one: "{count} x", other: "{count} xs" })).toBe("0 xs");
  });
  test("intl helpers and guards", () => {
    expect(formatNumber("en", 1234.5)).toBe("1,234.5");
    expect(isLocale("es")).toBe(true);
    expect(isLocale("fr")).toBe(false);
  });
});

describe("glossary", () => {
  test("every locale defines every id, ids are unique", () => {
    expect(new Set(GLOSSARY_IDS).size).toBe(GLOSSARY_IDS.length);
    for (const locale of LOCALES)
      expect(Object.keys(getGlossary(locale)).sort()).toEqual([...GLOSSARY_IDS].sort());
    expect(getGlossaryEntry("en", "relay").term).toBe("Relay");
    expect(isGlossaryId("relay")).toBe(true);
    expect(isGlossaryId("nope")).toBe(false);
  });
});
