/**
 * Spec tests for range r2 (NIPs 20–39), against the real validator and real signatures:
 * every example validates without errors (signed with its persona's demo key), deliberately
 * broken variants produce the expected diagnostics, and the cross-references baked into
 * examples (ids of other examples, a base64 auth event, encrypted drafts) are what they claim.
 */
import { describe, expect, test } from "bun:test";
import { getNipStrings } from "@nostrschool/i18n";
import {
  computeEventId,
  deriveSecretKey,
  getPublicKey,
  type NostrEvent,
  nip44ConversationKey,
  nip44Decrypt,
  signEvent,
  type Tag,
  unwrap,
  utf8Decode,
  verifyEvent,
} from "@nostrschool/protocol";
import type { EventShape, EventTemplateJson, JsonValue, NipSpec, SpecPart } from "../spec.ts";
import { specParts, specTextKeys } from "../spec.ts";
import { type ValidationCode, type ValidationReport, validateAgainstSpec } from "../validate.ts";
import { NIP_SPECS } from "./index.ts";
import { NIP22_FIRST_COMMENT_ID } from "./nip-22.ts";
import { NIP26_CONDITIONS, NIP26_TOKEN } from "./nip-26.ts";
import { NIP28_CHANNEL_ID } from "./nip-28.ts";
import { NIP29_CHAT_ID, NIP29_LIVEKIT_AUTH } from "./nip-29.ts";
import { NIP34_PATCH_ID, NIP34_PR_ID } from "./nip-34.ts";
import { NIP35_TORRENT_ID } from "./nip-35.ts";

const R2 = Array.from({ length: 20 }, (_, i) => String(20 + i));
/** Same as @nostrschool/fixtures FIXTURE_NOW (nips does not depend on fixtures). */
const FIXTURE_NOW = 1735689600;
/** Same derivation as @nostrschool/fixtures personas; the pubkeys below pin it. */
const personaKey = (id: string): Uint8Array => deriveSecretKey(`nostrschool:persona:${id}`);
const PERSONA_PUBKEYS = {
  alice: "e550c6e92808f358382b7b8c14345344f5ef9a299529834d1c26d57b6ace44cc",
  bob: "a73883912a48c3551c1548fd454876d577126a61c76b5486c807bfec5869e183",
  carol: "9445888d3235f73f8b627df1fb1d498f2eb3fa76337679c1176965a73d3b68b4",
  dave: "1c028b39e7f3228444b3261e4b718efa92a91470086b44c9a72ef5357e970148",
  erin: "c71750007e42443e5ca8c1ea00babed4e8c78a9cb45dd6db3733d918e0b55deb",
  frank: "922e43b50aec16ad1e9d1ec6854c058816d28b944ae2fe9bdce3d9241bfaafb8",
  grace: "5f69e52aeb38975e54cb99428da837124166abb4198c1128c54491be73d23812",
} as const;
const pubkeyOf = (id: string): string => {
  const pubkey = (PERSONA_PUBKEYS as { readonly [id: string]: string })[id];
  if (pubkey === undefined) throw new Error(`unknown persona ${id}`);
  return pubkey;
};
/** Spec templates use plain string arrays; protocol wants non-empty tags. */
const asTags = (tags: EventTemplateJson["tags"]): readonly Tag[] =>
  tags.map(([name = "", ...rest]) => [name, ...rest] as const);

const spec = (id: string): NipSpec => {
  const s = NIP_SPECS[id];
  if (s === undefined) throw new Error(`no spec for NIP-${id}`);
  return s;
};

const shapesOf = (s: NipSpec): { readonly [id: string]: EventShape } =>
  Object.fromEntries((s.events ?? []).map((e) => [e.id, e]));

const sign = (template: EventTemplateJson, signer = "alice"): NostrEvent =>
  unwrap(
    signEvent(
      { ...template, tags: asTags(template.tags), created_at: template.created_at ?? FIXTURE_NOW },
      personaKey(signer),
      {
        auxRand: new Uint8Array(32),
      },
    ),
  ).event;

/** Every example of a part as the value the editor would validate. */
const exampleValues = (
  p: SpecPart,
): readonly { readonly id: string; readonly value: unknown }[] => {
  switch (p.kind) {
    case "event":
      return p.part.examples.map((x) => ({ id: x.id, value: sign(x.template, x.signer) }));
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
  validateAgainstSpec(
    value,
    { kind: p.kind, part: p.part } as Parameters<typeof validateAgainstSpec>[1],
    {
      shapes: shapesOf(s),
    },
  );

const errors = (r: ValidationReport) => r.issues.filter((i) => i.severity === "error");
const codes = (r: ValidationReport): readonly ValidationCode[] => r.issues.map((i) => i.code);

describe("r2 specs are finished", () => {
  test.each(R2)("NIP-%s has a spec, strings and a summary of its own", (id) => {
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

  test.each(R2)("NIP-%s: every part has at least one example and a how-it-works step", (id) => {
    const s = spec(id);
    expect(s.howItWorks.length).toBeGreaterThanOrEqual(3);
    for (const p of specParts(s))
      expect(exampleValues(p).length, `${id} ${p.part.id}`).toBeGreaterThan(0);
  });

  test("persona demo keys match the fixtures' pubkeys used in examples", () => {
    for (const [id, pubkey] of Object.entries(PERSONA_PUBKEYS))
      expect(unwrap(getPublicKey(personaKey(id)))).toBe(pubkey);
  });
});

describe("every r2 example validates against its own spec", () => {
  test.each(R2)("NIP-%s examples have no errors", (id) => {
    const s = spec(id);
    for (const p of specParts(s))
      for (const { id: exampleId, value } of exampleValues(p))
        expect(
          errors(validate(s, p, value)),
          `NIP-${id} ${p.kind}:${p.part.id}/${exampleId}`,
        ).toEqual([]);
  });

  test.each(R2)(
    "NIP-%s event templates (unsigned, as the editor starts) only get infos/warnings",
    (id) => {
      const s = spec(id);
      for (const e of s.events ?? [])
        for (const x of e.examples) {
          const report = validate(
            s,
            { kind: "event", part: e },
            { created_at: FIXTURE_NOW, ...x.template },
          );
          expect(errors(report), `NIP-${id} ${e.id}/${x.id}`).toEqual([]);
        }
    },
  );
});

// ── Deliberately broken variants ─────────────────────────────────────────────────────────────

type Mutate = (value: JsonValue) => JsonValue;
interface Broken {
  readonly nip: string;
  readonly part: string;
  readonly what: string;
  readonly mutate: Mutate;
  readonly expect: ValidationCode;
}

type EventLike = {
  readonly tags: readonly (readonly string[])[];
  readonly content: string;
  readonly kind: number;
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

const BROKEN: readonly Broken[] = [
  {
    nip: "20",
    part: "ok",
    what: "accepted is a string",
    mutate: (v) => ["OK", (v as string[])[1] ?? "", "true", ""],
    expect: "wrong-type",
  },
  {
    nip: "20",
    part: "ok",
    what: "unknown prefix",
    mutate: (v) => ["OK", (v as string[])[1] ?? "", false, "nope: denied"],
    expect: "pattern-mismatch",
  },
  {
    nip: "20",
    part: "ok",
    what: "short event id",
    mutate: () => ["OK", "abc", true, ""],
    expect: "invalid-event-id",
  },
  {
    nip: "20",
    part: "ok",
    what: "wrong message type",
    mutate: (v) => ["NOTICE", ...(v as JsonValue[]).slice(1)],
    expect: "wrong-message-type",
  },
  {
    nip: "21",
    part: "uri",
    what: "nsec is not linkable",
    mutate: () => ({ entity: "nsec1vl029mgpspedva04g90vltkh6fvh240zqtv9k0t9af8935ke9laqsnlfe5" }),
    expect: "invalid-bech32",
  },
  { nip: "21", part: "uri", what: "missing entity", mutate: () => ({}), expect: "missing-field" },
  { nip: "22", part: "comment", what: "no K tag", mutate: dropTag("K"), expect: "missing-tag" },
  { nip: "22", part: "comment", what: "no k tag", mutate: dropTag("k"), expect: "missing-tag" },
  {
    nip: "22",
    part: "comment",
    what: "bad root address",
    mutate: setTag("A", 1, "30023:nope"),
    expect: "invalid-addr",
  },
  {
    nip: "22",
    part: "comment",
    what: "empty comment",
    mutate: setField("content", ""),
    expect: "content-required",
  },
  {
    nip: "22",
    part: "comment",
    what: "wrong kind",
    mutate: setField("kind", 1),
    expect: "wrong-kind",
  },
  {
    nip: "22",
    part: "comment",
    what: "root is a kind 1 note (NIP-10 territory)",
    mutate: setTag("K", 1, "1"),
    expect: "pattern-mismatch",
  },
  {
    nip: "22",
    part: "comment",
    what: "parent is a kind 1 note (NIP-10 territory)",
    mutate: setTag("k", 1, "1"),
    expect: "pattern-mismatch",
  },
  {
    nip: "22",
    part: "comment",
    what: "no root tag (none of E/A/I)",
    mutate: withTags((t) => t.filter((x) => !["E", "A", "I"].includes(x[0] ?? ""))),
    expect: "missing-one-of",
  },
  {
    nip: "22",
    part: "comment",
    what: "no parent tag (none of e/a/i)",
    mutate: withTags((t) => t.filter((x) => !["e", "a", "i"].includes(x[0] ?? ""))),
    expect: "missing-one-of",
  },
  { nip: "23", part: "article", what: "no d tag", mutate: dropTag("d"), expect: "missing-tag" },
  {
    nip: "23",
    part: "draft",
    what: "draft without d tag",
    mutate: dropTag("d"),
    expect: "missing-tag",
  },
  {
    nip: "23",
    part: "draft",
    what: "draft in plain text",
    mutate: setField("content", "# Not encrypted"),
    expect: "content-not-encrypted",
  },
  {
    nip: "23",
    part: "article",
    what: "published_at not a timestamp",
    mutate: setTag("published_at", 1, "yesterday"),
    expect: "invalid-timestamp",
  },
  {
    nip: "23",
    part: "article",
    what: "uppercase hashtag",
    mutate: setTag("t", 1, "Nostr"),
    expect: "pattern-mismatch",
  },
  {
    nip: "23",
    part: "article",
    what: "two titles",
    mutate: addTag("title", "Again"),
    expect: "duplicate-tag",
  },
  {
    nip: "24",
    part: "profile",
    what: "bot is a string",
    mutate: setContentJson({ bot: "yes" }),
    expect: "wrong-type",
  },
  {
    nip: "24",
    part: "profile",
    what: "month 13",
    mutate: setContentJson({ birthday: { month: 13 } }),
    expect: "out-of-range",
  },
  {
    nip: "24",
    part: "profile",
    what: "deprecated displayName",
    mutate: setContentJson({ displayName: "Erin" }),
    expect: "deprecated",
  },
  {
    nip: "24",
    part: "profile",
    what: "content is not JSON",
    mutate: setField("content", "erin"),
    expect: "content-not-json",
  },
  {
    nip: "24",
    part: "tags",
    what: "r is not a URL",
    mutate: setTag("r", 1, "not a url"),
    expect: "invalid-url",
  },
  { nip: "25", part: "reaction", what: "no e tag", mutate: dropTag("e"), expect: "missing-tag" },
  {
    nip: "25",
    part: "reaction",
    what: "k is not a kind",
    mutate: setTag("k", 1, "note"),
    expect: "invalid-kind",
  },
  {
    nip: "25",
    part: "reaction",
    what: "bad emoji shortcode",
    mutate: addTag("emoji", "ostrich!", "https://emoji.example.com/o.png"),
    expect: "pattern-mismatch",
  },
  { nip: "25", part: "external", what: "no i tag", mutate: dropTag("i"), expect: "missing-tag" },
  {
    nip: "26",
    part: "delegated",
    what: "malformed conditions",
    mutate: setTag("delegation", 2, "kind==1"),
    expect: "pattern-mismatch",
  },
  {
    nip: "26",
    part: "delegated",
    what: "short token",
    mutate: setTag("delegation", 3, "abcd"),
    expect: "invalid-hex",
  },
  {
    nip: "26",
    part: "delegated",
    what: "no delegation tag",
    mutate: dropTag("delegation"),
    expect: "missing-tag",
  },
  {
    nip: "27",
    part: "note",
    what: "q target neither id nor address",
    mutate: addTag("q", "note1xyz"),
    expect: "pattern-mismatch",
  },
  {
    nip: "27",
    part: "note",
    what: "p is not a pubkey",
    mutate: setTag("p", 1, "bob"),
    expect: "invalid-pubkey",
  },
  {
    nip: "28",
    part: "create",
    what: "content not JSON",
    mutate: setField("content", "Relay operators"),
    expect: "content-not-json",
  },
  {
    nip: "28",
    part: "message",
    what: "no root e tag",
    mutate: dropTag("e"),
    expect: "missing-tag",
  },
  {
    nip: "28",
    part: "message",
    what: "unknown e marker",
    mutate: setTag("e", 3, "mention"),
    expect: "invalid-enum",
  },
  {
    nip: "28",
    part: "mute",
    what: "reason is not JSON",
    mutate: setField("content", "nope"),
    expect: "content-not-json",
  },
  { nip: "29", part: "chat", what: "no h tag", mutate: dropTag("h"), expect: "missing-tag" },
  {
    nip: "29",
    part: "chat",
    what: "previous ref too long",
    mutate: setTag("previous", 1, "6f47e4a1cf"),
    expect: "invalid-hex",
  },
  { nip: "29", part: "put-user", what: "no p tag", mutate: dropTag("p"), expect: "missing-tag" },
  {
    nip: "29",
    part: "metadata",
    what: "supported kind not a number",
    mutate: addTag("supported_kinds", "chat"),
    expect: "invalid-kind",
  },
  {
    nip: "29",
    part: "create-invite",
    what: "no code",
    mutate: dropTag("code"),
    expect: "missing-tag",
  },
  {
    nip: "29",
    part: "livekit-auth",
    what: "POST instead of GET",
    mutate: setTag("method", 1, "POST"),
    expect: "invalid-enum",
  },
  {
    nip: "29",
    part: "livekit-token",
    what: "no Authorization header",
    mutate: setField("headers", {}),
    expect: "missing-field",
  },
  {
    nip: "29",
    part: "livekit-token",
    what: "auth is not base64",
    mutate: setField("headers", { Authorization: "Nostr %%%" }),
    expect: "invalid-base64",
  },
  {
    nip: "30",
    part: "note",
    what: "shortcode with a colon",
    mutate: setTag("emoji", 1, "party:time"),
    expect: "pattern-mismatch",
  },
  {
    nip: "30",
    part: "note",
    what: "emoji set of the wrong kind",
    mutate: setTag("emoji", 3, `30000:${PERSONA_PUBKEYS.alice}:x`),
    expect: "kind-not-allowed",
  },
  {
    nip: "31",
    part: "custom",
    what: "two alt tags",
    mutate: addTag("alt", "again"),
    expect: "duplicate-tag",
  },
  { nip: "31", part: "custom", what: "no alt tag", mutate: dropTag("alt"), expect: "missing-tag" },
  { nip: "32", part: "label", what: "no l tag", mutate: dropTag("l"), expect: "missing-tag" },
  {
    nip: "32",
    part: "label",
    what: "p target not a pubkey",
    mutate: setTag("p", 1, "carol"),
    expect: "invalid-pubkey",
  },
  {
    nip: "33",
    part: "addressable",
    what: "regular kind",
    mutate: setField("kind", 1),
    expect: "wrong-kind",
  },
  { nip: "33", part: "addressable", what: "no d tag", mutate: dropTag("d"), expect: "missing-tag" },
  {
    nip: "34",
    part: "repo",
    what: "euc is not a commit id",
    mutate: setTag("r", 1, "main"),
    expect: "invalid-hex",
  },
  { nip: "34", part: "repo", what: "no d tag", mutate: dropTag("d"), expect: "missing-tag" },
  {
    nip: "34",
    part: "status",
    what: "wrong status kind",
    mutate: setField("kind", 1634),
    expect: "wrong-kind",
  },
  {
    nip: "34",
    part: "patch",
    what: "no repo address",
    mutate: dropTag("a"),
    expect: "missing-tag",
  },
  {
    nip: "35",
    part: "torrent",
    what: "info hash not 20 bytes",
    mutate: setTag("x", 1, "abcd"),
    expect: "invalid-hex",
  },
  {
    nip: "35",
    part: "torrent",
    what: "file size not a number",
    mutate: setTag("file", 2, "big"),
    expect: "invalid-number",
  },
  {
    nip: "36",
    part: "note",
    what: "two content-warning tags",
    mutate: addTag("content-warning", "again"),
    expect: "duplicate-tag",
  },
  {
    nip: "37",
    part: "draft",
    what: "plaintext draft",
    mutate: setField("content", '{"kind":1}'),
    expect: "content-not-encrypted",
  },
  { nip: "37", part: "draft", what: "no k tag", mutate: dropTag("k"), expect: "missing-tag" },
  {
    nip: "37",
    part: "relays",
    what: "plaintext relay list",
    mutate: setField("content", "[]"),
    expect: "content-not-encrypted",
  },
  { nip: "38", part: "status", what: "no d tag", mutate: dropTag("d"), expect: "missing-tag" },
  {
    nip: "38",
    part: "status",
    what: "expiration not a timestamp",
    mutate: addTag("expiration", "soon"),
    expect: "invalid-timestamp",
  },
  {
    nip: "39",
    part: "identities",
    what: "claim without platform",
    mutate: setTag("i", 1, "semisol"),
    expect: "pattern-mismatch",
  },
  {
    nip: "39",
    part: "identities",
    what: "claim without proof",
    mutate: withTags((t) => t.map((x) => (x[0] === "i" ? x.slice(0, 2) : x))),
    expect: "tag-too-short",
  },
];

describe("broken r2 values produce the expected diagnostics", () => {
  test.each(BROKEN.map((b) => [`NIP-${b.nip} ${b.part}: ${b.what} → ${b.expect}`, b] as const))(
    "%s",
    (_, b) => {
      const s = spec(b.nip);
      const p = specParts(s).find((x) => x.part.id === b.part);
      if (p === undefined) throw new Error(`NIP-${b.nip} has no part ${b.part}`);
      const first = exampleValues(p)[0];
      if (first === undefined) throw new Error(`NIP-${b.nip} ${b.part} has no example`);
      // Events are broken on the unsigned template so the change isn't masked by id-mismatch.
      const base =
        p.kind === "event" && p.part.examples[0] !== undefined
          ? ({ created_at: FIXTURE_NOW, ...p.part.examples[0].template } as unknown as JsonValue)
          : (first.value as JsonValue);
      expect(codes(validate(s, p, b.mutate(base)))).toContain(b.expect);
    },
  );
});

// ── Baked-in cross references ────────────────────────────────────────────────────────────────

const exampleTemplate = (nip: string, part: string, example: string): EventTemplateJson => {
  const x = spec(nip)
    .events?.find((e) => e.id === part)
    ?.examples.find((e) => e.id === example);
  if (x === undefined) throw new Error(`NIP-${nip} ${part}/${example} not found`);
  return x.template;
};
const exampleId = (nip: string, part: string, example: string, signer: string): string => {
  const t = exampleTemplate(nip, part, example);
  return computeEventId({
    ...t,
    tags: asTags(t.tags),
    created_at: t.created_at ?? FIXTURE_NOW,
    pubkey: pubkeyOf(signer),
  }).id;
};

describe("ids and payloads baked into r2 examples", () => {
  test("NIP-22 reply points at the id of the first comment", () => {
    expect(exampleId("22", "comment", "on-article", "carol")).toBe(NIP22_FIRST_COMMENT_ID);
  });

  test("NIP-28 messages point at the channel and at Bob's message", () => {
    expect(exampleId("28", "create", "create", "dave")).toBe(NIP28_CHANNEL_ID);
    const bobMessage = exampleId("28", "message", "root", "bob");
    expect(exampleTemplate("28", "message", "reply").tags).toContainEqual([
      "e",
      bobMessage,
      "wss://relay.delta.example",
      "reply",
    ]);
    expect(exampleTemplate("28", "hide", "hide").tags).toEqual([["e", bobMessage]]);
  });

  test("NIP-29 deletes and pins the chat example, with a real signed auth event", () => {
    expect(exampleId("29", "chat", "chat", "bob")).toBe(NIP29_CHAT_ID);
    const auth = JSON.parse(
      utf8Decode(Uint8Array.from(atob(NIP29_LIVEKIT_AUTH), (c) => c.charCodeAt(0))),
    );
    expect(verifyEvent(auth).ok).toBe(true);
    expect(auth.pubkey).toBe(PERSONA_PUBKEYS.grace);
    expect(auth.tags).toEqual(exampleTemplate("29", "livekit-auth", "livekit-auth").tags);
  });

  test("NIP-34 status and PR update point at the patch and the pull request examples", () => {
    expect(exampleId("34", "patch", "patch", "bob")).toBe(NIP34_PATCH_ID);
    expect(exampleId("34", "pr", "pr", "alice")).toBe(NIP34_PR_ID);
    expect(exampleTemplate("34", "status", "applied").tags[0]).toEqual([
      "e",
      NIP34_PATCH_ID,
      "",
      "root",
    ]);
    expect(exampleTemplate("34", "pr-update", "pr-update").tags).toContainEqual(["E", NIP34_PR_ID]);
  });

  test("NIP-35 comment points at the torrent example", () => {
    expect(exampleId("35", "torrent", "film", "frank")).toBe(NIP35_TORRENT_ID);
  });

  test("NIP-26 delegation tag carries the conditions the example's created_at satisfies", () => {
    const t = exampleTemplate("26", "delegated", "note");
    expect(t.tags[0]).toEqual(["delegation", PERSONA_PUBKEYS.alice, NIP26_CONDITIONS, NIP26_TOKEN]);
    const bound = (op: string) =>
      Number(new RegExp(`created_at${op}(\\d+)`).exec(NIP26_CONDITIONS)?.[1]);
    expect(t.created_at).toBeGreaterThan(bound(">"));
    expect(t.created_at).toBeLessThan(bound("<"));
  });

  test("NIP-37 encrypted contents decrypt to what the examples say (alice to herself)", () => {
    const key = unwrap(nip44ConversationKey(personaKey("alice"), PERSONA_PUBKEYS.alice));
    const plain = (part: string, example: string) =>
      JSON.parse(unwrap(nip44Decrypt(exampleTemplate("37", part, example).content, key)).plaintext);
    expect(plain("draft", "draft")).toMatchObject({ kind: 1, pubkey: PERSONA_PUBKEYS.alice });
    expect(plain("checkpoint", "checkpoint")).toMatchObject({ kind: 1 });
    expect(plain("relays", "relays")).toEqual([["relay", "wss://relay.delta.example"]]);
  });
});
