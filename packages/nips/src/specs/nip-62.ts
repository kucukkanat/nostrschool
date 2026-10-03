// Owner: spec author r4 (NIPs 60–79). NIP-62: Request to Vanish.
import type { NipSpec } from "../spec.ts";

export const nip62: NipSpec = {
  nip: "62",
  variant: "event",
  howItWorks: [
    {
      id: "target",
      title: "how.target.title",
      body: "how.target.body",
      focus: { part: { kind: "event", id: "vanish" }, path: ["tags", 0] },
    },
    {
      id: "reason",
      title: "how.reason.title",
      body: "how.reason.body",
      focus: { part: { kind: "event", id: "vanish" }, path: ["content"] },
    },
    { id: "relay", title: "how.relay.title", body: "how.relay.body" },
    {
      id: "global",
      title: "how.global.title",
      body: "how.global.body",
      focus: { part: { kind: "event", id: "vanish" }, path: ["tags", 0, 1] },
    },
    { id: "final", title: "how.final.title", body: "how.final.body" },
  ],
  related: [
    { nip: "09", relation: "see-also", explain: "related.09" },
    { nip: "59", relation: "see-also", explain: "related.59" },
    { nip: "42", relation: "see-also", explain: "related.42" },
  ],
  events: [
    {
      id: "vanish",
      label: "vanish.label",
      explain: "vanish.explain",
      kinds: [62],
      content: { format: "text", explain: "vanish.content", multiline: true },
      tags: [
        {
          name: "relay",
          explain: "vanish.tag.relay",
          // NIP-62: "The tag list MUST include at least one relay value". One tag spec (not a
          // `when` variant per form) so presence "required" enforces exactly that rule; the value
          // is a relay URL (relay picker) or the literal ALL_RELAYS, offered as a literal.
          presence: "required",
          repeatable: true,
          fields: [
            {
              name: "target",
              type: {
                type: "relay-url",
                literals: [{ value: "ALL_RELAYS", explain: "vanish.tag.relay.all" }],
              },
              explain: "vanish.tag.relay.target",
              placeholder: "wss://",
            },
          ],
        },
      ],
      examples: [
        {
          id: "one-relay",
          label: "vanish.example.one.label",
          explain: "vanish.example.one.explain",
          signer: "grace",
          template: {
            kind: 62,
            tags: [["relay", "wss://relay.gamma.example"]],
            content: "Starting over. Please remove everything I posted here.",
          },
        },
        {
          id: "everywhere",
          label: "vanish.example.all.label",
          explain: "vanish.example.all.explain",
          signer: "grace",
          template: {
            kind: 62,
            tags: [["relay", "ALL_RELAYS"]],
            content: "I request erasure of all my data under GDPR Article 17.",
          },
        },
      ],
    },
  ],
};
