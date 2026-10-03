/**
 * Svelte attachments shared by every chart. Attachments (instead of inline `on*` handlers)
 * keep SVG marks free of a11y lint noise while still wiring pointer + keyboard identically.
 */

import { rovingIndex } from "@nostrschool/ui";
import type { Attachment } from "svelte/attachments";

/** Pointer hover and keyboard focus both reveal the same tooltip, so neither input is second-class. */
export const hoverTip =
  (show: () => void, hide: () => void): Attachment<Element> =>
  (el) => {
    const pairs = [
      ["pointerenter", show],
      ["focus", show],
      ["pointerleave", hide],
      ["blur", hide],
    ] as const;
    for (const [type, fn] of pairs) el.addEventListener(type, fn);
    return () => {
      for (const [type, fn] of pairs) el.removeEventListener(type, fn);
    };
  };

/**
 * Roving focus over every `[data-mark]` inside the container: one Tab stop for the chart,
 * arrows/Home/End to move between marks (a treemap can have dozens of cells).
 */
export const rovingMarks: Attachment<HTMLElement> = (container) => {
  const onKey = (e: KeyboardEvent) => {
    const marks = [...container.querySelectorAll("[data-mark]")];
    const active = document.activeElement;
    const current = active === null ? -1 : marks.indexOf(active);
    const next = rovingIndex(marks.length, current, e.key);
    const target = next === undefined ? undefined : marks[next];
    if (current === -1 || !(target instanceof SVGElement || target instanceof HTMLElement)) return;
    e.preventDefault();
    target.focus();
  };
  container.addEventListener("keydown", onKey);
  return () => container.removeEventListener("keydown", onKey);
};
