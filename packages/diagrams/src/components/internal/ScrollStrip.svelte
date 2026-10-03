<script lang="ts">
  import { $reducedMotion as reducedMotion } from "@nostrschool/ui";
  import type { Snippet } from "svelte";
  import { followScrollLeft, hiddenEdges, type ScrollView } from "../../logic/scroll.ts";

  /**
   * Horizontal scroller for lane diagrams. On phones the lanes are wider than the screen, so it
   * (1) fades the edges that hide content and (2) scrolls the current step into view whenever
   * `follow` changes, so autoplay never animates off-screen.
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

<style>
  .strip {
    --fade: var(--space-lg);
    overflow-x: auto;
  }
  .strip[data-overflow-end="true"] {
    mask-image: linear-gradient(to right, black calc(100% - var(--fade)), transparent);
  }
  .strip[data-overflow-start="true"] {
    mask-image: linear-gradient(to left, black calc(100% - var(--fade)), transparent);
  }
  .strip[data-overflow-start="true"][data-overflow-end="true"] {
    mask-image: linear-gradient(
      to right,
      transparent,
      black var(--fade),
      black calc(100% - var(--fade)),
      transparent
    );
  }
</style>
