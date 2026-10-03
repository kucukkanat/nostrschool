<script lang="ts">
  /** Worst single outage per model, computed from the very networks the sandbox uses. */
  import { BarChart } from "@nostrschool/charts";
  import { formatNumber, getDictionary, type Locale } from "@nostrschool/i18n";
  import { MODEL_IDS, MODELS } from "./models.ts";
  import { worstSingleOutage } from "./sandbox.ts";

  const { locale }: { readonly locale: Locale } = $props();
  const dict = $derived(getDictionary(locale).chapters.ch01);
  const data = $derived(
    MODEL_IDS.map((id) => ({
      id,
      label: dict.sandbox.models[id].label,
      value: worstSingleOutage(MODELS[id]).percent,
    })),
  );
  const percent = (v: number): string => formatNumber(locale, v / 100, { style: "percent" });
</script>

<div class="resilience" data-testid="ch01-resilience">
  <BarChart
    testid="ch01-resilience-chart"
    {locale}
    title={dict.resilience.title}
    description={dict.resilience.description}
    source={dict.resilience.source}
    xLabel={dict.resilience.xLabel}
    yLabel={dict.resilience.yLabel}
    {data}
    highlight="nostr"
    format={percent}
  />
</div>

<style>
  .resilience {
    min-height: var(--size-diagram-min-height);
  }
</style>
