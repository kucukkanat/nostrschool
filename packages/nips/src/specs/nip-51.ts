// Owner: spec author r3 (NIPs 40–59). NIP-51: Lists.
// Explanations: packages/i18n/src/locales/en/nips/r3.ts → n51.text.
//
// Lists that other NIPs own are specced there: follow list 3 (NIP-02), relay list 10002 (NIP-65),
// DM relays 10050 (NIP-17), profile badges 10008 / badge sets 30008 (NIP-58), calendar 31924 (NIP-52).
// Encrypted examples are real NIP-44 payloads from Alice's demo key to herself.
import type { NipSpec, TagSpec } from "../spec.ts";

const ALICE = "e550c6e92808f358382b7b8c14345344f5ef9a299529834d1c26d57b6ace44cc";
const BOB = "a73883912a48c3551c1548fd454876d577126a61c76b5486c807bfec5869e183";
const CAROL = "9445888d3235f73f8b627df1fb1d498f2eb3fa76337679c1176965a73d3b68b4";
const DAVE = "1c028b39e7f3228444b3261e4b718efa92a91470086b44c9a72ef5357e970148";
const ERIN = "c71750007e42443e5ca8c1ea00babed4e8c78a9cb45dd6db3733d918e0b55deb";
const FRANK = "922e43b50aec16ad1e9d1ec6854c058816d28b944ae2fe9bdce3d9241bfaafb8";

/** nip44(alice → alice, [["word","spoiler"],["t","politics"]]) */
const PRIVATE_MUTES =
  "AgRX0OXaNZHLQzaEhNOditcuHr8ZhOYetBn7QUEi/eX3AacmddlgHEBvBb1QONYHLWutwUZ9zusgANQ+V1m9eg6+PyMKxvqxsUZv30OgacIomDsEgPYbTw7ZwH2YcZZ31JYMrO/iW2L2OqEGWqy99Qie9SB5ofu0eDgdcejVvTRLBBI=";
/** nip44(alice → alice, [["relay","wss://relay.delta.example"]]) */
const PRIVATE_RELAYS =
  "AijI/R0bkWwdvJg0UBqhKL3z9WHCcQg7BENABKDdD+BN7vJqozi0v3aKrx1xRCGmI4wdMYWZJQOYUrtn4gkL+mZXO77LM5CbDPAdDHMmXRicpJvrMWPH8iMbAPWaWC9kUNMmNZ+mYBVr0PbTLyT8QGref64jyzDWo1xzAUTox9FcSho=";

const FRANK_ARTICLE = `30023:${FRANK}:protocols-not-platforms`;
const ALICE_ARTICLE = `30023:${ALICE}:relays-explained`;

// ── Tag building blocks ─────────────────────────────────────────────────────────────────────

/** A repeatable, optional list item tag: what most list entries are. */
const item = (name: string, explain: string, fields: TagSpec["fields"]): TagSpec => ({
  name,
  explain,
  presence: "optional",
  repeatable: true,
  fields,
});

const relayHint = {
  name: "relay",
  type: { type: "relay-url" },
  explain: "field.relay-hint",
  optional: true,
} as const;

const pTag = item("p", "tag.p", [
  { name: "pubkey", type: { type: "pubkey" }, explain: "field.pubkey" },
  relayHint,
  { name: "petname", type: { type: "text" }, explain: "field.petname", optional: true },
]);
const eTag = item("e", "tag.e", [
  { name: "event-id", type: { type: "event-id" }, explain: "field.event-id" },
  relayHint,
]);
const aTag = (kinds?: readonly number[]): TagSpec =>
  item("a", "tag.a", [
    {
      name: "address",
      type: kinds === undefined ? { type: "addr" } : { type: "addr", kinds },
      explain: "field.address",
    },
    relayHint,
  ]);
const tTag = item("t", "tag.t", [
  { name: "hashtag", type: { type: "text", pattern: "[^#\\s]+" }, explain: "field.hashtag" },
]);
const relayTag = item("relay", "tag.relay", [
  { name: "url", type: { type: "relay-url" }, explain: "field.relay-url" },
]);
const emojiTag = item("emoji", "tag.emoji", [
  {
    name: "shortcode",
    type: { type: "text", pattern: "[A-Za-z0-9_]+" },
    explain: "field.shortcode",
  },
  { name: "image", type: { type: "url" }, explain: "field.emoji-url" },
]);

const setMeta: readonly TagSpec[] = [
  {
    name: "d",
    explain: "tag.d",
    presence: "required",
    repeatable: false,
    fields: [{ name: "identifier", type: { type: "text" }, explain: "field.d" }],
  },
  {
    name: "title",
    explain: "tag.title",
    presence: "optional",
    repeatable: false,
    fields: [{ name: "title", type: { type: "text" }, explain: "field.title" }],
  },
  {
    name: "image",
    explain: "tag.image",
    presence: "optional",
    repeatable: false,
    fields: [{ name: "url", type: { type: "url" }, explain: "field.image" }],
  },
  {
    name: "description",
    explain: "tag.description",
    presence: "optional",
    repeatable: false,
    fields: [
      { name: "text", type: { type: "text", multiline: true }, explain: "field.description" },
    ],
  },
];

const publicOrPrivate = {
  format: "text",
  explain: "content.optional-private",
  multiline: true,
} as const;

export const nip51: NipSpec = {
  nip: "51",
  variant: "event",
  events: [
    {
      id: "mute-list",
      label: "mute.label",
      explain: "mute.explain",
      kinds: [10000],
      content: {
        format: "encrypted",
        explain: "content.private",
        scheme: "nip44",
        plaintext: {
          format: "json",
          explain: "content.private.plaintext",
          schema: {
            type: "array",
            explain: "content.private.items",
            items: { type: "tuple", items: [{ type: "string" }], rest: { type: "string" } },
          },
        },
      },
      tags: [
        pTag,
        tTag,
        item("word", "tag.word", [
          { name: "word", type: { type: "text", pattern: "[^A-Z]+" }, explain: "field.word" },
        ]),
        eTag,
      ],
      examples: [
        {
          id: "public-and-private",
          label: "example.mute",
          explain: "example.mute.explain",
          signer: "alice",
          template: {
            kind: 10000,
            tags: [
              ["p", FRANK],
              ["word", "giveaway"],
            ],
            content: PRIVATE_MUTES,
          },
        },
      ],
    },
    {
      id: "pinned-notes",
      label: "pinned.label",
      explain: "pinned.explain",
      kinds: [10001],
      content: publicOrPrivate,
      tags: [eTag],
      examples: [
        {
          id: "pinned",
          label: "example.pinned",
          signer: "alice",
          template: {
            kind: 10001,
            tags: [
              [
                "e",
                "91a74c40d508831576cca43d0d0c58793bb60df736783b40ddfbc68deed5ab06",
                "wss://relay.alpha.example",
              ],
            ],
            content: "",
          },
        },
      ],
    },
    {
      id: "bookmarks",
      label: "bookmarks.label",
      explain: "bookmarks.explain",
      kinds: [10003],
      content: publicOrPrivate,
      tags: [eTag, aTag([30023])],
      examples: [
        {
          id: "carol-bookmarks",
          label: "example.bookmarks",
          signer: "carol",
          template: {
            kind: 10003,
            tags: [
              ["e", "814d487f9a9591bde04009eff371facb26e82f3a41cec1bcdcdab310075053be"],
              ["a", FRANK_ARTICLE, "wss://relay.alpha.example"],
            ],
            content: "",
          },
        },
      ],
    },
    {
      id: "relay-lists",
      label: "relays.label",
      explain: "relays.explain",
      kinds: [10006, 10007, 10012, 10102],
      content: publicOrPrivate,
      tags: [relayTag, aTag([30002])],
      examples: [
        {
          id: "search-relays",
          label: "example.search-relays",
          explain: "example.search-relays.explain",
          signer: "alice",
          template: { kind: 10007, tags: [["relay", "wss://relay.gamma.example"]], content: "" },
        },
        {
          id: "blocked-relays",
          label: "example.blocked-relays",
          signer: "bob",
          template: { kind: 10006, tags: [["relay", "wss://spam.relay.example"]], content: "" },
        },
      ],
    },
    {
      id: "private-relays",
      label: "private-relays.label",
      explain: "private-relays.explain",
      kinds: [10013],
      content: {
        format: "encrypted",
        explain: "content.private",
        scheme: "nip44",
        plaintext: {
          format: "json",
          explain: "content.private.plaintext",
          schema: {
            type: "array",
            explain: "content.private.relays",
            items: {
              type: "tuple",
              items: [{ type: "string" }, { type: "string", field: { type: "relay-url" } }],
            },
          },
        },
      },
      tags: [],
      unknownTags: "warn",
      examples: [
        {
          id: "drafts-relay",
          label: "example.private-relays",
          explain: "example.private-relays.explain",
          signer: "alice",
          template: { kind: 10013, tags: [], content: PRIVATE_RELAYS },
        },
      ],
    },
    {
      id: "people-lists",
      label: "people.label",
      explain: "people.explain",
      kinds: [10017, 10020, 10101],
      content: publicOrPrivate,
      tags: [pTag],
      examples: [
        {
          id: "media-follows",
          label: "example.media-follows",
          explain: "example.media-follows.explain",
          signer: "alice",
          template: {
            kind: 10020,
            tags: [["p", CAROL, "wss://relay.gamma.example", "carol"]],
            content: "",
          },
        },
      ],
    },
    {
      id: "other-lists",
      label: "other.label",
      explain: "other.explain",
      kinds: [10004, 10005, 10009, 10015, 10018, 10021, 10030, 10054, 10063, 10064],
      content: publicOrPrivate,
      tags: [
        aTag(),
        eTag,
        pTag,
        tTag,
        emojiTag,
        item("group", "tag.group", [
          { name: "group-id", type: { type: "text", minLength: 1 }, explain: "field.group-id" },
          { name: "relay", type: { type: "relay-url" }, explain: "field.group-relay" },
          { name: "name", type: { type: "text" }, explain: "field.group-name", optional: true },
        ]),
        item("r", "tag.r", [
          { name: "url", type: { type: "relay-url" }, explain: "field.relay-url" },
        ]),
        item("server", "tag.server", [
          { name: "url", type: { type: "url" }, explain: "field.server" },
        ]),
        item("url", "tag.url", [{ name: "url", type: { type: "url" }, explain: "field.feed-url" }]),
      ],
      examples: [
        {
          id: "interests",
          label: "example.interests",
          explain: "example.interests.explain",
          signer: "erin",
          template: {
            kind: 10015,
            tags: [
              ["t", "ostriches"],
              ["t", "lightning"],
              ["a", `30015:${ERIN}:weird-animals`],
            ],
            content: "",
          },
        },
        {
          id: "groups",
          label: "example.groups",
          signer: "carol",
          template: {
            kind: 10009,
            tags: [
              ["group", "film-club", "wss://relay.gamma.example", "Film Club"],
              ["r", "wss://relay.gamma.example"],
            ],
            content: "",
          },
        },
        {
          id: "emojis",
          label: "example.emojis",
          signer: "erin",
          template: {
            kind: 10030,
            tags: [
              ["emoji", "ostrich", "https://emoji.alpha.example/ostrich.png"],
              ["a", `30030:${ERIN}:animals`],
            ],
            content: "",
          },
        },
      ],
    },
    {
      id: "sets",
      label: "sets.label",
      explain: "sets.explain",
      kinds: [
        30000, 30002, 30003, 30004, 30005, 30006, 30007, 30008, 30015, 30030, 30063, 30267, 39089,
        39092,
      ],
      content: publicOrPrivate,
      tags: [...setMeta, pTag, eTag, aTag(), tTag, relayTag, emojiTag],
      examples: [
        {
          id: "follow-set",
          label: "example.follow-set",
          explain: "example.follow-set.explain",
          signer: "alice",
          template: {
            kind: 30000,
            tags: [
              ["d", "relay-operators"],
              ["title", "Relay operators"],
              ["description", "People who run relays and explain how they work"],
              ["p", DAVE],
              ["p", BOB],
            ],
            content: "",
          },
        },
        {
          id: "curation-set",
          label: "example.curation-set",
          signer: "alice",
          template: {
            kind: 30004,
            tags: [
              ["d", "protocol-reading"],
              ["title", "Protocol reading list"],
              ["image", "https://images.alpha.example/reading.jpg"],
              ["a", FRANK_ARTICLE],
              ["a", ALICE_ARTICLE],
              ["e", "814d487f9a9591bde04009eff371facb26e82f3a41cec1bcdcdab310075053be"],
            ],
            content: "",
          },
        },
        {
          id: "relay-set",
          label: "example.relay-set",
          signer: "bob",
          template: {
            kind: 30002,
            tags: [
              ["d", "fast"],
              ["title", "Fast relays"],
              ["relay", "wss://relay.alpha.example"],
              ["relay", "wss://relay.beta.example"],
            ],
            content: "",
          },
        },
      ],
    },
    {
      id: "legacy-lists",
      label: "legacy.label",
      explain: "legacy.explain",
      kinds: [30001],
      content: publicOrPrivate,
      tags: [
        {
          name: "d",
          explain: "legacy.tag.d",
          presence: "required",
          repeatable: false,
          deprecated: true,
          fields: [
            {
              name: "identifier",
              type: {
                type: "enum",
                values: [
                  { value: "pin", explain: "legacy.pin" },
                  { value: "bookmark", explain: "legacy.bookmark" },
                  { value: "communities", explain: "legacy.communities" },
                ],
              },
              explain: "field.d",
            },
          ],
        },
        eTag,
        aTag(),
      ],
      examples: [
        {
          id: "old-bookmarks",
          label: "example.legacy",
          explain: "example.legacy.explain",
          signer: "bob",
          template: {
            kind: 30001,
            tags: [
              ["d", "bookmark"],
              ["e", "6f762f141286ff49dc17f167204069df048758cf0a4cd83dae2455f277241253"],
            ],
            content: "",
          },
        },
      ],
    },
  ],
  howItWorks: [
    {
      id: "public",
      title: "how.public.title",
      body: "how.public.body",
      focus: { part: { kind: "event", id: "mute-list" }, path: ["tags"] },
    },
    {
      id: "private",
      title: "how.private.title",
      body: "how.private.body",
      focus: { part: { kind: "event", id: "mute-list" }, path: ["content"] },
    },
    {
      id: "standard-lists",
      title: "how.standard-lists.title",
      body: "how.standard-lists.body",
      focus: { part: { kind: "event", id: "bookmarks" } },
    },
    {
      id: "sets",
      title: "how.sets.title",
      body: "how.sets.body",
      focus: { part: { kind: "event", id: "sets" }, path: ["tags", 0] },
    },
    {
      id: "append",
      title: "how.append.title",
      body: "how.append.body",
    },
    {
      id: "legacy",
      title: "how.legacy.title",
      body: "how.legacy.body",
      focus: { part: { kind: "event", id: "legacy-lists" } },
    },
  ],
  related: [
    { nip: "01", relation: "depends-on", explain: "related.01" },
    { nip: "44", relation: "depends-on", explain: "related.44" },
    { nip: "04", relation: "see-also", explain: "related.04" },
    { nip: "02", relation: "see-also", explain: "related.02" },
    { nip: "65", relation: "see-also", explain: "related.65" },
    { nip: "58", relation: "see-also", explain: "related.58" },
    { nip: "29", relation: "see-also", explain: "related.29" },
    { nip: "30", relation: "see-also", explain: "related.30" },
  ],
};
