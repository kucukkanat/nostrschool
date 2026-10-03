// Owner: spec author r1 (NIPs 01–19). NIP-04: Encrypted Direct Message.
// Unrecommended upstream: deprecated in favor of NIP-17 (private DMs with NIP-44 + NIP-59).
// Explanations: packages/i18n/src/locales/en/nips/r1.ts → n04.text.
import type { NipSpec } from "../spec.ts";

const BOB = "a73883912a48c3551c1548fd454876d577126a61c76b5486c807bfec5869e183";

export const nip04: NipSpec = {
  nip: "04",
  variant: "event",
  howItWorks: [
    { id: "deprecated", title: "how.deprecated.title", body: "how.deprecated.body" },
    { id: "secret", title: "how.secret.title", body: "how.secret.body" },
    {
      id: "encrypt",
      title: "how.encrypt.title",
      body: "how.encrypt.body",
      focus: { part: { kind: "event", id: "dm" }, path: ["content"] },
    },
    {
      id: "address",
      title: "how.address.title",
      body: "how.address.body",
      focus: { part: { kind: "event", id: "dm" }, path: ["tags", 0] },
    },
    { id: "leaks", title: "how.leaks.title", body: "how.leaks.body" },
  ],
  related: [
    { nip: "17", relation: "replaced-by", explain: "related.17" },
    { nip: "44", relation: "replaced-by", explain: "related.44" },
    { nip: "42", relation: "see-also", explain: "related.42" },
  ],
  events: [
    {
      id: "dm",
      label: "event.label",
      explain: "event.explain",
      kinds: [4],
      content: {
        format: "encrypted",
        explain: "event.content",
        scheme: "nip04",
        plaintext: { format: "text", explain: "event.plaintext", multiline: true },
      },
      tags: [
        {
          name: "p",
          explain: "tag.p",
          presence: "required",
          repeatable: false,
          fields: [{ name: "pubkey", type: { type: "pubkey" }, explain: "tag.p.pubkey" }],
        },
        {
          name: "e",
          explain: "tag.e",
          presence: "optional",
          repeatable: false,
          fields: [{ name: "event-id", type: { type: "event-id" }, explain: "tag.e.id" }],
        },
      ],
      examples: [
        {
          id: "alice-to-bob",
          label: "example.dm.label",
          explain: "example.dm.explain",
          signer: "alice",
          template: {
            kind: 4,
            tags: [["p", BOB]],
            // nip04Encrypt("Hey Bob, are you coming to the meetup?", alice, bob)
            content:
              "VflHZLcr/hnYEZ42zvmOrxU+pZFlLuLq/9igztCvYSOAizPxPiIAYOaGjU8K9CrX?iv=4RLZSaU0+zUaNHyGn2jV6g==",
          },
        },
      ],
    },
  ],
};
