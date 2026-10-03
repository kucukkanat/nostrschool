import { expect, test } from "bun:test";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { CHAPTERS, getChapter, neighbors } from "../src/lib/chapters.ts";

const root = join(import.meta.dir, "..", "src");

test("12 chapters with consistent ids", () => {
  expect(CHAPTERS).toHaveLength(12);
  expect(CHAPTERS[1]).toEqual({ order: 2, slug: "keys", nn: "02", dir: "02-keys", key: "ch02" });
  expect(getChapter("zaps")?.nn).toBe("09");
  expect(getChapter("nope")).toBeUndefined();
});

test("prev/next", () => {
  expect(neighbors("why-nostr").prev).toBeUndefined();
  expect(neighbors("why-nostr").next?.slug).toBe("keys");
  expect(neighbors("trade-offs").next).toBeUndefined();
});

test.each(["en", "es"])("every chapter has %s MDX and a component dir", (locale) => {
  const mdx = readdirSync(join(root, "content/chapters", locale)).sort();
  expect(mdx).toEqual(CHAPTERS.map((c) => `${c.dir}.mdx`));
  const dirs = readdirSync(join(root, "components/chapters")).sort();
  expect(dirs).toEqual(CHAPTERS.map((c) => c.dir));
});
