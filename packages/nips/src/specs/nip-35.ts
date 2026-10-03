// Owner: spec author r2 (NIPs 20–39). NIP-35: Torrents (kind 2003) and torrent comments (kind 2004).
// The example indexes Big Buck Bunny (Creative Commons), whose v1 info hash is the well-known
// WebTorrent demo hash.
import type { NipSpec } from "../spec.ts";

const INFO_HASH = "dd8255ecdc7ca55fb0bbf81323d87062db1f6d1c";
// Id of the "film" example (kind 2003 by frank at FIXTURE_NOW); r2.test.ts recomputes it.
export const NIP35_TORRENT_ID = "fb3618ff9bedd9f67f189575a4d49f57fb54cb3dc028925ec94cb192384564c8";
const FRANK = "922e43b50aec16ad1e9d1ec6854c058816d28b944ae2fe9bdce3d9241bfaafb8";

export const nip35: NipSpec = {
  nip: "35",
  variant: "event",
  howItWorks: [
    {
      id: "index",
      title: "how.index.title",
      body: "how.index.body",
      focus: { part: { kind: "event", id: "torrent" }, path: ["tags", 1] },
    },
    {
      id: "files",
      title: "how.files.title",
      body: "how.files.body",
      focus: { part: { kind: "event", id: "torrent" }, path: ["tags", 2] },
    },
    {
      id: "prefixes",
      title: "how.prefixes.title",
      body: "how.prefixes.body",
      focus: { part: { kind: "event", id: "torrent" }, path: ["tags", 5] },
    },
    { id: "magnet", title: "how.magnet.title", body: "how.magnet.body" },
    {
      id: "comments",
      title: "how.comments.title",
      body: "how.comments.body",
      focus: { part: { kind: "event", id: "comment" } },
    },
  ],
  related: [
    { nip: "10", relation: "depends-on", explain: "related.10" },
    { nip: "73", relation: "see-also", explain: "related.73" },
    { nip: "94", relation: "see-also", explain: "related.94" },
  ],
  events: [
    {
      id: "torrent",
      label: "event.torrent.label",
      explain: "event.torrent.explain",
      kinds: [2003],
      content: { format: "text", explain: "content.torrent", multiline: true },
      tags: [
        {
          name: "title",
          explain: "tag.title",
          presence: "recommended",
          repeatable: false,
          fields: [{ name: "title", type: { type: "text" }, explain: "tag.title.value" }],
        },
        {
          name: "x",
          explain: "tag.x",
          presence: "required",
          repeatable: false,
          fields: [{ name: "info-hash", type: { type: "hex", bytes: 20 }, explain: "tag.x.value" }],
        },
        {
          name: "file",
          explain: "tag.file",
          presence: "recommended",
          repeatable: true,
          fields: [
            { name: "path", type: { type: "text", minLength: 1 }, explain: "tag.file.path" },
            {
              name: "size",
              type: { type: "number", integer: true, min: 0 },
              explain: "tag.file.size",
              optional: true,
            },
          ],
        },
        {
          name: "tracker",
          explain: "tag.tracker",
          presence: "optional",
          repeatable: true,
          fields: [
            {
              name: "url",
              type: { type: "url", schemes: ["udp", "http", "https", "ws", "wss"] },
              explain: "tag.tracker.value",
            },
          ],
        },
        {
          name: "i",
          explain: "tag.i",
          presence: "optional",
          repeatable: true,
          fields: [
            {
              name: "reference",
              type: { type: "text", pattern: "[a-z0-9]+:.+" },
              explain: "tag.i.value",
            },
          ],
        },
        {
          name: "t",
          explain: "tag.t",
          presence: "optional",
          repeatable: true,
          fields: [{ name: "category", type: { type: "text" }, explain: "tag.t.value" }],
        },
      ],
      examples: [
        {
          id: "film",
          label: "example.film",
          explain: "example.film.explain",
          signer: "frank",
          template: {
            kind: 2003,
            tags: [
              ["title", "Big Buck Bunny (2008) 1080p"],
              ["x", INFO_HASH],
              ["file", "Big Buck Bunny/Big Buck Bunny.mp4", "276134947"],
              ["file", "Big Buck Bunny/poster.jpg", "310380"],
              ["tracker", "udp://tracker.example.org:1337"],
              ["i", "tcat:video,movie,hd"],
              ["i", "newznab:2040"],
              ["i", "imdb:tt1254207"],
              ["i", "tmdb:movie:10378"],
              ["t", "movie"],
              ["t", "hd"],
            ],
            content:
              "Blender Foundation's open movie, released under Creative Commons Attribution 3.0.\n\n1080p H.264, stereo audio.",
          },
        },
      ],
    },
    {
      id: "comment",
      label: "event.comment.label",
      explain: "event.comment.explain",
      kinds: [2004],
      content: { format: "text", explain: "content.comment", required: true, multiline: true },
      tags: [
        {
          name: "e",
          explain: "tag.e",
          presence: "required",
          repeatable: true,
          fields: [
            { name: "event-id", type: { type: "event-id" }, explain: "tag.e.id" },
            { name: "relay", type: { type: "relay-url" }, explain: "tag.relay", optional: true },
            {
              name: "marker",
              type: {
                type: "enum",
                values: [
                  { value: "root", explain: "marker.root" },
                  { value: "reply", explain: "marker.reply" },
                ],
              },
              explain: "tag.e.marker",
              optional: true,
            },
            { name: "pubkey", type: { type: "pubkey" }, explain: "tag.e.pubkey", optional: true },
          ],
        },
        {
          name: "p",
          explain: "tag.p",
          presence: "recommended",
          repeatable: true,
          fields: [
            { name: "pubkey", type: { type: "pubkey" }, explain: "tag.p.pubkey" },
            { name: "relay", type: { type: "relay-url" }, explain: "tag.relay", optional: true },
          ],
        },
      ],
      examples: [
        {
          id: "comment",
          label: "example.comment",
          signer: "carol",
          template: {
            kind: 2004,
            tags: [
              ["e", NIP35_TORRENT_ID, "wss://relay.beta.example", "root", FRANK],
              ["p", FRANK],
            ],
            content: "Seeding from my home server, thanks for indexing it with the IMDb id.",
          },
        },
      ],
    },
  ],
};
