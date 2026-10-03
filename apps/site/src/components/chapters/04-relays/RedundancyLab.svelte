<script lang="ts">
  /**
   * Redundancy lab: choose where a note is published, then cause outages. Shows why clients
   * publish to several relays — no relay is special, so any surviving copy is as good as the original.
   */
  import { format, getDictionary, type Locale } from "@nostrschool/i18n";
  import { Button, emit, pop, shake } from "@nostrschool/ui";
  import {
    aliveCount,
    INITIAL_CARDS,
    nextVictim,
    publishedCount,
    type RelayCard,
    type RelayId,
    survivedOutage,
    toggle,
    verdict,
  } from "./redundancy.ts";

  interface Props {
    readonly locale: Locale;
  }
  const { locale }: Props = $props();
  const t = $derived(getDictionary(locale).chapters.ch04);

  let cards: readonly RelayCard[] = $state(INITIAL_CARDS);
  let announcement = $state("");
  let celebrated = false;
  const result = $derived(verdict(cards));
  const victim = $derived(nextVictim(cards));

  const update = (next: readonly RelayCard[], id: RelayId): void => {
    cards = next;
    const card = next.find((c) => c.id === id);
    if (card !== undefined)
      announcement = format(t.redundancy.changed, {
        relay: t.lanes[id],
        state: `${card.online ? t.redundancy.online : t.redundancy.offline}, ${card.published ? t.redundancy.hasCopy : t.redundancy.noCopy}`,
      });
    // Celebrate once per lab: the moment redundancy visibly saves the note.
    if (!celebrated && survivedOutage(next)) {
      celebrated = true;
      emit("celebrate", { reason: "ch04-redundancy" });
    }
  };

  const reset = (): void => {
    cards = INITIAL_CARDS;
    announcement = "";
  };
</script>

<section class="lab" data-testid="ch04-redundancy" data-verdict={result}>
  <h3 class="title">{t.redundancy.title}</h3>
  <p class="desc">{t.redundancy.description}</p>

  <ul class="grid">
    {#each cards as card (card.id)}
      <li
        class="card"
        data-testid="ch04-relay-{card.id}"
        data-online={card.online}
        data-published={card.published}
      >
        <span class="name">{t.lanes[card.id]}</span>
        <span class="state" data-testid="ch04-relay-{card.id}-state">
          <span class="dot" aria-hidden="true"></span>
          {card.online ? t.redundancy.online : t.redundancy.offline}
          ·
          {card.published ? t.redundancy.hasCopy : t.redundancy.noCopy}
        </span>
        <label class="check">
          <input
            type="checkbox"
            data-testid="ch04-relay-{card.id}-publish"
            checked={card.published}
            onchange={() => update(toggle(cards, card.id, "published"), card.id)}
          >
          {format(t.redundancy.publishTo, { relay: t.lanes[card.id] })}
        </label>
        <button
          type="button"
          class="power"
          data-testid="ch04-relay-{card.id}-power"
          aria-pressed={!card.online}
          onclick={() => update(toggle(cards, card.id, "online"), card.id)}
        >
          {format(card.online ? t.redundancy.knockOut : t.redundancy.bringBack, {
            relay: t.lanes[card.id],
          })}
        </button>
      </li>
    {/each}
  </ul>

  <div class="actions">
    <Button
      testid="ch04-redundancy-chaos"
      variant="danger"
      disabled={victim === undefined}
      onclick={() => {
        if (victim !== undefined) update(toggle(cards, victim, "online"), victim);
      }}
    >
      {t.redundancy.chaos}
    </Button>
    <Button testid="ch04-redundancy-reset" variant="ghost" onclick={reset}
      >{t.redundancy.reset}</Button
    >
  </div>

  {#key result}
    <p
      class="verdict {result}"
      data-testid="ch04-redundancy-verdict"
      use:pop
      use:shakeIfLost={result}
    >
      <strong
        >{result === "safe"
          ? t.redundancy.safe
          : result === "lost"
            ? t.redundancy.lost
            : t.redundancy.unpublished}</strong
      >
      <span data-testid="ch04-redundancy-copies">
        {format(t.redundancy.copies, {
          alive: aliveCount(cards),
          published: publishedCount(cards),
        })}
      </span>
    </p>
  {/key}
  <p class="visually-hidden" aria-live="polite" data-testid="ch04-redundancy-narration">
    {announcement}
  </p>
</section>

<script lang="ts" module>
  import type { Verdict } from "./redundancy.ts";

  /** Wobble the verdict when the note is lost; the text change alone carries the meaning. */
  const shakeIfLost = (node: HTMLElement, v: Verdict): void => {
    if (v === "lost") shake(node);
  };
</script>

<style>
  .lab {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
    margin: var(--space-lg) 0;
    padding: var(--space-md);
    border: var(--border-width-medium) solid var(--color-border);
    border-radius: var(--radius-lg);
    background: var(--color-surface);
    color: var(--color-text);
    box-shadow: var(--shadow-pop-sm);
  }
  .title {
    margin: 0;
    font-family: var(--font-family-display);
    font-size: var(--font-size-lg);
  }
  .desc {
    margin: 0;
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
  }
  .grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--space-sm);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  /* 480px = tokens.breakpoint.sm: two cards per row; 1024px = lg: four. */
  @media (min-width: 480px) {
    .grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  @media (min-width: 1024px) {
    .grid {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
  }
  .card {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
    padding: var(--space-sm);
    border: var(--border-width-medium) solid var(--color-diagram-node-stroke);
    border-radius: var(--radius-md);
    background: var(--color-diagram-node);
    transition:
      background var(--motion-duration-normal) var(--motion-easing-standard),
      transform var(--motion-duration-normal) var(--motion-easing-bounce);
  }
  .card[data-online="false"] {
    border-color: var(--color-diagram-node-down-stroke);
    background: var(--color-diagram-node-down);
    transform: rotate(-1deg);
  }
  .name {
    font-family: var(--font-family-display);
    font-weight: var(--font-weight-bold);
  }
  .state {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2xs);
    font-size: var(--font-size-sm);
  }
  .dot {
    width: var(--space-xs);
    height: var(--space-xs);
    border-radius: var(--radius-round);
    background: var(--color-success-solid);
  }
  .card[data-online="false"] .dot {
    background: var(--color-danger);
  }
  .check {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    min-height: var(--size-touch-target);
    font-size: var(--font-size-sm);
    cursor: pointer;
  }
  .check input {
    width: var(--size-icon-sm);
    height: var(--size-icon-sm);
    accent-color: var(--color-primary);
  }
  .power {
    min-height: var(--size-touch-target);
    padding: var(--space-2xs) var(--space-sm);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-pill);
    background: var(--color-surface);
    color: var(--color-text);
    font: inherit;
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    cursor: pointer;
  }
  .power:focus-visible,
  .check input:focus-visible {
    outline: var(--border-width-thick) solid var(--color-focus-ring);
    outline-offset: var(--space-3xs);
  }
  .power[aria-pressed="true"] {
    background: var(--color-primary);
    color: var(--color-on-primary);
    border-color: var(--color-primary);
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-xs);
  }
  .verdict {
    display: flex;
    flex-direction: column;
    gap: var(--space-3xs);
    margin: 0;
    padding: var(--space-sm);
    border-radius: var(--radius-md);
    background: var(--color-surface-sunken);
  }
  .verdict.safe {
    background: var(--color-success-subtle);
  }
  .verdict.lost {
    background: var(--color-danger-subtle);
  }
</style>
