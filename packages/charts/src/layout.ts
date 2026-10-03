/**
 * Pure geometry for every chart: data + container width in, pixel coordinates out.
 * Components only render what these return, so all scale/layout logic is unit-testable
 * without a DOM. Margins come from spacing tokens; the SVG viewBox is 1:1 with CSS pixels.
 */
import { tokens } from "@nostrschool/tokens";
import {
  arc,
  curveMonotoneX,
  hierarchy,
  line,
  pie,
  type ScaleLinear,
  type ScaleTime,
  scaleBand,
  scaleLinear,
  scaleTime,
  treemap,
  treemapSquarify,
} from "d3";
import { spacePx } from "./scales.ts";
import type { Datum, LineSeries, TreeNode } from "./types.ts";

export interface Margin {
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
  readonly left: number;
}
export interface Tick<T = number> {
  readonly value: T;
  readonly pos: number;
}

/** Used until the container has been measured (SSR, tests) — a typical content column. */
export const DEFAULT_WIDTH = Number.parseFloat(tokens.size.content);
const MIN_HEIGHT = Number.parseFloat(tokens.size.diagramMinHeight);
/** Gap between an axis and its tick labels. */
export const AXIS_GAP = spacePx("xs");
/** Baseline offset of labels drawn below the x axis. */
export const LABEL_OFFSET = spacePx("md");
/** Corner radius of bars and treemap cells. */
export const MARK_RADIUS = spacePx("2xs");
/**
 * Shortest bar we draw. A 0 (or near-0) value would otherwise be a 0px rect that still takes
 * keyboard focus — an invisible focus target with no visible ring (WCAG 2.4.7). The stub sits
 * on the baseline; the exact value stays in the aria-label, tooltip and table.
 */
export const MIN_BAR_LENGTH = spacePx("3xs");
/** Approximate glyph width at the axis font size; only used to decide label truncation. */
const CHAR_PX = spacePx("xs") * 0.85;

/** Responsive plot height: 16:9 of the width, never shorter than a diagram, never towering. */
export const plotHeight = (width: number): number =>
  Math.round(Math.min(MIN_HEIGHT * 1.5, Math.max(MIN_HEIGHT, (width * 9) / 16)));

/** Fewer ticks on narrow screens so labels never collide. */
export const tickCount = (width: number): number =>
  width < tokens.breakpoint.sm ? 3 : width < tokens.breakpoint.md ? 5 : 7;

/** Shortens a label to fit `maxPx`, with an ellipsis (full text stays in aria-label/table). */
export const truncate = (label: string, maxPx: number): string => {
  const max = Math.max(1, Math.floor(maxPx / CHAR_PX));
  return label.length <= max ? label : `${label.slice(0, Math.max(1, max - 1))}…`;
};

/** Value scale spanning zero (bars grow from a baseline), niced for readable ticks. */
const valueScale = (values: readonly number[], range: readonly [number, number]) => {
  const lo = Math.min(0, ...values);
  const hi = Math.max(0, ...values);
  return scaleLinear()
    .domain(lo === hi ? [0, 1] : [lo, hi])
    .range(range)
    .nice();
};

const ticksOf = (scale: ScaleLinear<number, number>, count: number): readonly Tick[] =>
  scale.ticks(count).map((value) => ({ value, pos: scale(value) }));

// ---------------------------------------------------------------- bar

export interface Bar extends Datum {
  readonly index: number;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly negative: boolean;
  /** Where a tooltip/value label anchors: the bar's outer end, centered. */
  readonly anchor: { readonly x: number; readonly y: number };
}

export interface BarLayout {
  readonly width: number;
  readonly height: number;
  readonly margin: Margin;
  readonly orientation: "vertical" | "horizontal";
  readonly bars: readonly Bar[];
  readonly categories: readonly (Tick<string> & { readonly id: string })[];
  readonly valueTicks: readonly Tick[];
  /** Pixel position of value 0 on the value axis. */
  readonly baseline: number;
}

export const barLayout = (
  data: readonly Datum[],
  {
    width,
    orientation = "vertical",
    sorted = false,
  }: {
    readonly width: number;
    readonly orientation?: "vertical" | "horizontal";
    readonly sorted?: boolean;
  },
): BarLayout => {
  const rows = sorted ? [...data].sort((a, b) => b.value - a.value) : data;
  const vertical = orientation === "vertical";
  const margin: Margin = vertical
    ? { top: spacePx("md"), right: spacePx("md"), bottom: spacePx("xl"), left: spacePx("2xl") }
    : { top: spacePx("xs"), right: spacePx("2xl"), bottom: spacePx("xl"), left: spacePx("4xl") };
  const height = vertical
    ? plotHeight(width)
    : margin.top + margin.bottom + rows.length * Number.parseFloat(tokens.size.controlMd);
  const band = scaleBand<string>()
    .domain(rows.map((d) => d.id))
    .range(vertical ? [margin.left, width - margin.right] : [margin.top, height - margin.bottom])
    .paddingInner(0.2)
    .paddingOuter(0.1);
  const value = valueScale(
    rows.map((d) => d.value),
    vertical ? [height - margin.bottom, margin.top] : [margin.left, width - margin.right],
  );
  const zero = value(0);
  const bw = band.bandwidth();
  const bars = rows.map((d, index): Bar => {
    const start = band(d.id) ?? 0;
    const end = value(d.value);
    const negative = d.value < 0;
    const length = Math.max(Math.abs(end - zero), MIN_BAR_LENGTH);
    // Grow away from the baseline: up/right for >= 0, down/left for negatives.
    const top = negative ? zero : zero - length;
    const left = negative ? zero - length : zero;
    return vertical
      ? {
          ...d,
          index,
          negative,
          x: start,
          y: top,
          width: bw,
          height: length,
          anchor: { x: start + bw / 2, y: top },
        }
      : {
          ...d,
          index,
          negative,
          x: left,
          y: start,
          width: length,
          height: bw,
          anchor: { x: left + length, y: start + bw / 2 },
        };
  });
  return {
    width,
    height,
    margin,
    orientation,
    bars,
    baseline: zero,
    categories: rows.map((d) => ({
      id: d.id,
      value: truncate(d.label, vertical ? bw : margin.left - spacePx("xs")),
      pos: (band(d.id) ?? 0) + bw / 2,
    })),
    valueTicks: ticksOf(value, tickCount(width)),
  };
};

// ---------------------------------------------------------------- line

export interface LinePointLayout {
  readonly x: Date | number;
  readonly y: number;
  readonly px: number;
  readonly py: number;
}
export interface SeriesLayout {
  readonly id: string;
  readonly label: string;
  readonly index: number;
  readonly d: string;
  readonly points: readonly LinePointLayout[];
}
export interface LineLayout {
  readonly width: number;
  readonly height: number;
  readonly margin: Margin;
  readonly series: readonly SeriesLayout[];
  readonly xTicks: readonly Tick<Date | number>[];
  readonly yTicks: readonly Tick[];
}

export const lineLayout = (
  series: readonly LineSeries[],
  { width, time }: { readonly width: number; readonly time: boolean },
): LineLayout => {
  const height = plotHeight(width);
  const margin: Margin = {
    top: spacePx("md"),
    right: spacePx("lg"),
    bottom: spacePx("xl"),
    left: spacePx("2xl"),
  };
  const xs = series.flatMap((s) => s.points.map((p) => +p.x));
  const lo = Math.min(...xs);
  const hi = Math.max(...xs);
  // A single x would give a zero-width domain; pad it so the point sits mid-plot.
  const [x0, x1] = lo === hi ? [lo - 1, hi + 1] : [lo, hi];
  const range: [number, number] = [margin.left, width - margin.right];
  const xScale: ScaleTime<number, number> | ScaleLinear<number, number> = time
    ? scaleTime()
        .domain([new Date(x0), new Date(x1)])
        .range(range)
    : scaleLinear().domain([x0, x1]).range(range);
  const y = valueScale(
    series.flatMap((s) => s.points.map((p) => p.y)),
    [height - margin.bottom, margin.top],
  );
  const path = line<LinePointLayout>()
    .x((p) => p.px)
    .y((p) => p.py)
    .curve(curveMonotoneX);
  const count = tickCount(width);
  return {
    width,
    height,
    margin,
    series: series.map((s, index) => {
      const points = [...s.points]
        .sort((a, b) => +a.x - +b.x)
        .map((p) => ({ x: p.x, y: p.y, px: xScale(+p.x), py: y(p.y) }));
      return { id: s.id, label: s.label, index, points, d: path(points) ?? "" };
    }),
    xTicks: time
      ? (xScale as ScaleTime<number, number>).ticks(count).map((value) => ({
          value,
          pos: xScale(+value),
        }))
      : ticksOf(xScale as ScaleLinear<number, number>, count),
    yTicks: ticksOf(y, count),
  };
};

// ---------------------------------------------------------------- treemap

export interface TreemapCell {
  readonly id: string;
  readonly label: string;
  readonly value: number;
  readonly index: number;
  /** Ancestor labels below the root, outermost first (for "Group › Leaf" names). */
  readonly path: readonly string[];
  /** Index of the top-level group — cells of one group share a color. */
  readonly group: number;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}
export interface TreemapLayout {
  readonly width: number;
  readonly height: number;
  readonly total: number;
  readonly cells: readonly TreemapCell[];
}

export const treemapLayout = (
  root: TreeNode,
  { width }: { readonly width: number },
): TreemapLayout => {
  const height = plotHeight(width);
  const groups = (root.children ?? []).map((c) => c.id);
  const h = hierarchy<TreeNode>(root, (n) => n.children)
    .sum((n) => ((n.children ?? []).length > 0 ? 0 : Math.max(0, n.value ?? 0)))
    .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
  const laid = treemap<TreeNode>()
    .tile(treemapSquarify)
    .size([width, height])
    .paddingInner(spacePx("3xs"))
    .round(true)(h);
  const cells = laid
    .leaves()
    .filter((l) => (l.value ?? 0) > 0)
    .map((l, index): TreemapCell => {
      const lineage = l.ancestors().reverse().slice(1);
      return {
        id: l.data.id,
        label: l.data.label,
        value: l.value ?? 0,
        index,
        path: lineage.slice(0, -1).map((a) => a.data.label),
        group: Math.max(0, groups.indexOf(lineage[0]?.data.id ?? root.id)),
        x: l.x0,
        y: l.y0,
        width: l.x1 - l.x0,
        height: l.y1 - l.y0,
      };
    });
  return { width, height, total: laid.value ?? 0, cells };
};

// ---------------------------------------------------------------- donut

export interface Slice extends Datum {
  readonly index: number;
  /** 0…1 of the total. */
  readonly share: number;
  readonly d: string;
  readonly centroid: { readonly x: number; readonly y: number };
}
export interface DonutLayout {
  readonly size: number;
  readonly total: number;
  readonly slices: readonly Slice[];
}

export const donutLayout = (
  data: readonly Datum[],
  { width }: { readonly width: number },
): DonutLayout => {
  const size = Math.min(width, MIN_HEIGHT);
  const outer = size / 2;
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const shape = arc<{ startAngle: number; endAngle: number; padAngle: number }>()
    .innerRadius(outer * 0.6)
    .outerRadius(outer)
    .cornerRadius(spacePx("3xs"));
  const arcs = pie<Datum>()
    .value((d) => d.value)
    .sort(null)
    .padAngle(0.01)(data as Datum[]);
  return {
    size,
    total,
    slices: arcs.map((a, index) => {
      const [cx, cy] = shape.centroid(a);
      return {
        id: a.data.id,
        label: a.data.label,
        value: a.data.value,
        index,
        share: total === 0 ? 0 : a.data.value / total,
        d: shape(a) ?? "",
        centroid: { x: cx, y: cy },
      };
    }),
  };
};
