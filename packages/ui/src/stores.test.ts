import { afterEach, expect, test } from "bun:test";
import { $alwaysExpandDrawers } from "./stores.ts";

const KEY = "nostrschool:always-expand";

afterEach(() => {
  $alwaysExpandDrawers.set(false);
  localStorage.removeItem(KEY);
});

test("encodes the preference compactly in localStorage", () => {
  $alwaysExpandDrawers.set(true);
  expect(localStorage.getItem(KEY)).toBe("1");
  $alwaysExpandDrawers.set(false);
  expect(localStorage.getItem(KEY)).toBe("0");
});

test("decodes changes made in another tab", () => {
  localStorage.setItem(KEY, "1");
  window.dispatchEvent(new StorageEvent("storage", { key: KEY, newValue: "1" }));
  expect($alwaysExpandDrawers.get()).toBe(true);
  window.dispatchEvent(new StorageEvent("storage", { key: KEY, newValue: "0" }));
  expect($alwaysExpandDrawers.get()).toBe(false);
});
