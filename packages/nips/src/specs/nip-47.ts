// Owner: spec author r3 (NIPs 40–59). NIP-47: Nostr Wallet Connect.
// Explanations: packages/i18n/src/locales/en/nips/r3.ts → n47.text.
//
// Demo cast: Dave's demo key plays the wallet service, Bob's demo key plays the connection
// `secret` from the nostr+walletconnect:// URI. Payloads are real NIP-44 v2 ciphertexts between
// those keys. Invoices and preimages are illustrative, not payable.
import type { JsonSchema, NipSpec } from "../spec.ts";

const BOB = "a73883912a48c3551c1548fd454876d577126a61c76b5486c807bfec5869e183";
const DAVE = "1c028b39e7f3228444b3261e4b718efa92a91470086b44c9a72ef5357e970148";

/** nip44(bob → dave, {"method":"pay_invoice","params":{"invoice":"lnbc210n1pjwalletdemo…"}}) */
const PAY_REQUEST =
  "Asw3boDrVfMj5jKIXDSEEvVVIdvg1pn/blSPOiPXm31RrZov4oiIac7w8dezfY+KcH38fFHbsBQB5ihDaynv7dxaTRQ7X00o+FU7A28zOXeerhHMIeoQdjz2ZmsJBGE6FKJiYdafvKC47qmt8ptIBdEHQDZqWYK/8wklw/rn4Q2lj+lbZSfXvL+ZZvbPeQyek7VwrfcEBdJ05wi15ljizcKpIz4yij9z6LgbS82e1vSAhbX31LGXbLk7RmlqfVvzxBoX";
/** Id of PAY_REQUEST signed by Bob at FIXTURE_NOW (what a response's e tag points at). */
const PAY_REQUEST_ID = "3a5187a9be0d7954a99e83e7e6f9e3a0102cd80217609937d77ff75c7e90bf9b";
/** nip44(bob → dave, {"method":"get_balance","params":{}}) */
const BALANCE_REQUEST =
  "AmkUU0bD5oAHUpIg00vcGeWijdTUoI13APQ4tc8lgKxhx5YIOY/68IdLA6EUXwMNy3b2EmAM7kaxHlvcFsnropZvIEWZVO9jhVwujT4HbpYkhO3Z9rUTQV3BhISQjCPVFhSwY+SFQUFaB2+fj2fv0T7CD0bYD3p1TaKU8e8xAhd/1tk=";
/** nip44(dave → bob, {"result_type":"pay_invoice","error":null,"result":{"preimage":"0e03…","fees_paid":1000}}) */
const PAY_RESPONSE =
  "AnxYTv5pSvn37dzg/Picd7ddPJHqF25DCrQNQbkWkb1tBvYH4Sn/J35q1yf57odIcnRIsSrnvpzrVSIvGjJ81v28kRrG4RTycL94/bxvSCrbkEs8B0MaV0ADnagbTWiKyt7nycYMcuwjJZ5EgRRvPwSgiYsjsXOv3+m1oCwaGLznvLDhVOKUD5GCARhvDjhjxRMqiuMOQ7mjxrjjEUiN8B2ZaO2ok5p05XFJSfnHUIfDfUXmM8H6/HVbrIuu1uqZRgIJ4klPzKSSFwQl3GJg7gHlYjfmfEXKLgYgWwtjlkPJKgI=";
/** nip44(dave → bob, {"result_type":"pay_invoice","error":{"code":"INSUFFICIENT_BALANCE",…},"result":null}) */
const ERROR_RESPONSE =
  "ArMLY3g4seb9bM461dUJ3jxE6ujcte6pu1hjmfT//Kjri1FK/0A2J++kIToChSvlpqTzTSjb9DgEa6IdmkyY00slaJ9/Bg4z95487eJeM9x/wBopoz+SU7vi7CvGNmPj14RXV9H+rSIZBlJ4LsyvvsLF+XQnyV9OuuTWYyZF3D7MXs5W7UWkH8Sg1tUFNxHZ1RdhQgK2Y+vZP17d5RHWRZbkIO5KzlP0C2MeMAR6eRnWq0jbqfJ8v45aWLtNYV7+fJIYnuni2LvR0N8PHQ545h+CjzyoW0u58b9+iZcZdGSl5uc=";

const METHODS = [
  "pay_invoice",
  "make_invoice",
  "lookup_invoice",
  "get_balance",
  "get_info",
] as const;
const ERROR_CODES = [
  "RATE_LIMITED",
  "NOT_IMPLEMENTED",
  "INSUFFICIENT_BALANCE",
  "QUOTA_EXCEEDED",
  "RESTRICTED",
  "UNAUTHORIZED",
  "INTERNAL",
  "UNSUPPORTED_ENCRYPTION",
  "OTHER",
  "PAYMENT_FAILED",
  "NOT_FOUND",
] as const;

const methodField = (explain: string): JsonSchema => ({
  type: "string",
  explain,
  // Extensions from the NWC repository may add methods, so unknown names only warn.
  field: {
    type: "enum",
    open: true,
    values: METHODS.map((m) => ({ value: m, explain: `method.${m}` })),
  },
});

export const nip47: NipSpec = {
  nip: "47",
  variant: "event",
  events: [
    {
      id: "info",
      label: "info.label",
      explain: "info.explain",
      kinds: [13194],
      content: {
        format: "text",
        explain: "info.content",
        required: true,
        field: { type: "text", pattern: "[a-z_]+( [a-z_]+)*" },
      },
      tags: [
        {
          name: "encryption",
          explain: "info.tag.encryption",
          presence: "recommended",
          repeatable: false,
          fields: [
            {
              name: "schemes",
              type: { type: "text", pattern: "(nip44_v2|nip04)( (nip44_v2|nip04))*" },
              explain: "info.tag.encryption.schemes",
              placeholder: "nip44_v2 nip04",
            },
          ],
        },
        {
          name: "extensions",
          explain: "info.tag.extensions",
          presence: "optional",
          repeatable: false,
          fields: [
            {
              name: "ids",
              type: { type: "text", pattern: "[0-9A-Za-z]+( [0-9A-Za-z]+)*" },
              explain: "info.tag.extensions.ids",
              placeholder: "02 03 04",
            },
          ],
        },
      ],
      examples: [
        {
          id: "wallet",
          label: "example.info",
          explain: "example.info.explain",
          signer: "dave",
          template: {
            kind: 13194,
            tags: [
              ["encryption", "nip44_v2 nip04"],
              ["extensions", "02 03 04"],
            ],
            content: "pay_invoice get_balance get_info make_invoice lookup_invoice",
          },
        },
      ],
    },
    {
      id: "request",
      label: "request.label",
      explain: "request.explain",
      kinds: [23194],
      content: {
        format: "encrypted",
        explain: "request.content",
        scheme: "nip44",
        plaintext: {
          format: "json",
          explain: "request.plaintext",
          schema: {
            type: "object",
            properties: {
              method: methodField("request.method"),
              params: {
                type: "object",
                explain: "request.params",
                properties: {
                  invoice: { type: "string", explain: "param.invoice" },
                  amount: { type: "number", integer: true, minimum: 0, explain: "param.amount" },
                  description: { type: "string", explain: "param.description" },
                  description_hash: { type: "string", explain: "param.description-hash" },
                  expiry: { type: "number", integer: true, minimum: 0, explain: "param.expiry" },
                  payment_hash: { type: "string", explain: "param.payment-hash" },
                  metadata: { type: "any", explain: "param.metadata" },
                },
              },
            },
            required: ["method", "params"],
          },
        },
      },
      tags: [
        {
          name: "p",
          explain: "request.tag.p",
          presence: "required",
          repeatable: false,
          fields: [
            { name: "wallet-pubkey", type: { type: "pubkey" }, explain: "request.tag.p.pubkey" },
          ],
        },
        {
          name: "encryption",
          explain: "request.tag.encryption",
          presence: "recommended",
          repeatable: false,
          fields: [
            {
              name: "scheme",
              type: {
                type: "enum",
                values: [
                  { value: "nip44_v2", explain: "scheme.nip44" },
                  { value: "nip04", explain: "scheme.nip04" },
                ],
              },
              explain: "request.tag.encryption.scheme",
            },
          ],
        },
        {
          name: "expiration",
          explain: "request.tag.expiration",
          presence: "optional",
          repeatable: false,
          fields: [
            {
              name: "timestamp",
              type: { type: "timestamp" },
              explain: "request.tag.expiration.timestamp",
            },
          ],
        },
      ],
      examples: [
        {
          id: "pay-invoice",
          label: "example.pay",
          explain: "example.pay.explain",
          signer: "bob",
          template: {
            kind: 23194,
            tags: [
              ["encryption", "nip44_v2"],
              ["p", DAVE],
            ],
            content: PAY_REQUEST,
          },
        },
        {
          id: "get-balance",
          label: "example.balance",
          signer: "bob",
          template: {
            kind: 23194,
            tags: [
              ["encryption", "nip44_v2"],
              ["p", DAVE],
              ["expiration", "1735689660"],
            ],
            content: BALANCE_REQUEST,
          },
        },
      ],
    },
    {
      id: "response",
      label: "response.label",
      explain: "response.explain",
      kinds: [23195],
      content: {
        format: "encrypted",
        explain: "response.content",
        scheme: "nip44",
        plaintext: {
          format: "json",
          explain: "response.plaintext",
          schema: {
            type: "object",
            properties: {
              result_type: methodField("response.result-type"),
              error: {
                type: "any-of",
                explain: "response.error",
                options: [
                  { type: "null" },
                  {
                    type: "object",
                    properties: {
                      code: {
                        type: "string",
                        explain: "response.error.code",
                        field: {
                          type: "enum",
                          open: true,
                          values: ERROR_CODES.map((c) => ({ value: c, explain: `error.${c}` })),
                        },
                      },
                      message: { type: "string", explain: "response.error.message" },
                    },
                    required: ["code", "message"],
                  },
                ],
              },
              result: {
                type: "any-of",
                explain: "response.result",
                options: [
                  { type: "null" },
                  {
                    type: "object",
                    properties: {
                      preimage: {
                        type: "string",
                        field: { type: "hex32" },
                        explain: "result.preimage",
                      },
                      fees_paid: {
                        type: "number",
                        integer: true,
                        minimum: 0,
                        explain: "result.fees-paid",
                      },
                      balance: {
                        type: "number",
                        integer: true,
                        minimum: 0,
                        explain: "result.balance",
                      },
                    },
                  },
                ],
              },
            },
            required: ["result_type"],
          },
        },
      },
      tags: [
        {
          name: "p",
          explain: "response.tag.p",
          presence: "required",
          repeatable: false,
          fields: [
            { name: "client-pubkey", type: { type: "pubkey" }, explain: "response.tag.p.pubkey" },
          ],
        },
        {
          name: "e",
          explain: "response.tag.e",
          presence: "recommended",
          repeatable: false,
          fields: [
            { name: "request-id", type: { type: "event-id" }, explain: "response.tag.e.id" },
          ],
        },
      ],
      examples: [
        {
          id: "paid",
          label: "example.paid",
          explain: "example.paid.explain",
          signer: "dave",
          template: {
            kind: 23195,
            tags: [
              ["p", BOB],
              ["e", PAY_REQUEST_ID],
            ],
            content: PAY_RESPONSE,
          },
        },
        {
          id: "insufficient",
          label: "example.error",
          explain: "example.error.explain",
          signer: "dave",
          template: {
            kind: 23195,
            tags: [
              ["p", BOB],
              ["e", PAY_REQUEST_ID],
            ],
            content: ERROR_RESPONSE,
          },
        },
      ],
    },
  ],
  flows: [
    {
      id: "pay",
      label: "flow.pay.label",
      explain: "flow.pay.explain",
      steps: [
        { part: { kind: "event", id: "info" }, explain: "flow.pay.info" },
        { part: { kind: "event", id: "request" }, explain: "flow.pay.request" },
        { part: { kind: "event", id: "response" }, explain: "flow.pay.response" },
      ],
    },
  ],
  howItWorks: [
    { id: "uri", title: "how.uri.title", body: "how.uri.body" },
    {
      id: "info",
      title: "how.info.title",
      body: "how.info.body",
      focus: { part: { kind: "event", id: "info" }, path: ["content"] },
    },
    {
      id: "request",
      title: "how.request.title",
      body: "how.request.body",
      focus: { part: { kind: "event", id: "request" }, path: ["content"] },
    },
    {
      id: "response",
      title: "how.response.title",
      body: "how.response.body",
      focus: { part: { kind: "event", id: "response" }, path: ["tags", 1] },
    },
    {
      id: "encryption",
      title: "how.encryption.title",
      body: "how.encryption.body",
      focus: { part: { kind: "event", id: "request" }, path: ["tags", 0] },
    },
  ],
  related: [
    { nip: "44", relation: "depends-on", explain: "related.44" },
    { nip: "04", relation: "see-also", explain: "related.04" },
    { nip: "40", relation: "see-also", explain: "related.40" },
    { nip: "57", relation: "see-also", explain: "related.57" },
  ],
};
