// Owner: spec author r3 (NIPs 40–59). NIP-49: Private Key Encryption (ncryptsec).
// Explanations: packages/i18n/src/locales/en/nips/r3.ts → n49.text.
//
// Encoding inputs: secret-key (32-byte hex), password (NFKC-normalised by the codec), log-n
// (scrypt cost exponent), key-security (the associated-data byte). The example key is the
// NIP's own published test vector, never a real key.
import type { NipSpec } from "../spec.ts";

const TEST_VECTOR_KEY = "3501454135014541350145413501453fefb02227e449e57cf4d3a3ce05378683";

export const nip49: NipSpec = {
  nip: "49",
  variant: "encoding",
  encodings: [
    {
      id: "ncryptsec",
      label: "encoding.label",
      explain: "encoding.explain",
      codec: "ncryptsec",
      inputs: [
        { name: "secret-key", type: { type: "hex", bytes: 32 }, explain: "input.secret-key" },
        { name: "password", type: { type: "text", minLength: 1 }, explain: "input.password" },
        {
          name: "log-n",
          type: { type: "number", integer: true, min: 1, max: 255 },
          explain: "input.log-n",
        },
        {
          name: "key-security",
          type: {
            type: "enum",
            values: [
              { value: "0", explain: "security.0" },
              { value: "1", explain: "security.1" },
              { value: "2", explain: "security.2" },
            ],
          },
          explain: "input.key-security",
        },
      ],
      output: "output",
      examples: [
        {
          id: "test-vector",
          label: "example.test-vector",
          explain: "example.test-vector.explain",
          inputs: {
            "secret-key": TEST_VECTOR_KEY,
            password: "nostr",
            "log-n": "16",
            "key-security": "2",
          },
        },
        {
          id: "stronger",
          label: "example.stronger",
          explain: "example.stronger.explain",
          inputs: {
            "secret-key": TEST_VECTOR_KEY,
            password: "correct horse battery staple",
            "log-n": "20",
            "key-security": "1",
          },
        },
        {
          id: "unicode",
          label: "example.unicode",
          explain: "example.unicode.explain",
          inputs: {
            "secret-key": TEST_VECTOR_KEY,
            password: "ÅΩẛ̣",
            "log-n": "16",
            "key-security": "0",
          },
        },
      ],
    },
  ],
  howItWorks: [
    {
      id: "password",
      title: "how.password.title",
      body: "how.password.body",
      focus: { part: { kind: "encoding", id: "ncryptsec" }, path: ["password"] },
    },
    {
      id: "scrypt",
      title: "how.scrypt.title",
      body: "how.scrypt.body",
      focus: { part: { kind: "encoding", id: "ncryptsec" }, path: ["log-n"] },
    },
    {
      id: "encrypt",
      title: "how.encrypt.title",
      body: "how.encrypt.body",
      focus: { part: { kind: "encoding", id: "ncryptsec" }, path: ["key-security"] },
    },
    {
      id: "encode",
      title: "how.encode.title",
      body: "how.encode.body",
    },
    {
      id: "keep-private",
      title: "how.keep-private.title",
      body: "how.keep-private.body",
    },
  ],
  related: [
    { nip: "19", relation: "see-also", explain: "related.19" },
    { nip: "06", relation: "see-also", explain: "related.06" },
    { nip: "46", relation: "see-also", explain: "related.46" },
  ],
};
