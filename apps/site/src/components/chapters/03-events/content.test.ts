import { describe, expect, test } from "bun:test";

// Guards facts stated in the chapter prose/quizzes against drifting from reality.
const read = (locale: "en" | "es"): Promise<string> =>
  Bun.file(new URL(`../../../content/chapters/${locale}/03-events.mdx`, import.meta.url)).text();

const MONTHS = { en: "January", es: "enero" } as const;

describe.each(["en", "es"] as const)("03-events.mdx (%s)", (locale) => {
  test("quiz timestamp matches the date it is labelled with", async () => {
    const match = /created_at = (\d+) \((\d+) (?:de )?(\w+) (?:de )?(\d{4})\)/.exec(
      await read(locale),
    );
    if (match === null) throw new Error("ch03-quiz-time timestamp not found");
    const [, ts, day, month, year] = match;
    const date = new Date(Number(ts) * 1000);
    expect([date.getUTCDate(), month, date.getUTCFullYear()]).toEqual([
      Number(day),
      MONTHS[locale],
      Number(year),
    ]);
  });

  test("correct quiz answers do not all sit in the same position", async () => {
    const correct = [
      ...(await read(locale)).matchAll(/\{ id: "([abc])", [^\n]*correct: true/g),
    ].map((m) => m[1]);
    expect(correct).toHaveLength(3);
    expect(new Set(correct).size).toBeGreaterThan(1);
  });
});
