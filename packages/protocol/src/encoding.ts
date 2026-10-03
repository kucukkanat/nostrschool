/** Byte/hex/UTF-8 helpers shared by every step-exposing function. */
import { sha256 as nobleSha256 } from "@noble/hashes/sha2.js";
import { fail, ok, type ProtocolError, type Result } from "./result.ts";
import type { Hex } from "./types.ts";

export type HexErrorCode = "invalid-hex" | "invalid-length";
export type HexError = ProtocolError<HexErrorCode>;

export const bytesToHex = (bytes: Uint8Array): Hex =>
  Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");

/** Strict: lowercase/uppercase hex, even length; optional exact byte length check. */
export const hexToBytes = (hex: string, expectedBytes?: number): Result<Uint8Array, HexError> => {
  if (!/^(?:[0-9a-fA-F]{2})*$/.test(hex)) return fail("invalid-hex", `Not valid hex: "${hex}"`);
  if (expectedBytes !== undefined && hex.length !== expectedBytes * 2)
    return fail(
      "invalid-length",
      `Expected ${expectedBytes} bytes (${expectedBytes * 2} hex chars), got ${hex.length} chars`,
    );
  return ok(Uint8Array.from(hex.match(/../g) ?? [], (h) => Number.parseInt(h, 16)));
};

export const isHex = (value: string, bytes?: number): boolean => hexToBytes(value, bytes).ok;

export const utf8Encode = (text: string): Uint8Array => new TextEncoder().encode(text);
export const utf8Decode = (bytes: Uint8Array): string => new TextDecoder().decode(bytes);

/** SHA-256 of a UTF-8 string or raw bytes. */
export const sha256 = (input: string | Uint8Array): Uint8Array =>
  nobleSha256(typeof input === "string" ? utf8Encode(input) : input);

/** Hex SHA-256 of a UTF-8 string or raw bytes. */
export const sha256Hex = (input: string | Uint8Array): Hex => bytesToHex(sha256(input));

/** Concatenates byte arrays (e.g. version ‖ nonce ‖ ciphertext ‖ mac). */
export const concatBytes = (...parts: readonly Uint8Array[]): Uint8Array => {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  parts.reduce((offset, p) => {
    out.set(p, offset);
    return offset + p.length;
  }, 0);
  return out;
};

/** `n` bytes from the platform CSPRNG. */
export const randomBytes = (n: number): Uint8Array => crypto.getRandomValues(new Uint8Array(n));
