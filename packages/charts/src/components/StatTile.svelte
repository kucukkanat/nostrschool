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
  .tile {
    display: grid;
    gap: var(--space-2xs);
    align-content: start;
    padding: var(--space-md);
    background: var(--color-surface);
    color: var(--color-text);
    border: var(--border-width-medium) solid var(--color-border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-pop-sm);
    font-family: var(--font-family-body);
    animation: rise var(--motion-duration-slower) var(--motion-easing-bounce) backwards;
  }
  .label {
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    letter-spacing: var(--font-letter-spacing-wide);
  }
  .value {
    font-family: var(--font-family-display);
    font-size: var(--font-size-4xl);
    font-weight: var(--font-weight-black);
    line-height: var(--font-line-height-tight);
    color: var(--color-text-primary);
    font-variant-numeric: tabular-nums;
  }
  .delta {
    justify-self: start;
    padding: var(--space-3xs) var(--space-xs);
    border-radius: var(--radius-pill);
    font-size: var(--font-size-sm);
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
      transform: translateY(var(--space-sm)) scale(0.96);
    }
  }
</style>
