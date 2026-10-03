// Owner: spec author r2 (NIPs 20–39). NIP-25: Reactions (kind 7 and kind 17).
// The content is deliberately not an enum: "+", "-", "" and any emoji are all valid, so an enum
// would flag legitimate emoji reactions.
import type { NipSpec } from "../spec.ts";

const ERIN = "c71750007e42443e5ca8c1ea00babed4e8c78a9cb45dd6db3733d918e0b55deb";
const FRANK = "922e43b50aec16ad1e9d1ec6854c058816d28b944ae2fe9bdce3d9241bfaafb8";
const OSTRICH = "6f762f141286ff49dc17f167204069df048758cf0a4cd83dae2455f277241253";
const ARTICLE = "a1bd51f63b58261b774eb882ba099a2bec2f7021f73a0fea48025091cfe40f0f";
const ALPHA = "wss://relay.alpha.example";
const BETA = "wss://relay.beta.example";

export const nip25: NipSpec = {
  nip: "25",
  variant: "event",
  howItWorks: [
    {
      id: "content",
      title: "how.content.title",
      body: "how.content.body",
      focus: { part: { kind: "event", id: "reaction" }, path: ["content"] },
    },
    {
      id: "target",
      title: "how.target.title",
      body: "how.target.body",
      focus: { part: { kind: "event", id: "reaction" }, path: ["tags", 0] },
    },
    {
      id: "author",
      title: "how.author.title",
      body: "how.author.body",
      focus: { part: { kind: "event", id: "reaction" }, path: ["tags", 1] },
    },
    { id: "emoji", title: "how.emoji.title", body: "how.emoji.body" },
    {
      id: "external",
      title: "how.external.title",
      body: "how.external.body",
      focus: { part: { kind: "event", id: "external" } },
    },
  ],
  related: [
    { nip: "30", relation: "see-also", explain: "related.30" },
    { nip: "73", relation: "depends-on", explain: "related.73" },
    { nip: "01", relation: "depends-on", explain: "related.01" },
  ],
  events: [
    {
      id: "reaction",
      label: "event.reaction.label",
      explain: "event.reaction.explain",
      kinds: [7],
      content: { format: "text", explain: "content.reaction" },
      tags: [
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
        {
          name: "a",
          explain: "tag.a",
          presence: "optional",
          repeatable: false,
          fields: [
            { name: "address", type: { type: "addr" }, explain: "tag.a.addr" },
            { name: "relay", type: { type: "relay-url" }, explain: "tag.relay", optional: true },
          ],
        },
        {
          name: "k",
          explain: "tag.k",
          presence: "optional",
          repeatable: false,
          fields: [{ name: "kind", type: { type: "kind" }, explain: "tag.k.kind" }],
        },
        {
          name: "emoji",
          explain: "tag.emoji",
          presence: "optional",
          repeatable: false,
          fields: [
            {
              name: "shortcode",
              type: { type: "text", pattern: "[A-Za-z0-9_-]+" },
              explain: "tag.emoji.shortcode",
            },
            { name: "image", type: { type: "url" }, explain: "tag.emoji.image" },
            {
              name: "set",
              type: { type: "addr", kinds: [30030] },
              explain: "tag.emoji.set",
              optional: true,
            },
          ],
        },
      ],
      examples: [
        {
          id: "like",
          label: "example.like",
          explain: "example.like.explain",
          signer: "alice",
          template: {
            kind: 7,
            tags: [
              ["e", OSTRICH, ALPHA, ERIN],
              ["p", ERIN, ALPHA],
              ["k", "1"],
            ],
            content: "+",
          },
        },
        {
          id: "article",
          label: "example.article",
          explain: "example.article.explain",
          signer: "erin",
          template: {
            kind: 7,
            tags: [
              ["e", ARTICLE, ALPHA],
              ["a", `30023:${FRANK}:protocols-not-platforms`, BETA],
              ["p", FRANK],
              ["k", "30023"],
            ],
            content: "+",
          },
        },
        {
          id: "custom-emoji",
          label: "example.custom-emoji",
          explain: "example.custom-emoji.explain",
          signer: "bob",
          template: {
            kind: 7,
            tags: [
              ["e", OSTRICH, ALPHA, ERIN],
              ["p", ERIN, ALPHA],
              ["emoji", "ostrich", "https://emoji.example.com/ostrich.png"],
            ],
            content: ":ostrich:",
          },
        },
      ],
    },
    {
      id: "external",
      label: "event.external.label",
      explain: "event.external.explain",
      kinds: [17],
      content: { format: "text", explain: "content.reaction" },
      tags: [
        {
          name: "k",
          explain: "tag.ext.k",
          presence: "required",
          repeatable: true,
          fields: [
            {
              name: "type",
              type: { type: "text", minLength: 1 },
              explain: "tag.ext.k.type",
              placeholder: "web",
            },
          ],
        },
        {
          name: "i",
          explain: "tag.ext.i",
          presence: "required",
          repeatable: true,
          fields: [
            {
              name: "identifier",
              type: { type: "text", minLength: 1 },
              explain: "tag.ext.i.value",
            },
            { name: "hint", type: { type: "url" }, explain: "tag.ext.i.hint", optional: true },
          ],
        },
      ],
      examples: [
        {
          id: "website",
          label: "example.website",
          signer: "grace",
          template: {
            kind: 17,
            tags: [
              ["k", "web"],
              ["i", "https://example.com/articles/open-protocols"],
            ],
            content: "⭐",
          },
        },
        {
          id: "podcast",
          label: "example.podcast",
          explain: "example.podcast.explain",
          signer: "bob",
          template: {
            kind: 17,
            tags: [
              ["k", "podcast:guid"],
              [
                "i",
                "podcast:guid:917393e3-1b1e-5cef-ace4-edaa54e1f810",
                "https://fountain.fm/show/QRT0l2EfrKXNGDlRrmjL",
              ],
              ["k", "podcast:item:guid"],
              [
                "i",
                "podcast:item:guid:PC20-229",
                "https://fountain.fm/episode/DQqBg5sD3qFGMCZoSuLF",
              ],
            ],
            content: "+",
          },
        },
      ],
    },
  ],
};
