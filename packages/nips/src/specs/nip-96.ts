// Owner: spec author r5 (NIPs 80–99). NIP-96: HTTP File Storage Integration.
// Unrecommended upstream: deprecated in favour of NIP-B7 (Blossom).
// Authorization headers are real NIP-98 events signed by the fixture persona "alice" at FIXTURE_NOW.
import type { HttpHeaderSpec, JsonSchema, NipSpec } from "../spec.ts";

const API = "https://files.beta.example/api/v1/media";
const HASH = "719171db19525d9d08dd69cb716a18158a249b7b3b3ec4bbdec5698dca104b7b";

const auth: HttpHeaderSpec = {
  name: "Authorization",
  explain: "header.authorization",
  value: { type: "base64", of: "event" },
  required: true,
};

const tagList: JsonSchema = {
  type: "array",
  explain: "schema.tags",
  items: {
    type: "tuple",
    explain: "schema.tag",
    items: [{ type: "string" }, { type: "string" }],
    minItems: 2,
    rest: { type: "string" },
  },
};

/** NIP-94 event without id/pubkey/sig: what the server says about a stored file. */
const fileEvent: JsonSchema = {
  type: "object",
  explain: "schema.nip94",
  properties: {
    tags: tagList,
    content: { type: "string", explain: "schema.caption" },
    created_at: { type: "number", integer: true, explain: "schema.created-at" },
  },
  required: ["tags", "content"],
};

const status: JsonSchema = {
  type: "string",
  explain: "schema.status",
  field: {
    type: "enum",
    values: [
      { value: "success", explain: "schema.status.success" },
      { value: "error", explain: "schema.status.error" },
      { value: "processing", explain: "schema.status.processing" },
    ],
  },
};

const message: JsonSchema = { type: "string", explain: "schema.message" };

export const nip96: NipSpec = {
  nip: "96",
  variant: "http",
  howItWorks: [
    {
      id: "status",
      title: "how.status.title",
      body: "how.status.body",
    },
    {
      id: "discover",
      title: "how.discover.title",
      body: "how.discover.body",
      focus: { part: { kind: "document", id: "server-info" }, path: ["api_url"] },
    },
    {
      id: "authorize",
      title: "how.authorize.title",
      body: "how.authorize.body",
      focus: { part: { kind: "event", id: "auth" }, path: ["tags"] },
    },
    {
      id: "upload",
      title: "how.upload.title",
      body: "how.upload.body",
      focus: { part: { kind: "http", id: "upload" }, path: ["body"] },
    },
    {
      id: "by-hash",
      title: "how.by-hash.title",
      body: "how.by-hash.body",
      focus: { part: { kind: "http", id: "download" }, path: ["url"] },
    },
    {
      id: "choose",
      title: "how.choose.title",
      body: "how.choose.body",
      focus: { part: { kind: "event", id: "server-list" }, path: ["tags", 0] },
    },
  ],
  related: [
    { nip: "B7", relation: "replaced-by", explain: "related.B7" },
    { nip: "98", relation: "depends-on", explain: "related.98" },
    { nip: "94", relation: "depends-on", explain: "related.94" },
    { nip: "92", relation: "see-also", explain: "related.92" },
  ],
  flows: [
    {
      id: "upload",
      label: "flow.upload.label",
      explain: "flow.upload.explain",
      steps: [
        { part: { kind: "event", id: "server-list" }, explain: "flow.upload.list" },
        { part: { kind: "document", id: "server-info" }, explain: "flow.upload.info" },
        { part: { kind: "event", id: "auth" }, explain: "flow.upload.auth" },
        { part: { kind: "http", id: "upload" }, explain: "flow.upload.upload" },
        { part: { kind: "http", id: "download" }, explain: "flow.upload.download" },
      ],
    },
  ],
  http: [
    {
      id: "upload",
      label: "http.upload.label",
      explain: "http.upload.explain",
      method: "POST",
      urlTemplate: "<api_url>",
      headers: [auth],
      body: {
        mediaType: "multipart/form-data",
        schema: {
          type: "object",
          explain: "form",
          properties: {
            file: { type: "string", explain: "form.file" },
            caption: { type: "string", explain: "form.caption" },
            expiration: { type: "string", explain: "form.expiration" },
            size: {
              type: "string",
              explain: "form.size",
              field: { type: "number", integer: true, min: 0 },
            },
            alt: { type: "string", explain: "form.alt" },
            media_type: {
              type: "string",
              explain: "form.media-type",
              field: { type: "enum", values: [{ value: "avatar" }, { value: "banner" }] },
            },
            content_type: { type: "string", explain: "form.content-type" },
            no_transform: {
              type: "string",
              explain: "form.no-transform",
              field: { type: "enum", values: [{ value: "true" }] },
            },
          },
          required: ["file"],
        },
      },
      responses: [
        {
          status: 201,
          explain: "upload.201",
          mediaType: "application/json",
          schema: {
            type: "object",
            explain: "upload.body",
            properties: {
              status,
              message,
              processing_url: {
                type: "string",
                explain: "upload.processing-url",
                field: { type: "url" },
              },
              nip94_event: fileEvent,
            },
            required: ["status", "message"],
          },
        },
        { status: 200, explain: "upload.200" },
        { status: 202, explain: "upload.202" },
        { status: 400, explain: "upload.400" },
        { status: 402, explain: "upload.402" },
        { status: 403, explain: "upload.403" },
        { status: 413, explain: "upload.413" },
      ],
      authEvent: "auth",
      examples: [
        {
          id: "upload-photo",
          label: "example.upload-photo.label",
          explain: "example.upload-photo.explain",
          url: API,
          headers: {
            Authorization:
              "Nostr eyJraW5kIjoyNzIzNSwiY3JlYXRlZF9hdCI6MTczNTY4OTYwMCwidGFncyI6W1sidSIsImh0dHBzOi8vZmlsZXMuYmV0YS5leGFtcGxlL2FwaS92MS9tZWRpYSJdLFsibWV0aG9kIiwiUE9TVCJdLFsicGF5bG9hZCIsIjcxOTE3MWRiMTk1MjVkOWQwOGRkNjljYjcxNmExODE1OGEyNDliN2IzYjNlYzRiYmRlYzU2OThkY2ExMDRiN2IiXV0sImNvbnRlbnQiOiIiLCJwdWJrZXkiOiJlNTUwYzZlOTI4MDhmMzU4MzgyYjdiOGMxNDM0NTM0NGY1ZWY5YTI5OTUyOTgzNGQxYzI2ZDU3YjZhY2U0NGNjIiwiaWQiOiI1MjAyYzc0ZjM5ZTVmNTdmYmMwYTk4MDU3MjNiNWZlOTJkZWMwZTVmYzJkY2ZhZGQ2OTJlMWEwYzM1OGIzODU5Iiwic2lnIjoiZDc2MGVjNGIxNzFkMzcyODljMzhmNDMwNzVjZWY5ZDExYWYyOWU2ZjFjZjFlNDhjNTc4MzZkNTdiNzgxMDViMTM5MTQ5NWY4Yzc4ZmZiMjM1ZjQyMDcwZTE2ZGJiNmVlZGJkZjM5NjNjMjgxMjBhYzEyMjUxMzczYTZlMWQwZDMifQ==",
          },
          body: {
            file: "<binary: rangefinder.png, 482113 bytes>",
            caption: "My first film camera, restored.",
            alt: "A 1970s rangefinder camera on a wooden table",
            size: "482113",
            content_type: "image/png",
          },
        },
      ],
    },
    {
      id: "download",
      label: "http.download.label",
      explain: "http.download.explain",
      method: "GET",
      urlTemplate: "<api_url>/<sha256>(.ext)?w=<width>",
      headers: [],
      responses: [
        { status: 200, explain: "download.200" },
        { status: 404, explain: "download.404" },
      ],
      examples: [
        {
          id: "download-photo",
          label: "example.download-photo.label",
          explain: "example.download-photo.explain",
          url: `${API}/${HASH}.png`,
          headers: {},
        },
        {
          id: "download-thumb",
          label: "example.download-thumb.label",
          explain: "example.download-thumb.explain",
          url: `${API}/${HASH}.png?w=32`,
          headers: {},
        },
      ],
    },
    {
      id: "delete",
      label: "http.delete.label",
      explain: "http.delete.explain",
      method: "DELETE",
      urlTemplate: "<api_url>/<sha256>(.ext)",
      headers: [auth],
      responses: [
        {
          status: 200,
          explain: "delete.200",
          mediaType: "application/json",
          schema: {
            type: "object",
            explain: "delete.body",
            properties: { status, message },
            required: ["status", "message"],
          },
        },
        { status: 403, explain: "delete.403" },
      ],
      authEvent: "auth",
      examples: [
        {
          id: "delete-photo",
          label: "example.delete-photo.label",
          explain: "example.delete-photo.explain",
          url: `${API}/${HASH}.png`,
          headers: {
            Authorization:
              "Nostr eyJraW5kIjoyNzIzNSwiY3JlYXRlZF9hdCI6MTczNTY4OTYwMCwidGFncyI6W1sidSIsImh0dHBzOi8vZmlsZXMuYmV0YS5leGFtcGxlL2FwaS92MS9tZWRpYS83MTkxNzFkYjE5NTI1ZDlkMDhkZDY5Y2I3MTZhMTgxNThhMjQ5YjdiM2IzZWM0YmJkZWM1Njk4ZGNhMTA0YjdiLnBuZyJdLFsibWV0aG9kIiwiREVMRVRFIl1dLCJjb250ZW50IjoiIiwicHVia2V5IjoiZTU1MGM2ZTkyODA4ZjM1ODM4MmI3YjhjMTQzNDUzNDRmNWVmOWEyOTk1Mjk4MzRkMWMyNmQ1N2I2YWNlNDRjYyIsImlkIjoiN2IxZWY4NjI2MGEwMzRjOWQ0YjBhM2QyNmUyYzQ1NTI3NDhmZjEyZTJkOWM5Mjc0NzM0MjUxMTdiOTlhMTJhMiIsInNpZyI6Ijc4OTFmZjc4YTk1OTRkYjU1M2IzZTA4N2U3ZTIwNDU2N2NhNDFlNzg4NGUzZGZiNDRjNzRkNjlkZjU4YjUzN2NjZTVkYTI2MDQ2MGU4NWVjYzAxMWY5NTBkZWQ2ZTAwODI3MjI4YzJmZWRmOWE1NjEzZjJmNWM1M2I2NmE4ZWJkIn0=",
          },
        },
      ],
    },
    {
      id: "list",
      label: "http.list.label",
      explain: "http.list.explain",
      method: "GET",
      urlTemplate: "<api_url>?page=<page>&count=<count>",
      headers: [auth],
      responses: [
        {
          status: 200,
          explain: "list.200",
          mediaType: "application/json",
          schema: {
            type: "object",
            explain: "list.body",
            properties: {
              count: { type: "number", integer: true, explain: "list.count" },
              total: { type: "number", integer: true, explain: "list.total" },
              page: { type: "number", integer: true, explain: "list.page" },
              files: { type: "array", explain: "list.files", items: fileEvent },
            },
            required: ["count", "total", "page", "files"],
          },
        },
        { status: 401, explain: "list.401" },
      ],
      authEvent: "auth",
      examples: [
        {
          id: "list-first-page",
          label: "example.list-first-page.label",
          explain: "example.list-first-page.explain",
          url: `${API}?page=0&count=10`,
          headers: {
            Authorization:
              "Nostr eyJraW5kIjoyNzIzNSwiY3JlYXRlZF9hdCI6MTczNTY4OTYwMCwidGFncyI6W1sidSIsImh0dHBzOi8vZmlsZXMuYmV0YS5leGFtcGxlL2FwaS92MS9tZWRpYT9wYWdlPTAmY291bnQ9MTAiXSxbIm1ldGhvZCIsIkdFVCJdXSwiY29udGVudCI6IiIsInB1YmtleSI6ImU1NTBjNmU5MjgwOGYzNTgzODJiN2I4YzE0MzQ1MzQ0ZjVlZjlhMjk5NTI5ODM0ZDFjMjZkNTdiNmFjZTQ0Y2MiLCJpZCI6ImNhNzcwMWM5YTM3MDdlZjZmMDM0YmZiMTk2OTU3OTIyMGRkNjI4ZTNkODQxOWI2ZTQwMDI2M2Y5NWFhNmJkMzciLCJzaWciOiJmNDEzNTNkZTc5MmM2NTE2ODMwZTE2N2JkNDBhZmQ1OTJhYmQ4YTc1MDMyM2VmZjI3NmY4ZDcwNTU0NDgyMmMxOGVmMWFmMDAyNjAyMGEyMDIyODdlNjdlYTZjODZlOWE1ZTY2NmMxZjg2N2ZmYjcxMWIxOWY4NWJlNGEwZTVmZiJ9",
          },
        },
      ],
    },
  ],
  documents: [
    {
      id: "server-info",
      label: "document.server-info.label",
      explain: "document.server-info.explain",
      mediaType: "application/json",
      urlTemplate: "https://<domain>/.well-known/nostr/nip96.json",
      schema: {
        type: "object",
        explain: "info",
        properties: {
          api_url: {
            type: "string",
            explain: "info.api-url",
            field: { type: "text", pattern: "(https://\\S+)?" },
          },
          download_url: { type: "string", explain: "info.download-url", field: { type: "url" } },
          delegated_to_url: {
            type: "string",
            explain: "info.delegated-to-url",
            field: { type: "url" },
          },
          supported_nips: {
            type: "array",
            explain: "info.supported-nips",
            items: { type: "number", integer: true },
          },
          tos_url: { type: "string", explain: "info.tos-url", field: { type: "url" } },
          content_types: {
            type: "array",
            explain: "info.content-types",
            items: { type: "string" },
          },
          plans: {
            type: "object",
            explain: "info.plans",
            properties: {},
            additionalProperties: {
              type: "object",
              explain: "plan",
              properties: {
                name: { type: "string", explain: "plan.name" },
                is_nip98_required: { type: "boolean", explain: "plan.is-nip98-required" },
                url: { type: "string", explain: "plan.url", field: { type: "url" } },
                max_byte_size: {
                  type: "number",
                  integer: true,
                  minimum: 0,
                  explain: "plan.max-byte-size",
                },
                file_expiration: {
                  type: "tuple",
                  explain: "plan.file-expiration",
                  items: [
                    { type: "number", integer: true, minimum: 0 },
                    { type: "number", integer: true, minimum: 0 },
                  ],
                  minItems: 2,
                },
                media_transformations: {
                  type: "object",
                  explain: "plan.media-transformations",
                  properties: {},
                  additionalProperties: { type: "array", items: { type: "string" } },
                },
              },
            },
          },
        },
        required: ["api_url"],
      },
      examples: [
        {
          id: "server",
          label: "example.server.label",
          explain: "example.server.explain",
          value: {
            api_url: API,
            download_url: "https://cdn.beta.example/media",
            supported_nips: [60],
            tos_url: "https://files.beta.example/terms",
            content_types: ["image/jpeg", "image/png", "video/webm", "audio/*"],
            plans: {
              free: {
                name: "Free Tier",
                is_nip98_required: true,
                max_byte_size: 10485760,
                file_expiration: [14, 90],
                media_transformations: { image: ["resizing"] },
              },
            },
          },
        },
        {
          id: "delegated",
          label: "example.delegated.label",
          explain: "example.delegated.explain",
          value: { api_url: "", delegated_to_url: "https://files.beta.example" },
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
              type: {
                type: "enum",
                values: [{ value: "POST" }, { value: "GET" }, { value: "DELETE" }],
              },
              explain: "event.auth.method.value",
            },
          ],
        },
        {
          name: "payload",
          explain: "event.auth.payload",
          presence: "optional",
          repeatable: false,
          fields: [{ name: "sha256", type: { type: "hex32" }, explain: "event.auth.payload.hash" }],
        },
      ],
      examples: [
        {
          id: "auth-upload",
          label: "example.auth-upload.label",
          explain: "example.auth-upload.explain",
          signer: "alice",
          template: {
            kind: 27235,
            created_at: 1735689600,
            tags: [
              ["u", API],
              ["method", "POST"],
              ["payload", HASH],
            ],
            content: "",
          },
        },
      ],
    },
    {
      id: "server-list",
      label: "event.server-list.label",
      explain: "event.server-list.explain",
      kinds: [10096],
      content: { format: "empty", explain: "event.server-list.content" },
      tags: [
        {
          name: "server",
          explain: "event.server-list.server",
          presence: "required",
          repeatable: true,
          fields: [{ name: "url", type: { type: "url" }, explain: "event.server-list.server.url" }],
        },
      ],
      examples: [
        {
          id: "two-servers",
          label: "example.two-servers.label",
          explain: "example.two-servers.explain",
          signer: "alice",
          template: {
            kind: 10096,
            tags: [
              ["server", "https://files.beta.example"],
              ["server", "https://files.alpha.example"],
            ],
            content: "",
          },
        },
      ],
    },
  ],
};
