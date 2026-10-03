/** Pure geometry for the shell's illustrations: reading progress and the hero network. */

export interface Point {
  readonly x: number;
  readonly y: number;
}

const clamp01 = (n: number): number => (Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0);

/** 0..1 through the scrollable document; pages that don't scroll count as fully read. */
export const readingProgress = (m: {
  readonly scrollTop: number;
  readonly scrollHeight: number;
  readonly clientHeight: number;
}): number => {
  const scrollable = m.scrollHeight - m.clientHeight;
  return scrollable <= 0 ? 1 : clamp01(m.scrollTop / scrollable);
};

export const lerp = (a: Point, b: Point, t: number): Point => {
  const k = clamp01(t);
  return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k };
};

/** Phase (0..1) of a looping animation at `elapsedMs`, offset per packet so they don't bunch up. */
export const loopPhase = (elapsedMs: number, periodMs: number, offset = 0): number => {
  if (periodMs <= 0) return 0;
  const raw = elapsedMs / periodMs + offset;
  return raw - Math.floor(raw);
};

export type HeroNodeKind = "user" | "relay";

export interface HeroNode extends Point {
  readonly id: string;
  readonly kind: HeroNodeKind;
}

export interface HeroEdge {
  readonly from: string;
  readonly to: string;
}

/**
 * The landing illustration: users (outer ring) each talk to several relays (inner ring), and no
 * relay is special. Coordinates live in a 0..100 square viewBox.
 */
export const HERO_NODES: readonly HeroNode[] = [
  { id: "r1", kind: "relay", x: 38, y: 36 },
  { id: "r2", kind: "relay", x: 64, y: 40 },
  { id: "r3", kind: "relay", x: 50, y: 64 },
  { id: "u1", kind: "user", x: 14, y: 18 },
  { id: "u2", kind: "user", x: 86, y: 16 },
  { id: "u3", kind: "user", x: 90, y: 70 },
  { id: "u4", kind: "user", x: 50, y: 92 },
  { id: "u5", kind: "user", x: 10, y: 72 },
];

export const HERO_EDGES: readonly HeroEdge[] = [
  { from: "u1", to: "r1" },
  { from: "u1", to: "r2" },
  { from: "u2", to: "r2" },
  { from: "u2", to: "r1" },
  { from: "u3", to: "r2" },
  { from: "u3", to: "r3" },
  { from: "u4", to: "r3" },
  { from: "u5", to: "r3" },
  { from: "u5", to: "r1" },
];

export interface ResolvedEdge {
  readonly id: string;
  readonly a: Point;
  readonly b: Point;
}

/** Joins edges to node coordinates; dangling edges are a programming error, so fail loud. */
export const resolveEdges = (
  nodes: readonly HeroNode[],
  edges: readonly HeroEdge[],
): readonly ResolvedEdge[] =>
  edges.map((e) => {
    const a = nodes.find((n) => n.id === e.from);
    const b = nodes.find((n) => n.id === e.to);
    if (a === undefined || b === undefined) throw new Error(`dangling edge ${e.from}->${e.to}`);
    return { id: `${e.from}-${e.to}`, a, b };
  });
