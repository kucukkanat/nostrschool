// Owner: spec author r2 (NIPs 20–39). NIP-39: External identities (kind 10011 i tags).
import type { NipSpec } from "../spec.ts";

export const nip39: NipSpec = {
  nip: "39",
  variant: "event",
  howItWorks: [
    {
      id: "claim",
      title: "how.claim.title",
      body: "how.claim.body",
      focus: { part: { kind: "event", id: "identities" }, path: ["tags", 0, 1] },
    },
    { id: "proof-text", title: "how.proof-text.title", body: "how.proof-text.body" },
    {
      id: "proof",
      title: "how.proof.title",
      body: "how.proof.body",
      focus: { part: { kind: "event", id: "identities" }, path: ["tags", 0, 2] },
    },
    { id: "verify", title: "how.verify.title", body: "how.verify.body" },
  ],
  related: [
    { nip: "05", relation: "see-also", explain: "related.05" },
    { nip: "19", relation: "depends-on", explain: "related.19" },
    { nip: "73", relation: "see-also", explain: "related.73" },
  ],
  events: [
    {
      id: "identities",
      label: "event.identities.label",
      explain: "event.identities.explain",
      kinds: [10011],
      content: { format: "empty" },
      tags: [
        {
          name: "i",
          explain: "tag.i",
          presence: "recommended",
          repeatable: true,
          fields: [
            {
              name: "platform:identity",
              type: { type: "text", pattern: "[a-z0-9._/-]+:.+" },
              explain: "tag.i.claim",
              placeholder: "github:alice",
            },
            { name: "proof", type: { type: "text", minLength: 1 }, explain: "tag.i.proof" },
          ],
          rest: { name: "extra", type: { type: "text" }, explain: "tag.i.extra" },
        },
      ],
      examples: [
        {
          id: "alice",
          label: "example.alice",
          explain: "example.alice.explain",
          signer: "alice",
          template: {
            kind: 10011,
            tags: [
              ["i", "github:alice-nostr", "9721ce4ee4fceb91c9711ca2a6c9a5ab"],
              ["i", "bluesky:alice.bsky.social", "3lb2k7xq4ys2c"],
              ["i", "mastodon:fosstodon.org/@alice", "113759284611230457"],
            ],
            content: "",
          },
        },
        {
          id: "frank",
          label: "example.frank",
          signer: "frank",
          template: {
            kind: 10011,
            tags: [
              ["i", "telegram:1087295469", "openwebjournal/770"],
              [
                "i",
                "discord:frank.writes",
                "1009848542390399027/1009848543106883634/1325563114471329792",
              ],
            ],
            content: "",
          },
        },
      ],
    },
  ],
};
