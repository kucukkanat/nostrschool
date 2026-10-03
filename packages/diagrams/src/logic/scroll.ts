/** Geometry for wide diagrams that scroll sideways on phones (follow playback, edge hints). */

export interface ScrollView {
  readonly scrollLeft: number;
  readonly clientWidth: number;
  readonly scrollWidth: number;
}

/** A horizontal span in the scroll content's coordinates (0 = content start). */
export interface Span {
  readonly start: number;
  readonly end: number;
}

/**
 * The scrollLeft that brings `target` into view with `pad` breathing room, moving as little
 * as possible ("nearest"). Targets wider than the viewport are centered so both the sender
 * and the receiver of a long arrow stay partly visible.
 */
export const followScrollLeft = (view: ScrollView, target: Span, pad = 0): number => {
  const max = Math.max(0, view.scrollWidth - view.clientWidth);
  const clampLeft = (v: number): number => Math.min(max, Math.max(0, v));
  const width = target.end - target.start;
  if (width + pad * 2 > view.clientWidth)
    return clampLeft(target.start + width / 2 - view.clientWidth / 2);
  if (target.start - pad < view.scrollLeft) return clampLeft(target.start - pad);
  if (target.end + pad > view.scrollLeft + view.clientWidth)
    return clampLeft(target.end + pad - view.clientWidth);
  return clampLeft(view.scrollLeft);
};

/** Which edges hide content (drives the fade hint). One pixel of slack absorbs subpixel rounding. */
export const hiddenEdges = (
  view: ScrollView,
): { readonly start: boolean; readonly end: boolean } => ({
  start: view.scrollLeft > 1,
  end: view.scrollLeft + view.clientWidth < view.scrollWidth - 1,
});
