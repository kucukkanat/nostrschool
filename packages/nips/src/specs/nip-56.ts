// Owner: spec author r3 (NIPs 40–59). NIP-56: Reporting.
// Explanations: packages/i18n/src/locales/en/nips/r3.ts → n56.text.
import type { EnumOption, NipSpec } from "../spec.ts";

const FRANK = "922e43b50aec16ad1e9d1ec6854c058816d28b944ae2fe9bdce3d9241bfaafb8";
const SPAM_NOTE = "493eda901c79256aa415cc9e23a76bf6455f82a8937e2ef29ae7a2a2f3d3b1aa";
const BLOB_HASH = "b1674191a88ec5cdd733e4240a81803105dc412d6c6708d53ab94fc248f4f553";

const REPORT_TYPES: readonly EnumOption[] = [
  "nudity",
  "malware",
  "profanity",
  "illegal",
  "spam",
  "impersonation",
  "other",
].map((value) => ({ value, explain: `type.${value}` }));

const reportType = (optional: boolean) =>
  ({
    name: "report-type",
    type: { type: "enum", values: REPORT_TYPES },
    explain: "field.report-type",
    ...(optional ? { optional: true } : {}),
  }) as const;

export const nip56: NipSpec = {
  nip: "56",
  variant: "event",
  events: [
    {
      id: "report",
      label: "event.label",
      explain: "event.explain",
      kinds: [1984],
      content: { format: "text", explain: "content", multiline: true },
      tags: [
        {
          name: "p",
          explain: "tag.p",
          presence: "required",
          repeatable: false,
          fields: [
            { name: "pubkey", type: { type: "pubkey" }, explain: "field.pubkey" },
            reportType(true),
          ],
        },
        {
          name: "e",
          explain: "tag.e",
          presence: "optional",
          repeatable: false,
          fields: [
            { name: "event-id", type: { type: "event-id" }, explain: "field.event-id" },
            reportType(false),
          ],
        },
        {
          name: "x",
          explain: "tag.x",
          presence: "optional",
          repeatable: false,
          fields: [
            { name: "blob-hash", type: { type: "hex32" }, explain: "field.blob-hash" },
            reportType(false),
          ],
        },
        {
          name: "server",
          explain: "tag.server",
          presence: "optional",
          repeatable: true,
          fields: [{ name: "url", type: { type: "url" }, explain: "field.server" }],
        },
        {
          name: "L",
          explain: "tag.L",
          presence: "optional",
          repeatable: true,
          fields: [
            { name: "namespace", type: { type: "text", minLength: 1 }, explain: "field.namespace" },
          ],
        },
        {
          name: "l",
          explain: "tag.l",
          presence: "optional",
          repeatable: true,
          fields: [
            { name: "label", type: { type: "text", minLength: 1 }, explain: "field.label" },
            {
              name: "namespace",
              type: { type: "text" },
              explain: "field.namespace",
              optional: true,
            },
          ],
        },
      ],
      examples: [
        {
          id: "spam-note",
          label: "example.note",
          explain: "example.note.explain",
          signer: "grace",
          template: {
            kind: 1984,
            tags: [
              ["e", SPAM_NOTE, "spam"],
              ["p", FRANK],
            ],
            content: "Posted the same link in every thread today.",
          },
        },
        {
          id: "impersonation",
          label: "example.impersonation",
          explain: "example.impersonation.explain",
          signer: "erin",
          template: {
            kind: 1984,
            tags: [
              ["p", FRANK, "impersonation"],
              ["L", "social.nos.ontology"],
              ["l", "IM-imp", "social.nos.ontology"],
            ],
            content:
              "Profile is impersonating nostr:npub1cut4qqr7gfzruh9gc84qpw476n5v0z5uk3wadkehx0v33c94th4sp5w043",
          },
        },
        {
          id: "malware-blob",
          label: "example.blob",
          explain: "example.blob.explain",
          signer: "dave",
          template: {
            kind: 1984,
            tags: [
              ["x", BLOB_HASH, "malware"],
              ["e", SPAM_NOTE, "malware"],
              ["p", FRANK],
              ["server", `https://blossom.beta.example/${BLOB_HASH}.apk`],
            ],
            content: "This file contains malware.",
          },
        },
      ],
    },
  ],
  howItWorks: [
    {
      id: "target",
      title: "how.target.title",
      body: "how.target.body",
      focus: { part: { kind: "event", id: "report" }, path: ["tags", 1] },
    },
    {
      id: "type",
      title: "how.type.title",
      body: "how.type.body",
      focus: { part: { kind: "event", id: "report" }, path: ["tags", 0, 2] },
    },
    {
      id: "blobs",
      title: "how.blobs.title",
      body: "how.blobs.body",
    },
    {
      id: "clients",
      title: "how.clients.title",
      body: "how.clients.body",
    },
    {
      id: "relays",
      title: "how.relays.title",
      body: "how.relays.body",
    },
  ],
  related: [
    { nip: "32", relation: "see-also", explain: "related.32" },
    { nip: "51", relation: "see-also", explain: "related.51" },
    { nip: "B7", relation: "see-also", explain: "related.B7" },
  ],
};
