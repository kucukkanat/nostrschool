// Owner: spec author r1 (NIPs 01–19). NIP-03: OpenTimestamps Attestations for Events.
// Unrecommended upstream ("vulnerable to one specific attack, needs update"); no replacement NIP.
// Explanations: packages/i18n/src/locales/en/nips/r1.ts → n03.text.
import type { NipSpec } from "../spec.ts";

export const nip03: NipSpec = {
  nip: "03",
  variant: "event",
  howItWorks: [
    { id: "warning", title: "how.warning.title", body: "how.warning.body" },
    {
      id: "stamp",
      title: "how.stamp.title",
      body: "how.stamp.body",
      focus: { part: { kind: "event", id: "attestation" }, path: ["tags", 0, 1] },
    },
    {
      id: "wait",
      title: "how.wait.title",
      body: "how.wait.body",
      focus: { part: { kind: "event", id: "attestation" }, path: ["content"] },
    },
    { id: "verify", title: "how.verify.title", body: "how.verify.body" },
  ],
  related: [{ nip: "01", relation: "depends-on", explain: "related.01" }],
  events: [
    {
      id: "attestation",
      label: "event.label",
      explain: "event.explain",
      kinds: [1040],
      content: {
        format: "text",
        explain: "event.content",
        required: true,
        field: { type: "base64", of: "bytes" },
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
          name: "k",
          explain: "tag.k",
          presence: "recommended",
          repeatable: false,
          fields: [{ name: "kind", type: { type: "kind" }, explain: "tag.k.kind" }],
        },
      ],
      examples: [
        {
          id: "proof",
          label: "example.proof.label",
          explain: "example.proof.explain",
          signer: "bob",
          template: {
            kind: 1040,
            tags: [
              [
                "e",
                "814d487f9a9591bde04009eff371facb26e82f3a41cec1bcdcdab310075053be",
                "wss://relay.beta.example",
              ],
              ["k", "1"],
            ],
            // Abridged .ots file: magic header, sha256 op over the event id, one append op and
            // a Bitcoin block-header attestation (block 875012). Real proofs carry more ops.
            content:
              "AE9wZW5UaW1lc3RhbXBzAABQcm9vZgC/ieLohOiSlAEIgU1If5qVkb3gQAnv83H6yyboLzpBzsG83NqzEAdQU77wECvUxqHg9dluOwxqjx0i5KcIAAWIlg1z1xkBA4S0NQ==",
          },
        },
      ],
    },
  ],
};
