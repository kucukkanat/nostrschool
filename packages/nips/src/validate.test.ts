import { describe, expect, test } from "bun:test";
// Real, signed fixture events: tests must not mock events.
import { eventsByKind, FIXTURE_EVENTS, getPersona, giftWraps, zaps } from "@nostrschool/fixtures";
import {
  computeEventId,
  encodeNaddr,
  encodeNevent,
  encodeNote,
  encodeNpub,
  type NostrEvent,
  nip04Encrypt,
  signEvent,
  type Tag,
} from "@nostrschool/protocol";
import type {
  DocumentSpec,
  EncodingSpec,
  EventShape,
  HttpRequestSpec,
  JsonSchema,
  WireMessageSpec,
} from "./spec.ts";
import {
  describeKinds,
  jsonTypeOf,
  matchTagSpec,
  type SpecTarget,
  VALIDATION_CODES,
  type ValidationReport,
  validateAgainstSpec,
  validateField,
  validateJsonText,
  validateSchema,
} from "./validate.ts";

// ── Helpers ────────────────────────────────────────────────────────────────────────────────────

/** "severity code path" triples: compact, order-insensitive assertions. */
const summary = (issues: ValidationReport["issues"]): string[] =>
  issues.map((i) => `${i.severity} ${i.code} ${i.path.join(".")}`).sort();

const first = <T>(xs: readonly T[]): T => {
  const x = xs[0];
  if (x === undefined) throw new Error("fixture missing");
  return x;
};

const alice = getPersona("alice");
const bob = getPersona("bob");
const AUX = new Uint8Array(32);

const toTag = (t: readonly string[]): Tag => {
  const [name, ...values] = t;
  if (name === undefined) throw new Error("empty tag in test data");
  return [name, ...values];
};

/** Signs a template as alice (deterministic aux randomness, like the fixtures). */
const sign = (t: {
  readonly kind: number;
  readonly created_at: number;
  readonly tags: readonly (readonly string[])[];
  readonly content: string;
}) => {
  const template = {
    kind: t.kind,
    created_at: t.created_at,
    tags: t.tags.map(toTag),
    content: t.content,
  };
  const r = signEvent(template, alice.secretKey, { auxRand: AUX });
  if (!r.ok) throw new Error(r.error.message);
  return r.value.event;
};

/** Minimal bech32 encoder for prefixes NIP-19 does not know (ncryptsec, lnurl). */
const bech32 = (hrp: string, words: readonly number[]): string => {
  const CHARSET = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";
  const GEN = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];
  const polymod = (values: readonly number[]) =>
    values.reduce((acc, v) => {
      const top = acc >>> 25;
      return GEN.reduce((c, g, i) => ((top >> i) & 1 ? c ^ g : c), ((acc & 0x1ffffff) << 5) ^ v);
    }, 1);
  const codes = Array.from(hrp, (c) => c.charCodeAt(0));
  const expanded = [...codes.map((c) => c >> 5), 0, ...codes.map((c) => c & 31)];
  const mod = polymod([...expanded, ...words, 0, 0, 0, 0, 0, 0]) ^ 1;
  const checksum = [0, 1, 2, 3, 4, 5].map((i) => (mod >> (5 * (5 - i))) & 31);
  return `${hrp}1${[...words, ...checksum].map((w) => CHARSET[w]).join("")}`;
};

const ok = <T>(r: { ok: true; value: T } | { ok: false; error: { message: string } }): T => {
  if (!r.ok) throw new Error(r.error.message);
  return r.value;
};

// ── Spec data (as a spec author would write it) ────────────────────────────────────────────────

const zapRequest: EventShape = {
  id: "zap-request",
  label: "zap-request.label",
  explain: "zap-request",
  kinds: [9734],
  content: { format: "text", explain: "zap-request.content" },
  tags: [
    {
      name: "relays",
      explain: "tag.relays",
      presence: "required",
      repeatable: false,
      fields: [{ name: "relay", type: { type: "relay-url" }, explain: "tag.relays.relay" }],
      rest: { name: "relay", type: { type: "relay-url" }, explain: "tag.relays.relay" },
    },
    {
      name: "amount",
      explain: "tag.amount",
      presence: "recommended",
      repeatable: false,
      fields: [
        {
          name: "msats",
          type: { type: "number", integer: true, min: 1 },
          explain: "tag.amount.msats",
        },
      ],
    },
    {
      name: "p",
      explain: "tag.p",
      presence: "required",
      repeatable: false,
      fields: [{ name: "pubkey", type: { type: "pubkey" }, explain: "tag.p.pubkey" }],
    },
    {
      name: "e",
      explain: "tag.e",
      presence: "optional",
      repeatable: false,
      fields: [{ name: "event-id", type: { type: "event-id" }, explain: "tag.e.id" }],
    },
    {
      name: "lnurl",
      explain: "tag.lnurl",
      presence: "optional",
      repeatable: false,
      deprecated: true,
      fields: [{ name: "lnurl", type: { type: "bech32", prefixes: ["lnurl"] }, explain: "x" }],
    },
  ],
  examples: [],
};

const zapReceipt: EventShape = {
  id: "zap-receipt",
  label: "zap-receipt.label",
  explain: "zap-receipt",
  kinds: [9735],
  content: { format: "empty" },
  unknownTags: "warn",
  tags: [
    {
      name: "p",
      explain: "r.p",
      presence: "required",
      repeatable: false,
      fields: [{ name: "pubkey", type: { type: "pubkey" }, explain: "r.p.pubkey" }],
    },
    {
      name: "P",
      explain: "r.P",
      presence: "optional",
      repeatable: false,
      fields: [{ name: "pubkey", type: { type: "pubkey" }, explain: "r.P.pubkey" }],
    },
    {
      name: "e",
      explain: "r.e",
      presence: "optional",
      repeatable: false,
      fields: [{ name: "id", type: { type: "event-id" }, explain: "r.e.id" }],
    },
    {
      name: "bolt11",
      explain: "r.bolt11",
      presence: "required",
      repeatable: false,
      fields: [
        { name: "invoice", type: { type: "text", pattern: "ln\\w+" }, explain: "r.bolt11.v" },
      ],
    },
    {
      name: "preimage",
      explain: "r.preimage",
      presence: "optional",
      repeatable: false,
      fields: [{ name: "preimage", type: { type: "hex32" }, explain: "r.preimage.v" }],
    },
    {
      name: "description",
      explain: "r.description",
      presence: "required",
      repeatable: false,
      fields: [
        {
          name: "request",
          type: { type: "event-json", kinds: [9734] },
          explain: "r.description.v",
        },
      ],
    },
  ],
  examples: [],
};

const metadata: EventShape = {
  id: "metadata",
  label: "m.label",
  explain: "m",
  kinds: [0],
  content: {
    format: "json",
    explain: "m.content",
    schema: {
      type: "object",
      explain: "m.content.object",
      required: ["name"],
      properties: {
        name: { type: "string", explain: "m.name", field: { type: "text", maxLength: 40 } },
        about: { type: "string", explain: "m.about" },
        nip05: { type: "string", explain: "m.nip05" },
        lud16: { type: "string", explain: "m.lud16" },
        display_name: { type: "string", explain: "m.display_name" },
        picture: { type: "string", field: { type: "url" }, explain: "m.picture" },
        displayName: { type: "string", deprecated: true, explain: "m.displayName" },
      },
      additionalProperties: false,
    },
  },
  tags: [],
  examples: [],
};

const reaction: EventShape = {
  id: "reaction",
  label: "rx.label",
  explain: "rx",
  kinds: [7],
  content: {
    format: "text",
    explain: "rx.content",
    required: true,
    field: { type: "enum", open: true, values: [{ value: "+" }, { value: "-" }] },
  },
  tags: [
    {
      name: "e",
      explain: "rx.e",
      presence: "required",
      repeatable: true,
      fields: [
        { name: "id", type: { type: "event-id" }, explain: "rx.e.id" },
        { name: "relay", type: { type: "relay-url" }, explain: "rx.e.relay", optional: true },
        { name: "pubkey", type: { type: "pubkey" }, explain: "rx.e.pubkey", optional: true },
      ],
    },
    {
      name: "a",
      explain: "rx.a",
      presence: "optional",
      repeatable: true,
      fields: [
        { name: "addr", type: { type: "addr", kinds: [30023] }, explain: "rx.a.addr" },
        { name: "relay", type: { type: "relay-url" }, explain: "rx.a.relay", optional: true },
      ],
    },
    {
      name: "p",
      explain: "rx.p",
      presence: "recommended",
      repeatable: true,
      fields: [{ name: "pubkey", type: { type: "pubkey" }, explain: "rx.p.pubkey" }],
    },
    {
      name: "k",
      explain: "rx.k",
      presence: "optional",
      repeatable: false,
      fields: [{ name: "kind", type: { type: "kind" }, explain: "rx.k.kind" }],
    },
  ],
  examples: [],
};

/** NIP-10 style: one tag name, variants picked by the marker at position 3. */
const threadedNote: EventShape = {
  id: "note",
  label: "n.label",
  explain: "n",
  kinds: [1],
  content: { format: "text", explain: "n.content", required: true },
  tags: [
    {
      id: "e-root",
      name: "e",
      explain: "n.e.root",
      presence: "optional",
      repeatable: false,
      when: { index: 3, equals: "root" },
      fields: [
        { name: "id", type: { type: "event-id" }, explain: "n.e.id" },
        { name: "relay", type: { type: "relay-url" }, explain: "n.e.relay", optional: true },
        {
          name: "marker",
          type: { type: "enum", values: [{ value: "root" }, { value: "reply" }] },
          explain: "n.e.marker",
        },
      ],
    },
    {
      id: "e-reply",
      name: "e",
      explain: "n.e.reply",
      presence: "optional",
      repeatable: false,
      when: { index: 3, equals: "reply" },
      fields: [
        { name: "id", type: { type: "event-id" }, explain: "n.e.id" },
        { name: "relay", type: { type: "relay-url" }, explain: "n.e.relay", optional: true },
        {
          name: "marker",
          type: { type: "enum", values: [{ value: "root" }, { value: "reply" }] },
          explain: "n.e.marker",
        },
      ],
    },
    {
      name: "d",
      explain: "n.d",
      presence: "optional",
      repeatable: false,
      fields: [{ name: "id", type: { type: "text" }, explain: "n.d.id" }],
    },
  ],
  examples: [],
};

const giftWrap: EventShape = {
  id: "gift-wrap",
  label: "gw.label",
  explain: "gw",
  kinds: [1059],
  content: {
    format: "encrypted",
    explain: "gw.content",
    scheme: "nip44",
    plaintext: { format: "json", explain: "gw.seal", schema: { type: "event" } },
  },
  tags: [
    {
      name: "p",
      explain: "gw.p",
      presence: "required",
      repeatable: false,
      fields: [{ name: "pubkey", type: { type: "pubkey" }, explain: "gw.p.pubkey" }],
    },
  ],
  examples: [],
};

const pTag = {
  name: "p",
  explain: "p",
  presence: "required",
  repeatable: false,
  fields: [{ name: "pubkey", type: { type: "pubkey" }, explain: "p.pubkey" }],
} as const;

const legacyDm: EventShape = {
  id: "dm",
  label: "dm.label",
  explain: "dm",
  kinds: [4],
  content: {
    format: "encrypted",
    explain: "dm.content",
    scheme: "nip04",
    plaintext: { format: "text", explain: "dm.plain" },
  },
  tags: [pTag],
  examples: [],
};

const rumor: EventShape = {
  id: "chat-message",
  label: "cm.label",
  explain: "cm",
  kinds: [14],
  signature: "none",
  content: { format: "text", explain: "cm.content" },
  unknownTags: "warn",
  tags: [
    {
      ...pTag,
      repeatable: true,
      fields: [
        ...pTag.fields,
        { name: "relay", type: { type: "relay-url" }, explain: "p.relay", optional: true },
      ],
    },
    {
      name: "e",
      explain: "cm.e",
      presence: "optional",
      repeatable: true,
      fields: [
        { name: "id", type: { type: "event-id" }, explain: "cm.e.id" },
        { name: "relay", type: { type: "relay-url" }, explain: "cm.e.relay", optional: true },
        { name: "marker", type: { type: "text" }, explain: "cm.e.marker", optional: true },
      ],
    },
    {
      name: "subject",
      explain: "cm.subject",
      presence: "optional",
      repeatable: false,
      fields: [{ name: "subject", type: { type: "text" }, explain: "cm.subject.v" }],
    },
  ],
  examples: [],
};

const lists: EventShape = {
  id: "lists",
  label: "l.label",
  explain: "l",
  kinds: [{ from: 30000, to: 39999 }],
  content: { format: "text", explain: "l.content" },
  tags: [],
  examples: [],
};

// ── Field types ────────────────────────────────────────────────────────────────────────────────

describe("validateField", () => {
  const codesOf = (v: unknown, f: Parameters<typeof validateField>[1]) =>
    validateField(v, f, ["x"]).map((i) => `${i.severity} ${i.code}`);

  test("hex, hex32, event-id", () => {
    const id = first(FIXTURE_EVENTS).id;
    expect(codesOf(id, { type: "hex32" })).toEqual([]);
    expect(codesOf(id.toUpperCase(), { type: "hex32" })).toEqual(["error invalid-hex"]);
    expect(codesOf("abcd", { type: "hex", bytes: 2 })).toEqual([]);
    expect(validateField("abc", { type: "hex" })[0]?.params).toEqual({ bytes: 32 });
    expect(codesOf(id, { type: "event-id" })).toEqual([]);
    expect(codesOf(id.slice(1), { type: "event-id" })).toEqual(["error invalid-event-id"]);
  });

  test("pubkey must be on the curve", () => {
    expect(codesOf(alice.pubkey, { type: "pubkey" })).toEqual([]);
    // 64 hex chars, but x = 5 is not on secp256k1.
    expect(codesOf(`${"0".repeat(63)}5`, { type: "pubkey" })).toEqual(["error invalid-pubkey"]);
  });

  test("relay and http URLs", () => {
    expect(codesOf("wss://relay.alpha.example", { type: "relay-url" })).toEqual([]);
    expect(codesOf("https://relay.alpha.example", { type: "relay-url" })).toEqual([
      "error invalid-relay-url",
    ]);
    expect(codesOf("relay.alpha.example", { type: "relay-url" })).toEqual([
      "error invalid-relay-url",
    ]);
    // NIP-62: a relay position may also allow exact literals ("ALL_RELAYS"), case-sensitive.
    const orAll = { type: "relay-url", literals: [{ value: "ALL_RELAYS" }] } as const;
    expect(codesOf("ALL_RELAYS", orAll)).toEqual([]);
    expect(codesOf("wss://relay.alpha.example", orAll)).toEqual([]);
    expect(codesOf("all_relays", orAll)).toEqual(["error invalid-relay-url"]);
    expect(codesOf("ALL_RELAYS", { type: "relay-url" })).toEqual(["error invalid-relay-url"]);
    expect(codesOf("https://alpha.example/a.png", { type: "url" })).toEqual([]);
    expect(codesOf("ftp://alpha.example/a", { type: "url" })).toEqual(["error invalid-url"]);
    expect(codesOf("ftp://alpha.example/a", { type: "url", schemes: ["ftp"] })).toEqual([]);
    expect(codesOf("magnet:?xt=urn:btih:abc", { type: "url", schemes: ["magnet"] })).toEqual([]);
    expect(codesOf("wss://", { type: "relay-url" })).toEqual(["error invalid-relay-url"]);
  });

  test("timestamps are Unix seconds (strings in tags, numbers in JSON)", () => {
    expect(codesOf("1735689600", { type: "timestamp" })).toEqual([]);
    expect(codesOf(1735689600, { type: "timestamp" })).toEqual([]);
    expect(codesOf(1735689600000, { type: "timestamp" })).toEqual(["error invalid-timestamp"]);
    expect(codesOf("-5", { type: "timestamp" })).toEqual(["error invalid-timestamp"]);
    expect(codesOf("soon", { type: "timestamp" })).toEqual(["error invalid-timestamp"]);
  });

  test("kinds and allowed kinds", () => {
    expect(codesOf("30023", { type: "kind" })).toEqual([]);
    expect(codesOf(7, { type: "kind", kinds: [7] })).toEqual([]);
    expect(codesOf("70000", { type: "kind" })).toEqual(["error invalid-kind"]);
    expect(validateField("1", { type: "kind", kinds: [7, 9735] })).toEqual([
      {
        severity: "error",
        code: "kind-not-allowed",
        path: [],
        params: { kind: 1, allowed: "7, 9735" },
      },
    ]);
  });

  test("numbers: integer, bounds", () => {
    expect(codesOf("2100000", { type: "number", integer: true, min: 1 })).toEqual([]);
    expect(codesOf("2.5", { type: "number", integer: true })).toEqual(["error invalid-number"]);
    expect(codesOf("lots", { type: "number" })).toEqual(["error invalid-number"]);
    expect(validateField(0, { type: "number", min: 1 })[0]?.params).toEqual({ min: 1, max: "∞" });
    expect(validateField(9, { type: "number", max: 5 })[0]?.params).toEqual({ min: "-∞", max: 5 });
  });

  test("addressable coordinates", () => {
    const addr = `30023:${alice.pubkey}:protocols-not-platforms`;
    expect(codesOf(addr, { type: "addr" })).toEqual([]);
    expect(codesOf(`30023:${alice.pubkey}:`, { type: "addr", kinds: [30023] })).toEqual([]);
    expect(codesOf(addr, { type: "addr", kinds: [30402] })).toEqual(["error kind-not-allowed"]);
    expect(codesOf(`99999:${alice.pubkey}:x`, { type: "addr" })).toEqual(["error invalid-addr"]);
    expect(codesOf(`30023:${"0".repeat(63)}5:x`, { type: "addr" })).toEqual(["error invalid-addr"]);
    expect(codesOf("30023:alice", { type: "addr" })).toEqual(["error invalid-addr"]);
  });

  test("bech32: NIP-19 entities, nostr: URIs and other prefixes", () => {
    const event = first(eventsByKind(30023));
    const npub = ok(encodeNpub(alice.pubkey));
    const note = ok(encodeNote(event.id));
    const nevent = ok(encodeNevent({ id: event.id, relays: ["wss://relay.alpha.example"] }));
    const naddr = ok(
      encodeNaddr({ kind: 30023, pubkey: event.pubkey, identifier: "protocols-not-platforms" }),
    );
    const f = { type: "bech32", prefixes: ["npub", "nevent", "naddr"] } as const;
    expect(codesOf(npub, f)).toEqual([]);
    expect(codesOf(npub.toUpperCase(), f)).toEqual([]);
    expect(codesOf(nevent, f)).toEqual([]);
    expect(codesOf(naddr, f)).toEqual([]);
    expect(validateField(note, f)).toEqual([
      {
        severity: "error",
        code: "invalid-bech32",
        path: [],
        params: { prefixes: "npub, nevent, naddr" },
      },
    ]);
    // One flipped character breaks the checksum; mixed case is never valid bech32.
    const typo = `${npub.slice(0, -1)}${npub.endsWith("q") ? "p" : "q"}`;
    expect(codesOf(typo, f)).toEqual(["error invalid-bech32"]);
    expect(codesOf(`N${npub.slice(1)}`, f)).toEqual(["error invalid-bech32"]);
    expect(codesOf("npub1b", f)).toEqual(["error invalid-bech32"]);
    // A valid checksum around the wrong payload length (npub must hold 32 bytes).
    expect(codesOf(bech32("npub", [1, 2, 3]), f)).toEqual(["error invalid-bech32"]);

    const uri = { type: "bech32", prefixes: ["npub"], uri: true } as const;
    expect(codesOf(`nostr:${npub}`, uri)).toEqual([]);
    expect(codesOf(npub, uri)).toEqual(["error invalid-bech32"]);

    const ncryptsec = bech32(
      "ncryptsec",
      Array.from({ length: 150 }, (_, i) => i % 32),
    );
    expect(ncryptsec.length).toBeGreaterThan(90);
    expect(codesOf(ncryptsec, { type: "bech32", prefixes: ["ncryptsec"] })).toEqual([]);
    expect(
      codesOf(`${ncryptsec.slice(0, -1)}!`, { type: "bech32", prefixes: ["ncryptsec"] }),
    ).toEqual(["error invalid-bech32"]);
  });

  test("enums: closed is an error, open a warning", () => {
    const values = [{ value: "read" }, { value: "write" }];
    expect(codesOf("read", { type: "enum", values })).toEqual([]);
    expect(validateField("both", { type: "enum", values })).toEqual([
      {
        severity: "error",
        code: "invalid-enum",
        path: [],
        params: { value: "both", allowed: "read, write" },
      },
    ]);
    expect(codesOf("both", { type: "enum", values, open: true })).toEqual(["warning invalid-enum"]);
  });

  test("text: anchored pattern, length in code points", () => {
    expect(codesOf("lnbc21000n1", { type: "text", pattern: "ln\\w+" })).toEqual([]);
    expect(codesOf("xlnbc", { type: "text", pattern: "ln\\w+" })).toEqual([
      "error pattern-mismatch",
    ]);
    expect(codesOf("⚡⚡", { type: "text", maxLength: 2 })).toEqual([]);
    expect(codesOf("abc", { type: "text", maxLength: 2 })).toEqual(["error too-long"]);
    expect(codesOf("a", { type: "text", minLength: 2 })).toEqual(["error too-short"]);
    expect(codesOf("anything\ngoes", { type: "text" })).toEqual([]);
  });

  test("JSON-encoded strings descend into the parsed value", () => {
    const schema: JsonSchema = { type: "object", properties: {}, required: ["name"] };
    expect(codesOf('{"name":"alice"}', { type: "json", schema })).toEqual([]);
    expect(codesOf("{name", { type: "json", schema })).toEqual(["error invalid-json-string"]);
    expect(validateField('{"name":1}', { type: "json", schema }, ["content"])).toEqual([]);
    const nested = validateField(
      "{}",
      {
        type: "json",
        schema: { type: "object", properties: { a: { type: "number" } }, required: ["a"] },
      },
      ["tags", 0, 1],
    );
    expect(summary(nested)).toEqual(["error missing-field tags.0.1"]);
  });

  test("event-json: a real zap request inside a real receipt", () => {
    const { request } = first(zaps());
    expect(codesOf(JSON.stringify(request), { type: "event-json", kinds: [9734] })).toEqual([]);
    expect(codesOf(JSON.stringify(request), { type: "event-json", kinds: [1] })).toEqual([
      "error kind-not-allowed",
    ]);
    expect(codesOf("not json", { type: "event-json" })).toEqual(["error invalid-json-string"]);
    const tampered = JSON.stringify({ ...request, content: "changed" });
    expect(summary(validateField(tampered, { type: "event-json" }, ["d"]))).toEqual([
      "error id-mismatch d.id",
    ]);
  });

  test("base64: bytes and base64-encoded events (NIP-98)", () => {
    const event = first(FIXTURE_EVENTS);
    const b64 = Buffer.from(JSON.stringify(event)).toString("base64");
    expect(codesOf(b64, { type: "base64", of: "event" })).toEqual([]);
    expect(codesOf("aGVsbG8=", { type: "base64" })).toEqual([]);
    expect(codesOf("not base64!", { type: "base64" })).toEqual(["error invalid-base64"]);
    expect(codesOf("aGVsbG8=", { type: "base64", of: "event" })).toEqual([
      "error invalid-json-string",
    ]);
    const unsigned = Buffer.from(JSON.stringify({ ...event, sig: undefined })).toString("base64");
    expect(codesOf(unsigned, { type: "base64", of: "event" })).toEqual(["error missing-field"]);
  });

  test("non-strings are a type error with the actual JSON type", () => {
    expect(validateField(null, { type: "pubkey" }, ["p"])).toEqual([
      {
        severity: "error",
        code: "wrong-type",
        path: ["p"],
        params: { expected: "string", actual: "null" },
      },
    ]);
    expect(codesOf(["a"], { type: "text" })).toEqual(["error wrong-type"]);
    expect(codesOf(5, { type: "text" })).toEqual(["error wrong-type"]);
  });
});

// ── Schemas ────────────────────────────────────────────────────────────────────────────────────

describe("validateSchema", () => {
  test("objects: required, unknown keys, additionalProperties schemas, explanations", () => {
    const schema: JsonSchema = {
      type: "object",
      explain: "doc",
      required: ["names"],
      properties: {
        names: {
          type: "object",
          explain: "doc.names",
          properties: {},
          additionalProperties: { type: "string", field: { type: "pubkey" }, explain: "doc.pk" },
        },
      },
      additionalProperties: false,
    };
    expect(validateSchema({ names: { alice: alice.pubkey } }, schema)).toEqual([]);
    expect(validateSchema({}, schema)).toEqual([
      {
        severity: "error",
        code: "missing-field",
        path: [],
        params: { field: "names" },
        explain: "doc.names",
      },
    ]);
    expect(summary(validateSchema({ names: { bob: "nope" }, extra: 1 }, schema))).toEqual([
      "error invalid-pubkey names.bob",
      "warning unknown-field extra",
    ]);
    expect(validateSchema({ names: { bob: "nope" } }, schema)[0]?.explain).toBe("doc.pk");
    expect(validateSchema([], schema)[0]?.explain).toBe("doc");
    expect(validateSchema({ x: 1 }, { type: "object", properties: {} })).toEqual([]);
  });

  test("arrays and tuples", () => {
    const list: JsonSchema = { type: "array", items: { type: "number" }, minItems: 1, maxItems: 2 };
    expect(validateSchema([1], list)).toEqual([]);
    expect(summary(validateSchema([], list))).toEqual(["error too-few-items "]);
    expect(summary(validateSchema([1, 2, "3"], list))).toEqual([
      "error too-many-items ",
      "error wrong-type 2",
    ]);
    expect(summary(validateSchema("x", list))).toEqual(["error wrong-type "]);

    const pair: JsonSchema = { type: "tuple", items: [{ type: "string" }, { type: "number" }] };
    expect(validateSchema(["a", 1], pair)).toEqual([]);
    expect(summary(validateSchema(["a"], pair))).toEqual(["error too-few-items "]);
    expect(summary(validateSchema(["a", 1, 2], pair))).toEqual(["error too-many-items "]);
    expect(summary(validateSchema({}, pair))).toEqual(["error wrong-type "]);
    const variadic: JsonSchema = {
      type: "tuple",
      items: [{ type: "string" }],
      minItems: 0,
      rest: { type: "number" },
    };
    expect(validateSchema([], variadic)).toEqual([]);
    expect(summary(validateSchema(["a", 1, "b"], variadic))).toEqual(["error wrong-type 2"]);
  });

  test("scalars", () => {
    expect(validateSchema(3, { type: "number", integer: true, minimum: 1, maximum: 5 })).toEqual(
      [],
    );
    expect(summary(validateSchema(3.5, { type: "number", integer: true }))).toEqual([
      "error invalid-number ",
    ]);
    expect(summary(validateSchema(9, { type: "number", maximum: 5 }))).toEqual([
      "error out-of-range ",
    ]);
    expect(summary(validateSchema("3", { type: "number" }))).toEqual(["error wrong-type "]);
    expect(validateSchema(true, { type: "boolean" })).toEqual([]);
    expect(validateSchema(null, { type: "null" })).toEqual([]);
    expect(summary(validateSchema(0, { type: "boolean" }))).toEqual(["error wrong-type "]);
    expect(validateSchema("x", { type: "string" })).toEqual([]);
    expect(summary(validateSchema(1, { type: "string" }))).toEqual(["error wrong-type "]);
    expect(validateSchema({ anything: [1] }, { type: "any" })).toEqual([]);
  });

  test("deprecated parts warn and carry their explanation", () => {
    expect(validateSchema("x", { type: "string", deprecated: true, explain: "old" })).toEqual([
      { severity: "warning", code: "deprecated", path: [], explain: "old" },
    ]);
  });

  test("any-of: first clean option wins, else the closest option or a type error", () => {
    const schema: JsonSchema = {
      type: "any-of",
      options: [
        { type: "string", field: { type: "relay-url" } },
        { type: "array", items: { type: "string", field: { type: "relay-url" } } },
      ],
    };
    expect(validateSchema("wss://a.example", schema)).toEqual([]);
    expect(validateSchema(["wss://a.example"], schema)).toEqual([]);
    expect(summary(validateSchema(["https://a.example"], schema))).toEqual([
      "error invalid-relay-url 0",
    ]);
    expect(validateSchema(5, schema)).toEqual([
      {
        severity: "error",
        code: "wrong-type",
        path: [],
        params: { expected: "string | array", actual: "number" },
      },
    ]);
    const objects: JsonSchema = {
      type: "any-of",
      options: [
        { type: "event" },
        { type: "filter" },
        { type: "any-of", options: [{ type: "null" }] },
      ],
    };
    expect(summary(validateSchema({ kinds: "x" }, objects))).toEqual(["error wrong-type "]);
    expect(validateSchema(null, objects)).toEqual([]);
    expect(validateSchema(true, { type: "any-of", options: [{ type: "any" }] })).toEqual([]);
  });

  test("filters (NIP-01 REQ)", () => {
    const filter: JsonSchema = { type: "filter" };
    const good = {
      ids: [first(FIXTURE_EVENTS).id],
      authors: [alice.pubkey],
      kinds: [1, 30023],
      since: 1735600000,
      until: 1735689600,
      limit: 20,
      search: "nostr",
      "#e": [first(FIXTURE_EVENTS).id],
      "#p": [bob.pubkey],
      "#t": ["nostr"],
    };
    expect(validateSchema(good, filter)).toEqual([]);
    expect(
      summary(
        validateSchema({ kinds: [70000], authors: ["alice"], "#t": [1], foo: 1 }, filter, ["f"]),
      ),
    ).toEqual([
      "error invalid-hex f.authors.0",
      "error out-of-range f.kinds.0",
      "error wrong-type f.#t.0",
      "warning unknown-field f.foo",
    ]);
    expect(summary(validateSchema([], filter))).toEqual(["error wrong-type "]);
  });

  test("events: signed by default, templates allowed with signed: false, shapes by id", () => {
    const note = first(eventsByKind(1));
    expect(validateSchema(note, { type: "event" })).toEqual([]);
    const { id: _id, sig: _sig, pubkey: _pk, ...template } = note;
    expect(summary(validateSchema(template, { type: "event" }))).toEqual([
      "error missing-field ",
      "error missing-field ",
      "error missing-field ",
    ]);
    expect(validateSchema(template, { type: "event", signed: false })).toEqual([]);
    const shapes = { reaction };
    expect(
      summary(validateSchema(note, { type: "event", shape: "reaction" }, ["e"], { shapes })),
    ).toContain("error wrong-kind e.kind");
    expect(validateSchema(note, { type: "event", shape: "unknown" }, [], { shapes })).toEqual([]);
  });
});

// ── Events against shapes ──────────────────────────────────────────────────────────────────────

const event = (part: EventShape): SpecTarget => ({ kind: "event", part });

describe("validateAgainstSpec — events", () => {
  test("every real zap request and receipt validates (nested request checked too)", () => {
    const shapes = { "zap-request": zapRequest };
    for (const z of zaps()) {
      const req = validateAgainstSpec(z.request, event(zapRequest));
      expect(req.valid).toBe(true);
      expect(summary(req.issues)).toEqual([]);
      const receipt = validateAgainstSpec(z.receipt, event(zapReceipt), { shapes });
      expect(summary(receipt.issues)).toEqual([]);
      expect(receipt.valid).toBe(true);
    }
  });

  test("a deprecated shape still validates, with one explained info at the event", () => {
    const legacy: EventShape = {
      ...legacyDm,
      deprecated: { explain: "dm.deprecated", replacedBy: "chat-message" },
    };
    const payload = ok(nip04Encrypt("hi bob", alice.secretKey, bob.pubkey)).payload;
    const dm = sign({ kind: 4, created_at: 1, tags: [["p", bob.pubkey]], content: payload });
    const r = validateAgainstSpec(dm, event(legacy));
    expect(r.valid).toBe(true);
    expect(r.issues).toEqual([
      {
        severity: "info",
        code: "deprecated",
        path: [],
        params: { replacedBy: "chat-message" },
        explain: "dm.deprecated",
      },
    ]);
    const noReplacement: EventShape = { ...legacyDm, deprecated: { explain: "dm.deprecated" } };
    expect(validateAgainstSpec(dm, event(noReplacement)).issues).toEqual([
      { severity: "info", code: "deprecated", path: [], explain: "dm.deprecated" },
    ]);
    // Nested events matched to a deprecated shape say so at their own path.
    expect(
      summary(
        validateSchema(dm, { type: "event", shape: "dm" }, ["x"], { shapes: { dm: legacy } }),
      ),
    ).toEqual(["info deprecated x"]);
  });

  test("a template is valid but unsigned (info), and id/sig are checked once present", () => {
    const { request } = first(zaps());
    const { id: _i, sig: _s, pubkey: _p, ...template } = request;
    const r = validateAgainstSpec(template, event(zapRequest));
    expect(r.valid).toBe(true);
    expect(r.issues).toEqual([{ severity: "info", code: "unsigned", path: [] }]);

    const tampered = validateAgainstSpec({ ...request, content: "edited" }, event(zapRequest));
    expect(tampered.valid).toBe(false);
    expect(tampered.issues).toEqual([
      {
        severity: "error",
        code: "id-mismatch",
        path: ["id"],
        params: { expected: computeEventId({ ...request, content: "edited" }).id },
      },
    ]);
    const resigned = { ...request, sig: first(zaps().slice(1)).request.sig };
    expect(summary(validateAgainstSpec(resigned, event(zapRequest)).issues)).toEqual([
      "error bad-signature sig",
    ]);
    expect(
      validateAgainstSpec(resigned, event(zapRequest), { verifySignature: false }).issues,
    ).toEqual([]);
  });

  test("tag presence, duplicates, arity, field types and deprecated tags", () => {
    const { request } = first(zaps());
    const tags = [
      ["relays", "https://not-a-relay.example"],
      ["p", alice.pubkey],
      ["p", bob.pubkey],
      ["e", "abc", "wss://extra.example"],
      ["lnurl", "lnurl1bogus"],
      ["x"],
    ];
    const r = validateAgainstSpec(
      { kind: 9734, created_at: request.created_at, tags, content: "" },
      event(zapRequest),
    );
    expect(summary(r.issues)).toEqual([
      "error duplicate-tag tags.2",
      "error invalid-bech32 tags.4.1",
      "error invalid-event-id tags.3.1",
      "error invalid-relay-url tags.0.1",
      "info missing-tag tags",
      "info unknown-tag tags.5",
      "info unsigned ",
      "warning deprecated tags.4",
      "warning tag-too-long tags.3",
    ]);
    // Field issues explain the field; tag-level issues explain the tag.
    const byCode = (code: string) => r.issues.find((i) => i.code === code);
    expect(byCode("invalid-relay-url")?.explain).toBe("tag.relays.relay");
    expect(byCode("duplicate-tag")?.explain).toBe("tag.p");
    expect(byCode("missing-tag")).toMatchObject({
      params: { tag: "amount" },
      explain: "tag.amount",
    });

    const missing = validateAgainstSpec(
      { kind: 9734, created_at: 1, tags: [["relays"]], content: "" },
      event(zapRequest),
    );
    expect(summary(missing.issues)).toEqual([
      "error missing-tag tags",
      "error tag-too-short tags.0",
      "info missing-tag tags",
      "info unsigned ",
    ]);
  });

  test("requireOneOf: an error when no tag of a group is present, explained by the group", () => {
    // NIP-09 style: a deletion must reference something via `e` or `a` (neither is required alone).
    const deletion: EventShape = {
      ...reaction,
      kinds: [5],
      content: { format: "text", explain: "rx.content" },
      tags: reaction.tags.map((t) => ({ ...t, presence: "optional" })),
      requireOneOf: [{ tags: ["e", "a"], explain: "rx.target" }],
    };
    const none = validateAgainstSpec(
      { kind: 5, created_at: 1, tags: [["k", "1"]], content: "" },
      event(deletion),
    );
    expect(none.valid).toBe(false);
    expect(summary(none.issues)).toEqual(["error missing-one-of tags", "info unsigned "]);
    expect(none.issues.find((i) => i.code === "missing-one-of")).toMatchObject({
      params: { tags: "e, a" },
      explain: "rx.target",
    });
    const viaA = validateAgainstSpec(
      { kind: 5, created_at: 1, tags: [["a", `30023:${alice.pubkey}:post`]], content: "" },
      event(deletion),
    );
    expect(viaA.valid).toBe(true);
    expect(summary(viaA.issues)).toEqual(["info unsigned "]);
  });

  test("relays rest values, kind mismatch and kind ranges", () => {
    const r = validateAgainstSpec(
      {
        kind: 1,
        created_at: 1,
        tags: [
          ["relays", "wss://a.example", "wss://b.example", "nope"],
          ["p", alice.pubkey],
        ],
        content: "",
      },
      event(zapRequest),
    );
    expect(summary(r.issues)).toEqual([
      "error invalid-relay-url tags.0.3",
      "error wrong-kind kind",
      "info missing-tag tags",
      "info unsigned ",
    ]);
    expect(r.issues.find((i) => i.code === "wrong-kind")?.params).toEqual({
      kind: 1,
      expected: "9734",
    });
    // Tags the shape does not define are only infos by default (unknownTags: "allow").
    for (const article of eventsByKind(30023)) {
      const report = validateAgainstSpec(article, event(lists));
      expect(report.valid).toBe(true);
      expect(new Set(report.issues.map((i) => `${i.severity} ${i.code}`))).toEqual(
        new Set(["info unknown-tag"]),
      );
    }
    expect(
      validateAgainstSpec({ ...first(eventsByKind(1)) }, event(lists)).issues[0]?.params,
    ).toEqual({ kind: 1, expected: "30000–39999" });
  });

  test("unknownTags: warn and receipts with a broken embedded request", () => {
    const z = first(zaps());
    const extra = sign({ ...z.receipt, tags: [...z.receipt.tags, ["zap-split", "x"]] });
    expect(summary(validateAgainstSpec(extra, event(zapReceipt)).issues)).toEqual([
      `warning unknown-tag tags.${z.receipt.tags.length}`,
    ]);
    const descIndex = z.receipt.tags.findIndex((t) => t[0] === "description");
    const broken = sign({
      ...z.receipt,
      tags: z.receipt.tags.map((t) => (t[0] === "description" ? ["description", "{}"] : [...t])),
    });
    const issues = validateAgainstSpec(broken, event(zapReceipt)).issues;
    expect(issues.every((i) => i.path.join(".").startsWith(`tags.${descIndex}.1`))).toBe(true);
    expect(issues.some((i) => i.code === "missing-field")).toBe(true);
    expect(issues[0]?.explain).toBe("r.description.v");
  });

  test("real reactions: + and emoji are fine (open enum), empty content is required", () => {
    for (const r of eventsByKind(7)) {
      const report = validateAgainstSpec(r, event(reaction));
      expect(report.valid).toBe(true);
      expect(
        report.issues.every((i) => i.code === "invalid-enum" || i.code === "missing-tag"),
      ).toBe(true);
    }
    const r = first(eventsByKind(7));
    const empty = validateAgainstSpec(sign({ ...r, content: "" }), event(reaction));
    expect(empty.issues).toContainEqual({
      severity: "error",
      code: "content-required",
      path: ["content"],
      explain: "rx.content",
    });
    const badAddr = sign({
      ...r,
      tags: [
        ["e", r.tags[0]?.[1] ?? ""],
        ["a", `1:${alice.pubkey}:x`],
        ["k", "-1"],
      ],
    });
    expect(summary(validateAgainstSpec(badAddr, event(reaction)).issues)).toEqual([
      "error invalid-kind tags.2.1",
      "error kind-not-allowed tags.1.1",
      "info missing-tag tags",
    ]);
    // "" keeps a later optional value's position; a required "" is reported as missing.
    const placeholders = sign({
      ...r,
      tags: [
        ["e", r.tags[0]?.[1] ?? "", "", alice.pubkey],
        ["p", ""],
      ],
    });
    expect(summary(validateAgainstSpec(placeholders, event(reaction)).issues)).toEqual([
      "error missing-field tags.1.1",
    ]);
  });

  test("tag variants picked by marker (NIP-10 style)", () => {
    const [root, reply] = eventsByKind(1);
    if (root === undefined || reply === undefined) throw new Error("fixture missing");
    const t = (marker: string) => ["e", root.id, "", marker];
    expect(matchTagSpec(threadedNote, t("root"))?.id).toBe("e-root");
    expect(matchTagSpec(threadedNote, t("reply"))?.id).toBe("e-reply");
    expect(matchTagSpec(threadedNote, ["q"])).toBeUndefined();
    const ok1 = sign({
      kind: 1,
      created_at: 1,
      tags: [t("root"), t("reply"), ["d", ""]],
      content: "hi",
    });
    expect(validateAgainstSpec(ok1, event(threadedNote)).issues).toEqual([]);
    const two = sign({ kind: 1, created_at: 1, tags: [t("root"), t("root")], content: "hi" });
    expect(summary(validateAgainstSpec(two, event(threadedNote)).issues)).toEqual([
      "error duplicate-tag tags.1",
    ]);
    const odd = sign({
      kind: 1,
      created_at: 1,
      tags: [t("mention"), ["e", root.id]],
      content: "hi",
    });
    expect(validateAgainstSpec(odd, event(threadedNote)).issues).toEqual([
      {
        severity: "error",
        code: "invalid-enum",
        path: ["tags", 0, 3],
        params: { value: "mention", allowed: "root, reply" },
      },
      {
        severity: "error",
        code: "invalid-enum",
        path: ["tags", 1, 3],
        params: { value: "", allowed: "root, reply" },
      },
    ]);
  });

  test("JSON content: real kind 0 metadata, paths into the content string", () => {
    for (const m of eventsByKind(0))
      expect(validateAgainstSpec(m, event(metadata)).issues).toEqual([]);
    const m = first(eventsByKind(0));
    const bad = sign({
      ...m,
      content: JSON.stringify({
        name: "x".repeat(41),
        picture: "nope",
        displayName: "Old",
        website: "w",
      }),
    });
    expect(summary(validateAgainstSpec(bad, event(metadata)).issues)).toEqual([
      "error invalid-url content.picture",
      "error too-long content.name",
      "warning deprecated content.displayName",
      "warning unknown-field content.website",
    ]);
    const notJson = validateAgainstSpec(sign({ ...m, content: "hello" }), event(metadata));
    expect(notJson.issues).toEqual([
      { severity: "error", code: "content-not-json", path: ["content"], explain: "m.content" },
    ]);
    const array = validateAgainstSpec(sign({ ...m, content: "[]" }), event(metadata));
    expect(array.issues[0]).toMatchObject({ code: "wrong-type", explain: "m.content.object" });
  });

  test("encrypted content: real NIP-44 gift wraps, NIP-04 payloads", () => {
    for (const { wrap } of giftWraps())
      expect(validateAgainstSpec(wrap, event(giftWrap)).issues).toEqual([]);
    const wrap = first(giftWraps()).wrap;
    const plain = validateAgainstSpec({ ...wrap, content: "hello" }, event(giftWrap), {
      verifySignature: false,
    });
    expect(plain.issues).toEqual([
      {
        severity: "error",
        code: "content-not-encrypted",
        path: ["content"],
        params: { scheme: "NIP-44" },
        explain: "gw.content",
      },
    ]);
    const v1 = Buffer.from([1, ...new Uint8Array(120)]).toString("base64");
    expect(
      validateAgainstSpec({ ...wrap, content: v1 }, event(giftWrap), { verifySignature: false })
        .issues[0]?.code,
    ).toBe("content-not-encrypted");

    const payload = ok(nip04Encrypt("hi bob", alice.secretKey, bob.pubkey)).payload;
    const dm = sign({ kind: 4, created_at: 1, tags: [["p", bob.pubkey]], content: payload });
    expect(validateAgainstSpec(dm, event(legacyDm)).issues).toEqual([]);
    const notDm = sign({ ...dm, content: "hi bob" });
    expect(validateAgainstSpec(notDm, event(legacyDm)).issues[0]?.params).toEqual({
      scheme: "NIP-04",
    });
  });

  test("empty content is a warning when the NIP says it should be empty", () => {
    const receipt = first(zaps()).receipt;
    const chatty = sign({ ...receipt, content: "thanks" });
    expect(validateAgainstSpec(chatty, event(zapReceipt)).issues).toContainEqual({
      severity: "warning",
      code: "content-not-empty",
      path: ["content"],
    });
  });

  test("rumors (NIP-59): real chat messages have an id and no signature", () => {
    for (const { rumor: r } of giftWraps())
      expect(validateAgainstSpec(r, event(rumor)).issues).toEqual([]);
    const r = first(giftWraps()).rumor;
    expect(
      summary(validateAgainstSpec({ ...r, sig: "00".repeat(64) }, event(rumor)).issues),
    ).toEqual(["error signature-not-allowed sig"]);
    const { id: _id, ...noId } = r;
    expect(validateAgainstSpec(noId, event(rumor)).issues).toEqual([
      { severity: "info", code: "unsigned", path: [] },
    ]);
    expect(summary(validateAgainstSpec({ ...r, content: "edited" }, event(rumor)).issues)).toEqual([
      "error id-mismatch id",
    ]);
  });

  test("malformed events never throw: every problem has a path", () => {
    const shape = event(zapRequest);
    expect(summary(validateAgainstSpec("nope", shape).issues)).toEqual(["error wrong-type "]);
    expect(summary(validateAgainstSpec({}, shape).issues)).toEqual([
      "error missing-field ",
      "error missing-field ",
      "error missing-field ",
      "error missing-field ",
      "info unsigned ",
    ]);
    const r = validateAgainstSpec(
      {
        id: 5,
        pubkey: "alice",
        created_at: "1735689600",
        kind: -1,
        tags: [["p", 1], "e", [], ["relays", "wss://a.example"]],
        content: 7,
        sig: "abc",
        extra: true,
      },
      shape,
    );
    expect(summary(r.issues)).toEqual([
      "error invalid-hex sig",
      "error invalid-kind kind",
      "error invalid-pubkey pubkey",
      "error tag-too-short tags.2",
      "error wrong-type content",
      "error wrong-type created_at",
      "error wrong-type id",
      "error wrong-type tags.0.1",
      "error wrong-type tags.1",
      "warning unknown-field extra",
    ]);
    expect(
      summary(
        validateAgainstSpec({ kind: 9734, created_at: 1, tags: {}, content: "" }, shape).issues,
      ),
    ).toEqual(["error wrong-type tags", "info unsigned "]);
  });
});

// ── Messages ───────────────────────────────────────────────────────────────────────────────────

const req: WireMessageSpec = {
  id: "req",
  label: "req.label",
  explain: "req",
  direction: "client-to-relay",
  type: "REQ",
  elements: [
    {
      name: "subscription",
      explain: "req.sub",
      schema: { type: "string", field: { type: "text", minLength: 1, maxLength: 64 } },
    },
    { name: "filter", explain: "req.filter", schema: { type: "filter" }, repeatable: true },
  ],
  examples: [],
};

const eventMessage: WireMessageSpec = {
  id: "event",
  label: "ev.label",
  explain: "ev",
  direction: "relay-to-client",
  type: "EVENT",
  elements: [
    { name: "subscription", explain: "ev.sub", schema: { type: "string" } },
    { name: "event", explain: "ev.event", schema: { type: "event", shape: "reaction" } },
  ],
  examples: [],
};

const notice: WireMessageSpec = {
  id: "count",
  label: "c.label",
  explain: "c",
  direction: "relay-to-client",
  type: "COUNT",
  elements: [
    { name: "subscription", explain: "c.sub", schema: { type: "string" } },
    {
      name: "result",
      explain: "c.result",
      schema: {
        type: "object",
        properties: { count: { type: "number", integer: true } },
        required: ["count"],
      },
    },
    { name: "extra", explain: "c.extra", schema: { type: "any" }, optional: true },
  ],
  examples: [],
};

describe("validateAgainstSpec — messages", () => {
  const msg = (part: WireMessageSpec): SpecTarget => ({ kind: "message", part });

  test("REQ with repeatable filters", () => {
    expect(
      validateAgainstSpec(["REQ", "feed", { kinds: [1] }, { authors: [alice.pubkey] }], msg(req))
        .valid,
    ).toBe(true);
    expect(validateAgainstSpec(["REQ", "feed"], msg(req)).issues).toEqual([]);
    expect(summary(validateAgainstSpec(["REQ", "", { kinds: ["1"] }], msg(req)).issues)).toEqual([
      "error too-short 1",
      "error wrong-type 2.kinds.0",
    ]);
    expect(validateAgainstSpec(["REQ", ""], msg(req)).issues[0]?.explain).toBe("req.sub");
  });

  test("type, arity and nested events with shapes", () => {
    const r = first(eventsByKind(7));
    const shapes = { reaction };
    expect(validateAgainstSpec(["EVENT", "sub", r], msg(eventMessage), { shapes }).valid).toBe(
      true,
    );
    expect(validateAgainstSpec(["CLOSE", "sub", r], msg(eventMessage), { shapes }).issues).toEqual([
      {
        severity: "error",
        code: "wrong-message-type",
        path: [0],
        params: { type: "CLOSE", expected: "EVENT" },
        explain: "ev",
      },
    ]);
    expect(summary(validateAgainstSpec([1, "sub", r], msg(eventMessage)).issues)).toEqual([
      "error wrong-type 0",
    ]);
    expect(summary(validateAgainstSpec(["EVENT", "sub"], msg(eventMessage)).issues)).toEqual([
      "error too-few-items ",
    ]);
    expect(summary(validateAgainstSpec(["EVENT", "sub", r, 1], msg(eventMessage)).issues)).toEqual([
      "error too-many-items ",
    ]);
    const note = first(eventsByKind(1));
    expect(
      summary(validateAgainstSpec(["EVENT", "sub", note], msg(eventMessage), { shapes }).issues),
    ).toContain("error wrong-kind 2.kind");
    expect(summary(validateAgainstSpec({}, msg(eventMessage)).issues)).toEqual([
      "error wrong-type ",
    ]);
  });

  test("optional elements", () => {
    expect(validateAgainstSpec(["COUNT", "q", { count: 3 }], msg(notice)).issues).toEqual([]);
    expect(validateAgainstSpec(["COUNT", "q", { count: 3 }, "x"], msg(notice)).issues).toEqual([]);
    expect(
      summary(validateAgainstSpec(["COUNT", "q", { count: 1.5 }, 1, 2], msg(notice)).issues),
    ).toEqual(["error invalid-number 2.count", "error too-many-items "]);
  });
});

// ── Documents, HTTP, encodings ─────────────────────────────────────────────────────────────────

const nostrJson: DocumentSpec = {
  id: "nostr-json",
  label: "nj.label",
  explain: "nj",
  mediaType: "application/json",
  urlTemplate: "https://<domain>/.well-known/nostr.json?name=<local-part>",
  schema: {
    type: "object",
    required: ["names"],
    properties: {
      names: {
        type: "object",
        explain: "nj.names",
        properties: {},
        additionalProperties: { type: "string", field: { type: "pubkey" } },
      },
      relays: {
        type: "object",
        explain: "nj.relays",
        properties: {},
        additionalProperties: {
          type: "array",
          items: { type: "string", field: { type: "relay-url" } },
        },
      },
    },
    additionalProperties: false,
  },
  examples: [],
};

const httpAuth: EventShape = {
  id: "http-auth",
  label: "ha.label",
  explain: "ha",
  kinds: [27235],
  content: { format: "empty" },
  tags: [
    {
      name: "u",
      explain: "ha.u",
      presence: "required",
      repeatable: false,
      fields: [{ name: "url", type: { type: "url" }, explain: "ha.u.url" }],
    },
    {
      name: "method",
      explain: "ha.method",
      presence: "required",
      repeatable: false,
      fields: [
        {
          name: "method",
          type: { type: "enum", values: [{ value: "GET" }, { value: "POST" }] },
          explain: "ha.m",
        },
      ],
    },
  ],
  examples: [],
};

const upload: HttpRequestSpec = {
  id: "upload",
  label: "up.label",
  explain: "up",
  method: "POST",
  urlTemplate: "https://<server>/upload",
  authEvent: "http-auth",
  headers: [
    {
      name: "Authorization",
      explain: "up.auth",
      value: { type: "base64", of: "event" },
      required: true,
    },
    {
      name: "Content-Type",
      explain: "up.ct",
      value: { type: "enum", values: [{ value: "application/json" }] },
      required: false,
    },
  ],
  body: {
    mediaType: "application/json",
    schema: { type: "object", properties: { size: { type: "number" } } },
  },
  responses: [{ status: 200, explain: "up.200" }],
  examples: [],
};

const nprofile: EncodingSpec = {
  id: "nprofile",
  label: "np.label",
  explain: "np",
  codec: "nprofile",
  output: "np.output",
  inputs: [
    { name: "pubkey", type: { type: "pubkey" }, explain: "np.pubkey" },
    {
      name: "relays",
      type: { type: "relay-url" },
      explain: "np.relays",
      optional: true,
      repeatable: true,
    },
    { name: "label", type: { type: "text" }, explain: "np.label.in", optional: true },
  ],
  examples: [],
};

describe("validateAgainstSpec — documents, HTTP, encodings", () => {
  test("NIP-05 nostr.json", () => {
    const doc: SpecTarget = { kind: "document", part: nostrJson };
    const good = {
      names: { alice: alice.pubkey },
      relays: { [alice.pubkey]: ["wss://relay.alpha.example"] },
    };
    expect(validateAgainstSpec(good, doc).valid).toBe(true);
    expect(
      summary(
        validateAgainstSpec({ names: { bob: "npub1" }, relays: { x: "wss://a" } }, doc).issues,
      ),
    ).toEqual(["error invalid-pubkey names.bob", "error wrong-type relays.x"]);
  });

  test("NIP-98 authorized upload with a really signed kind 27235 event", () => {
    const url = "https://files.alpha.example/upload";
    const auth = sign({
      kind: 27235,
      created_at: 1735689600,
      tags: [
        ["u", url],
        ["method", "POST"],
      ],
      content: "",
    });
    const header = `Nostr ${Buffer.from(JSON.stringify(auth)).toString("base64")}`;
    const target: SpecTarget = { kind: "http", part: upload };
    const shapes = { "http-auth": httpAuth };
    const request = {
      url,
      headers: { authorization: header, "Content-Type": "application/json" },
      body: { size: 3 },
    };
    expect(validateAgainstSpec(request, target, { shapes }).issues).toEqual([]);
    // Without the shape, the header is still checked as a signed base64 event.
    expect(validateAgainstSpec(request, target).issues).toEqual([]);

    const wrong = sign({
      kind: 27235,
      created_at: 1,
      tags: [
        ["u", url],
        ["method", "PUT"],
      ],
      content: "",
    });
    const wrongHeader = `Nostr ${Buffer.from(JSON.stringify(wrong)).toString("base64")}`;
    expect(
      summary(
        validateAgainstSpec({ ...request, headers: { Authorization: wrongHeader } }, target, {
          shapes,
        }).issues,
      ),
    ).toEqual(["error invalid-enum headers.Authorization.tags.1.1"]);
    expect(
      summary(
        validateAgainstSpec({ url, headers: { Authorization: "Nostr !!" } }, target, { shapes })
          .issues,
      ),
    ).toEqual(["error invalid-base64 headers.Authorization"]);
    expect(
      summary(
        validateAgainstSpec({ url, headers: { Authorization: "Nostr aGVsbG8=" } }, target, {
          shapes,
        }).issues,
      ),
    ).toEqual(["error invalid-json-string headers.Authorization"]);
    expect(validateAgainstSpec({ url, headers: {} }, target).issues).toEqual([
      {
        severity: "error",
        code: "missing-field",
        path: ["headers"],
        params: { field: "Authorization" },
        explain: "up.auth",
      },
    ]);
    expect(summary(validateAgainstSpec({}, target).issues)).toEqual([
      "error missing-field ",
      "error missing-field headers",
    ]);
    expect(
      summary(
        validateAgainstSpec({ url: "/upload", headers: { Authorization: 1 }, body: [] }, target)
          .issues,
      ),
    ).toEqual([
      "error invalid-url url",
      "error wrong-type body",
      "error wrong-type headers.Authorization",
    ]);
    expect(summary(validateAgainstSpec({ url, headers: [] }, target).issues)).toEqual([
      "error wrong-type headers",
    ]);
    expect(summary(validateAgainstSpec(null, target).issues)).toEqual(["error wrong-type "]);
    const { body: _b, ...withoutBody } = upload;
    expect(
      summary(validateAgainstSpec(request, { kind: "http", part: withoutBody }, { shapes }).issues),
    ).toEqual(["warning unknown-field body"]);
  });

  test("encoding inputs (NIP-19 nprofile)", () => {
    const target: SpecTarget = { kind: "encoding", part: nprofile };
    expect(
      validateAgainstSpec({ pubkey: alice.pubkey, relays: ["wss://relay.alpha.example"] }, target)
        .issues,
    ).toEqual([]);
    expect(
      validateAgainstSpec({ pubkey: alice.pubkey, relays: [], label: "" }, target).issues,
    ).toEqual([]);
    expect(validateAgainstSpec({ pubkey: "" }, target).issues).toEqual([
      {
        severity: "error",
        code: "missing-field",
        path: [],
        params: { field: "pubkey" },
        explain: "np.pubkey",
      },
    ]);
    const bad = validateAgainstSpec({ pubkey: "x", relays: ["https://a"], other: 1 }, target);
    expect(summary(bad.issues)).toEqual([
      "error invalid-pubkey pubkey",
      "error invalid-relay-url relays.0",
      "warning unknown-field other",
    ]);
    expect(bad.issues[1]?.explain).toBe("np.relays");
    expect(
      summary(validateAgainstSpec({ pubkey: alice.pubkey, relays: "wss://a" }, target).issues),
    ).toEqual(["error wrong-type relays"]);
    expect(summary(validateAgainstSpec([], target).issues)).toEqual(["error wrong-type "]);
  });
});

// ── JSON text, helpers, contract ───────────────────────────────────────────────────────────────

describe("validateJsonText and helpers", () => {
  test("parses then validates; a parse failure is one invalid-json issue", () => {
    const target: SpecTarget = { kind: "document", part: nostrJson };
    expect(validateJsonText('{"names":{}}', target).valid).toBe(true);
    expect(validateJsonText('{"names":', target)).toEqual({
      valid: false,
      issues: [{ severity: "error", code: "invalid-json", path: [] }],
    });
  });

  test("describeKinds and jsonTypeOf", () => {
    expect(describeKinds([1, 7, { from: 30000, to: 39999 }])).toBe("1, 7, 30000–39999");
    expect([null, [], {}, "", 1, true].map(jsonTypeOf)).toEqual([
      "null",
      "array",
      "object",
      "string",
      "number",
      "boolean",
    ]);
  });

  test("every issue code is unique (one message each in i18n)", () => {
    expect(new Set(VALIDATION_CODES).size).toBe(VALIDATION_CODES.length);
  });

  test("every fixture event passes the base NIP-01 checks", () => {
    const all: readonly NostrEvent[] = FIXTURE_EVENTS;
    for (const e of all) expect(validateSchema(e, { type: "event" })).toEqual([]);
  });
});
