<script lang="ts">
  /** "Mark chapter complete" at the end of a lesson: updates the rail and cheers the mascot. */
  import { getDictionary, type Locale } from "@nostrschool/i18n";
  import { mascotBus } from "@nostrschool/ui/bus.ts";
  import type { ChapterSlug } from "~/lib/chapters";
  import { type Completed, progress } from "./lib/progress.ts";
  import { warnStorage } from "./lib/storage.ts";

  interface Props {
    readonly locale: Locale;
    readonly slug: ChapterSlug;
    readonly order: number;
  }
  const { locale, slug, order }: Props = $props();
  const t = $derived(getDictionary(locale).common);

  let completed = $state.raw<Completed>([]);
  let announcement = $state("");
  $effect(() =>
    progress.$completed.subscribe((value) => {
      completed = value;
    }),
  );
  const done = $derived(completed.includes(slug));

  const toggle = () => {
    const next = !done;
    const result = progress.setCompleted(slug, next);
    if (!result.ok) warnStorage("progress not saved", result.error);
    announcement = next ? t.progress.celebrate : "";
    if (next) mascotBus.emit("chapter:complete", { chapter: order });
  };
</script>

<div class="complete" data-testid="chapter-complete-region">
  <button
    type="button"
    class="button"
    class:done
    aria-pressed={done}
    data-testid="chapter-complete"
    onclick={toggle}
  >
    <span class="check" aria-hidden="true">
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M5 12.5l4.5 4.5L19 7.5" />
      </svg>
    </span>
    {done ? t.chapter.completed : t.chapter.complete}
  </button>
  {#if done}
    <button type="button" class="undo" data-testid="chapter-complete-undo" onclick={toggle}>
      {t.progress.markIncomplete}
    </button>
  {/if}
  <p class="visually-hidden" aria-live="polite" data-testid="chapter-complete-status">
    {announcement}
  </p>
</div>

<style>
  .complete {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: var(--space-sm);
    margin-block: var(--space-xl);
  }
  .button {
    display: inline-flex;
    align-items: center;
    gap: var(--space-xs);
    min-block-size: var(--size-control-lg);
    padding: 0 var(--space-lg);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-md);
    background: var(--color-surface-raised);
    color: var(--color-text);
    font: inherit;
    font-family: var(--font-family-display);
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-bold);
    box-shadow: var(--shadow-pop);
    cursor: pointer;
    transition:
      translate var(--motion-duration-press) var(--motion-easing-press),
      box-shadow var(--motion-duration-press) var(--motion-easing-press);
  }
  .button:hover {
    translate: calc(var(--size-lift) * -1) calc(var(--size-lift) * -1);
    box-shadow: var(--shadow-lift);
  }
  .button:active {
    translate: var(--size-press) var(--size-press);
    box-shadow: var(--shadow-pressed);
  }
  .button.done {
    background: var(--color-success-solid);
    color: var(--color-on-success);
  }
  /* A checkbox square that gets ticked, like a to-do in the margin. */
  .check {
    display: grid;
    place-items: center;
    inline-size: var(--size-icon-lg);
    block-size: var(--size-icon-lg);
    border-radius: var(--radius-sm);
    border: var(--border-width-medium) solid currentColor;
    background: var(--color-surface-raised);
    color: var(--color-text);
  }
  svg {
    inline-size: var(--size-icon-sm);
    block-size: var(--size-icon-sm);
    fill: none;
    stroke: currentColor;
    stroke-width: 3;
    stroke-linecap: square;
    stroke-linejoin: miter;
    /* 24 ≈ the check path's length, so the tick draws itself in. */
    stroke-dasharray: 24;
  }
  .done .check svg {
    animation: tick var(--motion-duration-slow) var(--motion-easing-decelerate);
  }
  .button:not(.done) svg {
    opacity: 0;
  }
  .undo {
    min-block-size: var(--size-touch-target);
    border: 0;
    background: none;
    color: var(--color-text-muted);
    font: inherit;
    font-size: var(--font-size-sm);
    text-decoration: underline;
    cursor: pointer;
  }
  @keyframes tick {
    from {
      stroke-dashoffset: 24;
    }
  }
</style>
