import { describe, expect, test } from "bun:test";

// Guards the chapter's quiz set: both locales stay in sync, and the quizzes test filter skills
// (ch04 already quizzes EOSE/limit, so ch05 must not drift back to re-testing it).
const read = (locale: "en" | "es"): Promise<string> =>
  Bun.file(new URL(`../../../content/chapters/${locale}/05-filters.mdx`, import.meta.url)).text();

const quizIds = (mdx: string): readonly string[] =>
  [...mdx.matchAll(/testid="(ch05-quiz-[\w-]+)"/g)].map((m) => m[1] ?? "");

const correctIds = (mdx: string): readonly string[] =>
  [...mdx.matchAll(/\{ id: "(\w+)", [^\n]*correct: true/g)].map((m) => m[1] ?? "");

describe.each(["en", "es"] as const)("05-filters.mdx (%s)", (locale) => {
  test("quizzes cover AND/OR, tag filters and time windows, not EOSE", async () => {
    const mdx = await read(locale);
    expect(quizIds(mdx)).toEqual(["ch05-quiz-and-or", "ch05-quiz-tags", "ch05-quiz-window"]);
  });

  test("the time-window quiz's correct answer is since", async () => {
    expect(correctIds(await read(locale))).toEqual(["mixed", "e", "since"]);
  });
});
