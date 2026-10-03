<script lang="ts">
  import { plural } from "@nostrschool/i18n";
  import { editorStrings, issueCounts } from "../logic/text.ts";
  import type { ValidityBadgeProps } from "../types.ts";

  const { testid, locale, report }: ValidityBadgeProps = $props();
  const t = $derived(editorStrings(locale));
  const counts = $derived(issueCounts(report));
  const state = $derived(report === undefined ? "checking" : report.valid ? "valid" : "invalid");
</script>

<!-- A rubber stamp: green tick when the spec is satisfied, orange count when it is not.
     role=status so screen readers hear the verdict change as the JSON is edited. -->
<span class="stamp" data-testid={testid} data-state={state} role="status">
  <span class="mark" aria-hidden="true"
    >{state === "valid" ? "✓" : state === "invalid" ? "!" : "…"}</span
  >
  <span class="label">{t.validity[state]}</span>
  {#if report !== undefined && counts.problems > 0}
    <span class="count" data-testid="{testid}-count"
      >{plural(locale, counts.problems, t.issues)}</span
    >
  {:else if report !== undefined && counts.notes > 0}
    <span class="count note" data-testid="{testid}-count"
      >{plural(locale, counts.notes, t.hints)}</span
    >
  {/if}
</span>

<style>
  .stamp {
    display: inline-flex;
    align-items: center;
    gap: var(--space-xs);
    min-height: var(--size-control-sm);
    padding: var(--space-3xs) var(--space-sm) var(--space-3xs) var(--space-3xs);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-sm);
    background: var(--color-surface);
    color: var(--color-text);
    font-family: var(--font-family-display);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    box-shadow: var(--shadow-pop-sm);
    white-space: nowrap;
  }
  .mark {
    display: inline-grid;
    place-items: center;
    inline-size: var(--size-icon-md);
    block-size: var(--size-icon-md);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-round);
    font-family: var(--font-family-mono);
    font-weight: var(--font-weight-bold);
    line-height: var(--font-line-height-tight);
  }
  [data-state="valid"] .mark {
    background: var(--color-success-solid);
    color: var(--color-on-success);
  }
  [data-state="invalid"] .mark {
    background: var(--color-primary);
    color: var(--color-on-primary);
  }
  [data-state="checking"] .mark {
    background: var(--color-surface-sunken);
  }
  .count {
    padding-inline-start: var(--space-xs);
    border-inline-start: var(--border-width-thin) solid var(--color-border);
    color: var(--color-text-muted);
    font-family: var(--font-family-mono);
    font-size: var(--font-size-xs);
  }
</style>
