// Owner: spec author r5 (NIPs 80–99). NIP-88: Polls.
import type { NipSpec } from "../spec.ts";

const ALPHA = "wss://relay.alpha.example";
const GAMMA = "wss://relay.gamma.example";
/** Ids of the two poll examples once the editor signs them (alice / dave, created_at = FIXTURE_NOW). */
const PIZZA_POLL = "d53b91ae95a78c8ef43a25c19d1e5fc98e843ef7c8fad4da6cadc4e3e1dc74a4";
const PAYMENTS_POLL = "376e35a0adf40e1fc289715e8974cc54bece3ecca5b134d0fe413c0a3928361d";

export const nip88: NipSpec = {
  nip: "88",
  variant: "event",
  howItWorks: [
    {
      id: "ask",
      title: "how.ask.title",
      body: "how.ask.body",
      focus: { part: { kind: "event", id: "poll" }, path: ["content"] },
    },
    {
      id: "options",
      title: "how.options.title",
      body: "how.options.body",
      focus: { part: { kind: "event", id: "poll" }, path: ["tags", 0] },
    },
    {
      id: "where",
      title: "how.where.title",
      body: "how.where.body",
      focus: { part: { kind: "event", id: "poll" }, path: ["tags", 2] },
    },
    {
      id: "vote",
      title: "how.vote.title",
      body: "how.vote.body",
      focus: { part: { kind: "event", id: "response" }, path: ["tags", 1] },
    },
    {
      id: "count",
      title: "how.count.title",
      body: "how.count.body",
    },
  ],
  related: [
    { nip: "01", relation: "depends-on", explain: "related.01" },
    { nip: "51", relation: "see-also", explain: "related.51" },
    { nip: "13", relation: "see-also", explain: "related.13" },
    { nip: "09", relation: "see-also", explain: "related.09" },
  ],
  flows: [
    {
      id: "vote",
      label: "flow.vote.label",
      explain: "flow.vote.explain",
      steps: [
        { part: { kind: "event", id: "poll" }, explain: "flow.vote.poll" },
        { part: { kind: "event", id: "response" }, explain: "flow.vote.response" },
      ],
    },
  ],
  events: [
    {
      id: "poll",
      label: "event.poll.label",
      explain: "event.poll.explain",
      kinds: [1068],
      content: { format: "text", explain: "content.poll", required: true },
      tags: [
        {
          name: "option",
          explain: "tag.option",
          presence: "required",
          repeatable: true,
          fields: [
            {
              name: "option-id",
              type: { type: "text", pattern: "[A-Za-z0-9]+" },
              explain: "tag.option.id",
            },
            { name: "label", type: { type: "text", minLength: 1 }, explain: "tag.option.label" },
          ],
        },
        {
          name: "relay",
          explain: "tag.relay",
          presence: "recommended",
          repeatable: true,
          fields: [{ name: "url", type: { type: "relay-url" }, explain: "tag.relay.url" }],
        },
        {
          name: "polltype",
          explain: "tag.polltype",
          presence: "optional",
          repeatable: false,
          fields: [
            {
              name: "type",
              type: {
                type: "enum",
                values: [
                  { value: "singlechoice", explain: "polltype.singlechoice" },
                  { value: "multiplechoice", explain: "polltype.multiplechoice" },
                ],
              },
              explain: "tag.polltype.type",
            },
          ],
        },
        {
          name: "endsAt",
          explain: "tag.endsAt",
          presence: "optional",
          repeatable: false,
          fields: [{ name: "time", type: { type: "timestamp" }, explain: "tag.endsAt.time" }],
        },
      ],
      examples: [
        {
          id: "single",
          label: "example.single.label",
          explain: "example.single.explain",
          signer: "alice",
          template: {
            kind: 1068,
            tags: [
              ["option", "qj518h583", "Yay"],
              ["option", "gga6cdnqj", "Nay"],
              ["relay", ALPHA],
              ["relay", GAMMA],
              ["polltype", "singlechoice"],
              ["endsAt", "1736294400"],
            ],
            content: "Pineapple on pizza?",
          },
        },
        {
          id: "multiple",
          label: "example.multiple.label",
          explain: "example.multiple.explain",
          signer: "dave",
          template: {
            kind: 1068,
            tags: [
              ["option", "ln", "Lightning zaps"],
              ["option", "nwc", "Nostr Wallet Connect"],
              ["option", "cashu", "Cashu ecash"],
              ["relay", "wss://relay.delta.example"],
              ["polltype", "multiplechoice"],
            ],
            content: "Which payment features should relay.delta support next?",
          },
        },
      ],
    },
    {
      id: "response",
      label: "event.response.label",
      explain: "event.response.explain",
      kinds: [1018],
      content: { format: "text", explain: "content.response" },
      tags: [
        {
          name: "e",
          explain: "tag.e",
          presence: "required",
          repeatable: false,
          fields: [{ name: "poll-id", type: { type: "event-id" }, explain: "tag.e.poll" }],
        },
        {
          name: "response",
          explain: "tag.response",
          presence: "required",
          repeatable: true,
          fields: [
            {
              name: "option-id",
              type: { type: "text", pattern: "[A-Za-z0-9]+" },
              explain: "tag.response.id",
            },
          ],
        },
      ],
      examples: [
        {
          id: "vote-yay",
          label: "example.vote-yay.label",
          explain: "example.vote-yay.explain",
          signer: "bob",
          template: {
            kind: 1018,
            tags: [
              ["e", PIZZA_POLL],
              ["response", "qj518h583"],
            ],
            content: "",
          },
        },
        {
          id: "vote-many",
          label: "example.vote-many.label",
          explain: "example.vote-many.explain",
          signer: "erin",
          template: {
            kind: 1018,
            tags: [
              ["e", PAYMENTS_POLL],
              ["response", "ln"],
              ["response", "cashu"],
            ],
            content: "",
          },
        },
      ],
    },
  ],
};
