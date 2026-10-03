<script lang="ts">
  import { format, getDictionary, type Locale } from "@nostrschool/i18n";
  import { nipUrl } from "@nostrschool/protocol";
  import { Badge, CodeBlock, JsonView, pop } from "@nostrschool/ui";
  import { exampleFor } from "./examples.ts";
  import {
    CATEGORY_RANGES,
    formatRanges,
    type KindEntry,
    nipLabel,
    reqForKind,
  } from "./kinds-logic.ts";

  interface Props {
    readonly locale: Locale;
    /** Parts: `-name -category -unrecommended -range -nip -example -source -req -empty`. */
    readonly testid: string;
    readonly entry: KindEntry | undefined;
    /** Heading level of the kind name, so the panel nests correctly in the chapter vs. the tool page. */
    readonly headingLevel?: 2 | 3 | 4;
  }

  const { locale, testid, entry, headingLevel = 3 }: Props = $props();
  const dict = $derived(getDictionary(locale));
  const t = $derived(dict.chapters.ch06.detail);
  const sub = $derived(`h${headingLevel + 1}`);
  const example = $derived(entry === undefined ? undefined : exampleFor(entry.kind));
  const sourceText = $derived.by(() => {
    if (example === undefined || !example.ok) return "";
    const s = example.value.source;
    return s === "fixture" ? t.sourceFixture : s === "signed" ? t.sourceSigned : t.sourceRumor;
  });
</script>

<section
  class="detail"
  data-testid={testid}
  aria-label={entry === undefined ? t.placeholder : entry.label}
>
  {#if entry === undefined}
    <p class="empty" data-testid="{testid}-empty">{t.placeholder}</p>
  {:else}
    {#key entry.kind}
      <div class="body" use:pop={{ spring: "snappy", from: 0.96 }}>
        <header class="head {entry.category}">
          <div class="tile" aria-hidden="true">
            <span class="num">{entry.kind}</span>
            <span class="sym">{entry.symbol}</span>
          </div>
          <div class="title">
            <!-- tabindex=-1: the parent moves focus here after a pick on small screens. -->
            <svelte:element
              this={`h${headingLevel}`}
              class="name"
              tabindex="-1"
              data-detail-heading
              data-testid="{testid}-name"
            >
              {entry.label}
            </svelte:element>
            <p class="kindno">{format(t.kind, { kind: entry.kind })}</p>
            <Badge testid="{testid}-category" tone={entry.category}>
              {dict.kinds.categories[entry.category]}
            </Badge>
            {#if entry.unrecommended}
              <Badge testid="{testid}-unrecommended" tone="warning">{t.unrecommended}</Badge>
            {/if}
          </div>
        </header>

        <p class="desc">{entry.description}</p>
        {#if entry.unrecommended}
          <p class="warn" data-testid="{testid}-unrecommended-hint">{t.unrecommendedHint}</p>
        {/if}

        <dl class="facts">
          <div>
            <dt>{t.rule}</dt>
            <dd>
              {dict.kinds.categoryDescriptions[entry.category]}
              <span class="range" data-testid="{testid}-range">
                {format(t.range, { range: formatRanges(CATEGORY_RANGES[entry.category]) })}
              </span>
            </dd>
          </div>
          <div>
            <dt>{t.definedIn}</dt>
            <dd>
              <a
                class="nip"
                href={nipUrl(entry.nip)}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="{testid}-nip"
              >
                {format(t.openNip, { nip: nipLabel(entry.nip) })}
                <span aria-hidden="true">↗</span>
              </a>
            </dd>
          </div>
        </dl>

        {#if example?.ok}
          <svelte:element this={sub} class="sub">{t.example}</svelte:element>
          <p class="source" data-testid="{testid}-source" data-source={example.value.source}>
            {sourceText}
          </p>
          <JsonView
            testid="{testid}-example"
            {locale}
            value={example.value.event}
            highlightPaths={["kind"]}
          />
        {/if}

        <svelte:element this={sub} class="sub">{t.filter}</svelte:element>
        <CodeBlock testid="{testid}-req" {locale} lang="json" code={reqForKind(entry.kind)} />
      </div>
    {/key}
  {/if}
</section>

<style>
  .detail {
    min-block-size: var(--size-diagram-min-height);
    padding: var(--space-md);
    border: var(--border-width-medium) solid var(--color-border);
    border-radius: var(--radius-xl);
    background: var(--color-surface-raised);
    box-shadow: var(--shadow-md);
    min-inline-size: 0;
  }
  .empty {
    display: grid;
    place-items: center;
    min-block-size: var(--size-diagram-min-height);
    margin: 0;
    color: var(--color-text-muted);
    text-align: center;
  }
  .body {
    display: grid;
    gap: var(--space-sm);
    min-inline-size: 0;
  }
  .head {
    --kind-color: var(--color-kind-regular);
    display: flex;
    gap: var(--space-md);
    align-items: center;
  }
  .head.replaceable {
    --kind-color: var(--color-kind-replaceable);
  }
  .head.ephemeral {
    --kind-color: var(--color-kind-ephemeral);
  }
  .head.addressable {
    --kind-color: var(--color-kind-addressable);
  }
  .tile {
    display: grid;
    place-items: center;
    flex: none;
    inline-size: var(--size-avatar-lg);
    block-size: var(--size-avatar-lg);
    border-radius: var(--radius-lg);
    background: var(--kind-color);
    color: var(--color-on-kind);
    box-shadow: var(--shadow-pop);
    font-family: var(--font-family-display);
    line-height: var(--font-line-height-tight);
  }
  .num {
    font-family: var(--font-family-mono);
    font-size: var(--font-size-xs);
  }
  .sym {
    font-size: var(--font-size-2xl);
    font-weight: var(--font-weight-black);
  }
  .title {
    display: grid;
    gap: var(--space-3xs);
    justify-items: start;
  }
  .name {
    margin: 0;
    font-family: var(--font-family-display);
    font-size: var(--font-size-xl);
  }
  .name:focus-visible {
    outline: var(--border-width-thick) solid var(--color-focus-ring);
    outline-offset: var(--space-3xs);
    border-radius: var(--radius-sm);
  }
  .kindno {
    margin: 0;
    font-family: var(--font-family-mono);
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
  }
  .desc {
    margin: 0;
  }
  .warn {
    margin: 0;
    padding: var(--space-xs) var(--space-sm);
    border-radius: var(--radius-md);
    background: var(--color-warning-subtle);
    color: var(--color-warning);
    font-size: var(--font-size-sm);
  }
  .facts {
    display: grid;
    gap: var(--space-xs);
    margin: 0;
  }
  dt {
    font-family: var(--font-family-display);
    font-weight: var(--font-weight-semibold);
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
  }
  dd {
    margin: 0;
  }
  .range {
    display: block;
    font-family: var(--font-family-mono);
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
  }
  .nip {
    color: var(--color-text-primary);
    font-weight: var(--font-weight-semibold);
  }
  .nip:focus-visible {
    outline: var(--border-width-thick) solid var(--color-focus-ring);
    outline-offset: var(--space-3xs);
    border-radius: var(--radius-sm);
  }
  .sub {
    margin: var(--space-xs) 0 0;
    font-family: var(--font-family-display);
    font-size: var(--font-size-md);
  }
  .source {
    margin: 0;
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
  }
</style>
