<script lang="ts">
  /** Course index cards with per-chapter completion and an overall count. */
  import { format, getDictionary, type Locale } from "@nostrschool/i18n";
  import { type Completed, chapterStatus, progress } from "./lib/progress.ts";
  import type { ChapterLink } from "./types.ts";

  interface Props {
    readonly locale: Locale;
    readonly chapters: readonly ChapterLink[];
  }
  const { locale, chapters }: Props = $props();
  const t = $derived(getDictionary(locale).common);

  let completed = $state.raw<Completed>([]);
  $effect(() =>
    progress.$completed.subscribe((value) => {
      completed = value;
    }),
  );
  const statusLabel = $derived({
    done: t.progress.done,
    current: t.progress.current,
    upcoming: t.progress.upcoming,
  });
  const allDone = $derived(chapters.length > 0 && completed.length === chapters.length);
</script>

<p class="summary" data-testid="chapter-grid-count" aria-live="polite">
  {allDone
    ? t.progress.allDone
    : format(t.progress.completedCount, { done: completed.length, total: chapters.length })}
</p>
<ol class="grid" data-testid="chapter-list">
  {#each chapters as chapter (chapter.slug)}
    {@const status = chapterStatus(completed, chapter.slug)}
    <li class="card" data-status={status}>
      <a
        href={chapter.href}
        class="link"
        data-testid="chapter-link-{chapter.nn}"
        data-status={status}
      >
        <span class="top">
          <span class="number">{format(t.chapter.chapter, { n: chapter.order })}</span>
          <span class="status">{statusLabel[status]}</span>
        </span>
        <span class="title">{chapter.title}</span>
        <span class="text">{chapter.summary}</span>
      </a>
    </li>
  {/each}
</ol>

<style>
  .summary {
    margin: 0 0 var(--space-md);
    font-family: var(--font-family-display);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-muted);
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, calc(var(--size-rail) * 1.2)), 1fr));
    gap: var(--space-md);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .link {
    display: grid;
    gap: var(--space-xs);
    block-size: 100%;
    padding: var(--space-lg);
    border: var(--border-width-medium) solid var(--color-text);
    border-radius: var(--radius-lg);
    background: var(--color-surface);
    color: var(--color-text);
    text-decoration: none;
    box-shadow: var(--shadow-pop-sm);
    transition:
      transform var(--motion-duration-normal) var(--motion-easing-bounce),
      box-shadow var(--motion-duration-fast) var(--motion-easing-standard);
  }
  .link:hover,
  .link:focus-visible {
    transform: translate(calc(var(--space-3xs) * -1), calc(var(--space-3xs) * -1)) rotate(-0.5deg);
    box-shadow: var(--shadow-pop);
  }
  .top {
    display: flex;
    justify-content: space-between;
    gap: var(--space-xs);
    font-size: var(--font-size-xs);
    text-transform: uppercase;
    letter-spacing: var(--font-letter-spacing-caps);
  }
  .number {
    color: var(--color-text-primary);
    font-weight: var(--font-weight-bold);
  }
  .status {
    padding: 0 var(--space-xs);
    border-radius: var(--radius-pill);
    background: var(--color-surface-sunken);
    color: var(--color-text);
  }
  [data-status="done"] .status {
    background: var(--color-success-solid);
    color: var(--color-on-success);
  }
  [data-status="current"] .status {
    background: var(--color-primary);
    color: var(--color-on-primary);
  }
  .title {
    font-family: var(--font-family-display);
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-bold);
    line-height: var(--font-line-height-tight);
  }
  .text {
    color: var(--color-text-muted);
  }
</style>
