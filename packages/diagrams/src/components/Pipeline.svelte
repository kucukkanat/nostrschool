<script lang="ts">
  import { format, getDictionary } from "@nostrschool/i18n";
  import { $reducedMotion as reducedMotion } from "@nostrschool/ui";
  import { popIn } from "../logic/motion.ts";
  import { stageState, truncate } from "../logic/pipeline.ts";
  import { uniqueIds } from "../logic/validate.ts";
  import type { PipelineProps } from "../types.ts";
  import Frame from "./internal/Frame.svelte";

  let {
    testid,
    locale,
    title,
    description,
    stages,
    active = $bindable(-1),
    status = "idle",
    errorAt,
  }: PipelineProps = $props();

  // Hashes and serialized events are long; show a prefix and expand on demand.
  const CLIP = 48;
  const valid = $derived(uniqueIds(stages, "stage"));
  const t = $derived(getDictionary(locale).diagrams.pipeline);
  const states = $derived(stages.map((_, i) => stageState(i, active, status, errorAt)));
  const failed = $derived(stages[states.indexOf("error")]);
  const current = $derived(stages[active]);
  const narration = $derived.by(() => {
    if (failed !== undefined) return format(t.error, { name: failed.label });
    if (status === "ok") return t.done;
    if (current === undefined) return t.idle;
    const head = format(t.stage, { n: active + 1, name: current.label });
    return current.description === undefined ? head : `${head}. ${current.description}`;
  });
  let expanded = $state<ReadonlySet<string>>(new Set());
  const toggleExpand = (id: string): void => {
    expanded = expanded.has(id)
      ? new Set([...expanded].filter((x) => x !== id))
      : new Set([...expanded, id]);
  };
  const roll = (node: Element): void => popIn(node, $reducedMotion);
</script>

<Frame
  {testid}
  {locale}
  {title}
  {description}
  {narration}
  error={valid.ok ? undefined : valid.error}
>
  <ol class="pipeline" data-status={status}>
    {#each stages as stage, i (stage.id)}
      {@const state = states[i] ?? "pending"}
      {@const open = expanded.has(stage.id)}
      {@const clipped = stage.value === undefined ? undefined : truncate(stage.value, CLIP)}
      <li class="stage {state}" data-testid="{testid}-stage-{stage.id}" data-state={state}>
        <button
          type="button"
          class="head"
          data-testid="{testid}-stage-{stage.id}-select"
          aria-current={i === active ? "step" : undefined}
          onclick={() => (active = i)}
        >
          <span class="index" aria-hidden="true">{i + 1}</span>
          <span class="label">{stage.label}</span>
        </button>
        {#if stage.description !== undefined}
          <p class="desc">{stage.description}</p>
        {/if}
        {#if stage.value !== undefined && clipped !== undefined}
          {#key stage.value}
            <code class="value" use:roll>{open ? stage.value : clipped.text}</code>
          {/key}
          {#if clipped.clipped}
            <button
              type="button"
              class="expand"
              data-testid="{testid}-stage-{stage.id}-expand"
              aria-expanded={open}
              onclick={() => toggleExpand(stage.id)}
            >
              {open ? t.collapse : t.expand}
            </button>
          {/if}
        {/if}
      </li>
    {/each}
  </ol>
</Frame>

<style>
  .pipeline {
    display: grid;
    grid-auto-flow: row;
    gap: var(--space-lg);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  /* 768px = tokens.breakpoint.md: stages sit side by side from tablet width up. */
  @media (min-width: 768px) {
    .pipeline {
      grid-auto-flow: column;
      grid-auto-columns: minmax(0, 1fr);
    }
  }
  .stage {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
    min-width: 0;
    padding: var(--space-sm);
    border: var(--border-width-medium) solid var(--color-diagram-node-stroke);
    border-radius: var(--radius-lg);
    background: var(--color-diagram-node);
    transition:
      border-color var(--motion-duration-normal) var(--motion-easing-standard),
      box-shadow var(--motion-duration-normal) var(--motion-easing-bounce),
      transform var(--motion-duration-normal) var(--motion-easing-bounce);
  }
  /* Hand-off arrow to the next stage: down when stacked, right when side by side. */
  .stage:not(:last-child)::after {
    content: "";
    position: absolute;
    left: 50%;
    bottom: calc(-1 * var(--space-lg));
    width: var(--border-width-heavy);
    height: var(--space-lg);
    background: var(--color-diagram-edge);
    transform: translateX(-50%);
  }
  @media (min-width: 768px) {
    .stage:not(:last-child)::after {
      left: 100%;
      top: 50%;
      bottom: auto;
      width: var(--space-lg);
      height: var(--border-width-heavy);
      transform: translateY(-50%);
    }
  }
  .stage.done:not(:last-child)::after {
    background: var(--color-diagram-edge-active);
  }
  .stage.pending {
    border-style: dashed;
  }
  .stage.active {
    border-color: var(--color-diagram-edge-active);
    box-shadow: var(--shadow-pop-sm);
    transform: translateY(calc(-1 * var(--space-3xs)));
  }
  .stage.done {
    border-color: var(--color-success);
  }
  .stage.error {
    border-color: var(--color-danger);
    background: var(--color-danger-subtle);
  }
  .head {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    min-height: var(--size-touch-target);
    padding: 0;
    border: none;
    background: none;
    color: var(--color-diagram-label);
    font: inherit;
    font-family: var(--font-family-display);
    font-weight: var(--font-weight-bold);
    text-align: start;
    cursor: pointer;
  }
  .head:focus-visible,
  .expand:focus-visible {
    outline: var(--border-width-thick) solid var(--color-focus-ring);
    outline-offset: var(--space-3xs);
    border-radius: var(--radius-sm);
  }
  .index {
    display: inline-grid;
    place-items: center;
    flex: none;
    width: var(--size-icon-lg);
    height: var(--size-icon-lg);
    border-radius: var(--radius-round);
    background: var(--color-primary);
    color: var(--color-on-primary);
    font-size: var(--font-size-xs);
  }
  .error .index {
    background: var(--color-danger);
    color: var(--color-on-danger);
  }
  .done .index {
    background: var(--color-success-solid);
    color: var(--color-on-success);
  }
  .desc {
    margin: 0;
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
  }
  .value {
    display: block;
    padding: var(--space-2xs) var(--space-xs);
    border-radius: var(--radius-sm);
    background: var(--color-code-bg);
    color: var(--color-code-text);
    font-family: var(--font-family-mono);
    font-size: var(--font-size-xs);
    overflow-wrap: anywhere;
  }
  .expand {
    align-self: flex-start;
    min-height: var(--size-touch-target);
    padding: 0;
    border: none;
    background: none;
    color: var(--color-text-primary);
    font: inherit;
    font-size: var(--font-size-sm);
    text-decoration: underline;
    cursor: pointer;
  }
</style>
