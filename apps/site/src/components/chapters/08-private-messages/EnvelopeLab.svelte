<script lang="ts">
  import { getPersona } from "@nostrschool/fixtures";
  import { format, formatDate, getDictionary, type Locale, plural } from "@nostrschool/i18n";
  import type { Hex } from "@nostrschool/protocol";
  import { Badge, Button, emit, JsonView, pop, shake } from "@nostrschool/ui";
  import { tick } from "svelte";
  import LockGlyph from "../_shared/LockGlyph.svelte";
  import {
    buildScenario,
    detailParams,
    type Exposure,
    layerIds,
    leakCount,
    MAX_MESSAGE_LENGTH,
    type PeelError,
    peel,
    type Revealed,
    relayView,
    SCHEMES,
    type Scenario,
    type ScenarioInput,
    type Scheme,
  } from "./logic.ts";
  import { VIEWERS, type ViewerId, viewerKey } from "./viewers.ts";

  const { locale }: { readonly locale: Locale } = $props();
  const t = $derived(getDictionary(locale).chapters.ch08.lab);

  const alice = getPersona("alice");
  const bob = getPersona("bob");
  const names = $derived(
    new Map<Hex, string>([
      [alice.pubkey, t.senderName],
      [bob.pubkey, t.viewers.bob.name],
      [getPersona("carol").pubkey, t.viewers.carol.name],
    ]),
  );

  // svelte-ignore state_referenced_locally
  let message = $state(getDictionary(locale).chapters.ch08.lab.defaultMessage);
  let scheme = $state<Scheme>("nip04");
  let viewer = $state<ViewerId>("bob");
  let sends = $state(0);
  let showRaw = $state(false);
  let narration = $state("");
  let errorBox = $state<HTMLElement>();

  const input = $derived<ScenarioInput>({
    scheme,
    message,
    sender: { secretKey: alice.secretKey, pubkey: alice.pubkey },
    recipient: { secretKey: bob.secretKey, pubkey: bob.pubkey },
    now: Math.floor(Date.now() / 1000),
  });
  // `sends` is read so "Send it again" re-runs the (random) encryption.
  const built = $derived.by(() => {
    void sends;
    return buildScenario(input);
  });
  const scenario = $derived<Scenario | undefined>(built.ok ? built.value : undefined);
  const facts = $derived(scenario === undefined ? [] : relayView(scenario, input));
  const leaks = $derived(plural(locale, leakCount(facts), t.leakSummary));
  const layers = $derived(layerIds(scheme));

  // Peel progress belongs to one scenario + viewer: a new send or another key starts sealed again.
  interface PeelState {
    readonly scenario: Scenario | undefined;
    readonly viewer: ViewerId;
    readonly revealed: readonly Revealed[];
    readonly error: PeelError | undefined;
  }
  let peelState = $state.raw<PeelState>({
    scenario: undefined,
    viewer: "bob",
    revealed: [],
    error: undefined,
  });
  const current = $derived(
    peelState.scenario === scenario && peelState.viewer === viewer
      ? peelState
      : { scenario, viewer, revealed: [], error: undefined },
  );
  const opened = $derived(current.revealed.length);
  const finished = $derived(
    current.revealed.some((r) => r.layer === "message" || r.layer === "rumor"),
  );
  const messageText = $derived.by(() => {
    const last = current.revealed.at(-1);
    if (last === undefined) return undefined;
    if (last.layer === "message") return last.text;
    if (last.layer === "rumor") return last.event.content;
    return undefined;
  });

  const viewerName = $derived(t.viewers[viewer].name);
  const layerName = (i: number): string => {
    const id = layers[i];
    return id === undefined ? "" : t.layers[id].name;
  };

  const tryPeel = (): void => {
    if (scenario === undefined) return;
    const index = opened;
    const result = peel(scenario, index, viewerKey(viewer));
    if (result.ok) {
      const revealed = [...current.revealed, result.value];
      peelState = { scenario, viewer, revealed, error: undefined };
      const done = result.value.layer !== "seal";
      narration = done
        ? format(t.narration.readAll, { viewer: viewerName, message: textOf(result.value) })
        : format(t.narration.opened, { viewer: viewerName, layer: layerName(index) });
      if (done && viewer === "bob") emit("celebrate", { reason: "ch08-message-read" });
      return;
    }
    peelState = { scenario, viewer, revealed: current.revealed, error: result.error };
    narration = format(t.narration.failed, { viewer: viewerName, layer: layerName(index) });
    emit("warning", { reason: `ch08-${result.error.code}` });
    // Wait for the alert to render before shaking it.
    void tick().then(() => {
      if (errorBox !== undefined) shake(errorBox);
    });
  };
  const textOf = (r: Revealed): string =>
    r.layer === "message" ? r.text : r.layer === "rumor" ? r.event.content : "";

  const reset = (): void => {
    peelState = { scenario, viewer, revealed: [], error: undefined };
    narration = t.narration.reset;
  };
  const pickScheme = (s: Scheme): void => {
    scheme = s;
    narration = format(t.narration.built, { scheme: t.schemes[s].name, leaks });
  };
  const resend = (): void => {
    sends += 1;
  };

  const errorText = (e: PeelError): string => format(t.errors[e.code], { detail: e.message });
  const buildError = $derived.by(() => {
    if (built.ok) return undefined;
    const e = built.error;
    return e.code === "empty-message" || e.code === "message-too-long"
      ? format(t.errors[e.code], { max: MAX_MESSAGE_LENGTH })
      : format(t.errors.crypto, { detail: e.message });
  });

  const tone = (e: Exposure): "danger" | "warning" | "success" =>
    e === "leaked" ? "danger" : e === "blurred" ? "warning" : "success";
  const formatters = $derived({
    nameOf: (pk: Hex) => names.get(pk),
    formatTime: (s: number) =>
      formatDate(locale, s * 1000, { dateStyle: "medium", timeStyle: "short" }),
  });
  /** JSON that the open layer i exposes: the outer event, or what peeling revealed. */
  const layerJson = (i: number): unknown => {
    if (i === 0) return scenario?.event;
    const r = current.revealed[i - 1];
    return r === undefined || r.layer === "message" ? undefined : r.event;
  };
</script>

<section class="lab" data-testid="ch08-lab" aria-labelledby="ch08-lab-title">
  <header class="intro">
    <h3 id="ch08-lab-title" class="title">{t.title}</h3>
    <p class="muted">{t.description}</p>
  </header>

  <label class="field" for="ch08-message">
    <span class="field-label">{t.messageLabel}</span>
    <textarea
      id="ch08-message"
      data-testid="ch08-message-input"
      rows="2"
      maxlength={MAX_MESSAGE_LENGTH}
      bind:value={message}
    ></textarea>
    <span class="hint" data-testid="ch08-message-count"
      >{format(t.charCount, { count: [...message].length, max: MAX_MESSAGE_LENGTH })}</span
    >
  </label>

  <fieldset class="choices" data-testid="ch08-schemes">
    <legend class="field-label">{t.schemeLabel}</legend>
    <div class="schemes">
      {#each SCHEMES as s, i (s)}
        <button
          type="button"
          class="scheme"
          class:active={scheme === s}
          data-testid="ch08-scheme-{s}"
          aria-pressed={scheme === s}
          onclick={() => pickScheme(s)}
        >
          <span class="step" aria-hidden="true">{i + 1}</span>
          <span class="scheme-name">{t.schemes[s].name}</span>
          <span class="scheme-tag">{t.schemes[s].tagline}</span>
          <Badge
            testid="ch08-scheme-{s}-badge"
            size="sm"
            tone={s === "nip04" ? "danger" : s === "nip44" ? "warning" : "success"}
            >{t.schemes[s].badge}</Badge
          >
        </button>
      {/each}
    </div>
  </fieldset>

  {#if buildError !== undefined}
    <p class="error" role="alert" data-testid="ch08-build-error">{buildError}</p>
  {/if}

  {#if scenario !== undefined}
    <div class="panels">
      <section class="panel" data-testid="ch08-relay-view" aria-labelledby="ch08-relay-title">
        <h4 id="ch08-relay-title" class="panel-title">
          {t.relayTitle}
        </h4>
        <p class="muted small">{t.relaySubtitle}</p>
        <p class="leaks" data-testid="ch08-leak-summary" data-leaks={leakCount(facts)}>{leaks}</p>
        {#key `${scheme}-${sends}`}
          <ul class="facts">
            {#each facts as f (f.field)}
              <li
                class="fact {f.exposure}"
                data-testid="ch08-fact-{f.field}"
                data-exposure={f.exposure}
                use:pop={{ spring: "bouncy", from: 0.96 }}
              >
                <span class="fact-head">
                  <span class="fact-name">{t.fields[f.field]}</span>
                  <Badge testid="ch08-fact-{f.field}-badge" size="sm" tone={tone(f.exposure)}
                    >{t.exposure[f.exposure]}</Badge
                  >
                </span>
                <span class="fact-detail"
                  >{format(t.factDetail[f.detail], detailParams(f, formatters))}</span
                >
              </li>
            {/each}
          </ul>
        {/key}
        <div class="raw">
          <Button
            testid="ch08-raw-toggle"
            variant="ghost"
            size="sm"
            pressed={showRaw}
            onclick={() => (showRaw = !showRaw)}
            >{showRaw ? t.rawHide : t.rawToggle}</Button
          >
          {#if showRaw}
            <div class="json-wrap">
              <JsonView testid="ch08-raw-json" {locale} value={scenario.event} />
            </div>
          {/if}
        </div>
      </section>

      <section class="panel" data-testid="ch08-open-view" aria-labelledby="ch08-open-title">
        <h4 id="ch08-open-title" class="panel-title">
          {t.openTitle}
        </h4>
        <fieldset class="choices">
          <legend class="field-label">{t.viewerLabel}</legend>
          <div class="viewers">
            {#each VIEWERS as v (v)}
              <button
                type="button"
                class="viewer"
                class:active={viewer === v}
                data-testid="ch08-viewer-{v}"
                aria-pressed={viewer === v}
                onclick={() => (viewer = v)}
              >
                <span class="viewer-name">{t.viewers[v].name}</span>
                <span class="viewer-role">{t.viewers[v].role}</span>
              </button>
            {/each}
          </div>
        </fieldset>

        <ol class="stack" aria-label={t.stackLabel} data-testid="ch08-stack" data-opened={opened}>
          {#each layers as id, i (id)}
            {#if i <= opened}
              {@const isOpen = i < opened}
              <li
                class="layer {id}"
                class:open={isOpen}
                data-testid="ch08-layer-{id}"
                data-state={isOpen ? "open" : "sealed"}
                style:--depth={i}
                use:pop={{ spring: "wobbly", from: 0.8 }}
              >
                <div class="layer-head">
                  <LockGlyph open={isOpen} testid="ch08-layer-{id}-lock" />
                  <span class="layer-name">{t.layers[id].name}</span>
                  <Badge testid="ch08-layer-{id}-kind" size="sm" tone="neutral"
                    >{t.layers[id].kind}</Badge
                  >
                  <span class="visually-hidden">{isOpen ? t.openedState : t.sealedState}</span>
                </div>
                <p class="layer-hint">{t.layers[id].hint}</p>
                {#if layerJson(i) !== undefined}
                  <details class="layer-json">
                    <summary data-testid="ch08-layer-{id}-json-toggle">JSON</summary>
                    <JsonView
                      testid="ch08-layer-{id}-json"
                      {locale}
                      value={layerJson(i)}
                      collapsedDepth={2}
                    />
                  </details>
                {/if}
              </li>
            {/if}
          {/each}
        </ol>

        {#if messageText !== undefined}
          <div class="bubble" data-testid="ch08-revealed" use:pop={{ spring: "bouncy" }}>
            <span class="bubble-label">{t.revealedMessage}</span>
            <p class="bubble-text" data-testid="ch08-revealed-text">{messageText}</p>
            {#if scheme === "nip17" && finished}
              <p class="ok small" data-testid="ch08-author-check">✓ {t.authorCheck}</p>
            {/if}
            {#if scheme === "nip04" && viewer !== "bob"}
              <p class="warn small" data-testid="ch08-garbage-warning">{t.garbageWarning}</p>
            {/if}
          </div>
        {/if}

        {#if current.error !== undefined}
          <div bind:this={errorBox} class="error" role="alert" data-testid="ch08-peel-error">
            <p>{errorText(current.error)}</p>
            {#if scheme === "nip04" && current.error.code === "decrypt-failed"}
              <p class="small">{t.garbageWarning}</p>
            {/if}
          </div>
        {/if}

        <div class="actions">
          <Button testid="ch08-peel" variant="primary" disabled={finished} onclick={tryPeel}
            >{opened === 0 ? format(t.peel, { name: viewerName }) : t.peelNext}</Button
          >
          <Button
            testid="ch08-reset"
            variant="secondary"
            disabled={opened === 0 && current.error === undefined}
            onclick={reset}
            >{t.reset}</Button
          >
          <Button testid="ch08-resend" variant="ghost" onclick={resend}>{t.resend}</Button>
        </div>
        <p class="muted small">{t.resendHint}</p>
      </section>
    </div>
  {/if}

  <p class="visually-hidden" aria-live="polite" data-testid="ch08-narration">{narration}</p>
</section>

<style>
  .lab {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
    min-height: var(--size-diagram-min-height);
    padding: var(--space-md);
    border: var(--border-width-medium) solid var(--color-border);
    border-radius: var(--radius-lg);
    background: var(--color-surface);
    box-shadow: var(--shadow-pop);
    color: var(--color-text);
  }
  .title {
    margin: 0;
    font-family: var(--font-family-display);
    font-size: var(--font-size-xl);
  }
  .intro p,
  .panel p {
    margin: 0;
  }
  .muted {
    color: var(--color-text-muted);
  }
  .small {
    font-size: var(--font-size-sm);
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: var(--space-2xs);
  }
  .field-label {
    font-weight: var(--font-weight-bold);
  }
  textarea {
    width: 100%;
    box-sizing: border-box;
    padding: var(--space-sm);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-md);
    background: var(--color-surface-raised);
    color: var(--color-text);
    font: inherit;
    font-size: var(--font-size-md);
    resize: vertical;
  }
  textarea:focus-visible,
  .scheme:focus-visible,
  .viewer:focus-visible,
  summary:focus-visible {
    outline: var(--border-width-thick) solid var(--color-focus-ring);
    outline-offset: var(--space-3xs);
  }
  .hint {
    align-self: flex-end;
    color: var(--color-text-muted);
    font-size: var(--font-size-xs);
  }
  .choices {
    min-inline-size: 0;
    margin: 0;
    padding: 0;
    border: 0;
  }
  .choices legend {
    margin-block-end: var(--space-2xs);
    padding: 0;
  }
  .schemes,
  .viewers {
    display: grid;
    gap: var(--space-xs);
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 10rem), 1fr));
  }
  .scheme,
  .viewer {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-3xs);
    min-height: var(--size-touch-target);
    padding: var(--space-sm);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-lg);
    background: var(--color-surface-raised);
    color: var(--color-text);
    font: inherit;
    text-align: start;
    cursor: pointer;
    box-shadow: var(--shadow-pop-sm);
    transition:
      translate var(--motion-duration-press) var(--motion-easing-press),
      box-shadow var(--motion-duration-press) var(--motion-easing-press);
  }
  .scheme:hover,
  .viewer:hover {
    translate: calc(var(--size-lift) * -1) calc(var(--size-lift) * -1);
    box-shadow: var(--shadow-lift);
  }
  .scheme:active,
  .viewer:active {
    translate: var(--size-lift) var(--size-lift);
    box-shadow: var(--shadow-pressed);
  }
  .scheme.active,
  .viewer.active,
  .scheme.active:hover,
  .viewer.active:hover {
    box-shadow: var(--shadow-accent);
    background: var(--color-primary-subtle);
  }
  .step {
    display: inline-grid;
    place-items: center;
    width: var(--size-icon-lg);
    height: var(--size-icon-lg);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-round);
    background: var(--color-primary);
    color: var(--color-on-primary);
    font-weight: var(--font-weight-black);
    font-size: var(--font-size-sm);
  }
  .scheme-name,
  .viewer-name {
    font-family: var(--font-family-display);
    font-weight: var(--font-weight-bold);
    font-size: var(--font-size-lg);
  }
  .scheme-tag,
  .viewer-role {
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
  }
  .panels {
    display: grid;
    gap: var(--space-md);
    grid-template-columns: minmax(0, 1fr);
  }
  /* tokens.breakpoint.md = 768px */
  @media (min-width: 768px) {
    .panels {
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    }
  }
  .panel {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
    min-width: 0;
    padding: var(--space-md);
    border-radius: var(--radius-lg);
    background: var(--color-surface-sunken);
  }
  .panel-title {
    display: flex;
    gap: var(--space-xs);
    margin: 0;
    font-family: var(--font-family-display);
    font-size: var(--font-size-lg);
  }
  .leaks {
    font-weight: var(--font-weight-bold);
  }
  .facts {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .fact {
    display: flex;
    flex-direction: column;
    gap: var(--space-3xs);
    padding: var(--space-xs) var(--space-sm);
    border-inline-start: var(--border-width-heavy) solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-surface-raised);
  }
  .fact.leaked {
    border-inline-start-color: var(--color-danger);
  }
  .fact.blurred {
    border-inline-start-color: var(--color-warning);
  }
  .fact.hidden {
    border-inline-start-color: var(--color-success);
  }
  .fact-head {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    gap: var(--space-xs);
  }
  .fact-name {
    font-weight: var(--font-weight-bold);
  }
  .fact-detail {
    font-size: var(--font-size-sm);
    overflow-wrap: anywhere;
  }
  .json-wrap {
    max-height: calc(var(--size-diagram-min-height) / 1.5);
    overflow: auto;
    margin-top: var(--space-xs);
  }
  .stack {
    display: flex;
    flex-direction: column;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  /* Each inner layer is drawn tucked inside the previous one, like nested envelopes. */
  .layer {
    position: relative;
    margin-inline-start: calc(var(--depth) * var(--space-sm));
    margin-top: calc(var(--depth) * var(--space-3xs));
    padding: var(--space-sm);
    border: var(--border-width-thick) dashed var(--color-envelope-stroke);
    border-radius: var(--radius-lg);
    background: var(--color-surface-raised);
    transform-origin: top center;
    transition: border-style var(--motion-duration-normal) var(--motion-easing-standard);
  }
  .layer + .layer {
    margin-top: var(--space-xs);
  }
  .layer.open {
    border-style: solid;
  }
  .layer.wrap {
    border-color: var(--color-envelope-wrap);
  }
  .layer.seal {
    border-color: var(--color-envelope-seal);
  }
  .layer.rumor,
  .layer.dm {
    border-color: var(--color-envelope-rumor);
  }
  .layer-head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-xs);
  }
  .layer-name {
    font-family: var(--font-family-display);
    font-weight: var(--font-weight-bold);
  }
  .layer-hint {
    margin: var(--space-3xs) 0 0;
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
  }
  .layer-json summary {
    cursor: pointer;
    color: var(--color-text-primary);
    font-family: var(--font-family-mono);
    font-size: var(--font-size-xs);
  }
  .layer-json :global(pre) {
    max-height: calc(var(--size-diagram-min-height) / 2);
    overflow: auto;
  }
  .bubble {
    padding: var(--space-sm) var(--space-md);
    border-radius: var(--radius-lg) var(--radius-lg) var(--radius-lg) var(--radius-sm);
    background: var(--color-primary-subtle);
    border: var(--border-width-medium) solid var(--color-text-primary);
  }
  .bubble-label {
    color: var(--color-text-primary);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-bold);
    letter-spacing: var(--font-letter-spacing-caps);
    text-transform: uppercase;
  }
  .bubble-text {
    font-size: var(--font-size-lg);
    overflow-wrap: anywhere;
  }
  .ok,
  .warn {
    margin-top: var(--space-2xs);
    color: var(--color-text);
    font-weight: var(--font-weight-semibold);
  }
  .error {
    padding: var(--space-sm);
    border-radius: var(--radius-md);
    background: var(--color-danger-subtle);
    color: var(--color-text);
    border: var(--border-width-medium) solid var(--color-danger);
  }
  .error p {
    margin: 0;
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-xs);
  }
  /* Touch screens: the small JSON disclosure still gets a finger-sized hit area. */
  @media (pointer: coarse) {
    .layer-json summary {
      padding-block: calc((var(--size-touch-target) - 1lh) / 2);
    }
  }
</style>
