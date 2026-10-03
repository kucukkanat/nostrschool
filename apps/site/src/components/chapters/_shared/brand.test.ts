import { afterEach, describe, expect, test } from "bun:test";
import { getDictionary, LOCALES } from "@nostrschool/i18n";
import { cleanup, render } from "@testing-library/svelte";
import { Glob } from "bun";
import LockGlyph from "./LockGlyph.svelte";

afterEach(cleanup);

const CHAPTERS = new URL("../", import.meta.url).pathname;
const CONTENT = new URL("../../../content/chapters/", import.meta.url).pathname;

const filesIn = async (dir: string, pattern: string): Promise<readonly string[]> =>
  Array.fromAsync(new Glob(pattern).scan({ cwd: dir, absolute: true }));

// Pictographic emoji are decoration in this brand. Functional marks (✓ ✗ ⚡ ✂ ★ ☆ ℹ) are
// text-presentation symbols outside this range, so they stay allowed.
const DECORATIVE_EMOJI = /[\u{1F300}-\u{1FAFF}\u{2728}\u{2B50}]/u;
const CLICHES = /\b(unlock|dive in|embark|seamless|revolutioni[sz]e|journey|magic)\b/i;

const styleOf = (source: string): string => source.slice(source.indexOf("<style>"));

describe("riso brand guards (chapters area)", () => {
  test("chapter components draw no gradients", async () => {
    for (const file of await filesIn(CHAPTERS, "**/*.svelte")) {
      expect({
        file,
        hit: /(linear|radial|conic)-gradient\(/.test(await Bun.file(file).text()),
      }).toEqual({ file, hit: false });
    }
  });

  test("bright fills are never used as a line, stroke or text colour", async () => {
    // primary/secondary/accent are 2.7:1-ish on paper: fills only; lines use the text-* inks.
    const misuse =
      /(?:^|\s)(?:border[a-z-]*|stroke|outline[a-z-]*|color|accent-color|text-decoration[a-z-]*):[^;]*var\(--color-(?:primary|secondary|accent)(?:-hover|-active)?\)/m;
    for (const file of await filesIn(CHAPTERS, "**/*.svelte")) {
      const css = styleOf(await Bun.file(file).text());
      expect({ file, hit: misuse.exec(css)?.[0] }).toEqual({ file, hit: undefined });
    }
  });

  test("chapter copy has no decorative emoji or cliché phrasing", async () => {
    for (const file of await filesIn(CONTENT, "*/*.mdx")) {
      const text = await Bun.file(file).text();
      expect({ file, emoji: DECORATIVE_EMOJI.exec(text)?.[0] }).toEqual({ file, emoji: undefined });
      expect({ file, cliche: CLICHES.exec(text)?.[0] }).toEqual({ file, cliche: undefined });
    }
    for (const locale of LOCALES) {
      const chapters = JSON.stringify(getDictionary(locale).chapters);
      expect({ locale, emoji: DECORATIVE_EMOJI.exec(chapters)?.[0] }).toEqual({
        locale,
        emoji: undefined,
      });
    }
  });

  test("chapter components render no decorative emoji", async () => {
    for (const file of await filesIn(CHAPTERS, "**/*.svelte")) {
      const markup = (await Bun.file(file).text()).split("<style>")[0] ?? "";
      expect({ file, emoji: DECORATIVE_EMOJI.exec(markup)?.[0] }).toEqual({
        file,
        emoji: undefined,
      });
    }
  });
});

// iOS Safari zooms the page when a focused field's text is under 16px (--font-size-md).
const TEXT_FIELD = /<(input|textarea|select)\b(?![^>]*type="(?:radio|checkbox|range)")[^>]*>/g;
const SMALL_TYPE = /font-size:\s*var\(--font-size-(?:2xs|xs|sm)\)/;
const FIELD_TYPE = /font-size:\s*var\(--font-size-(?:md|lg|xl)\)/;

/** CSS rule bodies that style this component's text fields, or undefined when it has none. */
const fieldRules = (source: string): readonly string[] | undefined => {
  const markup = source.split("<style>")[0] ?? "";
  const fields = [...markup.matchAll(TEXT_FIELD)];
  if (fields.length === 0) return undefined;
  const names = new Set(
    fields.flatMap((m) => [
      m[1] ?? "",
      ...(/class="([^"]*)"/.exec(m[0])?.[1]?.split(/\s+/) ?? []).map((c) => `.${c}`),
    ]),
  );
  const rules = [...styleOf(source).matchAll(/([^{}]+)\{([^{}]*)\}/g)];
  return rules
    .filter(([, sel = ""]) =>
      sel.split(",").some((part) => {
        const last =
          part
            .trim()
            .split(/[\s>+~]+/)
            .at(-1) ?? "";
        return [...names].some(
          (n) => last === n || last.startsWith(`${n}[`) || last.startsWith(`${n}.`),
        );
      }),
    )
    .map(([, , body = ""]) => body);
};

describe("touch-friendly form fields", () => {
  test("every chapter text field is at least 16px so phones don't zoom on focus", async () => {
    for (const file of await filesIn(CHAPTERS, "**/*.svelte")) {
      const bodies = fieldRules(await Bun.file(file).text());
      if (bodies === undefined) continue;
      expect({ file, small: bodies.some((b) => SMALL_TYPE.test(b)) }).toEqual({
        file,
        small: false,
      });
      expect({ file, sized: bodies.some((b) => FIELD_TYPE.test(b)) }).toEqual({
        file,
        sized: true,
      });
    }
  });
});

describe("copy rhythm", () => {
  // Stacked em-dash asides read as machine-written; colons, commas and full stops do the job.
  test("chapter MDX keeps em-dashes rare (at most one per 2,000 characters)", async () => {
    for (const file of await filesIn(CONTENT, "*/*.mdx")) {
      const text = await Bun.file(file).text();
      const dashes = text.split("\u2014").length - 1;
      expect({ file, tooMany: dashes > Math.floor(text.length / 2000) }).toEqual({
        file,
        tooMany: false,
      });
    }
  });
});

describe("LockGlyph", () => {
  test("draws a closed padlock and an open one when asked", () => {
    const closed = render(LockGlyph, { props: { open: false, testid: "lock-a" } });
    const shut = closed.getByTestId("lock-a");
    expect(shut.getAttribute("data-open")).toBe("false");
    expect(shut.getAttribute("aria-hidden")).toBe("true");
    const shackleShut = shut.querySelector(".shackle")?.getAttribute("d");

    const opened = render(LockGlyph, { props: { open: true, testid: "lock-b" } });
    const open = opened.getByTestId("lock-b");
    expect(open.getAttribute("data-open")).toBe("true");
    expect(open.classList.contains("open")).toBe(true);
    expect(open.querySelector(".shackle")?.getAttribute("d")).not.toBe(shackleShut);
  });
});
