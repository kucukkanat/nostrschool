<script lang="ts">
  /**
   * Sends the current filter in a real REQ through the shared DataSource: simulated fixture
   * relays by default, real relays when the global live mode is on (read-only, capped limit).
   */
  import {
    type DataSource,
    getDataSource,
    $liveMode as liveMode,
    type Subscription,
  } from "@nostrschool/data";
  import { format, getDictionary, type Locale, plural } from "@nostrschool/i18n";
  import type { Filter } from "@nostrschool/protocol";
  import { Badge, pop } from "@nostrschool/ui";
  import { eventPreview, kindLabel, pubkeyLabel, withSafeLimit } from "./filter-logic.ts";
  import { IDLE, LIVE_LIMIT, type RunAction, relayHost, runReducer } from "./runner-logic.ts";

  interface Props {
    readonly locale: Locale;
    readonly filter: Filter;
    /** Parts: `-mode -send -stop -status -safe-limit -frames -frame-<seq> -results -result-<id> -error`. */
    readonly testid?: string;
    /** Defaults to `getDataSource()` at send time (follows live mode). */
    readonly source?: DataSource;
  }

  const { locale, filter, testid = "ch05-runner", source }: Props = $props();
  const t = $derived(getDictionary(locale).chapters.ch05.runner);

  let live = $state(false);
  $effect(() =>
    liveMode.subscribe((v) => {
      live = v;
    }),
  );
  const mode = $derived(source?.mode ?? (live ? "live" : "fixture"));
  const sent = $derived(mode === "live" ? withSafeLimit(filter, LIVE_LIMIT) : filter);

  let run = $state(IDLE);
  let sub: Subscription | undefined;
  const dispatch = (action: RunAction) => {
    run = runReducer(run, action);
  };

  const stop = () => {
    sub?.close();
    sub = undefined;
    dispatch({ type: "close" });
  };

  const send = () => {
    sub?.close();
    dispatch({ type: "start" });
    sub = (source ?? getDataSource()).subscribe([sent], {
      onEvent: (event, relay) => dispatch({ type: "event", event, relay }),
      onRawMessage: (direction, relay, raw) => dispatch({ type: "frame", direction, relay, raw }),
      onError: (error) => dispatch({ type: "error", error }),
      onAllEose: () => dispatch({ type: "all-eose" }),
    });
  };

  // Never leave a socket subscription open after the island goes away.
  $effect(() => () => sub?.close());

  const statusText = $derived(
    run.status === "running"
      ? t.running
      : run.status === "done"
        ? t.done
        : run.status === "closed"
          ? t.closed
          : t.framesEmpty,
  );
</script>

<section class="runner" data-testid={testid} data-status={run.status} data-mode={mode}>
  <div class="head">
    <h2 class="title">{t.title}</h2>
    <span data-testid="{testid}-mode">
      <Badge tone={mode === "live" ? "live" : "primary"}
        >{mode === "live" ? t.modeLive : t.modeFixture}</Badge
      >
    </span>
  </div>
  <p class="desc">{t.description}</p>
  {#if mode === "live" && sent !== filter}
    <p class="note" data-testid="{testid}-safe-limit">
      {format(t.safeLimit, { limit: LIVE_LIMIT })}
    </p>
  {/if}

  <div class="actions">
    <button type="button" class="send" data-testid="{testid}-send" onclick={send}>{t.send}</button>
    <button
      type="button"
      class="stop"
      data-testid="{testid}-stop"
      disabled={run.status !== "running" && run.status !== "done"}
      onclick={stop}
    >
      {t.stop}
    </button>
  </div>
  <p class="status" aria-live="polite" data-testid="{testid}-status">
    {statusText}
    {#if run.status !== "idle"}
      · {plural(locale, run.received.length, t.results)}
    {/if}
  </p>

  {#each run.errors as error, i (i)}
    <p class="error" data-testid="{testid}-error">
      {format(t.error, { relay: relayHost(error.relayUrl), message: error.message })}
    </p>
  {/each}

  <div class="panes">
    <div class="pane">
      <h3 class="sub">{t.framesTitle}</h3>
      <ol class="frames" data-testid="{testid}-frames">
        {#each run.frames as frame (frame.seq)}
          <li
            class="frame"
            data-dir={frame.direction}
            data-type={frame.type}
            data-testid="{testid}-frame-{frame.seq}"
            use:pop
          >
            <span class="arrow" aria-hidden="true">{frame.direction === "out" ? "→" : "←"}</span>
            <span class="type">{frame.type}</span>
            <span class="host">{relayHost(frame.relay)}</span>
            <code class="raw">{frame.raw}</code>
          </li>
        {:else}
          <li class="empty">{t.framesEmpty}</li>
        {/each}
      </ol>
    </div>
    <div class="pane">
      <h3 class="sub">{plural(locale, run.received.length, t.results)}</h3>
      <ul class="results" data-testid="{testid}-results">
        {#each run.received as item (item.event.id)}
          <li class="result" data-testid="{testid}-result-{item.event.id}" use:pop>
            <strong>{pubkeyLabel(item.event.pubkey)}</strong>
            <span class="meta">{item.event.kind} · {kindLabel(locale, item.event.kind)}</span>
            <span class="text">{eventPreview(locale, item.event)}</span>
            <span class="meta"
              >{format(t.from, { relay: item.relays.map(relayHost).join(", ") })}</span
            >
          </li>
        {/each}
      </ul>
    </div>
  </div>
</section>

<style>
  .runner {
    display: grid;
    gap: var(--space-sm);
    margin-block: var(--space-xl);
    padding: var(--space-md);
    border: var(--border-width-thick) solid var(--color-border-strong);
    border-radius: var(--radius-xl);
    background: var(--color-surface);
  }
  .head,
  .actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-xs);
  }
  .title {
    margin: 0;
    font-family: var(--font-family-display);
    font-size: var(--font-size-2xl);
  }
  .desc,
  .note,
  .status,
  .error {
    margin: 0;
  }
  .desc,
  .note {
    color: var(--color-text-muted);
  }
  .status {
    font-weight: var(--font-weight-semibold);
  }
  .error {
    padding: var(--space-2xs) var(--space-sm);
    border-radius: var(--radius-md);
    background: var(--color-danger-subtle);
  }
  .send,
  .stop {
    min-block-size: var(--size-control-lg);
    padding-inline: var(--space-md);
    border: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-pill);
    font: inherit;
    font-weight: var(--font-weight-bold);
    cursor: pointer;
    transition: transform var(--motion-duration-fast) var(--motion-easing-bounce);
  }
  .send {
    border-color: var(--color-primary);
    background: var(--color-primary);
    color: var(--color-on-primary);
    box-shadow: var(--shadow-pop-sm);
  }
  .send:hover {
    transform: translateY(calc(var(--space-3xs) * -1));
  }
  .stop {
    background: var(--color-surface);
    color: var(--color-text);
  }
  .stop:disabled {
    opacity: var(--opacity-disabled);
    cursor: not-allowed;
  }
  button:focus-visible {
    outline: var(--border-width-thick) solid var(--color-focus-ring);
    outline-offset: var(--space-3xs);
  }
  .panes {
    display: grid;
    gap: var(--space-md);
  }
  /* tokens.breakpoint.md = 768px */
  @media (min-width: 768px) {
    .panes {
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    }
  }
  .pane {
    display: grid;
    align-content: start;
    gap: var(--space-2xs);
    min-inline-size: 0;
  }
  .sub {
    margin: 0;
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: var(--font-letter-spacing-caps);
  }
  .frames,
  .results {
    display: grid;
    gap: var(--space-3xs);
    max-block-size: var(--size-diagram-min-height);
    margin: 0;
    padding: var(--space-2xs);
    overflow-y: auto;
    list-style: none;
    border-radius: var(--radius-md);
    background: var(--color-surface-sunken);
  }
  .frame {
    display: grid;
    grid-template-columns: auto auto 1fr;
    gap: var(--space-3xs) var(--space-xs);
    padding: var(--space-2xs);
    border-inline-start: var(--border-width-thick) solid var(--color-packet-req);
    border-radius: var(--radius-sm);
    background: var(--color-surface);
    font-size: var(--font-size-xs);
  }
  .frame[data-type="EVENT"] {
    border-inline-start-color: var(--color-packet-event);
  }
  .frame[data-type="EOSE"] {
    border-inline-start-color: var(--color-packet-eose);
  }
  .frame[data-type="CLOSE"],
  .frame[data-type="CLOSED"] {
    border-inline-start-color: var(--color-packet-close);
  }
  .frame[data-type="NOTICE"] {
    border-inline-start-color: var(--color-packet-notice);
  }
  .type {
    font-weight: var(--font-weight-bold);
  }
  .host {
    color: var(--color-text-muted);
  }
  .raw {
    grid-column: 1 / -1;
    font-family: var(--font-family-mono);
    overflow-wrap: anywhere;
  }
  .empty {
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
  }
  .result {
    display: grid;
    gap: var(--space-3xs);
    padding: var(--space-xs);
    border-radius: var(--radius-sm);
    background: var(--color-surface);
    font-size: var(--font-size-sm);
  }
  .meta {
    color: var(--color-text-muted);
    font-size: var(--font-size-xs);
  }
  .text {
    overflow-wrap: anywhere;
  }
</style>
