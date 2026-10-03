// Owner: spec author r1 (NIPs 01–19). NIP-08: Handling Mentions.
// Unrecommended upstream: deprecated in favor of NIP-27 (inline nostr: URIs).
// Explanations: packages/i18n/src/locales/en/nips/r1.ts → n08.text.
import type { NipSpec } from "../spec.ts";

const BOB = "a73883912a48c3551c1548fd454876d577126a61c76b5486c807bfec5869e183";

export const nip08: NipSpec = {
  nip: "08",
  variant: "event",
  howItWorks: [
    { id: "deprecated", title: "how.deprecated.title", body: "how.deprecated.body" },
    {
      id: "tag",
      title: "how.tag.title",
      body: "how.tag.body",
      focus: { part: { kind: "event", id: "mention" }, path: ["tags", 0] },
    },
    {
      id: "placeholder",
      title: "how.placeholder.title",
      body: "how.placeholder.body",
      focus: { part: { kind: "event", id: "mention" }, path: ["content"] },
    },
    { id: "render", title: "how.render.title", body: "how.render.body" },
  ],
  related: [
    { nip: "27", relation: "replaced-by", explain: "related.27" },
    { nip: "10", relation: "see-also", explain: "related.10" },
  ],
  events: [
    {
      id: "mention",
      label: "event.label",
      explain: "event.explain",
      kinds: [1],
      content: { format: "text", explain: "event.content", required: true, multiline: true },
      tags: [
        {
          name: "p",
          explain: "tag.p",
          presence: "optional",
          repeatable: true,
          fields: [{ name: "pubkey", type: { type: "pubkey" }, explain: "tag.p.pubkey" }],
        },
        {
          name: "e",
          explain: "tag.e",
          presence: "optional",
          repeatable: true,
          fields: [{ name: "event-id", type: { type: "event-id" }, explain: "tag.e.id" }],
        },
      ],
      examples: [
        {
          id: "legacy",
          label: "example.legacy.label",
          explain: "example.legacy.explain",
          signer: "carol",
          template: {
            kind: 1,
            tags: [
              ["p", BOB],
              ["e", "814d487f9a9591bde04009eff371facb26e82f3a41cec1bcdcdab310075053be"],
            ],
            content: "Agree with #[0] here, see #[1]",
          },
        },
      ],
    },
  ],
};
