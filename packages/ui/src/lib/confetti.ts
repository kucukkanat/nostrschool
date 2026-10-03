/**
 * Celebration burst for copy/quiz success. canvas-confetti needs literal colors, so we resolve
 * the theme's token custom properties at fire time (keeps it themeable and token-only).
 */
import { prefersReducedMotion } from "../motion.ts";

/** The riso ink set: orange, teal, blue, marker yellow. */
export const CONFETTI_COLOR_VARS = [
  "--color-primary",
  "--color-secondary",
  "--color-accent",
  "--color-highlight",
] as const;

/** Resolved token colors; empty entries (tokens CSS not loaded) are dropped. */
export const themeColors = (
  names: readonly string[] = CONFETTI_COLOR_VARS,
  root: Element = document.documentElement,
): readonly string[] => {
  const style = getComputedStyle(root);
  return names.map((n) => style.getPropertyValue(n).trim()).filter((c) => c !== "");
};

export type BurstOutcome = "fired" | "reduced-motion" | "no-theme" | "no-canvas";

/** canvas-confetti options for a burst centered on `rect` (pure, so it's testable without a canvas). */
export const burstOptions = (
  rect: Pick<DOMRect, "left" | "top" | "width" | "height">,
  colors: readonly string[],
  viewport: { readonly width: number; readonly height: number },
) => ({
  particleCount: 40,
  spread: 70,
  startVelocity: 25,
  scalar: 0.8,
  ticks: 120,
  colors: [...colors],
  // Flat paper squares (no 3D wobble): torn-up riso scraps rather than glossy party confetti.
  shapes: ["square" as const],
  flat: true,
  disableForReducedMotion: true,
  origin: {
    x: (rect.left + rect.width / 2) / viewport.width,
    y: (rect.top + rect.height / 2) / viewport.height,
  },
});

/** Fires from the element's center. Lazy-loads the library so it never ships in the SSR path. */
export const burstFrom = async (el: Element): Promise<BurstOutcome> => {
  if (prefersReducedMotion()) return "reduced-motion";
  const colors = themeColors();
  // Without resolved tokens we'd fall back to the library's palette: skip instead of going off-brand.
  if (colors.length === 0) return "no-theme";
  // Without a 2D context (canvas blocked, context exhausted, non-browser DOM) the library throws on
  // every animation frame; a celebration isn't worth uncaught errors, so report and skip.
  if (document.createElement("canvas").getContext("2d") === null) return "no-canvas";
  const { default: confetti } = await import("canvas-confetti");
  await confetti(
    burstOptions(el.getBoundingClientRect(), colors, { width: innerWidth, height: innerHeight }),
  );
  return "fired";
};
