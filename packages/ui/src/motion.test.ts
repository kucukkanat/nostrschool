import { expect, test } from "bun:test";
import {
  $reducedMotion,
  duration,
  durationSeconds,
  easing,
  prefersReducedMotion,
  spring,
  tween,
} from "./motion.ts";

test("durations come from tokens and collapse under reduced motion", () => {
  expect(duration("fast", false)).toBe(120);
  expect(duration("fast", true)).toBe(0);
  expect(durationSeconds("normal", false)).toBeCloseTo(0.22);
});

test("springs and tweens", () => {
  expect(spring("bouncy", false)).toEqual({ type: "spring", stiffness: 300, damping: 12, mass: 1 });
  expect(spring("bouncy", true)).toEqual({ duration: 0 });
  expect(easing("standard")).toEqual([0.2, 0, 0, 1]);
  expect(tween("slow", "bounce", false)).toEqual({ duration: 0.36, ease: [0.34, 1.56, 0.64, 1] });
  expect(tween("slow", undefined, true).duration).toBe(0);
});

test("reduced-motion store tracks matchMedia (happy-dom reports no preference)", () => {
  expect(prefersReducedMotion()).toBe(false);
  const values: boolean[] = [];
  const off = $reducedMotion.subscribe((v) => values.push(v));
  off();
  expect(values).toEqual([false]);
});
