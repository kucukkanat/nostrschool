<script lang="ts">
  import { format } from "@nostrschool/i18n";
  import { editorStrings, nipText } from "../logic/text.ts";
  import type { HowItWorksProps } from "../types.ts";
  import ProcessExplainer from "./ProcessExplainer.svelte";

  let { testid, locale, spec, step = $bindable(0), onfocus }: HowItWorksProps = $props();
  const t = $derived(editorStrings(locale));
  const text = $derived(nipText(locale, spec.nip));
  const steps = $derived(spec.howItWorks);
  const current = $derived(Math.max(0, Math.min(step, steps.length - 1)));
  const active = $derived(steps[current]);
  const go = (i: number) => {
    step = Math.max(0, Math.min(i, steps.length - 1));
    const focus = steps[step]?.focus;
    if (focus !== undefined) onfocus?.(focus);
  };
</script>

{#if steps.length > 0 || spec.process !== undefined}
  <section class="how" data-testid={testid} aria-labelledby="{testid}-title">
    <h3 class="title" id="{testid}-title">{t.howItWorks.title}</h3>
    {#if steps.length > 0}
      <ol class="rail">
        {#each steps as s, i (s.id)}
          <li>
            <button
              type="button"
              class="dot"
              data-testid="{testid}-step-{s.id}"
              aria-current={i === current ? "step" : undefined}
              aria-label="{format(t.howItWorks.step, { n: i + 1, total: steps.length })}: {text(
                s.title,
              )}"
              onclick={() => go(i)}
            >
              {i + 1}
            </button>
          </li>
        {/each}
      </ol>
      {#if active !== undefined}
        <article class="card" aria-live="polite">
          <p class="count">{format(t.howItWorks.step, { n: current + 1, total: steps.length })}</p>
          <h4 class="step-title">{text(active.title)}</h4>
          <p class="body">{text(active.body)}</p>
          {#if active.focus !== undefined && onfocus !== undefined}
            {@const focus = active.focus}
            <button
              type="button"
              class="show"
              data-testid="{testid}-show"
              onclick={() => onfocus(focus)}
            >
              {t.howItWorks.show}
              →
            </button>
          {/if}
        </article>
      {/if}
      <div class="controls" data-testid="{testid}-controls">
        <button
          type="button"
          class="nav"
          data-testid="{testid}-prev"
          disabled={current === 0}
          onclick={() => go(current - 1)}
        >
          ← {t.howItWorks.prev}
        </button>
        <button
          type="button"
          class="nav primary"
          data-testid="{testid}-next"
          disabled={current === steps.length - 1}
          onclick={() => go(current + 1)}
        >
          {t.howItWorks.next}
          →
        </button>
      </div>
    {/if}
    {#if spec.process !== undefined}
      <ProcessExplainer
        testid="{testid}-process"
        {locale}
        nip={spec.nip}
        process={spec.process}
        onopenpart={onfocus === undefined ? undefined : (part) => onfocus({ part })}
      />
    {/if}
  </section>
{/if}

<style>
  .how {
    display: grid;
    gap: var(--space-md);
    min-inline-size: 0;
  }
  .title {
    margin: 0;
    font-family: var(--font-family-display);
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-bold);
    letter-spacing: var(--font-letter-spacing-tight);
  }
  /* Numbered stops along a hand-ruled line. */
  .rail {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-xs);
    margin: 0;
    padding: 0;
    list-style: none;
    position: relative;
  }
  .rail::before {
    content: "";
    position: absolute;
    inset-inline: 0;
    inset-block-start: calc(50% - var(--border-width-medium) / 2);
    block-size: var(--border-width-medium);
    background: var(--color-border-strong);
  }
  .rail li {
    position: relative;
  }
  .dot {
    inline-size: var(--size-touch-target);
    block-size: var(--size-touch-target);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-round);
    background: var(--color-surface);
    color: var(--color-text);
    font-family: var(--font-family-mono);
    font-weight: var(--font-weight-bold);
    cursor: pointer;
    transition:
      box-shadow var(--motion-duration-press) var(--motion-easing-press),
      translate var(--motion-duration-press) var(--motion-easing-press);
  }
  .dot[aria-current="step"] {
    background: var(--color-primary);
    color: var(--color-on-primary);
    box-shadow: var(--shadow-pop-sm);
    translate: calc(var(--size-lift) * -1) calc(var(--size-lift) * -1);
  }
  .card {
    display: grid;
    gap: var(--space-xs);
    padding: var(--space-md);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-md);
    background: var(--color-surface-raised);
    box-shadow: var(--shadow-pop);
  }
  .count {
    margin: 0;
    color: var(--color-text-muted);
    font-family: var(--font-family-mono);
    font-size: var(--font-size-xs);
    letter-spacing: var(--font-letter-spacing-caps);
    text-transform: uppercase;
  }
  .step-title {
    justify-self: start;
    margin: 0;
    font-family: var(--font-family-display);
    font-size: var(--font-size-lg);
    /* Site highlighter convention: swipe on light paper, solid line box on dark paper, always
       inked in --color-on-highlight so the title stays legible on the yellow in both themes. */
    background: var(--highlight-fill, var(--color-highlight));
    color: var(--color-on-highlight);
  }
  .body {
    margin: 0;
    line-height: var(--font-line-height-relaxed);
  }
  .controls {
    display: flex;
    justify-content: space-between;
    gap: var(--space-sm);
  }
  .nav,
  .show {
    min-block-size: var(--size-touch-target);
    padding: 0 var(--space-md);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-md);
    background: var(--color-surface);
    color: var(--color-text);
    font-family: var(--font-family-display);
    font-weight: var(--font-weight-semibold);
    cursor: pointer;
    box-shadow: var(--shadow-pop-sm);
    transition:
      box-shadow var(--motion-duration-press) var(--motion-easing-press),
      translate var(--motion-duration-press) var(--motion-easing-press);
  }
  .show {
    justify-self: start;
    box-shadow: var(--shadow-pressed);
  }
  .nav.primary {
    background: var(--color-primary);
    color: var(--color-on-primary);
  }
  .nav:active:not(:disabled),
  .show:active,
  .dot:active {
    translate: var(--size-lift) var(--size-lift);
    box-shadow: var(--shadow-pressed);
  }
  .nav:disabled {
    opacity: var(--opacity-disabled);
    box-shadow: var(--shadow-pressed);
    cursor: not-allowed;
  }
  .nav:focus-visible,
  .show:focus-visible,
  .dot:focus-visible {
    outline: var(--border-width-thick) solid var(--color-focus-ring);
    outline-offset: var(--size-focus-offset);
  }
</style>
