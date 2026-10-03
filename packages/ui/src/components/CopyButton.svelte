<script lang="ts">
  import { getDictionary } from "@nostrschool/i18n";
  import { tokens } from "@nostrschool/tokens";
  import { onDestroy } from "svelte";
  import { pop, squish } from "../actions.ts";
  import { copyText } from "../lib/clipboard.ts";
  import { burstFrom } from "../lib/confetti.ts";
  import type { CopyButtonProps } from "../types.ts";
  import VisuallyHidden from "./VisuallyHidden.svelte";

  const { testid, locale, value, label, confetti = false, size = "sm" }: CopyButtonProps = $props();
  const t = $derived(getDictionary(locale).ui.copy);
  let status = $state<"idle" | "copied" | "failed">("idle");
  let button = $state<HTMLButtonElement>();
  let timer: ReturnType<typeof setTimeout> | undefined;

  const copy = async () => {
    const result = await copyText(value);
    status = result.ok ? "copied" : "failed";
    if (!result.ok) console.warn(`[ui] CopyButton ${testid}: ${result.error.message}`);
    if (result.ok && confetti && button !== undefined) void burstFrom(button);
    clearTimeout(timer);
    // Long enough to read the confirmation; uses the step token so it scales with the motion system.
    timer = setTimeout(() => (status = "idle"), tokens.motion.duration.step);
  };
  onDestroy(() => clearTimeout(timer));
</script>

<button
  bind:this={button}
  type="button"
  class="copy {size}"
  data-testid={testid}
  data-status={status}
  aria-label={label === undefined ? t.copy : undefined}
  onclick={copy}
  use:squish
>
  {#if status === "idle"}
    <span class="face"><span class="glyph" aria-hidden="true">⧉</span>{label ?? ""}</span>
  {:else}
    {#key status}
      <!-- Only feedback pops; the resting face must not animate on page load. -->
      <span class="face" use:pop={{ spring: "wobbly" }}>
        <span class="glyph" aria-hidden="true">{status === "copied" ? "✓" : "!"}</span>
        {status === "copied" ? t.copied : t.failed}
      </span>
    {/key}
  {/if}
</button>
<VisuallyHidden role="status" testid="{testid}-status">
  {status === "copied" ? t.copied : status === "failed" ? t.failed : ""}
</VisuallyHidden>

<style>
  .copy {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: var(--size-control-md);
    min-width: var(--size-control-md);
    padding: 0 var(--space-sm);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-pill);
    background: var(--color-surface-raised);
    color: var(--color-text);
    font-family: var(--font-family-display);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    cursor: pointer;
    transition:
      background-color var(--motion-duration-fast) var(--motion-easing-standard),
      translate var(--motion-duration-normal) var(--motion-easing-bounce);
  }
  .copy:hover {
    background: var(--color-primary-subtle);
    translate: 0 calc(-1 * var(--space-3xs));
  }
  .copy:focus-visible {
    outline: var(--border-width-thick) solid var(--color-focus-ring);
    outline-offset: var(--space-3xs);
  }
  .copy[data-status="copied"] {
    background: var(--color-success-subtle);
    border-color: var(--color-success-solid);
  }
  .copy[data-status="failed"] {
    background: var(--color-danger-subtle);
    border-color: var(--color-danger-solid);
  }
  .sm {
    min-height: var(--size-control-sm);
    min-width: var(--size-control-sm);
    padding: 0 var(--space-xs);
    font-size: var(--font-size-xs);
  }
  .lg {
    min-height: var(--size-control-lg);
    padding: 0 var(--space-md);
    font-size: var(--font-size-md);
  }
  .face {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2xs);
  }
  .glyph {
    font-weight: var(--font-weight-black);
  }
</style>
