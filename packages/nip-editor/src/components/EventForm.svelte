<script lang="ts">
  import { PERSONAS } from "@nostrschool/fixtures";
  import { format } from "@nostrschool/i18n";
  import { type JsonPath, type JsonValue, type TagSpec, tagSpecId } from "@nostrschool/nips";
  import { tick } from "svelte";
  import {
    decryptFrom,
    encryptFor,
    firstRecipient,
    isJsonObject,
    matchTagSpec,
    tagTemplate,
  } from "../logic/event.ts";
  import { DEFAULT_SIGNER } from "../logic/fields.ts";
  import { moveItem, setIn } from "../logic/immutable.ts";
  import { nodeValue, parseJsonNodes } from "../logic/json-locate.ts";
  import { editorStrings, hasNipText, nipText } from "../logic/text.ts";
  import { issueMessage } from "../logic/validate.ts";
  import type { EventFormProps } from "../types.ts";
  import FieldInput from "./FieldInput.svelte";
  import SchemaField from "./SchemaField.svelte";

  let {
    testid,
    locale,
    nip,
    part,
    value = $bindable(),
    issues,
    onselectpath,
    signer = DEFAULT_SIGNER,
  }: EventFormProps = $props();
  const t = $derived(editorStrings(locale));
  const text = $derived(nipText(locale, nip));
  const message = $derived(issueMessage(locale));

  type Row = readonly string[];
  const ev = $derived(isJsonObject(value) ? value : {});
  const tags = $derived<readonly Row[]>(
    Array.isArray(ev["tags"])
      ? ev["tags"].map((r) =>
          Array.isArray(r) ? r.map((x) => (typeof x === "string" ? x : JSON.stringify(x))) : [],
        )
      : [],
  );
  const kindOptions = $derived(part.kinds.flatMap((k) => (typeof k === "number" ? [k] : [k.from])));

  const set = (key: string, v: JsonValue) => {
    value = { ...ev, [key]: v };
  };
  const setTags = (next: readonly Row[]) =>
    set(
      "tags",
      next.map((r) => [...r]),
    );
  const setTagValue = (row: number, pos: number, v: string) =>
    setTags(tags.map((r, i) => (i === row ? r.map((x, j) => (j === pos ? v : x)) : r)));
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
  let root = $state<HTMLElement>();
  /**
   * Rows are keyed by index, so after a move or removal the focused button belongs to another
   * row. Re-target the selection (and, for moves, focus) so the panel never explains a stale row.
   */
  const moveTag = async (from: number, to: number) => {
    setTags(moveItem(tags, from, to));
    onselectpath?.(["tags", to]);
    await tick();
    const dir = to < from ? "up" : "down";
    const button = (d: string) => {
      const b = root?.querySelector<HTMLButtonElement>(`[data-testid="${testid}-tag-${to}-${d}"]`);
      return b?.disabled === true ? undefined : b;
    };
    (button(dir) ?? button(dir === "up" ? "down" : "up"))?.focus();
  };
  const removeTag = (i: number) => {
    setTags(tags.filter((_, k) => k !== i));
    onselectpath?.(["tags"]);
  };
  const present = (tag: TagSpec) => tags.some((r) => matchTagSpec(part, r) === tag);
  let customName = $state("");

  // Encrypted content: plaintext is local (never part of the event), recipient defaults to the p tag.
  const content = $derived(typeof ev["content"] === "string" ? ev["content"] : "");
  let plaintext = $state("");
  let recipient = $state("");
  let cryptoError = $state("");
  const peer = $derived(recipient || firstRecipient(value) || (PERSONAS[1]?.pubkey ?? ""));
  const encrypt = () => {
    if (part.content.format !== "encrypted") return;
    const r = encryptFor(part.content.scheme, plaintext, signer, peer);
    cryptoError = r.ok ? "" : format(t.content.cryptoFailed, { reason: r.error.message });
    if (r.ok) set("content", r.value);
  };
  const decrypt = () => {
    if (part.content.format !== "encrypted") return;
    const r = decryptFrom(part.content.scheme, content, signer, peer);
    cryptoError = r.ok ? "" : format(t.content.cryptoFailed, { reason: r.error.message });
    if (r.ok) plaintext = r.value;
  };
  const contentJson = $derived.by(() => {
    const p = parseJsonNodes(content);
    return p.ok ? nodeValue(p.value) : undefined;
  });
</script>

<div class="form" data-testid={testid} bind:this={root}>
  <div class="row two">
    <div onfocusin={select(["kind"])} data-json-path={JSON.stringify(["kind"])}>
      <FieldInput
        testid="{testid}-kind"
        {locale}
        field={{ type: "kind", kinds: kindOptions }}
        label={t.fields.kind}
        value={String(ev["kind"] ?? "")}
        invalid={issuesAt(["kind"]).length > 0}
        onchange={(v) => set("kind", /^\d+$/.test(v) ? Number(v) : v)}
      />
    </div>
    <div onfocusin={select(["created_at"])} data-json-path={JSON.stringify(["created_at"])}>
      <FieldInput
        testid="{testid}-created-at"
        {locale}
        field={{ type: "timestamp" }}
        label={t.fields.createdAt}
        value={String(ev["created_at"] ?? "")}
        invalid={issuesAt(["created_at"]).length > 0}
        onchange={(v) => set("created_at", /^\d+$/.test(v) ? Number(v) : v)}
      />
    </div>
  </div>
  <div onfocusin={select(["pubkey"])} data-json-path={JSON.stringify(["pubkey"])}>
    <FieldInput
      testid="{testid}-pubkey"
      {locale}
      field={{ type: "pubkey" }}
      label={t.fields.pubkey}
      value={typeof ev["pubkey"] === "string" ? ev["pubkey"] : ""}
      invalid={issuesAt(["pubkey"]).length > 0}
      onchange={(v) => set("pubkey", v)}
    />
  </div>

  <section
    class="block"
    data-testid="{testid}-content"
    data-format={part.content.format}
    onfocusin={select(["content"])}
    data-json-path={JSON.stringify(["content"])}
  >
    <h4 class="block-title">{t.fields.content}</h4>
    {#if hasNipText(nip, part.content.explain)}
      <p class="help">{text(part.content.explain)}</p>
    {/if}
    {#if part.content.format === "empty"}
      <p class="help">{t.content.empty}</p>
      {#if content !== ""}
        <FieldInput
          testid="{testid}-content-text"
          {locale}
          field={{ type: "text" }}
          label={t.fields.content}
          value={content}
          invalid
          onchange={(v) => set("content", v)}
        />
      {/if}
    {:else if part.content.format === "text"}
      <FieldInput
        testid="{testid}-content-text"
        {locale}
        field={part.content.field ?? { type: "text", multiline: part.content.multiline !== false }}
        label={t.fields.content}
        value={content}
        invalid={issuesAt(["content"]).length > 0}
        onchange={(v) => set("content", v)}
      />
    {:else if part.content.format === "json"}
      {#if contentJson !== undefined}
        <SchemaField
          testid="{testid}-content"
          {locale}
          {nip}
          schema={part.content.schema}
          value={contentJson}
          path={[]}
          label={t.fields.content}
          issues={[]}
          onchange={(path, v) => {
            // The content is a JSON *string*: edit the parsed object, store it re-stringified.
            const base = contentJson;
            const next = path.length === 0 ? v : setIn(base, path, v);
            set("content", JSON.stringify(next));
          }}
        />
      {:else}
        <FieldInput
          testid="{testid}-content-text"
          {locale}
          field={{ type: "json", schema: part.content.schema }}
          label={t.fields.content}
          value={content}
          invalid
          onchange={(v) => set("content", v)}
        />
      {/if}
    {:else if part.content.format === "encrypted"}
      <p class="badge-line">
        <span class="pill"
          >{format(t.content.encryptedWith, { scheme: part.content.scheme.toUpperCase() })}</span
        >
      </p>
      <div class="row two">
        <label class="lbl">
          {t.content.recipient}
          <select
            class="select"
            data-testid="{testid}-recipient"
            value={peer}
            onchange={(e) => (recipient = e.currentTarget.value)}
          >
            {#each PERSONAS as p (p.id)}
              <option value={p.pubkey}>{p.displayName}</option>
            {/each}
            {#if !PERSONAS.some((p) => p.pubkey === peer)}
              <option value={peer}>{peer.slice(0, 12)}…</option>
            {/if}
          </select>
        </label>
      </div>
      <FieldInput
        testid="{testid}-plaintext"
        {locale}
        field={{ type: "text", multiline: true }}
        label={t.content.plaintext}
        value={plaintext}
        onchange={(v) => (plaintext = v)}
      />
      <div class="actions">
        <button
          type="button"
          class="act"
          data-testid="{testid}-encrypt"
          disabled={plaintext === ""}
          onclick={encrypt}
        >
          {t.content.encrypt}
          ↓
        </button>
        <button
          type="button"
          class="act"
          data-testid="{testid}-decrypt"
          disabled={content === ""}
          onclick={decrypt}
        >
          ↑ {t.content.decrypt}
        </button>
      </div>
      {#if cryptoError !== ""}
        <p class="bad" role="alert">{cryptoError}</p>
      {/if}
      <FieldInput
        testid="{testid}-content-text"
        {locale}
        field={{ type: "base64" }}
        label={t.fields.content}
        value={content}
        invalid={issuesAt(["content"]).length > 0}
        onchange={(v) => set("content", v)}
      />
    {/if}
    {#each issuesAt(["content"]) as issue, i (i)}
      <p class="bad">{message(issue)}</p>
    {/each}
  </section>

  <section class="block" data-testid="{testid}-tags">
    <h4 class="block-title">{t.fields.tags}</h4>
    {#if tags.length === 0}
      <p class="help">{t.tags.empty}</p>
    {/if}
    <ol class="tags">
      {#each tags as row, i (i)}
        {@const spec = matchTagSpec(part, row)}
        {@const name = row[0] ?? ""}
        <li
          class="tag"
          data-testid="{testid}-tag-{i}"
          data-tag={spec === undefined ? "unknown" : tagSpecId(spec)}
          onfocusin={select(["tags", i])}
          data-json-path={JSON.stringify(["tags", i])}
        >
          <div class="tag-head">
            <span class="tag-name"><code>{name || "?"}</code></span>
            {#if spec === undefined}
              <span class="note">{t.tags.unknown}</span>
            {:else}
              <span class="note">{t.presence[spec.presence]}</span>
            {/if}
            <span class="tools">
              <button
                type="button"
                class="icon"
                data-testid="{testid}-tag-{i}-up"
                aria-label={t.tags.moveUp}
                disabled={i === 0}
                onclick={() => moveTag(i, i - 1)}
              >
                ↑
              </button>
              <button
                type="button"
                class="icon"
                data-testid="{testid}-tag-{i}-down"
                aria-label={t.tags.moveDown}
                disabled={i === tags.length - 1}
                onclick={() => moveTag(i, i + 1)}
              >
                ↓
              </button>
              <button
                type="button"
                class="icon danger"
                data-testid="{testid}-tag-{i}-remove"
                aria-label={t.tags.remove}
                onclick={() => removeTag(i)}
              >
                ×
              </button>
            </span>
          </div>
          {#if spec !== undefined && hasNipText(nip, spec.explain)}
            <p class="help">{text(spec.explain)}</p>
          {/if}
          <div class="values">
            {#each row as cell, j (j)}
              {#if j > 0}
                {@const f = spec?.fields[j - 1] ?? spec?.rest}
                <div
                  onfocusin={select(["tags", i, j])}
                  data-json-path={JSON.stringify(["tags", i, j])}
                >
                  <FieldInput
                    testid="{testid}-tag-{i}-value-{j}"
                    {locale}
                    field={f?.type ?? { type: "text" }}
                    label={f?.name ?? format(t.tags.value, { n: j })}
                    value={cell}
                    placeholder={f?.placeholder}
                    invalid={issuesAt(["tags", i, j]).length > 0}
                    onchange={(v) => setTagValue(i, j, v)}
                  />
                  {#each issuesAt(["tags", i, j]) as issue, k (k)}
                    <p class="bad">{message(issue)}</p>
                  {/each}
                </div>
              {/if}
            {/each}
          </div>
          <div class="actions">
            {#if spec === undefined ||
              spec.rest !== undefined ||
              row.length - 1 < spec.fields.length}
              <button
                type="button"
                class="act small"
                data-testid="{testid}-tag-{i}-add-value"
                onclick={() => setTags(tags.map((r, k) => (k === i ? [...r, ""] : r)))}
              >
                + {t.tags.addValue}
              </button>
            {/if}
            {#if row.length > 2 &&
              (spec === undefined || (spec.fields[row.length - 2]?.optional ?? true))}
              <button
                type="button"
                class="act small"
                data-testid="{testid}-tag-{i}-remove-value"
                onclick={() => setTags(tags.map((r, k) => (k === i ? r.slice(0, -1) : r)))}
              >
                − {t.tags.removeValue}
              </button>
            {/if}
          </div>
          {#each issuesAt(["tags", i]) as issue, k (k)}
            <p class="bad">{message(issue)}</p>
          {/each}
        </li>
      {/each}
    </ol>
    <!-- The adders stand for the whole tag list: focusing them explains it and its rules. -->
    <fieldset class="adders" onfocusin={select(["tags"])} data-json-path={JSON.stringify(["tags"])}>
      <legend class="sr">{t.tags.add}</legend>
      {#each part.tags as tag (tagSpecId(tag))}
        <button
          type="button"
          class="chip"
          class:required={tag.presence === "required"}
          data-testid="{testid}-add-{tagSpecId(tag)}"
          disabled={!tag.repeatable && present(tag)}
          title={hasNipText(nip, tag.explain) ? text(tag.explain) : undefined}
          onclick={() => setTags([...tags, tagTemplate(tag)])}
        >
          + <code>{tag.name}</code>{tag.when ? ` ${tag.when.equals}` : ""}
        </button>
      {/each}
      <span class="custom">
        <input
          class="keyinput"
          data-testid="{testid}-custom-tag"
          aria-label={t.tags.name}
          placeholder={t.tags.name}
          bind:value={customName}
        >
        <button
          type="button"
          class="chip"
          data-testid="{testid}-add-tag"
          disabled={customName.trim() === ""}
          onclick={() => {
            setTags([...tags, [customName.trim(), ""]]);
            customName = "";
          }}
        >
          {t.tags.addCustom}
        </button>
      </span>
    </fieldset>
    {#each issuesAt(["tags"]) as issue, k (k)}
      <p class="bad">{message(issue)}</p>
    {/each}
  </section>
</div>

<style>
  .form {
    display: grid;
    gap: var(--space-md);
    min-inline-size: 0;
  }
  .row {
    display: grid;
    gap: var(--space-sm);
  }
  /* Mirrors tokens.breakpoint.sm (480px): CSS vars can't be used in media queries. */
  @media (min-width: 480px) {
    .two {
      grid-template-columns: 1fr 1fr;
    }
  }
  .block {
    display: grid;
    gap: var(--space-sm);
    padding-block-start: var(--space-sm);
    border-block-start: var(--border-width-medium) solid var(--color-border-strong);
  }
  .block-title {
    margin: 0;
    font-family: var(--font-family-display);
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-bold);
  }
  .help {
    margin: 0;
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
    line-height: var(--font-line-height-normal);
  }
  .tags {
    display: grid;
    gap: var(--space-sm);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  /* Each tag is a torn-out slip: ink outline, sunken paper, hard shadow that lifts on focus. */
  .tag {
    display: grid;
    gap: var(--space-xs);
    padding: var(--space-sm);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-sm);
    background: var(--color-surface-sunken);
    box-shadow: var(--shadow-pressed);
    transition:
      box-shadow var(--motion-duration-press) var(--motion-easing-press),
      translate var(--motion-duration-press) var(--motion-easing-press);
  }
  .tag:focus-within {
    box-shadow: var(--shadow-pop-sm);
    translate: calc(var(--size-lift) * -1) calc(var(--size-lift) * -1);
  }
  .tag[data-tag="unknown"] {
    border-style: dashed;
  }
  .tag-head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-xs);
  }
  .tag-name code {
    padding: var(--space-3xs) var(--space-xs);
    border-radius: var(--radius-sm);
    background: var(--color-primary);
    color: var(--color-on-primary);
    font-family: var(--font-family-mono);
    font-weight: var(--font-weight-bold);
  }
  .note {
    color: var(--color-text-muted);
    font-size: var(--font-size-xs);
  }
  .tools {
    display: inline-flex;
    gap: var(--space-3xs);
    margin-inline-start: auto;
  }
  .values {
    display: grid;
    gap: var(--space-xs);
  }
  .actions,
  .adders {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-xs);
  }
  fieldset.adders {
    margin: 0;
    padding: 0;
    border: none;
    min-inline-size: 0;
  }
  .sr {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
  .custom {
    display: inline-flex;
    gap: var(--space-2xs);
  }
  .icon,
  .chip,
  .act,
  .keyinput,
  .select {
    min-block-size: var(--size-control-sm);
    border: var(--border-width-thin) solid var(--color-border-strong);
    border-radius: var(--radius-sm);
    background: var(--color-surface);
    color: var(--color-text);
    font-family: var(--font-family-mono);
    font-size: var(--font-size-sm);
  }
  /* Fields stay at 16px+ so iOS does not zoom in on focus. */
  .keyinput,
  .select {
    font-size: var(--font-size-md);
  }
  .icon {
    inline-size: var(--size-control-sm);
    padding: 0;
    cursor: pointer;
  }
  .icon.danger {
    color: var(--color-danger);
  }
  .chip,
  .act {
    padding: 0 var(--space-xs);
    cursor: pointer;
    box-shadow: var(--shadow-pressed);
    transition: translate var(--motion-duration-press) var(--motion-easing-press);
  }
  .chip {
    border-radius: var(--radius-pill);
  }
  .chip.required {
    border-width: var(--border-width-medium);
    background: var(--color-highlight);
    color: var(--color-on-highlight);
  }
  .act {
    font-family: var(--font-family-display);
    font-weight: var(--font-weight-semibold);
    box-shadow: var(--shadow-pop-sm);
  }
  .act.small {
    font-size: var(--font-size-xs);
    box-shadow: var(--shadow-pressed);
  }
  @media (hover: hover) {
    .chip:hover:not(:disabled),
    .act:hover:not(:disabled),
    .icon:hover:not(:disabled) {
      background: var(--color-primary-subtle);
    }
  }
  .chip:active:not(:disabled),
  .act:active:not(:disabled),
  .icon:active:not(:disabled) {
    translate: var(--size-lift) var(--size-lift);
    box-shadow: var(--shadow-pressed);
  }
  button:disabled {
    opacity: var(--opacity-disabled);
    cursor: not-allowed;
  }
  .keyinput {
    inline-size: 8em;
    padding: 0 var(--space-xs);
  }
  .select {
    display: block;
    inline-size: 100%;
    margin-block-start: var(--space-3xs);
    padding: 0 var(--space-xs);
  }
  .lbl {
    color: var(--color-text-muted);
    font-family: var(--font-family-mono);
    font-size: var(--font-size-xs);
  }
  .pill {
    padding: var(--space-3xs) var(--space-xs);
    border: var(--border-width-thin) solid var(--color-border-strong);
    border-radius: var(--radius-pill);
    background: var(--color-secondary-subtle);
    font-family: var(--font-family-mono);
    font-size: var(--font-size-xs);
  }
  .badge-line {
    margin: 0;
  }
  button:focus-visible,
  .keyinput:focus-visible,
  .select:focus-visible {
    outline: var(--border-width-thick) solid var(--color-focus-ring);
    outline-offset: var(--size-focus-offset);
  }
  @media (pointer: coarse) {
    .icon,
    .chip,
    .act,
    .keyinput,
    .select {
      min-block-size: var(--size-touch-target);
    }
    .icon {
      inline-size: var(--size-touch-target);
    }
  }
  .bad {
    margin: 0;
    color: var(--color-danger);
    font-size: var(--font-size-xs);
  }
</style>
