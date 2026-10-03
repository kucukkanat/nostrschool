// Owner: spec author r6 (NIPs letter ids). NIP-A3: payto: Payment Targets (kind 10133).
// The type is an open enum: the NIP's list of common types is a picker, any other lowercase
// type is allowed (warning), and clients fall back to payto://<type>/<address> (RFC 8905).
// Explanations: packages/i18n/src/locales/en/nips/r6.ts → nA3.text.
import type { EnumOption, NipSpec } from "../spec.ts";

const TYPES = [
  "bip352",
  "bip353",
  "bitcoin",
  "bitcoincash",
  "cashme",
  "ethereum",
  "lightning",
  "litecoin",
  "monero",
  "nano",
  "paypal",
  "revolut",
  "solana",
  "tron",
  "venmo",
  "zcash",
];
const EXPLAINED = ["bip352", "bip353", "cashme", "lightning"];
const typeOptions: readonly EnumOption[] = TYPES.map((value) =>
  EXPLAINED.includes(value) ? { value, explain: `type.${value}` } : { value },
);

const targets = { kind: "event", id: "targets" } as const;

export const nipA3: NipSpec = {
  nip: "A3",
  variant: "event",
  howItWorks: [
    {
      id: "list",
      title: "how.list.title",
      body: "how.list.body",
      focus: { part: targets, path: ["kind"] },
    },
    {
      id: "tag",
      title: "how.tag.title",
      body: "how.tag.body",
      focus: { part: targets, path: ["tags", 0] },
    },
    {
      id: "type",
      title: "how.type.title",
      body: "how.type.body",
      focus: { part: targets, path: ["tags", 0, 1] },
    },
    { id: "render", title: "how.render.title", body: "how.render.body" },
  ],
  related: [
    { nip: "57", relation: "see-also", explain: "related.57" },
    { nip: "47", relation: "see-also", explain: "related.47" },
    { nip: "01", relation: "depends-on", explain: "related.01" },
  ],
  events: [
    {
      id: "targets",
      label: "event.targets.label",
      explain: "event.targets.explain",
      kinds: [10133],
      content: { format: "empty", explain: "content.empty" },
      tags: [
        {
          name: "payto",
          explain: "tag.payto",
          presence: "required",
          repeatable: true,
          fields: [
            {
              name: "type",
              type: { type: "enum", values: typeOptions, open: true },
              explain: "tag.payto.type",
              placeholder: "bitcoin",
            },
            {
              name: "address",
              type: { type: "text", minLength: 1 },
              explain: "tag.payto.address",
            },
          ],
        },
      ],
      examples: [
        {
          id: "wallets",
          label: "example.wallets",
          explain: "example.wallets.explain",
          signer: "alice",
          template: {
            kind: 10133,
            tags: [
              ["payto", "bitcoin", "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4"],
              ["payto", "lightning", "alice@wallet.alpha.example"],
              ["payto", "cashme", "$alicenostr"],
            ],
            content: "",
          },
        },
        {
          id: "unknown",
          label: "example.unknown",
          explain: "example.unknown.explain",
          signer: "bob",
          template: {
            kind: 10133,
            tags: [
              ["payto", "lightning", "bob@wallet.beta.example"],
              ["payto", "iban", "DE89370400440532013000"],
            ],
            content: "",
          },
        },
      ],
    },
  ],
};
