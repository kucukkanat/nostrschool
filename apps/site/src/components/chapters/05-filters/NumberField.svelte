<script lang="ts">
  /** since / until / limit: a checkbox to include the field, then a slider with a readable value. */
  import { getDictionary, type Locale } from "@nostrschool/i18n";
  import type { FilterDraft, NumberField } from "./filter-logic.ts";
  import { setNumber } from "./filter-logic.ts";

  interface Props {
    readonly locale: Locale;
    /** Parts: `-enable -slider -value`. */
    readonly testid: string;
    readonly field: NumberField;
    readonly draft: FilterDraft;
    readonly min: number;
    readonly max: number;
    readonly step: number;
    /** Value used when the field is switched on. */
    readonly initial: number;
    readonly display: (value: number) => string;
    readonly onchange: (next: FilterDraft) => void;
  }

  const { locale, testid, field, draft, min, max, step, initial, display, onchange }: Props =
    $props();
  const t = $derived(getDictionary(locale).chapters.ch05.builder.numbers[field]);
  const uid = $props.id();
  const value = $derived(draft[field]);
</script>

<fieldset class="field" class:on={value !== null} data-testid={testid}>
  <legend class="legend"><code>{t.label}</code></legend>
  <label class="enable">
    <input
      type="checkbox"
      checked={value !== null}
      data-testid="{testid}-enable"
      onchange={(e) => onchange(setNumber(draft, field, e.currentTarget.checked ? initial : null))}
    >
    <span>{t.toggle}</span>
  </label>
  {#if value !== null}
    <div class="slider">
      <label class="visually-hidden" for="{uid}-range">{t.label}</label>
      <input
        id="{uid}-range"
        type="range"
        {min}
        {max}
        {step}
        {value}
        aria-valuetext={display(value)}
        data-testid="{testid}-slider"
        oninput={(e) => onchange(setNumber(draft, field, Number(e.currentTarget.value)))}
      >
      <output for="{uid}-range" class="value" data-testid="{testid}-value">{display(value)}</output>
    </div>
  {/if}
</fieldset>

<style>
  .field {
    display: grid;
    gap: var(--space-2xs);
    min-inline-size: 0;
    margin: 0;
    padding: var(--space-sm);
    border: var(--border-width-medium) solid var(--color-border);
    border-radius: var(--radius-lg);
    background: var(--color-surface-raised);
    transition: border-color var(--motion-duration-fast) var(--motion-easing-standard);
  }
  .field.on {
    border-color: var(--color-border-strong);
    box-shadow: var(--shadow-pop-sm);
  }
  .legend {
    padding-inline: var(--space-2xs);
    font-family: var(--font-family-mono);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-secondary);
  }
  .enable {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    min-block-size: var(--size-touch-target);
    font-size: var(--font-size-sm);
    cursor: pointer;
  }
  .enable input {
    inline-size: var(--size-icon-md);
    block-size: var(--size-icon-md);
    accent-color: var(--color-text-secondary);
  }
  .slider {
    display: grid;
    gap: var(--space-3xs);
  }
  input[type="range"] {
    inline-size: 100%;
    min-block-size: var(--size-touch-target);
    accent-color: var(--color-text-secondary);
  }
  input:focus-visible {
    outline: var(--border-width-thick) solid var(--color-focus-ring);
    outline-offset: var(--space-3xs);
  }
  .value {
    font-family: var(--font-family-mono);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
  }
</style>
