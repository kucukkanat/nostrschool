// Owner: spec author r5 (NIPs 80–99). NIP-99: Classified Listings.
import type { FieldType, NipSpec, TagSpec } from "../spec.ts";

const FRANK = "922e43b50aec16ad1e9d1ec6854c058816d28b944ae2fe9bdce3d9241bfaafb8";

const single = (
  name: string,
  type: FieldType,
  presence: TagSpec["presence"] = "recommended",
): TagSpec => ({
  name,
  explain: `tag.${name}`,
  presence,
  repeatable: false,
  fields: [{ name: "value", type, explain: `tag.${name}.value` }],
});

export const nip99: NipSpec = {
  nip: "99",
  variant: "event",
  howItWorks: [
    {
      id: "address",
      title: "how.address.title",
      body: "how.address.body",
      focus: { part: { kind: "event", id: "listing" }, path: ["tags", 0] },
    },
    {
      id: "describe",
      title: "how.describe.title",
      body: "how.describe.body",
      focus: { part: { kind: "event", id: "listing" }, path: ["content"] },
    },
    {
      id: "price",
      title: "how.price.title",
      body: "how.price.body",
      focus: { part: { kind: "event", id: "listing" }, path: ["tags", 5] },
    },
    {
      id: "find",
      title: "how.find.title",
      body: "how.find.body",
      focus: { part: { kind: "event", id: "listing" }, path: ["tags", 7] },
    },
    {
      id: "lifecycle",
      title: "how.lifecycle.title",
      body: "how.lifecycle.body",
      focus: { part: { kind: "event", id: "listing" }, path: ["kind"] },
    },
  ],
  related: [
    { nip: "01", relation: "depends-on", explain: "related.01" },
    { nip: "23", relation: "see-also", explain: "related.23" },
    { nip: "15", relation: "see-also", explain: "related.15" },
    { nip: "58", relation: "depends-on", explain: "related.58" },
    { nip: "52", relation: "see-also", explain: "related.52" },
  ],
  events: [
    {
      id: "listing",
      label: "event.listing.label",
      explain: "event.listing.explain",
      kinds: [30402, 30403],
      content: { format: "text", explain: "content", required: true, multiline: true },
      tags: [
        single("d", { type: "text", minLength: 1 }, "required"),
        single("title", { type: "text", minLength: 1 }),
        single("summary", { type: "text" }),
        single("published_at", { type: "timestamp" }),
        single("location", { type: "text" }),
        {
          name: "price",
          explain: "tag.price",
          presence: "recommended",
          repeatable: false,
          fields: [
            { name: "amount", type: { type: "number", min: 0 }, explain: "tag.price.amount" },
            {
              name: "currency",
              type: { type: "text", pattern: "[A-Za-z]{3,5}" },
              explain: "tag.price.currency",
            },
            {
              name: "frequency",
              type: {
                type: "enum",
                values: [
                  { value: "hour" },
                  { value: "day" },
                  { value: "week" },
                  { value: "month" },
                  { value: "year" },
                ],
                open: true,
              },
              explain: "tag.price.frequency",
              optional: true,
            },
          ],
        },
        {
          name: "status",
          explain: "tag.status",
          presence: "optional",
          repeatable: false,
          fields: [
            {
              name: "value",
              type: {
                type: "enum",
                values: [
                  { value: "active", explain: "status.active" },
                  { value: "sold", explain: "status.sold" },
                ],
                open: true,
              },
              explain: "tag.status.value",
            },
          ],
        },
        {
          name: "t",
          explain: "tag.t",
          presence: "optional",
          repeatable: true,
          fields: [{ name: "topic", type: { type: "text", minLength: 1 }, explain: "tag.t.value" }],
        },
        {
          name: "image",
          explain: "tag.image",
          presence: "optional",
          repeatable: true,
          fields: [
            { name: "url", type: { type: "url" }, explain: "tag.image.url" },
            {
              name: "dimensions",
              type: { type: "text", pattern: "\\d+x\\d+" },
              explain: "tag.image.dim",
              optional: true,
            },
          ],
        },
        single("g", { type: "text", pattern: "[0-9b-hjkmnp-z]{1,12}" }, "optional"),
        {
          name: "e",
          explain: "tag.e",
          presence: "optional",
          repeatable: true,
          fields: [
            { name: "event-id", type: { type: "event-id" }, explain: "tag.e.id" },
            { name: "relay", type: { type: "relay-url" }, explain: "tag.relay", optional: true },
          ],
        },
        {
          name: "a",
          explain: "tag.a",
          presence: "optional",
          repeatable: true,
          fields: [
            { name: "address", type: { type: "addr" }, explain: "tag.a.address" },
            { name: "relay", type: { type: "relay-url" }, explain: "tag.relay", optional: true },
          ],
        },
      ],
      examples: [
        {
          id: "camera",
          label: "example.camera.label",
          explain: "example.camera.explain",
          signer: "carol",
          template: {
            kind: 30402,
            tags: [
              ["d", "rangefinder-1972"],
              ["title", "Restored 1972 rangefinder camera"],
              ["summary", "Fully serviced, new light seals, shoots great on Portra 400."],
              ["published_at", "1735603200"],
              ["location", "Lisbon, Portugal"],
              ["price", "180", "EUR"],
              ["status", "active"],
              ["t", "cameras"],
              ["t", "film"],
              ["image", "https://files.beta.example/rangefinder.png", "800x600"],
              ["g", "eycs0p"],
            ],
            content:
              "# Restored 1972 rangefinder\n\nServiced last month: new light seals, cleaned lens, accurate shutter.\n\nPay in sats or euros. Local pickup or shipping inside the EU.",
          },
        },
        {
          id: "room",
          label: "example.room.label",
          explain: "example.room.explain",
          signer: "frank",
          template: {
            kind: 30402,
            tags: [
              ["d", "studio-room"],
              ["title", "Quiet writing studio for rent"],
              ["summary", "Desk, fast internet, coffee included."],
              ["published_at", "1735084800"],
              ["location", "Berlin"],
              ["price", "350", "EUR", "month"],
              ["t", "rental"],
              ["a", `30023:${FRANK}:protocols-not-platforms`, "wss://relay.alpha.example"],
            ],
            content:
              "A small, bright room for writers. Read my essay to see what gets written here.",
          },
        },
        {
          id: "draft",
          label: "example.draft.label",
          explain: "example.draft.explain",
          signer: "dave",
          template: {
            kind: 30403,
            tags: [
              ["d", "spare-relay-server"],
              ["title", "Spare relay server (draft)"],
              ["price", "250000", "SATS"],
              ["t", "hardware"],
            ],
            content: "Old relay box, 8 GB RAM. Still writing this one up.",
          },
        },
      ],
    },
  ],
};
