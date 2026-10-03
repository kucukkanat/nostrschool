<script lang="ts">
  /**
   * Ink-drawn padlock that replaces the old lock emoji: linework in the text colour so it
   * themes with the page, the body filled with a spot colour only when locked.
   * Decorative — the surrounding text always states the lock state.
   */
  interface Props {
    open: boolean;
    testid?: string;
  }
  const { open, testid }: Props = $props();
</script>

<svg
  class="lock-glyph"
  class:open
  viewBox="0 0 24 24"
  aria-hidden="true"
  focusable="false"
  data-testid={testid}
  data-open={open}
>
  <path class="shackle" d={open ? "M8 11V7a4 4 0 0 1 7.6-1.8" : "M8 11V7a4 4 0 0 1 8 0v4"} />
  <rect class="body" x="5" y="11" width="14" height="10" rx="1.5" />
  <circle class="hole" cx="12" cy="16" r="1.4" />
</svg>

<style>
  .lock-glyph {
    flex: none;
    inline-size: var(--size-icon-lg);
    block-size: var(--size-icon-lg);
    overflow: visible;
  }
  .shackle,
  .body {
    fill: none;
    stroke: var(--color-text);
    stroke-width: var(--border-width-thick);
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .body {
    fill: var(--color-secondary);
  }
  .open .body {
    fill: var(--color-surface-raised);
  }
  .hole {
    fill: var(--color-text);
  }
</style>
