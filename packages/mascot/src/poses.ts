import type { MascotEventType } from "@nostrschool/ui/bus.ts";
import { MASCOT_POSES, type MascotPose, type RiveContract } from "./types.ts";

export const RIVE_CONTRACT: RiveContract = {
  stateMachine: "Mascot",
  poseInput: "pose",
  bounceTrigger: "bounce",
};

/**
 * How long a reaction pose holds before returning to the base pose (ms). Kept under reduced
 * motion too: the pose (and its aria-label) carries information, only the tween is dropped.
 */
export const REACTION_HOLD_MS = 2400;

/** Which pose each bus event triggers. A Record so a new bus event fails typecheck until mapped. */
export const EVENT_POSES: Readonly<Record<MascotEventType, MascotPose>> = {
  "signature:valid": "cheer",
  "signature:invalid": "panic",
  "keys:generated": "wave",
  "chapter:complete": "celebrate",
  "quiz:correct": "cheer",
  "quiz:wrong": "think",
  "live:on": "wave",
  "live:off": "sleep",
  celebrate: "celebrate",
  warning: "panic",
};

export const poseForEvent = (event: MascotEventType): MascotPose => EVENT_POSES[event];

export const isMascotPose = (value: unknown): value is MascotPose =>
  typeof value === "string" && (MASCOT_POSES as readonly string[]).includes(value);

/** Value of the Rive `pose` number input for a pose (its index in MASCOT_POSES). */
export const poseIndex = (pose: MascotPose): number => MASCOT_POSES.indexOf(pose);
