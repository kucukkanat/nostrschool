import { describe, expect, test } from "bun:test";
import { edgeState, NODE_RADIUS, trimmed } from "./geometry.ts";
import { MODELS } from "./models.ts";
import { INITIAL_STATE } from "./sandbox.ts";

describe("trimmed", () => {
  test("pulls both ends in by the node radius", () => {
    expect(trimmed({ x: 0, y: 0 }, { x: 100, y: 0 })).toEqual({
      x1: NODE_RADIUS,
      y1: 0,
      x2: 100 - NODE_RADIUS,
      y2: 0,
    });
    const s = trimmed({ x: 0, y: 0 }, { x: 0, y: 50 }, 5);
    expect(s).toEqual({ x1: 0, y1: 5, x2: 0, y2: 45 });
  });
  test("leaves overlapping nodes untouched", () => {
    expect(trimmed({ x: 0, y: 0 }, { x: 10, y: 0 })).toEqual({ x1: 0, y1: 0, x2: 10, y2: 0 });
  });
});

describe("edgeState", () => {
  const { central, bluesky } = MODELS;
  const link = { from: "alice", to: "platform" } as const;
  test("live, dead and banned links", () => {
    expect(edgeState(central, INITIAL_STATE, link)).toBe("live");
    expect(edgeState(central, { down: ["platform"], banned: false }, link)).toBe("dead");
    expect(edgeState(central, { down: [], banned: true }, link)).toBe("banned");
    expect(edgeState(central, { down: [], banned: true }, { from: "bob", to: "platform" })).toBe(
      "live",
    );
    expect(
      edgeState(
        bluesky,
        { down: [], banned: true },
        { from: "appview", to: "alice", oneWay: true },
      ),
    ).toBe("banned");
  });
});
