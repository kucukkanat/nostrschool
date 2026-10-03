// Owner: spec author r5 (NIPs 80–99). NIP-90: Data Vending Machines (unrecommended upstream:
// "prefer use-case-specific microstandards"; no single replacement NIP).
// The job-result example embeds a real kind 5002 request signed by the fixture persona "alice".
import type { FieldType, NipSpec, TagSpec } from "../spec.ts";

const ALICE = "e550c6e92808f358382b7b8c14345344f5ef9a299529834d1c26d57b6ace44cc";
const DAVE = "1c028b39e7f3228444b3261e4b718efa92a91470086b44c9a72ef5357e970148";
const ALPHA = "wss://relay.alpha.example";
const REQUEST_ID = "4c51b60dbddecd353ccf29e447f9db346f4aa222798ddaa5cbfa2036b4cc30d2";
const REQUEST_JSON =
  '{"kind":5002,"created_at":1735689480,"tags":[["i","Relays are simple servers that store and forward events.","text"],["param","language","es"],["output","text/plain"],["bid","5000"],["relays","wss://relay.alpha.example"]],"content":"","pubkey":"e550c6e92808f358382b7b8c14345344f5ef9a299529834d1c26d57b6ace44cc","id":"4c51b60dbddecd353ccf29e447f9db346f4aa222798ddaa5cbfa2036b4cc30d2","sig":"c5fe01d2d0018197c278363a5511ea9d509ef15edb4644a46ec6370f927547b5bec4c87cf66427e6fcc9da4e5d0604b3af8d42f446135a0fa5c13b20da5b1c02"}';

const MSATS: FieldType = { type: "number", integer: true, min: 0 };

const i: TagSpec = {
  name: "i",
  explain: "tag.i",
  presence: "optional",
  repeatable: true,
  fields: [
    { name: "data", type: { type: "text", multiline: true }, explain: "tag.i.data" },
    {
      name: "input-type",
      type: {
        type: "enum",
        values: [
          { value: "url", explain: "input-type.url" },
          { value: "event", explain: "input-type.event" },
          { value: "job", explain: "input-type.job" },
          { value: "text", explain: "input-type.text" },
        ],
      },
      explain: "tag.i.input-type",
    },
    { name: "relay", type: { type: "relay-url" }, explain: "tag.i.relay", optional: true },
    { name: "marker", type: { type: "text" }, explain: "tag.i.marker", optional: true },
  ],
};

const e: TagSpec = {
  name: "e",
  explain: "tag.e",
  presence: "required",
  repeatable: false,
  fields: [
    { name: "job-request-id", type: { type: "event-id" }, explain: "tag.e.id" },
    { name: "relay", type: { type: "relay-url" }, explain: "tag.e.relay", optional: true },
  ],
};

const p = (presence: "required" | "optional", explain: string): TagSpec => ({
  name: "p",
  explain,
  presence,
  repeatable: presence === "optional",
  fields: [{ name: "pubkey", type: { type: "pubkey" }, explain: `${explain}.pubkey` }],
});

const amount: TagSpec = {
  name: "amount",
  explain: "tag.amount",
  presence: "optional",
  repeatable: false,
  fields: [
    { name: "msats", type: MSATS, explain: "tag.amount.msats" },
    {
      name: "bolt11",
      type: { type: "text", pattern: "ln(bc|tb|bcrt)[0-9a-z]+" },
      explain: "tag.amount.bolt11",
      optional: true,
    },
  ],
};

const encrypted: TagSpec = {
  name: "encrypted",
  explain: "tag.encrypted",
  presence: "optional",
  repeatable: false,
  fields: [],
};

export const nip90: NipSpec = {
  nip: "90",
  variant: "event",
  howItWorks: [
    {
      id: "status",
      title: "how.status.title",
      body: "how.status.body",
    },
    {
      id: "request",
      title: "how.request.title",
      body: "how.request.body",
      focus: { part: { kind: "event", id: "job-request" }, path: ["tags", 0] },
    },
    {
      id: "feedback",
      title: "how.feedback.title",
      body: "how.feedback.body",
      focus: { part: { kind: "event", id: "job-feedback" }, path: ["tags", 0] },
    },
    {
      id: "result",
      title: "how.result.title",
      body: "how.result.body",
      focus: { part: { kind: "event", id: "job-result" }, path: ["kind"] },
    },
    {
      id: "pay",
      title: "how.pay.title",
      body: "how.pay.body",
      focus: { part: { kind: "event", id: "job-result" }, path: ["tags", 3] },
    },
  ],
  related: [
    { nip: "89", relation: "depends-on", explain: "related.89" },
    { nip: "57", relation: "see-also", explain: "related.57" },
    { nip: "04", relation: "depends-on", explain: "related.04" },
    { nip: "09", relation: "see-also", explain: "related.09" },
  ],
  flows: [
    {
      id: "job",
      label: "flow.job.label",
      explain: "flow.job.explain",
      steps: [
        { part: { kind: "event", id: "job-request" }, explain: "flow.job.request" },
        { part: { kind: "event", id: "job-feedback" }, explain: "flow.job.feedback" },
        { part: { kind: "event", id: "job-result" }, explain: "flow.job.result" },
      ],
    },
  ],
  events: [
    {
      id: "job-request",
      label: "event.job-request.label",
      explain: "event.job-request.explain",
      kinds: [{ from: 5000, to: 5999 }],
      content: { format: "text", explain: "content.request" },
      tags: [
        i,
        {
          name: "output",
          explain: "tag.output",
          presence: "optional",
          repeatable: false,
          fields: [
            {
              name: "mime-type",
              type: { type: "text", pattern: "[a-z]+/[a-z0-9.+*-]+" },
              explain: "tag.output.mime",
            },
          ],
        },
        {
          name: "param",
          explain: "tag.param",
          presence: "optional",
          repeatable: true,
          fields: [
            { name: "key", type: { type: "text", minLength: 1 }, explain: "tag.param.key" },
            { name: "value", type: { type: "text" }, explain: "tag.param.value" },
          ],
        },
        {
          name: "bid",
          explain: "tag.bid",
          presence: "optional",
          repeatable: false,
          fields: [{ name: "msats", type: MSATS, explain: "tag.bid.msats" }],
        },
        {
          name: "relays",
          explain: "tag.relays",
          presence: "optional",
          repeatable: false,
          fields: [],
          rest: { name: "relay", type: { type: "relay-url" }, explain: "tag.relays.relay" },
        },
        p("optional", "tag.p.provider"),
        {
          name: "t",
          explain: "tag.t",
          presence: "optional",
          repeatable: true,
          fields: [{ name: "topic", type: { type: "text", minLength: 1 }, explain: "tag.t.topic" }],
        },
        encrypted,
      ],
      examples: [
        {
          id: "translate",
          label: "example.translate.label",
          explain: "example.translate.explain",
          signer: "alice",
          template: {
            kind: 5002,
            created_at: 1735689480,
            tags: [
              ["i", "Relays are simple servers that store and forward events.", "text"],
              ["param", "language", "es"],
              ["output", "text/plain"],
              ["bid", "5000"],
              ["relays", ALPHA],
            ],
            content: "",
          },
        },
        {
          id: "summarize-note",
          label: "example.summarize-note.label",
          explain: "example.summarize-note.explain",
          signer: "grace",
          template: {
            kind: 5001,
            tags: [
              [
                "i",
                "91a74c40d508831576cca43d0d0c58793bb60df736783b40ddfbc68deed5ab06",
                "event",
                ALPHA,
              ],
              ["output", "text/plain"],
              ["p", DAVE],
              ["relays", ALPHA, "wss://relay.delta.example"],
            ],
            content: "",
          },
        },
      ],
    },
    {
      id: "job-feedback",
      label: "event.job-feedback.label",
      explain: "event.job-feedback.explain",
      kinds: [7000],
      content: { format: "text", explain: "content.feedback" },
      tags: [
        {
          name: "status",
          explain: "tag.status",
          presence: "required",
          repeatable: false,
          fields: [
            {
              name: "status",
              type: {
                type: "enum",
                values: [
                  { value: "payment-required", explain: "status.payment-required" },
                  { value: "processing", explain: "status.processing" },
                  { value: "error", explain: "status.error" },
                  { value: "success", explain: "status.success" },
                  { value: "partial", explain: "status.partial" },
                ],
              },
              explain: "tag.status.value",
            },
            { name: "info", type: { type: "text" }, explain: "tag.status.info", optional: true },
          ],
        },
        amount,
        e,
        p("required", "tag.p.customer"),
        encrypted,
      ],
      examples: [
        {
          id: "payment-required",
          label: "example.payment-required.label",
          explain: "example.payment-required.explain",
          signer: "dave",
          template: {
            kind: 7000,
            tags: [
              ["status", "payment-required", "Pay 3 sats to receive the translation."],
              ["amount", "3000"],
              ["e", REQUEST_ID, ALPHA],
              ["p", ALICE],
            ],
            content: "",
          },
        },
      ],
    },
    {
      id: "job-result",
      label: "event.job-result.label",
      explain: "event.job-result.explain",
      kinds: [{ from: 6000, to: 6999 }],
      content: { format: "text", explain: "content.result", multiline: true },
      tags: [
        {
          name: "request",
          explain: "tag.request",
          presence: "recommended",
          repeatable: false,
          fields: [{ name: "event", type: { type: "event-json" }, explain: "tag.request.event" }],
        },
        e,
        i,
        p("required", "tag.p.customer"),
        amount,
        encrypted,
      ],
      examples: [
        {
          id: "translation",
          label: "example.translation.label",
          explain: "example.translation.explain",
          signer: "dave",
          template: {
            kind: 6002,
            tags: [
              ["request", REQUEST_JSON],
              ["e", REQUEST_ID, ALPHA],
              ["i", "Relays are simple servers that store and forward events.", "text"],
              ["p", ALICE],
              ["amount", "3000"],
            ],
            content: "Los relés son servidores sencillos que guardan y reenvían eventos.",
          },
        },
      ],
    },
  ],
};
