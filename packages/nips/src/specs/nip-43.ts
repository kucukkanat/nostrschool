// Owner: spec author r3 (NIPs 40–59). NIP-43: Relay Access Metadata and Requests.
// Explanations: packages/i18n/src/locales/en/nips/r3.ts → n43.text.
import type { NipSpec, TagSpec } from "../spec.ts";

const BOB = "a73883912a48c3551c1548fd454876d577126a61c76b5486c807bfec5869e183";
const ERIN = "c71750007e42443e5ca8c1ea00babed4e8c78a9cb45dd6db3733d918e0b55deb";
const GRACE = "5f69e52aeb38975e54cb99428da837124166abb4198c1128c54491be73d23812";

/** NIP-70 "-" tag: only the author may publish this event. Every NIP-43 event carries it. */
const PROTECTED: TagSpec = {
  name: "-",
  explain: "tag.protected",
  presence: "required",
  repeatable: false,
  fields: [],
};

const memberP: TagSpec = {
  name: "p",
  explain: "tag.p",
  presence: "required",
  repeatable: false,
  fields: [{ name: "pubkey", type: { type: "pubkey" }, explain: "tag.p.pubkey" }],
};

const claim: TagSpec = {
  name: "claim",
  explain: "tag.claim",
  presence: "required",
  repeatable: false,
  fields: [
    {
      name: "invite-code",
      type: { type: "text", minLength: 1 },
      explain: "tag.claim.code",
      placeholder: "delta-7f3k-29qa",
    },
  ],
};

export const nip43: NipSpec = {
  nip: "43",
  variant: "event",
  events: [
    {
      id: "membership-list",
      label: "members.label",
      explain: "members.explain",
      kinds: [13534],
      content: { format: "empty", explain: "content.empty" },
      tags: [
        PROTECTED,
        {
          name: "member",
          explain: "tag.member",
          presence: "recommended",
          repeatable: true,
          fields: [{ name: "pubkey", type: { type: "pubkey" }, explain: "tag.member.pubkey" }],
          rest: { name: "role", type: { type: "text", minLength: 1 }, explain: "tag.member.role" },
        },
      ],
      examples: [
        {
          id: "delta-members",
          label: "example.members",
          explain: "example.members.explain",
          signer: "dave",
          template: {
            kind: 13534,
            tags: [["-"], ["member", BOB], ["member", ERIN, "28b7e50f"]],
            content: "",
          },
        },
      ],
    },
    {
      id: "role",
      label: "role.label",
      explain: "role.explain",
      kinds: [33534],
      content: { format: "empty", explain: "content.empty" },
      tags: [
        PROTECTED,
        {
          name: "d",
          explain: "tag.d",
          presence: "required",
          repeatable: false,
          fields: [
            { name: "role-id", type: { type: "text", minLength: 1 }, explain: "tag.d.value" },
          ],
        },
        {
          name: "label",
          explain: "tag.label",
          presence: "optional",
          repeatable: false,
          fields: [{ name: "label", type: { type: "text" }, explain: "tag.label.value" }],
        },
        {
          name: "description",
          explain: "tag.description",
          presence: "optional",
          repeatable: false,
          fields: [
            {
              name: "text",
              type: { type: "text", multiline: true },
              explain: "tag.description.value",
            },
          ],
        },
        {
          name: "color",
          explain: "tag.color",
          presence: "optional",
          repeatable: false,
          fields: [
            {
              name: "hue",
              type: { type: "number", integer: true, min: 0, max: 360 },
              explain: "tag.color.hue",
            },
          ],
        },
        {
          name: "order",
          explain: "tag.order",
          presence: "optional",
          repeatable: false,
          fields: [
            { name: "order", type: { type: "number", integer: true }, explain: "tag.order.value" },
          ],
        },
      ],
      examples: [
        {
          id: "moderator",
          label: "example.role",
          explain: "example.role.explain",
          signer: "dave",
          template: {
            kind: 33534,
            tags: [
              ["-"],
              ["d", "28b7e50f"],
              ["label", "moderator"],
              ["description", "Can remove spam from relay.delta.example"],
              ["color", "200"],
              ["order", "1"],
            ],
            content: "",
          },
        },
      ],
    },
    {
      id: "add-user",
      label: "add.label",
      explain: "add.explain",
      kinds: [8000],
      content: { format: "empty", explain: "content.empty" },
      tags: [PROTECTED, memberP],
      examples: [
        {
          id: "add-grace",
          label: "example.add",
          signer: "dave",
          template: { kind: 8000, tags: [["-"], ["p", GRACE]], content: "" },
        },
      ],
    },
    {
      id: "remove-user",
      label: "remove.label",
      explain: "remove.explain",
      kinds: [8001],
      content: { format: "empty", explain: "content.empty" },
      tags: [PROTECTED, memberP],
      examples: [
        {
          id: "remove-bob",
          label: "example.remove",
          signer: "dave",
          template: { kind: 8001, tags: [["-"], ["p", BOB]], content: "" },
        },
      ],
    },
    {
      id: "join-request",
      label: "join.label",
      explain: "join.explain",
      kinds: [28934],
      content: { format: "empty", explain: "content.empty" },
      tags: [PROTECTED, claim],
      examples: [
        {
          id: "grace-joins",
          label: "example.join",
          explain: "example.join.explain",
          signer: "grace",
          template: { kind: 28934, tags: [["-"], ["claim", "delta-7f3k-29qa"]], content: "" },
        },
      ],
    },
    // The pinned NIP-43 text only names kind 28935 ("clients MUST only request kind 28935 events
    // from" supporting relays) and no longer defines its shape; this claim-carrying structure is
    // inferred from earlier revisions, and invite.explain says so.
    {
      id: "invite",
      label: "invite.label",
      explain: "invite.explain",
      kinds: [28935],
      content: { format: "empty", explain: "content.empty" },
      tags: [PROTECTED, claim],
      examples: [
        {
          id: "fresh-invite",
          label: "example.invite",
          signer: "dave",
          template: { kind: 28935, tags: [["-"], ["claim", "delta-7f3k-29qa"]], content: "" },
        },
      ],
    },
    {
      id: "leave-request",
      label: "leave.label",
      explain: "leave.explain",
      kinds: [28936],
      content: { format: "empty", explain: "content.empty" },
      tags: [PROTECTED],
      examples: [
        {
          id: "bob-leaves",
          label: "example.leave",
          signer: "bob",
          template: { kind: 28936, tags: [["-"]], content: "" },
        },
      ],
    },
  ],
  flows: [
    {
      id: "join",
      label: "flow.join.label",
      explain: "flow.join.explain",
      steps: [
        { part: { kind: "event", id: "invite" }, explain: "flow.join.invite" },
        { part: { kind: "event", id: "join-request" }, explain: "flow.join.request" },
        { part: { kind: "event", id: "add-user" }, explain: "flow.join.add" },
        { part: { kind: "event", id: "membership-list" }, explain: "flow.join.list" },
      ],
    },
  ],
  howItWorks: [
    {
      id: "self",
      title: "how.self.title",
      body: "how.self.body",
    },
    {
      id: "list",
      title: "how.list.title",
      body: "how.list.body",
      focus: { part: { kind: "event", id: "membership-list" }, path: ["tags", 1] },
    },
    {
      id: "both-sides",
      title: "how.both.title",
      body: "how.both.body",
      focus: { part: { kind: "event", id: "membership-list" } },
    },
    {
      id: "claim",
      title: "how.claim.title",
      body: "how.claim.body",
      focus: { part: { kind: "event", id: "join-request" }, path: ["tags", 1] },
    },
    {
      id: "answer",
      title: "how.answer.title",
      body: "how.answer.body",
      focus: { part: { kind: "event", id: "add-user" } },
    },
    {
      id: "leave",
      title: "how.leave.title",
      body: "how.leave.body",
      focus: { part: { kind: "event", id: "leave-request" } },
    },
  ],
  related: [
    { nip: "11", relation: "depends-on", explain: "related.11" },
    { nip: "70", relation: "depends-on", explain: "related.70" },
    { nip: "42", relation: "see-also", explain: "related.42" },
    { nip: "86", relation: "see-also", explain: "related.86" },
  ],
};
