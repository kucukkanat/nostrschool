<script lang="ts">
  import { Swimlane, type SwimlaneStep } from "@nostrschool/diagrams";
  import { zaps } from "@nostrschool/fixtures";
  import { format, formatNumber, getDictionary, type Locale } from "@nostrschool/i18n";
  import type { Result } from "@nostrschool/protocol";
  import { Callout, emit, JsonView, pop } from "@nostrschool/ui";
  import {
    buildZapFlow,
    stepPayload,
    ZAP_LANES,
    ZAP_STEPS,
    type ZapError,
    type ZapFlow,
  } from "./zap-logic.ts";

  const all = zaps();
  // Fixture data is committed and tested; a failure here is shown, never hidden. `flows` is a
  // prop only so tests can feed real failed Results through the same rendering path.
  const {
    locale,
    flows = all.map((z) => buildZapFlow(z, all)),
  }: {
    readonly locale: Locale;
    readonly flows?: readonly Result<ZapFlow, ZapError>[];
  } = $props();
  const t = $derived(getDictionary(locale).chapters.ch09.flow);

  let selected = $state(0);
  let current = $state(0);
  let playing = $state(false);

  const result = $derived(flows[selected]);
  const flow = $derived(result?.ok === true ? result.value : undefined);
  const sats = (msats: number): string =>
    format(t.sats, { amount: formatNumber(locale, msats / 1000) });

  const params = $derived(
    flow === undefined
      ? {}
      : {
          sender: flow.sender.displayName,
          recipient: flow.recipient.displayName,
          lud16: flow.recipient.lud16,
          sats: sats(flow.zap.amountMsats),
        },
  );
  const lanes = $derived(ZAP_LANES.map((id) => ({ id, label: t.lanes[id] })));
  const steps = $derived(
    ZAP_STEPS.map(
      (s): SwimlaneStep => ({
        id: s.id,
        lane: s.lane,
        label: t.steps[s.id].label,
        narration: `${t.steps[s.id].title}. ${format(t.steps[s.id].body, params)}`,
        ...(s.to === undefined ? {} : { to: s.to }),
        ...(s.packet === undefined ? {} : { packet: s.packet }),
      }),
    ),
  );
  const def = $derived(ZAP_STEPS[current]);
  const payload = $derived(
    flow === undefined || def === undefined ? undefined : stepPayload(flow, def.id),
  );
  const receiptIndex = ZAP_STEPS.findIndex((s) => s.id === "receipt");
  const tallyIndex = ZAP_STEPS.findIndex((s) => s.id === "tally");
  const published = $derived(current >= receiptIndex);

  const choose = (i: number): void => {
    selected = i;
    current = 0;
    playing = false;
  };

  const onstep = (index: number): void => {
    if (index === receiptIndex) emit("celebrate", { reason: "zap-receipt" });
  };
</script>

<section class="zap-flow" data-testid="ch09-flow" aria-labelledby="ch09-flow-pick-legend">
  <fieldset class="picker" data-testid="ch09-flow-picker">
    <legend id="ch09-flow-pick-legend">{t.pickLabel}</legend>
    <div class="chips">
      {#each flows as f, i (i)}
        {#if f.ok}
          <label class="chip" class:active={i === selected} data-testid="ch09-flow-pick-{i}">
            <input
              type="radio"
              name="ch09-zap"
              value={i}
              checked={i === selected}
              onchange={() => choose(i)}
              data-testid="ch09-flow-pick-{i}-input"
            >
            <img class="avatar" src={f.value.sender.avatar} alt="">
            <span>
              {format(t.pickOption, {
                sender: f.value.sender.displayName,
                recipient: f.value.recipient.displayName,
                sats: sats(f.value.zap.amountMsats),
              })}
            </span>
          </label>
        {:else}
          <p role="alert" data-testid="ch09-flow-error-{i}">{f.error.message}</p>
        {/if}
      {/each}
    </div>
    <p class="note" data-testid="ch09-flow-fixture-note">{t.fixtureNote}</p>
  </fieldset>

  {#if flows.length === 0}
    <p data-testid="ch09-flow-empty">{t.noZaps}</p>
  {:else}
    <Swimlane
      testid="ch09-swimlane"
      {locale}
      title={t.title}
      description={t.description}
      {lanes}
      {steps}
      bind:current
      bind:playing
      {onstep}
    />
  {/if}

  {#if flow !== undefined && def !== undefined && payload !== undefined}
    <div class="detail" data-testid="ch09-flow-detail" data-step={def.id}>
      {#key `${selected}-${def.id}`}
        <div class="detail-head" use:pop>
          <span class="step-no" aria-hidden="true">{String(current + 1).padStart(2, "0")}</span>
          <div>
            <h3 class="detail-title" data-testid="ch09-flow-detail-title">
              {t.steps[def.id].title}
            </h3>
            <p class="detail-body" data-testid="ch09-flow-detail-body">
              {format(t.steps[def.id].body, params)}
            </p>
          </div>
        </div>
      {/key}
      <div class="counter" class:lit={current >= tallyIndex} data-testid="ch09-flow-counter">
        <span class="counter-label">{t.zapCounter}</span>
        {#key current >= tallyIndex}
          <strong
            class="counter-value"
            data-testid="ch09-flow-counter-value"
            use:pop={{ spring: "wobbly" }}
          >
            {current >= tallyIndex
              ? format(t.zapCounterValue, { sats: sats(flow.tallyMsats) })
              : "⚡ —"}
          </strong>
        {/key}
      </div>
      {#if published}
        <div class="toast-slot">
          {#key selected}
            <p class="toast" data-testid="ch09-flow-toast" use:pop={{ spring: "bouncy" }}>
              {t.receiptToast}
            </p>
          {/key}
        </div>
      {/if}
      <h4 class="payload-title">{t.payloadTitle}</h4>
      <div class="payload">
        <JsonView
          testid="ch09-flow-payload"
          {locale}
          value={payload.value}
          highlightPaths={payload.highlight}
          collapsedDepth={3}
        />
      </div>
    </div>
  {:else if result !== undefined && !result.ok}
    <Callout testid="ch09-flow-failure" {locale} tone="danger">{result.error.message}</Callout>
  {/if}
</section>

<style>
  .zap-flow {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
    min-height: var(--size-diagram-min-height);
    margin: var(--space-lg) 0;
  }
  .picker {
    margin: 0;
    padding: 0;
    border: none;
    min-width: 0;
  }
  legend {
    font-family: var(--font-family-display);
    font-weight: var(--font-weight-bold);
    margin-bottom: var(--space-xs);
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-xs);
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: var(--space-xs);
    min-height: var(--size-touch-target);
    padding: var(--space-2xs) var(--space-sm);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-md);
    background: var(--color-surface);
    color: var(--color-text);
    font-weight: var(--font-weight-semibold);
    cursor: pointer;
    box-shadow: var(--shadow-pop-sm);
    transition:
      translate var(--motion-duration-press) var(--motion-easing-press),
      box-shadow var(--motion-duration-press) var(--motion-easing-press),
      background-color var(--motion-duration-fast) var(--motion-easing-standard);
  }
  .chip:hover {
    translate: calc(var(--size-lift) * -1) calc(var(--size-lift) * -1);
    box-shadow: var(--shadow-lift);
  }
  .chip:active {
    translate: var(--size-lift) var(--size-lift);
    box-shadow: var(--shadow-pressed);
  }
  .chip.active {
    background: var(--color-primary-subtle);
    border-color: var(--color-border-strong);
    box-shadow: var(--shadow-accent);
  }
  .chip:has(input:focus-visible) {
    outline: var(--border-width-thick) solid var(--color-focus-ring);
    outline-offset: var(--space-3xs);
  }
  .chip input {
    position: absolute;
    opacity: 0;
    width: 1px;
    height: 1px;
  }
  .avatar {
    width: var(--size-avatar-sm);
    height: var(--size-avatar-sm);
    border-radius: var(--radius-round);
  }
  .note {
    margin: var(--space-xs) 0 0;
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
  }
  .detail {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
    padding: var(--space-md);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-lg);
    background: var(--color-surface-raised);
    box-shadow: var(--shadow-pop);
    min-width: 0;
  }
  .detail-head {
    display: flex;
    gap: var(--space-sm);
    align-items: flex-start;
  }
  /* Field-notebook step number instead of a decorative emoji. */
  .step-no {
    flex: none;
    display: inline-grid;
    place-items: center;
    min-inline-size: var(--size-control-md);
    block-size: var(--size-control-md);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-sm);
    background: var(--color-highlight);
    color: var(--color-on-highlight);
    font-family: var(--font-family-mono);
    font-weight: var(--font-weight-bold);
    box-shadow: var(--shadow-pop-sm);
  }
  .detail-title {
    margin: 0;
    font-family: var(--font-family-display);
    font-size: var(--font-size-lg);
  }
  .detail-body {
    margin: var(--space-2xs) 0 0;
    line-height: var(--font-line-height-relaxed);
  }
  .counter {
    display: inline-flex;
    align-self: flex-start;
    align-items: center;
    gap: var(--space-xs);
    padding: var(--space-2xs) var(--space-sm);
    border-radius: var(--radius-pill);
    background: var(--color-surface-sunken);
    color: var(--color-text-muted);
    transition: background-color var(--motion-duration-slow) var(--motion-easing-emphasized);
  }
  .counter.lit {
    background: var(--color-highlight);
    color: var(--color-on-highlight);
  }
  .counter-value {
    display: inline-block;
    font-family: var(--font-family-display);
  }
  .toast-slot {
    position: absolute;
    top: var(--space-sm);
    right: var(--space-sm);
  }
  .toast {
    margin: 0;
    padding: var(--space-2xs) var(--space-sm);
    border-radius: var(--radius-pill);
    border: var(--border-width-medium) solid var(--color-border-strong);
    background: var(--color-secondary);
    color: var(--color-on-secondary);
    font-weight: var(--font-weight-bold);
    font-size: var(--font-size-sm);
    box-shadow: var(--shadow-pop-sm);
  }
  .payload-title {
    margin: 0;
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: var(--font-letter-spacing-caps);
  }
  .payload {
    overflow-x: auto;
    min-width: 0;
  }
  /* sm breakpoint (tokens.breakpoint.sm = 480px): the toast stacks above the card on phones. */
  @media (max-width: 480px) {
    .toast-slot {
      position: static;
    }
  }
</style>
