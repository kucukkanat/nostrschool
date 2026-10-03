import type { Locale } from "@nostrschool/i18n";
import type { EventBus, MascotEventMap, MascotEventType } from "@nostrschool/ui/bus.ts";

export type MascotPose = "idle" | "wave" | "think" | "cheer" | "panic" | "celebrate" | "sleep";

export const MASCOT_POSES: readonly MascotPose[] = [
  "idle",
  "wave",
  "think",
  "cheer",
  "panic",
  "celebrate",
  "sleep",
];

export type MascotSize = "sm" | "md" | "lg";

/**
 * Root: `data-testid={testid}` with `data-pose={currentPose}` and `data-renderer="rive|svg"`.
 * The accessible name is the localized pose description (`mascot.poses[pose]`). Mood changes are
 * never announced (no live region): they would talk over the narration of the island that caused
 * them.
 */
export interface MascotProps {
  readonly locale: Locale;
  /** Token size (`--size-mascot-*`). Default "md". */
  readonly size?: MascotSize;
  /** Initial pose. Default "idle". */
  readonly pose?: MascotPose;
  /** React to mascot bus events (default true). */
  readonly reactive?: boolean;
  /**
   * URL of the Rive file, built by the site with its base path, e.g. `assetHref("mascot/ostrich.riv")`.
   * When omitted or when loading fails, the SVG fallback renders (no error shown to users).
   */
  readonly riveSrc?: string;
  /** Optional speech bubble text (already localized by the caller). */
  readonly say?: string;
  /**
   * Announce `say` changes politely (default true). Pass false when the bubble repeats what the
   * calling component already narrates in its own live region, so screen readers hear it once.
   */
  readonly announce?: boolean;
  /** Bus to react to. Default: the app-wide `mascotBus` (tests pass their own). */
  readonly bus?: EventBus<MascotEventMap>;
  /** How long a reaction holds before returning to `pose` (ms). Default `REACTION_HOLD_MS`. */
  readonly holdMs?: number;
  /** Default "mascot". Parts: `-figure -svg -canvas -bubble -bubble-region`. */
  readonly testid?: string;
}

/** Rive state machine contract the illustrator's file must satisfy. */
export interface RiveContract {
  readonly stateMachine: "Mascot";
  /** Number input selecting the pose: index into MASCOT_POSES. */
  readonly poseInput: "pose";
  /** Trigger input fired on every bus event for a little bounce. */
  readonly bounceTrigger: "bounce";
}

export type PoseForEvent = (event: MascotEventType) => MascotPose;
