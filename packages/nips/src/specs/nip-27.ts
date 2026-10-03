// Owner: spec author r2 (NIPs 20–39). NIP-27: Text Note References (nostr: mentions in content).
import type { NipSpec } from "../spec.ts";

const BOB = "a73883912a48c3551c1548fd454876d577126a61c76b5486c807bfec5869e183";
const ERIN = "c71750007e42443e5ca8c1ea00babed4e8c78a9cb45dd6db3733d918e0b55deb";
const BOB_NOTE = "814d487f9a9591bde04009eff371facb26e82f3a41cec1bcdcdab310075053be";
const NPUB_ERIN = "npub1cut4qqr7gfzruh9gc84qpw476n5v0z5uk3wadkehx0v33c94th4sp5w043";
const NPUB_BOB = "npub15uug8yf2frp428q4fr752jrk64m3y6npca44fpkgq7l7ckrfuxpsj5l3x6";
const NPROFILE_DAVE =
  "nprofile1qqspcq5t88nlxg5ygjejv8jtwx804y4fz3cqs66yexnjaaf406tszjqpr9mhxue69uhhyetvv9ujuer9d36xztn90psk6urvv5kcljp3";

export const nip27: NipSpec = {
  nip: "27",
  variant: "event",
  howItWorks: [
    {
      id: "write",
      title: "how.write.title",
      body: "how.write.body",
      focus: { part: { kind: "event", id: "note" }, path: ["content"] },
    },
    {
      id: "tags",
      title: "how.tags.title",
      body: "how.tags.body",
      focus: { part: { kind: "event", id: "note" }, path: ["tags", 0] },
    },
    { id: "read", title: "how.read.title", body: "how.read.body" },
    { id: "silent", title: "how.silent.title", body: "how.silent.body" },
  ],
  related: [
    { nip: "21", relation: "depends-on", explain: "related.21" },
    { nip: "19", relation: "depends-on", explain: "related.19" },
    { nip: "18", relation: "see-also", explain: "related.18" },
    { nip: "23", relation: "used-by", explain: "related.23" },
  ],
  events: [
    {
      id: "note",
      label: "event.note.label",
      explain: "event.note.explain",
      kinds: [1, 30023, 1111],
      content: { format: "text", explain: "content", required: true, multiline: true },
      tags: [
        {
          name: "p",
          explain: "tag.p",
          presence: "optional",
          repeatable: true,
          fields: [
            { name: "pubkey", type: { type: "pubkey" }, explain: "tag.p.pubkey" },
            { name: "relay", type: { type: "relay-url" }, explain: "tag.relay", optional: true },
          ],
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
            { name: "relay", type: { type: "relay-url" }, explain: "tag.relay", optional: true },
            { name: "pubkey", type: { type: "pubkey" }, explain: "tag.q.pubkey", optional: true },
          ],
        },
      ],
      examples: [
        {
          id: "mention",
          label: "example.mention",
          explain: "example.mention.explain",
          signer: "alice",
          template: {
            kind: 1,
            tags: [
              ["p", ERIN, "wss://relay.alpha.example"],
              ["p", BOB, "wss://relay.beta.example"],
            ],
            content: `Welcome Grace! Try following nostr:${NPUB_ERIN} for art and nostr:${NPUB_BOB} for good questions.`,
          },
        },
        {
          id: "quote",
          label: "example.quote",
          explain: "example.quote.explain",
          signer: "carol",
          template: {
            kind: 1,
            tags: [
              ["q", BOB_NOTE, "wss://relay.beta.example", BOB],
              ["p", BOB, "wss://relay.beta.example"],
            ],
            content:
              "This! 👇\nnostr:note1s9x5slu6jkgmmczqp8hlxu06evnwste6g88vr0xum2e3qp6s2wlqz09zra",
          },
        },
        {
          id: "silent",
          label: "example.silent",
          explain: "example.silent.explain",
          signer: "grace",
          template: {
            kind: 1,
            tags: [],
            content: `Reading the relay AMA by nostr:${NPROFILE_DAVE} without pinging him.`,
          },
        },
      ],
    },
  ],
};
