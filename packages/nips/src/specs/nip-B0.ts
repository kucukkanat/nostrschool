// Owner: spec author r6 (NIPs letter ids). NIP-B0: Web Bookmarks (kind 39701, addressable by
// the bookmarked URI). Explanations: packages/i18n/src/locales/en/nips/r6.ts → nB0.text.
import type { NipSpec } from "../spec.ts";
import { textTag } from "./r6-common.ts";

const bookmark = { kind: "event", id: "bookmark" } as const;

export const nipB0: NipSpec = {
  nip: "B0",
  variant: "event",
  howItWorks: [
    {
      id: "address",
      title: "how.address.title",
      body: "how.address.body",
      focus: { part: bookmark, path: ["tags", 0] },
    },
    {
      id: "scheme",
      title: "how.scheme.title",
      body: "how.scheme.body",
      focus: { part: bookmark, path: ["tags", 0, 1] },
    },
    {
      id: "describe",
      title: "how.describe.title",
      body: "how.describe.body",
      focus: { part: bookmark, path: ["content"] },
    },
    { id: "edit", title: "how.edit.title", body: "how.edit.body" },
    { id: "comments", title: "how.comments.title", body: "how.comments.body" },
  ],
  related: [
    { nip: "01", relation: "depends-on", explain: "related.01" },
    { nip: "22", relation: "see-also", explain: "related.22" },
    { nip: "51", relation: "see-also", explain: "related.51" },
  ],
  events: [
    {
      id: "bookmark",
      label: "event.bookmark.label",
      explain: "event.bookmark.explain",
      kinds: [39701],
      content: { format: "text", explain: "content.bookmark", multiline: true },
      tags: [
        {
          name: "d",
          explain: "tag.d",
          presence: "required",
          repeatable: false,
          fields: [
            {
              name: "uri",
              type: { type: "text", pattern: "(?!https://)\\S+" },
              explain: "tag.d.uri",
              placeholder: "example.com/page",
            },
          ],
        },
        textTag("title"),
        {
          name: "published_at",
          explain: "tag.published_at",
          presence: "optional",
          repeatable: false,
          fields: [
            { name: "timestamp", type: { type: "timestamp" }, explain: "tag.published_at.at" },
          ],
        },
        {
          name: "t",
          explain: "tag.t",
          presence: "optional",
          repeatable: true,
          fields: [{ name: "topic", type: { type: "text", minLength: 1 }, explain: "tag.t.value" }],
        },
      ],
      examples: [
        {
          id: "nips",
          label: "example.nips",
          explain: "example.nips.explain",
          signer: "alice",
          template: {
            kind: 39701,
            tags: [
              ["d", "github.com/nostr-protocol/nips"],
              ["published_at", "1735600000"],
              ["title", "Nostr Implementation Possibilities"],
              ["t", "nostr"],
              ["t", "specs"],
            ],
            content: "Every NIP in one place. My first stop when a client does something odd.",
          },
        },
        {
          id: "http",
          label: "example.http",
          explain: "example.http.explain",
          signer: "frank",
          template: {
            kind: 39701,
            tags: [
              ["d", "http://info.cern.ch/hypertext/WWW/TheProject.html"],
              ["title", "The World Wide Web project"],
              ["t", "history"],
            ],
            content: "",
          },
        },
      ],
    },
  ],
};
