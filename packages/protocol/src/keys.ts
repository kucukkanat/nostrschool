/** secp256k1 keys (BIP-340 x-only public keys), as used by every Nostr identity. */
import { schnorr, secp256k1 } from "@noble/curves/secp256k1.js";
import { bytesToHex, hexToBytes, sha256 } from "./encoding.ts";
import { fail, ok, type ProtocolError, type Result } from "./result.ts";
import type { Hex } from "./types.ts";

export type KeyErrorCode = "invalid-hex" | "invalid-length" | "out-of-range";
export type KeyError = ProtocolError<KeyErrorCode>;

export interface Keypair {
  /** 32 raw secret-key bytes. Treat as secret; demo keys only on this site. */
  readonly secretKey: Uint8Array;
  readonly secretKeyHex: Hex;
  /** 32-byte x-only public key, hex (64 chars). This is the Nostr `pubkey`. */
  readonly publicKey: Hex;
}

/**
 * Turns bytes or hex into validated secret-key bytes (32 bytes, 1 ≤ k < n).
 * Every function taking a secret key funnels through here so errors are uniform.
 */
export const normalizeSecretKey = (secretKey: Uint8Array | Hex): Result<Uint8Array, KeyError> => {
  if (typeof secretKey === "string") {
    const bytes = hexToBytes(secretKey, 32);
    return bytes.ok ? normalizeSecretKey(bytes.value) : bytes;
  }
  if (secretKey.length !== 32)
    return fail("invalid-length", `Secret key must be 32 bytes, got ${secretKey.length}`);
  return secp256k1.utils.isValidSecretKey(secretKey)
    ? ok(Uint8Array.from(secretKey))
    : fail("out-of-range", "Secret key must be between 1 and the curve order n - 1");
};

const fromValidSecret = (secretKey: Uint8Array): Keypair => ({
  secretKey,
  secretKeyHex: bytesToHex(secretKey),
  publicKey: bytesToHex(schnorr.getPublicKey(secretKey)),
});

/** Fresh random keypair (CSPRNG). */
export const generateKeypair = (): Keypair => fromValidSecret(schnorr.utils.randomSecretKey());

/** Validates a secret key (bytes or 64-char hex; must be 1 ≤ k < n) and derives its pubkey. */
export const keypairFromSecret = (secretKey: Uint8Array | Hex): Result<Keypair, KeyError> => {
  const sk = normalizeSecretKey(secretKey);
  return sk.ok ? ok(fromValidSecret(sk.value)) : sk;
};

/** x-only public key (hex) for a secret key. */
export const getPublicKey = (secretKey: Uint8Array | Hex): Result<Hex, KeyError> => {
  const kp = keypairFromSecret(secretKey);
  return kp.ok ? ok(kp.value.publicKey) : kp;
};

/**
 * Deterministic secret key = sha256(utf8(label)). For fixtures and reproducible demos ONLY:
 * anyone who knows the label knows the key.
 */
export const deriveSecretKey = (label: string): Uint8Array => sha256(label);

/** True if `hex` is a valid x-only public key (64 lowercase hex chars and a point on the curve). */
export const isValidPublicKey = (hex: string): boolean => {
  if (!/^[0-9a-f]{64}$/.test(hex)) return false;
  const bytes = hexToBytes(`02${hex}`);
  // BIP-340 x-only keys imply even Y, so prefix 0x02 and ask the curve if the point exists.
  return bytes.ok && secp256k1.utils.isValidPublicKey(bytes.value, true);
};
