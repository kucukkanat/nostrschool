// Owner: spec author r3 (NIPs 40–59). NIP-54: Wiki.
// Explanations: packages/i18n/src/locales/en/nips/r3.ts → n54.text.
import type { NipSpec, TagSpec } from "../spec.ts";

const ALICE = "e550c6e92808f358382b7b8c14345344f5ef9a299529834d1c26d57b6ace44cc";
const ALICE_RELAY_ARTICLE = `30818:${ALICE}:relay`;
// Ids of two versions of articles, used as references in the examples (illustrative).
const ALICE_VERSION = "ec3e76895bf71feea7548ea05fd586b83ef2da761062def56efd309fed6191be";
const BOB_FORK = "814d487f9a9591bde04009eff371facb26e82f3a41cec1bcdcdab310075053be";

/** Normalised d tag: no ASCII upper case, no whitespace (non-Latin scripts are kept as is). */
const NORMALIZED = { type: "text", minLength: 1, pattern: "[^A-Z\\s]+" } as const;

const marker = {
  name: "marker",
  type: {
    type: "enum",
    values: [
      { value: "fork", explain: "marker.fork" },
      { value: "defer", explain: "marker.defer" },
    ],
  },
  explain: "field.marker",
  optional: true,
} as const;

const articleRefs: readonly TagSpec[] = [
  {
    name: "a",
    explain: "article.tag.a",
    presence: "optional",
    repeatable: true,
    fields: [
      { name: "article", type: { type: "addr", kinds: [30818] }, explain: "field.article" },
      { name: "relay", type: { type: "relay-url" }, explain: "field.relay", optional: true },
      marker,
    ],
  },
  {
    name: "e",
    explain: "article.tag.e",
    presence: "optional",
    repeatable: true,
    fields: [
      { name: "version", type: { type: "event-id" }, explain: "field.version" },
      { name: "relay", type: { type: "relay-url" }, explain: "field.relay", optional: true },
      marker,
    ],
  },
];

export const nip54: NipSpec = {
  nip: "54",
  variant: "event",
  events: [
    {
      id: "article",
      label: "article.label",
      explain: "article.explain",
      kinds: [30818],
      content: { format: "text", explain: "article.content", required: true, multiline: true },
      tags: [
        {
          name: "d",
          explain: "tag.d",
          presence: "required",
          repeatable: false,
          fields: [{ name: "topic", type: NORMALIZED, explain: "field.d" }],
        },
        {
          name: "title",
          explain: "article.tag.title",
          presence: "optional",
          repeatable: false,
          fields: [{ name: "title", type: { type: "text" }, explain: "field.title" }],
        },
        {
          name: "summary",
          explain: "article.tag.summary",
          presence: "optional",
          repeatable: false,
          fields: [{ name: "summary", type: { type: "text" }, explain: "field.summary" }],
        },
        ...articleRefs,
      ],
      examples: [
        {
          id: "relay",
          label: "example.article",
          explain: "example.article.explain",
          signer: "alice",
          template: {
            kind: 30818,
            tags: [
              ["d", "relay"],
              ["title", "Relay"],
              ["summary", "A server that stores and forwards Nostr events"],
            ],
            content:
              "A *relay* is a WebSocket server that accepts and serves [events][]. Clients usually talk to several relays at once, a pattern described in the [outbox model][].\n\nSee [Alice](nostr:npub1u4gvd6fgpre4swpt0wxpgdzngn67lx3fj55cxnguym2hk6kwgnxqta308g) for more.",
          },
        },
        {
          id: "fork",
          label: "example.fork",
          explain: "example.fork.explain",
          signer: "bob",
          template: {
            kind: 30818,
            tags: [
              ["d", "relay"],
              ["title", "Relay"],
              ["a", ALICE_RELAY_ARTICLE, "wss://relay.alpha.example", "fork"],
              ["e", ALICE_VERSION, "wss://relay.alpha.example", "fork"],
            ],
            content:
              "A *relay* is a WebSocket server that accepts and serves [events][]. Most relays are free; some charge for writing to fight spam ([paid relay][]).",
          },
        },
      ],
    },
    {
      id: "merge-request",
      label: "merge.label",
      explain: "merge.explain",
      kinds: [818],
      content: { format: "text", explain: "merge.content", multiline: true },
      tags: [
        {
          name: "a",
          explain: "merge.tag.a",
          presence: "required",
          repeatable: false,
          fields: [
            { name: "article", type: { type: "addr", kinds: [30818] }, explain: "merge.field.a" },
            { name: "relay", type: { type: "relay-url" }, explain: "field.relay", optional: true },
          ],
        },
        {
          id: "e-base",
          name: "e",
          explain: "merge.tag.e-base",
          presence: "optional",
          repeatable: false,
          fields: [
            { name: "base-version", type: { type: "event-id" }, explain: "merge.field.e-base" },
            { name: "relay", type: { type: "relay-url" }, explain: "field.relay", optional: true },
          ],
        },
        {
          id: "e-source",
          name: "e",
          explain: "merge.tag.e-source",
          presence: "required",
          repeatable: false,
          when: { index: 3, equals: "source" },
          fields: [
            { name: "source-version", type: { type: "event-id" }, explain: "merge.field.e-source" },
            { name: "relay", type: { type: "relay-url" }, explain: "field.relay" },
            {
              name: "marker",
              type: { type: "enum", values: [{ value: "source" }] },
              explain: "merge.field.marker",
            },
          ],
          template: ["e", "", "", "source"],
        },
        {
          name: "p",
          explain: "merge.tag.p",
          presence: "required",
          repeatable: false,
          fields: [{ name: "pubkey", type: { type: "pubkey" }, explain: "merge.field.p" }],
        },
      ],
      examples: [
        {
          id: "bob-to-alice",
          label: "example.merge",
          explain: "example.merge.explain",
          signer: "bob",
          template: {
            kind: 818,
            tags: [
              ["a", ALICE_RELAY_ARTICLE, "wss://relay.alpha.example"],
              ["e", ALICE_VERSION, "wss://relay.alpha.example"],
              ["p", ALICE],
              ["e", BOB_FORK, "wss://relay.beta.example", "source"],
            ],
            content: "I added a sentence about paid relays.",
          },
        },
      ],
    },
    {
      id: "redirect",
      label: "redirect.label",
      explain: "redirect.explain",
      kinds: [30819],
      content: { format: "empty", explain: "redirect.content" },
      tags: [
        {
          name: "d",
          explain: "redirect.tag.d",
          presence: "required",
          repeatable: false,
          fields: [{ name: "from", type: NORMALIZED, explain: "field.d" }],
        },
        {
          name: "a",
          explain: "redirect.tag.a",
          presence: "required",
          repeatable: false,
          fields: [
            { name: "article", type: { type: "addr", kinds: [30818] }, explain: "field.article" },
            { name: "relay", type: { type: "relay-url" }, explain: "field.relay", optional: true },
          ],
        },
      ],
      examples: [
        {
          id: "relays-to-relay",
          label: "example.redirect",
          signer: "alice",
          template: {
            kind: 30819,
            tags: [
              ["d", "relays"],
              ["a", ALICE_RELAY_ARTICLE, "wss://relay.alpha.example"],
            ],
            content: "",
          },
        },
      ],
    },
  ],
  flows: [
    {
      id: "fork-merge",
      label: "flow.merge.label",
      explain: "flow.merge.explain",
      steps: [
        { part: { kind: "event", id: "article" }, explain: "flow.merge.fork" },
        { part: { kind: "event", id: "merge-request" }, explain: "flow.merge.request" },
      ],
    },
  ],
  howItWorks: [
    {
      id: "topic",
      title: "how.topic.title",
      body: "how.topic.body",
      focus: { part: { kind: "event", id: "article" }, path: ["tags", 0, 1] },
    },
    {
      id: "djot",
      title: "how.djot.title",
      body: "how.djot.body",
      focus: { part: { kind: "event", id: "article" }, path: ["content"] },
    },
    {
      id: "many-versions",
      title: "how.many-versions.title",
      body: "how.many-versions.body",
    },
    {
      id: "fork",
      title: "how.fork.title",
      body: "how.fork.body",
      focus: { part: { kind: "event", id: "article" }, path: ["tags", 2] },
    },
    {
      id: "merge",
      title: "how.merge.title",
      body: "how.merge.body",
      focus: { part: { kind: "event", id: "merge-request" }, path: ["tags", 3] },
    },
    {
      id: "redirect",
      title: "how.redirect.title",
      body: "how.redirect.body",
      focus: { part: { kind: "event", id: "redirect" } },
    },
  ],
  related: [
    { nip: "23", relation: "see-also", explain: "related.23" },
    { nip: "21", relation: "depends-on", explain: "related.21" },
    { nip: "25", relation: "see-also", explain: "related.25" },
    { nip: "51", relation: "see-also", explain: "related.51" },
  ],
};
