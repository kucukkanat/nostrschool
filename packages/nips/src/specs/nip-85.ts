// Owner: spec author r5 (NIPs 80–99). NIP-85: Trusted Assertions.
import type { FieldType, NipSpec, TagSpec } from "../spec.ts";

const ALICE = "e550c6e92808f358382b7b8c14345344f5ef9a299529834d1c26d57b6ace44cc";
const BOB_NOTE = "814d487f9a9591bde04009eff371facb26e82f3a41cec1bcdcdab310075053be";
const FRANK = "922e43b50aec16ad1e9d1ec6854c058816d28b944ae2fe9bdce3d9241bfaafb8";
const DAVE = "1c028b39e7f3228444b3261e4b718efa92a91470086b44c9a72ef5357e970148";
const GRACE = "5f69e52aeb38975e54cb99428da837124166abb4198c1128c54491be73d23812";
const DELTA = "wss://relay.delta.example";
const GAMMA = "wss://relay.gamma.example";

const COUNT: FieldType = { type: "number", integer: true, min: 0 };
const RANK: FieldType = { type: "number", integer: true, min: 0, max: 100 };
const HOUR: FieldType = { type: "number", integer: true, min: 0, max: 24 };

/** A single-value result tag ("followers", "rank"…): text keys `tag.<name>` and `field.<unit>`. */
const result = (
  name: string,
  type: FieldType = COUNT,
  unit: "count" | "rank" | "hour" | "timestamp" = "count",
): TagSpec => ({
  name,
  explain: `tag.${name}`,
  presence: name === "rank" ? "recommended" : "optional",
  repeatable: false,
  fields: [{ name: "value", type, explain: `field.${unit}` }],
});

/** Result tag names per assertion kind (the NIP's tables), used to build kind 10040 tags. */
const RESULTS: { readonly [kind: number]: readonly string[] } = {
  30382: [
    "rank",
    "followers",
    "first_created_at",
    "post_cnt",
    "reply_cnt",
    "reactions_cnt",
    "zap_amt_recd",
    "zap_amt_sent",
    "zap_cnt_recd",
    "zap_cnt_sent",
    "zap_avg_amt_day_recd",
    "zap_avg_amt_day_sent",
    "reports_cnt_recd",
    "reports_cnt_sent",
    "t",
    "active_hours_start",
    "active_hours_end",
  ],
  30383: [
    "rank",
    "comment_cnt",
    "quote_cnt",
    "repost_cnt",
    "reaction_cnt",
    "zap_cnt",
    "zap_amount",
  ],
  30384: [
    "rank",
    "comment_cnt",
    "quote_cnt",
    "repost_cnt",
    "reaction_cnt",
    "zap_cnt",
    "zap_amount",
  ],
  30385: ["rank", "comment_cnt", "reaction_cnt"],
};

/** Kind 10040 entries: the tag name is "<kind>:<result tag>", e.g. "30382:rank". */
const providerTags: readonly TagSpec[] = Object.entries(RESULTS).flatMap(([kind, names]) =>
  names.map(
    (n): TagSpec => ({
      name: `${kind}:${n}`,
      explain: "tag.provider",
      presence: "optional",
      repeatable: true,
      fields: [
        { name: "service-key", type: { type: "pubkey" }, explain: "tag.provider.key" },
        { name: "relay", type: { type: "relay-url" }, explain: "tag.provider.relay" },
      ],
    }),
  ),
);

const d = (explain: string, type: FieldType): TagSpec => ({
  name: "d",
  explain,
  presence: "required",
  repeatable: false,
  fields: [{ name: "subject", type, explain: `${explain}.subject` }],
});

/** `p`/`e`/`a` with the same value as `d`: only adds a relay hint for the subject. */
const hint = (name: "p" | "e" | "a", type: FieldType): TagSpec => ({
  name,
  explain: "tag.hint",
  presence: "optional",
  repeatable: false,
  fields: [
    { name: "subject", type, explain: "tag.hint.subject" },
    { name: "relay", type: { type: "relay-url" }, explain: "tag.hint.relay" },
  ],
});

const shared = [
  result("rank", RANK, "rank"),
  result("comment_cnt"),
  result("quote_cnt"),
  result("repost_cnt"),
  result("reaction_cnt"),
  result("zap_cnt"),
  result("zap_amount"),
];

export const nip85: NipSpec = {
  nip: "85",
  variant: "event",
  howItWorks: [
    {
      id: "why",
      title: "how.why.title",
      body: "how.why.body",
    },
    {
      id: "choose",
      title: "how.choose.title",
      body: "how.choose.body",
      focus: { part: { kind: "event", id: "providers" }, path: ["tags", 0] },
    },
    {
      id: "compute",
      title: "how.compute.title",
      body: "how.compute.body",
      focus: { part: { kind: "event", id: "user" }, path: ["tags", 0] },
    },
    {
      id: "results",
      title: "how.results.title",
      body: "how.results.body",
      focus: { part: { kind: "event", id: "user" }, path: ["tags", 1] },
    },
    {
      id: "read",
      title: "how.read.title",
      body: "how.read.body",
    },
  ],
  related: [
    { nip: "01", relation: "depends-on", explain: "related.01" },
    { nip: "44", relation: "depends-on", explain: "related.44" },
    { nip: "73", relation: "depends-on", explain: "related.73" },
    { nip: "02", relation: "see-also", explain: "related.02" },
    { nip: "51", relation: "see-also", explain: "related.51" },
  ],
  flows: [
    {
      id: "assertions",
      label: "flow.assertions.label",
      explain: "flow.assertions.explain",
      steps: [
        { part: { kind: "event", id: "providers" }, explain: "flow.assertions.providers" },
        { part: { kind: "event", id: "user" }, explain: "flow.assertions.user" },
      ],
    },
  ],
  events: [
    {
      id: "user",
      label: "event.user.label",
      explain: "event.user.explain",
      kinds: [30382],
      content: { format: "empty", explain: "content.empty" },
      tags: [
        d("tag.d.user", { type: "pubkey" }),
        result("followers"),
        result("rank", RANK, "rank"),
        result("first_created_at", { type: "timestamp" }, "timestamp"),
        result("post_cnt"),
        result("reply_cnt"),
        result("reactions_cnt"),
        result("zap_amt_recd"),
        result("zap_amt_sent"),
        result("zap_cnt_recd"),
        result("zap_cnt_sent"),
        result("zap_avg_amt_day_recd"),
        result("zap_avg_amt_day_sent"),
        result("reports_cnt_recd"),
        result("reports_cnt_sent"),
        {
          name: "t",
          explain: "tag.t",
          presence: "optional",
          repeatable: true,
          fields: [{ name: "topic", type: { type: "text", minLength: 1 }, explain: "tag.t.topic" }],
        },
        result("active_hours_start", HOUR, "hour"),
        result("active_hours_end", HOUR, "hour"),
        hint("p", { type: "pubkey" }),
      ],
      examples: [
        {
          id: "rank-alice",
          label: "example.rank-alice.label",
          explain: "example.rank-alice.explain",
          signer: "dave",
          template: {
            kind: 30382,
            tags: [
              ["d", ALICE],
              ["rank", "89"],
              ["followers", "1204"],
              ["first_created_at", "1704067200"],
              ["post_cnt", "312"],
              ["zap_amt_recd", "48000"],
              ["t", "nostr"],
              ["t", "education"],
              ["active_hours_start", "8"],
              ["active_hours_end", "18"],
              ["p", ALICE, "wss://relay.alpha.example"],
            ],
            content: "",
          },
        },
        {
          id: "rank-only",
          label: "example.rank-only.label",
          explain: "example.rank-only.explain",
          signer: "dave",
          template: {
            kind: 30382,
            tags: [
              ["d", GRACE],
              ["rank", "42"],
            ],
            content: "",
          },
        },
      ],
    },
    {
      id: "event",
      label: "event.event.label",
      explain: "event.event.explain",
      kinds: [30383],
      content: { format: "empty", explain: "content.empty" },
      tags: [d("tag.d.event", { type: "event-id" }), ...shared, hint("e", { type: "event-id" })],
      examples: [
        {
          id: "note-stats",
          label: "example.note-stats.label",
          explain: "example.note-stats.explain",
          signer: "dave",
          template: {
            kind: 30383,
            tags: [
              ["d", BOB_NOTE],
              ["rank", "71"],
              ["comment_cnt", "3"],
              ["quote_cnt", "1"],
              ["reaction_cnt", "2"],
              ["e", BOB_NOTE, "wss://relay.beta.example"],
            ],
            content: "",
          },
        },
      ],
    },
    {
      id: "address",
      label: "event.address.label",
      explain: "event.address.explain",
      kinds: [30384],
      content: { format: "empty", explain: "content.empty" },
      tags: [d("tag.d.address", { type: "addr" }), ...shared, hint("a", { type: "addr" })],
      examples: [
        {
          id: "article-stats",
          label: "example.article-stats.label",
          explain: "example.article-stats.explain",
          signer: "dave",
          template: {
            kind: 30384,
            tags: [
              ["d", `30023:${FRANK}:protocols-not-platforms`],
              ["rank", "93"],
              ["repost_cnt", "2"],
              ["zap_cnt", "5"],
              ["zap_amount", "12500"],
            ],
            content: "",
          },
        },
      ],
    },
    {
      id: "external",
      label: "event.external.label",
      explain: "event.external.explain",
      kinds: [30385],
      content: { format: "empty", explain: "content.empty" },
      tags: [
        d("tag.d.external", { type: "text", minLength: 1 }),
        {
          name: "k",
          explain: "tag.k",
          presence: "recommended",
          repeatable: false,
          fields: [{ name: "type", type: { type: "text", minLength: 1 }, explain: "tag.k.type" }],
        },
        result("rank", RANK, "rank"),
        result("comment_cnt"),
        result("reaction_cnt"),
      ],
      examples: [
        {
          id: "hashtag",
          label: "example.hashtag.label",
          explain: "example.hashtag.explain",
          signer: "dave",
          template: {
            kind: 30385,
            tags: [
              ["d", "#nostr"],
              ["k", "#"],
              ["rank", "97"],
              ["comment_cnt", "5210"],
            ],
            content: "",
          },
        },
      ],
    },
    {
      id: "providers",
      label: "event.providers.label",
      explain: "event.providers.explain",
      kinds: [10040],
      content: { format: "text", explain: "content.providers" },
      tags: providerTags,
      unknownTags: "warn",
      examples: [
        {
          id: "public",
          label: "example.public.label",
          explain: "example.public.explain",
          signer: "alice",
          template: {
            kind: 10040,
            tags: [
              ["30382:rank", DAVE, DELTA],
              ["30382:followers", DAVE, DELTA],
              ["30383:rank", DAVE, DELTA],
              ["30382:zap_amt_sent", GRACE, GAMMA],
            ],
            content: "",
          },
        },
      ],
    },
  ],
};
