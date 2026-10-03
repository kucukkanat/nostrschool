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
  .diagram {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
    min-height: var(--size-diagram-min-height);
    margin: var(--space-lg) 0;
    padding: var(--space-md);
    border: var(--border-width-medium) solid var(--color-border);
    border-radius: var(--radius-lg);
    background: var(--color-surface);
    color: var(--color-text);
    box-shadow: var(--shadow-pop-sm);
    font-family: var(--font-family-body);
    min-width: 0;
  }
  .title {
    font-family: var(--font-family-display);
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-bold);
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
  .narration {
    margin: 0;
    min-height: calc(var(--font-size-md) * 2);
    padding: var(--space-xs) var(--space-sm);
    border-radius: var(--radius-md);
    background: var(--color-surface-sunken);
    font-size: var(--font-size-sm);
  }
  .error {
    margin: 0;
    padding: var(--space-sm);
    border-radius: var(--radius-md);
    background: var(--color-danger-subtle);
    color: var(--color-text);
  }
  .alt summary {
    cursor: pointer;
    min-height: var(--size-touch-target);
    display: flex;
    align-items: center;
    color: var(--color-text-primary);
    font-weight: var(--font-weight-semibold);
  }
  .alt summary:focus-visible {
    outline: var(--border-width-thick) solid var(--color-focus-ring);
    outline-offset: var(--space-3xs);
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
  .alt :global(.scroll) {
    overflow-x: auto;
  }
</style>
