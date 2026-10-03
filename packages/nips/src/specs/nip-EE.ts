// Owner: spec author r6 (NIPs letter ids). NIP-EE: E2EE messaging with MLS. UNRECOMMENDED:
// superseded by the Marmot Protocol (github.com/marmot-protocol/marmot); the how-it-works walk
// starts with that notice. MLS byte blobs in the examples are short illustrative stand-ins, not
// real KeyPackages/Welcomes; the kind 445 content is a real NIP-44 payload under a demo
// exporter-secret key (r6.test.ts decrypts it). Explanations: en/nips/r6.ts → nEE.text.
import type { NipSpec, TagSpec } from "../spec.ts";
import { ALPHA, BETA, FIXTURE_NOW } from "./r6-common.ts";

/** Id of the "bob-package" KeyPackage example signed by bob at FIXTURE_NOW (r6.test.ts checks it). */
export const NIPEE_KEY_PACKAGE_ID =
  "d5e6010c5f196c5f5a8f9d31b62f10127b989d7f2a13c41d988ff395e59fa59d";
/** Nostr group id (stand-in: sha256 of "nostrschool:mls:group"). */
export const NIPEE_GROUP_ID = "a590a9c7745cfd6d8b1d272b9f2573cc401a0c1b2a2d6bff4fa061504f0b3d55";
/** Label the demo exporter secret is derived from: sha256("nostrschool:mls:exporter:epoch-1"). */
export const NIPEE_EXPORTER_LABEL = "nostrschool:mls:exporter:epoch-1";
/** The kind 445 example's plaintext (a stand-in serialized MLSMessage, hex). */
export const NIPEE_MLS_MESSAGE = "0001000200000000000000016e6f737472736368";
export const NIPEE_GROUP_CONTENT =
  "AtPBRNeKojRLaZC9kV6BMmXV1u8z3UaK2AvNlXSzFsR/ZPghEMPIOhwRQUJfxeE7G4wu2t1Wzj/Wn/3WK7shg2DQr8FW/LieZCGnnkEC9RIMLxKSPKO4GZSoaRkpYCoJmCKwKqrqHkREh4q8M6LbkvI5IgxtNbTFmnBTH53RtT4y/JI=";

const KEY_PACKAGE_HEX =
  "0001000120a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f9020e550c6e92808f358382b7b8c14345344f5ef9a299529834d1c26d57b6ace44cc";
const WELCOME_HEX = "000100030001200c0ffee0c0ffee0c0ffee0c0ffee0c0ffee0c0ffee0c0ffee0c0ffee";

const keyPackage = { kind: "event", id: "key-package" } as const;
const relays = { kind: "event", id: "key-package-relays" } as const;
const welcome = { kind: "event", id: "welcome" } as const;
const group = { kind: "event", id: "group-event" } as const;

const relaysTag = (explain: string): TagSpec => ({
  name: "relays",
  explain,
  presence: "required",
  repeatable: false,
  fields: [{ name: "relay", type: { type: "relay-url" }, explain: "tag.relays.relay" }],
  rest: { name: "relay", type: { type: "relay-url" }, explain: "tag.relays.relay" },
});
const MLS_ID = "0x[0-9a-fA-F]{4}";

export const nipEE: NipSpec = {
  nip: "EE",
  variant: "event",
  howItWorks: [
    { id: "status", title: "how.status.title", body: "how.status.body" },
    { id: "why", title: "how.why.title", body: "how.why.body" },
    {
      id: "key-package",
      title: "how.key-package.title",
      body: "how.key-package.body",
      focus: { part: keyPackage },
    },
    {
      id: "welcome",
      title: "how.welcome.title",
      body: "how.welcome.body",
      focus: { part: welcome, path: ["tags", 0] },
    },
    {
      id: "group",
      title: "how.group.title",
      body: "how.group.body",
      focus: { part: group, path: ["content"] },
    },
    { id: "commits", title: "how.commits.title", body: "how.commits.body" },
  ],
  related: [
    { nip: "17", relation: "see-also", explain: "related.17" },
    { nip: "44", relation: "depends-on", explain: "related.44" },
    { nip: "59", relation: "depends-on", explain: "related.59" },
    { nip: "70", relation: "see-also", explain: "related.70" },
    { nip: "C7", relation: "see-also", explain: "related.C7" },
  ],
  flows: [
    {
      id: "join",
      label: "flow.join.label",
      explain: "flow.join.explain",
      steps: [
        { part: relays, explain: "flow.join.relays" },
        { part: keyPackage, explain: "flow.join.key-package" },
        { part: welcome, explain: "flow.join.welcome" },
        { part: group, explain: "flow.join.group" },
      ],
    },
  ],
  events: [
    {
      id: "key-package",
      label: "event.key-package.label",
      explain: "event.key-package.explain",
      kinds: [443],
      content: {
        format: "text",
        explain: "content.key-package",
        required: true,
        field: { type: "text", pattern: "([0-9a-f]{2})+" },
      },
      tags: [
        {
          name: "mls_protocol_version",
          explain: "tag.mls_protocol_version",
          presence: "required",
          repeatable: false,
          fields: [
            {
              name: "version",
              type: { type: "enum", values: [{ value: "1.0" }] },
              explain: "tag.mls_protocol_version.value",
            },
          ],
        },
        {
          name: "ciphersuite",
          explain: "tag.ciphersuite",
          presence: "required",
          repeatable: false,
          fields: [
            {
              name: "id",
              type: { type: "text", pattern: MLS_ID },
              explain: "tag.ciphersuite.id",
              placeholder: "0x0001",
            },
          ],
        },
        {
          name: "extensions",
          explain: "tag.extensions",
          presence: "required",
          repeatable: false,
          fields: [
            {
              name: "id",
              type: { type: "text", pattern: `${MLS_ID}(, ?${MLS_ID})*` },
              explain: "tag.extensions.id",
              placeholder: "0x0003",
            },
          ],
          rest: {
            name: "id",
            type: { type: "text", pattern: MLS_ID },
            explain: "tag.extensions.id",
          },
        },
        {
          name: "client",
          explain: "tag.client",
          presence: "optional",
          repeatable: false,
          fields: [
            { name: "name", type: { type: "text", minLength: 1 }, explain: "tag.client.name" },
            {
              name: "handler",
              type: { type: "event-id" },
              explain: "tag.client.handler",
              optional: true,
            },
            {
              name: "relay",
              type: { type: "relay-url" },
              explain: "tag.client.relay",
              optional: true,
            },
          ],
        },
        relaysTag("tag.relays"),
        {
          name: "-",
          explain: "tag.protected",
          presence: "optional",
          repeatable: false,
          fields: [],
        },
      ],
      examples: [
        {
          id: "bob-package",
          label: "example.bob-package",
          explain: "example.bob-package.explain",
          signer: "bob",
          template: {
            kind: 443,
            created_at: FIXTURE_NOW,
            tags: [
              ["mls_protocol_version", "1.0"],
              ["ciphersuite", "0x0001"],
              ["extensions", "0x0002", "0x0003", "0x000a", "0xf2ee"],
              ["client", "Nostr School"],
              ["relays", ALPHA, BETA],
              ["-"],
            ],
            content: KEY_PACKAGE_HEX,
          },
        },
      ],
    },
    {
      id: "key-package-relays",
      label: "event.key-package-relays.label",
      explain: "event.key-package-relays.explain",
      kinds: [10051],
      content: { format: "empty", explain: "content.empty" },
      tags: [
        {
          name: "relay",
          explain: "tag.relay",
          presence: "required",
          repeatable: true,
          fields: [{ name: "url", type: { type: "relay-url" }, explain: "tag.relay.url" }],
        },
      ],
      examples: [
        {
          id: "bob-relays",
          label: "example.bob-relays",
          signer: "bob",
          template: {
            kind: 10051,
            tags: [
              ["relay", ALPHA],
              ["relay", BETA],
            ],
            content: "",
          },
        },
      ],
    },
    {
      id: "welcome",
      label: "event.welcome.label",
      explain: "event.welcome.explain",
      kinds: [444],
      signature: "none",
      content: { format: "text", explain: "content.welcome", required: true },
      tags: [
        {
          name: "e",
          explain: "tag.e",
          presence: "required",
          repeatable: false,
          fields: [{ name: "key-package", type: { type: "event-id" }, explain: "tag.e.id" }],
        },
        relaysTag("tag.welcome-relays"),
      ],
      examples: [
        {
          id: "welcome-bob",
          label: "example.welcome-bob",
          explain: "example.welcome-bob.explain",
          signer: "alice",
          template: {
            kind: 444,
            created_at: FIXTURE_NOW + 120,
            tags: [
              ["e", NIPEE_KEY_PACKAGE_ID],
              ["relays", ALPHA, BETA],
            ],
            content: WELCOME_HEX,
          },
        },
      ],
    },
    {
      id: "group-event",
      label: "event.group-event.label",
      explain: "event.group-event.explain",
      kinds: [445],
      content: {
        format: "encrypted",
        explain: "content.group-event",
        scheme: "nip44",
        plaintext: { format: "text", explain: "content.mls-message" },
      },
      tags: [
        {
          name: "h",
          explain: "tag.h",
          presence: "required",
          repeatable: false,
          fields: [{ name: "group-id", type: { type: "hex32" }, explain: "tag.h.id" }],
        },
      ],
      examples: [
        {
          id: "application",
          label: "example.application",
          explain: "example.application.explain",
          signer: "grace",
          template: {
            kind: 445,
            created_at: FIXTURE_NOW + 300,
            tags: [["h", NIPEE_GROUP_ID]],
            content: NIPEE_GROUP_CONTENT,
          },
        },
      ],
    },
  ],
};
