<script lang="ts">
  import { getDictionary } from "@nostrschool/i18n";
  import type { CalloutProps } from "../types.ts";

  const { testid = "callout", locale, tone, title, children }: CalloutProps = $props();
  const heading = $derived(title ?? getDictionary(locale).ui.callout[tone]);
  const titleId = $props.id();
  // Decorative glyphs: the heading text carries the meaning for assistive tech.
  const ICONS: Readonly<Record<CalloutProps["tone"], string>> = {
    info: "i",
    tip: "★",
    warning: "!",
    danger: "✕",
    safety: "⛨",
  };
</script>

<!-- role="note" rather than <aside>: many callouts per page must not each become a landmark. -->
<div
  class="callout {tone}"
  role="note"
  data-testid={testid}
  data-tone={tone}
  aria-labelledby={titleId}
>
  <span class="icon" aria-hidden="true">{ICONS[tone]}</span>
  <div class="body">
    <strong id={titleId} class="title" data-testid="{testid}-title">{heading}</strong>
    <div class="content">{@render children()}</div>
  </div>
</div>

<style>
  /* A margin note: tinted paper with an ink outline and a square ink-stamped tone marker. The
     marker is a fill (always outlined, ink glyph), so it never relies on a bright colour as a line. */
  .callout {
    --callout-mark: var(--color-info-solid);
    --callout-bg: var(--color-info-subtle);
    --callout-on: var(--color-on-info);
    display: flex;
    gap: var(--space-sm);
    margin: var(--space-lg) 0;
    padding: var(--space-md);
    background: var(--callout-bg);
    color: var(--color-text);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-md);
  }
  .tip {
    --callout-mark: var(--color-success-solid);
    --callout-bg: var(--color-success-subtle);
    --callout-on: var(--color-on-success);
  }
  .warning {
    --callout-mark: var(--color-warning-solid);
    --callout-bg: var(--color-warning-subtle);
    --callout-on: var(--color-on-warning);
  }
  .danger {
    --callout-mark: var(--color-danger-solid);
    --callout-bg: var(--color-danger-subtle);
    --callout-on: var(--color-on-danger);
  }
  .safety {
    --callout-mark: var(--color-accent);
    --callout-bg: var(--color-accent-subtle);
    --callout-on: var(--color-on-accent);
  }
  .icon {
    display: inline-grid;
    place-items: center;
    flex: none;
    inline-size: var(--size-icon-xl);
    block-size: var(--size-icon-xl);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-sm);
    background: var(--callout-mark);
    color: var(--callout-on);
    box-shadow: var(--shadow-pop-sm);
    font-family: var(--font-family-mono);
    font-weight: var(--font-weight-bold);
    rotate: -3deg;
  }
  .body {
    min-width: 0;
    overflow-wrap: anywhere;
  }
  .title {
    display: block;
    margin-bottom: var(--space-2xs);
    font-family: var(--font-family-display);
    font-size: var(--font-size-md);
    font-weight: var(--font-weight-bold);
  }
  .content > :global(:first-child) {
    margin-top: 0;
  }
  .content > :global(:last-child) {
    margin-bottom: 0;
  }
</style>
