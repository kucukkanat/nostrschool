// Owner: spec author r4 (NIPs 60–79). NIP-61: Nutzaps.
// Story: alice nutzaps bob 21 sats for his "hot take" note (a fixture event). Bob's P2PK key is
// the wallet key from his NIP-60 wallet, never his Nostr key.
import type { FieldType, JsonSchema, NipSpec } from "../spec.ts";

const BOB = "a73883912a48c3551c1548fd454876d577126a61c76b5486c807bfec5869e183";
const BOB_NOTE = "814d487f9a9591bde04009eff371facb26e82f3a41cec1bcdcdab310075053be";
const BOB_P2PK = "02ce87ef1996211c634dfcbfba0116c09a87b4ca338b66369553ed3fd0fda5d5ea";
const MINT = "https://mint.beta.example";

// Proofs are illustrative (not minted), but shaped exactly like Cashu NUT-00 proofs with a
// NUT-11 P2PK secret locked to bob's wallet key and a NUT-12 DLEQ proof.
const proof = (amount: number, nonce: string, c: string): string =>
  JSON.stringify({
    amount,
    C: c,
    id: "000a93d6f8a1d2c4",
    secret: JSON.stringify(["P2PK", { nonce, data: BOB_P2PK }]),
    dleq: {
      e: "b31e58ac6527f34975ffab13e70a48b6d2b0d35abc4b03f0151f09ee1a9763d4",
      s: "8fbae004c59e754d71df67e392b6ae4e29293113ddc2ec86592a0431d16306d8",
      r: "a6d13fcd7a18442e6076f5e1e7c887ad5de40a019824bdfa9fe740d302e8d861",
    },
  });

const proofSchema: JsonSchema = {
  type: "object",
  explain: "nutzap.proof.json",
  required: ["amount", "C", "id", "secret"],
  properties: {
    amount: { type: "number", integer: true, minimum: 1, explain: "nutzap.proof.amount" },
    C: { type: "string", explain: "nutzap.proof.C", field: { type: "hex", bytes: 33 } },
    id: { type: "string", explain: "nutzap.proof.id" },
    secret: { type: "string", explain: "nutzap.proof.secret" },
    dleq: { type: "object", explain: "nutzap.proof.dleq", properties: {} },
  },
};

const url: FieldType = { type: "url", schemes: ["https", "http"] };
const unit: FieldType = {
  type: "enum",
  open: true,
  values: [{ value: "sat" }, { value: "msat" }, { value: "usd" }, { value: "eur" }],
};

export const nip61: NipSpec = {
  nip: "61",
  variant: "event",
  howItWorks: [
    {
      id: "advertise",
      title: "how.advertise.title",
      body: "how.advertise.body",
      focus: { part: { kind: "event", id: "nutzap-info" } },
    },
    {
      id: "lock",
      title: "how.lock.title",
      body: "how.lock.body",
      focus: { part: { kind: "event", id: "nutzap-info" }, path: ["tags", 3] },
    },
    {
      id: "send",
      title: "how.send.title",
      body: "how.send.body",
      focus: { part: { kind: "event", id: "nutzap" }, path: ["tags", 0] },
    },
    {
      id: "receive",
      title: "how.receive.title",
      body: "how.receive.body",
      focus: { part: { kind: "event", id: "nutzap" }, path: ["tags", 4] },
    },
    {
      id: "redeem",
      title: "how.redeem.title",
      body: "how.redeem.body",
      focus: { part: { kind: "event", id: "redemption" }, path: ["tags", 0] },
    },
    { id: "verify", title: "how.verify.title", body: "how.verify.body" },
  ],
  related: [
    { nip: "60", relation: "depends-on", explain: "related.60" },
    { nip: "65", relation: "depends-on", explain: "related.65" },
    { nip: "57", relation: "see-also", explain: "related.57" },
    { nip: "44", relation: "depends-on", explain: "related.44" },
  ],
  flows: [
    {
      id: "nutzap",
      label: "flow.label",
      explain: "flow.explain",
      steps: [
        { part: { kind: "event", id: "nutzap-info" }, explain: "flow.info" },
        { part: { kind: "event", id: "nutzap" }, explain: "flow.nutzap" },
        { part: { kind: "event", id: "redemption" }, explain: "flow.redemption" },
      ],
    },
  ],
  events: [
    {
      id: "nutzap-info",
      label: "info.label",
      explain: "info.explain",
      kinds: [10019],
      content: { format: "empty" },
      tags: [
        {
          name: "relay",
          explain: "info.tag.relay",
          presence: "recommended",
          repeatable: true,
          fields: [{ name: "url", type: { type: "relay-url" }, explain: "info.tag.relay.url" }],
        },
        {
          name: "mint",
          explain: "info.tag.mint",
          presence: "required",
          repeatable: true,
          fields: [{ name: "url", type: url, explain: "info.tag.mint.url" }],
          rest: { name: "unit", type: unit, explain: "info.tag.mint.unit" },
        },
        {
          name: "pubkey",
          explain: "info.tag.pubkey",
          presence: "required",
          repeatable: false,
          fields: [
            {
              name: "p2pk-pubkey",
              type: { type: "text", pattern: "(02|03)?[0-9a-f]{64}" },
              explain: "info.tag.pubkey.key",
            },
          ],
        },
      ],
      examples: [
        {
          id: "bob",
          label: "info.example.label",
          explain: "info.example.explain",
          signer: "bob",
          template: {
            kind: 10019,
            tags: [
              ["relay", "wss://relay.beta.example"],
              ["relay", "wss://relay.gamma.example"],
              ["mint", MINT, "sat"],
              ["pubkey", BOB_P2PK],
            ],
            content: "",
          },
        },
      ],
    },
    {
      id: "nutzap",
      label: "nutzap.label",
      explain: "nutzap.explain",
      kinds: [9321],
      content: { format: "text", explain: "nutzap.content" },
      tags: [
        {
          name: "proof",
          explain: "nutzap.tag.proof",
          presence: "required",
          repeatable: true,
          fields: [
            {
              name: "proof",
              type: { type: "json", schema: proofSchema },
              explain: "nutzap.tag.proof.json",
            },
          ],
        },
        {
          name: "unit",
          explain: "nutzap.tag.unit",
          presence: "optional",
          repeatable: false,
          fields: [{ name: "unit", type: unit, explain: "nutzap.tag.unit.value" }],
        },
        {
          name: "u",
          explain: "nutzap.tag.u",
          presence: "required",
          repeatable: false,
          fields: [{ name: "mint", type: url, explain: "nutzap.tag.u.mint" }],
        },
        {
          name: "e",
          explain: "nutzap.tag.e",
          presence: "optional",
          repeatable: false,
          fields: [
            { name: "event-id", type: { type: "event-id" }, explain: "nutzap.tag.e.id" },
            {
              name: "relay",
              type: { type: "relay-url" },
              explain: "nutzap.tag.e.relay",
              optional: true,
            },
          ],
        },
        {
          name: "k",
          explain: "nutzap.tag.k",
          presence: "optional",
          repeatable: false,
          fields: [{ name: "kind", type: { type: "kind" }, explain: "nutzap.tag.k.kind" }],
        },
        {
          name: "p",
          explain: "nutzap.tag.p",
          presence: "required",
          repeatable: false,
          fields: [{ name: "pubkey", type: { type: "pubkey" }, explain: "nutzap.tag.p.pubkey" }],
        },
      ],
      examples: [
        {
          id: "zap-note",
          label: "nutzap.example.label",
          explain: "nutzap.example.explain",
          template: {
            kind: 9321,
            tags: [
              [
                "proof",
                proof(
                  16,
                  "b00bdd0467b0090a25bdf2d2f0d45ac4e355c482c1418350f273a04fedaaee83",
                  "02277c66191736eb72fce9d975d08e3191f8f96afb73ab1eec37e4465683066d3f",
                ),
              ],
              [
                "proof",
                proof(
                  4,
                  "5e1f3d2c0a9b8e7d6c5b4a39281706f5e4d3c2b1a09f8e7d6c5b4a3928170615",
                  "03a0c1b2d3e4f5061728394a5b6c7d8e9fa0b1c2d3e4f5061728394a5b6c7d8e9f",
                ),
              ],
              [
                "proof",
                proof(
                  1,
                  "c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3",
                  "02f1e2d3c4b5a69788796a5b4c3d2e1f00f1e2d3c4b5a69788796a5b4c3d2e1f00",
                ),
              ],
              ["unit", "sat"],
              ["u", MINT],
              ["e", BOB_NOTE, "wss://relay.beta.example"],
              ["k", "1"],
              ["p", BOB],
            ],
            content: "Spicy take, and I agree. Have some ecash!",
          },
        },
        {
          id: "profile",
          label: "nutzap.example.profile.label",
          explain: "nutzap.example.profile.explain",
          signer: "grace",
          template: {
            kind: 9321,
            tags: [
              [
                "proof",
                proof(
                  1,
                  "0f1e2d3c4b5a69788796a5b4c3d2e1f00f1e2d3c4b5a69788796a5b4c3d2e1f0",
                  "0341d98a8197ef238a192d47edf191a9de78b657308937b4f7dd0aa53beae72c46",
                ),
              ],
              ["u", MINT],
              ["p", BOB],
            ],
            content: "",
          },
        },
      ],
    },
    {
      id: "redemption",
      label: "redemption.label",
      explain: "redemption.explain",
      kinds: [7376],
      content: {
        format: "encrypted",
        explain: "redemption.content",
        scheme: "nip44",
        plaintext: { format: "text", explain: "redemption.plaintext", required: true },
      },
      tags: [
        {
          name: "e",
          explain: "redemption.tag.e",
          presence: "required",
          repeatable: true,
          fields: [
            { name: "event-id", type: { type: "event-id" }, explain: "redemption.tag.e.id" },
            {
              name: "relay",
              type: { type: "text" },
              explain: "redemption.tag.e.relay",
              placeholder: "",
            },
            {
              name: "marker",
              type: { type: "enum", values: [{ value: "redeemed" }] },
              explain: "redemption.tag.e.marker",
            },
          ],
          template: ["e", "", "", "redeemed"],
        },
        {
          name: "p",
          explain: "redemption.tag.p",
          presence: "recommended",
          repeatable: true,
          fields: [
            { name: "pubkey", type: { type: "pubkey" }, explain: "redemption.tag.p.pubkey" },
          ],
        },
      ],
      examples: [
        {
          id: "bob-redeems",
          label: "redemption.example.label",
          explain: "redemption.example.explain",
          signer: "bob",
          template: {
            kind: 7376,
            tags: [
              // The nutzap event id depends on the demo signature, so a stable stand-in is used.
              [
                "e",
                "3c5e7a9b1d2f4a6c8e0b2d4f6a8c0e2b4d6f8a0c2e4b6d8f0a2c4e6b8d0f2a4c",
                "wss://relay.beta.example",
                "redeemed",
              ],
              ["p", "e550c6e92808f358382b7b8c14345344f5ef9a299529834d1c26d57b6ace44cc"],
            ],
            content:
              "AtsfKb45xpvnPeKJRPGITp0zNTJGj571euyBvX5Obvu94BZyo4ANrQ54rQIjdtb8n+SYTpkdbLoCMZMVgH014U6F0exOdUpUpzl2ozck392Bq6ZJpZ/1218Z9d0k0RHWQK/z//qu0tZyKBsBQb5ocAotGGNS8AzmPe5enidmBQCi/AOErhlJV6r2ZbC+Rwc8KrrK6BW1X41VZa5KmjEWuW1vlqpeICVlyaDBttM91N7+dcON+Am/5nAmvil5jDaL7hRRx9xfZqYQJFIQ4FGBqkODRb+p1nwW++foh4Z+9j92maWkg+9NFTOb1vfUrh7u31ysiiAQNqHLrwjEf1UhxF2GjA==",
          },
        },
      ],
    },
  ],
};
