/**
 * Public props of the chart components. All charts are token-themed (series colors
 * `--color-chart-1…8`, grid/axis tokens), responsive (fill container width, fixed aspect),
 * and accessible: `title` is the accessible name and every chart has a toggleable data table
 * fallback (`${testid}-table-toggle`, `${testid}-table`). Root: `data-testid={testid}`.
 */
import type { Locale } from "@nostrschool/i18n";

interface ChartBase {
  readonly testid: string;
  readonly locale: Locale;
  readonly title: string;
  readonly description?: string;
  /** Value formatter; defaults to `formatNumber(locale, v)`. */
  readonly format?: (value: number) => string;
  /** Source/attribution line under the chart (e.g. "Snapshot: 2026-10-01, nostr.watch"). */
  readonly source?: string;
}

export interface Datum {
  readonly id: string;
  readonly label: string;
  readonly value: number;
}

/** Parts: `${testid}-bar-${id}`, `${testid}-label-${id}`, `${testid}-separator` (pinned rule). */
export interface BarChartProps extends ChartBase {
  readonly data: readonly Datum[];
  readonly orientation?: "vertical" | "horizontal";
  readonly xLabel?: string;
  readonly yLabel?: string;
  /** Datum id to emphasize; others are muted. */
  readonly highlight?: string;
  /** Sort descending by value (default false = keep input order). */
  readonly sorted?: boolean;
  /**
   * Datum ids always drawn last, after a dashed rule, whatever the sort (catch-all buckets aren't
   * a peer of the real categories). Default `["other", "unknown"]`; pass `[]` to opt out.
   */
  readonly pinned?: readonly string[];
}

export interface LinePoint {
  /** Date → time scale; number → linear scale. Must be consistent within a chart. */
  readonly x: Date | number;
  readonly y: number;
}

export interface LineSeries {
  readonly id: string;
  readonly label: string;
  readonly points: readonly LinePoint[];
}

/** Parts: `${testid}-series-${id}`, `${testid}-legend`. */
export interface LineChartProps extends ChartBase {
  readonly series: readonly LineSeries[];
  readonly xLabel?: string;
  readonly yLabel?: string;
  /** X tick formatter; defaults to `formatDate(locale, x)` for dates. */
  readonly formatX?: (x: Date | number) => string;
}

export interface TreeNode {
  readonly id: string;
  readonly label: string;
  /** Leaf value; parents sum their children. */
  readonly value?: number;
  readonly children?: readonly TreeNode[];
}

/** Parts: `${testid}-cell-${id}`. */
export interface TreemapProps extends ChartBase {
  readonly root: TreeNode;
}

/** Parts: `${testid}-slice-${id}`, `${testid}-legend`. */
export interface DonutChartProps extends ChartBase {
  readonly data: readonly Datum[];
  /** Big text in the hole, e.g. the total. */
  readonly centerLabel?: string;
}

/** A single big number. Parts: `${testid}-value`, `${testid}-delta`. */
export interface StatTileProps {
  readonly testid: string;
  readonly locale: Locale;
  readonly label: string;
  readonly value: number | string;
  /** Relative change, e.g. 0.12 = +12% (rendered with an up/down arrow + sr text). */
  readonly delta?: number;
  readonly hint?: string;
  readonly format?: (value: number) => string;
}
