<script lang="ts">
  import { LineChart } from "@nostrschool/charts";
  import { format, formatDate, formatNumber, getDictionary, type Locale } from "@nostrschool/i18n";
  import { pop } from "@nostrschool/ui";
  import { growthAt, growthSeries } from "./ecosystem.ts";
  import type { GrowthPoint } from "./schema.ts";

  interface Props {
    readonly locale: Locale;
    readonly growth: readonly GrowthPoint[];
    readonly source?: string;
  }
  const { locale, growth, source }: Props = $props();
  const t = $derived(getDictionary(locale).chapters.ch11.growth);

  // Start at "today" so the first thing you see is the full story, then rewind.
  let index = $state(Number.POSITIVE_INFINITY);
  const point = $derived(growthAt(growth, index));
  const series = $derived([growthSeries(growth, "nips", t.seriesLabel)]);
  const day = (iso: string) =>
    formatDate(locale, new Date(`${iso}T00:00:00Z`), { dateStyle: "medium", timeZone: "UTC" });
  const max = $derived(Math.max(1, ...growth.map((g) => g.count)));
</script>

<div class="growth" data-testid="ch11-growth">
  <LineChart
    testid="ch11-chart-growth"
    {locale}
    title={t.title}
    description={t.description}
    {series}
    xLabel={t.xLabel}
    yLabel={t.yLabel}
    {...source === undefined ? {} : { source }}
  />

  {#if point !== undefined}
    <div class="rewind">
      <label for="ch11-growth-slider">{t.rewindLabel}</label>
      <input
        id="ch11-growth-slider"
        type="range"
        min="0"
        max={growth.length - 1}
        step="1"
        value={growth.indexOf(point)}
        aria-valuetext={format(t.rewindValue, { date: day(point.date), count: point.count })}
        data-testid="ch11-growth-slider"
        oninput={(e) => {
          index = Number(e.currentTarget.value);
        }}
      >
      <p class="hint">{t.rewindHint}</p>
      <div class="readout" aria-live="polite" data-testid="ch11-growth-readout">
        {#key point.count}
          <strong class="count" use:pop={{ spring: "wobbly" }}
            >{formatNumber(locale, point.count)}</strong
          >
        {/key}
        <span
          >{format(t.rewindValue, {
            date: day(point.date),
            count: formatNumber(locale, point.count),
          })}</span
        >
      </div>
      <!-- A row of "NIP blocks" that fills up as time moves forward. Decorative: the readout says it. -->
      <div class="blocks" aria-hidden="true">
        {#each { length: max } as _, i (i)}
          <span class="block" class:on={i < point.count}></span>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .growth,
  .rewind {
    display: grid;
    gap: var(--space-sm);
  }
  label {
    font-family: var(--font-family-display);
    font-weight: var(--font-weight-bold);
  }
  input[type="range"] {
    width: 100%;
    min-height: var(--size-touch-target);
    accent-color: var(--color-primary);
  }
  input[type="range"]:focus-visible {
    outline: var(--border-width-thick) solid var(--color-focus-ring);
    outline-offset: var(--space-3xs);
  }
  .hint {
    margin: 0;
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
  }
  .readout {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: var(--space-sm);
  }
  .count {
    display: inline-block;
    font-family: var(--font-family-display);
    font-size: var(--font-size-4xl);
    font-weight: var(--font-weight-black);
    color: var(--color-text-primary);
    line-height: var(--font-line-height-tight);
  }
  .blocks {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-3xs);
  }
  .block {
    width: var(--space-xs);
    height: var(--space-xs);
    border-radius: var(--radius-sm);
    background: var(--color-surface-sunken);
    transform: scale(0.6);
    transition:
      background-color var(--motion-duration-fast) var(--motion-easing-standard),
      transform var(--motion-duration-normal) var(--motion-easing-bounce);
  }
  .block.on {
    background: var(--color-primary);
    transform: scale(1);
  }
</style>
