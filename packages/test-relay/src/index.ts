/**
 * @nostrschool/test-relay — a real, in-memory NIP-01 relay on Bun.serve WebSockets.
 * Used by integration tests (LiveRelaySource against a real socket, no mocks) and by E2E
 * (Playwright points live mode at it instead of the public internet).
 */
import {
  applyFilters,
  type ClientMessage,
  type Filter,
  matchFilters,
  type NostrEvent,
  parseClientMessage,
  parseJson,
  type RelayMessage,
  serializeMessage,
  verifyEvent,
} from "@nostrschool/protocol";
import type { ServerWebSocket } from "bun";
import { type InsertOutcome, insertEvent } from "./store.ts";

export { type InsertOutcome, type InsertResult, insertEvent } from "./store.ts";

export interface TestRelayOptions {
  /** 0 (default) picks a free port. */
  readonly port?: number;
  /** Defaults to 127.0.0.1. */
  readonly hostname?: string;
  /** Events present before any client connects. */
  readonly seed?: readonly NostrEvent[];
  /** Reject events whose id/sig don't verify (default true), answering `OK false "invalid: …"`. */
  readonly verifySignatures?: boolean;
  /** Accept EVENT writes (default true). False answers `OK false "blocked: read-only"`. */
  readonly acceptWrites?: boolean;
  /** Artificial delay before every outgoing frame, to make E2E animations observable. */
  readonly latencyMs?: number;
}

export interface TestRelay {
  /** `ws://hostname:port` */
  readonly url: string;
  readonly port: number;
  /** Current stored events (seed + accepted writes), honoring replaceable/ephemeral rules. */
  events(): readonly NostrEvent[];
  /** Every valid client frame received, in order — handy for asserting what the UI sent. */
  received(): readonly ClientMessage[];
  /** Broadcasts a NOTICE to all connected clients. */
  notice(message: string): void;
  stop(): Promise<void>;
}

interface Connection {
  /** Live subscriptions on this socket: id → filters. */
  readonly subs: Map<string, readonly Filter[]>;
  /** Serializes delayed sends so frame order survives `latencyMs`. */
  queue: Promise<void>;
}

/** NIP-01 OK messages carry a machine-readable prefix (`duplicate:`, `invalid:`, …). */
const OK_REPLY: Readonly<Record<InsertOutcome, string>> = {
  stored: "",
  ephemeral: "",
  duplicate: "duplicate: already have this event",
  outdated: "duplicate: a newer version is already stored",
};

const HEX_ID = /^[0-9a-f]{64}$/;

/** The `id` of a malformed EVENT/AUTH frame, when it still carries a well-formed one. */
const eventId = (event: unknown): string | undefined => {
  const id: unknown =
    typeof event === "object" && event !== null ? Reflect.get(event, "id") : undefined;
  return typeof id === "string" && HEX_ID.test(id) ? id : undefined;
};

/**
 * NIP-01: a refused REQ/COUNT is answered with CLOSED for that subscription, and an EVENT
 * (NIP-42: or AUTH) with OK false whenever we can name its id; anything else gets a NOTICE.
 */
const rejection = (raw: string, reason: string): RelayMessage => {
  const json = parseJson(raw);
  const frame: unknown = json.ok ? json.value : undefined;
  if (!Array.isArray(frame)) return ["NOTICE", reason];
  const [type, arg]: readonly unknown[] = frame;
  if ((type === "REQ" || type === "COUNT") && typeof arg === "string") {
    return ["CLOSED", arg, reason];
  }
  const id = type === "EVENT" || type === "AUTH" ? eventId(arg) : undefined;
  return id === undefined ? ["NOTICE", reason] : ["OK", id, false, reason];
};

const NIP11 = {
  name: "nostrschool test relay",
  description: "In-memory NIP-01 relay for Nostr School tests",
  supported_nips: [1, 11, 45],
  software: "@nostrschool/test-relay",
};

export const startTestRelay = async (options: TestRelayOptions = {}): Promise<TestRelay> => {
  const { verifySignatures = true, acceptWrites = true, latencyMs = 0 } = options;
  const hostname = options.hostname ?? "127.0.0.1";
  // Relay state is inherently mutable; it is confined to this closure and exposed as snapshots.
  let stored: readonly NostrEvent[] = (options.seed ?? []).reduce<readonly NostrEvent[]>(
    (events, e) => insertEvent(events, e).events,
    [],
  );
  const log: ClientMessage[] = [];
  const sockets = new Set<ServerWebSocket<Connection>>();

  const send = (ws: ServerWebSocket<Connection>, message: RelayMessage): void => {
    const frame = serializeMessage(message);
    if (latencyMs <= 0) {
      ws.send(frame);
      return;
    }
    ws.data.queue = ws.data.queue
      .then(() => Bun.sleep(latencyMs))
      .then(() => {
        // The client may have gone away while we were sleeping; nothing left to deliver to.
        if (sockets.has(ws)) ws.send(frame);
      });
  };

  const accept = (ws: ServerWebSocket<Connection>, event: NostrEvent): void => {
    if (!acceptWrites) {
      send(ws, ["OK", event.id, false, "blocked: read-only relay"]);
      return;
    }
    const verdict = verifySignatures ? verifyEvent(event) : undefined;
    if (verdict !== undefined && !verdict.ok) {
      send(ws, ["OK", event.id, false, `invalid: ${verdict.error.message}`]);
      return;
    }
    const { events, outcome } = insertEvent(stored, event);
    stored = events;
    send(ws, ["OK", event.id, true, OK_REPLY[outcome]]);
    if (outcome !== "stored" && outcome !== "ephemeral") return;
    for (const peer of sockets) {
      for (const [id, filters] of peer.data.subs) {
        if (matchFilters(filters, event)) send(peer, ["EVENT", id, event]);
      }
    }
  };

  const handle = (ws: ServerWebSocket<Connection>, message: ClientMessage): void => {
    switch (message[0]) {
      case "EVENT":
        accept(ws, message[1]);
        return;
      case "REQ": {
        const [, id, ...filters] = message;
        for (const event of applyFilters(filters, stored)) send(ws, ["EVENT", id, event]);
        send(ws, ["EOSE", id]);
        ws.data.subs.set(id, filters);
        return;
      }
      case "CLOSE":
        ws.data.subs.delete(message[1]);
        return;
      case "COUNT": {
        const [, id, ...filters] = message;
        // COUNT ignores `limit`: it reports how many stored events match.
        const unlimited = filters.map(({ limit: _limit, ...f }) => f);
        send(ws, ["COUNT", id, { count: applyFilters(unlimited, stored).length }]);
        return;
      }
      case "AUTH":
        // NIP-42: AUTH is answered with OK, like EVENT. This relay never challenges, so it declines.
        send(ws, ["OK", message[1].id, false, "restricted: this relay does not require AUTH"]);
        return;
    }
  };

  const server = Bun.serve<Connection>({
    port: options.port ?? 0,
    hostname,
    fetch(request, srv) {
      if (srv.upgrade(request, { data: { subs: new Map(), queue: Promise.resolve() } })) {
        return undefined;
      }
      // NIP-11 relay information document, so the relay looks real to curious tools.
      const headers = { "Access-Control-Allow-Origin": "*" };
      return (request.headers.get("accept") ?? "").includes("application/nostr+json")
        ? Response.json(NIP11, {
            headers: { ...headers, "Content-Type": "application/nostr+json" },
          })
        : new Response("nostrschool test relay: connect with a WebSocket\n", { headers });
    },
    websocket: {
      open: (ws) => {
        sockets.add(ws);
      },
      close: (ws) => {
        sockets.delete(ws);
      },
      message: (ws, raw) => {
        const text = typeof raw === "string" ? raw : raw.toString();
        const parsed = parseClientMessage(text);
        if (!parsed.ok) {
          send(ws, rejection(text, `invalid: ${parsed.error.message}`));
          return;
        }
        log.push(parsed.value);
        handle(ws, parsed.value);
      },
    },
  });

  const port = server.port ?? 0;
  return {
    url: `ws://${hostname}:${port}`,
    port,
    events: () => [...stored],
    received: () => [...log],
    notice: (message) => {
      for (const ws of sockets) send(ws, ["NOTICE", message]);
    },
    stop: async () => {
      sockets.clear();
      await server.stop(true);
    },
  };
};
