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
  // Touch has no hover: the first tap on the term opens the card (instead of navigating) and a
  // second tap closes it; "Read more" inside the card is the way to the glossary. We remember the
  // state at pointerdown because the compatibility mouseenter/focus events that follow a tap
  // open the card before the click arrives.
  let touchTap: { readonly wasOpen: boolean } | undefined;
  const onpointerdown = (e: PointerEvent) => {
    touchTap = e.pointerType === "mouse" ? undefined : { wasOpen: open };
  };
  const onclick = (e: MouseEvent) => {
    if (touchTap === undefined) return;
    e.preventDefault();
    clearTimeout(timer);
    open = !touchTap.wasOpen;
    touchTap = undefined;
  };
  // A tap anywhere outside closes a card opened by touch (there is no mouseleave to do it).
  let wrapEl: HTMLElement | undefined = $state();
  $effect(() => {
    if (!open) return;
    const outside = (e: PointerEvent) => {
      if (e.target instanceof Node && wrapEl?.contains(e.target) !== true) open = false;
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  });
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
  bind:this={wrapEl}
  class="wrap"
  data-open={open}
  onmouseenter={show}
  onmouseleave={hideSoon}
  onfocusin={show}
  {onfocusout}
  {onkeydown}
>
  <a
    class="term"
    data-testid={testid}
    href={glossaryHref}
    aria-describedby={cardId}
    {onpointerdown}
    {onclick}
  >
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
      <span class="inner" use:pop={{ from: 0.94 }}>
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
  /* Glossary terms wear a dotted pencil underline in accent ink; hovering/opening marks them with
     the highlighter. */
  .term {
    color: inherit;
    text-decoration: underline dotted var(--color-text-primary);
    text-decoration-thickness: var(--border-width-medium);
    text-underline-offset: var(--space-3xs);
    border-radius: var(--radius-sm);
    cursor: help;
    -webkit-tap-highlight-color: transparent;
    transition: background-color var(--motion-duration-fast) var(--motion-easing-standard);
  }
  [data-open="true"] .term {
    background: var(--color-primary-subtle);
    text-decoration-style: solid;
  }
  @media (hover: hover) {
    .term:hover {
      background: var(--color-primary-subtle);
    }
  }
  .term:focus-visible {
    outline: var(--border-width-thick) solid var(--color-focus-ring);
    outline-offset: var(--size-focus-offset);
  }
  .card {
    position: absolute;
    inset-block-start: calc(100% + var(--space-xs));
    inset-inline-start: 0;
    z-index: var(--z-popover);
    display: block;
    inline-size: max-content;
    max-inline-size: min(var(--size-rail), calc(100vw - var(--space-xl)));
  }
  .card[hidden] {
    display: none;
  }
  /* An index card clipped to the page: brightest paper, ink outline, hard shadow. */
  .inner {
    display: flex;
    flex-direction: column;
    gap: var(--space-2xs);
    padding: var(--space-sm) var(--space-md);
    border: var(--border-width-medium) solid var(--color-border-strong);
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
    text-decoration: none;
    white-space: normal;
    overflow-wrap: anywhere;
    transform-origin: top left;
  }
  .name {
    font-family: var(--font-family-display);
    font-size: var(--font-size-md);
    font-weight: var(--font-weight-bold);
  }
  .more {
    display: inline-flex;
    align-items: center;
    align-self: flex-start;
    color: var(--color-text-primary);
    font-weight: var(--font-weight-semibold);
  }
  /* On touch, "Read more" is the only way on to the glossary: give it a fingertip-sized target. */
  @media (pointer: coarse) {
    .more {
      min-block-size: var(--size-touch-target);
    }
  }
</style>
