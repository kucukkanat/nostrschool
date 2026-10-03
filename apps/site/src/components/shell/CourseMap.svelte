<script lang="ts">
  /**
   * The landing page's winding course path: twelve stops, finished ones checked, the next one
   * bouncing. It is an ordered list of links underneath, so keyboard and screen readers get a
   * plain course outline; the curve is decoration.
   */
  import { getDictionary, type Locale } from "@nostrschool/i18n";
  import { courseStops, curvePath } from "./lib/geometry.ts";
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

  const stops = $derived(courseStops(chapters.length));
  const path = $derived(curvePath(stops));
  const statusLabel = $derived({ done: t.done, current: t.current, upcoming: t.upcoming });
</script>

<div class="map" style:--rows={chapters.length} data-testid="course-map">
  <svg
    class="path"
    viewBox="0 0 100 {chapters.length}"
    preserveAspectRatio="none"
    aria-hidden="true"
    focusable="false"
  >
    <path class="trail" d={path} />
  </svg>
  <ol class="stops">
    {#each chapters as chapter, i (chapter.slug)}
      {@const stop = stops[i] ?? { x: 50, y: i + 0.5 }}
      {@const status = chapterStatus(completed, chapter.slug)}
      <li
        class="stop"
        data-status={status}
        data-side={stop.x > 50 ? "left" : "right"}
        style:--x={stop.x}
        style:--y={stop.y}
      >
        <a
          href={chapter.href}
          class="node"
          data-testid="course-map-{chapter.nn}"
          data-status={status}
        >
          <span class="bubble" aria-hidden="true">
            {#if status === "done"}
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M5 12.5l4.5 4.5L19 7.5" />
              </svg>
            {:else}
              {chapter.order}
            {/if}
          </span>
          <span class="label">
            <span class="title">{chapter.title}</span>
            <span class="status">{statusLabel[status]}</span>
          </span>
        </a>
      </li>
    {/each}
  </ol>
</div>

<style>
  .map {
    --row: var(--space-4xl);
    position: relative;
    block-size: calc(var(--rows) * var(--row));
    max-inline-size: var(--size-content);
    margin-inline: auto;
  }
  .path {
    position: absolute;
    inset: 0;
    inline-size: 100%;
    block-size: 100%;
    overflow: visible;
  }
  .trail {
    fill: none;
    stroke: var(--color-primary);
    stroke-width: var(--border-width-heavy);
    stroke-dasharray: var(--space-xs) var(--space-sm);
    stroke-linecap: round;
    vector-effect: non-scaling-stroke;
    opacity: var(--opacity-muted);
  }
  .stops {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .stop {
    position: absolute;
    inset-inline-start: calc(var(--x) * 1%);
    inset-block-start: calc(var(--y) * var(--row));
    translate: -50% -50%;
  }
  .node {
    position: relative;
    display: block;
    color: var(--color-text);
    text-decoration: none;
  }
  .bubble {
    display: grid;
    place-items: center;
    inline-size: var(--size-avatar-md);
    block-size: var(--size-avatar-md);
    border-radius: var(--radius-round);
    border: var(--border-width-thick) solid var(--color-text);
    background: var(--color-surface);
    font-family: var(--font-family-display);
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-black);
    box-shadow: var(--shadow-pop);
    transition: transform var(--motion-duration-normal) var(--motion-easing-bounce);
  }
  [data-status="done"] .bubble {
    background: var(--color-success-solid);
    color: var(--color-on-success);
  }
  [data-status="current"] .bubble {
    background: var(--color-primary);
    color: var(--color-on-primary);
    animation: hop var(--motion-duration-step) var(--motion-easing-bounce) infinite alternate;
  }
  .node:hover .bubble,
  .node:focus-visible .bubble {
    transform: scale(1.15) rotate(-6deg);
  }
  .label {
    position: absolute;
    inset-block-start: 50%;
    translate: 0 -50%;
    display: grid;
    inline-size: max-content;
    max-inline-size: min(34vw, calc(var(--size-content) * 0.34));
    overflow-wrap: anywhere;
  }
  [data-side="right"] .label {
    inset-inline-start: calc(100% + var(--space-sm));
  }
  [data-side="left"] .label {
    inset-inline-end: calc(100% + var(--space-sm));
    text-align: end;
  }
  .title {
    font-family: var(--font-family-display);
    font-weight: var(--font-weight-bold);
    line-height: var(--font-line-height-tight);
  }
  .status {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: var(--font-letter-spacing-caps);
  }
  svg:not(.path) {
    inline-size: var(--size-icon-md);
    block-size: var(--size-icon-md);
    fill: none;
    stroke: currentColor;
    stroke-width: 3;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  @keyframes hop {
    to {
      translate: 0 calc(var(--space-2xs) * -1);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    [data-status="current"] .bubble {
      animation: none;
    }
  }
</style>
