/**
 * Spec tests for range r6 (NIPs with letter ids), against the real validator and real signatures:
 * every example validates without errors (signed with its persona's demo key; NIP-59 rumors get an
 * id but no sig), deliberately broken variants produce the expected diagnostics, and the values
 * baked into examples (ids of other examples, aggregate hashes, an embedded proof, a base64 auth
 * event, a NIP-44 payload, bech32 entities) are what they claim.
 */
import { describe, expect, test } from "bun:test";
import { getNipStrings } from "@nostrschool/i18n";
import {
  computeEventId,
  deriveSecretKey,
  encodeNaddr,
  encodeNevent,
  encodeNpub,
  getPublicKey,
  type NostrEvent,
  nip44ConversationKey,
  nip44Decrypt,
  sha256Hex,
  signEvent,
  unwrap,
  utf8Decode,
  verifyEvent,
} from "@nostrschool/protocol";
import type { EventShape, EventTemplateJson, JsonValue, NipSpec, SpecPart } from "../spec.ts";
import { specParts, specTextKeys } from "../spec.ts";
import { type ValidationCode, type ValidationReport, validateAgainstSpec } from "../validate.ts";
import { NIP_SPECS } from "./index.ts";
import { NIP5A_BLOG_AGGREGATE, NIP5A_FILES, NIP5A_ROOT_AGGREGATE } from "./nip-5A.ts";
import { NIP7D_THREAD_ID } from "./nip-7D.ts";
import { NIPA0_ROOT_ID, NIPA0_VOICE_URL } from "./nip-A0.ts";
import { NIPB7_AUTH, NIPB7_BLOB } from "./nip-B7.ts";
import { NIPC7_GM_ID, NIPC7_GM_NEVENT } from "./nip-C7.ts";
import { NIPCC_ALICE_NPUB, NIPCC_OAK_NADDR, NIPCC_PROOF_JSON } from "./nip-CC.ts";
import {
  NIPEE_EXPORTER_LABEL,
  NIPEE_GROUP_CONTENT,
  NIPEE_GROUP_ID,
  NIPEE_KEY_PACKAGE_ID,
  NIPEE_MLS_MESSAGE,
} from "./nip-EE.ts";
import { ALICE, ALPHA, BETA, BOB, CAROL, DAVE, FIXTURE_NOW, FRANK, GRACE } from "./r6-common.ts";

const R6 = ["5A", "7D", "A0", "A3", "A4", "B0", "B7", "BE", "C0", "C7", "CC", "EE", "F4"];
const personaKey = (id: string): Uint8Array => deriveSecretKey(`nostrschool:persona:${id}`);
const PERSONA_PUBKEYS: { readonly [id: string]: string } = {
  alice: ALICE,
  bob: BOB,
  carol: CAROL,
  dave: DAVE,
  frank: FRANK,
  grace: GRACE,
};

const spec = (id: string): NipSpec => {
  const s = NIP_SPECS[id];
  if (s === undefined) throw new Error(`no spec for NIP-${id}`);
  return s;
};

const shapesOf = (s: NipSpec): { readonly [id: string]: EventShape } =>
  Object.fromEntries((s.events ?? []).map((e) => [e.id, e]));

/** The template as the editor completes it: FIXTURE_NOW when created_at is omitted, typed tags. */
const withTime = (t: EventTemplateJson) => ({
  ...t,
  created_at: t.created_at ?? FIXTURE_NOW,
  tags: t.tags.map(([name = "", ...values]) => [name, ...values] as const),
});

const sign = (template: EventTemplateJson, signer = "alice"): NostrEvent =>
  unwrap(signEvent(withTime(template), personaKey(signer), { auxRand: new Uint8Array(32) })).event;

/** What the editor shows after "sign with demo key": a signed event, or an id-only rumor. */
const finished = (shape: EventShape, template: EventTemplateJson, signer = "alice"): object => {
  if (shape.signature !== "none") return sign(template, signer);
  const pubkey = PERSONA_PUBKEYS[signer] ?? "";
  return {
    ...withTime(template),
    pubkey,
    id: computeEventId({ ...withTime(template), pubkey }).id,
  };
};

const exampleValues = (
  p: SpecPart,
): readonly { readonly id: string; readonly value: unknown }[] => {
  switch (p.kind) {
    case "event":
      return p.part.examples.map((x) => ({
        id: x.id,
        value: finished(p.part, x.template, x.signer),
      }));
    case "message":
      return p.part.examples.map((x) => ({ id: x.id, value: x.message }));
    case "document":
      return p.part.examples.map((x) => ({ id: x.id, value: x.value }));
    case "http":
      return p.part.examples.map((x) => ({
        id: x.id,
        value: {
          url: x.url,
          headers: x.headers,
          ...(x.body === undefined ? {} : { body: x.body }),
        },
      }));
    case "encoding":
      return p.part.examples.map((x) => ({ id: x.id, value: x.inputs }));
  }
};

const validate = (s: NipSpec, p: SpecPart, value: unknown): ValidationReport =>
  validateAgainstSpec(value, p, { shapes: shapesOf(s) });

const errors = (r: ValidationReport) => r.issues.filter((i) => i.severity === "error");
const warnings = (r: ValidationReport) => r.issues.filter((i) => i.severity === "warning");
const codes = (r: ValidationReport): readonly ValidationCode[] => r.issues.map((i) => i.code);

describe("r6 specs are finished", () => {
  test.each(R6)("NIP-%s has a spec, strings and a summary of its own", (id) => {
    const s = spec(id);
    expect(s.todo).toBeUndefined();
    const strings = getNipStrings("en", id);
    expect(strings?.summary).not.toContain("TODO");
    const text = strings?.text ?? {};
    const used = specTextKeys(s);
    expect(used.filter((k) => text[k] === undefined)).toEqual([]);
    expect(Object.keys(text).filter((k) => !used.includes(k))).toEqual([]);
    for (const value of Object.values(text)) expect(value.trim().length).toBeGreaterThan(0);
  });

  test.each(R6)("NIP-%s: every part has an example and there are 3–6 how-it-works steps", (id) => {
    const s = spec(id);
    expect(s.howItWorks.length).toBeGreaterThanOrEqual(3);
    expect(s.howItWorks.length).toBeLessThanOrEqual(6);
    for (const p of specParts(s))
      expect(exampleValues(p).length, `${id} ${p.part.id}`).toBeGreaterThan(0);
  });

  test("unrecommended NIPs open with a status step that names what to use instead", () => {
    for (const id of ["BE", "EE"]) {
      expect(spec(id).howItWorks[0]?.id).toBe("status");
      expect(getNipStrings("en", id)?.summary.startsWith("Unrecommended")).toBe(true);
    }
    expect(getNipStrings("en", "EE")?.text["how.status.body"]).toContain("Marmot");
    expect(getNipStrings("en", "BE")?.text["how.status.body"]).toContain("NIP-77");
  });

  test("persona demo keys match the pubkeys used in the examples", () => {
    for (const [id, pubkey] of Object.entries(PERSONA_PUBKEYS))
      expect(unwrap(getPublicKey(personaKey(id)))).toBe(pubkey);
  });
});

describe("every r6 example validates against its own spec", () => {
  test.each(R6)("NIP-%s examples have no errors", (id) => {
    const s = spec(id);
    for (const p of specParts(s))
      for (const { id: exampleId, value } of exampleValues(p))
        expect(
          errors(validate(s, p, value)),
          `NIP-${id} ${p.kind}:${p.part.id}/${exampleId}`,
        ).toEqual([]);
  });

  test.each(R6)("NIP-%s event templates (unsigned, as the editor starts) get no errors", (id) => {
    const s = spec(id);
    for (const e of s.events ?? [])
      for (const x of e.examples)
        expect(
          errors(validate(s, { kind: "event", part: e }, withTime(x.template))),
          `${e.id}/${x.id}`,
        ).toEqual([]);
  });

  test("only the deliberate 'unknown payto type' example carries a warning", () => {
    const s = spec("A3");
    const [p] = specParts(s);
    if (p === undefined) throw new Error("NIP-A3 has no part");
    const [wallets, unknown] = exampleValues(p);
    expect(warnings(validate(s, p, wallets?.value))).toEqual([]);
    expect(warnings(validate(s, p, unknown?.value)).map((i) => i.code)).toEqual(["invalid-enum"]);
  });
});

// ── Deliberately broken variants ─────────────────────────────────────────────────────────────

type Mutate = (value: JsonValue) => JsonValue;
interface Broken {
  readonly nip: string;
  readonly part: string;
  readonly example?: string;
  readonly what: string;
  readonly mutate: Mutate;
  readonly expect: ValidationCode;
}

type EventLike = { readonly tags: readonly (readonly string[])[]; readonly content: string };
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

const forgedProof = JSON.stringify({ ...JSON.parse(NIPCC_PROOF_JSON), content: "forged" });

const BROKEN: readonly Broken[] = [
  { nip: "5A", part: "root", what: "no path tags", mutate: dropTag("path"), expect: "missing-tag" },
  {
    nip: "5A",
    part: "root",
    what: "path is not absolute",
    mutate: setTag("path", 1, "index.html"),
    expect: "pattern-mismatch",
  },
  {
    nip: "5A",
    part: "root",
    what: "short file hash",
    mutate: setTag("path", 2, "abcd"),
    expect: "invalid-hex",
  },
  {
    nip: "5A",
    part: "root",
    what: "root site with a d tag",
    mutate: addTag("d", "blog"),
    expect: "unknown-tag",
  },
  {
    nip: "5A",
    part: "root",
    what: "x marker is not 'aggregate'",
    mutate: setTag("x", 2, "sha256"),
    expect: "invalid-enum",
  },
  {
    nip: "5A",
    part: "root",
    what: "source is ftp",
    mutate: setTag("source", 1, "ftp://example.com/site"),
    expect: "invalid-url",
  },
  {
    nip: "5A",
    part: "named",
    what: "d tag too long",
    mutate: setTag("d", 1, "my-very-long-blog"),
    expect: "pattern-mismatch",
  },
  {
    nip: "5A",
    part: "named",
    what: "d tag ends with -",
    mutate: setTag("d", 1, "blog-"),
    expect: "pattern-mismatch",
  },
  { nip: "5A", part: "named", what: "no d tag", mutate: dropTag("d"), expect: "missing-tag" },
  { nip: "5A", part: "snapshot", what: "no a tag", mutate: dropTag("a"), expect: "missing-tag" },
  { nip: "5A", part: "snapshot", what: "no x tag", mutate: dropTag("x"), expect: "missing-tag" },
  {
    nip: "5A",
    part: "snapshot",
    what: "a points at a note kind",
    mutate: setTag("a", 1, `1:${ALICE}:blog`),
    expect: "kind-not-allowed",
  },
  {
    nip: "7D",
    part: "thread",
    what: "two titles",
    mutate: addTag("title", "Again"),
    expect: "duplicate-tag",
  },
  {
    nip: "7D",
    part: "thread",
    what: "empty post",
    mutate: setField("content", ""),
    expect: "content-required",
  },
  {
    nip: "7D",
    part: "thread",
    what: "kind 1 instead of 11",
    mutate: setField("kind", 1),
    expect: "wrong-kind",
  },
  { nip: "7D", part: "reply", what: "no root E", mutate: dropTag("E"), expect: "missing-tag" },
  {
    nip: "7D",
    part: "reply",
    what: "K is not 11",
    mutate: setTag("K", 1, "1"),
    expect: "kind-not-allowed",
  },
  {
    nip: "A0",
    part: "voice",
    what: "content is not a URL",
    mutate: setField("content", "listen to this"),
    expect: "invalid-url",
  },
  {
    nip: "A0",
    part: "voice",
    what: "imeta without url first",
    mutate: setTag("imeta", 1, "m audio/mp4"),
    expect: "pattern-mismatch",
  },
  {
    nip: "A0",
    part: "voice",
    what: "imeta property without value",
    mutate: setTag("imeta", 4, "duration"),
    expect: "pattern-mismatch",
  },
  { nip: "A0", part: "reply", what: "no parent e", mutate: dropTag("e"), expect: "missing-tag" },
  {
    nip: "A0",
    part: "reply",
    what: "kind 1222 as reply",
    mutate: setField("kind", 1222),
    expect: "wrong-kind",
  },
  {
    nip: "A3",
    part: "targets",
    what: "no payto tags",
    mutate: dropTag("payto"),
    expect: "missing-tag",
  },
  {
    nip: "A3",
    part: "targets",
    what: "payto without address",
    mutate: withTags((t) => t.map((x) => x.slice(0, 2))),
    expect: "tag-too-short",
  },
  {
    nip: "A3",
    part: "targets",
    what: "content not empty",
    mutate: setField("content", "pay me"),
    expect: "content-not-empty",
  },
  { nip: "A4", part: "message", what: "no receiver", mutate: dropTag("p"), expect: "missing-tag" },
  {
    nip: "A4",
    part: "message",
    what: "an e tag",
    mutate: addTag("e", NIPC7_GM_ID),
    expect: "deprecated",
  },
  {
    nip: "A4",
    part: "message",
    what: "expiration in milliseconds",
    mutate: setTag("expiration", 1, "1736294400000"),
    expect: "invalid-timestamp",
  },
  {
    nip: "A4",
    part: "message",
    example: "quote",
    what: "q target is a note1",
    mutate: setTag("q", 1, "note1xyz"),
    expect: "pattern-mismatch",
  },
  {
    nip: "B0",
    part: "bookmark",
    what: "d keeps https://",
    mutate: setTag("d", 1, "https://github.com/nostr-protocol/nips"),
    expect: "pattern-mismatch",
  },
  { nip: "B0", part: "bookmark", what: "no d tag", mutate: dropTag("d"), expect: "missing-tag" },
  {
    nip: "B0",
    part: "bookmark",
    what: "published_at is a date",
    mutate: setTag("published_at", 1, "2025-01-01"),
    expect: "invalid-timestamp",
  },
  {
    nip: "B7",
    part: "servers",
    what: "server is a relay URL",
    mutate: setTag("server", 1, ALPHA),
    expect: "invalid-url",
  },
  {
    nip: "B7",
    part: "servers",
    what: "no servers",
    mutate: dropTag("server"),
    expect: "missing-tag",
  },
  {
    nip: "B7",
    part: "auth",
    what: "no expiration",
    mutate: dropTag("expiration"),
    expect: "missing-tag",
  },
  {
    nip: "B7",
    part: "auth",
    what: "x is not a sha256",
    mutate: setTag("x", 1, "voice-note.m4a"),
    expect: "invalid-hex",
  },
  {
    nip: "B7",
    part: "auth",
    what: "unknown verb",
    mutate: setTag("t", 1, "rename"),
    expect: "invalid-enum",
  },
  {
    nip: "B7",
    part: "upload",
    what: "no Authorization header",
    mutate: setField("headers", {}),
    expect: "missing-field",
  },
  {
    nip: "B7",
    part: "upload",
    what: "Authorization is not base64",
    mutate: setField("headers", { Authorization: "Nostr %%%" }),
    expect: "invalid-base64",
  },
  {
    nip: "B7",
    part: "upload",
    what: "auth event of the wrong kind",
    mutate: setField("headers", {
      Authorization: `Nostr ${btoa(JSON.stringify(sign({ kind: 27235, tags: [], content: "" })))}`,
    }),
    expect: "wrong-kind",
  },
  {
    nip: "C0",
    part: "snippet",
    what: "language in upper case",
    mutate: setTag("l", 1, "JavaScript"),
    expect: "pattern-mismatch",
  },
  {
    nip: "C0",
    part: "snippet",
    what: "extension with a dot",
    mutate: setTag("extension", 1, ".js"),
    expect: "pattern-mismatch",
  },
  {
    nip: "C0",
    part: "snippet",
    what: "repo neither URL nor 30617 address",
    mutate: setTag("repo", 1, `30023:${BOB}:x`),
    expect: "pattern-mismatch",
  },
  {
    nip: "C0",
    part: "snippet",
    what: "empty code",
    mutate: setField("content", ""),
    expect: "content-required",
  },
  {
    nip: "C7",
    part: "chat",
    example: "reply",
    what: "q is not an event id",
    mutate: setTag("q", 1, "nevent1abc"),
    expect: "invalid-event-id",
  },
  {
    nip: "C7",
    part: "chat",
    what: "kind 1 note",
    mutate: setField("kind", 1),
    expect: "wrong-kind",
  },
  {
    nip: "CC",
    part: "listing",
    what: "difficulty 6",
    mutate: setTag("D", 1, "6"),
    expect: "out-of-range",
  },
  {
    nip: "CC",
    part: "listing",
    what: "terrain 2.5",
    mutate: setTag("T", 1, "2.5"),
    expect: "invalid-number",
  },
  {
    nip: "CC",
    part: "listing",
    what: "unknown size",
    mutate: setTag("S", 1, "huge"),
    expect: "invalid-enum",
  },
  {
    nip: "CC",
    part: "listing",
    what: "geohash with 'a'",
    mutate: setTag("g", 1, "u4a"),
    expect: "pattern-mismatch",
  },
  { nip: "CC", part: "listing", what: "no name", mutate: dropTag("name"), expect: "missing-tag" },
  {
    nip: "CC",
    part: "listing",
    what: "verification is not a pubkey",
    mutate: setTag("verification", 1, "qr-code"),
    expect: "invalid-pubkey",
  },
  {
    nip: "CC",
    part: "found",
    what: "a points at a curation list",
    mutate: setTag("a", 1, `37517:${FRANK}:park-trail`),
    expect: "kind-not-allowed",
  },
  {
    nip: "CC",
    part: "found",
    what: "proof is not JSON",
    mutate: setTag("verification", 1, "{nope"),
    expect: "invalid-json-string",
  },
  {
    nip: "CC",
    part: "found",
    what: "proof tampered with",
    mutate: setTag("verification", 1, forgedProof),
    expect: "id-mismatch",
  },
  {
    nip: "CC",
    part: "proof",
    what: "content in another format",
    mutate: setField("content", "I was here"),
    expect: "pattern-mismatch",
  },
  {
    nip: "CC",
    part: "proof",
    what: "a without the naddr",
    mutate: setTag("a", 1, ALICE),
    expect: "pattern-mismatch",
  },
  {
    nip: "CC",
    part: "comment",
    what: "unknown log type",
    mutate: setTag("t", 1, "found"),
    expect: "invalid-enum",
  },
  { nip: "CC", part: "comment", what: "no K tag", mutate: dropTag("K"), expect: "missing-tag" },
  { nip: "CC", part: "curation", what: "no caches", mutate: dropTag("a"), expect: "missing-tag" },
  {
    nip: "EE",
    part: "key-package",
    what: "MLS version 2.0",
    mutate: setTag("mls_protocol_version", 1, "2.0"),
    expect: "invalid-enum",
  },
  {
    nip: "EE",
    part: "key-package",
    what: "ciphersuite as a name",
    mutate: setTag("ciphersuite", 1, "MLS_128_DHKEMX25519"),
    expect: "pattern-mismatch",
  },
  {
    nip: "EE",
    part: "key-package",
    what: "content not hex",
    mutate: setField("content", "not hex"),
    expect: "pattern-mismatch",
  },
  {
    nip: "EE",
    part: "key-package",
    what: "no relays tag",
    mutate: dropTag("relays"),
    expect: "missing-tag",
  },
  {
    nip: "EE",
    part: "welcome",
    what: "welcome carries a signature",
    mutate: setField("sig", "00".repeat(64)),
    expect: "signature-not-allowed",
  },
  {
    nip: "EE",
    part: "welcome",
    what: "no key package reference",
    mutate: dropTag("e"),
    expect: "missing-tag",
  },
  {
    nip: "EE",
    part: "group-event",
    what: "plaintext content",
    mutate: setField("content", NIPEE_MLS_MESSAGE),
    expect: "content-not-encrypted",
  },
  {
    nip: "EE",
    part: "group-event",
    what: "group id too short",
    mutate: setTag("h", 1, "abcd"),
    expect: "invalid-hex",
  },
  {
    nip: "F4",
    part: "show",
    what: "unknown role",
    mutate: setTag("p", 2, "producer"),
    expect: "invalid-enum",
  },
  {
    nip: "F4",
    part: "authored",
    what: "no podcasts listed",
    mutate: dropTag("p"),
    expect: "missing-tag",
  },
  { nip: "F4", part: "episode", what: "no audio", mutate: dropTag("audio"), expect: "missing-tag" },
  {
    nip: "F4",
    part: "episode",
    what: "audio type not audio/*",
    mutate: setTag("audio", 2, "video/mp4"),
    expect: "pattern-mismatch",
  },
  {
    nip: "F4",
    part: "episode",
    what: "image is not a URL",
    mutate: setTag("image", 1, "cover.jpg"),
    expect: "invalid-url",
  },
];

describe("broken r6 values produce the expected diagnostics", () => {
  test.each(BROKEN.map((b) => [`NIP-${b.nip} ${b.part}: ${b.what} → ${b.expect}`, b] as const))(
    "%s",
    (_, b) => {
      const s = spec(b.nip);
      const p = specParts(s).find((x) => x.part.id === b.part);
      if (p === undefined) throw new Error(`NIP-${b.nip} has no part ${b.part}`);
      // Events are broken on the unsigned template so the change isn't masked by id-mismatch.
      const base =
        p.kind === "event"
          ? (p.part.examples.find((x) => b.example === undefined || x.id === b.example)
              ?.template as unknown as JsonValue)
          : (exampleValues(p)[0]?.value as JsonValue);
      if (base === undefined) throw new Error(`NIP-${b.nip} ${b.part} has no example`);
      expect(codes(validate(s, p, b.mutate(base)))).toContain(b.expect);
    },
  );
});

// ── Baked-in values ──────────────────────────────────────────────────────────────────────────

const exampleTemplate = (nip: string, part: string, example: string): EventTemplateJson => {
  const x = spec(nip)
    .events?.find((e) => e.id === part)
    ?.examples.find((e) => e.id === example);
  if (x === undefined) throw new Error(`NIP-${nip} ${part}/${example} not found`);
  return x.template;
};
const exampleId = (nip: string, part: string, example: string, signer: string): string => {
  const pubkey = PERSONA_PUBKEYS[signer] ?? "";
  return computeEventId({ ...withTime(exampleTemplate(nip, part, example)), pubkey }).id;
};
const tagsOf = (nip: string, part: string, example: string) =>
  exampleTemplate(nip, part, example).tags;
const aggregate = (tags: readonly (readonly string[])[]): string =>
  sha256Hex(
    tags
      .filter((t) => t[0] === "path")
      .map((t) => `${t[2]} ${t[1]}\n`)
      .sort()
      .join(""),
  );

describe("ids and payloads baked into r6 examples", () => {
  test("NIP-7D reply points at the thread's id", () => {
    expect(exampleId("7D", "thread", "home-relays", "alice")).toBe(NIP7D_THREAD_ID);
    expect(tagsOf("7D", "reply", "answer")).toContainEqual(["E", NIP7D_THREAD_ID, ALPHA, ALICE]);
  });

  test("NIP-C7 reply quotes the GM message by id and nevent", () => {
    expect(exampleId("C7", "chat", "gm", "alice")).toBe(NIPC7_GM_ID);
    expect(unwrap(encodeNevent({ id: NIPC7_GM_ID, relays: [ALPHA], author: ALICE, kind: 9 }))).toBe(
      NIPC7_GM_NEVENT,
    );
    expect(
      exampleTemplate("C7", "chat", "reply").content.startsWith(`nostr:${NIPC7_GM_NEVENT}\n`),
    ).toBe(true);
  });

  test("NIP-A0 reply points at Bob's voice message, whose imeta url matches the content", () => {
    expect(exampleId("A0", "voice", "intro", "bob")).toBe(NIPA0_ROOT_ID);
    expect(exampleTemplate("A0", "voice", "intro").content).toBe(NIPA0_VOICE_URL);
    expect(tagsOf("A0", "voice", "intro")[0]?.[1]).toBe(`url ${NIPA0_VOICE_URL}`);
  });

  test("NIP-A4 quote names Frank's article in the content and the q tag", () => {
    const naddr = unwrap(
      encodeNaddr({
        kind: 30023,
        pubkey: FRANK,
        identifier: "protocols-not-platforms",
        relays: [BETA],
      }),
    );
    expect(exampleTemplate("A4", "message", "quote").content).toContain(`nostr:${naddr}`);
  });

  test("NIP-5A aggregate hashes are computed from the path tags", () => {
    expect(sha256Hex("nostrschool:nsite:/index.html")).toBe(NIP5A_FILES["/index.html"]);
    const root = tagsOf("5A", "root", "homepage");
    expect(aggregate(root)).toBe(NIP5A_ROOT_AGGREGATE);
    expect(root).toContainEqual(["x", NIP5A_ROOT_AGGREGATE, "aggregate"]);
    for (const [part, example] of [
      ["named", "blog"],
      ["named", "copy"],
      ["snapshot", "blog-v1"],
    ] as const) {
      const tags = tagsOf("5A", part, example);
      expect(aggregate(tags)).toBe(NIP5A_BLOG_AGGREGATE);
      expect(tags).toContainEqual(["x", NIP5A_BLOG_AGGREGATE, "aggregate"]);
    }
  });

  test("NIP-B7 upload carries Alice's signed kind 24242 permission for the blob", () => {
    const auth = JSON.parse(utf8Decode(Uint8Array.from(atob(NIPB7_AUTH), (c) => c.charCodeAt(0))));
    expect(verifyEvent(auth).ok).toBe(true);
    expect(auth).toMatchObject({ kind: 24242, pubkey: ALICE });
    expect(auth.tags).toEqual(exampleTemplate("B7", "auth", "upload").tags);
    expect(auth.tags).toContainEqual(["x", NIPB7_BLOB]);
  });

  test("NIP-CC proof is signed by the cache's verification key and names finder and cache", () => {
    const proof = JSON.parse(NIPCC_PROOF_JSON);
    expect(verifyEvent(proof).ok).toBe(true);
    expect(proof.pubkey).toBe(GRACE);
    expect(tagsOf("CC", "listing", "old-oak")).toContainEqual(["verification", GRACE]);
    expect(unwrap(encodeNpub(ALICE))).toBe(NIPCC_ALICE_NPUB);
    expect(
      unwrap(encodeNaddr({ kind: 37516, pubkey: FRANK, identifier: "old-oak", relays: [ALPHA] })),
    ).toBe(NIPCC_OAK_NADDR);
    expect(proof).toMatchObject({
      ...withTime(exampleTemplate("CC", "proof", "proof")),
      id: exampleId("CC", "proof", "proof", "grace"),
    });
    // The finder in the proof is the author of the log that embeds it.
    expect(proof.tags[0][1].split(":")[0]).toBe(ALICE);
  });

  test("NIP-EE welcome points at Bob's KeyPackage and the group event decrypts", () => {
    expect(exampleId("EE", "key-package", "bob-package", "bob")).toBe(NIPEE_KEY_PACKAGE_ID);
    expect(tagsOf("EE", "welcome", "welcome-bob")[0]).toEqual(["e", NIPEE_KEY_PACKAGE_ID]);
    expect(NIPEE_GROUP_ID).toBe(sha256Hex("nostrschool:mls:group"));
    const secret = deriveSecretKey(NIPEE_EXPORTER_LABEL);
    const key = unwrap(nip44ConversationKey(secret, unwrap(getPublicKey(secret))));
    expect(unwrap(nip44Decrypt(NIPEE_GROUP_CONTENT, key)).plaintext).toBe(NIPEE_MLS_MESSAGE);
  });
});
