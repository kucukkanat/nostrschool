<script lang="ts">
  /** Thin bar pinned to the top of a chapter showing how far through the page you've scrolled. */
  import { getDictionary, type Locale } from "@nostrschool/i18n";
  import { readingProgress } from "./lib/geometry.ts";

  interface Props {
    readonly locale: Locale;
  }
  const { locale }: Props = $props();
  const label = $derived(getDictionary(locale).common.progress.reading);

  let value = $state(0);
  $effect(() => {
    let frame = 0;
    const measure = () => {
      frame = 0;
      const el = document.documentElement;
      value = readingProgress({
        scrollTop: el.scrollTop,
        scrollHeight: el.scrollHeight,
        clientHeight: el.clientHeight,
      });
    };
    // One measurement per frame at most, however fast scroll events arrive.
    const schedule = () => {
      if (frame === 0) frame = requestAnimationFrame(measure);
    };
    measure();
    addEventListener("scroll", schedule, { passive: true });
    addEventListener("resize", schedule);
    return () => {
      removeEventListener("scroll", schedule);
      removeEventListener("resize", schedule);
      if (frame !== 0) cancelAnimationFrame(frame);
    };
  });
  const percent = $derived(Math.round(value * 100));
</script>

<div
  class="reading"
  role="progressbar"
  aria-label={label}
  aria-valuemin={0}
  aria-valuemax={100}
  aria-valuenow={percent}
  data-testid="reading-progress"
>
  <span class="bar" style:--progress={value}></span>
</div>

<style>
  .reading {
    position: fixed;
    inset-block-start: 0;
    inset-inline: 0;
    z-index: var(--z-toast);
    block-size: var(--space-2xs);
    background: transparent;
    pointer-events: none;
  }
  /* A solid orange strip with an ink edge: the fill alone is too light against paper. */
  .bar {
    display: block;
    block-size: 100%;
    background: var(--color-primary);
    border-block-end: var(--border-width-medium) solid var(--color-border-strong);
    transform-origin: left center;
    transform: scaleX(var(--progress));
  }
  :global([dir="rtl"]) .bar {
    transform-origin: right center;
  }
</style>
