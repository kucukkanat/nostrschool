/** Records every DataSource callback in order, so tests can assert the full NIP-01 conversation. */
import type { DataSourceError, FrameDirection, SubscribeOptions } from "./types.ts";

export type Entry =
  | { readonly type: "event"; readonly relay: string; readonly id: string }
  | { readonly type: "eose"; readonly relay: string }
  | { readonly type: "all-eose" }
  | {
      readonly type: "raw";
      readonly dir: FrameDirection;
      readonly relay: string;
      readonly frame: unknown[];
    }
  | { readonly type: "error"; readonly error: DataSourceError };

export interface Recorder {
  readonly log: Entry[];
  readonly options: SubscribeOptions;
  /** Resolves when onAllEose fires. */
  readonly done: Promise<void>;
  /** Resolves once an entry satisfies the predicate. */
  until(predicate: (entry: Entry) => boolean, timeoutMs?: number): Promise<void>;
  readonly frames: (dir?: FrameDirection) => unknown[][];
}

/** Frames are JSON arrays except the junk a misbehaving relay sends; keep that as `[raw]`. */
const parseFrame = (raw: string): unknown[] => {
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [raw];
  } catch {
    return [raw];
  }
};

export const record = (relays?: readonly string[]): Recorder => {
  const log: Entry[] = [];
  const listeners = new Set<() => void>();
  const push = (entry: Entry): void => {
    log.push(entry);
    for (const l of listeners) l();
  };
  let resolveDone: () => void = () => undefined;
  const done = new Promise<void>((r) => {
    resolveDone = r;
  });
  const options: SubscribeOptions = {
    ...(relays === undefined ? {} : { relays }),
    onEvent: (event, relay) => push({ type: "event", relay, id: event.id }),
    onEose: (relay) => push({ type: "eose", relay }),
    onAllEose: () => {
      push({ type: "all-eose" });
      resolveDone();
    },
    onRawMessage: (dir, relay, frame) =>
      push({ type: "raw", dir, relay, frame: parseFrame(frame) }),
    onError: (error) => push({ type: "error", error }),
  };
  return {
    log,
    options,
    done,
    until: (predicate, timeoutMs = 3000) =>
      new Promise((resolve, reject) => {
        const check = (): void => {
          if (!log.some(predicate)) return;
          listeners.delete(check);
          clearTimeout(timer);
          resolve();
        };
        const timer = setTimeout(() => {
          listeners.delete(check);
          reject(new Error(`timed out; log: ${JSON.stringify(log)}`));
        }, timeoutMs);
        listeners.add(check);
        check();
      }),
    frames: (dir) =>
      log.flatMap((e) =>
        e.type === "raw" && (dir === undefined || e.dir === dir) ? [e.frame] : [],
      ),
  };
};
