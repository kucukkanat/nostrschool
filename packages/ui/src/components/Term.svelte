<script lang="ts">
  import { getDictionary } from "@nostrschool/i18n";
  import { tokens } from "@nostrschool/tokens";
  import { onDestroy, untrack } from "svelte";
  import { pop } from "../actions.ts";
  import { resolveTerm } from "../lib/glossary.ts";
  import { viewportShift } from "../lib/popover.ts";
  import type { TermProps } from "../types.ts";

  const { id, locale, glossaryHref, testid = `term-${id}`, children }: TermProps = $props();
  const card = $derived(resolveTerm(locale, id));
  const readMore = $derived(getDictionary(locale).ui.term.readMore);
  const cardId = $props.id();
  let open = $state(false);
  let timer: ReturnType<typeof setTimeout> | undefined;
  let cardEl: HTMLElement | undefined = $state();
  // Cards anchor to the term's start; near the right edge of a phone they'd overflow and add
  // horizontal page scroll, so once open we measure and slide the card back inside the viewport.
  let shift = $state(0);
  const VIEWPORT_MARGIN = Number.parseFloat(tokens.space.md);
  $effect(() => {
    if (!open || cardEl === undefined) return;
    const r = cardEl.getBoundingClientRect();
    const naturalLeft = r.left - untrack(() => shift);
    shift = viewportShift(
      naturalLeft,
      r.width,
      document.documentElement.clientWidth,
      VIEWPORT_MARGIN,
    );
  });

  const show = () => {
    clearTimeout(timer);
    open = true;
  };
  // A short grace period lets the pointer travel from the term into the card (WCAG 1.4.13 hoverable).
  const hideSoon = () => {
    clearTimeout(timer);
    timer = setTimeout(() => (open = false), tokens.motion.duration.slow);
  };
  const onfocusout = (e: FocusEvent) => {
    const wrap = e.currentTarget as HTMLElement;
    if (!(e.relatedTarget instanceof Node && wrap.contains(e.relatedTarget))) hideSoon();
  };
  const onkeydown = (e: KeyboardEvent) => {
    if (e.key === "Escape" && open) {
      clearTimeout(timer);
      open = false;
      e.stopPropagation();
    }
  };
  onDestroy(() => clearTimeout(timer));
</script>

<!-- The wrapper only relays hover/focus to show the card; the link inside is the interactive part. -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- biome-ignore lint/a11y/noStaticElementInteractions: hover/focus relay only; the inner link is the control -->
<span
  class="wrap"
  data-open={open}
  onmouseenter={show}
  onmouseleave={hideSoon}
  onfocusin={show}
  {onfocusout}
  {onkeydown}
>
  <a class="term" data-testid={testid} href={glossaryHref} aria-describedby={cardId}>
    {#if children}
      {@render children()}
    {:else}
      {card.term}
    {/if}
  </a><span
    bind:this={cardEl}
    class="card"
    id={cardId}
    data-testid="{testid}-card"
    data-status={card.status}
    hidden={!open}
    style:translate="{shift}px 0"
  >
    {#if open}
      <span class="inner" use:pop={{ spring: "bouncy", from: 0.9 }}>
        <strong class="name">{card.term}</strong>
        {#if card.status === "ok"}
          <span class="short" lang={card.source === locale ? undefined : card.source}
            >{card.short}</span
          >
        {/if}
        <a class="more" href={glossaryHref} data-testid="{testid}-more" tabindex="-1"
          >{readMore}
          →</a
        >
      </span>
    {:else}
      <!-- Collapsed copy keeps the accessible description available without the visual card. -->
      <span class="inner">{card.term}{card.status === "ok" ? `: ${card.short}` : ""}</span>
    {/if}
  </span>
</span>

<style>
  .wrap {
    position: relative;
    display: inline;
  }
  .term {
    color: inherit;
    text-decoration: underline dotted var(--color-primary);
    text-decoration-thickness: var(--border-width-medium);
    text-underline-offset: var(--space-3xs);
    border-radius: var(--radius-sm);
    cursor: help;
    transition: background-color var(--motion-duration-fast) var(--motion-easing-standard);
  }
  .term:hover,
  [data-open="true"] .term {
    background: var(--color-primary-subtle);
  }
  .term:focus-visible {
    outline: var(--border-width-thick) solid var(--color-focus-ring);
    outline-offset: var(--space-3xs);
  }
  .card {
    position: absolute;
    inset-block-start: calc(100% + var(--space-2xs));
    inset-inline-start: 0;
    z-index: var(--z-popover);
    display: block;
    inline-size: max-content;
    max-inline-size: min(var(--size-rail), calc(100vw - var(--space-xl)));
  }
  .card[hidden] {
    display: none;
  }
  .inner {
    display: flex;
    flex-direction: column;
    gap: var(--space-2xs);
    padding: var(--space-sm) var(--space-md);
    border: var(--border-width-medium) solid var(--color-primary);
    border-radius: var(--radius-md);
    background: var(--color-surface-raised);
    color: var(--color-text);
    box-shadow: var(--shadow-pop);
    font-family: var(--font-family-body);
    font-size: var(--font-size-sm);
    font-style: normal;
    font-weight: var(--font-weight-regular);
    line-height: var(--font-line-height-normal);
    text-align: start;
    white-space: normal;
    transform-origin: top left;
  }
  .name {
    font-family: var(--font-family-display);
    font-size: var(--font-size-md);
    color: var(--color-text-primary);
  }
  .more {
    color: var(--color-text-primary);
    font-weight: var(--font-weight-semibold);
  }
</style>
