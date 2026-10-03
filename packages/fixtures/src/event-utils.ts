import {
  type EventTemplate,
  fail,
  type Hex,
  type NostrEvent,
  ok,
  type ProtocolError,
  type RelayUrl,
  type Result,
  signEvent,
  unwrap,
  validateEventShape,
} from "@nostrschool/protocol";

export type FixtureErrorCode = "invalid-file" | "invalid-event";
export type FixtureError = ProtocolError<FixtureErrorCode>;

/** Shape of the committed `src/data/events.json`. */
export interface FixtureFile {
  readonly fixtureNow: number;
  readonly events: readonly NostrEvent[];
  readonly placement: Readonly<Record<Hex, readonly RelayUrl[]>>;
}

const isRecord = (x: unknown): x is Record<string, unknown> =>
  typeof x === "object" && x !== null && !Array.isArray(x);
const isStringArray = (x: unknown): x is readonly string[] =>
  Array.isArray(x) && x.every((v) => typeof v === "string");

/** Validates untrusted JSON (the committed file) into a typed `FixtureFile`. */
export const parseFixtureFile = (x: unknown): Result<FixtureFile, FixtureError> => {
  if (!isRecord(x) || typeof x["fixtureNow"] !== "number" || !Array.isArray(x["events"])) {
    return fail("invalid-file", "expected { fixtureNow, events, placement }");
  }
  const placement = x["placement"];
  if (!isRecord(placement) || !Object.values(placement).every(isStringArray)) {
    return fail("invalid-file", "placement must map event ids to relay url arrays");
  }
  const events: NostrEvent[] = [];
  for (const [i, e] of x["events"].entries()) {
    const shape = validateEventShape(e);
    if (!shape.ok) return fail("invalid-event", `events[${i}]: ${shape.error.message}`);
    events.push(shape.value);
  }
  return ok({
    fixtureNow: x["fixtureNow"],
    events,
    placement: placement as FixtureFile["placement"],
  });
};

/** NIP-01 relay order: newest first, ties broken by lowest id. */
export const newestFirst = (a: NostrEvent, b: NostrEvent): number =>
  b.created_at - a.created_at || a.id.localeCompare(b.id);

/**
 * Fixed BIP-340 aux randomness: with it, Schnorr signatures (and so gift-wrap payloads, reposts
 * and zap receipts that embed signed events) are byte-for-byte reproducible. Fine for public demo
 * keys; real clients must use fresh randomness.
 */
export const AUX_RAND: Uint8Array = new Uint8Array(32);

/** Signs with protocol's `signEvent` and fixed aux data; persona keys are always valid. */
export const signFixture = (t: EventTemplate, sk: Uint8Array): NostrEvent =>
  unwrap(signEvent(t, sk, { auxRand: AUX_RAND })).event;
