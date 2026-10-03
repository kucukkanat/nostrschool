// Owner: spec author r6 (NIPs letter ids). NIP-5A: Static Websites (nsites).
// Three manifest kinds share one tag vocabulary: 15128 root site (no d tag), 35128 named site
// (d = 1–13 char DNS-safe label), 5128 snapshot (a + x required). The aggregate hash in the
// examples is the real one (r6.test.ts recomputes it). The legacy kind 34128 is only mentioned.
// Explanations: packages/i18n/src/locales/en/nips/r6.ts → n5A.text.
import type { EventShape, NipSpec, TagSpec } from "../spec.ts";
import { ALICE, ALPHA, FIXTURE_NOW, textTag } from "./r6-common.ts";

/** sha256 of each demo file (stand-ins: sha256 of "nostrschool:nsite:<path>"). */
export const NIP5A_FILES = {
  "/index.html": "901099aca1195e86c5d7c9da6fc8c3e018c8ff1d18919276e6ac469575dc2185",
  "/about.html": "be6e87c5d761a28ee0812e000847e6273bb017e4db73bd412098cbb4edfef528",
  "/favicon.ico": "8f512387c800589c370a2a8b3ff4650212ef36dd8f1553825c08b2577f8fa14a",
  "/posts/hello.html": "467e044f3c4c6b2f2eb1a955de9f2d71919f9f0e42f9e085ec2c54a06c7d3e33",
} as const;
/** Aggregate hashes of the root site (index, about, favicon) and of the blog (index, hello). */
export const NIP5A_ROOT_AGGREGATE =
  "23c695d3f97898f0c213912a79bc64f3c06d4b722d2f70926f0a7670c94f5daf";
export const NIP5A_BLOG_AGGREGATE =
  "c6d8e9e19d0a123f2268df9763ebc3666add9b00ee378e7fe210de97e43faea4";

const SITE_KINDS = [15128, 35128];
const BLOG = `35128:${ALICE}:blog`;
const SERVER = "https://blossom.alpha.example";
const path = (p: keyof typeof NIP5A_FILES): readonly string[] => ["path", p, NIP5A_FILES[p]];

const root = { kind: "event", id: "root" } as const;
const named = { kind: "event", id: "named" } as const;
const snapshot = { kind: "event", id: "snapshot" } as const;

const lineage = (name: "a" | "A", presence: TagSpec["presence"]): TagSpec => ({
  name,
  explain: `tag.${name}`,
  presence,
  repeatable: false,
  fields: [
    { name: "site", type: { type: "addr", kinds: SITE_KINDS }, explain: `tag.${name}.site` },
    { name: "relay", type: { type: "relay-url" }, explain: "tag.relay", optional: true },
  ],
});

/** Tags every manifest kind shares; `x`'s and `a`'s presence differs per kind. */
const common = (xPresence: TagSpec["presence"], aPresence: TagSpec["presence"]): TagSpec[] => [
  {
    name: "path",
    explain: "tag.path",
    presence: "required",
    repeatable: true,
    fields: [
      {
        name: "path",
        type: { type: "text", pattern: "/\\S*[^/]" },
        explain: "tag.path.path",
        placeholder: "/index.html",
      },
      { name: "sha256", type: { type: "hex32" }, explain: "tag.path.sha256" },
    ],
  },
  {
    name: "x",
    explain: "tag.x",
    presence: xPresence,
    repeatable: false,
    fields: [
      { name: "aggregate", type: { type: "hex32" }, explain: "tag.x.hash" },
      {
        name: "marker",
        type: { type: "enum", values: [{ value: "aggregate" }] },
        explain: "tag.x.marker",
      },
    ],
  },
  lineage("a", aPresence),
  lineage("A", "optional"),
  {
    name: "server",
    explain: "tag.server",
    presence: "optional",
    repeatable: true,
    fields: [{ name: "url", type: { type: "url" }, explain: "tag.server.url" }],
  },
  textTag("title"),
  textTag("description"),
  {
    name: "source",
    explain: "tag.source",
    presence: "optional",
    repeatable: false,
    fields: [
      {
        name: "url",
        type: { type: "url", schemes: ["https", "nostr"] },
        explain: "tag.source.url",
      },
    ],
  },
  {
    name: "app",
    explain: "tag.app",
    presence: "optional",
    repeatable: true,
    fields: [
      { name: "descriptor", type: { type: "addr" }, explain: "tag.app.descriptor" },
      { name: "relay", type: { type: "relay-url" }, explain: "tag.relay" },
    ],
  },
];

const D_TAG: TagSpec = {
  name: "d",
  explain: "tag.d",
  presence: "required",
  repeatable: false,
  fields: [
    {
      name: "site",
      type: { type: "text", pattern: "[a-z0-9-]{0,12}[a-z0-9]" },
      explain: "tag.d.site",
      placeholder: "blog",
    },
  ],
};

const blogPaths = [path("/index.html"), path("/posts/hello.html")];

const shapes: readonly EventShape[] = [
  {
    id: "root",
    label: "event.root.label",
    explain: "event.root.explain",
    kinds: [15128],
    content: { format: "empty", explain: "content.empty" },
    tags: common("recommended", "optional"),
    // A root site MUST NOT carry a d tag: unknown tags (d among them) are a warning here.
    unknownTags: "warn",
    examples: [
      {
        id: "homepage",
        label: "example.homepage",
        explain: "example.homepage.explain",
        signer: "alice",
        template: {
          kind: 15128,
          tags: [
            path("/index.html"),
            path("/about.html"),
            path("/favicon.ico"),
            ["x", NIP5A_ROOT_AGGREGATE, "aggregate"],
            ["server", SERVER],
            ["title", "Alice on Nostr"],
            ["description", "My homepage, served from Blossom"],
            ["source", "https://git.alpha.example/alice/homepage.git"],
            ["app", `31990:${ALICE}:homepage`, ALPHA],
          ],
          content: "",
        },
      },
    ],
  },
  {
    id: "named",
    label: "event.named.label",
    explain: "event.named.explain",
    kinds: [35128],
    content: { format: "empty", explain: "content.empty" },
    tags: [D_TAG, ...common("recommended", "optional")],
    examples: [
      {
        id: "blog",
        label: "example.blog",
        explain: "example.blog.explain",
        signer: "alice",
        template: {
          kind: 35128,
          tags: [
            ["d", "blog"],
            ...blogPaths,
            ["x", NIP5A_BLOG_AGGREGATE, "aggregate"],
            ["server", SERVER],
            ["title", "Alice's blog"],
          ],
          content: "",
        },
      },
      {
        id: "copy",
        label: "example.copy",
        explain: "example.copy.explain",
        signer: "bob",
        template: {
          kind: 35128,
          tags: [
            ["d", "alice-blog"],
            ["a", BLOG],
            ["A", BLOG],
            ...blogPaths,
            ["x", NIP5A_BLOG_AGGREGATE, "aggregate"],
            ["title", "Alice's blog (mirror)"],
          ],
          content: "",
        },
      },
    ],
  },
  {
    id: "snapshot",
    label: "event.snapshot.label",
    explain: "event.snapshot.explain",
    kinds: [5128],
    content: { format: "empty", explain: "content.empty" },
    tags: common("required", "required"),
    examples: [
      {
        id: "blog-v1",
        label: "example.blog-v1",
        explain: "example.blog-v1.explain",
        signer: "alice",
        template: {
          kind: 5128,
          created_at: FIXTURE_NOW + 3600,
          tags: [
            ["a", BLOG],
            ...blogPaths,
            ["x", NIP5A_BLOG_AGGREGATE, "aggregate"],
            ["title", "Alice's blog, January"],
          ],
          content: "",
        },
      },
    ],
  },
];

export const nip5A: NipSpec = {
  nip: "5A",
  variant: "event",
  howItWorks: [
    {
      id: "files",
      title: "how.files.title",
      body: "how.files.body",
      focus: { part: root, path: ["tags", 0] },
    },
    { id: "kinds", title: "how.kinds.title", body: "how.kinds.body", focus: { part: named } },
    {
      id: "aggregate",
      title: "how.aggregate.title",
      body: "how.aggregate.body",
      focus: { part: root, path: ["tags", 3] },
    },
    { id: "host", title: "how.host.title", body: "how.host.body" },
    { id: "resolve", title: "how.resolve.title", body: "how.resolve.body" },
    {
      id: "history",
      title: "how.history.title",
      body: "how.history.body",
      focus: { part: snapshot },
    },
  ],
  related: [
    { nip: "B7", relation: "depends-on", explain: "related.B7" },
    { nip: "01", relation: "depends-on", explain: "related.01" },
    { nip: "19", relation: "depends-on", explain: "related.19" },
    { nip: "89", relation: "see-also", explain: "related.89" },
    { nip: "34", relation: "see-also", explain: "related.34" },
  ],
  flows: [
    {
      id: "publish",
      label: "flow.publish.label",
      explain: "flow.publish.explain",
      steps: [
        { part: named, explain: "flow.publish.named" },
        { part: snapshot, explain: "flow.publish.snapshot" },
      ],
    },
  ],
  events: shapes,
};
