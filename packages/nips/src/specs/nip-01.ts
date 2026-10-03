// Owner: spec author r1 (NIPs 01–19). NIP-01: Basic protocol flow description.
// Explanations: packages/i18n/src/locales/en/nips/r1.ts → n01.text.
import type { NipSpec } from "../spec.ts";

const ALICE = "e550c6e92808f358382b7b8c14345344f5ef9a299529834d1c26d57b6ace44cc";
const BOB = "a73883912a48c3551c1548fd454876d577126a61c76b5486c807bfec5869e183";
const FRANK = "922e43b50aec16ad1e9d1ec6854c058816d28b944ae2fe9bdce3d9241bfaafb8";

// A real signed fixture note (bob, "testing testing…"): wire-message examples carry whole events,
// and these must verify, so they reuse a fixture instead of an unsigned template.
const BOB_NOTE = {
  id: "ea2e3eb8fe5e6cfbc202da21df546f68c6673e9a00c0aed61cffbac7aed9faf7",
  pubkey: BOB,
  created_at: 1735686600,
  kind: 1,
  tags: [],
  content: "testing testing is this thing on",
  sig: "82bc74fdbd5b113f257f4c8b2a6db64410ae897362bd42839fe9a34737d5ecb518a99f8517058ef8c2beadc222142e4d68f034e829edc9dd1b6bd13d2a139a7d",
};

/** OK/CLOSED reason: empty, or "<machine-readable-prefix>: <human message>". */
const REASON = { type: "text", pattern: "(?:[a-z-]+: .*)?" } as const;
const SUB_ID = { type: "string", field: { type: "text", minLength: 1, maxLength: 64 } } as const;

export const nip01: NipSpec = {
  nip: "01",
  variant: "event",
  howItWorks: [
    { id: "keys", title: "how.keys.title", body: "how.keys.body" },
    {
      id: "build",
      title: "how.build.title",
      body: "how.build.body",
      focus: { part: { kind: "event", id: "event" }, path: ["tags"] },
    },
    {
      id: "id",
      title: "how.id.title",
      body: "how.id.body",
      focus: { part: { kind: "event", id: "event" }, path: ["id"] },
    },
    {
      id: "sign",
      title: "how.sign.title",
      body: "how.sign.body",
      focus: { part: { kind: "event", id: "event" }, path: ["sig"] },
    },
    {
      id: "publish",
      title: "how.publish.title",
      body: "how.publish.body",
      focus: { part: { kind: "message", id: "client-event" } },
    },
    {
      id: "subscribe",
      title: "how.subscribe.title",
      body: "how.subscribe.body",
      focus: { part: { kind: "message", id: "req" }, path: [2] },
    },
  ],
  related: [
    { nip: "10", relation: "used-by", explain: "related.10" },
    { nip: "19", relation: "see-also", explain: "related.19" },
    { nip: "11", relation: "see-also", explain: "related.11" },
    { nip: "12", relation: "replaces", explain: "related.merged" },
    { nip: "16", relation: "replaces", explain: "related.merged" },
    { nip: "20", relation: "replaces", explain: "related.merged" },
    { nip: "33", relation: "replaces", explain: "related.merged" },
  ],
  flows: [
    {
      id: "publish",
      label: "flow.publish.label",
      explain: "flow.publish.explain",
      steps: [
        { part: { kind: "message", id: "client-event" }, explain: "flow.publish.send" },
        { part: { kind: "message", id: "ok" }, explain: "flow.publish.ok" },
      ],
    },
    {
      id: "subscribe",
      label: "flow.subscribe.label",
      explain: "flow.subscribe.explain",
      steps: [
        { part: { kind: "message", id: "req" }, explain: "flow.subscribe.req" },
        { part: { kind: "message", id: "relay-event" }, explain: "flow.subscribe.event" },
        { part: { kind: "message", id: "eose" }, explain: "flow.subscribe.eose" },
        { part: { kind: "message", id: "close" }, explain: "flow.subscribe.close" },
      ],
    },
  ],
  events: [
    {
      id: "event",
      label: "event.label",
      explain: "event.explain",
      kinds: [{ from: 0, to: 65535 }],
      content: { format: "text", explain: "event.content", multiline: true },
      tags: [
        {
          name: "e",
          explain: "tag.e",
          presence: "optional",
          repeatable: true,
          fields: [
            { name: "event-id", type: { type: "event-id" }, explain: "tag.e.id" },
            { name: "relay", type: { type: "relay-url" }, explain: "tag.relay", optional: true },
            { name: "author", type: { type: "pubkey" }, explain: "tag.e.author", optional: true },
          ],
        },
        {
          name: "p",
          explain: "tag.p",
          presence: "optional",
          repeatable: true,
          fields: [
            { name: "pubkey", type: { type: "pubkey" }, explain: "tag.p.pubkey" },
            { name: "relay", type: { type: "relay-url" }, explain: "tag.relay", optional: true },
          ],
        },
        {
          name: "a",
          explain: "tag.a",
          presence: "optional",
          repeatable: true,
          fields: [
            { name: "address", type: { type: "addr" }, explain: "tag.a.address" },
            { name: "relay", type: { type: "relay-url" }, explain: "tag.relay", optional: true },
          ],
        },
      ],
      examples: [
        {
          id: "note",
          label: "example.note.label",
          explain: "example.note.explain",
          signer: "bob",
          template: {
            kind: 1,
            created_at: 1735685100,
            tags: [["t", "nostr"]],
            content:
              "Hot take: the best feature of #nostr is that your identity is just a keypair. No email, no phone number.",
          },
        },
        {
          id: "references",
          label: "example.references.label",
          explain: "example.references.explain",
          signer: "alice",
          template: {
            kind: 1,
            tags: [
              [
                "e",
                "814d487f9a9591bde04009eff371facb26e82f3a41cec1bcdcdab310075053be",
                "wss://relay.beta.example",
                BOB,
              ],
              ["p", FRANK, "wss://relay.beta.example"],
              ["a", `30023:${FRANK}:protocols-not-platforms`, "wss://relay.beta.example"],
            ],
            content: "Bob's hot take pairs well with Frank's essay on protocols.",
          },
        },
      ],
    },
    {
      id: "metadata",
      label: "metadata.label",
      explain: "metadata.explain",
      kinds: [0],
      content: {
        format: "json",
        explain: "metadata.content",
        schema: {
          type: "object",
          explain: "metadata.schema",
          properties: {
            name: { type: "string", explain: "metadata.name" },
            about: {
              type: "string",
              explain: "metadata.about",
              field: { type: "text", multiline: true },
            },
            picture: { type: "string", explain: "metadata.picture", field: { type: "url" } },
          },
          additionalProperties: true,
        },
      },
      tags: [],
      examples: [
        {
          id: "alice",
          label: "example.metadata.label",
          explain: "example.metadata.explain",
          signer: "alice",
          template: {
            kind: 0,
            created_at: 1733097600,
            tags: [],
            content:
              '{"name":"alice","about":"Protocol nerd. I explain Nostr one event at a time.","picture":"https://alpha.example/alice.png"}',
          },
        },
      ],
    },
  ],
  messages: [
    {
      id: "client-event",
      label: "msg.client-event.label",
      explain: "msg.client-event.explain",
      direction: "client-to-relay",
      type: "EVENT",
      elements: [
        { name: "event", explain: "msg.el.event", schema: { type: "event", signed: true } },
      ],
      replies: ["ok"],
      examples: [{ id: "publish", label: "example.client-event", message: ["EVENT", BOB_NOTE] }],
    },
    {
      id: "req",
      label: "msg.req.label",
      explain: "msg.req.explain",
      direction: "client-to-relay",
      type: "REQ",
      elements: [
        { name: "subscription_id", explain: "msg.el.sub-id", schema: SUB_ID },
        { name: "filter", explain: "msg.el.filter", schema: { type: "filter" }, repeatable: true },
      ],
      replies: ["relay-event", "eose", "closed"],
      examples: [
        {
          id: "feed",
          label: "example.req.feed.label",
          explain: "example.req.feed.explain",
          message: ["REQ", "feed", { kinds: [1], authors: [ALICE, BOB], limit: 20 }],
        },
        {
          id: "tags",
          label: "example.req.tags.label",
          explain: "example.req.tags.explain",
          message: [
            "REQ",
            "mentions",
            { "#p": [ALICE], kinds: [1, 7], since: 1735603200 },
            { "#t": ["nostr"], limit: 10 },
          ],
        },
      ],
    },
    {
      id: "close",
      label: "msg.close.label",
      explain: "msg.close.explain",
      direction: "client-to-relay",
      type: "CLOSE",
      elements: [{ name: "subscription_id", explain: "msg.el.sub-id", schema: SUB_ID }],
      examples: [{ id: "close", label: "example.close", message: ["CLOSE", "feed"] }],
    },
    {
      id: "relay-event",
      label: "msg.relay-event.label",
      explain: "msg.relay-event.explain",
      direction: "relay-to-client",
      type: "EVENT",
      elements: [
        { name: "subscription_id", explain: "msg.el.sub-id", schema: SUB_ID },
        { name: "event", explain: "msg.el.event", schema: { type: "event", signed: true } },
      ],
      examples: [
        { id: "match", label: "example.relay-event", message: ["EVENT", "feed", BOB_NOTE] },
      ],
    },
    {
      id: "ok",
      label: "msg.ok.label",
      explain: "msg.ok.explain",
      direction: "relay-to-client",
      type: "OK",
      elements: [
        {
          name: "event_id",
          explain: "msg.el.ok-id",
          schema: { type: "string", field: { type: "event-id" } },
        },
        { name: "accepted", explain: "msg.el.accepted", schema: { type: "boolean" } },
        { name: "message", explain: "msg.el.reason", schema: { type: "string", field: REASON } },
      ],
      examples: [
        { id: "accepted", label: "example.ok.accepted", message: ["OK", BOB_NOTE.id, true, ""] },
        {
          id: "rejected",
          label: "example.ok.rejected",
          message: ["OK", BOB_NOTE.id, false, "blocked: you are banned from posting here"],
        },
      ],
    },
    {
      id: "eose",
      label: "msg.eose.label",
      explain: "msg.eose.explain",
      direction: "relay-to-client",
      type: "EOSE",
      elements: [{ name: "subscription_id", explain: "msg.el.sub-id", schema: SUB_ID }],
      examples: [{ id: "eose", label: "example.eose", message: ["EOSE", "feed"] }],
    },
    {
      id: "closed",
      label: "msg.closed.label",
      explain: "msg.closed.explain",
      direction: "relay-to-client",
      type: "CLOSED",
      elements: [
        { name: "subscription_id", explain: "msg.el.sub-id", schema: SUB_ID },
        { name: "message", explain: "msg.el.reason", schema: { type: "string", field: REASON } },
      ],
      examples: [
        {
          id: "unsupported",
          label: "example.closed",
          message: ["CLOSED", "feed", "unsupported: filter contains unknown elements"],
        },
      ],
    },
    {
      id: "notice",
      label: "msg.notice.label",
      explain: "msg.notice.explain",
      direction: "relay-to-client",
      type: "NOTICE",
      elements: [
        {
          name: "message",
          explain: "msg.el.notice",
          schema: { type: "string", field: { type: "text" } },
        },
      ],
      examples: [
        {
          id: "notice",
          label: "example.notice",
          message: ["NOTICE", "relay restarting in 5 minutes for maintenance"],
        },
      ],
    },
  ],
};
