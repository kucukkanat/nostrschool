/**
 * NIP-01 event pipeline, exposed step by step so the UI can animate each stage:
 * template → serialize → UTF-8 bytes → SHA-256 (= id) → Schnorr signature → verify.
 */
import { schnorr } from "@noble/curves/secp256k1.js";
import { bytesToHex, hexToBytes, sha256, utf8Encode } from "./encoding.ts";
import { isValidPublicKey, type KeyError, keypairFromSecret } from "./keys.ts";
import { err, ok, type ProtocolError, type Result } from "./result.ts";
import type { EventTemplate, Hex, NostrEvent, Rumor, Tag, UnsignedEvent } from "./types.ts";

/** Canonical NIP-01 serialization: `JSON.stringify([0, pubkey, created_at, kind, tags, content])`. */
export const serializeEvent = (event: UnsignedEvent): string =>
  JSON.stringify([0, event.pubkey, event.created_at, event.kind, event.tags, event.content]);

export interface EventIdSteps {
  /** The canonical JSON array string that gets hashed. */
  readonly serialized: string;
  /** UTF-8 encoding of `serialized`. */
  readonly utf8Bytes: Uint8Array;
  /** SHA-256 of `utf8Bytes`. */
  readonly hash: Uint8Array;
  /** `hash` as lowercase hex — the event `id`. */
  readonly id: Hex;
}

/** Computes the event id, returning every intermediate value. */
export const computeEventId = (event: UnsignedEvent): EventIdSteps => {
  const serialized = serializeEvent(event);
  const utf8Bytes = utf8Encode(serialized);
  const hash = sha256(utf8Bytes);
  return { serialized, utf8Bytes, hash, id: bytesToHex(hash) };
};

export interface SignOptions {
  /**
   * BIP-340 auxiliary randomness (32 bytes). Omit for a random value (normal use); pass a fixed
   * value (e.g. 32 zero bytes) to make signatures reproducible for fixtures and tests.
   */
  readonly auxRand?: Uint8Array;
}

export interface SignSteps extends EventIdSteps {
  readonly pubkey: Hex;
  /** 64-byte BIP-340 Schnorr signature over `hash`, hex (128 chars). */
  readonly sig: Hex;
  /** The finished, signed event. */
  readonly event: NostrEvent;
}

/** Adds pubkey, id and sig to a template. Fails only if the secret key is invalid. */
export const signEvent = (
  template: EventTemplate,
  secretKey: Uint8Array | Hex,
  options: SignOptions = {},
): Result<SignSteps, KeyError> => {
  const keypair = keypairFromSecret(secretKey);
  if (!keypair.ok) return keypair;
  const pubkey = keypair.value.publicKey;
  // Copy only the template fields so stray properties (e.g. an old id/sig) never leak in.
  const unsigned: UnsignedEvent = {
    kind: template.kind,
    created_at: template.created_at,
    tags: template.tags,
    content: template.content,
    pubkey,
  };
  const steps = computeEventId(unsigned);
  const sig = bytesToHex(schnorr.sign(steps.hash, keypair.value.secretKey, options.auxRand));
  return ok({ ...steps, pubkey, sig, event: { ...unsigned, id: steps.id, sig } });
};

export interface VerifySuccess {
  readonly steps: EventIdSteps;
}

export type VerifyFailureReason = "malformed" | "id-mismatch" | "bad-signature" | "invalid-pubkey";

export interface VerifyFailure extends ProtocolError<VerifyFailureReason> {
  /** Recomputed id steps (absent only when the event is malformed). */
  readonly steps?: EventIdSteps;
  /** The id we computed from the content… */
  readonly expectedId?: Hex;
  /** …versus the id the event claims. */
  readonly actualId?: Hex;
}

/**
 * Full NIP-01 verification: shape → recompute id → compare → Schnorr verify.
 * The failure `code` says which check failed (chapter 3's "tamper a byte" demo).
 */
export const verifyEvent = (event: NostrEvent): Result<VerifySuccess, VerifyFailure> => {
  const shape = validateEventShape(event);
  if (!shape.ok) return err({ code: "malformed", message: shape.error.message });
  const steps = computeEventId(shape.value);
  const ids = { steps, expectedId: steps.id, actualId: event.id };
  if (steps.id !== event.id)
    return err({ code: "id-mismatch", message: "The id is not the hash of this content", ...ids });
  if (!isValidPublicKey(event.pubkey))
    return err({
      code: "invalid-pubkey",
      message: "The pubkey is not a point on secp256k1",
      ...ids,
    });
  // Shape validation guarantees both hex strings decode, so the fallback never triggers.
  const sig = hexToBytes(event.sig);
  const pub = hexToBytes(event.pubkey);
  const valid = sig.ok && pub.ok && schnorr.verify(sig.value, steps.hash, pub.value);
  return valid
    ? ok({ steps })
    : err({ code: "bad-signature", message: "The Schnorr signature does not match", ...ids });
};

export type EventShapeErrorCode =
  | "not-an-object"
  | "missing-field"
  | "invalid-field"
  | "invalid-tags"
  | "invalid-json";
export interface EventShapeError extends ProtocolError<EventShapeErrorCode> {
  /** Offending field name, when applicable. */
  readonly field?: keyof NostrEvent;
}

/**
 * Validates that unknown input (e.g. pasted JSON in the event inspector) is shaped like a
 * NostrEvent: hex lengths, integer kind/created_at, tags as string arrays. No crypto.
 */
export const validateEventShape = (input: unknown): Result<NostrEvent, EventShapeError> => {
  const base = validateRumorShape(input);
  if (!base.ok) return base;
  const sig = (input as Record<string, unknown>)["sig"];
  if (sig === undefined) return shapeError("missing-field", "Missing field: sig", "sig");
  if (typeof sig !== "string" || !HEX128.test(sig))
    return shapeError("invalid-field", "sig must be 128 lowercase hex chars", "sig");
  return ok({ ...base.value, sig });
};

const HEX64 = /^[0-9a-f]{64}$/;
const HEX128 = /^[0-9a-f]{128}$/;

const shapeError = (
  code: EventShapeErrorCode,
  message: string,
  field?: keyof NostrEvent,
): Result<never, EventShapeError> =>
  err(field === undefined ? { code, message } : { code, message, field });

const isTag = (t: unknown): t is Tag =>
  Array.isArray(t) && t.length > 0 && t.every((v) => typeof v === "string");

const isUint = (v: unknown, max: number): v is number =>
  typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= max;

/**
 * Shape check for an event that has an id but may lack a signature (a NIP-59 rumor).
 * Returns a clean copy holding only NIP-01 fields.
 */
export const validateRumorShape = (input: unknown): Result<Rumor, EventShapeError> => {
  if (typeof input !== "object" || input === null || Array.isArray(input))
    return shapeError("not-an-object", "An event must be a JSON object");
  const o = input as Record<string, unknown>;
  const fields = ["id", "pubkey", "created_at", "kind", "tags", "content"] as const;
  const missing = fields.find((f) => o[f] === undefined);
  if (missing !== undefined)
    return shapeError("missing-field", `Missing field: ${missing}`, missing);
  const { id, pubkey, created_at, kind, tags, content } = o;
  if (typeof id !== "string" || !HEX64.test(id))
    return shapeError("invalid-field", "id must be 64 lowercase hex chars", "id");
  if (typeof pubkey !== "string" || !HEX64.test(pubkey))
    return shapeError("invalid-field", "pubkey must be 64 lowercase hex chars", "pubkey");
  if (!isUint(created_at, Number.MAX_SAFE_INTEGER))
    return shapeError("invalid-field", "created_at must be a non-negative integer", "created_at");
  if (!isUint(kind, 65535))
    return shapeError("invalid-field", "kind must be an integer between 0 and 65535", "kind");
  if (!Array.isArray(tags) || !tags.every(isTag))
    return shapeError("invalid-tags", "tags must be an array of non-empty string arrays", "tags");
  if (typeof content !== "string")
    return shapeError("invalid-field", "content must be a string", "content");
  return ok({ id, pubkey, created_at, kind, tags: tags as Tag[], content });
};

/** Parses JSON without throwing; shared by every "paste some JSON" entry point. */
export const parseJson = (json: string): Result<unknown, ProtocolError<"invalid-json">> => {
  try {
    return ok(JSON.parse(json) as unknown);
  } catch (e) {
    return err({ code: "invalid-json", message: e instanceof Error ? e.message : String(e) });
  }
};

/** `JSON.parse` + `validateEventShape`, mapping parse failures to `invalid-json`. */
export const parseEventJson = (json: string): Result<NostrEvent, EventShapeError> => {
  const parsed = parseJson(json);
  return parsed.ok ? validateEventShape(parsed.value) : parsed;
};
