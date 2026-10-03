<script lang="ts">
  import { rovingIndex } from "../lib/roving.ts";
  import type { TabsProps } from "../types.ts";

  let { testid, tabs, selected = $bindable(), label, onchange, panel }: TabsProps = $props();
  const active = $derived(
    tabs.find((t) => t.id === selected && t.disabled !== true)?.id ??
      tabs.find((t) => t.disabled !== true)?.id ??
      "",
  );
  const uid = $props.id();
  const buttons: HTMLButtonElement[] = $state([]);

  const choose = (id: string) => {
    if (id === active) return;
    selected = id;
    onchange?.(id);
  };
  // Automatic activation (focus = select) per WAI-ARIA tabs pattern: panels here are cheap to render.
  const onkeydown = (e: KeyboardEvent, from: number) => {
    const next = rovingIndex(tabs.length, from, e.key, (i) => tabs[i]?.disabled === true);
    const tab = next === undefined ? undefined : tabs[next];
    if (next === undefined || tab === undefined) return;
    e.preventDefault();
    choose(tab.id);
    buttons[next]?.focus();
  };
</script>

<div class="tabs" data-testid={testid}>
  <div class="list" role="tablist" aria-label={label}>
    {#each tabs as tab, i (tab.id)}
      <button
        bind:this={buttons[i]}
        type="button"
        role="tab"
        class="tab"
        id="{uid}-tab-{tab.id}"
        data-testid="{testid}-tab-{tab.id}"
        aria-selected={tab.id === active}
        aria-controls="{uid}-panel"
        tabindex={tab.id === active ? 0 : -1}
        disabled={tab.disabled}
        onclick={() => choose(tab.id)}
        onkeydown={(e) => onkeydown(e, i)}
      >
        {tab.label}
      </button>
    {/each}
  </div>
  <div
    class="panel"
    role="tabpanel"
    id="{uid}-panel"
    aria-labelledby="{uid}-tab-{active}"
    data-testid="{testid}-panel"
  >
    {#key active}
      <div class="panel-inner">{@render panel(active)}</div>
    {/key}
  </div>
</div>

<style>
  /* One row that scrolls sideways instead of wrapping: a wrapped pill turns into a lumpy blob on
     phones. The padding leaves room for the active tab's offset shadow inside the scroll clip,
     and the tabs themselves are focusable so keyboard users reach every one (arrow keys scroll). */
  /* Tabs often sit in grid/flex cards; without this the root's automatic min size is the whole
     unwrapped tab row, which widens the card (and the page) instead of letting the list scroll. */
  .tabs {
    min-inline-size: 0;
  }
  .list {
    display: flex;
    flex-wrap: nowrap;
    gap: var(--space-2xs);
    padding: var(--space-2xs);
    border-radius: var(--radius-pill);
    background: var(--color-surface-sunken);
    inline-size: fit-content;
    max-inline-size: 100%;
    overflow-x: auto;
    overscroll-behavior-x: contain;
    scroll-snap-type: x proximity;
    scroll-padding-inline: var(--space-2xs);
    scrollbar-width: none;
  }
  .tab {
    flex: none;
    scroll-snap-align: start;
    white-space: nowrap;
    min-height: var(--size-control-md);
    padding: 0 var(--space-md);
    border: none;
    border-radius: var(--radius-pill);
    background: transparent;
    color: var(--color-text-muted);
    font-family: var(--font-family-display);
    font-size: var(--font-size-md);
    font-weight: var(--font-weight-semibold);
    cursor: pointer;
    transition:
      background-color var(--motion-duration-fast) var(--motion-easing-standard),
      color var(--motion-duration-fast) var(--motion-easing-standard),
      scale var(--motion-duration-normal) var(--motion-easing-bounce);
  }
  .tab:hover:not(:disabled, [aria-selected="true"]) {
    background: var(--color-primary-subtle);
    color: var(--color-text);
  }
  .tab[aria-selected="true"] {
    background: var(--color-primary);
    color: var(--color-on-primary);
    box-shadow: var(--shadow-pop-sm);
  }
  .tab:active:not(:disabled) {
    scale: 0.95;
  }
  .tab:disabled {
    opacity: var(--opacity-disabled);
    cursor: not-allowed;
  }
  .tab:focus-visible {
    outline: var(--border-width-thick) solid var(--color-focus-ring);
    outline-offset: var(--space-3xs);
  }
  /* Mirrors tokens.breakpoint.sm (480px): CSS vars can't be used in media queries. Tighter tabs
     let typical 3–4 short labels fit a phone without scrolling at all. */
  @media (max-width: 479.98px) {
    .tab {
      padding: 0 var(--space-sm);
      font-size: var(--font-size-sm);
    }
  }
  .panel {
    margin-top: var(--space-md);
    border-radius: var(--radius-md);
  }
  .panel-inner {
    animation: fade-in var(--motion-duration-normal) var(--motion-easing-decelerate);
  }
  @keyframes fade-in {
    from {
      opacity: 0;
      translate: 0 var(--space-2xs);
    }
  }
</style>
