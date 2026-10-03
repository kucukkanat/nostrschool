<script lang="ts">
  /**
   * The landing page's course map, drawn as a notebook table of contents: ruled rows, a margin
   * rule, and an ink stamp per chapter (checked when done, orange for the next one). It is a plain
   * ordered list of links, so keyboard and screen-reader users get the same outline.
   */
  import { getDictionary, type Locale } from "@nostrschool/i18n";
  import { type Completed, chapterStatus, progress } from "./lib/progress.ts";
  import type { ChapterLink } from "./types.ts";

  interface Props {
    readonly locale: Locale;
    readonly chapters: readonly ChapterLink[];
  }
  const { locale, chapters }: Props = $props();
  const t = $derived(getDictionary(locale).common.progress);

  let completed = $state.raw<Completed>([]);
  $effect(() =>
    progress.$completed.subscribe((value) => {
      completed = value;
    }),
  );

  const statusLabel = $derived({ done: t.done, current: t.current, upcoming: t.upcoming });
  // Two notebook pages side by side on wide screens, filled column by column (1–6, 7–12).
  const rows = $derived(Math.ceil(chapters.length / 2));
</script>

<ol class="map" style:--rows={rows} data-testid="course-map">
  {#each chapters as chapter (chapter.slug)}
    {@const status = chapterStatus(completed, chapter.slug)}
    <li class="stop" data-status={status}>
      <a
        href={chapter.href}
        class="node"
        data-testid="course-map-{chapter.nn}"
        data-status={status}
      >
        <span class="stamp" aria-hidden="true">
          {#if status === "done"}
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
          {:else}
            {chapter.nn}
          {/if}
        </span>
        <span class="body">
          <span class="status">{statusLabel[status]}</span>
          <span class="title">{chapter.title}</span>
          <span class="summary">{chapter.summary}</span>
        </span>
      </a>
    </li>
  {/each}
</ol>

<style>
  .map {
    display: grid;
    margin: 0;
    padding: var(--space-xs) var(--space-md);
    list-style: none;
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-md);
    background: var(--color-surface-raised);
    box-shadow: var(--shadow-pop);
  }
  .stop {
    /* Ruled notebook lines (the last one too, like a page that keeps going). */
    border-block-end: var(--border-width-thin) solid var(--color-border);
  }
  .node {
    display: grid;
    grid-template-columns: var(--size-control-lg) minmax(0, 1fr);
    align-items: start;
    gap: var(--space-sm);
    padding-block: var(--space-sm);
    color: var(--color-text);
    text-decoration: none;
  }
  .stamp {
    display: grid;
    place-items: center;
    inline-size: var(--size-control-lg);
    block-size: var(--size-control-lg);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-sm);
    background: var(--color-surface);
    font-family: var(--font-family-mono);
    font-size: var(--font-size-md);
    font-weight: var(--font-weight-bold);
    box-shadow: var(--shadow-pop-sm);
    transition:
      translate var(--motion-duration-fast) var(--motion-easing-press),
      box-shadow var(--motion-duration-fast) var(--motion-easing-press);
  }
  [data-status="done"] .stamp {
    background: var(--color-success-solid);
    color: var(--color-on-success);
  }
  [data-status="current"] .stamp {
    background: var(--color-primary);
    color: var(--color-on-primary);
  }
  .node:hover .stamp,
  .node:focus-visible .stamp {
    translate: calc(var(--size-lift) * -1) calc(var(--size-lift) * -1);
    box-shadow: var(--shadow-lift);
  }
  .node:active .stamp {
    translate: var(--size-lift) var(--size-lift);
    box-shadow: var(--shadow-pressed);
  }
  /* The notebook's margin rule: one continuous accent-ink line down the entries. */
  .body {
    display: grid;
    gap: var(--space-3xs);
    min-block-size: var(--size-control-lg);
    padding-inline-start: var(--space-sm);
    border-inline-start: var(--border-width-medium) solid var(--color-text-primary);
  }
  .status {
    font-family: var(--font-family-mono);
    font-size: var(--font-size-2xs);
    font-weight: var(--font-weight-semibold);
    letter-spacing: var(--font-letter-spacing-caps);
    text-transform: uppercase;
    color: var(--color-text-muted);
  }
  [data-status="current"] .status {
    color: var(--color-text-primary);
  }
  .title {
    justify-self: start;
    font-family: var(--font-family-display);
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-bold);
    line-height: var(--font-line-height-snug);
    text-decoration: underline transparent var(--border-width-medium);
    text-underline-offset: 0.2em;
    transition: text-decoration-color var(--motion-duration-fast) var(--motion-easing-standard);
  }
  /* The next chapter gets a highlighter swipe, like a note to self. */
  [data-status="current"] .title {
    padding-inline: var(--space-3xs);
    margin-inline: calc(var(--space-3xs) * -1);
    background: var(--highlight-fill);
    color: var(--color-on-highlight);
  }
  .node:hover .title {
    text-decoration-color: currentColor;
  }
  .summary {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
  }
  svg {
    inline-size: var(--size-icon-md);
    block-size: var(--size-icon-md);
    fill: none;
    stroke: currentColor;
    stroke-width: 3;
    stroke-linecap: square;
    stroke-linejoin: miter;
  }
  /* >= tokens.breakpoint.md: two notebook pages, filled column by column. */
  @media (min-width: 768px) {
    .map {
      grid-auto-flow: column;
      grid-template-rows: repeat(var(--rows), auto);
      column-gap: var(--space-xl);
      padding-inline: var(--space-lg);
    }
  }
</style>
