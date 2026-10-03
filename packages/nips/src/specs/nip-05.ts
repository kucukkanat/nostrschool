// Owner: spec author r1 (NIPs 01–19). NIP-05: Mapping Nostr keys to DNS-based internet identifiers.
// Explanations: packages/i18n/src/locales/en/nips/r1.ts → n05.text.
import type { NipSpec } from "../spec.ts";

const ALICE = "e550c6e92808f358382b7b8c14345344f5ef9a299529834d1c26d57b6ace44cc";
const BOB = "a73883912a48c3551c1548fd454876d577126a61c76b5486c807bfec5869e183";
const CAROL = "9445888d3235f73f8b627df1fb1d498f2eb3fa76337679c1176965a73d3b68b4";

export const nip05: NipSpec = {
  nip: "05",
  variant: "document",
  howItWorks: [
    {
      id: "claim",
      title: "how.claim.title",
      body: "how.claim.body",
      focus: { part: { kind: "event", id: "metadata" }, path: ["content"] },
    },
    { id: "split", title: "how.split.title", body: "how.split.body" },
    {
      id: "fetch",
      title: "how.fetch.title",
      body: "how.fetch.body",
      focus: { part: { kind: "document", id: "nostr-json" }, path: ["names"] },
    },
    {
      id: "relays",
      title: "how.relays.title",
      body: "how.relays.body",
      focus: { part: { kind: "document", id: "nostr-json" }, path: ["relays"] },
    },
    { id: "keys-win", title: "how.keys-win.title", body: "how.keys-win.body" },
  ],
  related: [
    { nip: "01", relation: "depends-on", explain: "related.01" },
    { nip: "24", relation: "see-also", explain: "related.24" },
  ],
  flows: [
    {
      id: "verify",
      label: "flow.verify.label",
      explain: "flow.verify.explain",
      steps: [
        { part: { kind: "event", id: "metadata" }, explain: "flow.verify.claim" },
        { part: { kind: "document", id: "nostr-json" }, explain: "flow.verify.check" },
      ],
    },
  ],
  documents: [
    {
      id: "nostr-json",
      label: "doc.label",
      explain: "doc.explain",
      mediaType: "application/json",
      urlTemplate: "https://<domain>/.well-known/nostr.json?name=<local-part>",
      schema: {
        type: "object",
        explain: "doc.schema",
        required: ["names"],
        properties: {
          names: {
            type: "object",
            explain: "doc.names",
            properties: {},
            additionalProperties: {
              type: "string",
              explain: "doc.names.entry",
              field: { type: "pubkey" },
            },
          },
          relays: {
            type: "object",
            explain: "doc.relays",
            properties: {},
            additionalProperties: {
              type: "array",
              explain: "doc.relays.entry",
              items: { type: "string", field: { type: "relay-url" } },
            },
          },
        },
      },
      examples: [
        {
          id: "alice",
          label: "example.alice.label",
          explain: "example.alice.explain",
          value: {
            names: { alice: ALICE },
            relays: { [ALICE]: ["wss://relay.alpha.example"] },
          },
        },
        {
          id: "static",
          label: "example.static.label",
          explain: "example.static.explain",
          value: {
            names: { _: BOB, bob: BOB, carol: CAROL },
            relays: {
              [BOB]: ["wss://relay.beta.example", "wss://relay.gamma.example"],
              [CAROL]: ["wss://relay.beta.example"],
            },
          },
        },
      ],
    },
  ],
  events: [
    {
      id: "metadata",
      label: "event.label",
      explain: "event.explain",
      kinds: [0],
      content: {
        format: "json",
        explain: "event.content",
        schema: {
          type: "object",
          properties: {
            nip05: {
              type: "string",
              explain: "event.nip05",
              field: { type: "text", pattern: "[a-z0-9._-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}" },
            },
          },
          required: ["nip05"],
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
            content: '{"name":"alice","display_name":"Alice","nip05":"alice@alpha.example"}',
          },
        },
      ],
    },
  ],
};
