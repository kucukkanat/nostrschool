<script lang="ts">
  /**
   * Global "Go live" switch. A toggle button (aria-pressed) plus an unmissable LIVE badge, since
   * live mode changes where every interactive gets its data. Read-only either way.
   */
  import { $liveMode as liveMode } from "@nostrschool/data/stores.ts";
  import { getDictionary, type Locale } from "@nostrschool/i18n";
  import { mascotBus } from "@nostrschool/ui/bus.ts";

  interface Props {
    readonly locale: Locale;
  }
  const { locale }: Props = $props();
  const t = $derived(getDictionary(locale).common);

  // Start false to match the server render, then sync from the persisted store after mount.
  let live = $state(false);
  let announcement = $state("");
  $effect(() =>
    liveMode.subscribe((value) => {
      live = value;
    }),
  );
  // Lets page CSS (e.g. a live outline) react without importing the store.
  $effect(() => {
    document.documentElement.dataset["live"] = live ? "on" : "off";
  });

  const toggle = () => {
    const next = !live;
    liveMode.set(next);
    announcement = next ? t.live.enabled : t.live.disabled;
    mascotBus.emit(next ? "live:on" : "live:off", {});
  };
</script>

<div class="live" data-testid="live-mode" data-live={live ? "on" : "off"}>
  <button
    type="button"
    class="switch"
    aria-pressed={live}
    aria-describedby="live-mode-description"
    title={t.live.description}
    data-testid="live-toggle"
    onclick={toggle}
  >
    <span class="track" aria-hidden="true"><span class="thumb"></span></span>
    <span class="label">{t.live.label}</span>
  </button>
  {#if live}
    <span class="badge" data-testid="live-badge"
      ><span class="dot" aria-hidden="true"></span>{t.live.on}</span
    >
  {/if}
  <span id="live-mode-description" class="visually-hidden">{t.live.description}</span>
  <span class="visually-hidden" aria-live="polite" data-testid="live-announcement"
    >{announcement}</span
  >
</div>

<style>
  .live {
    display: inline-flex;
    align-items: center;
    gap: var(--space-xs);
  }
  /* Ink-outlined button with a switch track inside; lifts on hover, presses flat. */
  .switch {
    display: inline-flex;
    align-items: center;
    gap: var(--space-xs);
    min-block-size: var(--size-control-sm);
    padding: var(--space-3xs) var(--space-xs) var(--space-3xs) var(--space-2xs);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-md);
    background: var(--color-surface-raised);
    color: var(--color-text);
    font: inherit;
    font-family: var(--font-family-display);
    font-weight: var(--font-weight-bold);
    font-size: var(--font-size-sm);
    box-shadow: var(--shadow-pop-sm);
    cursor: pointer;
    transition:
      translate var(--motion-duration-press) var(--motion-easing-press),
      box-shadow var(--motion-duration-press) var(--motion-easing-press);
  }
  .switch:hover {
    translate: calc(var(--size-lift) * -1) calc(var(--size-lift) * -1);
    box-shadow: var(--shadow-lift);
  }
  .switch:active {
    translate: var(--size-lift) var(--size-lift);
    box-shadow: var(--shadow-pressed);
  }
  /* A pill track is the one place the brand allows a pill: it reads as a physical switch. */
  .track {
    position: relative;
    flex: none;
    inline-size: calc(var(--size-icon-md) * 2);
    block-size: var(--size-icon-md);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-pill);
    background: var(--color-surface-sunken);
    transition: background var(--motion-duration-fast) var(--motion-easing-standard);
  }
  .thumb {
    position: absolute;
    inset-block-start: var(--space-3xs);
    inset-inline-start: var(--space-3xs);
    inline-size: calc(var(--size-icon-md) - var(--space-3xs) * 2 - var(--border-width-medium) * 2);
    block-size: calc(var(--size-icon-md) - var(--space-3xs) * 2 - var(--border-width-medium) * 2);
    border-radius: var(--radius-round);
    background: var(--color-surface-inverse);
    transition: translate var(--motion-duration-normal) var(--motion-easing-bounce);
  }
  [aria-pressed="true"] .track {
    background: var(--color-live);
  }
  [aria-pressed="true"] .thumb {
    translate: var(--size-icon-md) 0;
  }
  .badge {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2xs);
    padding: var(--space-3xs) var(--space-xs);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-sm);
    background: var(--color-live);
    color: var(--color-on-live);
    font-family: var(--font-family-mono);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-bold);
    letter-spacing: var(--font-letter-spacing-caps);
    box-shadow: var(--shadow-pop-sm);
    animation: stamp var(--motion-duration-normal) var(--motion-easing-bounce);
  }
  /* Stamped on: drops in slightly rotated and settles. */
  @keyframes stamp {
    from {
      scale: 1.3;
      rotate: -6deg;
      opacity: 0;
    }
  }
  /* The label is always visible: on small screens the switch lives in the header's menu sheet,
     which has room for it, so the control never appears as an unexplained switch. */
  .dot {
    inline-size: var(--space-xs);
    block-size: var(--space-xs);
    border-radius: var(--radius-round);
    background: currentColor;
    animation: pulse var(--motion-duration-step) var(--motion-easing-standard) infinite;
  }
  @keyframes pulse {
    50% {
      opacity: var(--opacity-dimmed);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .dot,
    .badge {
      animation: none;
    }
  }
</style>
