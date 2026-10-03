// Owner: spec author r4 (NIPs 60–79). NIP-71: Video Events.
// Erin (the artist persona) publishes a time-lapse of her daily drawing.
import type { FieldType, NipSpec, TagFieldSpec, TagSpec } from "../spec.ts";

const SHA_1080 = "3093509d1e0bc604ff60cb9286f4cd7c781553bc8991937befaacfdc28ec5cdc";
const SHA_720 = "e1d4f808dae475ed32fb23ce52ef8ac82e3cc760702fca10d62d382d2da3697d";
const SHA_AUDIO = "b2e0a7a82ac9f3f3a71f1d9a78c381d5be9d1cf19dce258765c17c8a76287c93";
const SHA_SHORT = "704e720af2697f5d6a198ad377789d462054b6e8d790f8a3903afbc1e044014f";
const ALICE = "e550c6e92808f358382b7b8c14345344f5ef9a299529834d1c26d57b6ace44cc";

const TIME: FieldType = { type: "text", pattern: "\\d{2}:\\d{2}:\\d{2}(\\.\\d{1,3})?" };
const imetaEntry: TagFieldSpec = {
  name: "key value",
  type: { type: "text", pattern: "[a-z][a-z0-9-]* \\S.*" },
  explain: "video.tag.imeta.entry",
  placeholder: "dim 1920x1080",
};

/** Tags shared by regular (21/22) and addressable (34235/34236) videos. */
const common: readonly TagSpec[] = [
  {
    name: "title",
    explain: "video.tag.title",
    presence: "required",
    repeatable: false,
    fields: [
      { name: "title", type: { type: "text", minLength: 1 }, explain: "video.tag.title.text" },
    ],
  },
  {
    name: "imeta",
    explain: "video.tag.imeta",
    presence: "required",
    repeatable: true,
    fields: [imetaEntry],
    rest: imetaEntry,
    template: [
      "imeta",
      "url https://",
      "m video/mp4",
      "dim 1920x1080",
      "x ",
      "duration ",
      "bitrate ",
    ],
  },
  {
    name: "published_at",
    explain: "video.tag.published_at",
    presence: "optional",
    repeatable: false,
    fields: [
      { name: "timestamp", type: { type: "timestamp" }, explain: "video.tag.published_at.ts" },
    ],
  },
  {
    name: "alt",
    explain: "video.tag.alt",
    presence: "optional",
    repeatable: false,
    fields: [{ name: "description", type: { type: "text" }, explain: "video.tag.alt.text" }],
  },
  {
    name: "text-track",
    explain: "video.tag.text-track",
    presence: "optional",
    repeatable: true,
    fields: [
      { name: "url", type: { type: "url" }, explain: "video.tag.text-track.url" },
      {
        name: "type",
        type: {
          type: "enum",
          open: true,
          values: [
            { value: "captions" },
            { value: "subtitles" },
            { value: "chapters" },
            { value: "metadata" },
          ],
        },
        explain: "video.tag.text-track.type",
        optional: true,
      },
      {
        name: "language",
        type: { type: "text" },
        explain: "video.tag.text-track.lang",
        optional: true,
      },
    ],
  },
  {
    name: "content-warning",
    explain: "video.tag.content-warning",
    presence: "optional",
    repeatable: false,
    fields: [
      {
        name: "reason",
        type: { type: "text" },
        explain: "video.tag.content-warning.reason",
        optional: true,
      },
    ],
  },
  {
    name: "segment",
    explain: "video.tag.segment",
    presence: "optional",
    repeatable: true,
    fields: [
      { name: "start", type: TIME, explain: "video.tag.segment.start" },
      { name: "end", type: TIME, explain: "video.tag.segment.end" },
      { name: "title", type: { type: "text" }, explain: "video.tag.segment.title" },
      {
        name: "thumbnail",
        type: { type: "url" },
        explain: "video.tag.segment.thumb",
        optional: true,
      },
    ],
  },
  {
    name: "t",
    explain: "video.tag.t",
    presence: "optional",
    repeatable: true,
    fields: [{ name: "hashtag", type: { type: "text" }, explain: "video.tag.t.tag" }],
  },
  {
    name: "p",
    explain: "video.tag.p",
    presence: "optional",
    repeatable: true,
    fields: [
      { name: "pubkey", type: { type: "pubkey" }, explain: "video.tag.p.pubkey" },
      { name: "relay", type: { type: "relay-url" }, explain: "video.tag.p.relay", optional: true },
    ],
  },
  {
    name: "r",
    explain: "video.tag.r",
    presence: "optional",
    repeatable: true,
    fields: [{ name: "url", type: { type: "url" }, explain: "video.tag.r.url" }],
  },
  {
    name: "origin",
    explain: "video.tag.origin",
    presence: "optional",
    repeatable: false,
    fields: [
      { name: "platform", type: { type: "text" }, explain: "video.tag.origin.platform" },
      { name: "external-id", type: { type: "text" }, explain: "video.tag.origin.id" },
      {
        name: "original-url",
        type: { type: "url" },
        explain: "video.tag.origin.url",
        optional: true,
      },
      {
        name: "metadata",
        type: { type: "text" },
        explain: "video.tag.origin.meta",
        optional: true,
      },
    ],
  },
  {
    name: "duration",
    explain: "video.tag.duration",
    presence: "optional",
    repeatable: false,
    fields: [
      { name: "seconds", type: { type: "number", min: 0 }, explain: "video.tag.duration.seconds" },
    ],
  },
];

export const nip71: NipSpec = {
  nip: "71",
  variant: "event",
  howItWorks: [
    {
      id: "kinds",
      title: "how.kinds.title",
      body: "how.kinds.body",
      focus: { part: { kind: "event", id: "video" }, path: ["kind"] },
    },
    {
      id: "variants",
      title: "how.variants.title",
      body: "how.variants.body",
      focus: { part: { kind: "event", id: "video" }, path: ["tags", 1] },
    },
    {
      id: "fallbacks",
      title: "how.fallbacks.title",
      body: "how.fallbacks.body",
      focus: { part: { kind: "event", id: "video" }, path: ["tags", 1] },
    },
    {
      id: "audio",
      title: "how.audio.title",
      body: "how.audio.body",
      focus: { part: { kind: "event", id: "video" }, path: ["tags", 3] },
    },
    {
      id: "addressable",
      title: "how.addressable.title",
      body: "how.addressable.body",
      focus: { part: { kind: "event", id: "addressable-video" }, path: ["tags", 0] },
    },
  ],
  related: [
    { nip: "92", relation: "depends-on", explain: "related.92" },
    { nip: "94", relation: "see-also", explain: "related.94" },
    { nip: "96", relation: "see-also", explain: "related.96" },
    { nip: "68", relation: "see-also", explain: "related.68" },
    { nip: "01", relation: "depends-on", explain: "related.01" },
  ],
  events: [
    {
      id: "video",
      label: "video.label",
      explain: "video.explain",
      kinds: [21, 22],
      content: { format: "text", explain: "video.content", multiline: true },
      tags: common,
      examples: [
        {
          id: "timelapse",
          label: "video.example.normal.label",
          explain: "video.example.normal.explain",
          signer: "erin",
          template: {
            kind: 21,
            tags: [
              ["title", "Drawing an orange ostrich in 30 seconds"],
              [
                "imeta",
                "dim 1920x1080",
                `url https://media.alpha.example/1080/${SHA_1080}.mp4`,
                `x ${SHA_1080}`,
                "m video/mp4",
                `image https://media.alpha.example/1080/${SHA_1080}.jpg`,
                `fallback https://media.gamma.example/1080/${SHA_1080}.mp4`,
                "service nip96",
                "bitrate 3000000",
                "duration 29.223",
              ],
              [
                "imeta",
                "dim 1280x720",
                `url https://media.alpha.example/720/${SHA_720}.mp4`,
                `x ${SHA_720}`,
                "m video/mp4",
                `image https://media.alpha.example/720/${SHA_720}.jpg`,
                "bitrate 2000000",
                "duration 29.24",
              ],
              [
                "imeta",
                `url https://media.alpha.example/audio/en/${SHA_AUDIO}.mp3`,
                `x ${SHA_AUDIO}`,
                "m audio/mp3",
                "waveform 0 7 35 8 100 100 49 8 4 16 8 10 7 2 20 10 100 100 100 100",
                "l en ISO-639-1 ov",
                "bitrate 320000",
                "duration 29.24",
              ],
              ["published_at", "1735603200"],
              ["alt", "Time-lapse of a pen drawing of an orange ostrich wearing sneakers"],
              ["segment", "00:00:00.000", "00:00:12.000", "Sketch"],
              ["segment", "00:00:12.000", "00:00:29.200", "Ink and colour"],
              ["t", "art"],
              ["t", "timelapse"],
            ],
            content: "Today's weird animal, start to finish. Commentary track in English.",
          },
        },
        {
          id: "short",
          label: "video.example.short.label",
          explain: "video.example.short.explain",
          signer: "erin",
          template: {
            kind: 22,
            tags: [
              ["title", "Ostrich reveal"],
              [
                "imeta",
                "dim 1080x1920",
                `url https://media.alpha.example/short/${SHA_SHORT}.mp4`,
                `x ${SHA_SHORT}`,
                "m video/mp4",
                "duration 8.5",
              ],
              ["p", ALICE, "wss://relay.alpha.example"],
              ["t", "art"],
            ],
            content: "Alice asked for the reveal in portrait. Here you go!",
          },
        },
      ],
    },
    {
      id: "addressable-video",
      label: "addressable.label",
      explain: "addressable.explain",
      kinds: [34235, 34236],
      content: { format: "text", explain: "video.content", multiline: true },
      tags: [
        {
          name: "d",
          explain: "addressable.tag.d",
          presence: "required",
          repeatable: false,
          fields: [
            {
              name: "identifier",
              type: { type: "text", minLength: 1 },
              explain: "addressable.tag.d.id",
            },
          ],
        },
        ...common,
      ],
      examples: [
        {
          id: "imported",
          label: "addressable.example.label",
          explain: "addressable.example.explain",
          signer: "erin",
          template: {
            kind: 34235,
            tags: [
              ["d", "weird-animals-ep-001"],
              ["title", "Weird Animals, episode 1: the sock-wearing ostrich"],
              [
                "imeta",
                `url https://media.alpha.example/${SHA_1080}.mp4`,
                "m video/mp4",
                "dim 1920x1080",
                `image https://media.alpha.example/${SHA_1080}.jpg`,
                `x ${SHA_1080}`,
              ],
              ["published_at", "1704067200"],
              ["duration", "312"],
              ["origin", "peertube", "8f2k1x9q", "https://video.alpha.example/w/8f2k1x9q"],
              ["t", "art"],
            ],
            content: "First episode, moved over from my old channel.",
          },
        },
      ],
    },
  ],
};
