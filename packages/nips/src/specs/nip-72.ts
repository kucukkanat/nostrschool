// Owner: spec author r4 (NIPs 60–79). NIP-72: Moderated Communities (Reddit style).
// UNRECOMMENDED upstream ("try NIP-29 instead"): the first how-it-works step and `related` say so.
// Story: carol owns a film-photography community with alice as moderator; bob posts, alice approves.
import type { FieldType, NipSpec, TagSpec } from "../spec.ts";

const CAROL = "9445888d3235f73f8b627df1fb1d498f2eb3fa76337679c1176965a73d3b68b4";
const ALICE = "e550c6e92808f358382b7b8c14345344f5ef9a299529834d1c26d57b6ace44cc";
const BOB = "a73883912a48c3551c1548fd454876d577126a61c76b5486c807bfec5869e183";
const COMMUNITY = `34550:${CAROL}:film-photography`;
const GAMMA = "wss://relay.gamma.example";

/** Bob's top-level post, signed with his fixture key: approvals embed it verbatim. */
export const NIP72_BOB_POST = {
  kind: 1111,
  created_at: 1735686000,
  tags: [
    ["A", COMMUNITY, GAMMA],
    ["a", COMMUNITY, GAMMA],
    ["P", CAROL],
    ["p", CAROL],
    ["K", "34550"],
    ["k", "34550"],
  ],
  content: "First roll through my grandfather's Pentax. Any tips for scanning negatives at home?",
  pubkey: BOB,
  id: "54352443986b77a3a894204b3a09b30a491a3571b8ac54c7eb3e07db8688b418",
  sig: "707537102512bd5af7a801c7b1e06e851750fe322927413d62935b9aacbfed8172493d6f4ad66c4dc31c70e0401c28990d0e592122b447fffdc88163b9a9362f",
} as const;

const relayHint = (explain: string) =>
  ({ name: "relay", type: { type: "relay-url" }, explain, optional: true }) as const;
const communityAddr: FieldType = { type: "addr", kinds: [34550] };

const pointer = (
  name: string,
  type: FieldType,
  presence: TagSpec["presence"],
  repeatable = false,
): TagSpec => ({
  name,
  explain: `post.tag.${name}`,
  presence,
  repeatable,
  fields: [{ name: "value", type, explain: `post.tag.${name}.value` }, relayHint("relay-hint")],
});

export const nip72: NipSpec = {
  nip: "72",
  variant: "event",
  howItWorks: [
    { id: "unrecommended", title: "how.unrecommended.title", body: "how.unrecommended.body" },
    {
      id: "define",
      title: "how.define.title",
      body: "how.define.body",
      focus: { part: { kind: "event", id: "community" }, path: ["tags", 4] },
    },
    {
      id: "post",
      title: "how.post.title",
      body: "how.post.body",
      focus: { part: { kind: "event", id: "post" }, path: ["tags", 0] },
    },
    {
      id: "approve",
      title: "how.approve.title",
      body: "how.approve.body",
      focus: { part: { kind: "event", id: "approval" }, path: ["content"] },
    },
    { id: "display", title: "how.display.title", body: "how.display.body" },
    {
      id: "legacy",
      title: "how.legacy.title",
      body: "how.legacy.body",
      focus: { part: { kind: "event", id: "legacy-post" }, path: ["tags", 0] },
    },
  ],
  related: [
    { nip: "29", relation: "replaced-by", explain: "related.29" },
    { nip: "22", relation: "depends-on", explain: "related.22" },
    { nip: "09", relation: "see-also", explain: "related.09" },
    { nip: "18", relation: "see-also", explain: "related.18" },
  ],
  flows: [
    {
      id: "moderation",
      label: "flow.label",
      explain: "flow.explain",
      steps: [
        { part: { kind: "event", id: "community" }, explain: "flow.community" },
        { part: { kind: "event", id: "post" }, explain: "flow.post" },
        { part: { kind: "event", id: "approval" }, explain: "flow.approval" },
      ],
    },
  ],
  events: [
    {
      id: "community",
      label: "community.label",
      explain: "community.explain",
      kinds: [34550],
      content: { format: "text", explain: "community.content" },
      tags: [
        {
          name: "d",
          explain: "community.tag.d",
          presence: "required",
          repeatable: false,
          fields: [
            {
              name: "identifier",
              type: { type: "text", minLength: 1 },
              explain: "community.tag.d.id",
            },
          ],
        },
        {
          name: "name",
          explain: "community.tag.name",
          presence: "recommended",
          repeatable: false,
          fields: [{ name: "name", type: { type: "text" }, explain: "community.tag.name.text" }],
        },
        {
          name: "description",
          explain: "community.tag.description",
          presence: "optional",
          repeatable: false,
          fields: [
            {
              name: "text",
              type: { type: "text", multiline: true },
              explain: "community.tag.description.text",
            },
          ],
        },
        {
          name: "image",
          explain: "community.tag.image",
          presence: "optional",
          repeatable: false,
          fields: [
            { name: "url", type: { type: "url" }, explain: "community.tag.image.url" },
            {
              name: "dimensions",
              type: { type: "text", pattern: "\\d+x\\d+" },
              explain: "community.tag.image.dim",
              optional: true,
            },
          ],
        },
        {
          name: "p",
          explain: "community.tag.p",
          presence: "recommended",
          repeatable: true,
          fields: [
            { name: "pubkey", type: { type: "pubkey" }, explain: "community.tag.p.pubkey" },
            { name: "relay", type: { type: "text" }, explain: "relay-hint", placeholder: "" },
            {
              name: "role",
              type: { type: "enum", open: true, values: [{ value: "moderator" }] },
              explain: "community.tag.p.role",
            },
          ],
          template: ["p", "", "", "moderator"],
        },
        {
          name: "relay",
          explain: "community.tag.relay",
          presence: "optional",
          repeatable: true,
          fields: [
            { name: "url", type: { type: "relay-url" }, explain: "community.tag.relay.url" },
            {
              name: "marker",
              type: {
                type: "enum",
                values: [
                  { value: "author", explain: "community.marker.author" },
                  { value: "requests", explain: "community.marker.requests" },
                  { value: "approvals", explain: "community.marker.approvals" },
                ],
              },
              explain: "community.tag.relay.marker",
              optional: true,
            },
          ],
        },
      ],
      examples: [
        {
          id: "film",
          label: "community.example.label",
          explain: "community.example.explain",
          signer: "carol",
          template: {
            kind: 34550,
            tags: [
              ["d", "film-photography"],
              ["name", "Film Photography"],
              ["description", "Analogue cameras, developing at home, scanning tips. Be kind."],
              ["image", "https://media.gamma.example/film-community.jpg", "1200x630"],
              ["p", ALICE, "wss://relay.alpha.example", "moderator"],
              ["p", CAROL, GAMMA, "moderator"],
              ["relay", "wss://relay.alpha.example", "author"],
              ["relay", GAMMA, "requests"],
              ["relay", GAMMA, "approvals"],
            ],
            content: "",
          },
        },
      ],
    },
    {
      id: "post",
      label: "post.label",
      explain: "post.explain",
      kinds: [1111],
      content: { format: "text", explain: "post.content", required: true, multiline: true },
      tags: [
        pointer("A", communityAddr, "required"),
        pointer("a", { type: "addr" }, "optional"),
        pointer("e", { type: "event-id" }, "optional"),
        pointer("P", { type: "pubkey" }, "recommended"),
        pointer("p", { type: "pubkey" }, "recommended"),
        {
          name: "K",
          explain: "post.tag.K",
          presence: "recommended",
          repeatable: false,
          fields: [
            { name: "kind", type: { type: "kind", kinds: [34550] }, explain: "post.tag.K.value" },
          ],
        },
        {
          name: "k",
          explain: "post.tag.k",
          presence: "recommended",
          repeatable: false,
          fields: [{ name: "kind", type: { type: "kind" }, explain: "post.tag.k.value" }],
        },
      ],
      examples: [
        {
          id: "top-level",
          label: "post.example.top.label",
          explain: "post.example.top.explain",
          signer: "bob",
          template: {
            kind: 1111,
            tags: NIP72_BOB_POST.tags,
            content: NIP72_BOB_POST.content,
          },
        },
        {
          id: "reply",
          label: "post.example.reply.label",
          explain: "post.example.reply.explain",
          signer: "carol",
          template: {
            kind: 1111,
            tags: [
              ["A", COMMUNITY, GAMMA],
              ["P", CAROL],
              ["K", "34550"],
              ["e", NIP72_BOB_POST.id, GAMMA],
              ["p", BOB],
              ["k", "1111"],
            ],
            content: "Scan with a macro lens and a light pad, then invert in software. Welcome!",
          },
        },
      ],
    },
    {
      // NIP-72 backwards compatibility: before NIP-22, community posts were kind 1 notes that
      // carried only a lowercase `a` tag. Kept as its own shape so those posts validate, and
      // marked deprecated so the editor says new posts should be kind 1111 ("post").
      id: "legacy-post",
      label: "legacy.label",
      explain: "legacy.explain",
      deprecated: { explain: "legacy.deprecated", replacedBy: "post" },
      kinds: [1],
      content: { format: "text", explain: "post.content", required: true, multiline: true },
      tags: [
        {
          name: "a",
          explain: "legacy.tag.a",
          presence: "required",
          repeatable: false,
          fields: [
            { name: "community", type: communityAddr, explain: "post.tag.A.value" },
            relayHint("relay-hint"),
          ],
        },
      ],
      examples: [
        {
          id: "legacy-top-level",
          label: "legacy.example.label",
          explain: "legacy.example.explain",
          signer: "bob",
          template: {
            kind: 1,
            tags: [["a", COMMUNITY, GAMMA]],
            content: "Old-style post: anyone else still shooting Portra 400?",
          },
        },
      ],
    },
    {
      id: "approval",
      label: "approval.label",
      explain: "approval.explain",
      kinds: [4550],
      content: {
        format: "text",
        explain: "approval.content",
        field: { type: "event-json", kinds: [1111, 1, 6, 16] },
      },
      tags: [
        {
          name: "a",
          explain: "approval.tag.a",
          presence: "required",
          repeatable: true,
          fields: [
            { name: "address", type: { type: "addr" }, explain: "approval.tag.a.address" },
            relayHint("relay-hint"),
          ],
        },
        {
          name: "e",
          explain: "approval.tag.e",
          presence: "recommended",
          repeatable: false,
          fields: [
            { name: "post-id", type: { type: "event-id" }, explain: "approval.tag.e.id" },
            relayHint("relay-hint"),
          ],
        },
        {
          name: "p",
          explain: "approval.tag.p",
          presence: "required",
          repeatable: false,
          fields: [
            { name: "post-author", type: { type: "pubkey" }, explain: "approval.tag.p.pubkey" },
            relayHint("relay-hint"),
          ],
        },
        {
          name: "k",
          explain: "approval.tag.k",
          presence: "recommended",
          repeatable: false,
          fields: [{ name: "kind", type: { type: "kind" }, explain: "approval.tag.k.kind" }],
        },
      ],
      examples: [
        {
          id: "alice-approves",
          label: "approval.example.label",
          explain: "approval.example.explain",
          template: {
            kind: 4550,
            tags: [
              ["a", COMMUNITY, GAMMA],
              ["e", NIP72_BOB_POST.id, GAMMA],
              ["p", BOB, "wss://relay.beta.example"],
              ["k", "1111"],
            ],
            content: JSON.stringify(NIP72_BOB_POST),
          },
        },
      ],
    },
  ],
};
