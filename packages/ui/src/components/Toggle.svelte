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
    block-size: var(--size-control-sm);
    margin: 0;
    cursor: inherit;
  }
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
    inset-block-start: var(--space-3xs);
    inset-inline-start: var(--space-3xs);
    inline-size: var(--size-icon-md);
    block-size: var(--size-icon-md);
    border-radius: var(--radius-round);
    background: var(--color-surface-raised);
    box-shadow: var(--shadow-sm);
    transition:
      translate var(--motion-duration-normal) var(--motion-easing-bounce),
      scale var(--motion-duration-fast) var(--motion-easing-standard);
  }
  .toggle:active:not(.disabled) .thumb {
    scale: 1.15 0.9;
  }
  .input:checked + .track {
    background: var(--color-primary);
    border-color: var(--color-primary-active);
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
    outline-offset: var(--space-3xs);
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
