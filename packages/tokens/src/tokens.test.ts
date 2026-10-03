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
    expect(parseHex("#FF5C39")).toEqual([255, 92, 57]);
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
  test.each(CONTRAST_PAIRS.focusFills.map((f) => [f]))("focus ring or halo on %s ≥ 3", (fill) => {
    const best = Math.max(
      contrastRatio(color.focusRing, color[fill]),
      contrastRatio(color.focusHalo, color[fill]),
    );
    expect(best).toBeGreaterThanOrEqual(AA.nonText);
  });
  test.each(
    CONTRAST_PAIRS.outlinedFills.flatMap((f) =>
      (["bg", "surface", "surfaceRaised"] as const).map((s) => [f, s] as const),
    ),
  )("fill %s separates from %s (itself or via its ink outline) ≥ 3", (fill, surface) => {
    const best = Math.max(
      contrastRatio(color[fill], color[surface]),
      contrastRatio(color.borderStrong, color[fill]),
    );
    expect(best).toBeGreaterThanOrEqual(AA.nonText);
  });
});

/** The brand bans purple/violet/indigo: no emitted colour may sit in that hue band. */
const hue = (hex: string): { readonly h: number; readonly s: number } => {
  const rgb = parseHex(hex);
  if (rgb === undefined) throw new TypeError(hex);
  const [r, g, b] = rgb.map((c) => c / 255) as unknown as readonly [number, number, number];
  const max = Math.max(r, g, b);
  const d = max - Math.min(r, g, b);
  if (d === 0) return { h: 0, s: 0 };
  const h = max === r ? ((g - b) / d + 6) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return { h: h * 60, s: d / max };
};

describe.each(["light", "dark"] as const)("%s theme has no purple", (theme) => {
  test.each(Object.entries(themes[theme].color).filter(([, v]) => parseHex(v) !== undefined))(
    "%s (%s) is outside the 235°–320° band",
    (_name, value) => {
      const { h, s } = hue(value);
      expect(s < 0.15 || h < 235 || h > 320).toBe(true);
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
  test("brand fonts and print textures ship; old fonts are gone", () => {
    expect(css).toContain('--font-family-display: "Bricolage Grotesque Variable"');
    expect(css).toContain('--font-family-mono: "JetBrains Mono Variable"');
    expect(css).not.toMatch(/Fredoka|Nunito/);
    expect(css).toContain("--pattern-grain: url(");
    expect(css).toContain("--pattern-halftone:");
    expect(tokens.pattern.highlight).toContain("var(--color-highlight)");
  });
  test("shadows are hard offsets: no blur radius anywhere", () => {
    for (const theme of ["light", "dark"] as const)
      for (const value of Object.values(themes[theme].shadow))
        expect(value).toMatch(/^-?\d+(px)? -?\d+(px)? 0 (0|2px) /);
  });
  test("fluid type sizes use rem + vw so zoom keeps working", () => {
    expect(tokens.font.size["4xl"]).toMatch(
      /^clamp\(\d[\d.]*rem, [\d.]+rem \+ [\d.]+vw, [\d.]+rem\)$/,
    );
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
