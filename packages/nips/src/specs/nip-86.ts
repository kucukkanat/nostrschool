// Owner: spec author r5 (NIPs 80–99). NIP-86: Relay Management API.
// Authorization headers below are real NIP-98 events signed by the fixture persona "dave"
// (created_at = FIXTURE_NOW, payload = sha256 of the exact JSON body shown).
import type { EnumOption, JsonSchema, NipSpec } from "../spec.ts";

const RELAY_HTTP = "https://relay.delta.example/";
const FRANK = "922e43b50aec16ad1e9d1ec6854c058816d28b944ae2fe9bdce3d9241bfaafb8";

/** Every method in the NIP, in its order; each explains itself via `method.<name>`. */
const METHODS = [
  "supportedmethods",
  "banpubkey",
  "unbanpubkey",
  "listbannedpubkeys",
  "allowpubkey",
  "unallowpubkey",
  "listallowedpubkeys",
  "createrole",
  "editrole",
  "deleterole",
  "assignrole",
  "unassignrole",
  "listclaims",
  "createclaim",
  "deleteclaim",
  "listeventsneedingmoderation",
  "allowevent",
  "unallowevent",
  "banevent",
  "unbanevent",
  "listbannedevents",
  "listallowedevents",
  "changerelayname",
  "changerelaydescription",
  "changerelayicon",
  "allowkind",
  "disallowkind",
  "listallowedkinds",
  "listdisallowedkinds",
  "blockip",
  "unblockip",
  "listblockedips",
] as const;

const methodValues: readonly EnumOption[] = METHODS.map((m) => ({
  value: m,
  explain: `method.${m}`,
}));

const param: JsonSchema = {
  type: "any-of",
  explain: "body.params.item",
  options: [
    { type: "string", explain: "body.params.string" },
    { type: "number", explain: "body.params.number" },
  ],
};

export const nip86: NipSpec = {
  nip: "86",
  variant: "http",
  howItWorks: [
    {
      id: "same-url",
      title: "how.same-url.title",
      body: "how.same-url.body",
      focus: { part: { kind: "http", id: "rpc" }, path: ["url"] },
    },
    {
      id: "authorize",
      title: "how.authorize.title",
      body: "how.authorize.body",
      focus: { part: { kind: "event", id: "auth" }, path: ["tags"] },
    },
    {
      id: "call",
      title: "how.call.title",
      body: "how.call.body",
      focus: { part: { kind: "http", id: "rpc" }, path: ["body", "method"] },
    },
    {
      id: "discover",
      title: "how.discover.title",
      body: "how.discover.body",
      focus: { part: { kind: "http", id: "rpc" }, path: ["body"] },
    },
    {
      id: "answer",
      title: "how.answer.title",
      body: "how.answer.body",
    },
  ],
  related: [
    { nip: "98", relation: "depends-on", explain: "related.98" },
    { nip: "11", relation: "see-also", explain: "related.11" },
    { nip: "43", relation: "see-also", explain: "related.43" },
    { nip: "42", relation: "see-also", explain: "related.42" },
  ],
  flows: [
    {
      id: "manage",
      label: "flow.manage.label",
      explain: "flow.manage.explain",
      steps: [
        { part: { kind: "event", id: "auth" }, explain: "flow.manage.auth" },
        { part: { kind: "http", id: "rpc" }, explain: "flow.manage.rpc" },
      ],
    },
  ],
  http: [
    {
      id: "rpc",
      label: "http.rpc.label",
      explain: "http.rpc.explain",
      method: "POST",
      urlTemplate: "https://<relay-host>/",
      headers: [
        {
          name: "Content-Type",
          explain: "header.content-type",
          value: {
            type: "enum",
            values: [{ value: "application/nostr+json+rpc", explain: "header.content-type.value" }],
          },
          required: true,
        },
        {
          name: "Authorization",
          explain: "header.authorization",
          value: { type: "base64", of: "event" },
          required: true,
        },
      ],
      body: {
        mediaType: "application/nostr+json+rpc",
        schema: {
          type: "object",
          explain: "body",
          properties: {
            method: {
              type: "string",
              explain: "body.method",
              field: { type: "enum", values: methodValues, open: true },
            },
            params: { type: "array", explain: "body.params", items: param },
          },
          required: ["method", "params"],
        },
      },
      responses: [
        {
          status: 200,
          explain: "response.200",
          mediaType: "application/json",
          schema: {
            type: "object",
            explain: "response.200.body",
            properties: {
              result: { type: "any", explain: "response.200.result" },
              error: { type: "string", explain: "response.200.error" },
            },
          },
        },
        { status: 401, explain: "response.401" },
      ],
      authEvent: "auth",
      examples: [
        {
          id: "supportedmethods",
          label: "example.supportedmethods.label",
          explain: "example.supportedmethods.explain",
          url: RELAY_HTTP,
          headers: {
            "Content-Type": "application/nostr+json+rpc",
            Authorization:
              "Nostr eyJraW5kIjoyNzIzNSwiY3JlYXRlZF9hdCI6MTczNTY4OTYwMCwidGFncyI6W1sidSIsImh0dHBzOi8vcmVsYXkuZGVsdGEuZXhhbXBsZS8iXSxbIm1ldGhvZCIsIlBPU1QiXSxbInBheWxvYWQiLCJjOGM1ZThiYzVhMGExNTJkMDUzN2M5MjVkMjlmYTk1YTk0NTY3MTViZDc3ZDZkZDRjMmUxZjk2MTc1OTIwYWI1Il1dLCJjb250ZW50IjoiIiwicHVia2V5IjoiMWMwMjhiMzllN2YzMjI4NDQ0YjMyNjFlNGI3MThlZmE5MmE5MTQ3MDA4NmI0NGM5YTcyZWY1MzU3ZTk3MDE0OCIsImlkIjoiNWI1MDRhYzZiZTdlY2ZhODhmMGMxZmEwZTUxOTk5ZWE0NWJjYjUyNDBiMDk0Y2MxYjZlMmY0ZWRkNTljNDg1NyIsInNpZyI6ImI4ZjhkMTBjMzgwYzhkYTZjMjJjZjdkZDIwYzM5YjFlNGY3MjU4OWQ5NTY5ODU4MjkyMGZlN2VlN2Y4ODdlNjAzYjM2ODQ2MTgzNTdmM2IzYTg4Y2MxOGQyYTQ2OTkwMTBhYjRhNzI5NGU4MmU3ZjYwMzAwZDEyNDdmNjI2ZjQyIn0=",
          },
          body: { method: "supportedmethods", params: [] },
        },
        {
          id: "banpubkey",
          label: "example.banpubkey.label",
          explain: "example.banpubkey.explain",
          url: RELAY_HTTP,
          headers: {
            "Content-Type": "application/nostr+json+rpc",
            Authorization:
              "Nostr eyJraW5kIjoyNzIzNSwiY3JlYXRlZF9hdCI6MTczNTY4OTYwMCwidGFncyI6W1sidSIsImh0dHBzOi8vcmVsYXkuZGVsdGEuZXhhbXBsZS8iXSxbIm1ldGhvZCIsIlBPU1QiXSxbInBheWxvYWQiLCI5YWFiZWIyYmI3OTk1MmU2YTU0NjhlMGYwZGRmMzRiOTZjZmE4MDdhOWU1YjQ1MmNmYWI3MjMzOWIzY2Y3NmVlIl1dLCJjb250ZW50IjoiIiwicHVia2V5IjoiMWMwMjhiMzllN2YzMjI4NDQ0YjMyNjFlNGI3MThlZmE5MmE5MTQ3MDA4NmI0NGM5YTcyZWY1MzU3ZTk3MDE0OCIsImlkIjoiNzExZDAzNmM5NWVhZTdjZTdiZWFmNmMzYzg5NGI0ZmJhMjAyZjRlZTkwYWU4MWRhMGEzN2FkMzhlZDIxOWM0ZiIsInNpZyI6IjViZGE5NTQ4ZDE0Mzg3OGFiZDc3ZTZlYjUzYjkxZDA1YzdjNTljNzQxZDlkOGRiYWQ3MWFkZmE3MDE4ODJiY2Y4ZGRmNDM3MDJiNGQyMzA4ODI3ZTgwMDE1NzIzYjE3MDU0MDNlZDAzZmRhYzUwNzZkNWExNzg0ZWY2YzU5YTQ0In0=",
          },
          body: { method: "banpubkey", params: [FRANK, "spam bot"] },
        },
        {
          id: "allowkind",
          label: "example.allowkind.label",
          explain: "example.allowkind.explain",
          url: RELAY_HTTP,
          headers: {
            "Content-Type": "application/nostr+json+rpc",
            Authorization:
              "Nostr eyJraW5kIjoyNzIzNSwiY3JlYXRlZF9hdCI6MTczNTY4OTYwMCwidGFncyI6W1sidSIsImh0dHBzOi8vcmVsYXkuZGVsdGEuZXhhbXBsZS8iXSxbIm1ldGhvZCIsIlBPU1QiXSxbInBheWxvYWQiLCIzYWI4MzUwMjVmNDk0OWUyMDZlYjFhZGNmMGE4MmUzOTcxMzA2YjhmM2RhM2FkZGI1MmE1NzhlZTIwYzJlMTI3Il1dLCJjb250ZW50IjoiIiwicHVia2V5IjoiMWMwMjhiMzllN2YzMjI4NDQ0YjMyNjFlNGI3MThlZmE5MmE5MTQ3MDA4NmI0NGM5YTcyZWY1MzU3ZTk3MDE0OCIsImlkIjoiMmNlMWU4YWJiY2EyNWYwODJjNmQyODllNGI0MDZhYWYwMzJlZWI2OTg4Njc4NDVjYzJmZTU3M2QzOTIwMTYwMCIsInNpZyI6ImIwNzBlYmQ2ZDFmMDZhMzczMmYwMWY0NGE4MmEwN2MxZDZjNjg5NzVlY2M0MjZlYzA5OGU1ZjQ3YzVhNzc3ODYwODY5OGI5YTUwMDkyOTMyMzkxZWJhYjUzNWUwNmZkYTVkMTE5MWMwNTMyMGI0N2E1ZDFlOTdmNGI4Y2I0ODhhIn0=",
          },
          body: { method: "allowkind", params: [30023] },
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
      content: { format: "empty", explain: "event.auth.content" },
      tags: [
        {
          name: "u",
          explain: "event.auth.u",
          presence: "required",
          repeatable: false,
          fields: [{ name: "url", type: { type: "url" }, explain: "event.auth.u.url" }],
        },
        {
          name: "method",
          explain: "event.auth.method",
          presence: "required",
          repeatable: false,
          fields: [
            {
              name: "method",
              type: { type: "enum", values: [{ value: "POST" }] },
              explain: "event.auth.method.value",
            },
          ],
        },
        {
          name: "payload",
          explain: "event.auth.payload",
          presence: "required",
          repeatable: false,
          fields: [{ name: "sha256", type: { type: "hex32" }, explain: "event.auth.payload.hash" }],
        },
      ],
      examples: [
        {
          id: "auth-supportedmethods",
          label: "example.auth.label",
          explain: "example.auth.explain",
          signer: "dave",
          template: {
            kind: 27235,
            created_at: 1735689600,
            tags: [
              ["u", RELAY_HTTP],
              ["method", "POST"],
              ["payload", "c8c5e8bc5a0a152d0537c925d29fa95a9456715bd77d6dd4c2e1f96175920ab5"],
            ],
            content: "",
          },
        },
      ],
    },
  ],
};
