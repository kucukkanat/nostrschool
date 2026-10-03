<script lang="ts">
  import { getDictionary } from "@nostrschool/i18n";
  import { rovingIndex } from "../lib/roving.ts";
  import type { StepperProps } from "../types.ts";

  let { testid, locale, steps, current = $bindable(0), onchange }: StepperProps = $props();
  const t = $derived(getDictionary(locale).ui.stepper);
  const buttons: HTMLButtonElement[] = $state([]);

  const go = (i: number) => {
    if (i === current) return;
    current = i;
    onchange?.(i);
  };
  const onkeydown = (e: KeyboardEvent, from: number) => {
    const next = rovingIndex(steps.length, from, e.key);
    if (next === undefined) return;
    e.preventDefault();
    buttons[next]?.focus();
  };
</script>

<nav class="stepper" data-testid={testid} aria-label={t.label}>
  <ol class="list">
    {#each steps as step, i (step.id)}
      <li class="item" data-state={i < current ? "done" : i === current ? "current" : "todo"}>
        <button
          bind:this={buttons[i]}
          type="button"
          class="step"
          data-testid="{testid}-step-{step.id}"
          aria-current={i === current ? "step" : undefined}
          onclick={() => go(i)}
          onkeydown={(e) => onkeydown(e, i)}
        >
          <span class="num" aria-hidden="true">{i < current ? "✓" : i + 1}</span>
          <span class="label">{step.label}</span>
        </button>
      </li>
    {/each}
  </ol>
</nav>

<style>
  .list {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-xs);
    margin: 0;
    padding: 0;
    list-style: none;
    counter-reset: none;
  }
  .item {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
  }
  .item:not(:last-child)::after {
    content: "";
    inline-size: var(--space-lg);
    block-size: var(--border-width-thick);
    border-radius: var(--radius-pill);
    background: var(--color-border);
    transition: background-color var(--motion-duration-normal) var(--motion-easing-standard);
  }
  .item[data-state="done"]::after {
    background: var(--color-primary);
  }
  .step {
    display: inline-flex;
    align-items: center;
    gap: var(--space-xs);
    min-height: var(--size-touch-target);
    padding: 0 var(--space-sm) 0 var(--space-2xs);
    border: var(--border-width-medium) solid transparent;
    border-radius: var(--radius-pill);
    background: transparent;
    color: var(--color-text-muted);
    font: inherit;
    cursor: pointer;
    transition: background-color var(--motion-duration-fast) var(--motion-easing-standard);
  }
  .step:hover {
    background: var(--color-primary-subtle);
  }
  .step:focus-visible {
    outline: var(--border-width-thick) solid var(--color-focus-ring);
    outline-offset: var(--space-3xs);
  }
  .num {
    display: inline-grid;
    place-items: center;
    inline-size: var(--size-control-sm);
    block-size: var(--size-control-sm);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-round);
    background: var(--color-surface);
    font-family: var(--font-family-display);
    font-weight: var(--font-weight-bold);
    transition:
      scale var(--motion-duration-normal) var(--motion-easing-bounce),
      background-color var(--motion-duration-fast) var(--motion-easing-standard);
  }
  [data-state="done"] .num {
    background: var(--color-primary-subtle);
    border-color: var(--color-primary);
    color: var(--color-text-primary);
  }
  [data-state="current"] .step {
    color: var(--color-text);
    font-weight: var(--font-weight-semibold);
    border-color: var(--color-primary);
  }
  [data-state="current"] .num {
    background: var(--color-primary);
    border-color: var(--color-primary-active);
    color: var(--color-on-primary);
    scale: 1.1;
  }
</style>
