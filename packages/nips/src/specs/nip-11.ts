// Owner: spec author r1 (NIPs 01–19). NIP-11: Relay Information Document.
// Explanations: packages/i18n/src/locales/en/nips/r1.ts → n11.text.
import type { JsonSchema, NipSpec } from "../spec.ts";

const DAVE = "1c028b39e7f3228444b3261e4b718efa92a91470086b44c9a72ef5357e970148";
const ALICE = "e550c6e92808f358382b7b8c14345344f5ef9a299529834d1c26d57b6ace44cc";

const count = (explain: string): JsonSchema => ({
  type: "number",
  integer: true,
  minimum: 0,
  explain,
});
const flag = (explain: string): JsonSchema => ({ type: "boolean", explain });
const fee = (explain: string, extra: { readonly [key: string]: JsonSchema }): JsonSchema => ({
  type: "array",
  explain,
  items: {
    type: "object",
    required: ["amount", "unit"],
    properties: {
      amount: { type: "number", minimum: 0, explain: "fee.amount" },
      unit: {
        type: "string",
        explain: "fee.unit",
        field: { type: "enum", values: [{ value: "msats" }, { value: "sats" }], open: true },
      },
      ...extra,
    },
  },
});

export const nip11: NipSpec = {
  nip: "11",
  variant: "document",
  howItWorks: [
    { id: "same-url", title: "how.same-url.title", body: "how.same-url.body" },
    {
      id: "identity",
      title: "how.identity.title",
      body: "how.identity.body",
      focus: { part: { kind: "document", id: "relay-info" }, path: ["name"] },
    },
    {
      id: "nips",
      title: "how.nips.title",
      body: "how.nips.body",
      focus: { part: { kind: "document", id: "relay-info" }, path: ["supported_nips"] },
    },
    {
      id: "limits",
      title: "how.limits.title",
      body: "how.limits.body",
      focus: { part: { kind: "document", id: "relay-info" }, path: ["limitation"] },
    },
    {
      id: "fees",
      title: "how.fees.title",
      body: "how.fees.body",
      focus: { part: { kind: "document", id: "relay-info" }, path: ["fees"] },
    },
  ],
  related: [
    { nip: "01", relation: "depends-on", explain: "related.01" },
    { nip: "13", relation: "see-also", explain: "related.13" },
    { nip: "42", relation: "see-also", explain: "related.42" },
    { nip: "17", relation: "see-also", explain: "related.17" },
  ],
  documents: [
    {
      id: "relay-info",
      label: "doc.label",
      explain: "doc.explain",
      mediaType: "application/nostr+json",
      urlTemplate: "https://<relay-host>/",
      requestHeaders: [
        {
          name: "Accept",
          explain: "header.accept",
          value: { type: "enum", values: [{ value: "application/nostr+json" }] },
          required: true,
        },
      ],
      schema: {
        type: "object",
        explain: "doc.schema",
        properties: {
          name: { type: "string", explain: "field.name" },
          description: {
            type: "string",
            explain: "field.description",
            field: { type: "text", multiline: true },
          },
          banner: { type: "string", explain: "field.banner", field: { type: "url" } },
          icon: { type: "string", explain: "field.icon", field: { type: "url" } },
          pubkey: { type: "string", explain: "field.pubkey", field: { type: "pubkey" } },
          self: { type: "string", explain: "field.self", field: { type: "pubkey" } },
          contact: { type: "string", explain: "field.contact" },
          supported_nips: {
            type: "array",
            explain: "field.supported_nips",
            items: { type: "number", integer: true, minimum: 1 },
          },
          software: { type: "string", explain: "field.software", field: { type: "url" } },
          version: { type: "string", explain: "field.version" },
          terms_of_service: {
            type: "string",
            explain: "field.terms_of_service",
            field: { type: "url" },
          },
          limitation: {
            type: "object",
            explain: "field.limitation",
            properties: {
              max_message_length: count("limit.max_message_length"),
              max_subscriptions: count("limit.max_subscriptions"),
              max_limit: count("limit.max_limit"),
              max_subid_length: count("limit.max_subid_length"),
              max_event_tags: count("limit.max_event_tags"),
              max_content_length: count("limit.max_content_length"),
              min_pow_difficulty: count("limit.min_pow_difficulty"),
              auth_required: flag("limit.auth_required"),
              payment_required: flag("limit.payment_required"),
              restricted_writes: flag("limit.restricted_writes"),
              created_at_lower_limit: count("limit.created_at_lower_limit"),
              created_at_upper_limit: count("limit.created_at_upper_limit"),
              default_limit: count("limit.default_limit"),
            },
          },
          payments_url: { type: "string", explain: "field.payments_url", field: { type: "url" } },
          fees: {
            type: "object",
            explain: "field.fees",
            properties: {
              admission: fee("fee.admission", {}),
              subscription: fee("fee.subscription", {
                period: { type: "number", integer: true, minimum: 1, explain: "fee.period" },
              }),
              publication: fee("fee.publication", {
                kinds: {
                  type: "array",
                  explain: "fee.kinds",
                  items: { type: "number", integer: true, minimum: 0, maximum: 65535 },
                },
              }),
            },
          },
        },
      },
      examples: [
        {
          id: "free",
          label: "example.free.label",
          explain: "example.free.explain",
          value: {
            name: "Alpha",
            description:
              "Big, free, general-purpose relay. Many clients use it to look up profiles.",
            icon: "https://relay.alpha.example/icon.png",
            pubkey: ALICE,
            contact: "mailto:admin@alpha.example",
            supported_nips: [1, 2, 9, 11, 17, 40, 42, 50, 65],
            software: "https://git.alpha.example/relay",
            version: "1.4.2",
            limitation: {
              max_message_length: 131072,
              max_subscriptions: 50,
              max_limit: 500,
              max_event_tags: 2000,
              auth_required: false,
              payment_required: false,
              restricted_writes: false,
              default_limit: 100,
            },
          },
        },
        {
          id: "paid",
          label: "example.paid.label",
          explain: "example.paid.explain",
          value: {
            name: "Delta",
            description: "Paid relay: only members can write, which keeps spam out.",
            pubkey: DAVE,
            contact: "mailto:dave@delta.example",
            supported_nips: [1, 9, 11, 13, 42, 70],
            software: "https://git.delta.example/relay",
            version: "0.9.0",
            terms_of_service: "https://relay.delta.example/terms",
            limitation: {
              max_message_length: 65536,
              max_subscriptions: 20,
              min_pow_difficulty: 8,
              auth_required: true,
              payment_required: true,
              restricted_writes: true,
              created_at_lower_limit: 94608000,
              created_at_upper_limit: 300,
            },
            payments_url: "https://relay.delta.example/join",
            fees: {
              admission: [{ amount: 21000000, unit: "msats" }],
              subscription: [{ amount: 5000000, unit: "msats", period: 2592000 }],
              publication: [{ kinds: [4], amount: 100, unit: "msats" }],
            },
          },
        },
      ],
    },
  ],
};
