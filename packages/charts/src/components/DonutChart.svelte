<script lang="ts">
  import { formatNumber, getDictionary } from "@nostrschool/i18n";
  import { hoverTip } from "../interact.ts";
  import { DEFAULT_WIDTH, donutLayout } from "../layout.ts";
  import { seriesColor } from "../scales.ts";
  import type { Tip } from "../types.internal.ts";
  import type { DonutChartProps } from "../types.ts";
  import { validateData } from "../validate.ts";
  import ChartFrame from "./ChartFrame.svelte";
  import Legend from "./Legend.svelte";

  const { testid, locale, title, description, source, format, data, centerLabel }: DonutChartProps =
    $props();

  let measured = $state(0);
  let tip = $state<Tip | null>(null);
  const t = $derived(getDictionary(locale).charts);
  const fmt = $derived(format ?? ((v: number) => formatNumber(locale, v)));
  const pct = (v: number) =>
    formatNumber(locale, v, { style: "percent", maximumFractionDigits: 1 });
  const valid = $derived(validateData(data, { nonNegative: true }));
  $effect(() => {
    if (!valid.ok && valid.error.code !== "empty")
      console.warn(`[${testid}] ${valid.error.message}`);
  });
  const layout = $derived(
    donutLayout(valid.ok ? valid.value : [], { width: measured > 0 ? measured : DEFAULT_WIDTH }),
  );
  const half = $derived(layout.size / 2);
  // A 0 slice is a degenerate arc: as a focusable mark it would be an invisible focus target
  // (WCAG 2.4.7). It stays in the legend and table; only drawable slices become marks.
  const marks = $derived(layout.slices.filter((s) => s.value > 0));
  const describe = (s: { label: string; value: number; share: number }) =>
    `${s.label}: ${fmt(s.value)} (${pct(s.share)})`;
  const table = $derived({
    columns: [t.label, t.value, t.share],
    rows: [
      ...layout.slices.map((s) => ({ id: s.id, cells: [s.label, fmt(s.value), pct(s.share)] })),
      { id: "__total", cells: [t.total, fmt(layout.total), pct(layout.total > 0 ? 1 : 0)] },
    ],
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
  empty={!valid.ok || layout.total === 0}
  bind:width={measured}
>
  <!-- biome-ignore lint/a11y/noSvgWithoutTitle: the figure is labelled by its caption; an SVG <title> would add a native tooltip over our own -->
  <svg class="donut" viewBox="{-half} {-half} {layout.size} {layout.size}">
    {#each marks as slice, i (slice.id)}
      <!-- Focusable data marks (role=img) are the chart's keyboard path to each value; roving tabindex keeps one Tab stop. -->
      <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
      <!-- biome-ignore lint/a11y/noInteractiveElementToNoninteractiveRole: data marks are images of values that take focus for keyboard exploration -->
      <path
        class="slice"
        d={slice.d}
        fill={seriesColor(slice.index)}
        style:--i={slice.index}
        data-mark
        data-value={slice.value}
        data-testid="{testid}-slice-{slice.id}"
        role="img"
        tabindex={i === 0 ? 0 : -1}
        aria-label={describe(slice)}
        {@attach hoverTip(
          // The tooltip sits over the slice centroid; shift from centered coords to plot pixels.
          () =>
            (tip = {
              x: (measured > 0 ? measured : layout.size) / 2 + slice.centroid.x,
              y: half + slice.centroid.y,
              text: describe(slice),
            }),
          () => (tip = null),
        )}
      />
    {/each}
    <text class="center" text-anchor="middle" dominant-baseline="middle" aria-hidden="true">
      <tspan class="big" x="0" dy="-0.2em" data-testid="{testid}-center">
        {centerLabel ?? fmt(layout.total)}
      </tspan>
      {#if centerLabel === undefined}
        <tspan class="small" x="0" dy="1.6em">{t.total}</tspan>
      {/if}
    </text>
  </svg>
  {#snippet legend()}
    <Legend
      testid="{testid}-legend"
      items={layout.slices.map((s) => ({ id: s.id, label: s.label, detail: pct(s.share) }))}
    />
  {/snippet}
</ChartFrame>

<style>
  .donut {
    max-width: var(--size-diagram-min-height);
    margin-inline: auto;
  }
  .slice {
    transform-origin: 0 0;
    animation: spin-in var(--motion-duration-slower) var(--motion-easing-bounce) backwards;
    animation-delay: calc(var(--i) * var(--motion-duration-fast) / 2);
  }
  .center {
    fill: var(--color-text);
  }
  .big {
    font-family: var(--font-family-display);
    font-size: var(--font-size-3xl);
    font-weight: var(--font-weight-black);
  }
  .small {
    fill: var(--color-text-muted);
    font-size: var(--font-size-sm);
  }
  @keyframes spin-in {
    from {
      opacity: 0;
      transform: rotate(-30deg) scale(0.7);
    }
  }
</style>
