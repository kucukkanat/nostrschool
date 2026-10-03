/** @nostrschool/charts — token-themed, accessible charts on D3 scales/shapes. */
export { default as BarChart } from "./components/BarChart.svelte";
export { default as DonutChart } from "./components/DonutChart.svelte";
export { default as LineChart } from "./components/LineChart.svelte";
export { default as StatTile } from "./components/StatTile.svelte";
export { default as Treemap } from "./components/Treemap.svelte";
export {
  barLayout,
  DEFAULT_WIDTH,
  donutLayout,
  lineLayout,
  plotHeight,
  treemapLayout,
  truncate,
} from "./layout.ts";
export { deltaTone, niceMax, seriesColor } from "./scales.ts";
export type * from "./types.ts";
export {
  type ChartError,
  type ChartErrorCode,
  validateData,
  validateSeries,
  validateTree,
} from "./validate.ts";
