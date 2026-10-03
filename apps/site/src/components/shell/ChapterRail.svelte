<script lang="ts">
  /**
   * Course outline beside a chapter: where you are, what you've finished.
   * From tokens.breakpoint.lg it sits in a sticky column, always expanded. Below that it is a
   * compact progress card whose "Show chapters" button opens the list as a bottom sheet, so the
   * lesson comes first and the outline is one thumb-reach away. The sheet is a disclosure
   * (aria-expanded), not a modal: Escape, the Close button or a tap outside it closes it and
   * focus returns to the toggle.
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
  let toggleEl = $state<HTMLButtonElement>();
  let sheetEl = $state<HTMLElement>();
  let closeEl = $state<HTMLButtonElement>();
  $effect(() =>
    progress.$completed.subscribe((value) => {
      completed = value;
    }),
  );

  const count = $derived(
    format(t.progress.completedCount, { done: completed.length, total: chapters.length }),
  );
  const ratio = $derived(chapters.length === 0 ? 0 : completed.length / chapters.length);
  const sheetId = $props.id();

  const close = () => {
    open = false;
    toggleEl?.focus();
  };

  const toggle = () => {
    if (open) close();
    else open = true;
  };

  // While the sheet is open: focus its Close button, and close on Escape or a tap outside it.
  $effect(() => {
    if (!open) return;
    closeEl?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    const onClick = (e: MouseEvent) => {
      const target = e.target instanceof Node ? e.target : null;
      if (target === null || sheetEl?.contains(target) || toggleEl?.contains(target)) return;
      close();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick);
    };
  });
</script>

<nav class="rail" aria-label={t.chapter.progress} data-testid="chapter-rail" data-open={open}>
  <div class="head">
    <p class="count" data-testid="chapter-rail-count">{count}</p>
    <div class="meter" aria-hidden="true"><span style:--ratio={ratio}></span></div>
    <button
      bind:this={toggleEl}
      type="button"
      class="toggle"
      aria-expanded={open}
      aria-controls={sheetId}
      data-testid="chapter-rail-toggle"
      onclick={toggle}
    >
      {open ? t.progress.hideChapters : t.progress.showChapters}
    </button>
  </div>
  <!-- Visual scrim only: taps on it are handled by the document listener above. -->
  <div class="scrim" aria-hidden="true" data-testid="chapter-rail-scrim"></div>
  <div bind:this={sheetEl} id={sheetId} class="sheet" data-testid="chapter-rail-sheet">
    <div class="sheet-head">
      <p class="sheet-title">{count}</p>
      <button
        bind:this={closeEl}
        type="button"
        class="close"
        data-testid="chapter-rail-close"
        onclick={close}
      >
        {t.nav.close}
      </button>
    </div>
    <ol class="list">
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
                {chapter.nn}
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
  </div>
</nav>

<style>
  .rail {
    display: grid;
    gap: var(--space-sm);
    padding: var(--space-sm) var(--space-md);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-md);
    background: var(--color-surface-raised);
    box-shadow: var(--shadow-pop-sm);
  }
  .head {
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
    gap: var(--space-xs) var(--space-sm);
  }
  .count,
  .sheet-title {
    margin: 0;
    font-family: var(--font-family-mono);
    font-weight: var(--font-weight-semibold);
    font-size: var(--font-size-xs);
    letter-spacing: var(--font-letter-spacing-wide);
    color: var(--color-text-muted);
  }
  /* Progress meter: an ink-outlined strip filled like a stamp pad. */
  .meter {
    grid-column: 1 / -1;
    grid-row: 2;
    block-size: var(--space-xs);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-sm);
    background: var(--color-surface);
    overflow: hidden;
  }
  .meter span {
    display: block;
    block-size: 100%;
    inline-size: calc(var(--ratio) * 100%);
    background: var(--color-success-solid);
    transition: inline-size var(--motion-duration-slow) var(--motion-easing-decelerate);
  }
  .toggle,
  .close {
    min-block-size: var(--size-touch-target);
    padding: 0 var(--space-sm);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-md);
    background: var(--color-surface);
    color: var(--color-text);
    font: inherit;
    font-family: var(--font-family-display);
    font-weight: var(--font-weight-bold);
    font-size: var(--font-size-sm);
    box-shadow: var(--shadow-pop-sm);
    cursor: pointer;
    transition:
      translate var(--motion-duration-press) var(--motion-easing-press),
      box-shadow var(--motion-duration-press) var(--motion-easing-press);
  }
  .toggle:active,
  .close:active {
    translate: var(--size-lift) var(--size-lift);
    box-shadow: var(--shadow-pressed);
  }

  /* ── Bottom sheet (below lg). */
  .scrim,
  .sheet {
    display: none;
  }
  [data-open="true"] .scrim {
    display: block;
    position: fixed;
    inset: 0;
    z-index: var(--z-overlay);
    background: var(--color-overlay);
  }
  [data-open="true"] .sheet {
    display: grid;
    gap: var(--space-sm);
    position: fixed;
    inset: auto 0 0;
    z-index: var(--z-modal);
    /* Never taller than the screen minus the header, so the page stays visible above it. */
    max-block-size: calc(100dvh - var(--size-header) - var(--space-2xl));
    padding: var(--space-md) var(--space-md) calc(var(--space-md) + env(safe-area-inset-bottom));
    overflow-y: auto;
    overscroll-behavior: contain;
    border-block-start: var(--border-width-medium) solid var(--color-border-strong);
    border-start-start-radius: var(--radius-xl);
    border-start-end-radius: var(--radius-xl);
    background: var(--color-bg);
    animation: sheet-up var(--motion-duration-normal) var(--motion-easing-decelerate);
  }
  @keyframes sheet-up {
    from {
      translate: 0 var(--space-2xl);
      opacity: 0;
    }
  }
  .sheet-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-sm);
    padding-block-end: var(--space-sm);
    border-block-end: var(--border-width-thin) dashed var(--color-border-strong);
  }

  .list {
    display: grid;
    gap: var(--space-3xs);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .item {
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: center;
    gap: var(--space-sm);
    min-block-size: var(--size-touch-target);
    padding: var(--space-2xs) var(--space-xs);
    border-radius: var(--radius-sm);
    color: var(--color-text);
    text-decoration: none;
    font-size: var(--font-size-sm);
    transition: background var(--motion-duration-fast) var(--motion-easing-standard);
  }
  .item:hover {
    background: var(--color-surface-sunken);
  }
  .item[aria-current="page"] {
    font-weight: var(--font-weight-bold);
  }
  /* You-are-here: highlighter swipe on the current title. */
  .item[aria-current="page"] .title {
    justify-self: start;
    padding-inline: var(--space-3xs);
    background: var(--highlight-fill);
    color: var(--color-on-highlight);
  }
  .badge {
    display: grid;
    place-items: center;
    inline-size: var(--size-icon-xl);
    block-size: var(--size-icon-xl);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-sm);
    background: var(--color-surface);
    font-family: var(--font-family-mono);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-bold);
  }
  [aria-current="page"] .badge {
    background: var(--color-primary);
    color: var(--color-on-primary);
    box-shadow: var(--shadow-pop-sm);
  }
  .done .badge {
    background: var(--color-success-solid);
    color: var(--color-on-success);
  }
  svg {
    inline-size: var(--size-icon-sm);
    block-size: var(--size-icon-sm);
    fill: none;
    stroke: currentColor;
    stroke-width: 3;
    stroke-linecap: square;
    stroke-linejoin: miter;
  }

  /* >= tokens.breakpoint.lg: the rail sits beside the content and is always expanded. */
  @media (min-width: 1024px) {
    .toggle,
    .sheet-head,
    [data-open="true"] .scrim {
      display: none;
    }
    .sheet,
    [data-open="true"] .sheet {
      display: block;
      position: static;
      max-block-size: none;
      padding: 0;
      overflow: visible;
      border: 0;
      background: none;
      animation: none;
    }
  }
</style>
