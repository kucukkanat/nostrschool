import { describe, expect, test } from "bun:test";
import { FIXTURE_NOW } from "@nostrschool/fixtures";
import { type NostrEvent, verifyEvent } from "@nostrschool/protocol";
import { ALICE, BOB, dm, encodingSpec, httpSpec, NOTE_ID, reaction } from "../test/samples.ts";
import {
  bech32Parts,
  decodeToInputs,
  demoSecretFor,
  encodeInputs,
  isCostlyCodec,
  isSecretInput,
  MAX_DEMO_LOGN,
  ncryptsecLogN,
  personaFromSecret,
} from "./encoding.ts";
import {
  decryptFrom,
  encryptFor,
  eventFromTemplate,
  eventSkeleton,
  firstRecipient,
  matchTagSpec,
  orderEvent,
  signDraft,
  tagTemplate,
  unsign,
} from "./event.ts";
import {
  childSchema,
  defaultForField,
  personaOf,
  pickOption,
  schemaAt,
  skeleton,
} from "./fields.ts";
import { authHeaderName, base64ToUtf8, buildAuthEvent } from "./http.ts";
import { getIn, moveItem, removeIn, setIn } from "./immutable.ts";
import { locate, nodeValue, parseJsonNodes, pathIn } from "./json-locate.ts";

const unwrapOk = <T>(r: { ok: true; value: T } | { ok: false; error: unknown }): T => {
  if (!r.ok) throw new Error(`expected ok: ${JSON.stringify(r.error)}`);
  return r.value;
};

describe("json-locate", () => {
  const text = '{\n  "a": [1, "two", true, null],\n  "b": { "c": -1.5e2 }\n}';
  test("parses to the same value as JSON.parse, with spans", () => {
    const root = unwrapOk(parseJsonNodes(text));
    expect(nodeValue(root)).toEqual(JSON.parse(text));
    const hit = locate(root, ["b", "c"]);
    expect(hit && text.slice(hit.node.from, hit.node.to)).toBe("-1.5e2");
    expect(hit?.keySpan && text.slice(hit.keySpan.from, hit.keySpan.to)).toBe('"c"');
    expect(locate(root, ["a", 9])).toBeUndefined();
    expect(locate(root, ["a", "x"])).toBeUndefined();
    expect(locate(root, [])?.keySpan).toBeUndefined();
  });
  test("pathIn finds the deepest node, keys included", () => {
    const root = unwrapOk(parseJsonNodes(text));
    expect(pathIn(root, text.indexOf('"two"') + 1)).toEqual(["a", 1]);
    expect(pathIn(root, text.indexOf('"b"'))).toEqual(["b"]);
    expect(pathIn(root, 0)).toEqual([]);
    expect(pathIn(root, text.length + 5)).toBeUndefined();
  });
  test("reports the offset of the first error", () => {
    for (const [bad, at] of [
      ['{"a" 1}', 5],
      ["[1,", 3],
      ["", 0],
      ['{"a":1} x', 8],
      ["[1 2]", 3],
      ['{"a":1 "b"}', 7],
      ["{1:2}", 1],
      ['"\\x"', 0],
      ["tru", 0],
    ] as const) {
      const r = parseJsonNodes(bad);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.offset).toBe(at);
    }
    expect(unwrapOk(parseJsonNodes("{}")).type).toBe("object");
    expect(unwrapOk(parseJsonNodes(" [] ")).type).toBe("array");
    expect(nodeValue(unwrapOk(parseJsonNodes("false")))).toBe(false);
  });
});

describe("immutable helpers", () => {
  test("setIn / getIn / removeIn never mutate", () => {
    const v = { a: [1, 2], b: { c: "x" } };
    const next = setIn(v, ["a", 3], 9);
    expect(next).toEqual({ a: [1, 2, "", 9], b: { c: "x" } });
    expect(v.a).toEqual([1, 2]);
    expect(setIn(null, ["x", "y"], 1)).toEqual({ x: { y: 1 } });
    expect(setIn(v, [], 5)).toBe(5);
    expect(getIn(v, ["b", "c"])).toBe("x");
    expect(getIn(v, ["a", "x"])).toBeUndefined();
    expect(removeIn(v, ["a", 0])).toEqual({ a: [2], b: { c: "x" } });
    expect(removeIn(v, ["b"])).toEqual({ a: [1, 2] });
    expect(removeIn(v, ["zz", 1])).toBe(v);
    expect(removeIn(v, [])).toBe(v);
    expect(removeIn("s", ["x"])).toBe("s");
  });
  test("moveItem clamps", () => {
    expect(moveItem([1, 2, 3], 0, 2)).toEqual([2, 3, 1]);
    expect(moveItem([1, 2, 3], 2, -4)).toEqual([3, 1, 2]);
    expect(moveItem([1], 5, 0)).toEqual([1]);
  });
});

describe("fields", () => {
  test("defaults are valid-looking values for every field type", () => {
    expect(defaultForField({ type: "pubkey" })).toBe(BOB.pubkey);
    expect(defaultForField({ type: "event-id" })).toHaveLength(64);
    expect(defaultForField({ type: "hex", bytes: 4 })).toBe("00000000");
    expect(defaultForField({ type: "hex32" })).toHaveLength(64);
    expect(defaultForField({ type: "relay-url" })).toStartWith("wss://");
    expect(defaultForField({ type: "url" })).toBe("https://example.com");
    expect(defaultForField({ type: "url", schemes: ["lightning"] })).toBe("lightning:example");
    expect(defaultForField({ type: "timestamp" })).toBe(String(FIXTURE_NOW));
    expect(defaultForField({ type: "kind", kinds: [9735] })).toBe("9735");
    expect(defaultForField({ type: "addr" })).toBe(`30023:${BOB.pubkey}:example`);
    expect(defaultForField({ type: "bech32", prefixes: ["npub"], uri: true })).toBe(
      `nostr:${BOB.npub}`,
    );
    expect(defaultForField({ type: "bech32", prefixes: ["note"] })).toBe("");
    expect(defaultForField({ type: "enum", values: [{ value: "a" }] })).toBe("a");
    expect(defaultForField({ type: "number", min: 3 })).toBe("3");
    expect(
      defaultForField({ type: "json", schema: { type: "array", items: { type: "any" } } }),
    ).toBe("[]");
    expect(defaultForField({ type: "text" }, "ph")).toBe("ph");
    expect(defaultForField({ type: "base64" })).toBe("");
  });
  test("skeleton fills required members and minimum lengths", () => {
    expect(
      skeleton({
        type: "object",
        required: ["a", "b", "ghost"],
        properties: {
          a: { type: "tuple", items: [{ type: "number", minimum: 2 }, { type: "boolean" }] },
          b: { type: "array", items: { type: "null" }, minItems: 2 },
          c: { type: "string" },
        },
      }),
    ).toEqual({ a: [2, false], b: [null, null] });
    expect(skeleton({ type: "any-of", options: [] })).toBeNull();
    expect(skeleton({ type: "any-of", options: [{ type: "string" }] })).toBe("");
    expect(skeleton({ type: "event" })).toMatchObject({ kind: 1 });
    expect(skeleton({ type: "filter" })).toEqual({ kinds: [1], limit: 10 });
    expect(skeleton({ type: "any" })).toBeNull();
  });
  test("schema walks resolve properties, items, tuples and any-of by value", () => {
    const s = {
      type: "object",
      properties: { list: { type: "array", items: { type: "number" } } },
      additionalProperties: { type: "boolean" },
    } as const;
    expect(childSchema(s, "list", undefined)?.type).toBe("array");
    expect(childSchema(s, "other", undefined)?.type).toBe("boolean");
    expect(childSchema(s, 0, undefined)).toBeUndefined();
    expect(schemaAt(s, { list: [1] }, ["list", 0])?.type).toBe("number");
    expect(schemaAt(s, {}, ["list", 0, "x"])).toBeUndefined();
    const anyOf = {
      type: "any-of",
      options: [
        { type: "string" },
        { type: "tuple", items: [{ type: "number" }], rest: { type: "null" } },
      ],
    } as const;
    expect(pickOption(anyOf.options, [1])?.type).toBe("tuple");
    expect(pickOption([{ type: "event" }], { kind: 1 })?.type).toBe("event");
    expect(pickOption([{ type: "number" }], "x")?.type).toBe("number");
    expect(schemaAt(anyOf, [1, null], [1])?.type).toBe("null");
    expect(schemaAt(anyOf, "s", [])?.type).toBe("string");
    expect(childSchema({ type: "any-of", options: [] }, 0, undefined)).toBeUndefined();
    expect(personaOf("nobody").id).toBe("alice");
  });
});

describe("event helpers", () => {
  test("eventFromTemplate uses the signer, FIXTURE_NOW and NIP-01 key order", () => {
    const e = eventFromTemplate({ kind: 1, tags: [["t", "x"]], content: "hi" }, "bob");
    expect(Object.keys(e)).toEqual(["pubkey", "created_at", "kind", "tags", "content"]);
    expect(e["pubkey"]).toBe(BOB.pubkey);
    expect(e["created_at"]).toBe(FIXTURE_NOW);
    expect(Object.keys(orderEvent({ extra: 1, sig: "s", id: "i" }))).toEqual([
      "id",
      "sig",
      "extra",
    ]);
  });
  test("tagTemplate prefills required fields and `when` positions", () => {
    const [eTag, pTag] = reaction.tags;
    if (eTag === undefined || pTag === undefined) throw new Error("sample tags");
    expect(tagTemplate(eTag)).toEqual(["e", expect.any(String)]);
    const k = reaction.tags.find((t) => t.name === "k");
    expect(k && tagTemplate(k)).toEqual(["k", "1", "root"]);
    expect(tagTemplate({ ...pTag, template: ["p", "x"] })).toEqual(["p", "x"]);
    expect(
      tagTemplate({
        name: "x",
        explain: "",
        presence: "optional",
        repeatable: false,
        fields: [],
        when: { index: 2, equals: "y" },
      }),
    ).toEqual(["x", "", "y"]);
  });
  test("eventSkeleton has the first kind and required tags", () => {
    const e = eventSkeleton(reaction);
    expect(e["kind"]).toBe(7);
    expect((e["tags"] as unknown[]).length).toBe(1);
    expect(eventSkeleton({ ...dm, kinds: [{ from: 5000, to: 5999 }] })["kind"]).toBe(5000);
    expect(eventSkeleton({ ...dm, kinds: [] })["kind"]).toBe(1);
  });
  test("matchTagSpec prefers the `when` variant that matches", () => {
    expect(matchTagSpec(reaction, ["k", "1", "root"])?.id).toBe("k-root");
    expect(matchTagSpec(reaction, ["k", "1", "reply"])?.id).toBe("k-root");
    expect(matchTagSpec(reaction, ["e", NOTE_ID])?.name).toBe("e");
    expect(matchTagSpec(reaction, ["zz"])).toBeUndefined();
  });
  test("signDraft produces a verifiable, reproducible event", () => {
    const draft = eventFromTemplate({ kind: 7, tags: [["e", NOTE_ID]], content: "+" }, "alice");
    const a = unwrapOk(signDraft(draft, "bob"));
    const b = unwrapOk(signDraft(draft, "bob"));
    expect(a).toEqual(b);
    expect(a["pubkey"]).toBe(BOB.pubkey);
    expect(verifyEvent(a as unknown as NostrEvent).ok).toBe(true);
    expect(Object.keys(unsign(a))).not.toContain("sig");
    expect(signDraft("x", "bob").ok).toBe(false);
    expect(signDraft({ ...draft, tags: [[1]] }, "bob").ok).toBe(false);
    expect(signDraft({ ...draft, tags: [[]] }, "bob").ok).toBe(false);
    expect(signDraft({ ...draft, kind: "7" }, "bob").ok).toBe(false);
  });
  test("encrypt / decrypt round-trips with demo keys for both schemes", () => {
    for (const scheme of ["nip44", "nip04"] as const) {
      const payload = unwrapOk(encryptFor(scheme, "secret", "alice", BOB.pubkey));
      expect(unwrapOk(decryptFrom(scheme, payload, "bob", ALICE.pubkey))).toBe("secret");
      expect(decryptFrom(scheme, "garbage", "bob", ALICE.pubkey).ok).toBe(false);
      expect(encryptFor(scheme, "x", "alice", "nothex").ok).toBe(false);
      expect(decryptFrom(scheme, payload, "bob", "nothex").ok).toBe(false);
    }
    expect(encryptFor("nip44", "", "alice", BOB.pubkey).ok).toBe(false);
    expect(
      firstRecipient({
        tags: [
          ["e", "x"],
          ["p", BOB.pubkey],
        ],
      }),
    ).toBe(BOB.pubkey);
    expect(firstRecipient({ tags: "x" })).toBeUndefined();
    expect(firstRecipient({ tags: [["e"]] })).toBeUndefined();
  });
});

describe("encodings", () => {
  const enc = (id: string) => {
    const e = encodingSpec.encodings?.find((x) => x.id === id);
    if (e === undefined) throw new Error(id);
    return e;
  };
  test("nprofile encodes with TLV rows and decodes back", () => {
    const spec = enc("nprofile");
    const out = unwrapOk(
      encodeInputs(spec, { pubkey: BOB.pubkey, relays: ["wss://relay.alpha.example"] }),
    );
    expect(out.encoded).toStartWith("nprofile1");
    expect(out.parts.map((p) => p.role)).toEqual(["hrp", "separator", "data", "checksum"]);
    expect(out.tlv).toEqual([
      { type: 0, length: 32, value: BOB.pubkey },
      { type: 1, length: 25, value: "wss://relay.alpha.example" },
    ]);
    expect(unwrapOk(decodeToInputs(spec, out.encoded, {}))).toEqual({
      pubkey: BOB.pubkey,
      relays: ["wss://relay.alpha.example"],
    });
    expect(decodeToInputs(spec, BOB.npub, {}).ok).toBe(false);
    expect(decodeToInputs(spec, "junk", {}).ok).toBe(false);
    expect(encodeInputs(spec, {}).ok).toBe(false);
  });
  test("naddr round-trips identifier, kind and author", () => {
    const spec = enc("naddr");
    const out = unwrapOk(
      encodeInputs(spec, { identifier: "hello", pubkey: BOB.pubkey, kind: "30023" }),
    );
    expect(out.tlv?.map((r) => r.value)).toEqual(["hello", BOB.pubkey, "30023"]);
    expect(unwrapOk(decodeToInputs(spec, out.encoded, {}))).toEqual({
      identifier: "hello",
      pubkey: BOB.pubkey,
      kind: "30023",
    });
    expect(encodeInputs(spec, { pubkey: BOB.pubkey }).ok).toBe(false);
  });
  test("plain NIP-19 codecs and nostr: URIs", () => {
    const pk = { name: "pubkey", type: { type: "pubkey" }, explain: "" } as const;
    const id = { name: "id", type: { type: "event-id" }, explain: "" } as const;
    const base = { id: "x", label: "", explain: "", output: "", examples: [] };
    const npub = unwrapOk(
      encodeInputs({ ...base, codec: "npub", inputs: [pk] }, { pubkey: BOB.pubkey }),
    );
    expect(npub.encoded).toBe(BOB.npub);
    expect(
      unwrapOk(decodeToInputs({ ...base, codec: "npub", inputs: [pk] }, BOB.npub, {})),
    ).toEqual({ pubkey: BOB.pubkey });
    const note = unwrapOk(encodeInputs({ ...base, codec: "note", inputs: [id] }, { id: NOTE_ID }));
    expect(
      unwrapOk(decodeToInputs({ ...base, codec: "note", inputs: [id] }, note.encoded, {})),
    ).toEqual({ id: NOTE_ID });
    const kind = { name: "kind", type: { type: "kind" }, explain: "" } as const;
    const nevent = { ...base, codec: "nevent" as const, inputs: [id, pk, kind] };
    const ne = unwrapOk(encodeInputs(nevent, { id: NOTE_ID, pubkey: BOB.pubkey, kind: "1" }));
    expect(unwrapOk(decodeToInputs(nevent, ne.encoded, {}))).toEqual({
      id: NOTE_ID,
      pubkey: BOB.pubkey,
      kind: "1",
    });
    const sk = { name: "nsec", type: { type: "bech32", prefixes: ["nsec"] }, explain: "" } as const;
    const nsec = { ...base, codec: "nsec" as const, inputs: [sk] };
    expect(unwrapOk(encodeInputs(nsec, { nsec: ALICE.secretKeyHex })).encoded).toBe(ALICE.nsec);
    expect(unwrapOk(encodeInputs(nsec, { nsec: ALICE.nsec })).encoded).toBe(ALICE.nsec);
    expect(encodeInputs(nsec, { nsec: "nsec1bad" }).ok).toBe(false);
    expect(encodeInputs(nsec, { nsec: "zz" }).ok).toBe(false);
    expect(unwrapOk(decodeToInputs(nsec, ALICE.nsec, {}))).toEqual({ nsec: ALICE.secretKeyHex });
    const uriEntity = {
      name: "entity",
      type: { type: "bech32", prefixes: ["npub"], uri: true },
      explain: "",
    } as const;
    const uri = { ...base, codec: "nostr-uri" as const, inputs: [uriEntity] };
    const u = unwrapOk(encodeInputs(uri, { entity: BOB.npub }));
    expect(u.encoded).toBe(`nostr:${BOB.npub}`);
    expect(u.parts[0]).toEqual({ role: "prefix", text: "nostr:" });
    expect(unwrapOk(decodeToInputs(uri, u.encoded, {}))).toEqual({ entity: `nostr:${BOB.npub}` });
    expect(encodeInputs(uri, { entity: ALICE.nsec }).ok).toBe(false);
    expect(encodeInputs(uri, { entity: "nostr:junk" }).ok).toBe(false);
    const pointerUri = { ...base, codec: "nostr-uri" as const, inputs: [pk] };
    expect(unwrapOk(encodeInputs(pointerUri, { pubkey: BOB.pubkey })).encoded).toStartWith(
      "nostr:nprofile1",
    );
    expect(unwrapOk(decodeToInputs(pointerUri, `nostr:${BOB.npub}`, {}))).toEqual({
      pubkey: BOB.pubkey,
    });
  });
  test("ncryptsec encrypts a demo key and decrypts it with the password", () => {
    const spec = enc("ncryptsec");
    const inputs = {
      "secret-key": ALICE.secretKeyHex,
      password: "nostr",
      log_n: "1",
      "key-security": "2",
    };
    const out = unwrapOk(encodeInputs(spec, inputs));
    expect(out.encoded).toStartWith("ncryptsec1");
    expect(
      unwrapOk(decodeToInputs(spec, out.encoded, { ...inputs, "secret-key": "" }))["secret-key"],
    ).toBe(ALICE.secretKeyHex);
    expect(decodeToInputs(spec, out.encoded, { ...inputs, password: "wrong" }).ok).toBe(false);
    expect(encodeInputs(spec, { ...inputs, "key-security": "7" }).ok).toBe(false);
    const bad = encodeInputs(spec, { ...inputs, "secret-key": "x" });
    expect(!bad.ok && bad.error.input).toBe("secret-key");
  });
  test("heavy scrypt settings are explained instead of run, both directions", () => {
    const spec = enc("ncryptsec");
    const inputs = {
      "secret-key": ALICE.secretKeyHex,
      password: "pw",
      log_n: "21",
      "key-security": "2",
    };
    const r = encodeInputs(spec, inputs);
    expect(!r.ok && r.error).toMatchObject({
      code: "too-costly",
      logn: 21,
      mib: 2048,
      input: "log_n",
    });
    const light = unwrapOk(encodeInputs(spec, { ...inputs, log_n: "4" }));
    expect(ncryptsecLogN(light.encoded)).toBe(4);
    // A pasted string asking for log_n 20 is refused before any scrypt runs.
    const heavy = `ncryptsec1q${"z".repeat(3)}${light.encoded.slice(14)}`;
    expect(ncryptsecLogN(heavy)).toBeGreaterThan(MAX_DEMO_LOGN);
    const d = decodeToInputs(spec, heavy, inputs);
    expect(!d.ok && d.error.code).toBe("too-costly");
    expect(ncryptsecLogN("ncryptsec1")).toBeUndefined();
    expect(ncryptsecLogN("ncryptsec1bbbb")).toBeUndefined();
    expect(isCostlyCodec("ncryptsec")).toBe(true);
    expect(isCostlyCodec("npub")).toBe(false);
  });
  test("NIP-06 mnemonic derives the spec's test vector", () => {
    const spec = enc("mnemonic");
    const out = unwrapOk(
      encodeInputs(spec, {
        mnemonic: "leader monkey parrot ring guide accident before fence cannon height naive bean",
        account: "0",
      }),
    );
    // Test vector from NIP-06.
    expect(out.derived?.find((d) => d.name === "secret-hex")?.value).toBe(
      "7f7ff03d123792d6ac594bfa67bf6d0c0ab55b6b1fdb6249303fe861f1ccba9a",
    );
    expect(out.derived?.find((d) => d.name === "path")?.value).toBe("m/44'/1237'/0'/0/0");
    expect(encodeInputs(spec, { mnemonic: "not words" }).ok).toBe(false);
    expect(encodeInputs(spec, {}).ok).toBe(false);
    expect(decodeToInputs(spec, out.encoded, {}).ok).toBe(false);
  });
  test("NIP-44 payload breakdown and decryption", () => {
    const spec = enc("payload");
    const inputs = {
      plaintext: "hi bob",
      "sender-secret": ALICE.secretKeyHex,
      recipient: BOB.pubkey,
    };
    const out = unwrapOk(encodeInputs(spec, inputs));
    expect(out.parts.map((p) => p.role)).toEqual(["version", "nonce", "ciphertext", "mac"]);
    expect(out.parts[0]?.text).toBe("02");
    expect(
      unwrapOk(decodeToInputs(spec, out.encoded, { ...inputs, plaintext: "" }))["plaintext"],
    ).toBe("hi bob");
    expect(encodeInputs(spec, { plaintext: "x" }).ok).toBe(false);
    expect(decodeToInputs(spec, out.encoded, {}).ok).toBe(false);
    expect(decodeToInputs(spec, "junk", inputs).ok).toBe(false);
    const nip04 = { ...spec, codec: "nip04-payload" as const };
    const o4 = unwrapOk(encodeInputs(nip04, inputs));
    expect(o4.parts.map((p) => p.role)).toEqual(["ciphertext", "separator", "iv"]);
    expect(encodeInputs(spec, { ...inputs, recipient: "bad" }).ok).toBe(false);
  });
  test("payload with a sender pubkey and a fixed nonce is reproducible (NIP-44 spec style)", () => {
    const base = {
      id: "p",
      label: "",
      explain: "",
      output: "",
      examples: [],
      codec: "nip44-payload" as const,
    };
    const spec = {
      ...base,
      inputs: [
        { name: "sender", type: { type: "pubkey" }, explain: "" },
        { name: "recipient", type: { type: "pubkey" }, explain: "" },
        { name: "plaintext", type: { type: "text" }, explain: "" },
        { name: "nonce", type: { type: "hex32" }, explain: "", optional: true },
      ],
    } as const;
    const inputs = {
      sender: BOB.pubkey,
      recipient: ALICE.pubkey,
      plaintext: "yes",
      nonce: `${"0".repeat(63)}1`,
    };
    const a = unwrapOk(encodeInputs(spec, inputs));
    expect(unwrapOk(encodeInputs(spec, inputs)).encoded).toBe(a.encoded);
    expect(a.parts[1]?.text).toBe(inputs.nonce);
    // Bob encrypted, so Alice's demo key opens it.
    expect(unwrapOk(decryptFrom("nip44", a.encoded, "alice", BOB.pubkey))).toBe("yes");
    expect(encodeInputs(spec, { ...inputs, nonce: "zz" }).ok).toBe(false);
    expect(unwrapOk(encodeInputs(spec, { ...inputs, nonce: "" })).encoded).not.toBe(a.encoded);
    const unknownSender = unwrapOk(encodeInputs(spec, { ...inputs, sender: "f".repeat(64) }));
    expect(unwrapOk(decryptFrom("nip44", unknownSender.encoded, "alice", ALICE.pubkey))).toBe(
      "yes",
    );
    const iv = unwrapOk(
      encodeInputs({ ...spec, codec: "nip04-payload" }, { ...inputs, nonce: "00".repeat(16) }),
    );
    expect(iv.parts[2]?.text).toBe("AAAAAAAAAAAAAAAAAAAAAA==");
  });
  test("helpers: bech32 split, secret detection, demo secrets", () => {
    expect(bech32Parts("abc")).toEqual([{ role: "data", text: "abc" }]);
    expect(
      isSecretInput({ name: "nsec", type: { type: "bech32", prefixes: ["nsec"] }, explain: "" }),
    ).toBe(true);
    expect(isSecretInput({ name: "pubkey", type: { type: "pubkey" }, explain: "" })).toBe(false);
    expect(personaFromSecret(BOB.nsec)).toBe("bob");
    expect(personaFromSecret("nope")).toBe("alice");
    expect(
      demoSecretFor(
        { name: "nsec", type: { type: "bech32", prefixes: ["nsec"] }, explain: "" },
        "bob",
      ),
    ).toBe(BOB.nsec);
    expect(demoSecretFor({ name: "sk", type: { type: "hex" }, explain: "" }, "bob")).toBe(
      BOB.secretKeyHex,
    );
  });
});

describe("http auth", () => {
  const part = httpSpec.http?.[0];
  const shape = httpSpec.events?.[0];
  test("builds a signed kind 27235 event over the request and base64s it", () => {
    if (part === undefined || shape === undefined) throw new Error("sample");
    expect(authHeaderName(part)).toBe("Authorization");
    expect(authHeaderName({ ...part, headers: [] })).toBe("Authorization");
    const r = unwrapOk(
      buildAuthEvent(
        part,
        shape,
        { url: "https://files.example/upload", headers: {}, body: { caption: "hi" } },
        "bob",
      ),
    );
    expect(r.header).toStartWith("Nostr ");
    const decoded = JSON.parse(base64ToUtf8(r.header.slice(6)) ?? "null") as NostrEvent;
    expect(decoded.kind).toBe(27235);
    expect(decoded.tags.map((t) => t[0])).toEqual(["u", "method", "payload"]);
    expect(verifyEvent(decoded).ok).toBe(true);
    expect(buildAuthEvent(part, shape, { headers: {} }, "bob").ok).toBe(false);
    const noExample = unwrapOk(
      buildAuthEvent(
        part,
        { ...shape, examples: [] },
        { url: "https://x.example", body: "raw" },
        "bob",
      ),
    );
    expect(noExample.header).toStartWith("Nostr ");
    expect(base64ToUtf8("@@@")).toBeUndefined();
  });
});
