<script lang="ts">
  /**
   * One NIP in the browser: id, status, what it defines, title and summary (or the passage that
   * matched), kinds and two quick facts. The title link is stretched over the card so the whole
   * card is one big tap target, while screen readers hear only the title as the link name.
   */
  import { format, getDictionary, type Locale } from "@nostrschool/i18n";
  import type { NipSearchHit } from "@nostrschool/nip-search";
  import { getNipStrings, type NipListing } from "@nostrschool/nips";
  import Highlight from "./Highlight.svelte";

  interface Props {
    readonly locale: Locale;
    readonly nip: NipListing;
    readonly href: string;
    readonly hit?: NipSearchHit | undefined;
    readonly terms: readonly string[];
    readonly inCourse: boolean;
    readonly testid: string;
  }

  const { locale, nip, href, hit, terms, inCourse, testid }: Props = $props();
  const ui = $derived(getDictionary(locale).nips.ui);
  const strings = $derived(getNipStrings(locale, nip.id));
  const title = $derived(strings?.title ?? nip.title);
  const summary = $derived(strings?.summary ?? nip.summary);
  // The matched passage replaces the summary only when it adds something (a semantic chunk
  // from deep in the spec); the "about" chunk is just the summary again.
  const snippet = $derived(
    hit?.snippet !== undefined && hit.snippet.sectionId !== "intro" ? hit.snippet : undefined,
  );
  const MAX_KINDS = 4;
  const kinds = $derived(
    nip.kinds.map((k) => (k.to === undefined ? `${k.kind}` : `${k.kind}–${k.to}`)),
  );
</script>

<article class="card" data-testid={testid} data-status={nip.status} data-variant={nip.variant}>
  <p class="top">
    <span class="id">NIP-{nip.id}</span>
    <span class="badge status {nip.status}" title={ui.statusDescriptions[nip.status]}
      >{ui.statuses[nip.status]}</span
    >
    <span class="badge">{ui.variants[nip.variant]}</span>
    {#if hit?.pinned === true}
      <span class="badge pinned" data-testid="{testid}-pinned">{ui.search.pinned}</span>
    {/if}
  </p>
  <h3 class="title">
    <a {href} data-testid="{testid}-link"><Highlight text={title} {terms} /></a>
  </h3>
  {#if snippet !== undefined}
    <p class="eyebrow matched" data-testid="{testid}-snippet">
      {format(ui.search.matchedIn, { heading: snippet.heading })}
    </p>
  {/if}
  <p class="summary">
    <Highlight
      text={snippet !== undefined && snippet.text !== "" ? snippet.text : summary}
      {terms}
    />
  </p>
  {#if kinds.length > 0 || !nip.todo || inCourse || nip.relay}
    <ul class="facts" aria-label={ui.detail.facts}>
      {#each kinds.slice(0, MAX_KINDS) as k (k)}
        <li class="chip mono">kind {k}</li>
      {/each}
      {#if kinds.length > MAX_KINDS}
        <li class="chip mono">+{kinds.length - MAX_KINDS}</li>
      {/if}
      {#if !nip.todo}
        <li class="chip flag editor" data-testid="{testid}-editor">{ui.card.editor}</li>
      {/if}
      {#if inCourse}
        <li class="chip flag course" data-testid="{testid}-course">{ui.card.course}</li>
      {/if}
      {#if nip.relay}
        <li class="chip flag">{ui.card.relay}</li>
      {/if}
    </ul>
  {/if}
</article>

<style>
  /* Ink outline + hard shadow; hover lifts, press flattens (brand recipe). */
  .card {
    position: relative;
    display: grid;
    align-content: start;
    gap: var(--space-xs);
    block-size: 100%;
    min-inline-size: 0;
    padding: var(--space-sm) var(--space-md) var(--space-md);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-md);
    background: var(--color-surface-raised);
    box-shadow: var(--shadow-pop-sm);
    transition:
      translate var(--motion-duration-press) var(--motion-easing-press),
      box-shadow var(--motion-duration-press) var(--motion-easing-press);
  }
  .card:hover,
  .card:focus-within {
    translate: calc(var(--size-lift) * -1) calc(var(--size-lift) * -1);
    box-shadow: var(--shadow-lift);
  }
  .card:active {
    translate: var(--size-lift) var(--size-lift);
    box-shadow: var(--shadow-pressed);
  }
  .top {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2xs) var(--space-xs);
    margin: 0;
    font-family: var(--font-family-mono);
    font-size: var(--font-size-xs);
  }
  .id {
    margin-inline-end: auto;
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
  }
  .badge,
  .chip {
    padding: 0 var(--space-xs);
    border: var(--border-width-thin) solid var(--color-border-strong);
    border-radius: var(--radius-pill);
    background: var(--color-surface);
    color: var(--color-text);
    font-family: var(--font-family-mono);
    font-size: var(--font-size-xs);
    line-height: var(--font-line-height-normal);
  }
  .status.final {
    background: var(--color-success-subtle);
  }
  .status.draft {
    background: var(--color-info-subtle);
  }
  .status.unrecommended {
    background: var(--color-warning-subtle);
  }
  .status.deprecated {
    background: var(--color-surface-sunken);
  }
  .pinned {
    background: var(--color-highlight);
    color: var(--color-on-highlight);
  }
  .title {
    margin: 0;
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-bold);
    line-height: var(--font-line-height-snug);
    overflow-wrap: anywhere;
  }
  .title a {
    color: var(--color-text);
    text-decoration: none;
  }
  /* Stretched link: the title's link covers the whole card. */
  .title a::after {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: var(--radius-md);
  }
  .title a:focus-visible {
    outline: none;
  }
  .title a:focus-visible::after {
    outline: var(--border-width-thick) solid var(--color-focus-ring);
    outline-offset: var(--size-focus-offset);
  }
  .summary {
    margin: 0;
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
    line-height: var(--font-line-height-normal);
    overflow-wrap: anywhere;
  }
  .matched {
    margin: 0;
    overflow-wrap: anywhere;
  }
  .facts {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2xs);
    margin: var(--space-2xs) 0 0;
    padding: 0;
    list-style: none;
  }
  .flag.editor {
    background: var(--color-secondary-subtle);
  }
  .flag.course {
    background: var(--color-primary-subtle);
  }
  /* Compact list layout (set by the browser on the list). */
  :global([data-view="list"]) .card {
    grid-template-columns: minmax(0, 1fr);
    padding-block: var(--space-xs);
    box-shadow: none;
  }
  :global([data-view="list"]) .summary,
  :global([data-view="list"]) .facts {
    display: none;
  }
  :global([data-view="list"]) .card:hover,
  :global([data-view="list"]) .card:focus-within {
    box-shadow: var(--shadow-pop-sm);
  }
</style>
