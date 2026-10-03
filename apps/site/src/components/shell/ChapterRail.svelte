<script lang="ts">
  /**
   * Sticky course outline beside a chapter: where you are, what you've finished.
   * On small screens it collapses behind a toggle so the lesson comes first.
   */
  import { format, getDictionary, type Locale } from "@nostrschool/i18n";
  import type { ChapterSlug } from "~/lib/chapters";
  import { type Completed, progress } from "./lib/progress.ts";
  import type { ChapterLink } from "./types.ts";

  interface Props {
    readonly locale: Locale;
    readonly chapters: readonly ChapterLink[];
    readonly current: ChapterSlug;
  }
  const { locale, chapters, current }: Props = $props();
  const t = $derived(getDictionary(locale).common);

  let completed = $state.raw<Completed>([]);
  let open = $state(false);
  $effect(() =>
    progress.$completed.subscribe((value) => {
      completed = value;
    }),
  );

  const count = $derived(
    format(t.progress.completedCount, { done: completed.length, total: chapters.length }),
  );
  const ratio = $derived(chapters.length === 0 ? 0 : completed.length / chapters.length);
  const listId = $props.id();
</script>

<nav class="rail" aria-label={t.chapter.progress} data-testid="chapter-rail" data-open={open}>
  <div class="head">
    <p class="count" data-testid="chapter-rail-count">{count}</p>
    <div class="meter" aria-hidden="true"><span style:--ratio={ratio}></span></div>
    <button
      type="button"
      class="toggle"
      aria-expanded={open}
      aria-controls={listId}
      data-testid="chapter-rail-toggle"
      onclick={() => (open = !open)}
    >
      {open ? t.progress.hideChapters : t.progress.showChapters}
    </button>
  </div>
  <ol id={listId} class="list">
    {#each chapters as chapter (chapter.slug)}
      {@const done = completed.includes(chapter.slug)}
      <li>
        <a
          href={chapter.href}
          class="item"
          class:done
          aria-current={chapter.slug === current ? "page" : undefined}
          data-testid="chapter-rail-{chapter.nn}"
          data-done={done}
        >
          <span class="badge" aria-hidden="true">
            {#if done}
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M5 12.5l4.5 4.5L19 7.5" />
              </svg>
            {:else}
              {chapter.order}
            {/if}
          </span>
          <span class="title">{chapter.title}</span>
          {#if done}
            <span class="visually-hidden">({t.progress.done})</span>
          {/if}
        </a>
      </li>
    {/each}
  </ol>
</nav>

<style>
  .rail {
    display: grid;
    gap: var(--space-sm);
    padding: var(--space-md);
    border-radius: var(--radius-lg);
    background: var(--color-surface);
    border: var(--border-width-medium) solid var(--color-border);
  }
  .head {
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
    gap: var(--space-xs);
  }
  .count {
    margin: 0;
    font-family: var(--font-family-display);
    font-weight: var(--font-weight-semibold);
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
  }
  .meter {
    grid-column: 1 / -1;
    grid-row: 2;
    block-size: var(--space-2xs);
    border-radius: var(--radius-pill);
    background: var(--color-surface-sunken);
    overflow: hidden;
  }
  .meter span {
    display: block;
    block-size: 100%;
    inline-size: calc(var(--ratio) * 100%);
    background: var(--color-success-solid);
    border-radius: inherit;
    transition: inline-size var(--motion-duration-slow) var(--motion-easing-bounce);
  }
  .toggle {
    min-block-size: var(--size-control-sm);
    padding: 0 var(--space-sm);
    border: var(--border-width-thin) solid var(--color-border-strong);
    border-radius: var(--radius-pill);
    background: var(--color-surface-raised);
    color: var(--color-text);
    font: inherit;
    font-size: var(--font-size-sm);
    cursor: pointer;
  }
  .list {
    display: none;
    gap: var(--space-3xs);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  [data-open="true"] .list {
    display: grid;
  }
  .item {
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: center;
    gap: var(--space-xs);
    padding: var(--space-2xs) var(--space-xs);
    border-radius: var(--radius-md);
    color: var(--color-text);
    text-decoration: none;
    font-size: var(--font-size-sm);
    transition:
      background var(--motion-duration-fast) var(--motion-easing-standard),
      translate var(--motion-duration-normal) var(--motion-easing-bounce);
  }
  .item:hover {
    background: var(--color-primary-subtle);
    translate: var(--space-3xs) 0;
  }
  .item[aria-current="page"] {
    background: var(--color-primary-subtle);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
  }
  .badge {
    display: grid;
    place-items: center;
    inline-size: var(--size-icon-lg);
    block-size: var(--size-icon-lg);
    border-radius: var(--radius-round);
    border: var(--border-width-medium) solid var(--color-border-strong);
    background: var(--color-surface);
    font-family: var(--font-family-display);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-bold);
  }
  [aria-current="page"] .badge {
    border-color: var(--color-primary);
    background: var(--color-primary);
    color: var(--color-on-primary);
  }
  .done .badge {
    border-color: var(--color-success-solid);
    background: var(--color-success-solid);
    color: var(--color-on-success);
  }
  svg {
    inline-size: var(--size-icon-sm);
    block-size: var(--size-icon-sm);
    fill: none;
    stroke: currentColor;
    stroke-width: 3;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  /* >= tokens.breakpoint.lg: the rail sits beside the content and is always expanded. */
  @media (min-width: 1024px) {
    .toggle {
      display: none;
    }
    .list {
      display: grid;
    }
  }
</style>
