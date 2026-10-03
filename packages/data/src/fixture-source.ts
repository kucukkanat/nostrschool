/**
 * Fixture mode: the full NIP-01 conversation (REQ → EVENT… → EOSE, CLOSE) synthesized from
 * committed fixtures, with per-relay latency so diagrams animate exactly as they would live.
 */
import { FIXTURE_EVENTS, getRelay, RELAYS, relaysForEvent } from "@nostrschool/fixtures";
import {
  applyFilters,
  type ClientMessage,
  classifyKind,
  eventAddress,
  type NostrEvent,
  type RelayMessage,
  type RelayUrl,
  serializeMessage,
} from "@nostrschool/protocol";
import type { DataSource, Subscription } from "./types.ts";

/** NIP-01 tie-break: of two versions with the same `created_at`, the lowest id wins. */
const isNewer = (a: NostrEvent, b: NostrEvent): boolean =>
  a.created_at > b.created_at || (a.created_at === b.created_at && a.id < b.id);

/**
 * What a real relay would have stored from `events` (NIP-01): ephemeral kinds dropped and only
 * the newest version per replaceable/addressable address kept. Fixtures commit full history
 * (e.g. two profile versions) for teaching, but REQ answers must match live/test-relay mode.
 * Mirrors `insertEvent` in @nostrschool/test-relay, which data may not depend on.
 */
export const latestVersions = (events: readonly NostrEvent[]): readonly NostrEvent[] => {
  const newest = new Map<string, NostrEvent>();
  for (const e of events) {
    const category = classifyKind(e.kind);
    if (category === "regular" || category === "ephemeral") continue;
    const address = eventAddress(e);
    const current = newest.get(address);
    if (current === undefined || isNewer(e, current)) newest.set(address, e);
  }
  return events.filter((e) => {
    const category = classifyKind(e.kind);
    if (category === "regular") return true;
    return category !== "ephemeral" && newest.get(eventAddress(e)) === e;
  });
};

export interface FixtureSourceOptions {
  /** Events to serve; defaults to all fixture events. */
  readonly events?: readonly NostrEvent[];
  /**
   * Which relays hold which event ids. Defaults to the fixtures' placement map when `events`
   * is omitted; events missing from the map live on every relay.
   */
  readonly placement?: Readonly<Record<string, readonly RelayUrl[]>>;
  /** Relay set; defaults to the fixture relays. */
  readonly relays?: readonly RelayUrl[];
  /** Simulated per-relay latency in ms; defaults to each fixture relay's `latencyMs`. Use 0 in tests. */
  readonly latencyMs?: number | ((relayUrl: RelayUrl) => number);
}

/**
 * Serves fixture events through the full NIP-01 flow (synthesized REQ/EVENT/EOSE/CLOSE raw
 * frames included), with simulated latency per relay. Deterministic; callbacks are always async.
 */
export const createFixtureSource = (options: FixtureSourceOptions = {}): DataSource => {
  const events = options.events ?? FIXTURE_EVENTS;
  const relays = options.relays ?? RELAYS.map((r) => r.url);
  const placement =
    options.placement ??
    (options.events === undefined
      ? Object.fromEntries(FIXTURE_EVENTS.map((e) => [e.id, relaysForEvent(e.id)]))
      : {});
  const { latencyMs } = options;
  const latencyOf = (url: RelayUrl): number =>
    typeof latencyMs === "function" ? latencyMs(url) : (latencyMs ?? getRelay(url)?.latencyMs ?? 0);
  const storedOn = (url: RelayUrl): readonly NostrEvent[] =>
    latestVersions(events.filter((e) => placement[e.id]?.includes(url) ?? true));

  const active = new Set<Subscription>();
  let counter = 0;

  return {
    mode: "fixture",
    relays,
    subscribe(filters, o) {
      counter += 1;
      const id = `ns-${counter}`;
      const targets = [...new Set(o.relays ?? relays)];
      const timers = new Set<ReturnType<typeof setTimeout>>();
      const requested = new Set<RelayUrl>();
      let closed = false;
      let pending = targets.length;

      const frame = (dir: "out" | "in", url: RelayUrl, msg: ClientMessage | RelayMessage): void =>
        o.onRawMessage?.(dir, url, serializeMessage(msg));
      const later = (ms: number, run: () => void): void => {
        const timer = setTimeout(() => {
          timers.delete(timer);
          if (!closed) run();
        }, ms);
        timers.add(timer);
      };

      if (targets.length === 0) later(0, () => o.onAllEose?.());
      for (const url of targets) {
        later(0, () => {
          requested.add(url);
          frame("out", url, ["REQ", id, ...filters]);
        });
        later(latencyOf(url), () => {
          for (const event of applyFilters(filters, storedOn(url))) {
            frame("in", url, ["EVENT", id, event]);
            o.onEvent(event, url);
          }
          frame("in", url, ["EOSE", id]);
          o.onEose?.(url);
          pending -= 1;
          if (pending === 0) o.onAllEose?.();
        });
      }

      const subscription: Subscription = {
        id,
        close: () => {
          if (closed) return;
          closed = true;
          for (const timer of timers) clearTimeout(timer);
          for (const url of requested) frame("out", url, ["CLOSE", id]);
          active.delete(subscription);
        },
      };
      active.add(subscription);
      return subscription;
    },
    dispose: () => {
      for (const sub of active) sub.close();
    },
  };
};
