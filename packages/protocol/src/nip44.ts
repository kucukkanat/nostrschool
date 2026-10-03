/**
 * NIP-44 v2 encryption, step by step (chapter 8):
 * ECDH → HKDF conversation key → per-message keys → padding → ChaCha20 → HMAC → base64 payload.
 */
import { chacha20 } from "@noble/ciphers/chacha.js";
import { secp256k1 } from "@noble/curves/secp256k1.js";
import { expand as hkdfExpand, extract as hkdfExtract } from "@noble/hashes/hkdf.js";
import { hmac } from "@noble/hashes/hmac.js";
import { sha256 } from "@noble/hashes/sha2.js";
import { base64 } from "@scure/base";
import { concatBytes, hexToBytes, randomBytes, utf8Decode, utf8Encode } from "./encoding.ts";
import { isValidPublicKey, normalizeSecretKey } from "./keys.ts";
import { err, fail, ok, type ProtocolError, type Result } from "./result.ts";
import type { Hex } from "./types.ts";

export type CryptoErrorCode =
  | "invalid-key"
  | "invalid-payload"
  | "unsupported-version"
  | "invalid-mac"
  | "invalid-padding"
  | "invalid-length";
export type CryptoError = ProtocolError<CryptoErrorCode>;

/** Shared secret for a sender/recipient pair (symmetric: A→B equals B→A). */
export const nip44ConversationKey = (
  secretKey: Uint8Array | Hex,
  publicKey: Hex,
): Result<Uint8Array, CryptoError> => {
  const shared = sharedX(secretKey, publicKey);
  return shared.ok ? ok(hkdfExtract(sha256, shared.value, utf8Encode("nip44-v2"))) : shared;
};

/**
 * ECDH x-coordinate shared by both parties. Exported for NIP-04, which (badly) uses it directly
 * as the AES key; NIP-44 instead feeds it through HKDF.
 */
export const sharedX = (
  secretKey: Uint8Array | Hex,
  publicKey: Hex,
): Result<Uint8Array, CryptoError> => {
  const sk = normalizeSecretKey(secretKey);
  if (!sk.ok) return fail("invalid-key", `Invalid secret key: ${sk.error.message}`);
  const pub = hexToBytes(`02${publicKey}`);
  if (!isValidPublicKey(publicKey) || !pub.ok)
    return fail("invalid-key", "Public key is not a valid x-only secp256k1 key");
  return ok(secp256k1.getSharedSecret(sk.value, pub.value, true).subarray(1, 33));
};

/** Per-message keys: HKDF-expand(conversationKey, info = nonce, 76 bytes) split 32/12/32. */
export const nip44MessageKeys = (
  conversationKey: Uint8Array,
  nonce: Uint8Array,
): Nip44MessageKeys => {
  const keys = hkdfExpand(sha256, conversationKey, nonce, 76);
  return {
    chachaKey: keys.subarray(0, 32),
    chachaNonce: keys.subarray(32, 44),
    hmacKey: keys.subarray(44, 76),
  };
};

const MIN_PLAINTEXT = 1;
const MAX_PLAINTEXT = 65535;

const pad = (plaintext: Uint8Array): Uint8Array => {
  const out = new Uint8Array(2 + nip44PaddedLength(plaintext.length));
  new DataView(out.buffer).setUint16(0, plaintext.length, false);
  out.set(plaintext, 2);
  return out;
};

const unpad = (padded: Uint8Array): Result<Uint8Array, CryptoError> => {
  const length = new DataView(padded.buffer, padded.byteOffset, padded.byteLength).getUint16(0);
  return length >= MIN_PLAINTEXT && padded.length === 2 + nip44PaddedLength(length)
    ? ok(padded.subarray(2, 2 + length))
    : fail("invalid-padding", "Padding does not match the declared plaintext length");
};

const macFor = (hmacKey: Uint8Array, nonce: Uint8Array, ciphertext: Uint8Array): Uint8Array =>
  hmac(sha256, hmacKey, concatBytes(nonce, ciphertext));

/** Constant-time comparison so MAC checks do not leak how many bytes matched. */
const equalBytes = (a: Uint8Array, b: Uint8Array): boolean =>
  a.length === b.length && a.reduce((diff, x, i) => diff | (x ^ (b[i] ?? 0)), 0) === 0;

export interface Nip44MessageKeys {
  readonly chachaKey: Uint8Array;
  readonly chachaNonce: Uint8Array;
  readonly hmacKey: Uint8Array;
}

export interface Nip44EncryptOptions {
  /** 32-byte nonce; random when omitted. Fix it only for reproducible fixtures/tests. */
  readonly nonce?: Uint8Array;
}

export interface Nip44EncryptSteps {
  readonly conversationKey: Uint8Array;
  readonly nonce: Uint8Array;
  readonly messageKeys: Nip44MessageKeys;
  /** Plaintext UTF-8 bytes with 2-byte length prefix, zero-padded to the padded length. */
  readonly padded: Uint8Array;
  readonly ciphertext: Uint8Array;
  readonly mac: Uint8Array;
  /** base64(version ‖ nonce ‖ ciphertext ‖ mac) — what goes in `content`. */
  readonly payload: string;
}

export const nip44Encrypt = (
  plaintext: string,
  conversationKey: Uint8Array,
  options: Nip44EncryptOptions = {},
): Result<Nip44EncryptSteps, CryptoError> => {
  if (conversationKey.length !== 32)
    return fail("invalid-key", "Conversation key must be 32 bytes");
  const nonce = options.nonce ?? randomBytes(32);
  if (nonce.length !== 32) return fail("invalid-length", "Nonce must be 32 bytes");
  const bytes = utf8Encode(plaintext);
  if (bytes.length < MIN_PLAINTEXT || bytes.length > MAX_PLAINTEXT)
    return fail("invalid-length", `Plaintext must be 1–65535 bytes, got ${bytes.length}`);
  const messageKeys = nip44MessageKeys(conversationKey, nonce);
  const padded = pad(bytes);
  const ciphertext = chacha20(messageKeys.chachaKey, messageKeys.chachaNonce, padded);
  const mac = macFor(messageKeys.hmacKey, nonce, ciphertext);
  const payload = base64.encode(concatBytes(Uint8Array.of(2), nonce, ciphertext, mac));
  return ok({ conversationKey, nonce, messageKeys, padded, ciphertext, mac, payload });
};

export interface Nip44DecryptSteps {
  readonly version: number;
  readonly nonce: Uint8Array;
  readonly ciphertext: Uint8Array;
  readonly mac: Uint8Array;
  readonly messageKeys: Nip44MessageKeys;
  readonly padded: Uint8Array;
  readonly plaintext: string;
}

export const nip44Decrypt = (
  payload: string,
  conversationKey: Uint8Array,
): Result<Nip44DecryptSteps, CryptoError> => {
  if (conversationKey.length !== 32)
    return fail("invalid-key", "Conversation key must be 32 bytes");
  // "#" marks a future non-base64 encoding (NIP-44 reserves it).
  if (payload.startsWith("#")) return fail("unsupported-version", "Unknown encryption version");
  if (payload.length < 132 || payload.length > 87472)
    return fail("invalid-payload", `Invalid payload length ${payload.length}`);
  const data = decodeBase64(payload);
  if (!data.ok) return data;
  const bytes = data.value;
  if (bytes.length < 99 || bytes.length > 65603)
    return fail("invalid-payload", `Invalid decoded length ${bytes.length}`);
  const version = bytes[0] ?? 0;
  if (version !== 2) return fail("unsupported-version", `Unknown encryption version ${version}`);
  const nonce = bytes.subarray(1, 33);
  const ciphertext = bytes.subarray(33, -32);
  const mac = bytes.subarray(-32);
  const messageKeys = nip44MessageKeys(conversationKey, nonce);
  if (!equalBytes(macFor(messageKeys.hmacKey, nonce, ciphertext), mac))
    return fail("invalid-mac", "MAC check failed: wrong key or tampered payload");
  const padded = chacha20(messageKeys.chachaKey, messageKeys.chachaNonce, ciphertext);
  const unpadded = unpad(padded);
  if (!unpadded.ok) return unpadded;
  const plaintext = utf8Decode(unpadded.value);
  return ok({ version, nonce, ciphertext, mac, messageKeys, padded, plaintext });
};

/** Strict base64 decode as a Result (the decoder throws on bad input). */
export const decodeBase64 = (text: string): Result<Uint8Array, CryptoError> => {
  try {
    return ok(base64.decode(text));
  } catch (e) {
    return err({
      code: "invalid-payload",
      message: `Invalid base64: ${e instanceof Error ? e.message : String(e)}`,
    });
  }
};

/** NIP-44 padded length for a plaintext of `length` bytes (hides exact message size). */
export const nip44PaddedLength = (length: number): number => {
  if (length <= 32) return 32;
  const nextPower = 1 << (Math.floor(Math.log2(length - 1)) + 1);
  const chunk = nextPower <= 256 ? 32 : nextPower / 8;
  return chunk * (Math.floor((length - 1) / chunk) + 1);
};
