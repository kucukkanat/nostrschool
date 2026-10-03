<script lang="ts">
  /**
   * One list-valued filter field (ids, authors, kinds, #e, #p, #t): quick-pick chips that toggle,
   * a free-text box that accepts hex or NIP-19, and the current values as removable chips.
   */
  import { format, getDictionary, type Locale } from "@nostrschool/i18n";
  import { pop, shake } from "@nostrschool/ui";
  import {
    addValue,
    type FilterDraft,
    type ListField,
    toggleValue,
    type ValueErrorCode,
    valueLabel,
  } from "./filter-logic.ts";

  interface QuickPick {
    readonly value: string;
    readonly label: string;
    /** Optional avatar (data URI) for persona chips. */
    readonly avatar?: string;
  }

  interface Props {
    readonly locale: Locale;
    /** Parts: `-chip-<value> -input -add -error -value-<value> -remove-<value>`. */
    readonly testid: string;
    readonly field: ListField;
    readonly draft: FilterDraft;
    readonly quickPicks?: readonly QuickPick[];
    readonly onchange: (next: FilterDraft) => void;
  }

  const { locale, testid, field, draft, quickPicks = [], onchange }: Props = $props();
  const t = $derived(getDictionary(locale).chapters.ch05.builder);
  const meta = $derived(t.fields[field]);
  const uid = $props.id();
  const values = $derived(draft.lists[field]);
  const custom = $derived(values.filter((v) => !quickPicks.some((q) => q.value === v)));

  let text = $state("");
  let error = $state<ValueErrorCode | null>(null);
  let inputEl = $state<HTMLInputElement>();

  const toggle = (value: string) => {
    error = null;
    onchange(toggleValue(draft, field, value));
  };

  const submit = (event: SubmitEvent) => {
    event.preventDefault();
    const next = addValue(draft, field, text);
    if (next.ok) {
      error = null;
      text = "";
      onchange(next.value);
    } else {
      error = next.error.code;
      if (inputEl !== undefined) shake(inputEl);
    }
  };
</script>

<fieldset class="field" data-testid={testid} data-count={values.length}>
  <legend class="legend">
    <code class="name">{meta.label}</code>
    {#if values.length > 0}
      {#key values.length}
        <span class="count" use:pop aria-hidden="true">{values.length}</span>
      {/key}
    {/if}
  </legend>
  <p class="hint" id="{uid}-hint">{meta.hint}</p>

  {#if quickPicks.length > 0}
    <fieldset class="chips">
      <legend class="visually-hidden">{format(t.quickPicks, { field: meta.label })}</legend>
      {#each quickPicks as pick (pick.value)}
        {@const on = values.includes(pick.value)}
        <button
          type="button"
          class="chip"
          class:on
          aria-pressed={on}
          data-testid="{testid}-chip-{pick.value}"
          onclick={() => toggle(pick.value)}
        >
          {#if pick.avatar !== undefined}
            <img class="avatar" src={pick.avatar} alt="" width="20" height="20">
          {/if}
          <span>{pick.label}</span>
        </button>
      {/each}
    </fieldset>
  {/if}

  <form class="entry" onsubmit={submit}>
    <label class="visually-hidden" for="{uid}-in">{meta.label}</label>
    <input
      bind:this={inputEl}
      id="{uid}-in"
      bind:value={text}
      placeholder={meta.placeholder}
      autocomplete="off"
      spellcheck="false"
      aria-describedby="{uid}-hint {uid}-err"
      aria-invalid={error !== null}
      data-testid="{testid}-input"
      oninput={() => (error = null)}
    >
    <button type="submit" class="add" data-testid="{testid}-add">{t.add}</button>
  </form>
  <p id="{uid}-err" class="error" aria-live="polite" data-testid="{testid}-error">
    {error === null ? "" : t.errors[error]}
  </p>

  {#if custom.length > 0}
    <ul class="values">
      {#each custom as value (value)}
        <li class="value" use:pop data-testid="{testid}-value-{value}">
          <code>{valueLabel(locale, field, value)}</code>
          <button
            type="button"
            class="remove"
            aria-label={format(t.remove, { value: valueLabel(locale, field, value) })}
            data-testid="{testid}-remove-{value}"
            onclick={() => toggle(value)}
          >
            ×
          </button>
        </li>
      {/each}
    </ul>
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
  }
  .field:focus-within {
    border-color: var(--color-border-strong);
    box-shadow: var(--shadow-pop-sm);
  }
  .legend {
    display: flex;
    align-items: center;
    gap: var(--space-2xs);
    padding-inline: var(--space-2xs);
  }
  .name {
    font-family: var(--font-family-mono);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
  }
  .count {
    display: inline-grid;
    place-items: center;
    min-inline-size: var(--size-icon-md);
    block-size: var(--size-icon-md);
    padding-inline: var(--space-3xs);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-pill);
    background: var(--color-primary);
    color: var(--color-on-primary);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-bold);
  }
  .hint {
    margin: 0;
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
  }
  .chips {
    margin: 0;
    padding: 0;
    border: 0;
    min-inline-size: 0;
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2xs);
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2xs);
    min-block-size: var(--size-control-sm);
    padding: var(--space-3xs) var(--space-sm);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-pill);
    background: var(--color-surface);
    color: var(--color-text);
    font: inherit;
    font-size: var(--font-size-sm);
    cursor: pointer;
    box-shadow: var(--shadow-pop-sm);
    transition:
      translate var(--motion-duration-press) var(--motion-easing-press),
      box-shadow var(--motion-duration-press) var(--motion-easing-press),
      background-color var(--motion-duration-fast) var(--motion-easing-standard);
  }
  .chip:hover {
    translate: calc(var(--size-lift) * -1) calc(var(--size-lift) * -1);
    box-shadow: var(--shadow-lift);
  }
  .chip:active {
    translate: var(--size-lift) var(--size-lift);
    box-shadow: var(--shadow-pressed);
  }
  .chip.on,
  .chip.on:hover {
    box-shadow: var(--shadow-accent);
    background: var(--color-primary);
    color: var(--color-on-primary);
  }
  .avatar {
    inline-size: var(--size-icon-md);
    block-size: var(--size-icon-md);
    border-radius: var(--radius-round);
  }
  .entry {
    display: flex;
    gap: var(--space-2xs);
  }
  input {
    flex: 1;
    min-inline-size: 0;
    min-block-size: var(--size-control-md);
    padding: var(--space-2xs) var(--space-xs);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-md);
    background: var(--color-surface);
    color: var(--color-text);
    font-family: var(--font-family-mono);
    font-size: var(--font-size-md);
  }
  input[aria-invalid="true"] {
    border-color: var(--color-danger);
  }
  .add,
  .remove {
    border: var(--border-width-medium) solid var(--color-border-strong);
    background: var(--color-surface);
    color: var(--color-text);
    font: inherit;
    cursor: pointer;
  }
  .add {
    min-block-size: var(--size-control-md);
    padding-inline: var(--space-sm);
    border-radius: var(--radius-md);
    font-weight: var(--font-weight-semibold);
  }
  .chip:focus-visible,
  .add:focus-visible,
  .remove:focus-visible,
  input:focus-visible {
    outline: var(--border-width-thick) solid var(--color-focus-ring);
    outline-offset: var(--space-3xs);
  }
  .error {
    margin: 0;
    min-block-size: 1lh;
    color: var(--color-text);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
  }
  .values {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2xs);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .value {
    display: inline-flex;
    align-items: center;
    gap: var(--space-3xs);
    padding: var(--space-3xs) var(--space-3xs) var(--space-3xs) var(--space-xs);
    border-radius: var(--radius-pill);
    background: var(--color-primary-subtle);
    color: var(--color-text);
    font-size: var(--font-size-sm);
  }
  .remove {
    display: inline-grid;
    place-items: center;
    inline-size: var(--size-control-sm);
    block-size: var(--size-control-sm);
    border-radius: var(--radius-round);
    line-height: var(--font-line-height-tight);
  }
  /* Compact on desktop, finger-sized on touch screens. */
  @media (pointer: coarse) {
    .chip,
    .add {
      min-block-size: var(--size-touch-target);
    }
    .remove {
      inline-size: var(--size-touch-target);
      block-size: var(--size-touch-target);
    }
  }
</style>
