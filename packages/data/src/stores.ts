/** Persistent, cross-island settings for where data comes from. */
import { persistentAtom } from "@nanostores/persistent";
import { parseJson, type RelayUrl } from "@nostrschool/protocol";

/** Public relays used when live mode is on. Read-only: we only send REQ/CLOSE. */
export const DEFAULT_LIVE_RELAYS: readonly RelayUrl[] = [
  "wss://relay.damus.io",
  "wss://nos.lol",
  "wss://relay.primal.net",
];

/**
 * Global "Go live" switch, persisted in localStorage under `nostrschool:live`.
 * Defaults to false (fixture mode). Emitting `live:on`/`live:off` on the mascot bus is the
 * toggle UI's job, not this store's.
 */
export const $liveMode = persistentAtom<boolean>("nostrschool:live", false, {
  encode: (v) => (v ? "1" : "0"),
  decode: (s) => s === "1",
});

/** Storage is user-controlled: anything that isn't a list of ws(s) URLs falls back (with a warning). */
export const decodeRelayList = (raw: string): readonly RelayUrl[] => {
  const result = parseJson(raw);
  if (!result.ok) console.warn("nostrschool:live-relays is not JSON; using defaults", result.error);
  const parsed = result.ok ? result.value : undefined;
  return Array.isArray(parsed) && parsed.every((u) => typeof u === "string" && /^wss?:\/\//.test(u))
    ? parsed
    : DEFAULT_LIVE_RELAYS;
};

/**
 * Relays used in live mode, persisted under `nostrschool:live-relays` (JSON array).
 * E2E overrides this to the local test relay; users may edit it in a later version.
 */
export const $liveRelays = persistentAtom<readonly RelayUrl[]>(
  "nostrschool:live-relays",
  DEFAULT_LIVE_RELAYS,
  { encode: (v) => JSON.stringify(v), decode: decodeRelayList },
);
