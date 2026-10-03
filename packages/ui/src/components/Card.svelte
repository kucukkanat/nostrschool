<script lang="ts">
  import type { CardProps } from "../types.ts";

  const {
    testid = "card",
    as = "div",
    variant = "plain",
    padding = "md",
    header,
    footer,
    children,
  }: CardProps = $props();
</script>

<svelte:element this={as} class="card {variant} pad-{padding}" data-testid={testid}>
  {#if header}
    <header class="header" data-testid="{testid}-header">{@render header()}</header>
  {/if}
  {@render children()}
  {#if footer}
    <footer class="footer" data-testid="{testid}-footer">{@render footer()}</footer>
  {/if}
</svelte:element>

<style>
  .card {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
    background: var(--color-surface);
    color: var(--color-text);
    border: var(--border-width-medium) solid transparent;
    border-radius: var(--radius-lg);
    transition:
      translate var(--motion-duration-normal) var(--motion-easing-bounce),
      box-shadow var(--motion-duration-normal) var(--motion-easing-standard);
  }
  .raised {
    background: var(--color-surface-raised);
    box-shadow: var(--shadow-md);
  }
  .outlined {
    border-color: var(--color-border);
  }
  .highlight {
    background: var(--color-primary-subtle);
    border-color: var(--color-primary);
    box-shadow: var(--shadow-pop);
  }
  /* Cards with a link/button inside lift on hover: a playful "you can poke this" hint. */
  .raised:has(:global(a:hover), :global(button:hover)),
  .highlight:has(:global(a:hover), :global(button:hover)) {
    translate: 0 calc(-1 * var(--space-3xs));
    box-shadow: var(--shadow-lg);
  }
  .pad-sm {
    padding: var(--space-sm);
  }
  .pad-md {
    padding: var(--space-lg);
  }
  .pad-lg {
    padding: var(--space-xl);
  }
  .header {
    font-family: var(--font-family-display);
    font-weight: var(--font-weight-bold);
    font-size: var(--font-size-lg);
  }
  .footer {
    padding-top: var(--space-sm);
    border-top: var(--border-width-thin) solid var(--color-border);
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
  }
</style>
