// Owner: spec author r4 (NIPs 60–79). NIP-60: Cashu Wallets.
// Encrypted payloads below are real NIP-44 ciphertexts that alice encrypted to herself (fixture
// keys, deterministic nonces), so the editor can decrypt them with her demo key.
import type { FieldType, JsonSchema, NipSpec, TagSpec } from "../spec.ts";

// Id of the spent token event that the deletion example removes.
const OLD_TOKEN = "1f3b5c7d9e0a2b4c6d8e0f1a3b5c7d9e0a2b4c6d8e0f1a3b5c7d9e0a2b4c6d8e";

const word = (value: string): JsonSchema => ({
  type: "string",
  field: { type: "enum", values: [{ value }] },
});
const pair = (name: string, value: JsonSchema, explain: string): JsonSchema => ({
  type: "tuple",
  explain,
  items: [word(name), value],
});
const url: FieldType = { type: "url", schemes: ["https", "http"] };
const unit: FieldType = {
  type: "enum",
  open: true,
  values: [{ value: "sat" }, { value: "msat" }, { value: "usd" }, { value: "eur" }],
};

/** The `e` tag of a history event: token or nutzap reference with a meaning marker. */
const historyETag = (explain: string): JsonSchema => ({
  type: "tuple",
  explain,
  minItems: 4,
  items: [
    word("e"),
    { type: "string", field: { type: "event-id" } },
    { type: "string", explain: "history.e.relay" },
    {
      type: "string",
      field: {
        type: "enum",
        values: [
          { value: "created", explain: "marker.created" },
          { value: "destroyed", explain: "marker.destroyed" },
          { value: "redeemed", explain: "marker.redeemed" },
        ],
      },
    },
  ],
});

const redeemedTag: TagSpec = {
  name: "e",
  explain: "history.tag.e",
  presence: "optional",
  repeatable: true,
  fields: [
    { name: "event-id", type: { type: "event-id" }, explain: "history.tag.e.id" },
    {
      name: "relay",
      type: { type: "text" },
      explain: "history.e.relay",
      optional: true,
      placeholder: "",
    },
    {
      name: "marker",
      type: {
        type: "enum",
        values: [{ value: "redeemed", explain: "marker.redeemed" }],
      },
      explain: "history.tag.e.marker",
    },
  ],
  template: ["e", "", "", "redeemed"],
};

export const nip60: NipSpec = {
  nip: "60",
  variant: "event",
  howItWorks: [
    {
      id: "wallet",
      title: "how.wallet.title",
      body: "how.wallet.body",
      focus: { part: { kind: "event", id: "wallet" }, path: ["content"] },
    },
    {
      id: "tokens",
      title: "how.tokens.title",
      body: "how.tokens.body",
      focus: { part: { kind: "event", id: "token" }, path: ["content"] },
    },
    {
      id: "spend",
      title: "how.spend.title",
      body: "how.spend.body",
      focus: { part: { kind: "event", id: "token" } },
    },
    {
      id: "delete",
      title: "how.delete.title",
      body: "how.delete.body",
      focus: { part: { kind: "event", id: "token-deletion" }, path: ["tags", 1] },
    },
    {
      id: "history",
      title: "how.history.title",
      body: "how.history.body",
      focus: { part: { kind: "event", id: "history" } },
    },
  ],
  related: [
    { nip: "44", relation: "depends-on", explain: "related.44" },
    { nip: "09", relation: "depends-on", explain: "related.09" },
    { nip: "61", relation: "used-by", explain: "related.61" },
    { nip: "40", relation: "see-also", explain: "related.40" },
    { nip: "65", relation: "see-also", explain: "related.65" },
  ],
  flows: [
    {
      id: "spend",
      label: "flow.spend.label",
      explain: "flow.spend.explain",
      steps: [
        { part: { kind: "event", id: "token" }, explain: "flow.spend.rollover" },
        { part: { kind: "event", id: "token-deletion" }, explain: "flow.spend.delete" },
        { part: { kind: "event", id: "history" }, explain: "flow.spend.history" },
      ],
    },
  ],
  events: [
    {
      id: "wallet",
      label: "wallet.label",
      explain: "wallet.explain",
      kinds: [17375],
      content: {
        format: "encrypted",
        explain: "wallet.content",
        scheme: "nip44",
        plaintext: {
          format: "json",
          explain: "wallet.plaintext",
          schema: {
            type: "array",
            minItems: 2,
            items: {
              type: "any-of",
              options: [
                pair("privkey", { type: "string", field: { type: "hex32" } }, "wallet.privkey"),
                pair("mint", { type: "string", field: url }, "wallet.mint"),
              ],
            },
          },
        },
      },
      tags: [],
      examples: [
        {
          id: "two-mints",
          label: "wallet.example.label",
          explain: "wallet.example.explain",
          template: {
            kind: 17375,
            tags: [],
            content:
              "AjlX0gvY0mkisLp4fBOoC6ymN6xJEx3AM8A+iKNuqJ7Lb1tVii1MH5MSZ6Emy3OMqpNIq/1/xVRxrC5RRBA9WRZLozE7oew/HjR1mNmYkwUxHy9G2zWYiHsPhE1P0naNrqDYYPtyJKxK70qbU1aC0oSSq8xWdtAHKNKeEu12/J3QRNyRSJzIRjJ3ew5DK0tSmUdaWNjqFTM8nMyAfXYdPVmqHg+UdYTCJANHixns3DIaM+owSY2R3GSf5dkvHT3WEP+ptKBUMsqx8kxiRrE3v+j2a93KxENv8rckp+MpYeETR3A=",
          },
        },
      ],
    },
    {
      id: "token",
      label: "token.label",
      explain: "token.explain",
      kinds: [7375],
      content: {
        format: "encrypted",
        explain: "token.content",
        scheme: "nip44",
        plaintext: {
          format: "json",
          explain: "token.plaintext",
          schema: {
            type: "object",
            required: ["mint", "proofs"],
            properties: {
              mint: { type: "string", explain: "token.mint", field: url },
              unit: { type: "string", explain: "token.unit", field: unit },
              proofs: {
                type: "array",
                explain: "token.proofs",
                minItems: 1,
                items: {
                  type: "object",
                  explain: "token.proof",
                  required: ["id", "amount", "secret", "C"],
                  properties: {
                    id: { type: "string", explain: "token.proof.id" },
                    amount: {
                      type: "number",
                      integer: true,
                      minimum: 1,
                      explain: "token.proof.amount",
                    },
                    secret: { type: "string", explain: "token.proof.secret" },
                    C: {
                      type: "string",
                      explain: "token.proof.C",
                      field: { type: "hex", bytes: 33 },
                    },
                  },
                },
              },
              del: {
                type: "array",
                explain: "token.del",
                items: { type: "string", field: { type: "event-id" } },
              },
            },
          },
        },
      },
      tags: [],
      examples: [
        {
          id: "fresh",
          label: "token.example.fresh.label",
          explain: "token.example.fresh.explain",
          template: {
            kind: 7375,
            tags: [],
            content:
              "AtpfBt53zOxE+MIhsmbOLXrnlm8RP49ikgTb1cEceINmeEOEUIUUDgMT7qR+YSqmVsa0xgK8r4j/37rJ7SifWsGkGPYeY2EScBk20oiDCBO+VghUatyCLiAc6yVwkA2vAnHnxi4ujMky/GYGmonbvSZa9d/7zM/M0D2eQ51JeZVdvADJQOK5Sl87MquQzVjgd9+kxLDk6ZGrNDYD+zdh5uF6C0EuMxy10wYA0c517PhPG7dc/6ODNx/tBC2hAdK9p54px0VvHO8suiHVcibQHM0e4gipq0lCUXckSaW1q1vd83uzKe1/R2A39ngZ5AqieMctWGtHbP//whCiNSMj0YysBIjdoAsJ/RK2okO2y14q59PE7pjdK3g/JR62szjPuen+aDGsGwBkbOD70ORuiJ/XueaDuxmSF/GjjUbG2yFlOCUds2JPWz4r/L5S25nWIoK3LGQKGgvMOJURX9ImwTR0sAfFpOovI1zvh1/40/y28UKBkqJby0PcS514w7VdVOVkjxmgcSq9ldkpVZgKtP+tPA3+TX+y6SdhcTrFBooYTyUeNfqY4NCus3O53Wl03wM2V1jPTshhEykPdNucbYElRN98nDetSVVlrFbbMbg85sGbDsUxqnrnJF1Vl4FqGSHxbJsCAAFIryjCj7/qnQt/YyZE+uF+f+cqCxxUI+iaP+s=",
          },
        },
        {
          id: "rolled-over",
          label: "token.example.rolled.label",
          explain: "token.example.rolled.explain",
          template: {
            kind: 7375,
            tags: [],
            content:
              "Apvq052zJBxn2d0EDgOseVQGSL+DB4KRvr5I6ezOQIIMPgyU018OWXhiRAbaCmMqWMK/tVsop1ZRcFSLjjItPacUiy1R111fzfREAUZrdMjC/lnkkhbUrMee5s5aQnw9jyXvVFE5bgUe64zRvKA7uBFMTGO8QRmOjsVeOAoXBWT67m+KcbrR/Q867UMjeFFZ4oq7GpxEAN5/8MxvgUZO3Znr+Vh24Xrz27d6/6hb6n55E8nC0e47S8ncvUyjcKhKR2fIlmt6mJDnQx46y4MBxR0/He7ksU0+6Uh1ugUw2zyuYabTgHsfoK/PNoGdnbDl+oA25GTTupemzSGeNb+OXP38BdH/AUP2ThmDhClb0SNTHFpmIPVMglnvpAre4UtQ068DFLSgbBkjW/C62qOoDaxP845nfEe/0xMYgEtm8Kpnrp/ZMO8KM7JlR/XCsO8B4dIt2aIS6xs29HM30i/ySS0i4k3kDvEEj/Fr+mqIdPsQyBhhrr8vYvdUHiDco7Tn+OSP",
          },
        },
      ],
    },
    {
      id: "token-deletion",
      label: "deletion.label",
      explain: "deletion.explain",
      kinds: [5],
      content: { format: "text", explain: "deletion.content" },
      tags: [
        {
          name: "e",
          explain: "deletion.tag.e",
          presence: "required",
          repeatable: true,
          fields: [{ name: "event-id", type: { type: "event-id" }, explain: "deletion.tag.e.id" }],
        },
        {
          name: "k",
          explain: "deletion.tag.k",
          presence: "required",
          repeatable: false,
          fields: [
            { name: "kind", type: { type: "kind", kinds: [7375] }, explain: "deletion.tag.k.kind" },
          ],
          template: ["k", "7375"],
        },
      ],
      examples: [
        {
          id: "spent-token",
          label: "deletion.example.label",
          explain: "deletion.example.explain",
          template: {
            kind: 5,
            tags: [
              ["e", OLD_TOKEN],
              ["k", "7375"],
            ],
            content: "",
          },
        },
      ],
    },
    {
      id: "history",
      label: "history.label",
      explain: "history.explain",
      kinds: [7376],
      content: {
        format: "encrypted",
        explain: "history.content",
        scheme: "nip44",
        plaintext: {
          format: "json",
          explain: "history.plaintext",
          schema: {
            type: "array",
            minItems: 2,
            items: {
              type: "any-of",
              options: [
                pair(
                  "direction",
                  {
                    type: "string",
                    field: {
                      type: "enum",
                      values: [
                        { value: "in", explain: "history.direction.in" },
                        { value: "out", explain: "history.direction.out" },
                      ],
                    },
                  },
                  "history.direction",
                ),
                pair(
                  "amount",
                  { type: "string", field: { type: "number", integer: true, min: 0 } },
                  "history.amount",
                ),
                pair("unit", { type: "string", field: unit }, "history.unit"),
                historyETag("history.e"),
              ],
            },
          },
        },
      },
      tags: [
        redeemedTag,
        {
          name: "p",
          explain: "history.tag.p",
          presence: "optional",
          repeatable: true,
          fields: [{ name: "pubkey", type: { type: "pubkey" }, explain: "history.tag.p.pubkey" }],
        },
      ],
      examples: [
        {
          id: "spend",
          label: "history.example.label",
          explain: "history.example.explain",
          template: {
            kind: 7376,
            tags: [],
            content:
              "AlTcAdXzbN6zWcHE6mtnEEjo+3/eCofFZDqJi6DFYDsLixv0VnlNGGhKCRoRXM+iG7j9EfHdFkvQdsqhLCdm202qxLGGQReYUVE+t3Wl+aK/8mS+Y0phvmyrLeBc7BN3JtBLLMLmsTaCYm3oiozbmaEHsJ6yh70ZOpGz+NaZlAUIsoNmY8I4LDAQV+y6Uj0DEuAAUFVP9puYSZh15NDsXZI+KfsXUnxUDl2tyVyGMBPEzxHNTl75FFHYP06yB+6SOre1AUktIr1B/nIsl+a2NfyCqQxPH/x6kNO9CIhxQxLCXsioBXt4CXF6PtP58aFlBtH+/AmRrVE0wOldp9eZcaVYsp9abZISod2mo/tdK112iUltblLc2Gsoo+3mRk+0BOLieCCRuWH4hQwggx3x9XVhu1JCfvuByr4gG3h3VLn+qy0=",
          },
        },
      ],
    },
    {
      id: "quote",
      label: "quote.label",
      explain: "quote.explain",
      kinds: [7374],
      content: {
        format: "encrypted",
        explain: "quote.content",
        scheme: "nip44",
        plaintext: { format: "text", explain: "quote.plaintext", required: true },
      },
      tags: [
        {
          name: "expiration",
          explain: "quote.tag.expiration",
          presence: "recommended",
          repeatable: false,
          fields: [
            { name: "timestamp", type: { type: "timestamp" }, explain: "quote.tag.expiration.ts" },
          ],
        },
        {
          name: "mint",
          explain: "quote.tag.mint",
          presence: "required",
          repeatable: false,
          fields: [{ name: "url", type: url, explain: "quote.tag.mint.url" }],
        },
      ],
      examples: [
        {
          id: "pending-quote",
          label: "quote.example.label",
          explain: "quote.example.explain",
          template: {
            kind: 7374,
            tags: [
              // FIXTURE_NOW + 14 days: about as long as a Lightning payment can stay in flight.
              ["expiration", "1736899200"],
              ["mint", "https://mint.alpha.example"],
            ],
            content:
              "Ava9whkscaNoUGfg8bhSn606gh+GYWbB5CC8MwLwqAALszsptT3f/rFaY7eOcDUfjbQBKKxmp0DBbW+zjzosvR0FoKDlnilglhyvOxRgaFVpQ80QjlYuXJ3UfOq73BbQkgKQF84289nabcZGuLtqz1UO+fGquXyzNRM+LnQ1MLI9N8g=",
          },
        },
      ],
    },
  ],
};
