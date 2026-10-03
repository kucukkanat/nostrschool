<script lang="ts">
  import { getDictionary } from "@nostrschool/i18n";
  import { $alwaysExpandDrawers as alwaysExpand } from "../stores.ts";
  import type { DrawerProps } from "../types.ts";

  let { testid, locale, title, open = $bindable(false), children }: DrawerProps = $props();
  const t = $derived(getDictionary(locale).ui.underTheHood);
  const label = $derived(title ?? t.title);
  const contentId = $props.id();

  // Applies on hydration and whenever the preference flips on (in this or another drawer).
  // Turning it off never collapses drawers the reader currently has open.
  $effect(() => {
    if ($alwaysExpand) open = true;
  });
</script>

<details class="drawer" data-testid={testid} data-open={open} bind:open>
  <summary data-testid="{testid}-toggle" aria-controls={contentId}>
    <span class="chevron" aria-hidden="true">▸</span>
    <span class="gear" aria-hidden="true">⚙</span>
    <span class="title">{label}</span>
    <span class="hint">{open ? t.hide : t.show}</span>
  </summary>
  <div class="content" id={contentId} data-testid="{testid}-content">
    {@render children()}
    <label class="always">
      <input
        type="checkbox"
        data-testid="{testid}-always"
        checked={$alwaysExpand}
        onchange={(e) => alwaysExpand.set(e.currentTarget.checked)}
      >
      {t.alwaysExpand}
    </label>
  </div>
</details>

<style>
  .drawer {
    margin: var(--space-lg) 0;
    border: var(--border-width-medium) dashed var(--color-border-strong);
    border-radius: var(--radius-lg);
    background: var(--color-surface-sunken);
    transition: border-color var(--motion-duration-fast) var(--motion-easing-standard);
  }
  .drawer[open] {
    border-style: solid;
    border-color: var(--color-primary);
  }
  summary {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    min-height: var(--size-touch-target);
    padding: var(--space-xs) var(--space-md);
    border-radius: var(--radius-lg);
    font-family: var(--font-family-display);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    cursor: pointer;
    list-style: none;
    user-select: none;
  }
  summary::-webkit-details-marker {
    display: none;
  }
  summary:focus-visible {
    outline: var(--border-width-thick) solid var(--color-focus-ring);
    outline-offset: var(--space-3xs);
  }
  .chevron,
  .gear {
    display: inline-block;
    transition: rotate var(--motion-duration-normal) var(--motion-easing-bounce);
  }
  summary:hover .gear {
    rotate: 0.25turn;
  }
  .drawer[open] .chevron {
    rotate: 0.25turn;
  }
  .hint {
    margin-left: auto;
    color: var(--color-text-muted);
    font-family: var(--font-family-body);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-regular);
  }
  .content {
    padding: 0 var(--space-md) var(--space-md);
    animation: unfold var(--motion-duration-normal) var(--motion-easing-bounce);
    transform-origin: top;
  }
  @keyframes unfold {
    from {
      opacity: 0;
      translate: 0 calc(-1 * var(--space-xs));
    }
  }
  .always {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    margin-top: var(--space-md);
    padding-top: var(--space-sm);
    border-top: var(--border-width-thin) solid var(--color-border);
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
    cursor: pointer;
  }
  .always input {
    inline-size: var(--size-icon-sm);
    block-size: var(--size-icon-sm);
    accent-color: var(--color-primary);
  }
  .always input:focus-visible {
    outline: var(--border-width-thick) solid var(--color-focus-ring);
    outline-offset: var(--space-3xs);
  }
</style>
