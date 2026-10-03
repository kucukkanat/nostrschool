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
  /* Cards are notebook pages: a sheet of paper-2 with an ink outline. Raised pages sit on a hard
     offset shadow; the highlight page is the "featured" one (orange misregistration shadow). */
  .card {
    --card-shadow: var(--shadow-pressed);
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
    min-inline-size: 0;
    background: var(--color-surface);
    color: var(--color-text);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-md);
    box-shadow: var(--card-shadow);
    transition:
      translate var(--motion-duration-press) var(--motion-easing-press),
      box-shadow var(--motion-duration-press) var(--motion-easing-press);
  }
  .raised {
    --card-shadow: var(--shadow-pop);
    background: var(--color-surface-raised);
  }
  /* A loose sheet: no fill, a soft dashed edge, for secondary groupings. */
  .outlined {
    background: transparent;
    border-style: dashed;
  }
  .highlight {
    --card-shadow: var(--shadow-accent);
    background: var(--color-primary-subtle);
  }
  /* Cards with a link/button inside lift on hover: a "you can poke this" hint. */
  @media (hover: hover) {
    .raised:has(:global(a:hover), :global(button:hover)),
    .highlight:has(:global(a:hover), :global(button:hover)) {
      --card-shadow: var(--shadow-lift);
      translate: calc(var(--size-lift) * -1) calc(var(--size-lift) * -1);
    }
  }
  .pad-sm {
    padding: var(--space-sm);
  }
  .pad-md {
    padding: var(--space-md);
  }
  .pad-lg {
    padding: var(--space-lg);
  }
  /* Mirrors tokens.breakpoint.sm (480px): roomier pages once there's width to spare. */
  @media (min-width: 480px) {
    .pad-md {
      padding: var(--space-lg);
    }
    .pad-lg {
      padding: var(--space-xl);
    }
  }
  .header {
    padding-bottom: var(--space-xs);
    border-bottom: var(--border-width-thin) dashed var(--color-border-strong);
    font-family: var(--font-family-display);
    font-weight: var(--font-weight-bold);
    font-size: var(--font-size-lg);
    line-height: var(--font-line-height-snug);
  }
  .footer {
    padding-top: var(--space-sm);
    border-top: var(--border-width-thin) dashed var(--color-border-strong);
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
  }
</style>
