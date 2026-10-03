// Owner: spec author r1 (NIPs 01–19). NIP-02: Follow List.
// Explanations: packages/i18n/src/locales/en/nips/r1.ts → n02.text.
import type { NipSpec } from "../spec.ts";

const ALICE = "e550c6e92808f358382b7b8c14345344f5ef9a299529834d1c26d57b6ace44cc";
const BOB = "a73883912a48c3551c1548fd454876d577126a61c76b5486c807bfec5869e183";
const CAROL = "9445888d3235f73f8b627df1fb1d498f2eb3fa76337679c1176965a73d3b68b4";
const DAVE = "1c028b39e7f3228444b3261e4b718efa92a91470086b44c9a72ef5357e970148";
const ERIN = "c71750007e42443e5ca8c1ea00babed4e8c78a9cb45dd6db3733d918e0b55deb";
const FRANK = "922e43b50aec16ad1e9d1ec6854c058816d28b944ae2fe9bdce3d9241bfaafb8";

export const nip02: NipSpec = {
  nip: "02",
  variant: "event",
  howItWorks: [
    {
      id: "list",
      title: "how.list.title",
      body: "how.list.body",
      focus: { part: { kind: "event", id: "follow-list" }, path: ["tags"] },
    },
    {
      id: "replace",
      title: "how.replace.title",
      body: "how.replace.body",
      focus: { part: { kind: "event", id: "follow-list" }, path: ["kind"] },
    },
    {
      id: "relays",
      title: "how.relays.title",
      body: "how.relays.body",
      focus: { part: { kind: "event", id: "follow-list" }, path: ["tags", 0, 2] },
    },
    {
      id: "petnames",
      title: "how.petnames.title",
      body: "how.petnames.body",
      focus: { part: { kind: "event", id: "follow-list" }, path: ["tags", 0, 3] },
    },
  ],
  related: [
    { nip: "01", relation: "depends-on", explain: "related.01" },
    { nip: "51", relation: "see-also", explain: "related.51" },
    { nip: "65", relation: "see-also", explain: "related.65" },
  ],
  events: [
    {
      id: "follow-list",
      label: "event.label",
      explain: "event.explain",
      kinds: [3],
      content: { format: "empty", explain: "event.content" },
      tags: [
        {
          name: "p",
          explain: "tag.p",
          presence: "recommended",
          repeatable: true,
          fields: [
            { name: "pubkey", type: { type: "pubkey" }, explain: "tag.p.pubkey" },
            { name: "relay", type: { type: "relay-url" }, explain: "tag.p.relay", optional: true },
            {
              name: "petname",
              type: { type: "text", pattern: "[A-Za-z0-9_]*" },
              explain: "tag.p.petname",
              optional: true,
            },
          ],
          template: ["p", "", "", ""],
        },
      ],
      examples: [
        {
          id: "alice",
          label: "example.alice.label",
          explain: "example.alice.explain",
          signer: "alice",
          template: {
            kind: 3,
            created_at: 1733961600,
            tags: [
              ["p", BOB, "wss://relay.beta.example", "bob"],
              ["p", CAROL, "wss://relay.gamma.example", "carol"],
              ["p", DAVE, "wss://relay.delta.example", "dave"],
              ["p", ERIN, "wss://relay.alpha.example", "erin"],
              ["p", FRANK, "wss://relay.beta.example", "frank"],
            ],
            content: "",
          },
        },
        {
          id: "minimal",
          label: "example.minimal.label",
          explain: "example.minimal.explain",
          signer: "grace",
          template: {
            kind: 3,
            created_at: 1735430400,
            tags: [
              ["p", ALICE, "", "alice"],
              ["p", ERIN],
            ],
            content: "",
          },
        },
      ],
    },
  ],
};
