// Owner: spec author r5 (NIPs 80–99). NIP-98: HTTP Auth.
// Authorization headers are real kind 27235 events signed by the fixture persona "alice" at
// FIXTURE_NOW; the POST example's payload tag is sha256(JSON.stringify(body)).
import type { NipSpec } from "../spec.ts";

const GET_URL = "https://api.alpha.example/v1/notes?limit=10";
const POST_URL = "https://api.alpha.example/v1/profile";

export const nip98: NipSpec = {
  nip: "98",
  variant: "http",
  howItWorks: [
    {
      id: "build",
      title: "how.build.title",
      body: "how.build.body",
      focus: { part: { kind: "event", id: "auth" }, path: ["tags", 0] },
    },
    {
      id: "payload",
      title: "how.payload.title",
      body: "how.payload.body",
      focus: { part: { kind: "event", id: "auth" }, path: ["tags", 2] },
    },
    {
      id: "header",
      title: "how.header.title",
      body: "how.header.body",
      focus: { part: { kind: "http", id: "request" }, path: ["headers", "Authorization"] },
    },
    {
      id: "check",
      title: "how.check.title",
      body: "how.check.body",
    },
    {
      id: "reject",
      title: "how.reject.title",
      body: "how.reject.body",
    },
  ],
  related: [
    { nip: "01", relation: "depends-on", explain: "related.01" },
    { nip: "42", relation: "see-also", explain: "related.42" },
    { nip: "86", relation: "used-by", explain: "related.86" },
    { nip: "96", relation: "used-by", explain: "related.96" },
    { nip: "B7", relation: "see-also", explain: "related.B7" },
  ],
  flows: [
    {
      id: "authorize",
      label: "flow.authorize.label",
      explain: "flow.authorize.explain",
      steps: [
        { part: { kind: "event", id: "auth" }, explain: "flow.authorize.sign" },
        { part: { kind: "http", id: "request" }, explain: "flow.authorize.send" },
      ],
    },
  ],
  http: [
    {
      id: "request",
      label: "http.request.label",
      explain: "http.request.explain",
      method: "GET",
      urlTemplate: "<absolute-url>",
      headers: [
        {
          name: "Authorization",
          explain: "header.authorization",
          value: { type: "base64", of: "event" },
          required: true,
        },
      ],
      body: { mediaType: "application/json", schema: { type: "any", explain: "body" } },
      responses: [
        { status: 200, explain: "response.200" },
        { status: 401, explain: "response.401" },
      ],
      authEvent: "auth",
      examples: [
        {
          id: "get",
          label: "example.get.label",
          explain: "example.get.explain",
          url: GET_URL,
          headers: {
            Authorization:
              "Nostr eyJraW5kIjoyNzIzNSwiY3JlYXRlZF9hdCI6MTczNTY4OTYwMCwidGFncyI6W1sidSIsImh0dHBzOi8vYXBpLmFscGhhLmV4YW1wbGUvdjEvbm90ZXM/bGltaXQ9MTAiXSxbIm1ldGhvZCIsIkdFVCJdXSwiY29udGVudCI6IiIsInB1YmtleSI6ImU1NTBjNmU5MjgwOGYzNTgzODJiN2I4YzE0MzQ1MzQ0ZjVlZjlhMjk5NTI5ODM0ZDFjMjZkNTdiNmFjZTQ0Y2MiLCJpZCI6IjJkZGIxOTA2MTMxYWE2NDY0ZTVlZWI5OTc1NjM5OGZjNTU3NTc0ZTQzNzk3OGNlNmM2MzI0Y2E2OTY0MWE4ZDMiLCJzaWciOiIzYjE1MDU1NDdiMzU2MzI2ZWZmMTkxZjU2ZmQ0NGQ0NmY2YzBhZWRhN2QwZmZhMjU5MDlhMDg1MDZjMzg0NjJkNWE3NWIwNjJmZmQxMjUyZWJmMTZmYjljN2QzNmNkZDY1YjM1MWQwNjc1YTJmZTMwNjIzNWU5NDcxZTU5NzRkMCJ9",
          },
        },
        {
          id: "post",
          label: "example.post.label",
          explain: "example.post.explain",
          url: POST_URL,
          headers: {
            Authorization:
              "Nostr eyJraW5kIjoyNzIzNSwiY3JlYXRlZF9hdCI6MTczNTY4OTYwMCwidGFncyI6W1sidSIsImh0dHBzOi8vYXBpLmFscGhhLmV4YW1wbGUvdjEvcHJvZmlsZSJdLFsibWV0aG9kIiwiUE9TVCJdLFsicGF5bG9hZCIsImRjYWE2NmUwYjE0N2EyYzQzNWI0NTEzMTk1N2Q1ZjExNDIzOTk2NWMwZWYxNWE4NzIyNjAwNTQ1MDllOGExMTQiXV0sImNvbnRlbnQiOiIiLCJwdWJrZXkiOiJlNTUwYzZlOTI4MDhmMzU4MzgyYjdiOGMxNDM0NTM0NGY1ZWY5YTI5OTUyOTgzNGQxYzI2ZDU3YjZhY2U0NGNjIiwiaWQiOiIxZjEwYmJiMTcwMzg1NmI4OTk0ZTQ1ZGM3ZTExMGIyZGNhZmQyN2I4MWQ4ZjZiNzBjMTg0NGQ3Mzk1MjJlNjczIiwic2lnIjoiYmYwY2FmOTYwM2EyMTI0MDZkZDlmN2U1YWQyNWUyZTE5NDIzZTFjNmIyNDUxMTdiN2ZlNDhkNDRjMTE4YjhlOTljODc1Nzg5YzdmZDY1ZDEwMjIwOGMyM2NmYWU3ZjA2M2E1NzcxMzJiYjg3NDJlY2UxNjBmZmQ3NTU3N2NjODIifQ==",
            "Content-Type": "application/json",
          },
          body: { display_name: "Alice", about: "Teaching nostr one event at a time" },
        },
      ],
    },
  ],
  events: [
    {
      id: "auth",
      label: "event.auth.label",
      explain: "event.auth.explain",
      kinds: [27235],
      content: { format: "empty", explain: "content" },
      tags: [
        {
          name: "u",
          explain: "tag.u",
          presence: "required",
          repeatable: false,
          fields: [{ name: "url", type: { type: "url" }, explain: "tag.u.url" }],
        },
        {
          name: "method",
          explain: "tag.method",
          presence: "required",
          repeatable: false,
          fields: [
            {
              name: "method",
              type: {
                type: "enum",
                values: [
                  { value: "GET" },
                  { value: "HEAD" },
                  { value: "POST" },
                  { value: "PUT" },
                  { value: "PATCH" },
                  { value: "DELETE" },
                ],
                open: true,
              },
              explain: "tag.method.value",
            },
          ],
        },
        {
          name: "payload",
          explain: "tag.payload",
          presence: "optional",
          repeatable: false,
          fields: [{ name: "sha256", type: { type: "hex32" }, explain: "tag.payload.hash" }],
        },
      ],
      examples: [
        {
          id: "auth-get",
          label: "example.auth-get.label",
          explain: "example.auth-get.explain",
          signer: "alice",
          template: {
            kind: 27235,
            created_at: 1735689600,
            tags: [
              ["u", GET_URL],
              ["method", "GET"],
            ],
            content: "",
          },
        },
        {
          id: "auth-post",
          label: "example.auth-post.label",
          explain: "example.auth-post.explain",
          signer: "alice",
          template: {
            kind: 27235,
            created_at: 1735689600,
            tags: [
              ["u", POST_URL],
              ["method", "POST"],
              ["payload", "dcaa66e0b147a2c435b45131957d5f114239965c0ef15a872260054509e8a114"],
            ],
            content: "",
          },
        },
      ],
    },
  ],
};
