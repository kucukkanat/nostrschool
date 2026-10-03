<script lang="ts">
  import { format, getDictionary, type Locale } from "@nostrschool/i18n";
  import type { NostrEvent } from "@nostrschool/protocol";
  import { Badge, CopyButton, pop, Tooltip } from "@nostrschool/ui";
  import { createdAtText, kindSummary, tagLabel } from "./describe.ts";
  import { type EventField, isIndexedTag } from "./lab.ts";

  interface Props {
    readonly testid: string;
    readonly locale: Locale;
    readonly event: NostrEvent;
    readonly field: EventField;
  }

  const { testid, locale, event, field }: Props = $props();
  const t = $derived(getDictionary(locale).chapters.ch03);
  const kind = $derived(kindSummary(locale, event.kind));
  const isHex = $derived(field === "id" || field === "pubkey" || field === "sig");
</script>

{#key field}
  <section class="detail" data-testid={testid} data-field={field} aria-live="polite" use:pop>
    <h4 class="title"><code>{t.fields[field].label}</code></h4>
    <p class="long">{t.fields[field].long}</p>

    {#if isHex}
      {@const value = String(event[field])}
      <div class="hex">
        <code data-testid="{testid}-hex">{value}</code>
        <CopyButton testid="{testid}-copy" {locale} {value} size="sm" />
      </div>
    {:else if field === "created_at"}
      <p class="extra" data-testid="{testid}-date">{createdAtText(locale, event.created_at)}</p>
    {:else if field === "kind"}
      <div class="extra kind" data-testid="{testid}-kind">
        <strong>{event.kind}: {kind.name}</strong>
        {#if kind.category !== undefined}
          <Badge testid="{testid}-category" tone={kind.category} size="sm"
            >{kind.categoryName}</Badge
          >
        {/if}
        {#if kind.description !== undefined}
          <span>{kind.description}</span>
        {/if}
      </div>
    {:else if field === "tags"}
      <h5 class="sub">{t.tags.heading}</h5>
      {#if event.tags.length === 0}
        <p class="extra" data-testid="{testid}-tags-empty">{t.tags.empty}</p>
      {:else}
        <ol class="tags" data-testid="{testid}-tags">
          {#each event.tags as tag, i (i)}
            <li data-testid="{testid}-tag-{i}">
              <code class="raw">{JSON.stringify(tag)}</code>
              <span class="what">{tagLabel(locale, tag)}</span>
              {#if isIndexedTag(tag)}
                <Tooltip
                  testid="{testid}-tag-{i}-hint"
                  content={format(t.tags.indexedHint, { name: tag[0] })}
                >
                  <Badge testid="{testid}-tag-{i}-indexed" tone="info" size="sm"
                    >{t.tags.indexed}</Badge
                  >
                </Tooltip>
              {/if}
            </li>
          {/each}
        </ol>
      {/if}
    {:else}
      <pre class="content" data-testid="{testid}-content">{event.content}</pre>
    {/if}
  </section>
{/key}

<style>
  .detail {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
    padding: var(--space-md);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-lg);
    background: var(--color-surface);
    box-shadow: var(--shadow-accent);
  }
  .title,
  .sub {
    margin: 0;
    font-family: var(--font-family-display);
    font-size: var(--font-size-lg);
    color: var(--color-text-primary);
  }
  .sub {
    font-size: var(--font-size-md);
  }
  .long,
  .extra {
    margin: 0;
    color: var(--color-text);
  }
  .hex {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-xs);
  }
  .hex code,
  .raw,
  .content {
    padding: var(--space-2xs) var(--space-xs);
    border-radius: var(--radius-sm);
    background: var(--color-code-bg);
    color: var(--color-code-text);
    font-family: var(--font-family-mono);
    font-size: var(--font-size-xs);
    overflow-wrap: anywhere;
  }
  .hex code {
    flex: 1 1 calc(var(--size-rail) * 0.75);
    min-width: 0;
  }
  .content {
    margin: 0;
    white-space: pre-wrap;
  }
  .kind {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-xs);
  }
  .tags {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
    margin: 0;
    padding-inline-start: var(--space-lg);
  }
  .tags li {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-xs);
  }
  .raw {
    max-width: 100%;
  }
  .what {
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
  }
</style>
