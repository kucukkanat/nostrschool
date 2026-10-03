// Owner: spec author r4 (NIPs 60–79). NIP-78: Arbitrary custom app data.
import type { NipSpec } from "../spec.ts";

export const nip78: NipSpec = {
  nip: "78",
  variant: "event",
  howItWorks: [
    {
      id: "private",
      title: "how.private.title",
      body: "how.private.body",
      focus: { part: { kind: "event", id: "app-data" } },
    },
    {
      id: "address",
      title: "how.address.title",
      body: "how.address.body",
      focus: { part: { kind: "event", id: "app-data" }, path: ["tags", 0] },
    },
    {
      id: "anything",
      title: "how.anything.title",
      body: "how.anything.body",
      focus: { part: { kind: "event", id: "app-data" }, path: ["content"] },
    },
    {
      id: "many",
      title: "how.many.title",
      body: "how.many.body",
      focus: { part: { kind: "event", id: "app-log" } },
    },
    { id: "auth", title: "how.auth.title", body: "how.auth.body" },
  ],
  related: [
    { nip: "42", relation: "see-also", explain: "related.42" },
    { nip: "44", relation: "see-also", explain: "related.44" },
    { nip: "01", relation: "depends-on", explain: "related.01" },
  ],
  events: [
    {
      id: "app-data",
      label: "data.label",
      explain: "data.explain",
      kinds: [30078],
      content: { format: "text", explain: "data.content", multiline: true },
      tags: [
        {
          name: "d",
          explain: "data.tag.d",
          presence: "required",
          repeatable: false,
          fields: [
            {
              name: "identifier",
              type: { type: "text", minLength: 1 },
              explain: "data.tag.d.id",
              placeholder: "my-app/settings",
            },
          ],
        },
      ],
      examples: [
        {
          id: "settings",
          label: "data.example.settings.label",
          explain: "data.example.settings.explain",
          template: {
            kind: 30078,
            tags: [["d", "nostrschool/settings"]],
            content: JSON.stringify({ theme: "dark", fontSize: 18, autoplayGifs: false }),
          },
        },
        {
          id: "remote-config",
          label: "data.example.config.label",
          explain: "data.example.config.explain",
          signer: "dave",
          template: {
            kind: 30078,
            tags: [["d", "delta-client/feature-flags"]],
            content: JSON.stringify({ newComposer: true, maxUploadMb: 50 }),
          },
        },
      ],
    },
    {
      id: "app-log",
      label: "log.label",
      explain: "log.explain",
      kinds: [78],
      content: { format: "text", explain: "log.content", multiline: true },
      tags: [
        {
          name: "d",
          explain: "log.tag.d",
          presence: "recommended",
          repeatable: false,
          fields: [
            { name: "group", type: { type: "text", minLength: 1 }, explain: "log.tag.d.group" },
          ],
        },
      ],
      examples: [
        {
          id: "reading-log",
          label: "log.example.label",
          explain: "log.example.explain",
          signer: "frank",
          template: {
            kind: 78,
            tags: [["d", "reading-tracker/session"]],
            content: JSON.stringify({ book: "isbn:9780765382030", pages: 42, minutes: 35 }),
          },
        },
      ],
    },
  ],
};
