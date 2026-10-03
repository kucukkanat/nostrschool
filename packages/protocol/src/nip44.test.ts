import { describe, expect, test } from "bun:test";
import { chacha20 } from "@noble/ciphers/chacha.js";
import { hmac } from "@noble/hashes/hmac.js";
import { sha256 } from "@noble/hashes/sha2.js";
import * as ntNip04 from "nostr-tools/nip04";
import * as ntNip44 from "nostr-tools/nip44";
import vectors from "../test/vectors/nip44.vectors.json";
import { bytesToHex, hexToBytes, sha256Hex } from "./encoding.ts";
import { deriveSecretKey, keypairFromSecret } from "./keys.ts";
import { nip04Decrypt, nip04Encrypt } from "./nip04.ts";
import {
  decodeBase64,
  nip44ConversationKey,
  nip44Decrypt,
  nip44Encrypt,
  nip44MessageKeys,
  nip44PaddedLength,
  sharedX,
} from "./nip44.ts";
import { unwrap } from "./result.ts";

// Official vectors: https://github.com/paulmillr/nip44 (sha256 pinned in NIP-44).
const VECTORS_SHA256 = "269ed0f69e4c192512cc779e78c555090cebc7c785b609e338a62afc3ce25040";
const v2 = vectors.v2;
const bytes = (hex: string): Uint8Array => unwrap(hexToBytes(hex));
const code = (r: { ok: boolean; error?: { code: string } }): string =>
  r.ok ? "ok" : (r.error?.code ?? "");

test("vector file is the pinned official one", async () => {
  const file = Bun.file(new URL("../test/vectors/nip44.vectors.json", import.meta.url));
  expect(sha256Hex(new Uint8Array(await file.arrayBuffer()))).toBe(VECTORS_SHA256);
});

describe("NIP-44 v2 official vectors (valid)", () => {
  test.each(v2.valid.get_conversation_key)("conversation key %#", (v) => {
    expect(bytesToHex(unwrap(nip44ConversationKey(v.sec1, v.pub2)))).toBe(v.conversation_key);
  });

  test("message keys", () => {
    const ck = bytes(v2.valid.get_message_keys.conversation_key);
    for (const k of v2.valid.get_message_keys.keys) {
      const keys = nip44MessageKeys(ck, bytes(k.nonce));
      expect(bytesToHex(keys.chachaKey)).toBe(k.chacha_key);
      expect(bytesToHex(keys.chachaNonce)).toBe(k.chacha_nonce);
      expect(bytesToHex(keys.hmacKey)).toBe(k.hmac_key);
    }
  });

  test.each(v2.valid.calc_padded_len)("padded length %d → %d", (len, padded) => {
    expect(nip44PaddedLength(len)).toBe(padded);
  });

  test.each(v2.valid.encrypt_decrypt)("encrypt/decrypt %#", (v) => {
    const ck = unwrap(nip44ConversationKey(v.sec1, unwrap(keypairFromSecret(v.sec2)).publicKey));
    expect(bytesToHex(ck)).toBe(v.conversation_key);
    const enc = unwrap(nip44Encrypt(v.plaintext, ck, { nonce: bytes(v.nonce) }));
    expect(enc.payload).toBe(v.payload);
    const dec = unwrap(nip44Decrypt(v.payload, ck));
    expect(dec.plaintext).toBe(v.plaintext);
    expect(dec.version).toBe(2);
    expect(dec.nonce).toEqual(enc.nonce);
    expect(dec.ciphertext).toEqual(enc.ciphertext);
    expect(dec.mac).toEqual(enc.mac);
    expect(dec.padded).toEqual(enc.padded);
    expect(dec.messageKeys).toEqual(enc.messageKeys);
  });

  test.each(v2.valid.encrypt_decrypt_long_msg)("long message %#", (v) => {
    const plaintext = v.pattern.repeat(v.repeat);
    expect(sha256Hex(plaintext)).toBe(v.plaintext_sha256);
    const ck = bytes(v.conversation_key);
    const enc = unwrap(nip44Encrypt(plaintext, ck, { nonce: bytes(v.nonce) }));
    expect(sha256Hex(enc.payload)).toBe(v.payload_sha256);
    expect(unwrap(nip44Decrypt(enc.payload, ck)).plaintext).toBe(plaintext);
  });
});

describe("NIP-44 v2 official vectors (invalid)", () => {
  test.each(v2.invalid.encrypt_msg_lengths)("message length %d is rejected", (len) => {
    expect(code(nip44Encrypt("a".repeat(len), new Uint8Array(32)))).toBe("invalid-length");
  });

  test.each(v2.invalid.get_conversation_key)("conversation key: $note", (v) => {
    expect(code(nip44ConversationKey(v.sec1, v.pub2))).toBe("invalid-key");
  });

  test.each(v2.invalid.decrypt)("decrypt: $note", (v) => {
    expect(nip44Decrypt(v.payload, bytes(v.conversation_key)).ok).toBe(false);
  });
});

describe("NIP-44 behaviour", () => {
  const alice = unwrap(keypairFromSecret(deriveSecretKey("nip44:alice")));
  const bob = unwrap(keypairFromSecret(deriveSecretKey("nip44:bob")));
  const ck = unwrap(nip44ConversationKey(alice.secretKey, bob.publicKey));

  test("symmetric conversation key, interoperable with nostr-tools", () => {
    expect(unwrap(nip44ConversationKey(bob.secretKeyHex, alice.publicKey))).toEqual(ck);
    expect(ntNip44.v2.utils.getConversationKey(alice.secretKey, bob.publicKey)).toEqual(ck);
    const ours = unwrap(nip44Encrypt("hola 👋", ck)).payload;
    expect(ntNip44.v2.decrypt(ours, ck)).toBe("hola 👋");
    expect(unwrap(nip44Decrypt(ntNip44.v2.encrypt("hi", ck), ck)).plaintext).toBe("hi");
  });

  test("random nonce differs each time", () => {
    expect(unwrap(nip44Encrypt("x", ck)).payload).not.toBe(unwrap(nip44Encrypt("x", ck)).payload);
  });

  test("input validation codes", () => {
    expect(code(nip44Encrypt("x", new Uint8Array(31)))).toBe("invalid-key");
    expect(code(nip44Encrypt("x", ck, { nonce: new Uint8Array(3) }))).toBe("invalid-length");
    expect(code(nip44Decrypt("x", new Uint8Array(31)))).toBe("invalid-key");
    expect(code(nip44Decrypt("#abc", ck))).toBe("unsupported-version");
    expect(code(nip44Decrypt("A".repeat(100), ck))).toBe("invalid-payload");
    expect(code(nip44Decrypt("!".repeat(200), ck))).toBe("invalid-payload");
    expect(code(nip44ConversationKey("zz", bob.publicKey))).toBe("invalid-key");
    expect(code(sharedX(alice.secretKey, "nothex"))).toBe("invalid-key");
  });

  test("tampering is caught by the MAC; bad versions and padding are typed", () => {
    const enc = unwrap(nip44Encrypt("secret", ck, { nonce: new Uint8Array(32) }));
    const raw = unwrap(decodeBase64(enc.payload));
    const flip = (i: number): string => {
      const copy = Uint8Array.from(raw);
      copy[i] = (copy[i] ?? 0) ^ 1;
      return Buffer.from(copy).toString("base64");
    };
    expect(code(nip44Decrypt(flip(40), ck))).toBe("invalid-mac");
    expect(code(nip44Decrypt(flip(0), ck))).toBe("unsupported-version");
    const wrongKey = unwrap(nip44ConversationKey(alice.secretKey, alice.publicKey));
    expect(code(nip44Decrypt(enc.payload, wrongKey))).toBe("invalid-mac");
    expect(code(nip44Decrypt(Buffer.from(new Uint8Array(97)).toString("base64"), ck))).toBe(
      "invalid-payload",
    );
  });

  test("a correctly MACed payload with a lying length prefix fails padding", () => {
    // Build a payload by hand: zero length prefix is never valid (plaintext must be ≥ 1 byte).
    const nonce = new Uint8Array(32);
    const keys = nip44MessageKeys(ck, nonce);
    const ciphertext = chacha20(keys.chachaKey, keys.chachaNonce, new Uint8Array(34));
    const mac = hmac(sha256, keys.hmacKey, new Uint8Array([...nonce, ...ciphertext]));
    const payload = Buffer.from([2, ...nonce, ...ciphertext, ...mac]).toString("base64");
    expect(code(nip44Decrypt(payload, ck))).toBe("invalid-padding");
  });
});

describe("NIP-04 (deprecated, for contrast)", () => {
  const alice = unwrap(keypairFromSecret(deriveSecretKey("nip04:alice")));
  const bob = unwrap(keypairFromSecret(deriveSecretKey("nip04:bob")));

  test("round trip, steps and nostr-tools interop", async () => {
    const iv = new Uint8Array(16).fill(7);
    const steps = unwrap(nip04Encrypt("hello bob", alice.secretKey, bob.publicKey, { iv }));
    expect(steps.iv).toEqual(iv);
    expect(steps.sharedKey).toEqual(unwrap(sharedX(bob.secretKey, alice.publicKey)));
    expect(steps.payload).toEndWith(`?iv=${Buffer.from(iv).toString("base64")}`);
    expect(unwrap(nip04Decrypt(steps.payload, bob.secretKeyHex, alice.publicKey))).toBe(
      "hello bob",
    );
    expect(await ntNip04.decrypt(bob.secretKey, alice.publicKey, steps.payload)).toBe("hello bob");
    const theirs = await ntNip04.encrypt(alice.secretKey, bob.publicKey, "from nostr-tools");
    expect(unwrap(nip04Decrypt(theirs, bob.secretKey, alice.publicKey))).toBe("from nostr-tools");
    expect(unwrap(nip04Encrypt("x", alice.secretKey, bob.publicKey)).iv).toHaveLength(16);
  });

  test("error codes", () => {
    const payload = unwrap(nip04Encrypt("hello", alice.secretKey, bob.publicKey)).payload;
    expect(code(nip04Encrypt("x", "00", bob.publicKey))).toBe("invalid-key");
    expect(code(nip04Encrypt("x", alice.secretKey, bob.publicKey, { iv: new Uint8Array(3) }))).toBe(
      "invalid-length",
    );
    expect(code(nip04Decrypt(payload, alice.secretKey, "bad"))).toBe("invalid-key");
    expect(code(nip04Decrypt("no-iv", bob.secretKey, alice.publicKey))).toBe("invalid-payload");
    expect(code(nip04Decrypt("a?iv=b?iv=c", bob.secretKey, alice.publicKey))).toBe(
      "invalid-payload",
    );
    expect(code(nip04Decrypt("!!?iv=AAAA", bob.secretKey, alice.publicKey))).toBe(
      "invalid-payload",
    );
    expect(code(nip04Decrypt("AAAA?iv=!!", bob.secretKey, alice.publicKey))).toBe(
      "invalid-payload",
    );
    expect(code(nip04Decrypt("AAAA?iv=AAAA", bob.secretKey, alice.publicKey))).toBe(
      "invalid-length",
    );
    // Wrong key: no MAC, so the failure shows up as broken padding.
    const eve = unwrap(keypairFromSecret(deriveSecretKey("nip04:eve")));
    const wrong = nip04Decrypt(payload, eve.secretKey, alice.publicKey);
    expect(wrong.ok ? "garbage-but-ok" : wrong.error.code).toMatch(
      /invalid-padding|garbage-but-ok/,
    );
    const badBlock = `${Buffer.from(new Uint8Array(15)).toString("base64")}?iv=${Buffer.from(new Uint8Array(16)).toString("base64")}`;
    expect(code(nip04Decrypt(badBlock, bob.secretKey, alice.publicKey))).toBe("invalid-padding");
  });
});
