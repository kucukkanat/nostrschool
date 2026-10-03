/**
 * State for the playground's "send it to a relay" panel, as a pure reducer so the
 * REQ → EVENT… → EOSE conversation can be tested without a browser.
 */
import type { DataSourceError, FrameDirection } from "@nostrschool/data";
import type { NostrEvent, RelayUrl } from "@nostrschool/protocol";

export interface Frame {
  readonly seq: number;
  readonly direction: FrameDirection;
  readonly relay: RelayUrl;
  /** First element of the message array ("REQ", "EVENT", "EOSE", …), for color and the label. */
  readonly type: string;
  readonly raw: string;
}

export interface ReceivedEvent {
  readonly event: NostrEvent;
  readonly relays: readonly RelayUrl[];
}

export type RunStatus = "idle" | "running" | "done" | "closed";

export interface RunState {
  readonly status: RunStatus;
  readonly frames: readonly Frame[];
  readonly received: readonly ReceivedEvent[];
  readonly errors: readonly DataSourceError[];
  readonly seq: number;
}

export type RunAction =
  | { readonly type: "start" }
  | {
      readonly type: "frame";
      readonly direction: FrameDirection;
      readonly relay: RelayUrl;
      readonly raw: string;
    }
  | { readonly type: "event"; readonly event: NostrEvent; readonly relay: RelayUrl }
  | { readonly type: "error"; readonly error: DataSourceError }
  | { readonly type: "all-eose" }
  | { readonly type: "close" };

export const IDLE: RunState = { status: "idle", frames: [], received: [], errors: [], seq: 0 };

/** Live relays can stream a lot; the log keeps the most recent frames only. */
export const MAX_FRAMES = 40;
export const MAX_RAW = 160;
/** Upper bound on `limit` for live queries (public relays, be polite). */
export const LIVE_LIMIT = 30;

export const frameType = (raw: string): string => /^\s*\[\s*"([A-Z]+)"/.exec(raw)?.[1] ?? "?";

export const truncate = (raw: string, max = MAX_RAW): string =>
  raw.length > max ? `${raw.slice(0, max - 1)}…` : raw;

const byNewest = (a: ReceivedEvent, b: ReceivedEvent): number =>
  b.event.created_at - a.event.created_at || (a.event.id < b.event.id ? -1 : 1);

export const runReducer = (state: RunState, action: RunAction): RunState => {
  switch (action.type) {
    case "start":
      return { ...IDLE, status: "running", seq: state.seq };
    case "frame": {
      const seq = state.seq + 1;
      const frame: Frame = {
        seq,
        direction: action.direction,
        relay: action.relay,
        type: frameType(action.raw),
        raw: truncate(action.raw),
      };
      return { ...state, seq, frames: [...state.frames, frame].slice(-MAX_FRAMES) };
    }
    case "event": {
      const existing = state.received.find((r) => r.event.id === action.event.id);
      // The same event from several relays is one result with several sources.
      const received =
        existing === undefined
          ? [...state.received, { event: action.event, relays: [action.relay] }].sort(byNewest)
          : state.received.map((r) =>
              r === existing && !r.relays.includes(action.relay)
                ? { ...r, relays: [...r.relays, action.relay] }
                : r,
            );
      return { ...state, received };
    }
    case "error":
      return { ...state, errors: [...state.errors, action.error] };
    case "all-eose":
      return state.status === "running" ? { ...state, status: "done" } : state;
    case "close":
      return state.status === "idle" ? state : { ...state, status: "closed" };
  }
};

export const relayHost = (url: RelayUrl): string =>
  url.replace(/^wss?:\/\//, "").replace(/\/$/, "");
