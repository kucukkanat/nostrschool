// Owner: spec author r5 (NIPs 80–99). NIP-92: Media Attachments Metadata (imeta).
import type { NipSpec } from "../spec.ts";

const IMAGE =
  "https://files.beta.example/9f1c2b7e5d0a4c3b8e6f1a2d3c4b5a6978695a4b3c2d1e0f9a8b7c6d5e4f3a2b.jpg";
const IMAGE_HASH = "9f1c2b7e5d0a4c3b8e6f1a2d3c4b5a6978695a4b3c2d1e0f9a8b7c6d5e4f3a2b";
const VIDEO = "https://files.beta.example/clip.mp4";

export const nip92: NipSpec = {
  nip: "92",
  variant: "event",
  howItWorks: [
    {
      id: "link",
      title: "how.link.title",
      body: "how.link.body",
      focus: { part: { kind: "event", id: "attachment" }, path: ["content"] },
    },
    {
      id: "describe",
      title: "how.describe.title",
      body: "how.describe.body",
      focus: { part: { kind: "event", id: "attachment" }, path: ["tags", 0] },
    },
    {
      id: "pairs",
      title: "how.pairs.title",
      body: "how.pairs.body",
      focus: { part: { kind: "event", id: "attachment" }, path: ["tags", 0, 2] },
    },
    {
      id: "render",
      title: "how.render.title",
      body: "how.render.body",
    },
  ],
  related: [
    { nip: "94", relation: "depends-on", explain: "related.94" },
    { nip: "B7", relation: "see-also", explain: "related.B7" },
    { nip: "68", relation: "used-by", explain: "related.68" },
    { nip: "71", relation: "used-by", explain: "related.71" },
  ],
  events: [
    {
      id: "attachment",
      label: "event.attachment.label",
      explain: "event.attachment.explain",
      kinds: [1],
      content: { format: "text", explain: "content", required: true, multiline: true },
      tags: [
        {
          name: "imeta",
          explain: "tag.imeta",
          presence: "recommended",
          repeatable: true,
          fields: [
            {
              name: "url",
              type: { type: "text", pattern: "url https?://\\S+" },
              explain: "tag.imeta.url",
            },
          ],
          rest: {
            name: "entry",
            type: { type: "text", pattern: "[a-z_]+ .+" },
            explain: "tag.imeta.entry",
          },
          template: ["imeta", "url https://", "m image/jpeg"],
        },
      ],
      examples: [
        {
          id: "photo",
          label: "example.photo.label",
          explain: "example.photo.explain",
          signer: "erin",
          template: {
            kind: 1,
            tags: [
              [
                "imeta",
                `url ${IMAGE}`,
                "m image/jpeg",
                "blurhash LEHV6nWB2yk8pyo0adR*.7kCMdnj",
                "dim 3024x4032",
                "alt An orange ostrich riding a longboard, drawn in pencil",
                `x ${IMAGE_HASH}`,
                "fallback https://files.alpha.example/ostrich.jpg",
              ],
            ],
            content: `Today's weird animal, now in colour ${IMAGE}`,
          },
        },
        {
          id: "two-files",
          label: "example.two-files.label",
          explain: "example.two-files.explain",
          signer: "carol",
          template: {
            kind: 1,
            tags: [
              ["imeta", `url ${IMAGE}`, "m image/jpeg", "dim 3024x4032"],
              ["imeta", `url ${VIDEO}`, "m video/mp4", "dim 1920x1080", "size 4718592"],
            ],
            content: `Film scan and the behind-the-scenes clip:\n${IMAGE}\n${VIDEO}`,
          },
        },
      ],
    },
  ],
};
