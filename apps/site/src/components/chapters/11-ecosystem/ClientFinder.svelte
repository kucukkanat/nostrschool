<script lang="ts">
  import { Treemap } from "@nostrschool/charts";
  import { format, getDictionary, type Locale, plural } from "@nostrschool/i18n";
  import { Badge, Button, Callout, pop, squish } from "@nostrschool/ui";
  import { clientTree, filterClients, fociOf, toggleIn } from "./ecosystem.ts";
  import { type ClientEntry, type Focus, PLATFORMS, type Platform } from "./schema.ts";

  interface Props {
    readonly locale: Locale;
    readonly clients: readonly ClientEntry[];
    readonly source?: string;
  }
  const { locale, clients, source }: Props = $props();
  const t = $derived(getDictionary(locale).chapters.ch11.clients);

  let platforms = $state<ReadonlySet<Platform>>(new Set());
  let focus = $state<Focus | "all">("all");
  const shown = $derived(filterClients(clients, platforms, focus));
  const foci = $derived(fociOf(clients));
  const tree = $derived(clientTree(clients, t.title, (p) => t.platforms[p]));
  const filtered = $derived(platforms.size > 0 || focus !== "all");

  const reset = () => {
    platforms = new Set();
    focus = "all";
  };
</script>

<div class="finder" data-testid="ch11-clients">
  <div class="filters">
    <fieldset>
      <legend>{t.platformsLabel}</legend>
      <div class="chips">
        {#each PLATFORMS as p (p)}
          <button
            type="button"
            class="chip"
            aria-pressed={platforms.has(p)}
            data-testid="ch11-platform-{p}"
            use:squish
            onclick={() => {
              platforms = toggleIn(platforms, p);
            }}
          >
            {t.platforms[p]}
          </button>
        {/each}
      </div>
    </fieldset>
    <fieldset>
      <legend>{t.focusLabel}</legend>
      <div class="chips">
        {#each ["all" as const, ...foci] as f (f)}
          <button
            type="button"
            class="chip"
            aria-pressed={focus === f}
            data-testid="ch11-focus-{f}"
            use:squish
            onclick={() => {
              focus = f;
            }}
          >
            {f === "all" ? t.allFocus : t.focus[f]}
          </button>
        {/each}
      </div>
    </fieldset>
  </div>

  <div class="status">
    <p aria-live="polite" data-testid="ch11-client-count">
      {plural(locale, shown.length, t.results)}
    </p>
    {#if filtered}
      <Button testid="ch11-clients-reset" variant="ghost" size="sm" onclick={reset}
        >{t.reset}</Button
      >
    {/if}
  </div>

  <ul class="cards" data-testid="ch11-client-list">
    {#each shown as c (c.id)}
      <li class="card" data-testid="ch11-client-{c.id}" use:pop={{ spring: "bouncy", from: 0.8 }}>
        <a
          href={c.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={format(t.visit, { name: c.name })}
          data-testid="ch11-client-link-{c.id}"
        >
          {c.name}
        </a>
        <span class="focus">{t.focus[c.focus]}</span>
        <span class="platforms">
          {#each c.platforms as p (p)}
            <Badge
              testid="ch11-client-{c.id}-{p}"
              size="sm"
              tone={platforms.has(p) ? "primary" : "neutral"}
              >{t.platforms[p]}</Badge
            >
          {/each}
        </span>
      </li>
    {/each}
  </ul>

  <Callout testid="ch11-clients-tip" {locale} tone="tip">{t.sameKeys}</Callout>

  <Treemap
    testid="ch11-chart-clients"
    {locale}
    title={t.treemapTitle}
    description={t.treemapDescription}
    root={tree}
    {...source === undefined ? {} : { source }}
  />
</div>

<style>
  .finder {
    display: grid;
    gap: var(--space-md);
  }
  .filters {
    display: grid;
    gap: var(--space-sm);
  }
  fieldset {
    margin: 0;
    padding: 0;
    border: none;
    min-width: 0;
  }
  legend {
    margin-bottom: var(--space-2xs);
    font-family: var(--font-family-display);
    font-weight: var(--font-weight-bold);
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2xs);
  }
  .chip {
    min-height: var(--size-touch-target);
    padding: 0 var(--space-sm);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-pill);
    background: var(--color-surface);
    color: var(--color-text);
    font: inherit;
    font-weight: var(--font-weight-semibold);
    cursor: pointer;
    transition: background-color var(--motion-duration-fast) var(--motion-easing-standard);
  }
  .chip:hover {
    border-color: var(--color-secondary);
  }
  .chip[aria-pressed="true"] {
    background: var(--color-secondary);
    border-color: var(--color-secondary);
    color: var(--color-on-secondary);
  }
  .chip:focus-visible,
  .card a:focus-visible {
    outline: var(--border-width-thick) solid var(--color-focus-ring);
    outline-offset: var(--space-3xs);
  }
  .status {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-xs);
    min-height: var(--size-control-md);
  }
  .status p {
    margin: 0;
    font-weight: var(--font-weight-semibold);
  }
  .cards {
    display: grid;
    /* 1 column at 375px, more as space allows; min-height reserves room while filtering. */
    grid-template-columns: repeat(auto-fill, minmax(min(100%, calc(var(--size-rail) * 0.75)), 1fr));
    gap: var(--space-sm);
    margin: 0;
    padding: 0;
    list-style: none;
    min-height: var(--size-diagram-min-height);
    align-content: start;
  }
  .card {
    display: grid;
    gap: var(--space-2xs);
    align-content: start;
    padding: var(--space-sm) var(--space-md);
    border: var(--border-width-medium) solid var(--color-border);
    border-radius: var(--radius-lg);
    background: var(--color-surface-raised);
    box-shadow: var(--shadow-sm);
    transition:
      translate var(--motion-duration-fast) var(--motion-easing-bounce),
      box-shadow var(--motion-duration-fast) var(--motion-easing-standard);
  }
  .card:hover {
    /* `translate`, not `transform`: the pop action owns the inline transform. */
    translate: 0 calc(-1 * var(--space-3xs));
    box-shadow: var(--shadow-pop-sm);
  }
  .card a {
    color: var(--color-text-primary);
    font-family: var(--font-family-display);
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-bold);
    border-radius: var(--radius-sm);
  }
  .focus {
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
  }
  .platforms {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-3xs);
  }
</style>
