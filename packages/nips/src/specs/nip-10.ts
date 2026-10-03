// Owner: spec author r1 (NIPs 01–19). NIP-10: Text Notes and Threads.
// Explanations: packages/i18n/src/locales/en/nips/r1.ts → n10.text.
import type { NipSpec, TagFieldSpec } from "../spec.ts";

const ALICE = "e550c6e92808f358382b7b8c14345344f5ef9a299529834d1c26d57b6ace44cc";
const BOB = "a73883912a48c3551c1548fd454876d577126a61c76b5486c807bfec5869e183";
const ERIN = "c71750007e42443e5ca8c1ea00babed4e8c78a9cb45dd6db3733d918e0b55deb";
const GRACE = "5f69e52aeb38975e54cb99428da837124166abb4198c1128c54491be73d23812";

const EVENT_ID: TagFieldSpec = {
  name: "event-id",
  type: { type: "event-id" },
  explain: "tag.e.id",
};
const RELAY: TagFieldSpec = {
  name: "relay",
  type: { type: "relay-url" },
  explain: "tag.relay",
  optional: true,
};
const AUTHOR: TagFieldSpec = {
  name: "pubkey",
  type: { type: "pubkey" },
  explain: "tag.e.pubkey",
  optional: true,
};

export const nip10: NipSpec = {
  nip: "10",
  variant: "event",
  howItWorks: [
    {
      id: "note",
      title: "how.note.title",
      body: "how.note.body",
      focus: { part: { kind: "event", id: "text-note" }, path: ["content"] },
    },
    {
      id: "root",
      title: "how.root.title",
      body: "how.root.body",
      focus: { part: { kind: "event", id: "text-note" }, path: ["tags", 0, 3] },
    },
    {
      id: "reply",
      title: "how.reply.title",
      body: "how.reply.body",
      focus: { part: { kind: "event", id: "text-note" }, path: ["tags", 1, 3] },
    },
    {
      id: "notify",
      title: "how.notify.title",
      body: "how.notify.body",
      focus: { part: { kind: "event", id: "text-note" }, path: ["tags", 2] },
    },
    { id: "quote", title: "how.quote.title", body: "how.quote.body" },
    { id: "positional", title: "how.positional.title", body: "how.positional.body" },
  ],
  related: [
    { nip: "01", relation: "depends-on", explain: "related.01" },
    { nip: "21", relation: "see-also", explain: "related.21" },
    { nip: "22", relation: "see-also", explain: "related.22" },
    { nip: "18", relation: "see-also", explain: "related.18" },
  ],
  events: [
    {
      id: "text-note",
      label: "event.label",
      explain: "event.explain",
      kinds: [1],
      content: { format: "text", explain: "event.content", required: true, multiline: true },
      tags: [
        {
          id: "e-root",
          name: "e",
          explain: "tag.e-root",
          presence: "optional",
          repeatable: false,
          when: { index: 3, equals: "root" },
          fields: [
            EVENT_ID,
            RELAY,
            {
              name: "marker",
              type: { type: "enum", values: [{ value: "root", explain: "marker.root" }] },
              explain: "tag.e.marker",
            },
            AUTHOR,
          ],
          template: ["e", "", "", "root", ""],
        },
        {
          id: "e-reply",
          name: "e",
          explain: "tag.e-reply",
          presence: "optional",
          repeatable: false,
          when: { index: 3, equals: "reply" },
          fields: [
            EVENT_ID,
            RELAY,
            {
              name: "marker",
              type: { type: "enum", values: [{ value: "reply", explain: "marker.reply" }] },
              explain: "tag.e.marker",
            },
            AUTHOR,
          ],
          template: ["e", "", "", "reply", ""],
        },
        {
          id: "e-positional",
          name: "e",
          explain: "tag.e-positional",
          presence: "optional",
          repeatable: true,
          deprecated: true,
          fields: [EVENT_ID, RELAY],
        },
        {
          name: "p",
          explain: "tag.p",
          presence: "recommended",
          repeatable: true,
          fields: [{ name: "pubkey", type: { type: "pubkey" }, explain: "tag.p.pubkey" }, RELAY],
        },
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
            RELAY,
            { name: "pubkey", type: { type: "pubkey" }, explain: "tag.q.pubkey", optional: true },
          ],
        },
      ],
      examples: [
        {
          id: "nested-reply",
          label: "example.nested-reply.label",
          explain: "example.nested-reply.explain",
          signer: "alice",
          template: {
            kind: 1,
            created_at: 1735670400,
            tags: [
              [
                "e",
                "91a74c40d508831576cca43d0d0c58793bb60df736783b40ddfbc68deed5ab06",
                "wss://relay.alpha.example",
                "root",
                ALICE,
              ],
              [
                "e",
                "d7f62aebaf95214e4260a13d058a660655ff76dacff54dcc0481d091e2103479",
                "wss://relay.beta.example",
                "reply",
                BOB,
              ],
              ["p", BOB, "wss://relay.beta.example"],
            ],
            content:
              "Exactly, Bob! Publish to a few relays and no single server can make you disappear.",
          },
        },
        {
          id: "direct-reply",
          label: "example.direct-reply.label",
          explain: "example.direct-reply.explain",
          signer: "alice",
          template: {
            kind: 1,
            created_at: 1735681500,
            tags: [
              [
                "e",
                "6f47e4a1cf4f3150c04a95555549f9f6b3039baf67788587c64e62a8c2edc3c3",
                "wss://relay.gamma.example",
                "root",
                GRACE,
              ],
              ["p", GRACE, "wss://relay.gamma.example"],
              ["p", ERIN, "wss://relay.alpha.example"],
              ["p", BOB, "wss://relay.beta.example"],
            ],
            content:
              "Welcome Grace! Try following nostr:npub1cut4qqr7gfzruh9gc84qpw476n5v0z5uk3wadkehx0v33c94th4sp5w043 for art and nostr:npub15uug8yf2frp428q4fr752jrk64m3y6npca44fpkgq7l7ckrfuxpsj5l3x6 for good questions.",
          },
        },
        {
          id: "root",
          label: "example.root.label",
          explain: "example.root.explain",
          signer: "grace",
          template: {
            kind: 1,
            created_at: 1735680600,
            tags: [
              ["t", "introductions"],
              ["t", "newhere"],
            ],
            content:
              "Hello world! My first note ever. Who should I follow? #introductions #newhere",
          },
        },
      ],
    },
  ],
};
