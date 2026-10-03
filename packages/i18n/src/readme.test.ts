import { describe, expect, test } from "bun:test";
import { dirname, join } from "node:path";

// Runs every README snippet that imports the package in a real `bun` subprocess (no mocks) and
// checks each `console.log(...) // → expected` line, so documented output can't drift from the code.
const packageDir = join(dirname(import.meta.path), "..");
const readme = await Bun.file(join(packageDir, "README.md")).text();

const snippets = [...readme.matchAll(/```ts\n([\s\S]*?)```/g)]
  .map((match) => match[1] ?? "")
  .filter((code) => code.includes('from "@nostrschool/i18n"'));

const expectedOutput = (code: string): string[] =>
  [...code.matchAll(/console\.log\(.*\/\/ → (.*)$/gm)].map((match) => match[1] ?? "");

describe("README snippets", () => {
  test("covers the documented sections", () => {
    expect(snippets.length).toBe(4);
  });

  for (const [index, code] of snippets.entries()) {
    test(`snippet ${index + 1} runs and prints what it documents`, () => {
      const run = Bun.spawnSync(["bun", "-e", code], { cwd: packageDir, stderr: "pipe" });
      expect(run.stderr.toString()).toBe("");
      expect(run.exitCode).toBe(0);
      expect(run.stdout.toString().trimEnd().split("\n")).toEqual(expectedOutput(code));
    });
  }
});
