<script lang="ts">
  import type { ToggleProps } from "../types.ts";

  let {
    testid,
    checked = $bindable(false),
    label,
    description,
    disabled = false,
    onchange,
  }: ToggleProps = $props();
  const descId = $props.id();
</script>

<label class="toggle" class:disabled data-testid={testid} data-checked={checked}>
  <input
    class="input"
    type="checkbox"
    role="switch"
    aria-checked={checked}
    data-testid="{testid}-input"
    aria-describedby={description ? descId : undefined}
    bind:checked
    {disabled}
    onchange={() => onchange?.(checked)}
  >
  <span class="track" aria-hidden="true"><span class="thumb"></span></span>
  <span class="text">
    <span class="label">{label}</span>
    {#if description}
      <small id={descId} class="description">{description}</small>
    {/if}
  </span>
</label>

<style>
  .toggle {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: var(--space-sm);
    min-height: var(--size-touch-target);
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }
  .disabled {
    opacity: var(--opacity-disabled);
    cursor: not-allowed;
  }
  /* Native checkbox stays in the a11y tree and keyboard order; the track is its visual twin. */
  .input {
    position: absolute;
    opacity: 0;
    inline-size: var(--size-control-lg);
    block-size: var(--size-touch-target);
    margin: 0;
    cursor: inherit;
  }
  /* The one control that keeps a pill: a slide switch with an ink-outlined knob. Off = sunken
     paper; on = orange, and the knob's position (not the colour) says which. */
  .track {
    position: relative;
    flex: none;
    inline-size: var(--size-control-lg);
    block-size: calc(var(--size-control-sm) - var(--space-2xs));
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-pill);
    background: var(--color-surface-sunken);
    transition: background-color var(--motion-duration-normal) var(--motion-easing-standard);
  }
  .thumb {
    position: absolute;
    inset-block: 0;
    inset-inline-start: var(--space-3xs);
    margin-block: auto;
    inline-size: var(--size-icon-md);
    block-size: var(--size-icon-md);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-round);
    background: var(--color-surface-raised);
    box-shadow: var(--shadow-sm);
    transition:
      translate var(--motion-duration-normal) var(--motion-easing-bounce),
      box-shadow var(--motion-duration-press) var(--motion-easing-press);
  }
  .toggle:active:not(.disabled) .thumb {
    box-shadow: var(--shadow-pressed);
  }
  .input:checked + .track {
    background: var(--color-primary);
  }
  .input:checked + .track .thumb {
    translate: calc(
        var(--size-control-lg) -
        var(--size-icon-md) -
        var(--space-2xs) -
        2 *
        var(--border-width-medium)
      )
      0;
  }
  .input:focus-visible + .track {
    outline: var(--border-width-thick) solid var(--color-focus-ring);
    outline-offset: var(--size-focus-offset);
  }
  .text {
    display: flex;
    flex-direction: column;
  }
  .label {
    font-weight: var(--font-weight-semibold);
  }
  .description {
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
  }
</style>
