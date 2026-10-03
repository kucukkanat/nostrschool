<script lang="ts">
  import { BarChart, DonutChart, StatTile } from "@nostrschool/charts";
  import { format, formatDate, formatNumber, getDictionary, type Locale } from "@nostrschool/i18n";
  import { Callout, duration, emit, Tabs } from "@nostrschool/ui";
  import ClientFinder from "./ClientFinder.svelte";
  import DataAsOf from "./DataAsOf.svelte";
  import { ECOSYSTEM } from "./data.ts";
  import {
    countAt,
    growthAt,
    isView,
    justCompleted,
    markVisited,
    relabel,
    topNamed,
    VIEWS,
    type View,
  } from "./ecosystem.ts";
  import GrowthRewind from "./GrowthRewind.svelte";
  import NipAdoption from "./NipAdoption.svelte";
  import type { Ecosystem } from "./schema.ts";

  interface Props {
    readonly locale: Locale;
    /** Defaults to the committed snapshot; tests pass their own. */
    readonly data?: Ecosystem;
  }
  const { locale, data }: Props = $props();
  const dict = $derived(getDictionary(locale).chapters.ch11);
  const t = $derived(dict.explorer);
  const eco = $derived(data ?? (ECOSYSTEM.ok ? ECOSYSTEM.value : undefined));

  let view = $state<View>("relays");
  let visited = $state<ReadonlySet<View>>(new Set(["relays"]));
  let narration = $state("");
  // Count-up progress 0→1. Starts at 1 so server HTML and no-JS readers get the real numbers.
  let progress = $state(1);

  $effect(() => {
    const ms = duration("slower");
    if (ms === 0) return;
    let frame = 0;
    const start = performance.now();
    progress = 0;
    const tick = (now: number) => {
      progress = Math.min(1, (now - start) / ms);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  });

  const source = (e: Ecosystem, id: string): string => {
    const s = e.sources.find((x) => x.id === id);
    const date = formatDate(locale, new Date(s?.retrievedAt ?? e.capturedAt), {
      dateStyle: "medium",
      timeZone: "UTC",
    });
    return format(dict.relays.source, { date, source: s?.name ?? id });
  };

  const describe = (e: Ecosystem, v: View): string => {
    const n = (x: number) => formatNumber(locale, x);
    switch (v) {
      case "relays":
        return format(t.narration.relays, {
          online: n(e.relays.online),
          software: topNamed(e.relays.software)?.label ?? dict.relays.unknown,
        });
      case "nips":
        return format(t.narration.nips, {
          total: n(e.nips.total),
          top: e.relays.nipSupport[0]?.label ?? "",
        });
      case "growth":
        return format(t.narration.growth, {
          from: n(growthAt(e.nips.growth, 0)?.count ?? 0),
          to: n(e.nips.growth.at(-1)?.count ?? 0),
        });
      case "clients":
        return format(t.narration.clients, { count: n(e.clients.items.length) });
    }
  };

  const onchange = (id: string) => {
    if (!isView(id) || eco === undefined) return;
    const before = visited;
    visited = markVisited(visited, id);
    narration = describe(eco, id);
    if (justCompleted(before, visited)) {
      narration = `${narration} ${t.tourDone}`;
      emit("celebrate", { reason: "ch11-tour" });
    }
  };
</script>

{#if eco === undefined}
  <Callout testid="ch11-explorer-error" {locale} tone="danger">
    {format(t.loadError, { message: ECOSYSTEM.ok ? "" : ECOSYSTEM.error.message })}
  </Callout>
{:else}
  {@const softwareLabels = { other: dict.relays.other, unknown: dict.relays.unknown }}
  <section class="explorer" data-testid="ch11-explorer" aria-labelledby="ch11-explorer-title">
    <header class="head">
      <h3 id="ch11-explorer-title">{t.title}</h3>
      <p>{t.intro}</p>
      <DataAsOf {locale} capturedAt={eco.capturedAt} sources={eco.sources} />
    </header>

    <div class="tiles">
      <StatTile
        testid="ch11-stat-relays"
        {locale}
        label={dict.stats.relays}
        value={countAt(eco.relays.online, progress)}
        hint={format(dict.stats.relaysHint, { hours: eco.relays.windowHours })}
      />
      <StatTile
        testid="ch11-stat-nips"
        {locale}
        label={dict.stats.nips}
        value={countAt(eco.nips.total, progress)}
        hint={format(dict.stats.nipsHint, { unrecommended: eco.nips.unrecommended })}
      />
      <StatTile
        testid="ch11-stat-kinds"
        {locale}
        label={dict.stats.kinds}
        value={countAt(eco.nips.kinds, progress)}
        hint={dict.stats.kindsHint}
      />
      <StatTile
        testid="ch11-stat-clients"
        {locale}
        label={dict.stats.clients}
        value={countAt(eco.clients.items.length, progress)}
        hint={dict.stats.clientsHint}
      />
    </div>

    <div class="tour" data-testid="ch11-tour" data-complete={visited.size === VIEWS.length}>
      <span class="dots" aria-hidden="true">
        {#each VIEWS as v (v)}
          <span class="dot" class:seen={visited.has(v)}></span>
        {/each}
      </span>
      <span data-testid="ch11-tour-text">
        {visited.size === VIEWS.length
          ? t.tourDone
          : format(t.tour, { done: visited.size, total: VIEWS.length })}
      </span>
    </div>

    <Tabs
      testid="ch11-tabs"
      label={t.tabsLabel}
      tabs={VIEWS.map((id) => ({ id, label: t.tabs[id] }))}
      bind:selected={view}
      {onchange}
    >
      {#snippet panel(
        id: string,
      )}
        {#if id === "relays"}
          <div class="relays">
            <BarChart
              testid="ch11-chart-software"
              {locale}
              title={dict.relays.softwareTitle}
              description={dict.relays.softwareDescription}
              data={relabel(eco.relays.software, softwareLabels)}
              orientation="horizontal"
              xLabel={dict.relays.software}
              yLabel={dict.relays.relays}
              source={source(eco, eco.relays.sourceId)}
            />
            <DonutChart
              testid="ch11-chart-networks"
              {locale}
              title={dict.relays.networksTitle}
              description={dict.relays.networksDescription}
              data={relabel(eco.relays.networks, dict.relays.networks)}
              centerLabel={formatNumber(locale, eco.relays.online)}
              source={source(eco, eco.relays.sourceId)}
            />
            <p class="fact" data-testid="ch11-paid-fact">
              {format(dict.relays.paidFact, {
                paid: formatNumber(locale, eco.relays.paid),
                auth: formatNumber(locale, eco.relays.authRequired),
              })}
            </p>
          </div>
        {:else if id === "nips"}
          <NipAdoption
            {locale}
            support={eco.relays.nipSupport}
            total={eco.relays.withNipList}
            source={source(eco, eco.relays.sourceId)}
          />
        {:else if id === "growth"}
          <GrowthRewind {locale} growth={eco.nips.growth} source={source(eco, eco.nips.sourceId)} />
        {:else}
          <ClientFinder
            {locale}
            clients={eco.clients.items}
            source={source(eco, eco.clients.sourceId)}
          />
        {/if}
      {/snippet}
    </Tabs>

    <!-- visually-hidden is the site-wide utility in styles/global.css. -->
    <p class="visually-hidden" aria-live="polite" data-testid="ch11-narration">{narration}</p>
  </section>
{/if}

<style>
  .explorer {
    display: grid;
    gap: var(--space-lg);
    padding: var(--space-lg);
    border: var(--border-width-thick) solid var(--color-primary);
    border-radius: var(--radius-xl);
    background: var(--color-surface);
    box-shadow: var(--shadow-pop);
    min-height: var(--size-diagram-min-height);
  }
  .head {
    display: grid;
    gap: var(--space-xs);
  }
  h3,
  .head p {
    margin: 0;
  }
  h3 {
    font-family: var(--font-family-display);
    font-size: var(--font-size-2xl);
    color: var(--color-text-primary);
  }
  .tiles {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--space-sm);
  }
  .tour {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
  }
  .tour[data-complete="true"] {
    color: var(--color-text);
    font-weight: var(--font-weight-semibold);
  }
  .dots {
    display: inline-flex;
    gap: var(--space-3xs);
  }
  .dot {
    width: var(--space-xs);
    height: var(--space-xs);
    border-radius: var(--radius-round);
    background: var(--color-border-strong);
    transition:
      background-color var(--motion-duration-normal) var(--motion-easing-standard),
      transform var(--motion-duration-normal) var(--motion-easing-bounce);
  }
  .dot.seen {
    background: var(--color-success);
    transform: scale(1.3);
  }
  .relays {
    display: grid;
    gap: var(--space-lg);
  }
  .fact {
    margin: 0;
    padding: var(--space-sm) var(--space-md);
    border-left: var(--border-width-heavy) solid var(--color-accent);
    border-radius: var(--radius-sm);
    background: var(--color-accent-subtle);
  }
  /* Phones get a tighter frame; md breakpoint = tokens.breakpoint.md (768px). */
  @media (max-width: 767px) {
    .explorer {
      padding: var(--space-md);
    }
  }
  /* lg breakpoint = tokens.breakpoint.lg (1024px): four tiles in a row. */
  @media (min-width: 1024px) {
    .tiles {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
  }
</style>
