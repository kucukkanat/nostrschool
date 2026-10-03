import { describe, expect, test } from "bun:test";
import * as ntNip59 from "nostr-tools/nip59";
import { computeEventId, signEvent, verifyEvent } from "./event.ts";
import { deriveSecretKey, keypairFromSecret } from "./keys.ts";
import { nip44ConversationKey, nip44Encrypt } from "./nip44.ts";
import {
  createRumor,
  GIFT_WRAP_KIND,
  type GiftWrapInput,
  giftWrap,
  randomizedTimestamp,
  SEAL_KIND,
  unwrapGiftWrap,
} from "./nip59.ts";
import { unwrap } from "./result.ts";
import type { EventTemplate, NostrEvent } from "./types.ts";

const alice = unwrap(keypairFromSecret(deriveSecretKey("nip59:alice")));
const bob = unwrap(keypairFromSecret(deriveSecretKey("nip59:bob")));
const eph = unwrap(keypairFromSecret(deriveSecretKey("nip59:ephemeral")));
const template: EventTemplate = {
  kind: 14,
  created_at: 1735689600,
  tags: [["p", bob.publicKey]],
  content: "meet at 5?",
};
const fixed: GiftWrapInput = {
  template,
  senderSecretKey: alice.secretKey,
  recipientPubkey: bob.publicKey,
  ephemeralSecretKey: eph.secretKey,
  sealCreatedAt: 1735600000,
  wrapCreatedAt: 1735500000,
  sealNonce: new Uint8Array(32).fill(1),
  wrapNonce: new Uint8Array(32).fill(2),
  auxRand: new Uint8Array(32),
};
const code = (r: { ok: boolean; error?: { code: string } }): string =>
  r.ok ? "ok" : (r.error?.code ?? "");

describe("NIP-59 gift wrap", () => {
  const steps = unwrap(giftWrap(fixed));

  test("rumor has an id but no signature", () => {
    expect(steps.rumor).toEqual(createRumor(template, alice.publicKey));
    expect("sig" in steps.rumor).toBe(false);
    expect(steps.rumor.id).toBe(computeEventId(steps.rumor).id);
  });

  test("seal: kind 13, signed by the sender, no tags, encrypts the rumor", () => {
    expect(steps.seal.kind).toBe(SEAL_KIND);
    expect(steps.seal.pubkey).toBe(alice.publicKey);
    expect(steps.seal.tags).toEqual([]);
    expect(steps.seal.created_at).toBe(1735600000);
    expect(steps.seal.content).toBe(steps.sealEncryption.payload);
    expect(verifyEvent(steps.seal).ok).toBe(true);
  });

  test("wrap: kind 1059, signed by the ephemeral key, p-tags the recipient", () => {
    expect(steps.wrap.kind).toBe(GIFT_WRAP_KIND);
    expect(steps.wrap.pubkey).toBe(eph.publicKey);
    expect(steps.ephemeral).toEqual(eph);
    expect(steps.wrap.tags).toEqual([["p", bob.publicKey]]);
    expect(steps.wrap.content).toBe(steps.wrapEncryption.payload);
    expect(verifyEvent(steps.wrap).ok).toBe(true);
  });

  test("fully reproducible with fixed inputs", () => {
    expect(unwrap(giftWrap(fixed))).toEqual(steps);
  });

  test("recipient unwraps every layer", () => {
    expect(unwrapGiftWrap(steps.wrap, bob.secretKey)).toEqual({
      ok: true,
      value: { wrap: steps.wrap, seal: steps.seal, rumor: steps.rumor },
    });
  });

  test("interop with nostr-tools both ways", () => {
    const theirs = ntNip59.wrapEvent(
      { ...template, tags: [["p", bob.publicKey]] },
      alice.secretKey,
      bob.publicKey,
    );
    const peeled = unwrap(unwrapGiftWrap(theirs as unknown as NostrEvent, bob.secretKey));
    expect(peeled.rumor.content).toBe(template.content);
    expect(peeled.rumor.pubkey).toBe(alice.publicKey);
    expect(ntNip59.unwrapEvent(steps.wrap as never, bob.secretKey).content).toBe(template.content);
  });

  test("random defaults: fresh ephemeral key and past timestamps within two days", () => {
    const now = Math.floor(Date.now() / 1000);
    const r = unwrap(
      giftWrap({ template, senderSecretKey: alice.secretKeyHex, recipientPubkey: bob.publicKey }),
    );
    expect(r.ephemeral.publicKey).not.toBe(alice.publicKey);
    for (const t of [r.seal.created_at, r.wrap.created_at]) {
      expect(t).toBeLessThanOrEqual(now + 1);
      expect(t).toBeGreaterThan(now - 2 * 86400 - 1);
    }
    expect(randomizedTimestamp(1000000)).toBeLessThanOrEqual(1000000);
    expect(unwrap(unwrapGiftWrap(r.wrap, bob.secretKey)).rumor.content).toBe(template.content);
  });

  test("input errors", () => {
    expect(code(giftWrap({ ...fixed, senderSecretKey: "00" }))).toBe("invalid-length");
    expect(code(giftWrap({ ...fixed, ephemeralSecretKey: new Uint8Array(32) }))).toBe(
      "out-of-range",
    );
    expect(code(giftWrap({ ...fixed, recipientPubkey: "bad" }))).toBe("invalid-key");
    expect(code(giftWrap({ ...fixed, sealNonce: new Uint8Array(1) }))).toBe("invalid-length");
    expect(code(giftWrap({ ...fixed, wrapNonce: new Uint8Array(1) }))).toBe("invalid-length");
  });
});

/** Hand-builds a wrap around arbitrary seal JSON so each unwrap failure can be reached. */
const wrapAround = (sealJson: string): NostrEvent => {
  const ck = unwrap(nip44ConversationKey(eph.secretKey, bob.publicKey));
  const content = unwrap(nip44Encrypt(sealJson, ck)).payload;
  return unwrap(
    signEvent({ kind: 1059, created_at: 1, tags: [["p", bob.publicKey]], content }, eph.secretKey),
  ).event;
};
/** Seal signed by `signer` around arbitrary rumor JSON. */
const sealAround = (rumorJson: string, signer = alice, kind = 13): NostrEvent => {
  const ck = unwrap(nip44ConversationKey(signer.secretKey, bob.publicKey));
  const content = unwrap(nip44Encrypt(rumorJson, ck)).payload;
  return unwrap(signEvent({ kind, created_at: 1, tags: [], content }, signer.secretKey)).event;
};

describe("unwrap failures", () => {
  const good = unwrap(giftWrap(fixed));
  const rumor = createRumor(template, alice.publicKey);

  test.each<[string, () => NostrEvent, string]>([
    ["wrong kind", () => ({ ...good.wrap, kind: 1 }), "not-a-gift-wrap"],
    [
      "bad wrap signature",
      () => ({ ...good.wrap, content: `${good.wrap.content}x` }),
      "not-a-gift-wrap",
    ],
    [
      "not for me",
      () => unwrap(giftWrap({ ...fixed, recipientPubkey: alice.publicKey })).wrap,
      "decrypt-failed",
    ],
    ["seal not JSON", () => wrapAround("nope"), "invalid-seal"],
    ["seal not an event", () => wrapAround("{}"), "invalid-seal"],
    [
      "seal wrong kind",
      () => wrapAround(JSON.stringify(sealAround(JSON.stringify(rumor), alice, 1))),
      "invalid-seal",
    ],
    [
      "rumor undecryptable",
      () => wrapAround(JSON.stringify({ ...good.seal, ...resign("garbage") })),
      "decrypt-failed",
    ],
    ["rumor not JSON", () => wrapAround(JSON.stringify(sealAround("nope"))), "invalid-rumor"],
    ["rumor bad shape", () => wrapAround(JSON.stringify(sealAround("{}"))), "invalid-rumor"],
    [
      "rumor id mismatch",
      () => wrapAround(JSON.stringify(sealAround(JSON.stringify({ ...rumor, content: "x" })))),
      "invalid-rumor",
    ],
    [
      "impersonation",
      () => wrapAround(JSON.stringify(sealAround(JSON.stringify(rumor), bob))),
      "author-mismatch",
    ],
  ])("%s", (_name, build, expected) => {
    expect(code(unwrapGiftWrap(build(), bob.secretKey))).toBe(expected);
  });

  test("invalid recipient key", () => {
    expect(code(unwrapGiftWrap(good.wrap, "00"))).toBe("decrypt-failed");
  });
});

/** A seal by alice whose content is not a NIP-44 payload. */
const resign = (content: string): NostrEvent =>
  unwrap(signEvent({ kind: 13, created_at: 1, tags: [], content }, alice.secretKey)).event;
