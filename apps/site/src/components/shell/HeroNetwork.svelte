<script lang="ts">
  /**
   * Landing illustration: people and relays with message packets hopping along the links.
   * Purely illustrative, so it is one labelled image; moving content gets a pause button
   * (WCAG 2.2.2) and stays still under reduced motion.
   */
  import { getDictionary, type Locale } from "@nostrschool/i18n";
  import { tokens } from "@nostrschool/tokens";
  import { $reducedMotion as reducedMotion } from "@nostrschool/ui/motion.ts";
  import { HERO_EDGES, HERO_NODES, lerp, loopPhase, resolveEdges } from "./lib/geometry.ts";

  interface Props {
    readonly locale: Locale;
  }
  const { locale }: Props = $props();
  const t = $derived(getDictionary(locale).common.home);

  const edges = resolveEdges(HERO_NODES, HERO_EDGES);
  // A packet crosses an edge in a few "packet" durations; slow enough to follow by eye.
  const PERIOD_MS = tokens.motion.duration.packet * 4;

  let elapsed = $state(0);
  let paused = $state(false);
  let reduce = $state(false);
  $effect(() =>
    reducedMotion.subscribe((value) => {
      reduce = value;
    }),
  );

  $effect(() => {
    if (paused || reduce) return;
    let frame = 0;
    const start = performance.now() - elapsed;
    const tick = (now: number) => {
      elapsed = now - start;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  });

  // Alternate direction per edge so traffic visibly flows both ways (publish and subscribe).
  const packets = $derived(
    edges.map((edge, i) => {
      const phase = loopPhase(elapsed, PERIOD_MS, i / edges.length);
      const p = i % 2 === 0 ? lerp(edge.a, edge.b, phase) : lerp(edge.b, edge.a, phase);
      return { id: edge.id, x: p.x, y: p.y, kind: i % 3 };
    }),
  );
  const still = $derived(paused || reduce);
</script>

<figure class="hero-network" data-testid="hero-network" data-animating={!still}>
  <svg viewBox="0 0 100 100" role="img" aria-labelledby="hero-network-title hero-network-desc">
    <title id="hero-network-title">{t.networkTitle}</title>
    <desc id="hero-network-desc">{t.networkDescription}</desc>
    {#each edges as edge (edge.id)}
      <line class="edge" x1={edge.a.x} y1={edge.a.y} x2={edge.b.x} y2={edge.b.y} />
    {/each}
    {#if !reduce}
      {#each packets as packet (packet.id)}
        <circle class="packet k{packet.kind}" cx={packet.x} cy={packet.y} r="1.8" />
      {/each}
    {/if}
    {#each HERO_NODES as node (node.id)}
      <g class="node {node.kind}" transform="translate({node.x} {node.y})">
        {#if node.kind === "relay"}
          <rect x="-6" y="-6" width="12" height="12" rx="1" />
          <path class="glyph" d="M-3 -1.5h6M-3 1.5h6" />
        {:else}
          <circle r="5" />
          <circle class="glyph-fill" cy="-1.2" r="1.6" />
          <path class="glyph" d="M-2.6 2.8a2.8 2.2 0 0 1 5.2 0" />
        {/if}
      </g>
    {/each}
  </svg>
  {#if !reduce}
    <button
      type="button"
      class="pause"
      aria-pressed={paused}
      data-testid="hero-network-pause"
      onclick={() => (paused = !paused)}
    >
      {paused ? t.play : t.pause}
    </button>
  {/if}
</figure>

<style>
  /* Printed like a riso diagram: ink outlines on every fill, dashed ink links, no glow. */
  .hero-network {
    position: relative;
    margin: 0;
    aspect-ratio: 1;
    inline-size: 100%;
    max-inline-size: calc(var(--size-rail) * 1.6);
  }
  svg {
    inline-size: 100%;
    block-size: 100%;
    overflow: visible;
  }
  .edge {
    stroke: var(--color-diagram-edge);
    stroke-width: 0.6;
    stroke-dasharray: 1.5 1.5;
  }
  .node rect,
  .node circle:first-child {
    stroke: var(--color-border-strong);
    stroke-width: 0.9;
  }
  .relay rect {
    fill: var(--color-primary);
  }
  .user > circle:first-child {
    fill: var(--color-secondary);
  }
  .glyph {
    fill: none;
    stroke: var(--color-on-primary);
    stroke-width: 0.9;
    stroke-linecap: square;
  }
  .user .glyph {
    stroke: var(--color-on-secondary);
  }
  .glyph-fill {
    fill: var(--color-on-secondary);
  }
  .packet {
    stroke: var(--color-border-strong);
    stroke-width: 0.5;
  }
  .k0 {
    fill: var(--color-packet-event);
  }
  .k1 {
    fill: var(--color-packet-req);
  }
  .k2 {
    fill: var(--color-highlight);
  }
  /* Top-right, above the hero mascot (z-raised) that overlaps the bottom corner: the WCAG pause
     control must stay fully visible and tappable. */
  .pause {
    position: absolute;
    inset-block-start: 0;
    inset-inline-end: 0;
    z-index: calc(var(--z-raised) + 1);
    min-block-size: var(--size-touch-target);
    padding: 0 var(--space-sm);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-md);
    background: var(--color-surface-raised);
    color: var(--color-text);
    font: inherit;
    font-family: var(--font-family-mono);
    font-size: var(--font-size-xs);
    box-shadow: var(--shadow-pop-sm);
    cursor: pointer;
    transition:
      translate var(--motion-duration-press) var(--motion-easing-press),
      box-shadow var(--motion-duration-press) var(--motion-easing-press);
  }
  .pause:active {
    translate: var(--size-lift) var(--size-lift);
    box-shadow: var(--shadow-pressed);
  }
</style>
