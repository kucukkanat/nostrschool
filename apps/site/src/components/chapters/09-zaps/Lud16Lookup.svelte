<script lang="ts">
  import { PERSONAS } from "@nostrschool/fixtures";
  import { getDictionary, type Locale } from "@nostrschool/i18n";
  import { pop } from "@nostrschool/ui";
  import { parseLud16 } from "./zap-logic.ts";

  const { locale }: { readonly locale: Locale } = $props();
  const t = $derived(getDictionary(locale).chapters.ch09.lookup);
  const uid = $props.id();

  // Starts on Erin, the zap recipient the chapter follows.
  let value = $state(PERSONAS.find((p) => p.id === "erin")?.lud16 ?? "");
  const parsed = $derived(parseLud16(value));
</script>

<section class="lookup" data-testid="ch09-lookup" aria-labelledby="{uid}-title">
  <h3 id="{uid}-title" class="title">{t.title}</h3>
  <p class="desc">{t.description}</p>
  <label class="field" for="{uid}-input">{t.inputLabel}</label>
  <input
    id="{uid}-input"
    class="input"
    type="text"
    autocomplete="off"
    spellcheck="false"
    placeholder={t.placeholder}
    bind:value
    aria-invalid={!parsed.ok}
    aria-describedby="{uid}-out"
    data-testid="ch09-lookup-input"
  >
  <div class="examples">
    <span class="examples-label">{t.examplesLabel}</span>
    {#each PERSONAS.slice(0, 4) as p (p.id)}
      <button
        type="button"
        class="example"
        onclick={() => (value = p.lud16)}
        data-testid="ch09-lookup-example-{p.id}"
      >
        <img src={p.avatar} alt="" class="avatar">{p.lud16}
      </button>
    {/each}
  </div>
  <div id="{uid}-out" class="out" aria-live="polite" data-testid="ch09-lookup-output">
    {#if parsed.ok}
      <span class="out-label">{t.urlLabel}</span>
      <code class="url" data-testid="ch09-lookup-url">
        https://<mark class="part domain">{parsed.value.domain}</mark>/.well-known/lnurlp/<mark
          class="part name"
          >{parsed.value.name}</mark
        >
      </code>
    {:else}
      {#key parsed.error.code}
        <p class="error" data-testid="ch09-lookup-error" data-code={parsed.error.code} use:pop>
          {t.errors[parsed.error.code]}
        </p>
      {/key}
    {/if}
  </div>
</section>

<style>
  .lookup {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
    margin: var(--space-lg) 0;
    padding: var(--space-md);
    border: var(--border-width-medium) solid var(--color-border);
    border-radius: var(--radius-lg);
    background: var(--color-surface);
    box-shadow: var(--shadow-pop-sm);
    min-width: 0;
  }
  .title {
    margin: 0;
    font-family: var(--font-family-display);
    font-size: var(--font-size-lg);
  }
  .desc {
    margin: 0;
    color: var(--color-text-muted);
  }
  .field {
    font-weight: var(--font-weight-semibold);
  }
  .input {
    min-height: var(--size-touch-target);
    padding: var(--space-xs) var(--space-sm);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-md);
    background: var(--color-surface-sunken);
    color: var(--color-text);
    font-family: var(--font-family-mono);
    font-size: var(--font-size-md);
    min-width: 0;
  }
  .input:focus-visible {
    outline: var(--border-width-thick) solid var(--color-focus-ring);
    outline-offset: var(--space-3xs);
  }
  .input[aria-invalid="true"] {
    border-color: var(--color-danger);
  }
  .examples {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2xs);
  }
  .examples-label {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
  }
  .example {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2xs);
    min-height: var(--size-touch-target);
    padding: var(--space-3xs) var(--space-sm);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-md);
    background: var(--color-surface);
    color: var(--color-text);
    font-family: var(--font-family-mono);
    font-size: var(--font-size-xs);
    cursor: pointer;
    box-shadow: var(--shadow-pop-sm);
    transition:
      translate var(--motion-duration-press) var(--motion-easing-press),
      box-shadow var(--motion-duration-press) var(--motion-easing-press),
      background-color var(--motion-duration-fast) var(--motion-easing-standard);
  }
  .example:hover {
    translate: calc(var(--size-lift) * -1) calc(var(--size-lift) * -1);
    box-shadow: var(--shadow-lift);
  }
  .example:active {
    translate: var(--size-lift) var(--size-lift);
    box-shadow: var(--shadow-pressed);
  }
  .example:focus-visible {
    outline: var(--border-width-thick) solid var(--color-focus-ring);
    outline-offset: var(--space-3xs);
  }
  .avatar {
    width: var(--size-icon-md);
    height: var(--size-icon-md);
    border-radius: var(--radius-round);
  }
  .out {
    display: flex;
    flex-direction: column;
    gap: var(--space-3xs);
    min-height: calc(var(--size-touch-target) * 1.5);
  }
  .out-label {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
  }
  .url {
    overflow-wrap: anywhere;
    padding: var(--space-xs) var(--space-sm);
    border-radius: var(--radius-md);
    background: var(--color-code-bg);
    color: var(--color-code-text);
    font-family: var(--font-family-mono);
    font-size: var(--font-size-sm);
  }
  .part {
    padding: 0 var(--space-3xs);
    border-radius: var(--radius-sm);
    color: var(--color-text);
  }
  .domain {
    background: var(--color-secondary-subtle);
  }
  .name {
    background: var(--color-primary-subtle);
  }
  .error {
    margin: 0;
    color: var(--color-text);
    padding: var(--space-xs) var(--space-sm);
    border-left: var(--border-width-heavy) solid var(--color-danger);
    background: var(--color-danger-subtle);
    border-radius: var(--radius-sm);
  }
</style>
