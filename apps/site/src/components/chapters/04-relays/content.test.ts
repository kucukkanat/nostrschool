import { describe, expect, test } from "bun:test";

// Quizzes whose answer is always "a" teach readers to guess; keep the positions varied.
const read = (locale: "en" | "es"): Promise<string> =>
  Bun.file(new URL(`../../../content/chapters/${locale}/04-relays.mdx`, import.meta.url)).text();

describe.each(["en", "es"] as const)("04-relays.mdx (%s)", (locale) => {
  test("correct quiz answers sit in different positions", async () => {
    const correct = [
      ...(await read(locale)).matchAll(/\{ id: "([abc])", [^\n]*correct: true/g),
    ].map((m) => m[1]);
    expect(correct).toEqual(["a", "b", "c"]);
  });
});
