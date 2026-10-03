import { expect, test } from "bun:test";
import { MASCOT_EVENT_TYPES } from "@nostrschool/ui/bus.ts";
import { EVENT_POSES, isMascotPose, poseForEvent, poseIndex, RIVE_CONTRACT } from "./poses.ts";
import { MASCOT_POSES } from "./types.ts";

test("every bus event maps to a real pose", () => {
  for (const type of MASCOT_EVENT_TYPES) expect(MASCOT_POSES).toContain(poseForEvent(type));
  expect(Object.keys(EVENT_POSES).sort()).toEqual([...MASCOT_EVENT_TYPES].sort());
});

test("reactions match the learner's moment", () => {
  expect(poseForEvent("signature:valid")).toBe("cheer");
  expect(poseForEvent("signature:invalid")).toBe("panic");
  expect(poseForEvent("quiz:wrong")).toBe("think");
  expect(poseForEvent("chapter:complete")).toBe("celebrate");
  expect(poseForEvent("live:off")).toBe("sleep");
});

test("pose index is the Rive number-input value", () => {
  expect(MASCOT_POSES.map(poseIndex)).toEqual([0, 1, 2, 3, 4, 5, 6]);
  expect(RIVE_CONTRACT).toEqual({
    stateMachine: "Mascot",
    poseInput: "pose",
    bounceTrigger: "bounce",
  });
});

test("isMascotPose narrows unknown input", () => {
  expect(isMascotPose("wave")).toBe(true);
  expect(isMascotPose("dance")).toBe(false);
  expect(isMascotPose(3)).toBe(false);
});
