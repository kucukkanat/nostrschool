// Owner: spec author r2 (NIPs 20–39). NIP-30: Custom Emoji (emoji tags on kinds 0, 1, 7, 1111, 30315).
import type { NipSpec, TagSpec } from "../spec.ts";

const ERIN = "c71750007e42443e5ca8c1ea00babed4e8c78a9cb45dd6db3733d918e0b55deb";
const OSTRICH = "6f762f141286ff49dc17f167204069df048758cf0a4cd83dae2455f277241253";
const SET = `30030:${ERIN}:weird-animals`;
const OSTRICH_PNG = "https://emoji.example.com/erin/ostrich.png";
const BOLT_PNG = "https://emoji.example.com/erin/bolt.gif";

const emojiTag = (repeatable: boolean): TagSpec => ({
  name: "emoji",
  explain: repeatable ? "tag.emoji" : "tag.emoji-one",
  presence: repeatable ? "optional" : "required",
  repeatable,
  fields: [
    {
      name: "shortcode",
      type: { type: "text", pattern: "[A-Za-z0-9_-]+" },
      explain: "tag.emoji.shortcode",
      placeholder: "ostrich",
    },
    { name: "image", type: { type: "url" }, explain: "tag.emoji.image" },
    {
      name: "set",
      type: { type: "addr", kinds: [30030] },
      explain: "tag.emoji.set",
      optional: true,
    },
  ],
});

export const nip30: NipSpec = {
  nip: "30",
  variant: "event",
  howItWorks: [
    {
      id: "tag",
      title: "how.tag.title",
      body: "how.tag.body",
      focus: { part: { kind: "event", id: "note" }, path: ["tags", 0] },
    },
    {
      id: "shortcode",
      title: "how.shortcode.title",
      body: "how.shortcode.body",
      focus: { part: { kind: "event", id: "note" }, path: ["content"] },
    },
    {
      id: "set",
      title: "how.set.title",
      body: "how.set.body",
      focus: { part: { kind: "event", id: "note" }, path: ["tags", 0, 3] },
    },
    {
      id: "where",
      title: "how.where.title",
      body: "how.where.body",
      focus: { part: { kind: "event", id: "profile" } },
    },
  ],
  related: [
    { nip: "51", relation: "see-also", explain: "related.51" },
    { nip: "25", relation: "used-by", explain: "related.25" },
    { nip: "38", relation: "used-by", explain: "related.38" },
    { nip: "22", relation: "used-by", explain: "related.22" },
  ],
  events: [
    {
      id: "note",
      label: "event.note.label",
      explain: "event.note.explain",
      kinds: [1, 1111, 30315],
      content: { format: "text", explain: "content.note", multiline: true },
      tags: [emojiTag(true)],
      examples: [
        {
          id: "note",
          label: "example.note",
          explain: "example.note.explain",
          signer: "erin",
          template: {
            kind: 1,
            tags: [
              ["emoji", "ostrich", OSTRICH_PNG, SET],
              ["emoji", "bolt", BOLT_PNG],
            ],
            content: "Today's weird animal :ostrich: rides a :bolt: Who's next?",
          },
        },
      ],
    },
    {
      id: "reaction",
      label: "event.reaction.label",
      explain: "event.reaction.explain",
      kinds: [7],
      content: {
        format: "text",
        explain: "content.reaction",
        required: true,
        field: { type: "text", pattern: ":[A-Za-z0-9_-]+:" },
      },
      tags: [
        emojiTag(false),
        {
          name: "e",
          explain: "tag.e",
          presence: "required",
          repeatable: true,
          fields: [
            { name: "event-id", type: { type: "event-id" }, explain: "tag.e.id" },
            { name: "relay", type: { type: "relay-url" }, explain: "tag.relay", optional: true },
            { name: "pubkey", type: { type: "pubkey" }, explain: "tag.e.pubkey", optional: true },
          ],
        },
        {
          name: "p",
          explain: "tag.p",
          presence: "recommended",
          repeatable: true,
          fields: [
            { name: "pubkey", type: { type: "pubkey" }, explain: "tag.p.pubkey" },
            { name: "relay", type: { type: "relay-url" }, explain: "tag.relay", optional: true },
          ],
        },
      ],
      examples: [
        {
          id: "reaction",
          label: "example.reaction",
          signer: "bob",
          template: {
            kind: 7,
            tags: [
              ["emoji", "ostrich", OSTRICH_PNG, SET],
              ["e", OSTRICH, "wss://relay.alpha.example", ERIN],
              ["p", ERIN],
            ],
            content: ":ostrich:",
          },
        },
      ],
    },
    {
      id: "profile",
      label: "event.profile.label",
      explain: "event.profile.explain",
      kinds: [0],
      content: {
        format: "json",
        explain: "content.profile",
        schema: {
          type: "object",
          explain: "schema.profile",
          properties: {
            name: { type: "string", explain: "field.name" },
            about: { type: "string", explain: "field.about" },
          },
        },
      },
      tags: [emojiTag(true)],
      examples: [
        {
          id: "profile",
          label: "example.profile",
          signer: "erin",
          template: {
            kind: 0,
            tags: [["emoji", "ostrich", OSTRICH_PNG, SET]],
            content: JSON.stringify({
              name: "erin",
              display_name: "Erin",
              about: "Artist :ostrich: One weird animal per day.",
            }),
          },
        },
      ],
    },
  ],
};
