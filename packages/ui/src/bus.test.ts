import { expect, test } from "bun:test";
import { createEventBus, MASCOT_EVENT_TYPES, type MascotEventMap, mascotBus } from "./bus.ts";

test("typed delivery, filtering and unsubscribe", () => {
  const bus = createEventBus<MascotEventMap>();
  const seen: string[] = [];
  const offValid = bus.on("signature:valid", (p) => seen.push(`valid:${p.eventId ?? ""}`));
  const offAny = bus.onAny((e) => seen.push(`any:${e.type}`));
  bus.emit("signature:valid", { eventId: "abc" });
  bus.emit("celebrate", {});
  offValid();
  offAny();
  bus.emit("signature:valid", {});
  expect(seen).toEqual(["valid:abc", "any:signature:valid", "any:celebrate"]);
});

test("a throwing listener doesn't block others and is reported, not swallowed", () => {
  const reported: unknown[] = [];
  const bus = createEventBus<MascotEventMap>({ onListenerError: (error) => reported.push(error) });
  const seen: number[] = [];
  bus.onAny(() => {
    throw new Error("listener failed");
  });
  bus.onAny(() => seen.push(1));
  bus.emit("live:on", {});
  expect(seen).toEqual([1]);
  expect(reported).toEqual([new Error("listener failed")]);
});

test("singleton bus and event list", () => {
  expect(MASCOT_EVENT_TYPES).toHaveLength(10);
  let count = 0;
  const off = mascotBus.on("quiz:correct", () => count++);
  mascotBus.emit("quiz:correct", { quizId: "q" });
  off();
  expect(count).toBe(1);
});

test("by default a throwing listener is rethrown asynchronously (window 'error'), not swallowed", async () => {
  const reported: unknown[] = [];
  // In a browser (and happy-dom), an exception in a microtask surfaces as a window error event.
  const onError = (e: ErrorEvent) => {
    reported.push(e.error);
    e.preventDefault();
  };
  window.addEventListener("error", onError);
  try {
    const bus = createEventBus<MascotEventMap>();
    const seen: number[] = [];
    bus.onAny(() => {
      throw new Error("default report");
    });
    bus.onAny(() => seen.push(1));
    bus.emit("celebrate", {});
    expect(seen).toEqual([1]);
    expect(reported).toEqual([]); // reported later, so the emitting code isn't interrupted
    await new Promise((r) => setTimeout(r, 0));
    expect(reported).toEqual([new Error("default report")]);
  } finally {
    window.removeEventListener("error", onError);
  }
});
