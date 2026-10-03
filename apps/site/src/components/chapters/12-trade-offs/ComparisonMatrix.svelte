<script lang="ts">
  /** Centerpiece: Nostr vs X vs Mastodon vs Bluesky, re-ranked live by the learner's priorities. */
  import { format, getDictionary, type Locale } from "@nostrschool/i18n";
  import { duration, emit, pop, $reducedMotion as reducedMotion, squish } from "@nostrschool/ui";
  import { flip } from "svelte/animate";
  import {
    CRITERIA,
    type CriterionId,
    matchingPreset,
    PLATFORMS,
    type PlatformId,
    PRESET_IDS,
    PRESETS,
    type PresetId,
    RATING_NAMES,
    RATINGS,
    rankPlatforms,
    togglePriority,
  } from "./matrix.ts";
  import RatingGlyph from "./RatingGlyph.svelte";

  const { locale }: { readonly locale: Locale } = $props();
  const t = $derived(getDictionary(locale).chapters.ch12);
  const tm = $derived(t.matrix);

  let priorities = $state.raw<ReadonlySet<CriterionId>>(new Set());
  let selected = $state.raw<{ criterion: CriterionId; platform: PlatformId } | undefined>();

  const ranking = $derived(rankPlatforms(priorities));
  const leader = $derived(ranking[0]?.platform ?? "nostr");
  const preset = $derived(matchingPreset(priorities));
  const flipMs = $derived(duration("slow", $reducedMotion));

  // Cheer only when a learner's own change puts Nostr on top (not on first render).
  const update = (next: ReadonlySet<CriterionId>) => {
    const before = leader;
    priorities = next;
    const after = rankPlatforms(next)[0]?.platform;
    if (after === "nostr" && before !== "nostr") emit("celebrate", { reason: "ch12-nostr-leads" });
  };
  const applyPreset = (id: PresetId) => update(new Set<CriterionId>(PRESETS[id]));

  const verdict = $derived(
    leader === "nostr" ? tm.nostrLeads : format(tm.otherLeads, { platform: t.platforms[leader] }),
  );
</script>

<section class="matrix" data-testid="ch12-matrix" aria-labelledby="ch12-matrix-title">
  <header class="head">
    <h3 id="ch12-matrix-title" class="title">{tm.title}</h3>
    <p class="intro">{tm.intro}</p>
  </header>

  <div class="controls">
    <fieldset class="group">
      <legend class="legend">{tm.presetsLabel}</legend>
      <div class="chips">
        {#each PRESET_IDS as id (id)}
          <button
            type="button"
            class="chip preset"
            aria-pressed={preset === id}
            data-testid="ch12-preset-{id}"
            use:squish
            onclick={() => applyPreset(id)}
          >
            {tm.presets[id]}
          </button>
        {/each}
      </div>
    </fieldset>

    <fieldset class="group">
      <legend class="legend">{tm.prioritiesLabel}</legend>
      <p class="hint">{tm.prioritiesHint}</p>
      <div class="chips">
        {#each CRITERIA as c (c)}
          <button
            type="button"
            class="chip"
            aria-pressed={priorities.has(c)}
            data-testid="ch12-priority-{c}"
            use:squish
            onclick={() => update(togglePriority(priorities, c))}
          >
            <span class="tick" aria-hidden="true">{priorities.has(c) ? "★" : "☆"}</span>
            {tm.criteria[c]}
          </button>
        {/each}
      </div>
    </fieldset>
  </div>

  <div class="ranking" data-testid="ch12-ranking">
    <h4 class="subtitle">{tm.rankingTitle}</h4>
    <ol class="bars">
      {#each ranking as r, i (r.platform)}
        <li
          class="bar-row"
          class:nostr={r.platform === "nostr"}
          data-testid="ch12-rank-{r.platform}"
          data-rank={i + 1}
          data-score={r.score}
          animate:flip={{ duration: flipMs }}
        >
          <span class="rank" aria-hidden="true">{i + 1}</span>
          <span class="stack">
            <span class="name">{t.platforms[r.platform]}</span>
            <span class="track" aria-hidden="true">
              <span class="fill" style:inline-size="{r.score}%"></span>
            </span>
          </span>
          <span class="score" aria-hidden="true">{r.score}</span>
          <span class="visually-hidden">
            {format(tm.scoreLabel, { platform: t.platforms[r.platform], score: r.score })}
          </span>
        </li>
      {/each}
    </ol>
    <p class="verdict" aria-live="polite" data-testid="ch12-verdict">{verdict}</p>
    <p class="note">{tm.noWinner}</p>
  </div>

  <div class="table-wrap">
    <table class="table" data-testid="ch12-table">
      <caption class="visually-hidden">
        {tm.tableCaption}
      </caption>
      <thead>
        <tr>
          <th scope="col" class="corner">{tm.criterionHeader}</th>
          {#each PLATFORMS as p (p)}
            <th scope="col" class="col" class:leader={p === leader} data-testid="ch12-col-{p}">
              {t.platforms[p]}
            </th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each CRITERIA as c (c)}
          <tr class:prioritized={priorities.has(c)}>
            <th scope="row" class="row-head">{tm.criteria[c]}</th>
            {#each PLATFORMS as p (p)}
              {@const rating = RATING_NAMES[RATINGS[c][p]]}
              {@const isSelected = selected?.criterion === c && selected.platform === p}
              <td class="cell" class:leader={p === leader}>
                <button
                  type="button"
                  class="cell-button"
                  aria-pressed={isSelected}
                  aria-label={format(tm.cellLabel, {
                    criterion: tm.criteria[c],
                    platform: t.platforms[p],
                    rating: t.ratings[rating],
                  })}
                  data-testid="ch12-cell-{c}-{p}"
                  data-rating={rating}
                  use:squish
                  onclick={() => (selected = { criterion: c, platform: p })}
                >
                  <RatingGlyph {rating} />
                </button>
              </td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  <div class="detail" aria-live="polite" data-testid="ch12-detail">
    {#if selected === undefined}
      <p class="muted">{tm.detailEmpty}</p>
    {:else}
      {@const rating = RATING_NAMES[RATINGS[selected.criterion][selected.platform]]}
      {#key `${selected.criterion}-${selected.platform}`}
        <div class="detail-body" use:pop>
          <p class="detail-title">
            <RatingGlyph {rating} />
            <strong>
              {format(tm.detailTitle, {
                criterion: tm.criteria[selected.criterion],
                platform: t.platforms[selected.platform],
              })}
            </strong>
            <span class="badge {rating}" data-testid="ch12-detail-rating">{t.ratings[rating]}</span>
          </p>
          <p data-testid="ch12-detail-text">{tm.notes[selected.criterion][selected.platform]}</p>
        </div>
      {/key}
    {/if}
  </div>
</section>

<style>
  .matrix {
    display: grid;
    gap: var(--space-lg);
    padding: var(--space-lg);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-lg);
    background: var(--color-surface);
    box-shadow: var(--shadow-pop);
    min-height: var(--size-diagram-min-height);
  }
  .title {
    margin: 0;
    font-family: var(--font-family-display);
    font-size: var(--font-size-xl);
  }
  .intro,
  .hint,
  .note {
    margin: var(--space-2xs) 0 0;
    color: var(--color-text-muted);
  }
  .controls {
    display: grid;
    gap: var(--space-md);
  }
  .group {
    margin: 0;
    padding: 0;
    border: 0;
    min-inline-size: 0;
  }
  .legend {
    padding: 0;
    font-weight: var(--font-weight-bold);
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-xs);
    margin-block-start: var(--space-xs);
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2xs);
    min-block-size: var(--size-touch-target);
    padding: 0 var(--space-sm);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-pill);
    background: var(--color-surface-raised);
    color: var(--color-text);
    font: inherit;
    font-size: var(--font-size-sm);
    cursor: pointer;
    transition:
      background-color var(--motion-duration-fast) var(--motion-easing-standard),
      translate var(--motion-duration-press) var(--motion-easing-press),
      box-shadow var(--motion-duration-press) var(--motion-easing-press);
  }
  .chip:hover {
    translate: calc(var(--size-lift) * -1) calc(var(--size-lift) * -1);
    box-shadow: var(--shadow-pop-sm);
  }
  .chip[aria-pressed="true"] {
    background: var(--color-primary);
    box-shadow: var(--shadow-accent);
    color: var(--color-on-primary);
  }
  .chip.preset[aria-pressed="true"] {
    background: var(--color-secondary);
    color: var(--color-on-secondary);
  }
  .chip:focus-visible,
  .cell-button:focus-visible {
    outline: var(--border-width-thick) solid var(--color-focus-ring);
    outline-offset: var(--space-3xs);
  }
  .subtitle {
    margin: 0 0 var(--space-xs);
    font-size: var(--font-size-md);
  }
  .bars {
    display: grid;
    gap: var(--space-xs);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .bar-row {
    display: grid;
    grid-template-columns: var(--size-icon-lg) 1fr var(--size-icon-xl);
    align-items: center;
    gap: var(--space-xs);
  }
  .rank {
    display: grid;
    place-items: center;
    inline-size: var(--size-icon-lg);
    block-size: var(--size-icon-lg);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-round);
    background: var(--color-surface-sunken);
    font-weight: var(--font-weight-bold);
  }
  .bar-row:first-child .rank {
    background: var(--color-accent);
    color: var(--color-on-accent);
  }
  .stack {
    display: grid;
    gap: var(--space-3xs);
    min-inline-size: 0;
  }
  .name {
    font-weight: var(--font-weight-semibold);
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .track {
    block-size: var(--space-md);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-sm);
    background: var(--color-surface-sunken);
    overflow: hidden;
  }
  .fill {
    display: block;
    block-size: 100%;
    border-radius: inherit;
    background: var(--color-text-muted);
    transition: inline-size var(--motion-duration-slow) var(--motion-easing-bounce);
  }
  .nostr .fill {
    background: var(--color-primary);
  }
  .score {
    font-family: var(--font-family-mono);
    text-align: end;
  }
  .verdict {
    margin: var(--space-sm) 0 0;
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
  }
  .table-wrap {
    overflow-x: auto;
  }
  .table {
    inline-size: 100%;
    border-collapse: separate;
    border-spacing: 0;
    font-size: var(--font-size-sm);
  }
  .table th,
  .table td {
    padding: var(--space-2xs);
    border-block-end: var(--border-width-thin) solid var(--color-border);
  }
  .corner,
  .row-head {
    text-align: start;
    font-weight: var(--font-weight-semibold);
  }
  .col {
    text-align: center;
    border-radius: var(--radius-md) var(--radius-md) 0 0;
    transition: background-color var(--motion-duration-normal) var(--motion-easing-standard);
  }
  .leader {
    background: var(--color-accent-subtle);
  }
  .prioritized .row-head {
    color: var(--color-text-primary);
  }
  .prioritized .row-head::before {
    content: "★ ";
  }
  .cell {
    text-align: center;
  }
  .cell-button {
    display: inline-grid;
    place-items: center;
    min-inline-size: var(--size-touch-target);
    min-block-size: var(--size-touch-target);
    border: var(--border-width-medium) solid transparent;
    border-radius: var(--radius-md);
    background: transparent;
    cursor: pointer;
  }
  .cell-button:hover {
    border-color: var(--color-border-strong);
  }
  .cell-button[aria-pressed="true"] {
    border-color: var(--color-border-strong);
    box-shadow: var(--shadow-accent);
    background: var(--color-primary-subtle);
  }
  .detail {
    min-block-size: calc(var(--size-touch-target) * 2);
    padding: var(--space-md);
    border-radius: var(--radius-lg);
    background: var(--color-surface-sunken);
  }
  .detail p {
    margin: 0;
  }
  .detail-title {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-xs);
  }
  .detail .detail-title {
    margin-block-end: var(--space-xs);
  }
  .muted {
    color: var(--color-text-muted);
  }
  .badge {
    padding: var(--space-3xs) var(--space-xs);
    border-radius: var(--radius-pill);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-bold);
  }
  .badge.good {
    background: var(--color-success-subtle);
    color: var(--color-success);
  }
  .badge.mixed {
    background: var(--color-warning-subtle);
    color: var(--color-warning);
  }
  .badge.poor {
    background: var(--color-danger-subtle);
    color: var(--color-danger);
  }
  /* tokens.breakpoint.sm = 480px: tighten the table on phones so 4 columns fit at 375px. */
  @media (max-width: 480px) {
    .matrix {
      padding: var(--space-md);
    }
    .table {
      font-size: var(--font-size-xs);
    }
    .table th,
    .table td {
      padding: var(--space-3xs);
    }
  }
</style>
