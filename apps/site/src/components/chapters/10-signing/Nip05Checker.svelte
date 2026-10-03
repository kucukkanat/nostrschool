<script lang="ts">
  import { Pipeline } from "@nostrschool/diagrams";
  import { getPersona } from "@nostrschool/fixtures";
  import { format, getDictionary, type Locale } from "@nostrschool/i18n";
  import { Button, emit, JsonView, pop } from "@nostrschool/ui";
  import {
    listedPubkey,
    NIP05_SCENARIOS,
    NIP05_STAGES,
    type Nip05Flow,
    verifyNip05Flow,
  } from "./nip05.ts";

  const { locale }: { readonly locale: Locale } = $props();
  const t = $derived(getDictionary(locale).chapters.ch10.nip05);

  const alice = getPersona("alice");
  let identifier = $state(NIP05_SCENARIOS[0]?.identifier ?? "");
  let flow: Nip05Flow | undefined = $state();

  const verify = (): void => {
    flow = verifyNip05Flow(identifier, alice.pubkey);
    if (flow.outcome.ok) emit("celebrate", { reason: "nip05-verified" });
    else emit("warning", { reason: `nip05:${flow.outcome.error.code}` });
  };
  const pick = (value: string): void => {
    identifier = value;
    verify();
  };

  const stageValue = (f: Nip05Flow | undefined, i: number): string | undefined => {
    const a = f?.address;
    if (a === undefined) return undefined;
    if (i === 0) return `${a.name} @ ${a.domain}`;
    if (i === 1) return a.wellKnownUrl;
    const listed = listedPubkey(f?.document, a.name);
    const short = (k: string): string => `${k.slice(0, 12)}…`;
    if (i === 2) return listed === undefined ? undefined : short(listed);
    // "=" / "≠": the comparison itself, shown as math rather than words.
    return listed === undefined
      ? undefined
      : `${short(listed)} ${listed === alice.pubkey ? "=" : "≠"} ${short(alice.pubkey)}`;
  };
  const stages = $derived(
    NIP05_STAGES.map((id, i) => {
      const value = stageValue(flow, i);
      return {
        id,
        label: t.stages[id].label,
        description: t.stages[id].description,
        ...(value === undefined ? {} : { value }),
      };
    }),
  );
  const status = $derived(flow === undefined ? "idle" : flow.outcome.ok ? "ok" : "error");
  const resultKey = $derived(
    flow === undefined ? undefined : flow.outcome.ok ? "ok" : flow.outcome.error.code,
  );
</script>

<section class="nip05" data-testid="ch10-nip05" aria-labelledby="ch10-nip05-title">
  <h3 id="ch10-nip05-title" class="title">{t.title}</h3>
  <p class="intro">{t.intro}</p>

  <fieldset class="chips">
    <legend class="visually-hidden">{t.scenariosLabel}</legend>
    {#each NIP05_SCENARIOS as s (s.id)}
      <button
        type="button"
        class="chip"
        aria-pressed={identifier === s.identifier}
        data-testid="ch10-nip05-scenario-{s.id}"
        onclick={() => pick(s.identifier)}
      >
        {t.scenarios[s.id]}
      </button>
    {/each}
  </fieldset>

  <form
    class="row"
    onsubmit={(e) => {
      e.preventDefault();
      verify();
    }}
  >
    <label class="field">
      <span>{t.inputLabel}</span>
      <input
        bind:value={identifier}
        spellcheck="false"
        autocomplete="off"
        data-testid="ch10-nip05-input"
      >
    </label>
    <Button testid="ch10-nip05-verify" type="submit">{t.verify}</Button>
  </form>
  <p class="claimed" data-testid="ch10-nip05-claimed">
    {format(t.claimedKey, { pubkey: `${alice.pubkey.slice(0, 16)}…` })}
  </p>

  <Pipeline
    testid="ch10-nip05-pipeline"
    {locale}
    title={t.pipelineTitle}
    description={t.pipelineDescription}
    {stages}
    active={flow === undefined ? 0 : flow.reached}
    {status}
    {...flow !== undefined && !flow.outcome.ok ? { errorAt: flow.reached } : {}}
  />

  <div aria-live="polite" class="outcome-slot">
    {#if flow !== undefined && resultKey !== undefined}
      {#key `${identifier}-${resultKey}`}
        <p
          class="outcome"
          data-ok={flow.outcome.ok}
          data-testid="ch10-nip05-result"
          data-code={resultKey}
          use:pop
        >
          {format(t.results[resultKey], { display: flow.address?.display ?? identifier })}
        </p>
      {/key}
    {/if}
  </div>

  {#if flow?.document !== undefined}
    <h4 class="doc-title">{t.documentTitle}</h4>
    <div class="doc">
      <JsonView
        testid="ch10-nip05-document"
        {locale}
        value={flow.document}
        highlightPaths={flow.address === undefined ? [] : [`names.${flow.address.name}`]}
      />
    </div>
  {/if}
</section>

<style>
  .nip05 {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
    margin: var(--space-xl) 0;
    padding: var(--space-lg);
    border-radius: var(--radius-xl);
    border: var(--border-width-thick) solid var(--color-border-strong);
    background: var(--color-surface);
    box-shadow: var(--shadow-pop);
    min-height: var(--size-diagram-min-height);
  }
  .title {
    margin: 0;
    font-family: var(--font-family-display);
    font-size: var(--font-size-xl);
    color: var(--color-text-primary);
  }
  .intro,
  .claimed {
    margin: 0;
    color: var(--color-text-muted);
  }
  .claimed {
    font-family: var(--font-family-mono);
    font-size: var(--font-size-xs);
    overflow-wrap: anywhere;
  }
  .chips {
    margin: 0;
    padding: 0;
    border: none;
    min-width: 0;
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-xs);
  }
  .chip {
    min-height: var(--size-touch-target);
    padding: var(--space-2xs) var(--space-sm);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-pill);
    background: var(--color-surface-raised);
    color: var(--color-text);
    font: inherit;
    font-weight: var(--font-weight-semibold);
    cursor: pointer;
    transition: transform var(--motion-duration-fast) var(--motion-easing-bounce);
  }
  .chip:hover {
    transform: translateY(calc(-1 * var(--space-3xs)));
  }
  .chip[aria-pressed="true"] {
    border-color: var(--color-primary);
    background: var(--color-primary-subtle);
  }
  .chip:focus-visible,
  input:focus-visible {
    outline: var(--border-width-thick) solid var(--color-focus-ring);
    outline-offset: var(--space-3xs);
  }
  .row {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: var(--space-xs);
  }
  .field {
    flex: 1 1 calc(var(--size-rail) / 1.5);
    display: flex;
    flex-direction: column;
    gap: var(--space-3xs);
    font-weight: var(--font-weight-semibold);
  }
  input {
    font-family: var(--font-family-mono);
    padding: var(--space-xs);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-md);
    background: var(--color-surface);
    color: var(--color-text);
    min-height: var(--size-touch-target);
  }
  .outcome-slot {
    min-height: var(--size-touch-target);
  }
  .outcome {
    margin: 0;
    padding: var(--space-xs) var(--space-sm);
    border-radius: var(--radius-md);
    font-weight: var(--font-weight-bold);
    background: var(--color-danger-subtle);
    color: var(--color-text);
  }
  .outcome[data-ok="true"] {
    background: var(--color-success-subtle);
  }
  .doc-title {
    margin: 0;
    font-size: var(--font-size-sm);
  }
  .doc {
    overflow: auto;
  }
</style>
