import { describe, expect, test } from "bun:test";
import { FIXTURE_EVENTS } from "@nostrschool/fixtures";
import {
  frameType,
  IDLE,
  MAX_FRAMES,
  MAX_RAW,
  type RunAction,
  type RunState,
  relayHost,
  runReducer,
  truncate,
} from "./runner-logic.ts";

const reduce = (actions: readonly RunAction[], from: RunState = IDLE): RunState =>
  actions.reduce(runReducer, from);
const [newer, older] = FIXTURE_EVENTS;
if (newer === undefined || older === undefined) throw new Error("fixtures missing");

describe("runReducer", () => {
  test("start → frames → events → EOSE → close", () => {
    const s = reduce([
      { type: "start" },
      { type: "frame", direction: "out", relay: "wss://a", raw: '["REQ","s",{}]' },
      { type: "event", event: older, relay: "wss://a" },
      { type: "event", event: newer, relay: "wss://a" },
      { type: "event", event: older, relay: "wss://b" },
      { type: "event", event: older, relay: "wss://b" },
      { type: "all-eose" },
    ]);
    expect(s.status).toBe("done");
    expect(s.frames).toEqual([
      { seq: 1, direction: "out", relay: "wss://a", type: "REQ", raw: '["REQ","s",{}]' },
    ]);
    expect(s.received.map((r) => r.event.id)).toEqual([newer.id, older.id]);
    expect(s.received[1]?.relays).toEqual(["wss://a", "wss://b"]);
    expect(reduce([{ type: "close" }], s).status).toBe("closed");
  });

  test("ties in created_at sort by id", () => {
    const a = { ...newer, id: "a".repeat(64) };
    const b = { ...newer, id: "b".repeat(64) };
    const s = reduce([
      { type: "start" },
      { type: "event", event: b, relay: "r" },
      { type: "event", event: a, relay: "r" },
    ]);
    expect(s.received.map((r) => r.event.id)).toEqual([a.id, b.id]);
  });

  test("errors accumulate; EOSE outside a run and close while idle are no-ops", () => {
    const error = { code: "connect-failed", relayUrl: "wss://x", message: "boom" } as const;
    expect(reduce([{ type: "error", error }]).errors).toEqual([error]);
    expect(reduce([{ type: "all-eose" }])).toEqual(IDLE);
    expect(reduce([{ type: "close" }])).toBe(IDLE);
    const restarted = reduce([{ type: "start" }, { type: "error", error }, { type: "start" }]);
    expect(restarted.errors).toEqual([]);
  });

  test("the frame log keeps only the newest frames, with increasing seq", () => {
    const frames = Array.from(
      { length: MAX_FRAMES + 5 },
      (): RunAction => ({
        type: "frame",
        direction: "in",
        relay: "r",
        raw: '["EOSE","s"]',
      }),
    );
    const s = reduce([{ type: "start" }, ...frames]);
    expect(s.frames).toHaveLength(MAX_FRAMES);
    expect(s.frames[0]?.seq).toBe(6);
    // seq survives restarts so keyed lists never reuse a key.
    expect(reduce([{ type: "start" }], s).seq).toBe(s.seq);
  });
});

describe("helpers", () => {
  test("frameType, truncate, relayHost", () => {
    expect(frameType(' [ "EVENT", "s", {}]')).toBe("EVENT");
    expect(frameType("garbage")).toBe("?");
    expect(truncate("abc")).toBe("abc");
    expect(truncate("x".repeat(MAX_RAW + 10))).toHaveLength(MAX_RAW);
    expect(relayHost("wss://relay.damus.io/")).toBe("relay.damus.io");
    expect(relayHost("ws://127.0.0.1:7447")).toBe("127.0.0.1:7447");
  });
});
