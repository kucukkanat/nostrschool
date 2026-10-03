<script lang="ts">
  import { format, getDictionary, type Locale } from "@nostrschool/i18n";
  import type { NostrEvent } from "@nostrschool/protocol";
  import { duration, pop, $reducedMotion as reducedMotion, shake } from "@nostrschool/ui";
  import { fly } from "svelte/transition";
  import { EVENT_FIELDS, type EventField, shortHex } from "./lab.ts";

  interface Props {
    readonly testid: string;
    readonly locale: Locale;
    readonly event: NostrEvent;
    /** Fields verification blames (drawn in danger colors, with a shake). */
    readonly flagged?: readonly EventField[];
    /** Bindable: the field whose explanation is open. */
    selected?: EventField | undefined;
  }

  let { testid, locale, event, flagged = [], selected = $bindable() }: Props = $props();
  const t = $derived(getDictionary(locale).chapters.ch03.fields);

  const preview = (field: EventField): string => {
    const v = event[field];
    if (typeof v === "number") return String(v);
    if (field === "tags") return JSON.stringify(v);
    if (field === "content") return JSON.stringify(v);
    return shortHex(String(v));
  };
  const shakeIf = (node: HTMLElement, on: boolean): void => {
    if (on) shake(node);
  };
  // Each tile flies in a beat after the previous one: the JSON "explodes" into parts.
  const flyIn = (i: number) => ({
    y: 24,
    duration: duration("slow", $reducedMotion),
    delay: i * duration("fast", $reducedMotion),
  });
</script>

<ul class="exploded" data-testid={testid} aria-label={t.heading}>
  {#each EVENT_FIELDS as field, i (field)}
    {@const bad = flagged.includes(field)}
    <li class="tile" class:bad class:on={selected === field} in:fly={flyIn(i)}>
      {#key bad}
        <button
          type="button"
          class="face"
          data-testid="{testid}-field-{field}"
          data-flagged={bad}
          aria-pressed={selected === field}
          aria-label={format(t.select, { field })}
          onclick={() => (selected = selected === field ? undefined : field)}
          use:shakeIf={bad}
        >
          <span class="name">{t[field].label}</span>
          {#key event[field]}
            <code class="value" data-testid="{testid}-value-{field}" use:pop>{preview(field)}</code>
          {/key}
          <span class="short">{t[field].short}</span>
          {#if bad}
            <span class="flag" data-testid="{testid}-flag-{field}">{t.flagged}</span>
          {/if}
        </button>
      {/key}
    </li>
  {/each}
</ul>

<style>
  .exploded {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, calc(var(--size-rail) * 0.75)), 1fr));
    gap: var(--space-sm);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .tile {
    min-width: 0;
  }
  .face {
    display: flex;
    flex-direction: column;
    gap: var(--space-2xs);
    width: 100%;
    height: 100%;
    min-height: var(--size-touch-target);
    padding: var(--space-sm);
    border: var(--border-width-medium) solid var(--color-border);
    border-radius: var(--radius-lg);
    background: var(--color-surface-raised);
    color: var(--color-text);
    font: inherit;
    text-align: start;
    cursor: pointer;
    box-shadow: var(--shadow-sm);
    transition:
      transform var(--motion-duration-normal) var(--motion-easing-bounce),
      box-shadow var(--motion-duration-normal) var(--motion-easing-standard),
      border-color var(--motion-duration-normal) var(--motion-easing-standard);
  }
  .face:hover {
    transform: translateY(calc(-1 * var(--space-3xs))) rotate(-0.5deg);
    box-shadow: var(--shadow-pop-sm);
    border-color: var(--color-primary);
  }
  .face:focus-visible {
    outline: var(--border-width-thick) solid var(--color-focus-ring);
    outline-offset: var(--space-3xs);
  }
  .on .face {
    border-color: var(--color-primary);
    background: var(--color-primary-subtle);
    box-shadow: var(--shadow-pop-sm);
  }
  .bad .face {
    border-color: var(--color-danger);
    background: var(--color-danger-subtle);
  }
  .name {
    font-family: var(--font-family-mono);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
  }
  .bad .name {
    color: var(--color-text);
  }
  .value {
    padding: var(--space-2xs) var(--space-xs);
    border-radius: var(--radius-sm);
    background: var(--color-code-bg);
    color: var(--color-code-text);
    font-family: var(--font-family-mono);
    font-size: var(--font-size-xs);
    overflow-wrap: anywhere;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .short {
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
  }
  .flag {
    align-self: flex-start;
    padding: var(--space-3xs) var(--space-xs);
    border-radius: var(--radius-pill);
    background: var(--color-danger);
    color: var(--color-on-danger);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-bold);
  }
</style>
