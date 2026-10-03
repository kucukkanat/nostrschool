/**
 * Svelte actions for microinteractions, shared by every island. All go through the token springs
 * in motion.ts, so reduced motion turns them into instant (no-op) transitions. The ui primitives
 * press with the CSS riso recipe (lift on hover, shadow collapses on press, see Button); these
 * actions are for custom controls and for feedback that appears.
 */

import { tokens } from "@nostrschool/tokens";
import { animate } from "motion";
import { prefersReducedMotion, type SpringName, spring, tween } from "./motion.ts";

export interface SquishOptions {
  /** Scale while pressed. Default 0.97: a firm press, not a rubbery squash. */
  readonly scale?: number;
  readonly disabled?: boolean;
}

/** Press squish: shrinks a touch on pointer down, settles back on release. */
export const squish = (node: HTMLElement, options: SquishOptions = {}) => {
  let opts = options;
  const press = () => {
    if (opts.disabled === true || prefersReducedMotion()) return;
    animate(node, { scale: opts.scale ?? 0.97 }, spring("snappy"));
  };
  const release = () => {
    if (prefersReducedMotion()) return;
    animate(node, { scale: 1 }, spring("snappy"));
  };
  const events = [
    ["pointerdown", press],
    ["pointerup", release],
    ["pointerleave", release],
    ["pointercancel", release],
  ] as const;
  for (const [type, fn] of events) node.addEventListener(type, fn);
  return {
    update: (next: SquishOptions = {}) => {
      opts = next;
    },
    destroy: () => {
      for (const [type, fn] of events) node.removeEventListener(type, fn);
    },
  };
};

export interface PopOptions {
  readonly spring?: SpringName;
  /** Starting scale (default 0.92). */
  readonly from?: number;
}

/** Entrance pop for feedback that appears (quiz result, hover-card, "Copied!"). */
export const pop = (node: HTMLElement | SVGElement, options: PopOptions = {}) => {
  if (!prefersReducedMotion())
    animate(
      node,
      { scale: [options.from ?? 0.92, 1], opacity: [0, 1] },
      spring(options.spring ?? "bouncy"),
    );
};

/** Horizontal shake for "wrong" feedback; a no-op under reduced motion (color/text carry the meaning). */
export const shake = (node: HTMLElement) => {
  if (prefersReducedMotion()) return;
  const d = Number.parseFloat(tokens.space.xs);
  animate(node, { x: [0, -d, d, -d / 2, d / 2, 0] }, tween("slow"));
};
