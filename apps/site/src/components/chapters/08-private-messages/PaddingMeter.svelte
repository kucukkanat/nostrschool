<script lang="ts">
  import { format, getDictionary, type Locale } from "@nostrschool/i18n";
  import { byteLength, MAX_MESSAGE_LENGTH, nip44Bucket, paddingRow } from "./logic.ts";

  const { locale }: { readonly locale: Locale } = $props();
  const t = $derived(getDictionary(locale).chapters.ch08.padding);
  // svelte-ignore state_referenced_locally
  let message = $state(getDictionary(locale).chapters.ch08.padding.defaultMessage);

  const row = $derived(paddingRow(byteLength(message)));
  const bucket = $derived(nip44Bucket(row.bytes));
  const bars = $derived([
    { id: "real", label: t.real, value: row.bytes },
    { id: "nip04", label: t.nip04, value: row.nip04 },
    { id: "nip44", label: t.nip44, value: row.nip44 },
  ] as const);
  const scale = $derived(Math.max(...bars.map((b) => b.value), 1));
</script>

<section class="meter" data-testid="ch08-padding" aria-labelledby="ch08-padding-title">
  <h3 id="ch08-padding-title" class="title">{t.title}</h3>
  <p class="muted">{t.description}</p>
  <label class="field">
    <span class="label">{t.inputLabel}</span>
    <input
      type="text"
      data-testid="ch08-padding-input"
      maxlength={MAX_MESSAGE_LENGTH}
      bind:value={message}
    >
  </label>

  <!-- The bars are a visual echo of the table below, which carries the same numbers for screen readers. -->
  <div class="bars" aria-hidden="true">
    {#each bars as b (b.id)}
      <div class="bar-row">
        <span class="bar-label">{b.label}</span>
        <span class="track">
          <span
            class="bar {b.id}"
            data-testid="ch08-padding-bar-{b.id}"
            style:inline-size="{(b.value / scale) * 100}%"
          ></span>
        </span>
        <span class="bar-value">{format(t.bytes, { count: b.value })}</span>
      </div>
    {/each}
  </div>

  <table class="table" data-testid="ch08-padding-table">
    <caption>
      {t.tableCaption}
    </caption>
    <thead>
      <tr>
        <th scope="col">{t.scheme}</th>
        <th scope="col">{t.size}</th>
      </tr>
    </thead>
    <tbody>
      {#each bars as b (b.id)}
        <tr>
          <th scope="row">{b.label}</th>
          <td data-testid="ch08-padding-value-{b.id}">{format(t.bytes, { count: b.value })}</td>
        </tr>
      {/each}
    </tbody>
  </table>

  <p class="bucket" aria-live="polite" data-testid="ch08-padding-bucket">
    {format(t.bucket, { min: bucket.min, max: bucket.max })}
  </p>
</section>

<style>
  .meter {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
    padding: var(--space-md);
    border: var(--border-width-medium) solid var(--color-border);
    border-radius: var(--radius-xl);
    background: var(--color-surface);
    color: var(--color-text);
    box-shadow: var(--shadow-md);
  }
  .title {
    margin: 0;
    font-family: var(--font-family-display);
    font-size: var(--font-size-lg);
  }
  .muted,
  .bucket {
    margin: 0;
  }
  .muted {
    color: var(--color-text-muted);
  }
  .bucket {
    font-weight: var(--font-weight-semibold);
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: var(--space-2xs);
  }
  .label {
    font-weight: var(--font-weight-bold);
  }
  input {
    min-height: var(--size-control-md);
    padding: var(--space-xs) var(--space-sm);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-md);
    background: var(--color-surface-raised);
    color: var(--color-text);
    font: inherit;
  }
  input:focus-visible {
    outline: var(--border-width-thick) solid var(--color-focus-ring);
    outline-offset: var(--space-3xs);
  }
  .bars {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }
  .bar-row {
    display: grid;
    grid-template-columns: minmax(0, 2fr) minmax(0, 3fr) auto;
    align-items: center;
    gap: var(--space-xs);
    font-size: var(--font-size-sm);
  }
  .track {
    block-size: var(--space-md);
    border-radius: var(--radius-pill);
    background: var(--color-surface-sunken);
    overflow: hidden;
  }
  .bar {
    display: block;
    block-size: 100%;
    border-radius: var(--radius-pill);
    transition: inline-size var(--motion-duration-normal) var(--motion-easing-bounce);
  }
  .bar.real {
    background: var(--color-primary);
  }
  .bar.nip04 {
    background: var(--color-danger);
  }
  .bar.nip44 {
    background: var(--color-success);
  }
  .bar-value {
    font-family: var(--font-family-mono);
  }
  .table {
    border-collapse: collapse;
    font-size: var(--font-size-sm);
  }
  .table caption {
    text-align: start;
    color: var(--color-text-muted);
    padding-block-end: var(--space-2xs);
  }
  .table th,
  .table td {
    padding: var(--space-3xs) var(--space-sm);
    border-block-end: var(--border-width-thin) solid var(--color-border);
    text-align: start;
  }
</style>
