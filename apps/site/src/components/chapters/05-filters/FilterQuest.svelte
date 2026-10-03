<script lang="ts">
  /**
   * Filter quests: the builder plus goal cards. A quest is solved when the relay's answer equals
   * the target set, whatever filter produced it — there is more than one right filter.
   */
  import { FIXTURE_EVENTS } from "@nostrschool/fixtures";
  import { format, getDictionary, type Locale } from "@nostrschool/i18n";
  import { mascotBus, pop } from "@nostrschool/ui";
  import { untrack } from "svelte";
  import FilterBuilder from "./FilterBuilder.svelte";
  import {
    draftToFilter,
    EMPTY_DRAFT,
    evaluate,
    type FilterDraft,
    QUEST_IDS,
    type QuestId,
    solvedQuests,
  } from "./filter-logic.ts";

  interface Props {
    readonly locale: Locale;
    /** Parts: `-quest-<id>` (`data-solved`), `-progress`, `-announce`, plus the builder's parts under `-builder`. */
    readonly testid?: string;
  }

  const { locale, testid = "ch05-quest" }: Props = $props();
  const t = $derived(getDictionary(locale).chapters.ch05.quest);
  let draft = $state<FilterDraft>(EMPTY_DRAFT);
  let solved = $state<readonly QuestId[]>([]);
  let announcement = $state("");

  $effect(() => {
    const now = solvedQuests(evaluate(draftToFilter(draft), FIXTURE_EVENTS).returnedIds);
    const before = untrack(() => solved);
    const fresh = now.filter((id) => !before.includes(id));
    if (fresh.length === 0) return;
    solved = [...before, ...fresh];
    for (const id of fresh) mascotBus.emit("celebrate", { reason: `${testid}-${id}` });
    announcement =
      before.length + fresh.length === QUEST_IDS.length
        ? t.allSolved
        : fresh.map((id) => format(t.solvedAnnounce, { title: t.items[id].title })).join(" ");
  });
</script>

{#snippet goals()}
  <div class="quests">
    <p class="intro">{t.description}</p>
    <ol class="list">
      {#each QUEST_IDS as id (id)}
        {@const done = solved.includes(id)}
        <li class="quest" class:done data-solved={done} data-testid="{testid}-quest-{id}">
          <span class="badge" aria-hidden="true">
            {#if done}
              <span use:pop>★</span>
            {:else}
              ☆
            {/if}
          </span>
          <span class="text">
            <strong>{t.items[id].title}</strong>
            <span>{t.items[id].goal}</span>
            {#if done}
              <span class="solved">{t.solved}</span>
            {/if}
          </span>
        </li>
      {/each}
    </ol>
    <p class="progress" data-testid="{testid}-progress">
      {format(t.progress, { count: solved.length, total: QUEST_IDS.length })}
    </p>
    <p class="visually-hidden" aria-live="polite" data-testid="{testid}-announce">{announcement}</p>
  </div>
{/snippet}

<div data-testid={testid} data-solved={solved.length}>
  <FilterBuilder {locale} testid="{testid}-builder" bind:draft extra={goals} />
</div>

<style>
  .quests {
    display: grid;
    gap: var(--space-xs);
    padding: var(--space-sm) var(--space-md);
    border-radius: var(--radius-lg);
    background: var(--color-secondary-subtle);
  }
  .intro,
  .progress {
    margin: 0;
  }
  .progress {
    font-weight: var(--font-weight-bold);
  }
  .list {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, calc(var(--size-rail) * 0.8)), 1fr));
    gap: var(--space-xs);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .quest {
    display: flex;
    gap: var(--space-xs);
    padding: var(--space-xs) var(--space-sm);
    border: var(--border-width-medium) dashed var(--color-border-strong);
    border-radius: var(--radius-md);
    background: var(--color-surface);
    transition:
      border-color var(--motion-duration-normal) var(--motion-easing-standard),
      transform var(--motion-duration-slow) var(--motion-easing-bounce);
  }
  .quest.done {
    border-style: solid;
    border-color: var(--color-success);
    transform: rotate(-0.5deg);
  }
  .badge {
    font-size: var(--font-size-xl);
    line-height: var(--font-line-height-tight);
    color: var(--color-text-accent);
  }
  .badge span {
    display: inline-block;
  }
  .text {
    display: grid;
    gap: var(--space-3xs);
    font-size: var(--font-size-sm);
  }
  .solved {
    justify-self: start;
    padding: 0 var(--space-xs);
    border-radius: var(--radius-pill);
    background: var(--color-success-subtle);
    font-weight: var(--font-weight-bold);
  }
</style>
