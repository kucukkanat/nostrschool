<script lang="ts">
  import { format, getDictionary, type Locale, plural } from "@nostrschool/i18n";
  import { Mascot } from "@nostrschool/mascot";
  import { Button, Card, emit, JsonView, shake } from "@nostrschool/ui";
  import { untrack } from "svelte";
  import { mascotRive } from "~/lib/href";
  import { verdictText } from "./describe.ts";
  import ExplodedEvent from "./ExplodedEvent.svelte";
  import FieldDetail from "./FieldDetail.svelte";
  import {
    countChanged,
    diffMask,
    type EventField,
    fieldFromPath,
    type LabAction,
    type LabMode,
    type LabState,
    reduceLab,
    suspectFields,
    type TamperTarget,
    verifyView,
  } from "./lab.ts";
  import { LAB_AUTHOR, sampleNote } from "./sample.ts";
  import VerifyPipeline from "./VerifyPipeline.svelte";

  interface Props {
    readonly locale: Locale;
    /** Pipeline stage delay override (tests); defaults to the motion token. */
    readonly stepMs?: number;
  }

  const { locale, stepMs }: Props = $props();
  const t = $derived(getDictionary(locale).chapters.ch03);

  const original = untrack(() => sampleNote(getDictionary(locale).chapters.ch03.sampleContent));
  let lab = $state.raw<LabState>({ mode: "author", event: original });
  const view = $derived(verifyView(lab.event));
  let run = $state(0);
  let selected = $state<EventField | undefined>("id");
  let layout = $state<"exploded" | "json">("exploded");
  let narration = $state(untrack(() => getDictionary(locale).chapters.ch03.lab.narration.ready));
  let bubble = $state<string | undefined>();
  let refused = $state(0);
  /** id before the last edit vs after: drives the "avalanche" highlight. */
  let avalanche = $state.raw<{ readonly before: string; readonly after: string } | undefined>();
  // Mascot reacts only when the verdict flips (or on explicit tamper/re-sign), not on every keystroke.
  let lastVerdict: "ok" | "error" = "ok";
  let forceReact = false;

  const flagged = $derived(suspectFields(view));
  const modes: readonly LabMode[] = ["author", "forger"];
  const tamperTargets: readonly TamperTarget[] = ["content", "created_at", "id", "sig"];
  const mask = $derived(avalanche === undefined ? [] : diffMask(avalanche.before, avalanche.after));

  const dispatch = (action: LabAction, message: string): void => {
    const before = view.computedId;
    const next = reduceLab(lab, action, LAB_AUTHOR.secretKeyHex);
    if (!next.ok) {
      narration = t.lab.noKey;
      bubble = t.lab.noKey;
      refused += 1;
      return;
    }
    lab = next.value;
    const after = verifyView(lab.event).computedId;
    if (after !== before) avalanche = { before, after };
    forceReact = action.type === "tamper" || action.type === "resign";
    narration = message;
    run += 1;
  };

  const onsettle = (settledView: typeof view): void => {
    if (settledView.status === lastVerdict && !forceReact) return;
    lastVerdict = settledView.status;
    forceReact = false;
    if (settledView.status === "ok") {
      bubble = t.lab.mascot.valid;
      emit("signature:valid", { eventId: settledView.claimedId });
    } else {
      bubble = t.lab.mascot.invalid;
      emit("signature:invalid", { reason: settledView.code ?? "unknown" });
    }
  };

  const edited = (field: EventField) => format(t.lab.narration.edited, { field });
  const shakeOn = (node: HTMLElement, n: number): void => {
    if (n > 0) shake(node);
  };
</script>

<Card testid="ch03-lab" variant="raised" padding="lg">
  <div class="lab">
    <header class="head">
      <div>
        <h3 class="title" data-testid="ch03-lab-title">{t.lab.title}</h3>
        <p class="desc">{t.lab.description}</p>
      </div>
      <div class="mascot">
        <Mascot
          {locale}
          size="sm"
          testid="ch03-mascot"
          announce={false}
          {...mascotRive}
          {...bubble === undefined ? {} : { say: bubble }}
        />
      </div>
    </header>

    <fieldset class="modes" data-testid="ch03-lab-modes">
      <legend>{t.lab.modeLabel}</legend>
      <div class="row">
        {#each modes as mode (mode)}
          <Button
            testid="ch03-lab-mode-{mode}"
            variant={lab.mode === mode ? "primary" : "secondary"}
            size="sm"
            pressed={lab.mode === mode}
            onclick={() =>
              dispatch(
                { type: "set-mode", mode },
                format(t.lab.narration.modeChanged, { mode: t.lab.modes[mode] }),
              )}
            >{t.lab.modes[mode]}</Button
          >
        {/each}
      </div>
      <p class="hint" data-testid="ch03-lab-mode-hint">{t.lab.modeHint[lab.mode]}</p>
    </fieldset>

    <div class="editor">
      <label class="field">
        <span class="label"><code>{t.lab.contentLabel}</code></span>
        <textarea
          data-testid="ch03-lab-content"
          rows="2"
          value={lab.event.content}
          oninput={(e) =>
            dispatch({ type: "edit-content", content: e.currentTarget.value }, edited("content"))}
        ></textarea>
      </label>
      <div class="row">
        <Button
          testid="ch03-lab-time-earlier"
          variant="ghost"
          size="sm"
          onclick={() => dispatch({ type: "shift-time", seconds: -1 }, edited("created_at"))}
          >{t.lab.timeEarlier}</Button
        >
        <Button
          testid="ch03-lab-time-later"
          variant="ghost"
          size="sm"
          onclick={() => dispatch({ type: "shift-time", seconds: 1 }, edited("created_at"))}
          >{t.lab.timeLater}</Button
        >
      </div>
    </div>

    <fieldset class="tamper" data-testid="ch03-lab-tamper">
      <legend>{t.lab.tamperHeading}</legend>
      <div class="row">
        {#each tamperTargets as target (target)}
          <Button
            testid="ch03-lab-tamper-{target}"
            variant="danger"
            size="sm"
            onclick={() =>
              dispatch(
                { type: "tamper", target },
                format(t.lab.narration.tampered, { field: target }),
              )}
            >{t.lab.tamper[target]}</Button
          >
        {/each}
      </div>
      <div class="row">
        {#key refused}
          <span use:shakeOn={refused}>
            <Button
              testid="ch03-lab-resign"
              variant="primary"
              size="sm"
              onclick={() => dispatch({ type: "resign" }, t.lab.narration.resigned)}
              >{t.lab.resign}</Button
            >
          </span>
        {/key}
        <Button
          testid="ch03-lab-reset"
          variant="ghost"
          size="sm"
          onclick={() => {
            dispatch({ type: "reset", event: original }, t.lab.narration.reset);
            avalanche = undefined;
          }}
          >{t.lab.reset}</Button
        >
      </div>
    </fieldset>

    <p class="visually-hidden" aria-live="polite" data-testid="ch03-lab-narration">{narration}</p>

    <div
      class="verdict"
      data-testid="ch03-lab-verdict"
      data-status={view.status}
      data-code={view.code ?? "valid"}
    >
      {verdictText(locale, view)}
    </div>

    <div class="avalanche" data-testid="ch03-lab-avalanche">
      {#if avalanche === undefined}
        <p class="hint">{t.lab.avalancheIdle}</p>
      {:else}
        <p data-testid="ch03-lab-avalanche-count">
          {plural(locale, countChanged(avalanche.before, avalanche.after), t.lab.avalanche)}
        </p>
        <span class="visually-hidden">{t.lab.avalancheLabel}</span>
        <code class="digits">
          {#each [...avalanche.after] as ch, i (i)}
            <span class:changed={mask[i]}>{ch}</span>
          {/each}
        </code>
      {/if}
    </div>

    <VerifyPipeline
      testid="ch03-pipeline"
      {locale}
      {view}
      {run}
      {onsettle}
      {...stepMs === undefined ? {} : { stepMs }}
    />

    <fieldset class="viewbar">
      <legend class="visually-hidden">{t.lab.view.label}</legend>
      <div class="row">
        <Button
          testid="ch03-lab-view-exploded"
          size="sm"
          variant={layout === "exploded" ? "primary" : "ghost"}
          pressed={layout === "exploded"}
          onclick={() => (layout = "exploded")}
          >{t.lab.view.exploded}</Button
        >
        <Button
          testid="ch03-lab-view-json"
          size="sm"
          variant={layout === "json" ? "primary" : "ghost"}
          pressed={layout === "json"}
          onclick={() => (layout = "json")}
          >{t.lab.view.json}</Button
        >
      </div>
    </fieldset>

    <div class="anatomy">
      {#if layout === "exploded"}
        <ExplodedEvent testid="ch03-exploded" {locale} event={lab.event} {flagged} bind:selected />
      {:else}
        <JsonView
          testid="ch03-json"
          {locale}
          value={lab.event}
          highlightPaths={flagged}
          onselectpath={(path) => (selected = fieldFromPath(path))}
        />
      {/if}
      {#if selected !== undefined}
        <FieldDetail testid="ch03-detail" {locale} event={lab.event} field={selected} />
      {/if}
    </div>
  </div>
</Card>

<style>
  .lab {
    display: flex;
    flex-direction: column;
    gap: var(--space-lg);
    min-height: var(--size-diagram-min-height);
  }
  .head {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-md);
  }
  .head > div:first-child {
    flex: 1 1 calc(var(--size-rail) * 0.75);
  }
  .title {
    margin: 0;
    font-family: var(--font-family-display);
    font-size: var(--font-size-2xl);
    color: var(--color-text-primary);
  }
  .desc,
  .hint {
    margin: 0;
    color: var(--color-text-muted);
  }
  .hint {
    font-size: var(--font-size-sm);
  }
  .mascot {
    flex: none;
  }
  .viewbar {
    padding: 0;
    border: none;
  }
  fieldset {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
    margin: 0;
    padding: var(--space-sm) var(--space-md);
    border: var(--border-width-thin) solid var(--color-border);
    border-radius: var(--radius-lg);
  }
  .tamper {
    border-style: dashed;
    border-color: var(--color-danger);
  }
  legend {
    padding: 0 var(--space-2xs);
    font-family: var(--font-family-display);
    font-weight: var(--font-weight-bold);
  }
  .row {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-xs);
  }
  .editor {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: var(--space-2xs);
  }
  .label code {
    font-family: var(--font-family-mono);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
  }
  textarea {
    width: 100%;
    min-height: var(--size-touch-target);
    padding: var(--space-xs) var(--space-sm);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-md);
    background: var(--color-surface-sunken);
    color: var(--color-text);
    font-family: var(--font-family-mono);
    font-size: var(--font-size-md);
    resize: vertical;
  }
  textarea:focus-visible {
    outline: var(--border-width-thick) solid var(--color-focus-ring);
    outline-offset: var(--space-3xs);
  }
  .verdict {
    padding: var(--space-sm) var(--space-md);
    border-radius: var(--radius-lg);
    font-weight: var(--font-weight-bold);
    border: var(--border-width-medium) solid var(--color-success);
    background: var(--color-success-subtle);
    color: var(--color-text);
    transition:
      background var(--motion-duration-normal) var(--motion-easing-standard),
      border-color var(--motion-duration-normal) var(--motion-easing-standard);
  }
  .verdict[data-status="error"] {
    border-color: var(--color-danger);
    background: var(--color-danger-subtle);
  }
  .avalanche p {
    margin: 0;
  }
  .digits {
    display: block;
    margin-top: var(--space-2xs);
    padding: var(--space-2xs) var(--space-xs);
    border-radius: var(--radius-sm);
    background: var(--color-code-bg);
    color: var(--color-code-text);
    font-family: var(--font-family-mono);
    font-size: var(--font-size-xs);
    overflow-wrap: anywhere;
  }
  .digits .changed {
    background: var(--color-code-highlight);
    color: var(--color-code-string);
    font-weight: var(--font-weight-bold);
  }
  .anatomy {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
  }
</style>
