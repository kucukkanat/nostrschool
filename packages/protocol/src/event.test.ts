import { describe, expect, test } from "bun:test";
import { finalizeEvent, getEventHash, verifyEvent as ntVerify } from "nostr-tools/pure";
import { bytesToHex, concatBytes, randomBytes, sha256Hex } from "./encoding.ts";
import {
  computeEventId,
  parseEventJson,
  parseJson,
  serializeEvent,
  signEvent,
  validateEventShape,
  validateRumorShape,
  verifyEvent,
} from "./event.ts";
import {
  deriveSecretKey,
  generateKeypair,
  getPublicKey,
  isValidPublicKey,
  keypairFromSecret,
  normalizeSecretKey,
} from "./keys.ts";
import { unwrap } from "./result.ts";
import type { EventTemplate, NostrEvent } from "./types.ts";

// BIP-340 official test vector #1 (https://github.com/bitcoin/bips/blob/master/bip-0340/test-vectors.csv).
const BIP340_SK = "b7e151628aed2a6abf7158809cf4f3c762e7160f38b4da56a784d9045190cfef";
const BIP340_PK = "dff1d77f2a671c5f36183726db2341be58feae1da2deced843240f7b502ba659";

const ZERO_AUX = new Uint8Array(32);
const template: EventTemplate = {
  kind: 1,
  created_at: 1735689600,
  tags: [["t", "nostr"]],
  content: 'gm 🤙\n"q"',
};

describe("encoding", () => {
  test("sha256 of the empty string and bytes", () => {
    expect(sha256Hex("")).toBe("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
    expect(sha256Hex(new Uint8Array(0))).toBe(sha256Hex(""));
    expect(sha256Hex("abc")).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });
  test("concat and random bytes", () => {
    expect(concatBytes(Uint8Array.of(1), Uint8Array.of(2, 3))).toEqual(Uint8Array.of(1, 2, 3));
    expect(randomBytes(16).length).toBe(16);
  });
});

describe("keys", () => {
  test("BIP-340 vector: secret → x-only pubkey", () => {
    expect(getPublicKey(BIP340_SK)).toEqual({ ok: true, value: BIP340_PK });
    expect(isValidPublicKey(BIP340_PK)).toBe(true);
  });
  test("generate and round-trip", () => {
    const kp = generateKeypair();
    expect(kp.secretKeyHex).toBe(bytesToHex(kp.secretKey));
    expect(unwrap(keypairFromSecret(kp.secretKeyHex))).toEqual(kp);
  });
  test("rejects bad secret keys with typed codes", () => {
    expect(unwrapCode(keypairFromSecret("zz".repeat(32)))).toBe("invalid-hex");
    expect(unwrapCode(keypairFromSecret("ab"))).toBe("invalid-length");
    expect(unwrapCode(keypairFromSecret(new Uint8Array(31)))).toBe("invalid-length");
    expect(unwrapCode(keypairFromSecret(new Uint8Array(32)))).toBe("out-of-range");
    expect(unwrapCode(keypairFromSecret("f".repeat(64)))).toBe("out-of-range");
    expect(unwrapCode(getPublicKey("00"))).toBe("invalid-length");
    expect(normalizeSecretKey(BIP340_SK).ok).toBe(true);
  });
  test("deriveSecretKey is sha256(label)", () => {
    expect(bytesToHex(deriveSecretKey("abc"))).toBe(sha256Hex("abc"));
  });
  test("isValidPublicKey rejects non-points and bad hex", () => {
    expect(isValidPublicKey("ABCD")).toBe(false);
    expect(isValidPublicKey(BIP340_PK.toUpperCase())).toBe(false);
    // x = 5 has no point on secp256k1 (y² = 132 is a non-residue mod p).
    expect(isValidPublicKey(`${"0".repeat(63)}5`)).toBe(false);
  });
});

const unwrapCode = (r: { ok: boolean; error?: { code: string } } | { ok: true }): string =>
  "error" in r && r.error ? r.error.code : "ok";

describe("NIP-01 event pipeline", () => {
  const signed = unwrap(signEvent(template, BIP340_SK, { auxRand: ZERO_AUX }));

  test("serialization is the canonical array", () => {
    expect(serializeEvent({ ...template, pubkey: BIP340_PK })).toBe(
      `[0,"${BIP340_PK}",1735689600,1,[["t","nostr"]],"gm 🤙\\n\\"q\\""]`,
    );
  });

  test("steps agree with each other and with nostr-tools", () => {
    expect(signed.serialized).toBe(serializeEvent(signed.event));
    expect(signed.utf8Bytes).toEqual(new TextEncoder().encode(signed.serialized));
    expect(bytesToHex(signed.hash)).toBe(signed.id);
    expect(signed.id).toBe(getEventHash(signed.event as never));
    expect(ntVerify({ ...signed.event, tags: signed.event.tags.map((t) => [...t]) })).toBe(true);
    expect(signed.pubkey).toBe(BIP340_PK);
    expect(computeEventId(signed.event)).toEqual({
      serialized: signed.serialized,
      utf8Bytes: signed.utf8Bytes,
      hash: signed.hash,
      id: signed.id,
    });
  });

  test("fixed auxRand is reproducible; random auxRand still verifies", () => {
    expect(unwrap(signEvent(template, BIP340_SK, { auxRand: ZERO_AUX })).sig).toBe(signed.sig);
    const random = unwrap(signEvent(template, BIP340_SK));
    expect(verifyEvent(random.event).ok).toBe(true);
  });

  test("signEvent ignores stray fields and rejects bad keys", () => {
    const stray = { ...template, id: "x", sig: "y" } as typeof template;
    expect(unwrap(signEvent(stray, BIP340_SK, { auxRand: ZERO_AUX })).event).toEqual(signed.event);
    expect(unwrapCode(signEvent(template, "00"))).toBe("invalid-length");
  });

  test("verifies events signed by nostr-tools", () => {
    const sk = deriveSecretKey("nostrschool:test");
    const e = finalizeEvent(
      { kind: 7, created_at: 1, tags: [], content: "+" },
      sk,
    ) as unknown as NostrEvent;
    const r = verifyEvent(e);
    expect(r.ok && r.value.steps.id).toBe(e.id);
  });

  test("each tamper maps to its failure code", () => {
    const e = signed.event;
    const tampered = verifyEvent({ ...e, content: "gn" });
    expect(tampered.ok).toBe(false);
    if (!tampered.ok) {
      expect(tampered.error.code).toBe("id-mismatch");
      expect(tampered.error.actualId).toBe(e.id);
      expect(tampered.error.expectedId).not.toBe(e.id);
    }
    expect(unwrapCode(verifyEvent({ ...e, kind: -1 }))).toBe("malformed");
    const badSig = `${e.sig.slice(0, -1)}${e.sig.endsWith("0") ? "1" : "0"}`;
    expect(unwrapCode(verifyEvent({ ...e, sig: badSig }))).toBe("bad-signature");
    // Re-hash the event under a pubkey that is not on the curve: id matches, key is invalid.
    const offCurve = `${"0".repeat(63)}5`;
    const forged = { ...e, pubkey: offCurve, id: computeEventId({ ...e, pubkey: offCurve }).id };
    expect(unwrapCode(verifyEvent(forged))).toBe("invalid-pubkey");
  });
});

describe("event shape validation", () => {
  const good = unwrap(signEvent(template, BIP340_SK, { auxRand: ZERO_AUX })).event;
  const codeOf = (x: unknown) => {
    const r = validateEventShape(x);
    return r.ok ? "ok" : `${r.error.code}:${r.error.field ?? ""}`;
  };

  test("accepts a valid event and strips unknown fields", () => {
    expect(validateEventShape({ ...good, extra: 1 })).toEqual({ ok: true, value: good });
  });

  test.each([
    [null, "not-an-object:"],
    [[1], "not-an-object:"],
    [{ ...good, id: undefined }, "missing-field:id"],
    [{ ...good, sig: undefined }, "missing-field:sig"],
    [{ ...good, id: "AB" }, "invalid-field:id"],
    [{ ...good, pubkey: 1 }, "invalid-field:pubkey"],
    [{ ...good, created_at: 1.5 }, "invalid-field:created_at"],
    [{ ...good, kind: 70000 }, "invalid-field:kind"],
    [{ ...good, tags: [[]] }, "invalid-tags:tags"],
    [{ ...good, tags: [["p", 1]] }, "invalid-tags:tags"],
    [{ ...good, tags: "x" }, "invalid-tags:tags"],
    [{ ...good, content: 5 }, "invalid-field:content"],
    [{ ...good, sig: "00" }, "invalid-field:sig"],
  ])("%#: %j → %s", (input, expected) => {
    expect(codeOf(input)).toBe(expected);
  });

  test("rumor shape needs no sig", () => {
    const { sig: _sig, ...rumor } = good;
    expect(validateRumorShape(rumor)).toEqual({ ok: true, value: rumor });
  });

  test("parseEventJson / parseJson", () => {
    expect(parseEventJson(JSON.stringify(good))).toEqual({ ok: true, value: good });
    expect(unwrapCode(parseEventJson("{nope"))).toBe("invalid-json");
    expect(unwrapCode(parseEventJson("[]"))).toBe("not-an-object");
    expect(parseJson("1")).toEqual({ ok: true, value: 1 });
  });
});
