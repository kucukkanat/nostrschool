<script lang="ts">
  import { format, getDictionary } from "@nostrschool/i18n";
  import { $reducedMotion as reducedMotion, rovingIndex } from "@nostrschool/ui";
  import {
    clampToBox,
    createSimulation,
    graphStats,
    groupColors,
    KEY_DIRECTIONS,
    nearestInDirection,
    neighbors,
    type Point,
    staticLayout,
    validateGraph,
  } from "../logic/graph.ts";
  import { SHADOW } from "../logic/ink.ts";
  import { popIn } from "../logic/motion.ts";
  import type { ForceGraphProps, GraphNode } from "../types.ts";
  import Frame from "./internal/Frame.svelte";

  let {
    testid,
    locale,
    title,
    description,
    nodes,
    links,
    selected = $bindable(null),
    highlight = [],
    width = 600,
    height = 400,
    onselect,
  }: ForceGraphProps = $props();

  const R = 22;
  // Room for the node plus its (possibly counter-scaled) name label below it.
  const MARGIN = R + 32;
  const uid = $props.id();
  const valid = $derived(validateGraph(nodes, links));
  const t = $derived(getDictionary(locale).diagrams.graph);
  const stats = $derived(graphStats(nodes, links));
  const colors = $derived(groupColors(nodes));
  const nameOf = (id: string): string => nodes.find((n) => n.id === id)?.label ?? id;

  // First paint (and SSR) uses the settled layout, so nothing jumps on hydration; `live`
  // takes over once the learner drags something.
  const base = $derived(valid.ok ? staticLayout(nodes, links, width, height, MARGIN) : []);
  let live = $state<readonly Point[] | null>(null);
  const points = $derived(live ?? base);
  const at = $derived(new Map(points.map((p) => [p.id, p])));

  const emphasized = $derived(
    new Set([
      ...highlight,
      ...(selected === null ? [] : [selected, ...neighbors(links, selected)]),
    ]),
  );
  const dimming = $derived(emphasized.size > 0);
  let cleared = $state(false);
  const describeNode = (id: string): string => {
    const s = stats.get(id);
    return format(t.node, {
      name: nameOf(id),
      following: s?.following.length ?? 0,
      followers: s?.followers.length ?? 0,
    });
  };
  const narration = $derived(
    selected !== null ? describeNode(selected) : cleared ? t.cleared : t.select,
  );

  const select = (id: string | null): void => {
    selected = selected === id ? null : id;
    cleared = selected === null;
    onselect?.(selected);
  };

  // Roving tabindex: exactly one node is in the tab order.
  let focusId = $state<string | null>(null);
  const tabStop = $derived(focusId ?? selected ?? nodes[0]?.id ?? null);
  let svg: SVGSVGElement | undefined = $state();
  // viewBox units per screen px: > 1 when the SVG is drawn smaller than its viewBox (phones).
  let rendered = $state(0);
  const unitsPerPx = $derived(rendered > 0 ? Math.max(1, width / rendered) : 1);
  const focusNode = (id: string): void => {
    focusId = id;
    const el = svg?.querySelector<SVGGElement>(`[data-node='${CSS.escape(id)}']`);
    el?.focus();
  };
  const onkey = (e: KeyboardEvent, node: GraphNode): void => {
    const i = nodes.findIndex((n) => n.id === node.id);
    const dir = KEY_DIRECTIONS[e.key];
    // Arrows prefer the spatially nearest node; ui's rovingIndex covers the linear fallback + Home/End.
    const linear = rovingIndex(nodes.length, i, e.key);
    const target =
      (dir === undefined ? undefined : nearestInDirection(points, node.id, dir)) ??
      (linear === undefined ? undefined : nodes[linear]?.id);
    if (target !== undefined) {
      e.preventDefault();
      focusNode(target);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      select(node.id);
    } else if (e.key === "Escape" && selected !== null) {
      e.preventDefault();
      select(null);
    }
  };

  // Live simulation only drives dragging; reduced motion moves the dragged node alone.
  let sim: ReturnType<typeof createSimulation> | undefined;
  $effect(() => {
    live = null;
    if (!valid.ok) return;
    const s = createSimulation(nodes, links, width, height);
    const start = new Map(base.map((p) => [p.id, p]));
    for (const n of s.nodes()) {
      n.x = start.get(n.id)?.x ?? width / 2;
      n.y = start.get(n.id)?.y ?? height / 2;
    }
    s.alpha(0).on("tick", () => {
      live = s.nodes().map((n) => ({
        id: n.id,
        x: clampToBox(n.x ?? 0, width, MARGIN),
        y: clampToBox(n.y ?? 0, height, MARGIN),
      }));
    });
    sim = s;
    return () => {
      s.stop();
      sim = undefined;
    };
  });

  $effect(() => {
    const reduce = $reducedMotion;
    for (const el of svg?.querySelectorAll(".shape") ?? []) popIn(el, reduce);
  });

  let drag: { id: string; moved: boolean } | null = null;
  const toSvg = (e: PointerEvent): { x: number; y: number } => {
    const box = svg?.getBoundingClientRect();
    if (box === undefined || box.width === 0 || box.height === 0)
      return { x: width / 2, y: height / 2 };
    return {
      x: clampToBox(((e.clientX - box.left) / box.width) * width, width, MARGIN),
      y: clampToBox(((e.clientY - box.top) / box.height) * height, height, MARGIN),
    };
  };
  const onpointerdown = (e: PointerEvent, id: string): void => {
    drag = { id, moved: false };
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
  };
  const onpointermove = (e: PointerEvent): void => {
    if (drag === null) return;
    const { id } = drag;
    const p = toSvg(e);
    drag = { id, moved: true };
    const simNode = sim?.nodes().find((n) => n.id === id);
    if (simNode !== undefined && !$reducedMotion) {
      simNode.fx = p.x;
      simNode.fy = p.y;
      sim?.alphaTarget(0.3).restart();
    } else {
      live = points.map((q) => (q.id === id ? { id, ...p } : q));
    }
  };
  const onpointerup = (): void => {
    if (drag === null) return;
    const simNode = sim?.nodes().find((n) => n.id === drag?.id);
    if (simNode !== undefined) {
      simNode.fx = null;
      simNode.fy = null;
    }
    sim?.alphaTarget(0);
    // A drag ends with a click event; remember to swallow it.
    suppressClick = drag.moved;
    drag = null;
  };
  let suppressClick = false;
  const onclick = (id: string): void => {
    if (suppressClick) {
      suppressClick = false;
      return;
    }
    focusId = id;
    select(id);
  };

  /** Shortens a link so arrowheads touch the node rim instead of hiding under it. */
  const trim = (a: Point, b: Point, startGap: number, endGap: number) => {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    return {
      x1: a.x + (dx / len) * startGap,
      y1: a.y + (dy / len) * startGap,
      x2: b.x - (dx / len) * endGap,
      y2: b.y - (dy / len) * endGap,
    };
  };
</script>

<Frame
  {testid}
  {locale}
  {title}
  {description}
  {narration}
  error={valid.ok ? undefined : valid.error}
>
  <p class="help" id="{uid}-help">{t.help}</p>
  <!-- biome-ignore lint/a11y/useSemanticElements: <svg> cannot be a <fieldset>; the group names the diagram. -->
  <svg
    bind:this={svg}
    bind:clientWidth={rendered}
    class="svg"
    viewBox="0 0 {width} {height}"
    style:--units-per-px={unitsPerPx}
    role="group"
    aria-label={title}
    aria-describedby="{uid}-help"
    {onpointermove}
    {onpointerup}
    onpointercancel={onpointerup}
  >
    <defs>
      <marker
        id="{uid}-arrow"
        class="arrow"
        viewBox="0 0 10 10"
        refX="9"
        refY="5"
        markerWidth="6"
        markerHeight="6"
        orient="auto-start-reverse"
      >
        <path d="M0,0 L10,5 L0,10 z" />
      </marker>
      <clipPath id="{uid}-clip"><circle r={R} /></clipPath>
    </defs>
    {#each links as l, i (`${l.source}-${l.target}-${i}`)}
      {@const a = at.get(l.source)}
      {@const b = at.get(l.target)}
      {#if a && b}
        {@const kind = l.kind ?? "follows"}
        {@const c = trim(a, b, kind === "mutual" ? R + 2 : R, kind === "relay" ? R : R + 2)}
        <line
          class="link {kind}"
          class:on={selected !== null && (l.source === selected || l.target === selected)}
          class:faded={dimming && !(emphasized.has(l.source) && emphasized.has(l.target))}
          x1={c.x1}
          y1={c.y1}
          x2={c.x2}
          y2={c.y2}
          marker-end={kind === "relay" ? undefined : `url(#${uid}-arrow)`}
          marker-start={kind === "mutual" ? `url(#${uid}-arrow)` : undefined}
        />
      {/if}
    {/each}
    {#each nodes as node (node.id)}
      {@const p = at.get(node.id)}
      {#if p}
        {@const isSelected = selected === node.id}
        <!-- biome-ignore lint/a11y/useSemanticElements: SVG has no <button>; role + key handling make the node a real button. -->
        <g
          class="node"
          class:selected={isSelected}
          class:faded={dimming && !emphasized.has(node.id)}
          data-node={node.id}
          data-testid="{testid}-node-{node.id}"
          data-group={node.group}
          transform="translate({p.x} {p.y})"
          role="button"
          tabindex={tabStop === node.id ? 0 : -1}
          aria-pressed={isSelected}
          aria-label={describeNode(node.id)}
          onclick={() => onclick(node.id)}
          onkeydown={(e) => onkey(e, node)}
          onfocus={() => (focusId = node.id)}
          onpointerdown={(e) => onpointerdown(e, node.id)}
        >
          <!-- Separate halo outside the shape: it sits on the surface (not on the node stroke) so the
               focus ring keeps 3:1 contrast in both themes and doesn't shrink with faded nodes. -->
          <circle class="focus-halo" r={R + 6} data-testid="{testid}-node-{node.id}-focus" />
          <g class="shape">
            <!-- Hard offset "misregistration" disc: ink by default, orange when selected. -->
            <circle class="cast" cx={SHADOW} cy={SHADOW} r={R} />
            <circle class="disc" r={R} />
            <circle class="group" r={R - 3} style:stroke={colors.get(node.group ?? "")} />
            {#if node.avatar !== undefined}
              <image
                href={node.avatar}
                x={-R}
                y={-R}
                width={R * 2}
                height={R * 2}
                clip-path="url(#{uid}-clip)"
                preserveAspectRatio="xMidYMid slice"
              />
            {:else}
              <text class="initial" text-anchor="middle" dominant-baseline="central">
                {Array.from(node.label)[0] ?? "?"}
              </text>
            {/if}
            <circle class="ring" r={R} />
          </g>
          <text class="label" y={R + 8} text-anchor="middle" dominant-baseline="hanging">
            {node.label}
          </text>
        </g>
      {/if}
    {/each}
  </svg>
  {#snippet alt()}
    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <!-- biome-ignore lint/a11y/noNoninteractiveTabindex: wide diagrams scroll sideways on phones; keyboard users need a tab stop to scroll them (WCAG 2.1.1, axe scrollable-region-focusable). -->
    <section class="scroll" tabindex="0" aria-label={title}>
      <table data-testid="{testid}-table">
        <thead>
          <tr>
            <th scope="col">{t.person}</th>
            <th scope="col">{t.follows}</th>
            <th scope="col">{t.followedBy}</th>
          </tr>
        </thead>
        <tbody>
          {#each nodes as n (n.id)}
            {@const s = stats.get(n.id)}
            <tr aria-current={selected === n.id ? "true" : undefined}>
              <th scope="row">{n.label}</th>
              <td>{s?.following.map(nameOf).join(", ") || t.none}</td>
              <td>{s?.followers.map(nameOf).join(", ") || t.none}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </section>
  {/snippet}
</Frame>

<style>
  .help {
    margin: 0;
    color: var(--color-text-muted);
    font-size: var(--font-size-xs);
  }
  .svg {
    display: block;
    width: 100%;
    height: auto;
    touch-action: none;
    user-select: none;
    /* Long names on edge nodes may poke past the viewBox; let them rather than clip. */
    overflow: visible;
  }
  .link {
    stroke: var(--color-diagram-edge);
    stroke-width: var(--border-width-medium);
    transition: opacity var(--motion-duration-normal) var(--motion-easing-standard);
  }
  .link.mutual {
    stroke-width: var(--border-width-thick);
  }
  .link.relay {
    stroke-dasharray: 4 6;
  }
  .link.on {
    stroke: var(--color-diagram-edge-active);
  }
  .link.faded {
    opacity: var(--opacity-dimmed);
  }
  .arrow path {
    fill: var(--color-diagram-edge);
  }
  .node {
    cursor: grab;
  }
  .node:active {
    cursor: grabbing;
  }
  .node:focus {
    outline: none;
  }
  .shape {
    transform-box: fill-box;
    transform-origin: center;
    transition: opacity var(--motion-duration-normal) var(--motion-easing-standard);
  }
  .node.faded .shape {
    opacity: var(--opacity-dimmed);
  }
  .ring {
    fill: none;
    stroke: var(--color-diagram-node-stroke);
    stroke-width: var(--border-width-medium);
  }
  .cast {
    fill: var(--color-shadow-pop);
    transition: fill var(--motion-duration-fast) var(--motion-easing-standard);
  }
  /* Selected = the brand's "selected": thick ink ring + orange misregistration (never a bright stroke). */
  .node.selected .ring {
    stroke-width: var(--border-width-thick);
  }
  .node.selected .cast {
    fill: var(--color-shadow-accent);
  }
  .focus-halo {
    fill: none;
    stroke: var(--color-focus-ring);
    stroke-width: var(--border-width-thick);
    stroke-dasharray: 4 3;
    opacity: 0;
    pointer-events: none;
  }
  .node:focus-visible .focus-halo {
    opacity: 1;
  }
  .disc {
    fill: var(--color-diagram-node);
  }
  .group {
    fill: none;
    stroke-width: var(--border-width-heavy);
  }
  .initial {
    fill: var(--color-diagram-label);
    font-family: var(--font-family-display);
    font-weight: var(--font-weight-black);
    font-size: var(--font-size-md);
  }
  .label {
    fill: var(--color-diagram-label);
    font-family: var(--font-family-mono);
    font-weight: var(--font-weight-semibold);
    /* SVG text shrinks with the viewBox; counter-scale so names never drop below xs on screen. */
    font-size: max(var(--font-size-sm), calc(var(--font-size-xs) * var(--units-per-px, 1)));
    paint-order: stroke;
    stroke: var(--color-surface);
    stroke-width: var(--border-width-heavy);
  }
  .scroll {
    overflow-x: auto;
  }
</style>
