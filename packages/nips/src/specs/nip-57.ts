// Owner: spec author r3 (NIPs 40–59). NIP-57: Lightning Zaps.
// Explanations: packages/i18n/src/locales/en/nips/r3.ts → n57.text.
//
// The examples follow the fixture zap: Alice zaps Erin's ostrich note with 2,100 sats through
// Erin's wallet (wallet.alpha.example, whose zapper key signs receipts in the fixtures).
import type { NipSpec } from "../spec.ts";

const ALICE = "e550c6e92808f358382b7b8c14345344f5ef9a299529834d1c26d57b6ace44cc";
const BOB = "a73883912a48c3551c1548fd454876d577126a61c76b5486c807bfec5869e183";
const ERIN = "c71750007e42443e5ca8c1ea00babed4e8c78a9cb45dd6db3733d918e0b55deb";
const FRANK = "922e43b50aec16ad1e9d1ec6854c058816d28b944ae2fe9bdce3d9241bfaafb8";
const ERIN_NOTE = "6f762f141286ff49dc17f167204069df048758cf0a4cd83dae2455f277241253";
/** Zapper key of wallet.alpha.example (the LNURL server's nostrPubkey). */
const ALPHA_ZAPPER = "044b2cc412cc89149bc4f38a5067db6034dbaafe20321721a5414bb7237176f4";
/** bech32("lnurl", "https://wallet.alpha.example/.well-known/lnurlp/erin") */
const ERIN_LNURL =
  "lnurl1dp68gurn8ghj7ampd3kx2apwv9k8q6rp9ejhsctdwpkx2tewwajkcmpdddhx7amw9akxuatjd3cz7etjd9hq307s7u";

/** Alice's signed zap request from the fixtures (what the wallet receives and later embeds). */
const SIGNED_ZAP_REQUEST = {
  kind: 9734,
  created_at: 1735684800,
  tags: [
    ["relays", "wss://relay.alpha.example", "wss://relay.gamma.example"],
    ["amount", "2100000"],
    ["p", ERIN],
    ["e", ERIN_NOTE],
  ],
  content: "Love the ostrich! ⚡",
  pubkey: ALICE,
  id: "f9863d290f96c1ca9285db349e885f518b6573873477e87cdcfe5869b5c98e51",
  sig: "28d8dc4893fddfcb57532741fde37ec1befa751288d6cfb5e981122444e18ad4b17592ac84a07cb2d484c20bd4006dfc129a059222aa2eeaef595074b671574f",
};
/**
 * A real, decodable BOLT11 invoice for 21000n (2,100,000 msats, matching the request's amount
 * tag). Its payment hash is SHA256(PREIMAGE) and its description hash (h) is SHA256 of the
 * receipt's description tag, i.e. JSON.stringify(SIGNED_ZAP_REQUEST), as NIP-57 Appendix F
 * requires. It is signed by a demo node key (sha256("nostrschool demo lightning node
 * wallet.alpha.example"), node id 033d8739…5c8bcb) with timestamp 1735684805, so it decodes and
 * verifies in any BOLT11 library but was never payable. Regenerate it whenever
 * SIGNED_ZAP_REQUEST changes; r3.test.ts checks the commitments.
 */
const BOLT11 =
  "lnbc21000n1pnhguk9pp5yufm3nwdt9qy83hvcmles8fpg5xeecmuycy8w4cf6zfgngh3ldnssp5fcmd04lctgausffzjemtzmqhsf6n40w97nvg2nsd7265xqsjr7nshp59qz9p54zevw4kjeyaztdej7rxh40mqjvqj6c95trjxafnn9a00gskm97zztuhfnnt2l5valc9mcnaatdve5hs9r86fr79tq5kqqe5kd5dyj8e9uagpg4y3ju5k3kkweukvwtcfgfx4qkz8y0502kcxz5t2gpgvfr3y";
/**
 * Bech32 shape of a BOLT11 invoice: "ln" + currency, optional amount + multiplier, separator "1",
 * then at least 7 timestamp + 104 signature + 6 checksum characters from the bech32 charset.
 */
const BOLT11_PATTERN = "ln[a-z]+(?:[0-9]+[munp]?)?1[qpzry9x8gf2tvdw0s3jn54khce6mua7l]{117,}";
const PREIMAGE = "0e03fe78b29d4ddf2634beb04cb13cfea703598aba002992434f345fadf54794";

const optionalTarget = {
  presence: "optional",
  repeatable: false,
} as const;

export const nip57: NipSpec = {
  nip: "57",
  variant: "event",
  events: [
    {
      id: "zap-request",
      label: "request.label",
      explain: "request.explain",
      kinds: [9734],
      content: { format: "text", explain: "request.content" },
      tags: [
        {
          name: "relays",
          explain: "request.tag.relays",
          presence: "required",
          repeatable: false,
          fields: [{ name: "relay", type: { type: "relay-url" }, explain: "request.field.relay" }],
          rest: { name: "relay", type: { type: "relay-url" }, explain: "request.field.relay" },
        },
        {
          name: "amount",
          explain: "request.tag.amount",
          presence: "recommended",
          repeatable: false,
          fields: [
            {
              name: "msats",
              type: { type: "number", integer: true, min: 1 },
              explain: "request.field.amount",
            },
          ],
        },
        {
          name: "lnurl",
          explain: "request.tag.lnurl",
          presence: "recommended",
          repeatable: false,
          fields: [
            {
              name: "lnurl",
              type: { type: "bech32", prefixes: ["lnurl"] },
              explain: "request.field.lnurl",
            },
          ],
        },
        {
          name: "p",
          explain: "request.tag.p",
          presence: "required",
          repeatable: false,
          fields: [{ name: "recipient", type: { type: "pubkey" }, explain: "field.recipient" }],
        },
        {
          name: "e",
          explain: "request.tag.e",
          ...optionalTarget,
          fields: [{ name: "event-id", type: { type: "event-id" }, explain: "field.event-id" }],
        },
        {
          name: "a",
          explain: "request.tag.a",
          ...optionalTarget,
          fields: [{ name: "address", type: { type: "addr" }, explain: "field.address" }],
        },
        {
          name: "k",
          explain: "request.tag.k",
          ...optionalTarget,
          fields: [{ name: "kind", type: { type: "kind" }, explain: "field.kind" }],
        },
      ],
      examples: [
        {
          id: "note-zap",
          label: "example.note-zap",
          explain: "example.note-zap.explain",
          signer: "alice",
          template: {
            kind: 9734,
            tags: [
              ["relays", "wss://relay.alpha.example", "wss://relay.gamma.example"],
              ["amount", "2100000"],
              ["lnurl", ERIN_LNURL],
              ["p", ERIN],
              ["e", ERIN_NOTE],
              ["k", "1"],
            ],
            content: "Love the ostrich! ⚡",
          },
        },
        {
          id: "article-zap",
          label: "example.article-zap",
          explain: "example.article-zap.explain",
          signer: "bob",
          template: {
            kind: 9734,
            tags: [
              ["relays", "wss://relay.beta.example"],
              ["amount", "10000000"],
              ["p", FRANK],
              ["a", `30023:${FRANK}:protocols-not-platforms`],
              ["k", "30023"],
            ],
            content: "",
          },
        },
      ],
    },
    {
      id: "zap-receipt",
      label: "receipt.label",
      explain: "receipt.explain",
      kinds: [9735],
      content: { format: "empty", explain: "receipt.content" },
      tags: [
        {
          name: "p",
          explain: "receipt.tag.p",
          presence: "required",
          repeatable: false,
          fields: [{ name: "recipient", type: { type: "pubkey" }, explain: "field.recipient" }],
        },
        {
          name: "P",
          explain: "receipt.tag.P",
          ...optionalTarget,
          fields: [{ name: "sender", type: { type: "pubkey" }, explain: "receipt.field.sender" }],
        },
        {
          name: "e",
          explain: "receipt.tag.e",
          ...optionalTarget,
          fields: [{ name: "event-id", type: { type: "event-id" }, explain: "field.event-id" }],
        },
        {
          name: "a",
          explain: "receipt.tag.a",
          ...optionalTarget,
          fields: [{ name: "address", type: { type: "addr" }, explain: "field.address" }],
        },
        {
          name: "k",
          explain: "receipt.tag.k",
          ...optionalTarget,
          fields: [{ name: "kind", type: { type: "kind" }, explain: "field.kind" }],
        },
        {
          name: "bolt11",
          explain: "receipt.tag.bolt11",
          presence: "required",
          repeatable: false,
          fields: [
            {
              name: "invoice",
              type: { type: "text", pattern: BOLT11_PATTERN },
              explain: "receipt.field.bolt11",
            },
          ],
        },
        {
          name: "description",
          explain: "receipt.tag.description",
          presence: "required",
          repeatable: false,
          fields: [
            {
              name: "zap-request",
              type: { type: "event-json", kinds: [9734] },
              explain: "receipt.field.description",
            },
          ],
        },
        {
          name: "preimage",
          explain: "receipt.tag.preimage",
          presence: "optional",
          repeatable: false,
          fields: [
            { name: "preimage", type: { type: "hex32" }, explain: "receipt.field.preimage" },
          ],
        },
      ],
      examples: [
        {
          id: "receipt",
          label: "example.receipt",
          explain: "example.receipt.explain",
          signer: "dave",
          template: {
            kind: 9735,
            tags: [
              ["p", ERIN],
              ["P", ALICE],
              ["e", ERIN_NOTE],
              ["bolt11", BOLT11],
              ["description", JSON.stringify(SIGNED_ZAP_REQUEST)],
              ["preimage", PREIMAGE],
            ],
            content: "",
          },
        },
      ],
    },
    {
      id: "zap-split",
      label: "split.label",
      explain: "split.explain",
      kinds: [{ from: 0, to: 65535 }],
      content: { format: "text", explain: "split.content", multiline: true },
      tags: [
        {
          name: "zap",
          explain: "split.tag.zap",
          presence: "required",
          repeatable: true,
          fields: [
            { name: "pubkey", type: { type: "pubkey" }, explain: "split.field.pubkey" },
            { name: "relay", type: { type: "relay-url" }, explain: "split.field.relay" },
            {
              name: "weight",
              type: { type: "number", min: 0 },
              explain: "split.field.weight",
              optional: true,
            },
          ],
        },
      ],
      examples: [
        {
          id: "split",
          label: "example.split",
          explain: "example.split.explain",
          signer: "frank",
          template: {
            kind: 30023,
            tags: [
              ["d", "protocols-not-platforms-part-2"],
              ["title", "Protocols, not platforms (part 2)"],
              ["zap", FRANK, "wss://relay.beta.example", "2"],
              ["zap", ALICE, "wss://relay.alpha.example", "1"],
              ["zap", BOB, "wss://relay.beta.example", "1"],
            ],
            content: "Co-written with Alice and Bob: zaps are split 50/25/25.",
          },
        },
      ],
    },
  ],
  documents: [
    {
      id: "lnurlp",
      label: "lnurlp.label",
      explain: "lnurlp.explain",
      mediaType: "application/json",
      urlTemplate: "https://<wallet-domain>/.well-known/lnurlp/<user>",
      schema: {
        type: "object",
        properties: {
          tag: {
            type: "string",
            field: { type: "enum", values: [{ value: "payRequest" }] },
            explain: "lnurlp.tag",
          },
          callback: { type: "string", field: { type: "url" }, explain: "lnurlp.callback" },
          minSendable: { type: "number", integer: true, minimum: 1, explain: "lnurlp.min" },
          maxSendable: { type: "number", integer: true, minimum: 1, explain: "lnurlp.max" },
          metadata: { type: "string", explain: "lnurlp.metadata" },
          allowsNostr: { type: "boolean", explain: "lnurlp.allows-nostr" },
          nostrPubkey: {
            type: "string",
            field: { type: "pubkey" },
            explain: "lnurlp.nostr-pubkey",
          },
        },
        required: ["callback", "minSendable", "maxSendable", "metadata", "tag"],
      },
      examples: [
        {
          id: "erin",
          label: "example.lnurlp",
          explain: "example.lnurlp.explain",
          value: {
            tag: "payRequest",
            callback: "https://wallet.alpha.example/lnurlp/erin/callback",
            minSendable: 1000,
            maxSendable: 100000000000,
            metadata:
              '[["text/plain","Pay erin@wallet.alpha.example"],["text/identifier","erin@wallet.alpha.example"]]',
            allowsNostr: true,
            nostrPubkey: ALPHA_ZAPPER,
          },
        },
      ],
    },
  ],
  http: [
    {
      id: "callback",
      label: "callback.label",
      explain: "callback.explain",
      method: "GET",
      urlTemplate: "<callback>?amount=<msats>&nostr=<uri-encoded zap request>&lnurl=<lnurl>",
      headers: [],
      responses: [
        {
          status: 200,
          explain: "callback.200",
          mediaType: "application/json",
          schema: {
            type: "object",
            properties: {
              pr: {
                type: "string",
                field: { type: "text", pattern: BOLT11_PATTERN },
                explain: "callback.pr",
              },
              routes: { type: "array", items: { type: "any" }, explain: "callback.routes" },
            },
            required: ["pr"],
          },
        },
        { status: 400, explain: "callback.400" },
      ],
      examples: [
        {
          id: "alice-zaps-erin",
          label: "example.callback",
          explain: "example.callback.explain",
          url: `https://wallet.alpha.example/lnurlp/erin/callback?amount=2100000&nostr=${encodeURIComponent(
            JSON.stringify(SIGNED_ZAP_REQUEST),
          )}&lnurl=${ERIN_LNURL}`,
          headers: {},
        },
      ],
    },
  ],
  flows: [
    {
      id: "zap",
      label: "flow.zap.label",
      explain: "flow.zap.explain",
      steps: [
        { part: { kind: "document", id: "lnurlp" }, explain: "flow.zap.lnurlp" },
        { part: { kind: "event", id: "zap-request" }, explain: "flow.zap.request" },
        { part: { kind: "http", id: "callback" }, explain: "flow.zap.callback" },
        { part: { kind: "event", id: "zap-receipt" }, explain: "flow.zap.receipt" },
      ],
    },
  ],
  howItWorks: [
    {
      id: "discover",
      title: "how.discover.title",
      body: "how.discover.body",
      focus: { part: { kind: "document", id: "lnurlp" }, path: ["nostrPubkey"] },
    },
    {
      id: "request",
      title: "how.request.title",
      body: "how.request.body",
      focus: { part: { kind: "event", id: "zap-request" }, path: ["tags"] },
    },
    {
      id: "invoice",
      title: "how.invoice.title",
      body: "how.invoice.body",
      focus: { part: { kind: "http", id: "callback" }, path: ["url"] },
    },
    {
      id: "receipt",
      title: "how.receipt.title",
      body: "how.receipt.body",
      focus: { part: { kind: "event", id: "zap-receipt" }, path: ["tags", 4] },
    },
    {
      id: "validate",
      title: "how.validate.title",
      body: "how.validate.body",
    },
    {
      id: "split",
      title: "how.split.title",
      body: "how.split.body",
      focus: { part: { kind: "event", id: "zap-split" }, path: ["tags", 2] },
    },
  ],
  related: [
    { nip: "01", relation: "depends-on", explain: "related.01" },
    { nip: "47", relation: "see-also", explain: "related.47" },
    { nip: "53", relation: "see-also", explain: "related.53" },
    { nip: "75", relation: "see-also", explain: "related.75" },
  ],
};
