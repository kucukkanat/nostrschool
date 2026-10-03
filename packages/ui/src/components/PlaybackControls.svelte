<script lang="ts">
  import { format, getDictionary } from "@nostrschool/i18n";
  import { squish } from "../actions.ts";
  import type { PlaybackControlsProps } from "../types.ts";
  import VisuallyHidden from "./VisuallyHidden.svelte";

  let {
    testid,
    locale,
    step = $bindable(0),
    totalSteps,
    playing = $bindable(false),
    speed = $bindable(),
    onstep,
  }: PlaybackControlsProps = $props();
  const SPEEDS = [0.5, 1, 2] as const;
  const t = $derived(getDictionary(locale).ui.playback);
  const last = $derived(Math.max(0, totalSteps - 1));
  const atEnd = $derived(step >= last);

  const go = (n: number) => {
    const next = Math.max(0, Math.min(last, n));
    if (next === step) return;
    step = next;
    onstep?.(next);
  };
  const togglePlay = () => {
    // Pressing play at the end restarts, matching every media player learners know.
    if (!playing && atEnd) go(0);
    playing = !playing;
  };
</script>

<div class="playback" data-testid={testid} data-playing={playing}>
  <button
    type="button"
    class="ctl"
    data-testid="{testid}-reset"
    aria-label={t.reset}
    title={t.reset}
    disabled={step === 0}
    onclick={() => go(0)}
    use:squish
  >
    <span aria-hidden="true">⏮</span>
  </button>
  <button
    type="button"
    class="ctl"
    data-testid="{testid}-back"
    aria-label={t.stepBack}
    title={t.stepBack}
    disabled={step === 0}
    onclick={() => go(step - 1)}
    use:squish
  >
    <span aria-hidden="true">◀</span>
  </button>
  <button
    type="button"
    class="ctl play"
    data-testid="{testid}-play"
    aria-label={playing ? t.pause : t.play}
    title={playing ? t.pause : t.play}
    aria-pressed={playing}
    disabled={totalSteps <= 1}
    onclick={togglePlay}
    use:squish
  >
    <span aria-hidden="true">{playing ? "⏸" : "▶"}</span>
  </button>
  <button
    type="button"
    class="ctl"
    data-testid="{testid}-forward"
    aria-label={t.stepForward}
    title={t.stepForward}
    disabled={atEnd}
    onclick={() => go(step + 1)}
    use:squish
  >
    <span aria-hidden="true">▶</span>
  </button>
  <input
    class="scrub"
    type="range"
    data-testid="{testid}-scrub"
    aria-label={t.scrub}
    aria-valuetext={format(t.stepOf, { current: step + 1, total: totalSteps })}
    min="0"
    max={last}
    step="1"
    value={step}
    oninput={(e) => go(Number(e.currentTarget.value))}
  >
  {#if speed !== undefined}
    <label class="speed">
      <VisuallyHidden>{t.speed}</VisuallyHidden>
      <select
        data-testid="{testid}-speed"
        value={speed}
        onchange={(e) => (speed = Number(e.currentTarget.value))}
      >
        {#each SPEEDS as s (s)}
          <option value={s}>{s}×</option>
        {/each}
      </select>
    </label>
  {/if}
  <span class="status" data-testid="{testid}-status" aria-live="polite">
    {format(t.stepOf, { current: step + 1, total: totalSteps })}
  </span>
</div>

<style>
  .playback {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-xs);
    padding: var(--space-xs);
    border-radius: var(--radius-pill);
    background: var(--color-surface-sunken);
  }
  .ctl {
    display: inline-grid;
    place-items: center;
    inline-size: var(--size-touch-target);
    block-size: var(--size-touch-target);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-round);
    background: var(--color-surface-raised);
    color: var(--color-text);
    font-size: var(--font-size-md);
    cursor: pointer;
    transition:
      background-color var(--motion-duration-fast) var(--motion-easing-standard),
      translate var(--motion-duration-normal) var(--motion-easing-bounce);
  }
  .ctl:hover:not(:disabled) {
    background: var(--color-primary-subtle);
    translate: 0 calc(-1 * var(--space-3xs));
  }
  .ctl:disabled {
    opacity: var(--opacity-disabled);
    cursor: not-allowed;
  }
  .play {
    background: var(--color-primary);
    border-color: var(--color-primary-active);
    color: var(--color-on-primary);
    box-shadow: var(--shadow-pop-sm);
  }
  .play:hover:not(:disabled) {
    background: var(--color-primary-hover);
  }
  .ctl:focus-visible,
  .scrub:focus-visible,
  select:focus-visible {
    outline: var(--border-width-thick) solid var(--color-focus-ring);
    outline-offset: var(--space-3xs);
  }
  .scrub {
    flex: 1 1 var(--size-control-lg);
    min-inline-size: var(--size-control-lg);
    min-block-size: var(--size-touch-target);
    accent-color: var(--color-primary);
    cursor: pointer;
  }
  select {
    min-block-size: var(--size-control-sm);
    padding: 0 var(--space-xs);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-pill);
    background: var(--color-surface-raised);
    color: var(--color-text);
    font: inherit;
  }
  .status {
    padding: 0 var(--space-xs);
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }
</style>
