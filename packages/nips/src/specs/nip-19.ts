// Owner: spec author r1 (NIPs 01–19). NIP-19: bech32-encoded entities.
// Explanations: packages/i18n/src/locales/en/nips/r1.ts → n19.text.
// Input names follow @nostrschool/protocol's pointer fields (pubkey, id, relays, author, kind,
// identifier) so the editor can pass an example's inputs straight to nip19Encode.
import type { EncodingInputSpec, NipSpec } from "../spec.ts";

const ALICE = "e550c6e92808f358382b7b8c14345344f5ef9a299529834d1c26d57b6ace44cc";
const BOB = "a73883912a48c3551c1548fd454876d577126a61c76b5486c807bfec5869e183";
const FRANK = "922e43b50aec16ad1e9d1ec6854c058816d28b944ae2fe9bdce3d9241bfaafb8";
const BOB_NOTE = "814d487f9a9591bde04009eff371facb26e82f3a41cec1bcdcdab310075053be";

const relays: EncodingInputSpec = {
  name: "relays",
  type: { type: "relay-url" },
  explain: "input.relays",
  optional: true,
  repeatable: true,
};
const pubkey: EncodingInputSpec = {
  name: "pubkey",
  type: { type: "pubkey" },
  explain: "input.pubkey",
};

export const nip19: NipSpec = {
  nip: "19",
  variant: "encoding",
  howItWorks: [
    { id: "display", title: "how.display.title", body: "how.display.body" },
    {
      id: "bare",
      title: "how.bare.title",
      body: "how.bare.body",
      focus: { part: { kind: "encoding", id: "npub" } },
    },
    {
      id: "tlv",
      title: "how.tlv.title",
      body: "how.tlv.body",
      focus: { part: { kind: "encoding", id: "nprofile" }, path: ["relays"] },
    },
    {
      id: "naddr",
      title: "how.naddr.title",
      body: "how.naddr.body",
      focus: { part: { kind: "encoding", id: "naddr" }, path: ["identifier"] },
    },
    { id: "never-in-events", title: "how.never-in-events.title", body: "how.never-in-events.body" },
  ],
  related: [
    { nip: "21", relation: "used-by", explain: "related.21" },
    { nip: "27", relation: "used-by", explain: "related.27" },
    { nip: "49", relation: "see-also", explain: "related.49" },
    { nip: "01", relation: "see-also", explain: "related.01" },
  ],
  encodings: [
    {
      id: "npub",
      label: "npub.label",
      explain: "npub.explain",
      codec: "npub",
      inputs: [pubkey],
      output: "npub.output",
      examples: [
        {
          id: "spec",
          label: "example.npub-spec.label",
          explain: "example.npub-spec.explain",
          inputs: { pubkey: "7e7e9c42a91bfef19fa929e5fda1b72e0ebc1a4c1141673e2794234d86addf4e" },
        },
        { id: "alice", label: "example.npub-alice.label", inputs: { pubkey: ALICE } },
      ],
    },
    {
      id: "nsec",
      label: "nsec.label",
      explain: "nsec.explain",
      codec: "nsec",
      inputs: [
        { name: "secretKey", type: { type: "hex", bytes: 32 }, explain: "input.secret-key" },
      ],
      output: "nsec.output",
      examples: [
        {
          id: "spec",
          label: "example.nsec-spec.label",
          explain: "example.nsec-spec.explain",
          inputs: { secretKey: "67dea2ed018072d675f5415ecfaed7d2597555e202d85b3d65ea4e58d2d92ffa" },
        },
      ],
    },
    {
      id: "note",
      label: "note.label",
      explain: "note.explain",
      codec: "note",
      inputs: [{ name: "id", type: { type: "event-id" }, explain: "input.id" }],
      output: "note.output",
      examples: [{ id: "bob", label: "example.note.label", inputs: { id: BOB_NOTE } }],
    },
    {
      id: "nprofile",
      label: "nprofile.label",
      explain: "nprofile.explain",
      codec: "nprofile",
      inputs: [pubkey, relays],
      output: "nprofile.output",
      examples: [
        {
          id: "spec",
          label: "example.nprofile-spec.label",
          explain: "example.nprofile-spec.explain",
          inputs: {
            pubkey: "3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d",
            relays: ["wss://r.x.com", "wss://djbas.sadkb.com"],
          },
        },
        {
          id: "alice",
          label: "example.nprofile-alice.label",
          inputs: { pubkey: ALICE, relays: ["wss://relay.alpha.example"] },
        },
      ],
    },
    {
      id: "nevent",
      label: "nevent.label",
      explain: "nevent.explain",
      codec: "nevent",
      inputs: [
        { name: "id", type: { type: "event-id" }, explain: "input.id" },
        relays,
        { name: "author", type: { type: "pubkey" }, explain: "input.author", optional: true },
        { name: "kind", type: { type: "kind" }, explain: "input.kind", optional: true },
      ],
      output: "nevent.output",
      examples: [
        {
          id: "bob",
          label: "example.nevent.label",
          explain: "example.nevent.explain",
          inputs: { id: BOB_NOTE, relays: ["wss://relay.beta.example"], author: BOB, kind: "1" },
        },
      ],
    },
    {
      id: "naddr",
      label: "naddr.label",
      explain: "naddr.explain",
      codec: "naddr",
      inputs: [
        { name: "identifier", type: { type: "text" }, explain: "input.identifier" },
        pubkey,
        { name: "kind", type: { type: "kind" }, explain: "input.kind-addr" },
        relays,
      ],
      output: "naddr.output",
      examples: [
        {
          id: "article",
          label: "example.naddr.label",
          explain: "example.naddr.explain",
          inputs: {
            identifier: "protocols-not-platforms",
            pubkey: FRANK,
            kind: "30023",
            relays: ["wss://relay.beta.example"],
          },
        },
      ],
    },
  ],
};
