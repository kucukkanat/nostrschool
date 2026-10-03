<script lang="ts">
  import { format, getDictionary } from "@nostrschool/i18n";
  import { tokens } from "@nostrschool/tokens";
  import { PlaybackControls, $reducedMotion as reducedMotion } from "@nostrschool/ui";
  import { sequenceLayout } from "../logic/layout.ts";
  import { popIn, travel } from "../logic/motion.ts";
  import { play, stepDelay, tick } from "../logic/playback.ts";
  import { clamp } from "../logic/validate.ts";
  import type { SequenceDiagramProps } from "../types.ts";
  import Frame from "./internal/Frame.svelte";
  import ScrollStrip from "./internal/ScrollStrip.svelte";
  import WirePacket from "./internal/WirePacket.svelte";

  let {
    testid,
    locale,
    title,
    description,
    lanes,
    messages,
    step = $bindable(-1),
    playing = $bindable(false),
    stepMs = tokens.motion.duration.step,
    onstep,
    detail,
  }: SequenceDiagramProps = $props();

  const uid = $props.id();
  const t = $derived(getDictionary(locale).diagrams.sequence);
  const layout = $derived(sequenceLayout(lanes, messages));
  const last = $derived(messages.length - 1);
  const current = $derived(clamp(step, -1, last));
  const message = $derived(messages[current]);
  const laneLabel = (id: string): string => lanes.find((l) => l.id === id)?.label ?? id;
  const narration = $derived(
    message === undefined
      ? messages.length === 0
        ? t.empty
        : t.start
      : (message.narration ??
          `${format(t.from, { from: laneLabel(message.from), to: laneLabel(message.to) })}: ${message.label}`),
  );
  let speed = $state(1);
  let svg: SVGSVGElement | undefined = $state();

  // Autoplay: one timer per step; the pure state machine decides when to stop.
  $effect(() => {
    if (!playing) return;
    // Read synchronously so the effect re-arms after every step.
    const next = tick({ step: current, playing }, last);
    const id = setTimeout(
      () => {
        step = next.step;
        playing = next.playing;
      },
      stepDelay(stepMs, speed),
    );
    return () => clearTimeout(id);
  });

  const setPlaying = (value: boolean): void => {
    const next = value ? play({ step: current, playing }, -1, last) : { step: current, playing };
    step = next.step;
    playing = value && next.playing;
  };

  // Notify + animate whenever the current message changes (from controls, autoplay or a binding).
  let previous = -1;
  $effect(() => {
    if (current === previous) return;
    previous = current;
    onstep?.(current, message);
    const reduce = $reducedMotion;
    const el = svg?.querySelector("[data-state='current']");
    const dot = svg?.querySelector(".dot");
    const placed = layout.ok ? layout.value.messages[current] : undefined;
    if (el) popIn(el, reduce);
    if (dot && placed) travel(dot, placed.x1, placed.x2, reduce);
  });
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
    <ScrollStrip {testid} label={title} follow={current}>
      <svg
        bind:this={svg}
        class="svg"
        viewBox="0 0 {L.width} {L.height}"
        role="img"
        aria-label={title}
        style:--lanes={lanes.length}
      >
        <defs>
          {#each ["idle", "active"] as variant (variant)}
            <marker
              id="{uid}-arrow-{variant}"
              class="arrow-{variant}"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M0,0 L10,5 L0,10 z" />
            </marker>
          {/each}
        </defs>
        {#each L.lanes as { lane, x } (lane.id)}
          <g data-testid="{testid}-lane-{lane.id}" data-kind={lane.kind ?? "client"} class="lane">
            <line class="lifeline" x1={x} x2={x} y1="40" y2={L.height} />
            <rect class="lane-head" x={x - 70} y="4" width="140" height="36" rx="12" />
            <text class="lane-label" {x} y="22" text-anchor="middle" dominant-baseline="central">
              {lane.label}
            </text>
          </g>
        {/each}
        {#each L.messages as m (m.message.id)}
          {@const state = m.index < current ? "sent" : m.index === current ? "current" : "pending"}
          {@const variant = state === "current" ? "active" : "idle"}
          <g
            data-testid="{testid}-message-{m.message.id}"
            data-state={state}
            class="message {state}"
            aria-hidden={state === "pending"}
          >
            {#if m.direction === "self"}
              <path
                class="wire"
                d="M{m.x1},{m.y - 12} h40 v24 h-36"
                marker-end="url(#{uid}-arrow-{variant})"
              />
              <WirePacket
                x={m.x1 + 40}
                y={m.y - 22}
                type={m.message.packet ?? "custom"}
                label={m.message.label}
              />
            {:else}
              <line
                class="wire"
                x1={m.x1 + (m.direction === "right" ? 4 : -4)}
                x2={m.x2 + (m.direction === "right" ? -4 : 4)}
                y1={m.y}
                y2={m.y}
                marker-end="url(#{uid}-arrow-{variant})"
              />
              <WirePacket
                x={(m.x1 + m.x2) / 2}
                y={m.y - 14}
                type={m.message.packet ?? "custom"}
                label={m.message.label}
              />
              {#if state === "current"}
                <circle class="dot" cx={m.x2} cy={m.y} r="6" />
              {/if}
            {/if}
          </g>
        {/each}
      </svg>
    </ScrollStrip>
    {#if message !== undefined && (detail !== undefined || message.payload !== undefined)}
      <div class="detail" data-testid="{testid}-detail">
        {#if detail !== undefined}
          {@render detail(message)}
        {:else}
          <pre>{JSON.stringify(message.payload, null, 2)}</pre>
        {/if}
      </div>
    {/if}
  {/if}
  {#snippet controls()}
    <PlaybackControls
      testid="{testid}-controls"
      {locale}
      totalSteps={messages.length + 1}
      bind:step={() => current + 1, (v) => (step = v - 1)}
      bind:playing={() => playing, setPlaying}
      bind:speed
    />
  {/snippet}
  {#snippet alt()}
    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <!-- biome-ignore lint/a11y/noNoninteractiveTabindex: wide diagrams scroll sideways on phones; keyboard users need a tab stop to scroll them (WCAG 2.1.1, axe scrollable-region-focusable). -->
    <section class="scroll" tabindex="0" aria-label={title}>
      <table>
        <thead>
          <tr>
            <th scope="col">{t.number}</th>
            <th scope="col">{t.fromHeader}</th>
            <th scope="col">{t.toHeader}</th>
            <th scope="col">{t.message}</th>
          </tr>
        </thead>
        <tbody>
          {#each messages as m, i (m.id)}
            <tr aria-current={i === current ? "step" : undefined}>
              <td>{i + 1}</td>
              <td>{laneLabel(m.from)}</td>
              <td>{laneLabel(m.to)}</td>
              <td>{m.narration ?? m.label}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </section>
  {/snippet}
</Frame>

<style>
  .scroll {
    overflow-x: auto;
  }
  .svg {
    /* Keeps labels legible on phones: below this the strip scrolls instead of shrinking. */
    --lane-min: calc(var(--size-touch-target) * 2.5);
    display: block;
    width: 100%;
    min-width: calc(var(--lanes) * var(--lane-min));
    height: auto;
    font-family: var(--font-family-body);
  }
  .lifeline {
    stroke: var(--color-diagram-lane);
    stroke-width: var(--border-width-medium);
    stroke-dasharray: 4 6;
  }
  .lane-head {
    fill: var(--color-diagram-node);
    stroke: var(--color-diagram-node-stroke);
    stroke-width: var(--border-width-medium);
  }
  .lane-label {
    fill: var(--color-diagram-label);
    font-family: var(--font-family-display);
    font-weight: var(--font-weight-bold);
    font-size: var(--font-size-sm);
  }
  .wire {
    fill: none;
    stroke: var(--color-diagram-edge);
    stroke-width: var(--border-width-thick);
  }
  .arrow-idle path {
    fill: var(--color-diagram-edge);
  }
  .arrow-active path {
    fill: var(--color-diagram-edge-active);
  }
  .message {
    transition: opacity var(--motion-duration-normal) var(--motion-easing-standard);
  }
  .message.pending {
    opacity: 0;
  }
  .message.sent .wire {
    stroke-dasharray: 2 4;
  }
  .message.current .wire {
    stroke: var(--color-diagram-edge-active);
  }
  .message.current {
    transform-box: fill-box;
    transform-origin: center;
  }
  .dot {
    fill: var(--color-diagram-highlight);
    stroke: var(--color-diagram-node-stroke);
    stroke-width: var(--border-width-medium);
  }
  .detail {
    margin-top: var(--space-sm);
    padding: var(--space-sm);
    border-radius: var(--radius-md);
    background: var(--color-code-bg);
    color: var(--color-code-text);
    overflow-x: auto;
  }
  .detail pre {
    margin: 0;
    font-family: var(--font-family-mono);
    font-size: var(--font-size-xs);
  }
</style>
