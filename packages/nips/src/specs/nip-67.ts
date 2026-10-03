// Owner: spec author r4 (NIPs 60–79). NIP-67: EOSE Completeness Hint.
import type { NipSpec } from "../spec.ts";

const ALICE = "e550c6e92808f358382b7b8c14345344f5ef9a299529834d1c26d57b6ace44cc";

export const nip67: NipSpec = {
  nip: "67",
  variant: "message",
  howItWorks: [
    {
      id: "problem",
      title: "how.problem.title",
      body: "how.problem.body",
      focus: { part: { kind: "message", id: "req" } },
    },
    {
      id: "hint",
      title: "how.hint.title",
      body: "how.hint.body",
      focus: { part: { kind: "message", id: "eose" }, path: [2] },
    },
    {
      id: "finish",
      title: "how.finish.title",
      body: "how.finish.body",
      focus: { part: { kind: "message", id: "eose" }, path: [2, 0] },
    },
    { id: "absent", title: "how.absent.title", body: "how.absent.body" },
    { id: "compat", title: "how.compat.title", body: "how.compat.body" },
  ],
  related: [
    { nip: "01", relation: "extends", explain: "related.01" },
    { nip: "42", relation: "see-also", explain: "related.42" },
    { nip: "11", relation: "see-also", explain: "related.11" },
  ],
  flows: [
    {
      id: "paginate",
      label: "flow.label",
      explain: "flow.explain",
      steps: [
        { part: { kind: "message", id: "req" }, explain: "flow.req" },
        { part: { kind: "message", id: "eose" }, explain: "flow.eose" },
      ],
    },
  ],
  messages: [
    {
      id: "eose",
      label: "eose.label",
      explain: "eose.explain",
      direction: "relay-to-client",
      type: "EOSE",
      elements: [
        {
          name: "subscription-id",
          explain: "eose.sub",
          schema: { type: "string", field: { type: "text", minLength: 1, maxLength: 64 } },
        },
        {
          name: "hints",
          explain: "eose.hints",
          optional: true,
          schema: {
            type: "array",
            items: {
              type: "string",
              field: {
                type: "enum",
                open: true,
                values: [
                  { value: "finish", explain: "hint.finish" },
                  { value: "more", explain: "hint.more" },
                  { value: "auth", explain: "hint.auth" },
                ],
              },
            },
          },
        },
      ],
      examples: [
        {
          id: "finish",
          label: "eose.example.finish.label",
          explain: "eose.example.finish.explain",
          message: ["EOSE", "sub2", ["finish"]],
        },
        {
          id: "more",
          label: "eose.example.more.label",
          explain: "eose.example.more.explain",
          message: ["EOSE", "sub2b", ["more"]],
        },
        {
          id: "auth",
          label: "eose.example.auth.label",
          explain: "eose.example.auth.explain",
          message: ["EOSE", "sub4", ["auth", "finish"]],
        },
        {
          id: "legacy",
          label: "eose.example.legacy.label",
          explain: "eose.example.legacy.explain",
          message: ["EOSE", "sub2"],
        },
      ],
    },
    {
      id: "req",
      label: "req.label",
      explain: "req.explain",
      direction: "client-to-relay",
      type: "REQ",
      replies: ["eose"],
      elements: [
        {
          name: "subscription-id",
          explain: "req.sub",
          schema: { type: "string", field: { type: "text", minLength: 1, maxLength: 64 } },
        },
        { name: "filter", explain: "req.filter", schema: { type: "filter" }, repeatable: true },
      ],
      examples: [
        {
          id: "notes",
          label: "req.example.label",
          explain: "req.example.explain",
          message: ["REQ", "sub2b", { authors: [ALICE], kinds: [1], limit: 500 }],
        },
      ],
    },
  ],
};
