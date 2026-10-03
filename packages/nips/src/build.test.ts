import { describe, expect, test } from "bun:test";
// Real fixture data, never mocked.
import { FIXTURE_NOW, getPersona } from "@nostrschool/fixtures";
import { signEvent } from "@nostrschool/protocol";
import {
  defaultContent,
  defaultDocument,
  defaultEncodingInputs,
  defaultEventTemplate,
  defaultHttpRequest,
  defaultKind,
  defaultMessage,
  defaultPartValue,
  defaultSchemaValue,
  tagTemplate,
} from "./build.ts";
import type {
  DocumentSpec,
  EncodingSpec,
  EventShape,
  HttpRequestSpec,
  JsonSchema,
  TagSpec,
  WireMessageSpec,
} from "./spec.ts";
import { validateAgainstSpec } from "./validate.ts";

const alice = getPersona("alice");
const opts = { createdAt: FIXTURE_NOW };

const eTag: TagSpec = {
  name: "e",
  explain: "e",
  presence: "required",
  repeatable: true,
  fields: [
    { name: "id", type: { type: "event-id" }, explain: "e.id", placeholder: "<event id>" },
    { name: "relay", type: { type: "relay-url" }, explain: "e.relay", optional: true },
    { name: "pubkey", type: { type: "pubkey" }, explain: "e.pubkey", optional: true },
  ],
};

const reaction: EventShape = {
  id: "reaction",
  label: "rx.label",
  explain: "rx",
  kinds: [7],
  content: { format: "text", explain: "rx.content", required: true },
  tags: [
    eTag,
    {
      name: "k",
      explain: "k",
      presence: "optional",
      repeatable: false,
      fields: [{ name: "kind", type: { type: "kind" }, explain: "k.kind" }],
    },
  ],
  examples: [
    {
      id: "like",
      label: "rx.like",
      template: { kind: 7, tags: [["e", "a".repeat(64)]], content: "+" },
    },
    {
      id: "dated",
      label: "rx.dated",
      template: { kind: 7, created_at: 1, tags: [], content: "-" },
    },
  ],
};

const metadata: EventShape = {
  id: "metadata",
  label: "m.label",
  explain: "m",
  kinds: [{ from: 0, to: 0 }],
  content: {
    format: "json",
    explain: "m.content",
    schema: {
      type: "object",
      required: ["name", "bot"],
      properties: { name: { type: "string" }, bot: { type: "boolean" }, about: { type: "string" } },
    },
  },
  tags: [],
  examples: [],
};

describe("event defaults", () => {
  test("defaultKind takes the first kind or range start", () => {
    expect(defaultKind(reaction)).toBe(7);
    expect(defaultKind(metadata)).toBe(0);
    expect(defaultKind({ ...metadata, kinds: [] })).toBe(1);
  });

  test("tag templates: explicit, required fields, when-variants", () => {
    expect(tagTemplate(eTag)).toEqual(["e", "<event id>"]);
    expect(tagTemplate({ ...eTag, template: ["e", "", "wss://"] })).toEqual(["e", "", "wss://"]);
    const marker: TagSpec = {
      ...eTag,
      when: { index: 3, equals: "root" },
      fields: [
        ...eTag.fields.slice(0, 2),
        { name: "marker", type: { type: "text" }, explain: "m", optional: true },
      ],
    };
    expect(tagTemplate(marker)).toEqual(["e", "<event id>", "", "root"]);
  });

  test("examples first (keeping their date), otherwise a skeleton with required tags", () => {
    expect(defaultEventTemplate(reaction, opts)).toEqual({
      kind: 7,
      created_at: FIXTURE_NOW,
      tags: [["e", "a".repeat(64)]],
      content: "+",
    });
    expect(defaultEventTemplate(reaction, { ...opts, exampleId: "dated" }).created_at).toBe(1);
    const skeleton = defaultEventTemplate({ ...reaction, examples: [] }, opts);
    expect(skeleton).toEqual({
      kind: 7,
      created_at: FIXTURE_NOW,
      tags: [["e", "<event id>"]],
      content: "",
    });
    expect(defaultEventTemplate(metadata, opts).content).toBe('{"name":"","bot":false}');
  });

  test("a skeleton has the right shape: once filled and signed it validates", () => {
    const t = defaultEventTemplate(metadata, opts);
    const signed = signEvent(
      {
        ...t,
        created_at: t.created_at ?? FIXTURE_NOW,
        tags: [],
        content: '{"name":"alice","bot":false}',
      },
      alice.secretKey,
    );
    if (!signed.ok) throw new Error(signed.error.message);
    expect(
      validateAgainstSpec(signed.value.event, { kind: "event", part: metadata }).issues,
    ).toEqual([]);
    expect(validateAgainstSpec(t, { kind: "event", part: metadata }).valid).toBe(true);
  });

  test("defaultContent per format", () => {
    expect(defaultContent({ format: "text", explain: "x" })).toBe("");
    expect(defaultContent({ format: "empty" })).toBe("");
    expect(
      defaultContent({
        format: "encrypted",
        explain: "x",
        scheme: "nip44",
        plaintext: { format: "text", explain: "y" },
      }),
    ).toBe("");
  });
});

describe("defaultSchemaValue", () => {
  test("every schema type", () => {
    const cases: [JsonSchema, unknown][] = [
      [
        {
          type: "object",
          properties: { a: { type: "number", minimum: 3 } },
          required: ["a", "ghost"],
        },
        { a: 3 },
      ],
      [{ type: "object", properties: {} }, {}],
      [{ type: "array", items: { type: "string" } }, []],
      [{ type: "tuple", items: [{ type: "string" }, { type: "boolean" }] }, ["", false]],
      [{ type: "tuple", items: [{ type: "string" }, { type: "null" }], minItems: 1 }, [""]],
      [{ type: "number" }, 0],
      [{ type: "any-of", options: [{ type: "boolean" }, { type: "string" }] }, false],
      [{ type: "any-of", options: [] }, null],
      [{ type: "event" }, { kind: 1, created_at: 0, tags: [], content: "" }],
      [{ type: "filter" }, {}],
      [{ type: "any" }, null],
    ];
    for (const [schema, value] of cases) expect(defaultSchemaValue(schema)).toEqual(value as never);
  });
});

const req: WireMessageSpec = {
  id: "req",
  label: "req.label",
  explain: "req",
  direction: "client-to-relay",
  type: "REQ",
  elements: [
    { name: "sub", explain: "sub", schema: { type: "string" } },
    { name: "filter", explain: "f", schema: { type: "filter" }, repeatable: true },
    { name: "extra", explain: "x", schema: { type: "number" }, optional: true },
  ],
  examples: [{ id: "feed", label: "feed", message: ["REQ", "feed", { kinds: [1] }] }],
};

const doc: DocumentSpec = {
  id: "nostr-json",
  label: "nj",
  explain: "nj",
  mediaType: "application/json",
  urlTemplate: "https://<domain>/.well-known/nostr.json",
  schema: {
    type: "object",
    properties: { names: { type: "object", properties: {} } },
    required: ["names"],
  },
  examples: [{ id: "alice", label: "a", value: { names: { alice: alice.pubkey } } }],
};

const http: HttpRequestSpec = {
  id: "upload",
  label: "up",
  explain: "up",
  method: "POST",
  urlTemplate: "https://<server>/upload",
  headers: [
    { name: "Authorization", explain: "a", value: { type: "base64" }, required: true },
    { name: "X-Optional", explain: "o", value: { type: "text" }, required: false },
  ],
  body: { mediaType: "application/json", schema: { type: "object", properties: {} } },
  responses: [],
  examples: [
    { id: "plain", label: "p", url: "https://a.example/upload", headers: { Authorization: "x" } },
    { id: "body", label: "b", url: "https://a.example/upload", headers: {}, body: { a: 1 } },
  ],
};

const encoding: EncodingSpec = {
  id: "nprofile",
  label: "np",
  explain: "np",
  codec: "nprofile",
  output: "np.out",
  inputs: [
    { name: "pubkey", type: { type: "pubkey" }, explain: "pk" },
    { name: "relays", type: { type: "relay-url" }, explain: "r", repeatable: true, optional: true },
  ],
  examples: [{ id: "alice", label: "a", inputs: { pubkey: alice.pubkey } }],
};

describe("other part defaults", () => {
  test("messages", () => {
    expect(defaultMessage(req)).toEqual(["REQ", "feed", { kinds: [1] }]);
    expect(defaultMessage({ ...req, examples: [] })).toEqual(["REQ", "", {}]);
    expect(defaultMessage(req, { exampleId: "missing" })).toEqual(["REQ", "", {}]);
  });

  test("documents", () => {
    expect(defaultDocument(doc)).toEqual({ names: { alice: alice.pubkey } });
    expect(defaultDocument({ ...doc, examples: [] })).toEqual({ names: {} });
  });

  test("HTTP requests", () => {
    expect(defaultHttpRequest(http)).toEqual({
      url: "https://a.example/upload",
      headers: { Authorization: "x" },
    });
    expect(defaultHttpRequest(http, { exampleId: "body" }).body).toEqual({ a: 1 });
    expect(defaultHttpRequest({ ...http, examples: [] })).toEqual({
      url: "https://<server>/upload",
      headers: { Authorization: "" },
      body: {},
    });
    const { body: _b, ...noBody } = http;
    expect(defaultHttpRequest({ ...noBody, examples: [] })).toEqual({
      url: "https://<server>/upload",
      headers: { Authorization: "" },
    });
  });

  test("encodings", () => {
    expect(defaultEncodingInputs(encoding)).toEqual({ pubkey: alice.pubkey });
    expect(defaultEncodingInputs({ ...encoding, examples: [] })).toEqual({
      pubkey: "",
      relays: [],
    });
  });

  test("defaultPartValue dispatches on the part kind", () => {
    expect(defaultPartValue({ kind: "event", part: reaction }, opts)).toMatchObject({ kind: 7 });
    expect(defaultPartValue({ kind: "message", part: req }, opts)).toEqual(defaultMessage(req));
    expect(defaultPartValue({ kind: "document", part: doc }, opts)).toEqual(defaultDocument(doc));
    expect(defaultPartValue({ kind: "http", part: http }, opts)).toEqual(defaultHttpRequest(http));
    expect(defaultPartValue({ kind: "encoding", part: encoding }, opts)).toEqual(
      defaultEncodingInputs(encoding),
    );
  });

  test("every default value validates without structural errors against its own part", () => {
    expect(validateAgainstSpec(defaultMessage(req), { kind: "message", part: req }).valid).toBe(
      true,
    );
    expect(validateAgainstSpec(defaultDocument(doc), { kind: "document", part: doc }).valid).toBe(
      true,
    );
    expect(
      validateAgainstSpec(defaultEncodingInputs(encoding), { kind: "encoding", part: encoding })
        .valid,
    ).toBe(true);
  });
});
