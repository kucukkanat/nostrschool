// Owner: spec author r4 (NIPs 60–79). NIP-70: Protected Events.
// Variant "process": the tag itself is one token; what matters is the relay's AUTH dance. Dave
// posts to members of his paid relay; erin tries to republish his note elsewhere.
import type { NipSpec } from "../spec.ts";

const DAVE = "1c028b39e7f3228444b3261e4b718efa92a91470086b44c9a72ef5357e970148";
const NOTE = {
  kind: 1,
  pubkey: DAVE,
  tags: [["-"]],
  content: "Members: maintenance window tonight.",
};

export const nip70: NipSpec = {
  nip: "70",
  variant: "process",
  howItWorks: [
    {
      id: "tag",
      title: "how.tag.title",
      body: "how.tag.body",
      focus: { part: { kind: "event", id: "protected" }, path: ["tags", 0] },
    },
    { id: "default", title: "how.default.title", body: "how.default.body" },
    { id: "auth", title: "how.auth.title", body: "how.auth.body" },
    { id: "pirates", title: "how.pirates.title", body: "how.pirates.body" },
    { id: "limits", title: "how.limits.title", body: "how.limits.body" },
  ],
  related: [
    { nip: "42", relation: "depends-on", explain: "related.42" },
    { nip: "18", relation: "see-also", explain: "related.18" },
    { nip: "29", relation: "used-by", explain: "related.29" },
  ],
  process: {
    actors: [
      { id: "dave", label: "actor.dave", kind: "client" },
      { id: "relay", label: "actor.relay", kind: "relay" },
      { id: "pirate", label: "actor.pirate", kind: "client" },
    ],
    steps: [
      {
        id: "publish",
        from: "dave",
        to: "relay",
        label: "step.publish.label",
        explain: "step.publish.explain",
        packet: "EVENT",
        payload: ["EVENT", NOTE],
        part: { kind: "event", id: "protected" },
      },
      {
        id: "challenge",
        from: "relay",
        to: "dave",
        label: "step.challenge.label",
        explain: "step.challenge.explain",
        packet: "AUTH",
        payload: ["AUTH", "challenge-7d1f3a"],
      },
      {
        id: "rejected",
        from: "relay",
        to: "dave",
        label: "step.rejected.label",
        explain: "step.rejected.explain",
        packet: "OK",
        payload: [
          "OK",
          "<event-id>",
          false,
          "auth-required: this event may only be published by its author",
        ],
      },
      {
        id: "authenticate",
        from: "dave",
        to: "relay",
        label: "step.authenticate.label",
        explain: "step.authenticate.explain",
        packet: "AUTH",
        payload: [
          "AUTH",
          {
            kind: 22242,
            pubkey: DAVE,
            tags: [
              ["relay", "wss://relay.delta.example"],
              ["challenge", "challenge-7d1f3a"],
            ],
            content: "",
          },
        ],
      },
      {
        id: "retry",
        from: "dave",
        to: "relay",
        label: "step.retry.label",
        explain: "step.retry.explain",
        packet: "EVENT",
        payload: ["EVENT", NOTE],
      },
      {
        id: "accepted",
        from: "relay",
        to: "dave",
        label: "step.accepted.label",
        explain: "step.accepted.explain",
        packet: "OK",
        payload: ["OK", "<event-id>", true, ""],
      },
      {
        id: "republish",
        from: "pirate",
        to: "relay",
        label: "step.republish.label",
        explain: "step.republish.explain",
        packet: "EVENT",
        payload: ["EVENT", NOTE],
      },
      {
        id: "blocked",
        from: "relay",
        to: "pirate",
        label: "step.blocked.label",
        explain: "step.blocked.explain",
        packet: "OK",
        payload: [
          "OK",
          "<event-id>",
          false,
          "auth-required: this event may only be published by its author",
        ],
      },
    ],
  },
  events: [
    {
      id: "protected",
      label: "protected.label",
      explain: "protected.explain",
      kinds: [{ from: 0, to: 65535 }],
      content: { format: "text", explain: "protected.content" },
      tags: [
        {
          name: "-",
          explain: "protected.tag.dash",
          presence: "required",
          repeatable: false,
          fields: [],
          template: ["-"],
        },
      ],
      examples: [
        {
          id: "members-note",
          label: "protected.example.note.label",
          explain: "protected.example.note.explain",
          signer: "dave",
          template: {
            kind: 1,
            tags: [["-"]],
            content: "Members: maintenance window tonight.",
          },
        },
        {
          id: "article",
          label: "protected.example.article.label",
          explain: "protected.example.article.explain",
          signer: "frank",
          template: {
            kind: 30023,
            tags: [["d", "subscriber-letter-12"], ["title", "Subscriber letter #12"], ["-"]],
            content: "Thanks for supporting the newsletter. This one stays on our relay.",
          },
        },
      ],
    },
  ],
};
