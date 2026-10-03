/**
 * Spec tests for range r1 (NIPs 01–19), against the real validator and real cryptography:
 * every example validates without errors (signed with its persona's demo key, or hashed as a
 * rumor), deliberately broken variants produce the expected diagnostics, and the values baked
 * into examples (ciphertexts, mined ids, embedded events, bech32 vectors) are what they claim.
 */
import { describe, expect, test } from "bun:test";
import { getNipStrings } from "@nostrschool/i18n";
import {
  computeEventId,
  countLeadingZeroBits,
  deriveSecretKey,
  type EventTemplate,
  encodeNaddr,
  encodeNevent,
  encodeNote,
  encodeNprofile,
  encodeNpub,
  encodeNsec,
  getPublicKey,
  type NostrEvent,
  nip04Decrypt,
  nip44ConversationKey,
  nip44Decrypt,
  parseEventJson,
  signEvent,
  type Tag,
  unwrap,
  verifyEvent,
} from "@nostrschool/protocol";
import type {
  EventShape,
  EventTemplateJson,
  JsonValue,
  NipSpec,
  SpecPart,
  SpecPartKind,
} from "../spec.ts";
import { findSpecPart, specParts, specTextKeys } from "../spec.ts";
import {
  type SpecTarget,
  type ValidationCode,
  type ValidationReport,
  validateAgainstSpec,
  validateSchema,
} from "../validate.ts";
import { NIP_SPECS } from "./index.ts";

const R1 = Array.from({ length: 19 }, (_, i) => String(i + 1).padStart(2, "0"));
/** Same as @nostrschool/fixtures FIXTURE_NOW (nips does not depend on fixtures). */
const FIXTURE_NOW = 1735689600;
/** Same derivation as @nostrschool/fixtures personas; the pubkeys below pin it. */
const personaKey = (id: string): Uint8Array => deriveSecretKey(`nostrschool:persona:${id}`);
const PERSONA_PUBKEYS: { readonly [id: string]: string } = {
  alice: "e550c6e92808f358382b7b8c14345344f5ef9a299529834d1c26d57b6ace44cc",
  bob: "a73883912a48c3551c1548fd454876d577126a61c76b5486c807bfec5869e183",
  carol: "9445888d3235f73f8b627df1fb1d498f2eb3fa76337679c1176965a73d3b68b4",
  dave: "1c028b39e7f3228444b3261e4b718efa92a91470086b44c9a72ef5357e970148",
  erin: "c71750007e42443e5ca8c1ea00babed4e8c78a9cb45dd6db3733d918e0b55deb",
  frank: "922e43b50aec16ad1e9d1ec6854c058816d28b944ae2fe9bdce3d9241bfaafb8",
  grace: "5f69e52aeb38975e54cb99428da837124166abb4198c1128c54491be73d23812",
};

const pk = (persona: string): string => {
  const key = PERSONA_PUBKEYS[persona];
  if (key === undefined) throw new Error(`unknown persona ${persona}`);
  return key;
};

const spec = (id: string): NipSpec => {
  const s = NIP_SPECS[id];
  if (s === undefined) throw new Error(`no spec for NIP-${id}`);
  return s;
};

const part = (nip: string, kind: SpecPartKind, id: string): SpecPart => {
  const p = findSpecPart(spec(nip), { kind, id });
  if (p === undefined) throw new Error(`NIP-${nip} has no ${kind}:${id}`);
  return p;
};

const shapeOf = (nip: string, id: string): EventShape => {
  const p = part(nip, "event", id);
  if (p.kind !== "event") throw new Error("not an event part");
  return p.part;
};

const shapesOf = (s: NipSpec): { readonly [id: string]: EventShape } =>
  Object.fromEntries((s.events ?? []).map((e) => [e.id, e]));

/** A spec template as a protocol EventTemplate (tags as non-empty tuples, a fixed date). */
const withDate = (t: EventTemplateJson): EventTemplate => ({
  ...t,
  created_at: t.created_at ?? FIXTURE_NOW,
  tags: t.tags.map(([name = "", ...values]): Tag => [name, ...values]),
});

const sign = (template: EventTemplateJson, signer = "alice"): NostrEvent =>
  unwrap(signEvent(withDate(template), personaKey(signer), { auxRand: new Uint8Array(32) })).event;

/** A finished event as the editor would produce it: signed, or hashed only for a rumor shape. */
const finish = (shape: EventShape, template: EventTemplateJson, signer = "alice"): JsonValue => {
  if (shape.signature !== "none") return sign(template, signer) as unknown as JsonValue;
  const unsigned = { ...withDate(template), pubkey: pk(signer) };
  return { ...unsigned, id: computeEventId(unsigned).id } as unknown as JsonValue;
};

/** Every example of a part as the value the editor would validate. */
const exampleValues = (
  p: SpecPart,
): readonly { readonly id: string; readonly value: JsonValue }[] => {
  switch (p.kind) {
    case "event":
      return p.part.examples.map((x) => ({
        id: x.id,
        value: finish(p.part, x.template, x.signer),
      }));
    case "message":
      return p.part.examples.map((x) => ({ id: x.id, value: x.message }));
    case "document":
      return p.part.examples.map((x) => ({ id: x.id, value: x.value }));
    case "http":
      return p.part.examples.map(({ id, url, headers, body }) => ({
        id,
        value: body === undefined ? { url, headers } : { url, headers, body },
      }));
    case "encoding":
      return p.part.examples.map((x) => ({ id: x.id, value: x.inputs }));
  }
};

const validate = (nip: string, p: SpecPart, value: unknown): ValidationReport =>
  validateAgainstSpec(value, p as SpecTarget, { shapes: shapesOf(spec(nip)) });

const errors = (r: ValidationReport) =>
  r.issues
    .filter((i) => i.severity === "error")
    .map((i) => `${i.code} at ${JSON.stringify(i.path)} ${JSON.stringify(i.params ?? {})}`);
const codes = (r: ValidationReport): readonly ValidationCode[] => r.issues.map((i) => i.code);

describe("r1 specs are finished", () => {
  test.each(R1)("NIP-%s has a spec, strings and a summary of its own", (id) => {
    const s = spec(id);
    expect(s.todo).toBeUndefined();
    const strings = getNipStrings("en", id);
    expect(strings?.summary.length ?? 0).toBeGreaterThan(40);
    const text = strings?.text ?? {};
    const used = specTextKeys(s);
    expect(used.filter((k) => text[k] === undefined)).toEqual([]);
    expect(Object.keys(text).filter((k) => !used.includes(k))).toEqual([]);
    for (const value of Object.values(text)) expect(value.trim().length).toBeGreaterThan(0);
  });

  test.each(R1)("NIP-%s: 3–6 how-it-works steps, and every part has an example", (id) => {
    const s = spec(id);
    expect(s.howItWorks.length).toBeGreaterThanOrEqual(3);
    expect(s.howItWorks.length).toBeLessThanOrEqual(6);
    for (const p of specParts(s))
      expect(exampleValues(p).length, `${id} ${p.part.id}`).toBeGreaterThan(0);
  });

  test("persona demo keys match the fixtures' pubkeys used in examples", () => {
    for (const [id, pubkey] of Object.entries(PERSONA_PUBKEYS))
      expect(unwrap(getPublicKey(personaKey(id)))).toBe(pubkey);
  });

  // Unrecommended and deprecated NIPs say so first and point at their replacement.
  test.each([
    ["03", []],
    ["04", ["17", "44"]],
    ["06", []],
    ["08", ["27"]],
    ["12", ["01"]],
    ["15", ["99"]],
    ["16", ["01"]],
  ] as const)("NIP-%s leads with its warning and names its replacement", (id, replacedBy) => {
    const s = spec(id);
    const first = s.howItWorks[0]?.id ?? "";
    expect(["warning", "deprecated", "unrecommended", "moved"]).toContain(first);
    expect(s.related.filter((r) => r.relation === "replaced-by").map((r) => r.nip)).toEqual([
      ...replacedBy,
    ]);
  });
});

describe("every r1 example validates against its own spec", () => {
  test.each(R1)("NIP-%s examples have no errors", (id) => {
    for (const p of specParts(spec(id)))
      for (const { id: exampleId, value } of exampleValues(p))
        expect(errors(validate(id, p, value)), `${p.kind}:${p.part.id}/${exampleId}`).toEqual([]);
  });

  test("signed examples are fully valid: id and signature verify", () => {
    for (const id of R1)
      for (const e of spec(id).events ?? [])
        for (const x of e.examples) {
          const report = validate(id, { kind: "event", part: e }, finish(e, x.template, x.signer));
          expect(report.valid, `NIP-${id} ${e.id}/${x.id}`).toBe(true);
          if (e.signature !== "none") expect(codes(report)).not.toContain("unsigned");
        }
  });
});

// ── Deliberately broken variants ─────────────────────────────────────────────────────────────

type Mutate = (value: JsonValue) => JsonValue;
interface Broken {
  readonly nip: string;
  readonly kind: SpecPartKind;
  readonly part: string;
  readonly what: string;
  readonly mutate: Mutate;
  readonly expect: ValidationCode;
  /** Validate the unsigned template (mutations break the signature otherwise). Default true. */
  readonly template?: boolean;
}

type EventLike = {
  readonly tags: readonly (readonly string[])[];
  readonly content: string;
};
const ev = (v: JsonValue): EventLike => v as unknown as EventLike;
const withTags =
  (f: (tags: EventLike["tags"]) => EventLike["tags"]): Mutate =>
  (v) =>
    ({ ...(v as object), tags: f(ev(v).tags) }) as unknown as JsonValue;
const dropTag = (name: string): Mutate => withTags((t) => t.filter((x) => x[0] !== name));
const setTag = (name: string, index: number, value: string): Mutate =>
  withTags((t) => t.map((x) => (x[0] === name ? x.map((y, i) => (i === index ? value : y)) : x)));
const addTag = (...tag: string[]): Mutate => withTags((t) => [...t, tag]);
const setField =
  (key: string, value: JsonValue): Mutate =>
  (v) =>
    ({ ...(v as object), [key]: value }) as unknown as JsonValue;
const setContentJson =
  (patch: object): Mutate =>
  (v) =>
    ({
      ...(v as object),
      content: JSON.stringify({ ...JSON.parse(ev(v).content), ...patch }),
    }) as unknown as JsonValue;
const setAt =
  (index: number, value: JsonValue): Mutate =>
  (v) =>
    (v as readonly JsonValue[]).map((x, i) => (i === index ? value : x));
const setKey =
  (key: string, value: JsonValue): Mutate =>
  (v) =>
    ({ ...(v as object), [key]: value }) as JsonValue;

const ONE_TIME_KEY = "26d011700799dd6f330ae8007ea3f84f490e995ec6be12579c78d4f1a7a0897d";
const HEX64 = "814d487f9a9591bde04009eff371facb26e82f3a41cec1bcdcdab310075053be";

const BROKEN: readonly Broken[] = [
  // NIP-01
  {
    nip: "01",
    kind: "event",
    part: "event",
    what: "kind above 65535",
    mutate: setField("kind", 70000),
    expect: "invalid-kind",
  },
  {
    nip: "01",
    kind: "event",
    part: "event",
    what: "e tag id too short",
    mutate: addTag("e", "abc"),
    expect: "invalid-event-id",
  },
  {
    nip: "01",
    kind: "event",
    part: "event",
    what: "a tag without a coordinate",
    mutate: addTag("a", "30023-nope"),
    expect: "invalid-addr",
  },
  {
    nip: "01",
    kind: "event",
    part: "event",
    what: "relay hint is https",
    mutate: addTag("p", pk("bob"), "https://relay.example"),
    expect: "invalid-relay-url",
  },
  {
    nip: "01",
    kind: "event",
    part: "metadata",
    what: "content is not JSON",
    mutate: setField("content", "alice"),
    expect: "content-not-json",
  },
  {
    nip: "01",
    kind: "event",
    part: "metadata",
    what: "picture is not a URL",
    mutate: setContentJson({ picture: "me.png" }),
    expect: "invalid-url",
  },
  {
    nip: "01",
    kind: "event",
    part: "event",
    what: "tampered content",
    mutate: setField("content", "edited"),
    expect: "id-mismatch",
    template: false,
  },
  {
    nip: "01",
    kind: "message",
    part: "req",
    what: "subscription id too long",
    mutate: setAt(1, "x".repeat(65)),
    expect: "too-long",
  },
  {
    nip: "01",
    kind: "message",
    part: "req",
    what: "empty subscription id",
    mutate: setAt(1, ""),
    expect: "too-short",
  },
  {
    nip: "01",
    kind: "message",
    part: "ok",
    what: "reason without prefix",
    mutate: setAt(3, "you are banned"),
    expect: "pattern-mismatch",
  },
  {
    nip: "01",
    kind: "message",
    part: "ok",
    what: "accepted as a string",
    mutate: setAt(2, "true"),
    expect: "wrong-type",
  },
  {
    nip: "01",
    kind: "message",
    part: "close",
    what: "wrong message type",
    mutate: setAt(0, "CLOSED"),
    expect: "wrong-message-type",
  },
  {
    nip: "01",
    kind: "message",
    part: "client-event",
    what: "event missing sig",
    mutate: setAt(1, { kind: 1, tags: [], content: "x", created_at: FIXTURE_NOW }),
    expect: "missing-field",
  },
  // NIP-02
  {
    nip: "02",
    kind: "event",
    part: "follow-list",
    what: "content is used",
    mutate: setField("content", "hi"),
    expect: "content-not-empty",
  },
  {
    nip: "02",
    kind: "event",
    part: "follow-list",
    what: "petname with a space",
    mutate: setTag("p", 3, "big bob"),
    expect: "pattern-mismatch",
  },
  {
    nip: "02",
    kind: "event",
    part: "follow-list",
    what: "npub instead of hex",
    mutate: addTag("p", "npub1u4gvd6fgpre4swpt0wxpgdzngn67lx3fj55cxnguym2hk6kwgnxqta308g"),
    expect: "invalid-pubkey",
  },
  {
    nip: "02",
    kind: "event",
    part: "follow-list",
    what: "kind 1",
    mutate: setField("kind", 1),
    expect: "wrong-kind",
  },
  // NIP-03
  {
    nip: "03",
    kind: "event",
    part: "attestation",
    what: "no e tag",
    mutate: dropTag("e"),
    expect: "missing-tag",
  },
  {
    nip: "03",
    kind: "event",
    part: "attestation",
    what: "proof not base64",
    mutate: setField("content", "not base64 %%%"),
    expect: "invalid-base64",
  },
  {
    nip: "03",
    kind: "event",
    part: "attestation",
    what: "k is not a kind",
    mutate: setTag("k", 1, "note"),
    expect: "invalid-kind",
  },
  // NIP-04
  {
    nip: "04",
    kind: "event",
    part: "dm",
    what: "plaintext content",
    mutate: setField("content", "hello Bob"),
    expect: "content-not-encrypted",
  },
  {
    nip: "04",
    kind: "event",
    part: "dm",
    what: "no receiver",
    mutate: dropTag("p"),
    expect: "missing-tag",
  },
  {
    nip: "04",
    kind: "event",
    part: "dm",
    what: "two receivers",
    mutate: addTag("p", pk("carol")),
    expect: "duplicate-tag",
  },
  // NIP-05
  {
    nip: "05",
    kind: "document",
    part: "nostr-json",
    what: "no names",
    mutate: () => ({ relays: {} }),
    expect: "missing-field",
  },
  {
    nip: "05",
    kind: "document",
    part: "nostr-json",
    what: "npub instead of hex",
    mutate: setKey("names", {
      alice: "npub1u4gvd6fgpre4swpt0wxpgdzngn67lx3fj55cxnguym2hk6kwgnxqta308g",
    }),
    expect: "invalid-pubkey",
  },
  {
    nip: "05",
    kind: "document",
    part: "nostr-json",
    what: "relay list is a string",
    mutate: setKey("relays", { [pk("alice")]: "wss://relay.alpha.example" }),
    expect: "wrong-type",
  },
  {
    nip: "05",
    kind: "event",
    part: "metadata",
    what: "identifier without a domain",
    mutate: setContentJson({ nip05: "alice" }),
    expect: "pattern-mismatch",
  },
  // NIP-06
  {
    nip: "06",
    kind: "encoding",
    part: "mnemonic",
    what: "too few words",
    mutate: setKey("mnemonic", "leader monkey parrot"),
    expect: "pattern-mismatch",
  },
  {
    nip: "06",
    kind: "encoding",
    part: "mnemonic",
    what: "negative account",
    mutate: setKey("account", "-1"),
    expect: "out-of-range",
  },
  // NIP-08
  {
    nip: "08",
    kind: "event",
    part: "mention",
    what: "mention is not a pubkey",
    mutate: setTag("p", 1, "bob"),
    expect: "invalid-pubkey",
  },
  {
    nip: "08",
    kind: "event",
    part: "mention",
    what: "empty note",
    mutate: setField("content", ""),
    expect: "content-required",
  },
  // NIP-09
  {
    nip: "09",
    kind: "event",
    part: "deletion",
    what: "k is not a kind",
    mutate: setTag("k", 1, "note"),
    expect: "invalid-kind",
  },
  {
    nip: "09",
    kind: "event",
    part: "deletion",
    what: "a tag is not a coordinate",
    mutate: addTag("a", "protocols-not-platforms"),
    expect: "invalid-addr",
  },
  {
    nip: "09",
    kind: "event",
    part: "deletion",
    what: "kind 1",
    mutate: setField("kind", 1),
    expect: "wrong-kind",
  },
  {
    nip: "09",
    kind: "event",
    part: "deletion",
    what: "targets nothing (no e or a tag)",
    mutate: dropTag("e"),
    expect: "missing-one-of",
  },
  // NIP-10
  {
    nip: "10",
    kind: "event",
    part: "text-note",
    what: "two root markers",
    mutate: addTag("e", HEX64, "", "root"),
    expect: "duplicate-tag",
  },
  {
    nip: "10",
    kind: "event",
    part: "text-note",
    what: "positional e tag",
    mutate: addTag("e", HEX64),
    expect: "deprecated",
  },
  {
    nip: "10",
    kind: "event",
    part: "text-note",
    what: "q is a bech32 string",
    mutate: addTag("q", "note1s9x5slu6jkgmmczqp8hlxu06evnwste6g88vr0xum2e3qp6s2wlqz09zra"),
    expect: "pattern-mismatch",
  },
  {
    nip: "10",
    kind: "event",
    part: "text-note",
    what: "empty note",
    mutate: setField("content", ""),
    expect: "content-required",
  },
  // NIP-11
  {
    nip: "11",
    kind: "document",
    part: "relay-info",
    what: "supported_nips as strings",
    mutate: setKey("supported_nips", ["NIP-01"]),
    expect: "wrong-type",
  },
  {
    nip: "11",
    kind: "document",
    part: "relay-info",
    what: "pubkey is an npub",
    mutate: setKey("pubkey", "npub1u4gvd6fgpre4swpt0wxpgdzngn67lx3fj55cxnguym2hk6kwgnxqta308g"),
    expect: "invalid-pubkey",
  },
  {
    nip: "11",
    kind: "document",
    part: "relay-info",
    what: "auth_required as a string",
    mutate: setKey("limitation", { auth_required: "yes" }),
    expect: "wrong-type",
  },
  {
    nip: "11",
    kind: "document",
    part: "relay-info",
    what: "negative max_limit",
    mutate: setKey("limitation", { max_limit: -1 }),
    expect: "out-of-range",
  },
  // NIP-12
  {
    nip: "12",
    kind: "message",
    part: "tag-query",
    what: "not a REQ",
    mutate: setAt(0, "COUNT"),
    expect: "wrong-message-type",
  },
  // NIP-13
  {
    nip: "13",
    kind: "event",
    part: "mined",
    what: "no nonce tag",
    mutate: dropTag("nonce"),
    expect: "missing-tag",
  },
  {
    nip: "13",
    kind: "event",
    part: "mined",
    what: "nonce is not a number",
    mutate: setTag("nonce", 1, "lucky"),
    expect: "invalid-number",
  },
  {
    nip: "13",
    kind: "event",
    part: "mined",
    what: "target above 256 bits",
    mutate: setTag("nonce", 2, "300"),
    expect: "out-of-range",
  },
  // NIP-14
  {
    nip: "14",
    kind: "event",
    part: "with-subject",
    what: "two subjects",
    mutate: addTag("subject", "Again"),
    expect: "duplicate-tag",
  },
  {
    nip: "14",
    kind: "event",
    part: "with-subject",
    what: "empty subject",
    mutate: setTag("subject", 1, ""),
    expect: "too-short",
  },
  // NIP-15
  {
    nip: "15",
    kind: "event",
    part: "stall",
    what: "no d tag",
    mutate: dropTag("d"),
    expect: "missing-tag",
  },
  {
    nip: "15",
    kind: "event",
    part: "stall",
    what: "no shipping zones",
    mutate: (v) => setField("content", JSON.stringify({ id: "x", name: "x", currency: "EUR" }))(v),
    expect: "missing-field",
  },
  {
    nip: "15",
    kind: "event",
    part: "product",
    what: "price as a string",
    mutate: setContentJson({ price: "13.50" }),
    expect: "wrong-type",
  },
  {
    nip: "15",
    kind: "event",
    part: "checkout",
    what: "order in plaintext",
    mutate: setField("content", '{"type":0}'),
    expect: "content-not-encrypted",
  },
  {
    nip: "15",
    kind: "event",
    part: "bid",
    what: "bid is not a number",
    mutate: setField("content", "a lot"),
    expect: "invalid-number",
  },
  {
    nip: "15",
    kind: "event",
    part: "bid-confirmation",
    what: "unknown status",
    mutate: setContentJson({ status: "maybe" }),
    expect: "invalid-enum",
  },
  {
    nip: "15",
    kind: "event",
    part: "auction",
    what: "no duration",
    mutate: (v) =>
      setField(
        "content",
        JSON.stringify({ id: "a", stall_id: "s", name: "n", starting_bid: 1 }),
      )(v),
    expect: "missing-field",
  },
  // NIP-17
  {
    nip: "17",
    kind: "event",
    part: "chat-message",
    what: "a signed rumor",
    mutate: setField("sig", "00".repeat(64)),
    expect: "signature-not-allowed",
    template: false,
  },
  {
    nip: "17",
    kind: "event",
    part: "chat-message",
    what: "no receiver",
    mutate: dropTag("p"),
    expect: "missing-tag",
  },
  {
    nip: "17",
    kind: "event",
    part: "file-message",
    what: "unsupported algorithm",
    mutate: setTag("encryption-algorithm", 1, "aes-cbc"),
    expect: "invalid-enum",
  },
  {
    nip: "17",
    kind: "event",
    part: "file-message",
    what: "no file hash",
    mutate: dropTag("x"),
    expect: "missing-tag",
  },
  {
    nip: "17",
    kind: "event",
    part: "file-message",
    what: "content is not a URL",
    mutate: setField("content", "photo.jpg"),
    expect: "invalid-url",
  },
  {
    nip: "17",
    kind: "event",
    part: "seal",
    what: "plaintext seal",
    mutate: setField("content", "hi"),
    expect: "content-not-encrypted",
  },
  {
    nip: "17",
    kind: "event",
    part: "seal",
    what: "seal with tags",
    mutate: addTag("p", pk("bob")),
    expect: "unknown-tag",
  },
  {
    nip: "17",
    kind: "event",
    part: "gift-wrap",
    what: "no receiver",
    mutate: dropTag("p"),
    expect: "missing-tag",
  },
  {
    nip: "17",
    kind: "event",
    part: "dm-relays",
    what: "https relay",
    mutate: setTag("relay", 1, "https://relay.beta.example"),
    expect: "invalid-relay-url",
  },
  // NIP-18
  {
    nip: "18",
    kind: "event",
    part: "repost",
    what: "no relay in e tag",
    mutate: withTags((t) => t.map((x) => (x[0] === "e" ? x.slice(0, 2) : x))),
    expect: "tag-too-short",
  },
  {
    nip: "18",
    kind: "event",
    part: "repost",
    what: "content is not an event",
    mutate: setField("content", '{"kind":1}'),
    expect: "missing-field",
  },
  {
    nip: "18",
    kind: "event",
    part: "generic-repost",
    what: "a tag is not a coordinate",
    mutate: setTag("a", 1, "protocols"),
    expect: "invalid-addr",
  },
  {
    nip: "18",
    kind: "event",
    part: "quote",
    what: "no q tag",
    mutate: dropTag("q"),
    expect: "missing-tag",
  },
  // NIP-19
  {
    nip: "19",
    kind: "encoding",
    part: "npub",
    what: "npub as input",
    mutate: setKey("pubkey", "npub1u4gvd6fgpre4swpt0wxpgdzngn67lx3fj55cxnguym2hk6kwgnxqta308g"),
    expect: "invalid-pubkey",
  },
  {
    nip: "19",
    kind: "encoding",
    part: "naddr",
    what: "no kind",
    mutate: (v) => Object.fromEntries(Object.entries(v as object).filter(([k]) => k !== "kind")),
    expect: "missing-field",
  },
  {
    nip: "19",
    kind: "encoding",
    part: "nevent",
    what: "relay is https",
    mutate: setKey("relays", ["https://relay.beta.example"]),
    expect: "invalid-relay-url",
  },
];

describe("deliberately broken r1 values produce the expected diagnostic", () => {
  test.each(BROKEN.map((b) => [`NIP-${b.nip} ${b.part}: ${b.what} → ${b.expect}`, b] as const))(
    "%s",
    (_name, b) => {
      const p = part(b.nip, b.kind, b.part);
      const first = exampleValues(p)[0];
      if (first === undefined) throw new Error("no example");
      const example = p.kind === "event" ? p.part.examples[0] : undefined;
      const base =
        p.kind === "event" && b.template !== false && example !== undefined
          ? ({ ...withDate(example.template) } as unknown as JsonValue)
          : first.value;
      expect(codes(validate(b.nip, p, b.mutate(base)))).toContain(b.expect);
    },
  );
});

// ── What the examples claim ─────────────────────────────────────────────────────────────────

const exampleOf = (nip: string, shape: string, id: string) => {
  const x = shapeOf(nip, shape).examples.find((e) => e.id === id);
  if (x === undefined) throw new Error(`no example ${id}`);
  return x;
};

describe("baked-in values are real", () => {
  test("NIP-01 wire messages carry a fixture event that verifies", () => {
    const p = part("01", "message", "client-event");
    if (p.kind !== "message") throw new Error("not a message");
    const event = p.part.examples[0]?.message[1] as unknown as NostrEvent;
    expect(verifyEvent(event).ok).toBe(true);
  });

  test("NIP-04 ciphertext decrypts to the message for Bob", () => {
    const x = exampleOf("04", "dm", "alice-to-bob");
    const text = unwrap(nip04Decrypt(x.template.content, personaKey("bob"), pk("alice")));
    expect(text).toBe("Hey Bob, are you coming to the meetup?");
  });

  test("NIP-13 example is really mined: 16 leading zero bits, committed target 16", () => {
    const x = exampleOf("13", "mined", "mined-16");
    const event = sign(x.template, x.signer);
    expect(event.id.startsWith("0000")).toBe(true);
    expect(countLeadingZeroBits(event.id)).toBeGreaterThanOrEqual(16);
    expect(x.template.tags[0]).toEqual(["nonce", "13569", "16"]);
  });

  test("NIP-15 checkout ciphertexts decrypt to messages that match the plaintext schema", () => {
    const shape = shapeOf("15", "checkout");
    if (shape.content.format !== "encrypted" || shape.content.plaintext.format !== "json")
      throw new Error("checkout content must be encrypted JSON");
    const schema = shape.content.plaintext.schema;
    const decrypt = (id: string, me: string, them: string) =>
      JSON.parse(
        unwrap(
          nip04Decrypt(exampleOf("15", "checkout", id).template.content, personaKey(me), pk(them)),
        ),
      ) as JsonValue;
    const messages = [
      decrypt("order", "frank", "grace"),
      decrypt("payment-request", "grace", "frank"),
      decrypt("status", "grace", "frank"),
    ];
    expect(messages.map((m) => (m as { type: number }).type)).toEqual([0, 1, 2]);
    for (const m of messages)
      expect(validateSchema(m, schema).filter((i) => i.severity === "error")).toEqual([]);
    // A type 1 payment request without options matches none of the three shapes.
    expect(validateSchema({ id: "x", type: 1 }, schema).some((i) => i.severity === "error")).toBe(
      true,
    );
  });

  test("NIP-17 wrap → seal → rumor is the chat-message example, sent by Alice", () => {
    const open = (payload: string, them: string): string =>
      unwrap(nip44Decrypt(payload, unwrap(nip44ConversationKey(personaKey("bob"), them))))
        .plaintext;
    // The fixture wrap was signed by the one-time key 26d0…: Bob decrypts with that pubkey.
    const wrapContent = exampleOf("17", "gift-wrap", "meetup-wrap").template.content;
    const seal = unwrap(parseEventJson(open(wrapContent, ONE_TIME_KEY)));
    expect(verifyEvent(seal).ok).toBe(true);
    expect(seal.pubkey).toBe(pk("alice"));
    expect(seal.content).toBe(exampleOf("17", "seal", "meetup-seal").template.content);
    const rumor = JSON.parse(open(seal.content, seal.pubkey)) as NostrEvent;
    const chat = exampleOf("17", "chat-message", "meetup").template;
    expect(rumor.pubkey).toBe(seal.pubkey);
    expect(rumor.kind).toBe(chat.kind);
    expect(rumor.content).toBe(chat.content);
    expect(rumor.tags).toEqual(withDate(chat).tags);
    expect(rumor.id).toBe(computeEventId(rumor).id);
  });

  test("NIP-18 reposts embed real signed events that match their e tags", () => {
    for (const [shape, id] of [
      ["repost", "note"],
      ["generic-repost", "article"],
    ] as const) {
      const x = exampleOf("18", shape, id);
      const embedded = unwrap(parseEventJson(x.template.content));
      expect(verifyEvent(embedded).ok).toBe(true);
      expect(x.template.tags.find((t) => t[0] === "e")?.[1]).toBe(embedded.id);
    }
  });

  test("NIP-19 examples encode to the spec's test vectors", () => {
    expect(
      unwrap(encodeNpub("7e7e9c42a91bfef19fa929e5fda1b72e0ebc1a4c1141673e2794234d86addf4e")),
    ).toBe("npub10elfcs4fr0l0r8af98jlmgdh9c8tcxjvz9qkw038js35mp4dma8qzvjptg");
    expect(
      unwrap(encodeNsec("67dea2ed018072d675f5415ecfaed7d2597555e202d85b3d65ea4e58d2d92ffa")),
    ).toBe("nsec1vl029mgpspedva04g90vltkh6fvh240zqtv9k0t9af8935ke9laqsnlfe5");
    expect(
      unwrap(
        encodeNprofile({
          pubkey: "3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d",
          relays: ["wss://r.x.com", "wss://djbas.sadkb.com"],
        }),
      ),
    ).toBe(
      "nprofile1qqsrhuxx8l9ex335q7he0f09aej04zpazpl0ne2cgukyawd24mayt8gpp4mhxue69uhhytnc9e3k7mgpz4mhxue69uhkg6nzv9ejuumpv34kytnrdaksjlyr9p",
    );
    // Persona examples encode without error (the editor shows these strings).
    expect(unwrap(encodeNote(HEX64)).startsWith("note1")).toBe(true);
    expect(
      unwrap(
        encodeNevent({
          id: HEX64,
          relays: ["wss://relay.beta.example"],
          author: pk("bob"),
          kind: 1,
        }),
      ).startsWith("nevent1"),
    ).toBe(true);
    expect(
      unwrap(
        encodeNaddr({
          identifier: "protocols-not-platforms",
          pubkey: pk("frank"),
          kind: 30023,
        }),
      ).startsWith("naddr1"),
    ).toBe(true);
  });

  test("NIP-05 example names resolve to the persona keys", () => {
    const p = part("05", "document", "nostr-json");
    if (p.kind !== "document") throw new Error("not a document");
    const alice = p.part.examples[0]?.value as { names: { alice: string } };
    expect(alice.names.alice).toBe(pk("alice"));
  });
});

describe("NIP-09 one-of target", () => {
  test("a deletion request that names only an addressable event (a tag) is valid", () => {
    const shape = shapeOf("09", "deletion");
    const value = finish(
      shape,
      { kind: 5, tags: [["a", `30023:${pk("bob")}:draft`]], content: "" },
      "bob",
    );
    const report = validateAgainstSpec(value, { kind: "event", part: shape });
    expect(report.issues.filter((i) => i.severity === "error")).toEqual([]);
  });
});
