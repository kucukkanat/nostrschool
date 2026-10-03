// Owner: spec author r3 (NIPs 40–59). NIP-48: Bridged Events (proxy tags).
// Explanations: packages/i18n/src/locales/en/nips/r3.ts → n48.text.
import type { NipSpec } from "../spec.ts";

export const nip48: NipSpec = {
  nip: "48",
  variant: "event",
  events: [
    {
      id: "bridged",
      label: "event.label",
      explain: "event.explain",
      // A proxy tag may be added to any kind.
      kinds: [{ from: 0, to: 65535 }],
      content: { format: "text", explain: "content", multiline: true },
      tags: [
        {
          name: "proxy",
          explain: "tag.proxy",
          presence: "required",
          repeatable: false,
          fields: [
            {
              name: "source-id",
              type: { type: "text", minLength: 1 },
              explain: "tag.proxy.id",
              placeholder: "https://mastodon.example/objects/9f524868",
            },
            {
              name: "protocol",
              type: {
                type: "enum",
                // "This list may be extended in the future": other protocols only warn.
                open: true,
                values: [
                  { value: "activitypub", explain: "protocol.activitypub" },
                  { value: "atproto", explain: "protocol.atproto" },
                  { value: "rss", explain: "protocol.rss" },
                  { value: "web", explain: "protocol.web" },
                ],
              },
              explain: "tag.proxy.protocol",
            },
          ],
        },
      ],
      examples: [
        {
          id: "activitypub",
          label: "example.activitypub",
          explain: "example.activitypub.explain",
          signer: "frank",
          template: {
            kind: 1,
            tags: [
              [
                "proxy",
                "https://mastodon.example/objects/8f6fac53-4f66-4c6e-ac7d-92e5e78c3e79",
                "activitypub",
              ],
            ],
            content: "Federated hello from the fediverse side of the bridge!",
          },
        },
        {
          id: "atproto",
          label: "example.atproto",
          signer: "frank",
          template: {
            kind: 1,
            tags: [
              [
                "proxy",
                "at://did:plc:zhbjlbmir5dganqhueg7y4i3/app.bsky.feed.post/3jt5hlibeol2i",
                "atproto",
              ],
            ],
            content: "Cross-posted from Bluesky.",
          },
        },
        {
          id: "rss",
          label: "example.rss",
          explain: "example.rss.explain",
          signer: "frank",
          template: {
            kind: 1,
            tags: [
              [
                "proxy",
                "https://blog.frank.example/feed.xml#https%3A%2F%2Fblog.frank.example%2Fprotocols-not-platforms",
                "rss",
              ],
            ],
            content:
              "New on the blog: Protocols, not platforms https://blog.frank.example/protocols-not-platforms",
          },
        },
      ],
    },
  ],
  howItWorks: [
    {
      id: "bridge",
      title: "how.bridge.title",
      body: "how.bridge.body",
    },
    {
      id: "tag",
      title: "how.tag.title",
      body: "how.tag.body",
      focus: { part: { kind: "event", id: "bridged" }, path: ["tags", 0, 1] },
    },
    {
      id: "protocol",
      title: "how.protocol.title",
      body: "how.protocol.body",
      focus: { part: { kind: "event", id: "bridged" }, path: ["tags", 0, 2] },
    },
    {
      id: "dedupe",
      title: "how.dedupe.title",
      body: "how.dedupe.body",
    },
  ],
  related: [{ nip: "01", relation: "extends", explain: "related.01" }],
};
