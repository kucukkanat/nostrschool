import { describe, expect, test } from "bun:test";
import { getPersona } from "@nostrschool/fixtures";
import { getDictionary } from "@nostrschool/i18n";
import {
  createRumor,
  generateKeypair,
  type NostrEvent,
  nip44ConversationKey,
  nip44Encrypt,
  signEvent,
  unwrap,
  unwrapGiftWrap,
  verifyEvent,
} from "@nostrschool/protocol";
import {
  buildScenario,
  byteLength,
  cbcLength,
  detailParams,
  layerIds,
  leakCount,
  MAX_MESSAGE_LENGTH,
  nip44Bucket,
  paddingRow,
  peel,
  relayView,
  type Scenario,
  type ScenarioInput,
  type Scheme,
  shorten,
  timeShift,
  validateMessage,
} from "./logic.ts";
import { quizQuestions } from "./quiz.ts";
import { VIEWERS, viewerKey } from "./viewers.ts";

const alice = getPersona("alice");
const bob = getPersona("bob");
const carol = getPersona("carol");
const NOW = 1_735_689_600;
const fill = (n: number, len: number) => new Uint8Array(len).fill(n);

const input = (scheme: Scheme, message = "Meet me at 9 🥐"): ScenarioInput => ({
  scheme,
  message,
  sender: { secretKey: alice.secretKey, pubkey: alice.pubkey },
  recipient: { secretKey: bob.secretKey, pubkey: bob.pubkey },
  now: NOW,
  seed: {
    iv: fill(1, 16),
    nonce: fill(2, 32),
    ephemeralSecretKey: fill(3, 32),
    sealNonce: fill(4, 32),
    wrapNonce: fill(5, 32),
    sealCreatedAt: NOW - 3600,
    wrapCreatedAt: NOW - 7200,
    auxRand: fill(6, 32),
  },
});
const build = (scheme: Scheme, message?: string): Scenario =>
  unwrap(buildScenario(input(scheme, message)));

describe("validateMessage", () => {
  test("trims, rejects empty and over-long messages", () => {
    expect(validateMessage("  hi  ")).toEqual({ ok: true, value: "hi" });
    const empty = validateMessage("   ");
    expect(empty.ok ? "" : empty.error.code).toBe("empty-message");
    const long = validateMessage("x".repeat(MAX_MESSAGE_LENGTH + 1));
    expect(long.ok ? "" : long.error.code).toBe("message-too-long");
  });
});

describe("buildScenario", () => {
  test("NIP-04: signed kind 4 with p tag and AES-CBC payload", () => {
    const s = build("nip04");
    expect(s.scheme).toBe("nip04");
    expect(s.event.kind).toBe(4);
    expect(s.event.pubkey).toBe(alice.pubkey);
    expect(s.event.tags).toEqual([["p", bob.pubkey]]);
    expect(s.event.content).toContain("?iv=");
    expect(verifyEvent(s.event).ok).toBe(true);
  });
  test("NIP-44: same envelope, versioned base64 payload", () => {
    const s = build("nip44");
    expect(s.event.kind).toBe(4);
    expect(s.event.content.includes("?iv=")).toBe(false);
    expect(verifyEvent(s.event).ok).toBe(true);
  });
  test("NIP-17: kind 1059 wrap by a throwaway key that the protocol can unwrap", () => {
    const s = build("nip17");
    expect(s.event.kind).toBe(1059);
    expect(s.event.pubkey).not.toBe(alice.pubkey);
    expect(s.event.created_at).toBe(NOW - 7200);
    const opened = unwrap(unwrapGiftWrap(s.event, bob.secretKey));
    expect(opened.rumor.kind).toBe(14);
    expect(opened.rumor.content).toBe("Meet me at 9 🥐");
    expect(opened.seal.tags).toEqual([]);
  });
  test("random by default: two sends differ", () => {
    const { seed: _seed, ...noSeed } = input("nip17");
    const a = unwrap(buildScenario(noSeed));
    const b = unwrap(buildScenario(noSeed));
    expect(a.event.pubkey).not.toBe(b.event.pubkey);
    const c = unwrap(buildScenario({ ...noSeed, scheme: "nip04" }));
    const d = unwrap(buildScenario({ ...noSeed, scheme: "nip44" }));
    expect(c.event.content).not.toBe(d.event.content);
  });
  test("validation and crypto failures are typed errors", () => {
    const empty = buildScenario(input("nip04", " "));
    expect(empty.ok ? "" : empty.error.code).toBe("empty-message");
    for (const scheme of ["nip04", "nip44", "nip17"] as const) {
      const bad = buildScenario({
        ...input(scheme),
        recipient: { ...input(scheme).recipient, pubkey: "zz" },
      });
      expect(bad.ok ? "" : bad.error.code).toBe("invalid-key");
    }
  });
});

describe("relayView", () => {
  test("NIP-04 leaks sender, recipient, time, kind and size", () => {
    const facts = relayView(build("nip04"), input("nip04"));
    expect(facts.map((f) => [f.field, f.exposure])).toEqual([
      ["sender", "leaked"],
      ["recipient", "leaked"],
      ["time", "leaked"],
      ["kind", "leaked"],
      ["length", "leaked"],
      ["content", "hidden"],
    ]);
    expect(leakCount(facts)).toBe(5);
    const len = facts.find((f) => f.field === "length");
    expect(len?.shown).toBe(String(cbcLength(byteLength("Meet me at 9 🥐"))));
    expect(facts.map((f) => f.detail)).toContain("senderLeaked");
  });
  test("NIP-44 blurs size only", () => {
    const facts = relayView(build("nip44"), input("nip44"));
    expect(facts.find((f) => f.field === "length")).toMatchObject({
      exposure: "blurred",
      shown: "32",
    });
    expect(leakCount(facts)).toBe(4);
  });
  test("NIP-17 leaves only the recipient", () => {
    const s = build("nip17");
    const facts = relayView(s, input("nip17"));
    expect(leakCount(facts)).toBe(1);
    expect(facts.find((f) => f.field === "sender")).toMatchObject({
      exposure: "hidden",
      shown: s.event.pubkey,
      truth: alice.pubkey,
      detail: "senderHidden",
    });
    expect(facts.find((f) => f.field === "time")?.shown).toBe(String(NOW - 7200));
    expect(facts.find((f) => f.field === "kind")).toMatchObject({ shown: "1059", truth: "14" });
  });
  test("a wrap without p tag shows an empty recipient", () => {
    const s = build("nip04");
    const facts = relayView({ ...s, event: { ...s.event, tags: [] } }, input("nip04"));
    expect(facts.find((f) => f.field === "recipient")?.shown).toBe("");
  });
});

describe("detailParams", () => {
  const formatters = {
    nameOf: (pk: string) => (pk === alice.pubkey ? "Alice" : undefined),
    formatTime: (s: number) => `t${s}`,
  };
  test("names, shortened keys, time shift in hours", () => {
    const facts = relayView(build("nip17"), input("nip17"));
    const byField = (f: string) => {
      const found = facts.find((x) => x.field === f);
      if (found === undefined) throw new Error(f);
      return detailParams(found, formatters);
    };
    expect(byField("sender")["name"]).toBe("Alice");
    expect(byField("time")).toMatchObject({ time: `t${NOW - 7200}`, hours: 2 });
    expect(String(byField("content")["shown"])).toContain("…");
    expect(byField("recipient")["name"]).toBe(shorten(bob.pubkey));
    expect(byField("kind")).toMatchObject({ kind: "1059", time: "", hours: 0 });
  });
});

describe("peel", () => {
  test("layer ids per scheme", () => {
    expect(layerIds("nip17")).toEqual(["wrap", "seal", "rumor"]);
    expect(layerIds("nip04")).toEqual(["dm"]);
  });
  test("Bob peels NIP-17 wrap → seal → rumor", () => {
    const s = build("nip17");
    const seal = unwrap(peel(s, 0, bob.secretKey));
    expect(seal.layer).toBe("seal");
    if (seal.layer === "seal") expect(seal.event.pubkey).toBe(alice.pubkey);
    const rumor = unwrap(peel(s, 1, bob.secretKey));
    expect(rumor).toMatchObject({ layer: "rumor", authorVerified: true });
    if (rumor.layer === "rumor") expect(rumor.event.content).toBe("Meet me at 9 🥐");
    const done = peel(s, 2, bob.secretKey);
    expect(done.ok ? "" : done.error.code).toBe("nothing-left");
  });
  test("Bob reads NIP-04 and NIP-44 in one step", () => {
    for (const scheme of ["nip04", "nip44"] as const) {
      const s = build(scheme);
      expect(unwrap(peel(s, 0, bob.secretKey))).toEqual({
        layer: "message",
        text: "Meet me at 9 🥐",
      });
      const more = peel(s, 1, bob.secretKey);
      expect(more.ok ? "" : more.error.code).toBe("nothing-left");
    }
  });
  test("the relay has no key; Carol's key fails with real crypto errors", () => {
    for (const scheme of ["nip04", "nip44", "nip17"] as const) {
      const s = build(scheme);
      const relay = peel(s, 0, viewerKey("relay"));
      expect(relay.ok ? "" : relay.error.code).toBe("no-key");
    }
    const n44 = peel(build("nip44"), 0, carol.secretKey);
    expect(n44.ok ? "" : n44.error.code).toBe("decrypt-failed");
    const n17 = peel(build("nip17"), 0, carol.secretKey);
    expect(n17.ok ? "" : n17.error.code).toBe("decrypt-failed");
    const sealAsCarol = peel(build("nip17"), 1, carol.secretKey);
    expect(sealAsCarol.ok ? "" : sealAsCarol.error.code).toBe("decrypt-failed");
    // NIP-04 has no MAC: Carol gets either a padding error or garbage, never the real text.
    const n04 = peel(build("nip04"), 0, carol.secretKey);
    if (n04.ok) expect(n04.value).not.toEqual({ layer: "message", text: "Meet me at 9 🥐" });
    else expect(n04.error.code).toBe("decrypt-failed");
  });
  test("an unusable author pubkey is a decrypt failure", () => {
    const s = build("nip44");
    const r = peel({ ...s, event: { ...s.event, pubkey: "zz" } }, 0, bob.secretKey);
    expect(r.ok ? "" : r.error.code).toBe("decrypt-failed");
  });

  /** A wrap whose inner plaintext we choose, to exercise the validation paths with real crypto. */
  const wrapOf = (plaintext: string): NostrEvent => {
    const eph = generateKeypair();
    const key = unwrap(nip44ConversationKey(eph.secretKey, bob.pubkey));
    const payload = unwrap(nip44Encrypt(plaintext, key)).payload;
    return unwrap(
      signEvent(
        { kind: 1059, created_at: NOW, tags: [["p", bob.pubkey]], content: payload },
        eph.secretKey,
      ),
    ).event;
  };
  test("garbage inside a wrap is an invalid layer", () => {
    const s = build("nip17");
    for (const inner of ["not json", '{"kind":13}']) {
      const r = peel({ ...s, event: wrapOf(inner) }, 0, bob.secretKey);
      expect(r.ok ? "" : r.error.code).toBe("invalid-layer");
    }
  });
  test("a seal that lies about the rumor author is rejected", () => {
    const s = build("nip17");
    if (s.scheme !== "nip17") throw new Error("expected nip17");
    const rumor = createRumor(
      { kind: 14, created_at: NOW, tags: [], content: "I am Alice" },
      alice.pubkey,
    );
    const key = unwrap(nip44ConversationKey(carol.secretKey, bob.pubkey));
    const content = unwrap(nip44Encrypt(JSON.stringify(rumor), key)).payload;
    const forged = unwrap(
      signEvent({ kind: 13, created_at: NOW, tags: [], content }, carol.secretKey),
    ).event;
    const r = peel({ ...s, steps: { ...s.steps, seal: forged } }, 1, bob.secretKey);
    expect(r.ok ? "" : r.error.code).toBe("author-mismatch");
    const notRumor = unwrap(nip44Encrypt("[]", key)).payload;
    const badSeal = unwrap(
      signEvent({ kind: 13, created_at: NOW, tags: [], content: notRumor }, carol.secretKey),
    ).event;
    const r2 = peel({ ...s, steps: { ...s.steps, seal: badSeal } }, 1, bob.secretKey);
    expect(r2.ok ? "" : r2.error.code).toBe("invalid-layer");
  });
});

describe("helpers", () => {
  test("shorten keeps short strings", () => {
    expect(shorten("abc")).toBe("abc");
    expect(shorten("0123456789abcdefXYZ", 4)).toBe("0123…fXYZ");
  });
  test("timeShift", () => {
    expect(timeShift(100, 3700)).toBe(3600);
  });
  test("cbc and NIP-44 padding", () => {
    expect(cbcLength(0)).toBe(16);
    expect(cbcLength(15)).toBe(16);
    expect(cbcLength(16)).toBe(32);
    expect(paddingRow(3)).toEqual({ bytes: 3, nip04: 16, nip44: 32 });
    expect(paddingRow(0).nip44).toBe(32);
    expect(paddingRow(33).nip44).toBe(64);
    expect(nip44Bucket(3)).toEqual({ min: 1, max: 32 });
    expect(nip44Bucket(40)).toEqual({ min: 33, max: 64 });
  });
  test("viewers", () => {
    expect(VIEWERS).toEqual(["bob", "carol", "relay"]);
    expect(viewerKey("bob")).toEqual(bob.secretKey);
    expect(viewerKey("relay")).toBeUndefined();
  });
  test("quiz questions mark exactly one correct option each", () => {
    const qs = quizQuestions(getDictionary("en").chapters.ch08.quiz);
    expect(qs).toHaveLength(3);
    for (const q of qs) {
      expect(q.options.filter((o) => o.correct)).toHaveLength(1);
      expect(q.options.every((o) => o.label.length > 0 && (o.explanation ?? "").length > 0)).toBe(
        true,
      );
    }
    // Varied positions so the quiz can't be passed by always picking the same letter.
    expect(qs.map((q) => q.options.find((o) => o.correct)?.id)).toEqual(["b", "c", "a"]);
    const es = quizQuestions(getDictionary("es").chapters.ch08.quiz);
    expect(es.map((q) => q.options.find((o) => o.correct)?.explanation)).toEqual([
      getDictionary("es").chapters.ch08.quiz.q1.bExplain,
      getDictionary("es").chapters.ch08.quiz.q2.cExplain,
      getDictionary("es").chapters.ch08.quiz.q3.aExplain,
    ]);
  });
});
