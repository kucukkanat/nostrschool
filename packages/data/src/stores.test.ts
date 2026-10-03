import { expect, spyOn, test } from "bun:test";
import { $liveMode, $liveRelays, DEFAULT_LIVE_RELAYS, decodeRelayList } from "./stores.ts";

test("live mode is off by default and default relays are wss", () => {
  expect($liveMode.get()).toBe(false);
  for (const url of DEFAULT_LIVE_RELAYS) expect(url.startsWith("wss://")).toBe(true);
  expect($liveRelays.get()).toEqual(DEFAULT_LIVE_RELAYS);
});

test("stores persist to localStorage in their documented encodings", () => {
  $liveMode.set(true);
  expect(localStorage.getItem("nostrschool:live")).toBe("1");
  $liveMode.set(false);
  expect(localStorage.getItem("nostrschool:live")).toBe("0");
  $liveRelays.set(["ws://127.0.0.1:7447"]);
  expect(localStorage.getItem("nostrschool:live-relays")).toBe('["ws://127.0.0.1:7447"]');
  $liveRelays.set(DEFAULT_LIVE_RELAYS);
});

test("decodeRelayList accepts ws(s) URL lists and falls back otherwise", () => {
  expect(decodeRelayList('["ws://a", "wss://b"]')).toEqual(["ws://a", "wss://b"]);
  expect(decodeRelayList('["https://a"]')).toBe(DEFAULT_LIVE_RELAYS);
  expect(decodeRelayList('{"a":1}')).toBe(DEFAULT_LIVE_RELAYS);
  // Real console.warn, observed (not replaced) so the fallback is visibly reported.
  const warn = spyOn(console, "warn");
  expect(decodeRelayList("{nope")).toBe(DEFAULT_LIVE_RELAYS);
  expect(warn).toHaveBeenCalledTimes(1);
  warn.mockRestore();
});

test("stores follow changes made in another tab (storage events)", () => {
  const fromOtherTab = (key: string, newValue: string): void => {
    localStorage.setItem(key, newValue);
    window.dispatchEvent(new StorageEvent("storage", { key, newValue }));
  };
  fromOtherTab("nostrschool:live", "1");
  expect($liveMode.get()).toBe(true);
  fromOtherTab("nostrschool:live-relays", '["ws://127.0.0.1:1"]');
  expect($liveRelays.get()).toEqual(["ws://127.0.0.1:1"]);
  $liveMode.set(false);
  $liveRelays.set(DEFAULT_LIVE_RELAYS);
});
