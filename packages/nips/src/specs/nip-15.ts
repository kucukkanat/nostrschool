// Owner: spec author r1 (NIPs 01–19). NIP-15: Nostr Marketplace.
// Unrecommended upstream ("too complicated"): use NIP-99 classified listings instead.
// Explanations: packages/i18n/src/locales/en/nips/r1.ts → n15.text.
import type { JsonSchema, NipSpec, TagSpec } from "../spec.ts";

const FRANK = "922e43b50aec16ad1e9d1ec6854c058816d28b944ae2fe9bdce3d9241bfaafb8";
const GRACE = "5f69e52aeb38975e54cb99428da837124166abb4198c1128c54491be73d23812";
const ERIN = "c71750007e42443e5ca8c1ea00babed4e8c78a9cb45dd6db3733d918e0b55deb";

const str = (explain: string): JsonSchema => ({ type: "string", explain });
const num = (explain: string): JsonSchema => ({ type: "number", minimum: 0, explain });
const int = (explain: string): JsonSchema => ({
  type: "number",
  integer: true,
  minimum: 0,
  explain,
});
const urls = (explain: string): JsonSchema => ({
  type: "array",
  explain,
  items: { type: "string", field: { type: "url" } },
});
const specs: JsonSchema = {
  type: "array",
  explain: "product.specs",
  items: { type: "tuple", items: [{ type: "string" }, { type: "string" }], minItems: 2 },
};
const productShipping: JsonSchema = {
  type: "array",
  explain: "product.shipping",
  items: {
    type: "object",
    required: ["id", "cost"],
    properties: { id: str("product.shipping.id"), cost: num("product.shipping.cost") },
  },
};

/** The `d` tag must repeat the `id` inside the JSON content. */
const dTag = (explain: string): TagSpec => ({
  name: "d",
  explain,
  presence: "required",
  repeatable: false,
  fields: [{ name: "id", type: { type: "text", minLength: 1 }, explain: "tag.d.id" }],
});
const categoryTag: TagSpec = {
  name: "t",
  explain: "tag.t",
  presence: "optional",
  repeatable: true,
  fields: [{ name: "category", type: { type: "text" }, explain: "tag.t.category" }],
};

const stallJson = {
  id: "frank-film",
  name: "Frank's Film Shop",
  description: "Fresh 35mm film, shipped from Lisbon.",
  currency: "EUR",
  shipping: [
    { id: "eu", name: "European Union", cost: 4.5, regions: ["PT", "ES", "FR", "DE"] },
    { id: "world", name: "Rest of the world", cost: 12, regions: ["*"] },
  ],
};
const productJson = {
  id: "film-roll-400",
  stall_id: "frank-film",
  name: "Colour film, ISO 400, 36 exposures",
  description: "Forgiving all-rounder for sunny and cloudy days.",
  images: ["https://shop.frank.example/img/film-400.jpg"],
  currency: "EUR",
  price: 13.5,
  quantity: 24,
  specs: [
    ["format", "35mm"],
    ["iso", "400"],
  ],
  shipping: [{ id: "world", cost: 2 }],
};
const auctionJson = {
  id: "leica-m3-1957",
  stall_id: "frank-film",
  name: "Leica M3 (1957), serviced",
  description: "Double-stroke body, fresh shutter curtains.",
  images: ["https://shop.frank.example/img/m3.jpg"],
  starting_bid: 500000,
  start_date: 1735689600,
  duration: 604800,
  specs: [["mount", "Leica M"]],
  shipping: [{ id: "eu", cost: 15 }],
};

export const nip15: NipSpec = {
  nip: "15",
  variant: "event",
  howItWorks: [
    { id: "unrecommended", title: "how.unrecommended.title", body: "how.unrecommended.body" },
    {
      id: "stall",
      title: "how.stall.title",
      body: "how.stall.body",
      focus: { part: { kind: "event", id: "stall" }, path: ["content"] },
    },
    {
      id: "product",
      title: "how.product.title",
      body: "how.product.body",
      focus: { part: { kind: "event", id: "product" }, path: ["tags", 0] },
    },
    {
      id: "checkout",
      title: "how.checkout.title",
      body: "how.checkout.body",
      focus: { part: { kind: "event", id: "checkout" }, path: ["content"] },
    },
    {
      id: "auction",
      title: "how.auction.title",
      body: "how.auction.body",
      focus: { part: { kind: "event", id: "bid" } },
    },
    { id: "market", title: "how.market.title", body: "how.market.body" },
  ],
  related: [
    { nip: "99", relation: "replaced-by", explain: "related.99" },
    { nip: "04", relation: "depends-on", explain: "related.04" },
    { nip: "19", relation: "see-also", explain: "related.19" },
  ],
  flows: [
    {
      id: "shop",
      label: "flow.shop.label",
      explain: "flow.shop.explain",
      steps: [
        { part: { kind: "event", id: "stall" }, explain: "flow.shop.stall" },
        { part: { kind: "event", id: "product" }, explain: "flow.shop.product" },
        { part: { kind: "event", id: "checkout" }, explain: "flow.shop.checkout" },
      ],
    },
    {
      id: "auction",
      label: "flow.auction.label",
      explain: "flow.auction.explain",
      steps: [
        { part: { kind: "event", id: "auction" }, explain: "flow.auction.list" },
        { part: { kind: "event", id: "bid" }, explain: "flow.auction.bid" },
        { part: { kind: "event", id: "bid-confirmation" }, explain: "flow.auction.confirm" },
      ],
    },
  ],
  events: [
    {
      id: "stall",
      label: "stall.label",
      explain: "stall.explain",
      kinds: [30017],
      content: {
        format: "json",
        explain: "stall.content",
        schema: {
          type: "object",
          required: ["id", "name", "currency", "shipping"],
          properties: {
            id: str("stall.id"),
            name: str("stall.name"),
            description: str("stall.description"),
            currency: str("stall.currency"),
            shipping: {
              type: "array",
              explain: "stall.shipping",
              items: {
                type: "object",
                required: ["id", "cost", "regions"],
                properties: {
                  id: str("stall.shipping.id"),
                  name: str("stall.shipping.name"),
                  cost: num("stall.shipping.cost"),
                  regions: {
                    type: "array",
                    explain: "stall.shipping.regions",
                    items: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
      tags: [dTag("tag.d.stall")],
      examples: [
        {
          id: "film-shop",
          label: "example.stall.label",
          explain: "example.stall.explain",
          signer: "frank",
          template: {
            kind: 30017,
            tags: [["d", "frank-film"]],
            content: JSON.stringify(stallJson),
          },
        },
      ],
    },
    {
      id: "product",
      label: "product.label",
      explain: "product.explain",
      kinds: [30018],
      content: {
        format: "json",
        explain: "product.content",
        schema: {
          type: "object",
          required: ["id", "stall_id", "name", "currency", "price", "quantity"],
          properties: {
            id: str("product.id"),
            stall_id: str("product.stall_id"),
            name: str("product.name"),
            description: str("product.description"),
            images: urls("product.images"),
            currency: str("product.currency"),
            price: num("product.price"),
            quantity: {
              type: "any-of",
              explain: "product.quantity",
              options: [{ type: "number", integer: true, minimum: 0 }, { type: "null" }],
            },
            specs,
            shipping: productShipping,
          },
        },
      },
      tags: [dTag("tag.d.product"), categoryTag],
      examples: [
        {
          id: "film",
          label: "example.product.label",
          explain: "example.product.explain",
          signer: "frank",
          template: {
            kind: 30018,
            tags: [
              ["d", "film-roll-400"],
              ["t", "photography"],
              ["t", "film"],
            ],
            content: JSON.stringify(productJson),
          },
        },
      ],
    },
    {
      id: "checkout",
      label: "checkout.label",
      explain: "checkout.explain",
      kinds: [4],
      content: {
        format: "encrypted",
        explain: "checkout.content",
        scheme: "nip04",
        plaintext: {
          format: "json",
          explain: "checkout.plaintext",
          schema: {
            type: "any-of",
            explain: "checkout.types",
            options: [
              {
                type: "object",
                explain: "order.explain",
                required: ["id", "type", "items", "shipping_id"],
                properties: {
                  id: str("order.id"),
                  type: {
                    type: "number",
                    integer: true,
                    minimum: 0,
                    maximum: 0,
                    explain: "order.type",
                  },
                  name: str("order.name"),
                  address: str("order.address"),
                  message: str("order.message"),
                  contact: {
                    type: "object",
                    explain: "order.contact",
                    properties: {
                      nostr: { type: "string", field: { type: "pubkey" } },
                      phone: { type: "string" },
                      email: { type: "string" },
                    },
                  },
                  items: {
                    type: "array",
                    explain: "order.items",
                    minItems: 1,
                    items: {
                      type: "object",
                      required: ["product_id", "quantity"],
                      properties: {
                        product_id: { type: "string" },
                        quantity: { type: "number", integer: true, minimum: 1 },
                      },
                    },
                  },
                  shipping_id: str("order.shipping_id"),
                },
              },
              {
                type: "object",
                explain: "payment.explain",
                required: ["id", "type", "payment_options"],
                properties: {
                  id: str("order.id"),
                  type: {
                    type: "number",
                    integer: true,
                    minimum: 1,
                    maximum: 1,
                    explain: "order.type",
                  },
                  message: str("order.message"),
                  payment_options: {
                    type: "array",
                    explain: "payment.options",
                    items: {
                      type: "object",
                      required: ["type", "link"],
                      properties: {
                        type: {
                          type: "string",
                          field: {
                            type: "enum",
                            values: [
                              { value: "url", explain: "payment.url" },
                              { value: "btc", explain: "payment.btc" },
                              { value: "ln", explain: "payment.ln" },
                              { value: "lnurl", explain: "payment.lnurl" },
                            ],
                          },
                        },
                        link: { type: "string" },
                      },
                    },
                  },
                },
              },
              {
                type: "object",
                explain: "status.explain",
                required: ["id", "type", "paid", "shipped"],
                properties: {
                  id: str("order.id"),
                  type: {
                    type: "number",
                    integer: true,
                    minimum: 2,
                    maximum: 2,
                    explain: "order.type",
                  },
                  message: str("order.message"),
                  paid: { type: "boolean", explain: "status.paid" },
                  shipped: { type: "boolean", explain: "status.shipped" },
                },
              },
            ],
          },
        },
      },
      tags: [
        {
          name: "p",
          explain: "tag.p.checkout",
          presence: "required",
          repeatable: false,
          fields: [{ name: "pubkey", type: { type: "pubkey" }, explain: "tag.p.pubkey" }],
        },
      ],
      examples: [
        {
          id: "order",
          label: "example.order.label",
          explain: "example.order.explain",
          signer: "grace",
          template: {
            kind: 4,
            tags: [["p", FRANK]],
            // nip04Encrypt(order JSON {id:"order-7f3c", type:0, …}, grace, frank)
            content:
              "UuElcj+KiLhhVgZkDGyVCKEr3K46tlqQT9h578Xy4KAo7GXaVo/zfPCpyGHest7PUo+W07+nnQbr2UE9zc7vzmD0RIHsGgVfOCIHCG+va3MXiOBiUtNP5ddFMKM89oErplxi6G9pqVuA6+Pe3Mu0028u0VGpbXzr3o1KhWvhGhpOdwsPLjNI5WU7omVQJu22ED7LMSDxqJT3eP1+cXKq2t6+SMy3vpyIs4YfvAzQDH66pViG24eycCtqjCmvrcbFMjJhNbTWdpzVUworrkaRChCebRO769B6xDjRmalQ+lctb8LxBwfyu9aRciauAixO?iv=WdG8qnYmE4yn3/ZQzEzK6Q==",
          },
        },
        {
          id: "payment-request",
          label: "example.payment.label",
          explain: "example.payment.explain",
          signer: "frank",
          template: {
            kind: 4,
            tags: [["p", GRACE]],
            // nip04Encrypt(payment request JSON {id:"order-7f3c", type:1, …}, frank, grace)
            content:
              "seLMEuqkuIA6nyNm9I0+nNuuAm0B5FCnLK5C1/yGtR2TQI0Sp9/MO2ehxRUs1sRFW9Ps1O6COFhQDP6NaUWmiNVDav1VR+yeIIxquam9YAfj8+mZFR+tYjAf2PbLNPMoOoPEujaczeWJx/IWIrFlvp6jqOQpMAORtVKdGW6/oxw7Cs1pedC6LtN2aXaXUXMcD0kKyvcFcJzfqItFfcHs/8hQgrwKd4yzMEdIVLIivizldsbWN4T/GVdQFQATI9m+?iv=0ZEpeslxUmOUEl18V7GBQQ==",
          },
        },
        {
          id: "status",
          label: "example.status.label",
          explain: "example.status.explain",
          signer: "frank",
          template: {
            kind: 4,
            tags: [["p", GRACE]],
            // nip04Encrypt(status JSON {id:"order-7f3c", type:2, paid:true, shipped:true}, frank, grace)
            content:
              "hMtbmGjIogNcGYkQRB1eTWIr6QyeuDAnsKF8KbGBsPppZZQgyma/zdySCOqefnlN6ADxtUIBwUhXfn6oSZ9ih4cPoI/IFLUokYgBdKIG5ImAOsnvzFvGR6oQMvnLo6EC?iv=u3RGGR1zzjc0HhcN3u69LA==",
          },
        },
      ],
    },
    {
      id: "marketplace",
      label: "market.label",
      explain: "market.explain",
      kinds: [30019],
      content: {
        format: "json",
        explain: "market.content",
        schema: {
          type: "object",
          properties: {
            name: str("market.name"),
            about: str("market.about"),
            ui: {
              type: "object",
              explain: "market.ui",
              properties: {
                picture: { type: "string", field: { type: "url" } },
                banner: { type: "string", field: { type: "url" } },
                theme: { type: "string" },
                darkMode: { type: "boolean" },
              },
            },
            merchants: {
              type: "array",
              explain: "market.merchants",
              items: { type: "string", field: { type: "pubkey" } },
            },
          },
        },
      },
      tags: [dTag("tag.d.market")],
      examples: [
        {
          id: "analog",
          label: "example.market.label",
          explain: "example.market.explain",
          signer: "carol",
          template: {
            kind: 30019,
            tags: [["d", "analog-photo-market"]],
            content: JSON.stringify({
              name: "Analog Photo Market",
              about: "Film, cameras and darkroom gear from people we trust.",
              ui: { picture: "https://carol.example/market.png", theme: "riso", darkMode: false },
              merchants: [FRANK, ERIN],
            }),
          },
        },
      ],
    },
    {
      id: "auction",
      label: "auction.label",
      explain: "auction.explain",
      kinds: [30020],
      content: {
        format: "json",
        explain: "auction.content",
        schema: {
          type: "object",
          required: ["id", "stall_id", "name", "starting_bid", "duration"],
          properties: {
            id: str("product.id"),
            stall_id: str("product.stall_id"),
            name: str("product.name"),
            description: str("product.description"),
            images: urls("product.images"),
            starting_bid: int("auction.starting_bid"),
            start_date: {
              type: "number",
              integer: true,
              minimum: 0,
              explain: "auction.start_date",
            },
            duration: int("auction.duration"),
            specs,
            shipping: productShipping,
          },
        },
      },
      tags: [dTag("tag.d.product")],
      examples: [
        {
          id: "camera",
          label: "example.auction.label",
          explain: "example.auction.explain",
          signer: "frank",
          template: {
            kind: 30020,
            tags: [["d", "leica-m3-1957"]],
            content: JSON.stringify(auctionJson),
          },
        },
      ],
    },
    {
      id: "bid",
      label: "bid.label",
      explain: "bid.explain",
      kinds: [1021],
      content: {
        format: "text",
        explain: "bid.content",
        required: true,
        field: { type: "number", integer: true, min: 1 },
      },
      tags: [
        {
          name: "e",
          explain: "tag.e.auction",
          presence: "required",
          repeatable: false,
          fields: [{ name: "auction", type: { type: "event-id" }, explain: "tag.e.auction-id" }],
        },
      ],
      examples: [
        {
          id: "bid",
          label: "example.bid.label",
          explain: "example.bid.explain",
          signer: "grace",
          template: {
            kind: 1021,
            tags: [["e", "3f9a1c0d2b7e4a5f8c6d9e0b1a2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e"]],
            content: "520000",
          },
        },
      ],
    },
    {
      id: "bid-confirmation",
      label: "confirm.label",
      explain: "confirm.explain",
      kinds: [1022],
      content: {
        format: "json",
        explain: "confirm.content",
        schema: {
          type: "object",
          required: ["status"],
          properties: {
            status: {
              type: "string",
              explain: "confirm.status",
              field: {
                type: "enum",
                values: [
                  { value: "accepted", explain: "confirm.accepted" },
                  { value: "rejected", explain: "confirm.rejected" },
                  { value: "pending", explain: "confirm.pending" },
                  { value: "winner", explain: "confirm.winner" },
                ],
              },
            },
            message: str("confirm.message"),
            duration_extended: int("confirm.duration_extended"),
          },
        },
      },
      tags: [
        {
          name: "e",
          explain: "tag.e.confirm",
          presence: "required",
          repeatable: true,
          fields: [{ name: "event-id", type: { type: "event-id" }, explain: "tag.e.confirm-id" }],
        },
      ],
      examples: [
        {
          id: "accepted",
          label: "example.confirm.label",
          explain: "example.confirm.explain",
          signer: "frank",
          template: {
            kind: 1022,
            tags: [
              ["e", "8d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e"],
              ["e", "3f9a1c0d2b7e4a5f8c6d9e0b1a2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e"],
            ],
            content: JSON.stringify({ status: "accepted", duration_extended: 300 }),
          },
        },
      ],
    },
  ],
};
