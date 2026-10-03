// Owner: spec author r2 (NIPs 20–39). NIP-24: Extra metadata fields and tags.
// Three parts: the extra kind 0 profile fields, the deprecated relay map in kind 3 content, and
// the generic r / i / title / t tags that any kind may carry.
import type { NipSpec } from "../spec.ts";

const urlString = (explain: string) =>
  ({ type: "string", explain, field: { type: "url" } }) as const;

export const nip24: NipSpec = {
  nip: "24",
  variant: "event",
  howItWorks: [
    {
      id: "display-name",
      title: "how.display-name.title",
      body: "how.display-name.body",
      focus: { part: { kind: "event", id: "profile" }, path: ["content"] },
    },
    { id: "extras", title: "how.extras.title", body: "how.extras.body" },
    { id: "deprecated", title: "how.deprecated.title", body: "how.deprecated.body" },
    {
      id: "tags",
      title: "how.tags.title",
      body: "how.tags.body",
      focus: { part: { kind: "event", id: "tags" }, path: ["tags"] },
    },
  ],
  related: [
    { nip: "01", relation: "extends", explain: "related.01" },
    { nip: "02", relation: "extends", explain: "related.02" },
    { nip: "65", relation: "replaces", explain: "related.65" },
    { nip: "73", relation: "see-also", explain: "related.73" },
  ],
  events: [
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
            display_name: { type: "string", explain: "field.display_name" },
            about: { type: "string", explain: "field.about" },
            picture: urlString("field.picture"),
            website: urlString("field.website"),
            banner: urlString("field.banner"),
            bot: { type: "boolean", explain: "field.bot" },
            birthday: {
              type: "object",
              explain: "field.birthday",
              properties: {
                year: { type: "number", integer: true, explain: "field.birthday.year" },
                month: {
                  type: "number",
                  integer: true,
                  minimum: 1,
                  maximum: 12,
                  explain: "field.birthday.month",
                },
                day: {
                  type: "number",
                  integer: true,
                  minimum: 1,
                  maximum: 31,
                  explain: "field.birthday.day",
                },
              },
              additionalProperties: false,
            },
            displayName: { type: "string", explain: "field.displayName", deprecated: true },
            username: { type: "string", explain: "field.username", deprecated: true },
          },
        },
      },
      tags: [],
      examples: [
        {
          id: "full",
          label: "example.full",
          explain: "example.full.explain",
          signer: "erin",
          template: {
            kind: 0,
            tags: [],
            content: JSON.stringify({
              name: "erin",
              display_name: "Erin 🦤",
              about: "Artist. Drawing one weird animal per day. Zaps keep me caffeinated.",
              website: "https://erin.example.com",
              banner: "https://erin.example.com/banner.png",
              birthday: { month: 4, day: 12 },
            }),
          },
        },
        {
          id: "bot",
          label: "example.bot",
          explain: "example.bot.explain",
          signer: "dave",
          template: {
            kind: 0,
            tags: [],
            content: JSON.stringify({
              name: "delta-status",
              display_name: "relay.delta.example status",
              about: "Automated uptime reports for relay.delta.example.",
              bot: true,
            }),
          },
        },
      ],
    },
    {
      id: "contacts-relays",
      label: "event.contacts-relays.label",
      explain: "event.contacts-relays.explain",
      kinds: [3],
      content: {
        format: "json",
        explain: "content.contacts-relays",
        schema: {
          type: "object",
          explain: "schema.contacts-relays",
          deprecated: true,
          properties: {},
          additionalProperties: {
            type: "object",
            explain: "schema.contacts-relays.entry",
            properties: {
              read: { type: "boolean", explain: "field.read" },
              write: { type: "boolean", explain: "field.write" },
            },
          },
        },
      },
      tags: [
        {
          name: "p",
          explain: "tag.p",
          presence: "optional",
          repeatable: true,
          fields: [
            { name: "pubkey", type: { type: "pubkey" }, explain: "tag.p.pubkey" },
            { name: "relay", type: { type: "relay-url" }, explain: "tag.relay", optional: true },
            { name: "petname", type: { type: "text" }, explain: "tag.p.petname", optional: true },
          ],
        },
      ],
      examples: [
        {
          id: "legacy",
          label: "example.legacy",
          explain: "example.legacy.explain",
          signer: "bob",
          template: {
            kind: 3,
            tags: [["p", "e550c6e92808f358382b7b8c14345344f5ef9a299529834d1c26d57b6ace44cc"]],
            content: JSON.stringify({
              "wss://relay.beta.example": { read: true, write: true },
              "wss://relay.gamma.example": { read: true, write: false },
            }),
          },
        },
      ],
    },
    {
      id: "tags",
      label: "event.tags.label",
      explain: "event.tags.explain",
      kinds: [{ from: 0, to: 65535 }],
      content: { format: "text", explain: "content.tags", multiline: true },
      tags: [
        {
          name: "r",
          explain: "tag.r",
          presence: "optional",
          repeatable: true,
          fields: [{ name: "url", type: { type: "url" }, explain: "tag.r.url" }],
        },
        {
          name: "i",
          explain: "tag.i",
          presence: "optional",
          repeatable: true,
          fields: [
            { name: "identifier", type: { type: "text", minLength: 1 }, explain: "tag.i.value" },
            { name: "hint", type: { type: "url" }, explain: "tag.i.hint", optional: true },
          ],
        },
        {
          name: "title",
          explain: "tag.title",
          presence: "optional",
          repeatable: false,
          fields: [{ name: "title", type: { type: "text" }, explain: "tag.title.value" }],
        },
        {
          name: "t",
          explain: "tag.t",
          presence: "optional",
          repeatable: true,
          fields: [
            {
              name: "hashtag",
              type: { type: "text", pattern: "[^A-Z\\s]+" },
              explain: "tag.t.value",
            },
          ],
        },
      ],
      examples: [
        {
          id: "note",
          label: "example.note",
          explain: "example.note.explain",
          signer: "frank",
          template: {
            kind: 1,
            tags: [
              ["r", "https://www.rfc-editor.org/rfc/rfc5322"],
              ["i", "isbn:9780262033848"],
              ["t", "openweb"],
              ["t", "email"],
            ],
            content:
              "Re-reading RFC 5322 next to an old algorithms textbook. Email's message format dates from 1982 and still works everywhere. #openweb #email",
          },
        },
      ],
    },
  ],
};
