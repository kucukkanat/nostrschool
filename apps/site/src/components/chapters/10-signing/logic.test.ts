import { describe, expect, test } from "bun:test";
import { getPersona } from "@nostrschool/fixtures";
import {
  encodeNsec,
  generateKeypair,
  type NostrEvent,
  unwrap,
  verifyEvent,
} from "@nostrschool/protocol";
import {
  DEMO_DOCUMENTS,
  fetchDemoDocument,
  listedPubkey,
  NIP05_SCENARIOS,
  verifyNip05Flow,
} from "./nip05.ts";
import {
  answerRequest,
  buildBunkerUrl,
  NIP46_KIND,
  openRpc,
  parseBunkerUrl,
  parseNip46Request,
  parseNip46Response,
  runNip46Session,
  sealRpc,
} from "./nip46.ts";
import {
  DEMO_RELAY,
  DEMO_SECRET,
  decide,
  demoKeys,
  initialState,
  leaksSecret,
  makeTemplate,
  requestSignature,
  SIGNER_MODES,
} from "./playground.ts";
import { NIP07_IDS, NIP46_IDS, nip07Sequence, nip46Sequence } from "./sequences.ts";

const keys = unwrap(demoKeys());
const template = makeTemplate("gm from a demo key", 1735689600);
const alice = getPersona("alice");

describe("demoKeys", () => {
  test("derives three distinct, deterministic keypairs", () => {
    const again = unwrap(demoKeys());
    expect(again.user.publicKey).toBe(keys.user.publicKey);
    expect(new Set([keys.user.publicKey, keys.client.publicKey, keys.bunker.publicKey]).size).toBe(
      3,
    );
  });
});

describe("NIP-46 messages", () => {
  test("parses requests and rejects malformed ones", () => {
    expect(parseNip46Request({ id: "1", method: "ping", params: [] }).ok).toBe(true);
    expect(parseNip46Request({ id: "1", method: "fly", params: [] }).ok).toBe(false);
    expect(parseNip46Request({ id: 1, method: "ping", params: [] }).ok).toBe(false);
    expect(parseNip46Request(null).ok).toBe(false);
    expect(parseNip46Request({ id: "1", method: "ping", params: [1] }).ok).toBe(false);
    expect(parseNip46Request({ id: "1", method: "ping" }).ok).toBe(false);
  });
  test("parses responses with and without error", () => {
    expect(unwrap(parseNip46Response({ id: "1", result: "pong" }))).toEqual({
      id: "1",
      result: "pong",
    });
    expect(unwrap(parseNip46Response({ id: "1", result: "", error: "no" })).error).toBe("no");
    expect(parseNip46Response({ id: "1", result: "", error: 3 }).ok).toBe(false);
    expect(parseNip46Response({ id: "1" }).ok).toBe(false);
    expect(parseNip46Response([]).ok).toBe(false);
  });
});

describe("bunker URLs", () => {
  test("round-trips through build and parse", () => {
    const p = {
      pubkey: keys.bunker.publicKey,
      relays: [DEMO_RELAY, "wss://b.example"],
      secret: "s3",
    };
    expect(unwrap(parseBunkerUrl(buildBunkerUrl(p)))).toEqual(p);
    const noSecret = { pubkey: keys.bunker.publicKey, relays: [DEMO_RELAY] };
    expect(unwrap(parseBunkerUrl(buildBunkerUrl(noSecret)))).toEqual(noSecret);
  });
  test("rejects bad pubkeys and missing relays", () => {
    expect(parseBunkerUrl("bunker://abc?relay=wss://x").ok).toBe(false);
    expect(parseBunkerUrl("nostrconnect://x").ok).toBe(false);
    expect(parseBunkerUrl(`bunker://${keys.bunker.publicKey}`).ok).toBe(false);
    expect(parseBunkerUrl(`bunker://${keys.bunker.publicKey}?relay=https://x`).ok).toBe(false);
    expect(parseBunkerUrl(`bunker://${"f".repeat(64)}?relay=wss://x`).ok).toBe(false);
  });
});

describe("sealRpc / openRpc", () => {
  const req = { id: "p", method: "ping", params: [] } as const;
  test("seals a kind 24133 event the recipient can open and nobody else can", () => {
    const sealed = unwrap(sealRpc(req, keys.client, keys.bunker.publicKey, 1));
    expect(sealed.event.kind).toBe(NIP46_KIND);
    expect(sealed.event.tags).toEqual([["p", keys.bunker.publicKey]]);
    expect(sealed.event.content).not.toContain("ping");
    expect(verifyEvent(sealed.event).ok).toBe(true);
    expect(unwrap(openRpc(sealed.event, keys.bunker))).toEqual(req);
    const stranger = openRpc(sealed.event, generateKeypair());
    expect(stranger.ok ? "ok" : stranger.error.code).toBe("crypto");
  });
  test("reports invalid keys", () => {
    const r = sealRpc(req, keys.client, "00".repeat(32), 1);
    expect(r.ok ? "ok" : r.error.code).toBe("invalid-key");
  });
  test("rejects wrong kinds, tampered events and non-JSON content", () => {
    const sealed = unwrap(sealRpc(req, keys.client, keys.bunker.publicKey, 1)).event;
    const code = (e: NostrEvent): string => {
      const r = openRpc(e, keys.bunker);
      return r.ok ? "ok" : r.error.code;
    };
    expect(code({ ...sealed, kind: 1 })).toBe("bad-event");
    expect(code({ ...sealed, content: `${sealed.content}x` })).toBe("bad-event");
    expect(code({ ...sealed, pubkey: "00".repeat(32) })).toBe("bad-event");
  });
});

describe("answerRequest (the bunker)", () => {
  const policy = { user: keys.user, secret: "s", approve: true };
  const ask = (method: Parameters<typeof answerRequest>[0]["method"], params: string[] = []) =>
    answerRequest({ id: "x", method, params }, policy);
  test("answers each supported method", () => {
    expect(ask("connect", [keys.bunker.publicKey, "s"]).result).toBe("ack");
    expect(ask("connect", [keys.bunker.publicKey, "wrong"]).error).toBe("invalid secret");
    expect(
      answerRequest({ id: "x", method: "connect", params: [] }, { user: keys.user, approve: true })
        .result,
    ).toBe("ack");
    expect(ask("ping").result).toBe("pong");
    expect(ask("get_public_key").result).toBe(keys.user.publicKey);
    expect(ask("logout").error).toContain("not supported");
  });
  test("signs templates with the user key and rejects junk", () => {
    const signed = JSON.parse(ask("sign_event", [JSON.stringify(template)]).result) as NostrEvent;
    expect(signed.pubkey).toBe(keys.user.publicKey);
    expect(verifyEvent(signed).ok).toBe(true);
    expect(ask("sign_event", ["{nope"]).error).toBe("invalid event template");
    expect(ask("sign_event", [JSON.stringify({ ...template, tags: [[1]] })]).error).toBe(
      "invalid event template",
    );
    expect(ask("sign_event").error).toBe("invalid event template");
  });
  test("refuses everything when the user rejects", () => {
    expect(
      answerRequest({ id: "x", method: "ping", params: [] }, { ...policy, approve: false }).error,
    ).toContain("rejected");
  });
});

describe("runNip46Session", () => {
  const input = {
    client: keys.client,
    bunker: keys.bunker,
    user: keys.user,
    relay: DEMO_RELAY,
    secret: DEMO_SECRET,
    template,
    approve: true,
  };
  test("approved: six encrypted hops and a valid signed note", () => {
    const s = unwrap(runNip46Session(input));
    expect(s.hops.map((h) => h.id)).toEqual([
      "connect-req",
      "connect-res",
      "pubkey-req",
      "pubkey-res",
      "sign-req",
      "sign-res",
    ]);
    // The app learns the user key from get_public_key, not from the bunker URL.
    expect(s.userPubkey).toBe(keys.user.publicKey);
    expect(s.userPubkey).not.toBe(keys.bunker.publicKey);
    expect(s.event?.pubkey).toBe(keys.user.publicKey);
    expect(s.event && verifyEvent(s.event).ok).toBe(true);
    expect(s.bunkerUrl.startsWith(`bunker://${keys.bunker.publicKey}`)).toBe(true);
    for (const h of s.hops) expect(h.sealed.event.content).not.toContain(keys.user.secretKeyHex);
  });
  test("rejected: no event, an error instead", () => {
    const s = unwrap(runNip46Session({ ...input, approve: false }));
    expect(s.event).toBeUndefined();
    expect(s.error).toContain("rejected");
  });
  test("propagates key errors", () => {
    const bad = { ...keys.bunker, publicKey: "00".repeat(32) };
    expect(runNip46Session({ ...input, bunker: bad }).ok).toBe(false);
  });
});

describe("playground state machine", () => {
  test("paste mode signs at once and leaks the nsec", () => {
    const s = unwrap(requestSignature(initialState("paste"), keys, template));
    expect(s.phase).toBe("signed");
    expect(s.memory[0]?.value).toBe(unwrap(encodeNsec(keys.user.secretKey)));
    expect(leaksSecret(s, keys.user)).toBe(true);
    expect(unwrap(decide(s, keys, true))).toBe(s);
  });

  for (const mode of ["nip07", "nip46"] as const) {
    test(`${mode}: approve signs without the app ever holding the key`, () => {
      const asked = unwrap(requestSignature(initialState(mode), keys, template));
      expect(asked.phase).toBe("awaiting");
      const done = unwrap(decide(asked, keys, true));
      expect(done.phase).toBe("signed");
      expect(done.event?.pubkey).toBe(keys.user.publicKey);
      expect(done.event && verifyEvent(done.event).ok).toBe(true);
      expect(done.wire.at(-1)?.key).toBe("publish");
      expect(leaksSecret(done, keys.user)).toBe(false);
    });
    test(`${mode}: reject leaves no signed event`, () => {
      const asked = unwrap(requestSignature(initialState(mode), keys, template));
      const done = unwrap(decide(asked, keys, false));
      expect(done.phase).toBe("rejected");
      expect(done.event).toBeUndefined();
      expect(done.memory.at(-1)?.key).toBe("rejection");
    });
  }

  test("nip46 wire carries only encrypted kind 24133 events before publishing", () => {
    const done = unwrap(
      decide(unwrap(requestSignature(initialState("nip46"), keys, template)), keys, true),
    );
    expect(done.wire.map((w) => w.key)).toEqual([
      "nip46ConnectReq",
      "nip46ConnectRes",
      "nip46PubkeyReq",
      "nip46PubkeyRes",
      "nip46SignReq",
      "nip46SignRes",
      "publish",
    ]);
    expect(done.wire.slice(0, 6).every((w) => (w.payload as NostrEvent).kind === NIP46_KIND)).toBe(
      true,
    );
  });

  test("propagates errors from broken keys", () => {
    const broken = { ...keys, bunker: { ...keys.bunker, publicKey: "00".repeat(32) } };
    const asked = unwrap(requestSignature(initialState("nip46"), broken, template));
    expect(decide(asked, broken, true).ok).toBe(false);
  });

  test("covers every mode", () => {
    expect(SIGNER_MODES).toEqual(["paste", "nip07", "nip46"]);
  });
});

describe("sequences", () => {
  test("NIP-07 sequence carries a real signed event", () => {
    const seq = unwrap(nip07Sequence(keys, template));
    expect(seq.map((m) => m.id)).toEqual([...NIP07_IDS]);
    const signed = seq.find((m) => m.id === "signed")?.payload as NostrEvent;
    expect(verifyEvent(signed).ok).toBe(true);
  });
  test("NIP-46 sequence shows what the relay sees vs what the bunker decrypts", () => {
    const seq = unwrap(nip46Sequence(keys, template));
    expect(seq.map((m) => m.id)).toEqual([...NIP46_IDS]);
    const fwd = seq.find((m) => m.id === "signFwd")?.payload as {
      relaySees: NostrEvent;
      recipientDecrypts: { method: string };
    };
    expect(fwd.relaySees.kind).toBe(NIP46_KIND);
    expect(fwd.recipientDecrypts.method).toBe("sign_event");
  });
  test("propagate errors", () => {
    const broken = { ...keys, bunker: { ...keys.bunker, publicKey: "00".repeat(32) } };
    expect(nip46Sequence(broken, template).ok).toBe(false);
    const badUser = { ...keys, user: { ...keys.user, secretKey: new Uint8Array(32) } };
    expect(nip07Sequence(badUser, template).ok).toBe(false);
  });
});

describe("NIP-05 flow", () => {
  const code = (id: string): string => {
    const f = verifyNip05Flow(id, alice.pubkey);
    return f.outcome.ok ? "ok" : f.outcome.error.code;
  };
  test("each scenario lands where the chapter says", () => {
    const expected = {
      match: "ok",
      root: "ok",
      impostor: "pubkey-mismatch",
      missing: "name-not-found",
      nodomain: "fetch-failed",
      garbage: "invalid-format",
    };
    for (const s of NIP05_SCENARIOS) expect(code(s.identifier)).toBe(expected[s.id]);
  });
  test("reports how far it got and the advertised relays", () => {
    expect(verifyNip05Flow("nope!", alice.pubkey).reached).toBe(0);
    expect(verifyNip05Flow("x@nowhere.example", alice.pubkey).reached).toBe(2);
    const full = verifyNip05Flow("ALICE@alpha.example", alice.pubkey);
    expect(full.reached).toBe(3);
    expect(full.address?.display).toBe("alice@alpha.example");
    expect(full.outcome.ok && full.outcome.value.relays.length).toBe(2);
  });
  test("demo internet serves documents only for known domains", () => {
    expect(fetchDemoDocument("alpha.example").ok).toBe(true);
    expect(fetchDemoDocument("evil.example").ok).toBe(false);
    expect(Object.keys(DEMO_DOCUMENTS)).toEqual(["alpha.example", "beta.example"]);
  });
});

describe("listedPubkey", () => {
  test("reads names[name] defensively", () => {
    expect(listedPubkey(DEMO_DOCUMENTS["alpha.example"], "alice")).toBe(alice.pubkey);
    expect(listedPubkey(DEMO_DOCUMENTS["alpha.example"], "zoe")).toBeUndefined();
    expect(listedPubkey({ names: { a: 1 } }, "a")).toBeUndefined();
    expect(listedPubkey({ names: null }, "a")).toBeUndefined();
    expect(listedPubkey(null, "a")).toBeUndefined();
    expect(listedPubkey("x", "a")).toBeUndefined();
  });
});
