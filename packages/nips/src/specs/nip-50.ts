// Owner: spec author r3 (NIPs 40–59). NIP-50: Search Capability.
// Explanations: packages/i18n/src/locales/en/nips/r3.ts → n50.text.
import type { NipSpec } from "../spec.ts";

export const nip50: NipSpec = {
  nip: "50",
  variant: "message",
  messages: [
    {
      id: "search-req",
      label: "msg.req.label",
      explain: "msg.req.explain",
      direction: "client-to-relay",
      type: "REQ",
      elements: [
        {
          name: "subscription-id",
          explain: "msg.req.subscription-id",
          schema: { type: "string", field: { type: "text", minLength: 1, maxLength: 64 } },
        },
        {
          name: "filter",
          explain: "msg.req.filter",
          // The NIP-01 filter already knows the `search` field; the query syntax is explained here.
          schema: { type: "filter" },
          repeatable: true,
        },
      ],
      examples: [
        {
          id: "plain",
          label: "example.plain",
          explain: "example.plain.explain",
          message: ["REQ", "search-1", { search: "best nostr apps", kinds: [1], limit: 20 }],
        },
        {
          id: "extensions",
          label: "example.extensions",
          explain: "example.extensions.explain",
          message: [
            "REQ",
            "search-2",
            { search: "orange ostrich language:en nsfw:false", kinds: [1] },
          ],
        },
        {
          id: "several",
          label: "example.several",
          explain: "example.several.explain",
          message: [
            "REQ",
            "search-3",
            { search: "relays" },
            { kinds: [30023], search: "protocols domain:beta.example" },
          ],
        },
      ],
    },
  ],
  howItWorks: [
    {
      id: "field",
      title: "how.field.title",
      body: "how.field.body",
      focus: { part: { kind: "message", id: "search-req" }, path: [2, "search"] },
    },
    {
      id: "ranking",
      title: "how.ranking.title",
      body: "how.ranking.body",
      focus: { part: { kind: "message", id: "search-req" }, path: [2, "limit"] },
    },
    {
      id: "extensions",
      title: "how.extensions.title",
      body: "how.extensions.body",
    },
    {
      id: "support",
      title: "how.support.title",
      body: "how.support.body",
    },
  ],
  related: [
    { nip: "01", relation: "extends", explain: "related.01" },
    { nip: "11", relation: "depends-on", explain: "related.11" },
    { nip: "51", relation: "see-also", explain: "related.51" },
    { nip: "05", relation: "see-also", explain: "related.05" },
  ],
};
