<script lang="ts">
  /** Course finale: the mascot graduates with the learner, plus where to go next. */
  import { format, getDictionary, type Locale } from "@nostrschool/i18n";
  import { Mascot } from "@nostrschool/mascot";
  import { Button, burstFrom, emit, pop } from "@nostrschool/ui";
  import { onMount } from "svelte";
  import { type Completed, progress } from "~/components/shell/lib/progress.ts";
  import { CHAPTERS } from "~/lib/chapters";
  import { href, mascotRive } from "~/lib/href";
  import { RESOURCE_LINKS, TOOL_LINKS } from "./resources.ts";

  const { locale }: { readonly locale: Locale } = $props();
  const t = $derived(getDictionary(locale).chapters.ch12.complete);

  let completed = $state.raw<Completed>([]);
  let celebrated = $state(false);
  let party = $state<HTMLElement>();

  $effect(() =>
    progress.$completed.subscribe((value) => {
      completed = value;
    }),
  );

  // The island hydrates when scrolled into view (client:visible), i.e. when the learner arrives.
  onMount(() => emit("celebrate", { reason: "ch12-course-complete" }));

  const celebrate = async () => {
    celebrated = true;
    emit("celebrate", { reason: "ch12-graduation" });
    if (party !== undefined) await burstFrom(party);
  };
</script>

<section class="finale" data-testid="ch12-complete" aria-labelledby="ch12-complete-title">
  <div class="hero" bind:this={party}>
    <div class="mascot">
      <Mascot
        {locale}
        size="lg"
        pose="celebrate"
        say={t.mascotSay}
        testid="ch12-complete-mascot"
        {...mascotRive}
      />
    </div>
    <div class="copy">
      <h3 id="ch12-complete-title" class="title">{t.title}</h3>
      <p>{t.body}</p>
      <p class="progress" data-testid="ch12-complete-progress">
        {format(t.progress, { done: completed.length, total: CHAPTERS.length })}
      </p>
      <Button testid="ch12-celebrate" onclick={celebrate}>{t.celebrate}</Button>
      <p class="cheer" aria-live="polite" data-testid="ch12-celebrate-status">
        {#if celebrated}
          <span use:pop={{ spring: "wobbly" }}>{t.celebrated}</span>
        {/if}
      </p>
    </div>
  </div>

  <h3 class="next">{t.nextTitle}</h3>
  <div class="columns">
    <div>
      <h4 class="subtitle">{t.toolsTitle}</h4>
      <ul class="links">
        {#each TOOL_LINKS as link (link.id)}
          <li>
            <a class="link" href={href(locale, link.path)} data-testid="ch12-next-{link.id}">
              {t.tools[link.id]}
            </a>
          </li>
        {/each}
      </ul>
    </div>
    <div>
      <h4 class="subtitle">{t.resourcesTitle}</h4>
      <ul class="links">
        {#each RESOURCE_LINKS as link (link.id)}
          <li>
            <a
              class="link"
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="ch12-resource-{link.id}"
            >
              {t.resources[link.id].label}
              <span class="visually-hidden">{t.externalHint}</span>
            </a>
            <span class="link-hint">{t.resources[link.id].hint}</span>
          </li>
        {/each}
      </ul>
    </div>
  </div>
</section>

<style>
  .finale {
    display: grid;
    gap: var(--space-lg);
    padding: var(--space-xl) var(--space-lg);
    border: var(--border-width-thick) solid var(--color-primary);
    border-radius: var(--radius-xl);
    background: var(--color-primary-subtle);
    box-shadow: var(--shadow-pop);
  }
  .hero {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: var(--space-lg);
  }
  .mascot {
    min-block-size: var(--size-mascot-lg);
  }
  .copy {
    flex: 1 1 var(--size-rail);
    display: grid;
    gap: var(--space-sm);
    justify-items: start;
  }
  .copy p {
    margin: 0;
  }
  .title {
    margin: 0;
    font-family: var(--font-family-display);
    font-size: var(--font-size-3xl);
    line-height: var(--font-line-height-tight);
    color: var(--color-text-primary);
  }
  .progress {
    font-weight: var(--font-weight-bold);
  }
  .cheer {
    min-block-size: var(--font-size-lg);
    font-weight: var(--font-weight-bold);
  }
  .cheer span {
    display: inline-block;
  }
  .next {
    margin: 0;
    font-family: var(--font-family-display);
    font-size: var(--font-size-xl);
  }
  .columns {
    display: grid;
    gap: var(--space-lg);
  }
  .subtitle {
    margin: 0 0 var(--space-xs);
    font-size: var(--font-size-md);
  }
  .links {
    display: grid;
    gap: var(--space-xs);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .link {
    display: inline-flex;
    align-items: center;
    min-block-size: var(--size-touch-target);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
  }
  .link:focus-visible {
    outline: var(--border-width-thick) solid var(--color-focus-ring);
    outline-offset: var(--space-3xs);
  }
  .link-hint {
    display: block;
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
  }
  /* tokens.breakpoint.md = 768px */
  @media (min-width: 768px) {
    .columns {
      grid-template-columns: 1fr 1fr;
    }
  }
</style>
