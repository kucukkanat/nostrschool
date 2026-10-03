// Owner: spec author r4 (NIPs 60–79). Spec-specific checks on top of specs.test.ts and
// examples.test.ts: every example is clean (no errors AND no warnings), still validates once
// signed by its persona, embedded crypto (NIP-44 payloads, signed events, Negentropy messages)
// is real, and deliberately broken values produce the expected diagnostics.
import { describe, expect, test } from "bun:test";
import {
  bytesToHex,
  deriveSecretKey,
  type EventTemplate,
  getPublicKey,
  hexToBytes,
  nip44ConversationKey,
  nip44Decrypt,
  sha256,
  signEvent,
  type Tag,
  verifyEvent,
} from "@nostrschool/protocol";
import { defaultPartValue } from "../build.ts";
import type {
  ContentSpec,
  EventShape,
  JsonValue,
  NipSpec,
  SpecPart,
  SpecPartKey,
} from "../spec.ts";
import { findSpecPart, specParts } from "../spec.ts";
import { type ValidationSeverity, validateAgainstSpec, validateSchema } from "../validate.ts";
import { NIP_SPECS } from "./index.ts";
import { NIP72_BOB_POST } from "./nip-72.ts";
import {
  NEG_MSG_CLIENT_IDS,
  NEG_MSG_RELAY_IDS,
  NEG_OPEN_EMPTY,
  NEG_OPEN_FINGERPRINT,
} from "./nip-77.ts";

const R4 = [
  "60",
  "61",
  "62",
  "64",
  "65",
  "66",
  "67",
  "68",
  "69",
  "70",
  "71",
  "72",
  "73",
  "75",
  "77",
  "78",
] as const;
const FIXTURE_NOW = 1735689600;

const PERSONA_PUBKEYS = {
  alice: "e550c6e92808f358382b7b8c14345344f5ef9a299529834d1c26d57b6ace44cc",
  bob: "a73883912a48c3551c1548fd454876d577126a61c76b5486c807bfec5869e183",
  carol: "9445888d3235f73f8b627df1fb1d498f2eb3fa76337679c1176965a73d3b68b4",
  dave: "1c028b39e7f3228444b3261e4b718efa92a91470086b44c9a72ef5357e970148",
  erin: "c71750007e42443e5ca8c1ea00babed4e8c78a9cb45dd6db3733d918e0b55deb",
  frank: "922e43b50aec16ad1e9d1ec6854c058816d28b944ae2fe9bdce3d9241bfaafb8",
  grace: "5f69e52aeb38975e54cb99428da837124166abb4198c1128c54491be73d23812",
} as const;
const PUBKEY_OF: ReadonlyMap<string, string> = new Map(Object.entries(PERSONA_PUBKEYS));
/** Same derivation as @nostrschool/fixtures (not a dependency of this package). */
const personaKey = (persona: string): Uint8Array =>
  deriveSecretKey(`nostrschool:persona:${persona}`);

const spec = (id: string): NipSpec => {
  const s = NIP_SPECS[id];
  if (s === undefined) throw new Error(`no spec for NIP-${id}`);
  return s;
};
const shapesOf = (s: NipSpec): { readonly [id: string]: EventShape } =>
  Object.fromEntries((s.events ?? []).map((e) => [e.id, e]));
const partOf = (s: NipSpec, key: SpecPartKey): SpecPart => {
  const p = findSpecPart(s, key);
  if (p === undefined) throw new Error(`NIP-${s.nip}: no part ${key.kind}:${key.id}`);
  return p;
};
const shapeOf = (nip: string, id: string): EventShape => {
  const p = partOf(spec(nip), { kind: "event", id });
  if (p.kind !== "event") throw new Error(`${id} is not an event`);
  return p.part;
};
const exampleIds = (p: SpecPart): readonly string[] =>
  p.part.examples.map((e: { readonly id: string }) => e.id);
const value = (p: SpecPart, exampleId?: string): JsonValue =>
  defaultPartValue(p, {
    createdAt: FIXTURE_NOW,
    ...(exampleId === undefined ? {} : { exampleId }),
  });

const ev = (id: string): SpecPartKey => ({ kind: "event", id });
const msg = (id: string): SpecPartKey => ({ kind: "message", id });

const codes = (nip: string, key: SpecPartKey, v: unknown, severity: ValidationSeverity = "error") =>
  validateAgainstSpec(v, partOf(spec(nip), key), { shapes: shapesOf(spec(nip)) })
    .issues.filter((i) => i.severity === severity)
    .map((i) => i.code);

// ── Value surgery for broken variants (pure; examples are never mutated) ───────────────────────

type Ev = EventTemplate;
const example = (nip: string, id: string, exampleId?: string): Ev =>
  value(partOf(spec(nip), ev(id)), exampleId) as unknown as Ev;
const setTag = (e: Ev, i: number, tag: Tag): Ev => ({
  ...e,
  tags: e.tags.map((t, k) => (k === i ? tag : t)),
});
const dropTag = (e: Ev, name: string): Ev => ({ ...e, tags: e.tags.filter((t) => t[0] !== name) });
const addTag = (e: Ev, tag: Tag): Ev => ({ ...e, tags: [...e.tags, tag] });
const message = (nip: string, id: string, exampleId?: string): readonly JsonValue[] =>
  value(partOf(spec(nip), msg(id)), exampleId) as readonly JsonValue[];

// ── Every example is clean ─────────────────────────────────────────────────────────────────────

describe("r4 examples are clean", () => {
  test("fixture persona keys match the pubkeys used in the specs", () => {
    for (const [persona, pubkey] of Object.entries(PERSONA_PUBKEYS)) {
      const derived = getPublicKey(personaKey(persona));
      expect(derived.ok && derived.value).toBe(pubkey);
    }
  });

  for (const nip of R4)
    test(`NIP-${nip}: no errors or warnings in any example`, () => {
      const s = spec(nip);
      expect(s.todo).toBeUndefined();
      for (const p of specParts(s)) {
        expect(exampleIds(p).length, `${p.kind}:${p.part.id}`).toBeGreaterThan(0);
        for (const id of exampleIds(p)) {
          const bad = validateAgainstSpec(value(p, id), p, { shapes: shapesOf(s) })
            .issues.filter((i) => i.severity !== "info")
            .map((i) => `${i.severity} ${i.code} ${JSON.stringify(i.path)}`);
          expect(bad, `${p.kind}:${p.part.id} "${id}"`).toEqual([]);
        }
      }
    });

  for (const nip of R4)
    test(`NIP-${nip}: event examples validate once signed by their persona`, () => {
      const s = spec(nip);
      for (const shape of s.events ?? [])
        for (const x of shape.examples) {
          const template = value({ kind: "event", part: shape }, x.id) as unknown as Ev;
          const signed = signEvent(template, personaKey(x.signer ?? "alice"));
          expect(signed.ok).toBe(true);
          if (!signed.ok) continue;
          const issues = validateAgainstSpec(
            signed.value.event,
            { kind: "event", part: shape },
            { shapes: shapesOf(s) },
          ).issues.filter((i) => i.severity !== "info");
          expect(issues, `${shape.id} "${x.id}"`).toEqual([]);
        }
    });

  test("every r4 spec explains itself in 3–6 steps and lists related NIPs", () => {
    for (const nip of R4) {
      const s = spec(nip);
      expect(s.howItWorks.length, `NIP-${nip}`).toBeGreaterThanOrEqual(3);
      expect(s.howItWorks.length, `NIP-${nip}`).toBeLessThanOrEqual(6);
      expect(s.related.length, `NIP-${nip}`).toBeGreaterThan(0);
    }
  });
});

// ── Unrecommended NIP-72 points at NIP-29 ──────────────────────────────────────────────────────

describe("NIP-72 (unrecommended)", () => {
  test("is replaced by NIP-29 and says so first", () => {
    const s = spec("72");
    expect(s.related).toContainEqual(
      expect.objectContaining({ nip: "29", relation: "replaced-by" }),
    );
    expect(s.howItWorks[0]?.id).toBe("unrecommended");
  });

  test("the approval embeds Bob's real signed post", () => {
    expect(
      verifyEvent({ ...NIP72_BOB_POST, tags: NIP72_BOB_POST.tags.map((t) => [...t]) }).ok,
    ).toBe(true);
    expect(NIP72_BOB_POST.pubkey).toBe(PERSONA_PUBKEYS.bob);
  });

  const approval = example("72", "approval");
  test("a tampered embedded post and a missing community are errors", () => {
    const tampered = JSON.stringify({ ...NIP72_BOB_POST, content: "edited after approval" });
    expect(codes("72", ev("approval"), { ...approval, content: tampered })).toContain(
      "id-mismatch",
    );
    expect(codes("72", ev("approval"), { ...approval, content: "not json" })).toContain(
      "invalid-json-string",
    );
    expect(codes("72", ev("approval"), dropTag(approval, "a"))).toContain("missing-tag");
  });

  test("a post whose root is not a community is rejected", () => {
    const post = example("72", "post", "top-level");
    const notCommunity = `30023:${PERSONA_PUBKEYS.carol}:film-photography`;
    expect(codes("72", ev("post"), setTag(post, 0, ["A", notCommunity]))).toContain(
      "kind-not-allowed",
    );
  });

  test("legacy kind 1 posts carry only a lowercase a tag; kind 1111 still needs A", () => {
    const legacy = example("72", "legacy-post");
    expect(codes("72", ev("legacy-post"), legacy)).toEqual([]);
    // Still valid, but the editor is told it is the old format and what replaces it.
    const info = validateAgainstSpec(legacy, partOf(spec("72"), ev("legacy-post")), {
      shapes: shapesOf(spec("72")),
    }).issues.find((i) => i.code === "deprecated");
    expect(info).toEqual({
      severity: "info",
      code: "deprecated",
      path: [],
      params: { replacedBy: "post" },
      explain: "legacy.deprecated",
    });
    expect(codes("72", ev("post"), example("72", "post", "top-level"), "info")).not.toContain(
      "deprecated",
    );
    expect(codes("72", ev("legacy-post"), dropTag(legacy, "a"))).toContain("missing-tag");
    const post = example("72", "post", "top-level");
    expect(codes("72", ev("post"), { ...post, kind: 1 })).toContain("wrong-kind");
  });
});

// ── NIP-60 / NIP-61: the ciphertexts decrypt to plaintexts that match their own schema ─────────

const decryptSelf = (persona: string, payload: string): string => {
  const sk = personaKey(persona);
  const pub = PUBKEY_OF.get(persona) ?? "";
  const ck = nip44ConversationKey(sk, pub);
  if (!ck.ok) throw new Error(ck.error.message);
  const pt = nip44Decrypt(payload, ck.value);
  if (!pt.ok) throw new Error(pt.error.message);
  return pt.value.plaintext;
};

const plaintextSchemaIssues = (content: ContentSpec, plaintext: string) => {
  if (content.format !== "encrypted" || content.plaintext.format !== "json")
    throw new Error("expected encrypted JSON content");
  return validateSchema(JSON.parse(plaintext), content.plaintext.schema).filter(
    (i) => i.severity !== "info",
  );
};

describe("NIP-60 / NIP-61 encrypted payloads", () => {
  test("every encrypted example decrypts with its signer's own key", () => {
    for (const nip of ["60", "61"])
      for (const shape of spec(nip).events ?? [])
        if (shape.content.format === "encrypted")
          for (const x of shape.examples)
            expect(
              () => decryptSelf(x.signer ?? "alice", x.template.content),
              `${shape.id} ${x.id}`,
            ).not.toThrow();
  });

  test("wallet, token and history plaintexts match their schemas", () => {
    for (const id of ["wallet", "token", "history"]) {
      const shape = shapeOf("60", id);
      for (const x of shape.examples) {
        const plaintext = decryptSelf("alice", x.template.content);
        expect(plaintextSchemaIssues(shape.content, plaintext), `${id} ${x.id}`).toEqual([]);
      }
    }
  });

  test("the decrypted values tell the story", () => {
    const wallet = JSON.parse(decryptSelf("alice", example("60", "wallet").content));
    expect(wallet.filter((p: string[]) => p[0] === "mint").length).toBe(2);
    const rolled = JSON.parse(decryptSelf("alice", example("60", "token", "rolled-over").content));
    expect(rolled.del).toEqual([example("60", "token-deletion").tags[0]?.[1]]);
    const history = JSON.parse(decryptSelf("alice", example("60", "history").content));
    expect(history.slice(0, 2)).toEqual([
      ["direction", "out"],
      ["amount", "4"],
    ]);
    expect(decryptSelf("alice", example("60", "quote").content)).toMatch(/^[0-9a-f-]{36}$/);
    const redeem = JSON.parse(decryptSelf("bob", example("61", "redemption").content));
    expect(redeem[1]).toEqual(["amount", "21"]);
  });

  test("a broken plaintext is caught by the schema", () => {
    const content = shapeOf("60", "token").content;
    const bad = JSON.stringify({ mint: "not a url", proofs: [{ id: "x", amount: 0 }] });
    const found = plaintextSchemaIssues(content, bad).map((i) => i.code);
    expect(found).toEqual(expect.arrayContaining(["invalid-url", "out-of-range", "missing-field"]));
  });

  test("plain text where ciphertext belongs, and a deletion without k=7375", () => {
    const wallet = example("60", "wallet");
    expect(codes("60", ev("wallet"), { ...wallet, content: '[["mint","https://x"]]' })).toContain(
      "content-not-encrypted",
    );
    const deletion = example("60", "token-deletion");
    expect(codes("60", ev("token-deletion"), dropTag(deletion, "k"))).toContain("missing-tag");
    expect(codes("60", ev("token-deletion"), setTag(deletion, 1, ["k", "1"]))).toContain(
      "kind-not-allowed",
    );
  });

  test("NIP-61: nutzap proofs, mint and recipient are checked", () => {
    const nutzap = example("61", "nutzap", "zap-note");
    expect(codes("61", ev("nutzap"), setTag(nutzap, 0, ["proof", "{not json"]))).toContain(
      "invalid-json-string",
    );
    expect(codes("61", ev("nutzap"), setTag(nutzap, 0, ["proof", '{"amount":1}']))).toContain(
      "missing-field",
    );
    expect(codes("61", ev("nutzap"), dropTag(nutzap, "u"))).toContain("missing-tag");
    expect(codes("61", ev("nutzap"), setTag(nutzap, 7, ["p", "bob"]))).toContain("invalid-pubkey");
    const info = example("61", "nutzap-info");
    expect(codes("61", ev("nutzap-info"), setTag(info, 3, ["pubkey", "npub1bob"]))).toContain(
      "pattern-mismatch",
    );
  });
});

// ── NIP-77: the hex messages are real Negentropy V1 ────────────────────────────────────────────

describe("NIP-77 negentropy messages", () => {
  // The four newest fixture kind-1 notes, ascending by (created_at, id); the client has the first 3.
  const IDS = [
    "6f762f141286ff49dc17f167204069df048758cf0a4cd83dae2455f277241253",
    "814d487f9a9591bde04009eff371facb26e82f3a41cec1bcdcdab310075053be",
    "6639e66fdcb9537f1ef90678c8f627e8d6be496613a226d28b89e6ebd687c119",
    "ea2e3eb8fe5e6cfbc202da21df546f68c6673e9a00c0aed61cffbac7aed9faf7",
  ];
  const bytes = (hex: string): Uint8Array => {
    const b = hexToBytes(hex);
    if (!b.ok) throw new Error(b.error.message);
    return b.value;
  };
  /** NIP-77 fingerprint: sum of ids as 256-bit little-endian ints, ‖ varint(count), sha256, 16 bytes. */
  const fingerprint = (ids: readonly string[]): string => {
    const le = (b: Uint8Array) => b.reduceRight((acc, x) => (acc << 8n) | BigInt(x), 0n);
    let sum = ids.reduce((acc, id) => (acc + le(bytes(id))) % (1n << 256n), 0n);
    const out = new Uint8Array(33);
    for (let i = 0; i < 32; i++) {
      out[i] = Number(sum & 0xffn);
      sum >>= 8n;
    }
    out[32] = ids.length; // varint of a count < 128 is one byte
    return bytesToHex(sha256(out)).slice(0, 32);
  };

  test("fingerprint and id-list messages re-derive from the fixture ids", () => {
    const client = IDS.slice(0, 3);
    expect(NEG_OPEN_FINGERPRINT).toBe(`61000001${fingerprint(client)}`);
    expect(NEG_OPEN_EMPTY).toBe("6100000200");
    expect(NEG_MSG_RELAY_IDS).toBe(`6100000204${IDS.join("")}`);
    expect(NEG_MSG_CLIENT_IDS).toBe(`6100000203${client.join("")}`);
  });

  test("broken messages are caught", () => {
    const open = message("77", "neg-open", "fingerprint");
    expect(codes("77", msg("neg-open"), [open[0], open[1], open[2], "zz"])).toContain(
      "pattern-mismatch",
    );
    expect(codes("77", msg("neg-open"), ["REQ", ...open.slice(1)])).toContain("wrong-message-type");
    expect(codes("77", msg("neg-open"), open.slice(0, 2))).toContain("too-few-items");
    expect(codes("77", msg("neg-err"), ["NEG-ERR", "sync-1", "it broke"])).toContain(
      "pattern-mismatch",
    );
  });
});

// ── Broken variants for the rest of the range ──────────────────────────────────────────────────

describe("NIP-62 request to vanish", () => {
  const one = example("62", "vanish", "one-relay");
  test("a relay value is a relay URL or the literal ALL_RELAYS", () => {
    expect(codes("62", ev("vanish"), setTag(one, 0, ["relay", "ALL_RELAYS"]))).toEqual([]);
    expect(codes("62", ev("vanish"), setTag(one, 0, ["relay", "all_relays"]))).toContain(
      "invalid-relay-url",
    );
    expect(codes("62", ev("vanish"), setTag(one, 0, ["relay", "https://x.example"]))).toContain(
      "invalid-relay-url",
    );
  });
  test("the value is a relay-url field (relay picker) that also offers ALL_RELAYS", () => {
    const target = shapeOf("62", "vanish").tags[0]?.fields[0]?.type;
    expect(target).toEqual({
      type: "relay-url",
      literals: [{ value: "ALL_RELAYS", explain: "vanish.tag.relay.all" }],
    });
  });
  test("a request without any relay tag is an error (relays would ignore it)", () => {
    expect(codes("62", ev("vanish"), dropTag(one, "relay"))).toContain("missing-tag");
  });
});

describe("NIP-64 chess", () => {
  test("an empty game is an error, a wrong kind too", () => {
    const game = example("64", "game", "opening");
    expect(codes("64", ev("game"), { ...game, content: "" })).toContain("content-required");
    expect(codes("64", ev("game"), { ...game, kind: 1 })).toContain("wrong-kind");
  });
});

describe("NIP-65 relay list", () => {
  const list = example("65", "relay-list", "dave");
  test("markers are read or write, URLs are relays", () => {
    expect(
      codes("65", ev("relay-list"), setTag(list, 0, ["r", "wss://x.example", "both"])),
    ).toContain("invalid-enum");
    expect(codes("65", ev("relay-list"), setTag(list, 0, ["r", "https://x.example"]))).toContain(
      "invalid-relay-url",
    );
    expect(codes("65", ev("relay-list"), { ...list, tags: [] })).toContain("missing-tag");
  });
});

describe("NIP-66 relay monitoring", () => {
  test("discovery needs a d tag and numeric round-trip times", () => {
    const report = example("66", "discovery", "delta");
    expect(codes("66", ev("discovery"), dropTag(report, "d"))).toContain("missing-tag");
    expect(
      codes("66", ev("discovery"), addTag(dropTag(report, "rtt-open"), ["rtt-open", "fast"])),
    ).toContain("invalid-number");
    expect(codes("66", ev("discovery"), addTag(report, ["R", "Auth Required"]))).toContain(
      "pattern-mismatch",
    );
  });
  test("an unknown network is only a warning (the list is open)", () => {
    const report = example("66", "discovery", "delta");
    expect(
      codes("66", ev("discovery"), setTag(report, 1, ["n", "yggdrasil"]), "warning"),
    ).toContain("invalid-enum");
  });
});

describe("NIP-67 EOSE hints", () => {
  test("unknown hints warn, non-arrays fail", () => {
    expect(codes("67", msg("eose"), ["EOSE", "sub2", ["finished"]], "warning")).toContain(
      "invalid-enum",
    );
    expect(codes("67", msg("eose"), ["EOSE", "sub2", "finish"])).toContain("wrong-type");
    expect(codes("67", msg("eose"), ["EOSE"])).toContain("too-few-items");
  });
});

describe("NIP-68 pictures", () => {
  const pic = example("68", "picture", "single");
  test("title and imeta are required; only image media types", () => {
    expect(codes("68", ev("picture"), dropTag(pic, "title"))).toContain("missing-tag");
    expect(codes("68", ev("picture"), dropTag(pic, "imeta"))).toContain("missing-tag");
    expect(codes("68", ev("picture"), addTag(pic, ["m", "video/mp4"]))).toContain("invalid-enum");
    expect(codes("68", ev("picture"), setTag(pic, 1, ["imeta", "m image/jpeg"]))).toContain(
      "pattern-mismatch",
    );
  });
});

describe("NIP-69 P2P orders", () => {
  const order = example("69", "order", "sell-range");
  test("order type, currency, status and rating are checked", () => {
    expect(codes("69", ev("order"), setTag(order, 1, ["k", "swap"]))).toContain("invalid-enum");
    expect(codes("69", ev("order"), setTag(order, 2, ["f", "euro"]))).toContain("pattern-mismatch");
    expect(codes("69", ev("order"), setTag(order, 3, ["s", "done"]))).toContain("invalid-enum");
    expect(codes("69", ev("order"), setTag(order, 8, ["rating", "5 stars"]))).toContain(
      "invalid-json-string",
    );
    expect(codes("69", ev("order"), dropTag(order, "z"))).toContain("missing-tag");
  });
});

describe("NIP-70 protected events", () => {
  test("the dash tag is required, has no values and appears once", () => {
    const note = example("70", "protected", "members-note");
    expect(codes("70", ev("protected"), { ...note, tags: [] })).toContain("missing-tag");
    expect(codes("70", ev("protected"), addTag(note, ["-"]))).toContain("duplicate-tag");
    expect(codes("70", ev("protected"), { ...note, tags: [["-", "x"]] }, "warning")).toContain(
      "tag-too-long",
    );
  });
  test("the process walks through rejection, AUTH and acceptance", () => {
    const steps = spec("70").process?.steps.map((s) => s.packet) ?? [];
    expect(steps).toEqual(["EVENT", "AUTH", "OK", "AUTH", "EVENT", "OK", "EVENT", "OK"]);
  });
});

describe("NIP-71 videos", () => {
  test("addressable videos need d; segments need HH:MM:SS times", () => {
    const addr = example("71", "addressable-video");
    expect(codes("71", ev("addressable-video"), dropTag(addr, "d"))).toContain("missing-tag");
    const video = example("71", "video", "timelapse");
    expect(codes("71", ev("video"), addTag(video, ["segment", "0:00", "0:12", "x"]))).toContain(
      "pattern-mismatch",
    );
    expect(codes("71", ev("video"), { ...video, kind: 34235 })).toContain("wrong-kind");
  });
});

describe("NIP-73 external ids", () => {
  const note = example("73", "external-ref", "web-note");
  test("ids must use a known prefix and normal form", () => {
    expect(
      codes("73", ev("external-ref"), setTag(note, 0, ["i", "ISBN:978-0765382030"])),
    ).toContain("pattern-mismatch");
    expect(codes("73", ev("external-ref"), setTag(note, 0, ["i", "iso3166:ve"]))).toContain(
      "pattern-mismatch",
    );
    expect(codes("73", ev("external-ref"), setTag(note, 0, ["i", "isbn:9780765382030"]))).toEqual(
      [],
    );
  });
});

describe("NIP-75 zap goals", () => {
  const goal = example("75", "goal", "full");
  test("amount and relays are required and typed", () => {
    expect(codes("75", ev("goal"), dropTag(goal, "amount"))).toContain("missing-tag");
    expect(codes("75", ev("goal"), setTag(goal, 1, ["amount", "21k"]))).toContain("invalid-number");
    expect(
      codes("75", ev("goal"), setTag(goal, 0, ["relays", "wss://relay.alpha.example", "nope"])),
    ).toContain("invalid-relay-url");
  });
  test("goal links only on addressable kinds", () => {
    const link = example("75", "goal-link");
    expect(codes("75", ev("goal-link"), { ...link, kind: 1 })).toContain("wrong-kind");
  });
});

describe("NIP-78 app data", () => {
  test("kind 30078 needs a d tag; kind 78 only recommends one", () => {
    const data = example("78", "app-data", "settings");
    expect(codes("78", ev("app-data"), dropTag(data, "d"))).toContain("missing-tag");
    const log = example("78", "app-log");
    expect(codes("78", ev("app-log"), dropTag(log, "d"))).toEqual([]);
  });
});
