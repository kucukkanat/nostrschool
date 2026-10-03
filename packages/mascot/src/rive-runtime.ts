/**
 * The only module that touches @rive-app/canvas. It is imported dynamically so the runtime
 * (and its WASM, fetched by the runtime itself) is only downloaded when a .riv file exists.
 * Deliberately thin glue: every decision lives in `settleRiveLoad`/`settleRiveFailure`
 * (rive.ts, unit-tested). This file itself needs WebAssembly + a real canvas to execute.
 */

import type { Result } from "@nostrschool/ui/result.ts";
import { RIVE_CONTRACT } from "./poses.ts";
import { type RiveError, type RiveHandle, settleRiveFailure, settleRiveLoad } from "./rive.ts";

export type { RiveHandle } from "./rive.ts";

export const mountRive = async (
  canvas: HTMLCanvasElement,
  buffer: ArrayBuffer,
): Promise<Result<RiveHandle, RiveError>> => {
  // A failed chunk/WASM download or a constructor throw must still settle as a typed error,
  // otherwise the caller's promise rejects unhandled and the hidden canvas never goes away.
  let Rive: typeof import("@rive-app/canvas").Rive;
  try {
    ({ Rive } = await import("@rive-app/canvas"));
  } catch (cause) {
    return settleRiveFailure(cause, () => undefined);
  }
  return new Promise((resolve) => {
    try {
      const rive = new Rive({
        canvas,
        buffer,
        stateMachines: RIVE_CONTRACT.stateMachine,
        autoplay: true,
        onLoad: () => {
          rive.resizeDrawingSurfaceToCanvas();
          const inputs = rive.stateMachineInputs(RIVE_CONTRACT.stateMachine) ?? [];
          resolve(settleRiveLoad(inputs, () => rive.cleanup()));
        },
        onLoadError: (event) => resolve(settleRiveFailure(event.data, () => rive.cleanup())),
      });
    } catch (cause) {
      resolve(settleRiveFailure(cause, () => undefined));
    }
  });
};
