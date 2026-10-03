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
    gap: var(--space-2xs) var(--space-xs);
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
  /* Connectors are pencil rules: dashed while ahead, solid ink once walked. */
  .item:not(:last-child)::after {
    content: "";
    inline-size: var(--space-lg);
    border-top: var(--border-width-medium) dashed var(--color-border-strong);
    opacity: var(--opacity-muted);
  }
  .item[data-state="done"]::after {
    border-top-style: solid;
    opacity: 1;
  }
  .step {
    display: inline-flex;
    align-items: center;
    gap: var(--space-xs);
    min-height: var(--size-touch-target);
    padding: 0 var(--space-sm) 0 var(--space-2xs);
    border: none;
    border-radius: var(--radius-md);
    background: transparent;
    color: var(--color-text-muted);
    font: inherit;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    transition: background-color var(--motion-duration-fast) var(--motion-easing-standard);
  }
  @media (hover: hover) {
    .step:hover {
      background: var(--color-primary-subtle);
      color: var(--color-text);
    }
  }
  .step:focus-visible {
    outline: var(--border-width-thick) solid var(--color-focus-ring);
    outline-offset: var(--size-focus-offset);
  }
  .num {
    display: inline-grid;
    place-items: center;
    inline-size: var(--size-control-sm);
    block-size: var(--size-control-sm);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-round);
    background: var(--color-surface-raised);
    color: var(--color-text);
    font-family: var(--font-family-mono);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-bold);
    transition:
      background-color var(--motion-duration-fast) var(--motion-easing-standard),
      box-shadow var(--motion-duration-press) var(--motion-easing-press),
      translate var(--motion-duration-press) var(--motion-easing-press);
  }
  [data-state="done"] .num {
    background: var(--color-secondary);
    color: var(--color-on-secondary);
  }
  [data-state="current"] .step {
    color: var(--color-text);
    font-weight: var(--font-weight-semibold);
  }
  /* The current step is the selected one: orange fill, ink outline, lifted on its shadow. */
  [data-state="current"] .num {
    background: var(--color-primary);
    color: var(--color-on-primary);
    box-shadow: var(--shadow-pop-sm);
    translate: calc(var(--size-lift) * -1) calc(var(--size-lift) * -1);
  }
  [data-state="current"] .label {
    text-decoration: underline var(--border-width-medium) var(--color-text-primary);
    text-underline-offset: var(--space-2xs);
  }
</style>
