import { afterEach, expect, test } from "bun:test";
import { startTestRelay } from "@nostrschool/test-relay";
import { $liveMode, $liveRelays, DEFAULT_LIVE_RELAYS, getDataSource } from "./index.ts";

afterEach(() => {
  $liveMode.set(false);
  $liveRelays.set(DEFAULT_LIVE_RELAYS);
});

test("fixture source by default, cached", () => {
  const source = getDataSource();
  expect(source.mode).toBe("fixture");
  expect(getDataSource()).toBe(source);
});

test("live mode uses $liveRelays; a new relay list replaces and disposes the old source", async () => {
  const relay = await startTestRelay();
  $liveMode.set(true);
  $liveRelays.set([relay.url]);
  const live = getDataSource();
  expect(live.mode).toBe("live");
  expect(live.relays).toEqual([relay.url]);
  expect(getDataSource()).toBe(live);

  const eose = Promise.withResolvers<void>();
  const sub = live.subscribe([{}], { onEvent: () => undefined, onAllEose: eose.resolve });
  await eose.promise;
  $liveRelays.set(["ws://127.0.0.1:1"]);
  const next = getDataSource();
  expect(next).not.toBe(live);
  await Bun.sleep(30);
  expect(relay.received().at(-1)).toEqual(["CLOSE", sub.id]);

  $liveMode.set(false);
  expect(getDataSource().mode).toBe("fixture");
  next.dispose();
  await relay.stop();
});
