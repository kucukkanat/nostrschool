// Owner: spec author r1 (NIPs 01–19). NIP-13: Proof of Work.
// Explanations: packages/i18n/src/locales/en/nips/r1.ts → n13.text.
import type { NipSpec } from "../spec.ts";

export const nip13: NipSpec = {
  nip: "13",
  variant: "event",
  howItWorks: [
    {
      id: "difficulty",
      title: "how.difficulty.title",
      body: "how.difficulty.body",
      focus: { part: { kind: "event", id: "mined" }, path: ["id"] },
    },
    {
      id: "nonce",
      title: "how.nonce.title",
      body: "how.nonce.body",
      focus: { part: { kind: "event", id: "mined" }, path: ["tags", 0, 1] },
    },
    {
      id: "target",
      title: "how.target.title",
      body: "how.target.body",
      focus: { part: { kind: "event", id: "mined" }, path: ["tags", 0, 2] },
    },
    { id: "verify", title: "how.verify.title", body: "how.verify.body" },
    { id: "delegate", title: "how.delegate.title", body: "how.delegate.body" },
  ],
  related: [
    { nip: "01", relation: "depends-on", explain: "related.01" },
    { nip: "11", relation: "see-also", explain: "related.11" },
  ],
  events: [
    {
      id: "mined",
      label: "event.label",
      explain: "event.explain",
      kinds: [{ from: 0, to: 65535 }],
      content: { format: "text", explain: "event.content", multiline: true },
      tags: [
        {
          name: "nonce",
          explain: "tag.nonce",
          presence: "required",
          repeatable: false,
          fields: [
            {
              name: "nonce",
              type: { type: "number", integer: true, min: 0 },
              explain: "tag.nonce.value",
            },
            {
              name: "target",
              type: { type: "number", integer: true, min: 0, max: 256 },
              explain: "tag.nonce.target",
              optional: true,
            },
          ],
        },
      ],
      examples: [
        {
          id: "mined-16",
          label: "example.mined.label",
          explain: "example.mined.explain",
          signer: "alice",
          template: {
            kind: 1,
            created_at: 1735689600,
            // Found by minePow with alice's key: id 0000b8e5… has 16 leading zero bits.
            tags: [["nonce", "13569", "16"]],
            content: "Mined this note by hand. 16 leading zero bits!",
          },
        },
      ],
    },
  ],
};
