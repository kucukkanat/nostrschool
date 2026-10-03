// Owner: spec author r4 (NIPs 60–79). NIP-75: Zap Goals.
// Erin raises money for art supplies; frank links a goal from his long-form article.
import type { NipSpec } from "../spec.ts";

const ERIN = "c71750007e42443e5ca8c1ea00babed4e8c78a9cb45dd6db3733d918e0b55deb";
const ALICE = "e550c6e92808f358382b7b8c14345344f5ef9a299529834d1c26d57b6ace44cc";
// Stand-in id for erin's goal event (the real id depends on the demo signature).
const GOAL_ID = "5d2c8e1f4a7b0c3d6e9f2a5b8c1d4e7f0a3b6c9d2e5f8a1b4c7d0e3f6a9b2c5d";

export const nip75: NipSpec = {
  nip: "75",
  variant: "event",
  howItWorks: [
    {
      id: "goal",
      title: "how.goal.title",
      body: "how.goal.body",
      focus: { part: { kind: "event", id: "goal" }, path: ["tags", 1] },
    },
    {
      id: "relays",
      title: "how.relays.title",
      body: "how.relays.body",
      focus: { part: { kind: "event", id: "goal" }, path: ["tags", 0] },
    },
    { id: "tally", title: "how.tally.title", body: "how.tally.body" },
    {
      id: "split",
      title: "how.split.title",
      body: "how.split.body",
      focus: { part: { kind: "event", id: "goal" }, path: ["tags"] },
    },
    {
      id: "link",
      title: "how.link.title",
      body: "how.link.body",
      focus: { part: { kind: "event", id: "goal-link" }, path: ["tags", 2] },
    },
  ],
  related: [
    { nip: "57", relation: "depends-on", explain: "related.57" },
    { nip: "23", relation: "see-also", explain: "related.23" },
    { nip: "53", relation: "see-also", explain: "related.53" },
  ],
  flows: [
    {
      id: "fundraise",
      label: "flow.label",
      explain: "flow.explain",
      steps: [
        { part: { kind: "event", id: "goal" }, explain: "flow.goal" },
        { part: { kind: "event", id: "goal-link" }, explain: "flow.link" },
      ],
    },
  ],
  events: [
    {
      id: "goal",
      label: "goal.label",
      explain: "goal.explain",
      kinds: [9041],
      content: { format: "text", explain: "goal.content", required: true },
      tags: [
        {
          name: "relays",
          explain: "goal.tag.relays",
          presence: "required",
          repeatable: false,
          fields: [{ name: "relay", type: { type: "relay-url" }, explain: "goal.tag.relays.url" }],
          rest: { name: "relay", type: { type: "relay-url" }, explain: "goal.tag.relays.url" },
        },
        {
          name: "amount",
          explain: "goal.tag.amount",
          presence: "required",
          repeatable: false,
          fields: [
            {
              name: "millisats",
              type: { type: "number", integer: true, min: 1 },
              explain: "goal.tag.amount.msats",
            },
          ],
        },
        {
          name: "closed_at",
          explain: "goal.tag.closed_at",
          presence: "optional",
          repeatable: false,
          fields: [
            { name: "timestamp", type: { type: "timestamp" }, explain: "goal.tag.closed_at.ts" },
          ],
        },
        {
          name: "image",
          explain: "goal.tag.image",
          presence: "optional",
          repeatable: false,
          fields: [{ name: "url", type: { type: "url" }, explain: "goal.tag.image.url" }],
        },
        {
          name: "summary",
          explain: "goal.tag.summary",
          presence: "optional",
          repeatable: false,
          fields: [{ name: "text", type: { type: "text" }, explain: "goal.tag.summary.text" }],
        },
        {
          name: "r",
          explain: "goal.tag.r",
          presence: "optional",
          repeatable: true,
          fields: [{ name: "url", type: { type: "url" }, explain: "goal.tag.r.url" }],
        },
        {
          name: "a",
          explain: "goal.tag.a",
          presence: "optional",
          repeatable: true,
          fields: [{ name: "address", type: { type: "addr" }, explain: "goal.tag.a.address" }],
        },
        {
          name: "zap",
          explain: "goal.tag.zap",
          presence: "optional",
          repeatable: true,
          fields: [
            { name: "pubkey", type: { type: "pubkey" }, explain: "goal.tag.zap.pubkey" },
            { name: "relay", type: { type: "relay-url" }, explain: "goal.tag.zap.relay" },
            {
              name: "weight",
              type: { type: "number", min: 0 },
              explain: "goal.tag.zap.weight",
              optional: true,
            },
          ],
        },
      ],
      examples: [
        {
          id: "simple",
          label: "goal.example.simple.label",
          explain: "goal.example.simple.explain",
          signer: "erin",
          template: {
            kind: 9041,
            tags: [
              ["relays", "wss://relay.alpha.example", "wss://relay.gamma.example"],
              ["amount", "210000000"],
            ],
            content: "New pens and a pad of good paper for 2025",
          },
        },
        {
          id: "full",
          label: "goal.example.full.label",
          explain: "goal.example.full.explain",
          signer: "erin",
          template: {
            kind: 9041,
            tags: [
              ["relays", "wss://relay.alpha.example", "wss://relay.gamma.example"],
              ["amount", "500000000"],
              // FIXTURE_NOW + 30 days.
              ["closed_at", "1738281600"],
              ["image", "https://media.alpha.example/zine-cover.png"],
              ["summary", "Print 100 copies of the Weird Animals zine"],
              ["r", "https://erin.alpha.example/zine"],
              ["zap", ERIN, "wss://relay.alpha.example", "3"],
              ["zap", ALICE, "wss://relay.alpha.example", "1"],
            ],
            content:
              "Weird Animals zine, volume one. Alice is doing the layout, so she gets a quarter.",
          },
        },
      ],
    },
    {
      id: "goal-link",
      label: "link.label",
      explain: "link.explain",
      kinds: [{ from: 30000, to: 39999 }],
      content: { format: "text", explain: "link.content" },
      tags: [
        {
          name: "goal",
          explain: "link.tag.goal",
          presence: "required",
          repeatable: false,
          fields: [
            { name: "event-id", type: { type: "event-id" }, explain: "link.tag.goal.id" },
            {
              name: "relay",
              type: { type: "relay-url" },
              explain: "link.tag.goal.relay",
              optional: true,
            },
          ],
        },
      ],
      examples: [
        {
          id: "article",
          label: "link.example.label",
          explain: "link.example.explain",
          signer: "frank",
          template: {
            kind: 30023,
            tags: [
              ["d", "why-i-fund-artists"],
              ["title", "Why I fund artists on Nostr"],
              ["goal", GOAL_ID, "wss://relay.alpha.example"],
            ],
            content:
              "Erin's zine deserves to exist. Here is why I chipped in, and why you might too.",
          },
        },
      ],
    },
  ],
};
