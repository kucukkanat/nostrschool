// Owner: spec author r2 (NIPs 20–39). NIP-37: Draft Wraps (31234), checkpoints (1234) and the
// private-content relay list (10013). The encrypted contents are real NIP-44 payloads from alice
// to herself (fixed nonces); r2.test.ts decrypts them with her demo key.
import type { NipSpec } from "../spec.ts";

const ALICE = "e550c6e92808f358382b7b8c14345344f5ef9a299529834d1c26d57b6ace44cc";
const D = "relays-thread";
const DRAFT =
  "AqEs2snsurBgK2Dqgco63UKukyczA38fCwIn9r5VzYcqE03qSzTkKPU2jiiZ0KoFHzv379i9l9mFmcj3FtpXUzSa9t4Gy/CwgoJYoQhIbMZUX6bzc+C6gta+VuaJvOfrTKrEfwSAeUqZp0VtrDflZaR5gXtJ/1caew4Ifluvx9aqeMxYtdUCdQ8ro3zj999iXZyhUbjb2djvVCSYx/qLomFgnSEOpWkPtCrbt4GR7RR7y11hYcK9yn9mEMvRRDSeCtUov1qmQiwd/njD4Y2M0WITIchAx80NDsAUx74f9nz4R/6bGSg16Dmp3oNAjMi1+ByD0XSi0wjP0vYCis35iraECsJ8Y3kgVysoaqQQmdBeVYgD0w177Wbbd3FgudN8c22i";
const CHECKPOINT =
  "AjmeHXnLsko/V9u1iykqZcUFMwkX4bY7toENDWq2MLEA9LSUsDqeFiIXfHBPaZ/dc52a2shItzma4rNJ9H+5YJlN4TXVX4E0hF02+AgV23yAjudQgYNAxEPjlEdymIHKIDaCLbaqN0sMC2ps5FXrGkEQ5RqSxEx3D88Cw1WQLph2WX1MEWIFBzoYLbWfKCVoZOlMBGgAZuz94WEg3/Q7kPh8vQRT2pNoOdCMqEJbx+wvG1ugLAc+lpMopM4klFgKXTZ1EoWo7vy23nACjkmH0w7zW+xX1P33U7Op1cy1Vkaxns0DcPsC+xSi4pRNZdHnxfOG+Or0i3lO9H11+B5qCiDoFKhcnRIwMcsLxu/vwho37oLVfGHlhCuVwwXM4ZaDhaTT";
const RELAYS =
  "ApVIdLO4yLKF2iCs1Mjx8/Phm5hB/fIHKPjRLeGFyaD+jF6d7DqPDO9/A5NX3EcjYuQqRM9N5SBtd2f5N/8K2b4Ho71sbCYxsH69BnrhaSALBgSqQILUtPExgGZFiFkh2YmNHQWALexBJMJdFYBKDcJuruqXUGP9C/SKeKhxIwB2gCU=";

export const nip37: NipSpec = {
  nip: "37",
  variant: "event",
  howItWorks: [
    {
      id: "wrap",
      title: "how.wrap.title",
      body: "how.wrap.body",
      focus: { part: { kind: "event", id: "draft" }, path: ["content"] },
    },
    {
      id: "k",
      title: "how.k.title",
      body: "how.k.body",
      focus: { part: { kind: "event", id: "draft" }, path: ["tags", 1] },
    },
    {
      id: "expire",
      title: "how.expire.title",
      body: "how.expire.body",
      focus: { part: { kind: "event", id: "draft" }, path: ["tags", 2] },
    },
    {
      id: "checkpoint",
      title: "how.checkpoint.title",
      body: "how.checkpoint.body",
      focus: { part: { kind: "event", id: "checkpoint" } },
    },
    {
      id: "relays",
      title: "how.relays.title",
      body: "how.relays.body",
      focus: { part: { kind: "event", id: "relays" } },
    },
  ],
  related: [
    { nip: "44", relation: "depends-on", explain: "related.44" },
    { nip: "40", relation: "see-also", explain: "related.40" },
    { nip: "42", relation: "see-also", explain: "related.42" },
    { nip: "65", relation: "see-also", explain: "related.65" },
    { nip: "23", relation: "replaces", explain: "related.23" },
  ],
  flows: [
    {
      id: "drafting",
      label: "flow.drafting.label",
      explain: "flow.drafting.explain",
      steps: [
        { part: { kind: "event", id: "relays" }, explain: "flow.drafting.relays" },
        { part: { kind: "event", id: "draft" }, explain: "flow.drafting.draft" },
        { part: { kind: "event", id: "checkpoint" }, explain: "flow.drafting.checkpoint" },
      ],
    },
  ],
  events: [
    {
      id: "draft",
      label: "event.draft.label",
      explain: "event.draft.explain",
      kinds: [31234],
      content: {
        format: "encrypted",
        explain: "content.draft",
        scheme: "nip44",
        plaintext: {
          format: "json",
          explain: "content.draft.plain",
          schema: { type: "event", signed: false, explain: "schema.draft" },
        },
      },
      tags: [
        {
          name: "d",
          explain: "tag.d",
          presence: "required",
          repeatable: false,
          fields: [{ name: "identifier", type: { type: "text" }, explain: "tag.d.value" }],
        },
        {
          name: "k",
          explain: "tag.k",
          presence: "required",
          repeatable: false,
          fields: [{ name: "kind", type: { type: "kind" }, explain: "tag.k.value" }],
        },
        {
          name: "expiration",
          explain: "tag.expiration",
          presence: "recommended",
          repeatable: false,
          fields: [
            { name: "timestamp", type: { type: "timestamp" }, explain: "tag.expiration.value" },
          ],
        },
      ],
      examples: [
        {
          id: "draft",
          label: "example.draft",
          explain: "example.draft.explain",
          signer: "alice",
          template: {
            kind: 31234,
            tags: [
              ["d", D],
              ["k", "1"],
              ["expiration", "1743465600"],
            ],
            content: DRAFT,
          },
        },
      ],
    },
    {
      id: "checkpoint",
      label: "event.checkpoint.label",
      explain: "event.checkpoint.explain",
      kinds: [1234],
      content: {
        format: "encrypted",
        explain: "content.checkpoint",
        scheme: "nip44",
        plaintext: {
          format: "json",
          explain: "content.draft.plain",
          schema: { type: "event", signed: false, explain: "schema.draft" },
        },
      },
      tags: [
        {
          name: "a",
          explain: "tag.a",
          presence: "required",
          repeatable: false,
          fields: [
            { name: "draft", type: { type: "addr", kinds: [31234] }, explain: "tag.a.value" },
          ],
        },
      ],
      examples: [
        {
          id: "checkpoint",
          label: "example.checkpoint",
          signer: "alice",
          template: { kind: 1234, tags: [["a", `31234:${ALICE}:${D}`]], content: CHECKPOINT },
        },
      ],
    },
    {
      id: "relays",
      label: "event.relays.label",
      explain: "event.relays.explain",
      kinds: [10013],
      content: {
        format: "encrypted",
        explain: "content.relays",
        scheme: "nip44",
        plaintext: {
          format: "json",
          explain: "content.relays.plain",
          schema: {
            type: "array",
            explain: "schema.relays",
            items: {
              type: "tuple",
              explain: "schema.relays.tag",
              items: [
                {
                  type: "string",
                  explain: "schema.relays.name",
                  field: { type: "enum", values: [{ value: "relay" }] },
                },
                { type: "string", explain: "schema.relays.url", field: { type: "relay-url" } },
              ],
            },
          },
        },
      },
      tags: [],
      examples: [
        {
          id: "relays",
          label: "example.relays",
          explain: "example.relays.explain",
          signer: "alice",
          template: { kind: 10013, tags: [], content: RELAYS },
        },
      ],
    },
  ],
};
