<script lang="ts">
  import { getDictionary, type Locale } from "@nostrschool/i18n";
  import { VisuallyHidden } from "@nostrschool/ui";
  import type { Snippet } from "svelte";
  import { rovingMarks } from "../interact.ts";
  import type { TableData, Tip } from "../types.internal.ts";

  /**
   * Shared chrome for every chart: caption, measured plot area, tooltip, legend slot,
   * data-table fallback and source line. Charts own geometry; the frame owns accessibility.
   */
  interface Props {
    readonly testid: string;
    readonly locale: Locale;
    readonly title: string;
    readonly description?: string | undefined;
    readonly source?: string | undefined;
    /** Measured plot width (0 until laid out — charts fall back to DEFAULT_WIDTH). */
    width?: number;
    readonly table: TableData;
    readonly tooltip: Tip | null;
    readonly empty: boolean;
    readonly legend?: Snippet | undefined;
    readonly children: Snippet;
  }

  let {
    testid,
    locale,
    title,
    description,
    source,
    width = $bindable(0),
    table,
    tooltip,
    empty,
    legend,
    children,
  }: Props = $props();

  const uid = $props.id();
  const t = $derived(getDictionary(locale).charts);
  const describedBy = $derived(description ? `${uid}-desc ${uid}-hint` : `${uid}-hint`);
  let open = $state(false);
</script>

<figure class="chart" data-testid={testid} aria-labelledby="{uid}-title">
  <figcaption class="head">
    <span class="title" id="{uid}-title" data-testid="{testid}-title">{title}</span>
    {#if description}
      <span class="desc" id="{uid}-desc" data-testid="{testid}-description">{description}</span>
    {/if}
  </figcaption>

  <!-- biome-ignore lint/a11y/useSemanticElements: a <fieldset> is for form controls; this groups data marks -->
  <div
    class="plot"
    role="group"
    aria-labelledby="{uid}-title"
    aria-describedby={describedBy}
    data-testid="{testid}-plot"
    bind:clientWidth={width}
    {@attach rovingMarks}
  >
    <VisuallyHidden id="{uid}-hint">{t.keyboardHint}</VisuallyHidden>
    {#if empty}
      <p class="empty" role="status" data-testid="{testid}-empty">{t.noData}</p>
    {:else}
      {@render children()}
    {/if}
    {#if tooltip}
      <!-- Marks already carry the same text as aria-label, so the tooltip is visual only. -->
      <div
        class="tooltip"
        aria-hidden="true"
        data-testid="{testid}-tooltip"
        style:--tip-x="{tooltip.x}px"
        style:--tip-y="{tooltip.y}px"
      >
        {tooltip.text}
      </div>
    {/if}
  </div>

  {@render legend?.()}

  <div class="foot">
    <button
      type="button"
      class="toggle"
      aria-expanded={open}
      aria-controls="{uid}-table"
      data-testid="{testid}-table-toggle"
      onclick={() => (open = !open)}
    >
      {open ? t.hideTable : t.showTable}
    </button>
    {#if source}
      <span class="source" data-testid="{testid}-source">{source}</span>
    {/if}
  </div>

  <div class="table-wrap" id="{uid}-table" hidden={!open}>
    <table data-testid="{testid}-table">
      <caption>
        {title}
      </caption>
      <thead>
        <tr>
          {#each table.columns as column, i (i)}
            <th scope="col">{column}</th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each table.rows as row (row.id)}
          <tr data-testid="{testid}-row-{row.id}">
            {#each row.cells as cell, i (i)}
              {#if i === 0}
                <th scope="row">{cell}</th>
              {:else}
                <td>{cell}</td>
              {/if}
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</figure>

<style>
  .chart {
    margin: 0;
    padding: var(--space-md);
    display: grid;
    gap: var(--space-sm);
    background: var(--color-surface);
    color: var(--color-text);
    border: var(--border-width-medium) solid var(--color-border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-pop-sm);
    font-family: var(--font-family-body);
    min-width: 0;
  }
  .head {
    display: grid;
    gap: var(--space-3xs);
  }
  .title {
    font-family: var(--font-family-display);
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-bold);
    line-height: var(--font-line-height-tight);
  }
  .desc,
  .source {
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
  }
  .plot {
    position: relative;
    min-width: 0;
  }
  .plot :global(svg) {
    display: block;
    width: 100%;
    height: auto;
    overflow: visible;
  }
  .plot :global(.axis text),
  .plot :global(.axis-label) {
    fill: var(--color-chart-axis);
    font-size: var(--font-size-xs);
  }
  .plot :global(.axis line),
  .plot :global(.axis path) {
    stroke: var(--color-chart-axis);
  }
  .plot :global(.grid line) {
    stroke: var(--color-chart-grid);
    stroke-width: var(--border-width-thin);
  }
  .plot :global([data-mark]) {
    cursor: pointer;
    outline: none;
    transition: opacity var(--motion-duration-fast) var(--motion-easing-standard);
  }
  .plot :global([data-mark]:hover),
  .plot :global([data-mark]:focus-visible) {
    stroke: var(--color-text);
    stroke-width: var(--border-width-medium);
  }
  .plot :global([data-mark]:focus-visible) {
    stroke: var(--color-focus-ring);
    stroke-width: var(--border-width-thick);
  }
  .empty {
    display: grid;
    place-items: center;
    min-height: var(--size-diagram-min-height);
    margin: 0;
    color: var(--color-text-muted);
  }
  .tooltip {
    position: absolute;
    /* Clamp so tooltips near an edge stay inside the card instead of being clipped. */
    left: clamp(var(--space-3xl), var(--tip-x), calc(100% - var(--space-3xl)));
    top: var(--tip-y);
    transform: translate(-50%, calc(-100% - var(--space-xs)));
    padding: var(--space-2xs) var(--space-xs);
    background: var(--color-surface-inverse);
    color: var(--color-text-inverse);
    border-radius: var(--radius-sm);
    box-shadow: var(--shadow-md);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    white-space: nowrap;
    pointer-events: none;
    z-index: var(--z-popover);
    animation: pop var(--motion-duration-fast) var(--motion-easing-bounce);
  }
  @keyframes pop {
    from {
      opacity: 0;
      transform: translate(-50%, calc(-100% - var(--space-xs))) scale(0.85);
    }
  }
  .foot {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-xs);
  }
  .toggle {
    min-height: var(--size-touch-target);
    padding: 0 var(--space-sm);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-pill);
    background: var(--color-surface-raised);
    color: var(--color-text);
    font: inherit;
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    cursor: pointer;
    transition: transform var(--motion-duration-fast) var(--motion-easing-bounce);
  }
  .toggle:hover {
    background: var(--color-primary-subtle);
  }
  .toggle:active {
    transform: scale(0.96);
  }
  .toggle:focus-visible {
    outline: var(--border-width-thick) solid var(--color-focus-ring);
    outline-offset: var(--space-3xs);
  }
  .table-wrap {
    overflow-x: auto;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--font-size-sm);
    font-variant-numeric: tabular-nums;
  }
  caption {
    text-align: start;
    font-weight: var(--font-weight-semibold);
    padding-block-end: var(--space-xs);
  }
  th,
  td {
    padding: var(--space-2xs) var(--space-xs);
    border-bottom: var(--border-width-thin) solid var(--color-border);
    text-align: start;
  }
  td {
    text-align: end;
  }
  thead th {
    color: var(--color-text-muted);
  }
</style>
