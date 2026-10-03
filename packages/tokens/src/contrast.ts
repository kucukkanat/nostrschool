/** WCAG 2.x contrast math, used by tests to keep both themes AA-compliant. */

/** Parses `#RGB` / `#RRGGBB` into 0–255 channels, or `undefined` for anything else. */
export const parseHex = (hex: string): readonly [number, number, number] | undefined => {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  const digits = m?.[1];
  if (digits === undefined) return undefined;
  const full = digits.length === 3 ? [...digits].map((d) => d + d).join("") : digits;
  return [0, 2, 4].map((i) => Number.parseInt(full.slice(i, i + 2), 16)) as unknown as readonly [
    number,
    number,
    number,
  ];
};

const channel = (c: number): number => {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};

/** WCAG relative luminance of a hex color (0 = black, 1 = white). Throws on non-hex input. */
export const relativeLuminance = (hex: string): number => {
  const rgb = parseHex(hex);
  if (rgb === undefined) throw new TypeError(`Not a hex color: ${hex}`);
  const [r, g, b] = rgb;
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
};

/** WCAG contrast ratio between two hex colors, from 1 to 21. */
export const contrastRatio = (a: string, b: string): number => {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x) as [
    number,
    number,
  ];
  return (hi + 0.05) / (lo + 0.05);
};

/** AA thresholds: 4.5 for body text, 3 for large text and non-text UI (borders, chart marks). */
export const AA = { text: 4.5, nonText: 3 } as const;
