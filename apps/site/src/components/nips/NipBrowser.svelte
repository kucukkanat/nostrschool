<script lang="ts">
  /**
   * The /nips browser: one search box (instant keyword results, plus on-device search by meaning
   * once the visitor types), facet filters, sort and a cards/list switch. Everything lives in the
   * query string so any view can be shared. Server-rendered with the default state, which doubles
   * as the no-JS list; controls stay disabled until hydration so they never look broken.
   */
  import { format, formatNumber, getDictionary, type Locale, plural } from "@nostrschool/i18n";
  import {
    createNipSearch,
    type NipSearch,
    type NipSearchHit,
    type NipSearchResult,
    type SemanticState,
  } from "@nostrschool/nip-search";
  import {
    facetCounts,
    NIP_INDEX,
    NIP_SPEC_VARIANTS,
    NIP_STATUSES,
    type NipId,
    type NipListing,
  } from "@nostrschool/nips";
  import { KIND_CATEGORIES } from "@nostrschool/protocol";
  import { mediaUp } from "@nostrschool/tokens";
  import { onMount } from "svelte";
  import { assetHref, href } from "~/lib/href";
  import {
    activeFilterCount,
    BROWSE_SORTS,
    BROWSE_VIEWS,
    type BrowseSort,
    type BrowseState,
    type BrowseView,
    buildListings,
    type CourseMap,
    clearFilters,
    courseNipIds,
    DEFAULT_BROWSE_STATE,
    effectiveSort,
    kindCategoriesOf,
    orderNips,
    parseBrowseState,
    queryWords,
    type SpecSummary,
    semanticMessage,
    serializeBrowseState,
    toggleValue,
    withKind,
  } from "./browse.ts";
  import NipResultCard from "./NipResultCard.svelte";

  interface Props {
    readonly locale: Locale;
    /** Variant + todo per NIP id (the only spec facts the list needs). */
    readonly specs: { readonly [id: NipId]: SpecSummary };
    /** NIP id → chapters teaching it. */
    readonly course: CourseMap;
    /** Load the on-device model for search by meaning (false: keyword search only). */
    readonly semantic?: boolean;
    /**
     * Builds the search engine on mount; `locale` adds that locale's titles, summaries and
     * keyword hints to the index. Default: `createNipSearch` with the self-hosted
     * model under `models/`. Tests pass a real engine built for a fixed semantic state.
     */
    readonly createSearch?: (
      listings: readonly NipListing[],
      semantic: boolean,
      locale: Locale,
    ) => NipSearch;
    /** Parts: `-search -search-clear -semantic -filters-toggle -filters -status-<s> -variant-<v> -category-<c> -kind -relay -editor -course -clear -sort -view-<v> -count -empty`; items `nips-item-<id>`. */
    readonly testid?: string;
  }

  const defaultSearch = (
    listings: readonly NipListing[],
    semantic: boolean,
    locale: Locale,
  ): NipSearch =>
    createNipSearch({
      listings,
      locale,
      semantic: semantic && {
        modelBaseUrl: assetHref("models/"),
        wasmBaseUrl: assetHref("models/ort/"),
      },
    });

  const {
    locale,
    specs,
    course,
    semantic = true,
    createSearch = defaultSearch,
    testid = "nips",
  }: Props = $props();
  const dict = $derived(getDictionary(locale));
  const ui = $derived(dict.nips.ui);

  // Debounce for the model-backed query only; keyword results update on every keystroke.
  const SEMANTIC_DEBOUNCE_MS = 220;

  const listings = $derived(buildListings(NIP_INDEX.nips, specs));
  const courseIds = $derived(courseNipIds(course));
  const counts = $derived(facetCounts(listings));
  const categoryCounts = $derived(
    Object.fromEntries(
      KIND_CATEGORIES.map((c) => [c, listings.filter((n) => kindCategoriesOf(n).has(c)).length]),
    ),
  );

  let browse = $state<BrowseState>(DEFAULT_BROWSE_STATE);
  let mounted = $state(false);
  let filtersOpen = $state(false);
  let result = $state<NipSearchResult | undefined>();
  let pending = $state(false);
  let semanticState = $state<SemanticState>({ status: "idle" });
  let engine: NipSearch | undefined;
  let controller: AbortController | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const update = (patch: Partial<BrowseState>) => {
    browse = { ...browse, ...patch };
  };

  const searching = $derived(browse.q.trim() !== "");
  const hits = $derived(new Map<NipId, NipSearchHit>((result?.hits ?? []).map((h) => [h.id, h])));
  const visible = $derived(
    orderNips(
      listings,
      browse,
      courseIds,
      searching ? (result?.hits ?? []).map((h) => h.id) : undefined,
      locale,
    ),
  );
  const terms = (id: NipId): readonly string[] => [
    ...(hits.get(id)?.terms ?? []),
    ...queryWords(browse.q),
  ];
  const active = $derived(activeFilterCount(browse));
  const sort = $derived(effectiveSort(browse));

  const semanticText = $derived(semanticMessage(locale, semanticState));

  /** Keyword results now; the hybrid ranking replaces them when (and if) the model answers. */
  const runSearch = (q: string, withMeaning: boolean) => {
    controller?.abort();
    clearTimeout(timer);
    pending = false;
    if (engine === undefined) return;
    if (q.trim() === "") {
      result = undefined;
      return;
    }
    result = engine.lexical({ text: q });
    if (!withMeaning || !semantic) return;
    const search = engine;
    const ctrl = new AbortController();
    controller = ctrl;
    pending = true;
    timer = setTimeout(async () => {
      const r = await search.search({ text: q }, { signal: ctrl.signal });
      // `aborted` means a newer keystroke owns the results now: nothing to do.
      if (!r.ok) return;
      result = r.value;
      pending = false;
    }, SEMANTIC_DEBOUNCE_MS);
  };

  const onQuery = (q: string) => {
    update({ q });
    runSearch(q, true);
  };

  onMount(() => {
    browse = parseBrowseState(location.search);
    engine = createSearch(listings, semantic, locale);
    const off = engine.$semantic.subscribe((s) => {
      semanticState = s;
    });
    // A shared link with a query shows keyword results at once; the model only loads when the
    // visitor types (never on page load).
    runSearch(browse.q, false);
    filtersOpen = activeFilterCount(browse) > 0;
    mounted = true;
    return () => {
      off();
      controller?.abort();
      clearTimeout(timer);
      engine?.dispose();
    };
  });

  // Keep the URL shareable. replaceState: filtering is not navigation, Back leaves the page.
  $effect(() => {
    if (!mounted) return;
    const qs = serializeBrowseState(browse);
    const next = `${location.pathname}${qs}${location.hash}`;
    if (next !== `${location.pathname}${location.search}${location.hash}`)
      history.replaceState(history.state, "", next);
  });

  let searchbar: HTMLElement | undefined;
  /**
   * Below `lg` the header and filters push the results far down; once the on-screen keyboard
   * opens nothing is left in view. Lift the search box to the top so the first results show
   * while typing. Wide screens already have everything in view, so they don't jump.
   */
  const onSearchFocus = () => {
    if (searchbar === undefined || typeof globalThis.matchMedia !== "function") return;
    if (matchMedia(mediaUp("lg")).matches) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    searchbar.scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" });
  };

  const sortLabel = (s: BrowseSort) => (s === "relevance" ? ui.sort.relevance : ui.sort[s]);
  const viewLabel = (v: BrowseView) => ui.view[v];
</script>

<div class="browser" data-testid={testid} data-ready={mounted}>
  <search class="searchbar" bind:this={searchbar}>
    <label class="search-label" for="{testid}-q">{ui.search.label}</label>
    <div class="search-row">
      <input
        id="{testid}-q"
        class="search-input"
        type="search"
        autocomplete="off"
        spellcheck="false"
        enterkeyhint="search"
        placeholder={ui.search.placeholder}
        value={browse.q}
        disabled={!mounted}
        aria-describedby="{testid}-semantic"
        data-testid="{testid}-search"
        onfocus={onSearchFocus}
        oninput={(e) => onQuery(e.currentTarget.value)}
      >
      <!-- One clear control, inside the field (the native one is hidden: not every browser
           has it), so the input keeps the full width on phones. -->
      {#if browse.q !== ""}
        <button
          type="button"
          class="search-clear"
          aria-label={ui.search.clear}
          title={ui.search.clear}
          data-testid="{testid}-search-clear"
          onclick={(e) => {
            onQuery("");
            e.currentTarget.parentElement?.querySelector("input")?.focus();
          }}
        >
          <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
            <path d="M4 4l8 8M12 4l-8 8" />
          </svg>
        </button>
      {/if}
    </div>
    <p
      class="semantic"
      id="{testid}-semantic"
      data-testid="{testid}-semantic"
      data-status={semanticState.status}
    >
      <span class="dot" aria-hidden="true"></span>
      {semanticText}
    </p>
  </search>

  <div class="layout">
    <aside class="side" aria-labelledby="{testid}-filters-heading">
      <h2 id="{testid}-filters-heading" class="visually-hidden">{ui.filters.label}</h2>
      <button
        type="button"
        class="btn filters-toggle"
        aria-expanded={filtersOpen}
        aria-controls="{testid}-filters"
        disabled={!mounted}
        data-testid="{testid}-filters-toggle"
        onclick={() => (filtersOpen = !filtersOpen)}
      >
        {ui.filters.show}
        {#if active > 0}
          <span class="count-pill">{plural(locale, active, ui.filters.active)}</span>
        {/if}
      </button>
      <div
        class="filters"
        id="{testid}-filters"
        data-open={filtersOpen}
        data-testid="{testid}-filters"
      >
        <div class="field">
          <label class="legend" for="{testid}-sort">{ui.sort.label}</label>
          <select
            id="{testid}-sort"
            value={sort}
            disabled={!mounted}
            data-testid="{testid}-sort"
            onchange={(e) => {
              const v = BROWSE_SORTS.find((s) => s === e.currentTarget.value);
              if (v !== undefined) update({ sort: v });
            }}
          >
            {#each BROWSE_SORTS as s (s)}
              {#if s !== "relevance" || searching}
                <option value={s}>{sortLabel(s)}</option>
              {/if}
            {/each}
          </select>
        </div>

        <fieldset class="views" disabled={!mounted}>
          <legend>{ui.view.label}</legend>
          <div class="views-row">
            {#each BROWSE_VIEWS as v (v)}
              <button
                type="button"
                class="btn view"
                aria-pressed={browse.view === v}
                data-testid="{testid}-view-{v}"
                onclick={() => update({ view: v })}
              >
                {viewLabel(v)}
              </button>
            {/each}
          </div>
        </fieldset>

        <fieldset disabled={!mounted}>
          <legend>{ui.filters.status}</legend>
          {#each NIP_STATUSES as s (s)}
            <label class="check" title={ui.statusDescriptions[s]}>
              <input
                type="checkbox"
                checked={browse.statuses.includes(s)}
                data-testid="{testid}-status-{s}"
                onchange={(e) =>
                  update({ statuses: toggleValue(browse.statuses, s, e.currentTarget.checked) })}
              >
              <span>{ui.statuses[s]}</span>
              <span class="n">{counts.statuses[s]}</span>
            </label>
          {/each}
        </fieldset>

        <fieldset disabled={!mounted}>
          <legend>{ui.filters.variant}</legend>
          {#each NIP_SPEC_VARIANTS as v (v)}
            <label class="check" title={ui.variantDescriptions[v]}>
              <input
                type="checkbox"
                checked={browse.variants.includes(v)}
                data-testid="{testid}-variant-{v}"
                onchange={(e) =>
                  update({ variants: toggleValue(browse.variants, v, e.currentTarget.checked) })}
              >
              <span>{ui.variants[v]}</span>
              <span class="n">{counts.variants[v]}</span>
            </label>
          {/each}
        </fieldset>

        <fieldset disabled={!mounted}>
          <legend>{ui.filters.category}</legend>
          {#each KIND_CATEGORIES as c (c)}
            <label class="check" title={dict.kinds.categoryDescriptions[c]}>
              <input
                type="checkbox"
                checked={browse.categories.includes(c)}
                data-testid="{testid}-category-{c}"
                onchange={(e) =>
                  update({
                    categories: toggleValue(browse.categories, c, e.currentTarget.checked),
                  })}
              >
              <span>{dict.kinds.categories[c]}</span>
              <span class="n">{categoryCounts[c]}</span>
            </label>
          {/each}
          <label class="kind" for="{testid}-kind">{ui.filters.kind}</label>
          <input
            id="{testid}-kind"
            class="kind-input"
            type="text"
            inputmode="numeric"
            pattern="[0-9]*"
            autocomplete="off"
            maxlength="5"
            placeholder={ui.filters.kindPlaceholder}
            aria-describedby="{testid}-kind-hint"
            value={browse.kind === undefined ? "" : String(browse.kind)}
            data-testid="{testid}-kind"
            oninput={(e) => {
              const text = e.currentTarget.value.trim();
              if (text === "") browse = withKind(browse, undefined);
              else if (/^\d{1,5}$/.test(text)) browse = withKind(browse, Number(text));
            }}
          >
          <p class="hint" id="{testid}-kind-hint">{ui.filters.kindHint}</p>
        </fieldset>

        <fieldset disabled={!mounted}>
          <legend>{ui.filters.more}</legend>
          <label class="check">
            <input
              type="checkbox"
              checked={browse.editor}
              data-testid="{testid}-editor"
              onchange={(e) => update({ editor: e.currentTarget.checked })}
            >
            <span>{ui.filters.editor}</span>
          </label>
          <label class="check">
            <input
              type="checkbox"
              checked={browse.course}
              data-testid="{testid}-course"
              onchange={(e) => update({ course: e.currentTarget.checked })}
            >
            <span>{ui.filters.course}</span>
            <span class="n">{courseIds.size}</span>
          </label>
          <label class="check">
            <input
              type="checkbox"
              checked={browse.relay}
              data-testid="{testid}-relay"
              onchange={(e) => update({ relay: e.currentTarget.checked })}
            >
            <span>{ui.filters.relay}</span>
            <span class="n">{counts.relay}</span>
          </label>
        </fieldset>

        {#if active > 0}
          <button
            type="button"
            class="btn"
            data-testid="{testid}-clear"
            onclick={() => (browse = clearFilters(browse))}
          >
            {ui.filters.clear}
          </button>
        {/if}
      </div>
    </aside>

    <section class="results" aria-labelledby="{testid}-results-heading">
      <div class="toolbar">
        <h2
          id="{testid}-results-heading"
          class="count"
          data-testid="{testid}-count"
          aria-live="polite"
        >
          {#if searching}
            {plural(locale, visible.length, ui.search.results)}
          {:else}
            {format(ui.filters.shown, {
              shown: formatNumber(locale, visible.length),
              total: formatNumber(locale, listings.length),
            })}
          {/if}
        </h2>
      </div>

      {#if visible.length === 0}
        <div class="empty" data-testid="{testid}-empty">
          <div class="art halftone" aria-hidden="true"></div>
          <p class="empty-title">
            {searching ? format(ui.search.noResults, { query: browse.q.trim() }) : ui.empty.title}
          </p>
          <p class="empty-body">{ui.empty.body}</p>
          <p class="empty-actions">
            {#if searching}
              <button type="button" class="btn" onclick={() => onQuery("")}>
                {ui.search.clear}
              </button>
            {/if}
            {#if active > 0}
              <button type="button" class="btn" onclick={() => (browse = clearFilters(browse))}>
                {ui.filters.clear}
              </button>
            {/if}
          </p>
        </div>
      {:else}
        <ul class="list" data-view={browse.view} data-pending={pending} data-testid="{testid}-list">
          {#each visible as nip (nip.id)}
            <li>
              <NipResultCard
                {locale}
                {nip}
                href={href(locale, `nips/${nip.id}`)}
                hit={hits.get(nip.id)}
                terms={searching ? terms(nip.id) : []}
                inCourse={courseIds.has(nip.id)}
                testid="{testid}-item-{nip.id}"
              />
            </li>
          {/each}
        </ul>
      {/if}
    </section>
  </div>
</div>

<style>
  .browser {
    display: grid;
    gap: var(--space-md);
    min-inline-size: 0;
  }
  /* md (tokens.breakpoint.md = 768px): more air once there is room for it. */
  @media (min-width: 768px) {
    .browser {
      gap: var(--space-lg);
    }
  }
  .searchbar {
    display: grid;
    gap: var(--space-xs);
  }
  .search-label {
    font-weight: var(--font-weight-bold);
  }
  .search-row {
    position: relative;
    display: flex;
    min-inline-size: 0;
  }
  .search-input,
  .kind-input,
  select {
    min-block-size: var(--size-touch-target);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-md);
    background: var(--color-surface-raised);
    color: var(--color-text);
    font: inherit;
    /* ≥16px so iOS doesn't zoom on focus. */
    font-size: var(--font-size-md);
  }
  .search-input {
    flex: 1;
    min-inline-size: 0;
    padding: var(--space-xs) var(--space-sm);
    /* Room for the in-field clear button. */
    padding-inline-end: calc(var(--size-touch-target) + var(--space-2xs));
    box-shadow: var(--shadow-pop-sm);
    font-size: var(--font-size-lg);
  }
  .search-input:focus-visible {
    box-shadow: var(--shadow-accent);
  }
  .search-input::-webkit-search-cancel-button {
    display: none;
  }
  .search-clear {
    position: absolute;
    inset-block: 0;
    inset-inline-end: var(--space-3xs);
    display: grid;
    place-items: center;
    inline-size: var(--size-touch-target);
    margin: 0;
    padding: 0;
    border: 0;
    border-radius: var(--radius-md);
    background: transparent;
    color: var(--color-text-muted);
    cursor: pointer;
  }
  .search-clear:hover {
    color: var(--color-text);
  }
  .search-clear svg {
    inline-size: var(--size-icon-md);
    block-size: var(--size-icon-md);
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
  }
  /* A little air above the search box when it is lifted into view. */
  .searchbar {
    scroll-margin-block-start: var(--space-sm);
  }
  .semantic {
    display: flex;
    align-items: baseline;
    gap: var(--space-xs);
    margin: 0;
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
  }
  .dot {
    flex: none;
    inline-size: var(--space-xs);
    block-size: var(--space-xs);
    border: var(--border-width-thin) solid var(--color-border-strong);
    border-radius: var(--radius-round);
    background: var(--color-surface-sunken);
  }
  [data-status="loading"] .dot {
    background: var(--color-warning);
  }
  [data-status="ready"] .dot {
    background: var(--color-secondary);
  }

  .layout {
    display: grid;
    gap: var(--space-lg);
    min-inline-size: 0;
  }
  /* lg (tokens.breakpoint.lg = 1024px): filters become a sidebar. */
  @media (min-width: 1024px) {
    .layout {
      grid-template-columns: var(--size-rail) minmax(0, 1fr);
      align-items: start;
    }
  }

  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-xs);
    min-block-size: var(--size-touch-target);
    padding: var(--space-2xs) var(--space-sm);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-md);
    background: var(--color-surface-raised);
    color: var(--color-text);
    font: inherit;
    font-weight: var(--font-weight-semibold);
    cursor: pointer;
    box-shadow: var(--shadow-pop-sm);
    transition:
      translate var(--motion-duration-press) var(--motion-easing-press),
      box-shadow var(--motion-duration-press) var(--motion-easing-press);
  }
  .btn:hover:not(:disabled) {
    translate: calc(var(--size-lift) * -1) calc(var(--size-lift) * -1);
    box-shadow: var(--shadow-lift);
  }
  .btn:active:not(:disabled) {
    translate: var(--size-lift) var(--size-lift);
    box-shadow: var(--shadow-pressed);
  }
  .btn:disabled {
    opacity: var(--opacity-disabled);
    cursor: default;
  }
  .btn[aria-pressed="true"] {
    background: var(--color-primary);
    color: var(--color-on-primary);
    box-shadow: var(--shadow-pressed);
  }
  .count-pill {
    padding: 0 var(--space-xs);
    border: var(--border-width-thin) solid var(--color-border-strong);
    border-radius: var(--radius-pill);
    background: var(--color-primary);
    color: var(--color-on-primary);
    font-family: var(--font-family-mono);
    font-size: var(--font-size-xs);
  }

  .side {
    display: grid;
    gap: var(--space-sm);
    min-inline-size: 0;
  }
  .filters {
    display: grid;
    gap: var(--space-md);
    padding: var(--space-md);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-md);
    background: var(--color-surface);
  }
  .filters[data-open="false"] {
    display: none;
  }
  @media (min-width: 1024px) {
    .filters-toggle {
      display: none;
    }
    .filters[data-open="false"] {
      display: grid;
    }
  }
  fieldset {
    display: grid;
    gap: var(--space-3xs);
    min-inline-size: 0;
    margin: 0;
    padding: 0;
    border: 0;
  }
  legend,
  .legend {
    margin-block-end: var(--space-2xs);
    padding: 0;
    font-family: var(--font-family-mono);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-semibold);
    letter-spacing: var(--font-letter-spacing-caps);
    text-transform: uppercase;
    color: var(--color-text-muted);
  }
  .check {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    min-block-size: var(--size-touch-target);
    cursor: pointer;
  }
  .check input {
    flex: none;
    inline-size: var(--size-icon-md);
    block-size: var(--size-icon-md);
    margin: 0;
    accent-color: var(--color-primary);
  }
  .n {
    margin-inline-start: auto;
    font-family: var(--font-family-mono);
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
  }
  .kind {
    margin-block-start: var(--space-xs);
    font-weight: var(--font-weight-semibold);
  }
  .kind-input {
    inline-size: 100%;
    padding: var(--space-2xs) var(--space-sm);
    font-family: var(--font-family-mono);
  }
  .hint {
    margin: 0;
    color: var(--color-text-muted);
    font-size: var(--font-size-xs);
  }

  .results {
    display: grid;
    gap: var(--space-md);
    min-inline-size: 0;
  }
  .toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-sm) var(--space-md);
    padding-block-end: var(--space-sm);
    border-block-end: var(--border-width-medium) solid var(--color-border-strong);
  }
  .count {
    flex: 1 1 auto;
    margin: 0;
    font-family: var(--font-family-mono);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
  }
  .field {
    display: grid;
    min-inline-size: 0;
  }
  .legend {
    display: block;
  }
  select {
    inline-size: 100%;
    padding: var(--space-2xs) var(--space-xs);
  }
  .views-row {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-xs);
  }
  .view {
    flex: 1 1 auto;
    font-size: var(--font-size-sm);
  }

  .list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, var(--size-rail)), 1fr));
    gap: var(--space-md);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .list[data-view="list"] {
    grid-template-columns: minmax(0, 1fr);
    gap: var(--space-xs);
  }

  .empty {
    display: grid;
    justify-items: start;
    gap: var(--space-xs);
    padding: var(--space-lg);
    border: var(--border-width-medium) dashed var(--color-border-strong);
    border-radius: var(--radius-md);
  }
  .art {
    inline-size: var(--size-avatar-lg);
    block-size: var(--size-avatar-lg);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-round);
  }
  .empty-title {
    margin: 0;
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-bold);
    overflow-wrap: anywhere;
  }
  .empty-body {
    margin: 0;
    max-inline-size: var(--size-content);
    color: var(--color-text-muted);
  }
  .empty-actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-xs);
    margin: var(--space-xs) 0 0;
  }
</style>
