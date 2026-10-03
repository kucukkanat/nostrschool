import { afterEach, expect, test } from "bun:test";
import { createEventBus, type MascotEventMap } from "@nostrschool/ui/bus.ts";
import { createPoseController, type PoseController } from "./controller.ts";
import { REACTION_HOLD_MS } from "./poses.ts";

const HOLD = 30;
const live: PoseController[] = [];
const make = (base?: "idle" | "sleep") => {
  const c = createPoseController(base === undefined ? { holdMs: HOLD } : { base, holdMs: HOLD });
  live.push(c);
  return c;
};
afterEach(() => {
  for (const c of live.splice(0)) c.destroy();
});

test("defaults: idle base, contract hold time", () => {
  const c = createPoseController();
  live.push(c);
  expect(c.$state.get()).toEqual({ pose: "idle", base: "idle", beat: 0 });
  expect(REACTION_HOLD_MS).toBe(2400);
});

test("a reaction shows its pose, then returns to the base pose", async () => {
  const c = make();
  c.react("cheer");
  expect(c.$state.get()).toEqual({ pose: "cheer", base: "idle", beat: 1 });
  await Bun.sleep(HOLD + 20);
  expect(c.$state.get().pose).toBe("idle");
});

test("a newer reaction restarts the hold", async () => {
  const c = make();
  c.react("cheer");
  await Bun.sleep(HOLD / 2);
  c.react("panic");
  await Bun.sleep(HOLD / 2 + 5);
  expect(c.$state.get()).toMatchObject({ pose: "panic", beat: 2 });
  await Bun.sleep(HOLD);
  expect(c.$state.get().pose).toBe("idle");
});

test("setBase applies now when resting, and after the hold when reacting", async () => {
  const c = make("sleep");
  c.setBase("wave");
  expect(c.$state.get().pose).toBe("wave");
  c.react("think");
  c.setBase("idle");
  expect(c.$state.get()).toMatchObject({ pose: "think", base: "idle" });
  await Bun.sleep(HOLD + 20);
  expect(c.$state.get().pose).toBe("idle");
});

test("connect maps bus events to poses; unsubscribe and destroy stop reactions", async () => {
  const bus = createEventBus<MascotEventMap>();
  const c = make();
  const off = c.connect(bus);
  bus.emit("signature:invalid", { reason: "bad sig" });
  expect(c.$state.get().pose).toBe("panic");
  off();
  bus.emit("chapter:complete", { chapter: 2 });
  expect(c.$state.get().beat).toBe(1);

  c.connect(bus);
  bus.emit("live:off", {});
  expect(c.$state.get().pose).toBe("sleep");
  c.destroy();
  bus.emit("celebrate", {});
  expect(c.$state.get().beat).toBe(2);
  // Destroy cancelled the pending return to idle.
  await Bun.sleep(HOLD + 20);
  expect(c.$state.get().pose).toBe("sleep");
});
