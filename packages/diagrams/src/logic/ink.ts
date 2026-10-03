/**
 * Riso "ink" geometry for SVG. SVG attributes need numbers, so the brand's CSS-only tokens
 * (small radii, hard offset shadows) are read once here and shared by every diagram.
 */
import { themes, tokens } from "@nostrschool/tokens";

/** A px token as a number; a non-px token is a config bug, so it fails loudly at import. */
export const parsePx = (value: string): number => {
  const n = Number.parseFloat(value);
  if (!Number.isFinite(n)) throw new Error(`[diagrams] expected a px token, got "${value}"`);
  return n;
};

/** Corner radius of stamps and small chips (`--radius-sm`). */
export const INK_RADIUS = parsePx(tokens.radius.sm);
/** Corner radius of lane heads and step boxes (`--radius-md`). */
export const BOX_RADIUS = parsePx(tokens.radius.md);
/** Offset of a small hard shadow (`--shadow-pop-sm`'s x offset). */
export const SHADOW_SM = parsePx(themes.light.shadow.popSm);
/** Offset of the regular hard shadow / orange misregistration (`--shadow-pop`). */
export const SHADOW = parsePx(themes.light.shadow.pop);
/** Halftone screen for SVG `<pattern>` fills (`--size-halftone-cell` / `--size-halftone-dot`). */
export const HALFTONE_CELL = parsePx(tokens.size.halftoneCell);
export const HALFTONE_DOT = parsePx(tokens.size.halftoneDot);
