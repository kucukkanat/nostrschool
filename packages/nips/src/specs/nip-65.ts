// Owner: spec author r4 (NIPs 60–79). NIP-65: Relay List Metadata.
// Examples mirror the fixture personas' real relay lists (alice: alpha+beta read/write;
// dave: writes to his paid Delta relay, reads and writes on Alpha).
import type { NipSpec } from "../spec.ts";

export const nip65: NipSpec = {
  nip: "65",
  variant: "event",
  howItWorks: [
    {
      id: "list",
      title: "how.list.title",
      body: "how.list.body",
      focus: { part: { kind: "event", id: "relay-list" }, path: ["tags"] },
    },
    {
      id: "markers",
      title: "how.markers.title",
      body: "how.markers.body",
      focus: { part: { kind: "event", id: "relay-list" }, path: ["tags", 0] },
    },
    { id: "reading", title: "how.reading.title", body: "how.reading.body" },
    { id: "publishing", title: "how.publishing.title", body: "how.publishing.body" },
    { id: "small", title: "how.small.title", body: "how.small.body" },
  ],
  related: [
    { nip: "01", relation: "depends-on", explain: "related.01" },
    { nip: "02", relation: "see-also", explain: "related.02" },
    { nip: "51", relation: "see-also", explain: "related.51" },
    { nip: "17", relation: "see-also", explain: "related.17" },
  ],
  events: [
    {
      id: "relay-list",
      label: "list.label",
      explain: "list.explain",
      kinds: [10002],
      content: { format: "empty" },
      tags: [
        {
          name: "r",
          explain: "list.tag.r",
          presence: "required",
          repeatable: true,
          fields: [
            { name: "url", type: { type: "relay-url" }, explain: "list.tag.r.url" },
            {
              name: "marker",
              type: {
                type: "enum",
                values: [
                  { value: "read", explain: "marker.read" },
                  { value: "write", explain: "marker.write" },
                ],
              },
              explain: "list.tag.r.marker",
              optional: true,
            },
          ],
        },
      ],
      examples: [
        {
          id: "alice",
          label: "list.example.alice.label",
          explain: "list.example.alice.explain",
          template: {
            kind: 10002,
            tags: [
              ["r", "wss://relay.alpha.example"],
              ["r", "wss://relay.beta.example"],
            ],
            content: "",
          },
        },
        {
          id: "dave",
          label: "list.example.dave.label",
          explain: "list.example.dave.explain",
          signer: "dave",
          template: {
            kind: 10002,
            tags: [
              ["r", "wss://relay.delta.example", "write"],
              ["r", "wss://relay.alpha.example"],
            ],
            content: "",
          },
        },
        {
          id: "bob",
          label: "list.example.bob.label",
          explain: "list.example.bob.explain",
          signer: "bob",
          template: {
            kind: 10002,
            tags: [
              ["r", "wss://relay.beta.example"],
              ["r", "wss://relay.gamma.example", "read"],
            ],
            content: "",
          },
        },
      ],
    },
  ],
};
