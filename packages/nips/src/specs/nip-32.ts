// Owner: spec author r2 (NIPs 20–39). NIP-32: Labeling (kind 1985 + self-labels with L/l tags).
import type { NipSpec, TagSpec } from "../spec.ts";

const ERIN = "c71750007e42443e5ca8c1ea00babed4e8c78a9cb45dd6db3733d918e0b55deb";
const CAROL = "9445888d3235f73f8b627df1fb1d498f2eb3fa76337679c1176965a73d3b68b4";
const FRANK = "922e43b50aec16ad1e9d1ec6854c058816d28b944ae2fe9bdce3d9241bfaafb8";
const ARTICLE = "a1bd51f63b58261b774eb882ba099a2bec2f7021f73a0fea48025091cfe40f0f";

const namespaceTag: TagSpec = {
  name: "L",
  explain: "tag.L",
  presence: "recommended",
  repeatable: true,
  fields: [
    {
      name: "namespace",
      type: { type: "text", minLength: 1 },
      explain: "tag.L.value",
      placeholder: "ISO-639-1",
    },
  ],
};

const labelTag: TagSpec = {
  name: "l",
  explain: "tag.l",
  presence: "required",
  repeatable: true,
  fields: [
    { name: "label", type: { type: "text", minLength: 1 }, explain: "tag.l.value" },
    { name: "namespace", type: { type: "text" }, explain: "tag.l.mark", optional: true },
  ],
};

const target = (name: string, explain: string, first: TagSpec["fields"][number]): TagSpec => ({
  name,
  explain,
  presence: "optional",
  repeatable: true,
  fields: [
    first,
    ...(name === "e" || name === "p" || name === "a"
      ? [
          {
            name: "relay",
            type: { type: "relay-url" },
            explain: "tag.relay",
            optional: true,
          } as const,
        ]
      : []),
  ],
});

export const nip32: NipSpec = {
  nip: "32",
  variant: "event",
  howItWorks: [
    {
      id: "namespace",
      title: "how.namespace.title",
      body: "how.namespace.body",
      focus: { part: { kind: "event", id: "label" }, path: ["tags", 0] },
    },
    {
      id: "label",
      title: "how.label.title",
      body: "how.label.body",
      focus: { part: { kind: "event", id: "label" }, path: ["tags", 1] },
    },
    {
      id: "target",
      title: "how.target.title",
      body: "how.target.body",
      focus: { part: { kind: "event", id: "label" }, path: ["tags", 2] },
    },
    {
      id: "self",
      title: "how.self.title",
      body: "how.self.body",
      focus: { part: { kind: "event", id: "self-label" } },
    },
    { id: "query", title: "how.query.title", body: "how.query.body" },
  ],
  related: [
    { nip: "36", relation: "used-by", explain: "related.36" },
    { nip: "56", relation: "see-also", explain: "related.56" },
    { nip: "09", relation: "see-also", explain: "related.09" },
  ],
  events: [
    {
      id: "label",
      label: "event.label.label",
      explain: "event.label.explain",
      kinds: [1985],
      content: { format: "text", explain: "content.label", multiline: true },
      tags: [
        namespaceTag,
        labelTag,
        target("e", "tag.e", { name: "event-id", type: { type: "event-id" }, explain: "tag.e.id" }),
        target("p", "tag.p", { name: "pubkey", type: { type: "pubkey" }, explain: "tag.p.pubkey" }),
        target("a", "tag.a", { name: "address", type: { type: "addr" }, explain: "tag.a.addr" }),
        target("r", "tag.r", {
          name: "url",
          type: { type: "url", schemes: ["http", "https", "ws", "wss"] },
          explain: "tag.r.url",
        }),
        target("t", "tag.t", { name: "topic", type: { type: "text" }, explain: "tag.t.value" }),
      ],
      examples: [
        {
          id: "topic",
          label: "example.topic",
          explain: "example.topic.explain",
          signer: "carol",
          template: {
            kind: 1985,
            tags: [
              ["L", "#t"],
              ["l", "photography", "#t"],
              ["p", ERIN, "wss://relay.alpha.example"],
              ["p", CAROL, "wss://relay.gamma.example"],
            ],
            content: "",
          },
        },
        {
          id: "license",
          label: "example.license",
          explain: "example.license.explain",
          signer: "frank",
          template: {
            kind: 1985,
            tags: [
              ["L", "license"],
              ["l", "CC-BY-4.0", "license"],
              ["e", ARTICLE, "wss://relay.beta.example"],
              ["a", `30023:${FRANK}:protocols-not-platforms`, "wss://relay.beta.example"],
            ],
            content: "Share it, translate it, just credit me.",
          },
        },
        {
          id: "relay",
          label: "example.relay",
          signer: "dave",
          template: {
            kind: 1985,
            tags: [
              ["L", "com.example.relay-ops"],
              ["l", "paid", "com.example.relay-ops"],
              ["r", "wss://relay.delta.example"],
            ],
            content: "",
          },
        },
      ],
    },
    {
      id: "self-label",
      label: "event.self-label.label",
      explain: "event.self-label.explain",
      kinds: [{ from: 0, to: 65535 }],
      content: { format: "text", explain: "content.self", multiline: true },
      tags: [namespaceTag, labelTag],
      examples: [
        {
          id: "language",
          label: "example.language",
          signer: "alice",
          template: {
            kind: 1,
            tags: [
              ["L", "ISO-639-1"],
              ["l", "en", "ISO-639-1"],
            ],
            content: "Relays are just servers that store and forward signed JSON.",
          },
        },
        {
          id: "place",
          label: "example.place",
          signer: "carol",
          template: {
            kind: 1,
            tags: [
              ["L", "ISO-3166-2"],
              ["l", "PT-11", "ISO-3166-2"],
            ],
            content: "Golden hour on the Tagus. Shot on Portra 400.",
          },
        },
      ],
    },
  ],
};
