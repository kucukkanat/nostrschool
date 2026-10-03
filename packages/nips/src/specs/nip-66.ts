// Owner: spec author r4 (NIPs 60–79). NIP-66: Relay Discovery and Liveness Monitoring.
// Dave runs relay.delta.example, so he plays the monitor in the examples.
import type { FieldType, NipSpec, TagSpec } from "../spec.ts";

const ms: FieldType = { type: "number", integer: true, min: 0 };
const geohash: FieldType = { type: "text", pattern: "[0-9bcdefghjkmnpqrstuvwxyz]{1,12}" };

const rtt = (name: string): TagSpec => ({
  name,
  explain: `discovery.tag.${name}`,
  presence: "optional",
  repeatable: false,
  fields: [{ name: "ms", type: ms, explain: "discovery.rtt.ms" }],
});

const CHECKS: FieldType = {
  type: "enum",
  open: true,
  values: [
    { value: "open" },
    { value: "read" },
    { value: "write" },
    { value: "auth" },
    { value: "nip11" },
    { value: "dns" },
    { value: "geo" },
    { value: "ssl" },
    { value: "ws" },
  ],
};

export const nip66: NipSpec = {
  nip: "66",
  variant: "event",
  howItWorks: [
    {
      id: "monitor",
      title: "how.monitor.title",
      body: "how.monitor.body",
      focus: { part: { kind: "event", id: "monitor" } },
    },
    {
      id: "probe",
      title: "how.probe.title",
      body: "how.probe.body",
      focus: { part: { kind: "event", id: "discovery" }, path: ["tags", 0] },
    },
    {
      id: "facts",
      title: "how.facts.title",
      body: "how.facts.body",
      focus: { part: { kind: "event", id: "discovery" }, path: ["tags"] },
    },
    { id: "query", title: "how.query.title", body: "how.query.body" },
    { id: "trust", title: "how.trust.title", body: "how.trust.body" },
  ],
  related: [
    { nip: "11", relation: "depends-on", explain: "related.11" },
    { nip: "52", relation: "see-also", explain: "related.52" },
    { nip: "65", relation: "see-also", explain: "related.65" },
    { nip: "32", relation: "see-also", explain: "related.32" },
  ],
  flows: [
    {
      id: "monitoring",
      label: "flow.label",
      explain: "flow.explain",
      steps: [
        { part: { kind: "event", id: "monitor" }, explain: "flow.monitor" },
        { part: { kind: "event", id: "discovery" }, explain: "flow.discovery" },
      ],
    },
  ],
  events: [
    {
      id: "discovery",
      label: "discovery.label",
      explain: "discovery.explain",
      kinds: [30166],
      content: { format: "text", explain: "discovery.content" },
      tags: [
        {
          name: "d",
          explain: "discovery.tag.d",
          presence: "required",
          repeatable: false,
          fields: [
            {
              name: "relay",
              type: { type: "text", pattern: "wss?://\\S+|[0-9a-f]{64}" },
              explain: "discovery.tag.d.relay",
              placeholder: "wss://relay.example/",
            },
          ],
        },
        rtt("rtt-open"),
        rtt("rtt-read"),
        rtt("rtt-write"),
        {
          name: "n",
          explain: "discovery.tag.n",
          presence: "optional",
          repeatable: false,
          fields: [
            {
              name: "network",
              type: {
                type: "enum",
                open: true,
                values: [
                  { value: "clearnet" },
                  { value: "tor" },
                  { value: "i2p" },
                  { value: "loki" },
                ],
              },
              explain: "discovery.tag.n.network",
            },
          ],
        },
        {
          name: "T",
          explain: "discovery.tag.T",
          presence: "optional",
          repeatable: true,
          fields: [
            {
              name: "type",
              type: { type: "text", pattern: "[A-Z][A-Za-z0-9]*" },
              explain: "discovery.tag.T.type",
            },
          ],
        },
        {
          name: "N",
          explain: "discovery.tag.N",
          presence: "optional",
          repeatable: true,
          fields: [
            {
              name: "nip",
              type: { type: "text", pattern: "[0-9A-F]{1,2}|[0-9]+" },
              explain: "discovery.tag.N.nip",
            },
          ],
        },
        {
          name: "R",
          explain: "discovery.tag.R",
          presence: "optional",
          repeatable: true,
          fields: [
            {
              name: "requirement",
              type: { type: "text", pattern: "!?[a-z_]+" },
              explain: "discovery.tag.R.requirement",
            },
          ],
        },
        {
          name: "t",
          explain: "discovery.tag.t",
          presence: "optional",
          repeatable: true,
          fields: [{ name: "topic", type: { type: "text" }, explain: "discovery.tag.t.topic" }],
        },
        {
          name: "k",
          explain: "discovery.tag.k",
          presence: "optional",
          repeatable: true,
          fields: [
            {
              name: "kind",
              type: { type: "text", pattern: "!?[0-9]+" },
              explain: "discovery.tag.k.kind",
            },
          ],
        },
        {
          name: "g",
          explain: "discovery.tag.g",
          presence: "optional",
          repeatable: true,
          fields: [{ name: "geohash", type: geohash, explain: "geohash" }],
        },
        {
          name: "l",
          explain: "discovery.tag.l",
          presence: "optional",
          repeatable: true,
          fields: [
            { name: "label", type: { type: "text" }, explain: "discovery.tag.l.label" },
            { name: "namespace", type: { type: "text" }, explain: "discovery.tag.l.namespace" },
          ],
        },
      ],
      examples: [
        {
          id: "delta",
          label: "discovery.example.delta.label",
          explain: "discovery.example.delta.explain",
          signer: "dave",
          template: {
            kind: 30166,
            tags: [
              ["d", "wss://relay.delta.example/"],
              ["n", "clearnet"],
              ["T", "PublicOutbox"],
              ["N", "1"],
              ["N", "11"],
              ["N", "42"],
              ["N", "70"],
              ["R", "payment"],
              ["R", "auth"],
              ["R", "!pow"],
              ["k", "!4"],
              ["g", "u33dc0"],
              ["l", "en", "ISO-639-1"],
              ["rtt-open", "60"],
              ["rtt-read", "75"],
              ["rtt-write", "90"],
            ],
            content: "",
          },
        },
        {
          id: "with-nip11",
          label: "discovery.example.nip11.label",
          explain: "discovery.example.nip11.explain",
          signer: "dave",
          template: {
            kind: 30166,
            tags: [
              ["d", "wss://relay.gamma.example/"],
              ["n", "clearnet"],
              ["N", "1"],
              ["N", "11"],
              ["R", "!payment"],
              ["R", "!auth"],
              ["t", "photography"],
              ["rtt-open", "220"],
            ],
            content: JSON.stringify({
              name: "Gamma",
              description: "Small relay on the other side of the world.",
              supported_nips: [1, 11],
            }),
          },
        },
      ],
    },
    {
      id: "monitor",
      label: "monitor.label",
      explain: "monitor.explain",
      kinds: [10166],
      content: { format: "empty" },
      tags: [
        {
          name: "frequency",
          explain: "monitor.tag.frequency",
          presence: "recommended",
          repeatable: false,
          fields: [
            {
              name: "seconds",
              type: { type: "number", integer: true, min: 1 },
              explain: "monitor.tag.frequency.seconds",
            },
          ],
        },
        {
          name: "timeout",
          explain: "monitor.tag.timeout",
          presence: "optional",
          repeatable: true,
          fields: [
            { name: "check", type: CHECKS, explain: "monitor.tag.timeout.check" },
            { name: "ms", type: ms, explain: "monitor.tag.timeout.ms" },
          ],
        },
        {
          name: "c",
          explain: "monitor.tag.c",
          presence: "recommended",
          repeatable: true,
          fields: [{ name: "check", type: CHECKS, explain: "monitor.tag.c.check" }],
        },
        {
          name: "g",
          explain: "monitor.tag.g",
          presence: "optional",
          repeatable: true,
          fields: [{ name: "geohash", type: geohash, explain: "geohash" }],
        },
      ],
      examples: [
        {
          id: "hourly",
          label: "monitor.example.label",
          explain: "monitor.example.explain",
          signer: "dave",
          template: {
            kind: 10166,
            tags: [
              ["timeout", "open", "5000"],
              ["timeout", "read", "3000"],
              ["timeout", "write", "3000"],
              ["timeout", "nip11", "3000"],
              ["frequency", "3600"],
              ["c", "ws"],
              ["c", "nip11"],
              ["c", "ssl"],
              ["c", "dns"],
              ["c", "geo"],
              ["g", "u33dc0"],
            ],
            content: "",
          },
        },
      ],
    },
  ],
};
