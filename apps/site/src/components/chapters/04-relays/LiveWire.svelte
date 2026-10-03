<script lang="ts">
  /**
   * The raw wire, unfiltered: one REQ through the global DataSource (practice relays by default,
   * real relays in Live mode) with every frame logged exactly as it crossed the socket.
   * Read-only by construction: DataSource has no publish, and we only ever send REQ/CLOSE.
   */
  import {
    type DataSource,
    type DataSourceError,
    type FrameDirection,
    getDataSource,
    $liveMode as liveMode,
    $liveRelays as liveRelays,
    type Subscription,
  } from "@nostrschool/data";
  import { Packet } from "@nostrschool/diagrams";
  import { format, getDictionary, type Locale } from "@nostrschool/i18n";
  import { Badge, Button, pop } from "@nostrschool/ui";
  import { untrack } from "svelte";
  import { LIVE_FILTER, type LoggedFrame, logFrame, relayHost } from "./live.ts";

  interface Props {
    readonly locale: Locale;
    /** A specific source (tests: a fixture source or a live source on the test relay). Default: the global one. */
    readonly source?: DataSource;
  }
  const { locale, source }: Props = $props();
  const t = $derived(getDictionary(locale).chapters.ch04.live);

  type Status = "idle" | "waiting" | "done" | "closed";
  let live = $state(false);
  let relays: readonly string[] = $state([]);
  let log: readonly LoggedFrame[] = $state([]);
  let errors: readonly DataSourceError[] = $state([]);
  let status: Status = $state("idle");
  let events = $state(0);
  let eosed = $state(0);
  let targets = $state(0);
  let frames = $state(0);
  let subscription: Subscription | undefined;

  const stop = (next: Status): void => {
    subscription?.close();
    subscription = undefined;
    status = next;
  };

  // A mode switch makes the running subscription point at the wrong relays: hang it up.
  // `untrack`: the store calls back synchronously inside the effect; reading `live` there must not
  // make the effect depend on the state it writes.
  $effect(() =>
    liveMode.subscribe((value) => {
      if (untrack(() => live) !== value && subscription !== undefined) stop("closed");
      live = value;
    }),
  );
  $effect(() =>
    liveRelays.subscribe((value) => {
      relays = value;
    }),
  );
  $effect(() => () => subscription?.close());

  const record = (direction: FrameDirection, relayUrl: string, raw: string): void => {
    frames += 1;
    log = logFrame(log, frames, direction, relayUrl, raw);
  };

  const send = (): void => {
    stop("waiting");
    const src = source ?? getDataSource();
    targets = src.relays.length;
    events = 0;
    eosed = 0;
    errors = [];
    subscription = src.subscribe([LIVE_FILTER], {
      onEvent: () => {
        events += 1;
      },
      onEose: () => {
        eosed += 1;
      },
      // Once everyone has answered, hang up politely: that's the CLOSE you see in the log.
      onAllEose: () => stop("done"),
      onRawMessage: record,
      onError: (error) => {
        errors = [...errors, error];
      },
    });
  };

  const clear = (): void => {
    log = [];
    errors = [];
  };

  const sourceRelays = $derived(source?.relays ?? relays);
</script>

<section
  class="live"
  data-testid="ch04-live"
  data-mode={live ? "live" : "fixture"}
  data-status={status}
>
  <header class="head">
    <h3 class="title">{t.title}</h3>
    {#if live && source === undefined}
      <Badge testid="ch04-live-badge" tone="live">{t.liveBadge}</Badge>
    {:else}
      <Badge testid="ch04-live-badge" tone="neutral">{t.fixtureBadge}</Badge>
    {/if}
  </header>
  <p class="desc">{t.description}</p>
  <p class="hint" data-testid="ch04-live-hint">
    {live && source === undefined
      ? format(t.liveHint, { relays: sourceRelays.map(relayHost).join(", ") })
      : t.fixtureHint}
  </p>

  <div class="actions">
    <Button testid="ch04-live-send" onclick={send} loading={status === "waiting"}>{t.send}</Button>
    <Button
      testid="ch04-live-stop"
      variant="secondary"
      disabled={status !== "waiting"}
      onclick={() => stop("closed")}
    >
      {t.stop}
    </Button>
    <Button testid="ch04-live-clear" variant="ghost" disabled={log.length === 0} onclick={clear}
      >{t.clear}</Button
    >
  </div>

  <p class="status" data-testid="ch04-live-status" role="status" aria-live="polite">
    {t.status[status]}
    {#if status !== "idle"}
      <span data-testid="ch04-live-stats">
        {format(t.stats, { frames, events, eose: eosed, relays: targets })}
      </span>
    {/if}
  </p>

  <!-- Scrollable region must be keyboard reachable (axe scrollable-region-focusable). -->
  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <!-- biome-ignore lint/a11y/noNoninteractiveTabindex: scrollable regions must be keyboard reachable (axe scrollable-region-focusable) -->
  <ol class="log" data-testid="ch04-live-log" aria-label={t.logLabel} tabindex="0">
    {#each log as frame (frame.key)}
      <li
        class="frame {frame.direction}"
        data-testid="ch04-live-frame"
        data-verb={frame.verb}
        data-direction={frame.direction}
        aria-label={format(t.frameLabel, {
          direction: frame.direction === "out" ? t.out : t.in,
          verb: frame.verb,
          relay: frame.relay,
        })}
        use:pop={{ spring: "snappy", from: 0.95 }}
      >
        <span class="meta">
          <span class="arrow" aria-hidden="true">{frame.direction === "out" ? "→" : "←"}</span>
          <Packet type={frame.verb} size="sm" testid="ch04-live-frame-packet" />
          <span class="relay">{frame.relay}</span>
        </span>
        <code class="raw"
          >{frame.text}
          {#if frame.hidden > 0}
            <span class="more">{format(t.truncated, { count: frame.hidden })}</span>
          {/if}</code
        >
      </li>
    {:else}
      <li class="empty" data-testid="ch04-live-empty">{t.empty}</li>
    {/each}
  </ol>

  {#if errors.length > 0}
    <ul class="errors" data-testid="ch04-live-errors">
      {#each errors as error, i (i)}
        <li data-code={error.code}>
          {format(t.error, { relay: relayHost(error.relayUrl), message: error.message })}
        </li>
      {/each}
    </ul>
  {/if}
</section>

<style>
  .live {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
    min-height: var(--size-diagram-min-height);
    margin: var(--space-lg) 0;
    padding: var(--space-md);
    border: var(--border-width-medium) solid var(--color-border);
    border-radius: var(--radius-lg);
    background: var(--color-surface);
    color: var(--color-text);
    box-shadow: var(--shadow-pop-sm);
  }
  .live[data-mode="live"] {
    border-color: var(--color-live);
  }
  .head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-xs);
  }
  .title {
    margin: 0;
    font-family: var(--font-family-display);
    font-size: var(--font-size-lg);
  }
  .desc,
  .hint,
  .status {
    margin: 0;
    font-size: var(--font-size-sm);
  }
  .hint,
  .status {
    color: var(--color-text-muted);
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-xs);
  }
  .log {
    display: flex;
    flex-direction: column;
    gap: var(--space-2xs);
    max-height: calc(var(--size-diagram-min-height) * 1.2);
    margin: 0;
    padding: var(--space-xs);
    overflow: auto;
    list-style: none;
    border-radius: var(--radius-md);
    background: var(--color-code-bg);
    color: var(--color-code-text);
  }
  .log:focus-visible {
    outline: var(--border-width-thick) solid var(--color-focus-ring);
  }
  .frame {
    display: flex;
    flex-direction: column;
    gap: var(--space-3xs);
    padding: var(--space-2xs) var(--space-xs);
    border-left: var(--border-width-medium) solid var(--color-border-strong);
    border-radius: var(--radius-sm);
  }
  .frame.in {
    border-left-color: var(--color-text-secondary);
  }
  .frame.out {
    border-left-color: var(--color-text-primary);
  }
  .meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2xs);
    font-size: var(--font-size-xs);
  }
  .relay {
    font-family: var(--font-family-mono);
  }
  .raw {
    font-family: var(--font-family-mono);
    font-size: var(--font-size-xs);
    overflow-wrap: anywhere;
    white-space: pre-wrap;
  }
  .more,
  .empty {
    font-style: italic;
  }
  .errors {
    margin: 0;
    padding-left: var(--space-md);
    color: var(--color-text-muted);
    font-size: var(--font-size-xs);
  }
</style>
