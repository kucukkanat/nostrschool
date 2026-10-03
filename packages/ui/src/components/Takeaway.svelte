<script lang="ts">
  import { getDictionary } from "@nostrschool/i18n";
  import type { TakeawayProps } from "../types.ts";

  const { testid = "takeaway", locale, title, points }: TakeawayProps = $props();
  const headingId = $props.id();
</script>

<section class="takeaway" data-testid={testid} aria-labelledby={headingId}>
  <h2 id={headingId} class="title">{title ?? getDictionary(locale).ui.takeaway.title}</h2>
  <ul class="points">
    {#each points as point, i (i)}
      <li data-testid="{testid}-point-{i}" style:--i={i}>{point}</li>
    {/each}
  </ul>
</section>

<style>
  /* The page you'd tear out of the notebook: brightest paper, ink outline, orange misregistration
     shadow (it's the featured card), and the heading underlined with a highlighter stroke. */
  .takeaway {
    margin: var(--space-xl) 0;
    padding: var(--space-md);
    background: var(--color-surface-raised);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-accent);
  }
  /* Mirrors tokens.breakpoint.sm (480px). */
  @media (min-width: 480px) {
    .takeaway {
      padding: var(--space-lg);
    }
  }
  .title {
    position: relative;
    isolation: isolate;
    inline-size: fit-content;
    margin: 0 0 var(--space-lg);
    font-family: var(--font-family-display);
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-black);
    line-height: var(--font-line-height-tight);
    color: var(--color-text);
  }
  /* The marker stroke sits below the descenders, so the heading never has to contrast with it. */
  .title::after {
    content: "";
    position: absolute;
    z-index: -1;
    inset-inline: calc(-1 * var(--space-2xs));
    inset-block-end: calc(-1 * var(--space-xs));
    block-size: var(--space-xs);
    border-radius: var(--radius-sm);
    background: var(--color-highlight);
    rotate: -1deg;
  }
  .points {
    display: grid;
    gap: var(--space-sm);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  li {
    position: relative;
    padding-left: var(--space-lg);
    overflow-wrap: anywhere;
    animation: rise var(--motion-duration-slow) var(--motion-easing-decelerate) both;
    animation-delay: calc(var(--i) * var(--motion-duration-fast));
  }
  li::before {
    content: "✓" / "";
    position: absolute;
    left: 0;
    color: var(--color-text-primary);
    font-weight: var(--font-weight-black);
  }
  @keyframes rise {
    from {
      opacity: 0;
      translate: 0 var(--space-xs);
    }
  }
</style>
