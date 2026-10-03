<script lang="ts">
  /**
   * One string value typed by a FieldType: the right widget (persona / demo event pickers, kind
   * list, enum select, date helper, textarea for long values) around a plain text control, so
   * every value stays editable by hand. Internal to the package.
   */
  import { FIXTURE_EVENTS, FIXTURE_NOW, PERSONAS, RELAYS } from "@nostrschool/fixtures";
  import { formatDate, getDictionary, type Locale } from "@nostrschool/i18n";
  import type { FieldType } from "@nostrschool/nips";
  import { KINDS } from "@nostrschool/protocol";
  import { editorStrings } from "../logic/text.ts";

  interface Props {
    readonly testid: string;
    readonly locale: Locale;
    readonly field: FieldType;
    readonly value: string;
    readonly label: string;
    readonly onchange: (value: string) => void;
    readonly invalid?: boolean | undefined;
    readonly describedby?: string | undefined;
    readonly placeholder?: string | undefined;
    /** Keep the label for assistive tech only (compact array rows, where the list number says it). */
    readonly hideLabel?: boolean | undefined;
  }

  const {
    testid,
    locale,
    field,
    value,
    label,
    onchange,
    invalid = false,
    describedby,
    placeholder,
    hideLabel = false,
  }: Props = $props();
  const t = $derived(editorStrings(locale));
  const uid = $props.id();
  const kindNames = $derived(
    getDictionary(locale).kinds.names as {
      readonly [k: string]: { readonly name: string } | undefined;
    },
  );

  const demoEvents = FIXTURE_EVENTS.slice(0, 24);
  const persona = $derived(PERSONAS.find((p) => p.pubkey === value)?.pubkey ?? "");
  const demoEvent = $derived(demoEvents.find((e) => e.id === value)?.id ?? "");
  const kindOptions = $derived(
    field.type === "kind" && field.kinds !== undefined
      ? field.kinds.map((k) => ({ kind: k, name: KINDS.find((x) => x.kind === k)?.i18nKey }))
      : KINDS.map((k) => ({ kind: k.kind, name: k.i18nKey })),
  );
  const multiline = $derived(
    (field.type === "text" && field.multiline === true) ||
      field.type === "json" ||
      field.type === "event-json" ||
      field.type === "base64",
  );
  const mono = $derived(field.type !== "text" && field.type !== "enum" && field.type !== "url");
  const asDate = $derived(
    field.type === "timestamp" && /^\d+$/.test(value)
      ? formatDate(locale, Number(value) * 1000, {
          dateStyle: "medium",
          timeStyle: "short",
          timeZone: "UTC",
        })
      : undefined,
  );
  // Non-URL values the NIP allows here (NIP-62's ALL_RELAYS); type="url" would flag them invalid.
  const literals = $derived(field.type === "relay-url" ? (field.literals ?? []) : []);
  const input = (e: Event) =>
    onchange((e.currentTarget as HTMLInputElement | HTMLTextAreaElement).value);
  const pick = (e: Event) => {
    const v = (e.currentTarget as HTMLSelectElement).value;
    if (v !== "") onchange(v);
  };
</script>

<div class="field" data-testid={testid} data-type={field.type}>
  <label class="label" class:sr={hideLabel} for="{uid}-input">{label}</label>
  {#if field.type === "pubkey"}
    <select
      class="picker"
      data-testid="{testid}-persona"
      aria-label="{label}: {t.pickers.persona}"
      value={persona}
      onchange={pick}
    >
      <option value="">{t.pickers.custom}</option>
      {#each PERSONAS as p (p.id)}
        <option value={p.pubkey}>{p.displayName}</option>
      {/each}
    </select>
  {:else if field.type === "event-id"}
    <select
      class="picker"
      data-testid="{testid}-event"
      aria-label="{label}: {t.pickers.event}"
      value={demoEvent}
      onchange={pick}
    >
      <option value="">{t.pickers.custom}</option>
      {#each demoEvents as e (e.id)}
        <option value={e.id}>kind {e.kind} · {e.content.slice(0, 28) || e.id.slice(0, 8)}</option>
      {/each}
    </select>
  {:else if field.type === "enum" && field.open !== true}
    <select
      id="{uid}-input"
      class="control"
      data-testid="{testid}-input"
      aria-invalid={invalid}
      aria-describedby={describedby}
      {value}
      onchange={input}
    >
      {#if !field.values.some((v) => v.value === value)}
        <option {value}>{value}</option>
      {/if}
      {#each field.values as option (option.value)}
        <option value={option.value}>{option.value}</option>
      {/each}
    </select>
  {/if}
  {#if !(field.type === "enum" && field.open !== true)}
    {#if multiline}
      <textarea
        id="{uid}-input"
        class="control"
        class:mono
        data-testid="{testid}-input"
        rows="3"
        spellcheck={field.type === "text"}
        aria-invalid={invalid}
        aria-describedby={describedby}
        {placeholder}
        {value}
        oninput={input}
      ></textarea>
    {:else}
      <input
        id="{uid}-input"
        class="control"
        class:mono
        data-testid="{testid}-input"
        type={field.type === "url" || (field.type === "relay-url" && literals.length === 0)
          ? "url"
          : "text"}
        inputmode={field.type === "timestamp" || field.type === "kind" || field.type === "number"
          ? "numeric"
          : undefined}
        autocomplete="off"
        autocapitalize="off"
        spellcheck={field.type === "text"}
        list={field.type === "relay-url" || field.type === "kind" || field.type === "enum"
          ? `${uid}-list`
          : undefined}
        aria-invalid={invalid}
        aria-describedby={describedby}
        {placeholder}
        {value}
        oninput={input}
      >
    {/if}
  {/if}
  {#if field.type === "relay-url"}
    <datalist id="{uid}-list">
      {#each literals as l (l.value)}
        <option value={l.value}></option>
      {/each}
      {#each RELAYS as r (r.url)}
        <option value={r.url}>{r.name}</option>
      {/each}
    </datalist>
  {:else if field.type === "kind"}
    <datalist id="{uid}-list">
      {#each kindOptions as k (k.kind)}
        <option value={String(k.kind)}>
          {k.name === undefined ? "" : (kindNames[k.name]?.name ?? "")}
        </option>
      {/each}
    </datalist>
  {:else if field.type === "enum"}
    <datalist id="{uid}-list">
      {#each field.values as o (o.value)}
        <option value={o.value}></option>
      {/each}
    </datalist>
  {/if}
  {#if field.type === "timestamp"}
    <div class="aside">
      {#if asDate !== undefined}
        <span data-testid="{testid}-date">{asDate} UTC</span>
      {/if}
      <button
        type="button"
        class="mini"
        data-testid="{testid}-now"
        onclick={() => onchange(String(FIXTURE_NOW))}
      >
        {t.pickers.now}
      </button>
    </div>
  {/if}
</div>

<style>
  .field {
    display: grid;
    gap: var(--space-3xs);
    min-inline-size: 0;
  }
  .label {
    color: var(--color-text-muted);
    font-family: var(--font-family-mono);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-semibold);
    letter-spacing: var(--font-letter-spacing-wide);
    text-transform: lowercase;
  }
  .sr {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
  .control,
  .picker {
    inline-size: 100%;
    min-block-size: var(--size-touch-target);
    padding: var(--space-xs) var(--space-sm);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-sm);
    background: var(--color-surface);
    color: var(--color-text);
    font-family: var(--font-family-body);
    /* 16px+ keeps iOS from zooming into the field on focus. */
    font-size: var(--font-size-md);
    box-sizing: border-box;
    transition:
      box-shadow var(--motion-duration-press) var(--motion-easing-press),
      translate var(--motion-duration-press) var(--motion-easing-press);
  }
  .picker {
    min-block-size: var(--size-control-sm);
    padding-block: var(--space-3xs);
    background: var(--color-surface-sunken);
    font-size: var(--font-size-md);
  }
  textarea.control {
    resize: vertical;
    line-height: var(--font-line-height-normal);
  }
  .mono {
    font-family: var(--font-family-mono);
    font-size: var(--font-size-md);
    overflow-wrap: anywhere;
  }
  /* Focus lifts the field off the page onto an orange misregistered shadow. */
  .control:focus-visible,
  .picker:focus-visible {
    outline: var(--border-width-thick) solid var(--color-focus-ring);
    outline-offset: var(--size-focus-offset);
    box-shadow: var(--shadow-accent);
  }
  .control[aria-invalid="true"] {
    border-color: var(--color-danger);
    /* A danger tint, not the highlighter: the yellow swipe under light dark-mode text was unreadable. */
    background-color: var(--color-danger-subtle);
  }
  .aside {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-xs);
    color: var(--color-text-muted);
    font-size: var(--font-size-xs);
  }
  .mini {
    min-block-size: var(--size-control-sm);
    padding: 0 var(--space-xs);
    border: var(--border-width-thin) solid var(--color-border-strong);
    border-radius: var(--radius-sm);
    background: var(--color-surface);
    color: var(--color-text);
    font: inherit;
    cursor: pointer;
  }
  .mini:focus-visible {
    outline: var(--border-width-thick) solid var(--color-focus-ring);
    outline-offset: var(--size-focus-offset);
  }
  @media (pointer: coarse) {
    .mini,
    .picker {
      min-block-size: var(--size-touch-target);
    }
  }
</style>
