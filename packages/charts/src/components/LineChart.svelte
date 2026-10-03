<script lang="ts">
  import { formatDate, formatNumber, getDictionary } from "@nostrschool/i18n";
  import { hoverTip } from "../interact.ts";
  import { AXIS_GAP, DEFAULT_WIDTH, LABEL_OFFSET, lineLayout, MARK_RADIUS } from "../layout.ts";
  import { seriesColor } from "../scales.ts";
  import type { Tip } from "../types.internal.ts";
  import type { LineChartProps } from "../types.ts";
  import { validateSeries } from "../validate.ts";
  import ChartFrame from "./ChartFrame.svelte";
  import Legend from "./Legend.svelte";

  const {
    testid,
    locale,
    title,
    description,
    source,
    format,
    series,
    xLabel,
    yLabel,
    formatX,
  }: LineChartProps = $props();

  let measured = $state(0);
  let tip = $state<Tip | null>(null);
  const t = $derived(getDictionary(locale).charts);
  const fmt = $derived(format ?? ((v: number) => formatNumber(locale, v)));
  const fx = $derived(
    formatX ??
      ((x: Date | number) => (x instanceof Date ? formatDate(locale, x) : formatNumber(locale, x))),
  );
  const valid = $derived(validateSeries(series));
  $effect(() => {
    if (!valid.ok && valid.error.code !== "empty")
      console.warn(`[${testid}] ${valid.error.message}`);
  });
  const layout = $derived(
    lineLayout(valid.ok ? valid.value.series : [], {
      width: measured > 0 ? measured : DEFAULT_WIDTH,
      time: valid.ok && valid.value.time,
    }),
  );
  const m = $derived(layout.margin);
  const table = $derived({
    columns: [t.series, xLabel ?? t.label, yLabel ?? t.value],
    rows: layout.series.flatMap((s) =>
      s.points.map((p, i) => ({ id: `${s.id}-${i}`, cells: [s.label, fx(p.x), fmt(p.y)] })),
    ),
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
    <g class="grid" aria-hidden="true">
      {#each layout.yTicks as tick (tick.value)}
        <line x1={m.left} x2={layout.width - m.right} y1={tick.pos} y2={tick.pos} />
      {/each}
    </g>
    <g class="axis" aria-hidden="true">
      {#each layout.yTicks as tick (tick.value)}
        <text x={m.left - AXIS_GAP} y={tick.pos} text-anchor="end" dominant-baseline="middle">
          {fmt(tick.value)}
        </text>
      {/each}
      {#each layout.xTicks as tick (+tick.value)}
        <text x={tick.pos} y={layout.height - m.bottom + LABEL_OFFSET} text-anchor="middle">
          {fx(tick.value)}
        </text>
      {/each}
      <line
        x1={m.left}
        x2={layout.width - m.right}
        y1={layout.height - m.bottom}
        y2={layout.height - m.bottom}
      />
    </g>
    {#each layout.series as s (s.id)}
      <g data-testid="{testid}-series-{s.id}" style:--c={seriesColor(s.index)}>
        <path class="line" d={s.d} pathLength="1" aria-hidden="true" />
        {#each s.points as p, i (i)}
          <!-- Focusable data marks (role=img) are the chart's keyboard path to each value; roving tabindex keeps one Tab stop. -->
          <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
          <!-- biome-ignore lint/a11y/noInteractiveElementToNoninteractiveRole: data marks are images of values that take focus for keyboard exploration -->
          <circle
            class="point"
            cx={p.px}
            cy={p.py}
            r={MARK_RADIUS}
            style:--i={i}
            data-mark
            data-testid="{testid}-point-{s.id}-{i}"
            role="img"
            tabindex={s.index === 0 && i === 0 ? 0 : -1}
            aria-label="{s.label}, {fx(p.x)}: {fmt(p.y)}"
            {@attach hoverTip(
              () => (tip = { x: p.px, y: p.py, text: `${s.label} · ${fx(p.x)}: ${fmt(p.y)}` }),
              () => (tip = null),
            )}
          />
        {/each}
      </g>
    {/each}
  </svg>
  {#snippet legend()}
    <Legend testid="{testid}-legend" items={layout.series} />
  {/snippet}
</ChartFrame>

<style>
  .line {
    fill: none;
    stroke: var(--c);
    stroke-width: var(--border-width-thick);
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-dasharray: 1;
    animation: draw var(--motion-duration-step) var(--motion-easing-emphasized) backwards;
  }
  .point {
    fill: var(--color-surface);
    stroke: var(--c);
    stroke-width: var(--border-width-medium);
    transform-box: fill-box;
    transform-origin: center;
    animation: pop var(--motion-duration-slow) var(--motion-easing-bounce) backwards;
    animation-delay: calc(
      var(--motion-duration-slower) +
      var(--i) *
      var(--motion-duration-fast) /
      4
    );
  }
  @keyframes draw {
    from {
      stroke-dashoffset: 1;
    }
  }
  @keyframes pop {
    from {
      transform: scale(0);
    }
  }
</style>
