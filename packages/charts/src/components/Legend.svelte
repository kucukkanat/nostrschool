<script lang="ts">
  import { seriesColor } from "../scales.ts";

  /** Color key shared by multi-series charts; color is never the only cue (labels + table). */
  interface Props {
    readonly testid: string;
    readonly items: readonly {
      readonly id: string;
      readonly label: string;
      readonly detail?: string;
    }[];
  }
  const { testid, items }: Props = $props();
</script>

<ul class="legend" data-testid={testid}>
  {#each items as item, i (item.id)}
    <li data-testid="{testid}-{item.id}">
      <span class="swatch" style:background={seriesColor(i)} aria-hidden="true"></span>
      <span>{item.label}</span>
      {#if item.detail}
        <span class="detail">{item.detail}</span>
      {/if}
    </li>
  {/each}
</ul>

<style>
  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2xs) var(--space-md);
    margin: 0;
    padding: 0;
    list-style: none;
    font-size: var(--font-size-sm);
  }
  li {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2xs);
  }
  /* Ink-outlined riso chip, the same treatment as the marks it keys. */
  .swatch {
    flex: none;
    width: var(--size-icon-sm);
    height: var(--size-icon-sm);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-sm);
  }
  .detail {
    color: var(--color-text-muted);
    font-family: var(--font-family-mono);
    font-size: var(--font-size-xs);
    font-variant-numeric: tabular-nums;
  }
</style>
