/**
 * Small, stable sample specs (one per variant) for the editor's tests. Real specs in
 * @nostrschool/nips change while their authors work; these pin the behaviours we test.
 * TextKeys here have no i18n strings on purpose: the editor must cope (it shows the key).
 */
import { FIXTURE_EVENTS, getPersona } from "@nostrschool/fixtures";
import type { EventShape, NipSpec } from "@nostrschool/nips";

export const BOB = getPersona("bob");
export const ALICE = getPersona("alice");
export const CAROL_PUBKEY = getPersona("carol").pubkey;
export const NOTE_ID = FIXTURE_EVENTS.find((e) => e.kind === 1)?.id ?? "0".repeat(64);

export const reaction: EventShape = {
  id: "reaction",
  label: "reaction.label",
  explain: "reaction.explain",
  kinds: [7],
  content: {
    format: "text",
    explain: "content",
    field: { type: "enum", values: [{ value: "+", explain: "plus" }, { value: "-" }], open: true },
  },
  tags: [
    {
      name: "e",
      explain: "tag.e",
      presence: "required",
      repeatable: false,
      fields: [
        { name: "event-id", type: { type: "event-id" }, explain: "tag.e.id" },
        { name: "relay", type: { type: "relay-url" }, explain: "tag.e.relay", optional: true },
      ],
    },
    {
      name: "p",
      explain: "tag.p",
      presence: "recommended",
      repeatable: true,
      fields: [{ name: "pubkey", type: { type: "pubkey" }, explain: "tag.p.pubkey" }],
    },
    {
      id: "k-root",
      name: "k",
      explain: "tag.k",
      presence: "optional",
      repeatable: false,
      fields: [
        { name: "kind", type: { type: "kind" }, explain: "tag.k.kind" },
        { name: "marker", type: { type: "text" }, explain: "tag.k.marker" },
      ],
      when: { index: 2, equals: "root" },
    },
  ],
  requireOneOf: [{ tags: ["e", "k"], explain: "rule.target" }],
  examples: [
    {
      id: "like",
      label: "ex.like",
      template: {
        kind: 7,
        tags: [
          ["e", NOTE_ID],
          ["p", BOB.pubkey],
        ],
        content: "+",
      },
    },
    {
      id: "dislike",
      label: "ex.dislike",
      signer: "carol",
      template: { kind: 7, created_at: 1700000000, tags: [["e", NOTE_ID]], content: "-" },
    },
  ],
};

export const dm: EventShape = {
  id: "dm",
  label: "dm.label",
  explain: "dm.explain",
  kinds: [4],
  content: {
    format: "encrypted",
    explain: "dm.content",
    scheme: "nip44",
    plaintext: { format: "text", explain: "dm.plain" },
  },
  tags: [
    {
      name: "p",
      explain: "dm.p",
      presence: "required",
      repeatable: false,
      fields: [{ name: "pubkey", type: { type: "pubkey" }, explain: "dm.p.pubkey" }],
    },
  ],
  examples: [],
};

export const eventSpec: NipSpec = {
  nip: "T1",
  variant: "event",
  howItWorks: [
    { id: "pick", title: "how.pick", body: "how.pick.body" },
    {
      id: "tag",
      title: "how.tag",
      body: "how.tag.body",
      focus: { part: { kind: "event", id: "reaction" }, path: ["tags", 0] },
    },
    {
      id: "dm",
      title: "how.dm",
      body: "how.dm.body",
      focus: { part: { kind: "event", id: "dm" } },
    },
  ],
  related: [],
  flows: [
    {
      id: "react",
      label: "flow.react",
      explain: "flow.react.explain",
      steps: [
        { part: { kind: "event", id: "reaction" }, explain: "flow.1" },
        { part: { kind: "event", id: "dm" }, explain: "flow.2" },
      ],
    },
  ],
  events: [reaction, dm],
};

export const messageSpec: NipSpec = {
  nip: "T2",
  variant: "message",
  howItWorks: [],
  related: [],
  messages: [
    {
      id: "req",
      label: "req.label",
      explain: "req.explain",
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
      replies: ["EVENT", "EOSE"],
      examples: [
        { id: "feed", label: "req.feed", message: ["REQ", "feed", { kinds: [1], limit: 5 }] },
      ],
    },
  ],
};

export const documentSpec: NipSpec = {
  nip: "T3",
  variant: "document",
  howItWorks: [],
  related: [],
  documents: [
    {
      id: "nostr-json",
      label: "doc.label",
      explain: "doc.explain",
      mediaType: "application/json",
      urlTemplate: "https://<domain>/.well-known/nostr.json?name=<local-part>",
      schema: {
        type: "object",
        explain: "doc.root",
        required: ["names"],
        properties: {
          names: {
            type: "object",
            explain: "doc.names",
            properties: {},
            additionalProperties: {
              type: "string",
              field: { type: "pubkey" },
              explain: "doc.name",
            },
          },
          relays: {
            type: "object",
            explain: "doc.relays",
            properties: {},
            additionalProperties: {
              type: "array",
              items: { type: "string", field: { type: "relay-url" } },
            },
          },
          admin: { type: "boolean", explain: "doc.admin" },
          version: { type: "number", integer: true },
          tags: { type: "tuple", items: [{ type: "string" }, { type: "number" }], minItems: 1 },
          note: { type: "null" },
        },
      },
      examples: [{ id: "bob", label: "doc.bob", value: { names: { bob: BOB.pubkey } } }],
    },
  ],
};

const authShape: EventShape = {
  id: "http-auth",
  label: "auth.label",
  explain: "auth.explain",
  kinds: [27235],
  content: { format: "empty" },
  tags: [
    {
      name: "u",
      explain: "auth.u",
      presence: "required",
      repeatable: false,
      fields: [{ name: "url", type: { type: "url" }, explain: "auth.u.url" }],
    },
    {
      name: "method",
      explain: "auth.method",
      presence: "required",
      repeatable: false,
      fields: [
        {
          name: "method",
          type: { type: "enum", values: [{ value: "GET" }, { value: "POST" }] },
          explain: "auth.method.v",
        },
      ],
    },
    {
      name: "payload",
      explain: "auth.payload",
      presence: "optional",
      repeatable: false,
      fields: [{ name: "sha256", type: { type: "hex32" }, explain: "auth.payload.v" }],
    },
  ],
  examples: [{ id: "get", label: "auth.get", template: { kind: 27235, tags: [], content: "" } }],
};

export const httpSpec: NipSpec = {
  nip: "T4",
  variant: "http",
  howItWorks: [],
  related: [],
  events: [authShape],
  http: [
    {
      id: "upload",
      label: "http.label",
      explain: "http.explain",
      method: "POST",
      urlTemplate: "https://<server>/upload",
      headers: [
        {
          name: "Authorization",
          explain: "http.auth",
          value: { type: "base64", of: "event" },
          required: true,
        },
      ],
      body: {
        mediaType: "application/json",
        schema: {
          type: "object",
          properties: { caption: { type: "string" } },
          required: ["caption"],
        },
      },
      responses: [
        { status: 200, explain: "http.ok" },
        { status: 401, explain: "http.unauthorized" },
      ],
      authEvent: "http-auth",
      examples: [
        {
          id: "post",
          label: "http.post",
          url: "https://files.example/upload",
          headers: { Authorization: "" },
          body: { caption: "hi" },
        },
      ],
    },
  ],
};

export const encodingSpec: NipSpec = {
  nip: "T5",
  variant: "encoding",
  howItWorks: [],
  related: [],
  encodings: [
    {
      id: "nprofile",
      label: "enc.nprofile",
      explain: "enc.nprofile.explain",
      codec: "nprofile",
      inputs: [
        { name: "pubkey", type: { type: "pubkey" }, explain: "enc.pubkey" },
        {
          name: "relays",
          type: { type: "relay-url" },
          explain: "enc.relays",
          optional: true,
          repeatable: true,
        },
      ],
      output: "enc.output",
      examples: [
        {
          id: "bob",
          label: "enc.bob",
          inputs: { pubkey: BOB.pubkey, relays: ["wss://relay.alpha.example"] },
        },
      ],
    },
    {
      id: "naddr",
      label: "enc.naddr",
      explain: "enc.naddr.explain",
      codec: "naddr",
      inputs: [
        { name: "identifier", type: { type: "text" }, explain: "enc.d" },
        { name: "pubkey", type: { type: "pubkey" }, explain: "enc.pubkey" },
        { name: "kind", type: { type: "kind" }, explain: "enc.kind" },
      ],
      output: "enc.output",
      examples: [
        {
          id: "post",
          label: "enc.post",
          inputs: { identifier: "hello", pubkey: BOB.pubkey, kind: "30023" },
        },
      ],
    },
    {
      id: "ncryptsec",
      label: "enc.ncryptsec",
      explain: "enc.ncryptsec.explain",
      codec: "ncryptsec",
      inputs: [
        { name: "secret-key", type: { type: "hex", bytes: 32 }, explain: "enc.sk" },
        { name: "password", type: { type: "text" }, explain: "enc.pw" },
        { name: "log_n", type: { type: "number", integer: true }, explain: "enc.logn" },
        {
          name: "key-security",
          type: { type: "enum", values: [{ value: "0" }, { value: "1" }, { value: "2" }] },
          explain: "enc.ksb",
        },
      ],
      output: "enc.output",
      examples: [
        {
          id: "alice",
          label: "enc.alice",
          inputs: {
            "secret-key": ALICE.secretKeyHex,
            password: "nostr",
            log_n: "1",
            "key-security": "2",
          },
        },
      ],
    },
    {
      id: "mnemonic",
      label: "enc.mnemonic",
      explain: "enc.mnemonic.explain",
      codec: "mnemonic",
      inputs: [
        { name: "mnemonic", type: { type: "text" }, explain: "enc.words" },
        {
          name: "account",
          type: { type: "number", integer: true },
          explain: "enc.account",
          optional: true,
        },
      ],
      output: "enc.output",
      examples: [
        {
          id: "nip06",
          label: "enc.nip06",
          inputs: {
            mnemonic:
              "leader monkey parrot ring guide accident before fence cannon height naive bean",
            account: "0",
          },
        },
      ],
    },
    {
      id: "payload",
      label: "enc.payload",
      explain: "enc.payload.explain",
      codec: "nip44-payload",
      inputs: [
        { name: "plaintext", type: { type: "text" }, explain: "enc.plain" },
        { name: "sender-secret", type: { type: "hex", bytes: 32 }, explain: "enc.sender" },
        { name: "recipient", type: { type: "pubkey" }, explain: "enc.recipient" },
      ],
      output: "enc.output",
      examples: [
        {
          id: "hi",
          label: "enc.hi",
          inputs: {
            plaintext: "hi bob",
            "sender-secret": ALICE.secretKeyHex,
            recipient: BOB.pubkey,
          },
        },
      ],
    },
  ],
};

export const processSpec: NipSpec = {
  nip: "T6",
  variant: "process",
  howItWorks: [{ id: "one", title: "p.how", body: "p.how.body" }],
  related: [],
  process: {
    actors: [
      { id: "client", label: "p.client", kind: "client" },
      { id: "relay", label: "p.relay", kind: "relay" },
    ],
    steps: [
      {
        id: "send",
        from: "client",
        to: "relay",
        label: "p.send",
        explain: "p.send.x",
        packet: "EVENT",
      },
      { id: "store", from: "relay", label: "p.store", explain: "p.store.x" },
    ],
  },
};
