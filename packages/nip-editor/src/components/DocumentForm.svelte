<script lang="ts">
  import type { JsonPath, JsonValue } from "@nostrschool/nips";
  import { setIn } from "../logic/immutable.ts";
  import { editorStrings, hasNipText, nipText } from "../logic/text.ts";
  import type { DocumentFormProps } from "../types.ts";
  import SchemaField from "./SchemaField.svelte";

  let {
    testid,
    locale,
    nip,
    part,
    value = $bindable(),
    issues,
    onselectpath,
  }: DocumentFormProps = $props();
  const t = $derived(editorStrings(locale));
  const text = $derived(nipText(locale, nip));
  const change = (path: JsonPath, v: JsonValue) => {
    value = setIn(value, path, v);
  };
</script>

<div class="form" data-testid={testid}>
  <dl class="where">
    <dt>{t.document.url}</dt>
    <dd><code data-testid="{testid}-url">{part.urlTemplate}</code></dd>
    <dt>{t.document.mediaType}</dt>
    <dd><code>{part.mediaType}</code></dd>
    {#if part.requestHeaders !== undefined && part.requestHeaders.length > 0}
      <dt>{t.document.requestHeaders}</dt>
      <dd>
        {#each part.requestHeaders as h, i (h.name)}
          {#if i > 0}
            ,
          {/if}
          <code>{h.name}</code>
        {/each}
      </dd>
    {/if}
  </dl>
  {#if hasNipText(nip, part.explain)}
    <p class="help">{text(part.explain)}</p>
  {/if}
  <SchemaField
    {testid}
    {locale}
    {nip}
    schema={part.schema}
    {value}
    path={[]}
    label={text(part.label)}
    {issues}
    onchange={change}
    {onselectpath}
  />
</div>

<style>
  .form {
    display: grid;
    gap: var(--space-md);
    min-inline-size: 0;
  }
  .where {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: var(--space-3xs) var(--space-sm);
    margin: 0;
    padding: var(--space-sm);
    border: var(--border-width-thin) solid var(--color-border-strong);
    border-radius: var(--radius-sm);
    background: var(--color-surface-sunken);
    font-size: var(--font-size-sm);
  }
  dt {
    color: var(--color-text-muted);
    font-weight: var(--font-weight-semibold);
  }
  dd {
    margin: 0;
    min-inline-size: 0;
    overflow-wrap: anywhere;
  }
  code {
    font-family: var(--font-family-mono);
  }
  .help {
    margin: 0;
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
  }
</style>
