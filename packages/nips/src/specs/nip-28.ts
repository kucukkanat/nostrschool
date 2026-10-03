// Owner: spec author r2 (NIPs 20–39). NIP-28: Public Chat (kinds 40–44) — UNRECOMMENDED, use NIP-29.
import type { JsonSchema, NipSpec, TagSpec } from "../spec.ts";

const BOB = "a73883912a48c3551c1548fd454876d577126a61c76b5486c807bfec5869e183";
const DELTA = "wss://relay.delta.example";
// Id of the "create" example (kind 40 by dave at FIXTURE_NOW); r2.test.ts recomputes it.
export const NIP28_CHANNEL_ID = "abed41c6881db73cb19a66fedab1b21b2010338be4d69e5501041273417c6a84";
// Id of the "root" message example (kind 42 by bob at FIXTURE_NOW).
const MESSAGE_ID = "51551b87f64fa3150c39f9a41ee855300044ab5c25d2f50d92b5f208686d5830";

const channelMeta: JsonSchema = {
  type: "object",
  explain: "schema.meta",
  properties: {
    name: { type: "string", explain: "field.name" },
    about: { type: "string", explain: "field.about" },
    picture: { type: "string", explain: "field.picture", field: { type: "url" } },
    relays: {
      type: "array",
      explain: "field.relays",
      items: { type: "string", field: { type: "relay-url" } },
    },
  },
};

const reason: JsonSchema = {
  type: "object",
  explain: "schema.reason",
  properties: { reason: { type: "string", explain: "field.reason" } },
};

const rootTag = (presence: TagSpec["presence"]): TagSpec => ({
  id: "e-root",
  name: "e",
  explain: "tag.e-root",
  presence,
  repeatable: false,
  when: { index: 3, equals: "root" },
  template: ["e", NIP28_CHANNEL_ID, DELTA, "root"],
  fields: [
    { name: "channel-id", type: { type: "event-id" }, explain: "tag.e-root.id" },
    { name: "relay", type: { type: "relay-url" }, explain: "tag.relay" },
    {
      name: "marker",
      type: { type: "enum", values: [{ value: "root", explain: "marker.root" }] },
      explain: "tag.marker",
    },
  ],
});

const pTag: TagSpec = {
  name: "p",
  explain: "tag.p",
  presence: "optional",
  repeatable: true,
  fields: [
    { name: "pubkey", type: { type: "pubkey" }, explain: "tag.p.pubkey" },
    { name: "relay", type: { type: "relay-url" }, explain: "tag.relay", optional: true },
  ],
};

export const nip28: NipSpec = {
  nip: "28",
  variant: "event",
  howItWorks: [
    { id: "unrecommended", title: "how.unrecommended.title", body: "how.unrecommended.body" },
    {
      id: "create",
      title: "how.create.title",
      body: "how.create.body",
      focus: { part: { kind: "event", id: "create" }, path: ["content"] },
    },
    {
      id: "metadata",
      title: "how.metadata.title",
      body: "how.metadata.body",
      focus: { part: { kind: "event", id: "metadata" }, path: ["tags", 0] },
    },
    {
      id: "message",
      title: "how.message.title",
      body: "how.message.body",
      focus: { part: { kind: "event", id: "message" }, path: ["tags"] },
    },
    {
      id: "moderation",
      title: "how.moderation.title",
      body: "how.moderation.body",
      focus: { part: { kind: "event", id: "hide" } },
    },
  ],
  related: [
    { nip: "29", relation: "replaced-by", explain: "related.29" },
    { nip: "10", relation: "depends-on", explain: "related.10" },
    { nip: "C7", relation: "see-also", explain: "related.C7" },
  ],
  flows: [
    {
      id: "channel",
      label: "flow.channel.label",
      explain: "flow.channel.explain",
      steps: [
        { part: { kind: "event", id: "create" }, explain: "flow.channel.create" },
        { part: { kind: "event", id: "metadata" }, explain: "flow.channel.metadata" },
        { part: { kind: "event", id: "message" }, explain: "flow.channel.message" },
        { part: { kind: "event", id: "hide" }, explain: "flow.channel.hide" },
        { part: { kind: "event", id: "mute" }, explain: "flow.channel.mute" },
      ],
    },
  ],
  events: [
    {
      id: "create",
      label: "event.create.label",
      explain: "event.create.explain",
      kinds: [40],
      content: { format: "json", explain: "content.create", schema: channelMeta },
      tags: [],
      examples: [
        {
          id: "create",
          label: "example.create",
          signer: "dave",
          template: {
            kind: 40,
            tags: [],
            content: JSON.stringify({
              name: "Relay operators",
              about: "Uptime, spam and bandwidth talk for people who run relays.",
              picture: "https://relay.delta.example/icon.png",
              relays: [DELTA, "wss://relay.alpha.example"],
            }),
          },
        },
      ],
    },
    {
      id: "metadata",
      label: "event.metadata.label",
      explain: "event.metadata.explain",
      kinds: [41],
      content: { format: "json", explain: "content.metadata", schema: channelMeta },
      tags: [
        rootTag("required"),
        {
          name: "t",
          explain: "tag.t",
          presence: "optional",
          repeatable: true,
          fields: [{ name: "category", type: { type: "text" }, explain: "tag.t.value" }],
        },
      ],
      examples: [
        {
          id: "update",
          label: "example.update",
          signer: "dave",
          template: {
            kind: 41,
            tags: [
              ["e", NIP28_CHANNEL_ID, DELTA, "root"],
              ["t", "relays"],
              ["t", "ops"],
            ],
            content: JSON.stringify({
              name: "Relay operators",
              about: "Uptime, spam, bandwidth and paid-relay economics.",
              picture: "https://relay.delta.example/icon.png",
              relays: [DELTA],
            }),
          },
        },
      ],
    },
    {
      id: "message",
      label: "event.message.label",
      explain: "event.message.explain",
      kinds: [42],
      content: { format: "text", explain: "content.message", required: true, multiline: true },
      tags: [
        rootTag("required"),
        {
          id: "e-reply",
          name: "e",
          explain: "tag.e-reply",
          presence: "optional",
          repeatable: false,
          when: { index: 3, equals: "reply" },
          fields: [
            { name: "message-id", type: { type: "event-id" }, explain: "tag.e-reply.id" },
            { name: "relay", type: { type: "relay-url" }, explain: "tag.relay" },
            {
              name: "marker",
              type: { type: "enum", values: [{ value: "reply", explain: "marker.reply" }] },
              explain: "tag.marker",
            },
          ],
        },
        pTag,
      ],
      examples: [
        {
          id: "root",
          label: "example.root",
          signer: "bob",
          template: {
            kind: 42,
            tags: [["e", NIP28_CHANNEL_ID, DELTA, "root"]],
            content: "How much bandwidth does a small relay use in a month?",
          },
        },
        {
          id: "reply",
          label: "example.reply",
          explain: "example.reply.explain",
          signer: "dave",
          template: {
            kind: 42,
            tags: [
              ["e", NIP28_CHANNEL_ID, DELTA, "root"],
              ["e", MESSAGE_ID, DELTA, "reply"],
              ["p", BOB, "wss://relay.beta.example"],
            ],
            content: "Less than you'd think: mostly small JSON events. Images live elsewhere.",
          },
        },
      ],
    },
    {
      id: "hide",
      label: "event.hide.label",
      explain: "event.hide.explain",
      kinds: [43],
      content: { format: "json", explain: "content.hide", schema: reason },
      tags: [
        {
          name: "e",
          explain: "tag.e-hide",
          presence: "required",
          repeatable: false,
          fields: [{ name: "message-id", type: { type: "event-id" }, explain: "tag.e-hide.id" }],
        },
      ],
      examples: [
        {
          id: "hide",
          label: "example.hide",
          signer: "grace",
          template: {
            kind: 43,
            tags: [["e", MESSAGE_ID]],
            content: JSON.stringify({ reason: "Already answered in the pinned FAQ" }),
          },
        },
      ],
    },
    {
      id: "mute",
      label: "event.mute.label",
      explain: "event.mute.explain",
      kinds: [44],
      content: { format: "json", explain: "content.mute", schema: reason },
      tags: [
        {
          name: "p",
          explain: "tag.p-mute",
          presence: "required",
          repeatable: false,
          fields: [{ name: "pubkey", type: { type: "pubkey" }, explain: "tag.p-mute.pubkey" }],
        },
      ],
      examples: [
        {
          id: "mute",
          label: "example.mute",
          signer: "grace",
          template: {
            kind: 44,
            tags: [["p", BOB]],
            content: JSON.stringify({ reason: "Not interested in relay ops chatter" }),
          },
        },
      ],
    },
  ],
};
