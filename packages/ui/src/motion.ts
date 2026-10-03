/**
 * Motion policy in one place: token-driven durations/springs and a live reduced-motion store.
 * Rule: under reduced motion every animation becomes an instant state change (no information
 * is lost — only the tween is skipped).
 */
import { tokens } from "@nostrschool/tokens";
import { atom, onMount, type ReadableAtom } from "nanostores";

export type DurationName = keyof typeof tokens.motion.duration;
export type EasingName = keyof typeof tokens.motion.easing;
export type SpringName = keyof typeof tokens.motion.spring;

const QUERY = "(prefers-reduced-motion: reduce)";

/** Current OS/browser preference. False on the server or where matchMedia is unavailable. */
export const prefersReducedMotion = (): boolean =>
  typeof globalThis.matchMedia === "function" && globalThis.matchMedia(QUERY).matches;

const reduced = atom<boolean>(false);
onMount(reduced, () => {
  reduced.set(prefersReducedMotion());
  if (typeof globalThis.matchMedia !== "function") return undefined;
  const mql = globalThis.matchMedia(QUERY);
  const update = (e: MediaQueryListEvent) => reduced.set(e.matches);
  mql.addEventListener("change", update);
  return () => mql.removeEventListener("change", update);
});

/** Live reduced-motion preference (subscribe in components: `$reducedMotion` in Svelte). */
export const $reducedMotion: ReadableAtom<boolean> = reduced;

/** Duration in ms from tokens; 0 when reduced motion is on (pass `reduce` to override). */
export const duration = (name: DurationName, reduce: boolean = prefersReducedMotion()): number =>
  reduce ? 0 : tokens.motion.duration[name];

/** Duration in seconds (what the `motion` library expects). */
export const durationSeconds = (name: DurationName, reduce?: boolean): number =>
  duration(name, reduce) / 1000;

/** Cubic-bezier control points for an easing token. */
export const easing = (name: EasingName): readonly [number, number, number, number] =>
  tokens.motion.easing[name] as unknown as readonly [number, number, number, number];

export interface SpringOptions {
  readonly type: "spring";
  readonly stiffness: number;
  readonly damping: number;
  readonly mass: number;
}
export interface InstantOptions {
  readonly duration: 0;
}

/**
 * Transition options for `animate()` from the `motion` package: a token spring, or an
 * instant (duration 0) transition under reduced motion.
 */
export const spring = (
  name: SpringName,
  reduce: boolean = prefersReducedMotion(),
): SpringOptions | InstantOptions =>
  reduce ? { duration: 0 } : { type: "spring", ...tokens.motion.spring[name] };

/** Tween options for `animate()`: token duration (s) + easing, or instant under reduced motion. */
export const tween = (
  durationName: DurationName,
  easingName: EasingName = "standard",
  reduce: boolean = prefersReducedMotion(),
): { readonly duration: number; readonly ease: readonly [number, number, number, number] } => ({
  duration: durationSeconds(durationName, reduce),
  ease: easing(easingName),
});
