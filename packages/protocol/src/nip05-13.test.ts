import { describe, expect, test } from "bun:test";
import { getPow } from "nostr-tools/nip13";
import { computeEventId, signEvent, verifyEvent } from "./event.ts";
import { deriveSecretKey, keypairFromSecret } from "./keys.ts";
import { classifyKind, KINDS } from "./kinds.ts";
import { parseNip05, verifyNip05Document } from "./nip05.ts";
import {
  countLeadingZeroBits,
  expectedAttempts,
  getCommittedDifficulty,
  getEffectivePow,
  getPowDifficulty,
  minePow,
  withNonce,
} from "./nip13.ts";
import { unwrap } from "./result.ts";

const code = (r: { ok: boolean; error?: { code: string } }): string =>
  r.ok ? "ok" : (r.error?.code ?? "");
const PK = "b0635d6a9851d3aed0cd6c495b282167acf761729078d975fc341b22650b07b9";

describe("NIP-05 parsing", () => {
  test("name@domain", () => {
    expect(parseNip05(" Bob@Example.COM ")).toEqual({
      ok: true,
      value: {
        name: "bob",
        domain: "example.com",
        wellKnownUrl: "https://example.com/.well-known/nostr.json?name=bob",
        display: "bob@example.com",
      },
    });
  });
  test("_@domain and bare domain display as the domain", () => {
    expect(unwrap(parseNip05("_@nostr.example")).display).toBe("nostr.example");
    expect(unwrap(parseNip05("nostr.example")).name).toBe("_");
    expect(unwrap(parseNip05("a.b-c_d@sub.example.org:8080")).domain).toBe("sub.example.org:8080");
  });
  test.each([
    "",
    "@example.com",
    "bob@",
    "bob@@x.com",
    "a@b@c.com",
    "bo b@x.com",
    "bob@localhost",
    "bob@-x.com",
  ])("rejects %p", (id) => {
    expect(code(parseNip05(id))).toBe("invalid-format");
  });
});

describe("NIP-05 document verification", () => {
  const addr = unwrap(parseNip05("bob@example.com"));
  // Shape of the NIP-05 spec example document.
  const doc = {
    names: { bob: PK },
    relays: { [PK]: ["wss://relay.example.com", "wss://relay2.example.com"] },
  };

  test("verifies and returns relays", () => {
    expect(verifyNip05Document(doc, addr, PK.toUpperCase())).toEqual({
      ok: true,
      value: { pubkey: PK, relays: ["wss://relay.example.com", "wss://relay2.example.com"] },
    });
    expect(unwrap(verifyNip05Document({ names: { bob: PK } }, addr, PK)).relays).toEqual([]);
    expect(unwrap(verifyNip05Document({ ...doc, relays: {} }, addr, PK)).relays).toEqual([]);
  });

  test.each<[string, unknown, string]>([
    ["not an object", "x", "invalid-document"],
    ["no names", {}, "invalid-document"],
    ["names array", { names: [] }, "invalid-document"],
    ["missing name", { names: { alice: PK } }, "name-not-found"],
    ["npub instead of hex", { names: { bob: "npub1xyz" } }, "invalid-document"],
    ["other pubkey", { names: { bob: "a".repeat(64) } }, "pubkey-mismatch"],
    ["relays not a map", { ...doc, relays: [] }, "invalid-document"],
    ["relays not strings", { ...doc, relays: { [PK]: [1] } }, "invalid-document"],
  ])("%s", (_n, d, expected) => {
    expect(code(verifyNip05Document(d, addr, PK))).toBe(expected);
  });
});

describe("NIP-13 proof of work", () => {
  test("difficulty counting matches the NIP-13 example and nostr-tools", () => {
    // NIP-13: "000000000e9d97a1ab09fc381030b346cdd7a142ad57e6df0b46dc9bef6c7e2d" has difficulty 36.
    const id = "000000000e9d97a1ab09fc381030b346cdd7a142ad57e6df0b46dc9bef6c7e2d";
    expect(countLeadingZeroBits(id)).toBe(36);
    expect(getPow(id)).toBe(36);
    expect(countLeadingZeroBits("0".repeat(64))).toBe(256);
    expect(countLeadingZeroBits(`8${"0".repeat(63)}`)).toBe(0);
    expect(countLeadingZeroBits("0f")).toBe(4);
    expect(countLeadingZeroBits(Uint8Array.of(0, 1))).toBe(15);
    expect(countLeadingZeroBits("not hex")).toBe(0);
    expect(getPowDifficulty({ id })).toBe(36);
  });

  test("committed vs effective difficulty", () => {
    const id = "000000000e9d97a1ab09fc381030b346cdd7a142ad57e6df0b46dc9bef6c7e2d";
    expect(getCommittedDifficulty({ tags: [["nonce", "776797", "20"]] })).toBe(20);
    expect(getCommittedDifficulty({ tags: [["nonce", "1"]] })).toBeUndefined();
    expect(getCommittedDifficulty({ tags: [["nonce", "1", "x"]] })).toBeUndefined();
    expect(getEffectivePow({ id, tags: [["nonce", "776797", "20"]] })).toBe(20);
    expect(getEffectivePow({ id, tags: [] })).toBe(36);
    expect(expectedAttempts(10)).toBe(1024);
  });

  const sk = deriveSecretKey("nip13:miner");
  const pubkey = unwrap(keypairFromSecret(sk)).publicKey;
  const unsigned = {
    kind: 1,
    created_at: 1735689600,
    tags: [
      ["t", "pow"],
      ["nonce", "9", "1"],
    ],
    content: "work",
  } as const;

  test("mines deterministically and the result signs + verifies", () => {
    const r = unwrap(minePow({ ...unsigned, pubkey }, 8));
    expect(r.difficulty).toBeGreaterThanOrEqual(8);
    expect(r.event.tags).toEqual([
      ["t", "pow"],
      ["nonce", String(r.nonce), "8"],
    ]);
    expect(computeEventId(r.event).id).toBe(r.id);
    expect(r.attempts).toBe(r.nonce + 1);
    expect(unwrap(minePow({ ...unsigned, pubkey }, 8))).toEqual(r);
    const signed = unwrap(signEvent(r.event, sk));
    expect(signed.id).toBe(r.id);
    expect(verifyEvent(signed.event).ok).toBe(true);
    expect(unwrap(minePow({ ...unsigned, pubkey }, 0)).attempts).toBe(1);
  });

  test("bounded: exhaustion reports progress and resumes", () => {
    const first = minePow({ ...unsigned, pubkey }, 8, { maxAttempts: 3 });
    expect(first.ok).toBe(false);
    if (first.ok) return;
    expect(first.error.code).toBe("exhausted");
    expect(first.error.nextNonce).toBe(3);
    expect(first.error.best?.nonce).toBeLessThan(3);
    const resumed = unwrap(
      minePow({ ...unsigned, pubkey }, 8, { startNonce: first.error.nextNonce ?? 0 }),
    );
    expect(resumed.nonce).toBe(unwrap(minePow({ ...unsigned, pubkey }, 8)).nonce);
    const none = minePow({ ...unsigned, pubkey }, 8, { maxAttempts: 0 });
    expect(!none.ok && none.error.best).toBeUndefined();
  });

  test("invalid targets", () => {
    for (const t of [-1, 1.5, 257])
      expect(code(minePow({ ...unsigned, pubkey }, t))).toBe("invalid-difficulty");
  });

  test("withNonce replaces an existing nonce tag", () => {
    expect(withNonce({ ...unsigned, pubkey }, 5, 2).tags).toEqual([
      ["t", "pow"],
      ["nonce", "5", "2"],
    ]);
  });
});

describe("kind registry", () => {
  test("at least 40 well-known kinds, consistent with NIP-01 ranges", () => {
    expect(KINDS.length).toBeGreaterThanOrEqual(40);
    for (const k of KINDS) {
      expect(k.category).toBe(classifyKind(k.kind));
      expect(k.nip).toMatch(/^[0-9A-F]{2}$/);
    }
  });
});
