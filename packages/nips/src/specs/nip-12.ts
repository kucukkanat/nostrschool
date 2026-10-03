// Owner: spec author r1 (NIPs 01–19). NIP-12: Generic Tag Queries.
// Deprecated upstream: "Moved to NIP-01" (tag filters like {"#t": [...]} are part of REQ now).
// Explanations: packages/i18n/src/locales/en/nips/r1.ts → n12.text.
import type { NipSpec } from "../spec.ts";

const BOB = "a73883912a48c3551c1548fd454876d577126a61c76b5486c807bfec5869e183";

export const nip12: NipSpec = {
  nip: "12",
  variant: "process",
  howItWorks: [
    { id: "moved", title: "how.moved.title", body: "how.moved.body" },
    {
      id: "filter",
      title: "how.filter.title",
      body: "how.filter.body",
      focus: { part: { kind: "message", id: "tag-query" }, path: [2] },
    },
    { id: "first-value", title: "how.first-value.title", body: "how.first-value.body" },
  ],
  related: [{ nip: "01", relation: "replaced-by", explain: "related.01" }],
  process: {
    actors: [
      { id: "client", label: "actor.client", kind: "client" },
      { id: "relay", label: "actor.relay", kind: "relay" },
    ],
    steps: [
      {
        id: "req",
        from: "client",
        to: "relay",
        label: "step.req.label",
        explain: "step.req.explain",
        packet: "REQ",
        payload: ["REQ", "topic", { "#t": ["nostr"], kinds: [1] }],
        part: { kind: "message", id: "tag-query" },
      },
      {
        id: "match",
        from: "relay",
        label: "step.match.label",
        explain: "step.match.explain",
      },
      {
        id: "event",
        from: "relay",
        to: "client",
        label: "step.event.label",
        explain: "step.event.explain",
        packet: "EVENT",
        payload: [
          "EVENT",
          "topic",
          {
            id: "814d487f9a9591bde04009eff371facb26e82f3a41cec1bcdcdab310075053be",
            pubkey: BOB,
            kind: 1,
            tags: [["t", "nostr"]],
            content:
              "Hot take: the best feature of #nostr is that your identity is just a keypair.",
          },
        ],
      },
      {
        id: "eose",
        from: "relay",
        to: "client",
        label: "step.eose.label",
        explain: "step.eose.explain",
        packet: "EOSE",
        payload: ["EOSE", "topic"],
      },
    ],
  },
  messages: [
    {
      id: "tag-query",
      label: "msg.label",
      explain: "msg.explain",
      direction: "client-to-relay",
      type: "REQ",
      elements: [
        {
          name: "subscription_id",
          explain: "msg.sub-id",
          schema: { type: "string", field: { type: "text", minLength: 1, maxLength: 64 } },
        },
        { name: "filter", explain: "msg.filter", schema: { type: "filter" }, repeatable: true },
      ],
      examples: [
        {
          id: "hashtag",
          label: "example.hashtag.label",
          explain: "example.hashtag.explain",
          message: ["REQ", "topic", { "#t": ["nostr"], kinds: [1] }],
        },
        {
          id: "replies",
          label: "example.replies.label",
          explain: "example.replies.explain",
          message: [
            "REQ",
            "thread",
            { "#e": ["91a74c40d508831576cca43d0d0c58793bb60df736783b40ddfbc68deed5ab06"] },
          ],
        },
      ],
    },
  ],
};
