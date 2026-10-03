<script lang="ts">
  /**
   * Chapter 04 centerpiece: three scripted wire conversations (read / publish / auth) played on
   * a SequenceDiagram, with a clickable packet legend and the client's "notebook" — a live view
   * of the bookkeeping that makes clients smart while relays stay simple.
   */
  import { Packet, SequenceDiagram, type SequenceMessage } from "@nostrschool/diagrams";
  import { format, getDictionary, type Locale } from "@nostrschool/i18n";
  import type { MessageType } from "@nostrschool/protocol";
  import { CodeBlock, emit, pop, Tabs } from "@nostrschool/ui";
  import {
    AUTH_EVENT,
    firstStepOf,
    type LaneId,
    LEGEND_VERBS,
    lanesFor,
    messagesFor,
    notebookAt,
    SCENARIO_IDS,
    SCRIPTS,
    type ScenarioId,
  } from "./wire.ts";

  interface Props {
    readonly locale: Locale;
    /** Initial conversation (default "read"). */
    readonly scenario?: ScenarioId;
    /** Autoplay delay override (tests); defaults to the diagram's step token. */
    readonly stepMs?: number;
  }
  const { locale, scenario: initial = "read", stepMs }: Props = $props();
  const t = $derived(getDictionary(locale).chapters.ch04);

  // The prop only seeds the tab; the learner owns it after that.
  // svelte-ignore state_referenced_locally
  let scenario: ScenarioId = $state(initial);
  let step = $state(-1);
  let playing = $state(false);

  const lanes = $derived(lanesFor(scenario, locale));
  const messages = $derived(messagesFor(scenario, locale));
  const last = $derived(messages.length - 1);
  const notebook = $derived(notebookAt(SCRIPTS[scenario], step));
  const dupes = $derived(notebook.received - notebook.unique);
  const tabs = $derived(SCENARIO_IDS.map((id) => ({ id, label: t.theater.scenarios[id].label })));

  const isScenario = (id: string): id is ScenarioId => SCENARIO_IDS.some((s) => s === id);
  const choose = (id: string): void => {
    if (!isScenario(id)) return;
    scenario = id;
    step = -1;
    playing = false;
  };
  const jump = (verb: MessageType): void => {
    playing = false;
    step = firstStepOf(scenario, verb);
  };
  const laneName = (id: string): string => lanes.find((l) => l.id === id)?.label ?? id;
  const names = (ids: readonly LaneId[]): string =>
    ids.length === 0 ? t.theater.notebook.none : ids.map(laneName).join(", ");

  // The mascot reacts to the two "aha" moments: a signature-based login, and a finished story.
  const onstep = (index: number, message: SequenceMessage | undefined): void => {
    const frame = message?.payload;
    if (Array.isArray(frame) && frame[0] === "OK" && frame[1] === AUTH_EVENT.id)
      emit("signature:valid", { eventId: AUTH_EVENT.id });
    if (index === last && last >= 0) emit("celebrate", { reason: `ch04-${scenario}` });
  };
</script>

<section class="theater" data-testid="ch04-theater" data-scenario={scenario}>
  <Tabs
    testid="ch04-scenario"
    label={t.theater.scenarioLabel}
    {tabs}
    selected={scenario}
    onchange={choose}
  >
    {#snippet panel(
      id,
    )}
      <p class="intro" data-testid="ch04-scenario-intro">
        {isScenario(id) ? t.theater.scenarios[id].intro : ""}
      </p>
    {/snippet}
  </Tabs>

  <fieldset class="legend" data-testid="ch04-legend">
    <legend class="visually-hidden">{t.theater.legendTitle}</legend>
    {#each LEGEND_VERBS as verb (verb)}
      {@const at = firstStepOf(scenario, verb)}
      <button
        type="button"
        class="chip"
        data-testid="ch04-legend-{verb}"
        data-current={messages[step]?.packet === verb}
        disabled={at < 0}
        aria-label={format(at < 0 ? t.theater.notInScenario : t.theater.jumpTo, { verb })}
        title={t.verbs[verb]}
        onclick={() => jump(verb)}
      >
        <Packet type={verb} size="sm" testid="ch04-legend-{verb}-packet" />
      </button>
    {/each}
  </fieldset>

  <div class="stage">
    <div class="diagram">
      {#key scenario}
        <SequenceDiagram
          testid="ch04-wire"
          {locale}
          title={t.theater.title}
          description={t.theater.description}
          {lanes}
          {messages}
          bind:step
          bind:playing
          {onstep}
          {...stepMs === undefined ? {} : { stepMs }}
        >
          {#snippet detail(
            message,
          )}
            <div class="detail" data-testid="ch04-detail" data-verb={message.packet}>
              <div class="detail-head">
                <Packet type={message.packet ?? "custom"} testid="ch04-detail-packet" />
                <span class="route" data-testid="ch04-detail-route">
                  {format(t.theater.direction, {
                    from: laneName(message.from),
                    to: laneName(message.to),
                  })}
                </span>
                <span class="count">
                  {format(t.theater.stepOf, { n: step + 1, total: messages.length })}
                </span>
              </div>
              <p class="verb" data-testid="ch04-detail-verb">
                {t.verbs[message.packet ?? "custom"]}
              </p>
              <CodeBlock
                testid="ch04-detail-frame"
                {locale}
                lang="json"
                caption={t.theater.rawFrame}
                code={JSON.stringify(message.payload, null, 2)}
              />
            </div>
          {/snippet}
        </SequenceDiagram>
      {/key}
    </div>

    <aside class="notebook" data-testid="ch04-notebook" aria-labelledby="ch04-notebook-title">
      <h3 id="ch04-notebook-title" class="nb-title">{t.theater.notebook.title}</h3>
      <p class="nb-desc">{t.theater.notebook.description}</p>
      <dl>
        <div class="row">
          <dt>{t.theater.notebook.open}</dt>
          {#key notebook.open.join()}
            <dd data-testid="ch04-nb-open" use:pop>{names(notebook.open)}</dd>
          {/key}
        </div>
        {#if scenario === "read"}
          <div class="row">
            <dt>{t.theater.notebook.received}</dt>
            {#key notebook.received}
              <dd data-testid="ch04-nb-received" use:pop>{notebook.received}</dd>
            {/key}
          </div>
          <div class="row">
            <dt>{t.theater.notebook.unique}</dt>
            {#key notebook.unique}
              <dd data-testid="ch04-nb-unique" use:pop>
                {notebook.unique}
                {#if dupes > 0}
                  <span class="note" data-testid="ch04-nb-dupes">
                    ({format(
                      dupes === 1 ? t.theater.notebook.dedupe : t.theater.notebook.dedupePlural,
                      { dupes },
                    )})
                  </span>
                {/if}
              </dd>
            {/key}
          </div>
        {:else if scenario === "publish"}
          <div class="row">
            <dt>{t.theater.notebook.accepted}</dt>
            {#key notebook.accepted.join()}
              <dd data-testid="ch04-nb-accepted" use:pop>{names(notebook.accepted)}</dd>
            {/key}
          </div>
          <div class="row">
            <dt>{t.theater.notebook.rejected}</dt>
            {#key notebook.rejected.join()}
              <dd data-testid="ch04-nb-rejected" use:pop>{names(notebook.rejected)}</dd>
            {/key}
          </div>
        {:else}
          <div class="row">
            <dt>{t.theater.notebook.authed}</dt>
            {#key notebook.authed.join()}
              <dd data-testid="ch04-nb-authed" use:pop>{names(notebook.authed)}</dd>
            {/key}
          </div>
        {/if}
      </dl>
      {#if step === last}
        <p class="done" data-testid="ch04-done" use:pop>{t.theater.done[scenario]}</p>
      {/if}
    </aside>
  </div>
</section>

<style>
  .theater {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
    min-height: var(--size-diagram-min-height);
    margin: var(--space-lg) 0;
  }
  .intro {
    margin: var(--space-xs) 0 0;
    color: var(--color-text-muted);
  }
  .legend {
    min-width: 0;
    margin: 0;
    padding: 0;
    border: 0;
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2xs);
  }
  .chip {
    display: inline-flex;
    min-height: var(--size-touch-target);
    min-inline-size: var(--size-touch-target);
    align-items: center;
    justify-content: center;
    padding: var(--space-3xs);
    border: var(--border-width-medium) solid transparent;
    border-radius: var(--radius-md);
    background: none;
    cursor: pointer;
    transition:
      translate var(--motion-duration-press) var(--motion-easing-press),
      box-shadow var(--motion-duration-press) var(--motion-easing-press),
      border-color var(--motion-duration-fast) var(--motion-easing-standard);
  }
  .chip:hover:not(:disabled) {
    translate: calc(var(--size-lift) * -1) calc(var(--size-lift) * -1);
  }
  .chip:active:not(:disabled) {
    translate: var(--size-lift) var(--size-lift);
  }
  .chip:focus-visible {
    outline: var(--border-width-thick) solid var(--color-focus-ring);
    outline-offset: var(--space-3xs);
  }
  .chip[data-current="true"] {
    border-color: var(--color-border-strong);
    box-shadow: var(--shadow-accent);
  }
  /* Not in this scenario: a dashed ink frame says so; the packet keeps full contrast (no fading). */
  .chip:disabled {
    border-style: dashed;
    border-color: var(--color-border-strong);
    cursor: not-allowed;
  }
  .stage {
    display: grid;
    gap: var(--space-md);
    grid-template-columns: minmax(0, 1fr);
  }
  /* 1024px = tokens.breakpoint.lg: room for the notebook beside the diagram. */
  @media (min-width: 1024px) {
    .stage {
      grid-template-columns: minmax(0, 1fr) var(--size-rail);
      align-items: start;
    }
  }
  .diagram {
    min-width: 0;
  }
  .detail {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }
  .detail-head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-xs);
  }
  .route {
    font-weight: var(--font-weight-bold);
  }
  .count {
    margin-left: auto;
    font-size: var(--font-size-xs);
  }
  .verb {
    margin: 0;
    font-size: var(--font-size-sm);
  }
  .notebook {
    padding: var(--space-md);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-lg);
    background: var(--color-surface-raised);
    color: var(--color-text);
    box-shadow: var(--shadow-pop-sm);
  }
  .nb-title {
    margin: 0;
    font-family: var(--font-family-display);
    font-size: var(--font-size-lg);
  }
  .nb-desc {
    margin: var(--space-2xs) 0 var(--space-sm);
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
  }
  dl {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
    margin: 0;
  }
  .row {
    display: flex;
    flex-direction: column;
    gap: var(--space-3xs);
  }
  dt {
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-bold);
    letter-spacing: var(--font-letter-spacing-caps);
    text-transform: uppercase;
    color: var(--color-text-muted);
  }
  dd {
    margin: 0;
    font-family: var(--font-family-mono);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
  }
  .note {
    font-family: var(--font-family-body);
    font-weight: var(--font-weight-regular);
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
  }
  .done {
    margin: var(--space-sm) 0 0;
    padding: var(--space-xs) var(--space-sm);
    border-radius: var(--radius-md);
    background: var(--color-success-subtle);
    color: var(--color-text);
    font-weight: var(--font-weight-bold);
  }
</style>
