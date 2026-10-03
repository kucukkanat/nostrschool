<script lang="ts">
  import { format, getDictionary, type Locale } from "@nostrschool/i18n";
  import { type NostrEvent, signEvent } from "@nostrschool/protocol";
  import { Button, emit, pop } from "@nostrschool/ui";
  import { stampStillValid } from "./keys-logic.ts";
  import { $demoKeypair as demoKeypair } from "./store.ts";

  const { locale }: { readonly locale: Locale } = $props();
  const t = $derived(getDictionary(locale).chapters.ch02.stamp);

  // Undefined until the learner types, so the default follows the locale.
  let edited = $state<string>();
  const message = $derived(edited ?? t.defaultMessage);
  let signed = $state<NostrEvent>();
  let error = $state("");
  const valid = $derived(signed === undefined ? undefined : stampStillValid(signed, message));
  const status = $derived(valid === undefined ? "unsigned" : valid ? "valid" : "invalid");

  // Tell the mascot only on transitions, not on every keystroke.
  let last = $state<boolean | undefined>(undefined);
  $effect(() => {
    if (valid === undefined || valid === last) return;
    last = valid;
    if (valid) emit("signature:valid", { eventId: signed?.id ?? "" });
    else emit("signature:invalid", { reason: "content-edited" });
  });

  const sign = () => {
    // A real kind-1 note: Nostr signs the event id (sha256 of the serialized event), not raw text.
    const result = signEvent(
      { kind: 1, created_at: Math.floor(Date.now() / 1000), tags: [], content: message },
      $demoKeypair.secretKey,
    );
    if (result.ok) {
      signed = result.value.event;
      error = "";
    } else error = format(t.signFailed, { message: result.error.message });
  };
</script>

<section
  class="stamp"
  data-testid="ch02-stamp"
  data-state={status}
  aria-labelledby="ch02-stamp-title"
>
  <h3 id="ch02-stamp-title" class="title">{t.title}</h3>
  <p class="desc">{t.description}</p>
  <label class="field">
    <span>{t.messageLabel}</span>
    <textarea
      rows="2"
      value={message}
      oninput={(e) => (edited = e.currentTarget.value)}
      data-testid="ch02-stamp-message"
    ></textarea>
  </label>
  <div class="row">
    <Button testid="ch02-stamp-sign" onclick={sign}>{t.sign}</Button>
  </div>
  {#if signed !== undefined}
    {#key signed.sig}
      <div class="sig" use:pop>
        <span class="label">{t.signatureLabel}</span>
        <code data-testid="ch02-stamp-sig">{signed.sig}</code>
      </div>
    {/key}
  {/if}
  {#if error !== ""}
    <p class="error" role="alert" data-testid="ch02-stamp-error">{error}</p>
  {/if}
  {#key status}
    <p
      class="verdict {status}"
      aria-live="polite"
      data-testid="ch02-stamp-verdict"
      use:pop={{ spring: "wobbly" }}
    >
      <span aria-hidden="true">{status === "valid" ? "✓" : status === "invalid" ? "✗" : "…"}</span>
      {status === "valid" ? t.valid : status === "invalid" ? t.invalid : t.unsigned}
    </p>
  {/key}
</section>

<style>
  .stamp {
    display: grid;
    gap: var(--space-sm);
    padding: var(--space-lg);
    border: var(--border-width-thick) solid var(--color-border-strong);
    border-radius: var(--radius-xl);
    background: var(--color-surface-raised);
    box-shadow: var(--shadow-pop-sm);
  }
  .title {
    margin: 0;
    font-family: var(--font-family-display);
    font-size: var(--font-size-xl);
    color: var(--color-text-primary);
  }
  .desc {
    margin: 0;
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
  }
  .field {
    display: grid;
    gap: var(--space-2xs);
    font-family: var(--font-family-display);
    color: var(--color-text);
  }
  textarea {
    padding: var(--space-sm);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-md);
    background: var(--color-surface);
    color: var(--color-text);
    font-family: var(--font-family-body);
    font-size: var(--font-size-md);
    resize: vertical;
  }
  textarea:focus-visible {
    outline: var(--border-width-thick) solid var(--color-focus-ring);
    outline-offset: var(--space-3xs);
  }
  .sig {
    display: grid;
    gap: var(--space-3xs);
  }
  .label {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
  }
  code {
    font-family: var(--font-family-mono);
    font-size: var(--font-size-xs);
    word-break: break-all;
    color: var(--color-text);
  }
  .verdict {
    margin: 0;
    padding: var(--space-xs) var(--space-sm);
    border-radius: var(--radius-md);
    font-weight: var(--font-weight-semibold);
    background: var(--color-surface-sunken);
    color: var(--color-text);
  }
  .verdict.valid {
    background: var(--color-success-subtle);
    border-inline-start: var(--border-width-heavy) solid var(--color-success-solid);
  }
  .verdict.invalid {
    background: var(--color-danger-subtle);
    border-inline-start: var(--border-width-heavy) solid var(--color-danger-solid);
  }
  .error {
    margin: 0;
    color: var(--color-danger);
  }
</style>
