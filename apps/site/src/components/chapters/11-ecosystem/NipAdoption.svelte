<script lang="ts">
  import { BarChart } from "@nostrschool/charts";
  import { format, formatNumber, getDictionary, type Locale } from "@nostrschool/i18n";
  import { pop } from "@nostrschool/ui";
  import { nipHref, share } from "./ecosystem.ts";
  import type { Count } from "./schema.ts";

  interface Props {
    readonly locale: Locale;
    readonly support: readonly Count[];
    /** Relays that published a NIP list (the denominator). */
    readonly total: number;
    readonly source?: string;
  }
  const { locale, support, total, source }: Props = $props();
  const t = $derived(getDictionary(locale).chapters.ch11.nips);

  let selected = $state<string | undefined>(undefined);
  const current = $derived(support.find((c) => c.id === selected) ?? support[0]);
  const pct = $derived(share(current?.value ?? 0, total));
  const blurbs = $derived(t.blurbs as Readonly<Record<string, string>>);
  const uid = $props.id();
</script>

<div class="nips" data-testid="ch11-nips">
  <!-- Native radios: arrow keys, one tab stop and form semantics for free; labels are the chips. -->
  <fieldset class="picker" data-testid="ch11-nip-picker">
    <legend>{t.pickLabel}</legend>
    {#each support as nip (nip.id)}
      <label class="chip">
        <input
          class="visually-hidden"
          type="radio"
          name="{uid}-nip"
          value={nip.id}
          checked={nip.id === current?.id}
          data-testid="ch11-nip-{nip.id}"
          onchange={() => {
            selected = nip.id;
          }}
        >
        {nip.label}
      </label>
    {/each}
  </fieldset>

  {#if current !== undefined}
    <div class="meter-card" data-testid="ch11-nip-meter-card">
      {#key current.id}
        <p class="blurb" use:pop data-testid="ch11-nip-blurb">
          <strong>{current.label}</strong>
          {blurbs[current.id] ?? t.blurbs.fallback}
        </p>
      {/key}
      <meter
        class="visually-hidden"
        min="0"
        max={total}
        value={current.value}
        aria-label={format(t.meterLabel, { nip: current.label })}
        data-testid="ch11-nip-meter"
      ></meter>
      <!-- Visual twin of the <meter>: native meters can't be themed consistently across browsers. -->
      <div class="meter" aria-hidden="true">
        <div class="fill" style:transform="scaleX({pct})"></div>
      </div>
      <p class="value" aria-live="polite" data-testid="ch11-nip-meter-value">
        {format(t.meterValue, {
          count: formatNumber(locale, current.value),
          total: formatNumber(locale, total),
          percent: formatNumber(locale, pct, { style: "percent" }),
        })}
      </p>
      <a
        class="nip-link"
        href={nipHref(current.id)}
        target="_blank"
        rel="noopener noreferrer"
        data-testid="ch11-nip-link"
      >
        {format(t.openNip, { nip: current.label })}
      </a>
    </div>
  {/if}

  <BarChart
    testid="ch11-chart-nips"
    {locale}
    title={t.title}
    description={t.description}
    data={support}
    orientation="horizontal"
    xLabel={t.nip}
    yLabel={t.relays}
    {...current === undefined ? {} : { highlight: current.id }}
    {...source === undefined ? {} : { source }}
  />
</div>

<style>
  .nips {
    display: grid;
    gap: var(--space-lg);
  }
  .picker {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2xs);
    margin: 0;
    padding: 0;
    border: none;
    min-width: 0;
  }
  legend {
    margin-bottom: var(--space-2xs);
    font-family: var(--font-family-display);
    font-weight: var(--font-weight-bold);
  }
  .chip {
    min-height: var(--size-touch-target);
    padding: 0 var(--space-sm);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-pill);
    background: var(--color-surface);
    color: var(--color-text);
    font-family: var(--font-family-mono);
    font-size: var(--font-size-sm);
    display: inline-flex;
    align-items: center;
    cursor: pointer;
    transition:
      background-color var(--motion-duration-fast) var(--motion-easing-standard),
      translate var(--motion-duration-press) var(--motion-easing-press),
      box-shadow var(--motion-duration-press) var(--motion-easing-press);
  }
  .chip:hover {
    translate: calc(var(--size-lift) * -1) calc(var(--size-lift) * -1);
    box-shadow: var(--shadow-pop-sm);
  }
  .chip:has(:checked) {
    background: var(--color-primary);
    box-shadow: var(--shadow-accent);
    color: var(--color-on-primary);
  }
  .chip:has(:focus-visible),
  .nip-link:focus-visible {
    outline: var(--border-width-thick) solid var(--color-focus-ring);
    outline-offset: var(--space-3xs);
  }
  .meter-card {
    display: grid;
    gap: var(--space-xs);
    padding: var(--space-md);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-lg);
    background: var(--color-primary-subtle);
    box-shadow: var(--shadow-pop-sm);
  }
  .blurb,
  .value {
    margin: 0;
  }
  .value {
    font-family: var(--font-family-display);
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
  }
  .meter {
    height: var(--space-md);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-sm);
    background: var(--color-surface-raised);
    overflow: hidden;
  }
  .fill {
    height: 100%;
    /* Flat riso ink, no gradient: the ink track outline carries it on paper. */
    background: var(--color-primary);
    transform-origin: left center;
    /* Bounce easing gives the springy overshoot; tokens collapse it to 0ms under reduced motion. */
    transition: transform var(--motion-duration-slow) var(--motion-easing-bounce);
  }
  .nip-link {
    justify-self: start;
    color: var(--color-text-primary);
    font-weight: var(--font-weight-semibold);
    border-radius: var(--radius-sm);
  }
</style>
