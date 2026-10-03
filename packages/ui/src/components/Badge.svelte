<script lang="ts">
  import type { BadgeProps } from "../types.ts";

  const { testid = "badge", tone = "neutral", size = "md", children }: BadgeProps = $props();
</script>

<span class="badge {tone} {size}" data-testid={testid} data-tone={tone}>
  {#if tone === "live"}
    <span class="dot" aria-hidden="true"></span>
  {/if}
  {@render children()}
</span>

<style>
  /* Chips are the one place the pill radius is allowed. Mono type: they label ids, kinds, states. */
  .badge {
    --badge-bg: var(--color-surface-sunken);
    --badge-fg: var(--color-text);
    display: inline-flex;
    align-items: center;
    gap: var(--space-2xs);
    padding: var(--space-3xs) var(--space-xs);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-pill);
    background: var(--badge-bg);
    color: var(--badge-fg);
    font-family: var(--font-family-mono);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    letter-spacing: var(--font-letter-spacing-wide);
    line-height: var(--font-line-height-tight);
    white-space: nowrap;
    vertical-align: middle;
  }
  .sm {
    padding: 0 var(--space-2xs);
    font-size: var(--font-size-xs);
  }
  .primary {
    --badge-bg: var(--color-primary-subtle);
    --badge-fg: var(--color-text-primary);
  }
  .success {
    --badge-bg: var(--color-success-subtle);
  }
  .warning {
    --badge-bg: var(--color-warning-subtle);
  }
  .danger {
    --badge-bg: var(--color-danger-subtle);
  }
  .info {
    --badge-bg: var(--color-info-subtle);
  }
  .live {
    --badge-bg: var(--color-live);
    --badge-fg: var(--color-on-live);
  }
  .regular {
    --badge-bg: var(--color-kind-regular);
    --badge-fg: var(--color-on-kind);
  }
  .replaceable {
    --badge-bg: var(--color-kind-replaceable);
    --badge-fg: var(--color-on-kind);
  }
  .ephemeral {
    --badge-bg: var(--color-kind-ephemeral);
    --badge-fg: var(--color-on-kind);
  }
  .addressable {
    --badge-bg: var(--color-kind-addressable);
    --badge-fg: var(--color-on-kind);
  }
  .dot {
    inline-size: var(--space-xs);
    block-size: var(--space-xs);
    border-radius: var(--radius-round);
    background: currentColor;
    animation: blink var(--motion-duration-step) steps(2, jump-none) infinite;
  }
  /* A stepped blink (like a recording light), not a soft pulse. */
  @keyframes blink {
    50% {
      opacity: var(--opacity-dimmed);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .dot {
      animation: none;
    }
  }
</style>
