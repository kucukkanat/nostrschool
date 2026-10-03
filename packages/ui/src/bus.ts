/**
 * Typed event bus for mascot reactions (and anything else that wants to react to learner
 * actions). Islands are separate Svelte apps but share this module instance in the browser
 * bundle, so emitting in one island reaches listeners in another.
 */

/** Every event and its payload. Add new events here (owner: ui agent). */
export interface MascotEventMap {
  "signature:valid": { readonly eventId?: string };
  "signature:invalid": { readonly reason?: string };
  "keys:generated": { readonly pubkey: string };
  "chapter:complete": { readonly chapter: number };
  "quiz:correct": { readonly quizId: string };
  "quiz:wrong": { readonly quizId: string };
  "live:on": Record<string, never>;
  "live:off": Record<string, never>;
  celebrate: { readonly reason?: string };
  /** Something went wrong for the learner (a key leaked, a network went dark, data was lost). */
  warning: { readonly reason: string };
}

export type MascotEventType = keyof MascotEventMap;

export const MASCOT_EVENT_TYPES: readonly MascotEventType[] = [
  "signature:valid",
  "signature:invalid",
  "keys:generated",
  "chapter:complete",
  "quiz:correct",
  "quiz:wrong",
  "live:on",
  "live:off",
  "celebrate",
  "warning",
];

/** A delivered event: discriminated by `type`. */
export type BusEvent<M> = { [K in keyof M]: { readonly type: K; readonly payload: M[K] } }[keyof M];

export interface EventBus<M> {
  emit<K extends keyof M>(type: K, payload: M[K]): void;
  /** Returns an unsubscribe function. */
  on<K extends keyof M>(type: K, handler: (payload: M[K]) => void): () => void;
  /** Every event, e.g. for the mascot or analytics-free debugging. Returns unsubscribe. */
  onAny(handler: (event: BusEvent<M>) => void): () => void;
}

export interface EventBusOptions<M> {
  /**
   * Called when a listener throws. A throwing listener must not stop the others, but must not
   * be swallowed either — the default reports it globally (`reportError`) so it surfaces.
   */
  readonly onListenerError?: (error: unknown, event: BusEvent<M>) => void;
}

const reportGlobally = (error: unknown): void => {
  queueMicrotask(() => {
    throw error;
  });
};

/** Creates an isolated bus (tests create their own). */
export const createEventBus = <M>({
  onListenerError = reportGlobally,
}: EventBusOptions<M> = {}): EventBus<M> => {
  const listeners = new Set<(event: BusEvent<M>) => void>();
  const deliver = (event: BusEvent<M>) => {
    for (const listener of [...listeners]) {
      try {
        listener(event);
      } catch (error) {
        onListenerError(error, event);
      }
    }
  };
  const onAny = (handler: (event: BusEvent<M>) => void) => {
    listeners.add(handler);
    return () => {
      listeners.delete(handler);
    };
  };
  return {
    emit: (type, payload) => deliver({ type, payload } as BusEvent<M>),
    on: (type, handler) =>
      onAny((event) => {
        if (event.type === type) handler(event.payload as M[typeof type]);
      }),
    onAny,
  };
};

/** The app-wide mascot bus. */
export const mascotBus: EventBus<MascotEventMap> = createEventBus<MascotEventMap>();
export const emit: EventBus<MascotEventMap>["emit"] = mascotBus.emit;
export const on: EventBus<MascotEventMap>["on"] = mascotBus.on;
export const onAny: EventBus<MascotEventMap>["onAny"] = mascotBus.onAny;
