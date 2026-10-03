// Owner: spec author r4 (NIPs 60–79). NIP-77: Negentropy Syncing.
// The hex payloads are real Negentropy V1 messages over four fixture kind-1 notes: the client
// holds the three oldest, the relay holds all four (see nip-77.test.ts, which re-derives them).
import type { JsonSchema, NipSpec } from "../spec.ts";

// The four newest fixture notes are exactly the kind-1 events since this timestamp.
const SINCE = 1735684200;

/** Client's opening message: one range to infinity carrying the fingerprint of its 3 ids. */
export const NEG_OPEN_FINGERPRINT = "610000017e29764226281e850921e67be4857641";
/** "I have nothing yet": one range to infinity with an empty IdList. */
export const NEG_OPEN_EMPTY = "6100000200";
/** Relay's answer: the fingerprints differ, so it lists all 4 ids it holds. */
export const NEG_MSG_RELAY_IDS =
  "61000002046f762f141286ff49dc17f167204069df048758cf0a4cd83dae2455f277241253814d487f9a9591bde04009eff371facb26e82f3a41cec1bcdcdab310075053be6639e66fdcb9537f1ef90678c8f627e8d6be496613a226d28b89e6ebd687c119ea2e3eb8fe5e6cfbc202da21df546f68c6673e9a00c0aed61cffbac7aed9faf7";
/** Client's IdList of its 3 ids (what it would send when answering with ids instead). */
export const NEG_MSG_CLIENT_IDS =
  "61000002036f762f141286ff49dc17f167204069df048758cf0a4cd83dae2455f277241253814d487f9a9591bde04009eff371facb26e82f3a41cec1bcdcdab310075053be6639e66fdcb9537f1ef90678c8f627e8d6be496613a226d28b89e6ebd687c119";

const subId: JsonSchema = { type: "string", field: { type: "text", minLength: 1, maxLength: 64 } };
const negMessage: JsonSchema = {
  type: "string",
  // Version byte 0x61 ("a" = V1) then ranges, hex-encoded.
  field: { type: "text", pattern: "6[1-9a-f](?:[0-9a-f]{2})*" },
};

export const nip77: NipSpec = {
  nip: "77",
  variant: "message",
  howItWorks: [
    {
      id: "open",
      title: "how.open.title",
      body: "how.open.body",
      focus: { part: { kind: "message", id: "neg-open" }, path: [3] },
    },
    {
      id: "ranges",
      title: "how.ranges.title",
      body: "how.ranges.body",
      focus: { part: { kind: "message", id: "neg-open" }, path: [3] },
    },
    {
      id: "reply",
      title: "how.reply.title",
      body: "how.reply.body",
      focus: { part: { kind: "message", id: "neg-msg-relay" }, path: [2] },
    },
    {
      id: "transfer",
      title: "how.transfer.title",
      body: "how.transfer.body",
    },
    {
      id: "close",
      title: "how.close.title",
      body: "how.close.body",
      focus: { part: { kind: "message", id: "neg-close" } },
    },
  ],
  related: [
    { nip: "01", relation: "extends", explain: "related.01" },
    { nip: "11", relation: "see-also", explain: "related.11" },
    { nip: "45", relation: "see-also", explain: "related.45" },
  ],
  flows: [
    {
      id: "sync",
      label: "flow.label",
      explain: "flow.explain",
      steps: [
        { part: { kind: "message", id: "neg-open" }, explain: "flow.open" },
        { part: { kind: "message", id: "neg-msg-relay" }, explain: "flow.relay" },
        { part: { kind: "message", id: "neg-msg-client" }, explain: "flow.client" },
        { part: { kind: "message", id: "neg-close" }, explain: "flow.close" },
      ],
    },
  ],
  messages: [
    {
      id: "neg-open",
      label: "open.label",
      explain: "open.explain",
      direction: "client-to-relay",
      type: "NEG-OPEN",
      replies: ["neg-msg-relay", "neg-err"],
      elements: [
        { name: "subscription-id", explain: "sub", schema: subId },
        { name: "filter", explain: "open.filter", schema: { type: "filter" } },
        { name: "initial-message", explain: "open.initial", schema: negMessage },
      ],
      examples: [
        {
          id: "fingerprint",
          label: "open.example.fp.label",
          explain: "open.example.fp.explain",
          message: ["NEG-OPEN", "sync-1", { kinds: [1], since: SINCE }, NEG_OPEN_FINGERPRINT],
        },
        {
          id: "empty",
          label: "open.example.empty.label",
          explain: "open.example.empty.explain",
          message: ["NEG-OPEN", "sync-2", { kinds: [7], since: SINCE }, NEG_OPEN_EMPTY],
        },
      ],
    },
    {
      id: "neg-msg-relay",
      label: "msg-relay.label",
      explain: "msg-relay.explain",
      direction: "relay-to-client",
      type: "NEG-MSG",
      elements: [
        { name: "subscription-id", explain: "sub", schema: subId },
        { name: "message", explain: "msg.message", schema: negMessage },
      ],
      examples: [
        {
          id: "ids",
          label: "msg-relay.example.label",
          explain: "msg-relay.example.explain",
          message: ["NEG-MSG", "sync-1", NEG_MSG_RELAY_IDS],
        },
      ],
    },
    {
      id: "neg-msg-client",
      label: "msg-client.label",
      explain: "msg-client.explain",
      direction: "client-to-relay",
      type: "NEG-MSG",
      replies: ["neg-msg-relay", "neg-err"],
      elements: [
        { name: "subscription-id", explain: "sub", schema: subId },
        { name: "message", explain: "msg.message", schema: negMessage },
      ],
      examples: [
        {
          id: "ids",
          label: "msg-client.example.ids.label",
          explain: "msg-client.example.ids.explain",
          message: ["NEG-MSG", "sync-1", NEG_MSG_CLIENT_IDS],
        },
        {
          id: "done",
          label: "msg-client.example.done.label",
          explain: "msg-client.example.done.explain",
          message: ["NEG-MSG", "sync-1", "61"],
        },
      ],
    },
    {
      id: "neg-err",
      label: "err.label",
      explain: "err.explain",
      direction: "relay-to-client",
      type: "NEG-ERR",
      elements: [
        { name: "subscription-id", explain: "sub", schema: subId },
        {
          name: "reason",
          explain: "err.reason",
          schema: { type: "string", field: { type: "text", pattern: "[a-z-]+: .*" } },
        },
        {
          name: "max-records",
          explain: "err.max",
          optional: true,
          schema: { type: "number", integer: true, minimum: 0 },
        },
      ],
      examples: [
        {
          id: "blocked",
          label: "err.example.blocked.label",
          explain: "err.example.blocked.explain",
          message: ["NEG-ERR", "sync-2", "blocked: this query is too big", 500000],
        },
        {
          id: "closed",
          label: "err.example.closed.label",
          explain: "err.example.closed.explain",
          message: ["NEG-ERR", "sync-1", "closed: you took too long to respond!"],
        },
      ],
    },
    {
      id: "neg-close",
      label: "close.label",
      explain: "close.explain",
      direction: "client-to-relay",
      type: "NEG-CLOSE",
      elements: [{ name: "subscription-id", explain: "sub", schema: subId }],
      examples: [
        {
          id: "close",
          label: "close.example.label",
          explain: "close.example.explain",
          message: ["NEG-CLOSE", "sync-1"],
        },
      ],
    },
  ],
};
