// Owner: spec author r2 (NIPs 20–39). NIP-31: Dealing with unknown event kinds (alt tag) — UNRECOMMENDED.
// Modelled as an event shape (any kind + alt) rather than a pure process, so readers can try
// adding an alt tag to a custom-kind event and see how a kind-1-only client would fall back.
import type { NipSpec } from "../spec.ts";

export const nip31: NipSpec = {
  nip: "31",
  variant: "event",
  howItWorks: [
    { id: "unrecommended", title: "how.unrecommended.title", body: "how.unrecommended.body" },
    { id: "problem", title: "how.problem.title", body: "how.problem.body" },
    {
      id: "alt",
      title: "how.alt.title",
      body: "how.alt.body",
      focus: { part: { kind: "event", id: "custom" }, path: ["tags", 0] },
    },
    { id: "fallback", title: "how.fallback.title", body: "how.fallback.body" },
  ],
  related: [
    { nip: "89", relation: "see-also", explain: "related.89" },
    { nip: "52", relation: "see-also", explain: "related.52" },
  ],
  events: [
    {
      id: "custom",
      label: "event.custom.label",
      explain: "event.custom.explain",
      kinds: [{ from: 0, to: 65535 }],
      content: { format: "text", explain: "content", multiline: true },
      tags: [
        {
          name: "alt",
          explain: "tag.alt",
          presence: "required",
          repeatable: false,
          fields: [
            {
              name: "summary",
              type: { type: "text", minLength: 1 },
              explain: "tag.alt.value",
              placeholder: "A calendar event: …",
            },
          ],
        },
      ],
      examples: [
        {
          id: "calendar",
          label: "example.calendar",
          explain: "example.calendar.explain",
          signer: "alice",
          template: {
            kind: 31923,
            tags: [
              ["alt", "Calendar event: Nostr meetup, 14 Feb 2025 18:00 UTC, Lisbon"],
              ["d", "nostr-meetup-lisbon"],
              ["title", "Nostr meetup"],
              ["start", "1739556000"],
              ["end", "1739563200"],
              ["location", "Lisbon"],
            ],
            content: "Bring a phone with a Nostr app. We'll swap npubs and follow each other.",
          },
        },
        {
          id: "badge",
          label: "example.badge",
          signer: "dave",
          template: {
            kind: 30009,
            tags: [
              ["alt", "Badge definition: Early supporter of relay.delta.example"],
              ["d", "early-supporter"],
              ["name", "Early supporter"],
              ["image", "https://relay.delta.example/badges/early.png"],
            ],
            content: "",
          },
        },
      ],
    },
  ],
};
