/** Pure helpers shared by charts (unit-testable). */
import { tokens, vars } from "@nostrschool/tokens";
import { scaleLinear } from "d3";

const PALETTE = [
  vars.color.chart1,
  vars.color.chart2,
  vars.color.chart3,
  vars.color.chart4,
  vars.color.chart5,
  vars.color.chart6,
  vars.color.chart7,
  vars.color.chart8,
] as const;

/** Series color for the i-th series (cycles through the 8 chart tokens). */
export const seriesColor = (index: number): string =>
  PALETTE[((index % PALETTE.length) + PALETTE.length) % PALETTE.length] ?? vars.color.chart1;

/**
 * "Nice" upper bound for a value axis (d3's nice rounding of [0, max]).
 * Empty, all-zero or all-negative input yields 1 so a scale never collapses to a point.
 */
export const niceMax = (values: readonly number[]): number => {
  const max = values.reduce((m, v) => (Number.isFinite(v) && v > m ? v : m), 0);
  return max <= 0 ? 1 : (scaleLinear().domain([0, max]).nice().domain()[1] ?? max);
};

type SpaceName = keyof typeof tokens.space;

/** A spacing token as a px number — SVG geometry needs numbers, but margins stay token-driven. */
export const spacePx = (name: SpaceName): number => Number.parseFloat(tokens.space[name]);

/** Direction of a relative change; tiny float noise (|δ| < 0.05%) reads as "flat". */
export const deltaTone = (delta: number): "up" | "down" | "flat" =>
  delta > 0.0005 ? "up" : delta < -0.0005 ? "down" : "flat";
