// Owner: spec author r2 (NIPs 20–39). NIP-26: Delegated Event Signing — UNRECOMMENDED.
// The example is a real delegation: the token is alice's BIP-340 signature (aux rand = 32 zero
// bytes) over sha256("nostr:delegation:<bob pubkey>:<conditions>") made with her demo key.
// r2.test.ts checks the tag and that created_at satisfies the conditions; verifying the token
// itself needs raw Schnorr, which @nostrschool/protocol does not export.
import type { NipSpec } from "../spec.ts";

const ALICE = "e550c6e92808f358382b7b8c14345344f5ef9a299529834d1c26d57b6ace44cc";
export const NIP26_CONDITIONS = "kind=1&created_at>1735603200&created_at<1738281600";
export const NIP26_TOKEN =
  "a12cfbc75c89bf542ce4b5cb633d832e645b27c4ba2346b4e072d58e1502e64de8fb454ff76d9ebd9047c2cb8ddde1f3fd97c42c334f9eae6ad2a8f472b267a8";

export const nip26: NipSpec = {
  nip: "26",
  variant: "event",
  howItWorks: [
    { id: "unrecommended", title: "how.unrecommended.title", body: "how.unrecommended.body" },
    { id: "conditions", title: "how.conditions.title", body: "how.conditions.body" },
    {
      id: "token",
      title: "how.token.title",
      body: "how.token.body",
      focus: { part: { kind: "event", id: "delegated" }, path: ["tags", 0, 3] },
    },
    {
      id: "publish",
      title: "how.publish.title",
      body: "how.publish.body",
      focus: { part: { kind: "event", id: "delegated" }, path: ["tags", 0] },
    },
    { id: "verify", title: "how.verify.title", body: "how.verify.body" },
  ],
  related: [
    { nip: "46", relation: "replaced-by", explain: "related.46" },
    { nip: "01", relation: "depends-on", explain: "related.01" },
  ],
  events: [
    {
      id: "delegated",
      label: "event.delegated.label",
      explain: "event.delegated.explain",
      kinds: [{ from: 0, to: 65535 }],
      content: { format: "text", explain: "content", multiline: true },
      tags: [
        {
          name: "delegation",
          explain: "tag.delegation",
          presence: "required",
          repeatable: false,
          fields: [
            { name: "delegator", type: { type: "pubkey" }, explain: "tag.delegation.delegator" },
            {
              name: "conditions",
              type: {
                type: "text",
                pattern: "(kind=\\d+|created_at[<>]\\d+)(&(kind=\\d+|created_at[<>]\\d+))*",
              },
              explain: "tag.delegation.conditions",
              placeholder: "kind=1&created_at>1735603200&created_at<1738281600",
            },
            { name: "token", type: { type: "hex", bytes: 64 }, explain: "tag.delegation.token" },
          ],
        },
      ],
      examples: [
        {
          id: "note",
          label: "example.note",
          explain: "example.note.explain",
          signer: "bob",
          template: {
            kind: 1,
            created_at: 1735689600,
            tags: [["delegation", ALICE, NIP26_CONDITIONS, NIP26_TOKEN]],
            content: "Posted by Bob's key on Alice's behalf, within the window she allowed.",
          },
        },
      ],
    },
  ],
};
