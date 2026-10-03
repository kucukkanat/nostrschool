/** @nostrschool/mascot — "Nos" the ostrich: Rive runtime when available, SVG fallback otherwise. */

export type { Result } from "@nostrschool/ui/result.ts";
export { default as Mascot } from "./components/Mascot.svelte";
export { default as OstrichSvg } from "./components/OstrichSvg.svelte";
export {
  createPoseController,
  type MascotState,
  type PoseController,
  type PoseControllerOptions,
} from "./controller.ts";
export {
  EVENT_POSES,
  isMascotPose,
  poseForEvent,
  poseIndex,
  REACTION_HOLD_MS,
  RIVE_CONTRACT,
} from "./poses.ts";
export {
  bindRiveInputs,
  fetchRiveAsset,
  type RiveControls,
  type RiveError,
  type RiveErrorCode,
  type RiveHandle,
  type RiveInputLike,
  settleRiveFailure,
  settleRiveLoad,
} from "./rive.ts";
export type * from "./types.ts";
export { MASCOT_POSES } from "./types.ts";
