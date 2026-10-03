// Owner: spec author r1 (NIPs 01–19). NIP-06: Basic key derivation from mnemonic seed phrase.
// Unrecommended upstream ("prefer a single nsec"); no replacement NIP.
// Explanations: packages/i18n/src/locales/en/nips/r1.ts → n06.text.
import type { NipSpec } from "../spec.ts";

export const nip06: NipSpec = {
  nip: "06",
  variant: "encoding",
  howItWorks: [
    { id: "warning", title: "how.warning.title", body: "how.warning.body" },
    {
      id: "words",
      title: "how.words.title",
      body: "how.words.body",
      focus: { part: { kind: "encoding", id: "mnemonic" }, path: ["mnemonic"] },
    },
    { id: "seed", title: "how.seed.title", body: "how.seed.body" },
    {
      id: "path",
      title: "how.path.title",
      body: "how.path.body",
      focus: { part: { kind: "encoding", id: "mnemonic" }, path: ["account"] },
    },
    { id: "keys", title: "how.keys.title", body: "how.keys.body" },
  ],
  related: [
    { nip: "19", relation: "see-also", explain: "related.19" },
    { nip: "49", relation: "see-also", explain: "related.49" },
  ],
  encodings: [
    {
      id: "mnemonic",
      label: "enc.label",
      explain: "enc.explain",
      codec: "mnemonic",
      inputs: [
        {
          name: "mnemonic",
          type: { type: "text", pattern: "[a-z]+( [a-z]+){11}(( [a-z]+){3}){0,4}" },
          explain: "enc.mnemonic",
        },
        {
          name: "account",
          type: { type: "number", integer: true, min: 0, max: 2147483647 },
          explain: "enc.account",
          optional: true,
        },
      ],
      output: "enc.output",
      examples: [
        {
          id: "vector-12",
          label: "example.v12.label",
          explain: "example.v12.explain",
          inputs: {
            mnemonic:
              "leader monkey parrot ring guide accident before fence cannon height naive bean",
            account: "0",
          },
        },
        {
          id: "vector-24",
          label: "example.v24.label",
          explain: "example.v24.explain",
          inputs: {
            mnemonic:
              "what bleak badge arrange retreat wolf trade produce cricket blur garlic valid proud rude strong choose busy staff weather area salt hollow arm fade",
            account: "0",
          },
        },
      ],
    },
  ],
};
