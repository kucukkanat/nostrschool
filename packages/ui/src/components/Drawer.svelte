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
  /* "Under the hood" is a folded-over flap: dashed edge while closed (an invitation to open),
     a solid ink page on a hard shadow once open. */
  .drawer {
    margin: var(--space-lg) 0;
    border: var(--border-width-medium) dashed var(--color-border-strong);
    border-radius: var(--radius-md);
    background: var(--color-surface-sunken);
    transition:
      background-color var(--motion-duration-fast) var(--motion-easing-standard),
      box-shadow var(--motion-duration-press) var(--motion-easing-press);
  }
  .drawer[open] {
    border-style: solid;
    background: var(--color-surface);
    box-shadow: var(--shadow-pop-sm);
  }
  /* Grid, not wrapping flex: markers and hint keep fixed columns so a long title wraps
     beside them on phones instead of dropping below an orphaned marker row. */
  summary {
    display: grid;
    grid-template-columns: auto auto minmax(0, 1fr) auto;
    align-items: center;
    gap: var(--space-xs);
    min-height: var(--size-touch-target);
    padding: var(--space-xs) var(--space-md);
    border-radius: var(--radius-md);
    font-family: var(--font-family-display);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text);
    cursor: pointer;
    list-style: none;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
  }
  .drawer[open] summary {
    border-bottom: var(--border-width-thin) dashed var(--color-border-strong);
    border-end-start-radius: 0;
    border-end-end-radius: 0;
  }
  summary::-webkit-details-marker {
    display: none;
  }
  summary:focus-visible {
    outline: var(--border-width-thick) solid var(--color-focus-ring);
    outline-offset: var(--size-focus-offset);
  }
  .chevron,
  .gear {
    display: inline-block;
    transition: rotate var(--motion-duration-normal) var(--motion-easing-bounce);
  }
  .gear {
    color: var(--color-text-primary);
  }
  @media (hover: hover) {
    summary:hover .gear {
      rotate: 0.25turn;
    }
    summary:hover .title {
      text-decoration: underline var(--border-width-medium) var(--color-text-primary);
      text-underline-offset: var(--space-2xs);
    }
  }
  .drawer[open] .chevron {
    rotate: 0.25turn;
  }
  .title {
    min-inline-size: 0;
    overflow-wrap: break-word;
  }
  .hint {
    align-self: center;
    color: var(--color-text-muted);
    font-family: var(--font-family-mono);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-regular);
    letter-spacing: var(--font-letter-spacing-caps);
    text-transform: uppercase;
  }
  .content {
    min-inline-size: 0;
    padding: var(--space-md);
    animation: unfold var(--motion-duration-normal) var(--motion-easing-decelerate);
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
    min-height: var(--size-touch-target);
    margin-top: var(--space-md);
    padding-top: var(--space-xs);
    border-top: var(--border-width-thin) dashed var(--color-border);
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
    cursor: pointer;
  }
  .always input {
    flex: none;
    inline-size: var(--size-icon-md);
    block-size: var(--size-icon-md);
    margin: 0;
    /* Ink, not orange: a checked box must read on paper (orange is only 2.7:1). */
    accent-color: var(--color-text);
  }
  .always input:focus-visible {
    outline: var(--border-width-thick) solid var(--color-focus-ring);
    outline-offset: var(--size-focus-offset);
  }
</style>
