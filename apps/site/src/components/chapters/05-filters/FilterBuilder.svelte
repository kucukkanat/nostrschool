<script lang="ts">
  /**
   * Chapter 05 centerpiece (also the core of /tools/filter-playground): a visual NIP-01 filter
   * builder over a "relay shelf" of real fixture events. Matching events light up and float to
   * the front; the JSON on the right is exactly what a client would put in a REQ.
   */
  import { FIXTURE_EVENTS, PERSONAS, personaByPubkey } from "@nostrschool/fixtures";
  import { format, getDictionary, type Locale, plural } from "@nostrschool/i18n";
  import { classifyKind, type NostrEvent } from "@nostrschool/protocol";
  import { Badge, CodeBlock, duration, JsonView, mascotBus, pop } from "@nostrschool/ui";
  import type { Snippet } from "svelte";
  import { flip } from "svelte/animate";
  import {
    describeDraft,
    draftToFilter,
    EMPTY_DRAFT,
    type EvaluatedRow,
    evaluate,
    eventPreview,
    type FilterDraft,
    formatTimestamp,
    isEmptyDraft,
    kindLabel,
    LIMIT_MAX,
    type ListField,
    NEW_YEARS_EVE,
    PRESET_IDS,
    PRESETS,
    parseFilterJson,
    QUICK_HASHTAGS,
    QUICK_KINDS,
    reqMessage,
    shortHex,
    TIME_RANGE,
    TIME_STEP,
    toggleValue,
  } from "./filter-logic.ts";
  import ListInput from "./ListField.svelte";
  import NumberField from "./NumberField.svelte";

  interface Props {
    readonly locale: Locale;
    /**
     * Parts: `-preset-<id> -reset -field-<ids|authors|kinds|e|p|t> -field-<since|until|limit>
     * -narration -json -req -count -shelf -card-<id> -explain -explain-check-<field> -pin -find-tagged
     * -find-author -editor -editor-input -editor-apply -editor-status`.
     */
    readonly testid?: string;
    /** Bindable: lets wrappers (quests, the playground) read and drive the filter. */
    draft?: FilterDraft;
    readonly events?: readonly NostrEvent[];
    readonly headingLevel?: 2 | 3;
    /** Show the raw-JSON editor (tool page). */
    readonly editor?: boolean;
    /** Extra content under the header (quests use it for their goal cards). */
    readonly extra?: Snippet;
  }

  let {
    locale,
    testid = "ch05-builder",
    draft = $bindable(EMPTY_DRAFT),
    events = FIXTURE_EVENTS,
    headingLevel = 3,
    editor = false,
    extra,
  }: Props = $props();

  const dict = $derived(getDictionary(locale));
  const t = $derived(dict.chapters.ch05);
  const filter = $derived(draftToFilter(draft));
  const result = $derived(evaluate(filter, events));
  // Lit cards float to the front (stable within each group), so the answer is always on top.
  const order: Readonly<Record<EvaluatedRow["state"], number>> = { match: 0, limited: 1, miss: 2 };
  const rows = $derived([...result.rows].sort((a, b) => order[a.state] - order[b.state]));
  const returned = $derived(result.returnedIds.length);
  const cut = $derived(result.matching - returned);
  const narration = $derived(
    `${describeDraft(locale, draft)} ${plural(locale, returned, t.builder.results, { total: events.length })}`,
  );

  let selectedId = $state<string | null>(null);
  const selected = $derived(result.rows.find((r) => r.event.id === selectedId));

  const personaPicks = PERSONAS.map((p) => ({
    value: p.pubkey,
    label: p.displayName,
    avatar: p.avatar,
  }));
  const quickPicks = $derived<
    Readonly<Record<ListField, readonly { value: string; label: string; avatar?: string }[]>>
  >({
    ids: [],
    authors: personaPicks,
    kinds: QUICK_KINDS.map((k) => ({ value: k, label: `${k} · ${kindLabel(locale, Number(k))}` })),
    "#e": [],
    "#p": personaPicks,
    "#t": QUICK_HASHTAGS.map((h) => ({ value: h, label: `#${h}` })),
  });
  const LISTS: readonly ListField[] = ["authors", "kinds", "#t", "#p", "#e", "ids"];
  const partOf = (field: ListField) => field.replace("#", "");

  // A one-event result is the "aha" moment: the filter says exactly what you meant.
  let bullseye = false;
  $effect(() => {
    if (returned === 1 && !isEmptyDraft(draft) && !bullseye) {
      bullseye = true;
      mascotBus.emit("celebrate", { reason: `${testid}-bullseye` });
    }
  });

  const set = (next: FilterDraft) => {
    draft = next;
  };
  const authorName = (pubkey: string) =>
    personaByPubkey(pubkey)?.displayName ?? t.builder.unknownAuthor;
  const avatarOf = (pubkey: string) => personaByPubkey(pubkey)?.avatar;
  const time = (s: number) => formatTimestamp(locale, s);

  // Tool page: raw JSON editing, kept in sync whenever the builder changes the filter.
  let editorText = $state("");
  let editorStatus = $state("");
  let editorError = $state(false);
  $effect(() => {
    editorText = JSON.stringify(filter, null, 2);
  });
  const applyJson = () => {
    const parsed = parseFilterJson(editorText);
    if (parsed.ok) {
      draft = parsed.value;
      editorError = false;
      editorStatus = t.editor.applied;
    } else {
      editorError = true;
      editorStatus = format(t.editor.errors[parsed.error.code], { message: parsed.error.message });
    }
  };
</script>

{#snippet card(
  row: EvaluatedRow,
)}
  {@const e = row.event}
  {@const avatar = avatarOf(e.pubkey)}
  <button
    type="button"
    class="card"
    data-state={row.state}
    aria-pressed={selectedId === e.id}
    aria-label={format(t.builder.cardLabel, {
      author: authorName(e.pubkey),
      kind: kindLabel(locale, e.kind),
      time: time(e.created_at),
      state: t.builder.states[row.state],
    })}
    data-testid="{testid}-card-{e.id}"
    onclick={() => (selectedId = selectedId === e.id ? null : e.id)}
  >
    <span class="who" aria-hidden="true">
      {#if avatar === undefined}
        <span class="avatar blank"></span>
      {:else}
        <img class="avatar" src={avatar} alt="">
      {/if}
      <span class="name">{authorName(e.pubkey)}</span>
      <span class="mark">{row.state === "match" ? "✓" : row.state === "limited" ? "✂" : ""}</span>
    </span>
    <span class="kind" aria-hidden="true">
      <Badge tone={classifyKind(e.kind)} size="sm">{e.kind}</Badge>
      <span class="kind-name">{kindLabel(locale, e.kind)}</span>
    </span>
    <span class="preview" aria-hidden="true">{eventPreview(locale, e)}</span>
    <time class="time" aria-hidden="true">{time(e.created_at)}</time>
  </button>
{/snippet}

<section
  class="builder"
  data-testid={testid}
  data-returned={returned}
  data-matching={result.matching}
>
  <header class="head">
    <svelte:element this={`h${headingLevel}`} class="title">{t.builder.title}</svelte:element>
    <p class="desc">{t.builder.description}</p>
  </header>

  {@render extra?.()}

  <fieldset class="presets">
    <legend class="presets-label">{t.builder.presetsLabel}</legend>
    {#each PRESET_IDS as id (id)}
      <button
        type="button"
        class="preset"
        data-testid="{testid}-preset-{id}"
        onclick={() => {
          draft = PRESETS[id];
          selectedId = null;
        }}
      >
        {t.builder.presets[id]}
      </button>
    {/each}
    <button
      type="button"
      class="preset reset"
      data-testid="{testid}-reset"
      disabled={isEmptyDraft(draft)}
      onclick={() => {
        draft = EMPTY_DRAFT;
        selectedId = null;
      }}
    >
      {t.builder.reset}
    </button>
  </fieldset>

  <div class="layout">
    <fieldset class="controls">
      <legend class="visually-hidden">{t.builder.controlsLabel}</legend>
      {#each LISTS as field (field)}
        <ListInput
          {locale}
          {field}
          {draft}
          testid="{testid}-field-{partOf(field)}"
          quickPicks={quickPicks[field]}
          onchange={set}
        />
      {/each}
      <NumberField
        {locale}
        field="since"
        {draft}
        testid="{testid}-field-since"
        min={TIME_RANGE.min}
        max={TIME_RANGE.max}
        step={TIME_STEP}
        initial={NEW_YEARS_EVE}
        display={time}
        onchange={set}
      />
      <NumberField
        {locale}
        field="until"
        {draft}
        testid="{testid}-field-until"
        min={TIME_RANGE.min}
        max={TIME_RANGE.max}
        step={TIME_STEP}
        initial={TIME_RANGE.max}
        display={time}
        onchange={set}
      />
      <NumberField
        {locale}
        field="limit"
        {draft}
        testid="{testid}-field-limit"
        min={1}
        max={LIMIT_MAX}
        step={1}
        initial={5}
        display={String}
        onchange={set}
      />
    </fieldset>

    <div class="output">
      <p class="sentence" aria-live="polite" data-testid="{testid}-narration">{narration}</p>

      <div class="json">
        <p class="sub">{t.builder.jsonTitle}</p>
        <JsonView testid="{testid}-json" {locale} value={filter} />
        <p class="sub">{t.builder.reqTitle}</p>
        <CodeBlock testid="{testid}-req" {locale} lang="json" code={reqMessage("ch05", filter)} />
      </div>

      {#if editor}
        <div class="editor" data-testid="{testid}-editor">
          <label class="sub" for="{testid}-editor-input">{t.editor.label}</label>
          <textarea
            id="{testid}-editor-input"
            bind:value={editorText}
            rows="8"
            spellcheck="false"
            aria-invalid={editorError}
            aria-describedby="{testid}-editor-status"
            data-testid="{testid}-editor-input"
          ></textarea>
          <button
            type="button"
            class="apply"
            data-testid="{testid}-editor-apply"
            onclick={applyJson}
          >
            {t.editor.apply}
          </button>
          <p
            id="{testid}-editor-status"
            class="status"
            class:bad={editorError}
            aria-live="polite"
            data-testid="{testid}-editor-status"
          >
            {editorStatus}
          </p>
        </div>
      {/if}

      <p class="count" data-testid="{testid}-count">
        {#key returned}
          <strong use:pop
            >{plural(locale, returned, t.builder.results, { total: events.length })}</strong
          >
        {/key}
        {#if cut > 0}
          <span class="cut" data-testid="{testid}-cut"
            >{plural(locale, cut, t.builder.limited)}</span
          >
        {/if}
      </p>

      <ul class="shelf" aria-label={t.builder.shelfLabel} data-testid="{testid}-shelf">
        {#each rows as row (row.event.id)}
          <li animate:flip={{ duration: duration("slow") }}>{@render card(row)}</li>
        {/each}
      </ul>
    </div>
  </div>

  <div class="explain" aria-live="polite" data-testid="{testid}-explain">
    {#if selected === undefined}
      <p class="muted">{t.explain.prompt}</p>
    {:else}
      {@const e = selected.event}
      <div class="explain-card" use:pop data-state={selected.state}>
        <div class="explain-head">
          <p class="sub">{t.explain.title}</p>
          <button
            type="button"
            class="ghost"
            data-testid="{testid}-explain-close"
            onclick={() => (selectedId = null)}
          >
            {t.explain.close}
          </button>
        </div>
        <p class="mono">{authorName(e.pubkey)} · {e.kind} · {shortHex(e.id)}</p>
        {#if selected.checks.length === 0}
          <p>{t.explain.empty}</p>
        {:else}
          <ul class="checks">
            {#each selected.checks as check (check.field)}
              <li
                class:pass={check.passed}
                data-passed={check.passed}
                data-testid="{testid}-explain-check-{check.field.replace("#", "")}"
              >
                <span aria-hidden="true">{check.passed ? "✓" : "✗"}</span>
                <code>{check.field}</code>
                {check.passed ? t.explain.pass : t.explain.fail}
              </li>
            {/each}
          </ul>
        {/if}
        <p class="verdict" data-testid="{testid}-explain-verdict">
          {selected.state === "match"
            ? t.explain.verdictMatch
            : selected.state === "limited"
              ? t.explain.verdictLimited
              : t.explain.verdictMiss}
        </p>
        <div class="actions">
          <button
            type="button"
            class="preset"
            data-testid="{testid}-pin"
            onclick={() => set({ ...EMPTY_DRAFT, lists: { ...EMPTY_DRAFT.lists, ids: [e.id] } })}
          >
            {t.explain.pinId}
          </button>
          <button
            type="button"
            class="preset"
            data-testid="{testid}-find-tagged"
            onclick={() => set({ ...EMPTY_DRAFT, lists: { ...EMPTY_DRAFT.lists, "#e": [e.id] } })}
          >
            {t.explain.findTagged}
          </button>
          <button
            type="button"
            class="preset"
            data-testid="{testid}-find-author"
            onclick={() => set(toggleValue(EMPTY_DRAFT, "authors", e.pubkey))}
          >
            {t.explain.findAuthor}
          </button>
        </div>
      </div>
    {/if}
  </div>
</section>

<style>
  .builder {
    display: grid;
    gap: var(--space-md);
    margin-block: var(--space-xl);
    padding: var(--space-md);
    min-block-size: var(--size-diagram-min-height);
    border: var(--border-width-thick) solid var(--color-border-strong);
    border-radius: var(--radius-xl);
    background: var(--color-surface);
    box-shadow: var(--shadow-pop);
  }
  .head {
    display: grid;
    gap: var(--space-3xs);
  }
  .title {
    margin: 0;
    font-family: var(--font-family-display);
    font-size: var(--font-size-2xl);
    font-weight: var(--font-weight-black);
    color: var(--color-text-primary);
  }
  .desc,
  .muted {
    margin: 0;
    color: var(--color-text-muted);
  }
  .presets {
    margin: 0;
    padding: 0;
    border: 0;
    min-inline-size: 0;
  }
  .presets,
  .actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2xs);
  }
  .presets-label {
    float: inline-start;
    margin-inline-end: var(--space-2xs);
    padding: 0;
    font-weight: var(--font-weight-bold);
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
  }
  .preset,
  .ghost,
  .apply {
    min-block-size: var(--size-control-md);
    padding: var(--space-2xs) var(--space-sm);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-pill);
    background: var(--color-accent-subtle);
    color: var(--color-text);
    font: inherit;
    font-weight: var(--font-weight-semibold);
    font-size: var(--font-size-sm);
    cursor: pointer;
    transition: transform var(--motion-duration-fast) var(--motion-easing-bounce);
  }
  .preset:hover:not(:disabled),
  .apply:hover {
    transform: translateY(calc(var(--space-3xs) * -1)) rotate(-1deg);
  }
  .preset:disabled {
    opacity: var(--opacity-disabled);
    cursor: not-allowed;
  }
  .reset,
  .ghost {
    background: var(--color-surface);
  }
  .apply {
    justify-self: start;
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: var(--color-on-primary);
  }
  button:focus-visible,
  textarea:focus-visible {
    outline: var(--border-width-thick) solid var(--color-focus-ring);
    outline-offset: var(--space-3xs);
  }
  .layout {
    display: grid;
    gap: var(--space-md);
  }
  /* tokens.breakpoint.lg = 1024px */
  @media (min-width: 1024px) {
    .layout {
      grid-template-columns: minmax(0, 2fr) minmax(0, 3fr);
      align-items: start;
    }
  }
  .controls {
    margin: 0;
    padding: 0;
    border: 0;
    min-inline-size: 0;
    display: grid;
    gap: var(--space-sm);
  }
  .output {
    display: grid;
    gap: var(--space-sm);
    min-inline-size: 0;
  }
  .sentence {
    margin: 0;
    padding: var(--space-sm) var(--space-md);
    border-radius: var(--radius-lg);
    background: var(--color-primary-subtle);
    font-family: var(--font-family-display);
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
  }
  .json {
    display: grid;
    gap: var(--space-2xs);
    min-inline-size: 0;
  }
  .sub {
    margin: 0;
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: var(--font-letter-spacing-caps);
  }
  .editor {
    display: grid;
    gap: var(--space-2xs);
  }
  textarea {
    inline-size: 100%;
    box-sizing: border-box;
    padding: var(--space-xs);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-md);
    background: var(--color-code-bg);
    color: var(--color-code-text);
    font-family: var(--font-family-mono);
    font-size: var(--font-size-sm);
  }
  textarea[aria-invalid="true"] {
    border-color: var(--color-danger);
  }
  .status {
    margin: 0;
    min-block-size: 1lh;
    font-size: var(--font-size-sm);
  }
  .status.bad {
    font-weight: var(--font-weight-bold);
  }
  .count {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: var(--space-xs);
    margin: 0;
    font-size: var(--font-size-lg);
  }
  .count strong {
    display: inline-block;
  }
  .cut {
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
  }
  .shelf {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, calc(var(--size-rail) * 0.75)), 1fr));
    gap: var(--space-xs);
    max-block-size: calc(var(--size-diagram-min-height) * 2);
    margin: 0;
    padding: var(--space-2xs);
    overflow-y: auto;
    list-style: none;
    border-radius: var(--radius-lg);
    background: var(--color-surface-sunken);
  }
  .card {
    display: grid;
    gap: var(--space-3xs);
    inline-size: 100%;
    block-size: 100%;
    padding: var(--space-xs);
    border: var(--border-width-medium) solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-surface-raised);
    color: var(--color-text);
    font: inherit;
    text-align: start;
    cursor: pointer;
    transition:
      background-color var(--motion-duration-normal) var(--motion-easing-standard),
      transform var(--motion-duration-slow) var(--motion-easing-bounce),
      box-shadow var(--motion-duration-normal) var(--motion-easing-standard),
      border-color var(--motion-duration-normal) var(--motion-easing-standard);
  }
  .card[data-state="match"] {
    border-color: var(--color-primary);
    box-shadow:
      0 0 0 var(--border-width-medium) var(--color-primary-subtle),
      var(--shadow-pop-sm);
    transform: translateY(calc(var(--space-3xs) * -1));
  }
  .card[data-state="limited"] {
    border-style: dashed;
    border-color: var(--color-warning);
  }
  /* Misses recede without lowering text contrast: flatter, smaller, quieter, grey avatar. */
  .card[data-state="miss"] {
    border-color: transparent;
    background: var(--color-surface);
    color: var(--color-text-muted);
    transform: scale(0.96);
  }
  .card[data-state="miss"]:hover,
  .card[data-state="miss"]:focus-visible {
    transform: scale(1);
  }
  .card[aria-pressed="true"] {
    outline: var(--border-width-thick) solid var(--color-secondary);
    outline-offset: var(--space-3xs);
  }
  .who,
  .kind {
    display: flex;
    align-items: center;
    gap: var(--space-2xs);
    min-inline-size: 0;
  }
  .avatar {
    flex: none;
    inline-size: var(--size-avatar-sm);
    block-size: var(--size-avatar-sm);
    border-radius: var(--radius-round);
    transition:
      opacity var(--motion-duration-normal) var(--motion-easing-standard),
      filter var(--motion-duration-normal) var(--motion-easing-standard);
  }
  .card[data-state="miss"] .avatar {
    opacity: var(--opacity-dimmed);
    filter: grayscale(1);
  }
  .blank {
    background: var(--color-border-strong);
  }
  .name {
    flex: 1;
    font-weight: var(--font-weight-bold);
    font-size: var(--font-size-sm);
  }
  .mark {
    color: var(--color-text-primary);
    font-weight: var(--font-weight-black);
  }
  .kind-name,
  .time {
    color: var(--color-text-muted);
    font-size: var(--font-size-xs);
  }
  .preview {
    overflow: hidden;
    font-size: var(--font-size-sm);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow-wrap: anywhere;
  }
  .explain {
    min-block-size: var(--size-control-lg);
  }
  .explain-card {
    display: grid;
    gap: var(--space-xs);
    padding: var(--space-md);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-lg);
    background: var(--color-surface-raised);
  }
  .explain-card[data-state="match"] {
    border-color: var(--color-primary);
  }
  .explain-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-xs);
  }
  .explain-card p {
    margin: 0;
  }
  .explain-head .sub {
    margin: 0;
  }
  .mono {
    font-family: var(--font-family-mono);
    font-size: var(--font-size-sm);
    overflow-wrap: anywhere;
  }
  .checks {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2xs);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .checks li {
    display: inline-flex;
    align-items: center;
    gap: var(--space-3xs);
    padding: var(--space-3xs) var(--space-xs);
    border-radius: var(--radius-pill);
    background: var(--color-danger-subtle);
    font-size: var(--font-size-sm);
  }
  .checks li.pass {
    background: var(--color-success-subtle);
  }
  .verdict {
    font-weight: var(--font-weight-bold);
  }
</style>
