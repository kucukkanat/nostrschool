<script lang="ts">
  import { PERSONAS } from "@nostrschool/fixtures";
  import { format } from "@nostrschool/i18n";
  import type { EncodingInputSpec, JsonPath } from "@nostrschool/nips";
  import {
    decodeToInputs,
    demoSecretFor,
    type EncodingError,
    type EncodingInputs,
    encodeInputs,
    isCostlyCodec,
    isSecretInput,
    personaFromSecret,
  } from "../logic/encoding.ts";
  import { isJsonObject } from "../logic/event.ts";
  import { editorStrings, hasNipText, nipText } from "../logic/text.ts";
  import { issueMessage } from "../logic/validate.ts";
  import type { EncodingFormProps } from "../types.ts";
  import FieldInput from "./FieldInput.svelte";

  let {
    testid,
    locale,
    nip,
    part,
    value = $bindable(),
    issues,
    onselectpath,
  }: EncodingFormProps = $props();
  const t = $derived(editorStrings(locale));
  const text = $derived(nipText(locale, nip));
  const message = $derived(issueMessage(locale));
  const uid = $props.id();

  const inputs = $derived<EncodingInputs>(
    isJsonObject(value)
      ? Object.fromEntries(
          Object.entries(value).flatMap(([k, v]): [string, string | readonly string[]][] =>
            typeof v === "string"
              ? [[k, v]]
              : Array.isArray(v)
                ? [[k, v.filter((x): x is string => typeof x === "string")]]
                : [],
          ),
        )
      : {},
  );
  const list = (input: EncodingInputSpec): readonly string[] => {
    const v = inputs[input.name];
    return typeof v === "string" ? [v] : (v ?? []);
  };
  const setInput = (name: string, v: string | readonly string[]) => {
    value = { ...inputs, [name]: typeof v === "string" ? v : [...v] };
  };
  // Cheap codecs encode on every keystroke; scrypt (NIP-49) waits for the Encode button and
  // its result is dropped as soon as an input changes, so a stale string is never shown.
  const costly = $derived(isCostlyCodec(part.codec));
  const inputsKey = $derived(JSON.stringify(inputs));
  let manual = $state.raw<
    { readonly key: string; readonly result: ReturnType<typeof encodeInputs> } | undefined
  >();
  const result = $derived(
    costly ? (manual?.key === inputsKey ? manual.result : undefined) : encodeInputs(part, inputs),
  );
  const run = () => {
    manual = { key: inputsKey, result: encodeInputs(part, inputs) };
  };
  const errorText = (e: EncodingError) =>
    format(t.encoding.errors[e.code], {
      input: e.input ?? "",
      reason: e.message,
      logn: e.logn ?? "",
      mib: e.mib ?? "",
    });

  // The output box is editable: paste a string to decode it back into the inputs.
  let pasted = $state<string | undefined>(undefined);
  let decodeError = $state("");
  const shown = $derived(pasted ?? (result?.ok === true ? result.value.encoded : ""));
  const decode = () => {
    if (pasted === undefined) return;
    const r = decodeToInputs(part, pasted, inputs);
    decodeError = r.ok ? "" : errorText(r.error);
    if (r.ok) {
      value = Object.fromEntries(
        Object.entries(r.value).map(([k, v]) => [k, typeof v === "string" ? v : [...v]]),
      );
      pasted = undefined;
    }
  };
  const issuesAt = (path: JsonPath) =>
    issues.filter(
      (i) =>
        i.severity !== "info" &&
        i.path.length === path.length &&
        i.path.every((p, k) => p === path[k]),
    );
  const select = (path: JsonPath) => (e: FocusEvent) => {
    e.stopPropagation();
    onselectpath?.(path);
  };
  const tlvName = (type: number): string =>
    type === 0
      ? t.encoding.tlvTypes.t0
      : type === 1
        ? t.encoding.tlvTypes.t1
        : type === 2
          ? t.encoding.tlvTypes.t2
          : t.encoding.tlvTypes.t3;
</script>

<div class="form" data-testid={testid} data-codec={part.codec}>
  {#if hasNipText(nip, part.explain)}
    <p class="help">{text(part.explain)}</p>
  {/if}
  <section class="block">
    <h4 class="block-title">{t.encoding.inputs}</h4>
    {#each part.inputs as input (input.name)}
      <div
        class="input"
        data-testid="{testid}-input-{input.name}"
        onfocusin={select([input.name])}
        data-json-path={JSON.stringify([input.name])}
      >
        {#if isSecretInput(input)}
          <label class="lbl" for="{uid}-{input.name}">{input.name}</label>
          <select
            id="{uid}-{input.name}"
            class="select"
            data-testid="{testid}-input-{input.name}-persona"
            value={personaFromSecret(list(input)[0])}
            onchange={(e) => setInput(input.name, demoSecretFor(input, e.currentTarget.value))}
          >
            {#each PERSONAS as p (p.id)}
              <option value={p.id}>{p.displayName}</option>
            {/each}
          </select>
          <code class="secret">{list(input)[0] ?? ""}</code>
          <p class="warn">{t.encoding.demoSecret}</p>
        {:else if input.repeatable === true}
          {#each list(input) as item, i (i)}
            <div class="repeat">
              <FieldInput
                testid="{testid}-input-{input.name}-{i}"
                {locale}
                field={input.type}
                label="{input.name} {i + 1}"
                value={item}
                invalid={issuesAt([input.name, i]).length > 0}
                onchange={(v) =>
                  setInput(
                    input.name,
                    list(input).map((x, k) => (k === i ? v : x)),
                  )}
              />
              <button
                type="button"
                class="mini"
                data-testid="{testid}-input-{input.name}-{i}-remove"
                onclick={() =>
                  setInput(
                    input.name,
                    list(input).filter((_, k) => k !== i),
                  )}
              >
                {t.encoding.removeValue}
              </button>
            </div>
          {/each}
          <button
            type="button"
            class="mini"
            data-testid="{testid}-input-{input.name}-add"
            onclick={() => setInput(input.name, [...list(input), ""])}
          >
            + {t.encoding.addValue}
          </button>
        {:else}
          <FieldInput
            testid="{testid}-input-{input.name}-field"
            {locale}
            field={input.type}
            label="{input.name}{input.optional === true ? "" : " *"}"
            value={list(input)[0] ?? ""}
            invalid={issuesAt([input.name]).length > 0}
            onchange={(v) => setInput(input.name, v)}
          />
        {/if}
        {#if hasNipText(nip, input.explain)}
          <p class="help">{text(input.explain)}</p>
        {/if}
        {#each issuesAt([input.name]) as issue, i (i)}
          <p class="bad">{message(issue)}</p>
        {/each}
      </div>
    {/each}
  </section>

  <section class="block out">
    <label class="block-title" for="{uid}-out">{t.encoding.output}</label>
    <textarea
      id="{uid}-out"
      class="output"
      data-testid="{testid}-output"
      rows="3"
      spellcheck="false"
      aria-describedby="{uid}-out-hint"
      value={shown}
      oninput={(e) => (pasted = e.currentTarget.value)}
    ></textarea>
    <p class="help" id="{uid}-out-hint">{t.encoding.outputHint}</p>
    {#if pasted !== undefined}
      <button type="button" class="act" data-testid="{testid}-decode" onclick={decode}>
        ↑ {t.encoding.decode}
      </button>
    {/if}
    {#if decodeError !== ""}
      <p class="bad" role="alert" data-testid="{testid}-decode-error">{decodeError}</p>
    {/if}
    {#if costly}
      <button type="button" class="act" data-testid="{testid}-run" onclick={run}>
        {t.encoding.run}
        ↓
      </button>
      <p class="help">{t.encoding.costlyHint}</p>
    {/if}
    {#if result !== undefined && !result.ok}
      <p class="bad" data-testid="{testid}-error">{errorText(result.error)}</p>
    {/if}
    {#if hasNipText(nip, part.output)}
      <p class="help">{text(part.output)}</p>
    {/if}
  </section>

  {#if result?.ok === true}
    <section class="block" data-testid="{testid}-breakdown">
      <h4 class="block-title">{t.encoding.breakdown}</h4>
      <p class="strip">
        {#each result.value.parts as p, i (i)}
          <span class="seg" data-role={p.role} title={t.encoding.parts[p.role]}>{p.text}</span>
        {/each}
      </p>
      <dl class="legend">
        {#each result.value.parts as p, i (i)}
          <div class="lg" data-role={p.role}>
            <dt><span class="sw" aria-hidden="true"></span>{t.encoding.parts[p.role]}</dt>
            <dd>
              <code
                >{p.text.length > 40 ? `${p.text.slice(0, 20)}…${p.text.slice(-12)}` : p.text}</code
              >
            </dd>
          </div>
        {/each}
      </dl>
      {#if result.value.tlv !== undefined}
        <h5 class="sub">{t.encoding.tlv}</h5>
        <ol class="tlv" data-testid="{testid}-tlv">
          {#each result.value.tlv as row, i (i)}
            <li>
              <span class="tlv-head"
                >{format(t.encoding.tlvRow, {
                  type: row.type,
                  name: tlvName(row.type),
                  length: row.length,
                })}</span
              > <code>{row.value}</code>
            </li>
          {/each}
        </ol>
      {/if}
      {#if result.value.derived !== undefined}
        <dl class="derived" data-testid="{testid}-derived">
          {#each result.value.derived as d (d.name)}
            <dt>{t.encoding.derived[d.name as keyof typeof t.encoding.derived] ?? d.name}</dt>
            <dd><code>{d.value}</code></dd>
          {/each}
        </dl>
      {/if}
    </section>
  {/if}
</div>

<style>
  .form {
    display: grid;
    gap: var(--space-md);
    min-inline-size: 0;
  }
  .block {
    display: grid;
    gap: var(--space-sm);
    padding-block-start: var(--space-sm);
    border-block-start: var(--border-width-medium) solid var(--color-border-strong);
    min-inline-size: 0;
  }
  .block-title {
    margin: 0;
    font-family: var(--font-family-display);
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-bold);
  }
  .sub {
    margin: 0;
    font-family: var(--font-family-display);
    font-size: var(--font-size-md);
  }
  .input {
    display: grid;
    gap: var(--space-3xs);
  }
  .repeat {
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: end;
    gap: var(--space-xs);
  }
  .lbl {
    color: var(--color-text-muted);
    font-family: var(--font-family-mono);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-semibold);
  }
  .select,
  .output {
    inline-size: 100%;
    min-block-size: var(--size-touch-target);
    padding: var(--space-xs) var(--space-sm);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-sm);
    background: var(--color-surface);
    color: var(--color-text);
    font-size: var(--font-size-md);
    box-sizing: border-box;
  }
  .output {
    font-family: var(--font-family-mono);
    font-size: var(--font-size-md);
    background: var(--color-code-bg);
    color: var(--color-code-text);
    overflow-wrap: anywhere;
    resize: vertical;
  }
  .select:focus-visible,
  .output:focus-visible,
  .mini:focus-visible,
  .act:focus-visible {
    outline: var(--border-width-thick) solid var(--color-focus-ring);
    outline-offset: var(--size-focus-offset);
  }
  .secret {
    font-family: var(--font-family-mono);
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    overflow-wrap: anywhere;
  }
  .warn {
    margin: 0;
    padding: var(--space-2xs) var(--space-xs);
    border-inline-start: var(--border-width-thick) solid var(--color-warning);
    background: var(--color-warning-subtle);
    font-size: var(--font-size-xs);
  }
  .help {
    margin: 0;
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
  }
  .mini {
    justify-self: start;
    min-block-size: var(--size-control-sm);
    padding: 0 var(--space-xs);
    border: var(--border-width-thin) solid var(--color-border-strong);
    border-radius: var(--radius-sm);
    background: var(--color-surface);
    color: var(--color-text);
    font-size: var(--font-size-xs);
    cursor: pointer;
  }
  .act {
    justify-self: start;
    min-block-size: var(--size-touch-target);
    padding: 0 var(--space-md);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-md);
    background: var(--color-primary);
    color: var(--color-on-primary);
    font-family: var(--font-family-display);
    font-weight: var(--font-weight-semibold);
    cursor: pointer;
    box-shadow: var(--shadow-pop-sm);
  }
  .act:active {
    translate: var(--size-lift) var(--size-lift);
    box-shadow: var(--shadow-pressed);
  }
  @media (pointer: coarse) {
    .mini {
      min-block-size: var(--size-touch-target);
    }
  }
  /* The encoded string printed in riso spot colours: each slice in its own ink. */
  .strip {
    margin: 0;
    padding: var(--space-sm);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-sm);
    background: var(--color-surface);
    font-family: var(--font-family-mono);
    font-size: var(--font-size-sm);
    line-height: var(--font-line-height-relaxed);
    overflow-wrap: anywhere;
  }
  /* Default on the carriers only: the legend swatch must inherit its colour from .lg[data-role],
     so setting --seg on .sw itself would flatten every swatch to chart-1. */
  .seg,
  .lg {
    --seg: var(--color-chart-1);
  }
  [data-role="hrp"],
  [data-role="version"] {
    --seg: var(--color-chart-1);
  }
  [data-role="separator"],
  [data-role="prefix"] {
    --seg: var(--color-chart-4);
  }
  [data-role="data"],
  [data-role="ciphertext"] {
    --seg: var(--color-chart-2);
  }
  [data-role="checksum"],
  [data-role="mac"] {
    --seg: var(--color-chart-3);
  }
  [data-role="nonce"],
  [data-role="iv"] {
    --seg: var(--color-chart-5);
  }
  .seg {
    background: color-mix(in srgb, var(--seg) 28%, transparent);
    box-shadow: inset 0 calc(var(--border-width-thick) * -1) 0 var(--seg);
  }
  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-xs) var(--space-md);
    margin: 0;
    font-size: var(--font-size-xs);
  }
  .lg {
    display: grid;
    gap: var(--space-3xs);
  }
  .lg dt {
    display: flex;
    align-items: center;
    gap: var(--space-2xs);
    font-weight: var(--font-weight-semibold);
  }
  .sw {
    inline-size: var(--space-sm);
    block-size: var(--space-sm);
    border: var(--border-width-thin) solid var(--color-border-strong);
    background: var(--seg);
  }
  dd {
    margin: 0;
  }
  code {
    font-family: var(--font-family-mono);
    overflow-wrap: anywhere;
  }
  .tlv {
    display: grid;
    gap: var(--space-2xs);
    margin: 0;
    padding-inline-start: var(--space-lg);
    font-size: var(--font-size-sm);
  }
  .tlv-head {
    color: var(--color-text-muted);
  }
  .derived {
    display: grid;
    grid-template-columns: minmax(0, auto) minmax(0, 1fr);
    gap: var(--space-3xs) var(--space-sm);
    margin: 0;
    font-size: var(--font-size-sm);
  }
  .derived dt {
    color: var(--color-text-muted);
  }
  .bad {
    margin: 0;
    color: var(--color-danger);
    font-size: var(--font-size-sm);
  }
</style>
