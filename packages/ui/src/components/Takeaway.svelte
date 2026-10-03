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
  .takeaway {
    margin: var(--space-xl) 0;
    padding: var(--space-lg);
    background: var(--color-primary-subtle);
    border: var(--border-width-medium) solid var(--color-primary);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-pop);
  }
  .title {
    margin: 0 0 var(--space-sm);
    font-family: var(--font-family-display);
    font-size: var(--font-size-xl);
    color: var(--color-text-primary);
  }
  .points {
    display: grid;
    gap: var(--space-xs);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  li {
    position: relative;
    padding-left: var(--space-lg);
    animation: rise var(--motion-duration-slow) var(--motion-easing-bounce) both;
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
