<script lang="ts">
  import { formatNumber, getDictionary } from "@nostrschool/i18n";
  import { hoverTip } from "../interact.ts";
  import { AXIS_GAP, barLayout, DEFAULT_WIDTH, LABEL_OFFSET, MARK_RADIUS } from "../layout.ts";
  import { seriesColor } from "../scales.ts";
  import type { Tip } from "../types.internal.ts";
  import type { BarChartProps } from "../types.ts";
  import { validateData } from "../validate.ts";
  import ChartFrame from "./ChartFrame.svelte";

  const {
    testid,
    locale,
    title,
    description,
    source,
    format,
    data,
    orientation = "vertical",
    xLabel,
    yLabel,
    highlight,
    sorted = false,
  }: BarChartProps = $props();

  let measured = $state(0);
  let tip = $state<Tip | null>(null);
  const t = $derived(getDictionary(locale).charts);
  const fmt = $derived(format ?? ((v: number) => formatNumber(locale, v)));
  const valid = $derived(validateData(data));
  $effect(() => {
    if (!valid.ok && valid.error.code !== "empty")
      console.warn(`[${testid}] ${valid.error.message}`);
  });
  const layout = $derived(
    barLayout(valid.ok ? valid.value : [], {
      width: measured > 0 ? measured : DEFAULT_WIDTH,
      orientation,
      sorted,
    }),
  );
  const vertical = $derived(orientation === "vertical");
  const m = $derived(layout.margin);
  const table = $derived({
    columns: [xLabel ?? t.label, yLabel ?? t.value],
    rows: layout.bars.map((b) => ({ id: b.id, cells: [b.label, fmt(b.value)] })),
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
  <svg viewBox="0 0 {layout.width} {layout.height}" data-orientation={orientation}>
    <g class="grid" aria-hidden="true">
      {#each layout.valueTicks as tick (tick.value)}
        {#if vertical}
          <line x1={m.left} x2={layout.width - m.right} y1={tick.pos} y2={tick.pos} />
        {:else}
          <line y1={m.top} y2={layout.height - m.bottom} x1={tick.pos} x2={tick.pos} />
        {/if}
      {/each}
    </g>
    <g class="axis" aria-hidden="true">
      {#each layout.valueTicks as tick (tick.value)}
        {#if vertical}
          <text x={m.left - AXIS_GAP} y={tick.pos} text-anchor="end" dominant-baseline="middle">
            {fmt(tick.value)}
          </text>
        {:else}
          <text x={tick.pos} y={layout.height - m.bottom + LABEL_OFFSET} text-anchor="middle">
            {fmt(tick.value)}
          </text>
        {/if}
      {/each}
      {#each layout.categories as cat (cat.id)}
        {#if vertical}
          <text x={cat.pos} y={layout.height - m.bottom + LABEL_OFFSET} text-anchor="middle">
            {cat.value}
          </text>
        {:else}
          <text x={m.left - AXIS_GAP} y={cat.pos} text-anchor="end" dominant-baseline="middle">
            {cat.value}
          </text>
        {/if}
      {/each}
      {#if vertical}
        <line x1={m.left} x2={layout.width - m.right} y1={layout.baseline} y2={layout.baseline} />
      {:else}
        <line y1={m.top} y2={layout.height - m.bottom} x1={layout.baseline} x2={layout.baseline} />
      {/if}
    </g>
    {#each layout.bars as bar (bar.id)}
      <!-- Focusable data marks (role=img) are the chart's keyboard path to each value; roving tabindex keeps one Tab stop. -->
      <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
      <!-- biome-ignore lint/a11y/noInteractiveElementToNoninteractiveRole: data marks are images of values that take focus for keyboard exploration -->
      <rect
        class="bar"
        class:negative={bar.negative}
        class:muted={highlight !== undefined && highlight !== bar.id}
        x={bar.x}
        y={bar.y}
        width={bar.width}
        height={bar.height}
        rx={MARK_RADIUS}
        fill={seriesColor(highlight === bar.id ? 1 : 0)}
        style:--i={bar.index}
        data-mark
        data-value={bar.value}
        data-testid="{testid}-bar-{bar.id}"
        role="img"
        tabindex={bar.index === 0 ? 0 : -1}
        aria-label="{bar.label}: {fmt(bar.value)}"
        {@attach hoverTip(
          () => (tip = { ...bar.anchor, text: `${bar.label}: ${fmt(bar.value)}` }),
          () => (tip = null),
        )}
      />
    {/each}
  </svg>
</ChartFrame>

<style>
  .bar {
    transform-box: fill-box;
    transform-origin: bottom;
    animation: grow-y var(--motion-duration-slower) var(--motion-easing-bounce) backwards;
    animation-delay: calc(var(--i) * var(--motion-duration-fast) / 3);
  }
  .bar.negative {
    transform-origin: top;
  }
  [data-orientation="horizontal"] .bar {
    transform-origin: left;
    animation-name: grow-x;
  }
  [data-orientation="horizontal"] .bar.negative {
    transform-origin: right;
  }
  .bar.muted {
    opacity: var(--opacity-dimmed);
  }
  @keyframes grow-y {
    from {
      transform: scaleY(0);
    }
  }
  @keyframes grow-x {
    from {
      transform: scaleX(0);
    }
  }
</style>
