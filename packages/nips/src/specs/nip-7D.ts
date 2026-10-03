// Owner: spec author r6 (NIPs letter ids). NIP-7D: Forum Threads (kind 11 + NIP-22 replies).
// Explanations: packages/i18n/src/locales/en/nips/r6.ts → n7D.text.
import type { NipSpec } from "../spec.ts";
import { ALICE, ALPHA, commentTags, FIXTURE_NOW, textTag } from "./r6-common.ts";

/** Id of the "home-relays" thread signed by alice at FIXTURE_NOW (r6.test.ts checks it). */
export const NIP7D_THREAD_ID = "4058b7a64f4046cf267a0c25795e7c57b0bdda042abe6614aff2e6abca9173e6";

const thread = { kind: "event", id: "thread" } as const;
const reply = { kind: "event", id: "reply" } as const;

export const nip7D: NipSpec = {
  nip: "7D",
  variant: "event",
  howItWorks: [
    {
      id: "thread",
      title: "how.thread.title",
      body: "how.thread.body",
      focus: { part: thread, path: ["kind"] },
    },
    {
      id: "title",
      title: "how.title.title",
      body: "how.title.body",
      focus: { part: thread, path: ["tags", 0] },
    },
    { id: "reply", title: "how.reply.title", body: "how.reply.body", focus: { part: reply } },
    {
      id: "flat",
      title: "how.flat.title",
      body: "how.flat.body",
      focus: { part: reply, path: ["tags", 1] },
    },
    { id: "fetch", title: "how.fetch.title", body: "how.fetch.body" },
  ],
  related: [
    { nip: "22", relation: "depends-on", explain: "related.22" },
    { nip: "C7", relation: "see-also", explain: "related.C7" },
    { nip: "01", relation: "depends-on", explain: "related.01" },
  ],
  flows: [
    {
      id: "discussion",
      label: "flow.discussion.label",
      explain: "flow.discussion.explain",
      steps: [
        { part: thread, explain: "flow.discussion.thread" },
        { part: reply, explain: "flow.discussion.reply" },
      ],
    },
  ],
  events: [
    {
      id: "thread",
      label: "event.thread.label",
      explain: "event.thread.explain",
      kinds: [11],
      content: { format: "text", explain: "content.thread", required: true, multiline: true },
      tags: [textTag("title", "recommended")],
      examples: [
        {
          id: "home-relays",
          label: "example.home-relays",
          explain: "example.home-relays.explain",
          signer: "alice",
          template: {
            kind: 11,
            created_at: FIXTURE_NOW,
            tags: [["title", "Home relays"]],
            content: "Which relay do you run at home, and why?",
          },
        },
        {
          id: "gm",
          label: "example.gm",
          signer: "dave",
          template: { kind: 11, tags: [["title", "GM"]], content: "Good morning, forum!" },
        },
      ],
    },
    {
      id: "reply",
      label: "event.reply.label",
      explain: "event.reply.explain",
      kinds: [1111],
      content: { format: "text", explain: "content.reply", required: true, multiline: true },
      tags: commentTags([11], "event"),
      examples: [
        {
          id: "answer",
          label: "example.answer",
          explain: "example.answer.explain",
          signer: "bob",
          template: {
            kind: 1111,
            created_at: FIXTURE_NOW + 600,
            tags: [
              ["E", NIP7D_THREAD_ID, ALPHA, ALICE],
              ["K", "11"],
              ["P", ALICE],
              ["e", NIP7D_THREAD_ID, ALPHA, ALICE],
              ["k", "11"],
              ["p", ALICE],
            ],
            content:
              "A small strfry box on a Raspberry Pi. Cheap, quiet, and it keeps my notes at home.",
          },
        },
      ],
    },
  ],
};
