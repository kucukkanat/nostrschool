<script lang="ts">
  import { $reducedMotion as reducedMotion } from "@nostrschool/ui";
  import type { Snippet } from "svelte";
  import { followScrollLeft, hiddenEdges, type ScrollView } from "../../logic/scroll.ts";

  /**
   * Horizontal scroller for lane diagrams. On phones the lanes are wider than the screen, so it
   * (1) pins an ink "more this way" tab to each edge that hides content (a printed cue, not a
   * fade: fades read as "nothing here" on paper) plus a visible ink scrollbar, and (2) scrolls the
   * current step into view whenever `follow` changes, so autoplay never animates off-screen.
   */
  let {
    testid,
    label,
    follow,
    children,
  }: {
    readonly testid: string;
    readonly label: string;
    /** Changing this re-centres on the `[data-state='current']` descendant. */
    readonly follow: number;
    readonly children: Snippet;
  } = $props();

  let el: HTMLElement | undefined = $state();
  let edges = $state({ start: false, end: false });
  const measure = (): void => {
    if (el !== undefined) edges = hiddenEdges(el);
  };

  $effect(() => {
    if (el === undefined) return;
    measure();
    const ro = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(measure);
    ro?.observe(el);
    return () => ro?.disconnect();
  });

  $effect(() => {
    void follow;
    const reduce = $reducedMotion;
    const target = el?.querySelector("[data-state='current']");
    if (el === undefined || target === null || target === undefined) return;
    const box = el.getBoundingClientRect();
    const r = target.getBoundingClientRect();
    const view: ScrollView = el;
    const start = r.left - box.left + el.scrollLeft;
    const left = followScrollLeft(view, { start, end: start + r.width }, 16);
    // Only the strip scrolls: scrollIntoView would also yank the page vertically mid-read.
    if (left !== el.scrollLeft) el.scrollTo({ left, behavior: reduce ? "auto" : "smooth" });
  });
</script>

<div class="wrap">
  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <!-- biome-ignore-start lint/a11y/noNoninteractiveTabindex: wide diagrams scroll sideways on phones; keyboard users need a tab stop to scroll them (WCAG 2.1.1, axe scrollable-region-focusable). -->
  <section
    tabindex="0"
    bind:this={el}
    class="strip"
    data-testid="{testid}-scroll"
    data-overflow-start={edges.start}
    data-overflow-end={edges.end}
    aria-label={label}
    onscroll={measure}
  >
    {@render children()}
  </section>
  <!-- biome-ignore-end lint/a11y/noNoninteractiveTabindex: see above -->
  <!-- Decorative: the strip's aria-label + focus already announce that it scrolls. -->
  {#if edges.start}
    <span class="cue start" aria-hidden="true" data-testid="{testid}-scroll-cue-start">←</span>
  {/if}
  {#if edges.end}
    <span class="cue end" aria-hidden="true" data-testid="{testid}-scroll-cue-end">→</span>
  {/if}
</div>

<style>
  .wrap {
    position: relative;
    min-width: 0;
  }
  .strip {
    overflow-x: auto;
    overscroll-behavior-x: contain;
    /* A real, always-visible ink scrollbar is the primary affordance on touch and desktop. */
    scrollbar-width: thin;
    scrollbar-color: var(--color-border-strong) var(--color-surface-sunken);
    padding-block-end: var(--space-xs);
    border-radius: var(--radius-sm);
  }
  .strip:focus-visible {
    outline: var(--border-width-thick) solid var(--color-focus-ring);
    outline-offset: var(--size-focus-offset);
  }
  /* Edge tabs: paper chip, ink outline, hard shadow — like a sticky tab on a notebook page. */
  /* Pinned to the bottom edge, above the scrollbar: lane diagrams put their headers in the top
     row, and a tab there covered the last visible lane label. */
  .cue {
    position: absolute;
    bottom: calc(var(--space-xs) * 2);
    display: grid;
    place-items: center;
    width: var(--size-icon-lg);
    height: var(--size-icon-lg);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-sm);
    background: var(--color-surface-raised);
    color: var(--color-text);
    box-shadow: var(--shadow-pop-sm);
    font-family: var(--font-family-mono);
    font-weight: var(--font-weight-bold);
    font-size: var(--font-size-sm);
    line-height: var(--font-line-height-tight);
    pointer-events: none;
  }
  .cue.start {
    inset-inline-start: var(--space-2xs);
  }
  .cue.end {
    inset-inline-end: var(--space-2xs);
  }
</style>
