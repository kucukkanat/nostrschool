/**
 * Live mode: raw NIP-01 over WebSocket (no pool library) so every frame can be shown to the
 * learner. Strictly read-only — the only frames we ever send are REQ and CLOSE.
 */
import {
  type ClientMessage,
  matchFilters,
  type NostrEvent,
  parseRelayMessage,
  type RelayUrl,
  serializeMessage,
  verifyEvent,
} from "@nostrschool/protocol";
import { DEFAULT_LIVE_RELAYS } from "./stores.ts";
import type { DataSource, DataSourceErrorCode, Subscription } from "./types.ts";

export interface LiveRelaySourceOptions {
  readonly relays?: readonly RelayUrl[];
  /** Give up connecting after this long (default 5000). */
  readonly connectTimeoutMs?: number;
  /** Fire onEose anyway after this long (default 8000). */
  readonly eoseTimeoutMs?: number;
  /** Hard cap on unique events delivered per subscription (default 500) — protects the UI. */
  readonly maxEvents?: number;
  /** Injectable for Bun/Node test runs; defaults to `globalThis.WebSocket`. */
  readonly WebSocketImpl?: typeof WebSocket;
}

type Timer = ReturnType<typeof setTimeout>;

interface Connection {
  readonly socket: WebSocket | undefined;
  readonly timers: Timer[];
}

/**
 * Talks raw NIP-01 over WebSocket (one socket per relay per subscription, so closing a
 * subscription is just closing its sockets). Verifies every event's id + signature and drops
 * invalid ones (reported via onError).
 */
export const createLiveRelaySource = (options: LiveRelaySourceOptions = {}): DataSource => {
  const {
    relays = DEFAULT_LIVE_RELAYS,
    connectTimeoutMs = 5000,
    eoseTimeoutMs = 8000,
    maxEvents = 500,
  } = options;
  const WS = options.WebSocketImpl ?? globalThis.WebSocket;
  // Verify each (id, sig) once even if several relays/subscriptions deliver it. Keyed by sig too,
  // so a relay serving a forged copy can't poison the verdict for the genuine event.
  const verdicts = new Map<string, boolean>();
  const isAuthentic = (event: NostrEvent): boolean => {
    const key = `${event.id}:${event.sig}`;
    const cached = verdicts.get(key);
    if (cached !== undefined) return cached;
    const valid = verifyEvent(event).ok;
    verdicts.set(key, valid);
    return valid;
  };

  const active = new Set<Subscription>();
  let counter = 0;

  return {
    mode: "live",
    relays,
    subscribe(filters, o) {
      counter += 1;
      const id = `ns-${counter}`;
      const targets = [...new Set(o.relays ?? relays)];
      const connections = new Map<RelayUrl, Connection>();
      const finished = new Set<RelayUrl>();
      const eosed = new Set<RelayUrl>();
      const delivered = new Map<RelayUrl, Set<string>>();
      const unique = new Set<string>();
      let closed = false;

      const report = (relayUrl: RelayUrl, code: DataSourceErrorCode, message: string): void => {
        if (!closed) o.onError?.({ code, relayUrl, message });
      };
      const finish = (url: RelayUrl): void => {
        if (closed || finished.has(url)) return;
        finished.add(url);
        if (finished.size === targets.length) o.onAllEose?.();
      };
      const eose = (url: RelayUrl): void => {
        if (closed || eosed.has(url)) return;
        eosed.add(url);
        for (const timer of connections.get(url)?.timers ?? []) clearTimeout(timer);
        o.onEose?.(url);
        finish(url);
      };
      const send = (url: RelayUrl, socket: WebSocket, message: ClientMessage): void => {
        const raw = serializeMessage(message);
        o.onRawMessage?.("out", url, raw);
        socket.send(raw);
      };

      const deliver = (url: RelayUrl, event: NostrEvent): void => {
        const seen = delivered.get(url) ?? new Set<string>();
        delivered.set(url, seen);
        if (seen.has(event.id)) return;
        if (!isAuthentic(event)) {
          report(url, "invalid-event", `event ${event.id} has a bad id or signature`);
          return;
        }
        if (!matchFilters(filters, event)) {
          report(url, "invalid-event", `event ${event.id} does not match the subscription filters`);
          return;
        }
        // The cap counts unique events; repeats from other relays of an accepted event still flow.
        if (!unique.has(event.id) && unique.size >= maxEvents) return;
        seen.add(event.id);
        unique.add(event.id);
        o.onEvent(event, url);
      };

      const onFrame = (url: RelayUrl, socket: WebSocket, raw: string): void => {
        if (closed) return;
        o.onRawMessage?.("in", url, raw);
        const parsed = parseRelayMessage(raw);
        if (!parsed.ok) {
          report(url, "invalid-message", parsed.error.message);
          return;
        }
        const message = parsed.value;
        switch (message[0]) {
          case "EVENT":
            if (message[1] === id) deliver(url, message[2]);
            return;
          case "EOSE":
            if (message[1] === id) eose(url);
            return;
          case "CLOSED":
            if (message[1] !== id) return;
            report(url, "closed-by-relay", message[2]);
            finish(url);
            socket.close();
            return;
          case "NOTICE":
            report(url, "notice", message[1]);
            return;
          // A read-only client never sends EVENT/COUNT and does not authenticate.
          case "OK":
          case "COUNT":
          case "AUTH":
            return;
        }
      };

      const connect = (url: RelayUrl): Connection => {
        const socket: WebSocket | undefined = (() => {
          try {
            return new WS(url);
          } catch (error) {
            report(url, "connect-failed", error instanceof Error ? error.message : String(error));
            return undefined;
          }
        })();
        if (socket === undefined) {
          // Deferred so onAllEose never fires before subscribe() has returned.
          queueMicrotask(() => finish(url));
          return { socket, timers: [] };
        }
        let opened = false;
        const timers: Timer[] = [
          setTimeout(() => {
            report(url, "connect-timeout", `no connection after ${connectTimeoutMs}ms`);
            finish(url);
            socket.close();
          }, connectTimeoutMs),
        ];
        socket.onopen = () => {
          opened = true;
          for (const timer of timers.splice(0)) clearTimeout(timer);
          send(url, socket, ["REQ", id, ...filters]);
          timers.push(
            setTimeout(() => {
              report(url, "eose-timeout", `no EOSE after ${eoseTimeoutMs}ms`);
              eose(url);
            }, eoseTimeoutMs),
          );
        };
        socket.onmessage = (m: MessageEvent) => onFrame(url, socket, String(m.data));
        let failed = false;
        const fail = (): void => {
          if (failed) return;
          failed = true;
          report(url, opened ? "socket-error" : "connect-failed", `WebSocket error on ${url}`);
        };
        socket.onerror = fail;
        socket.onclose = () => {
          for (const timer of timers) clearTimeout(timer);
          // Some WebSocket implementations close a refused socket without an error event.
          if (!opened && !finished.has(url)) fail();
          finish(url);
        };
        return { socket, timers };
      };

      for (const url of targets) connections.set(url, connect(url));
      if (targets.length === 0) {
        queueMicrotask(() => {
          if (!closed) o.onAllEose?.();
        });
      }

      const subscription: Subscription = {
        id,
        close: () => {
          if (closed) return;
          for (const [url, { socket, timers }] of connections) {
            for (const timer of timers) clearTimeout(timer);
            if (socket?.readyState === WS.OPEN) send(url, socket, ["CLOSE", id]);
            socket?.close();
          }
          closed = true;
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
