// Owner: spec author r6 (NIPs letter ids). NIP-F4: Podcasts. A podcast is its own keypair:
// kind 10154 show metadata, kind 54 episodes, and the authors' kind 10164 counter-claim.
// The NIP's text says 10164 but its JSON example shows 10064; we follow the text (and say so in
// the explanation). Explanations: packages/i18n/src/locales/en/nips/r6.ts → nF4.text.
import type { NipSpec } from "../spec.ts";
import { ALICE, BOB, GRACE, textTag } from "./r6-common.ts";

const show = { kind: "event", id: "show" } as const;
const authored = { kind: "event", id: "authored" } as const;
const episode = { kind: "event", id: "episode" } as const;

const urlTag = (name: string, presence: "recommended" | "optional", repeatable: boolean) =>
  ({
    name,
    explain: `tag.${name}`,
    presence,
    repeatable,
    fields: [{ name: "url", type: { type: "url" }, explain: `tag.${name}.url` }],
  }) as const;

export const nipF4: NipSpec = {
  nip: "F4",
  variant: "event",
  howItWorks: [
    { id: "keypair", title: "how.keypair.title", body: "how.keypair.body" },
    { id: "show", title: "how.show.title", body: "how.show.body", focus: { part: show } },
    {
      id: "episode",
      title: "how.episode.title",
      body: "how.episode.body",
      focus: { part: episode, path: ["tags", 3] },
    },
    {
      id: "authors",
      title: "how.authors.title",
      body: "how.authors.body",
      focus: { part: authored, path: ["tags", 0] },
    },
    { id: "listen", title: "how.listen.title", body: "how.listen.body" },
  ],
  related: [
    { nip: "51", relation: "see-also", explain: "related.51" },
    { nip: "B7", relation: "see-also", explain: "related.B7" },
    { nip: "25", relation: "see-also", explain: "related.25" },
    { nip: "01", relation: "depends-on", explain: "related.01" },
  ],
  flows: [
    {
      id: "authorship",
      label: "flow.authorship.label",
      explain: "flow.authorship.explain",
      steps: [
        { part: show, explain: "flow.authorship.show" },
        { part: authored, explain: "flow.authorship.authored" },
      ],
    },
  ],
  events: [
    {
      id: "show",
      label: "event.show.label",
      explain: "event.show.explain",
      kinds: [10154],
      content: { format: "empty", explain: "content.empty" },
      tags: [
        textTag("title", "recommended"),
        urlTag("image", "recommended", false),
        textTag("description", "recommended"),
        urlTag("website", "optional", true),
        {
          name: "p",
          explain: "tag.p",
          presence: "optional",
          repeatable: true,
          fields: [
            { name: "pubkey", type: { type: "pubkey" }, explain: "tag.p.pubkey" },
            {
              name: "role",
              type: {
                type: "enum",
                values: [
                  { value: "host", explain: "role.host" },
                  { value: "cohost", explain: "role.cohost" },
                  { value: "editor", explain: "role.editor" },
                ],
              },
              explain: "tag.p.role",
              optional: true,
            },
          ],
        },
      ],
      examples: [
        {
          id: "relay-hour",
          label: "example.relay-hour",
          explain: "example.relay-hour.explain",
          signer: "grace",
          template: {
            kind: 10154,
            tags: [
              ["title", "The Relay Hour"],
              ["image", "https://media.alpha.example/relay-hour/cover.jpg"],
              ["description", "A weekly chat about building on Nostr, one relay at a time."],
              ["website", "https://relayhour.example"],
              ["p", ALICE, "host"],
              ["p", BOB, "cohost"],
            ],
            content: "",
          },
        },
      ],
    },
    {
      id: "authored",
      label: "event.authored.label",
      explain: "event.authored.explain",
      kinds: [10164],
      content: { format: "empty", explain: "content.empty" },
      tags: [
        {
          name: "p",
          explain: "tag.authored-p",
          presence: "required",
          repeatable: true,
          fields: [{ name: "podcast", type: { type: "pubkey" }, explain: "tag.authored-p.pubkey" }],
        },
      ],
      examples: [
        {
          id: "alice-hosts",
          label: "example.alice-hosts",
          explain: "example.alice-hosts.explain",
          signer: "alice",
          template: { kind: 10164, tags: [["p", GRACE]], content: "" },
        },
      ],
    },
    {
      id: "episode",
      label: "event.episode.label",
      explain: "event.episode.explain",
      kinds: [54],
      content: { format: "text", explain: "content.notes", multiline: true },
      tags: [
        textTag("title", "recommended"),
        urlTag("image", "optional", false),
        textTag("description", "recommended"),
        {
          name: "audio",
          explain: "tag.audio",
          presence: "required",
          repeatable: true,
          fields: [
            { name: "url", type: { type: "url" }, explain: "tag.audio.url" },
            {
              name: "media-type",
              type: { type: "text", pattern: "audio/[a-z0-9.+-]+" },
              explain: "tag.audio.type",
              optional: true,
              placeholder: "audio/mpeg",
            },
          ],
        },
      ],
      examples: [
        {
          id: "episode-1",
          label: "example.episode-1",
          explain: "example.episode-1.explain",
          signer: "grace",
          template: {
            kind: 54,
            tags: [
              ["title", "Episode 1: The outbox model"],
              ["image", "https://media.alpha.example/relay-hour/001.jpg"],
              ["description", "Alice and Bob explain how clients find your notes."],
              ["audio", "https://media.alpha.example/relay-hour/001.mp3", "audio/mpeg"],
              ["audio", "https://media.alpha.example/relay-hour/001.m4a", "audio/mp4"],
            ],
            content:
              "## Show notes\n\n- Why one relay is not enough\n- Reading a kind 10002 relay list\n- Q&A from listeners",
          },
        },
      ],
    },
  ],
};
