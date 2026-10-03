// Owner: spec author r3 (NIPs 40–59). NIP-59: Gift Wrap.
// Explanations: packages/i18n/src/locales/en/nips/r3.ts → n59.text.
//
// One message wrapped end to end with demo keys: Alice's rumor (kind 1, FIXTURE_NOW) is sealed
// to Bob with Alice's key, and the seal is wrapped to Bob with Grace's demo key standing in for
// the random one-time key. Both payloads are real NIP-44 v2 ciphertexts, so the editor can open
// every layer with Bob's demo key.
import type { NipSpec } from "../spec.ts";

const BOB = "a73883912a48c3551c1548fd454876d577126a61c76b5486c807bfec5869e183";
const SEAL_CREATED_AT = 1735686000; // FIXTURE_NOW − 1 h
const WRAP_CREATED_AT = 1735682400; // FIXTURE_NOW − 2 h

/** nip44(alice → bob, rumor JSON) */
const SEAL_CONTENT =
  "ApQohBt8SNi2UZNCQzEgv+NlAOw/vzkOj7+2+40iBG1htE3pPOWs5hNds/zyeehK77Qlw6KRUdPTkSTDy6OdhCjLYd7CupkBP2A+zNzQRxdgOyXigimFJi4Mx0sjeEikuq24T2HKxCLSNk0Yu63XamgBxw5L8eoyYq3Bnzl+I8IYbuzU7Zodw300AeWJKglggncd+CUHhQHIZW1yiyian1CuM9CJG1TB8eeCTNFj2MRpc29mqwr/oFUsxzSfhplM9Ou7LxmawKgTgctfkUyE4qwu0US1prZn4hhyQ6MJo094peK1TYfcfvtUH/wfNmhDtZsbgiQQ0BKwRcyH4u0qCbpv+GxWaCRGyKt1Aj+Xp6ERhQ4YacCSGxtWrLSqn4Xj29GAiUofYNEVfrsw7z1TZ+VObEObZrdqklyPQaOok3zuBns=";
/** nip44(grace → bob, seal JSON as Alice signs it at SEAL_CREATED_AT) */
const WRAP_CONTENT =
  "Av3UGqbRYC4nwqT1V8OKs2v44fnxqq1xvYvo2/04Raf1v4AfRDASZbTAvsayA/w6vB/+5pKMEZB5gMFbLkVv4UDeM8GXck2RQ+cZhycK7d+qNEjPyRU7XmCayxu+ZFyWfJVXbYfBvU/tvzhbLLkRy8EIHFJFhx2SmjmLZpyywqMgE8hF8cKann+5s4WdnoyebcjRp9COHr68/tAdmjOZOLRr/lV4dPYizKm8wy5lWw8j0uGmCp0VbUWgIQ42+o7R549SI9v8S6/J9soohy3DFpfcdjAflt80CV6NrtY/ZiJSTT1uJsE2SbaIUardsAKXqb6tf49RcA2wQO4zR5y5S8wkkP+lACH5ZaBPJY4ldo6fKMW3D8dVNSNmVJlQFZHkAgbMw6+7IizWgR1x07YVJWDDxrV1sFfzmV7azbx09Nv9hNpMTlwwFG/NBiQQaHmubpcw50nC42J6iQZwKx7TDmgzSwyvLGIeUqOXFjp2e4m43ULs1/v7vrLD6VW7R5URj08TkjiD6wPBwjKCAYTf91lp+XBxPDhACJYj2TTNJa0oIa79fb3MNg1jzaWUlxBZaGk6OSYgTJ3alysBOYKrUx8BEu1FQ30rv9DLDUb94ddZLN5bQDq9XZ+V6FVjW4nnQ5fSejlFeifE/Oa3eaAHEsKT3Xet/ADV5C6AcijbFISlQvxwN1xprMFp3YwJtpzwNImEXPFQYJrLpSiIb6f7y1zxnx/WQ32TY2vUIDJDBI2KGdDH35V4Cwx7MnHoldpJpzd6bI02DI3hlE6GjL3OmiR2Pl1N47SGsN2R2GzjLGMrqD76+tKyhmwRQr0WDRGDPYCMFEvxidLEL+FjojYHkkcrMAcWg21ilwYKOqoPI+TrS7lq/Wrd1c+pbPWNmt33TNnrFJBVveOwFUuC2b/Ddzr0Y3qcE2aaujzKk34kVLeEPmAp251/YwNTeiZVUDXrnpARpvNf1js+MPlhqyFWjHxhnpatyViAXkgc8oCNi0LBZP1cvvRyvbicXTavgW+tXw/9KdXJ5Qgyr78MajIdVfYXSpNIN5LdWww6VgWlasDDAlvNCSsfTet/X6KcYfv5YU3sIRk+Kk0ZSSJX6rTVPUlEIK/0boyLaVDuKh1Gbl1uy9nKAUs4DdvWOWgTqSshSxEaxF9VdTuTZZaAQpvP6VL2f6fGK2mWMd3MQgk8H8yflO5RKULQzFHfV4c7gRDfO/jK049665UUE+1SrwnXC6Sr8afFHE+g30C1T823guM0A0TuXbRwjQgaQfJqnXWvwMUv";

export const nip59: NipSpec = {
  nip: "59",
  variant: "event",
  events: [
    {
      id: "rumor",
      label: "rumor.label",
      explain: "rumor.explain",
      kinds: [{ from: 0, to: 65535 }],
      content: { format: "text", explain: "rumor.content", multiline: true },
      tags: [],
      signature: "none",
      examples: [
        {
          id: "party",
          label: "example.rumor",
          explain: "example.rumor.explain",
          signer: "alice",
          template: { kind: 1, tags: [], content: "Are you going to the party tonight?" },
        },
      ],
    },
    {
      id: "seal",
      label: "seal.label",
      explain: "seal.explain",
      kinds: [13],
      content: {
        format: "encrypted",
        explain: "seal.content",
        scheme: "nip44",
        plaintext: {
          format: "json",
          explain: "seal.plaintext",
          schema: { type: "event", shape: "rumor", signed: false, explain: "seal.plaintext.rumor" },
        },
      },
      // NIP-59 says "Tags MUST always be empty in a kind:13", yet NIP-17 (disappearing messages)
      // says the expiration tag SHOULD be on the seal as well, and NIP-59 itself asks for
      // independent timestamps when both layers carry one. So expiration is the one allowed
      // tag; anything else is flagged.
      tags: [
        {
          name: "expiration",
          explain: "seal.tag.expiration",
          presence: "optional",
          repeatable: false,
          fields: [
            { name: "timestamp", type: { type: "timestamp" }, explain: "seal.field.expiration" },
          ],
        },
      ],
      unknownTags: "warn",
      examples: [
        {
          id: "alice-to-bob",
          label: "example.seal",
          explain: "example.seal.explain",
          signer: "alice",
          template: { kind: 13, created_at: SEAL_CREATED_AT, tags: [], content: SEAL_CONTENT },
        },
      ],
    },
    {
      id: "gift-wrap",
      label: "wrap.label",
      explain: "wrap.explain",
      kinds: [1059, 21059],
      content: {
        format: "encrypted",
        explain: "wrap.content",
        scheme: "nip44",
        plaintext: {
          format: "json",
          explain: "wrap.plaintext",
          schema: { type: "event", shape: "seal", signed: true, explain: "wrap.plaintext.seal" },
        },
      },
      tags: [
        {
          name: "p",
          explain: "wrap.tag.p",
          presence: "required",
          repeatable: false,
          fields: [
            { name: "recipient", type: { type: "pubkey" }, explain: "wrap.field.p" },
            {
              name: "relay",
              type: { type: "relay-url" },
              explain: "wrap.field.relay",
              optional: true,
            },
          ],
        },
        {
          name: "expiration",
          explain: "wrap.tag.expiration",
          presence: "optional",
          repeatable: false,
          fields: [
            { name: "timestamp", type: { type: "timestamp" }, explain: "wrap.field.expiration" },
          ],
        },
        {
          name: "nonce",
          explain: "wrap.tag.nonce",
          presence: "optional",
          repeatable: false,
          fields: [
            {
              name: "nonce",
              type: { type: "number", integer: true, min: 0 },
              explain: "wrap.field.nonce",
            },
            {
              name: "target",
              type: { type: "number", integer: true, min: 0, max: 256 },
              explain: "wrap.field.target",
            },
          ],
        },
      ],
      examples: [
        {
          id: "to-bob",
          label: "example.wrap",
          explain: "example.wrap.explain",
          signer: "grace",
          template: {
            kind: 1059,
            created_at: WRAP_CREATED_AT,
            tags: [["p", BOB]],
            content: WRAP_CONTENT,
          },
        },
        {
          id: "ephemeral",
          label: "example.ephemeral",
          explain: "example.ephemeral.explain",
          signer: "grace",
          template: {
            kind: 21059,
            created_at: WRAP_CREATED_AT,
            tags: [["p", BOB]],
            content: WRAP_CONTENT,
          },
        },
      ],
    },
  ],
  flows: [
    {
      id: "wrap",
      label: "flow.wrap.label",
      explain: "flow.wrap.explain",
      steps: [
        { part: { kind: "event", id: "rumor" }, explain: "flow.wrap.rumor" },
        { part: { kind: "event", id: "seal" }, explain: "flow.wrap.seal" },
        { part: { kind: "event", id: "gift-wrap" }, explain: "flow.wrap.wrap" },
      ],
    },
  ],
  howItWorks: [
    {
      id: "rumor",
      title: "how.rumor.title",
      body: "how.rumor.body",
      focus: { part: { kind: "event", id: "rumor" } },
    },
    {
      id: "seal",
      title: "how.seal.title",
      body: "how.seal.body",
      focus: { part: { kind: "event", id: "seal" }, path: ["content"] },
    },
    {
      id: "wrap",
      title: "how.wrap.title",
      body: "how.wrap.body",
      focus: { part: { kind: "event", id: "gift-wrap" }, path: ["tags", 0] },
    },
    {
      id: "timestamps",
      title: "how.timestamps.title",
      body: "how.timestamps.body",
      focus: { part: { kind: "event", id: "gift-wrap" }, path: ["created_at"] },
    },
    {
      id: "deliver",
      title: "how.deliver.title",
      body: "how.deliver.body",
    },
    {
      id: "unwrap",
      title: "how.unwrap.title",
      body: "how.unwrap.body",
    },
  ],
  related: [
    { nip: "44", relation: "depends-on", explain: "related.44" },
    { nip: "17", relation: "used-by", explain: "related.17" },
    { nip: "42", relation: "see-also", explain: "related.42" },
    { nip: "13", relation: "see-also", explain: "related.13" },
    { nip: "40", relation: "see-also", explain: "related.40" },
    { nip: "62", relation: "see-also", explain: "related.62" },
  ],
};
