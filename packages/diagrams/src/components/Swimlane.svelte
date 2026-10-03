<script lang="ts">
  import { format, getDictionary } from "@nostrschool/i18n";
  import { tokens } from "@nostrschool/tokens";
  import { PlaybackControls, $reducedMotion as reducedMotion } from "@nostrschool/ui";
  import { BOX_RADIUS, HALFTONE_CELL, HALFTONE_DOT, SHADOW } from "../logic/ink.ts";
  import { swimlaneLayout } from "../logic/layout.ts";
  import { popIn } from "../logic/motion.ts";
  import { play, stepDelay, tick } from "../logic/playback.ts";
  import { clamp } from "../logic/validate.ts";
  import type { SwimlaneProps } from "../types.ts";
  import Frame from "./internal/Frame.svelte";
  import ScrollStrip from "./internal/ScrollStrip.svelte";
  import WirePacket from "./internal/WirePacket.svelte";

  let {
    testid,
    locale,
    title,
    description,
    lanes,
    steps,
    current = $bindable(0),
    playing = $bindable(false),
    onstep,
  }: SwimlaneProps = $props();

  const uid = $props.id();
  const t = $derived(getDictionary(locale).diagrams.swimlane);
  const layout = $derived(swimlaneLayout(lanes, steps));
  const last = $derived(steps.length - 1);
  const index = $derived(clamp(current, 0, Math.max(0, last)));
  const step = $derived(steps[index]);
  const laneLabel = (id: string): string => lanes.find((l) => l.id === id)?.label ?? id;
  const describe = (s: (typeof steps)[number], i: number): string =>
    s.narration ??
    `${format(t.step, { n: i + 1 })} (${laneLabel(s.lane)}): ${s.label}${
      s.to === undefined || s.to === s.lane
        ? ""
        : ` — ${format(t.arrow, { from: laneLabel(s.lane), to: laneLabel(s.to) })}`
    }`;
  const narration = $derived(step === undefined ? "" : describe(step, index));
  let speed = $state(1);
  let svg: SVGSVGElement | undefined = $state();

  $effect(() => {
    if (!playing) return;
    // Read synchronously so the effect re-arms after every step.
    const next = tick({ step: index, playing }, last);
    const id = setTimeout(
      () => {
        current = next.step;
        playing = next.playing;
      },
      stepDelay(tokens.motion.duration.step, speed),
    );
    return () => clearTimeout(id);
  });

  const setPlaying = (value: boolean): void => {
    const next = value ? play({ step: index, playing }, 0, last) : { step: index, playing };
    current = next.step;
    playing = value && next.playing;
  };

  let previous = -1;
  $effect(() => {
    if (index === previous) return;
    previous = index;
    onstep?.(index, step);
    const el = svg?.querySelector("[data-state='current']");
    if (el) popIn(el, $reducedMotion);
  });

  // Box geometry in SVG units (lane width 160 from DEFAULT_METRICS).
  const BOX_W = 132;
  const BOX_H = 40;
</script>

<Frame
  {testid}
  {locale}
  {title}
  {description}
  {narration}
  error={layout.ok ? undefined : layout.error}
>
  {#if layout.ok}
    {@const L = layout.value}
    <ScrollStrip {testid} label={title} follow={index}>
      <svg
        bind:this={svg}
        class="svg"
        viewBox="0 0 {L.width} {L.height}"
        role="img"
        aria-label={title}
        style:--lanes={lanes.length}
      >
        <defs>
          <marker
            id="{uid}-arrow"
            class="arrow"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M0,0 L10,5 L0,10 z" />
          </marker>
          <!-- Riso halftone screen: alternate lanes read as a second ink pass, not a tint. -->
          <pattern
            id="{uid}-halftone"
            width={HALFTONE_CELL}
            height={HALFTONE_CELL}
            patternUnits="userSpaceOnUse"
          >
            <circle
              class="halftone-dot"
              cx={HALFTONE_CELL / 2}
              cy={HALFTONE_CELL / 2}
              r={HALFTONE_DOT}
            />
          </pattern>
        </defs>
        {#each L.lanes as { lane, x }, i (lane.id)}
          <g data-testid="{testid}-lane-{lane.id}" class="lane">
            <rect
              class={i % 2 === 0 ? "lane-bg" : "lane-bg alt"}
              x={x - 80}
              y="0"
              width="160"
              height={L.height}
            />
            {#if i % 2 === 1}
              <rect
                class="lane-screen"
                x={x - 80}
                y="0"
                width="160"
                height={L.height}
                fill="url(#{uid}-halftone)"
              />
            {/if}
            <text class="lane-label" {x} y="28" text-anchor="middle" dominant-baseline="central">
              {lane.label}
            </text>
          </g>
        {/each}
        {#each L.steps as s (s.step.id)}
          {@const state = s.index < index ? "done" : s.index === index ? "current" : "pending"}
          <g data-testid="{testid}-step-{s.step.id}" data-state={state} class="step {state}">
            {#if s.toX !== undefined}
              <line
                class="wire"
                x1={s.x + (s.toX > s.x ? BOX_W / 2 : -BOX_W / 2)}
                x2={s.toX + (s.toX > s.x ? -BOX_W / 4 : BOX_W / 4)}
                y1={s.y}
                y2={s.y}
                marker-end="url(#{uid}-arrow)"
              />
              {#if s.step.packet !== undefined}
                <WirePacket
                  x={(s.x + s.toX) / 2 + (s.toX > s.x ? BOX_W / 8 : -BOX_W / 8)}
                  y={s.y - 16}
                  type={s.step.packet}
                  label={s.step.packet}
                />
              {/if}
            {/if}
            <rect
              class="box-shadow"
              x={s.x - BOX_W / 2 + SHADOW}
              y={s.y - BOX_H / 2 + SHADOW}
              width={BOX_W}
              height={BOX_H}
              rx={BOX_RADIUS}
            />
            <rect
              class="box"
              x={s.x - BOX_W / 2}
              y={s.y - BOX_H / 2}
              width={BOX_W}
              height={BOX_H}
              rx={BOX_RADIUS}
            />
            <text
              class="box-label"
              x={s.x}
              y={s.y}
              text-anchor="middle"
              dominant-baseline="central"
            >
              {s.step.label}
            </text>
          </g>
        {/each}
      </svg>
    </ScrollStrip>
  {/if}
  {#snippet controls()}
    <PlaybackControls
      testid="{testid}-controls"
      {locale}
      totalSteps={steps.length}
      bind:step={() => index, (v) => (current = v)}
      bind:playing={() => playing, setPlaying}
      bind:speed
    />
  {/snippet}
  {#snippet alt()}
    <ol>
      {#each steps as s, i (s.id)}
        <li aria-current={i === index ? "step" : undefined}>{describe(s, i)}</li>
      {/each}
    </ol>
  {/snippet}
</Frame>

<style>
  .svg {
    /* Keeps labels legible on phones: below this the strip scrolls instead of shrinking. */
    --lane-min: calc(var(--size-touch-target) * 2.5);
    display: block;
    width: 100%;
    min-width: calc(var(--lanes) * var(--lane-min));
    height: auto;
  }
  .lane-bg {
    fill: var(--color-diagram-lane);
  }
  .lane-bg.alt {
    fill: var(--color-diagram-lane-alt);
  }
  .halftone-dot {
    fill: var(--color-halftone);
    opacity: var(--opacity-halftone);
  }
  .lane-screen {
    pointer-events: none;
  }
  .lane-label {
    fill: var(--color-diagram-label);
    font-family: var(--font-family-mono);
    font-weight: var(--font-weight-bold);
    font-size: var(--font-size-xs);
    letter-spacing: var(--font-letter-spacing-caps);
    text-transform: uppercase;
  }
  .wire {
    stroke: var(--color-diagram-edge);
    stroke-width: var(--border-width-thick);
  }
  .arrow path {
    fill: var(--color-diagram-edge);
  }
  .box-shadow {
    fill: var(--color-shadow-pop);
  }
  .box {
    fill: var(--color-diagram-node);
    stroke: var(--color-diagram-node-stroke);
    stroke-width: var(--border-width-medium);
  }
  .box-label {
    fill: var(--color-diagram-label);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-semibold);
  }
  .step {
    transform-box: fill-box;
    transform-origin: center;
    transition: opacity var(--motion-duration-normal) var(--motion-easing-standard);
  }
  /* Upcoming steps show as empty dashed slots so the shape of the flow is visible early. */
  .step.pending .box {
    stroke-dasharray: 6 6;
  }
  .step.pending .box-shadow,
  .step.pending .box-label,
  .step.pending .wire,
  .step.pending :global(.wire-packet) {
    opacity: 0;
  }
  /* Current step: thicker ink line + orange misregistration (the brand's "selected"). */
  .step.current .box {
    stroke-width: var(--border-width-thick);
  }
  .step.current .box-shadow {
    fill: var(--color-shadow-accent);
  }
  .step.current .wire {
    stroke: var(--color-diagram-edge-active);
  }
</style>
