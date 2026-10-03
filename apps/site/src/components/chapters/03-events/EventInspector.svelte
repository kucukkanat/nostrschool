<script lang="ts">
  import { getDictionary, type Locale } from "@nostrschool/i18n";
  import type { EventShapeError, Result } from "@nostrschool/protocol";
  import { Badge, Button, Card, emit, pop } from "@nostrschool/ui";
  import { kindSummary, shapeErrorText, verdictText } from "./describe.ts";
  import ExplodedEvent from "./ExplodedEvent.svelte";
  import FieldDetail from "./FieldDetail.svelte";
  import {
    type EventField,
    flipTextChar,
    type Inspection,
    inspectJson,
    prettyEvent,
    suspectFields,
    type VerifyView,
  } from "./lab.ts";
  import { sampleReply } from "./sample.ts";
  import VerifyPipeline from "./VerifyPipeline.svelte";

  interface Props {
    readonly locale: Locale;
    readonly testid?: string;
    /** Pipeline stage delay override (tests); defaults to the motion token. */
    readonly stepMs?: number;
  }

  const { locale, testid = "ch03-inspector", stepMs }: Props = $props();
  const t = $derived(getDictionary(locale).chapters.ch03);

  let json = $state("");
  let result = $state.raw<Result<Inspection, EventShapeError> | undefined>();
  let run = $state(0);
  let selected = $state<EventField | undefined>();

  const inspect = (): void => {
    result = json.trim() === "" ? undefined : inspectJson(json);
    selected = result?.ok === true ? "kind" : undefined;
    run += 1;
  };
  const load = (text: string): void => {
    json = text;
    inspect();
  };
  const onsettle = (view: VerifyView): void => {
    if (view.status === "ok") emit("signature:valid", { eventId: view.claimedId });
    else emit("signature:invalid", { reason: view.code ?? "unknown" });
  };
</script>

<Card {testid} variant="raised" padding="lg">
  <div class="inspector">
    <label class="input">
      <span class="label">{t.inspector.inputLabel}</span>
      <textarea
        data-testid="{testid}-input"
        rows="10"
        spellcheck="false"
        placeholder={t.inspector.placeholder}
        bind:value={json}
        onkeydown={(e) => {
          // Ctrl/Cmd+Enter inspects without leaving the keyboard.
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) inspect();
        }}
      ></textarea>
    </label>
    <p class="hint">{t.inspector.privacy}</p>
    <div class="row">
      <Button testid="{testid}-inspect" variant="primary" onclick={inspect}
        >{t.inspector.inspect}</Button
      >
      <Button
        testid="{testid}-sample"
        variant="secondary"
        onclick={() => load(prettyEvent(sampleReply()))}
        >{t.inspector.loadSample}</Button
      >
      <Button
        testid="{testid}-tampered"
        variant="secondary"
        onclick={() => {
          const e = sampleReply();
          load(prettyEvent({ ...e, content: flipTextChar(e.content) }));
        }}
        >{t.inspector.loadTampered}</Button
      >
      <Button testid="{testid}-clear" variant="ghost" onclick={() => load("")}
        >{t.inspector.clear}</Button
      >
    </div>

    <div aria-live="polite" data-testid="{testid}-status">
      {#if result === undefined}
        <p class="hint" data-testid="{testid}-empty">{t.inspector.empty}</p>
      {:else if !result.ok}
        <div class="error" data-testid="{testid}-error" data-code={result.error.code} use:pop>
          <strong>{t.inspector.errorTitle}</strong>
          <p>{shapeErrorText(locale, result.error)}</p>
        </div>
      {:else}
        {@const view = result.value.view}
        {@const kind = kindSummary(locale, result.value.event.kind)}
        <div
          class="verdict"
          data-testid="{testid}-verdict"
          data-status={view.status}
          data-code={view.code ?? "valid"}
          use:pop
        >
          <Badge testid="{testid}-verdict-badge" tone={view.status === "ok" ? "success" : "danger"}
            >{view.status === "ok" ? "✓" : "✗"}</Badge
          >
          <span>{verdictText(locale, view)}</span>
        </div>
        <p class="kind" data-testid="{testid}-kind">
          <strong>{result.value.event.kind}: {kind.name}</strong>
          {#if kind.category !== undefined}
            <Badge testid="{testid}-kind-category" tone={kind.category} size="sm"
              >{kind.categoryName}</Badge
            >
          {/if}
        </p>
      {/if}
    </div>

    {#if result?.ok === true}
      {@const { event: inspected, view } = result.value}
      <VerifyPipeline
        testid="{testid}-pipeline"
        {locale}
        {view}
        {run}
        {onsettle}
        {...stepMs === undefined ? {} : { stepMs }}
      />
      <dl class="ids">
        <dt>{t.inspector.claimedId}</dt>
        <dd><code data-testid="{testid}-claimed">{view.claimedId}</code></dd>
        <dt>{t.inspector.computedId}</dt>
        <dd><code data-testid="{testid}-computed">{view.computedId}</code></dd>
        <dt>{t.inspector.serialized}</dt>
        <dd><code data-testid="{testid}-serialized">{view.serialized}</code></dd>
      </dl>
      <h3 class="heading">{t.fields.heading}</h3>
      <ExplodedEvent
        testid="{testid}-exploded"
        {locale}
        event={inspected}
        flagged={suspectFields(view)}
        bind:selected
      />
      {#if selected !== undefined}
        <FieldDetail testid="{testid}-detail" {locale} event={inspected} field={selected} />
      {/if}
    {/if}
  </div>
</Card>

<style>
  .inspector {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
    min-height: var(--size-diagram-min-height);
  }
  .input {
    display: flex;
    flex-direction: column;
    gap: var(--space-2xs);
  }
  .label,
  .heading {
    margin: 0;
    font-family: var(--font-family-display);
    font-weight: var(--font-weight-bold);
  }
  .heading {
    font-size: var(--font-size-xl);
  }
  textarea {
    width: 100%;
    padding: var(--space-sm);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-md);
    background: var(--color-surface-sunken);
    color: var(--color-text);
    font-family: var(--font-family-mono);
    font-size: var(--font-size-sm);
    resize: vertical;
  }
  textarea:focus-visible {
    outline: var(--border-width-thick) solid var(--color-focus-ring);
    outline-offset: var(--space-3xs);
  }
  .hint {
    margin: 0;
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
  }
  .row {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-xs);
  }
  .error,
  .verdict {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-xs);
    padding: var(--space-sm) var(--space-md);
    border-radius: var(--radius-lg);
    border: var(--border-width-medium) solid var(--color-danger);
    background: var(--color-danger-subtle);
    color: var(--color-text);
  }
  .error {
    flex-direction: column;
    align-items: flex-start;
  }
  .error p {
    margin: 0;
  }
  .verdict[data-status="ok"] {
    border-color: var(--color-success);
    background: var(--color-success-subtle);
  }
  .kind {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-xs);
    margin: var(--space-xs) 0 0;
  }
  .ids {
    display: grid;
    gap: var(--space-2xs);
    margin: 0;
  }
  .ids dt {
    font-weight: var(--font-weight-bold);
  }
  .ids dd {
    margin: 0 0 var(--space-xs);
  }
  .ids code {
    display: block;
    padding: var(--space-2xs) var(--space-xs);
    border-radius: var(--radius-sm);
    background: var(--color-code-bg);
    color: var(--color-code-text);
    font-family: var(--font-family-mono);
    font-size: var(--font-size-xs);
    overflow-wrap: anywhere;
  }
</style>
