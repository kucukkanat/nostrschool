// Owner: spec author r4 (NIPs 60–79). NIP-68: Picture-first feeds.
// Carol (the photographer persona) posts her film photos.
import type { FieldType, NipSpec, TagFieldSpec } from "../spec.ts";

const SHA_1 = "a1f3c9e27b5d4e8f90b6c2d1e4f7a8b9c0d3e6f1a2b5c8d7e0f3a6b9c2d5e8f1";
const SHA_2 = "b7e2d4f6a8c0e1f3d5b7a9c1e3f5d7b9a1c3e5f7d9b1a3c5e7f9d1b3a5c7e9f2";
const BOB = "a73883912a48c3551c1548fd454876d577126a61c76b5486c807bfec5869e183";

const IMAGE_TYPES: FieldType = {
  type: "enum",
  values: [
    { value: "image/apng" },
    { value: "image/avif" },
    { value: "image/gif" },
    { value: "image/jpeg" },
    { value: "image/png" },
    { value: "image/webp" },
  ],
};

const imetaEntry: TagFieldSpec = {
  name: "key value",
  type: { type: "text", pattern: "[a-z][a-z0-9-]* \\S.*" },
  explain: "picture.tag.imeta.entry",
  placeholder: "url https://…",
};

export const nip68: NipSpec = {
  nip: "68",
  variant: "event",
  howItWorks: [
    {
      id: "host",
      title: "how.host.title",
      body: "how.host.body",
      focus: { part: { kind: "event", id: "picture" }, path: ["tags", 1] },
    },
    {
      id: "post",
      title: "how.post.title",
      body: "how.post.body",
      focus: { part: { kind: "event", id: "picture" }, path: ["tags", 0] },
    },
    {
      id: "filter",
      title: "how.filter.title",
      body: "how.filter.body",
      focus: { part: { kind: "event", id: "picture" }, path: ["tags"] },
    },
    { id: "annotate", title: "how.annotate.title", body: "how.annotate.body" },
    { id: "video", title: "how.video.title", body: "how.video.body" },
  ],
  related: [
    { nip: "92", relation: "depends-on", explain: "related.92" },
    { nip: "94", relation: "see-also", explain: "related.94" },
    { nip: "71", relation: "see-also", explain: "related.71" },
    { nip: "36", relation: "see-also", explain: "related.36" },
    { nip: "B7", relation: "see-also", explain: "related.B7" },
  ],
  events: [
    {
      id: "picture",
      label: "picture.label",
      explain: "picture.explain",
      kinds: [20],
      content: { format: "text", explain: "picture.content", multiline: true },
      tags: [
        {
          name: "title",
          explain: "picture.tag.title",
          presence: "required",
          repeatable: false,
          fields: [
            {
              name: "title",
              type: { type: "text", minLength: 1 },
              explain: "picture.tag.title.text",
            },
          ],
        },
        {
          name: "imeta",
          explain: "picture.tag.imeta",
          presence: "required",
          repeatable: true,
          fields: [
            {
              name: "url",
              type: { type: "text", pattern: "url https?://\\S+" },
              explain: "picture.tag.imeta.url",
              placeholder: "url https://…",
            },
          ],
          rest: imetaEntry,
          template: ["imeta", "url https://", "m image/jpeg", "x ", "alt "],
        },
        {
          name: "content-warning",
          explain: "picture.tag.content-warning",
          presence: "optional",
          repeatable: false,
          fields: [
            {
              name: "reason",
              type: { type: "text" },
              explain: "picture.tag.content-warning.reason",
              optional: true,
            },
          ],
        },
        {
          name: "p",
          explain: "picture.tag.p",
          presence: "optional",
          repeatable: true,
          fields: [
            { name: "pubkey", type: { type: "pubkey" }, explain: "picture.tag.p.pubkey" },
            {
              name: "relay",
              type: { type: "relay-url" },
              explain: "picture.tag.p.relay",
              optional: true,
            },
          ],
        },
        {
          name: "m",
          explain: "picture.tag.m",
          presence: "recommended",
          repeatable: true,
          fields: [{ name: "media-type", type: IMAGE_TYPES, explain: "picture.tag.m.type" }],
        },
        {
          name: "x",
          explain: "picture.tag.x",
          presence: "recommended",
          repeatable: true,
          fields: [{ name: "sha256", type: { type: "hex32" }, explain: "picture.tag.x.hash" }],
        },
        {
          name: "t",
          explain: "picture.tag.t",
          presence: "optional",
          repeatable: true,
          fields: [
            {
              name: "hashtag",
              type: { type: "text", pattern: "[^\\s#A-Z]+" },
              explain: "picture.tag.t.tag",
            },
          ],
        },
        {
          name: "location",
          explain: "picture.tag.location",
          presence: "optional",
          repeatable: false,
          fields: [
            { name: "place", type: { type: "text" }, explain: "picture.tag.location.place" },
          ],
        },
        {
          name: "g",
          explain: "picture.tag.g",
          presence: "optional",
          repeatable: false,
          fields: [
            {
              name: "geohash",
              type: { type: "text", pattern: "[0-9bcdefghjkmnpqrstuvwxyz]{1,12}" },
              explain: "picture.tag.g.geohash",
            },
          ],
        },
        {
          name: "L",
          explain: "picture.tag.L",
          presence: "optional",
          repeatable: true,
          fields: [
            { name: "namespace", type: { type: "text" }, explain: "picture.tag.L.namespace" },
          ],
        },
        {
          name: "l",
          explain: "picture.tag.l",
          presence: "optional",
          repeatable: true,
          fields: [
            { name: "language", type: { type: "text" }, explain: "picture.tag.l.language" },
            { name: "namespace", type: { type: "text" }, explain: "picture.tag.L.namespace" },
          ],
        },
      ],
      examples: [
        {
          id: "single",
          label: "picture.example.single.label",
          explain: "picture.example.single.explain",
          signer: "carol",
          template: {
            kind: 20,
            tags: [
              ["title", "Harbour at dawn"],
              [
                "imeta",
                `url https://media.gamma.example/${SHA_1}.jpg`,
                "m image/jpeg",
                "dim 3024x4032",
                "blurhash LEHV6nWB2yk8pyo0adR*.7kCMdnj",
                "alt Fishing boats moored in a calm harbour, pink sky at sunrise",
                `x ${SHA_1}`,
                `fallback https://media.alpha.example/${SHA_1}.jpg`,
              ],
              ["m", "image/jpeg"],
              ["x", SHA_1],
              ["t", "filmphotography"],
              ["t", "harbour"],
              ["location", "Porto, Portugal"],
              ["g", "ez3f5"],
            ],
            content: "Portra 400, pushed one stop. The light lasted about four minutes.",
          },
        },
        {
          id: "gallery",
          label: "picture.example.gallery.label",
          explain: "picture.example.gallery.explain",
          signer: "carol",
          template: {
            kind: 20,
            tags: [
              ["title", "Morning walk with Bob"],
              [
                "imeta",
                `url https://media.gamma.example/${SHA_1}.jpg`,
                "m image/jpeg",
                "dim 3024x4032",
                "alt A dirt path through a pine forest",
                `x ${SHA_1}`,
              ],
              [
                "imeta",
                `url https://media.gamma.example/${SHA_2}.webp`,
                "m image/webp",
                "dim 4032x3024",
                "alt Bob holding a thermos and laughing",
                `x ${SHA_2}`,
                `annotate-user ${BOB}:1840:960`,
              ],
              ["p", BOB, "wss://relay.beta.example"],
              ["m", "image/jpeg"],
              ["m", "image/webp"],
              ["x", SHA_1],
              ["x", SHA_2],
              ["t", "walk"],
            ],
            content: "Two frames from this morning. Coffee was mandatory.",
          },
        },
      ],
    },
  ],
};
