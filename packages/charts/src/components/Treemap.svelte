<script lang="ts">
  import { formatNumber, getDictionary } from "@nostrschool/i18n";
  import { tokens } from "@nostrschool/tokens";
  import { hoverTip } from "../interact.ts";
  import { DEFAULT_WIDTH, MARK_CORNER, treemapLayout, truncate } from "../layout.ts";
  import { seriesColor, spacePx } from "../scales.ts";
  import type { Tip } from "../types.internal.ts";
  import type { TreemapProps } from "../types.ts";
  import { validateTree } from "../validate.ts";
  import ChartFrame from "./ChartFrame.svelte";

  const { testid, locale, title, description, source, format, root }: TreemapProps = $props();

  // Cells smaller than this get no inline label (it would not fit); tooltip + table still have it.
  const MIN_LABEL_W = spacePx("3xl");
  const MIN_LABEL_H = spacePx("xl");
  const PAD = spacePx("xs");
  // Labels sit on a paper "tape" plate: ink on raised paper reads on every riso fill in both
  // themes, which no single text colour does directly on the fills. One line = 1.4em at xs.
  const LINE = Number.parseFloat(tokens.font.size.xs) * spacePx("md") * 1.4;

  let measured = $state(0);
  let tip = $state<Tip | null>(null);
  const t = $derived(getDictionary(locale).charts);
  const fmt = $derived(format ?? ((v: number) => formatNumber(locale, v)));
  const pct = (v: number) =>
    formatNumber(locale, v, { style: "percent", maximumFractionDigits: 1 });
  const valid = $derived(validateTree(root));
  $effect(() => {
    if (!valid.ok && valid.error.code !== "empty")
      console.warn(`[${testid}] ${valid.error.message}`);
  });
  const layout = $derived(
    treemapLayout(valid.ok ? valid.value : { id: root.id, label: root.label }, {
      width: measured > 0 ? measured : DEFAULT_WIDTH,
    }),
  );
  const name = (c: { path: readonly string[]; label: string }) => [...c.path, c.label].join(" › ");
  const describe = (c: { path: readonly string[]; label: string; value: number }) =>
    `${name(c)}: ${fmt(c.value)} (${pct(c.value / layout.total)})`;
  const table = $derived({
    columns: [t.label, t.value, t.share],
    rows: layout.cells.map((c) => ({
      id: c.id,
      cells: [name(c), fmt(c.value), pct(c.value / layout.total)],
    })),
  });
</script>

<ChartFrame
  {testid}
  {locale}
  {title}
  {description}
  {source}
  {table}
  tooltip={tip}
  empty={!valid.ok}
  bind:width={measured}
>
  <!-- biome-ignore lint/a11y/noSvgWithoutTitle: the figure is labelled by its caption; an SVG <title> would add a native tooltip over our own -->
  <svg viewBox="0 0 {layout.width} {layout.height}">
    {#each layout.cells as cell (cell.id)}
      <g class="cell" style:--i={cell.index}>
        <!-- Focusable data marks (role=img) are the chart's keyboard path to each value; roving tabindex keeps one Tab stop. -->
        <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
        <!-- biome-ignore lint/a11y/noInteractiveElementToNoninteractiveRole: data marks are images of values that take focus for keyboard exploration -->
        <rect
          x={cell.x}
          y={cell.y}
          width={cell.width}
          height={cell.height}
          rx={MARK_CORNER}
          fill={seriesColor(cell.group)}
          data-mark
          data-value={cell.value}
          data-testid="{testid}-cell-{cell.id}"
          role="img"
          tabindex={cell.index === 0 ? 0 : -1}
          aria-label={describe(cell)}
          {@attach hoverTip(
            () => (tip = { x: cell.x + cell.width / 2, y: cell.y, text: describe(cell) }),
            () => (tip = null),
          )}
        />
        {#if cell.width >= MIN_LABEL_W && cell.height >= MIN_LABEL_H}
          {@const lines = cell.height >= MIN_LABEL_H * 2 ? 2 : 1}
          <rect
            class="plate"
            x={cell.x + PAD / 2}
            y={cell.y + PAD / 2}
            width={cell.width - PAD}
            height={lines * LINE + PAD / 2}
            rx={MARK_CORNER}
            aria-hidden="true"
            data-testid="{testid}-cell-{cell.id}-plate"
          />
          <text class="label" x={cell.x + PAD} y={cell.y + PAD} aria-hidden="true">
            <tspan class="name" dominant-baseline="hanging">
              {truncate(cell.label, cell.width - PAD * 2)}
            </tspan>
            {#if lines === 2}
              <tspan class="val" x={cell.x + PAD} dy="1.4em" dominant-baseline="hanging">
                {fmt(cell.value)}
              </tspan>
            {/if}
          </text>
        {/if}
      </g>
    {/each}
  </svg>
</ChartFrame>

<style>
  .cell {
    transform-box: fill-box;
    transform-origin: center;
    animation: bloom var(--motion-duration-slower) var(--motion-easing-decelerate) backwards;
    animation-delay: calc(var(--i) * var(--motion-duration-fast) / 4);
  }
  .plate {
    fill: var(--color-surface-raised);
    stroke: var(--color-border-strong);
    stroke-width: var(--border-width-medium);
    pointer-events: none;
  }
  .label {
    fill: var(--color-text);
    pointer-events: none;
    font-size: var(--font-size-xs);
  }
  .name {
    font-weight: var(--font-weight-bold);
  }
  .val {
    font-family: var(--font-family-mono);
    font-variant-numeric: tabular-nums;
  }
  @keyframes bloom {
    from {
      opacity: 0;
      transform: scale(0.92);
    }
  }
</style>
