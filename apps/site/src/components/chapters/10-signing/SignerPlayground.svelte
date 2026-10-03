<script lang="ts">
  import { format, getDictionary, type Locale } from "@nostrschool/i18n";
  import { encodeNsec } from "@nostrschool/protocol";
  import { Badge, Button, emit, JsonView, pop, shake } from "@nostrschool/ui";
  import LockGlyph from "../_shared/LockGlyph.svelte";
  import {
    decide,
    demoKeys,
    initialState,
    leaksSecret,
    makeTemplate,
    type PlaygroundState,
    requestSignature,
    SIGNER_MODES,
    type SignerMode,
  } from "./playground.ts";

  const { locale }: { readonly locale: Locale } = $props();
  const t = $derived(getDictionary(locale).chapters.ch10.playground);

  // Demo keys come from public labels; a failure would be a programming error, so we surface it.
  const keysResult = demoKeys();
  const keys = keysResult.ok ? keysResult.value : undefined;
  const nsec = keys === undefined ? undefined : encodeNsec(keys.user.secretKey);
  const nsecText = nsec?.ok === true ? nsec.value : "";

  let mode: SignerMode = $state("nip07");
  let note = $state("");
  let sim: PlaygroundState = $state(initialState("nip07"));
  let error: string | undefined = $state();
  let verdictEl: HTMLElement | undefined = $state();

  // Prefill once the dictionary is known (locale-specific default note).
  // Only once: a learner who clears the box must not get the default back.
  let prefilled = false;
  $effect.pre(() => {
    if (prefilled) return;
    prefilled = true;
    note = t.app.defaultNote;
  });

  const leaked = $derived(keys !== undefined && leaksSecret(sim, keys.user));
  const verdict = $derived(
    sim.phase === "idle"
      ? "idle"
      : sim.phase === "awaiting"
        ? "awaiting"
        : sim.phase === "rejected"
          ? "rejected"
          : leaked
            ? "leaked"
            : "safe",
  );
  const audit = $derived(
    leaked ? "leaked" : sim.phase === "signed" || sim.phase === "rejected" ? "safe" : "idle",
  );

  const choose = (next: SignerMode): void => {
    mode = next;
    sim = initialState(next);
    error = undefined;
  };

  const apply = (next: ReturnType<typeof decide>): void => {
    if (!next.ok) {
      error = format(t.error, { message: next.error.message });
      return;
    }
    error = undefined;
    sim = next.value;
    if (keys === undefined) return;
    if (sim.phase === "signed" && leaksSecret(sim, keys.user)) {
      emit("warning", { reason: "ch10-nsec-exposed" });
      if (verdictEl) shake(verdictEl);
    } else if (sim.phase === "signed") {
      emit("signature:valid", sim.event === undefined ? {} : { eventId: sim.event.id });
      emit("celebrate", { reason: "key-stayed-home" });
    } else if (sim.phase === "rejected") emit("signature:invalid", { reason: "rejected" });
  };

  const sign = (): void => {
    if (keys === undefined || note.trim() === "") return;
    apply(
      requestSignature(
        initialState(mode),
        keys,
        makeTemplate(note.trim(), Math.floor(Date.now() / 1000)),
      ),
    );
  };
  const answer = (approve: boolean): void => {
    if (keys !== undefined) apply(decide(sim, keys, approve));
  };
  const short = (s: string): string => (s.length > 42 ? `${s.slice(0, 24)}…${s.slice(-12)}` : s);
</script>

<section class="playground" data-testid="ch10-playground" aria-labelledby="ch10-playground-title">
  <header>
    <h3 id="ch10-playground-title" class="title">{t.title}</h3>
    <p class="intro">{t.intro}</p>
  </header>

  <fieldset class="modes" data-testid="ch10-modes">
    <legend>{t.modesLabel}</legend>
    <div class="mode-grid">
      {#each SIGNER_MODES as m (m)}
        <label class="mode" class:active={mode === m} data-mode={m} data-testid="ch10-mode-{m}">
          <input
            type="radio"
            name="ch10-mode"
            value={m}
            checked={mode === m}
            onchange={() => choose(m)}
            data-testid="ch10-mode-{m}-input"
          >
          <span class="mode-text">
            <strong>{t.modes[m].label}</strong>
            <span class="blurb">{t.modes[m].blurb}</span>
          </span>
        </label>
      {/each}
    </div>
    <p class="demo-note" data-testid="ch10-demo-note">{t.demoNote}</p>
  </fieldset>

  {#if keys === undefined}
    <p role="alert" data-testid="ch10-playground-error">
      {format(t.error, { message: keysResult.ok ? "" : keysResult.error.message })}
    </p>
  {:else}
    <div class="stage" data-phase={sim.phase} data-mode={mode}>
      <!-- The app -->
      <div class="panel app" data-testid="ch10-app">
        <h4 class="panel-title">{t.app.title}</h4>
        {#if mode === "paste"}
          <label class="field">
            <span>{t.memory.nsec}</span>
            <input class="secret" readonly value={short(nsecText)} data-testid="ch10-app-nsec">
          </label>
        {/if}
        <label class="field">
          <span>{t.app.noteLabel}</span>
          <textarea
            rows="2"
            bind:value={note}
            disabled={sim.phase === "awaiting"}
            data-testid="ch10-note-input"
          ></textarea>
        </label>
        <div class="actions">
          <Button
            testid="ch10-sign"
            disabled={sim.phase === "awaiting" || note.trim() === ""}
            onclick={sign}
          >
            {t.app.sign}
          </Button>
          <Button testid="ch10-reset" variant="ghost" size="sm" onclick={() => choose(mode)}
            >{t.app.reset}</Button
          >
        </div>
        <h5 class="sub">{t.app.memoryTitle}</h5>
        <ul class="memory" data-testid="ch10-memory">
          {#each sim.memory as item (item.key)}
            <li
              class="mem"
              class:danger={item.key === "nsec"}
              data-key={item.key}
              data-testid="ch10-memory-{item.key}"
              use:pop
            >
              <span class="mem-label">{t.memory[item.key]}</span>
              <code>{short(item.value)}</code>
            </li>
          {:else}
            <li class="empty">{t.app.memoryEmpty}</li>
          {/each}
        </ul>
      </div>

      <!-- The wire -->
      <div class="panel wire" data-testid="ch10-wire">
        <h4 class="panel-title">{t.wire.title}</h4>
        <ol class="hops">
          {#each sim.wire as hop, i (`${hop.key}-${i}`)}
            <li
              class="hop"
              data-testid="ch10-wire-{hop.key}"
              data-to={hop.to}
              use:pop={{ spring: "snappy" }}
            >
              <details>
                <summary data-testid="ch10-wire-{hop.key}-toggle">
                  <span class="route">
                    {format(t.wire.from, {
                      from: t.wire.endpoints[hop.from],
                      to: t.wire.endpoints[hop.to],
                    })}
                  </span>
                  <span class="hop-label">{t.wire.items[hop.key]}</span>
                </summary>
                <div class="payload">
                  <JsonView
                    testid="ch10-wire-{hop.key}-json"
                    {locale}
                    value={hop.payload}
                    collapsedDepth={2}
                  />
                </div>
              </details>
            </li>
          {:else}
            <li class="empty">{t.wire.empty}</li>
          {/each}
        </ol>
      </div>

      <!-- The signer -->
      <div class="panel signer" class:asking={sim.phase === "awaiting"} data-testid="ch10-signer">
        <h4 class="panel-title">
          {t.signer.title[mode]}
        </h4>
        <div class="vault" class:open={mode === "paste"} data-testid="ch10-vault">
          <LockGlyph open={mode === "paste"} testid="ch10-vault-lock" />
          <span>{mode === "paste" ? t.signer.vaultEmpty : t.signer.vault}</span>
        </div>
        {#if mode === "paste"}
          <p class="hint">{t.signer.pasteNote}</p>
        {:else if sim.phase === "awaiting" && sim.template !== undefined}
          <div class="prompt" data-testid="ch10-prompt" use:pop={{ spring: "wobbly" }}>
            <p>{t.signer.prompt}</p>
            <blockquote data-testid="ch10-prompt-content">{sim.template.content}</blockquote>
            <div class="actions">
              <Button testid="ch10-approve" onclick={() => answer(true)}>{t.signer.approve}</Button>
              <Button testid="ch10-reject" variant="danger" onclick={() => answer(false)}
                >{t.signer.reject}</Button
              >
            </div>
          </div>
        {:else if sim.phase === "signed"}
          <p class="hint ok" data-testid="ch10-signer-status" use:pop>{t.signer.approved}</p>
        {:else if sim.phase === "rejected"}
          <p class="hint" data-testid="ch10-signer-status" use:pop>{t.signer.rejected}</p>
        {:else}
          <p class="hint" data-testid="ch10-signer-status">{t.signer.idle}</p>
        {/if}
      </div>
    </div>

    <div class="result" data-verdict={verdict} bind:this={verdictEl} data-testid="ch10-result">
      <div class="audit" data-testid="ch10-audit" data-audit={audit}>
        <span class="audit-label">{t.audit.label}</span>
        <Badge
          testid="ch10-audit-badge"
          tone={audit === "leaked" ? "danger" : audit === "safe" ? "success" : "neutral"}
        >
          {t.audit[audit]}
        </Badge>
      </div>
      <p class="verdict" aria-live="polite" data-testid="ch10-verdict">{t.verdict[verdict]}</p>
      {#if error !== undefined}
        <p role="alert" data-testid="ch10-playground-error">{error}</p>
      {/if}
    </div>
  {/if}
</section>

<style>
  .playground {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
    margin: var(--space-xl) 0;
    padding: var(--space-lg);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-lg);
    background: var(--color-surface);
    box-shadow: var(--shadow-pop);
    min-height: var(--size-diagram-min-height);
  }
  .title {
    margin: 0;
    font-family: var(--font-family-display);
    font-size: var(--font-size-2xl);
    color: var(--color-text-primary);
  }
  .intro {
    margin: var(--space-2xs) 0 0;
    color: var(--color-text-muted);
  }
  .modes {
    margin: 0;
    padding: 0;
    border: none;
    min-width: 0;
  }
  legend {
    font-weight: var(--font-weight-bold);
    margin-bottom: var(--space-xs);
  }
  .mode-grid {
    display: grid;
    gap: var(--space-xs);
  }
  /* tokens.breakpoint.md = 768px */
  @media (min-width: 768px) {
    .mode-grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }
  .mode {
    position: relative;
    display: flex;
    gap: var(--space-xs);
    align-items: flex-start;
    padding: var(--space-sm);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-lg);
    background: var(--color-surface-raised);
    cursor: pointer;
    box-shadow: var(--shadow-pop-sm);
    transition:
      translate var(--motion-duration-press) var(--motion-easing-press),
      box-shadow var(--motion-duration-press) var(--motion-easing-press),
      background-color var(--motion-duration-fast) var(--motion-easing-standard);
  }
  .mode:hover {
    translate: calc(var(--size-lift) * -1) calc(var(--size-lift) * -1);
    box-shadow: var(--shadow-lift);
  }
  .mode:active {
    translate: var(--size-lift) var(--size-lift);
    box-shadow: var(--shadow-pressed);
  }
  .mode.active,
  .mode.active:hover {
    box-shadow: var(--shadow-accent);
    background: var(--color-primary-subtle);
  }
  .mode[data-mode="paste"].active {
    background: var(--color-danger-subtle);
  }
  .mode input {
    position: absolute;
    opacity: 0;
    inset: 0;
    margin: 0;
    cursor: pointer;
  }
  .mode:has(input:focus-visible) {
    outline: var(--border-width-thick) solid var(--color-focus-ring);
    outline-offset: var(--space-3xs);
  }
  .mode-text {
    display: flex;
    flex-direction: column;
    gap: var(--space-3xs);
  }
  .blurb {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
  }
  .demo-note {
    margin: var(--space-xs) 0 0;
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
  }
  .stage {
    display: grid;
    gap: var(--space-sm);
  }
  /* tokens.breakpoint.lg = 1024px */
  @media (min-width: 1024px) {
    .stage {
      grid-template-columns: 1.1fr 1fr 1fr;
    }
  }
  .panel {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
    min-width: 0;
    padding: var(--space-md);
    border: var(--border-width-medium) solid var(--color-border);
    border-radius: var(--radius-lg);
    background: var(--color-surface-sunken);
  }
  .panel-title {
    margin: 0;
    font-family: var(--font-family-display);
    font-size: var(--font-size-lg);
  }
  .sub {
    margin: var(--space-xs) 0 0;
    font-size: var(--font-size-sm);
    text-transform: uppercase;
    letter-spacing: var(--font-letter-spacing-caps);
    color: var(--color-text-muted);
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: var(--space-3xs);
    font-weight: var(--font-weight-semibold);
  }
  textarea,
  .secret {
    font: inherit;
    font-size: var(--font-size-md);
    font-weight: var(--font-weight-regular);
    padding: var(--space-xs);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-md);
    background: var(--color-surface);
    color: var(--color-text);
    resize: vertical;
  }
  .secret {
    font-family: var(--font-family-mono);
    font-size: var(--font-size-md);
    border-color: var(--color-danger);
    background: var(--color-danger-subtle);
  }
  textarea:focus-visible,
  .secret:focus-visible {
    outline: var(--border-width-thick) solid var(--color-focus-ring);
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-xs);
    align-items: center;
  }
  .memory,
  .hops {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-2xs);
  }
  .mem {
    display: flex;
    flex-direction: column;
    gap: var(--space-3xs);
    padding: var(--space-2xs) var(--space-xs);
    border-radius: var(--radius-md);
    background: var(--color-surface);
    border: var(--border-width-thin) solid var(--color-border);
  }
  .mem.danger {
    border-color: var(--color-danger);
    background: var(--color-danger-subtle);
  }
  .mem-label {
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-bold);
  }
  code {
    font-family: var(--font-family-mono);
    font-size: var(--font-size-xs);
    overflow-wrap: anywhere;
  }
  .empty {
    color: var(--color-text-subtle);
    font-style: italic;
  }
  .hop details {
    border: var(--border-width-thin) solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-surface);
  }
  .hop[data-to="relay"] details {
    border-color: var(--color-packet-event);
  }
  summary {
    display: flex;
    flex-direction: column;
    gap: var(--space-3xs);
    padding: var(--space-2xs) var(--space-xs);
    cursor: pointer;
    min-height: var(--size-touch-target);
    justify-content: center;
  }
  summary:focus-visible {
    outline: var(--border-width-thick) solid var(--color-focus-ring);
  }
  .route {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
  }
  .hop-label {
    font-family: var(--font-family-mono);
    font-size: var(--font-size-sm);
  }
  .payload {
    padding: var(--space-xs);
    max-height: calc(var(--size-diagram-min-height) / 1.5);
    overflow: auto;
  }
  .vault {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    padding: var(--space-xs);
    border-radius: var(--radius-md);
    background: var(--color-success-subtle);
    font-weight: var(--font-weight-semibold);
  }
  .vault.open {
    background: var(--color-danger-subtle);
  }
  .signer.asking {
    border-color: var(--color-border-strong);
    box-shadow: var(--shadow-accent);
    animation: nudge var(--motion-duration-slower) var(--motion-easing-standard) infinite alternate;
  }
  @keyframes nudge {
    to {
      box-shadow: var(--shadow-pop);
    }
  }
  .prompt {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
    padding: var(--space-sm);
    border-radius: var(--radius-md);
    background: var(--color-surface-raised);
    box-shadow: var(--shadow-md);
  }
  .prompt p {
    margin: 0;
  }
  blockquote {
    margin: 0;
    padding: var(--space-xs);
    border-left: var(--border-width-thick) solid var(--color-text-primary);
    background: var(--color-primary-subtle);
    border-radius: var(--radius-sm);
    overflow-wrap: anywhere;
  }
  .hint {
    margin: 0;
    color: var(--color-text-muted);
  }
  .hint.ok {
    color: var(--color-text);
    font-weight: var(--font-weight-semibold);
  }
  .result {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
    padding: var(--space-sm) var(--space-md);
    border-radius: var(--radius-lg);
    border: var(--border-width-medium) solid var(--color-border);
    background: var(--color-surface-raised);
  }
  .result[data-verdict="leaked"] {
    border-color: var(--color-danger);
    background: var(--color-danger-subtle);
  }
  .result[data-verdict="safe"] {
    border-color: var(--color-success);
    background: var(--color-success-subtle);
  }
  .audit {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-xs);
  }
  .audit-label {
    font-weight: var(--font-weight-bold);
  }
  .verdict {
    margin: 0;
    font-size: var(--font-size-md);
  }
  /* tokens.breakpoint.sm = 480px: a tighter frame so phones (320-414px) keep room for content. */
  @media (max-width: 480px) {
    .playground {
      padding: var(--space-md);
    }
  }
</style>
