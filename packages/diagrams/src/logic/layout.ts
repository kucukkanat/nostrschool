/** Layout math for the lane-based diagrams (SequenceDiagram, Swimlane), in SVG user units. */
import { ok, type Result } from "@nostrschool/protocol";
import type { SequenceLane, SequenceMessage, SwimlaneLane, SwimlaneStep } from "../types.ts";
import { type DiagramError, knownRefs, uniqueIds } from "./validate.ts";

export interface LaneMetrics {
  /** Width of one lane column. */
  readonly laneWidth: number;
  /** Space reserved for lane headers. */
  readonly headerHeight: number;
  /** Vertical distance between consecutive messages/steps. */
  readonly rowHeight: number;
}

/** Fixed units: the SVG scales with its container (viewBox), so these are proportions, not px. */
export const DEFAULT_METRICS: LaneMetrics = { laneWidth: 160, headerHeight: 56, rowHeight: 64 };

/** Center x of column `index` among equal columns of `laneWidth`. */
export const laneCenter = (index: number, laneWidth: number): number => (index + 0.5) * laneWidth;

export type ArrowDirection = "right" | "left" | "self";

export const arrowDirection = (x1: number, x2: number): ArrowDirection =>
  x1 === x2 ? "self" : x2 > x1 ? "right" : "left";

export interface PositionedLane<L> {
  readonly lane: L;
  readonly x: number;
}

export interface PositionedMessage {
  readonly message: SequenceMessage;
  readonly index: number;
  readonly x1: number;
  readonly x2: number;
  readonly y: number;
  readonly direction: ArrowDirection;
}

export interface SequenceLayout {
  readonly width: number;
  readonly height: number;
  readonly lanes: readonly PositionedLane<SequenceLane>[];
  readonly messages: readonly PositionedMessage[];
}

const lanePositions = <L extends { readonly id: string }>(
  lanes: readonly L[],
  m: LaneMetrics,
): ReadonlyMap<string, number> => new Map(lanes.map((l, i) => [l.id, laneCenter(i, m.laneWidth)]));

const xOf = (xs: ReadonlyMap<string, number>, id: string): number => xs.get(id) ?? 0;

export const sequenceLayout = (
  lanes: readonly SequenceLane[],
  messages: readonly SequenceMessage[],
  m: LaneMetrics = DEFAULT_METRICS,
): Result<SequenceLayout, DiagramError> => {
  const laneIds = uniqueIds(lanes, "lane");
  if (!laneIds.ok) return laneIds;
  const msgIds = uniqueIds(messages, "message");
  if (!msgIds.ok) return msgIds;
  const refs = knownRefs(
    laneIds.value,
    messages.flatMap((x) => [x.from, x.to]),
    "lane",
  );
  if (!refs.ok) return refs;
  const xs = lanePositions(lanes, m);
  return ok({
    width: Math.max(1, lanes.length) * m.laneWidth,
    height: m.headerHeight + (messages.length + 0.5) * m.rowHeight,
    lanes: lanes.map((lane) => ({ lane, x: xOf(xs, lane.id) })),
    messages: messages.map((message, index) => {
      const x1 = xOf(xs, message.from);
      const x2 = xOf(xs, message.to);
      return {
        message,
        index,
        x1,
        x2,
        y: m.headerHeight + (index + 0.5) * m.rowHeight,
        direction: arrowDirection(x1, x2),
      };
    }),
  });
};

export interface PositionedStep {
  readonly step: SwimlaneStep;
  readonly index: number;
  readonly x: number;
  readonly y: number;
  /** Center x of the target lane when the step hands off to another lane. */
  readonly toX?: number;
}

export interface SwimlaneLayout {
  readonly width: number;
  readonly height: number;
  readonly lanes: readonly PositionedLane<SwimlaneLane>[];
  readonly steps: readonly PositionedStep[];
}

export const swimlaneLayout = (
  lanes: readonly SwimlaneLane[],
  steps: readonly SwimlaneStep[],
  m: LaneMetrics = DEFAULT_METRICS,
): Result<SwimlaneLayout, DiagramError> => {
  const laneIds = uniqueIds(lanes, "lane");
  if (!laneIds.ok) return laneIds;
  const stepIds = uniqueIds(steps, "step");
  if (!stepIds.ok) return stepIds;
  const refs = knownRefs(
    laneIds.value,
    steps.flatMap((s) => (s.to === undefined ? [s.lane] : [s.lane, s.to])),
    "lane",
  );
  if (!refs.ok) return refs;
  const xs = lanePositions(lanes, m);
  return ok({
    width: Math.max(1, lanes.length) * m.laneWidth,
    height: m.headerHeight + (steps.length + 0.25) * m.rowHeight,
    lanes: lanes.map((lane) => ({ lane, x: xOf(xs, lane.id) })),
    steps: steps.map((step, index) => ({
      step,
      index,
      x: xOf(xs, step.lane),
      y: m.headerHeight + (index + 0.5) * m.rowHeight,
      ...(step.to === undefined || step.to === step.lane ? {} : { toX: xOf(xs, step.to) }),
    })),
  });
};

/**
 * Mono glyph advance at `--font-size-xs` (12 units ≈ 0.62em), shared with WirePacket's sizing.
 * Lane labels are sized from it so a lane is never narrower than its own header text.
 */
export const MONO_CHAR = 7.5;
/** Inner padding of a lane header plus the gap to the neighbouring header. */
const LANE_GUTTER = 28;
/** Floor for very short labels: still room for packets travelling between lifelines. */
const LANE_MIN = 96;

/** Narrowest lane that still fits the longest label at full size. */
export const minLaneWidth = (labels: readonly string[]): number =>
  Math.max(LANE_MIN, ...labels.map((l) => Math.ceil(l.length * MONO_CHAR + LANE_GUTTER)));

/**
 * Lane width for a container `available` px wide. Phones get narrower lanes (down to the label
 * minimum) instead of a shrunken viewBox, so labels keep their real font size; wide screens keep
 * the default. `available <= 0` (SSR, not measured yet) falls back to the default.
 */
export const fitLaneWidth = (
  available: number,
  labels: readonly string[],
  m: LaneMetrics = DEFAULT_METRICS,
): number => {
  if (available <= 0 || labels.length === 0) return m.laneWidth;
  const min = Math.min(m.laneWidth, minLaneWidth(labels));
  return Math.max(min, Math.min(m.laneWidth, Math.floor(available / labels.length)));
};

/**
 * SVG height that only reaches the rows revealed so far (always at least one), so a diagram at
 * step 0 isn't a tall column of empty lifelines; it grows to the full height as steps play.
 */
export const visibleHeight = (
  current: number,
  count: number,
  m: LaneMetrics = DEFAULT_METRICS,
): number => m.headerHeight + (Math.max(1, Math.min(count, current + 1)) + 0.5) * m.rowHeight;
