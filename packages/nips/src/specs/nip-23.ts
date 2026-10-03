// Owner: spec author r2 (NIPs 20–39). NIP-23: Long-form Content (kind 30023).
// kind 30024 (self-encrypted drafts) is deprecated in favour of NIP-37 but still on relays, so it
// gets its own small shape: pasting one into the editor explains it instead of a bare kind mismatch.
import type { NipSpec, TagSpec } from "../spec.ts";

const FRANK = "922e43b50aec16ad1e9d1ec6854c058816d28b944ae2fe9bdce3d9241bfaafb8";
const BOB_NOTE = "814d487f9a9591bde04009eff371facb26e82f3a41cec1bcdcdab310075053be";

// A 30024 draft has "the same format as kind:30023", so both shapes share the tag list.
const ARTICLE_TAGS: readonly TagSpec[] = [
  {
    name: "d",
    explain: "tag.d",
    presence: "required",
    repeatable: false,
    fields: [
      {
        name: "identifier",
        type: { type: "text", minLength: 1 },
        explain: "tag.d.value",
        placeholder: "my-first-article",
      },
    ],
  },
  {
    name: "title",
    explain: "tag.title",
    presence: "recommended",
    repeatable: false,
    fields: [{ name: "title", type: { type: "text" }, explain: "tag.title.value" }],
  },
  {
    name: "summary",
    explain: "tag.summary",
    presence: "optional",
    repeatable: false,
    fields: [
      {
        name: "summary",
        type: { type: "text", multiline: true },
        explain: "tag.summary.value",
      },
    ],
  },
  {
    name: "published_at",
    explain: "tag.published_at",
    presence: "optional",
    repeatable: false,
    fields: [{ name: "timestamp", type: { type: "timestamp" }, explain: "tag.published_at.value" }],
  },
  {
    name: "image",
    explain: "tag.image",
    presence: "optional",
    repeatable: false,
    fields: [{ name: "url", type: { type: "url" }, explain: "tag.image.value" }],
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
      { name: "address", type: { type: "addr" }, explain: "tag.a.addr" },
      { name: "relay", type: { type: "relay-url" }, explain: "tag.relay", optional: true },
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
    ],
  },
];

export const nip23: NipSpec = {
  nip: "23",
  variant: "event",
  howItWorks: [
    {
      id: "markdown",
      title: "how.markdown.title",
      body: "how.markdown.body",
      focus: { part: { kind: "event", id: "article" }, path: ["content"] },
    },
    {
      id: "d",
      title: "how.d.title",
      body: "how.d.body",
      focus: { part: { kind: "event", id: "article" }, path: ["tags", 0] },
    },
    {
      id: "meta",
      title: "how.meta.title",
      body: "how.meta.body",
      focus: { part: { kind: "event", id: "article" }, path: ["tags", 1] },
    },
    {
      id: "dates",
      title: "how.dates.title",
      body: "how.dates.body",
      focus: { part: { kind: "event", id: "article" }, path: ["tags", 3] },
    },
    { id: "link", title: "how.link.title", body: "how.link.body" },
    {
      id: "drafts",
      title: "how.drafts.title",
      body: "how.drafts.body",
      focus: { part: { kind: "event", id: "draft" }, path: ["kind"] },
    },
  ],
  related: [
    { nip: "01", relation: "depends-on", explain: "related.01" },
    { nip: "19", relation: "see-also", explain: "related.19" },
    { nip: "27", relation: "depends-on", explain: "related.27" },
    { nip: "22", relation: "see-also", explain: "related.22" },
    { nip: "37", relation: "replaced-by", explain: "related.37" },
  ],
  events: [
    {
      id: "article",
      label: "event.article.label",
      explain: "event.article.explain",
      kinds: [30023],
      content: { format: "text", explain: "content", required: true, multiline: true },
      tags: ARTICLE_TAGS,
      examples: [
        {
          id: "essay",
          label: "example.essay",
          explain: "example.essay.explain",
          signer: "frank",
          template: {
            kind: 30023,
            created_at: 1735660800,
            tags: [
              ["d", "protocols-not-platforms"],
              ["title", "Protocols, not platforms"],
              ["summary", "Why open protocols outlive the apps built on them."],
              ["published_at", "1735516800"],
              ["t", "essay"],
              ["t", "nostr"],
            ],
            content:
              "# Protocols, not platforms\n\nEmail outlived every email company. The web outlived every browser war.\n\nNostr is a bet that social media can work the same way: **your keys, your followers, any app**.\n\n## What changes\n\n- You can switch clients without losing anyone.\n- Relays compete on service, not on lock-in.\n- Moderation becomes a choice, not a verdict.",
          },
        },
        {
          id: "with-refs",
          label: "example.with-refs",
          explain: "example.with-refs.explain",
          signer: "alice",
          template: {
            kind: 30023,
            tags: [
              ["d", "how-relays-work"],
              ["title", "How relays work, in five minutes"],
              ["image", "https://images.example.com/relays-cover.png"],
              ["published_at", "1735689600"],
              ["t", "relays"],
              ["e", BOB_NOTE, "wss://relay.beta.example"],
              ["a", `30023:${FRANK}:protocols-not-platforms`, "wss://relay.beta.example"],
            ],
            content:
              "Relays are simple servers that store and forward signed events.\n\nBob put it best in [his note](nostr:note1s9x5slu6jkgmmczqp8hlxu06evnwste6g88vr0xum2e3qp6s2wlqz09zra), and Frank wrote the long version: nostr:naddr1qqthqun0w3hkxmmvwvkkumm594cxcct5vehhymtnqyv8wumn8ghj7un9d3shjtnzv46xztn90psk6urvv5pzpy3wgw6s4mqk450f68kxs4xqtzqk629egjhzl6daec7eysdl4tacqvzqqqr4guhvmfqn",
          },
        },
      ],
    },
    {
      id: "draft",
      label: "event.draft.label",
      explain: "event.draft.explain",
      kinds: [30024],
      content: {
        format: "encrypted",
        explain: "draft.content",
        scheme: "nip04",
        plaintext: { format: "text", explain: "draft.plaintext", multiline: true },
      },
      tags: ARTICLE_TAGS,
      examples: [
        {
          id: "draft",
          label: "example.draft",
          explain: "example.draft.explain",
          signer: "frank",
          template: {
            kind: 30024,
            tags: [["d", "notes-from-the-darkroom"]],
            // nip04Encrypt("# Notes from the darkroom\n\nHalf-finished: why film photographers should
            // care about owning their audience.", frank, frank.pubkey), fixed IV for a stable example.
            content:
              "zSsodFL1V4nmWpP0qQlOpmut2DoCbSUvOMI94ZrGObEvkwehfGihlkrpRRqtSb6ElTOqyinru5Y3WiRKzni1bwM1gAVnJ6U4QC/tQ/S1N9xEGUPx2hzX/Oztk0QJpFq3q/w2nQ3/clt5bkgDlMK09A==?iv=AwoRGB8mLTQ7QklQV15lbA==",
          },
        },
      ],
    },
  ],
};
