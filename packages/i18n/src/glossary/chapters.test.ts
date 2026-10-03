import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { GLOSSARY_CHAPTERS, glossaryEn } from "./en.ts";
import { GLOSSARY_IDS } from "./ids.ts";

// Guards the "Taught in" mapping against drift: the mapped chapter must actually mention the term.
const CHAPTERS_DIR = join(import.meta.dir, "../../../../apps/site/src/content/chapters/en");
const mdxFor = (key: string): string => {
  const file = readdirSync(CHAPTERS_DIR).find((f) => f.startsWith(`${key.slice(2)}-`));
  if (file === undefined) throw new Error(`No English MDX for chapter ${key}`);
  return readFileSync(join(CHAPTERS_DIR, file), "utf8");
};

describe("GLOSSARY_CHAPTERS", () => {
  for (const id of GLOSSARY_IDS)
    test(`${id} is taught in ${GLOSSARY_CHAPTERS[id]}`, () => {
      const mdx = mdxFor(GLOSSARY_CHAPTERS[id]);
      const mentioned =
        mdx.includes(`<Term id="${id}"`) ||
        mdx.toLowerCase().includes(glossaryEn[id].term.toLowerCase());
      expect(mentioned).toBe(true);
    });
});
