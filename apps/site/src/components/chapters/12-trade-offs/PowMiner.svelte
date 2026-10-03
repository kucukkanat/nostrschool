<script lang="ts">
  /** NIP-13 miner: real SHA-256 in the browser, chunked so the page stays responsive. */
  import { StatTile } from "@nostrschool/charts";
  import { format, formatNumber, getDictionary, type Locale } from "@nostrschool/i18n";
  import { type NostrEvent, signEvent } from "@nostrschool/protocol";
  import { Button, emit, JsonView, pop } from "@nostrschool/ui";
  import { onDestroy, untrack } from "svelte";
  import {
    type Attempt,
    DEFAULT_DIFFICULTY,
    DEFAULT_RATE,
    expectedAttempts,
    humanizeSeconds,
    MAX_DIFFICULTY,
    MIN_DIFFICULTY,
    mineChunk,
    POW_AUTHOR,
    powEvent,
    type Span,
    spamSeconds,
    splitZeroPrefix,
  } from "./pow.ts";

  interface Props {
    readonly locale: Locale;
    /** Nonces tried between repaints. */
    readonly chunkSize?: number;
  }
  const { locale, chunkSize = 1500 }: Props = $props();
  const t = $derived(getDictionary(locale).chapters.ch12.pow);

  type Status = "idle" | "mining" | "found" | "stopped";
  const SPAM_NOTES = 10_000;

  // Seeded once; afterwards the learner owns the text.
  let content = $state(untrack(() => t.defaultContent));
  let difficulty = $state(DEFAULT_DIFFICULTY);
  let status = $state<Status>("idle");
  let attempts = $state(0);
  let last = $state.raw<Attempt | undefined>();
  let best = $state.raw<Attempt | undefined>();
  let rate = $state(DEFAULT_RATE);
  let signed = $state.raw<NostrEvent | undefined>();
  let signError = $state("");
  // Bumping the run id cancels an in-flight loop at its next chunk boundary.
  let runId = 0;

  const num = (n: number) => formatNumber(locale, n);
  const spanText = (s: Span) => format(t.units[s.unit], { value: num(s.value) });

  const finish = (found: Attempt) => {
    status = "found";
    const result = signEvent(powEvent(content, found.nonce, difficulty), POW_AUTHOR.secretKey, {
      auxRand: new Uint8Array(32),
    });
    if (!result.ok) {
      signError = result.error.message;
      return;
    }
    signed = result.value.event;
    emit("celebrate", { reason: "ch12-pow" });
  };

  const mine = async () => {
    runId += 1;
    const id = runId;
    status = "mining";
    attempts = 0;
    last = undefined;
    best = undefined;
    signed = undefined;
    signError = "";
    let nonce = 0;
    const started = performance.now();
    while (id === runId) {
      const p = mineChunk(content, difficulty, nonce, chunkSize, best);
      attempts += p.nextNonce - nonce;
      nonce = p.nextNonce;
      last = p.last;
      best = p.best;
      const seconds = (performance.now() - started) / 1000;
      if (seconds > 0) rate = Math.round(attempts / seconds);
      if (p.found !== undefined) return finish(p.found);
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  };

  const stop = () => {
    runId += 1;
    if (status === "mining") status = "stopped";
  };

  const reset = () => {
    stop();
    status = "idle";
    attempts = 0;
    last = undefined;
    best = undefined;
    signed = undefined;
    signError = "";
  };

  onDestroy(() => {
    runId += 1;
  });

  const narration = $derived.by(() => {
    if (status === "mining")
      return format(t.mining, { attempts: num(attempts), bits: best?.bits ?? 0 });
    if (status === "found")
      return format(t.found, {
        attempts: num(attempts),
        nonce: best?.nonce ?? 0,
        bits: best?.bits ?? 0,
      });
    if (status === "stopped") return format(t.stopped, { attempts: num(attempts) });
    return t.idle;
  });

  const spam = $derived(
    format(t.spamBody, {
      rate: num(rate),
      one: spanText(humanizeSeconds(spamSeconds(difficulty, 1, rate))),
      count: num(SPAM_NOTES),
      total: spanText(humanizeSeconds(spamSeconds(difficulty, SPAM_NOTES, rate))),
    }),
  );
</script>

{#snippet hexId(
  id: string,
  testid: string,
)}
  {@const parts = splitZeroPrefix(id)}
  <code class="hex" data-testid={testid}><mark class="zeros">{parts.zeros}</mark>{parts.rest}</code>
{/snippet}

<section class="pow" data-testid="ch12-pow" data-status={status} aria-labelledby="ch12-pow-title">
  <header>
    <h3 id="ch12-pow-title" class="title">{t.title}</h3>
    <p class="intro">{t.intro}</p>
  </header>

  <div class="inputs">
    <label class="field">
      <span class="label">{t.contentLabel}</span>
      <input
        class="text"
        type="text"
        bind:value={content}
        oninput={reset}
        disabled={status === "mining"}
        data-testid="ch12-pow-content"
      >
    </label>
    <label class="field">
      <span class="label">{t.difficultyLabel}</span>
      <input
        class="range"
        type="range"
        min={MIN_DIFFICULTY}
        max={MAX_DIFFICULTY}
        step="1"
        bind:value={difficulty}
        oninput={reset}
        disabled={status === "mining"}
        aria-valuetext={format(t.difficultyValue, {
          bits: difficulty,
          attempts: num(expectedAttempts(difficulty)),
        })}
        data-testid="ch12-pow-difficulty"
      >
      <span class="value" data-testid="ch12-pow-difficulty-value">
        {format(t.difficultyValue, {
          bits: difficulty,
          attempts: num(expectedAttempts(difficulty)),
        })}
      </span>
    </label>
  </div>

  <div class="actions">
    {#if status === "mining"}
      <Button testid="ch12-pow-stop" variant="secondary" onclick={stop}>{t.stop}</Button>
    {:else}
      <Button testid="ch12-pow-mine" onclick={mine}>{t.mine}</Button>
    {/if}
    <Button testid="ch12-pow-reset" variant="ghost" onclick={reset} disabled={status === "idle"}>
      {t.reset}
    </Button>
  </div>

  <div class="stats">
    <StatTile testid="ch12-pow-attempts" {locale} label={t.attempts} value={attempts} />
    <StatTile
      testid="ch12-pow-best"
      {locale}
      label={t.bestBits}
      value={format(t.bitsValue, { bits: best?.bits ?? 0 })}
    />
    <StatTile testid="ch12-pow-rate" {locale} label={t.rate} value={rate} />
  </div>

  <div class="ids">
    <p class="id-row">
      <span class="label">{t.currentId}</span>
      {@render hexId(last?.id ?? "".padEnd(64, "·"), "ch12-pow-current")}
    </p>
    <p class="id-row">
      <span class="label">{t.bestId} · {t.nonce} {best?.nonce ?? "–"}</span>
      {@render hexId(best?.id ?? "".padEnd(64, "·"), "ch12-pow-best-id")}
    </p>
    <p class="hint">{t.zeroBitsHint}</p>
  </div>

  <p
    class="status"
    class:found={status === "found"}
    aria-live="polite"
    data-testid="ch12-pow-status"
  >
    {narration}
  </p>
  {#if signError !== ""}
    <p class="error" role="alert" data-testid="ch12-pow-error">{signError}</p>
  {/if}

  {#if signed !== undefined}
    <div class="signed" data-testid="ch12-pow-signed" use:pop={{ spring: "wobbly" }}>
      <h4 class="subtitle">{t.signedTitle}</h4>
      <JsonView
        testid="ch12-pow-json"
        {locale}
        value={signed}
        highlightPaths={["id", "tags.0.1"]}
      />
    </div>
  {/if}

  <aside class="spam" data-testid="ch12-pow-spam">
    <h4 class="subtitle">{t.spamTitle}</h4>
    <p>{spam}</p>
    <p class="caveat">{t.caveat}</p>
  </aside>
</section>

<style>
  .pow {
    display: grid;
    gap: var(--space-md);
    padding: var(--space-lg);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-xl);
    background: var(--color-surface);
    box-shadow: var(--shadow-pop);
    min-height: var(--size-diagram-min-height);
  }
  .title {
    margin: 0;
    font-family: var(--font-family-display);
    font-size: var(--font-size-xl);
  }
  .intro,
  .hint,
  .caveat {
    margin: var(--space-2xs) 0 0;
    color: var(--color-text-muted);
  }
  .inputs {
    display: grid;
    gap: var(--space-md);
  }
  .field {
    display: grid;
    gap: var(--space-2xs);
  }
  .label {
    font-weight: var(--font-weight-semibold);
    font-size: var(--font-size-sm);
  }
  .text {
    min-block-size: var(--size-control-md);
    padding: 0 var(--space-sm);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-md);
    background: var(--color-surface-raised);
    color: var(--color-text);
    font: inherit;
  }
  .range {
    accent-color: var(--color-primary);
    min-block-size: var(--size-touch-target);
  }
  .text:focus-visible,
  .range:focus-visible {
    outline: var(--border-width-thick) solid var(--color-focus-ring);
    outline-offset: var(--space-3xs);
  }
  .value {
    font-family: var(--font-family-mono);
    font-size: var(--font-size-sm);
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-sm);
  }
  .stats {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--space-sm);
  }
  .ids {
    display: grid;
    gap: var(--space-xs);
  }
  .id-row {
    display: grid;
    gap: var(--space-3xs);
    margin: 0;
  }
  .hex {
    display: block;
    padding: var(--space-xs) var(--space-sm);
    border-radius: var(--radius-md);
    background: var(--color-code-bg);
    color: var(--color-code-text);
    font-family: var(--font-family-mono);
    font-size: var(--font-size-sm);
    overflow-wrap: anywhere;
  }
  .zeros {
    background: var(--color-success-subtle);
    color: var(--color-success);
    border-radius: var(--radius-sm);
  }
  .status {
    margin: 0;
    font-weight: var(--font-weight-bold);
  }
  .status.found {
    color: var(--color-success);
  }
  .error {
    margin: 0;
    color: var(--color-danger);
  }
  .subtitle {
    margin: 0 0 var(--space-xs);
    font-size: var(--font-size-md);
  }
  .signed {
    padding: var(--space-md);
    border: var(--border-width-medium) solid var(--color-success);
    border-radius: var(--radius-lg);
    background: var(--color-success-subtle);
  }
  .spam {
    padding: var(--space-md);
    border-radius: var(--radius-lg);
    background: var(--color-surface-sunken);
  }
  .spam p {
    margin: 0;
  }
  /* tokens.breakpoint.md = 768px */
  @media (min-width: 768px) {
    .inputs {
      grid-template-columns: 1fr 1fr;
    }
  }
</style>
