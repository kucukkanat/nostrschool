/**
 * NIP-13 proof of work: difficulty = number of leading zero BITS in the event id. Mining means
 * bumping a `["nonce", <counter>, <target>]` tag until the id has enough zeros (chapter 10, spam).
 */
import { hexToBytes } from "./encoding.ts";
import { computeEventId } from "./event.ts";
import { err, fail, ok, type ProtocolError, type Result } from "./result.ts";
import type { Hex, Tag, UnsignedEvent } from "./types.ts";

/** Leading zero bits of an id (hex or bytes). Invalid hex counts as 0 work. */
export const countLeadingZeroBits = (id: Hex | Uint8Array): number => {
  const bytes = typeof id === "string" ? hexToBytes(id) : { ok: true as const, value: id };
  if (!bytes.ok) return 0;
  let bits = 0;
  for (const byte of bytes.value) {
    if (byte !== 0) return bits + Math.clz32(byte) - 24;
    bits += 8;
  }
  return bits;
};

/** Difficulty actually achieved by an event (from its id). */
export const getPowDifficulty = (event: { readonly id: Hex }): number =>
  countLeadingZeroBits(event.id);

/**
 * Difficulty the author *committed to* in the nonce tag's third element. NIP-13 asks clients to
 * use it so a lucky low-target miner can't claim more work than they aimed for.
 */
export const getCommittedDifficulty = (event: Pick<UnsignedEvent, "tags">): number | undefined => {
  const target = event.tags.find((t) => t[0] === "nonce")?.[2];
  const n = target === undefined ? Number.NaN : Number(target);
  return Number.isInteger(n) && n >= 0 ? n : undefined;
};

/** Effective PoW: achieved bits, capped by the committed target when one is present. */
export const getEffectivePow = (
  event: Pick<UnsignedEvent, "tags"> & { readonly id: Hex },
): number => {
  const achieved = getPowDifficulty(event);
  const committed = getCommittedDifficulty(event);
  return committed === undefined ? achieved : Math.min(achieved, committed);
};

export type PowErrorCode = "invalid-difficulty" | "exhausted";
export interface PowError extends ProtocolError<PowErrorCode> {
  /** On `exhausted`: pass this as `startNonce` to continue mining where we stopped. */
  readonly nextNonce?: number;
  /** On `exhausted`: the best attempt so far, for "closest yet" UI. */
  readonly best?: PowAttempt;
}

export interface PowAttempt {
  readonly nonce: number;
  readonly id: Hex;
  readonly difficulty: number;
}

export interface PowResult extends PowAttempt {
  /** The mined event (unsigned — sign it afterwards; the id will not change). */
  readonly event: UnsignedEvent & { readonly id: Hex };
  /** How many hashes this call computed. */
  readonly attempts: number;
}

export interface MineOptions {
  /** Hard cap on hashes per call so the UI thread never freezes. Default 100 000. */
  readonly maxAttempts?: number;
  /** First nonce to try; resume with `error.nextNonce`. Default 0. */
  readonly startNonce?: number;
}

/** Same event with its nonce tag (replaced or appended) set to `[nonce, target]`. */
export const withNonce = (event: UnsignedEvent, nonce: number, target: number): UnsignedEvent => {
  const tag: Tag = ["nonce", String(nonce), String(target)];
  const others = event.tags.filter((t) => t[0] !== "nonce");
  return { ...event, tags: [...others, tag] };
};

/** Max difficulty a 256-bit id can show. */
const MAX_DIFFICULTY = 256;

/**
 * Bounded, synchronous miner. Pure and deterministic: keeps `created_at` fixed, so the same
 * input always finds the same nonce. Call repeatedly (e.g. per animation frame) to stream progress.
 */
export const minePow = (
  event: UnsignedEvent,
  target: number,
  options: MineOptions = {},
): Result<PowResult, PowError> => {
  if (!Number.isInteger(target) || target < 0 || target > MAX_DIFFICULTY)
    return fail("invalid-difficulty", `Target must be an integer 0–${MAX_DIFFICULTY}`);
  const { maxAttempts = 100_000, startNonce = 0 } = options;
  let best: PowAttempt | undefined;
  for (let i = 0; i < maxAttempts; i++) {
    const nonce = startNonce + i;
    const candidate = withNonce(event, nonce, target);
    const { id, hash } = computeEventId(candidate);
    const difficulty = countLeadingZeroBits(hash);
    if (difficulty >= target)
      return ok({ nonce, id, difficulty, event: { ...candidate, id }, attempts: i + 1 });
    if (best === undefined || difficulty > best.difficulty) best = { nonce, id, difficulty };
  }
  const base = {
    code: "exhausted" as const,
    message: `No id with ${target} leading zero bits after ${maxAttempts} attempts`,
    nextNonce: startNonce + maxAttempts,
  };
  return err(best === undefined ? base : { ...base, best });
};

/** Expected hashes to reach `difficulty` bits: 2^difficulty (each extra bit doubles the work). */
export const expectedAttempts = (difficulty: number): number => 2 ** difficulty;
