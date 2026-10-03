// Owner: spec author r3 (NIPs 40–59). NIP-58: Badges.
// Explanations: packages/i18n/src/locales/en/nips/r3.ts → n58.text.
import type { NipSpec, TagSpec } from "../spec.ts";

const ALICE = "e550c6e92808f358382b7b8c14345344f5ef9a299529834d1c26d57b6ace44cc";
const BOB = "a73883912a48c3551c1548fd454876d577126a61c76b5486c807bfec5869e183";
const GRACE = "5f69e52aeb38975e54cb99428da837124166abb4198c1128c54491be73d23812";
const BADGE = `30009:${ALICE}:first-relay`;
/** Id of the award example below as Alice signs it at FIXTURE_NOW. */
const AWARD_ID = "8e5488065e0afe78e10699882648145aaf07a22d7346be22f709ae576275f6ce";

const DIMENSIONS = { type: "text", pattern: "\\d+x\\d+" } as const;

const badgeRef = (kinds: readonly number[], explain: string): TagSpec => ({
  name: "a",
  explain: "list.tag.a",
  presence: "optional",
  repeatable: true,
  fields: [{ name: "badge", type: { type: "addr", kinds }, explain }],
});

const awardRefs: readonly TagSpec[] = [
  {
    name: "e",
    explain: "list.tag.e",
    presence: "optional",
    repeatable: true,
    fields: [
      { name: "award-id", type: { type: "event-id" }, explain: "field.award" },
      { name: "relay", type: { type: "relay-url" }, explain: "field.relay", optional: true },
    ],
  },
];

export const nip58: NipSpec = {
  nip: "58",
  variant: "event",
  events: [
    {
      id: "definition",
      label: "definition.label",
      explain: "definition.explain",
      kinds: [30009],
      content: { format: "empty", explain: "content.empty" },
      tags: [
        {
          name: "d",
          explain: "definition.tag.d",
          presence: "required",
          repeatable: false,
          fields: [
            {
              name: "badge-id",
              type: { type: "text", minLength: 1 },
              explain: "definition.field.d",
            },
          ],
        },
        {
          name: "name",
          explain: "definition.tag.name",
          presence: "optional",
          repeatable: false,
          fields: [{ name: "name", type: { type: "text" }, explain: "definition.field.name" }],
        },
        {
          name: "description",
          explain: "definition.tag.description",
          presence: "optional",
          repeatable: false,
          fields: [
            {
              name: "text",
              type: { type: "text", multiline: true },
              explain: "definition.field.description",
            },
          ],
        },
        {
          name: "image",
          explain: "definition.tag.image",
          presence: "optional",
          repeatable: false,
          fields: [
            { name: "url", type: { type: "url" }, explain: "definition.field.image" },
            { name: "dimensions", type: DIMENSIONS, explain: "field.dimensions", optional: true },
          ],
        },
        {
          name: "thumb",
          explain: "definition.tag.thumb",
          presence: "optional",
          repeatable: true,
          fields: [
            { name: "url", type: { type: "url" }, explain: "definition.field.thumb" },
            { name: "dimensions", type: DIMENSIONS, explain: "field.dimensions", optional: true },
          ],
        },
      ],
      examples: [
        {
          id: "first-relay",
          label: "example.definition",
          explain: "example.definition.explain",
          signer: "alice",
          template: {
            kind: 30009,
            tags: [
              ["d", "first-relay"],
              ["name", "First relay"],
              ["description", "Ran your own relay for the first time"],
              ["image", "https://badges.alpha.example/first-relay.png", "1024x1024"],
              ["thumb", "https://badges.alpha.example/first-relay_256.png", "256x256"],
              ["thumb", "https://badges.alpha.example/first-relay_64.png", "64x64"],
            ],
            content: "",
          },
        },
      ],
    },
    {
      id: "award",
      label: "award.label",
      explain: "award.explain",
      kinds: [8],
      content: { format: "empty", explain: "content.empty" },
      tags: [
        {
          name: "a",
          explain: "award.tag.a",
          presence: "required",
          repeatable: false,
          fields: [
            { name: "badge", type: { type: "addr", kinds: [30009] }, explain: "field.badge" },
          ],
        },
        {
          name: "p",
          explain: "award.tag.p",
          presence: "required",
          repeatable: true,
          fields: [
            { name: "pubkey", type: { type: "pubkey" }, explain: "award.field.p" },
            { name: "relay", type: { type: "relay-url" }, explain: "field.relay", optional: true },
          ],
        },
      ],
      examples: [
        {
          id: "bob-and-grace",
          label: "example.award",
          explain: "example.award.explain",
          signer: "alice",
          template: {
            kind: 8,
            tags: [
              ["a", BADGE],
              ["p", BOB, "wss://relay.beta.example"],
              ["p", GRACE, "wss://relay.alpha.example"],
            ],
            content: "",
          },
        },
      ],
    },
    {
      id: "profile-badges",
      label: "profile.label",
      explain: "profile.explain",
      kinds: [10008],
      content: { format: "empty", explain: "content.empty" },
      tags: [badgeRef([30009, 30008], "field.badge-or-set"), ...awardRefs],
      examples: [
        {
          id: "bob-shows",
          label: "example.profile",
          explain: "example.profile.explain",
          signer: "bob",
          template: {
            kind: 10008,
            tags: [
              ["a", BADGE],
              ["e", AWARD_ID, "wss://relay.alpha.example"],
            ],
            content: "",
          },
        },
      ],
    },
    {
      id: "badge-set",
      label: "set.label",
      explain: "set.explain",
      kinds: [30008],
      content: { format: "empty", explain: "content.empty" },
      tags: [
        {
          name: "d",
          explain: "set.tag.d",
          presence: "required",
          repeatable: false,
          fields: [
            { name: "identifier", type: { type: "text", minLength: 1 }, explain: "set.field.d" },
          ],
        },
        {
          name: "title",
          explain: "set.tag.title",
          presence: "optional",
          repeatable: false,
          fields: [{ name: "title", type: { type: "text" }, explain: "set.field.title" }],
        },
        badgeRef([30009], "field.badge"),
        ...awardRefs,
      ],
      examples: [
        {
          id: "community",
          label: "example.set",
          signer: "bob",
          template: {
            kind: 30008,
            tags: [
              ["d", "community"],
              ["title", "Community badges"],
              ["a", BADGE],
              ["e", AWARD_ID, "wss://relay.alpha.example"],
            ],
            content: "",
          },
        },
      ],
    },
    {
      id: "legacy-profile-badges",
      label: "legacy.label",
      explain: "legacy.explain",
      kinds: [30008],
      content: { format: "empty", explain: "content.empty" },
      tags: [
        {
          name: "d",
          explain: "set.tag.d-legacy",
          presence: "required",
          repeatable: false,
          deprecated: true,
          fields: [
            {
              name: "identifier",
              type: { type: "enum", values: [{ value: "profile_badges" }] },
              explain: "set.field.d-legacy",
            },
          ],
        },
        badgeRef([30009], "field.badge"),
        ...awardRefs,
      ],
      examples: [
        {
          id: "legacy",
          label: "example.legacy",
          explain: "example.legacy.explain",
          signer: "bob",
          template: {
            kind: 30008,
            tags: [
              ["d", "profile_badges"],
              ["a", BADGE],
              ["e", AWARD_ID],
            ],
            content: "",
          },
        },
      ],
    },
  ],
  flows: [
    {
      id: "badge",
      label: "flow.badge.label",
      explain: "flow.badge.explain",
      steps: [
        { part: { kind: "event", id: "definition" }, explain: "flow.badge.define" },
        { part: { kind: "event", id: "award" }, explain: "flow.badge.award" },
        { part: { kind: "event", id: "profile-badges" }, explain: "flow.badge.accept" },
      ],
    },
  ],
  howItWorks: [
    {
      id: "define",
      title: "how.define.title",
      body: "how.define.body",
      focus: { part: { kind: "event", id: "definition" }, path: ["tags", 0] },
    },
    {
      id: "award",
      title: "how.award.title",
      body: "how.award.body",
      focus: { part: { kind: "event", id: "award" }, path: ["tags", 1] },
    },
    {
      id: "accept",
      title: "how.accept.title",
      body: "how.accept.body",
      focus: { part: { kind: "event", id: "profile-badges" }, path: ["tags"] },
    },
    {
      id: "sets",
      title: "how.sets.title",
      body: "how.sets.body",
      focus: { part: { kind: "event", id: "badge-set" } },
    },
    {
      id: "display",
      title: "how.display.title",
      body: "how.display.body",
    },
  ],
  related: [
    { nip: "51", relation: "depends-on", explain: "related.51" },
    { nip: "01", relation: "depends-on", explain: "related.01" },
  ],
};
