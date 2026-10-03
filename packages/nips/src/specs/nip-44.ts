// Owner: spec author r3 (NIPs 40–59). NIP-44: Encrypted Payloads (Versioned).
// Explanations: packages/i18n/src/locales/en/nips/r3.ts → n44.text.
//
// Encoding inputs (the editor maps persona pubkeys to their demo secret keys, never real keys):
//   sender     pubkey of the persona whose demo secret key encrypts
//   recipient  pubkey the payload is encrypted to
//   plaintext  1–65535 bytes of UTF-8 text
//   nonce      optional fixed 32-byte nonce (random when empty), only for reproducible demos
import type { NipSpec } from "../spec.ts";

const ALICE = "e550c6e92808f358382b7b8c14345344f5ef9a299529834d1c26d57b6ace44cc";
const BOB = "a73883912a48c3551c1548fd454876d577126a61c76b5486c807bfec5869e183";

export const nip44: NipSpec = {
  nip: "44",
  variant: "encoding",
  encodings: [
    {
      id: "payload-v2",
      label: "encoding.label",
      explain: "encoding.explain",
      codec: "nip44-payload",
      inputs: [
        { name: "sender", type: { type: "pubkey" }, explain: "input.sender" },
        { name: "recipient", type: { type: "pubkey" }, explain: "input.recipient" },
        {
          name: "plaintext",
          type: { type: "text", multiline: true, minLength: 1, maxLength: 65535 },
          explain: "input.plaintext",
        },
        { name: "nonce", type: { type: "hex32" }, explain: "input.nonce", optional: true },
      ],
      output: "output",
      examples: [
        {
          id: "party",
          label: "example.party",
          explain: "example.party.explain",
          inputs: {
            sender: ALICE,
            recipient: BOB,
            plaintext: "Are you going to the party tonight?",
          },
        },
        {
          id: "fixed-nonce",
          label: "example.fixed-nonce",
          explain: "example.fixed-nonce.explain",
          inputs: {
            sender: BOB,
            recipient: ALICE,
            plaintext: "Yes! See you at 9.",
            nonce: "0000000000000000000000000000000000000000000000000000000000000001",
          },
        },
        {
          id: "self",
          label: "example.self",
          explain: "example.self.explain",
          inputs: {
            sender: ALICE,
            recipient: ALICE,
            plaintext: '[["word","spoiler"]]',
          },
        },
      ],
    },
  ],
  howItWorks: [
    {
      id: "conversation-key",
      title: "how.conversation-key.title",
      body: "how.conversation-key.body",
      focus: { part: { kind: "encoding", id: "payload-v2" }, path: ["recipient"] },
    },
    {
      id: "message-keys",
      title: "how.message-keys.title",
      body: "how.message-keys.body",
      focus: { part: { kind: "encoding", id: "payload-v2" }, path: ["nonce"] },
    },
    {
      id: "padding",
      title: "how.padding.title",
      body: "how.padding.body",
      focus: { part: { kind: "encoding", id: "payload-v2" }, path: ["plaintext"] },
    },
    {
      id: "encrypt-mac",
      title: "how.encrypt-mac.title",
      body: "how.encrypt-mac.body",
    },
    {
      id: "encode",
      title: "how.encode.title",
      body: "how.encode.body",
    },
    {
      id: "limits",
      title: "how.limits.title",
      body: "how.limits.body",
    },
  ],
  related: [
    { nip: "04", relation: "replaces", explain: "related.04" },
    { nip: "01", relation: "depends-on", explain: "related.01" },
    { nip: "17", relation: "used-by", explain: "related.17" },
    { nip: "46", relation: "used-by", explain: "related.46" },
    { nip: "51", relation: "used-by", explain: "related.51" },
    { nip: "59", relation: "used-by", explain: "related.59" },
  ],
};
