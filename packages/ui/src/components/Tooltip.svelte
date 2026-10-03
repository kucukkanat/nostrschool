<script lang="ts">
  import type { TooltipProps } from "../types.ts";

  const { testid = "tooltip", content, placement = "top", children }: TooltipProps = $props();
  const tipId = $props.id();
  // Escape hides the bubble until the pointer/focus leaves and comes back (WCAG 1.4.13 dismissible).
  let dismissed = $state(false);
  let wrap = $state<HTMLSpanElement>();

  // The description belongs on the focusable trigger inside (that's what screen readers announce);
  // a non-interactive child gets the wrapper itself made focusable so keyboard users can reach it.
  $effect(() => {
    if (wrap === undefined) return;
    const target = wrap.querySelector<HTMLElement>(FOCUSABLE);
    if (target === null) wrap.tabIndex = 0;
    (target ?? wrap).setAttribute("aria-describedby", tipId);
  });
</script>

<script lang="ts" module>
  const FOCUSABLE = "a[href], button, input, select, textarea, [tabindex]";
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- biome-ignore lint/a11y/noStaticElementInteractions: hover/focus relay only; the trigger inside is the control -->
<span
  class="tooltip {placement}"
  class:dismissed
  data-testid={testid}
  bind:this={wrap}
  onkeydown={(e) => {
    if (e.key === "Escape") dismissed = true;
  }}
  onmouseleave={() => (dismissed = false)}
  onfocusout={() => (dismissed = false)}
>
  {@render children()}
  <span class="bubble" role="tooltip" id={tipId} data-testid="{testid}-content">{content}</span>
</span>

<style>
  .tooltip {
    position: relative;
    border-radius: var(--radius-sm);
    display: inline-flex;
  }
  .tooltip:focus-visible {
    outline: var(--border-width-thick) solid var(--color-focus-ring);
    outline-offset: var(--size-focus-offset);
  }
  .bubble {
    position: absolute;
    z-index: var(--z-popover);
    inline-size: max-content;
    max-inline-size: min(var(--size-rail), calc(100vw - var(--space-xl)));
    padding: var(--space-2xs) var(--space-xs);
    border-radius: var(--radius-sm);
    background: var(--color-surface-inverse);
    color: var(--color-text-inverse);
    font-family: var(--font-family-mono);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-medium);
    line-height: var(--font-line-height-snug);
    pointer-events: none;
    opacity: 0;
    scale: 0.96;
    transition:
      opacity var(--motion-duration-fast) var(--motion-easing-standard),
      scale var(--motion-duration-fast) var(--motion-easing-decelerate);
  }
  .top .bubble {
    inset-block-end: calc(100% + var(--space-2xs));
    inset-inline-start: 50%;
    translate: -50% 0;
    transform-origin: bottom center;
  }
  .bottom .bubble {
    inset-block-start: calc(100% + var(--space-2xs));
    inset-inline-start: 50%;
    translate: -50% 0;
    transform-origin: top center;
  }
  .left .bubble {
    inset-inline-end: calc(100% + var(--space-2xs));
    inset-block-start: 50%;
    translate: 0 -50%;
    transform-origin: center right;
  }
  .right .bubble {
    inset-inline-start: calc(100% + var(--space-2xs));
    inset-block-start: 50%;
    translate: 0 -50%;
    transform-origin: center left;
  }
  .tooltip:is(:hover, :focus-within):not(.dismissed) .bubble {
    pointer-events: auto;
    opacity: 1;
    scale: 1;
  }
</style>
