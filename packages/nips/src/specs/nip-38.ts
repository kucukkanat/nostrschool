// Owner: spec author r2 (NIPs 20–39). NIP-38: User Statuses (kind 30315).
import type { NipSpec } from "../spec.ts";

export const nip38: NipSpec = {
  nip: "38",
  variant: "event",
  howItWorks: [
    {
      id: "type",
      title: "how.type.title",
      body: "how.type.body",
      focus: { part: { kind: "event", id: "status" }, path: ["tags", 0] },
    },
    {
      id: "content",
      title: "how.content.title",
      body: "how.content.body",
      focus: { part: { kind: "event", id: "status" }, path: ["content"] },
    },
    {
      id: "link",
      title: "how.link.title",
      body: "how.link.body",
      focus: { part: { kind: "event", id: "status" }, path: ["tags", 1] },
    },
    { id: "expire", title: "how.expire.title", body: "how.expire.body" },
    { id: "clear", title: "how.clear.title", body: "how.clear.body" },
  ],
  related: [
    { nip: "40", relation: "depends-on", explain: "related.40" },
    { nip: "30", relation: "see-also", explain: "related.30" },
    { nip: "01", relation: "depends-on", explain: "related.01" },
  ],
  events: [
    {
      id: "status",
      label: "event.status.label",
      explain: "event.status.explain",
      kinds: [30315],
      content: { format: "text", explain: "content" },
      tags: [
        {
          name: "d",
          explain: "tag.d",
          presence: "required",
          repeatable: false,
          fields: [
            {
              name: "type",
              type: {
                type: "enum",
                values: [
                  { value: "general", explain: "type.general" },
                  { value: "music", explain: "type.music" },
                ],
                open: true,
              },
              explain: "tag.d.value",
            },
          ],
        },
        {
          name: "r",
          explain: "tag.r",
          presence: "optional",
          repeatable: false,
          fields: [
            {
              name: "url",
              type: { type: "url", schemes: ["http", "https", "spotify", "nostr"] },
              explain: "tag.r.value",
            },
          ],
        },
        {
          name: "p",
          explain: "tag.p",
          presence: "optional",
          repeatable: false,
          fields: [
            { name: "pubkey", type: { type: "pubkey" }, explain: "tag.p.value" },
            { name: "relay", type: { type: "relay-url" }, explain: "tag.relay", optional: true },
          ],
        },
        {
          name: "e",
          explain: "tag.e",
          presence: "optional",
          repeatable: false,
          fields: [
            { name: "event-id", type: { type: "event-id" }, explain: "tag.e.value" },
            { name: "relay", type: { type: "relay-url" }, explain: "tag.relay", optional: true },
          ],
        },
        {
          name: "a",
          explain: "tag.a",
          presence: "optional",
          repeatable: false,
          fields: [
            { name: "address", type: { type: "addr" }, explain: "tag.a.value" },
            { name: "relay", type: { type: "relay-url" }, explain: "tag.relay", optional: true },
          ],
        },
        {
          name: "expiration",
          explain: "tag.expiration",
          presence: "optional",
          repeatable: false,
          fields: [
            { name: "timestamp", type: { type: "timestamp" }, explain: "tag.expiration.value" },
          ],
        },
      ],
      examples: [
        {
          id: "general",
          label: "example.general",
          signer: "alice",
          template: {
            kind: 30315,
            tags: [
              ["d", "general"],
              [
                "a",
                "30023:922e43b50aec16ad1e9d1ec6854c058816d28b944ae2fe9bdce3d9241bfaafb8:protocols-not-platforms",
                "wss://relay.beta.example",
              ],
            ],
            content: "Reading Frank's essay 📖",
          },
        },
        {
          id: "music",
          label: "example.music",
          explain: "example.music.explain",
          signer: "bob",
          template: {
            kind: 30315,
            tags: [
              ["d", "music"],
              ["r", "spotify:search:Intergalactic%20-%20Beastie%20Boys"],
              ["expiration", "1735689831"],
            ],
            content: "Intergalactic - Beastie Boys",
          },
        },
        {
          id: "clear",
          label: "example.clear",
          explain: "example.clear.explain",
          signer: "alice",
          template: { kind: 30315, tags: [["d", "general"]], content: "" },
        },
      ],
    },
  ],
};
