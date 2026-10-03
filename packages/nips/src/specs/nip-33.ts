// Owner: spec author r2 (NIPs 20–39). NIP-33: Parameterized Replaceable Events — deprecated,
// renamed "addressable events" and merged into NIP-01. A process explainer of replacement by
// kind:pubkey:d, plus an editable addressable-event shape so the d tag can be tried out.
import type { NipSpec } from "../spec.ts";

const FRANK = "922e43b50aec16ad1e9d1ec6854c058816d28b944ae2fe9bdce3d9241bfaafb8";
const D = "protocols-not-platforms";

export const nip33: NipSpec = {
  nip: "33",
  variant: "process",
  howItWorks: [
    { id: "moved", title: "how.moved.title", body: "how.moved.body" },
    {
      id: "range",
      title: "how.range.title",
      body: "how.range.body",
      focus: { part: { kind: "event", id: "addressable" }, path: ["kind"] },
    },
    {
      id: "d",
      title: "how.d.title",
      body: "how.d.body",
      focus: { part: { kind: "event", id: "addressable" }, path: ["tags", 0] },
    },
    { id: "replace", title: "how.replace.title", body: "how.replace.body" },
    { id: "address", title: "how.address.title", body: "how.address.body" },
  ],
  related: [
    { nip: "01", relation: "replaced-by", explain: "related.01" },
    { nip: "19", relation: "see-also", explain: "related.19" },
    { nip: "23", relation: "used-by", explain: "related.23" },
  ],
  events: [
    {
      id: "addressable",
      label: "event.addressable.label",
      explain: "event.addressable.explain",
      kinds: [{ from: 30000, to: 39999 }],
      content: { format: "text", explain: "content", multiline: true },
      tags: [
        {
          name: "d",
          explain: "tag.d",
          presence: "required",
          repeatable: false,
          fields: [{ name: "identifier", type: { type: "text" }, explain: "tag.d.value" }],
        },
      ],
      examples: [
        {
          id: "v2",
          label: "example.v2",
          explain: "example.v2.explain",
          signer: "frank",
          template: {
            kind: 30023,
            created_at: 1735660800,
            tags: [
              ["d", D],
              ["title", "Protocols, not platforms"],
            ],
            content: "# Protocols, not platforms\n\nEmail outlived every email company. (Edited.)",
          },
        },
        {
          id: "status",
          label: "example.status",
          signer: "alice",
          template: {
            kind: 30315,
            tags: [["d", "general"]],
            content: "Writing a thread about relays",
          },
        },
      ],
    },
  ],
  process: {
    actors: [
      { id: "author", label: "actor.author", kind: "client" },
      { id: "relay", label: "actor.relay", kind: "relay" },
      { id: "reader", label: "actor.reader", kind: "client" },
    ],
    steps: [
      {
        id: "v1",
        from: "author",
        to: "relay",
        label: "step.v1.label",
        explain: "step.v1.explain",
        packet: "EVENT",
        payload: [
          "EVENT",
          {
            kind: 30023,
            pubkey: FRANK,
            created_at: 1735574400,
            tags: [["d", D]],
            content: "# Draft one",
          },
        ],
      },
      {
        id: "store",
        from: "relay",
        label: "step.store.label",
        explain: "step.store.explain",
      },
      {
        id: "v2",
        from: "author",
        to: "relay",
        label: "step.v2.label",
        explain: "step.v2.explain",
        packet: "EVENT",
        payload: [
          "EVENT",
          {
            kind: 30023,
            pubkey: FRANK,
            created_at: 1735660800,
            tags: [["d", D]],
            content: "# Protocols, not platforms",
          },
        ],
        part: { kind: "event", id: "addressable" },
      },
      {
        id: "replace",
        from: "relay",
        label: "step.replace.label",
        explain: "step.replace.explain",
      },
      {
        id: "req",
        from: "reader",
        to: "relay",
        label: "step.req.label",
        explain: "step.req.explain",
        packet: "REQ",
        payload: ["REQ", "article", { kinds: [30023], authors: [FRANK], "#d": [D] }],
      },
      {
        id: "latest",
        from: "relay",
        to: "reader",
        label: "step.latest.label",
        explain: "step.latest.explain",
        packet: "EVENT",
        payload: [
          "EVENT",
          "article",
          { kind: 30023, pubkey: FRANK, created_at: 1735660800, tags: [["d", D]] },
        ],
      },
    ],
  },
};
