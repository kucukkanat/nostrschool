<script lang="ts">
  /**
   * Schema-driven form node (recursive): objects become fieldsets, arrays become numbered lists
   * with add/remove, strings use FieldInput by their FieldType, and open-ended nodes (events,
   * filters, "any") get a small JSON box. Every edit hands a new value up via `onchange(path, v)`.
   * Internal to the package; testids are `${testid}-field-<dotted.path>`.
   */
  import type { Locale } from "@nostrschool/i18n";
  import { format } from "@nostrschool/i18n";
  import type {
    JsonPath,
    JsonSchema,
    JsonValue,
    TextKey,
    ValidationIssue,
  } from "@nostrschool/nips";
  import { childSchema, pickOption, skeleton } from "../logic/fields.ts";
  import { nodeValue, parseJsonNodes } from "../logic/json-locate.ts";
  import { editorStrings, hasNipText, nipText } from "../logic/text.ts";
  import { issueMessage } from "../logic/validate.ts";
  import FieldInput from "./FieldInput.svelte";
  import SchemaField from "./SchemaField.svelte";

  interface Props {
    readonly testid: string;
    readonly locale: Locale;
    readonly nip: string;
    readonly schema: JsonSchema;
    readonly value: JsonValue | undefined;
    readonly path: JsonPath;
    readonly label: string;
    readonly explain?: TextKey | undefined;
    readonly issues: readonly ValidationIssue[];
    readonly onchange: (path: JsonPath, value: JsonValue) => void;
    readonly onremove?: (() => void) | undefined;
    readonly onselectpath?: ((path: JsonPath) => void) | undefined;
    /** 1-based position when this node is an array item (primitives then render as one compact row). */
    readonly item?: number | undefined;
  }

  const {
    testid,
    locale,
    nip,
    schema,
    value,
    path,
    label,
    explain,
    issues,
    onchange,
    onremove,
    onselectpath,
    item,
  }: Props = $props();
  const t = $derived(editorStrings(locale));
  const text = $derived(nipText(locale, nip));
  const message = $derived(issueMessage(locale));
  const uid = $props.id();
  const id = $derived(`${testid}-field-${path.length === 0 ? "root" : path.join(".")}`);
  const s = $derived(
    schema.type === "any-of" ? (pickOption(schema.options, value) ?? schema) : schema,
  );
  const here = $derived(
    issues.filter(
      (i) =>
        i.severity !== "info" &&
        i.path.length === path.length &&
        i.path.every((p, k) => p === path[k]),
    ),
  );
  const help = $derived(explain ?? s.explain);
  /**
   * Primitive array items (NIP-11 supported_nips, string lists) render as one line: input plus an
   * icon remove button. The list marker already numbers them, so the label is for screen readers,
   * and the per-item help is skipped (the array's own help sits above the list).
   */
  const compact = $derived(
    item !== undefined && (s.type === "string" || s.type === "number" || s.type === "boolean"),
  );
  const shown = (v: JsonValue | undefined): string =>
    typeof v === "string" ? v : JSON.stringify(v ?? null);

  type Obj = { readonly [k: string]: JsonValue };
  const obj = $derived(
    value !== null && value !== undefined && typeof value === "object" && !Array.isArray(value)
      ? (value as Obj)
      : {},
  );
  const arr = $derived(Array.isArray(value) ? (value as readonly JsonValue[]) : []);
  const objectKeys = $derived.by(() => {
    if (s.type !== "object") return [];
    const req = s.required ?? [];
    const known = Object.keys(s.properties).filter((k) => k in obj || req.includes(k));
    return [...known, ...Object.keys(obj).filter((k) => !(k in s.properties))];
  });
  const missing = $derived(
    s.type === "object" ? Object.keys(s.properties).filter((k) => !objectKeys.includes(k)) : [],
  );
  const canAddKey = $derived(s.type === "object" && s.additionalProperties !== false);
  let newKey = $state("");

  const setObj = (next: Obj) => onchange(path, next);
  const removeKey = (k: string) =>
    setObj(Object.fromEntries(Object.entries(obj).filter(([x]) => x !== k)));
  const addKey = (k: string) => {
    const cs = s.type === "object" ? childSchema(s, k, undefined) : undefined;
    setObj({ ...obj, [k]: cs === undefined ? "" : skeleton(cs) });
  };
  const itemSchema = (i: number): JsonSchema | undefined => childSchema(s, i, arr[i]);
  const canAddItem = $derived(
    (s.type === "array" && (s.maxItems === undefined || arr.length < s.maxItems)) ||
      (s.type === "tuple" && (s.rest !== undefined || arr.length < s.items.length)),
  );
  const canRemoveItem = (i: number) =>
    (s.type === "array" && arr.length > (s.minItems ?? 0)) ||
    (s.type === "tuple" && i === arr.length - 1 && arr.length > (s.minItems ?? s.items.length));
  const addItem = () => {
    const next = itemSchema(arr.length) ?? (s.type === "array" ? s.items : undefined);
    onchange(path, [...arr, next === undefined ? "" : skeleton(next)]);
  };

  // JSON box for open-ended nodes: keeps the user's draft while it does not parse.
  const pretty = $derived(JSON.stringify(value ?? null, null, 2));
  let draft = $state("");
  let draftOk = $state(true);
  $effect.pre(() => {
    const parsed = parseJsonNodes(draft);
    if (!parsed.ok || JSON.stringify(nodeValue(parsed.value)) !== JSON.stringify(value ?? null)) {
      if (draftOk) draft = pretty;
    }
  });
  const editDraft = (e: Event) => {
    draft = (e.currentTarget as HTMLTextAreaElement).value;
    const parsed = parseJsonNodes(draft);
    draftOk = parsed.ok;
    if (parsed.ok) onchange(path, nodeValue(parsed.value));
  };
  const focus = (e: FocusEvent) => {
    // The innermost field wins: stop so ancestors don't re-select their own (shorter) path.
    e.stopPropagation();
    onselectpath?.(path);
  };
</script>

<div
  class="node"
  data-testid={id}
  data-type={s.type}
  data-json-path={JSON.stringify(path)}
  onfocusin={focus}
>
  {#if s.type === "object" || s.type === "array" || s.type === "tuple"}
    <fieldset class="group" aria-describedby={hasNipText(nip, help) ? `${uid}-help` : undefined}>
      {#if path.length > 0}
        <legend class="legend">
          <code>{label}</code>
          {#if onremove !== undefined}
            <button type="button" class="mini" data-testid="{id}-remove" onclick={onremove}>
              {t.schema.removeField.replace("{name}", label)}
            </button>
          {/if}
        </legend>
      {/if}
      {#if hasNipText(nip, help)}
        <p class="help" id="{uid}-help">{text(help)}</p>
      {/if}
      {#if s.type === "object"}
        {#each objectKeys as key (key)}
          {@const cs = childSchema(s, key, obj[key])}
          {@const required = (s.required ?? []).includes(key)}
          <SchemaField
            {testid}
            {locale}
            {nip}
            schema={cs ?? { type: "any" }}
            value={obj[key]}
            path={[...path, key]}
            label={key}
            {issues}
            {onchange}
            {onselectpath}
            onremove={required ? undefined : () => removeKey(key)}
          />
        {/each}
        {#if missing.length > 0 || canAddKey}
          <div class="adders">
            {#each missing as key (key)}
              <button
                type="button"
                class="chip"
                data-testid="{id}-add-{key}"
                onclick={() => addKey(key)}
              >
                + {key}
              </button>
            {/each}
            {#if canAddKey}
              <span class="newkey">
                <input
                  class="keyinput"
                  data-testid="{id}-new-key"
                  aria-label={t.schema.fieldName}
                  placeholder={t.schema.fieldName}
                  bind:value={newKey}
                >
                <button
                  type="button"
                  class="chip"
                  data-testid="{id}-add-field"
                  disabled={newKey.trim() === "" || newKey.trim() in obj}
                  onclick={() => {
                    addKey(newKey.trim());
                    newKey = "";
                  }}
                >
                  {t.schema.addField}
                </button>
              </span>
            {/if}
          </div>
        {/if}
      {:else}
        <ol class="items">
          {#each arr as item, i (i)}
            <li>
              <SchemaField
                {testid}
                {locale}
                {nip}
                schema={itemSchema(i) ?? { type: "any" }}
                value={item}
                path={[...path, i]}
                label={format(t.schema.item, { n: i + 1 })}
                item={i + 1}
                {issues}
                {onchange}
                {onselectpath}
                onremove={canRemoveItem(i)
                  ? () =>
                      onchange(
                        path,
                        arr.filter((_, k) => k !== i),
                      )
                  : undefined}
              />
            </li>
          {/each}
        </ol>
        {#if canAddItem}
          <button type="button" class="chip" data-testid="{id}-add-item" onclick={addItem}>
            + {t.schema.addItem}
          </button>
        {/if}
      {/if}
    </fieldset>
  {:else}
    <div class="leaf" class:row={compact}>
      {#if s.type === "string"}
        <FieldInput
          testid="{id}-value"
          {locale}
          field={s.field ?? { type: "text" }}
          value={typeof value === "string" ? value : JSON.stringify(value ?? "")}
          {label}
          hideLabel={compact}
          invalid={here.length > 0}
          describedby={here.length > 0
            ? `${uid}-issues`
            : hasNipText(nip, help)
              ? `${uid}-help`
              : undefined}
          onchange={(v) => onchange(path, v)}
        />
      {:else if s.type === "number"}
        <label class="leaf-label" class:sr={compact} for="{uid}-num">{label}</label>
        <input
          id="{uid}-num"
          class="control mono"
          data-testid="{id}-value-input"
          type="text"
          inputmode="decimal"
          aria-invalid={here.length > 0}
          value={value === undefined ? "" : String(value)}
          oninput={(e) => {
            const raw = e.currentTarget.value;
            const n = Number(raw);
            onchange(path, raw.trim() !== "" && Number.isFinite(n) ? n : raw);
          }}
        >
      {:else if s.type === "boolean"}
        <label class="check">
          <input
            type="checkbox"
            data-testid="{id}-value-input"
            checked={value === true}
            onchange={(e) => onchange(path, e.currentTarget.checked)}
          >
          <code>{label}</code>
        </label>
      {:else if s.type === "null"}
        <span class="leaf-label">{label}</span>
        <code class="null">null</code>
      {:else}
        <label class="leaf-label" for="{uid}-json">{label} · {t.schema.editJson}</label>
        <textarea
          id="{uid}-json"
          class="control mono"
          data-testid="{id}-json"
          rows="4"
          spellcheck="false"
          aria-invalid={!draftOk || here.length > 0}
          value={draft}
          oninput={editDraft}
        ></textarea>
        {#if !draftOk}
          <p class="bad">{t.schema.invalidJson}</p>
        {/if}
      {/if}
      {#if !compact && hasNipText(nip, help)}
        <p class="help" id="{uid}-help">{text(help)}</p>
      {/if}
      {#if onremove !== undefined && compact}
        {@const name = format(t.schema.removeItemValue, { n: item ?? 0, value: shown(value) })}
        <button
          type="button"
          class="icon"
          data-testid="{id}-remove"
          aria-label={name}
          title={name}
          onclick={onremove}
        >
          <span aria-hidden="true">×</span>
        </button>
      {:else if onremove !== undefined}
        <button type="button" class="mini" data-testid="{id}-remove" onclick={onremove}>
          {t.schema.removeField.replace("{name}", label)}
        </button>
      {/if}
    </div>
  {/if}
  {#if here.length > 0}
    <ul class="issues" id="{uid}-issues" data-testid="{id}-issues">
      {#each here as issue, i (i)}
        <li>{message(issue)}</li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .node {
    min-inline-size: 0;
  }
  .group {
    display: grid;
    gap: var(--space-sm);
    margin: 0;
    padding: var(--space-sm);
    border: var(--border-width-thin) dashed var(--color-border-strong);
    border-radius: var(--radius-sm);
    min-inline-size: 0;
  }
  .legend {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    padding: 0 var(--space-2xs);
    font-family: var(--font-family-mono);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-bold);
  }
  .help {
    margin: 0;
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
    line-height: var(--font-line-height-normal);
  }
  .leaf {
    display: grid;
    gap: var(--space-3xs);
  }
  /* Compact array row: the value control stretches, the remove button sits at its end. */
  .leaf.row {
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: end;
    gap: var(--space-xs);
  }
  .sr {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
  .icon {
    display: inline-grid;
    place-items: center;
    inline-size: var(--size-touch-target);
    block-size: var(--size-touch-target);
    padding: 0;
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-sm);
    background: var(--color-surface);
    color: var(--color-text-muted);
    font-family: var(--font-family-mono);
    font-size: var(--font-size-lg);
    line-height: var(--font-line-height-tight);
    cursor: pointer;
  }
  @media (hover: hover) {
    .icon:hover {
      border-color: var(--color-danger);
      color: var(--color-danger);
    }
  }
  .icon:focus-visible {
    outline: var(--border-width-thick) solid var(--color-focus-ring);
    outline-offset: var(--size-focus-offset);
  }
  .leaf-label {
    color: var(--color-text-muted);
    font-family: var(--font-family-mono);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-semibold);
  }
  .control {
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
  textarea.control {
    resize: vertical;
  }
  .mono {
    font-family: var(--font-family-mono);
    font-size: var(--font-size-md);
  }
  .control:focus-visible,
  .keyinput:focus-visible,
  .mini:focus-visible,
  .chip:focus-visible,
  .check input:focus-visible {
    outline: var(--border-width-thick) solid var(--color-focus-ring);
    outline-offset: var(--size-focus-offset);
  }
  .control[aria-invalid="true"] {
    border-color: var(--color-danger);
  }
  .check {
    display: inline-flex;
    align-items: center;
    gap: var(--space-xs);
    min-block-size: var(--size-touch-target);
    font-family: var(--font-family-mono);
  }
  .check input {
    inline-size: var(--size-icon-md);
    block-size: var(--size-icon-md);
    accent-color: var(--color-primary);
  }
  .null {
    color: var(--color-code-null);
    font-family: var(--font-family-mono);
  }
  .items {
    display: grid;
    gap: var(--space-xs);
    margin: 0;
    padding-inline-start: var(--space-lg);
  }
  .items > li::marker {
    color: var(--color-text-subtle);
    font-family: var(--font-family-mono);
    font-size: var(--font-size-xs);
  }
  .adders {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-xs);
  }
  .newkey {
    display: inline-flex;
    gap: var(--space-2xs);
  }
  .keyinput {
    inline-size: 10em;
    min-block-size: var(--size-control-sm);
    padding: 0 var(--space-xs);
    border: var(--border-width-thin) solid var(--color-border-strong);
    border-radius: var(--radius-sm);
    background: var(--color-surface);
    color: var(--color-text);
    font-family: var(--font-family-mono);
    font-size: var(--font-size-md);
  }
  .chip,
  .mini {
    min-block-size: var(--size-control-sm);
    padding: 0 var(--space-xs);
    border: var(--border-width-thin) solid var(--color-border-strong);
    border-radius: var(--radius-pill);
    background: var(--color-surface);
    color: var(--color-text);
    font-family: var(--font-family-mono);
    font-size: var(--font-size-xs);
    cursor: pointer;
    box-shadow: var(--shadow-pressed);
    transition: translate var(--motion-duration-press) var(--motion-easing-press);
  }
  .mini {
    justify-self: start;
    border-radius: var(--radius-sm);
    color: var(--color-text-muted);
  }
  @media (hover: hover) {
    .chip:hover:not(:disabled) {
      background: var(--color-primary-subtle);
    }
  }
  .chip:active:not(:disabled) {
    translate: var(--size-lift) var(--size-lift);
  }
  .chip:disabled {
    opacity: var(--opacity-disabled);
    cursor: not-allowed;
  }
  @media (pointer: coarse) {
    .chip,
    .mini,
    .keyinput {
      min-block-size: var(--size-touch-target);
    }
  }
  .bad,
  .issues {
    margin: var(--space-3xs) 0 0;
    color: var(--color-danger);
    font-size: var(--font-size-xs);
  }
  .issues {
    padding-inline-start: var(--space-md);
  }
</style>
