<script lang="ts">
  import { format, getDictionary, type Locale } from "@nostrschool/i18n";
  import { Badge, pop } from "@nostrschool/ui";
  import { describeKind, nipLabel, parseKindNumber } from "./kinds-logic.ts";

  interface Props {
    readonly locale: Locale;
    /** Parts: `-input -result -category -known -error`. */
    readonly testid?: string;
    readonly initial?: string;
    readonly headingLevel?: 2 | 3;
  }

  const {
    locale,
    testid = "ch06-classifier",
    initial = "30023",
    headingLevel = 3,
  }: Props = $props();
  const dict = $derived(getDictionary(locale));
  const t = $derived(dict.chapters.ch06.classifier);
  const uid = $props.id();
  // svelte-ignore state_referenced_locally
  let value = $state(initial);
  const parsed = $derived(parseKindNumber(value));
  const lookup = $derived(parsed.ok ? describeKind(parsed.value) : undefined);
  const knownName = $derived.by(() => {
    if (lookup?.info === undefined) return undefined;
    const names: Readonly<Record<string, { readonly name: string } | undefined>> = dict.kinds.names;
    return names[lookup.info.i18nKey]?.name ?? lookup.info.name;
  });
</script>

<div class="classifier" data-testid={testid}>
  <svelte:element this={`h${headingLevel}`} class="title">{t.title}</svelte:element>
  <label for="{uid}-in" class="label">{t.label}</label>
  <input
    id="{uid}-in"
    inputmode="numeric"
    autocomplete="off"
    placeholder={t.placeholder}
    bind:value
    aria-describedby="{uid}-out"
    aria-invalid={!parsed.ok && parsed.error.code !== "empty"}
    data-testid="{testid}-input"
  >
  <div id="{uid}-out" class="out" aria-live="polite" data-testid="{testid}-result">
    {#if lookup !== undefined}
      {#key lookup.category}
        <p class="verdict" use:pop>
          <span aria-hidden="true">
            <Badge testid="{testid}-category" tone={lookup.category}>
              {dict.kinds.categories[lookup.category]}
            </Badge>
          </span>
          <span
            >{format(t.result, {
              kind: lookup.kind,
              category: dict.kinds.categories[lookup.category],
            })}</span
          >
        </p>
      {/key}
      <p class="rule">{dict.kinds.categoryDescriptions[lookup.category]}</p>
      {#if lookup.info !== undefined && knownName !== undefined}
        <p data-testid="{testid}-known">
          {format(t.known, { name: knownName, nip: nipLabel(lookup.info.nip) })}
        </p>
      {:else if !lookup.inRange}
        <p data-testid="{testid}-outside">{t.outside}</p>
      {:else}
        <p data-testid="{testid}-unknown">{t.unknown}</p>
      {/if}
    {:else if !parsed.ok}
      <p class="error" data-testid="{testid}-error" data-code={parsed.error.code}>
        {t.errors[parsed.error.code]}
      </p>
    {/if}
  </div>
</div>

<style>
  .classifier {
    display: grid;
    gap: var(--space-xs);
    margin-block: var(--space-lg);
    padding: var(--space-md);
    border: var(--border-width-medium) dashed var(--color-border-strong);
    border-radius: var(--radius-xl);
    background: var(--color-surface);
  }
  .title {
    margin: 0;
    font-family: var(--font-family-display);
    font-size: var(--font-size-lg);
  }
  .label {
    font-weight: var(--font-weight-semibold);
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
  }
  input {
    max-inline-size: var(--size-rail);
    min-block-size: var(--size-touch-target);
    padding: var(--space-xs) var(--space-sm);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-lg);
    background: var(--color-surface-raised);
    color: var(--color-text);
    font-family: var(--font-family-mono);
    font-size: var(--font-size-lg);
  }
  input:focus-visible {
    outline: var(--border-width-thick) solid var(--color-focus-ring);
    outline-offset: var(--space-3xs);
  }
  input[aria-invalid="true"] {
    border-color: var(--color-danger);
  }
  .out {
    min-block-size: var(--size-control-lg);
  }
  .out p {
    margin: var(--space-2xs) 0;
  }
  .verdict {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-xs);
    font-family: var(--font-family-display);
    font-size: var(--font-size-lg);
  }
  .rule {
    color: var(--color-text-muted);
  }
  .error {
    color: var(--color-text);
    font-weight: var(--font-weight-semibold);
  }
</style>
