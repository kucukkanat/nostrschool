<script lang="ts">
  import { format, formatDate, getDictionary, type Locale } from "@nostrschool/i18n";
  import { Badge } from "@nostrschool/ui";
  import type { EcosystemSource } from "./schema.ts";

  interface Props {
    readonly locale: Locale;
    readonly capturedAt: string;
    readonly sources: readonly EcosystemSource[];
    readonly testid?: string;
  }
  const { locale, capturedAt, sources, testid = "ch11-data-as-of" }: Props = $props();
  const t = $derived(getDictionary(locale).chapters.ch11.dataAsOf);
  const date = $derived(
    formatDate(locale, new Date(capturedAt), { dateStyle: "long", timeZone: "UTC" }),
  );
  const note = (d: EcosystemSource["detail"]): string =>
    d.kind === "nip66"
      ? format(t.notes.nip66, { relays: d.monitorRelays.join(", "), hours: d.windowHours })
      : d.kind === "github-head"
        ? t.notes.githubHead
        : t.notes.curated;
  const partialRelays = (d: EcosystemSource["detail"]): string =>
    d.kind === "nip66" ? d.partial.map((p) => p.relay).join(", ") : "";
  const tone = (s: EcosystemSource["status"]) =>
    s === "ok" ? "success" : s === "stale" ? "warning" : "info";
</script>

<div class="as-of" data-testid={testid}>
  <Badge testid="{testid}-badge" tone="primary">
    <time datetime={capturedAt}>{format(t.label, { date })}</time>
  </Badge>
  <details class="sources">
    <summary data-testid="{testid}-toggle">{t.sources}</summary>
    <ul aria-label={t.sourcesLabel} data-testid="{testid}-sources">
      {#each sources as s (s.id)}
        <li data-testid="{testid}-source-{s.id}">
          <a
            href={s.url}
            rel="noopener noreferrer"
            target="_blank"
            data-testid="{testid}-link-{s.id}"
            >{s.name}</a
          >
          <Badge testid="{testid}-status-{s.id}" tone={tone(s.status)} size="sm">
            {t.status[s.status]}
          </Badge>
          <span class="note" data-testid="{testid}-note-{s.id}">{note(s.detail)}</span>
          {#if partialRelays(s.detail) !== ""}
            <span class="note warn" data-testid="{testid}-partial-{s.id}">
              {format(t.partial, { relays: partialRelays(s.detail) })}
            </span>
          {/if}
          {#if s.status === "stale"}
            <span class="note warn" data-testid="{testid}-stale-{s.id}">{t.stale}</span>
          {/if}
        </li>
      {/each}
    </ul>
  </details>
</div>

<style>
  .as-of {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-xs);
    font-size: var(--font-size-sm);
  }
  summary {
    cursor: pointer;
    color: var(--color-text-primary);
    font-weight: var(--font-weight-semibold);
    border-radius: var(--radius-sm);
  }
  summary:focus-visible {
    outline: var(--border-width-medium) solid var(--color-focus-ring);
    outline-offset: var(--space-3xs);
  }
  ul {
    display: grid;
    gap: var(--space-xs);
    margin: var(--space-xs) 0 0;
    padding: 0;
    list-style: none;
  }
  li {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2xs);
    align-items: baseline;
  }
  a {
    color: var(--color-text-primary);
    font-weight: var(--font-weight-semibold);
  }
  .note {
    flex-basis: 100%;
    color: var(--color-text-muted);
    overflow-wrap: anywhere;
  }
  .warn {
    color: var(--color-text-primary);
  }
</style>
