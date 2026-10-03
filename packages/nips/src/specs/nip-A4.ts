// Owner: spec author r6 (NIPs letter ids). NIP-A4: Public Messages (kind 24).
// `e` tags are forbidden; the shape lists `e` as a deprecated tag so using one is a warning that
// explains why. Explanations: packages/i18n/src/locales/en/nips/r6.ts → nA4.text.
import type { NipSpec } from "../spec.ts";
import { ALPHA, BETA, BOB, DAVE, FIXTURE_NOW, FRANK, RELAY_HINT } from "./r6-common.ts";

const ARTICLE_ADDR = `30023:${FRANK}:protocols-not-platforms`;
const ARTICLE_NADDR =
  "naddr1qqthqun0w3hkxmmvwvkkumm594cxcct5vehhymtnqyv8wumn8ghj7un9d3shjtnzv46xztn90psk6urvv5pzpy3wgw6s4mqk450f68kxs4xqtzqk629egjhzl6daec7eysdl4tacqvzqqqr4guhvmfqn";

const message = { kind: "event", id: "message" } as const;

export const nipA4: NipSpec = {
  nip: "A4",
  variant: "event",
  howItWorks: [
    {
      id: "message",
      title: "how.message.title",
      body: "how.message.body",
      focus: { part: message, path: ["content"] },
    },
    {
      id: "receivers",
      title: "how.receivers.title",
      body: "how.receivers.body",
      focus: { part: message, path: ["tags", 0] },
    },
    { id: "relays", title: "how.relays.title", body: "how.relays.body" },
    { id: "no-threads", title: "how.no-threads.title", body: "how.no-threads.body" },
    {
      id: "expire",
      title: "how.expire.title",
      body: "how.expire.body",
      focus: { part: message, path: ["tags", 1] },
    },
    { id: "public", title: "how.public.title", body: "how.public.body" },
  ],
  related: [
    { nip: "65", relation: "depends-on", explain: "related.65" },
    { nip: "40", relation: "see-also", explain: "related.40" },
    { nip: "18", relation: "see-also", explain: "related.18" },
    { nip: "17", relation: "see-also", explain: "related.17" },
  ],
  events: [
    {
      id: "message",
      label: "event.message.label",
      explain: "event.message.explain",
      kinds: [24],
      content: { format: "text", explain: "content.message", required: true, multiline: true },
      tags: [
        {
          name: "p",
          explain: "tag.p",
          presence: "required",
          repeatable: true,
          fields: [
            { name: "pubkey", type: { type: "pubkey" }, explain: "tag.p.pubkey" },
            RELAY_HINT,
          ],
        },
        {
          name: "expiration",
          explain: "tag.expiration",
          presence: "recommended",
          repeatable: false,
          fields: [
            { name: "timestamp", type: { type: "timestamp" }, explain: "tag.expiration.at" },
          ],
        },
        {
          name: "q",
          explain: "tag.q",
          presence: "optional",
          repeatable: true,
          fields: [
            {
              name: "target",
              type: { type: "text", pattern: "[0-9a-f]{64}|\\d+:[0-9a-f]{64}:.*" },
              explain: "tag.q.target",
            },
            RELAY_HINT,
            { name: "pubkey", type: { type: "pubkey" }, explain: "tag.q.pubkey", optional: true },
          ],
        },
        {
          name: "imeta",
          explain: "tag.imeta",
          presence: "optional",
          repeatable: true,
          fields: [
            {
              name: "url",
              type: { type: "text", pattern: "url https?://\\S+" },
              explain: "tag.imeta.url",
            },
          ],
          rest: {
            name: "property",
            type: { type: "text", pattern: "[a-z_-]+ \\S.*" },
            explain: "tag.imeta.property",
          },
        },
        {
          name: "e",
          explain: "tag.e",
          presence: "optional",
          repeatable: true,
          deprecated: true,
          fields: [{ name: "event-id", type: { type: "event-id" }, explain: "tag.e.id" }],
        },
      ],
      examples: [
        {
          id: "thanks",
          label: "example.thanks",
          explain: "example.thanks.explain",
          signer: "alice",
          template: {
            kind: 24,
            tags: [
              ["p", BOB, BETA],
              ["expiration", String(FIXTURE_NOW + 7 * 24 * 3600)],
            ],
            content: "Saw your talk on relays. The outbox part finally clicked for me, thanks!",
          },
        },
        {
          id: "quote",
          label: "example.quote",
          explain: "example.quote.explain",
          signer: "carol",
          template: {
            kind: 24,
            tags: [
              ["p", BOB, BETA],
              ["p", DAVE, ALPHA],
              ["q", ARTICLE_ADDR, BETA],
            ],
            content: `Have you two read this one? nostr:${ARTICLE_NADDR}`,
          },
        },
      ],
    },
  ],
};
