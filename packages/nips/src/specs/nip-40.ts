// Owner: spec author r3 (NIPs 40–59). NIP-40: Expiration Timestamp.
// Explanations: packages/i18n/src/locales/en/nips/r3.ts → n40.text.
import type { NipSpec } from "../spec.ts";

const EXPIRES_AT = 1735776000; // FIXTURE_NOW + 1 day

export const nip40: NipSpec = {
  nip: "40",
  variant: "event",
  events: [
    {
      id: "expiring",
      label: "event.label",
      explain: "event.explain",
      // The tag can go on any kind; the examples use a note and a classified listing.
      kinds: [{ from: 0, to: 65535 }],
      content: { format: "text", explain: "content", multiline: true },
      tags: [
        {
          name: "expiration",
          explain: "tag.expiration",
          presence: "required",
          repeatable: false,
          fields: [
            {
              name: "timestamp",
              type: { type: "timestamp" },
              explain: "tag.expiration.timestamp",
              placeholder: String(EXPIRES_AT),
            },
          ],
        },
      ],
      examples: [
        {
          id: "announcement",
          label: "example.announcement",
          explain: "example.announcement.explain",
          signer: "dave",
          template: {
            kind: 1,
            tags: [["expiration", String(EXPIRES_AT)]],
            content:
              "relay.delta.example goes down for maintenance tonight at 22:00 UTC. Back within the hour.",
          },
        },
        {
          id: "offer",
          label: "example.offer",
          explain: "example.offer.explain",
          signer: "carol",
          template: {
            kind: 1,
            tags: [
              ["expiration", String(EXPIRES_AT + 6 * 86400)],
              ["t", "film"],
            ],
            content:
              "Selling two rolls of Portra 400 this week only. DM me if you want them. #film",
          },
        },
      ],
    },
  ],
  howItWorks: [
    {
      id: "add-tag",
      title: "how.add-tag.title",
      body: "how.add-tag.body",
      focus: { part: { kind: "event", id: "expiring" }, path: ["tags", 0] },
    },
    {
      id: "check-relay",
      title: "how.check-relay.title",
      body: "how.check-relay.body",
    },
    {
      id: "relay-behaviour",
      title: "how.relay-behaviour.title",
      body: "how.relay-behaviour.body",
    },
    {
      id: "client-behaviour",
      title: "how.client-behaviour.title",
      body: "how.client-behaviour.body",
    },
    {
      id: "not-private",
      title: "how.not-private.title",
      body: "how.not-private.body",
    },
  ],
  related: [
    { nip: "01", relation: "extends", explain: "related.01" },
    { nip: "11", relation: "depends-on", explain: "related.11" },
    { nip: "09", relation: "see-also", explain: "related.09" },
  ],
};
