/**
 * NIP-04 (deprecated) encrypted DMs — included only to contrast with NIP-44/NIP-17 in chapter 8:
 * AES-256-CBC with the raw ECDH x-coordinate as key, no MAC, metadata fully visible.
 */
import { cbc } from "@noble/ciphers/aes.js";
import { base64 } from "@scure/base";
import { randomBytes, utf8Decode, utf8Encode } from "./encoding.ts";
import { type CryptoError, decodeBase64, sharedX } from "./nip44.ts";
import { err, fail, ok, type Result } from "./result.ts";
import type { Hex } from "./types.ts";

export interface Nip04Steps {
  /** ECDH shared x-coordinate (used directly as the AES key — one of NIP-04's flaws). */
  readonly sharedKey: Uint8Array;
  readonly iv: Uint8Array;
  readonly ciphertext: Uint8Array;
  /** `base64(ciphertext)?iv=base64(iv)` */
  readonly payload: string;
}

export const nip04Encrypt = (
  plaintext: string,
  secretKey: Uint8Array | Hex,
  publicKey: Hex,
  options: { readonly iv?: Uint8Array } = {},
): Result<Nip04Steps, CryptoError> => {
  const sharedKey = sharedX(secretKey, publicKey);
  if (!sharedKey.ok) return sharedKey;
  const iv = options.iv ?? randomBytes(16);
  if (iv.length !== 16) return fail("invalid-length", "IV must be 16 bytes");
  const ciphertext = cbc(sharedKey.value, iv).encrypt(utf8Encode(plaintext));
  const payload = `${base64.encode(ciphertext)}?iv=${base64.encode(iv)}`;
  return ok({ sharedKey: sharedKey.value, iv, ciphertext, payload });
};

export const nip04Decrypt = (
  payload: string,
  secretKey: Uint8Array | Hex,
  publicKey: Hex,
): Result<string, CryptoError> => {
  const sharedKey = sharedX(secretKey, publicKey);
  if (!sharedKey.ok) return sharedKey;
  const [ct64, iv64, ...rest] = payload.split("?iv=");
  if (ct64 === undefined || iv64 === undefined || rest.length > 0)
    return fail("invalid-payload", 'Expected "<base64 ciphertext>?iv=<base64 iv>"');
  const ciphertext = decodeBase64(ct64);
  if (!ciphertext.ok) return ciphertext;
  const iv = decodeBase64(iv64);
  if (!iv.ok) return iv;
  if (iv.value.length !== 16) return fail("invalid-length", "IV must be 16 bytes");
  try {
    return ok(utf8Decode(cbc(sharedKey.value, iv.value).decrypt(ciphertext.value)));
  } catch (e) {
    // No MAC in NIP-04: a wrong key usually surfaces only as broken PKCS#7 padding (or garbage).
    return err({
      code: "invalid-padding",
      message: `Decryption failed: ${e instanceof Error ? e.message : String(e)}`,
    });
  }
};
