<script lang="ts">
  /**
   * The landing CTA. Server-renders "Start learning" → chapter 1; returning learners get
   * "Continue: <next unfinished chapter>" once their progress is read after hydration.
   */
  import { format, getDictionary, type Locale } from "@nostrschool/i18n";
  import { type Completed, nextChapter, progress } from "./lib/progress.ts";
  import type { ChapterLink } from "./types.ts";

  interface Props {
    readonly locale: Locale;
    readonly chapters: readonly ChapterLink[];
    readonly testid?: string;
  }
  const { locale, chapters, testid = "home-start" }: Props = $props();
  const t = $derived(getDictionary(locale).common);

  let completed = $state.raw<Completed>([]);
  $effect(() =>
    progress.$completed.subscribe((value) => {
      completed = value;
    }),
  );
  const target = $derived(
    chapters.find((c) => c.slug === nextChapter(completed).slug) ?? chapters[0],
  );
  const resuming = $derived(completed.length > 0 && target !== undefined);
</script>

{#if target !== undefined}
  <a class="cta" href={target.href} data-testid={testid} data-resuming={resuming}>
    {resuming ? format(t.home.ctaContinue, { title: target.title }) : t.learn.start}
    <span class="arrow" aria-hidden="true">→</span>
  </a>
{/if}

<style>
  /* The main action: orange fill, ink outline and ink text, hard shadow. Hover lifts it off the
     page; pressing pushes it into its shadow. */
  .cta {
    display: inline-flex;
    align-items: center;
    gap: var(--space-sm);
    min-block-size: var(--size-control-lg);
    padding: var(--space-xs) var(--space-lg);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-md);
    background: var(--color-primary);
    color: var(--color-on-primary);
    font-family: var(--font-family-display);
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-bold);
    text-decoration: none;
    box-shadow: var(--shadow-pop);
    transition:
      translate var(--motion-duration-press) var(--motion-easing-press),
      box-shadow var(--motion-duration-press) var(--motion-easing-press),
      background var(--motion-duration-fast) var(--motion-easing-standard);
  }
  .cta:hover {
    background: var(--color-primary-hover);
    translate: calc(var(--size-lift) * -1) calc(var(--size-lift) * -1);
    box-shadow: var(--shadow-lift);
  }
  .cta:active {
    background: var(--color-primary-active);
    translate: var(--size-press) var(--size-press);
    box-shadow: var(--shadow-pressed);
  }
  .arrow {
    font-family: var(--font-family-mono);
    transition: translate var(--motion-duration-normal) var(--motion-easing-bounce);
  }
  .cta:hover .arrow {
    translate: var(--space-2xs) 0;
  }
</style>
