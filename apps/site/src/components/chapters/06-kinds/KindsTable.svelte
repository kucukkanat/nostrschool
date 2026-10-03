<script lang="ts">
  import { format, getDictionary, type Locale } from "@nostrschool/i18n";
  import { KIND_CATEGORIES, type KindCategory } from "@nostrschool/protocol";
  import { duration, emit, prefersReducedMotion } from "@nostrschool/ui";
  import { tick } from "svelte";
  import { flip } from "svelte/animate";
  import { backOut } from "svelte/easing";
  import { fade, scale } from "svelte/transition";
  import KindDetail from "./KindDetail.svelte";
  import KindFilters from "./KindFilters.svelte";
  import {
    countByCategory,
    detailStacksBelow,
    exploredCategories,
    filterKinds,
    gridColumns,
    gridMove,
    localizeKinds,
    revealDetail,
  } from "./kinds-logic.ts";

  interface Props {
    readonly locale: Locale;
    /** Root id; parts: `-filters-*`, `-group-<category>`, `-tile-<kind>`, `-detail-*`, `-explored`, `-narration`. */
    readonly testid?: string;
    /** Kind selected on load (null = nothing selected). */
    readonly initialKind?: number | null;
  }

  const { locale, testid = "ch06-table", initialKind = 1 }: Props = $props();
  const dict = $derived(getDictionary(locale));
  const t = $derived(dict.chapters.ch06.table);
  const entries = $derived(localizeKinds(dict.kinds.names));

  let categories = $state<ReadonlySet<KindCategory>>(new Set(KIND_CATEGORIES));
  let query = $state("");
  // svelte-ignore state_referenced_locally
  let selected = $state<number | undefined>(initialKind ?? undefined);
  // svelte-ignore state_referenced_locally
  let visited = $state<readonly number[]>(initialKind === null ? [] : [initialKind]);
  let narration = $state("");
  let focusIndex = $state(0);
  let celebrated = false;
  let gridEl = $state<HTMLElement>();
  let sideEl = $state<HTMLElement>();

  const visible = $derived(filterKinds(entries, { categories, query }));
  const groups = $derived(
    KIND_CATEGORIES.map((c) => ({
      category: c,
      items: visible.filter((e) => e.category === c),
    })).filter((g) => g.items.length > 0),
  );
  // Flat order = visual order, so roving focus walks tiles the way they appear.
  const flat = $derived(groups.flatMap((g) => g.items));
  const selectedEntry = $derived(entries.find((e) => e.kind === selected));
  const explored = $derived(exploredCategories(visited));
  const counts = $derived(countByCategory(entries));
  const tabStop = $derived(Math.min(focusIndex, Math.max(0, flat.length - 1)));

  const select = (kind: number) => {
    selected = kind;
    visited = visited.includes(kind) ? visited : [...visited, kind];
    const entry = entries.find((e) => e.kind === kind);
    if (entry === undefined) return;
    narration = format(dict.chapters.ch06.detail.selected, {
      kind,
      name: entry.label,
      category: dict.kinds.categories[entry.category],
    });
    if (!celebrated && exploredCategories(visited).size === KIND_CATEGORIES.length) {
      celebrated = true;
      narration = `${narration} ${t.allExplored}`;
      emit("celebrate", { reason: "ch06-all-categories" });
    }
  };

  // Click covers Enter/Space too (native button activation).
  const pick = async (kind: number, index: number) => {
    focusIndex = index;
    select(kind);
    if (!detailStacksBelow()) return;
    await tick();
    revealDetail(sideEl, prefersReducedMotion());
  };

  const backToTile = () => {
    const tile = gridEl?.querySelector<HTMLElement>(`[data-index="${tabStop}"]`);
    tile?.scrollIntoView({ block: "center", behavior: prefersReducedMotion() ? "auto" : "smooth" });
    tile?.focus({ preventScroll: true });
  };

  const onkeydown = (event: KeyboardEvent, index: number) => {
    const first = gridEl?.querySelector<HTMLElement>(".tiles");
    const columns =
      first === null || first === undefined
        ? 1
        : gridColumns(getComputedStyle(first).gridTemplateColumns);
    const next = gridMove(flat.length, columns, index, event.key);
    if (next === undefined) return;
    event.preventDefault();
    focusIndex = next;
    gridEl?.querySelector<HTMLElement>(`[data-index="${next}"]`)?.focus();
  };
</script>

<div class="kinds" data-testid={testid}>
  <header class="intro">
    <h3 class="title">{t.title}</h3>
    <p class="lede">{t.description}</p>
  </header>

  <KindFilters
    {locale}
    testid="{testid}-filters"
    bind:categories
    bind:query
    {counts}
    shown={visible.length}
  />

  <div class="explored" data-testid="{testid}-explored" data-count={explored.size}>
    <span>{format(t.explored, { count: explored.size, total: KIND_CATEGORIES.length })}</span>
    <span class="dots" aria-hidden="true">
      {#each KIND_CATEGORIES as c (c)}
        <span class="dot {c}" class:on={explored.has(c)}></span>
      {/each}
    </span>
  </div>

  <div class="layout">
    <div class="grid" bind:this={gridEl}>
      {#if flat.length === 0}
        <p class="empty" data-testid="{testid}-empty" in:fade={{ duration: duration("fast") }}>
          {t.empty}
        </p>
      {/if}
      {#each groups as group (group.category)}
        <section
          class="group {group.category}"
          aria-labelledby="{testid}-h-{group.category}"
          data-testid="{testid}-group-{group.category}"
          in:fade={{ duration: duration("normal") }}
        >
          <h4 class="group-title" id="{testid}-h-{group.category}">
            <span class="swatch" aria-hidden="true"></span>
            {dict.kinds.categories[group.category]}
            <span class="hint">{dict.kinds.categoryDescriptions[group.category]}</span>
          </h4>
          <ul class="tiles" aria-label={`${t.gridLabel}: ${dict.kinds.categories[group.category]}`}>
            {#each group.items as entry (entry.kind)}
              {@const index = flat.indexOf(entry)}
              <li
                animate:flip={{ duration: duration("normal") }}
                in:scale={{ duration: duration("normal"), start: 0.6, easing: backOut }}
                out:scale={{ duration: duration("fast"), start: 0.6 }}
              >
                <button
                  type="button"
                  class="tile"
                  class:selected={selected === entry.kind}
                  aria-pressed={selected === entry.kind}
                  aria-label={format(t.tileLabel, {
                    kind: entry.kind,
                    name: entry.label,
                    category: dict.kinds.categories[entry.category],
                  })}
                  tabindex={index === tabStop ? 0 : -1}
                  data-index={index}
                  data-testid="{testid}-tile-{entry.kind}"
                  onclick={() => pick(entry.kind, index)}
                  onkeydown={(e) => onkeydown(e, index)}
                >
                  <span class="num">{entry.kind}</span>
                  <span class="sym">{entry.symbol}</span>
                  <span class="lbl">{entry.label}</span>
                </button>
              </li>
            {/each}
          </ul>
        </section>
      {/each}
    </div>

    <div class="side" bind:this={sideEl}>
      <KindDetail {locale} testid="{testid}-detail" entry={selectedEntry} headingLevel={4} />
      {#if selectedEntry !== undefined}
        <button type="button" class="back" onclick={backToTile} data-testid="{testid}-back">
          <span aria-hidden="true">↑</span>
          {dict.chapters.ch06.detail.close}
        </button>
      {/if}
    </div>
  </div>

  <p class="visually-hidden" aria-live="polite" data-testid="{testid}-narration">{narration}</p>
</div>

<style>
  .kinds {
    display: grid;
    gap: var(--space-md);
    margin-block: var(--space-lg);
    padding: var(--space-md);
    border-radius: var(--radius-lg);
    background: var(--color-surface-sunken);
    min-block-size: var(--size-diagram-min-height);
  }
  .intro {
    display: grid;
    gap: var(--space-2xs);
  }
  .title {
    margin: 0;
    font-family: var(--font-family-display);
    font-size: var(--font-size-2xl);
    color: var(--color-text-primary);
  }
  .lede {
    margin: 0;
    color: var(--color-text-muted);
  }
  .explored {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-xs);
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
  }
  .dots {
    display: inline-flex;
    gap: var(--space-2xs);
  }
  .dot {
    inline-size: var(--space-sm);
    block-size: var(--space-sm);
    border-radius: var(--radius-round);
    border: var(--border-width-medium) solid var(--dot-color);
    transition:
      background-color var(--motion-duration-normal) var(--motion-easing-bounce),
      transform var(--motion-duration-normal) var(--motion-easing-bounce);
  }
  .dot.on {
    background: var(--dot-color);
    transform: scale(1.25);
  }
  .dot.regular,
  .group.regular {
    --dot-color: var(--color-kind-regular);
    --kind-color: var(--color-kind-regular);
  }
  .dot.replaceable,
  .group.replaceable {
    --dot-color: var(--color-kind-replaceable);
    --kind-color: var(--color-kind-replaceable);
  }
  .dot.ephemeral,
  .group.ephemeral {
    --dot-color: var(--color-kind-ephemeral);
    --kind-color: var(--color-kind-ephemeral);
  }
  .dot.addressable,
  .group.addressable {
    --dot-color: var(--color-kind-addressable);
    --kind-color: var(--color-kind-addressable);
  }
  .layout {
    display: grid;
    gap: var(--space-md);
    align-items: start;
  }
  /* tokens.breakpoint.lg = 1024px */
  @media (min-width: 1024px) {
    .layout {
      grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
    }
    .side {
      position: sticky;
      inset-block-start: var(--space-lg);
    }
    /* Side by side, the tiles are already in view. */
    .back {
      display: none;
    }
  }
  .side {
    display: grid;
    gap: var(--space-xs);
    scroll-margin-block-start: var(--space-md);
  }
  .back {
    justify-self: start;
    min-block-size: var(--size-touch-target);
    padding: var(--space-2xs) var(--space-xs);
    border: none;
    background: none;
    color: var(--color-text-primary);
    font: inherit;
    font-weight: var(--font-weight-semibold);
    text-decoration: underline;
    cursor: pointer;
  }
  .back:focus-visible {
    outline: var(--border-width-thick) solid var(--color-focus-ring);
    outline-offset: var(--space-3xs);
  }
  .grid {
    display: grid;
    gap: var(--space-md);
    min-inline-size: 0;
  }
  .empty {
    margin: 0;
    padding: var(--space-lg);
    text-align: center;
    color: var(--color-text-muted);
  }
  .group {
    display: grid;
    gap: var(--space-xs);
  }
  .group-title {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: var(--space-xs);
    margin: 0;
    font-family: var(--font-family-display);
    font-size: var(--font-size-md);
  }
  .swatch {
    inline-size: var(--space-sm);
    block-size: var(--space-sm);
    border-radius: var(--radius-sm);
    background: var(--kind-color);
    align-self: center;
  }
  .hint {
    font-family: var(--font-family-body);
    font-weight: var(--font-weight-regular);
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
  }
  .tiles {
    display: grid;
    grid-template-columns: repeat(
        auto-fill,
        minmax(calc(var(--size-avatar-lg) + var(--space-md)), 1fr)
      );
    gap: var(--space-xs);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .tile {
    display: grid;
    grid-template-rows: auto 1fr auto;
    justify-items: start;
    inline-size: 100%;
    aspect-ratio: 1;
    padding: var(--space-2xs) var(--space-xs);
    border: var(--border-width-medium) solid var(--kind-color);
    border-radius: var(--radius-md);
    background: var(--color-surface);
    color: var(--color-text);
    font: inherit;
    text-align: start;
    cursor: pointer;
    /* No overflow clipping: aspect-ratio then acts as a minimum, so a multi-line name grows the
       tile (and its grid row) instead of being cut off. */
    transition:
      transform var(--motion-duration-fast) var(--motion-easing-bounce),
      box-shadow var(--motion-duration-fast) var(--motion-easing-standard),
      background-color var(--motion-duration-fast) var(--motion-easing-standard);
  }
  .tile:hover {
    transform: translateY(calc(-1 * var(--space-3xs))) rotate(-1deg);
    box-shadow: var(--shadow-pop-sm);
  }
  .tile:active {
    transform: scale(0.94);
  }
  .tile:focus-visible {
    outline: var(--border-width-thick) solid var(--color-focus-ring);
    outline-offset: var(--space-3xs);
  }
  .tile.selected {
    border-color: var(--color-border-strong);
    background: var(--kind-color);
    color: var(--color-on-kind);
    box-shadow: var(--shadow-accent);
    transform: translateY(calc(-1 * var(--space-3xs)));
  }
  .num {
    font-family: var(--font-family-mono);
    font-size: var(--font-size-2xs);
  }
  .sym {
    align-self: center;
    font-family: var(--font-family-display);
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-black);
    line-height: var(--font-line-height-tight);
  }
  /* Never clamped: on a 320px phone a tile is ~62px wide and names like "Encrypted direct
     message" need four lines. The tile grows instead (see .tile). */
  .lbl {
    max-inline-size: 100%;
    font-size: var(--font-size-2xs);
    line-height: var(--font-line-height-tight);
    overflow-wrap: break-word;
    hyphens: auto;
  }
  /* tokens.breakpoint.sm = 480px: a tighter frame so phones (320-414px) keep room for content. */
  @media (max-width: 480px) {
    .empty {
      padding: var(--space-md);
    }
  }
</style>
