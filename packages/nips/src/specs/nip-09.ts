// Owner: spec author r1 (NIPs 01–19). NIP-09: Event Deletion Request.
// Explanations: packages/i18n/src/locales/en/nips/r1.ts → n09.text.
import type { NipSpec } from "../spec.ts";

const FRANK = "922e43b50aec16ad1e9d1ec6854c058816d28b944ae2fe9bdce3d9241bfaafb8";

export const nip09: NipSpec = {
  nip: "09",
  variant: "event",
  howItWorks: [
    {
      id: "point",
      title: "how.point.title",
      body: "how.point.body",
      focus: { part: { kind: "event", id: "deletion" }, path: ["tags", 0] },
    },
    {
      id: "kinds",
      title: "how.kinds.title",
      body: "how.kinds.body",
      focus: { part: { kind: "event", id: "deletion" }, path: ["tags", 1] },
    },
    { id: "same-author", title: "how.same-author.title", body: "how.same-author.body" },
    { id: "no-guarantee", title: "how.no-guarantee.title", body: "how.no-guarantee.body" },
  ],
  related: [
    { nip: "01", relation: "depends-on", explain: "related.01" },
    { nip: "62", relation: "see-also", explain: "related.62" },
  ],
  events: [
    {
      id: "deletion",
      label: "event.label",
      explain: "event.explain",
      kinds: [5],
      content: { format: "text", explain: "event.content" },
      // A request may target only addressable events (`a`), so `e` alone cannot be required.
      requireOneOf: [{ tags: ["e", "a"], explain: "rule.target" }],
      tags: [
        {
          name: "e",
          explain: "tag.e",
          presence: "optional",
          repeatable: true,
          fields: [
            { name: "event-id", type: { type: "event-id" }, explain: "tag.e.id" },
            { name: "relay", type: { type: "relay-url" }, explain: "tag.relay", optional: true },
          ],
        },
        {
          name: "a",
          explain: "tag.a",
          presence: "optional",
          repeatable: true,
          fields: [
            { name: "address", type: { type: "addr" }, explain: "tag.a.address" },
            { name: "relay", type: { type: "relay-url" }, explain: "tag.relay", optional: true },
          ],
        },
        {
          name: "k",
          explain: "tag.k",
          presence: "recommended",
          repeatable: true,
          fields: [{ name: "kind", type: { type: "kind" }, explain: "tag.k.kind" }],
        },
      ],
      examples: [
        {
          id: "note",
          label: "example.note.label",
          explain: "example.note.explain",
          signer: "bob",
          template: {
            kind: 5,
            created_at: 1735686720,
            tags: [
              ["e", "ea2e3eb8fe5e6cfbc202da21df546f68c6673e9a00c0aed61cffbac7aed9faf7"],
              ["k", "1"],
            ],
            content: "posted by accident",
          },
        },
        {
          id: "article",
          label: "example.article.label",
          explain: "example.article.explain",
          signer: "frank",
          template: {
            kind: 5,
            tags: [
              ["a", `30023:${FRANK}:protocols-not-platforms`],
              ["e", "9ebe7dca0ef646d4bfd72ab1e3d7ffd0b52d539c316e3a4f76cee73185191215"],
              ["k", "30023"],
            ],
            content: "",
          },
        },
      ],
    },
  ],
};
