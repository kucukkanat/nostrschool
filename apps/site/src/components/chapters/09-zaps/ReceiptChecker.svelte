<script lang="ts">
  import { getPersona, type ZapFixture, zaps } from "@nostrschool/fixtures";
  import { format, getDictionary, type Locale } from "@nostrschool/i18n";
  import { Callout, emit, JsonView, pop, shake } from "@nostrschool/ui";
  import {
    allPassed,
    checkReceipt,
    forgeReceipt,
    SCENARIOS,
    type Scenario,
    walletFor,
  } from "./zap-logic.ts";

  // `zapList` is a prop only so tests can drive the failure states with real (broken) data.
  const {
    locale,
    zapList = zaps(),
  }: { readonly locale: Locale; readonly zapList?: readonly ZapFixture[] } = $props();
  const t = $derived(getDictionary(locale).chapters.ch09.checker);

  // The first fixture zap (Alice → Erin) is the one the chapter narrative follows.
  // svelte-ignore state_referenced_locally -- the zap is fixed for the component's lifetime.
  const zap = zapList[0];
  const wallet = zap === undefined ? undefined : walletFor(getPersona(zap.recipient).lud16);

  let scenario = $state<Scenario>("honest");
  let verdictEl: HTMLElement | undefined = $state();

  const receipt = $derived(
    zap === undefined || wallet === undefined || !wallet.ok
      ? undefined
      : forgeReceipt(zap, scenario, wallet.value.secretKey),
  );
  const checks = $derived(
    receipt?.ok === true && wallet?.ok === true
      ? checkReceipt(receipt.value, wallet.value.pubkey)
      : [],
  );
  const valid = $derived(checks.length > 0 && allPassed(checks));
  const narration = $derived(
    format(t.narration, {
      scenario: t.scenarios[scenario].label,
      passed: checks.filter((c) => c.passed).length,
      total: checks.length,
      verdict: valid ? t.verdictValid : t.verdictInvalid,
    }),
  );

  const choose = (next: Scenario): void => {
    scenario = next;
    // Deriveds recompute on read, so these already reflect `next`.
    if (receipt?.ok !== true) return;
    if (valid) emit("signature:valid", { eventId: receipt.value.id });
    else {
      emit("signature:invalid", { reason: next });
      // Wait for the keyed verdict to re-render before shaking the new element.
      queueMicrotask(() => verdictEl !== undefined && shake(verdictEl));
    }
  };
</script>

<section class="checker" data-testid="ch09-checker" aria-labelledby="ch09-checker-title">
  <h3 id="ch09-checker-title" class="title">{t.title}</h3>
  <p class="desc">{t.description}</p>

  <fieldset class="scenarios" data-testid="ch09-checker-scenarios">
    <legend>{t.scenarioLabel}</legend>
    <div class="chips">
      {#each SCENARIOS as s (s)}
        <label class="chip" class:active={s === scenario} data-testid="ch09-checker-scenario-{s}">
          <input
            type="radio"
            name="ch09-scenario"
            value={s}
            checked={s === scenario}
            onchange={() => choose(s)}
            data-testid="ch09-checker-scenario-{s}-input"
          >
          {t.scenarios[s].label}
        </label>
      {/each}
    </div>
    <p class="scenario-body" data-testid="ch09-checker-scenario-body">
      {t.scenarios[scenario].body}
    </p>
  </fieldset>

  {#if receipt === undefined || !receipt.ok}
    <Callout testid="ch09-checker-error" {locale} tone="danger">
      {receipt?.ok === false ? receipt.error.message : t.title}
    </Callout>
  {:else}
    <div class="grid">
      <div class="checks-col">
        <h4 class="sub">{t.checksTitle}</h4>
        <ul class="checks" data-testid="ch09-checker-checks">
          {#each checks as c, i (`${scenario}-${c.id}`)}
            <li
              class="check"
              class:pass={c.passed}
              data-testid="ch09-checker-check-{c.id}"
              data-passed={c.passed}
              style:--i={i}
            >
              <span class="mark" aria-hidden="true">{c.passed ? "✓" : "✗"}</span>
              <span>{t.checks[c.id]}</span>
              <span class="visually-hidden">— {c.passed ? t.passed : t.failed}</span>
            </li>
          {/each}
        </ul>
        {#key scenario}
          <div
            class="verdict"
            class:valid
            data-testid="ch09-checker-verdict"
            data-valid={valid}
            bind:this={verdictEl}
            use:pop
          >
            <strong>{valid ? t.verdictValid : t.verdictInvalid}</strong>
            <span>{valid ? t.verdictValidNote : t.verdictInvalidNote}</span>
          </div>
        {/key}
        {#if scenario === "liar"}
          <Callout testid="ch09-checker-liar" {locale} tone="warning">{t.liarNote}</Callout>
        {/if}
      </div>
      <div class="receipt-col">
        <h4 class="sub">{t.receiptLabel}</h4>
        <div class="receipt">
          <JsonView
            testid="ch09-checker-receipt"
            {locale}
            value={receipt.value}
            highlightPaths={["pubkey", "sig"]}
            collapsedDepth={2}
          />
        </div>
      </div>
    </div>
  {/if}
  <p class="visually-hidden" aria-live="polite" data-testid="ch09-checker-narration">{narration}</p>
</section>

<style>
  .checker {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
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
  .desc,
  .scenario-body {
    margin: 0;
    color: var(--color-text-muted);
  }
  .scenarios {
    margin: 0;
    padding: 0;
    border: none;
    min-width: 0;
  }
  legend,
  .sub {
    margin: 0 0 var(--space-xs);
    font-family: var(--font-family-display);
    font-weight: var(--font-weight-bold);
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-xs);
    margin-bottom: var(--space-xs);
  }
  .chip {
    position: relative;
    display: inline-flex;
    align-items: center;
    min-height: var(--size-touch-target);
    padding: var(--space-2xs) var(--space-md);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-pill);
    background: var(--color-surface);
    color: var(--color-text);
    font-weight: var(--font-weight-semibold);
    cursor: pointer;
    transition: transform var(--motion-duration-fast) var(--motion-easing-bounce);
  }
  .chip:hover {
    transform: translateY(calc(-1 * var(--space-3xs)));
  }
  .chip.active {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: var(--color-on-primary);
    box-shadow: var(--shadow-pop-sm);
  }
  .chip:has(input:focus-visible) {
    outline: var(--border-width-thick) solid var(--color-focus-ring);
    outline-offset: var(--space-3xs);
  }
  .chip input {
    position: absolute;
    opacity: 0;
    width: 1px;
    height: 1px;
  }
  .grid {
    display: grid;
    gap: var(--space-md);
    grid-template-columns: minmax(0, 1fr);
  }
  /* md breakpoint (tokens.breakpoint.md = 768px): checks and receipt side by side. */
  @media (min-width: 768px) {
    .grid {
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    }
  }
  .checks {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-2xs);
  }
  .check {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    padding: var(--space-2xs) var(--space-sm);
    border-radius: var(--radius-md);
    background: var(--color-danger-subtle);
    color: var(--color-text);
    /* Staggered reveal: each row lands a beat after the previous one. */
    animation: land var(--motion-duration-normal) var(--motion-easing-bounce) both;
    animation-delay: calc(var(--i) * var(--motion-duration-fast));
  }
  .check.pass {
    background: var(--color-success-subtle);
  }
  .mark {
    display: inline-grid;
    place-items: center;
    width: var(--size-icon-md);
    height: var(--size-icon-md);
    border-radius: var(--radius-round);
    background: var(--color-danger);
    color: var(--color-on-danger);
    font-weight: var(--font-weight-black);
    flex: none;
  }
  .check.pass .mark {
    background: var(--color-success-solid);
    color: var(--color-on-success);
  }
  @keyframes land {
    from {
      opacity: 0;
      transform: translateX(calc(-1 * var(--space-sm)));
    }
  }
  .verdict {
    display: flex;
    flex-direction: column;
    gap: var(--space-3xs);
    margin-top: var(--space-sm);
    padding: var(--space-sm);
    border: var(--border-width-thick) solid var(--color-danger);
    border-radius: var(--radius-md);
    background: var(--color-danger-subtle);
  }
  .verdict.valid {
    border-color: var(--color-success-solid);
    background: var(--color-success-subtle);
  }
  .receipt {
    overflow-x: auto;
    min-width: 0;
  }
</style>
