// Owner: spec author r6 (NIPs letter ids). NIP-B7: Blossom media. The NIP itself defines how a
// client uses a kind 10063 server list (BUD-03) to find a blob again by its sha256; the kind
// 24242 authorization event and the upload endpoint come from Blossom's BUD-01/BUD-02 and are
// included so the whole round trip can be explored. Primary view: the server list event.
// Explanations: packages/i18n/src/locales/en/nips/r6.ts → nB7.text.
import type { NipSpec } from "../spec.ts";
import { FIXTURE_NOW } from "./r6-common.ts";

/** sha256 of the demo voice note blob and of the demo avatar. */
export const NIPB7_BLOB = "131793108d275c46fea3825b519ba6ab103bd49a0eb5c33b0a905743b58c8f6e";
const PNG = "586eda5b9d78d38db3c77769035913441c232437f4aa39933a04f953d5189edd";
const SERVER = "https://blossom.alpha.example";
const MIRROR = "https://cdn.beta.example";
/** base64 of the "upload" auth example signed by alice (r6.test.ts checks it). */
export const NIPB7_AUTH =
  "eyJraW5kIjoyNDI0MiwiY3JlYXRlZF9hdCI6MTczNTY4OTYwMCwidGFncyI6W1sidCIsInVwbG9hZCJdLFsieCIsIjEzMTc5MzEwOGQyNzVjNDZmZWEzODI1YjUxOWJhNmFiMTAzYmQ0OWEwZWI1YzMzYjBhOTA1NzQzYjU4YzhmNmUiXSxbImV4cGlyYXRpb24iLCIxNzM1NjkzMjAwIl1dLCJjb250ZW50IjoiVXBsb2FkIHZvaWNlLW5vdGUubTRhIiwicHVia2V5IjoiZTU1MGM2ZTkyODA4ZjM1ODM4MmI3YjhjMTQzNDUzNDRmNWVmOWEyOTk1Mjk4MzRkMWMyNmQ1N2I2YWNlNDRjYyIsImlkIjoiNTdhYjE0NDFmNTc4NTBmZTU3OTUyMGZiYmZhMDMzOGM5Mjg4ZTBkMTY2NWFhYzRmNjZjMDQwM2NiM2ZhZTBjNiIsInNpZyI6IjhhNzRlZGUxMjY1N2JiODE3Yzg0OGRmYTg0ZTgxOWIwMWI5ZTI0YTJhNTBlMGM1NDliYmYxNDhmODI1NTU2OGIyMjI4OTM0MWNlYzE0ZWE0NDBmNGMwZTg4YmEzMWM0OTBhNWUzM2ZjNGU1Njg5NTUyZjk5OGY1OWM4Y2Q0YzVkIn0=";

const servers = { kind: "event", id: "servers" } as const;
const auth = { kind: "event", id: "auth" } as const;
const fetchBlob = { kind: "http", id: "fetch" } as const;
const upload = { kind: "http", id: "upload" } as const;

export const nipB7: NipSpec = {
  nip: "B7",
  variant: "event",
  howItWorks: [
    {
      id: "hash",
      title: "how.hash.title",
      body: "how.hash.body",
      focus: { part: fetchBlob, path: ["url"] },
    },
    {
      id: "servers",
      title: "how.servers.title",
      body: "how.servers.body",
      focus: { part: servers, path: ["tags"] },
    },
    {
      id: "fallback",
      title: "how.fallback.title",
      body: "how.fallback.body",
      focus: { part: fetchBlob },
    },
    { id: "verify", title: "how.verify.title", body: "how.verify.body" },
    { id: "upload", title: "how.upload.title", body: "how.upload.body", focus: { part: auth } },
  ],
  related: [
    { nip: "92", relation: "see-also", explain: "related.92" },
    { nip: "94", relation: "see-also", explain: "related.94" },
    { nip: "96", relation: "see-also", explain: "related.96" },
    { nip: "98", relation: "see-also", explain: "related.98" },
  ],
  flows: [
    {
      id: "publish-and-find",
      label: "flow.publish-and-find.label",
      explain: "flow.publish-and-find.explain",
      steps: [
        { part: auth, explain: "flow.publish-and-find.auth" },
        { part: upload, explain: "flow.publish-and-find.upload" },
        { part: servers, explain: "flow.publish-and-find.servers" },
        { part: fetchBlob, explain: "flow.publish-and-find.fetch" },
      ],
    },
  ],
  events: [
    {
      id: "servers",
      label: "event.servers.label",
      explain: "event.servers.explain",
      kinds: [10063],
      content: { format: "empty", explain: "content.empty" },
      tags: [
        {
          name: "server",
          explain: "tag.server",
          presence: "required",
          repeatable: true,
          fields: [{ name: "url", type: { type: "url" }, explain: "tag.server.url" }],
        },
      ],
      examples: [
        {
          id: "two-servers",
          label: "example.two-servers",
          explain: "example.two-servers.explain",
          signer: "alice",
          template: {
            kind: 10063,
            tags: [
              ["server", SERVER],
              ["server", MIRROR],
            ],
            content: "",
          },
        },
      ],
    },
    {
      id: "auth",
      label: "event.auth.label",
      explain: "event.auth.explain",
      kinds: [24242],
      content: { format: "text", explain: "content.auth", required: true },
      tags: [
        {
          name: "t",
          explain: "tag.t",
          presence: "required",
          repeatable: false,
          fields: [
            {
              name: "verb",
              type: {
                type: "enum",
                values: [
                  { value: "get", explain: "verb.get" },
                  { value: "upload", explain: "verb.upload" },
                  { value: "list", explain: "verb.list" },
                  { value: "delete", explain: "verb.delete" },
                ],
                open: true,
              },
              explain: "tag.t.verb",
            },
          ],
        },
        {
          name: "expiration",
          explain: "tag.expiration",
          presence: "required",
          repeatable: false,
          fields: [
            { name: "timestamp", type: { type: "timestamp" }, explain: "tag.expiration.at" },
          ],
        },
        {
          name: "x",
          explain: "tag.x",
          presence: "optional",
          repeatable: true,
          fields: [{ name: "sha256", type: { type: "hex32" }, explain: "tag.x.sha256" }],
        },
        {
          name: "server",
          explain: "tag.auth-server",
          presence: "optional",
          repeatable: true,
          fields: [{ name: "url", type: { type: "url" }, explain: "tag.server.url" }],
        },
      ],
      examples: [
        {
          id: "upload",
          label: "example.upload",
          explain: "example.upload.explain",
          signer: "alice",
          template: {
            kind: 24242,
            created_at: FIXTURE_NOW,
            tags: [
              ["t", "upload"],
              ["x", NIPB7_BLOB],
              ["expiration", String(FIXTURE_NOW + 3600)],
            ],
            content: "Upload voice-note.m4a",
          },
        },
      ],
    },
  ],
  http: [
    {
      id: "fetch",
      label: "http.fetch.label",
      explain: "http.fetch.explain",
      method: "GET",
      urlTemplate: "https://<server>/<sha256>[.<ext>]",
      headers: [],
      responses: [
        { status: 200, explain: "http.fetch.200" },
        { status: 404, explain: "http.fetch.404" },
      ],
      examples: [
        {
          id: "mirror",
          label: "example.mirror",
          explain: "example.mirror.explain",
          url: `${MIRROR}/${PNG}.png`,
          headers: {},
        },
      ],
    },
    {
      id: "upload",
      label: "http.upload.label",
      explain: "http.upload.explain",
      method: "PUT",
      urlTemplate: "https://<server>/upload",
      headers: [
        {
          name: "Authorization",
          explain: "header.authorization",
          value: { type: "base64", of: "event" },
          required: true,
        },
        {
          name: "Content-Type",
          explain: "header.content-type",
          value: { type: "text", pattern: "[a-z]+/[a-z0-9.+-]+" },
          required: false,
        },
      ],
      responses: [
        {
          status: 200,
          explain: "http.upload.200",
          mediaType: "application/json",
          schema: {
            type: "object",
            explain: "descriptor",
            properties: {
              url: { type: "string", field: { type: "url" }, explain: "descriptor.url" },
              sha256: { type: "string", field: { type: "hex32" }, explain: "descriptor.sha256" },
              size: { type: "number", integer: true, minimum: 0, explain: "descriptor.size" },
              type: { type: "string", explain: "descriptor.type" },
              uploaded: {
                type: "number",
                integer: true,
                minimum: 0,
                explain: "descriptor.uploaded",
              },
            },
            required: ["url", "sha256", "size"],
          },
        },
        { status: 401, explain: "http.upload.401" },
      ],
      authEvent: "auth",
      examples: [
        {
          id: "voice-note",
          label: "example.voice-note",
          explain: "example.voice-note.explain",
          url: `${SERVER}/upload`,
          headers: { Authorization: `Nostr ${NIPB7_AUTH}`, "Content-Type": "audio/mp4" },
        },
      ],
    },
  ],
};
