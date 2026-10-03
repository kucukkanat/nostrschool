<script lang="ts">
  import { ForceGraph } from "@nostrschool/diagrams";
  import { eventsByKind, getPersona, type PersonaId } from "@nostrschool/fixtures";
  import { format, getDictionary, type Locale } from "@nostrschool/i18n";
  import { Badge, Button, emit, JsonView, pop } from "@nostrschool/ui";
  import {
    FOLLOWS,
    isMutual,
    isPersonaId,
    type Lens,
    lensIds,
    listNames,
    networkStats,
    toGraph,
  } from "./social.ts";

  const { locale }: { readonly locale: Locale } = $props();
  const t = $derived(getDictionary(locale).chapters.ch07.graph);

  const graph = toGraph(FOLLOWS);
  const stats = networkStats(FOLLOWS);
  const name = (id: PersonaId): string => getPersona(id).displayName;

  let selected = $state<string | null>(null);
  let hovered = $state<PersonaId | null>(null);
  let lens = $state<Lens>("follows");
  let celebrated = false;

  const selectedId = $derived(selected !== null && isPersonaId(selected) ? selected : null);
  // Hover only drives emphasis while nothing is selected: a selection already lights all neighbors.
  const highlight = $derived(
    hovered !== null && selectedId === null ? [hovered, ...lensIds(FOLLOWS, hovered, lens)] : [],
  );
  const hoverText = $derived(
    hovered === null
      ? ""
      : format(lens === "follows" ? t.hoverFollows : t.hoverFollowers, {
          name: name(hovered),
          list: listNames(locale, lensIds(FOLLOWS, hovered, lens).map(name), t.none),
        }),
  );
  const kind3 = $derived(
    selectedId === null
      ? undefined
      : eventsByKind(3).find((e) => e.pubkey === getPersona(selectedId).pubkey),
  );

  const onselect = (id: string | null): void => {
    if (id !== null && !celebrated) {
      celebrated = true;
      emit("celebrate", { reason: "ch07-follow-list" });
    }
  };

  // Event delegation: ForceGraph renders each node as `[data-node]`, so hover/focus on the
  // wrapper tells us which person is under the pointer without changing the shared component.
  const nodeFrom = (e: Event): PersonaId | null => {
    const el = e.target instanceof Element ? e.target.closest("[data-node]") : null;
    const id = el?.getAttribute("data-node") ?? null;
    return id !== null && isPersonaId(id) ? id : null;
  };
  const enter = (e: Event): void => {
    hovered = nodeFrom(e);
  };
  const leave = (e: Event): void => {
    const next = e instanceof FocusEvent || e instanceof PointerEvent ? e.relatedTarget : null;
    if (!(next instanceof Element && next.closest("[data-node]"))) hovered = null;
  };
</script>

<section class="explorer" data-testid="ch07-graph" aria-label={t.title}>
  <fieldset class="lens" data-testid="ch07-lens">
    <legend class="lens-label">{t.lensLabel}</legend>
    {#each [
      ["follows", t.lensFollows],
      ["followers", t.lensFollowers],
    ] as const as [id, label] (id)}
      <button
        type="button"
        class="lens-option"
        aria-pressed={lens === id}
        data-testid="ch07-lens-{id}"
        onclick={() => (lens = id)}
      >
        {label}
      </button>
    {/each}
  </fieldset>

  <div class="layout">
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="stage"
      data-testid="ch07-graph-stage"
      data-hovered={hovered ?? ""}
      onpointerover={enter}
      onpointerout={leave}
      onfocusin={enter}
      onfocusout={leave}
    >
      <ForceGraph
        testid="ch07-force"
        {locale}
        title={t.title}
        description={t.description}
        nodes={graph.nodes}
        links={graph.links}
        bind:selected
        {highlight}
        width={560}
        height={440}
        {onselect}
      />
      <p class="hover-note" data-testid="ch07-hover-note" aria-live="polite">{hoverText}</p>
    </div>

    <aside class="panel" data-testid="ch07-panel" aria-live="polite">
      {#if selectedId === null}
        <div class="card" use:pop>
          <h4>{t.statsTitle}</h4>
          <p data-testid="ch07-stats">
            {format(t.stats, {
              people: stats.people,
              links: stats.links,
              mutual: stats.mutualPairs,
            })}
          </p>
          <p data-testid="ch07-popular">
            {format(t.popular, {
              name: name(stats.mostFollowed.id),
              count: stats.mostFollowed.count,
            })}
          </p>
          <p class="hint">{t.pickHint}</p>
        </div>
      {:else}
        {#key selectedId}
          <div class="card" data-testid="ch07-person" data-person={selectedId} use:pop>
            <div class="who">
              <img src={getPersona(selectedId).avatar} alt="" class="avatar">
              <h4>{name(selectedId)}</h4>
            </div>
            {#each [
              ["follows", t.follows],
              ["followers", t.followers],
            ] as const as [kind, label] (kind)}
              {@const ids = lensIds(FOLLOWS, selectedId, kind)}
              <h5>{format(label, { count: ids.length })}</h5>
              <ul class="chips" data-testid="ch07-person-{kind}">
                {#each ids as id (id)}
                  <li class="chip">
                    <img src={getPersona(id).avatar} alt="" class="mini">
                    {name(id)}
                    {#if isMutual(FOLLOWS, selectedId, id)}
                      <Badge tone="primary" size="sm">{t.mutualBadge}</Badge>
                    {/if}
                  </li>
                {:else}
                  <li class="none">{t.none}</li>
                {/each}
              </ul>
            {/each}
            <Button testid="ch07-clear" variant="ghost" size="sm" onclick={() => (selected = null)}
              >{t.clear}</Button
            >
          </div>
        {/key}
      {/if}
    </aside>
  </div>

  {#if kind3 !== undefined && selectedId !== null}
    <div class="raw" data-testid="ch07-raw">
      <h4>{format(t.rawTitle, { name: name(selectedId) })}</h4>
      <JsonView testid="ch07-raw-json" {locale} value={kind3} collapsedDepth={3} />
    </div>
  {/if}
</section>

<style>
  .explorer {
    display: grid;
    gap: var(--space-md);
    min-height: var(--size-diagram-min-height);
  }
  .lens {
    margin: 0;
    padding: 0;
    border: 0;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-xs);
  }
  .lens-label {
    float: left;
    padding: 0;
    margin-inline-end: var(--space-xs);
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    font-weight: var(--font-weight-semibold);
  }
  .lens-option {
    min-height: var(--size-touch-target);
    padding: var(--space-2xs) var(--space-md);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-pill);
    background: var(--color-surface);
    color: var(--color-text);
    font: inherit;
    font-weight: var(--font-weight-bold);
    cursor: pointer;
    transition:
      background var(--motion-duration-fast) var(--motion-easing-standard),
      transform var(--motion-duration-fast) var(--motion-easing-bounce);
  }
  .lens-option:hover {
    transform: translateY(calc(-1 * var(--space-3xs)));
  }
  .lens-option[aria-pressed="true"] {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: var(--color-on-primary);
  }
  .lens-option:focus-visible {
    outline: var(--border-width-thick) solid var(--color-focus-ring);
    outline-offset: var(--space-3xs);
  }
  .layout {
    display: grid;
    gap: var(--space-md);
  }
  /* 768px = tokens.breakpoint.md */
  @media (min-width: 768px) {
    .layout {
      grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
      align-items: start;
    }
  }
  .stage {
    min-width: 0;
  }
  .hover-note {
    min-height: calc(var(--font-size-sm) * 2);
    margin: var(--space-xs) 0 0;
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
  }
  .card {
    display: grid;
    gap: var(--space-xs);
    padding: var(--space-md);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-lg);
    background: var(--color-surface-raised);
    box-shadow: var(--shadow-pop-sm);
  }
  .card h4,
  .card h5,
  .card p {
    margin: 0;
  }
  .card h4 {
    font-family: var(--font-family-display);
    font-size: var(--font-size-lg);
  }
  .card h5 {
    margin-top: var(--space-xs);
    font-size: var(--font-size-sm);
    text-transform: uppercase;
    letter-spacing: var(--font-letter-spacing-caps);
    color: var(--color-text-muted);
  }
  .hint {
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
  }
  .who {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
  }
  .avatar {
    width: var(--size-avatar-md);
    height: var(--size-avatar-md);
    border-radius: var(--radius-round);
  }
  .mini {
    width: var(--size-icon-md);
    height: var(--size-icon-md);
    border-radius: var(--radius-round);
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2xs);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2xs);
    padding: var(--space-3xs) var(--space-xs);
    border-radius: var(--radius-pill);
    background: var(--color-primary-subtle);
    color: var(--color-text);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
  }
  .none {
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
  }
  .raw h4 {
    margin: 0 0 var(--space-xs);
    font-family: var(--font-family-display);
  }
</style>
