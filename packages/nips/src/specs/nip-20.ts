// Owner: spec author r2 (NIPs 20–39). NIP-20: Command Results — deprecated, merged into NIP-01.
// Kept as a process explainer (EVENT → OK) with the OK message as an editable secondary part,
// so readers who land here from old links still see how command results work today.
import type { NipSpec } from "../spec.ts";

const ALICE = "e550c6e92808f358382b7b8c14345344f5ef9a299529834d1c26d57b6ace44cc";
const NOTE_ID = "91a74c40d508831576cca43d0d0c58793bb60df736783b40ddfbc68deed5ab06";

export const nip20: NipSpec = {
  nip: "20",
  variant: "process",
  howItWorks: [
    { id: "moved", title: "how.moved.title", body: "how.moved.body" },
    {
      id: "send",
      title: "how.send.title",
      body: "how.send.body",
    },
    {
      id: "ok",
      title: "how.ok.title",
      body: "how.ok.body",
      focus: { part: { kind: "message", id: "ok" }, path: [2] },
    },
    {
      id: "prefix",
      title: "how.prefix.title",
      body: "how.prefix.body",
      focus: { part: { kind: "message", id: "ok" }, path: [3] },
    },
  ],
  related: [
    { nip: "01", relation: "replaced-by", explain: "related.01" },
    { nip: "42", relation: "see-also", explain: "related.42" },
    { nip: "13", relation: "see-also", explain: "related.13" },
  ],
  messages: [
    {
      id: "ok",
      label: "msg.ok.label",
      explain: "msg.ok.explain",
      direction: "relay-to-client",
      type: "OK",
      elements: [
        {
          name: "event-id",
          explain: "msg.ok.event-id",
          schema: { type: "string", field: { type: "event-id" } },
        },
        { name: "accepted", explain: "msg.ok.accepted", schema: { type: "boolean" } },
        {
          name: "message",
          explain: "msg.ok.message",
          schema: {
            type: "string",
            field: {
              type: "text",
              pattern:
                "((duplicate|pow|blocked|rate-limited|invalid|restricted|mute|error|auth-required): .*)?",
            },
          },
        },
      ],
      examples: [
        { id: "accepted", label: "example.accepted", message: ["OK", NOTE_ID, true, ""] },
        {
          id: "duplicate",
          label: "example.duplicate",
          explain: "example.duplicate.explain",
          message: ["OK", NOTE_ID, true, "duplicate: already have this event"],
        },
        {
          id: "blocked",
          label: "example.blocked",
          explain: "example.blocked.explain",
          message: ["OK", NOTE_ID, false, "blocked: you are not a paying member of this relay"],
        },
      ],
    },
  ],
  process: {
    actors: [
      { id: "client", label: "actor.client", kind: "client" },
      { id: "relay", label: "actor.relay", kind: "relay" },
    ],
    steps: [
      {
        id: "event",
        from: "client",
        to: "relay",
        label: "step.event.label",
        explain: "step.event.explain",
        packet: "EVENT",
        payload: [
          "EVENT",
          {
            id: NOTE_ID,
            pubkey: ALICE,
            kind: 1,
            created_at: 1735689600,
            tags: [],
            content: "GM #nostr!",
            sig: "…",
          },
        ],
      },
      {
        id: "check",
        from: "relay",
        label: "step.check.label",
        explain: "step.check.explain",
      },
      {
        id: "ok-true",
        from: "relay",
        to: "client",
        label: "step.ok-true.label",
        explain: "step.ok-true.explain",
        packet: "OK",
        payload: ["OK", NOTE_ID, true, ""],
        part: { kind: "message", id: "ok" },
      },
      {
        id: "ok-false",
        from: "relay",
        to: "client",
        label: "step.ok-false.label",
        explain: "step.ok-false.explain",
        packet: "OK",
        payload: ["OK", NOTE_ID, false, "rate-limited: slow down"],
        part: { kind: "message", id: "ok" },
      },
    ],
  },
};
