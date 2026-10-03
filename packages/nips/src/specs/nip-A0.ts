// Owner: spec author r6 (NIPs letter ids). NIP-A0: Voice Messages (kind 1222 root, kind 1244
// NIP-22-style reply). Explanations: packages/i18n/src/locales/en/nips/r6.ts → nA0.text.
import type { NipSpec, TagSpec } from "../spec.ts";
import { ALPHA, BOB, commentTags, FIXTURE_NOW } from "./r6-common.ts";

export const NIPA0_VOICE_URL =
  "https://blossom.alpha.example/7f86b5ad51a70541fcb26a6abd71b32fed067a353f24d0ddd87c10ce284e7278.m4a";
const REPLY_URL =
  "https://blossom.alpha.example/c23f4653aaaeb8c05917b47998dcb973b6fddd8c6a8bb547723f970101ab67bf.m4a";
/** Id of the "intro" root voice message signed by bob at FIXTURE_NOW (r6.test.ts checks it). */
export const NIPA0_ROOT_ID = "e6162ab5b6e8ef3ece05579f6bd0d1aa39b8dd27f625819e3fd6d916ef46722f";

const WAVEFORM =
  "waveform 0 7 35 8 100 100 49 8 4 16 8 10 7 2 20 10 100 100 100 100 100 100 15 100 100 100 25 60 5 4 3 1 0 100 100 15 100 29 88 0 33 11 39 100 100 19 4 100 42 35 5 0 1 5 0";

const voice = { kind: "event", id: "voice" } as const;
const reply = { kind: "event", id: "reply" } as const;

const audioContent = {
  format: "text",
  explain: "content.audio",
  required: true,
  field: { type: "url" },
} as const;

/** Optional extras shared by both kinds: NIP-92 imeta preview, hashtags, geohash. */
const extras: readonly TagSpec[] = [
  {
    name: "imeta",
    explain: "tag.imeta",
    presence: "optional",
    repeatable: false,
    fields: [
      {
        name: "url",
        type: { type: "text", pattern: "url https?://\\S+" },
        explain: "tag.imeta.url",
        placeholder: "url https://…",
      },
    ],
    rest: {
      name: "property",
      type: { type: "text", pattern: "[a-z_-]+ \\S.*" },
      explain: "tag.imeta.property",
      placeholder: "duration 8",
    },
  },
  {
    name: "t",
    explain: "tag.t",
    presence: "optional",
    repeatable: true,
    fields: [{ name: "hashtag", type: { type: "text", minLength: 1 }, explain: "tag.t.value" }],
  },
  {
    name: "g",
    explain: "tag.g",
    presence: "optional",
    repeatable: true,
    fields: [
      {
        name: "geohash",
        type: { type: "text", pattern: "[0-9b-hjkmnp-z]{1,12}" },
        explain: "tag.g.value",
      },
    ],
  },
];

export const nipA0: NipSpec = {
  nip: "A0",
  variant: "event",
  howItWorks: [
    {
      id: "record",
      title: "how.record.title",
      body: "how.record.body",
      focus: { part: voice, path: ["content"] },
    },
    { id: "format", title: "how.format.title", body: "how.format.body" },
    {
      id: "preview",
      title: "how.preview.title",
      body: "how.preview.body",
      focus: { part: voice, path: ["tags", 0] },
    },
    { id: "reply", title: "how.reply.title", body: "how.reply.body", focus: { part: reply } },
  ],
  related: [
    { nip: "22", relation: "depends-on", explain: "related.22" },
    { nip: "92", relation: "depends-on", explain: "related.92" },
    { nip: "B7", relation: "see-also", explain: "related.B7" },
  ],
  flows: [
    {
      id: "conversation",
      label: "flow.conversation.label",
      explain: "flow.conversation.explain",
      steps: [
        { part: voice, explain: "flow.conversation.voice" },
        { part: reply, explain: "flow.conversation.reply" },
      ],
    },
  ],
  events: [
    {
      id: "voice",
      label: "event.voice.label",
      explain: "event.voice.explain",
      kinds: [1222],
      content: audioContent,
      tags: extras,
      examples: [
        {
          id: "intro",
          label: "example.intro",
          explain: "example.intro.explain",
          signer: "bob",
          template: {
            kind: 1222,
            created_at: FIXTURE_NOW,
            tags: [
              ["imeta", `url ${NIPA0_VOICE_URL}`, "m audio/mp4", WAVEFORM, "duration 8"],
              ["t", "introductions"],
            ],
            content: NIPA0_VOICE_URL,
          },
        },
        {
          id: "plain",
          label: "example.plain",
          signer: "dave",
          template: {
            kind: 1222,
            tags: [["g", "u4pruyd"]],
            content:
              "https://blossom.alpha.example/3b2c1d7e0f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c.m4a",
          },
        },
      ],
    },
    {
      id: "reply",
      label: "event.reply.label",
      explain: "event.reply.explain",
      kinds: [1244],
      content: audioContent,
      tags: [...commentTags([1222, 1244], "event"), ...extras],
      examples: [
        {
          id: "answer",
          label: "example.answer",
          explain: "example.answer.explain",
          signer: "carol",
          template: {
            kind: 1244,
            created_at: FIXTURE_NOW + 300,
            tags: [
              ["E", NIPA0_ROOT_ID, ALPHA, BOB],
              ["K", "1222"],
              ["P", BOB],
              ["e", NIPA0_ROOT_ID, ALPHA, BOB],
              ["k", "1222"],
              ["p", BOB],
              ["imeta", `url ${REPLY_URL}`, "m audio/mp4", "duration 5"],
            ],
            content: REPLY_URL,
          },
        },
      ],
    },
  ],
};
