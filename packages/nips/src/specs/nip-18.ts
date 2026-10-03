// Owner: spec author r1 (NIPs 01–19). NIP-18: Reposts.
// Explanations: packages/i18n/src/locales/en/nips/r1.ts → n18.text.
import type { NipSpec, TagFieldSpec } from "../spec.ts";

const BOB = "a73883912a48c3551c1548fd454876d577126a61c76b5486c807bfec5869e183";
const FRANK = "922e43b50aec16ad1e9d1ec6854c058816d28b944ae2fe9bdce3d9241bfaafb8";

const OPTIONAL_RELAY: TagFieldSpec = {
  name: "relay",
  type: { type: "relay-url" },
  explain: "tag.relay",
  optional: true,
};

// Real fixture events, embedded as the repost content (they must stay byte-identical).
const BOB_NOTE_JSON =
  '{"kind":1,"created_at":1735685100,"tags":[["t","nostr"]],"content":"Hot take: the best feature of #nostr is that your identity is just a keypair. No email, no phone number.","pubkey":"a73883912a48c3551c1548fd454876d577126a61c76b5486c807bfec5869e183","id":"814d487f9a9591bde04009eff371facb26e82f3a41cec1bcdcdab310075053be","sig":"76049ab11e742fe3bbbd8f997e08f7bb3e505706f579b4805c55283c8e83a5a5c564f2baf488429ff3392a4cf18e45d04c6bc3b8949ee5a4ba58ba2048e051d8"}';
const FRANK_ARTICLE_JSON =
  '{"id":"a1bd51f63b58261b774eb882ba099a2bec2f7021f73a0fea48025091cfe40f0f","pubkey":"922e43b50aec16ad1e9d1ec6854c058816d28b944ae2fe9bdce3d9241bfaafb8","created_at":1735660800,"kind":30023,"tags":[["d","protocols-not-platforms"],["title","Protocols, not platforms"],["summary","Why open protocols outlive the apps built on them."],["published_at","1735516800"],["t","essay"],["t","nostr"]],"content":"# Protocols, not platforms\\n\\nEmail outlived every email company. The web outlived every browser war.\\n\\nNostr is a bet that social media can work the same way: **your keys, your followers, any app**.\\n\\n## What changes\\n\\n- You can switch clients without losing anyone.\\n- Relays compete on service, not on lock-in.\\n- Moderation becomes a choice, not a verdict.","sig":"e5d8142cc3ca9cf77d16f8a21c2068f5e20f9c701091ea9754bef328ddb100dfec5e6993cb6b97d6161493a541c6fed5be3fcac20327da685e1ac548adf2a3bc"}';

export const nip18: NipSpec = {
  nip: "18",
  variant: "event",
  howItWorks: [
    {
      id: "repost",
      title: "how.repost.title",
      body: "how.repost.body",
      focus: { part: { kind: "event", id: "repost" }, path: ["content"] },
    },
    {
      id: "where",
      title: "how.where.title",
      body: "how.where.body",
      focus: { part: { kind: "event", id: "repost" }, path: ["tags", 0, 2] },
    },
    {
      id: "generic",
      title: "how.generic.title",
      body: "how.generic.body",
      focus: { part: { kind: "event", id: "generic-repost" }, path: ["tags"] },
    },
    {
      id: "quote",
      title: "how.quote.title",
      body: "how.quote.body",
      focus: { part: { kind: "event", id: "quote" }, path: ["tags", 0] },
    },
  ],
  related: [
    { nip: "01", relation: "depends-on", explain: "related.01" },
    { nip: "21", relation: "see-also", explain: "related.21" },
    { nip: "10", relation: "see-also", explain: "related.10" },
    { nip: "70", relation: "see-also", explain: "related.70" },
  ],
  events: [
    {
      id: "repost",
      label: "repost.label",
      explain: "repost.explain",
      kinds: [6],
      content: {
        format: "text",
        explain: "repost.content",
        field: { type: "event-json", kinds: [1] },
      },
      tags: [
        {
          name: "e",
          explain: "tag.e.repost",
          presence: "required",
          repeatable: false,
          fields: [
            { name: "event-id", type: { type: "event-id" }, explain: "tag.e.id" },
            { name: "relay", type: { type: "relay-url" }, explain: "tag.e.relay" },
          ],
        },
        {
          name: "p",
          explain: "tag.p",
          presence: "recommended",
          repeatable: false,
          fields: [
            { name: "pubkey", type: { type: "pubkey" }, explain: "tag.p.pubkey" },
            OPTIONAL_RELAY,
          ],
        },
      ],
      examples: [
        {
          id: "note",
          label: "example.repost.label",
          explain: "example.repost.explain",
          signer: "erin",
          template: {
            kind: 6,
            created_at: 1735686300,
            tags: [
              [
                "e",
                "814d487f9a9591bde04009eff371facb26e82f3a41cec1bcdcdab310075053be",
                "wss://relay.beta.example",
              ],
              ["p", BOB, "wss://relay.beta.example"],
            ],
            content: BOB_NOTE_JSON,
          },
        },
      ],
    },
    {
      id: "generic-repost",
      label: "generic.label",
      explain: "generic.explain",
      kinds: [16],
      content: { format: "text", explain: "generic.content", field: { type: "event-json" } },
      tags: [
        {
          name: "e",
          explain: "tag.e.repost",
          presence: "required",
          repeatable: false,
          fields: [
            { name: "event-id", type: { type: "event-id" }, explain: "tag.e.id" },
            { name: "relay", type: { type: "relay-url" }, explain: "tag.e.relay" },
          ],
        },
        {
          name: "p",
          explain: "tag.p",
          presence: "recommended",
          repeatable: false,
          fields: [
            { name: "pubkey", type: { type: "pubkey" }, explain: "tag.p.pubkey" },
            OPTIONAL_RELAY,
          ],
        },
        {
          name: "k",
          explain: "tag.k",
          presence: "recommended",
          repeatable: false,
          fields: [{ name: "kind", type: { type: "kind" }, explain: "tag.k.kind" }],
        },
        {
          name: "a",
          explain: "tag.a",
          presence: "optional",
          repeatable: false,
          fields: [
            { name: "address", type: { type: "addr" }, explain: "tag.a.address" },
            OPTIONAL_RELAY,
          ],
        },
      ],
      examples: [
        {
          id: "article",
          label: "example.generic.label",
          explain: "example.generic.explain",
          signer: "erin",
          template: {
            kind: 16,
            tags: [
              [
                "e",
                "a1bd51f63b58261b774eb882ba099a2bec2f7021f73a0fea48025091cfe40f0f",
                "wss://relay.beta.example",
              ],
              ["p", FRANK, "wss://relay.beta.example"],
              ["k", "30023"],
              ["a", `30023:${FRANK}:protocols-not-platforms`, "wss://relay.beta.example"],
            ],
            content: FRANK_ARTICLE_JSON,
          },
        },
      ],
    },
    {
      id: "quote",
      label: "quote.label",
      explain: "quote.explain",
      kinds: [1],
      content: { format: "text", explain: "quote.content", required: true, multiline: true },
      tags: [
        {
          name: "q",
          explain: "tag.q",
          presence: "required",
          repeatable: true,
          fields: [
            {
              name: "target",
              type: { type: "text", pattern: "[0-9a-f]{64}|\\d+:[0-9a-f]{64}:.*" },
              explain: "tag.q.target",
            },
            OPTIONAL_RELAY,
            { name: "pubkey", type: { type: "pubkey" }, explain: "tag.q.pubkey", optional: true },
          ],
        },
        {
          name: "p",
          explain: "tag.p",
          presence: "recommended",
          repeatable: true,
          fields: [
            { name: "pubkey", type: { type: "pubkey" }, explain: "tag.p.pubkey" },
            OPTIONAL_RELAY,
          ],
        },
      ],
      examples: [
        {
          id: "quote",
          label: "example.quote.label",
          explain: "example.quote.explain",
          signer: "carol",
          template: {
            kind: 1,
            created_at: 1735686000,
            tags: [
              [
                "q",
                "814d487f9a9591bde04009eff371facb26e82f3a41cec1bcdcdab310075053be",
                "wss://relay.beta.example",
                BOB,
              ],
              ["p", BOB, "wss://relay.beta.example"],
            ],
            content:
              "This! 👇\nnostr:note1s9x5slu6jkgmmczqp8hlxu06evnwste6g88vr0xum2e3qp6s2wlqz09zra",
          },
        },
      ],
    },
  ],
};
