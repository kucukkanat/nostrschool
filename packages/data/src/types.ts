import type { Filter, NostrEvent, RelayUrl } from "@nostrschool/protocol";

export type DataMode = "fixture" | "live";

/** `out` = client → relay frame, `in` = relay → client frame. */
export type FrameDirection = "out" | "in";

export type DataSourceErrorCode =
  | "connect-failed"
  | "connect-timeout"
  | "eose-timeout"
  | "invalid-message"
  | "invalid-event"
  | "closed-by-relay"
  | "notice"
  | "socket-error";

export interface DataSourceError {
  readonly code: DataSourceErrorCode;
  readonly relayUrl: RelayUrl;
  readonly message: string;
}

export interface SubscribeOptions {
  /** Relays to query; defaults to the source's `relays`. */
  readonly relays?: readonly RelayUrl[];
  /**
   * Every event that matches the filters and passes signature verification, once per relay
   * that delivered it (de-duplicate by `event.id` if you need unique events).
   */
  readonly onEvent: (event: NostrEvent, relayUrl: RelayUrl) => void;
  /** The relay finished sending stored events (EOSE) — or the EOSE timeout fired. */
  readonly onEose?: (relayUrl: RelayUrl) => void;
  /** Every raw frame (REQ/CLOSE out; EVENT/EOSE/NOTICE/CLOSED in) — chapter 4 visualizes these. */
  readonly onRawMessage?: (direction: FrameDirection, relayUrl: RelayUrl, rawFrame: string) => void;
  readonly onError?: (error: DataSourceError) => void;
  /** All relays reached EOSE (or failed). Fires once. */
  readonly onAllEose?: () => void;
}

export interface Subscription {
  /** The REQ subscription id used on the wire. */
  readonly id: string;
  /** Sends CLOSE to every relay and stops callbacks. Idempotent. */
  close(): void;
}

/**
 * The one interface every component reads through. Read-only by design in v1: there is no
 * publish — we never write to relays on the user's behalf.
 */
export interface DataSource {
  readonly mode: DataMode;
  /** Default relay set for `subscribe`. */
  readonly relays: readonly RelayUrl[];
  subscribe(filters: readonly Filter[], options: SubscribeOptions): Subscription;
  /** Closes all sockets/timers. Idempotent. */
  dispose(): void;
}
