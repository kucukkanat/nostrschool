<script lang="ts">
  /**
   * Chapter 1 centerpiece: the same five friends wired four ways. Knock servers/relays
   * offline or ban Alice; the scoreboard and an aria-live narration say who lost their voice.
   */
  import { format, getDictionary, LOCALE_TAGS, type Locale } from "@nostrschool/i18n";
  import { Badge, Button, emit, pop, Tabs } from "@nostrschool/ui";
  import { edgeState, NODE_RADIUS, trimmed } from "./geometry.ts";
  import { MODEL_IDS, MODELS } from "./models.ts";
  import {
    analyze,
    type Change,
    INITIAL_STATE,
    type ModelId,
    type NodeId,
    narrate,
    type SandboxNode,
    type SandboxState,
    toggleBan,
    toggleDown,
    type UserReport,
    type Voice,
    verdictOf,
  } from "./sandbox.ts";

  interface Props {
    readonly locale: Locale;
    readonly initialModel?: ModelId;
  }
  const { locale, initialModel = "central" }: Props = $props();

  const uid = $props.id();
  const R = NODE_RADIUS;
  const t = $derived(getDictionary(locale).chapters.ch01.sandbox);
  const list = $derived(new Intl.ListFormat(LOCALE_TAGS[locale], { type: "conjunction" }));

  // Each model keeps its own damage so learners can flip tabs to compare.
  const fresh = (): Record<ModelId, SandboxState> => ({
    central: INITIAL_STATE,
    federated: INITIAL_STATE,
    nostr: INITIAL_STATE,
    bluesky: INITIAL_STATE,
  });
  // svelte-ignore state_referenced_locally
  let modelId: ModelId = $state(initialModel);
  let states = $state.raw(fresh());
  let narration = $state("");
  let pulse = $state(0);
  // Hover previews a person's audience; a click pins it (keyboard: Enter/Space).
  let hovered: NodeId | null = $state(null);
  let pinned: NodeId | null = $state(null);
  let celebrated = false;

  const model = $derived(MODELS[modelId]);
  const current = $derived(states[modelId]);
  const analysis = $derived(analyze(model, current));
  const reports = $derived(new Map(analysis.users.map((u) => [u.id, u])));
  const byId = $derived(new Map(model.nodes.map((n) => [n.id, n])));
  const verdict = $derived(verdictOf(analysis));
  const damaged = $derived(current.down.length > 0 || current.banned);
  const spotlight = $derived(hovered ?? pinned);
  const heard = $derived(
    spotlight === null ? null : new Set(reports.get(spotlight)?.audience ?? []),
  );

  const announce = (change: Change, next: SandboxState): void => {
    const a = analyze(model, next);
    narration = narrate(t, model, change, a, (names) => list.format(names));
    pulse += 1;
    // The chapter's "aha": Nostr shrugs off damage that flattens the other models.
    if (
      !celebrated &&
      modelId === "nostr" &&
      a.alivePairs === a.totalPairs &&
      change.type !== "reset"
    ) {
      celebrated = true;
      emit("celebrate", { reason: "ch01-nostr-survives" });
    } else if (change.type !== "reset" && a.alivePairs < a.totalPairs) {
      emit("warning", { reason: `ch01-${modelId}-outage` });
    }
  };

  const update = (next: SandboxState, change: Change): void => {
    states = { ...states, [modelId]: next };
    announce(change, next);
  };

  const toggleNode = (id: NodeId): void => {
    const next = toggleDown(current, id);
    update(next, { type: next.down.includes(id) ? "down" : "up", node: id });
  };
  const onNodeKey = (e: KeyboardEvent, id: NodeId): void => {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    toggleNode(id);
  };
  const ban = (): void => {
    const next = toggleBan(current);
    update(next, { type: next.banned ? "banned" : "unbanned" });
  };
  const reset = (): void => update(INITIAL_STATE, { type: "reset" });
  const switchModel = (id: string): void => {
    const found = MODEL_IDS.find((m) => m === id);
    if (found === undefined) return;
    modelId = found;
    narration = narrate(
      t,
      MODELS[found],
      { type: "model" },
      analyze(MODELS[found], states[found]),
      (n) => list.format(n),
    );
  };

  const name = (id: NodeId): string => t.nodes[id];
  const initial = (id: NodeId): string => name(id).slice(0, 1);
  const voiceTone = (v: Voice): "success" | "warning" | "danger" =>
    v === "full" ? "success" : v === "partial" ? "warning" : "danger";
  const accountText = (r: UserReport): string => {
    const a = r.account;
    const base =
      a.kind === "keys" ? t.account.keys : format(t.account[a.kind], { host: name(a.host) });
    const extraBan =
      r.bannedBy !== null && !(a.kind === "banned")
        ? ` · ${format(t.account.banned, { host: name(r.bannedBy) })}`
        : "";
    return `${base}${extraBan}`;
  };
  const others = $derived(analysis.users.length - 1);
  const healthPct = $derived((100 * analysis.alivePairs) / Math.max(1, analysis.totalPairs));
  const tabs = $derived(MODEL_IDS.map((id) => ({ id, label: t.models[id].label })));
  const nodeClass = (n: SandboxNode): string => {
    const down = current.down.includes(n.id);
    const r = reports.get(n.id);
    const voice = r === undefined ? "" : ` voice-${r.voice}`;
    const spot =
      heard === null ? "" : n.id === spotlight ? " spot" : heard.has(n.id) ? " heard" : " unheard";
    return `node ${n.role}${down ? " down" : ""}${voice}${spot}`;
  };
</script>

{#snippet infraShape(
  n: SandboxNode,
)}
  {#if n.role === "relay"}
    <circle class="body" r={R} />
    <path class="glyph" d="M-8,4 a10,10 0 0 1 16,0 M-13,-1 a17,17 0 0 1 26,0" />
    <circle class="glyph-dot" cy="7" r="3" />
  {:else}
    <rect class="body" x={-R} y={-R} width={R * 2} height={R * 2} rx={R / 3} />
    <line class="glyph" x1={-R / 2} x2={R / 2} y1={-R / 3} y2={-R / 3} />
    <line class="glyph" x1={-R / 2} x2={R / 2} y1={R / 3} y2={R / 3} />
  {/if}
  <path class="cross" d="M{-R / 2},{-R / 2} L{R / 2},{R / 2} M{R / 2},{-R / 2} L{-R / 2},{R / 2}" />
{/snippet}

<section class="sandbox" data-testid="ch01-sandbox" aria-labelledby="{uid}-title">
  <header class="head">
    <h3 id="{uid}-title" class="title">{t.title}</h3>
    <p class="lede">{t.description}</p>
    <p class="hint" id="{uid}-hint">{t.instructions}</p>
  </header>

  <Tabs testid="ch01-models" {tabs} selected={modelId} label={t.modelsLabel} onchange={switchModel}>
    {#snippet panel(
      _selected: string,
    )}
      <div class="panel" data-testid="ch01-panel" data-model={modelId}>
        <p class="tagline" data-testid="ch01-tagline">{t.models[modelId].tagline}</p>

        <div class="stage">
          <figure class="figure">
            <!-- biome-ignore lint/a11y/useSemanticElements: an <svg> cannot be a <fieldset>; the group names the diagram. -->
            <svg
              class="graph"
              viewBox="0 0 400 300"
              role="group"
              aria-label={format(t.graphLabel, { model: t.models[modelId].label })}
              aria-describedby="{uid}-hint"
              data-testid="ch01-graph"
            >
              <defs>
                <marker
                  id="{uid}-arrow"
                  viewBox="0 0 10 10"
                  refX="9"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path class="arrowhead" d="M0,0 L10,5 L0,10 z" />
                </marker>
              </defs>
              {#key pulse}
                <g class="edges">
                  {#each model.links as link (`${modelId}:${link.from}>${link.to}`)}
                    {@const a = byId.get(link.from)}
                    {@const b = byId.get(link.to)}
                    {#if a && b}
                      {@const s = trimmed(a, b, R + 2)}
                      <line
                        class="edge {edgeState(model, current, link)}"
                        data-testid="ch01-edge-{link.from}-{link.to}"
                        data-state={edgeState(model, current, link)}
                        x1={s.x1}
                        y1={s.y1}
                        x2={s.x2}
                        y2={s.y2}
                        marker-end={link.oneWay === true ? `url(#${uid}-arrow)` : undefined}
                      />
                    {/if}
                  {/each}
                </g>
              {/key}
              {#each model.nodes as n (`${modelId}:${n.id}`)}
                {@const down = current.down.includes(n.id)}
                {#if n.role === "user"}
                  {@const r = reports.get(n.id)}
                  <!-- biome-ignore lint/a11y/noInteractiveElementToNoninteractiveRole: false positive, a plain SVG <g> is not interactive. -->
                  <g
                    class={nodeClass(n)}
                    transform="translate({n.x} {n.y})"
                    data-testid="ch01-node-{n.id}"
                    data-voice={r?.voice}
                    role="img"
                    aria-label={format(t.nodeUser, {
                      name: name(n.id),
                      count: r?.audience.length ?? 0,
                      total: others,
                    })}
                  >
                    <g use:pop>
                      <g class="shape">
                        <circle class="halo" r={R + 5} />
                        <circle class="body" r={R} />
                        <text class="initial" dy="0.35em" text-anchor="middle">
                          {initial(n.id)}
                        </text>
                      </g>
                    </g>
                    <text class="label" y={R + 15} text-anchor="middle">{name(n.id)}</text>
                  </g>
                {:else}
                  <!-- biome-ignore lint/a11y/useSemanticElements: SVG has no <button>; role + key handling make the node a real button. -->
                  <g
                    class="{nodeClass(n)} toggle"
                    transform="translate({n.x} {n.y})"
                    role="button"
                    tabindex="0"
                    aria-pressed={down}
                    aria-label={format(t.nodeButton, {
                      name: name(n.id),
                      role: t.roles[n.role],
                      state: down ? t.down : t.up,
                    })}
                    data-testid="ch01-node-{n.id}"
                    data-state={down ? "down" : "up"}
                    onclick={() => toggleNode(n.id)}
                    onkeydown={(e) => onNodeKey(e, n.id)}
                  >
                    <!-- A dedicated ring outside .shape: the body stroke is already primary (= focus-ring), so recolouring it was invisible (WCAG 2.4.7). -->
                    {#if n.role === "relay"}
                      <circle class="focus-halo" data-testid="ch01-node-{n.id}-focus" r={R + 7} />
                    {:else}
                      <rect
                        class="focus-halo"
                        data-testid="ch01-node-{n.id}-focus"
                        x={-R - 7}
                        y={-R - 7}
                        width={(R + 7) * 2}
                        height={(R + 7) * 2}
                        rx={R / 2}
                      />
                    {/if}
                    <g use:pop><g class="shape">{@render infraShape(n)}</g></g>
                    <text class="label" y={R + 15} text-anchor="middle">{name(n.id)}</text>
                  </g>
                {/if}
              {/each}
            </svg>
          </figure>

          <div class="side">
            <div class="health" data-testid="ch01-health" data-alive={analysis.alivePairs}>
              <div class="health-row">
                <span class="health-label">{t.health}</span>
                <strong class="health-value" data-testid="ch01-health-value">
                  {format(t.healthValue, {
                    alive: analysis.alivePairs,
                    total: analysis.totalPairs,
                  })}
                </strong>
              </div>
              <div class="meter" aria-hidden="true">
                <div class="meter-fill verdict-{verdict}" style:inline-size="{healthPct}%"></div>
              </div>
              {#key verdict}
                <p class="verdict verdict-{verdict}" data-testid="ch01-verdict" use:pop>
                  {damaged || verdict !== "allGood" ? t.verdict[verdict] : t.narration.start}
                </p>
              {/key}
            </div>

            <h4 class="board-title">{t.scoreboard}</h4>
            <ul class="board" data-testid="ch01-scoreboard">
              {#each analysis.users as r (r.id)}
                <li
                  class="row voice-{r.voice}"
                  data-testid="ch01-user-{r.id}"
                  data-voice={r.voice}
                  data-audience={r.audience.length}
                >
                  <button
                    type="button"
                    class="who"
                    data-testid="ch01-user-{r.id}-spotlight"
                    aria-pressed={pinned === r.id}
                    onpointerenter={() => (hovered = r.id)}
                    onpointerleave={() => (hovered = null)}
                    onclick={() => (pinned = pinned === r.id ? null : r.id)}
                  >
                    <span class="avatar" aria-hidden="true">{initial(r.id)}</span>
                    <span class="who-name">{name(r.id)}</span>
                  </button>
                  <span class="badge">
                    <Badge testid="ch01-user-{r.id}-voice" tone={voiceTone(r.voice)} size="sm">
                      {t.status[r.voice]}
                    </Badge>
                  </span>
                  <span class="bar" aria-hidden="true">
                    <span
                      class="bar-fill"
                      style:inline-size="{(100 * r.audience.length) / Math.max(1, others)}%"
                    ></span>
                  </span>
                  <span class="reach"
                    >{format(t.audience, { count: r.audience.length, total: others })}</span
                  >
                  <span class="account" data-testid="ch01-user-{r.id}-account"
                    >{accountText(r)}</span
                  >
                </li>
              {/each}
            </ul>

            <div class="controls">
              <Button
                testid="ch01-ban"
                variant="danger"
                size="sm"
                pressed={current.banned}
                onclick={ban}
              >
                {current.banned ? t.unban : t.ban}
              </Button>
              <Button
                testid="ch01-reset"
                variant="ghost"
                size="sm"
                disabled={!damaged}
                onclick={reset}
              >
                {t.reset}
              </Button>
            </div>
            {#if current.banned}
              <p class="ban-hint" data-testid="ch01-ban-hint" use:pop>
                {format(t.banHint, { host: name(model.banAuthority) })}
              </p>
            {/if}
          </div>
        </div>
      </div>
    {/snippet}
  </Tabs>

  <p class="narration" data-testid="ch01-narration" aria-live="polite" aria-atomic="true">
    {narration === "" ? t.narration.start : narration}
  </p>
</section>

<style>
  .sandbox {
    display: grid;
    gap: var(--space-md);
    min-height: var(--size-diagram-min-height);
    padding: var(--space-lg);
    border: var(--border-width-thick) solid var(--color-border-strong);
    border-radius: var(--radius-xl);
    background: var(--color-surface);
    box-shadow: var(--shadow-pop);
  }
  .head {
    display: grid;
    gap: var(--space-2xs);
  }
  .title {
    margin: 0;
    font-family: var(--font-family-display);
    font-size: var(--font-size-xl);
    color: var(--color-text-primary);
  }
  .lede,
  .hint,
  .tagline {
    margin: 0;
  }
  .hint {
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
  }
  .panel {
    display: grid;
    gap: var(--space-sm);
  }
  .tagline {
    font-weight: var(--font-weight-semibold);
  }
  .stage {
    display: grid;
    gap: var(--space-md);
  }
  /* 768px = tokens.breakpoint.md */
  @media (min-width: 768px) {
    .stage {
      grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
      align-items: start;
    }
  }
  .figure {
    margin: 0;
    padding: var(--space-xs);
    border-radius: var(--radius-lg);
    background: var(--color-surface-sunken);
  }
  .graph {
    display: block;
    width: 100%;
    height: auto;
    overflow: visible;
  }

  .edge {
    stroke: var(--color-diagram-edge);
    stroke-width: var(--border-width-thick);
    stroke-linecap: round;
    transition: stroke var(--motion-duration-normal) var(--motion-easing-standard);
  }
  /* One-shot "data is flowing" pulse after every change; no endless motion (WCAG 2.2.2). */
  .edge.live {
    stroke: var(--color-diagram-edge-active);
    stroke-dasharray: 6 6;
    animation: flow var(--motion-duration-slower) linear 3;
  }
  .edge.dead {
    stroke: var(--color-diagram-edge-dead);
    stroke-dasharray: 2 8;
    opacity: var(--opacity-muted);
  }
  .edge.banned {
    stroke: var(--color-danger);
    stroke-dasharray: 10 6;
  }
  @keyframes flow {
    to {
      stroke-dashoffset: -24;
    }
  }
  .arrowhead {
    fill: var(--color-diagram-edge-active);
  }

  .shape {
    transform-box: fill-box;
    transform-origin: center;
    transition:
      transform var(--motion-duration-slow) var(--motion-easing-bounce),
      opacity var(--motion-duration-normal) var(--motion-easing-standard);
  }
  .body {
    fill: var(--color-diagram-node);
    stroke: var(--color-diagram-node-stroke);
    stroke-width: var(--border-width-thick);
    transition:
      fill var(--motion-duration-normal) var(--motion-easing-standard),
      stroke var(--motion-duration-normal) var(--motion-easing-standard);
  }
  .server .body {
    fill: var(--color-primary-subtle);
  }
  .relay .body {
    fill: var(--color-secondary-subtle);
  }
  .glyph {
    fill: none;
    stroke: var(--color-diagram-node-stroke);
    stroke-width: var(--border-width-medium);
    stroke-linecap: round;
  }
  .glyph-dot {
    fill: var(--color-diagram-node-stroke);
  }
  .cross {
    stroke: var(--color-diagram-node-down-stroke);
    stroke-width: var(--border-width-heavy);
    stroke-linecap: round;
    opacity: 0;
    transition: opacity var(--motion-duration-fast) var(--motion-easing-standard);
  }
  .down .shape {
    transform: scale(0.82) rotate(-10deg);
  }
  .down .body {
    fill: var(--color-diagram-node-down);
    stroke: var(--color-diagram-node-down-stroke);
  }
  .down .cross {
    opacity: 1;
  }
  .user .body {
    fill: var(--color-primary);
    stroke: var(--color-primary-active);
  }
  .initial {
    fill: var(--color-on-primary);
    font-family: var(--font-family-display);
    font-weight: var(--font-weight-bold);
    font-size: var(--font-size-md);
  }
  .halo {
    fill: none;
    stroke-width: var(--border-width-thick);
    stroke: var(--color-success);
    transition: stroke var(--motion-duration-normal) var(--motion-easing-standard);
  }
  .voice-partial .halo {
    stroke: var(--color-warning);
  }
  .user.voice-silenced .shape {
    opacity: var(--opacity-dimmed);
    transform: scale(0.9);
  }
  .user.voice-silenced .halo {
    stroke: var(--color-danger);
    stroke-dasharray: 3 4;
  }
  .node.spot .shape,
  .node.heard .shape {
    transform: scale(1.12);
  }
  .node.unheard .shape {
    opacity: var(--opacity-dimmed);
  }
  .toggle {
    cursor: pointer;
  }
  .toggle:hover:not(.down) .shape {
    transform: scale(1.08);
  }
  .toggle:focus {
    outline: none;
  }
  .focus-halo {
    fill: none;
    stroke: var(--color-focus-ring);
    stroke-width: var(--border-width-thick);
    stroke-dasharray: 4 3;
    opacity: 0;
    pointer-events: none;
  }
  .toggle:focus-visible .focus-halo {
    opacity: 1;
  }

  .label {
    fill: var(--color-diagram-label);
    font-family: var(--font-family-display);
    font-weight: var(--font-weight-bold);
    font-size: var(--font-size-sm);
  }

  .side {
    display: grid;
    gap: var(--space-sm);
    align-content: start;
  }
  .health {
    display: grid;
    gap: var(--space-2xs);
    padding: var(--space-sm);
    border-radius: var(--radius-lg);
    background: var(--color-surface-raised);
    border: var(--border-width-medium) solid var(--color-border);
  }
  .health-row {
    display: flex;
    justify-content: space-between;
    gap: var(--space-xs);
    flex-wrap: wrap;
  }
  .health-label {
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
  }
  .health-value {
    font-family: var(--font-family-display);
  }
  .meter,
  .bar {
    display: block;
    block-size: var(--space-xs);
    border-radius: var(--radius-pill);
    background: var(--color-surface-sunken);
    overflow: hidden;
  }
  .meter-fill,
  .bar-fill {
    display: block;
    block-size: 100%;
    border-radius: inherit;
    background: var(--color-success-solid);
    transition: inline-size var(--motion-duration-slow) var(--motion-easing-bounce);
  }
  .meter-fill.verdict-degraded,
  .voice-partial .bar-fill {
    background: var(--color-warning);
  }
  .meter-fill.verdict-collapsed,
  .voice-silenced .bar-fill {
    background: var(--color-danger);
  }
  .verdict {
    margin: 0;
    font-weight: var(--font-weight-semibold);
    font-size: var(--font-size-sm);
  }
  .board-title {
    margin: 0;
    font-family: var(--font-family-display);
    font-size: var(--font-size-md);
  }
  .board {
    display: grid;
    gap: var(--space-2xs);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: var(--space-3xs) var(--space-xs);
    align-items: center;
    padding: var(--space-xs) var(--space-sm);
    border-radius: var(--radius-md);
    background: var(--color-surface-raised);
    transition: background var(--motion-duration-normal) var(--motion-easing-standard);
  }
  .row.voice-silenced {
    background: var(--color-danger-subtle);
  }
  .who {
    display: inline-flex;
    align-items: center;
    gap: var(--space-xs);
    min-block-size: var(--size-touch-target);
    padding: 0;
    border: 0;
    background: none;
    color: inherit;
    font: inherit;
    font-weight: var(--font-weight-bold);
    cursor: pointer;
    justify-self: start;
  }
  .who:focus-visible {
    outline: var(--border-width-thick) solid var(--color-focus-ring);
    outline-offset: var(--space-3xs);
    border-radius: var(--radius-sm);
  }
  .avatar {
    display: inline-grid;
    place-items: center;
    inline-size: var(--size-avatar-sm);
    block-size: var(--size-avatar-sm);
    border-radius: var(--radius-round);
    background: var(--color-primary);
    color: var(--color-on-primary);
    font-family: var(--font-family-display);
  }
  .bar {
    grid-column: 1 / -1;
  }
  .reach,
  .account {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
  }
  .account {
    text-align: end;
  }
  .controls {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-xs);
  }
  .ban-hint {
    margin: 0;
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
  }
  .narration {
    margin: 0;
    padding: var(--space-sm) var(--space-md);
    border-radius: var(--radius-md);
    background: var(--color-info-subtle);
    color: var(--color-text);
    font-size: var(--font-size-sm);
  }
</style>
