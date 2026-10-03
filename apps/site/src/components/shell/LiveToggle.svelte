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
  .switch {
    display: inline-flex;
    align-items: center;
    gap: var(--space-xs);
    min-block-size: var(--size-control-sm);
    padding: var(--space-3xs) var(--space-xs) var(--space-3xs) var(--space-3xs);
    border: var(--border-width-thin) solid var(--color-border);
    border-radius: var(--radius-pill);
    background: var(--color-surface-sunken);
    color: var(--color-text);
    font: inherit;
    font-family: var(--font-family-display);
    font-weight: var(--font-weight-bold);
    font-size: var(--font-size-sm);
    cursor: pointer;
    transition: transform var(--motion-duration-normal) var(--motion-easing-bounce);
  }
  .switch:hover {
    transform: scale(1.04);
  }
  .switch:active {
    transform: scale(0.96);
  }
  .track {
    position: relative;
    inline-size: calc(var(--size-icon-md) * 2);
    block-size: var(--size-icon-md);
    border-radius: var(--radius-pill);
    background: var(--color-border-strong);
    transition: background var(--motion-duration-fast) var(--motion-easing-standard);
  }
  .thumb {
    position: absolute;
    inset-block-start: var(--space-3xs);
    inset-inline-start: var(--space-3xs);
    inline-size: calc(var(--size-icon-md) - var(--space-3xs) * 2);
    block-size: calc(var(--size-icon-md) - var(--space-3xs) * 2);
    border-radius: var(--radius-round);
    background: var(--color-surface);
    box-shadow: var(--shadow-sm);
    transition: translate var(--motion-duration-normal) var(--motion-easing-bounce);
  }
  [aria-pressed="true"] .track {
    background: var(--color-live);
  }
  [aria-pressed="true"] .thumb {
    translate: var(--size-icon-md) 0;
  }
  .live {
    display: inline-flex;
    align-items: center;
    gap: var(--space-xs);
  }
  .badge {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2xs);
    padding: var(--space-3xs) var(--space-xs);
    border-radius: var(--radius-pill);
    background: var(--color-live);
    color: var(--color-on-live);
    font-family: var(--font-family-display);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-black);
    letter-spacing: var(--font-letter-spacing-caps);
    box-shadow: var(--shadow-pop-sm);
    animation: pop var(--motion-duration-slow) var(--motion-easing-bounce);
  }
  @keyframes pop {
    from {
      transform: scale(0.6);
      opacity: 0;
    }
  }
  /* The label is always visible: on small screens the switch lives in the header's settings
     popover, which has room for it, so the control never appears as an unexplained switch. */
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
