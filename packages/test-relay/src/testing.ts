/**
 * Helpers for tests that talk to the relay over a real socket. Exported so other packages'
 * integration tests can sign events and drive a raw client without re-inventing them.
 */
import {
  deriveSecretKey,
  type EventTemplate,
  type NostrEvent,
  signEvent,
  unwrap,
} from "@nostrschool/protocol";

/** Deterministic secret key from a label (public by design — tests only). */
export const testSecretKey = (label: string): Uint8Array =>
  deriveSecretKey(`nostrschool:test:${label}`);

/** Really signs a template with the key derived from `label`; fixed aux randomness ⇒ reproducible. */
export const signTestEvent = (
  label: string,
  template: Partial<EventTemplate> & Pick<EventTemplate, "kind">,
): NostrEvent =>
  unwrap(
    signEvent(
      { created_at: 1735689600, content: "", tags: [], ...template },
      testSecretKey(label),
      { auxRand: new Uint8Array(32) },
    ),
  ).event;

export interface RawClient {
  /** Every frame received so far, parsed. */
  readonly frames: unknown[][];
  send(message: readonly unknown[] | string): void;
  /** Resolves once a received frame satisfies `predicate` (rejects after `timeoutMs`). */
  waitFor(predicate: (frame: unknown[]) => boolean, timeoutMs?: number): Promise<unknown[]>;
  close(): void;
}

export const connectRawClient = (url: string): Promise<RawClient> =>
  new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    const frames: unknown[][] = [];
    const waiters = new Set<() => void>();
    ws.onmessage = (m) => {
      frames.push(JSON.parse(String(m.data)));
      for (const w of waiters) w();
    };
    ws.onerror = () => reject(new Error(`could not connect to ${url}`));
    ws.onopen = () =>
      resolve({
        frames,
        send: (message) => ws.send(typeof message === "string" ? message : JSON.stringify(message)),
        waitFor: (predicate, timeoutMs = 2000) =>
          new Promise((done, fail) => {
            const check = (): void => {
              const hit = frames.find(predicate);
              if (hit === undefined) return;
              waiters.delete(check);
              clearTimeout(timer);
              done(hit);
            };
            const timer = setTimeout(() => {
              waiters.delete(check);
              fail(new Error(`timed out; frames: ${JSON.stringify(frames)}`));
            }, timeoutMs);
            waiters.add(check);
            check();
          }),
        close: () => ws.close(),
      });
  });
