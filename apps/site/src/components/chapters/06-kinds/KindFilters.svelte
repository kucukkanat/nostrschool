<script lang="ts">
  import { getDictionary, type Locale, plural } from "@nostrschool/i18n";
  import { KIND_CATEGORIES, type KindCategory } from "@nostrschool/protocol";
  import { squish } from "@nostrschool/ui";
  import { toggleCategory } from "./kinds-logic.ts";

  interface Props {
    readonly locale: Locale;
    /** Prefix for part ids: `${testid}-search`, `${testid}-chip-<category>`, `${testid}-all`, `${testid}-count`. */
    readonly testid: string;
    categories: ReadonlySet<KindCategory>;
    query: string;
    readonly counts: Readonly<Record<KindCategory, number>>;
    readonly shown: number;
  }

  let {
    locale,
    testid,
    categories = $bindable(),
    query = $bindable(),
    counts,
    shown,
  }: Props = $props();
  const t = $derived(getDictionary(locale).chapters.ch06.table);
  const names = $derived(getDictionary(locale).kinds.categories);
  const uid = $props.id();
  const allOn = $derived(categories.size === KIND_CATEGORIES.length);
</script>

<div class="filters" data-testid={testid}>
  <label class="search" for="{uid}-search">
    <span class="label">{t.search}</span>
    <input
      id="{uid}-search"
      type="search"
      autocomplete="off"
      spellcheck="false"
      placeholder={t.searchPlaceholder}
      bind:value={query}
      data-testid="{testid}-search"
    >
  </label>
  <fieldset class="chips">
    <legend class="visually-hidden">{t.filtersLabel}</legend>
    <button
      type="button"
      class="chip all"
      aria-pressed={allOn}
      onclick={() => (categories = new Set(KIND_CATEGORIES))}
      use:squish
      data-testid="{testid}-all"
    >
      {t.all}
    </button>
    {#each KIND_CATEGORIES as category (category)}
      <button
        type="button"
        class="chip {category}"
        aria-pressed={categories.has(category)}
        onclick={() => (categories = toggleCategory(categories, category))}
        use:squish
        data-testid="{testid}-chip-{category}"
      >
        <span class="swatch" aria-hidden="true"></span>
        {names[category]}
        <span class="n">{counts[category]}</span>
      </button>
    {/each}
  </fieldset>
  <p class="count" aria-live="polite" data-testid="{testid}-count">
    {plural(locale, shown, t.results)}
  </p>
</div>

<style>
  fieldset {
    min-inline-size: 0;
    margin: 0;
    padding: 0;
    border: 0;
  }
  .filters {
    display: grid;
    gap: var(--space-sm);
  }
  .search {
    display: grid;
    gap: var(--space-2xs);
  }
  .label {
    font-family: var(--font-family-display);
    font-weight: var(--font-weight-semibold);
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
  }
  input {
    min-block-size: var(--size-touch-target);
    padding: var(--space-xs) var(--space-sm);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-lg);
    background: var(--color-surface);
    color: var(--color-text);
    font: inherit;
    transition: border-color var(--motion-duration-fast) var(--motion-easing-standard);
  }
  input:focus-visible {
    outline: var(--border-width-thick) solid var(--color-focus-ring);
    outline-offset: var(--space-3xs);
    border-color: var(--color-primary);
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-xs);
  }
  .chip {
    --chip-color: var(--color-primary);
    display: inline-flex;
    align-items: center;
    gap: var(--space-2xs);
    min-block-size: var(--size-touch-target);
    padding: var(--space-2xs) var(--space-sm);
    border: var(--border-width-medium) solid var(--chip-color);
    border-radius: var(--radius-pill);
    background: var(--color-surface);
    color: var(--color-text);
    font-family: var(--font-family-display);
    font-weight: var(--font-weight-semibold);
    font-size: var(--font-size-sm);
    cursor: pointer;
    transition:
      background-color var(--motion-duration-fast) var(--motion-easing-standard),
      color var(--motion-duration-fast) var(--motion-easing-standard),
      box-shadow var(--motion-duration-fast) var(--motion-easing-standard);
  }
  .chip[aria-pressed="true"] {
    background: var(--chip-color);
    color: var(--color-on-kind);
    box-shadow: var(--shadow-pop-sm);
  }
  .chip.all[aria-pressed="true"] {
    color: var(--color-on-primary);
  }
  .chip:focus-visible {
    outline: var(--border-width-thick) solid var(--color-focus-ring);
    outline-offset: var(--space-3xs);
  }
  .regular {
    --chip-color: var(--color-kind-regular);
  }
  .replaceable {
    --chip-color: var(--color-kind-replaceable);
  }
  .ephemeral {
    --chip-color: var(--color-kind-ephemeral);
  }
  .addressable {
    --chip-color: var(--color-kind-addressable);
  }
  .swatch {
    inline-size: var(--space-xs);
    block-size: var(--space-xs);
    border-radius: var(--radius-round);
    background: var(--chip-color);
    box-shadow: 0 0 0 var(--border-width-thin) var(--color-surface);
  }
  /* No opacity here: on a pressed (filled) chip a faded count drops below 4.5:1 contrast. */
  .n {
    font-family: var(--font-family-mono);
    font-size: var(--font-size-xs);
  }
  .count {
    margin: 0;
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
  }
</style>
