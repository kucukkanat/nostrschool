// Owner: spec author r3 (NIPs 40–59). NIP-52: Calendar Events.
// Explanations: packages/i18n/src/locales/en/nips/r3.ts → n52.text.
import type { NipSpec, TagSpec } from "../spec.ts";

const ALICE = "e550c6e92808f358382b7b8c14345344f5ef9a299529834d1c26d57b6ace44cc";
const BOB = "a73883912a48c3551c1548fd454876d577126a61c76b5486c807bfec5869e183";
const CAROL = "9445888d3235f73f8b627df1fb1d498f2eb3fa76337679c1176965a73d3b68b4";

// 2025-01-18 18:00–20:00 UTC (Europe/Madrid is UTC+1 then); day index floor(t / 86400) = 20106.
const MEETUP_START = 1737223200;
const MEETUP_END = 1737230400;

const single = (
  name: string,
  explain: string,
  field: TagSpec["fields"][number],
  presence: TagSpec["presence"] = "optional",
): TagSpec => ({
  name,
  explain,
  presence,
  repeatable: false,
  fields: [field],
});

const dTag = single(
  "d",
  "tag.d",
  { name: "identifier", type: { type: "text", minLength: 1 }, explain: "field.d" },
  "required",
);
const titleTag = single(
  "title",
  "tag.title",
  { name: "title", type: { type: "text", minLength: 1 }, explain: "field.title" },
  "required",
);

/** Tags shared by date-based and time-based calendar events. */
const common: readonly TagSpec[] = [
  dTag,
  titleTag,
  single("summary", "tag.summary", {
    name: "text",
    type: { type: "text" },
    explain: "field.summary",
  }),
  single("image", "tag.image", { name: "url", type: { type: "url" }, explain: "field.image" }),
  {
    name: "location",
    explain: "tag.location",
    presence: "optional",
    repeatable: true,
    fields: [{ name: "location", type: { type: "text", minLength: 1 }, explain: "field.location" }],
  },
  single("g", "tag.g", {
    name: "geohash",
    type: { type: "text", pattern: "[0-9b-hjkmnp-z]{1,12}" },
    explain: "field.geohash",
  }),
  {
    name: "p",
    explain: "tag.p",
    presence: "optional",
    repeatable: true,
    fields: [
      { name: "pubkey", type: { type: "pubkey" }, explain: "field.pubkey" },
      { name: "relay", type: { type: "relay-url" }, explain: "field.relay", optional: true },
      { name: "role", type: { type: "text" }, explain: "field.role", optional: true },
    ],
  },
  {
    name: "t",
    explain: "tag.t",
    presence: "optional",
    repeatable: true,
    fields: [{ name: "hashtag", type: { type: "text", minLength: 1 }, explain: "field.hashtag" }],
  },
  {
    name: "r",
    explain: "tag.r",
    presence: "optional",
    repeatable: true,
    fields: [{ name: "url", type: { type: "url" }, explain: "field.reference" }],
  },
  {
    name: "a",
    explain: "tag.a.calendar",
    presence: "optional",
    repeatable: true,
    fields: [
      { name: "calendar", type: { type: "addr", kinds: [31924] }, explain: "field.calendar" },
      { name: "relay", type: { type: "relay-url" }, explain: "field.relay", optional: true },
    ],
  },
  {
    name: "name",
    explain: "tag.name",
    presence: "optional",
    repeatable: false,
    deprecated: true,
    fields: [{ name: "name", type: { type: "text" }, explain: "field.title" }],
  },
];

const DATE = { type: "text", pattern: "\\d{4}-\\d{2}-\\d{2}" } as const;

const calendarEventRef = {
  name: "a",
  explain: "tag.a.event",
  presence: "required",
  repeatable: true,
  fields: [
    {
      name: "calendar-event",
      type: { type: "addr", kinds: [31922, 31923] },
      explain: "field.calendar-event",
    },
    { name: "relay", type: { type: "relay-url" }, explain: "field.relay", optional: true },
  ],
} as const satisfies TagSpec;

export const nip52: NipSpec = {
  nip: "52",
  variant: "event",
  events: [
    {
      id: "time-based",
      label: "time.label",
      explain: "time.explain",
      kinds: [31923],
      content: { format: "text", explain: "content.description", multiline: true },
      tags: [
        ...common,
        single(
          "start",
          "time.tag.start",
          { name: "timestamp", type: { type: "timestamp" }, explain: "time.field.start" },
          "required",
        ),
        single("end", "time.tag.end", {
          name: "timestamp",
          type: { type: "timestamp" },
          explain: "time.field.end",
        }),
        {
          name: "D",
          explain: "time.tag.D",
          presence: "required",
          repeatable: true,
          fields: [
            {
              name: "day",
              type: { type: "number", integer: true, min: 0 },
              explain: "time.field.D",
            },
          ],
        },
        single("start_tzid", "time.tag.start-tzid", {
          name: "tzid",
          type: { type: "text", pattern: "[A-Za-z_]+(/[A-Za-z0-9_+-]+)*" },
          explain: "time.field.tzid",
        }),
        single("end_tzid", "time.tag.end-tzid", {
          name: "tzid",
          type: { type: "text", pattern: "[A-Za-z_]+(/[A-Za-z0-9_+-]+)*" },
          explain: "time.field.tzid",
        }),
      ],
      examples: [
        {
          id: "meetup",
          label: "example.meetup",
          explain: "example.meetup.explain",
          signer: "alice",
          template: {
            kind: 31923,
            tags: [
              ["d", "nostr-meetup-madrid-2025-01"],
              ["title", "Nostr meetup Madrid"],
              ["summary", "Lightning talks about relays, zaps and clients"],
              ["start", String(MEETUP_START)],
              ["end", String(MEETUP_END)],
              ["D", "20106"],
              ["start_tzid", "Europe/Madrid"],
              ["location", "Café Central, Plaza del Ángel 10, Madrid"],
              ["g", "ezjmgu"],
              ["p", BOB, "wss://relay.beta.example", "speaker"],
              ["p", CAROL, "wss://relay.gamma.example", "photographer"],
              ["t", "meetup"],
              ["a", `31924:${ALICE}:nostr-events`],
            ],
            content: "Bring your questions. Talks start at 19:00 local time, then drinks.",
          },
        },
      ],
    },
    {
      id: "date-based",
      label: "date.label",
      explain: "date.explain",
      kinds: [31922],
      content: { format: "text", explain: "content.description", multiline: true },
      tags: [
        ...common,
        single(
          "start",
          "date.tag.start",
          { name: "date", type: DATE, explain: "date.field.start" },
          "required",
        ),
        single("end", "date.tag.end", { name: "date", type: DATE, explain: "date.field.end" }),
      ],
      examples: [
        {
          id: "vacation",
          label: "example.vacation",
          explain: "example.vacation.explain",
          signer: "carol",
          template: {
            kind: 31922,
            tags: [
              ["d", "photo-trip-lisbon"],
              ["title", "Photo trip to Lisbon"],
              ["start", "2025-02-10"],
              ["end", "2025-02-14"],
              ["location", "Lisbon, Portugal"],
              ["t", "film"],
            ],
            content: "Four days of shooting film in Alfama. Out of office.",
          },
        },
      ],
    },
    {
      id: "calendar",
      label: "calendar.label",
      explain: "calendar.explain",
      kinds: [31924],
      content: { format: "text", explain: "content.calendar", multiline: true },
      tags: [dTag, titleTag, { ...calendarEventRef, presence: "optional" }],
      examples: [
        {
          id: "alice-events",
          label: "example.calendar",
          signer: "alice",
          template: {
            kind: 31924,
            tags: [
              ["d", "nostr-events"],
              ["title", "Nostr events I organise"],
              ["a", `31923:${ALICE}:nostr-meetup-madrid-2025-01`, "wss://relay.alpha.example"],
            ],
            content: "Meetups and workshops about Nostr.",
          },
        },
      ],
    },
    {
      id: "rsvp",
      label: "rsvp.label",
      explain: "rsvp.explain",
      kinds: [31925],
      content: { format: "text", explain: "content.rsvp", multiline: true },
      tags: [
        { ...calendarEventRef, repeatable: false },
        {
          name: "e",
          explain: "rsvp.tag.e",
          presence: "optional",
          repeatable: false,
          fields: [
            { name: "event-id", type: { type: "event-id" }, explain: "rsvp.field.e" },
            { name: "relay", type: { type: "relay-url" }, explain: "field.relay", optional: true },
          ],
        },
        dTag,
        single(
          "status",
          "rsvp.tag.status",
          {
            name: "status",
            type: {
              type: "enum",
              values: [
                { value: "accepted", explain: "rsvp.status.accepted" },
                { value: "declined", explain: "rsvp.status.declined" },
                { value: "tentative", explain: "rsvp.status.tentative" },
              ],
            },
            explain: "rsvp.field.status",
          },
          "required",
        ),
        single("fb", "rsvp.tag.fb", {
          name: "free-busy",
          type: {
            type: "enum",
            values: [
              { value: "free", explain: "rsvp.fb.free" },
              { value: "busy", explain: "rsvp.fb.busy" },
            ],
          },
          explain: "rsvp.field.fb",
        }),
        {
          name: "p",
          explain: "rsvp.tag.p",
          presence: "optional",
          repeatable: false,
          fields: [
            { name: "pubkey", type: { type: "pubkey" }, explain: "rsvp.field.p" },
            { name: "relay", type: { type: "relay-url" }, explain: "field.relay", optional: true },
          ],
        },
      ],
      examples: [
        {
          id: "bob-accepts",
          label: "example.rsvp",
          explain: "example.rsvp.explain",
          signer: "bob",
          template: {
            kind: 31925,
            tags: [
              ["a", `31923:${ALICE}:nostr-meetup-madrid-2025-01`, "wss://relay.alpha.example"],
              ["d", "rsvp-nostr-meetup-madrid-2025-01"],
              ["status", "accepted"],
              ["fb", "busy"],
              ["p", ALICE, "wss://relay.alpha.example"],
            ],
            content: "See you there, I'll bring the slides.",
          },
        },
        {
          id: "dave-declines",
          label: "example.rsvp-declined",
          signer: "dave",
          template: {
            kind: 31925,
            tags: [
              ["a", `31923:${ALICE}:nostr-meetup-madrid-2025-01`],
              ["d", "rsvp-madrid-meetup"],
              ["status", "declined"],
            ],
            content: "",
          },
        },
      ],
    },
  ],
  flows: [
    {
      id: "invite-rsvp",
      label: "flow.rsvp.label",
      explain: "flow.rsvp.explain",
      steps: [
        { part: { kind: "event", id: "time-based" }, explain: "flow.rsvp.create" },
        { part: { kind: "event", id: "calendar" }, explain: "flow.rsvp.calendar" },
        { part: { kind: "event", id: "rsvp" }, explain: "flow.rsvp.answer" },
      ],
    },
  ],
  howItWorks: [
    {
      id: "two-types",
      title: "how.two-types.title",
      body: "how.two-types.body",
      focus: { part: { kind: "event", id: "time-based" }, path: ["kind"] },
    },
    {
      id: "time",
      title: "how.time.title",
      body: "how.time.body",
      focus: { part: { kind: "event", id: "time-based" }, path: ["tags", 5] },
    },
    {
      id: "invite",
      title: "how.invite.title",
      body: "how.invite.body",
      focus: { part: { kind: "event", id: "time-based" }, path: ["tags", 9] },
    },
    {
      id: "calendar",
      title: "how.calendar.title",
      body: "how.calendar.body",
      focus: { part: { kind: "event", id: "calendar" }, path: ["tags", 2] },
    },
    {
      id: "rsvp",
      title: "how.rsvp.title",
      body: "how.rsvp.body",
      focus: { part: { kind: "event", id: "rsvp" }, path: ["tags", 2] },
    },
  ],
  related: [
    { nip: "01", relation: "depends-on", explain: "related.01" },
    { nip: "09", relation: "see-also", explain: "related.09" },
    { nip: "51", relation: "see-also", explain: "related.51" },
    { nip: "19", relation: "see-also", explain: "related.19" },
  ],
};
