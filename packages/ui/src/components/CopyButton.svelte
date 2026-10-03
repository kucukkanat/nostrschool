<script lang="ts">
  import { getDictionary } from "@nostrschool/i18n";
  import { tokens } from "@nostrschool/tokens";
  import { onDestroy } from "svelte";
  import { pop } from "../actions.ts";
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
  /* Same press recipe as Button (lift on hover, shadow collapses on press), on the brightest paper
     so it reads on top of code wells. */
  .copy {
    --copy-shadow: var(--shadow-pop-sm);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: var(--size-control-md);
    min-width: var(--size-control-md);
    padding: 0 var(--space-sm);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-md);
    background: var(--color-surface-raised);
    color: var(--color-text);
    font-family: var(--font-family-mono);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    cursor: pointer;
    box-shadow: var(--copy-shadow);
    transition:
      background-color var(--motion-duration-fast) var(--motion-easing-standard),
      box-shadow var(--motion-duration-press) var(--motion-easing-press),
      translate var(--motion-duration-press) var(--motion-easing-press);
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
  }
  @media (hover: hover) {
    .copy:hover {
      --copy-shadow: var(--shadow-lift);
      background: var(--color-primary-subtle);
      translate: calc(var(--size-lift) * -1) calc(var(--size-lift) * -1);
    }
  }
  .copy:active {
    --copy-shadow: var(--shadow-pressed);
    translate: var(--size-lift) var(--size-lift);
  }
  .copy:focus-visible {
    outline: var(--border-width-thick) solid var(--color-focus-ring);
    outline-offset: var(--size-focus-offset);
    box-shadow: var(--shadow-focus-halo), var(--copy-shadow);
  }
  .copy[data-status="copied"] {
    background: var(--color-success-subtle);
  }
  .copy[data-status="failed"] {
    background: var(--color-danger-subtle);
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
  @media (pointer: coarse) {
    .copy {
      min-height: var(--size-touch-target);
      min-width: var(--size-touch-target);
    }
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
