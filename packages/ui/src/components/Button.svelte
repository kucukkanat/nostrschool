<script lang="ts">
  import { squish } from "../actions.ts";
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
    use:squish={{ disabled: inert }}
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
    use:squish={{ disabled: inert }}
  >
    {@render body()}
  </button>
{/if}

<style>
  .btn {
    --btn-bg: var(--color-primary);
    --btn-bg-hover: var(--color-primary-hover);
    --btn-fg: var(--color-on-primary);
    --btn-border: var(--color-primary-active);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-xs);
    min-height: var(--size-control-md);
    min-width: var(--size-touch-target);
    padding: 0 var(--space-md);
    border: var(--border-width-medium) solid var(--btn-border);
    border-radius: var(--radius-pill);
    background: var(--btn-bg);
    color: var(--btn-fg);
    font-family: var(--font-family-display);
    font-size: var(--font-size-md);
    font-weight: var(--font-weight-semibold);
    line-height: var(--font-line-height-tight);
    text-decoration: none;
    cursor: pointer;
    box-shadow: var(--shadow-pop-sm);
    transition:
      background-color var(--motion-duration-fast) var(--motion-easing-standard),
      box-shadow var(--motion-duration-fast) var(--motion-easing-standard),
      translate var(--motion-duration-normal) var(--motion-easing-bounce);
    -webkit-tap-highlight-color: transparent;
  }
  .btn:hover:not(:disabled, [aria-disabled="true"]) {
    background: var(--btn-bg-hover);
    translate: 0 calc(-1 * var(--space-3xs));
    box-shadow: var(--shadow-pop);
  }
  .btn:active:not(:disabled, [aria-disabled="true"]) {
    translate: 0 0;
    box-shadow: none;
  }
  .btn:focus-visible {
    outline: var(--border-width-thick) solid var(--color-focus-ring);
    outline-offset: var(--space-3xs);
  }
  .btn:disabled,
  .btn[aria-disabled="true"] {
    opacity: var(--opacity-disabled);
    cursor: not-allowed;
    box-shadow: none;
  }
  .btn[aria-busy="true"] {
    cursor: progress;
  }
  .btn[aria-pressed="true"] {
    background: var(--btn-bg-hover);
    box-shadow: inset var(--shadow-pop-sm);
  }
  .secondary {
    --btn-bg: var(--color-secondary);
    --btn-bg-hover: var(--color-secondary-hover);
    --btn-fg: var(--color-on-secondary);
    --btn-border: var(--color-secondary-hover);
  }
  .ghost {
    --btn-bg: transparent;
    --btn-bg-hover: var(--color-primary-subtle);
    --btn-fg: var(--color-text-primary);
    --btn-border: transparent;
    box-shadow: none;
  }
  .ghost:hover:not(:disabled, [aria-disabled="true"]) {
    box-shadow: none;
  }
  .danger {
    --btn-bg: var(--color-danger-solid);
    --btn-bg-hover: var(--color-danger);
    --btn-fg: var(--color-on-danger);
    --btn-border: var(--color-danger);
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
