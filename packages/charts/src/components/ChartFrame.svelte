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
  /* A pasted-in field-notebook plate: paper-2 sheet, 1.5px ink line, hard offset shadow. */
  .chart {
    margin: 0;
    padding: var(--space-md);
    display: grid;
    gap: var(--space-sm);
    background: var(--color-surface);
    color: var(--color-text);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-pop);
    font-family: var(--font-family-body);
    min-width: 0;
  }
  /* 480px = tokens.breakpoint.sm: give phones the plot width back. */
  @media (max-width: 480px) {
    .chart {
      padding: var(--space-sm);
      box-shadow: var(--shadow-pop-sm);
    }
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
    text-wrap: balance;
  }
  .desc,
  .source {
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
  }
  .source {
    font-family: var(--font-family-mono);
    font-size: var(--font-size-xs);
    overflow-wrap: anywhere;
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
  /* Axis and tick labels are data, so they're set in mono like a lab notebook. */
  .plot :global(.axis text),
  .plot :global(.axis-label) {
    fill: var(--color-chart-axis);
    font-family: var(--font-family-mono);
    font-size: var(--font-size-xs);
  }
  .plot :global(.axis line),
  .plot :global(.axis path) {
    stroke: var(--color-chart-axis);
    stroke-width: var(--border-width-medium);
  }
  .plot :global(.grid line) {
    stroke: var(--color-chart-grid);
    stroke-width: var(--border-width-thin);
    stroke-dasharray: 2 3;
  }
  /* Every coloured mark is an ink-outlined riso fill. */
  .plot :global([data-mark]) {
    stroke: var(--color-border-strong);
    stroke-width: var(--border-width-medium);
    cursor: pointer;
    outline: none;
    transition:
      opacity var(--motion-duration-fast) var(--motion-easing-standard),
      translate var(--motion-duration-press) var(--motion-easing-press),
      filter var(--motion-duration-press) var(--motion-easing-press);
  }
  /* Hover = the brand lift: nudge up-left and cast a hard ink shadow (zero blur). */
  @media (hover: hover) {
    .plot :global([data-mark]:hover) {
      translate: calc(var(--size-lift) * -1) calc(var(--size-lift) * -1);
      filter: drop-shadow(var(--size-lift) var(--size-lift) 0 var(--color-shadow-pop));
    }
  }
  /*
   * Focus = thick focus-ring stroke wrapped in a hard focus-halo outline (four zero-blur
   * drop-shadows), so the ring reaches 3:1 against any riso fill and against the page.
   */
  .plot :global([data-mark]:focus-visible) {
    stroke: var(--color-focus-ring);
    stroke-width: var(--border-width-thick);
    filter: drop-shadow(var(--size-focus-offset) 0 0 var(--color-focus-halo))
      drop-shadow(calc(var(--size-focus-offset) * -1) 0 0 var(--color-focus-halo))
      drop-shadow(0 var(--size-focus-offset) 0 var(--color-focus-halo))
      drop-shadow(0 calc(var(--size-focus-offset) * -1) 0 var(--color-focus-halo));
  }
  .empty {
    display: grid;
    place-items: center;
    min-height: var(--size-diagram-min-height);
    margin: 0;
    border: var(--border-width-medium) dashed var(--color-border);
    border-radius: var(--radius-md);
    color: var(--color-text-muted);
    font-family: var(--font-family-mono);
    font-size: var(--font-size-sm);
  }
  /* Tooltip as a torn-off label: raised paper, ink outline, hard shadow, mono figures. */
  .tooltip {
    position: absolute;
    /* Clamp so tooltips near an edge stay inside the card instead of being clipped. */
    left: clamp(var(--space-3xl), var(--tip-x), calc(100% - var(--space-3xl)));
    top: var(--tip-y);
    transform: translate(-50%, calc(-100% - var(--space-xs)));
    max-width: calc(var(--space-4xl) * 3);
    padding: var(--space-2xs) var(--space-xs);
    background: var(--color-surface-raised);
    color: var(--color-text);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-sm);
    box-shadow: var(--shadow-pop-sm);
    font-family: var(--font-family-mono);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-semibold);
    font-variant-numeric: tabular-nums;
    overflow-wrap: anywhere;
    pointer-events: none;
    z-index: var(--z-popover);
    animation: stamp var(--motion-duration-fast) var(--motion-easing-press);
  }
  @keyframes stamp {
    from {
      opacity: 0;
      transform: translate(-50%, calc(-100% - var(--space-2xs)));
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
    border-radius: var(--radius-md);
    background: var(--color-surface-raised);
    color: var(--color-text);
    box-shadow: var(--shadow-pop-sm);
    font: inherit;
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    cursor: pointer;
    transition:
      translate var(--motion-duration-press) var(--motion-easing-press),
      box-shadow var(--motion-duration-press) var(--motion-easing-press),
      background-color var(--motion-duration-fast) var(--motion-easing-standard);
  }
  /* Hover only where a real pointer hovers: on touch screens it would stick after a tap. */
  @media (hover: hover) {
    .toggle:hover {
      background: var(--color-primary-subtle);
      box-shadow: var(--shadow-lift);
      translate: calc(var(--size-lift) * -1) calc(var(--size-lift) * -1);
    }
  }
  .toggle:active {
    box-shadow: var(--shadow-pressed);
    translate: var(--size-lift) var(--size-lift);
  }
  .toggle:focus-visible {
    outline: var(--border-width-thick) solid var(--color-focus-ring);
    outline-offset: var(--size-focus-offset);
  }
  .table-wrap {
    overflow-x: auto;
    scrollbar-width: thin;
    scrollbar-color: var(--color-border-strong) var(--color-surface-sunken);
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
    font-family: var(--font-family-mono);
  }
  thead th {
    border-bottom: var(--border-width-medium) solid var(--color-border-strong);
    color: var(--color-text-muted);
    font-family: var(--font-family-mono);
    font-size: var(--font-size-xs);
    letter-spacing: var(--font-letter-spacing-caps);
    text-transform: uppercase;
  }
</style>
