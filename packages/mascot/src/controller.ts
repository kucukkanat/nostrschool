import type { EventBus, MascotEventMap } from "@nostrschool/ui/bus.ts";
import { atom, type ReadableAtom } from "nanostores";
import { poseForEvent, REACTION_HOLD_MS } from "./poses.ts";
import type { MascotPose } from "./types.ts";

export interface MascotState {
  /** What the mascot shows right now. */
  readonly pose: MascotPose;
  /** Pose to return to after a reaction (the component's `pose` prop). */
  readonly base: MascotPose;
  /** Incremented on every reaction, so repeated identical reactions still trigger a bounce. */
  readonly beat: number;
}

export interface PoseControllerOptions {
  readonly base?: MascotPose;
  readonly holdMs?: number;
}

export interface PoseController {
  readonly $state: ReadableAtom<MascotState>;
  /** Change the resting pose; shown immediately unless a reaction is holding. */
  readonly setBase: (pose: MascotPose) => void;
  /** Show `pose` for `holdMs`, then return to the base pose. A newer reaction restarts the hold. */
  readonly react: (pose: MascotPose) => void;
  /** Map bus events to reactions. Returns unsubscribe. */
  readonly connect: (bus: EventBus<MascotEventMap>) => () => void;
  /** Cancel the pending return-to-base timer and drop bus subscriptions. */
  readonly destroy: () => void;
}

export const createPoseController = ({
  base = "idle",
  holdMs = REACTION_HOLD_MS,
}: PoseControllerOptions = {}): PoseController => {
  const $state = atom<MascotState>({ pose: base, base, beat: 0 });
  const subscriptions = new Set<() => void>();
  let timer: ReturnType<typeof setTimeout> | undefined;

  const clearTimer = () => {
    if (timer !== undefined) clearTimeout(timer);
    timer = undefined;
  };

  const setBase = (pose: MascotPose) => {
    const s = $state.get();
    $state.set({ ...s, base: pose, pose: timer === undefined ? pose : s.pose });
  };

  const react = (pose: MascotPose) => {
    clearTimer();
    const s = $state.get();
    $state.set({ ...s, pose, beat: s.beat + 1 });
    timer = setTimeout(() => {
      timer = undefined;
      const now = $state.get();
      $state.set({ ...now, pose: now.base });
    }, holdMs);
  };

  const connect = (bus: EventBus<MascotEventMap>) => {
    const off = bus.onAny((event) => react(poseForEvent(event.type)));
    subscriptions.add(off);
    return () => {
      off();
      subscriptions.delete(off);
    };
  };

  const destroy = () => {
    clearTimer();
    for (const off of [...subscriptions]) off();
    subscriptions.clear();
  };

  return { $state, setBase, react, connect, destroy };
};
