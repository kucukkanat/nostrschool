// Owner: spec author r2 (NIPs 20–39). NIP-29: Relay-based Groups.
// Demo cast: the group "film-cameras" lives on relay.delta.example. Dave runs that relay, so his
// demo key stands in for the relay's NIP-11 "self" key (it signs kinds 39000–39005); Carol is the
// group admin; Bob and Grace are members.
import type { EventShape, NipSpec, TagSpec } from "../spec.ts";

const CAROL = "9445888d3235f73f8b627df1fb1d498f2eb3fa76337679c1176965a73d3b68b4";
const BOB = "a73883912a48c3551c1548fd454876d577126a61c76b5486c807bfec5869e183";
const GRACE = "5f69e52aeb38975e54cb99428da837124166abb4198c1128c54491be73d23812";
const ERIN = "c71750007e42443e5ca8c1ea00babed4e8c78a9cb45dd6db3733d918e0b55deb";
const GROUP = "film-cameras";
const RELAY_HTTP = "https://relay.delta.example";
const LIVEKIT_URL = `${RELAY_HTTP}/.well-known/nip29/livekit/${GROUP}`;
// Id of the "chat" example (kind 9 by bob at FIXTURE_NOW); r2.test.ts recomputes it.
export const NIP29_CHAT_ID = "fd3bb195fd0916170ea8d25aca383b2b6ede9b8dc84fc88df50bc09b41d3061f";
// base64 of the "livekit-auth" example signed by grace at FIXTURE_NOW; r2.test.ts checks it.
export const NIP29_LIVEKIT_AUTH =
  "eyJraW5kIjoyNzIzNSwiY3JlYXRlZF9hdCI6MTczNTY4OTYwMCwidGFncyI6W1sidSIsImh0dHBzOi8vcmVsYXkuZGVsdGEuZXhhbXBsZS8ud2VsbC1rbm93bi9uaXAyOS9saXZla2l0L2ZpbG0tY2FtZXJhcyJdLFsibWV0aG9kIiwiR0VUIl1dLCJjb250ZW50IjoiIiwicHVia2V5IjoiNWY2OWU1MmFlYjM4OTc1ZTU0Y2I5OTQyOGRhODM3MTI0MTY2YWJiNDE5OGMxMTI4YzU0NDkxYmU3M2QyMzgxMiIsImlkIjoiMTljYWY1Y2MyMDA2MDljYWY5NzE4OGMwZmFlNzVjOGIyMjZkYzkwNDgyZTgzMGJjOGUyNzc2NzJmMzIzNWM1ZSIsInNpZyI6ImFhY2FhZWQwYmM0NDY4MzdjZGNjMzY3YzM1MTA2ZTc3ZmUxZTRhN2RkZDQ2ODVjNTY4NWEzMDcyNDcyNjU3ODk0NTFmYzE2NjU1NGY0ZTY4MDU2ZDgwNzc5OTExZTA1ODkwN2QxMWNmZGI5MWJkNmVlYTA5OWFlMDFiZmQ2Njk1In0=";
const PREVIOUS = ["previous", "6f47e4a1", "91a74c40", "34be34fe"];

// ── Tag building blocks ───────────────────────────────────────────────────────────────────────

const hTag: TagSpec = {
  name: "h",
  explain: "tag.h",
  presence: "required",
  repeatable: false,
  fields: [
    {
      name: "group-id",
      type: { type: "text", pattern: "[a-zA-Z0-9_-]+" },
      explain: "tag.h.id",
      placeholder: GROUP,
    },
  ],
};

const dTag: TagSpec = {
  name: "d",
  explain: "tag.d",
  presence: "required",
  repeatable: false,
  fields: [
    {
      name: "group-id",
      type: { type: "text", pattern: "[a-zA-Z0-9_-]+" },
      explain: "tag.h.id",
      placeholder: GROUP,
    },
  ],
};

const previousTag: TagSpec = {
  name: "previous",
  explain: "tag.previous",
  presence: "recommended",
  repeatable: false,
  fields: [],
  rest: { name: "ref", type: { type: "hex", bytes: 4 }, explain: "tag.previous.ref" },
  template: PREVIOUS,
};

const text = (name: string, presence: TagSpec["presence"] = "optional"): TagSpec => ({
  name,
  explain: `tag.${name}`,
  presence,
  repeatable: false,
  fields: [{ name, type: { type: "text" }, explain: `tag.${name}.value` }],
});

const url = (name: string): TagSpec => ({
  name,
  explain: `tag.${name}`,
  presence: "optional",
  repeatable: false,
  fields: [{ name: "url", type: { type: "url" }, explain: "tag.url.value" }],
});

const flag = (name: string): TagSpec => ({
  name,
  explain: `tag.${name}`,
  presence: "optional",
  repeatable: false,
  fields: [],
});

const metadataTags: readonly TagSpec[] = [
  text("name"),
  url("picture"),
  url("banner"),
  text("about"),
  flag("private"),
  flag("restricted"),
  flag("hidden"),
  flag("closed"),
  flag("livekit"),
  {
    name: "supported_kinds",
    explain: "tag.supported_kinds",
    presence: "optional",
    repeatable: false,
    fields: [],
    rest: { name: "kind", type: { type: "kind" }, explain: "tag.supported_kinds.kind" },
  },
  {
    name: "parent",
    explain: "tag.parent",
    presence: "optional",
    repeatable: false,
    fields: [{ name: "group-id", type: { type: "text" }, explain: "tag.parent.value" }],
  },
  {
    name: "child",
    explain: "tag.child",
    presence: "optional",
    repeatable: true,
    fields: [{ name: "group-id", type: { type: "text" }, explain: "tag.child.value" }],
  },
];

const pTag = (explain: string, presence: TagSpec["presence"], roles: boolean): TagSpec => ({
  name: "p",
  explain,
  presence,
  repeatable: true,
  fields: [{ name: "pubkey", type: { type: "pubkey" }, explain: "tag.p.pubkey" }],
  ...(roles ? { rest: { name: "role", type: { type: "text" }, explain: "tag.p.role" } } : {}),
});

const eTag = (explain: string, presence: TagSpec["presence"]): TagSpec => ({
  name: "e",
  explain,
  presence,
  repeatable: true,
  fields: [{ name: "event-id", type: { type: "event-id" }, explain: "tag.e.id" }],
});

const aTag: TagSpec = {
  name: "a",
  explain: "tag.a",
  presence: "optional",
  repeatable: true,
  fields: [{ name: "address", type: { type: "addr" }, explain: "tag.a.addr" }],
};

const reason = { format: "text", explain: "content.reason", multiline: true } as const;
const empty = { format: "empty", explain: "content.empty" } as const;

// A moderation event (kinds 9000–9020): h + previous + action tags, optional reason.
const moderation = (
  id: string,
  kind: number,
  tags: readonly TagSpec[],
  example: readonly (readonly string[])[],
  content = "",
): EventShape => ({
  id,
  label: `event.${id}.label`,
  explain: `event.${id}.explain`,
  kinds: [kind],
  content: reason,
  tags: [hTag, previousTag, ...tags],
  examples: [
    {
      id,
      label: `example.${id}`,
      signer: "carol",
      template: { kind, tags: [["h", GROUP], PREVIOUS, ...example], content },
    },
  ],
});

// A relay-signed group state event (kinds 39000–39005).
const relayState = (
  id: string,
  kind: number,
  tags: readonly TagSpec[],
  example: readonly (readonly string[])[],
  content: EventShape["content"] = empty,
  exampleContent = "",
): EventShape => ({
  id,
  label: `event.${id}.label`,
  explain: `event.${id}.explain`,
  kinds: [kind],
  content,
  tags: [dTag, ...tags],
  examples: [
    {
      id,
      label: `example.${id}`,
      signer: "dave",
      template: { kind, tags: [["d", GROUP], ...example], content: exampleContent },
    },
  ],
});

export const nip29: NipSpec = {
  nip: "29",
  variant: "event",
  howItWorks: [
    {
      id: "relay",
      title: "how.relay.title",
      body: "how.relay.body",
      focus: { part: { kind: "event", id: "metadata" } },
    },
    {
      id: "h",
      title: "how.h.title",
      body: "how.h.body",
      focus: { part: { kind: "event", id: "chat" }, path: ["tags", 0] },
    },
    {
      id: "join",
      title: "how.join.title",
      body: "how.join.body",
      focus: { part: { kind: "event", id: "join" } },
    },
    {
      id: "moderation",
      title: "how.moderation.title",
      body: "how.moderation.body",
      focus: { part: { kind: "event", id: "put-user" } },
    },
    {
      id: "previous",
      title: "how.previous.title",
      body: "how.previous.body",
      focus: { part: { kind: "event", id: "chat" }, path: ["tags", 1] },
    },
    { id: "forks", title: "how.forks.title", body: "how.forks.body" },
  ],
  related: [
    { nip: "28", relation: "replaces", explain: "related.28" },
    { nip: "11", relation: "depends-on", explain: "related.11" },
    { nip: "C7", relation: "used-by", explain: "related.C7" },
    { nip: "51", relation: "see-also", explain: "related.51" },
    { nip: "98", relation: "depends-on", explain: "related.98" },
    { nip: "19", relation: "see-also", explain: "related.19" },
  ],
  flows: [
    {
      id: "membership",
      label: "flow.membership.label",
      explain: "flow.membership.explain",
      steps: [
        { part: { kind: "event", id: "join" }, explain: "flow.membership.join" },
        { part: { kind: "event", id: "put-user" }, explain: "flow.membership.put" },
        { part: { kind: "event", id: "members" }, explain: "flow.membership.members" },
        { part: { kind: "event", id: "chat" }, explain: "flow.membership.chat" },
        { part: { kind: "event", id: "leave" }, explain: "flow.membership.leave" },
      ],
    },
    {
      id: "livekit",
      label: "flow.livekit.label",
      explain: "flow.livekit.explain",
      steps: [
        { part: { kind: "event", id: "metadata" }, explain: "flow.livekit.metadata" },
        { part: { kind: "event", id: "livekit-auth" }, explain: "flow.livekit.auth" },
        { part: { kind: "http", id: "livekit-token" }, explain: "flow.livekit.token" },
        { part: { kind: "event", id: "participants" }, explain: "flow.livekit.participants" },
      ],
    },
  ],
  events: [
    {
      id: "chat",
      label: "event.chat.label",
      explain: "event.chat.explain",
      kinds: [9, 11],
      content: { format: "text", explain: "content.chat", required: true, multiline: true },
      tags: [hTag, previousTag],
      examples: [
        {
          id: "chat",
          label: "example.chat",
          signer: "bob",
          template: {
            kind: 9,
            tags: [["h", GROUP], PREVIOUS],
            content: "Anyone shot the new Portra 400 in winter light? Thinking of trying it.",
          },
        },
      ],
    },
    {
      id: "join",
      label: "event.join.label",
      explain: "event.join.explain",
      kinds: [9021],
      content: reason,
      tags: [
        hTag,
        {
          name: "code",
          explain: "tag.code",
          presence: "optional",
          repeatable: false,
          fields: [{ name: "code", type: { type: "text" }, explain: "tag.code.value" }],
        },
      ],
      examples: [
        {
          id: "join",
          label: "example.join",
          explain: "example.join.explain",
          signer: "grace",
          template: {
            kind: 9021,
            tags: [
              ["h", GROUP],
              ["code", "spring-roll-36"],
            ],
            content: "Carol sent me the invite. I just got my first film camera!",
          },
        },
      ],
    },
    {
      id: "leave",
      label: "event.leave.label",
      explain: "event.leave.explain",
      kinds: [9022],
      content: reason,
      tags: [hTag],
      examples: [
        {
          id: "leave",
          label: "example.leave",
          signer: "grace",
          template: { kind: 9022, tags: [["h", GROUP]], content: "" },
        },
      ],
    },
    moderation("put-user", 9000, [pTag("tag.p-put", "required", true)], [["p", GRACE, "member"]]),
    moderation(
      "remove-user",
      9001,
      [pTag("tag.p-remove", "required", false)],
      [["p", ERIN]],
      "Spam",
    ),
    moderation("edit-metadata", 9002, metadataTags, [
      ["name", "Film Cameras"],
      ["about", "Analog photography: film stocks, cameras, scans and darkroom tips."],
      ["picture", "https://images.example.com/film-cameras.png"],
      ["restricted"],
      ["supported_kinds", "9", "11"],
    ]),
    moderation(
      "delete-event",
      9005,
      [eTag("tag.e-delete", "required")],
      [["e", NIP29_CHAT_ID]],
      "Off-topic",
    ),
    moderation("create-group", 9007, [], []),
    moderation("delete-group", 9008, [], []),
    moderation(
      "create-invite",
      9009,
      [
        {
          name: "code",
          explain: "tag.code-invite",
          presence: "required",
          repeatable: false,
          fields: [
            { name: "code", type: { type: "text", minLength: 1 }, explain: "tag.code.value" },
          ],
        },
      ],
      [["code", "spring-roll-36"]],
    ),
    moderation(
      "update-pin-list",
      9010,
      [eTag("tag.e-pin", "optional"), aTag],
      [["e", NIP29_CHAT_ID]],
    ),
    relayState("metadata", 39000, metadataTags, [
      ["name", "Film Cameras"],
      ["about", "Analog photography: film stocks, cameras, scans and darkroom tips."],
      ["picture", "https://images.example.com/film-cameras.png"],
      ["restricted"],
      ["livekit"],
      ["supported_kinds", "9", "11"],
      ["parent", "photography"],
    ]),
    relayState(
      "admins",
      39001,
      [pTag("tag.p-admin", "optional", true)],
      [["p", CAROL, "admin", "moderator"]],
      { format: "text", explain: "content.description" },
      "Admins of the Film Cameras group",
    ),
    relayState(
      "members",
      39002,
      [pTag("tag.p-member", "optional", false)],
      [
        ["p", CAROL],
        ["p", BOB],
        ["p", GRACE],
      ],
      { format: "text", explain: "content.description" },
      "Members of the Film Cameras group",
    ),
    relayState(
      "roles",
      39003,
      [
        {
          name: "role",
          explain: "tag.role",
          presence: "optional",
          repeatable: true,
          fields: [
            { name: "name", type: { type: "text", minLength: 1 }, explain: "tag.role.name" },
            {
              name: "description",
              type: { type: "text" },
              explain: "tag.role.description",
              optional: true,
            },
          ],
        },
      ],
      [
        ["role", "admin", "Can edit metadata, add and remove members, delete messages"],
        ["role", "moderator", "Can delete messages"],
      ],
      { format: "text", explain: "content.description" },
      "Roles supported by relay.delta.example",
    ),
    relayState(
      "participants",
      39004,
      [
        {
          name: "participant",
          explain: "tag.participant",
          presence: "optional",
          repeatable: true,
          fields: [{ name: "pubkey", type: { type: "pubkey" }, explain: "tag.p.pubkey" }],
        },
      ],
      [
        ["participant", CAROL],
        ["participant", GRACE],
      ],
    ),
    relayState("pinned", 39005, [eTag("tag.e-pin", "optional"), aTag], [["e", NIP29_CHAT_ID]]),
    {
      id: "livekit-auth",
      label: "event.livekit-auth.label",
      explain: "event.livekit-auth.explain",
      kinds: [27235],
      content: empty,
      tags: [
        {
          name: "u",
          explain: "tag.u",
          presence: "required",
          repeatable: false,
          fields: [{ name: "url", type: { type: "url" }, explain: "tag.u.value" }],
        },
        {
          name: "method",
          explain: "tag.method",
          presence: "required",
          repeatable: false,
          fields: [
            {
              name: "method",
              type: { type: "enum", values: [{ value: "GET" }] },
              explain: "tag.method.value",
            },
          ],
        },
      ],
      examples: [
        {
          id: "livekit-auth",
          label: "example.livekit-auth",
          signer: "grace",
          template: {
            kind: 27235,
            tags: [
              ["u", LIVEKIT_URL],
              ["method", "GET"],
            ],
            content: "",
          },
        },
      ],
    },
  ],
  http: [
    {
      id: "livekit-token",
      label: "http.livekit-token.label",
      explain: "http.livekit-token.explain",
      method: "GET",
      urlTemplate: "https://<relay-host>/.well-known/nip29/livekit/<group-id>",
      headers: [
        {
          name: "Authorization",
          explain: "http.livekit-token.authorization",
          value: { type: "base64", of: "event" },
          required: true,
        },
      ],
      responses: [
        {
          status: 200,
          explain: "http.livekit-token.200",
          mediaType: "application/json",
          schema: { type: "any", explain: "http.livekit-token.200.body" },
        },
        { status: 401, explain: "http.livekit-token.401" },
        { status: 403, explain: "http.livekit-token.403" },
      ],
      authEvent: "livekit-auth",
      examples: [
        {
          id: "token",
          label: "example.token",
          url: LIVEKIT_URL,
          headers: { Authorization: `Nostr ${NIP29_LIVEKIT_AUTH}` },
        },
      ],
    },
  ],
};
