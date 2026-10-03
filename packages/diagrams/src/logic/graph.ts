/** Pure logic behind ForceGraph: stats, adjacency, keyboard navigation and a d3-force layout. */
import { ok, type Result } from "@nostrschool/protocol";
import { vars } from "@nostrschool/tokens";
import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
  type Simulation,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from "d3";
import type { GraphLink, GraphNode } from "../types.ts";
import { type DiagramError, knownRefs, uniqueIds } from "./validate.ts";

export interface NodeStats {
  readonly following: readonly string[];
  readonly followers: readonly string[];
}

/** Who follows whom. "mutual" counts both ways; "relay" links are not social and are ignored. */
export const graphStats = (
  nodes: readonly GraphNode[],
  links: readonly GraphLink[],
): ReadonlyMap<string, NodeStats> => {
  const directed = links.flatMap((l): (readonly [string, string])[] =>
    l.kind === "relay"
      ? []
      : l.kind === "mutual"
        ? [
            [l.source, l.target],
            [l.target, l.source],
          ]
        : [[l.source, l.target]],
  );
  return new Map(
    nodes.map((n) => [
      n.id,
      {
        following: [...new Set(directed.filter(([s]) => s === n.id).map(([, t]) => t))],
        followers: [...new Set(directed.filter(([, t]) => t === n.id).map(([s]) => s))],
      },
    ]),
  );
};

/** Ids directly linked to `id` in either direction (any link kind). */
export const neighbors = (links: readonly GraphLink[], id: string): ReadonlySet<string> =>
  new Set(links.flatMap((l) => (l.source === id ? [l.target] : l.target === id ? [l.source] : [])));

const PALETTE = [
  vars.color.chart1,
  vars.color.chart2,
  vars.color.chart3,
  vars.color.chart4,
  vars.color.chart5,
  vars.color.chart6,
  vars.color.chart7,
  vars.color.chart8,
] as const;

/** Stable color per group, in first-seen order (ungrouped nodes share the first color). */
export const groupColors = (nodes: readonly GraphNode[]): ReadonlyMap<string, string> => {
  const groups = [...new Set(nodes.map((n) => n.group ?? ""))];
  return new Map(groups.map((g, i) => [g, PALETTE[i % PALETTE.length] ?? vars.color.chart1]));
};

export interface Point {
  readonly id: string;
  readonly x: number;
  readonly y: number;
}

export type Direction = "up" | "down" | "left" | "right";

/**
 * Spatial arrow-key navigation: the nearest point within the 90° cone facing `dir`,
 * or undefined when nothing lies that way.
 */
export const nearestInDirection = (
  points: readonly Point[],
  fromId: string,
  dir: Direction,
): string | undefined => {
  const from = points.find((p) => p.id === fromId);
  if (from === undefined) return undefined;
  const scored = points.flatMap((p) => {
    const dx = p.x - from.x;
    const dy = p.y - from.y;
    const [along, across] =
      dir === "right"
        ? [dx, dy]
        : dir === "left"
          ? [-dx, dy]
          : dir === "down"
            ? [dy, dx]
            : [-dy, dx];
    return p.id !== fromId && along > 0 && Math.abs(across) <= along
      ? [{ id: p.id, d: along * along + across * across }]
      : [];
  });
  return scored.reduce<{ id: string; d: number } | undefined>(
    (best, s) => (best === undefined || s.d < best.d ? s : best),
    undefined,
  )?.id;
};

export const KEY_DIRECTIONS: Readonly<Record<string, Direction>> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
};

export interface SimNode extends SimulationNodeDatum {
  readonly id: string;
}
export type SimLink = SimulationLinkDatum<SimNode>;

/** Seeded LCG so layouts are identical across reloads, SSR and tests. */
export const seededRandom = (seed: number): (() => number) => {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
};

/** Builds a stopped simulation; callers either `tick(n)` it (static) or `restart()` it (animated). */
export const createSimulation = (
  nodes: readonly GraphNode[],
  links: readonly GraphLink[],
  width: number,
  height: number,
): Simulation<SimNode, SimLink> => {
  const simNodes: SimNode[] = nodes.map((n) => ({ id: n.id }));
  const simLinks: SimLink[] = links.map((l) => ({ source: l.source, target: l.target }));
  const r = Math.min(width, height);
  return (
    forceSimulation(simNodes)
      .randomSource(seededRandom(42))
      .force(
        "link",
        forceLink<SimNode, SimLink>(simLinks)
          .id((d) => d.id)
          .distance(r / 2.5),
      )
      // Strong repulsion + weak centring spreads small graphs out instead of knotting them.
      .force("charge", forceManyBody().strength(-r * 2.5))
      .force("collide", forceCollide(r / 10))
      .force("x", forceX(width / 2).strength(0.03))
      .force("y", forceY(height / 2).strength(0.04))
      .force("center", forceCenter(width / 2, height / 2))
      .stop()
  );
};

/** Keeps a coordinate inside the drawing with a margin for the node radius and label. */
export const clampToBox = (v: number, size: number, margin: number): number =>
  Math.min(size - margin, Math.max(margin, v));

/**
 * Linearly rescales points so their bounding box fills [margin, size - margin] on each axis.
 * Forces only fix *relative* positions; without this a 7-node graph settles into a knot that
 * uses a third of the drawing. Degenerate axes (one node, a straight line) are centred.
 */
export const fitToBox = (
  points: readonly Point[],
  width: number,
  height: number,
  margin: number,
): readonly Point[] => {
  const axis = (vs: readonly number[], size: number): ((v: number) => number) => {
    const lo = Math.min(...vs);
    const span = Math.max(...vs) - lo;
    const room = Math.max(0, size - margin * 2);
    return span < 1e-6 ? () => size / 2 : (v) => margin + ((v - lo) / span) * room;
  };
  if (points.length === 0) return points;
  const fx = axis(
    points.map((p) => p.x),
    width,
  );
  const fy = axis(
    points.map((p) => p.y),
    height,
  );
  return points.map((p) => ({ id: p.id, x: fx(p.x), y: fy(p.y) }));
};

/** Settled layout, fitted to the box (what reduced-motion users and the first paint see). */
export const staticLayout = (
  nodes: readonly GraphNode[],
  links: readonly GraphLink[],
  width: number,
  height: number,
  margin: number,
  ticks = 300,
): readonly Point[] =>
  fitToBox(
    createSimulation(nodes, links, width, height)
      .tick(ticks)
      .nodes()
      .map((n) => ({ id: n.id, x: n.x ?? width / 2, y: n.y ?? height / 2 })),
    width,
    height,
    margin,
  );

export const validateGraph = (
  nodes: readonly GraphNode[],
  links: readonly GraphLink[],
): Result<true, DiagramError> => {
  const ids = uniqueIds(nodes, "node");
  if (!ids.ok) return ids;
  const refs = knownRefs(
    ids.value,
    links.flatMap((l) => [l.source, l.target]),
    "node",
  );
  return refs.ok ? ok(true) : refs;
};
