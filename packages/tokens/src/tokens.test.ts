import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  AA,
  CONTRAST_PAIRS,
  contrastRatio,
  cssVar,
  cssVarNames,
  mediaUp,
  parseHex,
  relativeLuminance,
  themes,
  tokens,
  vars,
} from "./index.ts";

describe("contrast math", () => {
  test("parses 3- and 6-digit hex, rejects others", () => {
    expect(parseHex("#fff")).toEqual([255, 255, 255]);
    expect(parseHex("#7A2EF5")).toEqual([122, 46, 245]);
    expect(parseHex("red")).toBeUndefined();
  });
  test("known ratios", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(contrastRatio("#ffffff", "#ffffff")).toBeCloseTo(1, 5);
    expect(relativeLuminance("#000")).toBe(0);
    expect(() => relativeLuminance("rgba(0,0,0,1)")).toThrow(TypeError);
  });
});

describe.each(["light", "dark"] as const)("%s theme meets WCAG AA", (theme) => {
  const color = themes[theme].color;
  test.each(CONTRAST_PAIRS.text.map(([fg, bg]) => [fg, bg]))("text %s on %s ≥ 4.5", (fg, bg) => {
    expect(contrastRatio(color[fg], color[bg])).toBeGreaterThanOrEqual(AA.text);
  });
  test.each(CONTRAST_PAIRS.nonText.map(([fg, bg]) => [fg, bg]))(
    "non-text %s on %s ≥ 3",
    (fg, bg) => {
      expect(contrastRatio(color[fg], color[bg])).toBeGreaterThanOrEqual(AA.nonText);
    },
  );
});

describe("generated output", () => {
  const css = readFileSync(join(import.meta.dir, "generated/tokens.css"), "utf8");
  test("light and dark themes define the same color tokens", () => {
    expect(Object.keys(themes.dark.color).sort()).toEqual(Object.keys(themes.light.color).sort());
  });
  test("dark theme is applied by media query (unless forced light) and by data-theme", () => {
    expect(css).toContain("@media (prefers-color-scheme: dark)");
    expect(css).toContain(':root:not([data-theme="light"])');
    expect(css).toContain(':root[data-theme="dark"]');
  });
  test("reduced motion zeroes durations", () => {
    expect(css).toMatch(/prefers-reduced-motion: reduce[\s\S]*--motion-duration-fast: 0ms/);
  });
  test("every TS css var name exists in the stylesheet; palette stays private", () => {
    for (const name of cssVarNames) expect(css).toContain(`--${name}:`);
    expect(css).not.toContain("--palette-");
  });
  test("typed helpers", () => {
    expect(vars.color.primary).toBe("var(--color-primary)");
    expect(vars.motion.spring.bouncy.stiffness).toBe("var(--motion-spring-bouncy-stiffness)");
    expect(tokens.motion.duration.fast).toBe(120);
    expect(tokens.breakpoint.md).toBe(768);
    expect(cssVar("space-md")).toBe("var(--space-md)");
    expect(cssVar("space-md", "16px")).toBe("var(--space-md, 16px)");
    expect(mediaUp("lg")).toBe("(min-width: 1024px)");
  });
});
