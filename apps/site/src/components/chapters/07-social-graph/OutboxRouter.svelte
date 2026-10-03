<script lang="ts">
  import { getPersona, PERSONAS, type PersonaId } from "@nostrschool/fixtures";
  import { format, getDictionary, type Locale } from "@nostrschool/i18n";
  import type { RelayUrl } from "@nostrschool/protocol";
  import { tokens } from "@nostrschool/tokens";
  import {
    CodeBlock,
    duration,
    emit,
    PlaybackControls,
    $reducedMotion as reducedMotion,
    Stepper,
  } from "@nostrschool/ui";
  import {
    type Endpoint,
    followsOf,
    framesUpTo,
    INDEXER,
    OUTBOX_MODES,
    type OutboxMode,
    outboxScene,
    RELAY_URLS,
    relayName,
    STEPS,
  } from "./outbox.ts";
  import { isPersonaId, listNames } from "./social.ts";

  const { locale }: { readonly locale: Locale } = $props();
  const t = $derived(getDictionary(locale).chapters.ch07.outbox);

  let viewer = $state<PersonaId>("erin");
  let mode = $state<OutboxMode>("outbox");
  let singleRelay = $state<RelayUrl>(INDEXER);
  let recipientPick = $state<PersonaId>("carol");
  let step = $state(0);
  let playing = $state(false);

  const follows = $derived(followsOf(viewer));
  const recipient = $derived(
    follows.includes(recipientPick) ? recipientPick : (follows[0] ?? recipientPick),
  );
  const input = $derived({ viewer, mode, singleRelay, recipient });
  const names = (list: readonly string[]): string => listNames(locale, list, "—");
  const scene = $derived(outboxScene(input, step, names));
  const total = $derived(STEPS[mode].length);
  const frames = $derived(
    framesUpTo(input, step, format(t.replyContent, { name: getPersona(recipient).displayName })),
  );
  const narration = $derived(format(t.narration[scene.narration.key], scene.narration.params));

  const reset = (): void => {
    step = 0;
    playing = false;
  };

  // The controls own no timer (by design): we advance while playing, and stop at the end.
  $effect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      if (step >= total - 1) playing = false;
      else step += 1;
    }, tokens.motion.duration.step);
    return () => clearInterval(id);
  });

  // Celebrate the moment the outbox model delivers everyone's notes.
  $effect(() => {
    if (scene.step === "notes" && mode === "outbox")
      emit("celebrate", { reason: "ch07-outbox-complete" });
  });

  /* ---------- geometry (viewBox units) ---------- */
  const W = 640;
  const H = 420;
  const APP = { x: 84, y: H / 2 };
  const RELAY_X = 330;
  const PEOPLE_X = 560;
  const relayY = (i: number): number => 60 + i * ((H - 120) / Math.max(1, RELAY_URLS.length - 1));
  const personY = (i: number, n: number): number => (H / (n + 1)) * (i + 1);
  const relayPos = $derived(new Map(RELAY_URLS.map((r, i) => [r, { x: RELAY_X, y: relayY(i) }])));
  const peoplePos = $derived(
    new Map(follows.map((p, i) => [p, { x: PEOPLE_X, y: personY(i, follows.length) }])),
  );
  const pos = (e: Endpoint | PersonaId): { x: number; y: number } =>
    e === "app" ? APP : isPersonaId(e) ? (peoplePos.get(e) ?? APP) : (relayPos.get(e) ?? APP);
  const RELAY_W = 104;
  const RELAY_H = 44;

  /** Packets fly from `from` to `to`; replies (relay → app) wait for the request to land. */
  const fly = (
    node: SVGElement,
    p: { from: { x: number; y: number }; to: { x: number; y: number }; delay: number },
  ) => {
    const ms = duration("packet");
    // No cleanup: removing the element (on the next step) drops its animation with it;
    // cancel() would reject `finished`, which nobody awaits.
    node.animate?.(
      [
        { transform: `translate(${p.from.x}px, ${p.from.y}px) scale(0.4)`, opacity: 0 },
        { transform: `translate(${p.from.x}px, ${p.from.y}px) scale(1)`, opacity: 1, offset: 0.1 },
        { transform: `translate(${p.to.x}px, ${p.to.y}px) scale(1)`, opacity: 1, offset: 0.9 },
        { transform: `translate(${p.to.x}px, ${p.to.y}px) scale(0.4)`, opacity: 0 },
      ],
      { duration: ms, delay: p.delay, easing: "ease-in-out", fill: "both" },
    );
  };
  // Bumps on every scene change so {#key} remounts packets and replays their flight.
  const run = $derived(`${mode}-${viewer}-${singleRelay}-${recipient}-${step}`);

  const MODE_LABEL = $derived({
    outbox: t.modes.outbox,
    reply: t.modes.reply,
    single: t.modes.single,
  });
</script>

<section class="router" data-testid="ch07-outbox" aria-labelledby="ch07-outbox-heading">
  <header class="head">
    <h3 id="ch07-outbox-heading">{t.title}</h3>
    <p class="desc">{t.description}</p>
  </header>

  <div class="controls">
    <label class="field">
      <span>{t.viewerLabel}</span>
      <select
        data-testid="ch07-viewer"
        value={viewer}
        onchange={(e) => {
          const v = e.currentTarget.value;
          if (isPersonaId(v)) viewer = v;
          reset();
        }}
      >
        {#each PERSONAS as p (p.id)}
          <option value={p.id}>{p.displayName}</option>
        {/each}
      </select>
    </label>

    <fieldset class="modes" data-testid="ch07-modes">
      <legend class="visually-hidden">{t.modeLabel}</legend>
      {#each OUTBOX_MODES as m (m)}
        <button
          type="button"
          class="mode"
          aria-pressed={mode === m}
          data-testid="ch07-mode-{m}"
          onclick={() => {
            mode = m;
            reset();
          }}
        >
          {MODE_LABEL[m]}
        </button>
      {/each}
    </fieldset>

    {#if mode === "single"}
      <label class="field">
        <span>{t.singleRelayLabel}</span>
        <select
          data-testid="ch07-single-relay"
          value={singleRelay}
          onchange={(e) => {
            singleRelay = e.currentTarget.value;
            reset();
          }}
        >
          {#each RELAY_URLS as r (r)}
            <option value={r}>{relayName(r)}</option>
          {/each}
        </select>
      </label>
    {:else if mode === "reply"}
      <label class="field">
        <span>{t.recipientLabel}</span>
        <select
          data-testid="ch07-recipient"
          value={recipient}
          onchange={(e) => {
            const v = e.currentTarget.value;
            if (isPersonaId(v)) recipientPick = v;
            reset();
          }}
        >
          {#each follows as f (f)}
            <option value={f}>{getPersona(f).displayName}</option>
          {/each}
        </select>
      </label>
    {/if}
  </div>

  <div class="map" data-testid="ch07-map" data-mode={mode} data-step={scene.step}>
    <svg
      viewBox="0 0 {W} {H}"
      role="img"
      aria-label={t.title}
      aria-describedby="ch07-outbox-narration"
    >
      <defs>
        <clipPath id="ch07-avatar-clip"><circle r="20" /></clipPath>
      </defs>

      {#each scene.edges as e (e.id)}
        {@const a = pos(e.from)}
        {@const b = pos(e.to)}
        {@const bx = e.kind === "link" ? b.x - RELAY_W / 2 : b.x + RELAY_W / 2}
        <line
          class="edge {e.kind}"
          data-testid="ch07-edge-{e.id}"
          x1={e.from === "app" ? a.x + 34 : a.x - 22}
          y1={a.y}
          x2={bx}
          y2={b.y}
          pathLength="1"
        />
      {/each}

      <g class="app" data-testid="ch07-app" transform="translate({APP.x} {APP.y})">
        <rect x="-34" y="-52" width="68" height="104" rx="14" class="phone" />
        <g transform="translate(0 -14)">
          <image
            href={getPersona(viewer).avatar}
            x="-20"
            y="-20"
            width="40"
            height="40"
            clip-path="url(#ch07-avatar-clip)"
          />
        </g>
        <text y="74" text-anchor="middle" class="label">
          {format(t.app, { name: getPersona(viewer).displayName })}
        </text>
      </g>

      {#each scene.relays as r (r.url)}
        {@const p = pos(r.url)}
        <g
          class="relay {r.state}"
          data-testid="ch07-relay-{relayName(r.url).toLowerCase()}"
          data-state={r.state}
          transform="translate({p.x} {p.y})"
        >
          <rect x={-RELAY_W / 2} y={-RELAY_H / 2} width={RELAY_W} height={RELAY_H} rx="12" />
          <text text-anchor="middle" dominant-baseline="central" class="relay-name">
            {relayName(r.url)}
          </text>
          {#if r.url === INDEXER && mode !== "single"}
            <text y={RELAY_H / 2 + 14} text-anchor="middle" class="tiny">{t.lookups}</text>
          {/if}
          {#if r.authors.length > 0}
            <g transform="translate({RELAY_W / 2 - 4} {-RELAY_H / 2 + 4})" class="count">
              <circle r="11" />
              <text text-anchor="middle" dominant-baseline="central">{r.authors.length}</text>
            </g>
          {/if}
        </g>
      {/each}

      {#each scene.people as person (person.id)}
        {@const p = pos(person.id)}
        <g
          class="person {person.state}"
          data-testid="ch07-person-node-{person.id}"
          data-state={person.state}
          transform="translate({p.x} {p.y})"
        >
          <circle r="23" class="halo" />
          <image
            href={getPersona(person.id).avatar}
            x="-20"
            y="-20"
            width="40"
            height="40"
            clip-path="url(#ch07-avatar-clip)"
          />
          <text x="30" dominant-baseline="central" class="label">
            {getPersona(person.id).displayName}
          </text>
          {#if person.state === "reached"}
            <path class="mark ok" d="M-6 0 l4 5 l9 -11" transform="translate(16 -16)" />
          {:else if person.state === "missed"}
            <path class="mark bad" d="M-5 -5 l10 10 M5 -5 l-10 10" transform="translate(16 -16)" />
          {/if}
        </g>
      {/each}

      {#if !$reducedMotion}
        {#key run}
          {#each scene.packets as pk (pk.id)}
            <circle
              class="packet {pk.type}"
              r="8"
              cx="0"
              cy="0"
              use:fly={{
                from: pos(pk.from),
                to: pos(pk.to),
                delay:
                  pk.type === "event" &&
                  pk.from !== "app" &&
                  scene.packets.some((q) => q.type === "req")
                    ? duration("packet")
                    : 0,
              }}
            />
          {/each}
        {/key}
      {/if}
    </svg>

    <ul class="legend" aria-hidden="true">
      <li><span class="swatch write"></span>{t.legendWrite}</li>
      <li><span class="swatch read"></span>{t.legendRead}</li>
      <li><span class="swatch link"></span>{t.legendLink}</li>
    </ul>
  </div>

  <p id="ch07-outbox-narration" class="narration" data-testid="ch07-narration" aria-live="polite">
    {narration}
  </p>

  <Stepper
    testid="ch07-steps"
    {locale}
    steps={STEPS[mode].map((id) => ({ id, label: t.steps[id] }))}
    bind:current={step}
  />
  <PlaybackControls testid="ch07-playback" {locale} bind:step bind:playing totalSteps={total} />

  <div class="stats">
    <span class="stat" data-testid="ch07-contacted">
      {format(t.connections, { count: scene.contacted.length })}
    </span>
    {#if mode === "outbox"}
      <span class="stat" data-testid="ch07-minimal"
        >{format(t.minimal, { count: scene.minimal })}</span
      >
    {/if}
    {#if scene.step === "notes"}
      <span
        class="stat coverage"
        class:bad={scene.missed.length > 0}
        data-testid="ch07-coverage"
        data-reached={scene.reached.length}
      >
        {format(t.coverage, { reached: scene.reached.length, total: follows.length })}
      </span>
    {/if}
  </div>

  <ul class="relays" data-testid="ch07-relay-cards">
    {#each scene.relays as r (r.url)}
      <li
        class="relay-card {r.state}"
        data-testid="ch07-relay-card-{relayName(r.url).toLowerCase()}"
      >
        <strong>{relayName(r.url)}</strong>
        <span>
          {r.state === "publish"
            ? t.relayPublish
            : r.authors.length > 0
              ? format(t.relayAsks, {
                  list: listNames(
                    locale,
                    r.authors.map((a) => getPersona(a).displayName),
                    "—",
                  ),
                })
              : t.relayIdle}
        </span>
      </li>
    {/each}
  </ul>

  <ul class="visually-hidden" data-testid="ch07-roster">
    {#each scene.people as person (person.id)}
      <li data-state={person.state}>
        {format(
          person.state === "reached"
            ? t.personReached
            : person.state === "missed"
              ? t.personMissed
              : t.personWaiting,
          { name: getPersona(person.id).displayName },
        )}
      </li>
    {/each}
  </ul>

  <div class="frames">
    <h4>{t.framesTitle}</h4>
    {#if frames.length > 0}
      <CodeBlock testid="ch07-frames" {locale} code={frames.join("\n\n")} lang="js" />
    {:else}
      <p class="empty" data-testid="ch07-frames-empty">{t.framesEmpty}</p>
    {/if}
  </div>
</section>

<style>
  .router {
    display: grid;
    gap: var(--space-md);
    padding: var(--space-md);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-lg);
    background: var(--color-surface);
    box-shadow: var(--shadow-pop);
  }
  .head h3 {
    margin: 0;
    font-family: var(--font-family-display);
    font-size: var(--font-size-xl);
  }
  .desc {
    margin: var(--space-2xs) 0 0;
    color: var(--color-text-muted);
  }
  .controls {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-sm);
    align-items: end;
  }
  .field {
    display: grid;
    gap: var(--space-3xs);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
  }
  select {
    min-height: var(--size-touch-target);
    padding: 0 var(--space-sm);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-md);
    background: var(--color-surface-raised);
    color: var(--color-text);
    font: inherit;
    font-size: var(--font-size-md);
  }
  select:focus-visible,
  .mode:focus-visible {
    outline: var(--border-width-thick) solid var(--color-focus-ring);
    outline-offset: var(--space-3xs);
  }
  .modes {
    margin: 0;
    padding: 0;
    border: 0;
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2xs);
  }
  .mode {
    min-height: var(--size-touch-target);
    padding: var(--space-2xs) var(--space-md);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-md);
    background: var(--color-surface-raised);
    color: var(--color-text);
    font: inherit;
    font-weight: var(--font-weight-bold);
    cursor: pointer;
    transition:
      background var(--motion-duration-fast) var(--motion-easing-standard),
      transform var(--motion-duration-fast) var(--motion-easing-bounce);
  }
  .mode:hover {
    transform: translateY(calc(-1 * var(--space-3xs)));
  }
  .mode[aria-pressed="true"] {
    background: var(--color-primary);
    box-shadow: var(--shadow-accent);
    color: var(--color-on-primary);
  }
  .map {
    min-height: var(--size-diagram-min-height);
    border-radius: var(--radius-lg);
    background: var(--color-surface-sunken);
    padding: var(--space-xs);
  }
  svg {
    display: block;
    width: 100%;
    height: auto;
  }
  .edge {
    stroke-width: var(--border-width-medium);
    fill: none;
  }
  .edge.write {
    stroke: var(--color-diagram-edge);
    stroke-dasharray: 1;
    animation: draw var(--motion-duration-slow) var(--motion-easing-decelerate) both;
  }
  .edge.read {
    stroke: var(--color-text-accent);
    stroke-dasharray: 0.03 0.03;
    animation: fade var(--motion-duration-slow) var(--motion-easing-standard) both;
  }
  .edge.link {
    stroke: var(--color-diagram-edge-active);
    stroke-width: var(--border-width-heavy);
    stroke-dasharray: 1;
    animation: draw var(--motion-duration-slow) var(--motion-easing-emphasized) both;
  }
  @keyframes draw {
    from {
      stroke-dashoffset: 1;
    }
    to {
      stroke-dashoffset: 0;
    }
  }
  @keyframes fade {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  .phone {
    fill: var(--color-surface-raised);
    stroke: var(--color-text-primary);
    stroke-width: var(--border-width-heavy);
  }
  .label {
    fill: var(--color-diagram-label);
    font-family: var(--font-family-display);
    font-weight: var(--font-weight-bold);
    font-size: var(--font-size-md);
  }
  .tiny {
    fill: var(--color-text-muted);
    font-size: var(--font-size-sm);
  }
  .relay rect {
    fill: var(--color-diagram-node);
    stroke: var(--color-diagram-node-stroke);
    stroke-width: var(--border-width-medium);
    transition:
      fill var(--motion-duration-normal) var(--motion-easing-standard),
      stroke var(--motion-duration-normal) var(--motion-easing-standard);
  }
  .relay-name {
    fill: var(--color-diagram-label);
    font-family: var(--font-family-display);
    font-weight: var(--font-weight-black);
    font-size: var(--font-size-lg);
  }
  .relay.lookup rect {
    stroke: var(--color-info);
    stroke-width: var(--border-width-heavy);
  }
  .relay.planned rect {
    stroke: var(--color-text-secondary);
    stroke-width: var(--border-width-heavy);
  }
  .relay.active rect,
  .relay.publish rect {
    fill: var(--color-primary-subtle);
    stroke: var(--color-text-primary);
    stroke-width: var(--border-width-heavy);
  }
  .count circle {
    fill: var(--color-secondary);
    stroke: var(--color-border-strong);
    stroke-width: var(--border-width-medium);
  }
  .count text {
    fill: var(--color-on-secondary);
    font-weight: var(--font-weight-black);
    font-size: var(--font-size-sm);
  }
  .halo {
    fill: var(--color-surface);
    stroke: var(--color-diagram-node-stroke);
    stroke-width: var(--border-width-medium);
    transition: stroke var(--motion-duration-normal) var(--motion-easing-standard);
  }
  /* Dim the picture, never the name: text keeps full contrast. */
  .person.idle image,
  .person.idle .halo {
    opacity: var(--opacity-muted);
  }
  .person.reached .halo {
    stroke: var(--color-success);
    stroke-width: var(--border-width-heavy);
  }
  .person.missed .halo {
    stroke: var(--color-danger);
    stroke-width: var(--border-width-heavy);
  }
  .person.target .halo {
    stroke: var(--color-text-accent);
    stroke-width: var(--border-width-heavy);
  }
  .mark {
    fill: none;
    stroke-width: var(--border-width-heavy);
    stroke-linecap: round;
  }
  .mark.ok {
    stroke: var(--color-success);
  }
  .mark.bad {
    stroke: var(--color-danger);
  }
  .packet.req {
    fill: var(--color-packet-req);
  }
  .packet.event {
    fill: var(--color-packet-event);
  }
  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-md);
    margin: var(--space-xs) 0 0;
    padding: 0;
    list-style: none;
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
  }
  .legend li {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2xs);
  }
  .swatch {
    display: inline-block;
    width: var(--space-lg);
    border-top: var(--border-width-thick) solid var(--color-diagram-edge);
  }
  .swatch.read {
    border-top-style: dashed;
    border-top-color: var(--color-text-accent);
  }
  .swatch.link {
    border-top-color: var(--color-diagram-edge-active);
  }
  .narration {
    margin: 0;
    min-height: calc(var(--font-size-md) * 3);
    padding: var(--space-sm) var(--space-md);
    border-left: var(--border-width-heavy) solid var(--color-text-primary);
    border-radius: var(--radius-sm);
    background: var(--color-primary-subtle);
    font-weight: var(--font-weight-semibold);
  }
  .stats {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-xs);
  }
  .stat {
    padding: var(--space-3xs) var(--space-sm);
    border-radius: var(--radius-pill);
    background: var(--color-surface-sunken);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-bold);
  }
  .coverage {
    background: var(--color-success-subtle);
  }
  .coverage.bad {
    background: var(--color-danger-subtle);
  }
  .relays {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 9rem), 1fr));
    gap: var(--space-xs);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .relay-card {
    display: grid;
    gap: var(--space-3xs);
    padding: var(--space-xs) var(--space-sm);
    border: var(--border-width-medium) solid var(--color-border);
    border-radius: var(--radius-md);
    font-size: var(--font-size-sm);
    transition: border-color var(--motion-duration-normal) var(--motion-easing-standard);
  }
  .relay-card.active,
  .relay-card.publish,
  .relay-card.planned {
    border-color: var(--color-border-strong);
    box-shadow: var(--shadow-accent);
  }
  .frames h4 {
    margin: 0 0 var(--space-xs);
    font-family: var(--font-family-display);
  }
  .empty {
    margin: 0;
    color: var(--color-text-muted);
  }
</style>
