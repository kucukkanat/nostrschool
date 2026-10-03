<script lang="ts">
  /**
   * The whole editor for one NIP. One source of truth: `text` (what the JSON view shows) and
   * `value` (its parse) move together; the form writes `value` (→ text is re-printed), the JSON
   * view writes `text` (→ value follows whenever it parses). Validation runs on the text, so a
   * half-typed edit is reported as invalid JSON instead of silently ignored.
   */
  import { PERSONAS } from "@nostrschool/fixtures";
  import { format } from "@nostrschool/i18n";
  import {
    findSpecPart,
    type JsonPath,
    type JsonValue,
    type PersonaRef,
    type SpecPart,
    type SpecPartKey,
    specParts,
  } from "@nostrschool/nips";
  import { mediaUp } from "@nostrschool/tokens";
  import { copyText, rovingIndex } from "@nostrschool/ui";
  import { onMount, tick, untrack } from "svelte";
  import { isJsonObject, signDraft, unsign } from "../logic/event.ts";
  import { DEFAULT_SIGNER, personaOf } from "../logic/fields.ts";
  import { nodeValue, parseJsonNodes } from "../logic/json-locate.ts";
  import { editorStrings, nipText } from "../logic/text.ts";
  import { checkText, issueMessage } from "../logic/validate.ts";
  import {
    decodeEditorHash,
    encodeEditorHash,
    explainAt,
    formatJson,
    initialValue,
    issueDiagnostics,
    livePath,
  } from "../state.ts";
  import type { EditorState, NipEditorProps } from "../types.ts";
  import DocumentForm from "./DocumentForm.svelte";
  import EncodingForm from "./EncodingForm.svelte";
  import EventForm from "./EventForm.svelte";
  import ExplainPanel from "./ExplainPanel.svelte";
  import HowItWorks from "./HowItWorks.svelte";
  import HttpForm from "./HttpForm.svelte";
  import JsonCodeEditor from "./JsonCodeEditor.svelte";
  import MessageForm from "./MessageForm.svelte";
  import ValidityBadge from "./ValidityBadge.svelte";

  const {
    testid,
    locale,
    spec,
    part: initialPart,
    example: initialExample,
    syncHash = true,
    layout = "auto",
    onchange,
  }: NipEditorProps = $props();

  const t = $derived(editorStrings(locale));
  const text = $derived(nipText(locale, spec.nip));
  const message = $derived(issueMessage(locale));
  const parts = $derived(specParts(spec));
  const keyOf = (p: SpecPart): SpecPartKey => ({ kind: p.kind, id: p.part.id });
  const sameKey = (a: SpecPartKey | undefined, b: SpecPartKey) =>
    a?.kind === b.kind && a.id === b.id;

  type Example = { readonly id: string; readonly label: string; readonly signer?: string };
  const examplesOf = (p: SpecPart | undefined): readonly Example[] =>
    p === undefined ? [] : p.part.examples;
  const exampleSigner = (p: SpecPart | undefined, id: string | undefined): PersonaRef =>
    examplesOf(p).find((e) => e.id === id)?.signer ?? examplesOf(p)[0]?.signer ?? DEFAULT_SIGNER;

  // Initial state from props (the URL hash may replace it on mount). Props are read once on
  // purpose: after mount the editor owns its state, like an uncontrolled input.
  const start = untrack(() => {
    const all = specParts(spec);
    const p = (initialPart === undefined ? undefined : findSpecPart(spec, initialPart)) ?? all[0];
    const ex = initialExample ?? examplesOf(p)[0]?.id;
    const v: JsonValue = p === undefined ? null : initialValue(p, ex);
    return { key: p === undefined ? undefined : keyOf(p), ex, signer: exampleSigner(p, ex), v };
  });
  let partKey = $state<SpecPartKey | undefined>(start.key);
  let example = $state<string | undefined>(start.ex);
  let signer = $state<PersonaRef>(start.signer);
  let value = $state.raw<JsonValue>(start.v);
  let json = $state(formatJson(start.v));
  let selected = $state.raw<JsonPath | undefined>(undefined);
  let tab = $state<"form" | "json" | "explain">("form");
  let wide = $state(false);
  let mounted = $state(false);
  let notice = $state("");
  let howStep = $state(0);
  /** The URL only carries state once the reader changed something (plain visits stay clean). */
  let touched = $state(false);

  const current = $derived(partKey === undefined ? undefined : findSpecPart(spec, partKey));
  const checked = $derived(current === undefined ? undefined : checkText(spec, current, json));
  const report = $derived(checked?.report);
  const issues = $derived(report?.issues ?? []);
  const parseError = $derived(checked !== undefined && checked.value === undefined);
  const diagnostics = $derived(issueDiagnostics(json, issues, message));
  // Removing or reordering tag rows (in the form or the JSON) can leave `selected` pointing past
  // the end of a list: the panel and highlight use the part of it that still exists.
  const selection = $derived(selected === undefined ? undefined : livePath(value, selected));
  const target = $derived(
    current === undefined || selection === undefined
      ? undefined
      : explainAt(current, value, selection, issues),
  );
  const mode = $derived(layout === "auto" ? (wide ? "split" : "tabs") : layout);
  const examples = $derived(examplesOf(current));
  const authShape = $derived.by(() => {
    const c = current;
    const id = c?.kind === "http" ? c.part.authEvent : undefined;
    return id === undefined ? undefined : spec.events?.find((e) => e.id === id);
  });
  const signable = $derived(current?.kind === "event" || authShape !== undefined);
  const sigState = $derived.by(() => {
    if (current?.kind !== "event" || !isJsonObject(value)) return undefined;
    if (value["sig"] === undefined) return "unsigned";
    return issues.some((i) => i.code === "id-mismatch" || i.code === "bad-signature")
      ? "stale"
      : "signed";
  });

  const setValue = (v: JsonValue) => {
    touched = true;
    value = v;
    json = formatJson(v);
  };
  const setJson = (next: string) => {
    touched = true;
    json = next;
    const parsed = parseJsonNodes(next);
    if (parsed.ok) value = nodeValue(parsed.value);
  };
  const load = (key: SpecPartKey, exampleId?: string) => {
    const p = findSpecPart(spec, key);
    if (p === undefined) return;
    partKey = key;
    example = exampleId ?? examplesOf(p)[0]?.id;
    signer = exampleSigner(p, example);
    selected = undefined;
    setValue(initialValue(p, example));
  };
  const setSigner = (id: PersonaRef) => {
    touched = true;
    signer = id;
    // A new author makes the old id/sig wrong: swap the pubkey and drop them.
    if (current?.kind === "event" && isJsonObject(value))
      setValue(unsign({ ...value, pubkey: personaOf(id).pubkey }));
  };
  const sign = () => {
    const r = signDraft(value, signer);
    notice = r.ok ? "" : format(t.signFailed, { reason: r.error.message });
    if (r.ok) setValue(r.value);
  };
  const snapshot = (): EditorState => ({
    part: partKey ?? { kind: "event", id: "" },
    value,
    ...(example === undefined ? {} : { example }),
    ...(signable ? { signer } : {}),
  });
  const flash = async (content: string, ok: string) => {
    const r = await copyText(content);
    notice = r.ok ? ok : t.copyFailed;
  };
  const copyJson = () => flash(json, t.copied);
  const share = () => {
    const url = new URL(globalThis.location.href);
    url.hash = encodeEditorHash(snapshot());
    return flash(url.toString(), t.copied);
  };
  const focusFromWalkthrough = (focus: {
    readonly part: SpecPartKey;
    readonly path?: JsonPath;
  }) => {
    if (!sameKey(partKey, focus.part)) load(focus.part);
    if (focus.path !== undefined) {
      selected = focus.path;
      if (mode === "tabs") tab = "explain";
    }
  };

  onMount(() => {
    const mq = globalThis.matchMedia?.(mediaUp("md"));
    wide = mq?.matches ?? false;
    const onMq = (e: MediaQueryListEvent) => (wide = e.matches);
    mq?.addEventListener("change", onMq);
    if (syncHash) {
      const restored = decodeEditorHash(globalThis.location.hash, spec);
      if (restored.ok) {
        partKey = restored.value.part;
        example = restored.value.example;
        signer = restored.value.signer ?? exampleSigner(current, example);
        setValue(restored.value.value);
        notice = t.hashRestored;
      } else if (restored.error.code !== "no-state") notice = t.hashInvalid;
    }
    mounted = true;
    return () => mq?.removeEventListener("change", onMq);
  });

  // Keep the shareable link current (replaceState: no history entry per keystroke).
  $effect(() => {
    if (!syncHash || !mounted || !touched || partKey === undefined) return;
    const hash = encodeEditorHash(snapshot());
    const id = setTimeout(() => history.replaceState(history.state, "", hash), 250);
    return () => clearTimeout(id);
  });
  $effect(() => {
    if (partKey !== undefined) onchange?.(snapshot());
  });

  const TABS = ["form", "json", "explain"] as const;
  const tabButtons: HTMLButtonElement[] = $state([]);
  const onTabKey = (e: KeyboardEvent, from: number) => {
    const next = rovingIndex(TABS.length, from, e.key);
    const id = next === undefined ? undefined : TABS[next];
    if (next === undefined || id === undefined) return;
    e.preventDefault();
    tab = id;
    tabButtons[next]?.focus();
  };
  const uid = $props.id();
  let formPane = $state<HTMLElement>();
  /** Human locator for an issue path ("tags › e › relay"), from the same resolver as the panel title. */
  const locate = (p: JsonPath): string =>
    current === undefined ? "" : explainAt(current, value, p, []).breadcrumb.join(" › ");
  /** The form control for `p` (or its nearest tagged ancestor): forms mark nodes with data-json-path. */
  const formControlAt = (p: JsonPath): HTMLElement | undefined => {
    const nodes = [...(formPane?.querySelectorAll<HTMLElement>("[data-json-path]") ?? [])];
    for (let k = p.length; k > 0; k--) {
      const key = JSON.stringify(p.slice(0, k));
      const node = nodes.find((n) => n.dataset["jsonPath"] === key);
      const control = node?.querySelector<HTMLElement>("input, select, textarea");
      if (control !== null && control !== undefined) return control;
    }
    return undefined;
  };
  /** Explain-panel issue → highlight it in the JSON and focus its form field (form tab on phones). */
  const jumpTo = async (p: JsonPath) => {
    const control = formControlAt(p);
    if (mode === "tabs") tab = control === undefined ? "json" : "form";
    selected = p;
    await tick();
    control?.focus();
    // Focusing fires the form's own select (maybe an ancestor path): keep the issue's exact path.
    selected = p;
  };
  const paneAttrs = (id: (typeof TABS)[number]) =>
    mode === "tabs"
      ? {
          role: "tabpanel",
          id: `${uid}-panel-${id}`,
          "aria-labelledby": `${uid}-tab-${id}`,
          hidden: tab !== id,
        }
      : { role: "region", id: `${uid}-panel-${id}`, "aria-label": t.tabs[id], hidden: false };
</script>

<div
  class="editor"
  class:split={mode === "split"}
  data-testid={testid}
  data-mode={mode}
  data-part={partKey ? `${partKey.kind}-${partKey.id}` : ""}
>
  {#if parts.length > 1}
    <fieldset class="bar">
      <legend class="bar-label">{t.parts}</legend>
      <div class="chips" data-testid="{testid}-parts">
        {#each parts as p (`${p.kind}-${p.part.id}`)}
          <button
            type="button"
            class="chip part"
            data-testid="{testid}-part-{p.kind}-{p.part.id}"
            aria-pressed={sameKey(partKey, keyOf(p))}
            onclick={() => load(keyOf(p))}
          >
            <span class="kind">{t.partKinds[p.kind]}</span>
            {text(p.part.label)}
          </button>
        {/each}
      </div>
    </fieldset>
  {/if}

  {#if spec.flows !== undefined && spec.flows.length > 0}
    <div class="flows" data-testid="{testid}-flows">
      {#each spec.flows as flow (flow.id)}
        <p class="flow-title">{t.flows.title}: <strong>{text(flow.label)}</strong></p>
        <ol class="flow">
          {#each flow.steps as s, i (i)}
            {@const fp = findSpecPart(spec, s.part)}
            <li>
              <button
                type="button"
                class="flow-step"
                aria-pressed={sameKey(partKey, s.part)}
                title={text(s.explain)}
                onclick={() => load(s.part)}
              >
                {fp === undefined ? s.part.id : text(fp.part.label)}
              </button>
            </li>
          {/each}
        </ol>
      {/each}
    </div>
  {/if}

  {#if current !== undefined}
    {#if examples.length > 0}
      <fieldset class="bar">
        <legend class="bar-label">{t.examples}</legend>
        <div class="chips" data-testid="{testid}-examples">
          {#each examples as ex (ex.id)}
            <button
              type="button"
              class="chip"
              data-testid="{testid}-example-{ex.id}"
              aria-pressed={example === ex.id}
              onclick={() => partKey && load(partKey, ex.id)}
            >
              {text(ex.label)}
            </button>
          {/each}
        </div>
        <!-- Outside the chip list so it is never pushed off-screen by a long list of examples. -->
        <button
          type="button"
          class="chip ghost reset"
          data-testid="{testid}-reset"
          onclick={() => partKey && load(partKey, example)}
        >
          ↺ {t.reset}
        </button>
      </fieldset>
    {/if}

    <div class="toolbar">
      <ValidityBadge testid="{testid}-validity" {locale} {report} />
      {#if signable}
        <label class="signer">
          <span>{t.signer}</span>
          <select
            data-testid="{testid}-signer"
            value={signer}
            onchange={(e) => setSigner(e.currentTarget.value)}
          >
            {#each PERSONAS as p (p.id)}
              <option value={p.id}>{p.displayName}</option>
            {/each}
          </select>
        </label>
      {/if}
      {#if current.kind === "event"}
        <button
          type="button"
          class="btn primary"
          data-testid="{testid}-sign"
          disabled={parseError}
          onclick={sign}
        >
          ✎ {sigState === "unsigned" ? t.sign : t.resign}
        </button>
      {/if}
      <span class="spacer"></span>
      <button type="button" class="btn" data-testid="{testid}-copy" onclick={copyJson}>
        {t.copyJson}
      </button>
      <button type="button" class="btn" data-testid="{testid}-share" onclick={share}>
        {t.share}
      </button>
    </div>
    {#if sigState !== undefined}
      <p class="sig" data-testid="{testid}-sig-state" data-state={sigState}>
        {sigState === "signed"
          ? format(t.signedBy, { name: personaOf(signer).displayName })
          : sigState === "stale"
            ? t.staleSignature
            : t.unsigned}
        · <span class="muted">{t.demoKeyNote}</span>
      </p>
    {/if}
    <p class="notice" role="status" data-testid="{testid}-notice">{notice}</p>

    {#if mode === "tabs"}
      <div
        class="tabs"
        role="tablist"
        aria-label={format(t.label, { id: spec.nip })}
        data-testid="{testid}-tabs"
      >
        {#each TABS as id, i (id)}
          <button
            bind:this={tabButtons[i]}
            type="button"
            role="tab"
            class="tab"
            id="{uid}-tab-{id}"
            data-testid="{testid}-tab-{id}"
            aria-selected={tab === id}
            aria-controls="{uid}-panel-{id}"
            tabindex={tab === id ? 0 : -1}
            onclick={() => (tab = id)}
            onkeydown={(e) => onTabKey(e, i)}
          >
            {t.tabs[id]}
            {#if id === "explain" && target !== undefined}
              <span class="dot" aria-hidden="true"></span>
            {/if}
          </button>
        {/each}
      </div>
    {/if}

    <div class="panes">
      <div
        class="pane form-pane"
        bind:this={formPane}
        {...paneAttrs("form")}
        data-testid="{testid}-pane-form"
      >
        {#if parseError}
          <p class="paused" role="alert">{t.jsonParseError}</p>
        {/if}
        <fieldset class="formset" disabled={parseError}>
          <legend class="sr">{t.tabs.form}</legend>
          <!-- Keyed by part: forms keep local drafts (plaintext, pasted strings) that belong to one part. -->
          {#key `${current.kind}-${current.part.id}`}
            {#if current.kind === "event"}
              <EventForm
                testid="{testid}-form"
                {locale}
                nip={spec.nip}
                part={current.part}
                bind:value={() => value, setValue}
                {issues}
                {signer}
                onselectpath={(p) => (selected = p)}
              />
            {:else if current.kind === "message"}
              <MessageForm
                testid="{testid}-form"
                {locale}
                nip={spec.nip}
                part={current.part}
                bind:value={() => value, setValue}
                {issues}
                onselectpath={(p) => (selected = p)}
              />
            {:else if current.kind === "document"}
              <DocumentForm
                testid="{testid}-form"
                {locale}
                nip={spec.nip}
                part={current.part}
                bind:value={() => value, setValue}
                {issues}
                onselectpath={(p) => (selected = p)}
              />
            {:else if current.kind === "http"}
              <HttpForm
                testid="{testid}-form"
                {locale}
                nip={spec.nip}
                part={current.part}
                bind:value={() => value, setValue}
                {issues}
                authEvent={authShape}
                {signer}
                onselectpath={(p) => (selected = p)}
              />
            {:else}
              <EncodingForm
                testid="{testid}-form"
                {locale}
                nip={spec.nip}
                part={current.part}
                bind:value={() => value, setValue}
                {issues}
                onselectpath={(p) => (selected = p)}
              />
            {/if}
          {/key}
        </fieldset>
      </div>
      <div class="side">
        <div class="pane" {...paneAttrs("json")} data-testid="{testid}-pane-json">
          <JsonCodeEditor
            testid="{testid}-json"
            {locale}
            label={format(t.jsonLabel, { label: text(current.part.label) })}
            bind:value={() => json, setJson}
            {diagnostics}
            highlight={selection === undefined ? [] : [selection]}
            onselectpath={(p) => (selected = p)}
          />
        </div>
        <div class="pane" {...paneAttrs("explain")} data-testid="{testid}-pane-explain">
          <ExplainPanel
            testid="{testid}-explain"
            {locale}
            nip={spec.nip}
            {target}
            {locate}
            onselectpath={jumpTo}
          />
        </div>
      </div>
    </div>
    {#if mode === "tabs" && tab !== "explain" && target !== undefined}
      <button
        type="button"
        class="peek"
        data-testid="{testid}-peek"
        onclick={() => (tab = "explain")}
      >
        <code>{target.breadcrumb.join(" › ") || "{ }"}</code>
        <span>{t.tabs.explain} →</span>
      </button>
    {/if}
  {/if}

  <HowItWorks
    testid="{testid}-how"
    {locale}
    {spec}
    bind:step={howStep}
    onfocus={focusFromWalkthrough}
  />
</div>

<style>
  .editor {
    display: grid;
    gap: var(--space-md);
    min-inline-size: 0;
    font-family: var(--font-family-body);
    color: var(--color-text);
  }
  .bar {
    display: grid;
    gap: var(--space-2xs);
    margin: 0;
    padding: 0;
    border: none;
    min-inline-size: 0;
  }
  .bar-label {
    padding: 0;
  }
  .bar-label,
  .flow-title {
    margin: 0;
    color: var(--color-text-muted);
    font-family: var(--font-family-mono);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-semibold);
    letter-spacing: var(--font-letter-spacing-caps);
    text-transform: uppercase;
  }
  /* Chips scroll sideways on phones rather than wrapping into a tall stack. */
  .chips,
  .flow {
    display: flex;
    gap: var(--space-xs);
    margin: 0;
    padding: var(--space-3xs) var(--space-xs) var(--space-xs) var(--space-3xs);
    overflow-x: auto;
    overscroll-behavior-x: contain;
    scrollbar-width: thin;
    list-style: none;
  }
  .chip,
  .flow-step {
    flex: none;
    display: inline-flex;
    align-items: center;
    gap: var(--space-xs);
    min-block-size: var(--size-control-md);
    padding: 0 var(--space-sm);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-pill);
    background: var(--color-surface);
    color: var(--color-text);
    font-family: var(--font-family-display);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    white-space: nowrap;
    cursor: pointer;
    box-shadow: var(--shadow-pressed);
    transition:
      box-shadow var(--motion-duration-press) var(--motion-easing-press),
      translate var(--motion-duration-press) var(--motion-easing-press),
      background-color var(--motion-duration-fast) var(--motion-easing-standard);
  } /* Parts and examples wrap instead of scrolling: a clipped last chip ("HTT…") hid that more
     parts (REQ/OK, the HTTP callback) exist at all. Only the flow keeps its scroller. */
  .chips {
    flex-wrap: wrap;
    overflow-x: visible;
  }
  .chips .chip {
    max-inline-size: 100%;
    white-space: normal;
    text-align: start;
  }
  .reset {
    justify-self: start;
  }

  @media (hover: hover) {
    .chip:hover:not([aria-pressed="true"]),
    .flow-step:hover:not([aria-pressed="true"]) {
      translate: calc(var(--size-lift) * -1) calc(var(--size-lift) * -1);
      box-shadow: var(--shadow-pop-sm);
    }
  }
  .chip[aria-pressed="true"],
  .flow-step[aria-pressed="true"] {
    background: var(--color-primary);
    color: var(--color-on-primary);
    box-shadow: var(--shadow-pop-sm);
  }
  .chip.ghost {
    border-style: dashed;
    background: transparent;
  }
  .kind {
    padding: 0 var(--space-2xs);
    border-radius: var(--radius-sm);
    background: var(--color-surface-sunken);
    color: var(--color-text);
    font-family: var(--font-family-mono);
    font-size: var(--font-size-2xs);
    font-weight: var(--font-weight-medium);
    text-transform: uppercase;
  }
  .flows {
    display: grid;
    gap: var(--space-2xs);
  }
  .flow li {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
  }
  .flow li + li::before {
    content: "→";
    color: var(--color-text-subtle);
    font-family: var(--font-family-mono);
  }
  .toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-sm);
  }
  .spacer {
    flex: 1;
  }
  .signer {
    display: inline-flex;
    align-items: center;
    gap: var(--space-xs);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
  }
  .signer select {
    min-block-size: var(--size-control-sm);
    padding: 0 var(--space-xs);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-sm);
    background: var(--color-surface);
    color: var(--color-text);
    font: inherit;
    /* 16px+ keeps iOS from zooming into the select on focus. */
    font-size: var(--font-size-md);
  }
  .btn {
    min-block-size: var(--size-control-sm);
    padding: 0 var(--space-sm);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-md);
    background: var(--color-surface);
    color: var(--color-text);
    font-family: var(--font-family-display);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    cursor: pointer;
    box-shadow: var(--shadow-pop-sm);
    transition:
      box-shadow var(--motion-duration-press) var(--motion-easing-press),
      translate var(--motion-duration-press) var(--motion-easing-press);
  }
  .btn.primary {
    background: var(--color-primary);
    color: var(--color-on-primary);
  }
  @media (hover: hover) {
    .btn:hover:not(:disabled) {
      translate: calc(var(--size-lift) * -1) calc(var(--size-lift) * -1);
      box-shadow: var(--shadow-lift);
    }
  }
  .btn:active:not(:disabled),
  .chip:active,
  .flow-step:active {
    translate: var(--size-lift) var(--size-lift);
    box-shadow: var(--shadow-pressed);
  }
  .btn:disabled {
    opacity: var(--opacity-disabled);
    cursor: not-allowed;
  }
  @media (pointer: coarse) {
    .btn,
    .signer select,
    .chip,
    .flow-step {
      min-block-size: var(--size-touch-target);
    }
  }
  .sig,
  .notice {
    margin: 0;
    font-size: var(--font-size-sm);
  }
  .sig {
    padding: var(--space-2xs) var(--space-sm);
    border-inline-start: var(--border-width-thick) solid var(--color-info);
    background: var(--color-info-subtle);
  }
  .sig[data-state="signed"] {
    border-color: var(--color-success);
    background: var(--color-success-subtle);
  }
  .sig[data-state="stale"] {
    border-color: var(--color-warning);
    background: var(--color-warning-subtle);
  }
  .muted {
    color: var(--color-text-muted);
  }
  .notice:empty {
    display: none;
  }
  .notice {
    color: var(--color-text-muted);
  }
  .tabs {
    display: flex;
    gap: var(--space-2xs);
    justify-self: start;
    max-inline-size: 100%;
    padding: var(--space-2xs) var(--space-xs) var(--space-xs) var(--space-2xs);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-md);
    background: var(--color-surface-sunken);
    overflow-x: auto;
  }
  .tab {
    position: relative;
    flex: none;
    min-block-size: var(--size-touch-target);
    padding: 0 var(--space-md);
    border: var(--border-width-medium) solid transparent;
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--color-text-muted);
    font-family: var(--font-family-display);
    font-size: var(--font-size-md);
    font-weight: var(--font-weight-semibold);
    cursor: pointer;
    touch-action: manipulation;
  }
  .tab[aria-selected="true"] {
    border-color: var(--color-border-strong);
    background: var(--color-primary);
    color: var(--color-on-primary);
    box-shadow: var(--shadow-pop-sm);
  }
  .dot {
    position: absolute;
    inset-block-start: var(--space-2xs);
    inset-inline-end: var(--space-2xs);
    inline-size: var(--space-xs);
    block-size: var(--space-xs);
    border-radius: var(--radius-round);
    background: var(--color-secondary);
  }
  .panes {
    display: grid;
    gap: var(--space-md);
    min-inline-size: 0;
  }
  .side {
    display: grid;
    gap: var(--space-md);
    align-content: start;
    min-inline-size: 0;
  }
  /* Split (md and up): form on the left; JSON with its explanation pinned on the right. */
  .split .panes {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    align-items: start;
  }
  .split .side {
    position: sticky;
    inset-block-start: var(--space-md);
  }
  .pane[hidden] {
    display: none;
  }
  .pane {
    min-inline-size: 0;
  }
  .formset {
    margin: 0;
    padding: 0;
    border: none;
    min-inline-size: 0;
  }
  .formset:disabled {
    opacity: var(--opacity-dimmed);
  }
  .paused {
    margin: 0 0 var(--space-sm);
    padding: var(--space-xs) var(--space-sm);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-sm);
    background: var(--color-warning-subtle);
    font-size: var(--font-size-sm);
  }
  .sr {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
  /* Phones: a slip at the bottom shows what is selected and jumps to its explanation. */
  .peek {
    position: sticky;
    inset-block-end: var(--space-sm);
    z-index: var(--z-sticky);
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--space-sm);
    min-block-size: var(--size-touch-target);
    padding: 0 var(--space-md);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-md);
    background: var(--color-highlight);
    color: var(--color-on-highlight);
    font-family: var(--font-family-display);
    font-weight: var(--font-weight-semibold);
    box-shadow: var(--shadow-pop);
    cursor: pointer;
  }
  .peek code {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-family: var(--font-family-mono);
    font-size: var(--font-size-sm);
  }
  .chip:focus-visible,
  .flow-step:focus-visible,
  .btn:focus-visible,
  .tab:focus-visible,
  .peek:focus-visible,
  .signer select:focus-visible {
    outline: var(--border-width-thick) solid var(--color-focus-ring);
    outline-offset: var(--size-focus-offset);
  }
</style>
