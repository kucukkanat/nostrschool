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
  .callout {
    --callout-accent: var(--color-info-solid);
    --callout-bg: var(--color-info-subtle);
    --callout-on: var(--color-on-info);
    display: flex;
    gap: var(--space-sm);
    margin: var(--space-lg) 0;
    padding: var(--space-md);
    background: var(--callout-bg);
    color: var(--color-text);
    border-left: var(--border-width-heavy) solid var(--callout-accent);
    border-radius: var(--radius-md);
  }
  .tip {
    --callout-accent: var(--color-success-solid);
    --callout-bg: var(--color-success-subtle);
    --callout-on: var(--color-on-success);
  }
  .warning {
    --callout-accent: var(--color-warning-solid);
    --callout-bg: var(--color-warning-subtle);
    --callout-on: var(--color-on-warning);
  }
  .danger {
    --callout-accent: var(--color-danger-solid);
    --callout-bg: var(--color-danger-subtle);
    --callout-on: var(--color-on-danger);
  }
  .safety {
    --callout-accent: var(--color-accent);
    --callout-bg: var(--color-accent-subtle);
    --callout-on: var(--color-on-accent);
  }
  .icon {
    display: inline-grid;
    place-items: center;
    flex: none;
    inline-size: var(--size-icon-xl);
    block-size: var(--size-icon-xl);
    border-radius: var(--radius-round);
    background: var(--callout-accent);
    color: var(--callout-on);
    font-family: var(--font-family-display);
    font-weight: var(--font-weight-black);
  }
  .body {
    min-width: 0;
  }
  .title {
    display: block;
    margin-bottom: var(--space-2xs);
    font-family: var(--font-family-display);
    font-size: var(--font-size-md);
  }
  .content > :global(:first-child) {
    margin-top: 0;
  }
  .content > :global(:last-child) {
    margin-bottom: 0;
  }
</style>
