/** Diagram animations, all routed through @nostrschool/ui's reduced-motion-aware options. */
import { spring, tween } from "@nostrschool/ui";
import { animate } from "motion";

/** Springy entrance for something that just appeared or became current. */
export const popIn = (el: Element, reduce: boolean): void => {
  if (reduce) return;
  animate(el, { opacity: [0, 1], scale: [0.85, 1] }, spring("bouncy", reduce));
};

/** Moves a packet along a horizontal wire (SVG user units == CSS px inside the viewBox). */
export const travel = (el: Element, x1: number, x2: number, reduce: boolean): void => {
  if (reduce) return;
  animate(
    el,
    { transform: [`translateX(${x1 - x2}px)`, "translateX(0px)"], opacity: [0.4, 1] },
    tween("packet", "emphasized", reduce),
  );
};
