import { describe, expect, test } from "bun:test";
import { unwrap } from "@nostrschool/protocol";
import type { GraphLink, GraphNode, SequenceMessage, SwimlaneStep } from "../types.ts";
import {
  clampToBox,
  createSimulation,
  fitToBox,
  graphStats,
  groupColors,
  nearestInDirection,
  neighbors,
  seededRandom,
  staticLayout,
  validateGraph,
} from "./graph.ts";
import {
  arrowDirection,
  DEFAULT_METRICS,
  fitLaneWidth,
  laneCenter,
  MONO_CHAR,
  minLaneWidth,
  sequenceLayout,
  swimlaneLayout,
  visibleHeight,
} from "./layout.ts";
import { stageState, truncate } from "./pipeline.ts";
import { play, stepDelay, tick } from "./playback.ts";
import { followScrollLeft, hiddenEdges } from "./scroll.ts";
import { clamp, knownRefs, uniqueIds } from "./validate.ts";

describe("validate", () => {
  test("uniqueIds finds duplicates", () => {
    expect(unwrap(uniqueIds([{ id: "a" }, { id: "b" }], "x")).size).toBe(2);
    const r = uniqueIds([{ id: "a" }, { id: "a" }], "lane");
    expect(r.ok ? null : r.error).toEqual({
      code: "duplicate-id",
      message: 'Duplicate lane id "a"',
    });
  });
  test("knownRefs reports the first unknown", () => {
    expect(knownRefs(new Set(["a"]), ["a"], "lane").ok).toBe(true);
    const r = knownRefs(new Set(["a"]), ["a", "z"], "lane");
    expect(r.ok ? null : r.error.code).toBe("unknown-ref");
  });
  test("clamp truncates, bounds and rejects non-finite", () => {
    expect(clamp(5.7, 0, 3)).toBe(3);
    expect(clamp(-4, -1, 3)).toBe(-1);
    expect(clamp(2.9, 0, 9)).toBe(2);
    expect(clamp(Number.NaN, -1, 3)).toBe(-1);
  });
});

describe("playback state machine", () => {
  test("tick advances and stops at the last step", () => {
    expect(tick({ step: -1, playing: true }, 2)).toEqual({ step: 0, playing: true });
    expect(tick({ step: 1, playing: true }, 2)).toEqual({ step: 2, playing: false });
    expect(tick({ step: 2, playing: true }, 2)).toEqual({ step: 2, playing: false });
    expect(tick({ step: 0, playing: false }, 2)).toEqual({ step: 1, playing: false });
  });
  test("play rewinds at the end and refuses empty timelines", () => {
    expect(play({ step: 2, playing: false }, -1, 2)).toEqual({ step: -1, playing: true });
    expect(play({ step: 0, playing: false }, -1, 2)).toEqual({ step: 0, playing: true });
    expect(play({ step: -1, playing: false }, -1, -1)).toEqual({ step: -1, playing: false });
  });
  test("stepDelay scales by speed with safe fallbacks", () => {
    expect(stepDelay(1000, 2)).toBe(500);
    expect(stepDelay(1000, undefined)).toBe(1000);
    expect(stepDelay(1000, 0)).toBe(1000);
    expect(stepDelay(1000, Number.POSITIVE_INFINITY)).toBe(1000);
    expect(stepDelay(-5, 1)).toBe(0);
  });
});

describe("lane layout", () => {
  const lanes = [
    { id: "a", label: "A" },
    { id: "b", label: "B" },
  ];
  test("helpers", () => {
    expect(laneCenter(1, 100)).toBe(150);
    expect(arrowDirection(1, 1)).toBe("self");
    expect(arrowDirection(1, 2)).toBe("right");
    expect(arrowDirection(2, 1)).toBe("left");
  });
  test("sequenceLayout positions lanes and rows", () => {
    const messages: SequenceMessage[] = [
      { id: "1", from: "a", to: "b", label: "x" },
      { id: "2", from: "b", to: "a", label: "y" },
      { id: "3", from: "b", to: "b", label: "z" },
    ];
    const m = { laneWidth: 100, headerHeight: 50, rowHeight: 40 };
    const L = unwrap(sequenceLayout(lanes, messages, m));
    expect(L.width).toBe(200);
    expect(L.height).toBe(50 + 3.5 * 40);
    expect(L.lanes.map((l) => l.x)).toEqual([50, 150]);
    expect(L.messages.map((x) => [x.x1, x.x2, x.y, x.direction])).toEqual([
      [50, 150, 70, "right"],
      [150, 50, 110, "left"],
      [150, 150, 150, "self"],
    ]);
  });
  test("fitLaneWidth narrows lanes on phones but never below the longest label", () => {
    const labels = ["Your client", "Relay Alpha", "Relay Beta"];
    expect(fitLaneWidth(0, labels)).toBe(DEFAULT_METRICS.laneWidth);
    expect(fitLaneWidth(300, [])).toBe(DEFAULT_METRICS.laneWidth);
    expect(fitLaneWidth(1200, labels)).toBe(DEFAULT_METRICS.laneWidth);
    const min = minLaneWidth(labels);
    expect(min).toBeGreaterThanOrEqual("Relay Alpha".length * MONO_CHAR);
    expect(fitLaneWidth(330, labels)).toBe(Math.max(min, 110));
    expect(fitLaneWidth(120, labels)).toBe(min);
    expect(minLaneWidth(["a", "b"])).toBe(96);
    // A label wider than the default lane never widens past the default.
    expect(fitLaneWidth(100, ["x".repeat(40)])).toBe(DEFAULT_METRICS.laneWidth);
  });
  test("visibleHeight only reaches the rows revealed so far", () => {
    const m = { laneWidth: 100, headerHeight: 50, rowHeight: 40 };
    expect(visibleHeight(-1, 5, m)).toBe(50 + 1.5 * 40);
    expect(visibleHeight(0, 5, m)).toBe(50 + 1.5 * 40);
    expect(visibleHeight(2, 5, m)).toBe(50 + 3.5 * 40);
    expect(visibleHeight(9, 5, m)).toBe(50 + 5.5 * 40);
    expect(visibleHeight(-1, 0, m)).toBe(50 + 1.5 * 40);
  });
  test("sequenceLayout rejects bad data", () => {
    const dupLane = sequenceLayout([...lanes, { id: "a", label: "again" }], []);
    expect(dupLane.ok ? null : dupLane.error.code).toBe("duplicate-id");
    const dupMsg = sequenceLayout(lanes, [
      { id: "1", from: "a", to: "b", label: "" },
      { id: "1", from: "a", to: "b", label: "" },
    ]);
    expect(dupMsg.ok ? null : dupMsg.error.code).toBe("duplicate-id");
    const bad = sequenceLayout(lanes, [{ id: "1", from: "a", to: "c", label: "" }]);
    expect(bad.ok ? null : bad.error.code).toBe("unknown-ref");
    expect(unwrap(sequenceLayout([], [])).width).toBeGreaterThan(0);
  });
  test("swimlaneLayout adds hand-off targets only across lanes", () => {
    const steps: SwimlaneStep[] = [
      { id: "s1", lane: "a", label: "sign", to: "b" },
      { id: "s2", lane: "b", label: "store" },
      { id: "s3", lane: "b", label: "self", to: "b" },
    ];
    const L = unwrap(swimlaneLayout(lanes, steps));
    expect(L.steps[0]?.toX).toBe(240);
    expect(L.steps[1]?.toX).toBeUndefined();
    expect(L.steps[2]?.toX).toBeUndefined();
    expect(L.steps.map((s) => s.y)).toEqual([88, 152, 216]);
  });
  test("swimlaneLayout rejects bad data", () => {
    const a = swimlaneLayout(
      [lanes[0], lanes[0]].flatMap((l) => (l ? [l] : [])),
      [],
    );
    expect(a.ok ? null : a.error.code).toBe("duplicate-id");
    const b = swimlaneLayout(lanes, [
      { id: "x", lane: "a", label: "" },
      { id: "x", lane: "a", label: "" },
    ]);
    expect(b.ok ? null : b.error.code).toBe("duplicate-id");
    const c = swimlaneLayout(lanes, [{ id: "x", lane: "a", label: "", to: "q" }]);
    expect(c.ok ? null : c.error.message).toBe('Unknown lane "q"');
  });
});

describe("pipeline", () => {
  test("stageState for each status", () => {
    const states = (active: number, status: Parameters<typeof stageState>[2], errorAt?: number) =>
      [0, 1, 2].map((i) => stageState(i, active, status, errorAt));
    expect(states(-1, "idle")).toEqual(["pending", "pending", "pending"]);
    expect(states(1, "running")).toEqual(["done", "active", "pending"]);
    expect(states(0, "ok")).toEqual(["done", "done", "done"]);
    expect(states(2, "error", 1)).toEqual(["done", "error", "pending"]);
    expect(states(2, "error")).toEqual(["done", "done", "error"]);
  });
  test("truncate", () => {
    expect(truncate("abc", 5)).toEqual({ text: "abc", clipped: false });
    expect(truncate("abcdef", 4)).toEqual({ text: "abc…", clipped: true });
  });
});

describe("graph", () => {
  const nodes: GraphNode[] = [
    { id: "a", label: "Alice", group: "x" },
    { id: "b", label: "Bob", group: "y" },
    { id: "c", label: "Carol" },
  ];
  const links: GraphLink[] = [
    { source: "a", target: "b" },
    { source: "b", target: "c", kind: "mutual" },
    { source: "c", target: "a", kind: "relay" },
    { source: "a", target: "b", kind: "follows" },
  ];
  test("graphStats counts follows; mutual both ways; relay ignored; duplicates collapsed", () => {
    const s = graphStats(nodes, links);
    expect(s.get("a")).toEqual({ following: ["b"], followers: [] });
    expect(s.get("b")).toEqual({ following: ["c"], followers: ["a", "c"] });
    expect(s.get("c")).toEqual({ following: ["b"], followers: ["b"] });
  });
  test("neighbors is undirected over every link kind", () => {
    expect([...neighbors(links, "c")].sort()).toEqual(["a", "b"]);
    expect(neighbors(links, "zz").size).toBe(0);
  });
  test("groupColors is stable and token based", () => {
    const g = groupColors(nodes);
    expect(g.get("x")).toBe("var(--color-chart-1)");
    expect(g.get("y")).toBe("var(--color-chart-2)");
    expect(g.get("")).toBe("var(--color-chart-3)");
    const many = groupColors(
      Array.from({ length: 9 }, (_, i) => ({ id: `${i}`, label: "", group: `${i}` })),
    );
    expect(many.get("8")).toBe("var(--color-chart-1)");
  });
  test("nearestInDirection picks the closest point within the cone", () => {
    const pts = [
      { id: "o", x: 0, y: 0 },
      { id: "r1", x: 10, y: 2 },
      { id: "r2", x: 5, y: 4 },
      { id: "d", x: 1, y: 10 },
      { id: "u", x: 0, y: -8 },
      { id: "l", x: -3, y: 0 },
    ];
    expect(nearestInDirection(pts, "o", "right")).toBe("r2");
    expect(nearestInDirection(pts, "o", "down")).toBe("d");
    expect(nearestInDirection(pts, "o", "up")).toBe("u");
    expect(nearestInDirection(pts, "o", "left")).toBe("l");
    expect(nearestInDirection(pts, "l", "left")).toBeUndefined();
    expect(nearestInDirection(pts, "missing", "left")).toBeUndefined();
  });
  test("staticLayout is deterministic and inside the box", () => {
    const a = staticLayout(nodes, links, 300, 200, 20);
    const b = staticLayout(nodes, links, 300, 200, 20);
    expect(a).toEqual(b);
    for (const p of a) {
      expect(p.x).toBeGreaterThanOrEqual(20);
      expect(p.x).toBeLessThanOrEqual(280);
      expect(p.y).toBeGreaterThanOrEqual(20);
      expect(p.y).toBeLessThanOrEqual(180);
    }
    expect(createSimulation(nodes, links, 300, 200).nodes()).toHaveLength(3);
  });
  test("staticLayout fills the box instead of knotting in the middle", () => {
    const seven = Array.from({ length: 7 }, (_, i) => ({ id: `n${i}`, label: `N${i}` }));
    const ring = seven.map((n, i) => ({ source: n.id, target: `n${(i + 1) % 7}` }));
    const pts = staticLayout(seven, ring, 560, 440, 54);
    const xs = pts.map((p) => p.x);
    const ys = pts.map((p) => p.y);
    expect(Math.min(...xs)).toBeCloseTo(54);
    expect(Math.max(...xs)).toBeCloseTo(506);
    expect(Math.min(...ys)).toBeCloseTo(54);
    expect(Math.max(...ys)).toBeCloseTo(386);
  });
  test("fitToBox rescales each axis and centres degenerate ones", () => {
    expect(fitToBox([], 100, 100, 10)).toEqual([]);
    expect(
      fitToBox(
        [
          { id: "a", x: 40, y: 5 },
          { id: "b", x: 60, y: 5 },
          { id: "c", x: 50, y: 5 },
        ],
        200,
        100,
        10,
      ),
    ).toEqual([
      { id: "a", x: 10, y: 50 },
      { id: "b", x: 190, y: 50 },
      { id: "c", x: 100, y: 50 },
    ]);
    expect(fitToBox([{ id: "solo", x: 3, y: 4 }], 100, 60, 50)).toEqual([
      { id: "solo", x: 50, y: 30 },
    ]);
  });
  test("seededRandom is reproducible and in [0, 1)", () => {
    const a = seededRandom(7);
    const b = seededRandom(7);
    const xs = [a(), a(), a()];
    expect(xs).toEqual([b(), b(), b()]);
    for (const x of xs) expect(x >= 0 && x < 1).toBe(true);
  });
  test("clampToBox", () => {
    expect(clampToBox(-5, 100, 10)).toBe(10);
    expect(clampToBox(500, 100, 10)).toBe(90);
    expect(clampToBox(50, 100, 10)).toBe(50);
  });
  test("validateGraph", () => {
    expect(validateGraph(nodes, links).ok).toBe(true);
    const dup = validateGraph([...nodes, { id: "a", label: "again" }], []);
    expect(dup.ok ? null : dup.error.code).toBe("duplicate-id");
    const bad = validateGraph(nodes, [{ source: "a", target: "q" }]);
    expect(bad.ok ? null : bad.error.code).toBe("unknown-ref");
  });
});

describe("scroll", () => {
  const view = { scrollLeft: 0, clientWidth: 300, scrollWidth: 640 };
  test("followScrollLeft moves as little as needed to reveal the target", () => {
    expect(followScrollLeft(view, { start: 20, end: 120 }, 10)).toBe(0);
    expect(followScrollLeft(view, { start: 400, end: 500 }, 10)).toBe(210);
    expect(followScrollLeft({ ...view, scrollLeft: 300 }, { start: 100, end: 200 }, 10)).toBe(90);
    expect(followScrollLeft(view, { start: 560, end: 640 }, 20)).toBe(340);
  });
  test("followScrollLeft centres targets wider than the viewport and clamps", () => {
    expect(followScrollLeft(view, { start: 100, end: 500 })).toBe(150);
    expect(followScrollLeft(view, { start: 0, end: 640 })).toBe(170);
    expect(followScrollLeft({ ...view, scrollWidth: 200 }, { start: 0, end: 100 })).toBe(0);
  });
  test("hiddenEdges reports which sides hide content", () => {
    expect(hiddenEdges(view)).toEqual({ start: false, end: true });
    expect(hiddenEdges({ ...view, scrollLeft: 100 })).toEqual({ start: true, end: true });
    expect(hiddenEdges({ ...view, scrollLeft: 340 })).toEqual({ start: true, end: false });
    expect(hiddenEdges({ scrollLeft: 0, clientWidth: 300, scrollWidth: 300 })).toEqual({
      start: false,
      end: false,
    });
  });
});

describe("ink geometry", () => {
  test("reads small radii and hard shadow offsets from tokens", async () => {
    const ink = await import("./ink.ts");
    expect(ink.INK_RADIUS).toBe(2);
    expect(ink.BOX_RADIUS).toBe(4);
    expect(ink.SHADOW_SM).toBe(2);
    expect(ink.SHADOW).toBe(3);
    expect(ink.HALFTONE_DOT).toBeLessThan(ink.HALFTONE_CELL / 2);
    expect(() => ink.parsePx("auto")).toThrow("expected a px token");
  });
});
