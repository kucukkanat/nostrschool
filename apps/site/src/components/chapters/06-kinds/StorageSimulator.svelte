<script lang="ts">
  import { FIXTURE_NOW } from "@nostrschool/fixtures";
  import { format, getDictionary, type Locale, plural } from "@nostrschool/i18n";
  import { KIND_CATEGORIES, type KindCategory, type NostrEvent } from "@nostrschool/protocol";
  import { tokens } from "@nostrschool/tokens";
  import { Button, duration, emit, pop, shake } from "@nostrschool/ui";
  import { flip } from "svelte/animate";
  import { backOut } from "svelte/easing";
  import { fly, scale } from "svelte/transition";
  import {
    type ArticleSlot,
    dTagOf,
    type StoreOutcome,
    signDemo,
    storeOnRelay,
    versionOf,
  } from "./storage.ts";

  interface Props {
    readonly locale: Locale;
    /** Parts: `-cat-<category> -slot-<a|b> -publish -stale -reset -shelf -shelf-item-<n> -feed -outcome -count`. */
    readonly testid?: string;
  }

  const { locale, testid = "ch06-storage" }: Props = $props();
  const dict = $derived(getDictionary(locale));
  const t = $derived(dict.chapters.ch06.storage);

  let category = $state<KindCategory>("replaceable");
  let slot = $state<ArticleSlot>("a");
  let published = $state<readonly NostrEvent[]>([]);
  let stored = $state<readonly NostrEvent[]>([]);
  let feed = $state<readonly { readonly seq: number; readonly event: NostrEvent }[]>([]);
  let seq = 0;
  let cheered = false;
  let outcome = $state<{ readonly kind: StoreOutcome; readonly n: number } | undefined>();
  let error = $state("");
  let shelfEl = $state<HTMLElement>();
  const FEED_SIZE = 4;
  const offset = Number.parseFloat(tokens.space.lg);
  // One minute between versions: created_at must grow for "newer wins" to be visible.
  const STEP_SECONDS = 60;

  const nextVersion = $derived(published.length + 1);
  const message = $derived(
    outcome === undefined ? "" : format(t.outcomes[outcome.kind], { n: outcome.n }),
  );

  const reset = (next: KindCategory = category) => {
    category = next;
    published = [];
    stored = [];
    feed = [];
    outcome = undefined;
    error = "";
  };

  const deliver = (event: NostrEvent) => {
    const result = storeOnRelay(stored, event);
    stored = result.stored;
    // Relays push every accepted event (stored or ephemeral) to matching live subscriptions.
    if (result.outcome !== "duplicate" && result.outcome !== "ignored-older")
      feed = [{ seq: ++seq, event }, ...feed].slice(0, FEED_SIZE);
    outcome = { kind: result.outcome, n: versionOf(event) };
    if (result.outcome !== "ignored-older") return;
    if (shelfEl !== undefined) shake(shelfEl);
    // Spotting "older copy loses" is the chapter's aha moment: the mascot cheers once.
    if (!cheered) emit("celebrate", { reason: "ch06-stale-ignored" });
    cheered = true;
  };

  const publish = () => {
    const signed = signDemo({
      category,
      version: nextVersion,
      slot,
      createdAt: FIXTURE_NOW + nextVersion * STEP_SECONDS,
    });
    if (!signed.ok) {
      error = signed.error.message;
      return;
    }
    published = [...published, signed.value];
    deliver(signed.value);
  };

  const resendOldest = () => {
    const oldest = published[0];
    if (oldest !== undefined) deliver(oldest);
  };
</script>

<div class="sim" data-testid={testid}>
  <h3 class="title">{t.title}</h3>
  <p class="lede">{t.description}</p>

  <fieldset class="cats">
    <legend class="visually-hidden">{t.categoryLabel}</legend>
    {#each KIND_CATEGORIES as c (c)}
      <button
        type="button"
        class="cat {c}"
        aria-pressed={category === c}
        onclick={() => reset(c)}
        data-testid="{testid}-cat-{c}"
      >
        <span class="name">{dict.kinds.categories[c]}</span>
        <span class="demo">{t.demo[c]}</span>
      </button>
    {/each}
  </fieldset>

  {#if category === "addressable"}
    <fieldset class="slots">
      <legend class="visually-hidden">{t.article}</legend>
      {#each ["a", "b"] as const as s (s)}
        <button
          type="button"
          class="slot"
          aria-pressed={slot === s}
          onclick={() => (slot = s)}
          data-testid="{testid}-slot-{s}"
        >
          {s === "a" ? t.articleA : t.articleB}
        </button>
      {/each}
    </fieldset>
  {/if}

  <div class="actions">
    <Button testid="{testid}-publish" onclick={publish}
      >{format(t.publish, { n: nextVersion })}</Button
    >
    <Button
      testid="{testid}-stale"
      variant="secondary"
      disabled={published.length < 2}
      onclick={resendOldest}
    >
      {t.publishStale}
    </Button>
    <Button testid="{testid}-reset" variant="ghost" onclick={() => reset()}>{t.reset}</Button>
  </div>

  <p
    class="outcome {outcome?.kind ?? ""}"
    aria-live="polite"
    data-testid="{testid}-outcome"
    data-outcome={outcome?.kind ?? ""}
  >
    {#key published.length + (outcome?.kind ?? "")}
      <span use:pop={{ spring: "snappy", from: 0.95 }}>{error === "" ? message : error}</span>
    {/key}
  </p>

  <div class="stage {category}">
    <section
      class="col shelf"
      aria-labelledby="{testid}-shelf-h"
      bind:this={shelfEl}
      data-testid="{testid}-shelf"
    >
      <h4 id="{testid}-shelf-h">
        {t.shelf}
        <span class="count" data-testid="{testid}-count"
          >{plural(locale, stored.length, t.stored)}</span
        >
      </h4>
      {#if stored.length === 0}
        <p class="none">{t.shelfEmpty}</p>
      {/if}
      <ul>
        {#each stored as e (e.id)}
          <li
            class="card"
            animate:flip={{ duration: duration("normal") }}
            in:fly={{ y: -offset, duration: duration("slow"), easing: backOut }}
            out:scale={{ start: 0.5, duration: duration("normal") }}
            data-testid="{testid}-shelf-item-{versionOf(e)}"
          >
            <strong>{format(t.version, { n: versionOf(e), kind: e.kind })}</strong>
            {#if dTagOf(e) !== undefined}
              <code>d:{dTagOf(e)}</code>
            {/if}
            <code class="id">{e.id.slice(0, 8)}…</code>
          </li>
        {/each}
      </ul>
    </section>
    <section class="col feed" aria-labelledby="{testid}-feed-h" data-testid="{testid}-feed">
      <h4 id="{testid}-feed-h">{t.subscriber}</h4>
      {#if feed.length === 0}
        <p class="none">{t.subscriberEmpty}</p>
      {/if}
      <ul>
        {#each feed as item (item.seq)}
          <li
            class="card ghost"
            animate:flip={{ duration: duration("fast") }}
            in:fly={{ x: -offset, duration: duration("normal") }}
          >
            {format(t.version, { n: versionOf(item.event), kind: item.event.kind })}
          </li>
        {/each}
      </ul>
    </section>
  </div>
</div>

<style>
  fieldset {
    min-inline-size: 0;
    margin: 0;
    padding: 0;
    border: 0;
  }
  .sim {
    display: grid;
    gap: var(--space-sm);
    margin-block: var(--space-lg);
    padding: var(--space-md);
    border-radius: var(--radius-xl);
    background: var(--color-surface-sunken);
    min-block-size: var(--size-diagram-min-height);
  }
  .title {
    margin: 0;
    font-family: var(--font-family-display);
    font-size: var(--font-size-xl);
  }
  .lede {
    margin: 0;
    color: var(--color-text-muted);
  }
  .cats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(var(--size-mascot-md), 1fr));
    gap: var(--space-xs);
  }
  .cat {
    --cat-color: var(--color-kind-regular);
    display: grid;
    gap: var(--space-3xs);
    min-block-size: var(--size-touch-target);
    padding: var(--space-xs);
    border: var(--border-width-medium) solid var(--cat-color);
    border-radius: var(--radius-lg);
    background: var(--color-surface);
    color: var(--color-text);
    font: inherit;
    text-align: start;
    cursor: pointer;
    transition:
      background-color var(--motion-duration-fast) var(--motion-easing-standard),
      transform var(--motion-duration-fast) var(--motion-easing-bounce);
  }
  .cat:hover {
    transform: translateY(calc(-1 * var(--space-3xs)));
  }
  .cat[aria-pressed="true"] {
    background: var(--cat-color);
    color: var(--color-on-kind);
    box-shadow: var(--shadow-pop-sm);
  }
  .cat:focus-visible,
  .slot:focus-visible {
    outline: var(--border-width-thick) solid var(--color-focus-ring);
    outline-offset: var(--space-3xs);
  }
  .cat.replaceable,
  .stage.replaceable {
    --cat-color: var(--color-kind-replaceable);
  }
  .cat.ephemeral,
  .stage.ephemeral {
    --cat-color: var(--color-kind-ephemeral);
  }
  .cat.addressable,
  .stage.addressable {
    --cat-color: var(--color-kind-addressable);
  }
  .stage.regular {
    --cat-color: var(--color-kind-regular);
  }
  .name {
    font-family: var(--font-family-display);
    font-weight: var(--font-weight-bold);
  }
  .demo {
    font-size: var(--font-size-xs);
  }
  .slots,
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-xs);
  }
  .slot {
    min-block-size: var(--size-touch-target);
    padding: var(--space-2xs) var(--space-sm);
    border: var(--border-width-medium) solid var(--color-kind-addressable);
    border-radius: var(--radius-pill);
    background: var(--color-surface);
    color: var(--color-text);
    font: inherit;
    cursor: pointer;
  }
  .slot[aria-pressed="true"] {
    background: var(--color-kind-addressable);
    color: var(--color-on-kind);
  }
  .outcome {
    min-block-size: var(--size-control-md);
    margin: 0;
    padding: var(--space-xs) var(--space-sm);
    border-radius: var(--radius-md);
    background: var(--color-surface);
    font-weight: var(--font-weight-semibold);
  }
  .outcome:empty {
    background: transparent;
  }
  .outcome.replaced,
  .outcome.stored {
    background: var(--color-success-subtle);
  }
  .outcome.ignored-older,
  .outcome.duplicate {
    background: var(--color-warning-subtle);
  }
  .outcome.forwarded {
    background: var(--color-info-subtle);
  }
  .outcome span {
    display: inline-block;
  }
  .stage {
    display: grid;
    gap: var(--space-sm);
  }
  /* tokens.breakpoint.sm = 480px */
  @media (min-width: 480px) {
    .stage {
      grid-template-columns: 3fr 2fr;
    }
  }
  .col {
    min-inline-size: 0;
    padding: var(--space-sm);
    border-radius: var(--radius-lg);
    background: var(--color-surface);
  }
  .shelf {
    border: var(--border-width-thick) solid var(--cat-color);
  }
  .feed {
    border: var(--border-width-medium) dashed var(--color-border-strong);
  }
  h4 {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: var(--space-2xs);
    margin: 0 0 var(--space-xs);
    font-family: var(--font-family-display);
    font-size: var(--font-size-md);
  }
  .count {
    font-family: var(--font-family-mono);
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
  }
  ul {
    display: grid;
    gap: var(--space-2xs);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .none {
    margin: 0;
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
  }
  .card {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-xs);
    padding: var(--space-2xs) var(--space-xs);
    border-radius: var(--radius-md);
    background: var(--color-surface-raised);
    box-shadow: var(--shadow-sm);
    font-size: var(--font-size-sm);
  }
  .card.ghost {
    box-shadow: none;
    background: var(--color-surface-sunken);
  }
  code {
    font-family: var(--font-family-mono);
    font-size: var(--font-size-xs);
  }
  .id {
    color: var(--color-text-muted);
  }
</style>
