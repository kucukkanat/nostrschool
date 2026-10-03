// Owner: spec author r5 (NIPs 80–99). NIP-94: File Metadata.
import type { FieldType, NipSpec, TagSpec } from "../spec.ts";

const HASH = "719171db19525d9d08dd69cb716a18158a249b7b3b3ec4bbdec5698dca104b7b";
const SAVED_HASH = "543244319525d9d08dd69cb716a18158a249b7b3b3ec4bbde5435543acb34443";
const TORRENT_HASH = "d75e4c2f8b6a1e3f9c0b7a5d2e4f6a8b1c3d5e7f";

const single = (
  name: string,
  type: FieldType,
  presence: TagSpec["presence"] = "optional",
): TagSpec => ({
  name,
  explain: `tag.${name}`,
  presence,
  repeatable: false,
  fields: [{ name: "value", type, explain: `tag.${name}.value` }],
});

/** thumb / image: a URL plus the optional SHA-256 of that preview file. */
const preview = (name: "thumb" | "image"): TagSpec => ({
  name,
  explain: `tag.${name}`,
  presence: "optional",
  repeatable: false,
  fields: [
    { name: "url", type: { type: "url" }, explain: `tag.${name}.value` },
    { name: "sha256", type: { type: "hex32" }, explain: "tag.preview.hash", optional: true },
  ],
});

export const nip94: NipSpec = {
  nip: "94",
  variant: "event",
  howItWorks: [
    {
      id: "upload",
      title: "how.upload.title",
      body: "how.upload.body",
    },
    {
      id: "locate",
      title: "how.locate.title",
      body: "how.locate.body",
      focus: { part: { kind: "event", id: "file" }, path: ["tags", 0] },
    },
    {
      id: "verify",
      title: "how.verify.title",
      body: "how.verify.body",
      focus: { part: { kind: "event", id: "file" }, path: ["tags", 2] },
    },
    {
      id: "preview",
      title: "how.preview.title",
      body: "how.preview.body",
      focus: { part: { kind: "event", id: "file" }, path: ["tags", 5] },
    },
    {
      id: "filter",
      title: "how.filter.title",
      body: "how.filter.body",
    },
  ],
  related: [
    { nip: "92", relation: "used-by", explain: "related.92" },
    { nip: "96", relation: "used-by", explain: "related.96" },
    { nip: "B7", relation: "see-also", explain: "related.B7" },
    { nip: "35", relation: "see-also", explain: "related.35" },
  ],
  events: [
    {
      id: "file",
      label: "event.file.label",
      explain: "event.file.explain",
      kinds: [1063],
      content: { format: "text", explain: "content", multiline: true },
      tags: [
        single("url", { type: "url" }, "required"),
        single("m", { type: "text", pattern: "[a-z0-9.+-]+/[a-z0-9.+*-]+" }, "required"),
        single("x", { type: "hex32" }, "required"),
        single("ox", { type: "hex32" }, "recommended"),
        single("size", { type: "number", integer: true, min: 0 }),
        single("dim", { type: "text", pattern: "\\d+x\\d+" }),
        single("magnet", { type: "url", schemes: ["magnet"] }),
        single("i", { type: "hex", bytes: 20 }),
        single("blurhash", { type: "text", minLength: 6 }),
        preview("thumb"),
        preview("image"),
        single("summary", { type: "text", multiline: true }),
        single("alt", { type: "text", multiline: true }),
        {
          name: "fallback",
          explain: "tag.fallback",
          presence: "optional",
          repeatable: true,
          fields: [{ name: "url", type: { type: "url" }, explain: "tag.fallback.value" }],
        },
        single("service", { type: "text", minLength: 1 }),
      ],
      examples: [
        {
          id: "image",
          label: "example.image.label",
          explain: "example.image.explain",
          signer: "carol",
          template: {
            kind: 1063,
            tags: [
              ["url", `https://files.beta.example/${HASH}.png`],
              ["m", "image/png"],
              ["x", SAVED_HASH],
              ["ox", HASH],
              ["size", "482113"],
              ["dim", "800x600"],
              ["blurhash", "LKO2?U%2Tw=w]~RBVZRi};RPxuwH"],
              ["thumb", "https://files.beta.example/thumb/rangefinder.png"],
              ["alt", "A 1970s rangefinder camera on a wooden table"],
              ["fallback", `https://files.alpha.example/${HASH}.png`],
              ["service", "nip96"],
            ],
            content: "My first film camera, restored.",
          },
        },
        {
          id: "torrent",
          label: "example.torrent.label",
          explain: "example.torrent.explain",
          signer: "dave",
          template: {
            kind: 1063,
            tags: [
              ["url", "https://relay.delta.example/downloads/relay-backup.tar.gz"],
              ["m", "application/gzip"],
              ["x", "3c9f5a0e2b7d4c1f8a6e0d2b9c7f5a3e1d0b8c6a4f2e0d9c7b5a3f1e0d8c6b4a"],
              ["size", "73400320"],
              ["magnet", `magnet:?xt=urn:btih:${TORRENT_HASH}`],
              ["i", TORRENT_HASH],
              ["summary", "Snapshot of the public relay.delta.example archive"],
            ],
            content: "Monthly relay archive, also seeded as a torrent.",
          },
        },
      ],
    },
  ],
};
