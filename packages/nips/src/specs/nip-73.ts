// Owner: spec author r4 (NIPs 60–79). NIP-73: External Content IDs.
// NIP-73 defines two tags rather than a kind; the shape accepts any kind and the examples show
// the two common carriers: a NIP-22 comment (uppercase root I/K) and a plain note.
import type { FieldType, NipSpec, TagSpec } from "../spec.ts";

const ID_KINDS: FieldType = {
  type: "enum",
  open: true,
  values: [
    { value: "web", explain: "k.web" },
    { value: "isbn", explain: "k.isbn" },
    { value: "geo", explain: "k.geo" },
    { value: "iso3166", explain: "k.iso3166" },
    { value: "isan", explain: "k.isan" },
    { value: "doi", explain: "k.doi" },
    { value: "#", explain: "k.hashtag" },
    { value: "podcast:guid", explain: "k.podcast-guid" },
    { value: "podcast:item:guid", explain: "k.podcast-item" },
    { value: "podcast:publisher:guid", explain: "k.podcast-publisher" },
    { value: "bitcoin:tx", explain: "k.chain-tx" },
    { value: "bitcoin:address", explain: "k.chain-address" },
    { value: "ethereum:tx", explain: "k.chain-tx" },
    { value: "ethereum:address", explain: "k.chain-address" },
  ],
};

// One alternative per row of the NIP's "Supported IDs" table.
const ID_PATTERN = [
  "https?://[^#\\s]+",
  "isbn:[0-9X]+",
  "geo:[0-9bcdefghjkmnpqrstuvwxyz]+",
  "iso3166:[A-Z]{2}(-[A-Z0-9]{1,3})?",
  "isan:[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-Z]",
  "doi:[^A-Z\\s]+",
  "#[^A-Z\\s]+",
  "podcast:(item:|publisher:)?guid:[0-9a-f-]+",
  "[a-z]+:([0-9]+:)?(tx|address):[^\\s]+",
].join("|");

const idTag = (name: string, presence: TagSpec["presence"]): TagSpec => ({
  name,
  explain: `ref.tag.${name}`,
  presence,
  repeatable: name === "i",
  fields: [
    { name: "id", type: { type: "text", pattern: ID_PATTERN }, explain: "ref.tag.i.id" },
    { name: "url-hint", type: { type: "url" }, explain: "ref.tag.i.hint", optional: true },
  ],
});
const kindTag = (name: string, presence: TagSpec["presence"]): TagSpec => ({
  name,
  explain: `ref.tag.${name}`,
  presence,
  repeatable: name === "k",
  fields: [{ name: "id-kind", type: ID_KINDS, explain: "ref.tag.k.kind" }],
});

export const nip73: NipSpec = {
  nip: "73",
  variant: "event",
  howItWorks: [
    {
      id: "ids",
      title: "how.ids.title",
      body: "how.ids.body",
      focus: { part: { kind: "event", id: "external-ref" }, path: ["tags", 0, 1] },
    },
    {
      id: "kinds",
      title: "how.kinds.title",
      body: "how.kinds.body",
      focus: { part: { kind: "event", id: "external-ref" }, path: ["tags", 1] },
    },
    { id: "normalise", title: "how.normalise.title", body: "how.normalise.body" },
    {
      id: "hint",
      title: "how.hint.title",
      body: "how.hint.body",
      focus: { part: { kind: "event", id: "external-ref" }, path: ["tags", 0, 2] },
    },
    { id: "query", title: "how.query.title", body: "how.query.body" },
  ],
  related: [
    { nip: "22", relation: "used-by", explain: "related.22" },
    { nip: "52", relation: "see-also", explain: "related.52" },
    { nip: "24", relation: "see-also", explain: "related.24" },
  ],
  events: [
    {
      id: "external-ref",
      label: "ref.label",
      explain: "ref.explain",
      kinds: [{ from: 0, to: 65535 }],
      content: { format: "text", explain: "ref.content" },
      tags: [
        idTag("I", "optional"),
        kindTag("K", "optional"),
        idTag("i", "required"),
        kindTag("k", "recommended"),
      ],
      examples: [
        {
          id: "book-comment",
          label: "ref.example.book.label",
          explain: "ref.example.book.explain",
          signer: "frank",
          template: {
            kind: 1111,
            tags: [
              ["I", "isbn:9780765382030", "https://isbnsearch.org/isbn/9780765382030"],
              ["K", "isbn"],
              ["i", "isbn:9780765382030"],
              ["k", "isbn"],
            ],
            content: "Chapter 3 holds up remarkably well a decade later.",
          },
        },
        {
          id: "web-note",
          label: "ref.example.web.label",
          explain: "ref.example.web.explain",
          template: {
            kind: 1,
            tags: [
              ["i", "https://myblog.example.com/post/2012-03-27/hello-world"],
              ["k", "web"],
            ],
            content: "This post is where I first heard about relays.",
          },
        },
        {
          id: "bitcoin-tx",
          label: "ref.example.tx.label",
          explain: "ref.example.tx.explain",
          signer: "bob",
          template: {
            kind: 1,
            tags: [
              ["i", "bitcoin:tx:a1075db55d416d3ca199f55b6084e2115b9345e16c5cf302fc80e9d5fbf5d48d"],
              ["k", "bitcoin:tx"],
              ["i", "iso3166:VE"],
              ["k", "iso3166"],
            ],
            content: "Settled. Thanks to everyone in Venezuela who helped test.",
          },
        },
      ],
    },
  ],
};
