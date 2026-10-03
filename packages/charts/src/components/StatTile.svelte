<script lang="ts">
  import { format as fill, formatNumber, getDictionary } from "@nostrschool/i18n";
  import { VisuallyHidden } from "@nostrschool/ui";
  import { deltaTone } from "../scales.ts";
  import type { StatTileProps } from "../types.ts";

  const { testid, locale, label, value, delta, hint, format }: StatTileProps = $props();

  const t = $derived(getDictionary(locale).charts);
  const display = $derived(
    typeof value === "number" ? (format ?? ((v: number) => formatNumber(locale, v)))(value) : value,
  );
  const tone = $derived(delta === undefined ? undefined : deltaTone(delta));
  const pct = $derived(
    delta === undefined
      ? ""
      : formatNumber(locale, Math.abs(delta), { style: "percent", maximumFractionDigits: 1 }),
  );
  const deltaText = $derived(
    tone === "up"
      ? fill(t.increase, { value: pct })
      : tone === "down"
        ? fill(t.decrease, { value: pct })
        : t.unchanged,
  );
</script>

<div class="tile" data-testid={testid}>
  <span class="label" data-testid="{testid}-label">{label}</span>
  <strong class="value" data-testid="{testid}-value">{display}</strong>
  {#if tone !== undefined}
    <span class="delta {tone}" data-testid="{testid}-delta" data-tone={tone}>
      <span aria-hidden="true">{tone === "up" ? "▲" : tone === "down" ? "▼" : "■"} {pct}</span>
      <VisuallyHidden>{deltaText}</VisuallyHidden>
    </span>
  {/if}
  {#if hint}
    <span class="hint" data-testid="{testid}-hint">{hint}</span>
  {/if}
</div>

<style>
  /* An index card: paper-2, ink line, hard shadow; the figure is set big in accent ink. */
  .tile {
    display: grid;
    gap: var(--space-2xs);
    align-content: start;
    min-width: 0;
    padding: var(--space-md);
    background: var(--color-surface);
    color: var(--color-text);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-pop);
    font-family: var(--font-family-body);
    animation: rise var(--motion-duration-slow) var(--motion-easing-decelerate) backwards;
  }
  .label {
    color: var(--color-text-muted);
    font-family: var(--font-family-mono);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-semibold);
    letter-spacing: var(--font-letter-spacing-caps);
    text-transform: uppercase;
  }
  .value {
    font-family: var(--font-family-display);
    font-size: var(--font-size-4xl);
    font-weight: var(--font-weight-black);
    letter-spacing: var(--font-letter-spacing-display);
    line-height: var(--font-line-height-tight);
    color: var(--color-text-primary);
    font-variant-numeric: tabular-nums;
    overflow-wrap: anywhere;
  }
  .delta {
    justify-self: start;
    padding: var(--space-3xs) var(--space-xs);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-sm);
    font-family: var(--font-family-mono);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-bold);
  }
  .up {
    background: var(--color-success-subtle);
    color: var(--color-text);
  }
  .down {
    background: var(--color-danger-subtle);
    color: var(--color-text);
  }
  .flat {
    background: var(--color-surface-sunken);
    color: var(--color-text-muted);
  }
  .hint {
    color: var(--color-text-subtle);
    font-size: var(--font-size-xs);
  }
  @keyframes rise {
    from {
      opacity: 0;
      translate: 0 var(--space-xs);
    }
  }
</style>
