// Owner: spec author r1 (NIPs 01–19). NIP-16: Event Treatment.
// Deprecated upstream: "Moved to NIP-01" (regular / replaceable / ephemeral kind ranges).
// Explanations: packages/i18n/src/locales/en/nips/r1.ts → n16.text.
import type { NipSpec } from "../spec.ts";

const ALICE = "e550c6e92808f358382b7b8c14345344f5ef9a299529834d1c26d57b6ace44cc";

export const nip16: NipSpec = {
  nip: "16",
  variant: "process",
  howItWorks: [
    { id: "moved", title: "how.moved.title", body: "how.moved.body" },
    { id: "regular", title: "how.regular.title", body: "how.regular.body" },
    { id: "replaceable", title: "how.replaceable.title", body: "how.replaceable.body" },
    { id: "ephemeral", title: "how.ephemeral.title", body: "how.ephemeral.body" },
  ],
  related: [
    { nip: "01", relation: "replaced-by", explain: "related.01" },
    { nip: "33", relation: "see-also", explain: "related.33" },
  ],
  process: {
    actors: [
      { id: "client", label: "actor.client", kind: "client" },
      { id: "relay", label: "actor.relay", kind: "relay" },
      { id: "other", label: "actor.other", kind: "client" },
    ],
    steps: [
      {
        id: "profile-v1",
        from: "client",
        to: "relay",
        label: "step.profile-v1.label",
        explain: "step.profile-v1.explain",
        packet: "EVENT",
        payload: [
          "EVENT",
          { kind: 0, pubkey: ALICE, created_at: 1733097600, content: '{"name":"alice"}' },
        ],
      },
      {
        id: "profile-v2",
        from: "client",
        to: "relay",
        label: "step.profile-v2.label",
        explain: "step.profile-v2.explain",
        packet: "EVENT",
        payload: [
          "EVENT",
          {
            kind: 0,
            pubkey: ALICE,
            created_at: 1735689600,
            content: '{"name":"alice","about":"Protocol nerd"}',
          },
        ],
      },
      {
        id: "replace",
        from: "relay",
        label: "step.replace.label",
        explain: "step.replace.explain",
      },
      {
        id: "ephemeral",
        from: "client",
        to: "relay",
        label: "step.ephemeral.label",
        explain: "step.ephemeral.explain",
        packet: "EVENT",
        payload: [
          "EVENT",
          { kind: 20001, pubkey: ALICE, created_at: 1735689600, content: "typing…" },
        ],
      },
      {
        id: "forward",
        from: "relay",
        to: "other",
        label: "step.forward.label",
        explain: "step.forward.explain",
        packet: "EVENT",
        payload: ["EVENT", "live", { kind: 20001, pubkey: ALICE, content: "typing…" }],
      },
    ],
  },
};
