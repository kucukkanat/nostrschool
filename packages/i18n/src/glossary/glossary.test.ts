import { describe, expect, test } from "bun:test";
import {
  GLOSSARY_CHAPTERS,
  GLOSSARY_IDS,
  getDictionary,
  getGlossary,
  isGlossaryId,
  LOCALES,
} from "../index.ts";

// Data-integrity checks for the glossary content (the glossary page also checks some at build time).
describe("glossary content", () => {
  for (const locale of LOCALES) {
    test(`${locale}: every term has a term, short and long text`, () => {
      const glossary = getGlossary(locale);
      for (const id of GLOSSARY_IDS) {
        const entry = glossary[id];
        expect(entry?.term.trim()).not.toBe("");
        expect(entry?.short.trim()).not.toBe("");
        expect(entry?.long.trim()).not.toBe("");
      }
    });
  }

  test("see-also links are valid, unique and never self-referential", () => {
    for (const id of GLOSSARY_IDS) {
      const seeAlso = getGlossary("en")[id]?.seeAlso ?? [];
      expect(seeAlso.every(isGlossaryId)).toBe(true);
      expect(seeAlso).not.toContain(id);
      expect(new Set(seeAlso).size).toBe(seeAlso.length);
    }
  });

  test("NIP references are two-character identifiers", () => {
    for (const id of GLOSSARY_IDS)
      for (const nip of getGlossary("en")[id]?.nips ?? []) expect(nip).toMatch(/^[0-9A-F]{2}$/);
  });

  test("translations keep the same see-also and NIP lists as English", () => {
    for (const locale of LOCALES)
      for (const id of GLOSSARY_IDS) {
        expect(getGlossary(locale)[id]?.seeAlso).toEqual(getGlossary("en")[id]?.seeAlso);
        expect(getGlossary(locale)[id]?.nips).toEqual(getGlossary("en")[id]?.nips);
      }
  });

  test("every term maps to a real chapter", () => {
    const chapters = Object.keys(getDictionary("en").chapters);
    for (const id of GLOSSARY_IDS) expect(chapters).toContain(GLOSSARY_CHAPTERS[id]);
  });
});
