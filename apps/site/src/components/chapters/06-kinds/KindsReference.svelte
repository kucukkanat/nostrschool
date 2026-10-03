<script lang="ts">
  import { format, getDictionary, type Locale } from "@nostrschool/i18n";
  import { KIND_CATEGORIES, type KindCategory, nipUrl } from "@nostrschool/protocol";
  import { Badge, prefersReducedMotion } from "@nostrschool/ui";
  import { tick } from "svelte";
  import KindDetail from "./KindDetail.svelte";
  import KindFilters from "./KindFilters.svelte";
  import {
    countByCategory,
    detailStacksBelow,
    filterKinds,
    localizeKinds,
    nipLabel,
    revealDetail,
  } from "./kinds-logic.ts";

  interface Props {
    readonly locale: Locale;
    /** Parts: `-filters-*`, `-row-<kind>`, `-show-<kind>`, `-detail-*`, `-empty`. */
    readonly testid?: string;
  }

  const { locale, testid = "ch06-reference" }: Props = $props();
  const dict = $derived(getDictionary(locale));
  const t = $derived(dict.chapters.ch06);
  const entries = $derived(localizeKinds(dict.kinds.names));
  let categories = $state<ReadonlySet<KindCategory>>(new Set(KIND_CATEGORIES));
  let query = $state("");
  let selected = $state<number | undefined>();
  let detailEl = $state<HTMLElement>();
  const visible = $derived(filterKinds(entries, { categories, query }));
  const selectedEntry = $derived(entries.find((e) => e.kind === selected));

  let tableEl = $state<HTMLElement>();

  // Move focus to the panel so keyboard and screen-reader users land on what they opened; when the
  // panel is stacked below the table, also bring it into view and land on its heading.
  const show = async (kind: number) => {
    selected = kind;
    await tick();
    if (detailStacksBelow()) revealDetail(detailEl, prefersReducedMotion());
    else detailEl?.focus();
  };

  const backToRow = () => {
    const button = tableEl?.querySelector<HTMLElement>(
      `[data-testid="${testid}-show-${selected}"]`,
    );
    button?.scrollIntoView({
      block: "center",
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
    button?.focus({ preventScroll: true });
  };
</script>

<div class="ref" data-testid={testid}>
  <p class="intro">{t.tool.intro}</p>
  <KindFilters
    {locale}
    testid="{testid}-filters"
    bind:categories
    bind:query
    counts={countByCategory(entries)}
    shown={visible.length}
  />

  <div class="layout">
    <div class="scroll" bind:this={tableEl}>
      <table>
        <caption class="visually-hidden">
          {t.tool.caption}
        </caption>
        <thead>
          <tr>
            <th scope="col">{t.tool.columns.kind}</th>
            <th scope="col">{t.tool.columns.name}</th>
            <th scope="col">{t.tool.columns.category}</th>
            <th scope="col">{t.tool.columns.nip}</th>
            <th scope="col"><span class="visually-hidden">{t.tool.columns.details}</span></th>
          </tr>
        </thead>
        <tbody>
          {#each visible as entry (entry.kind)}
            <tr class:selected={selected === entry.kind} data-testid="{testid}-row-{entry.kind}">
              <td class="num">{entry.kind}</td>
              <td>
                <span class="name">{entry.label}</span>
                <span class="desc">{entry.description}</span>
              </td>
              <td>
                <Badge tone={entry.category} size="sm"
                  >{dict.kinds.categories[entry.category]}</Badge
                >
              </td>
              <td>
                <a
                  href={nipUrl(entry.nip)}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="ch06-nip-link-{entry.kind}"
                  >{nipLabel(entry.nip)}</a
                >
              </td>
              <td>
                <button
                  type="button"
                  class="show"
                  aria-pressed={selected === entry.kind}
                  aria-label={format(t.table.tileLabel, {
                    kind: entry.kind,
                    name: entry.label,
                    category: dict.kinds.categories[entry.category],
                  })}
                  onclick={() => show(entry.kind)}
                  data-testid="{testid}-show-{entry.kind}"
                >
                  {t.tool.show}
                </button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
      {#if visible.length === 0}
        <p class="empty" data-testid="{testid}-empty">{t.table.empty}</p>
      {/if}
    </div>
    <div class="side" tabindex="-1" bind:this={detailEl}>
      <KindDetail {locale} testid="{testid}-detail" entry={selectedEntry} headingLevel={2} />
      {#if selectedEntry !== undefined}
        <button type="button" class="back" onclick={backToRow} data-testid="{testid}-back">
          <span aria-hidden="true">↑</span>
          {t.detail.close}
        </button>
      {/if}
    </div>
  </div>
</div>

<style>
  .ref {
    display: grid;
    gap: var(--space-md);
  }
  .intro {
    margin: 0;
    color: var(--color-text-muted);
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
    /* Side by side, the table is already in view. */
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
  .side:focus-visible {
    outline: var(--border-width-thick) solid var(--color-focus-ring);
    border-radius: var(--radius-xl);
  }
  .scroll {
    overflow-x: auto;
    border: var(--border-width-medium) solid var(--color-border);
    border-radius: var(--radius-lg);
    background: var(--color-surface);
  }
  table {
    inline-size: 100%;
    border-collapse: collapse;
    font-size: var(--font-size-sm);
  }
  th {
    position: sticky;
    inset-block-start: 0;
    padding: var(--space-xs);
    background: var(--color-surface-sunken);
    font-family: var(--font-family-display);
    text-align: start;
  }
  td {
    padding: var(--space-xs);
    border-block-start: var(--border-width-thin) solid var(--color-border);
    vertical-align: top;
  }
  tr {
    transition: background-color var(--motion-duration-fast) var(--motion-easing-standard);
  }
  tbody tr:hover,
  tr.selected {
    background: var(--color-primary-subtle);
  }
  .num {
    font-family: var(--font-family-mono);
    font-weight: var(--font-weight-bold);
  }
  .name {
    display: block;
    font-weight: var(--font-weight-semibold);
  }
  .desc {
    display: block;
    color: var(--color-text-muted);
  }
  a {
    color: var(--color-text-primary);
    white-space: nowrap;
  }
  .show {
    min-block-size: var(--size-touch-target);
    padding: var(--space-2xs) var(--space-sm);
    border: var(--border-width-medium) solid var(--color-primary);
    border-radius: var(--radius-pill);
    background: var(--color-surface);
    color: var(--color-text-primary);
    font: inherit;
    font-weight: var(--font-weight-semibold);
    cursor: pointer;
  }
  .show[aria-pressed="true"] {
    background: var(--color-primary);
    color: var(--color-on-primary);
  }
  .show:focus-visible,
  .back:focus-visible,
  a:focus-visible {
    outline: var(--border-width-thick) solid var(--color-focus-ring);
    outline-offset: var(--space-3xs);
  }
  .empty {
    margin: 0;
    padding: var(--space-md);
    text-align: center;
    color: var(--color-text-muted);
  }
</style>
