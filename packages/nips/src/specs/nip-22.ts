// Owner: spec author r2 (NIPs 20–39). NIP-22: Comment (kind 1111).
// Upper-case tags (E/A/I, K, P) point at the root of the thread; lower-case (e/a/i, k, p) at the
// direct parent. Exactly one of E/A/I (and of e/a/i) applies, and P/p only when there is a Nostr
// author, so those are "optional" (marking them "recommended" would flag the alternatives you
// did not pick); the walkthrough explains the rule. K and k are always required.
// `requireOneOf` enforces "at least one of E/A/I" and "at least one of e/a/i".
// Kind 1 notes are threaded with NIP-10, never NIP-22, so the K/k pattern rejects "1" (the
// field explanation says why); a dedicated warning code would need a validator change.
import type { NipSpec, TagSpec } from "../spec.ts";

const FRANK = "922e43b50aec16ad1e9d1ec6854c058816d28b944ae2fe9bdce3d9241bfaafb8";
const CAROL = "9445888d3235f73f8b627df1fb1d498f2eb3fa76337679c1176965a73d3b68b4";
const ARTICLE_ID = "a1bd51f63b58261b774eb882ba099a2bec2f7021f73a0fea48025091cfe40f0f";
const ARTICLE_ADDR = `30023:${FRANK}:protocols-not-platforms`;
const BETA = "wss://relay.beta.example";
const GAMMA = "wss://relay.gamma.example";
// Id of the "on-article" example below when signed by carol at FIXTURE_NOW (r2.test.ts checks it).
export const NIP22_FIRST_COMMENT_ID =
  "943eeeda1b929a53b1969d98cd01a32d56ee612d201b6978c6e053dae9c697d2";

const scope = (upper: boolean): readonly TagSpec[] => {
  const c = (name: string) => (upper ? name.toUpperCase() : name);
  const area = upper ? "root" : "parent";
  return [
    {
      name: c("e"),
      explain: `tag.${area}.e`,
      presence: "optional",
      repeatable: false,
      fields: [
        { name: "event-id", type: { type: "event-id" }, explain: `tag.${area}.e.id` },
        { name: "relay", type: { type: "relay-url" }, explain: "tag.relay", optional: true },
        {
          name: "pubkey",
          type: { type: "pubkey" },
          explain: `tag.${area}.e.pubkey`,
          optional: true,
        },
      ],
    },
    {
      name: c("a"),
      explain: `tag.${area}.a`,
      presence: "optional",
      repeatable: false,
      fields: [
        { name: "address", type: { type: "addr" }, explain: `tag.${area}.a.addr` },
        { name: "relay", type: { type: "relay-url" }, explain: "tag.relay", optional: true },
      ],
    },
    {
      name: c("i"),
      explain: `tag.${area}.i`,
      presence: "optional",
      repeatable: false,
      fields: [
        {
          name: "identifier",
          type: { type: "text", minLength: 1 },
          explain: "tag.i.value",
          placeholder: "https://example.com/post",
        },
        { name: "hint", type: { type: "url" }, explain: "tag.i.hint", optional: true },
      ],
    },
    {
      name: c("k"),
      explain: `tag.${area}.k`,
      presence: "required",
      repeatable: false,
      fields: [
        {
          name: "kind",
          type: { type: "text", pattern: "(?!1$)(?:\\d+|[a-z0-9]+(?::[a-z0-9]+)*)", minLength: 1 },
          explain: "tag.k.value",
          placeholder: "1",
        },
      ],
    },
    {
      name: c("p"),
      explain: `tag.${area}.p`,
      presence: "optional",
      repeatable: false,
      fields: [
        { name: "pubkey", type: { type: "pubkey" }, explain: `tag.${area}.p.pubkey` },
        { name: "relay", type: { type: "relay-url" }, explain: "tag.relay", optional: true },
      ],
    },
  ];
};

export const nip22: NipSpec = {
  nip: "22",
  variant: "event",
  howItWorks: [
    {
      id: "root",
      title: "how.root.title",
      body: "how.root.body",
      focus: { part: { kind: "event", id: "comment" }, path: ["tags", 0] },
    },
    {
      id: "parent",
      title: "how.parent.title",
      body: "how.parent.body",
      focus: { part: { kind: "event", id: "comment" }, path: ["tags", 3] },
    },
    {
      id: "kinds",
      title: "how.kinds.title",
      body: "how.kinds.body",
      focus: { part: { kind: "event", id: "comment" }, path: ["tags", 1] },
    },
    {
      id: "external",
      title: "how.external.title",
      body: "how.external.body",
    },
    {
      id: "plain",
      title: "how.plain.title",
      body: "how.plain.body",
      focus: { part: { kind: "event", id: "comment" }, path: ["content"] },
    },
  ],
  related: [
    { nip: "10", relation: "see-also", explain: "related.10" },
    { nip: "73", relation: "depends-on", explain: "related.73" },
    { nip: "23", relation: "used-by", explain: "related.23" },
    { nip: "21", relation: "see-also", explain: "related.21" },
  ],
  events: [
    {
      id: "comment",
      label: "event.comment.label",
      explain: "event.comment.explain",
      kinds: [1111],
      content: { format: "text", explain: "content", required: true, multiline: true },
      requireOneOf: [
        { tags: ["E", "A", "I"], explain: "rule.root" },
        { tags: ["e", "a", "i"], explain: "rule.parent" },
      ],
      tags: [
        ...scope(true),
        ...scope(false),
        {
          name: "q",
          explain: "tag.q",
          presence: "optional",
          repeatable: true,
          fields: [
            {
              name: "target",
              type: { type: "text", pattern: "[0-9a-f]{64}|\\d+:[0-9a-f]{64}:.*" },
              explain: "tag.q.target",
            },
            { name: "relay", type: { type: "relay-url" }, explain: "tag.relay", optional: true },
            { name: "pubkey", type: { type: "pubkey" }, explain: "tag.q.pubkey", optional: true },
          ],
        },
      ],
      examples: [
        {
          id: "on-article",
          label: "example.on-article",
          explain: "example.on-article.explain",
          signer: "carol",
          template: {
            kind: 1111,
            tags: [
              ["A", ARTICLE_ADDR, BETA],
              ["K", "30023"],
              ["P", FRANK, BETA],
              ["a", ARTICLE_ADDR, BETA],
              ["e", ARTICLE_ID, BETA],
              ["k", "30023"],
              ["p", FRANK, BETA],
            ],
            content:
              "Sending this to every photographer I know who still thinks one app owns their audience.",
          },
        },
        {
          id: "reply",
          label: "example.reply",
          explain: "example.reply.explain",
          signer: "frank",
          template: {
            kind: 1111,
            tags: [
              ["A", ARTICLE_ADDR, BETA],
              ["K", "30023"],
              ["P", FRANK, BETA],
              ["e", NIP22_FIRST_COMMENT_ID, GAMMA, CAROL],
              ["k", "1111"],
              ["p", CAROL, GAMMA],
            ],
            content: "Thank you Carol! Film photographers were exactly who I had in mind.",
          },
        },
        {
          id: "on-url",
          label: "example.on-url",
          explain: "example.on-url.explain",
          signer: "grace",
          template: {
            kind: 1111,
            tags: [
              ["I", "https://example.com/articles/open-protocols"],
              ["K", "web"],
              ["i", "https://example.com/articles/open-protocols"],
              ["k", "web"],
            ],
            content: "Nice article! Commenting from Nostr because the site has no comment box.",
          },
        },
      ],
    },
  ],
};
