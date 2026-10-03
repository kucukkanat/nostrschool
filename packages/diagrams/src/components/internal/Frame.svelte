<script lang="ts">
  import { format, getDictionary, type Locale } from "@nostrschool/i18n";
  import type { Snippet } from "svelte";
  import type { DiagramError } from "../../logic/validate.ts";

  // Shared chrome for every diagram: title, description, aria-live narration, an optional
  // text alternative and a loud error state for invalid data.
  interface Props {
    readonly testid: string;
    readonly locale: Locale;
    readonly title: string;
    readonly description?: string | undefined;
    readonly narration: string;
    readonly error?: DiagramError | undefined;
    readonly children: Snippet;
    readonly controls?: Snippet | undefined;
    readonly alt?: Snippet | undefined;
  }
  const { testid, locale, title, description, narration, error, children, controls, alt }: Props =
    $props();
  const uid = $props.id();
  const t = $derived(getDictionary(locale).diagrams.common);
</script>

<figure
  class="diagram"
  data-testid={testid}
  aria-labelledby="{uid}-title"
  aria-describedby={description === undefined ? undefined : `${uid}-desc`}
>
  <figcaption id="{uid}-title" class="title">{title}</figcaption>
  {#if description !== undefined}
    <p id="{uid}-desc" class="desc">{description}</p>
  {/if}
  {#if error !== undefined}
    <p class="error" role="alert" data-testid="{testid}-error" data-code={error.code}>
      {format(t.invalid, { code: error.code, message: error.message })}
    </p>
  {:else}
    <div class="canvas">{@render children()}</div>
    {@render controls?.()}
  {/if}
  <p class="narration" data-testid="{testid}-narration" aria-live="polite">{narration}</p>
  {#if alt !== undefined && error === undefined}
    <details class="alt" data-testid="{testid}-text">
      <summary data-testid="{testid}-text-toggle">{t.textVersion}</summary>
      {@render alt()}
    </details>
  {/if}
</figure>

<style>
  /* A taped-in field-notebook plate: paper-2 sheet, 1.5px ink line, hard offset shadow. */
  .diagram {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
    min-height: var(--size-diagram-min-height);
    margin: var(--space-lg) 0;
    padding: var(--space-md);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-lg);
    background: var(--color-surface);
    color: var(--color-text);
    box-shadow: var(--shadow-pop);
    font-family: var(--font-family-body);
    min-width: 0;
  }
  /* 480px = tokens.breakpoint.sm: phones get the full column width back. */
  @media (max-width: 480px) {
    .diagram {
      padding: var(--space-sm);
      box-shadow: var(--shadow-pop-sm);
    }
  }
  .title {
    font-family: var(--font-family-display);
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-bold);
    line-height: var(--font-line-height-tight);
    text-wrap: balance;
  }
  .desc {
    margin: 0;
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
  }
  .canvas {
    flex: 1;
    min-width: 0;
  }
  /* Narration reads like a margin note: ink rule on the start edge, sunken paper well. */
  .narration {
    margin: 0;
    min-height: calc(var(--font-size-md) * 2);
    padding: var(--space-xs) var(--space-sm);
    border-inline-start: var(--border-width-thick) solid var(--color-border-strong);
    border-radius: var(--radius-sm);
    background: var(--color-surface-sunken);
    font-size: var(--font-size-sm);
    overflow-wrap: anywhere;
  }
  .error {
    margin: 0;
    padding: var(--space-sm);
    border: var(--border-width-medium) solid var(--color-danger);
    border-radius: var(--radius-md);
    background: var(--color-danger-subtle);
    color: var(--color-text);
    font-family: var(--font-family-mono);
    font-size: var(--font-size-sm);
    overflow-wrap: anywhere;
  }
  .alt summary {
    cursor: pointer;
    min-height: var(--size-touch-target);
    display: flex;
    align-items: center;
    color: var(--color-text-primary);
    font-family: var(--font-family-mono);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    text-decoration: underline;
    text-decoration-thickness: var(--border-width-medium);
    text-underline-offset: var(--space-3xs);
  }
  .alt summary:focus-visible {
    outline: var(--border-width-thick) solid var(--color-focus-ring);
    outline-offset: var(--size-focus-offset);
    border-radius: var(--radius-sm);
  }
  .alt :global(table) {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--font-size-sm);
  }
  .alt :global(th),
  .alt :global(td) {
    text-align: start;
    padding: var(--space-2xs) var(--space-xs);
    border-bottom: var(--border-width-thin) solid var(--color-border);
    vertical-align: top;
  }
  .alt :global(thead th) {
    border-bottom: var(--border-width-medium) solid var(--color-border-strong);
    font-family: var(--font-family-mono);
    font-size: var(--font-size-xs);
    letter-spacing: var(--font-letter-spacing-caps);
    text-transform: uppercase;
  }
  .alt :global(.scroll) {
    overflow-x: auto;
    scrollbar-color: var(--color-border-strong) var(--color-surface-sunken);
  }
  .alt :global(.scroll:focus-visible) {
    outline: var(--border-width-thick) solid var(--color-focus-ring);
    outline-offset: var(--size-focus-offset);
  }
</style>
