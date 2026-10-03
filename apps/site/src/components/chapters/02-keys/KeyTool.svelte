<script lang="ts">
  import { format, getDictionary, type Locale } from "@nostrschool/i18n";
  import { encodeNpub, encodeNsec, generateKeypair, type Keypair } from "@nostrschool/protocol";
  import { Badge, Button, Callout, CopyButton, emit, pop, Tabs } from "@nostrschool/ui";
  import { maskSecret, sampleKeypair } from "./keys-logic.ts";
  import {
    type ConversionRow,
    encodePointer,
    entityRows,
    hexReadings,
    POINTER_TYPES,
    type PointerType,
    parseToolInput,
    splitRelays,
    TLV_NAMES,
    type ToolError,
    tlvDisplay,
  } from "./tool-logic.ts";

  const { locale }: { readonly locale: Locale } = $props();
  const t = $derived(getDictionary(locale).chapters.ch02.tool);

  // --- Generate ---
  let generated = $state<Keypair>();
  const genNpub = $derived(generated === undefined ? undefined : encodeNpub(generated.publicKey));
  const genNsec = $derived(generated === undefined ? undefined : encodeNsec(generated.secretKey));
  const generate = () => {
    generated = generateKeypair();
    emit("keys:generated", { pubkey: generated.publicKey });
  };

  // --- Convert ---
  let input = $state("");
  let revealed = $state<ReadonlySet<string>>(new Set());
  const parsed = $derived(parseToolInput(input));
  const toggleReveal = (key: string) => {
    const next = new Set(revealed);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    revealed = next;
  };

  // --- Build ---
  let pointerType = $state<PointerType>("nprofile");
  let hex = $state("");
  let relays = $state("");
  let author = $state("");
  let kind = $state("");
  let identifier = $state("");
  const built = $derived(
    encodePointer({ type: pointerType, hex, relays, author, kind, identifier }),
  );
  const fillSample = () => {
    hex = sampleKeypair().publicKey;
    if (relays === "") relays = "wss://relay.damus.io";
    if (pointerType === "naddr" && kind === "") kind = "30023";
    if (pointerType === "naddr" && identifier === "") identifier = "hello-nostr";
  };
  const fieldLabel = (field: string | undefined): string | undefined =>
    field === "hex"
      ? t.hexLabel[pointerType]
      : field === "author"
        ? t.authorLabel
        : field === "kind"
          ? t.kindLabel
          : field === "relays"
            ? t.relaysLabel
            : undefined;
  const buildError = (error: ToolError): string => {
    const label = fieldLabel(error.field);
    return label === undefined ? t.errors[error.code] : `${t.errors[error.code]} (${label})`;
  };

  const tabs = $derived([
    { id: "convert", label: t.convertTab },
    { id: "build", label: t.buildTab },
  ]);
</script>

{#snippet rowList(
  rows: readonly ConversionRow[],
  group: string,
)}
  <dl class="rows">
    {#each rows as row, i (`${group}-${row.id}-${i}`)}
      {@const key = `${group}-${row.id}-${i}`}
      {@const hidden = row.secret === true && !revealed.has(key)}
      <div
        class="row"
        data-testid="ch02-tool-row-{group}-{row.id}"
        data-secret={row.secret === true}
      >
        <dt>{t.rows[row.id]}</dt>
        <dd>
          <code data-testid="ch02-tool-value-{group}-{row.id}"
            >{hidden ? maskSecret(row.value) : row.value}</code
          >
          {#if row.secret === true}
            <Button
              testid="ch02-tool-reveal-{group}-{row.id}"
              variant="ghost"
              size="sm"
              pressed={!hidden}
              onclick={() => toggleReveal(key)}
              >{hidden ? t.reveal : t.conceal}</Button
            >
          {:else}
            <CopyButton testid="ch02-tool-copy-{group}-{row.id}-{i}" {locale} value={row.value} />
          {/if}
        </dd>
      </div>
    {/each}
  </dl>
{/snippet}

<div class="tool" data-testid="ch02-tool">
  <p class="intro">{t.intro}</p>
  <Callout testid="ch02-tool-safety" {locale} tone="safety">{t.safety}</Callout>

  <section class="card" aria-labelledby="ch02-tool-gen">
    <h2 id="ch02-tool-gen" class="h">{t.generateHeading}</h2>
    <Button testid="ch02-tool-generate" onclick={generate}>
      {getDictionary(locale).chapters.ch02.forge.generate}
    </Button>
    {#if generated !== undefined && genNpub?.ok && genNsec?.ok}
      {#key generated.publicKey}
        <div use:pop data-testid="ch02-tool-generated">
          <Badge testid="ch02-tool-demo-badge" tone="warning">
            {getDictionary(locale).chapters.ch02.forge.demoBadge}
          </Badge>
          {@render rowList(
            [
              { id: "npub", value: genNpub.value },
              { id: "hex-pubkey", value: generated.publicKey },
              { id: "nsec", value: genNsec.value, secret: true },
              { id: "hex-secret", value: generated.secretKeyHex, secret: true },
            ],
            "gen",
          )}
        </div>
      {/key}
    {/if}
  </section>

  <Tabs testid="ch02-tool-tabs" {tabs} label={t.tabsLabel}>
    {#snippet panel(
      id,
    )}
      {#if id === "convert"}
        <div class="pane" data-testid="ch02-tool-convert">
          <label class="field">
            <span>{t.inputLabel}</span>
            <textarea
              rows="3"
              spellcheck="false"
              autocomplete="off"
              placeholder={t.inputPlaceholder}
              data-testid="ch02-tool-input"
              bind:value={input}
            ></textarea>
          </label>
          <div aria-live="polite" data-testid="ch02-tool-output">
            {#if !parsed.ok}
              {#if parsed.error.code !== "empty"}
                <p class="error" data-testid="ch02-tool-error" data-code={parsed.error.code}>
                  {t.errors[parsed.error.code]}
                </p>
              {/if}
            {:else if parsed.value.kind === "hex"}
              {@const readings = hexReadings(parsed.value.hex, [])}
              <p class="detected" data-testid="ch02-tool-detected">
                {format(t.detected, { type: "hex" })}
              </p>
              <p class="hint">{t.hexAmbiguous}</p>
              <h3 class="h3">{t.asPubkey}</h3>
              {#if readings.asPubkey.length > 0}
                {@render rowList(readings.asPubkey, "pub")}
              {:else}
                <p class="hint" data-testid="ch02-tool-not-on-curve">{t.notOnCurve}</p>
              {/if}
              <h3 class="h3">{t.asEventId}</h3>
              {@render rowList(readings.asEventId, "id")}
              <h3 class="h3">{t.asSecret}</h3>
              {@render rowList(readings.asSecret, "sec")}
            {:else}
              {@const entity = parsed.value.decoded.entity}
              <p class="detected" data-testid="ch02-tool-detected">
                {format(t.detected, { type: entity.type })}
              </p>
              {#if entity.type === "nsec"}
                <Callout testid="ch02-tool-nsec-warning" {locale} tone="danger"
                  >{t.nsecWarning}</Callout
                >
              {/if}
              {@render rowList(entityRows(entity), "dec")}
            {/if}
          </div>
        </div>
      {:else}
        <div class="pane" data-testid="ch02-tool-build">
          <fieldset class="types">
            <legend>{t.typeLabel}</legend>
            {#each POINTER_TYPES as type (type)}
              <label class="radio">
                <input
                  type="radio"
                  name="ch02-pointer-type"
                  value={type}
                  data-testid="ch02-tool-type-{type}"
                  bind:group={pointerType}
                >
                {type}
              </label>
            {/each}
          </fieldset>
          <label class="field">
            <span>{t.hexLabel[pointerType]}</span>
            <input class="text" data-testid="ch02-tool-hex" spellcheck="false" bind:value={hex}>
          </label>
          {#if pointerType === "naddr"}
            <label class="field">
              <span>{t.identifierLabel}</span>
              <input class="text" data-testid="ch02-tool-identifier" bind:value={identifier}>
            </label>
          {/if}
          {#if pointerType === "nevent"}
            <label class="field">
              <span>{t.authorLabel}</span>
              <input
                class="text"
                data-testid="ch02-tool-author"
                spellcheck="false"
                bind:value={author}
              >
            </label>
          {/if}
          {#if pointerType !== "nprofile"}
            <label class="field">
              <span>{pointerType === "naddr" ? t.kindLabel : t.kindOptional}</span>
              <input
                class="text"
                inputmode="numeric"
                data-testid="ch02-tool-kind"
                bind:value={kind}
              >
            </label>
          {/if}
          <label class="field">
            <span>{t.relaysLabel}</span>
            <textarea
              rows="2"
              data-testid="ch02-tool-relays"
              spellcheck="false"
              bind:value={relays}
            ></textarea>
          </label>
          <div>
            <Button testid="ch02-tool-fill-sample" variant="ghost" size="sm" onclick={fillSample}>
              {t.useSample}
            </Button>
          </div>
          <div aria-live="polite" data-testid="ch02-tool-build-output">
            {#if built.ok}
              <h3 class="h3">{t.result}</h3>
              {@render rowList([{ id: pointerType, value: built.value.encoded }], "build")}
              {#if built.value.tlv !== undefined}
                <h3 class="h3">{t.tlvHeading}</h3>
                <div class="table-wrap">
                  <table class="tlv" data-testid="ch02-tool-tlv">
                    <thead>
                      <tr>
                        <th scope="col">{t.tlvType}</th>
                        <th scope="col">{t.tlvLength}</th>
                        <th scope="col">{t.tlvValue}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {#each built.value.tlv as entry, i (i)}
                        <tr>
                          <td>{entry.type} · {TLV_NAMES[entry.type]}</td>
                          <td>{entry.length}</td>
                          <td><code>{tlvDisplay(entry, pointerType)}</code></td>
                        </tr>
                      {/each}
                    </tbody>
                  </table>
                </div>
              {/if}
            {:else if hex.trim() !== "" || splitRelays(relays).length > 0}
              <p
                class="error"
                data-testid="ch02-tool-build-error"
                data-field={built.error.field ?? ""}
              >
                {buildError(built.error)}
              </p>
            {/if}
          </div>
        </div>
      {/if}
    {/snippet}
  </Tabs>
</div>

<style>
  .tool {
    display: grid;
    gap: var(--space-lg);
  }
  .intro {
    margin: 0;
    font-size: var(--font-size-lg);
    color: var(--color-text);
  }
  .card,
  .pane {
    display: grid;
    gap: var(--space-sm);
  }
  .card {
    padding: var(--space-lg);
    border: var(--border-width-thick) solid var(--color-border-strong);
    border-radius: var(--radius-xl);
    background: var(--color-surface-raised);
    box-shadow: var(--shadow-pop-sm);
    justify-items: start;
  }
  .h,
  .h3 {
    margin: 0;
    font-family: var(--font-family-display);
    color: var(--color-text-primary);
  }
  .h {
    font-size: var(--font-size-xl);
  }
  .h3 {
    font-size: var(--font-size-md);
  }
  .field {
    display: grid;
    gap: var(--space-2xs);
    font-family: var(--font-family-display);
    color: var(--color-text);
  }
  textarea,
  .text {
    min-block-size: var(--size-touch-target);
    padding: var(--space-xs) var(--space-sm);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-md);
    background: var(--color-surface);
    color: var(--color-text);
    font-family: var(--font-family-mono);
    font-size: var(--font-size-sm);
  }
  textarea:focus-visible,
  .text:focus-visible,
  .radio input:focus-visible {
    outline: var(--border-width-thick) solid var(--color-focus-ring);
    outline-offset: var(--space-3xs);
  }
  .types {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-sm);
    margin: 0;
    padding: var(--space-sm);
    border: var(--border-width-thin) solid var(--color-border);
    border-radius: var(--radius-md);
    color: var(--color-text);
  }
  .radio {
    display: inline-flex;
    gap: var(--space-2xs);
    align-items: center;
    min-block-size: var(--size-touch-target);
    font-family: var(--font-family-mono);
  }
  .radio input {
    accent-color: var(--color-primary);
  }
  .rows {
    display: grid;
    gap: var(--space-xs);
    margin: 0;
    inline-size: 100%;
  }
  .row {
    display: grid;
    gap: var(--space-3xs);
    padding: var(--space-xs) var(--space-sm);
    border-radius: var(--radius-md);
    background: var(--color-surface-sunken);
  }
  .row[data-secret="true"] {
    background: var(--color-danger-subtle);
  }
  dt {
    font-family: var(--font-family-display);
    font-weight: var(--font-weight-semibold);
    font-size: var(--font-size-sm);
    color: var(--color-text);
  }
  dd {
    display: flex;
    gap: var(--space-xs);
    align-items: center;
    justify-content: space-between;
    margin: 0;
  }
  code {
    min-inline-size: 0;
    font-family: var(--font-family-mono);
    font-size: var(--font-size-xs);
    word-break: break-all;
    color: var(--color-text);
  }
  .detected {
    margin: 0;
    font-weight: var(--font-weight-bold);
    color: var(--color-text);
  }
  .hint {
    margin: 0;
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
  }
  .error {
    margin: 0;
    padding: var(--space-xs) var(--space-sm);
    border-radius: var(--radius-md);
    background: var(--color-danger-subtle);
    color: var(--color-text);
  }
  .table-wrap {
    overflow-x: auto;
  }
  .tlv {
    inline-size: 100%;
    border-collapse: collapse;
    font-size: var(--font-size-sm);
    color: var(--color-text);
  }
  .tlv th,
  .tlv td {
    padding: var(--space-2xs) var(--space-xs);
    border-block-end: var(--border-width-thin) solid var(--color-border);
    text-align: start;
    vertical-align: top;
  }
</style>
