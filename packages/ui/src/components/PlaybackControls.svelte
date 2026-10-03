<script lang="ts">
  import { format, getDictionary } from "@nostrschool/i18n";
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
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-md);
    background: var(--color-surface-sunken);
  }
  /* Tape-deck keys: square-ish, ink outlined, on a hard shadow that collapses when pressed. */
  .ctl {
    --ctl-shadow: var(--shadow-pop-sm);
    display: inline-grid;
    place-items: center;
    inline-size: var(--size-touch-target);
    block-size: var(--size-touch-target);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-md);
    background: var(--color-surface-raised);
    color: var(--color-text);
    font-size: var(--font-size-md);
    cursor: pointer;
    box-shadow: var(--ctl-shadow);
    transition:
      background-color var(--motion-duration-fast) var(--motion-easing-standard),
      box-shadow var(--motion-duration-press) var(--motion-easing-press),
      translate var(--motion-duration-press) var(--motion-easing-press);
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
  }
  @media (hover: hover) {
    .ctl:hover:not(:disabled) {
      --ctl-shadow: var(--shadow-lift);
      background: var(--color-primary-subtle);
      translate: calc(var(--size-lift) * -1) calc(var(--size-lift) * -1);
    }
  }
  .ctl:active:not(:disabled),
  .play[aria-pressed="true"] {
    --ctl-shadow: var(--shadow-pressed);
    translate: var(--size-lift) var(--size-lift);
  }
  .ctl:disabled {
    --ctl-shadow: var(--shadow-pressed);
    opacity: var(--opacity-disabled);
    cursor: not-allowed;
  }
  .play {
    background: var(--color-primary);
    color: var(--color-on-primary);
  }
  @media (hover: hover) {
    .play:hover:not(:disabled) {
      background: var(--color-primary-hover);
    }
  }
  .ctl:focus-visible {
    box-shadow: var(--shadow-focus-halo), var(--ctl-shadow);
  }
  .ctl:focus-visible,
  .scrub:focus-visible,
  select:focus-visible {
    outline: var(--border-width-thick) solid var(--color-focus-ring);
    outline-offset: var(--size-focus-offset);
  }
  /* The scrubber is drawn as an ink rule with a square orange slider (outlined, so it doesn't rely
     on orange against paper). Vendor pseudo-elements must stay in separate rules. */
  .scrub {
    flex: 1 1 var(--size-control-lg);
    min-inline-size: var(--size-control-lg);
    min-block-size: var(--size-touch-target);
    margin: 0;
    background: transparent;
    appearance: none;
    cursor: pointer;
  }
  .scrub::-webkit-slider-runnable-track {
    block-size: var(--border-width-thick);
    border-radius: var(--radius-sm);
    background: var(--color-border-strong);
  }
  .scrub::-moz-range-track {
    block-size: var(--border-width-thick);
    border-radius: var(--radius-sm);
    background: var(--color-border-strong);
  }
  .scrub::-webkit-slider-thumb {
    appearance: none;
    inline-size: var(--size-icon-md);
    block-size: var(--size-icon-lg);
    margin-block-start: calc((var(--border-width-thick) - var(--size-icon-lg)) / 2);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-sm);
    background: var(--color-primary);
    box-shadow: var(--shadow-pop-sm);
  }
  .scrub::-moz-range-thumb {
    inline-size: var(--size-icon-md);
    block-size: var(--size-icon-lg);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-sm);
    background: var(--color-primary);
    box-shadow: var(--shadow-pop-sm);
  }
  select {
    min-block-size: var(--size-touch-target);
    padding: 0 var(--space-xs);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-md);
    background: var(--color-surface-raised);
    color: var(--color-text);
    font-family: var(--font-family-mono);
    /* 16px+ keeps iOS Safari from zooming the page when the select gets focus. */
    font-size: var(--font-size-md);
  }
  .status {
    padding: 0 var(--space-xs);
    color: var(--color-text-muted);
    font-family: var(--font-family-mono);
    font-size: var(--font-size-sm);
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }
</style>
