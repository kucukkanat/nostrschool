// Owner: spec author r3 (NIPs 40–59). NIP-55: Android Signer Application.
// Explanations: packages/i18n/src/locales/en/nips/r3.ts → n55.text.
//
// A behaviour NIP: Android intents, content resolver queries and nostrsigner: URLs, not Nostr
// events. The process walkthrough shows each request with an illustrative payload.
import type { NipSpec } from "../spec.ts";

const ALICE = "e550c6e92808f358382b7b8c14345344f5ef9a299529834d1c26d57b6ace44cc";
const PACKAGE = "com.example.signer";
const NOTE = {
  kind: 1,
  created_at: 1735689600,
  tags: [],
  content: "Signed on my phone, key never left the signer.",
};

export const nip55: NipSpec = {
  nip: "55",
  variant: "process",
  process: {
    actors: [
      { id: "user", label: "actor.user", kind: "user" },
      { id: "client", label: "actor.client", kind: "client" },
      { id: "signer", label: "actor.signer", kind: "signer" },
    ],
    steps: [
      {
        id: "get-public-key",
        from: "client",
        to: "signer",
        label: "step.get-public-key.label",
        explain: "step.get-public-key.explain",
        packet: "custom",
        payload: {
          uri: "nostrsigner:",
          extras: {
            type: "get_public_key",
            permissions: '[{"type":"sign_event","kind":22242},{"type":"nip44_decrypt"}]',
          },
        },
      },
      {
        id: "approve-login",
        from: "user",
        to: "signer",
        label: "step.approve-login.label",
        explain: "step.approve-login.explain",
      },
      {
        id: "pubkey-result",
        from: "signer",
        to: "client",
        label: "step.pubkey-result.label",
        explain: "step.pubkey-result.explain",
        packet: "custom",
        payload: { result: ALICE, package: PACKAGE },
      },
      {
        id: "sign-intent",
        from: "client",
        to: "signer",
        label: "step.sign-intent.label",
        explain: "step.sign-intent.explain",
        packet: "custom",
        payload: {
          uri: `nostrsigner:${JSON.stringify(NOTE)}`,
          package: PACKAGE,
          extras: { type: "sign_event", id: "req-1", current_user: ALICE },
        },
      },
      {
        id: "approve-sign",
        from: "user",
        to: "signer",
        label: "step.approve-sign.label",
        explain: "step.approve-sign.explain",
      },
      {
        id: "sign-result",
        from: "signer",
        to: "client",
        label: "step.sign-result.label",
        explain: "step.sign-result.explain",
        packet: "custom",
        payload: { result: "<signature hex>", id: "req-1", event: "<signed event JSON>" },
      },
      {
        id: "content-resolver",
        from: "client",
        to: "signer",
        label: "step.content-resolver.label",
        explain: "step.content-resolver.explain",
        packet: "custom",
        payload: {
          uri: `content://${PACKAGE}.SIGN_EVENT`,
          selectionArgs: [JSON.stringify(NOTE), "", ALICE],
        },
      },
      {
        id: "resolver-result",
        from: "signer",
        to: "client",
        label: "step.resolver-result.label",
        explain: "step.resolver-result.explain",
        packet: "custom",
        payload: { columns: { result: "<signature hex>", event: "<signed event JSON>" } },
      },
      {
        id: "web",
        from: "client",
        to: "signer",
        label: "step.web.label",
        explain: "step.web.explain",
        packet: "custom",
        payload: {
          url: "nostrsigner:<url-encoded event JSON>?compressionType=none&returnType=signature&type=sign_event&callbackUrl=https://client.example/?event=",
        },
      },
    ],
  },
  howItWorks: [
    { id: "setup", title: "how.setup.title", body: "how.setup.body" },
    { id: "login", title: "how.login.title", body: "how.login.body" },
    { id: "intents", title: "how.intents.title", body: "how.intents.body" },
    { id: "resolver", title: "how.resolver.title", body: "how.resolver.body" },
    { id: "web", title: "how.web.title", body: "how.web.body" },
    { id: "methods", title: "how.methods.title", body: "how.methods.body" },
  ],
  related: [
    { nip: "46", relation: "see-also", explain: "related.46" },
    { nip: "07", relation: "see-also", explain: "related.07" },
    { nip: "44", relation: "see-also", explain: "related.44" },
    { nip: "42", relation: "see-also", explain: "related.42" },
  ],
};
