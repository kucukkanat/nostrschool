// Owner: spec author r3 (NIPs 40–59). NIP-53: Live Activities (streams and meeting spaces).
// Explanations: packages/i18n/src/locales/en/nips/r3.ts → n53.text.
import type { NipSpec, TagSpec } from "../spec.ts";

const ALICE = "e550c6e92808f358382b7b8c14345344f5ef9a299529834d1c26d57b6ace44cc";
const BOB = "a73883912a48c3551c1548fd454876d577126a61c76b5486c807bfec5869e183";
const DAVE = "1c028b39e7f3228444b3261e4b718efa92a91470086b44c9a72ef5357e970148";

const STREAM = `30311:${ALICE}:relays-explained-live`;
const SPACE = `30312:${DAVE}:delta-hall`;
const STARTS = "1735689600"; // FIXTURE_NOW

const one = (
  name: string,
  explain: string,
  field: TagSpec["fields"][number],
  presence: TagSpec["presence"] = "optional",
): TagSpec => ({ name, explain, presence, repeatable: false, fields: [field] });

const d = one(
  "d",
  "tag.d",
  { name: "identifier", type: { type: "text", minLength: 1 }, explain: "field.d" },
  "required",
);
const summary = one("summary", "tag.summary", {
  name: "text",
  type: { type: "text" },
  explain: "field.text",
});
const image = one("image", "tag.image", {
  name: "url",
  type: { type: "url" },
  explain: "field.url",
});
const hashtag: TagSpec = {
  name: "t",
  explain: "tag.t",
  presence: "optional",
  repeatable: true,
  fields: [{ name: "hashtag", type: { type: "text", minLength: 1 }, explain: "field.hashtag" }],
};
const starts = (presence: TagSpec["presence"]) =>
  one(
    "starts",
    "tag.starts",
    { name: "timestamp", type: { type: "timestamp" }, explain: "field.timestamp" },
    presence,
  );
const ends = one("ends", "tag.ends", {
  name: "timestamp",
  type: { type: "timestamp" },
  explain: "field.timestamp",
});
const activityStatus = (presence: TagSpec["presence"]) =>
  one(
    "status",
    "tag.status",
    {
      name: "status",
      type: {
        type: "enum",
        values: [
          { value: "planned", explain: "status.planned" },
          { value: "live", explain: "status.live" },
          { value: "ended", explain: "status.ended" },
        ],
      },
      explain: "field.status",
    },
    presence,
  );
const counts: readonly TagSpec[] = [
  one("current_participants", "tag.current", {
    name: "count",
    type: { type: "number", integer: true, min: 0 },
    explain: "field.count",
  }),
  one("total_participants", "tag.total", {
    name: "count",
    type: { type: "number", integer: true, min: 0 },
    explain: "field.count",
  }),
];
const participant = (presence: TagSpec["presence"]): TagSpec => ({
  name: "p",
  explain: "tag.p",
  presence,
  repeatable: true,
  fields: [
    { name: "pubkey", type: { type: "pubkey" }, explain: "field.pubkey" },
    { name: "relay", type: { type: "relay-url" }, explain: "field.relay", optional: true },
    { name: "role", type: { type: "text" }, explain: "field.role", optional: true },
    { name: "proof", type: { type: "hex", bytes: 64 }, explain: "field.proof", optional: true },
  ],
});
const relays: TagSpec = {
  name: "relays",
  explain: "tag.relays",
  presence: "optional",
  repeatable: false,
  fields: [],
  rest: { name: "relay", type: { type: "relay-url" }, explain: "field.relay-url" },
};
const activityRef = (kinds: readonly number[], presence: TagSpec["presence"]): TagSpec => ({
  name: "a",
  explain: "tag.a",
  presence,
  repeatable: false,
  fields: [
    { name: "activity", type: { type: "addr", kinds }, explain: "field.activity" },
    { name: "relay", type: { type: "relay-url" }, explain: "field.relay", optional: true },
    { name: "marker", type: { type: "text" }, explain: "field.marker", optional: true },
  ],
});

export const nip53: NipSpec = {
  nip: "53",
  variant: "event",
  events: [
    {
      id: "live-event",
      label: "live.label",
      explain: "live.explain",
      kinds: [30311],
      content: { format: "empty", explain: "content.empty" },
      tags: [
        d,
        one("title", "tag.title", { name: "title", type: { type: "text" }, explain: "field.text" }),
        summary,
        image,
        hashtag,
        one("streaming", "live.tag.streaming", {
          name: "url",
          type: { type: "url" },
          explain: "live.field.streaming",
        }),
        one("recording", "live.tag.recording", {
          name: "url",
          type: { type: "url" },
          explain: "field.url",
        }),
        starts("optional"),
        ends,
        activityStatus("optional"),
        ...counts,
        participant("optional"),
        relays,
        {
          name: "pinned",
          explain: "live.tag.pinned",
          presence: "optional",
          repeatable: true,
          fields: [{ name: "event-id", type: { type: "event-id" }, explain: "live.field.pinned" }],
        },
      ],
      examples: [
        {
          id: "alice-live",
          label: "example.live",
          explain: "example.live.explain",
          signer: "alice",
          template: {
            kind: 30311,
            tags: [
              ["d", "relays-explained-live"],
              ["title", "Relays, explained (live)"],
              ["summary", "A walkthrough of what a relay does, with questions from chat"],
              ["image", "https://images.alpha.example/live-cover.png"],
              ["t", "nostr"],
              ["streaming", "https://stream.alpha.example/live/relays.m3u8"],
              ["starts", STARTS],
              ["status", "live"],
              ["current_participants", "42"],
              ["p", ALICE, "wss://relay.alpha.example", "Host"],
              ["p", BOB, "wss://relay.beta.example", "Speaker"],
              ["relays", "wss://relay.alpha.example", "wss://relay.beta.example"],
            ],
            content: "",
          },
        },
        {
          id: "ended",
          label: "example.ended",
          explain: "example.ended.explain",
          signer: "alice",
          template: {
            kind: 30311,
            tags: [
              ["d", "relays-explained-live"],
              ["title", "Relays, explained (live)"],
              ["recording", "https://stream.alpha.example/vod/relays.mp4"],
              ["starts", STARTS],
              ["ends", "1735695000"],
              ["status", "ended"],
              ["total_participants", "118"],
            ],
            content: "",
          },
        },
      ],
    },
    {
      id: "chat",
      label: "chat.label",
      explain: "chat.explain",
      kinds: [1311],
      content: { format: "text", explain: "chat.content", required: true, multiline: true },
      tags: [
        activityRef([30311], "required"),
        {
          name: "e",
          explain: "chat.tag.e",
          presence: "optional",
          repeatable: false,
          fields: [
            { name: "parent-id", type: { type: "event-id" }, explain: "chat.field.e" },
            { name: "relay", type: { type: "relay-url" }, explain: "field.relay", optional: true },
          ],
        },
        {
          name: "q",
          explain: "chat.tag.q",
          presence: "optional",
          repeatable: true,
          fields: [
            { name: "event", type: { type: "text", minLength: 1 }, explain: "chat.field.q" },
            { name: "relay", type: { type: "relay-url" }, explain: "field.relay", optional: true },
            {
              name: "pubkey",
              type: { type: "pubkey" },
              explain: "chat.field.q-pubkey",
              optional: true,
            },
          ],
        },
      ],
      examples: [
        {
          id: "question",
          label: "example.chat",
          signer: "carol",
          template: {
            kind: 1311,
            tags: [["a", STREAM, "wss://relay.alpha.example", "root"]],
            content: "Do relays talk to each other, or only to clients?",
          },
        },
      ],
    },
    {
      id: "space",
      label: "space.label",
      explain: "space.explain",
      kinds: [30312],
      content: { format: "text", explain: "content.usually-empty" },
      tags: [
        d,
        one(
          "room",
          "space.tag.room",
          { name: "name", type: { type: "text", minLength: 1 }, explain: "field.text" },
          "required",
        ),
        summary,
        image,
        one(
          "status",
          "space.tag.status",
          {
            name: "status",
            type: {
              type: "enum",
              values: [
                { value: "open", explain: "space.status.open" },
                { value: "private", explain: "space.status.private" },
                { value: "closed", explain: "space.status.closed" },
              ],
            },
            explain: "field.status",
          },
          "required",
        ),
        one(
          "service",
          "space.tag.service",
          { name: "url", type: { type: "url" }, explain: "field.url" },
          "required",
        ),
        one("endpoint", "space.tag.endpoint", {
          name: "url",
          type: { type: "url" },
          explain: "field.url",
        }),
        hashtag,
        participant("required"),
        relays,
      ],
      examples: [
        {
          id: "delta-hall",
          label: "example.space",
          explain: "example.space.explain",
          signer: "dave",
          template: {
            kind: 30312,
            tags: [
              ["d", "delta-hall"],
              ["room", "Delta Hall"],
              ["summary", "Weekly relay operators call"],
              ["status", "open"],
              ["service", "https://meet.delta.example/hall"],
              ["endpoint", "https://api.delta.example/hall"],
              ["t", "relays"],
              ["p", DAVE, "wss://relay.delta.example", "Host"],
              ["p", BOB, "wss://relay.beta.example", "Moderator"],
              ["relays", "wss://relay.delta.example"],
            ],
            content: "",
          },
        },
      ],
    },
    {
      id: "meeting",
      label: "meeting.label",
      explain: "meeting.explain",
      kinds: [30313],
      content: { format: "text", explain: "content.usually-empty" },
      tags: [
        d,
        activityRef([30312], "required"),
        one(
          "title",
          "tag.title",
          { name: "title", type: { type: "text", minLength: 1 }, explain: "field.text" },
          "required",
        ),
        summary,
        image,
        starts("required"),
        ends,
        activityStatus("required"),
        ...counts,
        participant("optional"),
      ],
      examples: [
        {
          id: "weekly-call",
          label: "example.meeting",
          signer: "dave",
          template: {
            kind: 30313,
            tags: [
              ["d", "operators-call-2025-01-01"],
              ["a", SPACE, "wss://relay.delta.example"],
              ["title", "Relay operators call #1"],
              ["starts", STARTS],
              ["status", "planned"],
              ["p", ALICE, "wss://relay.alpha.example", "Speaker"],
            ],
            content: "",
          },
        },
      ],
    },
    {
      id: "presence",
      label: "presence.label",
      explain: "presence.explain",
      kinds: [10312],
      content: { format: "empty", explain: "content.empty" },
      tags: [
        activityRef([30311, 30312, 30313], "required"),
        one("hand", "presence.tag.hand", {
          name: "raised",
          type: {
            type: "enum",
            values: [
              { value: "1", explain: "presence.hand.1" },
              { value: "0", explain: "presence.hand.0" },
            ],
          },
          explain: "presence.field.hand",
        }),
      ],
      examples: [
        {
          id: "hand-up",
          label: "example.presence",
          explain: "example.presence.explain",
          signer: "grace",
          template: {
            kind: 10312,
            tags: [
              ["a", SPACE, "wss://relay.delta.example", "root"],
              ["hand", "1"],
            ],
            content: "",
          },
        },
      ],
    },
  ],
  flows: [
    {
      id: "stream",
      label: "flow.stream.label",
      explain: "flow.stream.explain",
      steps: [
        { part: { kind: "event", id: "live-event" }, explain: "flow.stream.announce" },
        { part: { kind: "event", id: "chat" }, explain: "flow.stream.chat" },
      ],
    },
    {
      id: "room",
      label: "flow.room.label",
      explain: "flow.room.explain",
      steps: [
        { part: { kind: "event", id: "space" }, explain: "flow.room.space" },
        { part: { kind: "event", id: "meeting" }, explain: "flow.room.meeting" },
        { part: { kind: "event", id: "presence" }, explain: "flow.room.presence" },
      ],
    },
  ],
  howItWorks: [
    {
      id: "announce",
      title: "how.announce.title",
      body: "how.announce.body",
      focus: { part: { kind: "event", id: "live-event" }, path: ["tags", 5] },
    },
    {
      id: "update",
      title: "how.update.title",
      body: "how.update.body",
      focus: { part: { kind: "event", id: "live-event" }, path: ["tags", 7] },
    },
    {
      id: "participants",
      title: "how.participants.title",
      body: "how.participants.body",
      focus: { part: { kind: "event", id: "live-event" }, path: ["tags", 9] },
    },
    {
      id: "chat",
      title: "how.chat.title",
      body: "how.chat.body",
      focus: { part: { kind: "event", id: "chat" }, path: ["tags", 0] },
    },
    {
      id: "spaces",
      title: "how.spaces.title",
      body: "how.spaces.body",
      focus: { part: { kind: "event", id: "space" } },
    },
    {
      id: "presence",
      title: "how.presence.title",
      body: "how.presence.body",
      focus: { part: { kind: "event", id: "presence" }, path: ["tags", 1] },
    },
  ],
  related: [
    { nip: "01", relation: "depends-on", explain: "related.01" },
    { nip: "19", relation: "depends-on", explain: "related.19" },
    { nip: "21", relation: "see-also", explain: "related.21" },
    { nip: "57", relation: "see-also", explain: "related.57" },
  ],
};
