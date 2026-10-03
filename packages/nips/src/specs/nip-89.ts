// Owner: spec author r5 (NIPs 80–99). NIP-89: Recommended Application Handlers.
import type { FieldType, NipSpec, TagSpec } from "../spec.ts";

const FRANK = "922e43b50aec16ad1e9d1ec6854c058816d28b944ae2fe9bdce3d9241bfaafb8";
const BETA = "wss://relay.beta.example";
const HANDLER = `31990:${FRANK}:longform-reader`;

const ENTITY: FieldType = {
  type: "enum",
  values: [
    { value: "npub", explain: "entity.npub" },
    { value: "nprofile", explain: "entity.nprofile" },
    { value: "note", explain: "entity.note" },
    { value: "nevent", explain: "entity.nevent" },
    { value: "naddr", explain: "entity.naddr" },
  ],
};

/** "web" / "ios" / "android"…: a handler URL template with "<bech32>" where the entity goes. */
const platform = (name: string, pattern: string): TagSpec => ({
  name,
  explain: `tag.${name}`,
  presence: "optional",
  repeatable: true,
  fields: [
    {
      name: "url-template",
      type: { type: "text", pattern },
      explain: "tag.platform.template",
    },
    { name: "entity", type: ENTITY, explain: "tag.platform.entity", optional: true },
  ],
});

/** latest / next: point at nsite manifests (same shape as an `a` tag). */
const manifest = (name: "latest" | "next"): TagSpec => ({
  name,
  explain: `tag.${name}`,
  presence: "optional",
  repeatable: false,
  fields: [
    { name: "address", type: { type: "addr" }, explain: "tag.manifest.address" },
    { name: "relay", type: { type: "relay-url" }, explain: "tag.manifest.relay", optional: true },
  ],
});

export const nip89: NipSpec = {
  nip: "89",
  variant: "event",
  howItWorks: [
    {
      id: "unknown",
      title: "how.unknown.title",
      body: "how.unknown.body",
    },
    {
      id: "announce",
      title: "how.announce.title",
      body: "how.announce.body",
      focus: { part: { kind: "event", id: "handler" }, path: ["tags", 1] },
    },
    {
      id: "templates",
      title: "how.templates.title",
      body: "how.templates.body",
      focus: { part: { kind: "event", id: "handler" }, path: ["tags", 2] },
    },
    {
      id: "recommend",
      title: "how.recommend.title",
      body: "how.recommend.body",
      focus: { part: { kind: "event", id: "recommendation" } },
    },
    {
      id: "open",
      title: "how.open.title",
      body: "how.open.body",
    },
    {
      id: "client-tag",
      title: "how.client-tag.title",
      body: "how.client-tag.body",
      focus: { part: { kind: "event", id: "client-tag" }, path: ["tags", 0] },
    },
  ],
  related: [
    { nip: "19", relation: "depends-on", explain: "related.19" },
    { nip: "31", relation: "see-also", explain: "related.31" },
    { nip: "5A", relation: "see-also", explain: "related.5A" },
    { nip: "90", relation: "used-by", explain: "related.90" },
    { nip: "87", relation: "see-also", explain: "related.87" },
  ],
  flows: [
    {
      id: "find-handler",
      label: "flow.find-handler.label",
      explain: "flow.find-handler.explain",
      steps: [
        { part: { kind: "event", id: "recommendation" }, explain: "flow.find-handler.recommend" },
        { part: { kind: "event", id: "handler" }, explain: "flow.find-handler.handler" },
      ],
    },
  ],
  events: [
    {
      id: "handler",
      label: "event.handler.label",
      explain: "event.handler.explain",
      kinds: [31990],
      content: { format: "text", explain: "content.metadata" },
      tags: [
        {
          name: "d",
          explain: "tag.d.handler",
          presence: "required",
          repeatable: false,
          fields: [
            {
              name: "identifier",
              type: { type: "text", minLength: 1 },
              explain: "tag.d.identifier",
            },
          ],
        },
        {
          name: "k",
          explain: "tag.k",
          presence: "required",
          repeatable: true,
          fields: [{ name: "kind", type: { type: "kind" }, explain: "tag.k.kind" }],
        },
        platform("web", "https?://\\S+"),
        platform("ios", "\\S+"),
        platform("android", "\\S+"),
        manifest("latest"),
        manifest("next"),
      ],
      examples: [
        {
          id: "longform-reader",
          label: "example.longform-reader.label",
          explain: "example.longform-reader.explain",
          signer: "frank",
          template: {
            kind: 31990,
            tags: [
              ["d", "longform-reader"],
              ["k", "30023"],
              ["web", "https://read.beta.example/a/<bech32>", "naddr"],
              ["web", "https://read.beta.example/p/<bech32>", "nprofile"],
              ["web", "https://read.beta.example/e/<bech32>"],
              ["ios", "beta-reader://open/<bech32>"],
            ],
            content: JSON.stringify({
              name: "Beta Reader",
              about: "A calm reader for long-form nostr articles.",
              picture: "https://read.beta.example/icon.png",
            }),
          },
        },
      ],
    },
    {
      id: "recommendation",
      label: "event.recommendation.label",
      explain: "event.recommendation.explain",
      kinds: [31989],
      content: { format: "empty", explain: "content.recommendation" },
      tags: [
        {
          name: "d",
          explain: "tag.d.recommendation",
          presence: "required",
          repeatable: false,
          fields: [{ name: "kind", type: { type: "kind" }, explain: "tag.d.kind" }],
        },
        {
          name: "a",
          explain: "tag.a",
          presence: "required",
          repeatable: true,
          fields: [
            { name: "handler", type: { type: "addr", kinds: [31990] }, explain: "tag.a.handler" },
            { name: "relay", type: { type: "relay-url" }, explain: "tag.a.relay", optional: true },
            {
              name: "platform",
              type: {
                type: "enum",
                values: [{ value: "web" }, { value: "ios" }, { value: "android" }],
                open: true,
              },
              explain: "tag.a.platform",
              optional: true,
            },
          ],
        },
      ],
      examples: [
        {
          id: "recommend-reader",
          label: "example.recommend-reader.label",
          explain: "example.recommend-reader.explain",
          signer: "alice",
          template: {
            kind: 31989,
            tags: [
              ["d", "30023"],
              ["a", HANDLER, BETA, "web"],
              ["a", HANDLER, BETA, "ios"],
            ],
            content: "",
          },
        },
      ],
    },
    {
      id: "client-tag",
      label: "event.client-tag.label",
      explain: "event.client-tag.explain",
      kinds: [1],
      content: { format: "text", explain: "content.note", required: true, multiline: true },
      tags: [
        {
          name: "client",
          explain: "tag.client",
          presence: "optional",
          repeatable: false,
          fields: [
            { name: "name", type: { type: "text", minLength: 1 }, explain: "tag.client.name" },
            {
              name: "handler",
              type: { type: "addr", kinds: [31990] },
              explain: "tag.client.handler",
              optional: true,
            },
            {
              name: "relay",
              type: { type: "relay-url" },
              explain: "tag.client.relay",
              optional: true,
            },
          ],
        },
      ],
      examples: [
        {
          id: "note-with-client",
          label: "example.note-with-client.label",
          explain: "example.note-with-client.explain",
          signer: "frank",
          template: {
            kind: 1,
            tags: [["client", "Beta Reader", HANDLER, BETA]],
            content: "Just finished a new essay. Reading it in my own client feels good.",
          },
        },
      ],
    },
  ],
};
