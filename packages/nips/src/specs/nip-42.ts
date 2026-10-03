// Owner: spec author r3 (NIPs 40–59). NIP-42: Authentication of clients to relays.
// Explanations: packages/i18n/src/locales/en/nips/r3.ts → n42.text.
import type { NipSpec } from "../spec.ts";

const RELAY = "wss://relay.delta.example/";
const CHALLENGE = "a3f1c9e2b7d04f58";

/** Alice's kind 22242 answer to CHALLENGE, signed with her demo key at FIXTURE_NOW. */
const SIGNED_AUTH = {
  kind: 22242,
  created_at: 1735689600,
  tags: [
    ["relay", RELAY],
    ["challenge", CHALLENGE],
  ],
  content: "",
  pubkey: "e550c6e92808f358382b7b8c14345344f5ef9a299529834d1c26d57b6ace44cc",
  id: "7990148b9e36f32eb0e76a63340aa39dae19feffe5ce6fceea7b494cdfd6f974",
  sig: "4df902946cb4724480474ad933363615c5e44c2252edc26f289e0e522d0750205df9a89859629e34a9bbf133efcfd7a56aab8b737f731278b5454717af37126e",
};

export const nip42: NipSpec = {
  nip: "42",
  variant: "message",
  messages: [
    {
      id: "auth-challenge",
      label: "msg.challenge.label",
      explain: "msg.challenge.explain",
      direction: "relay-to-client",
      type: "AUTH",
      elements: [
        {
          name: "challenge",
          explain: "msg.challenge.challenge",
          schema: { type: "string", field: { type: "text", minLength: 1 } },
        },
      ],
      replies: ["auth-event"],
      examples: [{ id: "challenge", label: "example.challenge", message: ["AUTH", CHALLENGE] }],
    },
    {
      id: "auth-event",
      label: "msg.auth.label",
      explain: "msg.auth.explain",
      direction: "client-to-relay",
      type: "AUTH",
      elements: [
        {
          name: "event",
          explain: "msg.auth.event",
          schema: { type: "event", shape: "auth", signed: true },
        },
      ],
      replies: ["ok"],
      examples: [
        {
          id: "signed",
          label: "example.auth-message",
          explain: "example.auth-message.explain",
          message: ["AUTH", SIGNED_AUTH],
        },
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
          name: "event-id",
          explain: "msg.ok.event-id",
          schema: { type: "string", field: { type: "event-id" } },
        },
        { name: "accepted", explain: "msg.ok.accepted", schema: { type: "boolean" } },
        {
          name: "message",
          explain: "msg.ok.message",
          schema: { type: "string" },
        },
      ],
      examples: [
        {
          id: "auth-accepted",
          label: "example.ok-accepted",
          message: ["OK", SIGNED_AUTH.id, true, ""],
        },
        {
          id: "write-needs-auth",
          label: "example.ok-auth-required",
          explain: "example.ok-auth-required.explain",
          message: [
            "OK",
            "15cffdead80167df7f424161663d3ac3fbd30723303ba0e9a97ef16d3e405911",
            false,
            "auth-required: we only accept events from registered users",
          ],
        },
        {
          id: "restricted",
          label: "example.ok-restricted",
          message: [
            "OK",
            "15cffdead80167df7f424161663d3ac3fbd30723303ba0e9a97ef16d3e405911",
            false,
            "restricted: this pubkey is not a paying member",
          ],
        },
      ],
    },
    {
      id: "closed",
      label: "msg.closed.label",
      explain: "msg.closed.explain",
      direction: "relay-to-client",
      type: "CLOSED",
      elements: [
        {
          name: "subscription-id",
          explain: "msg.closed.subscription-id",
          schema: { type: "string", field: { type: "text", minLength: 1, maxLength: 64 } },
        },
        {
          name: "message",
          explain: "msg.closed.message",
          schema: {
            type: "string",
            field: { type: "text", pattern: "(auth-required: |restricted: ).*" },
          },
        },
      ],
      examples: [
        {
          id: "dms-need-auth",
          label: "example.closed",
          explain: "example.closed.explain",
          message: [
            "CLOSED",
            "sub_1",
            "auth-required: we can't serve DMs to unauthenticated users",
          ],
        },
      ],
    },
  ],
  events: [
    {
      id: "auth",
      label: "event.label",
      explain: "event.explain",
      kinds: [22242],
      content: { format: "empty", explain: "event.content" },
      tags: [
        {
          name: "relay",
          explain: "tag.relay",
          presence: "required",
          repeatable: false,
          fields: [
            {
              name: "url",
              type: { type: "relay-url" },
              explain: "tag.relay.url",
              placeholder: RELAY,
            },
          ],
        },
        {
          name: "challenge",
          explain: "tag.challenge",
          presence: "required",
          repeatable: false,
          fields: [
            {
              name: "challenge",
              type: { type: "text", minLength: 1 },
              explain: "tag.challenge.value",
              placeholder: CHALLENGE,
            },
          ],
        },
      ],
      unknownTags: "warn",
      examples: [
        {
          id: "alice",
          label: "example.event",
          explain: "example.event.explain",
          signer: "alice",
          template: {
            kind: 22242,
            tags: [
              ["relay", RELAY],
              ["challenge", CHALLENGE],
            ],
            content: "",
          },
        },
      ],
    },
  ],
  flows: [
    {
      id: "read-after-auth",
      label: "flow.read.label",
      explain: "flow.read.explain",
      steps: [
        { part: { kind: "message", id: "auth-challenge" }, explain: "flow.read.challenge" },
        { part: { kind: "message", id: "closed" }, explain: "flow.read.closed" },
        { part: { kind: "event", id: "auth" }, explain: "flow.read.sign" },
        { part: { kind: "message", id: "auth-event" }, explain: "flow.read.send" },
        { part: { kind: "message", id: "ok" }, explain: "flow.read.ok" },
      ],
    },
  ],
  howItWorks: [
    {
      id: "challenge",
      title: "how.challenge.title",
      body: "how.challenge.body",
      focus: { part: { kind: "message", id: "auth-challenge" }, path: [1] },
    },
    {
      id: "refusal",
      title: "how.refusal.title",
      body: "how.refusal.body",
      focus: { part: { kind: "message", id: "closed" }, path: [2] },
    },
    {
      id: "sign",
      title: "how.sign.title",
      body: "how.sign.body",
      focus: { part: { kind: "event", id: "auth" }, path: ["tags"] },
    },
    {
      id: "send",
      title: "how.send.title",
      body: "how.send.body",
      focus: { part: { kind: "message", id: "auth-event" }, path: [1] },
    },
    {
      id: "verify",
      title: "how.verify.title",
      body: "how.verify.body",
      focus: { part: { kind: "message", id: "ok" } },
    },
  ],
  related: [
    { nip: "01", relation: "extends", explain: "related.01" },
    { nip: "11", relation: "see-also", explain: "related.11" },
    { nip: "17", relation: "used-by", explain: "related.17" },
    { nip: "59", relation: "used-by", explain: "related.59" },
    { nip: "67", relation: "see-also", explain: "related.67" },
  ],
};
