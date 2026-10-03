/**
 * NIP-13 proof-of-work, step-exposed for the miner demo. The work loop is chunked so the UI can
 * repaint between chunks; everything here is pure and deterministic for a given start nonce.
 */
import { FIXTURE_NOW, getPersona } from "@nostrschool/fixtures";
import {
  computeEventId,
  countLeadingZeroBits,
  err,
  expectedAttempts,
  minePow,
  ok,
  type PowAttempt,
  type ProtocolError,
  type Result,
  type UnsignedEvent,
  withNonce,
} from "@nostrschool/protocol";

// Re-exported so the miner UI has a single import site; the NIP-13 maths lives in the protocol package.
export { countLeadingZeroBits, expectedAttempts };

export const MIN_DIFFICULTY = 0;
/** Above ~20 bits a browser main thread needs minutes on average: keep the demo snappy. */
export const MAX_DIFFICULTY = 20;
export const DEFAULT_DIFFICULTY = 12;
/** Before we've measured the visitor's machine, assume a modest phone-ish hash rate. */
export const DEFAULT_RATE = 50_000;

/** Demo author: a public fixture persona, so the mined note can be signed reproducibly. */
export const POW_AUTHOR = getPersona("alice");

export type PowError = ProtocolError<"invalid-difficulty">;

/** The protocol accepts up to 256 bits; the demo caps lower so a main-thread run stays short. */
export const validateDifficulty = (bits: number): Result<number, PowError> =>
  Number.isInteger(bits) && bits >= MIN_DIFFICULTY && bits <= MAX_DIFFICULTY
    ? ok(bits)
    : err({
        code: "invalid-difficulty",
        message: `difficulty must be an integer in ${MIN_DIFFICULTY}..${MAX_DIFFICULTY}, got ${bits}`,
      });

/** Kind 1 note with the NIP-13 nonce tag ["nonce", <nonce>, <target>]. */
export const powEvent = (content: string, nonce: number, target: number): UnsignedEvent =>
  withNonce(
    { kind: 1, pubkey: POW_AUTHOR.pubkey, created_at: FIXTURE_NOW, tags: [], content },
    nonce,
    target,
  );

export interface Attempt {
  readonly nonce: number;
  readonly id: string;
  readonly bits: number;
}

export interface MineProgress {
  /** Nonce to continue from. */
  readonly nextNonce: number;
  readonly last: Attempt;
  readonly best: Attempt;
  /** Set when an id with ≥ target bits was found within the budget. */
  readonly found?: Attempt;
}

const toAttempt = ({ nonce, id, difficulty }: PowAttempt): Attempt => ({
  nonce,
  id,
  bits: difficulty,
});

const better = (a: Attempt | undefined, b: Attempt): Attempt =>
  a === undefined || b.bits > a.bits ? b : a;

/** Tries up to `budget` (≥ 1) nonces from `startNonce` via the protocol miner; stops early on success. */
export const mineChunk = (
  content: string,
  target: number,
  startNonce: number,
  budget: number,
  previousBest?: Attempt,
): MineProgress => {
  const maxAttempts = Math.max(1, Math.floor(budget));
  const r = minePow(powEvent(content, 0, target), target, { startNonce, maxAttempts });
  if (r.ok) {
    const found = toAttempt(r.value);
    return { nextNonce: found.nonce + 1, last: found, best: better(previousBest, found), found };
  }
  // invalid-difficulty is a caller bug (the UI validates first): fail loud rather than spin.
  if (r.error.code !== "exhausted" || r.error.best === undefined) throw new Error(r.error.message);
  const nextNonce = r.error.nextNonce ?? startNonce + maxAttempts;
  // minePow reports only the best miss; re-hash the final nonce (one hash per chunk) for the "current id" readout.
  const lastNonce = nextNonce - 1;
  const lastId = computeEventId(powEvent(content, lastNonce, target)).id;
  const last = { nonce: lastNonce, id: lastId, bits: countLeadingZeroBits(lastId) };
  return { nextNonce, last, best: better(previousBest, toAttempt(r.error.best)) };
};

export type TimeUnit = "ms" | "s" | "min" | "h" | "d" | "y";
export interface Span {
  readonly value: number;
  readonly unit: TimeUnit;
}

const UNITS: readonly (readonly [TimeUnit, number])[] = [
  ["y", 365 * 24 * 3600],
  ["d", 24 * 3600],
  ["h", 3600],
  ["min", 60],
  ["s", 1],
];

/** Largest unit with value ≥ 1 (milliseconds below one second), rounded to 1 decimal. */
export const humanizeSeconds = (seconds: number): Span => {
  const round = (v: number) => Math.round(v * 10) / 10;
  const match = UNITS.find(([, size]) => seconds >= size);
  return match === undefined
    ? { value: round(seconds * 1000), unit: "ms" }
    : { value: round(seconds / match[1]), unit: match[0] };
};

/** Expected seconds to mine `notes` events at `bits` difficulty and `rate` hashes/second. */
export const spamSeconds = (bits: number, notes: number, rate: number): number =>
  (expectedAttempts(bits) * notes) / Math.max(rate, 1);

/** Splits an id into its zero-bit hex prefix (fully-zero nibbles) and the rest, for highlighting. */
export const splitZeroPrefix = (id: string): { readonly zeros: string; readonly rest: string } => {
  const rest = id.replace(/^0+/, "");
  return { zeros: id.slice(0, id.length - rest.length), rest };
};
