<script lang="ts">
  import type { ButtonProps } from "../types.ts";

  const {
    testid,
    variant = "primary",
    size = "md",
    type = "button",
    disabled = false,
    loading = false,
    pressed,
    href,
    ariaLabel,
    onclick,
    icon,
    children,
  }: ButtonProps = $props();
  const inert = $derived(disabled || loading);
</script>

{#snippet body()}
  {#if loading}
    <span class="spinner" aria-hidden="true" data-testid="{testid}-spinner"></span>
  {:else if icon}
    <span class="icon" aria-hidden="true">{@render icon()}</span>
  {/if}
  {#if children}
    <span class="label">{@render children()}</span>
  {/if}
{/snippet}

{#if href !== undefined}
  <!-- A disabled link has no href, so it is skipped by keyboard and can't navigate. -->
  <a
    class="btn {variant} {size}"
    data-testid={testid}
    href={inert ? undefined : href}
    aria-disabled={inert ? "true" : undefined}
    aria-label={ariaLabel}
    {onclick}
  >
    {@render body()}
  </a>
{:else}
  <button
    class="btn {variant} {size}"
    data-testid={testid}
    {type}
    disabled={inert}
    aria-busy={loading}
    aria-pressed={pressed}
    aria-label={ariaLabel}
    {onclick}
  >
    {@render body()}
  </button>
{/if}

<style>
  /* Riso press recipe: the button sits on a hard ink shadow; hover lifts it off the page, press
     pushes it down onto its own shadow (the shadow collapses). Pure CSS, so it is free of JS and
     collapses to an instant state change under reduced motion via the duration tokens. */
  .btn {
    --btn-bg: var(--color-primary);
    --btn-bg-hover: var(--color-primary-hover);
    --btn-fg: var(--color-on-primary);
    --btn-shadow: var(--shadow-pop-sm);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-xs);
    min-height: var(--size-touch-target);
    min-width: var(--size-touch-target);
    padding: 0 var(--space-md);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-md);
    background: var(--btn-bg);
    color: var(--btn-fg);
    font-family: var(--font-family-display);
    font-size: var(--font-size-md);
    font-weight: var(--font-weight-semibold);
    line-height: var(--font-line-height-tight);
    text-decoration: none;
    cursor: pointer;
    box-shadow: var(--btn-shadow);
    transition:
      background-color var(--motion-duration-fast) var(--motion-easing-standard),
      box-shadow var(--motion-duration-press) var(--motion-easing-press),
      translate var(--motion-duration-press) var(--motion-easing-press);
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
  }
  /* Hover only where a real pointer hovers: on touch screens it would stick after a tap. */
  @media (hover: hover) {
    .btn:hover:not(:disabled, [aria-disabled="true"]) {
      --btn-shadow: var(--shadow-lift);
      background: var(--btn-bg-hover);
      translate: calc(var(--size-lift) * -1) calc(var(--size-lift) * -1);
    }
  }
  .btn:active:not(:disabled, [aria-disabled="true"]),
  .btn[aria-pressed="true"] {
    --btn-shadow: var(--shadow-pressed);
    background: var(--btn-bg-hover);
    translate: var(--size-lift) var(--size-lift);
  }
  .btn:focus-visible {
    outline: var(--border-width-thick) solid var(--color-focus-ring);
    outline-offset: var(--size-focus-offset);
    /* The halo fills the outline gap so the ring reads on any fill and any page colour. */
    box-shadow: var(--shadow-focus-halo), var(--btn-shadow);
  }
  .btn:disabled,
  .btn[aria-disabled="true"] {
    --btn-shadow: var(--shadow-pressed);
    opacity: var(--opacity-disabled);
    cursor: not-allowed;
  }
  .btn[aria-busy="true"] {
    cursor: progress;
  }
  .secondary {
    --btn-bg: var(--color-secondary);
    --btn-bg-hover: var(--color-secondary-hover);
    --btn-fg: var(--color-on-secondary);
  }
  .ghost {
    --btn-bg: transparent;
    --btn-bg-hover: var(--color-primary-subtle);
    --btn-fg: var(--color-text);
    --btn-shadow: var(--shadow-pressed);
    border-color: transparent;
    text-decoration: underline var(--border-width-medium) transparent;
    text-underline-offset: var(--space-2xs);
  }
  @media (hover: hover) {
    .ghost:hover:not(:disabled, [aria-disabled="true"]) {
      --btn-shadow: var(--shadow-pressed);
      translate: none;
      text-decoration-color: var(--color-text-primary);
    }
  }
  .ghost:active:not(:disabled, [aria-disabled="true"]),
  .ghost[aria-pressed="true"] {
    translate: none;
    border-color: var(--color-border-strong);
  }
  .danger {
    --btn-bg: var(--color-danger-solid);
    --btn-bg-hover: var(--color-danger-solid);
    --btn-fg: var(--color-on-danger);
  }
  .sm {
    min-height: var(--size-control-sm);
    padding: 0 var(--space-sm);
    font-size: var(--font-size-sm);
  }
  .lg {
    min-height: var(--size-control-lg);
    padding: 0 var(--space-lg);
    font-size: var(--font-size-lg);
  }
  /* Small buttons are fine for a mouse; a fingertip still needs the full touch target. */
  @media (pointer: coarse) {
    .sm {
      min-height: var(--size-touch-target);
    }
  }
  .icon {
    display: inline-flex;
    inline-size: var(--size-icon-md);
    block-size: var(--size-icon-md);
  }
  .spinner {
    inline-size: var(--size-icon-sm);
    block-size: var(--size-icon-sm);
    border: var(--border-width-medium) solid currentColor;
    border-right-color: transparent;
    border-radius: var(--radius-round);
    animation: spin var(--motion-duration-slower) linear infinite;
  }
  @keyframes spin {
    to {
      rotate: 1turn;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    /* Durations collapse to 0ms via tokens; keep the spinner visible but static. */
    .spinner {
      animation: none;
      border-right-color: currentColor;
      opacity: var(--opacity-muted);
    }
  }
</style>
