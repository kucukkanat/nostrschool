// Owner: spec author r3 (NIPs 40–59). NIP-45: Event Counts.
// Explanations: packages/i18n/src/locales/en/nips/r3.ts → n45.text.
import type { NipSpec } from "../spec.ts";

const ALICE = "e550c6e92808f358382b7b8c14345344f5ef9a299529834d1c26d57b6ace44cc";
const NOTE = "6f762f141286ff49dc17f167204069df048758cf0a4cd83dae2455f277241253";
const HLL =
  "0607070505060806050508060707070706090d080b0605090607070b07090606060b0705070709050807080805080407060906080707080507070805060509040a0b06060704060405070706080607050907070b08060808080b080607090a06060805060604070908050607060805050d05060906090809080807050e0705070507060907060606070708080b0807070708080706060609080705060604060409070a0808050a0506050b0810060a0908070709080b0a07050806060508060607080606080707050806080c0a0707070a080808050608080f070506070706070a0908090c080708080806090508060606090906060d07050708080405070708";

const queryId = {
  name: "query-id",
  explain: "msg.query-id",
  schema: { type: "string", field: { type: "text", minLength: 1, maxLength: 64 } },
} as const;

export const nip45: NipSpec = {
  nip: "45",
  variant: "message",
  messages: [
    {
      id: "count-request",
      label: "msg.request.label",
      explain: "msg.request.explain",
      direction: "client-to-relay",
      type: "COUNT",
      elements: [
        queryId,
        {
          name: "filter",
          explain: "msg.request.filter",
          schema: { type: "filter" },
          repeatable: true,
        },
      ],
      replies: ["count-response", "closed"],
      examples: [
        {
          id: "notes-and-reactions",
          label: "example.notes",
          message: ["COUNT", "q1", { kinds: [1, 7], authors: [ALICE] }],
        },
        {
          id: "followers",
          label: "example.followers",
          explain: "example.followers.explain",
          message: ["COUNT", "followers", { kinds: [3], "#p": [ALICE] }],
        },
        {
          id: "reactions",
          label: "example.reactions",
          message: ["COUNT", "reactions", { kinds: [7], "#e": [NOTE] }],
        },
      ],
    },
    {
      id: "count-response",
      label: "msg.response.label",
      explain: "msg.response.explain",
      direction: "relay-to-client",
      type: "COUNT",
      elements: [
        queryId,
        {
          name: "result",
          explain: "msg.response.result",
          schema: {
            type: "object",
            properties: {
              count: { type: "number", integer: true, minimum: 0, explain: "msg.response.count" },
              approximate: { type: "boolean", explain: "msg.response.approximate" },
              hll: {
                type: "string",
                field: { type: "hex", bytes: 256 },
                explain: "msg.response.hll",
              },
            },
            required: ["count"],
            additionalProperties: false,
          },
        },
      ],
      examples: [
        { id: "exact", label: "example.exact", message: ["COUNT", "q1", { count: 5 }] },
        {
          id: "approximate",
          label: "example.approximate",
          message: ["COUNT", "q2", { count: 93412452, approximate: true }],
        },
        {
          id: "hll",
          label: "example.hll",
          explain: "example.hll.explain",
          message: ["COUNT", "followers", { count: 16578, hll: HLL }],
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
        queryId,
        { name: "message", explain: "msg.closed.message", schema: { type: "string" } },
      ],
      examples: [
        {
          id: "refused",
          label: "example.refused",
          message: ["CLOSED", "dm-count", "auth-required: cannot count other people's DMs"],
        },
      ],
    },
  ],
  flows: [
    {
      id: "follower-count",
      label: "flow.followers.label",
      explain: "flow.followers.explain",
      steps: [
        { part: { kind: "message", id: "count-request" }, explain: "flow.followers.ask" },
        { part: { kind: "message", id: "count-response" }, explain: "flow.followers.answer" },
      ],
    },
  ],
  howItWorks: [
    {
      id: "ask",
      title: "how.ask.title",
      body: "how.ask.body",
      focus: { part: { kind: "message", id: "count-request" }, path: [2] },
    },
    {
      id: "answer",
      title: "how.answer.title",
      body: "how.answer.body",
      focus: { part: { kind: "message", id: "count-response" }, path: [2, "count"] },
    },
    {
      id: "refuse",
      title: "how.refuse.title",
      body: "how.refuse.body",
      focus: { part: { kind: "message", id: "closed" } },
    },
    {
      id: "hll",
      title: "how.hll.title",
      body: "how.hll.body",
      focus: { part: { kind: "message", id: "count-response" }, path: [2, "hll"] },
    },
    {
      id: "merge",
      title: "how.merge.title",
      body: "how.merge.body",
    },
  ],
  related: [
    { nip: "01", relation: "extends", explain: "related.01" },
    { nip: "11", relation: "see-also", explain: "related.11" },
    { nip: "42", relation: "see-also", explain: "related.42" },
  ],
};
