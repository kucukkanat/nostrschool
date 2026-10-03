<script lang="ts">
  import { format, getDictionary, type Locale } from "@nostrschool/i18n";
  import { BECH32_CHARSET, generateKeypair, type Keypair } from "@nostrschool/protocol";
  import { tokens } from "@nostrschool/tokens";
  import {
    Badge,
    Button,
    CopyButton,
    emit,
    PlaybackControls,
    pop,
    $reducedMotion as reducedMotion,
  } from "@nostrschool/ui";
  import {
    type EncodeTarget,
    encodeTrack,
    hexBytes,
    maskSecret,
    partialEncoding,
    sampleKeypair,
    wordWindow,
  } from "./keys-logic.ts";
  import { $demoKeypair as demoKeypair } from "./store.ts";

  const { locale, autoplay = true }: { readonly locale: Locale; readonly autoplay?: boolean } =
    $props();
  const t = $derived(getDictionary(locale).chapters.ch02.forge);

  const TARGETS: readonly EncodeTarget[] = ["npub", "nsec"];
  const initial = demoKeypair.get();
  let keypair = $state<Keypair>(initial);
  let isSample = $state(initial.secretKeyHex === sampleKeypair().secretKeyHex);
  let target = $state<EncodeTarget>("npub");
  let peek = $state(false);
  let step = $state(0);
  let playing = $state(false);
  let speed = $state(1);
  let announce = $state("");

  const track = $derived(encodeTrack(keypair, target));
  const frames = $derived(track.ok ? track.value.frames : []);
  const current = $derived(step > 0 ? frames[step - 1] : undefined);
  const done = $derived(frames.length > 0 && step >= frames.length);
  const payloadHex = $derived(target === "npub" ? keypair.publicKey : keypair.secretKeyHex);
  const win = $derived(
    track.ok && current !== undefined
      ? wordWindow(current, track.value.steps.dataBytes)
      : undefined,
  );
  // Secret material is masked unless the learner peeks; the nsec track only exists while peeking.
  const showSecret = $derived(peek || target === "nsec");

  const narration = $derived.by(() => {
    if (!track.ok) return track.error.message;
    if (done) return format(t.narrateDone, { target, encoded: track.value.steps.encoded });
    if (current === undefined) return format(t.narrateStart, { target });
    const params = {
      n: step,
      total: frames.length,
      bits: current.bits,
      value: current.value,
      char: current.char,
    };
    return format(current.checksum ? t.narrateChecksum : t.narrateWord, params);
  });

  // Autoplay owns the timer (PlaybackControls deliberately doesn't). Under reduced motion the
  // characters still appear one per tick; only the CSS pop/slide is dropped.
  $effect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      if (step >= frames.length) playing = false;
      else step += 1;
    }, tokens.motion.duration.normal / speed);
    return () => clearInterval(id);
  });

  let celebrated = $state("");
  $effect(() => {
    if (!done || !track.ok || celebrated === track.value.steps.encoded) return;
    celebrated = track.value.steps.encoded;
    emit("celebrate", { reason: `ch02-${target}-encoded` });
  });

  const restart = (play: boolean) => {
    step = 0;
    playing = play;
  };

  const generate = () => {
    keypair = generateKeypair();
    demoKeypair.set(keypair);
    isSample = false;
    peek = false;
    target = "npub";
    announce = t.generatedAnnounce;
    emit("keys:generated", { pubkey: keypair.publicKey });
    restart(autoplay);
  };

  const choose = (next: EncodeTarget) => {
    if (next === target) return;
    target = next;
    restart(false);
  };

  const inRange = (i: number): boolean =>
    current?.bytes !== undefined && i >= current.bytes[0] && i <= current.bytes[1];
</script>

<section class="forge" data-testid="ch02-forge" aria-labelledby="ch02-forge-title">
  <header class="head">
    <div>
      <h3 id="ch02-forge-title" class="title">{t.title}</h3>
      <p class="desc">{t.description}</p>
    </div>
    <Button testid="ch02-generate" onclick={generate}>{t.generate}</Button>
  </header>

  <div class="badge-row">
    {#if isSample}
      <Badge testid="ch02-sample-badge" tone="info">{t.sampleBadge}</Badge>
    {:else}
      <Badge testid="ch02-demo-badge" tone="warning">{t.demoBadge}</Badge>
    {/if}
  </div>

  {#key keypair.publicKey}
    <div class="keys" use:pop={{ spring: "bouncy", from: 0.96 }}>
      <div class="key secret" data-testid="ch02-secret">
        <div class="key-head">
          <span class="key-label">{t.secretLabel}</span>
          <button
            type="button"
            class="peek"
            data-testid="ch02-peek"
            aria-pressed={peek}
            aria-label={peek ? t.hideLabel : t.peekLabel}
            onclick={() => (peek = !peek)}
          >
            <span aria-hidden="true">{peek ? "🙈" : "👀"}</span>
            {peek ? t.hide : t.peek}
          </button>
        </div>
        <code class="hex" data-testid="ch02-secret-hex" data-masked={!showSecret}>
          {showSecret ? keypair.secretKeyHex : maskSecret(keypair.secretKeyHex)}
        </code>
        <p class="hint">{t.secretHint}</p>
      </div>

      <div class="arrow" role="img" aria-label={t.oneWayLabel} data-testid="ch02-one-way">
        <span class="arrow-glyph" aria-hidden="true">➜</span>
        <span class="arrow-text" aria-hidden="true">{t.oneWay}</span>
      </div>

      <div class="key public" data-testid="ch02-public">
        <span class="key-label">{t.publicLabel}</span>
        <code class="hex" data-testid="ch02-public-hex">{keypair.publicKey}</code>
        <p class="hint">{t.publicHint}</p>
      </div>
    </div>
  {/key}

  <div class="encoder" data-testid="ch02-encoder" data-target={target}>
    <h4 class="sub">{t.encodeHeading}</h4>
    <fieldset class="targets">
      <legend class="legend">{t.encodeTargetLabel}</legend>
      {#each TARGETS as option (option)}
        <button
          type="button"
          class="target"
          data-testid="ch02-target-{option}"
          aria-pressed={target === option}
          onclick={() => choose(option)}
        >
          {option === "npub" ? t.targetNpub : t.targetNsec}
        </button>
      {/each}
    </fieldset>
    {#if target === "nsec"}
      <p class="note" data-testid="ch02-nsec-note">{t.nsecCopyWarning}</p>
    {/if}

    <div class="stage">
      <h5 class="stage-title">{t.bytesHeading}</h5>
      <div class="bytes" data-testid="ch02-bytes">
        {#each hexBytes(payloadHex) as byte, i (i)}
          <span class="byte" class:active={inRange(i)} data-active={inRange(i)}>{byte}</span>
        {/each}
      </div>
    </div>

    <div class="stage">
      <h5 class="stage-title">{t.bitsHeading}</h5>
      <div class="bits" data-testid="ch02-bits">
        {#if win !== undefined && current !== undefined}
          {#key current.index}
            <span class="bitstrip" use:pop={{ spring: "snappy", from: 0.9 }}>
              {#each win.bits as bit, i (i)}
                <span
                  class="bit"
                  class:in-word={i >= win.start && i < win.start + 5}
                  class:pad={i >= win.bits.length - win.padding}
                  >{bit}</span
                >
              {/each}
            </span>
            <span class="word-value" data-testid="ch02-word-value">
              {format(t.wordValue, {
                bits: current.bits,
                value: current.value,
                char: current.char,
              })}
            </span>
          {/key}
        {:else if current !== undefined}
          <span class="word-value checksum-tag" data-testid="ch02-word-value">
            {t.checksumWord}:
            {format(t.wordValue, {
              bits: current.bits,
              value: current.value,
              char: current.char,
            })}
          </span>
        {:else}
          <span class="placeholder" aria-hidden="true">· · · · ·</span>
        {/if}
      </div>
    </div>

    <div class="stage">
      <h5 class="stage-title">{t.charsetHeading}</h5>
      <ol class="alphabet" aria-label={t.alphabetLabel} data-testid="ch02-alphabet">
        {#each BECH32_CHARSET as ch, i (i)}
          <li class="letter" class:hit={current?.value === i} data-hit={current?.value === i}>
            <span class="idx">{i}</span>
            <span class="ch">{ch}</span>
          </li>
        {/each}
      </ol>
    </div>

    <div class="stage">
      <h5 class="stage-title">{t.outputHeading}</h5>
      {#if track.ok}
        {@const encoded = partialEncoding(track.value.steps, step)}
        <output class="encoded" data-testid="ch02-encoded" data-done={done}>
          <span class="hrp">{track.value.steps.hrp}1</span>
          {#each frames.slice(0, step) as f (f.index)}
            <span
              class="out-char"
              class:checksum={f.checksum}
              class:fresh={f.index === step - 1 && !$reducedMotion}
              >{f.char}</span
            >
          {/each}
          <span class="caret" aria-hidden="true"></span>
        </output>
        <span class="visually-hidden" data-testid="ch02-encoded-text">{encoded}</span>
        <p class="hint">{t.checksumNote}</p>
      {/if}
    </div>

    <div class="controls">
      <PlaybackControls
        testid="ch02-playback"
        {locale}
        bind:step
        bind:playing
        bind:speed
        totalSteps={frames.length + 1}
      />
      <Button
        testid="ch02-skip"
        variant="ghost"
        size="sm"
        disabled={done}
        onclick={() => {
          playing = false;
          step = frames.length;
        }}
        >{t.skip}</Button
      >
      {#if done && target === "npub" && track.ok}
        <CopyButton
          testid="ch02-copy-npub"
          {locale}
          value={track.value.steps.encoded}
          label={t.copyNpub}
          confetti
        />
      {/if}
    </div>

    <p class="narration" aria-live="polite" data-testid="ch02-narration">{narration}</p>
  </div>
  <p class="visually-hidden" aria-live="polite" data-testid="ch02-announce">{announce}</p>
</section>

<style>
  .forge {
    display: grid;
    gap: var(--space-md);
    min-height: var(--size-diagram-min-height);
    padding: var(--space-lg);
    border: var(--border-width-thick) solid var(--color-border-strong);
    border-radius: var(--radius-xl);
    background: var(--color-surface-raised);
    box-shadow: var(--shadow-pop);
    min-inline-size: 0;
  }
  /* Grid/flex items default to min-content width; a 63-char npub would otherwise widen the card past a phone viewport. */
  .forge > *,
  .encoder > *,
  .keys > *,
  .stage > * {
    min-inline-size: 0;
  }
  .head {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-md);
    align-items: flex-start;
    justify-content: space-between;
  }
  .title,
  .sub {
    margin: 0;
    font-family: var(--font-family-display);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
  }
  .title {
    font-size: var(--font-size-xl);
  }
  .sub {
    font-size: var(--font-size-lg);
  }
  .desc,
  .hint,
  .note {
    margin: var(--space-2xs) 0 0;
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
  }
  .keys {
    display: grid;
    gap: var(--space-sm);
    grid-template-columns: 1fr;
  }
  /* tokens.breakpoint.md = 768px */
  @media (min-width: 768px) {
    .keys {
      grid-template-columns: 1fr auto 1fr;
      align-items: center;
    }
  }
  .key {
    display: grid;
    gap: var(--space-2xs);
    padding: var(--space-md);
    border-radius: var(--radius-lg);
    border: var(--border-width-medium) solid var(--color-border);
  }
  .secret {
    background: var(--color-danger-subtle);
    border-color: var(--color-danger);
  }
  .public {
    background: var(--color-success-subtle);
    border-color: var(--color-success);
  }
  .key-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--space-xs);
  }
  .key-label,
  .stage-title {
    margin: 0;
    font-family: var(--font-family-display);
    font-weight: var(--font-weight-semibold);
    font-size: var(--font-size-sm);
    color: var(--color-text);
  }
  .hex {
    font-family: var(--font-family-mono);
    font-size: var(--font-size-sm);
    word-break: break-all;
    color: var(--color-text);
  }
  .peek,
  .target {
    min-height: var(--size-touch-target);
    padding: 0 var(--space-sm);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-pill);
    background: var(--color-surface);
    color: var(--color-text);
    font-family: var(--font-family-display);
    font-size: var(--font-size-sm);
    cursor: pointer;
    transition:
      background-color var(--motion-duration-fast) var(--motion-easing-standard),
      transform var(--motion-duration-normal) var(--motion-easing-bounce);
  }
  .peek:hover,
  .target:hover {
    transform: translateY(calc(-1 * var(--space-3xs)));
  }
  .target[aria-pressed="true"] {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: var(--color-on-primary);
  }
  .peek:focus-visible,
  .target:focus-visible {
    outline: var(--border-width-thick) solid var(--color-focus-ring);
    outline-offset: var(--space-3xs);
  }
  .arrow {
    display: grid;
    justify-items: center;
    color: var(--color-text-primary);
    font-family: var(--font-family-display);
    font-size: var(--font-size-xs);
  }
  .arrow-glyph {
    font-size: var(--font-size-2xl);
    rotate: 90deg;
  }
  @media (min-width: 768px) {
    .arrow-glyph {
      rotate: 0deg;
    }
  }
  .encoder {
    display: grid;
    gap: var(--space-sm);
    padding-top: var(--space-md);
    border-top: var(--border-width-medium) dashed var(--color-border);
  }
  .targets {
    margin: 0;
    padding: 0;
    border: none;
  }
  .legend {
    margin-block-end: var(--space-2xs);
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
  }
  .targets,
  .controls {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-xs);
    align-items: center;
  }
  .stage {
    display: grid;
    gap: var(--space-2xs);
  }
  .bytes {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-3xs);
    font-family: var(--font-family-mono);
    font-size: var(--font-size-xs);
  }
  .byte {
    padding: var(--space-3xs) var(--space-2xs);
    border-radius: var(--radius-sm);
    background: var(--color-surface-sunken);
    color: var(--color-text);
    transition:
      background-color var(--motion-duration-fast) var(--motion-easing-standard),
      transform var(--motion-duration-fast) var(--motion-easing-bounce);
  }
  .byte.active {
    background: var(--color-primary);
    color: var(--color-on-primary);
    transform: translateY(calc(-1 * var(--space-3xs)));
  }
  .bits {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-sm);
    align-items: center;
    min-height: var(--size-control-md);
    font-family: var(--font-family-mono);
  }
  .bitstrip {
    display: inline-flex;
    gap: var(--space-3xs);
  }
  .bit {
    padding: var(--space-3xs);
    color: var(--color-text-subtle);
  }
  .bit.in-word {
    background: var(--color-accent-subtle);
    color: var(--color-text);
    font-weight: var(--font-weight-bold);
    border-radius: var(--radius-sm);
  }
  .bit.pad {
    text-decoration: underline dotted;
  }
  .word-value {
    font-weight: var(--font-weight-semibold);
    color: var(--color-text);
  }
  .checksum-tag {
    color: var(--color-text-accent);
  }
  .placeholder {
    color: var(--color-text-subtle);
  }
  .alphabet {
    display: grid;
    grid-template-columns: repeat(8, minmax(0, 1fr));
    gap: var(--space-3xs);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  /* tokens.breakpoint.md = 768px */
  @media (min-width: 768px) {
    .alphabet {
      grid-template-columns: repeat(16, minmax(0, 1fr));
    }
  }
  .letter {
    display: grid;
    justify-items: center;
    padding: var(--space-3xs) 0;
    border-radius: var(--radius-sm);
    background: var(--color-surface-sunken);
    transition:
      background-color var(--motion-duration-fast) var(--motion-easing-standard),
      transform var(--motion-duration-normal) var(--motion-easing-bounce);
  }
  .letter.hit {
    background: var(--color-accent);
    transform: scale(1.15);
  }
  .idx {
    font-size: var(--font-size-2xs);
    color: var(--color-text-muted);
  }
  .ch {
    font-family: var(--font-family-mono);
    font-weight: var(--font-weight-bold);
    color: var(--color-text);
  }
  .letter.hit .ch,
  .letter.hit .idx {
    color: var(--color-on-accent);
  }
  .encoded {
    display: block;
    min-height: var(--size-control-lg);
    padding: var(--space-sm);
    border-radius: var(--radius-md);
    background: var(--color-code-bg);
    color: var(--color-code-text);
    font-family: var(--font-family-mono);
    font-size: var(--font-size-md);
    word-break: break-all;
  }
  .hrp {
    color: var(--color-code-key);
    font-weight: var(--font-weight-bold);
  }
  .out-char.checksum {
    color: var(--color-code-string);
    text-decoration: underline;
  }
  .out-char.fresh {
    display: inline-block;
    animation: drop-in var(--motion-duration-normal) var(--motion-easing-bounce);
  }
  @keyframes drop-in {
    from {
      transform: translateY(calc(-1 * var(--space-sm))) scale(1.6);
      opacity: 0;
    }
  }
  .caret {
    display: inline-block;
    inline-size: var(--border-width-heavy);
    block-size: 1em;
    vertical-align: text-bottom;
    background: var(--color-code-key);
  }
  .encoded[data-done="true"] .caret {
    display: none;
  }
  .narration {
    margin: 0;
    padding: var(--space-xs) var(--space-sm);
    border-radius: var(--radius-md);
    background: var(--color-primary-subtle);
    color: var(--color-text);
    font-size: var(--font-size-sm);
    /* Narration interpolates whole npub/nsec strings, which have no break opportunities. */
    overflow-wrap: anywhere;
  }
</style>
