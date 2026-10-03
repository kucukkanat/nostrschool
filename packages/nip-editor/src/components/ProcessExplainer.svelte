<script lang="ts">
  import {
    PACKET_COLORS,
    type PacketType,
    SequenceDiagram,
    type SequenceMessage,
  } from "@nostrschool/diagrams";
  import { editorStrings, nipText } from "../logic/text.ts";
  import type { ProcessExplainerProps } from "../types.ts";

  let {
    testid,
    locale,
    nip,
    process,
    step = $bindable(-1),
    onopenpart,
  }: ProcessExplainerProps = $props();
  const t = $derived(editorStrings(locale));
  const text = $derived(nipText(locale, nip));
  const packet = (p: string | undefined): PacketType =>
    p !== undefined && p in PACKET_COLORS ? (p as PacketType) : "custom";
  const lanes = $derived(
    process.actors.map((a) => ({ id: a.id, label: text(a.label), kind: a.kind })),
  );
  // A local action (no `to`) is drawn as a self-arrow on the actor's own lane.
  const messages = $derived<readonly SequenceMessage[]>(
    process.steps.map((s) => ({
      id: s.id,
      from: s.from,
      to: s.to ?? s.from,
      label: text(s.label),
      packet: packet(s.packet),
      narration: text(s.explain),
      ...(s.payload === undefined ? {} : { payload: s.payload }),
    })),
  );
</script>

<section class="process" data-testid={testid} aria-labelledby="{testid}-title">
  <h3 class="title" id="{testid}-title">{t.process.title}</h3>
  <div data-testid="{testid}-diagram">
    <SequenceDiagram
      testid="{testid}-seq"
      {locale}
      title={t.process.title}
      {lanes}
      {messages}
      bind:step
    />
  </div>
  <ol class="steps" aria-label={t.process.steps}>
    {#each process.steps as s, i (s.id)}
      <li
        class="step"
        data-testid="{testid}-step-{s.id}"
        aria-current={i === step ? "step" : undefined}
      >
        <button type="button" class="pick" onclick={() => (step = i)}>
          <span class="n">{i + 1}</span>
          <span class="lbl">{text(s.label)}</span>
        </button>
        {#if i === step}
          <p class="body">{text(s.explain)}</p>
          {#if s.part !== undefined && onopenpart !== undefined}
            {@const target = s.part}
            <button
              type="button"
              class="open"
              data-testid="{testid}-step-{s.id}-open"
              onclick={() => onopenpart(target)}
            >
              {t.process.open}
              →
            </button>
          {/if}
        {/if}
      </li>
    {/each}
  </ol>
</section>

<style>
  .process {
    display: grid;
    gap: var(--space-md);
    min-inline-size: 0;
  }
  .title {
    margin: 0;
    font-family: var(--font-family-display);
    font-size: var(--font-size-lg);
  }
  .steps {
    display: grid;
    gap: var(--space-xs);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .step {
    display: grid;
    gap: var(--space-xs);
    padding: var(--space-xs);
    border: var(--border-width-thin) solid var(--color-border);
    border-radius: var(--radius-sm);
  }
  .step[aria-current="step"] {
    border: var(--border-width-medium) solid var(--color-border-strong);
    background: var(--color-surface-raised);
    box-shadow: var(--shadow-pop-sm);
  }
  .pick {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    min-block-size: var(--size-touch-target);
    padding: 0;
    border: none;
    background: none;
    color: var(--color-text);
    font: inherit;
    text-align: start;
    cursor: pointer;
  }
  .n {
    display: inline-grid;
    place-items: center;
    flex: none;
    inline-size: var(--size-icon-lg);
    block-size: var(--size-icon-lg);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-round);
    background: var(--color-highlight);
    color: var(--color-on-highlight);
    font-family: var(--font-family-mono);
    font-weight: var(--font-weight-bold);
  }
  .lbl {
    font-weight: var(--font-weight-semibold);
  }
  .body {
    margin: 0;
    line-height: var(--font-line-height-relaxed);
  }
  .open {
    justify-self: start;
    min-block-size: var(--size-control-sm);
    padding: 0 var(--space-sm);
    border: var(--border-width-thin) solid var(--color-border-strong);
    border-radius: var(--radius-sm);
    background: var(--color-surface);
    color: var(--color-text);
    font: inherit;
    cursor: pointer;
    box-shadow: var(--shadow-pressed);
  }
  .pick:focus-visible,
  .open:focus-visible {
    outline: var(--border-width-thick) solid var(--color-focus-ring);
    outline-offset: var(--size-focus-offset);
  }
  @media (pointer: coarse) {
    .open {
      min-block-size: var(--size-touch-target);
    }
  }
</style>
