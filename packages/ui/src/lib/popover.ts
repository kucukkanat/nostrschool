/**
 * Horizontal offset (px) that moves a box starting at `left` with `width` inside the viewport,
 * keeping `margin` on both sides. Prefers the box's natural position; when it can't fit at all
 * the start edge wins (reading starts there).
 */
export const viewportShift = (
  left: number,
  width: number,
  viewport: number,
  margin: number,
): number => Math.max(margin, Math.min(left, viewport - margin - width)) - left;
