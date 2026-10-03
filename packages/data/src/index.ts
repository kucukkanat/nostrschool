/**
 * @nostrschool/data — one `DataSource` for fixtures and live relays.
 *
 * Components call `getDataSource()` and never know which mode they are in, so the same
 * component is tested against fixtures (no mocks) and runs live in the browser.
 */
import { createFixtureSource } from "./fixture-source.ts";
import { createLiveRelaySource } from "./live-source.ts";
import { $liveMode, $liveRelays } from "./stores.ts";
import type { DataSource } from "./types.ts";

export { createFixtureSource, type FixtureSourceOptions } from "./fixture-source.ts";
export { createLiveRelaySource, type LiveRelaySourceOptions } from "./live-source.ts";
export { $liveMode, $liveRelays, DEFAULT_LIVE_RELAYS, decodeRelayList } from "./stores.ts";
export type * from "./types.ts";

let fixtureSource: DataSource | undefined;
let liveSource: { readonly key: string; readonly source: DataSource } | undefined;

/**
 * The source for the current `$liveMode` value (fixture by default; live uses `$liveRelays`).
 * Cached per mode; a changed relay list replaces (and disposes) the cached live source.
 * Components should re-subscribe when `$liveMode` changes.
 */
export const getDataSource = (): DataSource => {
  if (!$liveMode.get()) {
    fixtureSource ??= createFixtureSource();
    return fixtureSource;
  }
  const relays = $liveRelays.get();
  const key = JSON.stringify(relays);
  if (liveSource?.key !== key) {
    liveSource?.source.dispose();
    liveSource = { key, source: createLiveRelaySource({ relays }) };
  }
  return liveSource.source;
};
