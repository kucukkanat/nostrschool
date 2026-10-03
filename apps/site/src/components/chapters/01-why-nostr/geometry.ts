/** Diagram geometry for the sandbox SVG (pure, so the drawing math is testable). */
import type { NetworkModel, NodeId, SandboxLink, SandboxNode, SandboxState } from "./sandbox.ts";
import { BANNABLE } from "./sandbox.ts";

export const NODE_RADIUS = 22;

export interface Segment {
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
}

/** The a→b segment trimmed by `r` at both ends, so arrowheads stop at the node's rim. */
export const trimmed = (
  a: Pick<SandboxNode, "x" | "y">,
  b: Pick<SandboxNode, "x" | "y">,
  r: number = NODE_RADIUS,
): Segment => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy);
  // Overlapping nodes: nothing sensible to trim, draw the raw segment.
  const k = len <= 2 * r ? 0 : r / len;
  return { x1: a.x + dx * k, y1: a.y + dy * k, x2: b.x - dx * k, y2: b.y - dy * k };
};

export type EdgeState = "live" | "dead" | "banned";

export const edgeState = (
  model: NetworkModel,
  state: SandboxState,
  link: SandboxLink,
): EdgeState => {
  if (state.down.includes(link.from) || state.down.includes(link.to)) return "dead";
  const ends: readonly NodeId[] = [link.from, link.to];
  return state.banned && ends.includes(model.banAuthority) && ends.includes(BANNABLE)
    ? "banned"
    : "live";
};
