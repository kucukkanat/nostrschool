<script lang="ts">
  import { format, getDictionary, type Locale, plural } from "@nostrschool/i18n";
  import { tokens } from "@nostrschool/tokens";
  import { Button, emit } from "@nostrschool/ui";
  import { circlePoint, TOY_GROUP, toyBruteForce, toyHops } from "./keys-logic.ts";

  const { locale }: { readonly locale: Locale } = $props();
  const t = $derived(getDictionary(locale).chapters.ch02.clock);
  const { n, g } = TOY_GROUP;
  const SIZE = 240;
  const CENTER = SIZE / 2;
  const RADIUS = SIZE / 2 - 16;
  const positions = Array.from({ length: n }, (_, i) => ({
    i,
    ...circlePoint(i, n, RADIUS, CENTER),
  }));

  let k = $state(7);
  let shown = $state(0);
  let mode = $state<"idle" | "hopping" | "landed" | "guessing" | "found">("idle");
  let guess = $state(0);
  let guesses = $state(0);
  let timer: ReturnType<typeof setInterval> | undefined;

  const hops = $derived(toyHops(k));
  const path = $derived(hops.ok ? hops.value : []);
  const publicSpot = $derived(path.at(-1));
  const visited = $derived(new Set(path.slice(0, shown)));
  const head = $derived(shown > 0 ? path[shown - 1] : 0);

  const stop = () => clearInterval(timer);
  // Same pattern for both animations: tick until `done`, then settle. The interval is a motion
  // token, so the pace matches the rest of the site.
  const run = (tick: () => boolean, ms: number) => {
    stop();
    timer = setInterval(() => {
      if (tick()) stop();
    }, ms);
  };

  const hop = () => {
    shown = 0;
    mode = "hopping";
    run(() => {
      shown += 1;
      if (shown < path.length) return false;
      mode = "landed";
      return true;
    }, tokens.motion.duration.normal);
  };

  const reverse = () => {
    if (publicSpot === undefined) return;
    const attempts = toyBruteForce(publicSpot);
    if (!attempts.ok) return;
    const total = attempts.value.length;
    guess = 0;
    mode = "guessing";
    run(() => {
      guess += 1;
      if (guess < total) return false;
      guesses = total;
      mode = "found";
      emit("celebrate", { reason: "ch02-clock-reversed" });
      return true;
    }, tokens.motion.duration.fast);
  };

  const onslide = (e: Event & { currentTarget: HTMLInputElement }) => {
    stop();
    k = Number(e.currentTarget.value);
    shown = 0;
    mode = "idle";
  };

  $effect(() => stop);

  const status = $derived.by(() => {
    if (publicSpot === undefined) return "";
    if (mode === "landed") return format(t.landedAnnounce, { k, g, p: publicSpot });
    if (mode === "found") return plural(locale, guesses, t.attempts);
    return "";
  });
</script>

<section class="clock" data-testid="ch02-clock" data-mode={mode} aria-labelledby="ch02-clock-title">
  <h3 id="ch02-clock-title" class="title">{t.title}</h3>
  <p class="desc">{t.description}</p>
  <div class="layout">
    <svg
      viewBox="0 0 {SIZE} {SIZE}"
      class="dial"
      role="img"
      aria-label={format(t.chartLabel, { n })}
      data-testid="ch02-clock-svg"
    >
      <circle cx={CENTER} cy={CENTER} r={RADIUS} class="ring" />
      {#each positions as p (p.i)}
        <circle
          cx={p.x}
          cy={p.y}
          r={p.i === head && shown > 0 ? 7 : visited.has(p.i) ? 4.5 : 3}
          class="spot"
          class:visited={visited.has(p.i)}
          class:head={p.i === head && shown > 0}
          class:zero={p.i === 0}
          data-testid="ch02-clock-spot-{p.i}"
        />
      {/each}
      {#if mode === "landed" || mode === "guessing" || mode === "found"}
        {@const land = positions[publicSpot ?? 0]}
        {#if land !== undefined}
          <circle cx={land.x} cy={land.y} r="10" class="target" />
        {/if}
      {/if}
      <text x={CENTER} y={CENTER} class="center" text-anchor="middle" dominant-baseline="middle">
        {mode === "guessing" ? format(t.attemptsLive, { k: guess }) : `${k} × ${g}`}
      </text>
    </svg>

    <div class="panel">
      <label class="slider">
        <span>{format(t.secretLabel, { k })}</span>
        <input
          type="range"
          min="1"
          max={n - 1}
          value={k}
          aria-label={t.sliderLabel}
          data-testid="ch02-clock-slider"
          oninput={onslide}
        >
      </label>
      <Button testid="ch02-clock-hop" onclick={hop} loading={mode === "hopping"}>
        {mode === "hopping" ? t.hopping : t.hop}
      </Button>
      {#if publicSpot !== undefined &&
        (mode === "landed" || mode === "guessing" || mode === "found")}
        <p class="landed" data-testid="ch02-clock-public">{format(t.landed, { p: publicSpot })}</p>
        <p class="help">{format(t.reverseHelp, { p: publicSpot })}</p>
        <Button
          testid="ch02-clock-reverse"
          variant="secondary"
          onclick={reverse}
          loading={mode === "guessing"}
          >{t.reverse}</Button
        >
      {/if}
      {#if mode === "found"}
        <p class="found" data-testid="ch02-clock-found">{plural(locale, guesses, t.attempts)}</p>
        <p class="scale">{t.scale}</p>
      {/if}
    </div>
  </div>
  <p class="visually-hidden" aria-live="polite" data-testid="ch02-clock-narration">{status}</p>
</section>

<style>
  .clock {
    display: grid;
    gap: var(--space-sm);
    padding: var(--space-lg);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-lg);
    background: var(--color-surface-raised);
    box-shadow: var(--shadow-pop-sm);
  }
  .title {
    margin: 0;
    font-family: var(--font-family-display);
    font-size: var(--font-size-xl);
    color: var(--color-text-primary);
  }
  .desc,
  .help,
  .scale {
    margin: 0;
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
  }
  .layout {
    display: grid;
    gap: var(--space-md);
    align-items: center;
  }
  /* tokens.breakpoint.md = 768px */
  @media (min-width: 768px) {
    .layout {
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    }
  }
  .dial {
    inline-size: 100%;
    max-inline-size: calc(var(--size-rail) * 1.2);
    justify-self: center;
  }
  .ring {
    fill: none;
    stroke: var(--color-diagram-edge);
    stroke-width: 1;
    stroke-dasharray: 2 4;
  }
  .spot {
    fill: var(--color-diagram-node-stroke);
    transition:
      r var(--motion-duration-fast) var(--motion-easing-bounce),
      fill var(--motion-duration-fast) var(--motion-easing-standard);
  }
  .spot.zero {
    fill: var(--color-text);
  }
  .spot.visited {
    fill: var(--color-secondary);
  }
  .spot.head {
    fill: var(--color-primary);
  }
  /* Bright riso fills only read on paper through their ink outline. */
  .spot.visited,
  .spot.head {
    stroke: var(--color-border-strong);
    stroke-width: var(--border-width-medium);
  }
  .target {
    fill: none;
    stroke: var(--color-text-accent);
    stroke-width: 3;
  }
  .center {
    fill: var(--color-text);
    font-family: var(--font-family-display);
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-bold);
  }
  .panel {
    display: grid;
    gap: var(--space-sm);
    justify-items: start;
  }
  .slider {
    display: grid;
    gap: var(--space-2xs);
    inline-size: 100%;
    font-family: var(--font-family-display);
    color: var(--color-text);
  }
  .slider input {
    inline-size: 100%;
    min-block-size: var(--size-touch-target);
    accent-color: var(--color-text-primary);
  }
  .slider input:focus-visible {
    outline: var(--border-width-thick) solid var(--color-focus-ring);
    outline-offset: var(--space-3xs);
  }
  .landed,
  .found {
    margin: 0;
    font-family: var(--font-family-display);
    font-weight: var(--font-weight-bold);
    color: var(--color-text);
  }
  /* tokens.breakpoint.sm = 480px: a tighter frame so phones (320-414px) keep room for content. */
  @media (max-width: 480px) {
    .clock {
      padding: var(--space-md);
    }
  }
</style>
