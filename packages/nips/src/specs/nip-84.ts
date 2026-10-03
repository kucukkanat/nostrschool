// Owner: spec author r5 (NIPs 80–99). NIP-84: Highlights.
import type { NipSpec, TagSpec } from "../spec.ts";

const FRANK = "922e43b50aec16ad1e9d1ec6854c058816d28b944ae2fe9bdce3d9241bfaafb8";
const FRANK_ARTICLE_ID = "a1bd51f63b58261b774eb882ba099a2bec2f7021f73a0fea48025091cfe40f0f";
const ALPHA = "wss://relay.alpha.example";

const tags: readonly TagSpec[] = [
  {
    name: "a",
    explain: "tag.a",
    presence: "optional",
    repeatable: false,
    fields: [
      { name: "address", type: { type: "addr" }, explain: "tag.a.address" },
      { name: "relay", type: { type: "relay-url" }, explain: "tag.relay", optional: true },
    ],
  },
  {
    name: "e",
    explain: "tag.e",
    presence: "optional",
    repeatable: false,
    fields: [
      { name: "event-id", type: { type: "event-id" }, explain: "tag.e.event-id" },
      { name: "relay", type: { type: "relay-url" }, explain: "tag.relay", optional: true },
    ],
  },
  {
    name: "i",
    explain: "tag.i",
    presence: "optional",
    repeatable: false,
    fields: [
      { name: "identifier", type: { type: "text", minLength: 1 }, explain: "tag.i.identifier" },
      { name: "hint", type: { type: "url" }, explain: "tag.i.hint", optional: true },
    ],
  },
  {
    name: "r",
    explain: "tag.r",
    presence: "optional",
    repeatable: true,
    fields: [
      { name: "source", type: { type: "text", minLength: 1 }, explain: "tag.r.source" },
      {
        name: "marker",
        type: {
          type: "enum",
          values: [
            { value: "source", explain: "tag.r.marker.source" },
            { value: "mention", explain: "tag.r.marker.mention" },
          ],
        },
        explain: "tag.r.marker",
        optional: true,
      },
    ],
  },
  {
    name: "p",
    explain: "tag.p",
    presence: "optional",
    repeatable: true,
    fields: [
      { name: "pubkey", type: { type: "pubkey" }, explain: "tag.p.pubkey" },
      { name: "relay", type: { type: "relay-url" }, explain: "tag.relay", optional: true },
      {
        name: "role",
        type: {
          type: "enum",
          values: [
            { value: "author", explain: "tag.p.role.author" },
            { value: "editor", explain: "tag.p.role.editor" },
            { value: "mention", explain: "tag.p.role.mention" },
          ],
          open: true,
        },
        explain: "tag.p.role",
        optional: true,
      },
    ],
  },
  {
    name: "context",
    explain: "tag.context",
    presence: "optional",
    repeatable: false,
    fields: [
      {
        name: "text",
        type: { type: "text", multiline: true, minLength: 1 },
        explain: "tag.context.text",
      },
    ],
  },
  {
    name: "comment",
    explain: "tag.comment",
    presence: "optional",
    repeatable: false,
    fields: [
      {
        name: "text",
        type: { type: "text", multiline: true, minLength: 1 },
        explain: "tag.comment.text",
      },
    ],
  },
];

export const nip84: NipSpec = {
  nip: "84",
  variant: "event",
  howItWorks: [
    {
      id: "select",
      title: "how.select.title",
      body: "how.select.body",
      focus: { part: { kind: "event", id: "highlight" }, path: ["content"] },
    },
    {
      id: "source",
      title: "how.source.title",
      body: "how.source.body",
      focus: { part: { kind: "event", id: "highlight" }, path: ["tags", 0] },
    },
    {
      id: "attribute",
      title: "how.attribute.title",
      body: "how.attribute.body",
      focus: { part: { kind: "event", id: "highlight" }, path: ["tags", 2] },
    },
    {
      id: "context",
      title: "how.context.title",
      body: "how.context.body",
      focus: { part: { kind: "event", id: "highlight" }, path: ["tags", 3] },
    },
    {
      id: "quote",
      title: "how.quote.title",
      body: "how.quote.body",
      focus: { part: { kind: "event", id: "highlight" } },
    },
  ],
  related: [
    { nip: "01", relation: "depends-on", explain: "related.01" },
    { nip: "23", relation: "see-also", explain: "related.23" },
    { nip: "73", relation: "depends-on", explain: "related.73" },
    { nip: "94", relation: "see-also", explain: "related.94" },
    { nip: "18", relation: "see-also", explain: "related.18" },
  ],
  events: [
    {
      id: "highlight",
      label: "event.highlight.label",
      explain: "event.highlight.explain",
      kinds: [9802],
      content: { format: "text", explain: "content", multiline: true },
      tags,
      examples: [
        {
          id: "nostr-article",
          label: "example.nostr-article.label",
          explain: "example.nostr-article.explain",
          signer: "alice",
          template: {
            kind: 9802,
            tags: [
              ["a", `30023:${FRANK}:protocols-not-platforms`, ALPHA],
              ["e", FRANK_ARTICLE_ID, ALPHA],
              ["p", FRANK, ALPHA, "author"],
              [
                "context",
                "Email outlived every email company. Protocols outlast the platforms built on them.",
              ],
            ],
            content: "Protocols outlast the platforms built on them.",
          },
        },
        {
          id: "web-page",
          label: "example.web-page.label",
          explain: "example.web-page.explain",
          signer: "carol",
          template: {
            kind: 9802,
            tags: [
              ["r", "https://blog.beta.example/film-cameras", "source"],
              [
                "p",
                "9445888d3235f73f8b627df1fb1d498f2eb3fa76337679c1176965a73d3b68b4",
                "",
                "author",
              ],
            ],
            content: "Film forces you to slow down: every frame costs something.",
          },
        },
        {
          id: "quote-highlight",
          label: "example.quote-highlight.label",
          explain: "example.quote-highlight.explain",
          signer: "bob",
          template: {
            kind: 9802,
            tags: [
              ["a", `30023:${FRANK}:protocols-not-platforms`, ALPHA],
              ["p", FRANK, ALPHA, "author"],
              [
                "comment",
                "This is the whole argument in one line. Thanks nostr:npub1u4gvd6fgpre4swpt0wxpgdzngn67lx3fj55cxnguym2hk6kwgnxqta308g for the tip!",
              ],
              [
                "p",
                "e550c6e92808f358382b7b8c14345344f5ef9a299529834d1c26d57b6ace44cc",
                "",
                "mention",
              ],
              ["r", "https://alpha.example/reading-list", "mention"],
            ],
            content: "Protocols outlast the platforms built on them.",
          },
        },
      ],
    },
  ],
};
