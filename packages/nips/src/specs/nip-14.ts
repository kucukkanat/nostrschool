// Owner: spec author r1 (NIPs 01–19). NIP-14: Subject tag in text events.
// Explanations: packages/i18n/src/locales/en/nips/r1.ts → n14.text.
import type { NipSpec } from "../spec.ts";

const DAVE = "1c028b39e7f3228444b3261e4b718efa92a91470086b44c9a72ef5357e970148";

export const nip14: NipSpec = {
  nip: "14",
  variant: "event",
  howItWorks: [
    {
      id: "subject",
      title: "how.subject.title",
      body: "how.subject.body",
      focus: { part: { kind: "event", id: "with-subject" }, path: ["tags", 0, 1] },
    },
    { id: "lists", title: "how.lists.title", body: "how.lists.body" },
    { id: "replies", title: "how.replies.title", body: "how.replies.body" },
  ],
  related: [
    { nip: "10", relation: "extends", explain: "related.10" },
    { nip: "17", relation: "see-also", explain: "related.17" },
  ],
  events: [
    {
      id: "with-subject",
      label: "event.label",
      explain: "event.explain",
      kinds: [1],
      content: { format: "text", explain: "event.content", required: true, multiline: true },
      tags: [
        {
          name: "subject",
          explain: "tag.subject",
          presence: "recommended",
          repeatable: false,
          fields: [
            {
              name: "subject",
              type: { type: "text", minLength: 1 },
              explain: "tag.subject.value",
            },
          ],
        },
      ],
      examples: [
        {
          id: "thread",
          label: "example.thread.label",
          explain: "example.thread.explain",
          signer: "dave",
          template: {
            kind: 1,
            tags: [["subject", "Running a paid relay: what I learned"]],
            content:
              "Six months of relay.delta.example. Spam dropped to zero, costs are tiny. Ask me anything.",
          },
        },
        {
          id: "reply",
          label: "example.reply.label",
          explain: "example.reply.explain",
          signer: "erin",
          template: {
            kind: 1,
            tags: [
              ["subject", "Re: Running a paid relay: what I learned"],
              [
                "e",
                "34be34fe31acbe35ce4ebaf2f237faafc64bb0d98f655d8b459f2f53f0de017c",
                "wss://relay.delta.example",
                "root",
                DAVE,
              ],
              ["p", DAVE],
            ],
            content: "How do you price memberships?",
          },
        },
      ],
    },
  ],
};
