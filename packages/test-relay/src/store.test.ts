import { describe, expect, test } from "bun:test";
import { insertEvent } from "./store.ts";
import { signTestEvent } from "./testing.ts";

const note = (label: string, created_at: number) =>
  signTestEvent(label, { kind: 1, created_at, content: `${label}@${created_at}` });

describe("insertEvent", () => {
  test("stores regular events and rejects duplicates", () => {
    const e = note("alice", 10);
    const first = insertEvent([], e);
    expect(first).toEqual({ events: [e], outcome: "stored" });
    expect(insertEvent(first.events, e)).toEqual({ events: [e], outcome: "duplicate" });
  });

  test("never stores ephemeral kinds", () => {
    const e = signTestEvent("alice", { kind: 20001 });
    expect(insertEvent([], e)).toEqual({ events: [], outcome: "ephemeral" });
  });

  test("replaceable kinds keep only the newest per pubkey+kind", () => {
    const old = signTestEvent("alice", { kind: 0, created_at: 1, content: "old" });
    const fresh = signTestEvent("alice", { kind: 0, created_at: 2, content: "new" });
    const bobs = signTestEvent("bob", { kind: 0, created_at: 1 });
    const store = insertEvent(insertEvent([], old).events, bobs).events;
    expect(insertEvent(store, fresh).events).toEqual([bobs, fresh]);
    expect(insertEvent([fresh], old)).toEqual({ events: [fresh], outcome: "outdated" });
  });

  test("addressable kinds are keyed by d tag", () => {
    const a = signTestEvent("alice", { kind: 30023, created_at: 1, tags: [["d", "a"]] });
    const b = signTestEvent("alice", { kind: 30023, created_at: 1, tags: [["d", "b"]] });
    const a2 = signTestEvent("alice", { kind: 30023, created_at: 5, tags: [["d", "a"]] });
    const store = insertEvent(insertEvent([], a).events, b).events;
    expect(insertEvent(store, a2).events).toEqual([b, a2]);
  });
});

test("same created_at: the lower id wins", () => {
  const [x, y] = ["x", "y"].map((l) =>
    signTestEvent("alice", { kind: 0, created_at: 9, content: l }),
  );
  if (x === undefined || y === undefined) throw new Error("unreachable");
  const [lo, hi] = x.id < y.id ? [x, y] : [y, x];
  expect(insertEvent([hi], lo)).toEqual({ events: [lo], outcome: "stored" });
  expect(insertEvent([lo], hi)).toEqual({ events: [lo], outcome: "outdated" });
});
