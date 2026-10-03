// Owner: spec author r6 (NIPs letter ids). NIP-C7: Chats (kind 9, replies quote with `q`).
// Explanations: packages/i18n/src/locales/en/nips/r6.ts → nC7.text.
import type { NipSpec } from "../spec.ts";
import { ALICE, ALPHA, FIXTURE_NOW, RELAY_HINT } from "./r6-common.ts";

/** Id of the "gm" example signed by alice at FIXTURE_NOW (r6.test.ts checks it). */
export const NIPC7_GM_ID = "c625c8755f534bc0f8fc0de326fc545e9bc4f007fc3f1e0bfd95cac0d55e1274";
/** nevent of that message (id, relay alpha, author alice, kind 9). */
export const NIPC7_GM_NEVENT =
  "nevent1qqsvvfwgw404xj7qlr7qmcexl329ax7y7qrlc0c7p07etjkq640pyaqpr9mhxue69uhhyetvv9ujuctvwp5xztn90psk6urvv5pzpe2scm5jsz8ntquzk7uvzs69x384a7dzn9ffsdx3cfk40d4vu3xvqvzqqqqqpyl9wxek";

const chat = { kind: "event", id: "chat" } as const;

export const nipC7: NipSpec = {
  nip: "C7",
  variant: "event",
  howItWorks: [
    {
      id: "message",
      title: "how.message.title",
      body: "how.message.body",
      focus: { part: chat, path: ["content"] },
    },
    {
      id: "quote",
      title: "how.quote.title",
      body: "how.quote.body",
      focus: { part: chat, path: ["tags", 0] },
    },
    { id: "mention", title: "how.mention.title", body: "how.mention.body" },
    { id: "stream", title: "how.stream.title", body: "how.stream.body" },
  ],
  related: [
    { nip: "18", relation: "depends-on", explain: "related.18" },
    { nip: "21", relation: "depends-on", explain: "related.21" },
    { nip: "29", relation: "used-by", explain: "related.29" },
    { nip: "7D", relation: "see-also", explain: "related.7D" },
  ],
  events: [
    {
      id: "chat",
      label: "event.chat.label",
      explain: "event.chat.explain",
      kinds: [9],
      content: { format: "text", explain: "content.chat", required: true, multiline: true },
      tags: [
        {
          name: "q",
          explain: "tag.q",
          presence: "optional",
          repeatable: true,
          fields: [
            { name: "event-id", type: { type: "event-id" }, explain: "tag.q.id" },
            RELAY_HINT,
            { name: "pubkey", type: { type: "pubkey" }, explain: "tag.q.pubkey", optional: true },
          ],
        },
      ],
      examples: [
        {
          id: "gm",
          label: "example.gm",
          explain: "example.gm.explain",
          signer: "alice",
          template: { kind: 9, created_at: FIXTURE_NOW, tags: [], content: "GM" },
        },
        {
          id: "reply",
          label: "example.reply",
          explain: "example.reply.explain",
          signer: "bob",
          template: {
            kind: 9,
            created_at: FIXTURE_NOW + 60,
            tags: [["q", NIPC7_GM_ID, ALPHA, ALICE]],
            content: `nostr:${NIPC7_GM_NEVENT}\nGM! Coffee first, then relays.`,
          },
        },
      ],
    },
  ],
};
