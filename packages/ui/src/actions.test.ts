import { expect, test } from "bun:test";
import { pop, shake, squish } from "./actions.ts";
import { tick, withReducedMotion } from "./test-helpers.ts";

const el = () => document.body.appendChild(document.createElement("button"));

test("squish scales on press and settles on release; update/destroy manage listeners", async () => {
  const pressed = el();
  squish(pressed);
  pressed.dispatchEvent(new PointerEvent("pointerdown"));
  await tick(50);
  expect(pressed.style.transform).toContain("scale");
  pressed.dispatchEvent(new PointerEvent("pointerup"));
  pressed.remove();

  // A fresh node, so a settling release animation can't leak into the assertions.
  const node = el();
  const action = squish(node);
  action.update({ disabled: true });
  node.dispatchEvent(new PointerEvent("pointerdown"));
  await tick(50);
  expect(node.style.transform).toBe("");
  action.update();
  action.destroy();
  node.dispatchEvent(new PointerEvent("pointerdown"));
  await tick(50);
  expect(node.style.transform).toBe("");
  node.remove();
});

test("every action is a no-op under reduced motion", async () => {
  await withReducedMotion(async () => {
    const node = el();
    const action = squish(node, { scale: 0.9 });
    node.dispatchEvent(new PointerEvent("pointerdown"));
    node.dispatchEvent(new PointerEvent("pointercancel"));
    pop(node);
    shake(node);
    await tick(50);
    expect(node.style.transform).toBe("");
    expect(node.style.opacity).toBe("");
    action.destroy();
    node.remove();
  });
});

test("pop and shake animate appearing feedback", async () => {
  const node = el();
  pop(node, { spring: "snappy", from: 0.9 });
  shake(node);
  await tick(50);
  expect(node.style.transform).not.toBe("");
  node.remove();
});
