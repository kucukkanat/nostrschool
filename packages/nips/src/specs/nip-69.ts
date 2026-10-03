// Owner: spec author r4 (NIPs 60–79). NIP-69: Peer-to-peer Order events.
import type { FieldType, JsonSchema, NipSpec, TagPresence, TagSpec } from "../spec.ts";

const text: FieldType = { type: "text", minLength: 1 };
const decimal: FieldType = { type: "number", min: 0 };

/** Most NIP-69 tags carry one value; `<tag>` in the NIP = required, `[tag]` = optional. */
const one = (name: string, presence: TagPresence, type: FieldType): TagSpec => ({
  name,
  explain: `order.tag.${name}`,
  presence,
  repeatable: false,
  fields: [{ name: "value", type, explain: `order.tag.${name}.value` }],
});

const STATUS: FieldType = {
  type: "enum",
  values: [
    { value: "pending", explain: "status.pending" },
    { value: "canceled", explain: "status.canceled" },
    { value: "in-progress", explain: "status.in-progress" },
    { value: "success", explain: "status.success" },
    { value: "expired", explain: "status.expired" },
  ],
};

const ratingSchema: JsonSchema = {
  type: "object",
  explain: "order.rating.json",
  properties: {
    total_reviews: {
      type: "number",
      integer: true,
      minimum: 0,
      explain: "order.rating.total_reviews",
    },
    total_rating: { type: "number", explain: "order.rating.total_rating" },
    last_rating: { type: "number", explain: "order.rating.last_rating" },
    max_rate: { type: "number", explain: "order.rating.max_rate" },
    min_rate: { type: "number", explain: "order.rating.min_rate" },
  },
};

export const nip69: NipSpec = {
  nip: "69",
  variant: "event",
  howItWorks: [
    {
      id: "pool",
      title: "how.pool.title",
      body: "how.pool.body",
      focus: { part: { kind: "event", id: "order" } },
    },
    {
      id: "offer",
      title: "how.offer.title",
      body: "how.offer.body",
      focus: { part: { kind: "event", id: "order" }, path: ["tags", 1] },
    },
    {
      id: "price",
      title: "how.price.title",
      body: "how.price.body",
      focus: { part: { kind: "event", id: "order" }, path: ["tags", 4] },
    },
    {
      id: "status",
      title: "how.status.title",
      body: "how.status.body",
      focus: { part: { kind: "event", id: "order" }, path: ["tags", 3] },
    },
    { id: "trade", title: "how.trade.title", body: "how.trade.body" },
  ],
  related: [
    { nip: "01", relation: "depends-on", explain: "related.01" },
    { nip: "40", relation: "depends-on", explain: "related.40" },
    { nip: "52", relation: "see-also", explain: "related.52" },
  ],
  events: [
    {
      id: "order",
      label: "order.label",
      explain: "order.explain",
      kinds: [38383],
      content: { format: "empty" },
      tags: [
        one("d", "required", text),
        one("k", "required", {
          type: "enum",
          values: [
            { value: "sell", explain: "order.k.sell" },
            { value: "buy", explain: "order.k.buy" },
          ],
        }),
        one("f", "required", { type: "text", pattern: "[A-Z]{3}" }),
        one("s", "required", STATUS),
        one("amt", "required", { type: "number", integer: true, min: 0 }),
        {
          name: "fa",
          explain: "order.tag.fa",
          presence: "required",
          repeatable: false,
          fields: [
            { name: "amount-or-min", type: decimal, explain: "order.tag.fa.value" },
            { name: "max", type: decimal, explain: "order.tag.fa.max", optional: true },
          ],
        },
        {
          name: "pm",
          explain: "order.tag.pm",
          presence: "required",
          repeatable: false,
          fields: [{ name: "method", type: text, explain: "order.tag.pm.value" }],
          rest: { name: "method", type: text, explain: "order.tag.pm.value" },
        },
        one("premium", "required", { type: "number" }),
        one("source", "optional", { type: "url" }),
        one("rating", "optional", { type: "json", schema: ratingSchema }),
        one("network", "required", {
          type: "enum",
          open: true,
          values: [
            { value: "mainnet" },
            { value: "testnet" },
            { value: "signet" },
            { value: "regtest" },
          ],
        }),
        one("layer", "required", {
          type: "enum",
          open: true,
          values: [{ value: "onchain" }, { value: "lightning" }, { value: "liquid" }],
        }),
        one("name", "optional", text),
        one("g", "optional", { type: "text", pattern: "[0-9bcdefghjkmnpqrstuvwxyz]{1,12}" }),
        one("bond", "optional", decimal),
        one("expires_at", "required", { type: "timestamp" }),
        one("expiration", "required", { type: "timestamp" }),
        one("y", "required", text),
        one("z", "required", { type: "enum", values: [{ value: "order" }] }),
      ],
      examples: [
        {
          id: "sell-range",
          label: "order.example.sell.label",
          explain: "order.example.sell.explain",
          signer: "bob",
          template: {
            kind: 38383,
            tags: [
              ["d", "ede61c96-4c13-4519-bf3a-dcf7f1e9d842"],
              ["k", "sell"],
              ["f", "EUR"],
              ["s", "pending"],
              ["amt", "0"],
              ["fa", "20", "100"],
              ["pm", "SEPA", "face to face"],
              ["premium", "1"],
              [
                "rating",
                JSON.stringify({
                  total_reviews: 12,
                  total_rating: 4.8,
                  last_rating: 5,
                  max_rate: 5,
                  min_rate: 1,
                }),
              ],
              ["network", "mainnet"],
              ["layer", "lightning"],
              ["name", "Bob"],
              ["bond", "0"],
              // FIXTURE_NOW + 1 day: the offer goes stale; + 8 days: relays may delete it.
              ["expires_at", "1735776000"],
              ["expiration", "1736380800"],
              ["y", "mostro"],
              ["z", "order"],
            ],
            content: "",
          },
        },
        {
          id: "buy-done",
          label: "order.example.buy.label",
          explain: "order.example.buy.explain",
          signer: "grace",
          template: {
            kind: 38383,
            tags: [
              ["d", "4f1a2b3c-9d8e-4f7a-8b6c-5d4e3f2a1b0c"],
              ["k", "buy"],
              ["f", "USD"],
              ["s", "success"],
              ["amt", "50000"],
              ["fa", "50"],
              ["pm", "cash"],
              ["premium", "-0.5"],
              ["source", "https://p2p.alpha.example/orders/4f1a2b3c"],
              ["network", "mainnet"],
              ["layer", "onchain"],
              ["g", "dr5reg"],
              ["expires_at", "1735776000"],
              ["expiration", "1736380800"],
              ["y", "lnp2pbot"],
              ["z", "order"],
            ],
            content: "",
          },
        },
      ],
    },
  ],
};
