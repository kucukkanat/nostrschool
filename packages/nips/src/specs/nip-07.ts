// Owner: spec author r1 (NIPs 01–19). NIP-07: window.nostr capability for web browsers.
// Explanations: packages/i18n/src/locales/en/nips/r1.ts → n07.text.
import type { NipSpec } from "../spec.ts";

const ALICE = "e550c6e92808f358382b7b8c14345344f5ef9a299529834d1c26d57b6ace44cc";
const BOB = "a73883912a48c3551c1548fd454876d577126a61c76b5486c807bfec5869e183";

const TEMPLATE = {
  created_at: 1735689600,
  kind: 1,
  tags: [],
  content: "Signed without sharing my key",
};

export const nip07: NipSpec = {
  nip: "07",
  variant: "process",
  howItWorks: [
    { id: "why", title: "how.why.title", body: "how.why.body" },
    { id: "detect", title: "how.detect.title", body: "how.detect.body" },
    { id: "pubkey", title: "how.pubkey.title", body: "how.pubkey.body" },
    { id: "sign", title: "how.sign.title", body: "how.sign.body" },
    { id: "encrypt", title: "how.encrypt.title", body: "how.encrypt.body" },
  ],
  related: [
    { nip: "01", relation: "depends-on", explain: "related.01" },
    { nip: "44", relation: "see-also", explain: "related.44" },
    { nip: "46", relation: "see-also", explain: "related.46" },
    { nip: "55", relation: "see-also", explain: "related.55" },
  ],
  process: {
    actors: [
      { id: "user", label: "actor.user", kind: "user" },
      { id: "app", label: "actor.app", kind: "client" },
      { id: "ext", label: "actor.ext", kind: "extension" },
    ],
    steps: [
      {
        id: "detect",
        from: "app",
        label: "step.detect.label",
        explain: "step.detect.explain",
        payload: { check: "typeof window.nostr !== 'undefined'" },
      },
      {
        id: "get-public-key",
        from: "app",
        to: "ext",
        label: "step.get-public-key.label",
        explain: "step.get-public-key.explain",
        packet: "custom",
        payload: { call: "window.nostr.getPublicKey()" },
      },
      {
        id: "approve",
        from: "ext",
        to: "user",
        label: "step.approve.label",
        explain: "step.approve.explain",
      },
      {
        id: "public-key",
        from: "ext",
        to: "app",
        label: "step.public-key.label",
        explain: "step.public-key.explain",
        packet: "custom",
        payload: ALICE,
      },
      {
        id: "sign-event",
        from: "app",
        to: "ext",
        label: "step.sign-event.label",
        explain: "step.sign-event.explain",
        packet: "custom",
        payload: { call: "window.nostr.signEvent(event)", event: TEMPLATE },
      },
      {
        id: "signed",
        from: "ext",
        to: "app",
        label: "step.signed.label",
        explain: "step.signed.explain",
        packet: "custom",
        payload: {
          ...TEMPLATE,
          pubkey: ALICE,
          id: "<sha256 of the serialized event>",
          sig: "<schnorr signature>",
        },
      },
      {
        id: "encrypt",
        from: "app",
        to: "ext",
        label: "step.encrypt.label",
        explain: "step.encrypt.explain",
        packet: "custom",
        payload: {
          call: "window.nostr.nip44.encrypt(pubkey, plaintext)",
          pubkey: BOB,
          plaintext: "hi Bob",
        },
      },
    ],
  },
};
