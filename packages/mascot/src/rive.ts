/** Pure, runtime-free Rive helpers: asset probing and binding the state-machine inputs. */

import { err, ok, type Result } from "@nostrschool/ui/result.ts";
import { poseIndex, RIVE_CONTRACT } from "./poses.ts";
import type { MascotPose } from "./types.ts";

export type RiveErrorCode = "not-found" | "not-rive" | "network" | "load-failed" | "missing-input";
export interface RiveError {
  readonly code: RiveErrorCode;
  readonly message: string;
}

/** Structural subset of `StateMachineInput` from @rive-app/canvas that we use. */
export interface RiveInputLike {
  readonly name: string;
  value: number | boolean;
  fire(): void;
}

export interface RiveControls {
  readonly setPose: (pose: MascotPose) => void;
  readonly bounce: () => void;
}

/**
 * Downloads the .riv file before loading the Rive runtime + WASM, so pages without an asset never
 * pay for the runtime. The bytes are handed to Rive (`buffer`), so the file is fetched once.
 * Static hosts and dev servers often answer unknown paths with an HTML page (sometimes with
 * 200), so HTML counts as "not a Rive file".
 */
export const fetchRiveAsset = async (
  src: string,
  fetchFn: typeof fetch = fetch,
): Promise<Result<ArrayBuffer, RiveError>> => {
  try {
    const response = await fetchFn(src);
    if (!response.ok)
      return err({ code: "not-found", message: `${src} answered ${response.status}` });
    const type = response.headers.get("content-type") ?? "";
    if (type.includes("text/html"))
      return err({ code: "not-rive", message: `${src} is HTML, not a .riv file` });
    return ok(await response.arrayBuffer());
  } catch (error) {
    return err({ code: "network", message: `Could not download ${src}: ${String(error)}` });
  }
};

/** Finds the contract's inputs; fails loudly (typed) if the illustrator's file doesn't match. */
export const bindRiveInputs = (
  inputs: readonly RiveInputLike[],
): Result<RiveControls, RiveError> => {
  const pose = inputs.find((i) => i.name === RIVE_CONTRACT.poseInput);
  const bounce = inputs.find((i) => i.name === RIVE_CONTRACT.bounceTrigger);
  if (pose === undefined || bounce === undefined) {
    const found = inputs.map((i) => i.name).join(", ") || "none";
    return err({
      code: "missing-input",
      message: `State machine "${RIVE_CONTRACT.stateMachine}" needs inputs "${RIVE_CONTRACT.poseInput}" and "${RIVE_CONTRACT.bounceTrigger}" (found: ${found})`,
    });
  }
  return ok({
    setPose: (p) => {
      pose.value = poseIndex(p);
    },
    bounce: () => bounce.fire(),
  });
};

export interface RiveHandle extends RiveControls {
  readonly destroy: () => void;
}

/**
 * Settles Rive's `onLoad`: binds the contract's inputs, or tears the instance down and returns
 * the typed `missing-input` error so the caller falls back to SVG. Pure apart from `cleanup`,
 * so `bun test` covers the branching without WASM.
 */
export const settleRiveLoad = (
  inputs: readonly RiveInputLike[],
  cleanup: () => void,
): Result<RiveHandle, RiveError> => {
  const bound = bindRiveInputs(inputs);
  if (!bound.ok) {
    cleanup();
    return bound;
  }
  return ok({ ...bound.value, destroy: cleanup });
};

/** Settles Rive's `onLoadError` (or a thrown runtime/WASM failure) as a typed `load-failed`. */
export const settleRiveFailure = (
  cause: unknown,
  cleanup: () => void,
): Result<never, RiveError> => {
  cleanup();
  return err({
    code: "load-failed",
    message: `Rive failed to load the mascot file: ${String(cause)}`,
  });
};
