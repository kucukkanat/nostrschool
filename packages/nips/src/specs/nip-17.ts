// Owner: spec author r1 (NIPs 01–19). NIP-17: Private Direct Messages.
// Explanations: packages/i18n/src/locales/en/nips/r1.ts → n17.text.
// Seal and gift-wrap examples are the real fixture layers of alice's "Meetup?" DM to bob
// (@nostrschool/fixtures giftWraps()), so they decrypt with the demo keys.
import type { NipSpec, TagFieldSpec, TagSpec } from "../spec.ts";

const BOB = "a73883912a48c3551c1548fd454876d577126a61c76b5486c807bfec5869e183";

const RELAY: TagFieldSpec = {
  name: "relay",
  type: { type: "relay-url" },
  explain: "tag.relay-hint",
  optional: true,
};
const receivers: TagSpec = {
  name: "p",
  explain: "tag.p.receiver",
  presence: "required",
  repeatable: true,
  fields: [{ name: "pubkey", type: { type: "pubkey" }, explain: "tag.p.pubkey" }, RELAY],
};
const subject: TagSpec = {
  name: "subject",
  explain: "tag.subject",
  presence: "optional",
  repeatable: false,
  fields: [{ name: "title", type: { type: "text" }, explain: "tag.subject.title" }],
};
const replyTo: TagSpec = {
  name: "e",
  explain: "tag.e.reply",
  presence: "optional",
  repeatable: false,
  fields: [
    { name: "event-id", type: { type: "event-id" }, explain: "tag.e.id" },
    RELAY,
    {
      name: "marker",
      type: { type: "enum", values: [{ value: "reply" }] },
      explain: "tag.e.marker",
      optional: true,
    },
  ],
};
const quote: TagSpec = {
  name: "q",
  explain: "tag.q",
  presence: "optional",
  repeatable: true,
  fields: [
    {
      name: "target",
      type: { type: "text", pattern: "[0-9a-f]{64}|\\d+:[0-9a-f]{64}:.*" },
      explain: "tag.q.target",
    },
    RELAY,
    { name: "pubkey", type: { type: "pubkey" }, explain: "tag.q.pubkey", optional: true },
  ],
};
const simple = (
  name: string,
  presence: TagSpec["presence"],
  type: TagFieldSpec["type"],
  repeatable = false,
): TagSpec => ({
  name,
  explain: `tag.${name}`,
  presence,
  repeatable,
  fields: [{ name: "value", type, explain: `tag.${name}.value` }],
});
const HEX32 = { type: "hex32" } as const;

export const nip17: NipSpec = {
  nip: "17",
  variant: "event",
  howItWorks: [
    {
      id: "inbox",
      title: "how.inbox.title",
      body: "how.inbox.body",
      focus: { part: { kind: "event", id: "dm-relays" }, path: ["tags"] },
    },
    {
      id: "rumor",
      title: "how.rumor.title",
      body: "how.rumor.body",
      focus: { part: { kind: "event", id: "chat-message" }, path: ["tags"] },
    },
    {
      id: "seal",
      title: "how.seal.title",
      body: "how.seal.body",
      focus: { part: { kind: "event", id: "seal" }, path: ["content"] },
    },
    {
      id: "wrap",
      title: "how.wrap.title",
      body: "how.wrap.body",
      focus: { part: { kind: "event", id: "gift-wrap" }, path: ["pubkey"] },
    },
    {
      id: "fan-out",
      title: "how.fan-out.title",
      body: "how.fan-out.body",
      focus: { part: { kind: "event", id: "gift-wrap" }, path: ["tags", 0] },
    },
    { id: "rooms", title: "how.rooms.title", body: "how.rooms.body" },
  ],
  related: [
    { nip: "44", relation: "depends-on", explain: "related.44" },
    { nip: "59", relation: "depends-on", explain: "related.59" },
    { nip: "42", relation: "see-also", explain: "related.42" },
    { nip: "04", relation: "replaces", explain: "related.04" },
    { nip: "40", relation: "see-also", explain: "related.40" },
  ],
  flows: [
    {
      id: "send",
      label: "flow.send.label",
      explain: "flow.send.explain",
      steps: [
        { part: { kind: "event", id: "dm-relays" }, explain: "flow.send.inbox" },
        { part: { kind: "event", id: "chat-message" }, explain: "flow.send.rumor" },
        { part: { kind: "event", id: "seal" }, explain: "flow.send.seal" },
        { part: { kind: "event", id: "gift-wrap" }, explain: "flow.send.wrap" },
      ],
    },
  ],
  events: [
    {
      id: "chat-message",
      label: "chat.label",
      explain: "chat.explain",
      kinds: [14],
      signature: "none",
      content: { format: "text", explain: "chat.content", required: true, multiline: true },
      tags: [receivers, replyTo, subject, quote],
      examples: [
        {
          id: "meetup",
          label: "example.chat.label",
          explain: "example.chat.explain",
          signer: "alice",
          template: {
            kind: 14,
            created_at: 1735678200,
            tags: [
              ["p", BOB, "wss://relay.beta.example"],
              ["subject", "Meetup?"],
            ],
            content: "Hey Bob! Want to co-host a Nostr meetup next month?",
          },
        },
      ],
    },
    {
      id: "file-message",
      label: "file.label",
      explain: "file.explain",
      kinds: [15],
      signature: "none",
      content: { format: "text", explain: "file.content", required: true, field: { type: "url" } },
      tags: [
        receivers,
        replyTo,
        subject,
        simple("file-type", "required", { type: "text", pattern: "[\\w.+-]+/[\\w.+-]+" }),
        simple("encryption-algorithm", "required", {
          type: "enum",
          values: [{ value: "aes-gcm", explain: "tag.encryption-algorithm.aes-gcm" }],
        }),
        simple("decryption-key", "required", { type: "text", minLength: 1 }),
        simple("decryption-nonce", "required", { type: "text", minLength: 1 }),
        simple("x", "required", HEX32),
        simple("ox", "recommended", HEX32),
        simple("size", "optional", { type: "number", integer: true, min: 0 }),
        simple("dim", "optional", { type: "text", pattern: "\\d+x\\d+" }),
        simple("thumbhash", "optional", { type: "text" }),
        simple("blurhash", "optional", { type: "text" }),
        simple("thumb", "optional", { type: "url" }),
        simple("fallback", "optional", { type: "url" }, true),
      ],
      examples: [
        {
          id: "photo",
          label: "example.file.label",
          explain: "example.file.explain",
          signer: "alice",
          template: {
            kind: 15,
            created_at: 1735678500,
            tags: [
              ["p", BOB, "wss://relay.beta.example"],
              ["file-type", "image/jpeg"],
              ["encryption-algorithm", "aes-gcm"],
              [
                "decryption-key",
                "6a0f3c2b8e1d4f5a9b7c6d2e1f0a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c",
              ],
              ["decryption-nonce", "9c1f4e2a7b3d5c6e8f0a1b2c"],
              ["x", "f2b1c7a4e9d03658b4a1c2d3e4f5061728394a5b6c7d8e9f0a1b2c3d4e5f6071"],
              ["ox", "0d4c1e9b7a6f5e3d2c1b0a99887766554433221100ffeeddccbbaa9988776655"],
              ["size", "248113"],
              ["dim", "1200x800"],
            ],
            content: "https://files.alpha.example/f2b1c7a4e9d03658.bin",
          },
        },
      ],
    },
    {
      id: "seal",
      label: "seal.label",
      explain: "seal.explain",
      kinds: [13],
      unknownTags: "warn",
      content: {
        format: "encrypted",
        explain: "seal.content",
        scheme: "nip44",
        plaintext: {
          format: "json",
          explain: "seal.plaintext",
          schema: { type: "event", signed: false },
        },
      },
      // NIP-17 says the expiration tag SHOULD also go on the seal, which contradicts NIP-59's
      // "tags MUST be empty" for kind 13; we follow NIP-17 here and explain the conflict.
      tags: [
        {
          name: "expiration",
          explain: "tag.expiration.seal",
          presence: "optional",
          repeatable: false,
          fields: [{ name: "value", type: { type: "timestamp" }, explain: "tag.expiration.value" }],
        },
      ],
      examples: [
        {
          id: "meetup-seal",
          label: "example.seal.label",
          explain: "example.seal.explain",
          signer: "alice",
          template: {
            kind: 13,
            created_at: 1735670281,
            tags: [],
            content:
              "Ajtm493XtffBy0PMDks9DDz6TbWjNqPJxMw+jbSG5GGpeTgOAoH+4LJOiHAMKPWbUAIumpuxPwK55ntOgp867demtHKg/djT6fUyc6NQg3zdlk4Bj/RqGcApSBurFSWUOIRwX65xdCIJvO+euVNRFH/Vscfb13Xtr5qtwezS2UvwxOH8vTuxoMx6vfMw1XgpJtw920UUHqKx1spBo6vdbrgvUypeopjbXy/I4g0ijkrXiWYOvf3AwUMmjN2tc2WKwut3msokB+WT5IESgxWGR/eqiSqadJRpBq370kf6kQQIxolHGyVi/XoTorOFOO9X5nzElCUybBVWFtF9z+4NmEx8eZDdq1ZN9xYuJQGROU40yO6bpOxvYLPxIHK7iQCOjmNFIu8AqbnqEk1xx5kp/p+EpToAT7FOGPMOpllZxOrI9Gy0yI0nIkqBQEgNnzQu7pi/z4rh0VspWfBzpdA1Vvr9PQxWCh4u4XEx0GLs15y5GcX3N8I2SJMBUytzf77FH46QGFfb9mlGU7YRdkFENyLxkJAi8hrL5Mj2Y16ya5qOUFiZcEZqq0N6s6DQJNtx25brQ/Eea2Kb4BGdjrXMJl8ZGA==",
          },
        },
      ],
    },
    {
      id: "gift-wrap",
      label: "wrap.label",
      explain: "wrap.explain",
      kinds: [1059],
      content: {
        format: "encrypted",
        explain: "wrap.content",
        scheme: "nip44",
        plaintext: {
          format: "json",
          explain: "wrap.plaintext",
          schema: { type: "event", shape: "seal", signed: true },
        },
      },
      tags: [
        {
          name: "p",
          explain: "tag.p.wrap",
          presence: "required",
          repeatable: false,
          fields: [{ name: "pubkey", type: { type: "pubkey" }, explain: "tag.p.pubkey" }, RELAY],
        },
        simple("expiration", "optional", { type: "timestamp" }),
      ],
      examples: [
        {
          id: "meetup-wrap",
          label: "example.wrap.label",
          explain: "example.wrap.explain",
          // Real wraps are signed by a one-time random key; dave stands in for it here.
          signer: "dave",
          template: {
            kind: 1059,
            created_at: 1735573471,
            tags: [["p", BOB]],
            content:
              "AggH1Q2rgRPnaBZBl9/WtXAqEmMIoFZwSIn19RsqMfwer9Nzkfnf8to0f6MUf7XBEid1ZkgF+Adb5ThpgO2fJl0xQB/YsMz8oXJ258WUBZlezhc8RhArYqAAnyZba0mEFZprHMD4RvIrbu6eD5OZWpP1+pbRhMRQK5o/e06UOUf7JI0RuaAKms4HUBeQk+xtvjWNsFVSnhe3YiYPtyBC7dx65mn1nvGh2XqVXPerunBDxpB0jWAbkTQ8kdxKFgHtIPj8pIUIU1t8r3b+JD+pbDpjN5Q1XtGQJu/HTfJcaSmnGBbVgKw21NjfqRYujzZC1Xvgbp48l0xszXC86SlDPXalT6HkZOPrNZ/Z9QTOv4LxXDPtDt6JvqBJBMzG97etzUWGBUd5q1rVMooM2GDcDbfEnQt0js9yGUc9XhDayTsoqWMwPN/7cfVDRQ8y54FXn8V3cm9AjF5vRCmfP8vxgpR4Eq4osMZ7gRsHJRTw+vG9VIsQQBMkm74OSzOszgVeo00HHRlUPvNGYyQjnQH6u/4kSNOz4k9KPRhRRl3eXBfgE3vafkg9H7pqG0Sen1pT3ZGqHUsJW9PkvMQj4ou/A3/HVbiw5/J23c8PRR3IJ2F+MtX11gJ29IAsfhCiJ+T3inlpwadL/LBt+XVTef90K3BmkprPmRl6JgrDwgFLQ/3HDZF3Gq0nJPk2JNfUOcLzweAsy8z5MJrjGvIhLUJtjODvivYFX5mvPJZH07LYyheVvC9B89+gKyP2+3+3dD2I0syO1MJr3iSPj0M4c0koLns0BhzNQoeWexxgfiUwhvulvMfn4RRReA8FLaR+HMJ5ethOfRX706qVK7u06lsy1rTxX0+gdmNysfNTuKUWeV28WzRrF2NFzCaMH8OjrNmXv9K8isXnIHJcNHcpjdNs7EfUapvFCjy87ctawcHQntoQ/D8k5NmaMVTrYv+1ZkLlUIm06cjQqpwwCgo6wWk/57yhQfCQVaz5BTQGsVTnGykPsjfu/LGsx+2x9ais4rQj0vp0YPf9kA842C/vw1ZieG/ErxrAPoIIaSsj7MaAqCRIss9iuBU5FBdimE2KWCa/N08+oehvNyHd3cFq1fUZ0YclxhkprqK9gScorpLbMGAWWnW0Z1tA2LlSbR6UoXsKQwCcyDghGa8DKHl3UnRjymJLOhCVzkQb+bCagGjFDjc2RiPy6JwaOBmzvk0lyXqkmZbdEcDU9CfjuRudXh7AztSQR+Dz6t2Gw0jtt5fTu4Slt/qWnG7SSHx5M/XU0ApFRwCJ79sKNT2h/KJGxjRctiBnxH19T06iFTHYrOCUdc6Hchp8u3iaqdAb1v0o5gucugS0mDLZ5dNiiweDlLHDDnP2N6BBT/0pZYzOZ4cyxGxcQ5PXzsykY5X/fl+2Eln6ilLKQDuha/Dd0CPxsdLDCgylCTgTS3nbI0Tb7fmabJr7ciY=",
          },
        },
      ],
    },
    {
      id: "dm-relays",
      label: "inbox.label",
      explain: "inbox.explain",
      kinds: [10050],
      content: { format: "empty", explain: "inbox.content" },
      tags: [
        {
          name: "relay",
          explain: "tag.relay",
          presence: "required",
          repeatable: true,
          fields: [{ name: "url", type: { type: "relay-url" }, explain: "tag.relay.url" }],
        },
      ],
      examples: [
        {
          id: "bob-inbox",
          label: "example.inbox.label",
          explain: "example.inbox.explain",
          signer: "bob",
          template: {
            kind: 10050,
            tags: [
              ["relay", "wss://relay.beta.example"],
              ["relay", "wss://relay.gamma.example"],
            ],
            content: "",
          },
        },
      ],
    },
  ],
};
