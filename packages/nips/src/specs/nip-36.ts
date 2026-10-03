// Owner: spec author r2 (NIPs 20–39). NIP-36: Sensitive Content / Content Warning.
import type { NipSpec } from "../spec.ts";

export const nip36: NipSpec = {
  nip: "36",
  variant: "event",
  howItWorks: [
    {
      id: "tag",
      title: "how.tag.title",
      body: "how.tag.body",
      focus: { part: { kind: "event", id: "note" }, path: ["tags", 0] },
    },
    { id: "hide", title: "how.hide.title", body: "how.hide.body" },
    {
      id: "labels",
      title: "how.labels.title",
      body: "how.labels.body",
      focus: { part: { kind: "event", id: "note" }, path: ["tags"] },
    },
  ],
  related: [
    { nip: "32", relation: "see-also", explain: "related.32" },
    { nip: "56", relation: "see-also", explain: "related.56" },
  ],
  events: [
    {
      id: "note",
      label: "event.note.label",
      explain: "event.note.explain",
      kinds: [{ from: 0, to: 65535 }],
      content: { format: "text", explain: "content", multiline: true },
      tags: [
        {
          name: "content-warning",
          explain: "tag.content-warning",
          presence: "required",
          repeatable: false,
          fields: [
            {
              name: "reason",
              type: { type: "text" },
              explain: "tag.content-warning.reason",
              optional: true,
            },
          ],
        },
        {
          name: "L",
          explain: "tag.L",
          presence: "optional",
          repeatable: true,
          fields: [
            { name: "namespace", type: { type: "text", minLength: 1 }, explain: "tag.L.value" },
          ],
        },
        {
          name: "l",
          explain: "tag.l",
          presence: "optional",
          repeatable: true,
          fields: [
            { name: "label", type: { type: "text", minLength: 1 }, explain: "tag.l.value" },
            { name: "namespace", type: { type: "text" }, explain: "tag.l.mark", optional: true },
          ],
        },
      ],
      examples: [
        {
          id: "spoiler",
          label: "example.spoiler",
          explain: "example.spoiler.explain",
          signer: "bob",
          template: {
            kind: 1,
            tags: [["content-warning", "Spoilers: season finale"]],
            content: "I did NOT see that ending coming. The farmer was the narrator all along!",
          },
        },
        {
          id: "labelled",
          label: "example.labelled",
          explain: "example.labelled.explain",
          signer: "carol",
          template: {
            kind: 1,
            tags: [
              ["content-warning", "Medical: surgery photo"],
              ["L", "content-warning"],
              ["l", "medical", "content-warning"],
            ],
            content: "Healing well after the knee surgery. Photo of the stitches below.",
          },
        },
        {
          id: "bare",
          label: "example.bare",
          signer: "erin",
          template: {
            kind: 1,
            tags: [["content-warning"]],
            content: "Today's weird animal is a very realistic spider. You have been warned.",
          },
        },
      ],
    },
  ],
};
