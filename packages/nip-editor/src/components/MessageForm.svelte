<script lang="ts">
  import { format } from "@nostrschool/i18n";
  import type { JsonPath, JsonValue } from "@nostrschool/nips";
  import { skeleton } from "../logic/fields.ts";
  import { setIn } from "../logic/immutable.ts";
  import { editorStrings, hasNipText, nipText } from "../logic/text.ts";
  import type { MessageFormProps } from "../types.ts";
  import SchemaField from "./SchemaField.svelte";

  let {
    testid,
    locale,
    nip,
    part,
    value = $bindable(),
    issues,
    onselectpath,
  }: MessageFormProps = $props();
  const t = $derived(editorStrings(locale));
  const text = $derived(nipText(locale, nip));
  const arr = $derived<readonly JsonValue[]>(Array.isArray(value) ? value : [part.type]);
  const last = $derived(part.elements.at(-1));
  // Positions 1… map to elements; a repeatable last element absorbs the tail (REQ's filters).
  const slots = $derived(
    Array.from(
      { length: Math.max(arr.length - 1, part.elements.filter((e) => e.optional !== true).length) },
      (_, i) => ({
        index: i + 1,
        el: part.elements[i] ?? (last?.repeatable === true ? last : undefined),
      }),
    ),
  );
  const change = (path: JsonPath, v: JsonValue) => {
    value = setIn(arr, path, v);
  };
  const removeAt = (index: number) => {
    value = arr.filter((_, i) => i !== index);
  };
  const canRemove = (index: number) => {
    const el = part.elements[index - 1] ?? last;
    return (
      index === arr.length - 1 &&
      (el?.optional === true || (el?.repeatable === true && index > part.elements.length))
    );
  };
  const nextEl = $derived(
    part.elements[arr.length - 1] ?? (last?.repeatable === true ? last : undefined),
  );
</script>

<div class="form" data-testid={testid}>
  <div class="head">
    <code class="type" data-testid="{testid}-type">{part.type}</code>
    <span class="dir">{t.message.direction[part.direction]}</span>
  </div>
  <ol class="elements">
    {#each slots as slot (slot.index)}
      <li class="element" data-testid="{testid}-element-{slot.index}">
        {#if slot.el === undefined}
          <SchemaField
            testid="{testid}-element-{slot.index}"
            {locale}
            {nip}
            schema={{ type: "any" }}
            value={arr[slot.index]}
            path={[slot.index]}
            label={String(slot.index)}
            {issues}
            onchange={change}
            {onselectpath}
          />
        {:else}
          <SchemaField
            testid="{testid}-element-{slot.index}"
            {locale}
            {nip}
            schema={slot.el.schema}
            value={arr[slot.index]}
            path={[slot.index]}
            label={slot.el.name}
            explain={hasNipText(nip, slot.el.schema.explain)
              ? slot.el.schema.explain
              : slot.el.explain}
            {issues}
            onchange={change}
            {onselectpath}
            onremove={canRemove(slot.index) ? () => removeAt(slot.index) : undefined}
          />
        {/if}
      </li>
    {/each}
  </ol>
  {#if nextEl !== undefined && (nextEl.optional === true || nextEl.repeatable === true)}
    <button
      type="button"
      class="chip"
      data-testid="{testid}-add-element"
      onclick={() => (value = [...arr, skeleton(nextEl.schema)])}
    >
      + {format(t.message.addElement, { name: nextEl.name })}
    </button>
  {/if}
  {#if part.replies !== undefined && part.replies.length > 0}
    <p class="replies">
      {t.message.replies}:
      {#each part.replies as r, i (r)}
        {#if i > 0}
          ,
        {/if}
        <code>{r}</code>
      {/each}
    </p>
  {/if}
  {#if hasNipText(nip, part.explain)}
    <p class="help">{text(part.explain)}</p>
  {/if}
</div>

<style>
  .form {
    display: grid;
    gap: var(--space-md);
    min-inline-size: 0;
  }
  .head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-sm);
  }
  .type {
    padding: var(--space-3xs) var(--space-sm);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-sm);
    background: var(--color-secondary);
    color: var(--color-on-secondary);
    font-family: var(--font-family-mono);
    font-weight: var(--font-weight-bold);
    box-shadow: var(--shadow-pop-sm);
  }
  .dir,
  .help,
  .replies {
    margin: 0;
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
  }
  .elements {
    display: grid;
    gap: var(--space-sm);
    margin: 0;
    padding-inline-start: var(--space-lg);
  }
  .elements > li::marker {
    font-family: var(--font-family-mono);
    color: var(--color-text-subtle);
  }
  .chip {
    justify-self: start;
    min-block-size: var(--size-control-sm);
    padding: 0 var(--space-sm);
    border: var(--border-width-thin) solid var(--color-border-strong);
    border-radius: var(--radius-pill);
    background: var(--color-surface);
    color: var(--color-text);
    font-family: var(--font-family-mono);
    font-size: var(--font-size-sm);
    cursor: pointer;
    box-shadow: var(--shadow-pressed);
  }
  .chip:active {
    translate: var(--size-lift) var(--size-lift);
  }
  .chip:focus-visible {
    outline: var(--border-width-thick) solid var(--color-focus-ring);
    outline-offset: var(--size-focus-offset);
  }
  @media (pointer: coarse) {
    .chip {
      min-block-size: var(--size-touch-target);
    }
  }
</style>
