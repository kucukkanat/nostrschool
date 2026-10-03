// Owner: spec author r6 (NIPs letter ids). NIP-CC: Geocaching. Listing (37516), found log (7516),
// non-found logs as NIP-22 comments (1111), proof of find (7517) and curation lists (37517).
// In the demo the cache's verification key is grace's demo key: in reality it is a dedicated key
// printed as a QR code at the cache. Explanations: packages/i18n/src/locales/en/nips/r6.ts → nCC.text.
import type { NipSpec, TagSpec } from "../spec.ts";
import { ALICE, ALPHA, commentTags, FIXTURE_NOW, FRANK, GRACE, textTag } from "./r6-common.ts";

export const NIPCC_OAK = `37516:${FRANK}:old-oak`;
const LINOCUT = `37516:${FRANK}:linocut-1`;
/** naddr of the old-oak listing (kind 37516, frank, relay alpha). */
export const NIPCC_OAK_NADDR =
  "naddr1qqrk7mry94hkz6cpr9mhxue69uhhyetvv9ujuctvwp5xztn90psk6urvv5pzpy3wgw6s4mqk450f68kxs4xqtzqk629egjhzl6daec7eysdl4tacqvzqqqyj3sm6y4cz";
export const NIPCC_ALICE_NPUB = "npub1u4gvd6fgpre4swpt0wxpgdzngn67lx3fj55cxnguym2hk6kwgnxqta308g";
/** The "proof" example (kind 7517) signed by grace's demo key, as JSON (r6.test.ts checks it). */
export const NIPCC_PROOF_JSON =
  '{"kind":7517,"created_at":1735693200,"tags":[["a","e550c6e92808f358382b7b8c14345344f5ef9a299529834d1c26d57b6ace44cc:naddr1qqrk7mry94hkz6cpr9mhxue69uhhyetvv9ujuctvwp5xztn90psk6urvv5pzpy3wgw6s4mqk450f68kxs4xqtzqk629egjhzl6daec7eysdl4tacqvzqqqyj3sm6y4cz"]],"content":"Geocache verification for npub1u4gvd6fgpre4swpt0wxpgdzngn67lx3fj55cxnguym2hk6kwgnxqta308g","pubkey":"5f69e52aeb38975e54cb99428da837124166abb4198c1128c54491be73d23812","id":"48386e2b4b5a2e89e8262dce0b9ed69c3bb0bcee5c5478de212cd0884b7f0731","sig":"fc9cdc404940b9951b81eb43aaa966746096acc3a4169586acfc53880ee81309e64fca82c2eac3a6d182727ae46fc94b123c79ad3d60d120add2f4c4c78b2b4d"}';

const GEOHASH = "[0-9b-hjkmnp-z]{1,12}";
const listing = { kind: "event", id: "listing" } as const;
const found = { kind: "event", id: "found" } as const;
const proof = { kind: "event", id: "proof" } as const;
const comment = { kind: "event", id: "comment" } as const;
const curation = { kind: "event", id: "curation" } as const;

const geohashTag = (presence: TagSpec["presence"]): TagSpec => ({
  name: "g",
  explain: "tag.g",
  presence,
  repeatable: true,
  fields: [{ name: "geohash", type: { type: "text", pattern: GEOHASH }, explain: "tag.g.value" }],
});
const rating = (name: "D" | "T"): TagSpec => ({
  name,
  explain: `tag.${name}`,
  presence: "required",
  repeatable: false,
  fields: [
    {
      name: "score",
      type: { type: "number", integer: true, min: 1, max: 5 },
      explain: "tag.rating.score",
    },
  ],
});
const imageTag: TagSpec = {
  name: "image",
  explain: "tag.image",
  presence: "optional",
  repeatable: true,
  fields: [{ name: "url", type: { type: "url" }, explain: "tag.image.url" }],
};
const enumOf = (prefix: string, values: readonly string[]) =>
  values.map((value) => ({ value, explain: `${prefix}.${value}` }));

export const nipCC: NipSpec = {
  nip: "CC",
  variant: "event",
  howItWorks: [
    { id: "hide", title: "how.hide.title", body: "how.hide.body", focus: { part: listing } },
    {
      id: "where",
      title: "how.where.title",
      body: "how.where.body",
      focus: { part: listing, path: ["tags", 2] },
    },
    { id: "log", title: "how.log.title", body: "how.log.body", focus: { part: found } },
    { id: "prove", title: "how.prove.title", body: "how.prove.body", focus: { part: proof } },
    { id: "dnf", title: "how.dnf.title", body: "how.dnf.body", focus: { part: comment } },
    { id: "trail", title: "how.trail.title", body: "how.trail.body", focus: { part: curation } },
  ],
  related: [
    { nip: "22", relation: "depends-on", explain: "related.22" },
    { nip: "19", relation: "depends-on", explain: "related.19" },
    { nip: "52", relation: "see-also", explain: "related.52" },
    { nip: "01", relation: "depends-on", explain: "related.01" },
  ],
  flows: [
    {
      id: "verified-find",
      label: "flow.verified-find.label",
      explain: "flow.verified-find.explain",
      steps: [
        { part: listing, explain: "flow.verified-find.listing" },
        { part: proof, explain: "flow.verified-find.proof" },
        { part: found, explain: "flow.verified-find.found" },
      ],
    },
  ],
  events: [
    {
      id: "listing",
      label: "event.listing.label",
      explain: "event.listing.explain",
      kinds: [37516],
      content: { format: "text", explain: "content.listing", required: true, multiline: true },
      tags: [
        textTag("d", "required"),
        textTag("name", "required"),
        geohashTag("required"),
        rating("D"),
        rating("T"),
        {
          name: "S",
          explain: "tag.S",
          presence: "required",
          repeatable: false,
          fields: [
            {
              name: "size",
              type: {
                type: "enum",
                values: enumOf("size", ["micro", "small", "regular", "large", "other"]),
              },
              explain: "tag.S.size",
            },
          ],
        },
        {
          name: "t",
          explain: "tag.t",
          presence: "optional",
          repeatable: true,
          fields: [
            {
              name: "type",
              type: {
                type: "enum",
                values: enumOf("type", ["traditional", "multi", "mystery", "archived"]),
                open: true,
              },
              explain: "tag.t.type",
            },
          ],
        },
        {
          name: "n",
          explain: "tag.n",
          presence: "optional",
          repeatable: true,
          fields: [
            {
              name: "modifier",
              type: {
                type: "enum",
                values: enumOf("modifier", ["first-to-find", "art"]),
                open: true,
              },
              explain: "tag.n.modifier",
            },
          ],
        },
        textTag("hint"),
        textTag("mission"),
        imageTag,
        {
          name: "r",
          explain: "tag.r",
          presence: "optional",
          repeatable: true,
          fields: [{ name: "relay", type: { type: "relay-url" }, explain: "tag.r.relay" }],
        },
        {
          name: "verification",
          explain: "tag.verification",
          presence: "optional",
          repeatable: false,
          fields: [
            { name: "pubkey", type: { type: "pubkey" }, explain: "tag.verification.pubkey" },
          ],
        },
        {
          name: "F",
          explain: "tag.F",
          presence: "optional",
          repeatable: false,
          fields: [{ name: "winner", type: { type: "pubkey" }, explain: "tag.F.winner" }],
        },
      ],
      examples: [
        {
          id: "old-oak",
          label: "example.old-oak",
          explain: "example.old-oak.explain",
          signer: "frank",
          template: {
            kind: 37516,
            tags: [
              ["d", "old-oak"],
              ["name", "Riddle of the Old Oak"],
              ["g", "u4x"],
              ["g", "u4xsu"],
              ["g", "u4xsu6ry"],
              ["D", "2"],
              ["T", "3"],
              ["S", "small"],
              ["t", "traditional"],
              ["hint", "Ybbx nzbat gur ebbgf"],
              ["r", ALPHA],
              ["verification", GRACE],
            ],
            content: "A small box hidden near the oldest oak in the park. Bring your own pen.",
          },
        },
        {
          id: "linocut",
          label: "example.linocut",
          explain: "example.linocut.explain",
          signer: "frank",
          template: {
            kind: 37516,
            tags: [
              ["d", "linocut-1"],
              ["name", "Aftermath (Linocut #1)"],
              ["g", "u4xsu6rz"],
              ["D", "2"],
              ["T", "2"],
              ["S", "small"],
              ["n", "first-to-find"],
              ["n", "art"],
              ["mission", "Leave a drawing of your own in its place"],
              ["image", "https://media.alpha.example/linocut-1.jpg"],
              ["verification", GRACE],
            ],
            content:
              "Hand-pulled linocut, edition of one, signed on the back. Whoever finds it keeps it.",
          },
        },
      ],
    },
    {
      id: "found",
      label: "event.found.label",
      explain: "event.found.explain",
      kinds: [7516],
      content: { format: "text", explain: "content.log", multiline: true },
      tags: [
        {
          name: "a",
          explain: "tag.a",
          presence: "required",
          repeatable: false,
          fields: [
            { name: "cache", type: { type: "addr", kinds: [37516] }, explain: "tag.a.cache" },
            { name: "relay", type: { type: "relay-url" }, explain: "tag.relay", optional: true },
          ],
        },
        imageTag,
        {
          name: "verification",
          explain: "tag.found-verification",
          presence: "optional",
          repeatable: false,
          fields: [
            {
              name: "proof",
              type: { type: "event-json", kinds: [7517] },
              explain: "tag.found-verification.proof",
            },
          ],
        },
      ],
      examples: [
        {
          id: "verified",
          label: "example.verified",
          explain: "example.verified.explain",
          signer: "alice",
          template: {
            kind: 7516,
            created_at: FIXTURE_NOW + 3700,
            tags: [
              ["a", NIPCC_OAK],
              ["verification", NIPCC_PROOF_JSON],
            ],
            content: "Found it after ten minutes. Lovely spot. TFTC!",
          },
        },
        {
          id: "simple",
          label: "example.simple",
          signer: "dave",
          template: {
            kind: 7516,
            tags: [
              ["a", NIPCC_OAK],
              ["image", "https://media.alpha.example/oak-selfie.jpg"],
            ],
            content: "Quick find on my lunch break.",
          },
        },
      ],
    },
    {
      id: "proof",
      label: "event.proof.label",
      explain: "event.proof.explain",
      kinds: [7517],
      content: {
        format: "text",
        explain: "content.proof",
        required: true,
        field: { type: "text", pattern: "Geocache verification for npub1[02-9ac-hj-np-z]{58}" },
      },
      tags: [
        {
          name: "a",
          explain: "tag.proof-a",
          presence: "required",
          repeatable: false,
          fields: [
            {
              name: "finder:naddr",
              type: { type: "text", pattern: "[0-9a-f]{64}:naddr1[02-9ac-hj-np-z]+" },
              explain: "tag.proof-a.value",
            },
          ],
        },
      ],
      examples: [
        {
          id: "proof",
          label: "example.proof",
          explain: "example.proof.explain",
          signer: "grace",
          template: {
            kind: 7517,
            created_at: FIXTURE_NOW + 3600,
            tags: [["a", `${ALICE}:${NIPCC_OAK_NADDR}`]],
            content: `Geocache verification for ${NIPCC_ALICE_NPUB}`,
          },
        },
      ],
    },
    {
      id: "comment",
      label: "event.comment.label",
      explain: "event.comment.explain",
      kinds: [1111],
      content: { format: "text", explain: "content.log", required: true, multiline: true },
      tags: [
        ...commentTags([37516], "address"),
        {
          name: "t",
          explain: "tag.log-type",
          presence: "optional",
          repeatable: false,
          fields: [
            {
              name: "type",
              type: {
                type: "enum",
                values: enumOf("log", ["dnf", "note", "maintenance", "archived"]),
              },
              explain: "tag.log-type.type",
            },
          ],
        },
        imageTag,
      ],
      examples: [
        {
          id: "dnf",
          label: "example.dnf",
          explain: "example.dnf.explain",
          signer: "bob",
          template: {
            kind: 1111,
            tags: [
              ["A", NIPCC_OAK, ALPHA],
              ["K", "37516"],
              ["P", FRANK],
              ["a", NIPCC_OAK, ALPHA],
              ["k", "37516"],
              ["p", FRANK],
              ["t", "dnf"],
            ],
            content: "Searched for 30 minutes around the roots, no luck. Maybe it went missing?",
          },
        },
        {
          id: "archive",
          label: "example.archive",
          explain: "example.archive.explain",
          signer: "frank",
          template: {
            kind: 1111,
            tags: [
              ["A", NIPCC_OAK],
              ["K", "37516"],
              ["P", FRANK],
              ["a", NIPCC_OAK],
              ["k", "37516"],
              ["p", FRANK],
              ["t", "archived"],
            ],
            content: "The park is replanting this area, so the cache is retired. Thanks, everyone!",
          },
        },
      ],
    },
    {
      id: "curation",
      label: "event.curation.label",
      explain: "event.curation.explain",
      kinds: [37517],
      content: { format: "text", explain: "content.curation", multiline: true },
      tags: [
        textTag("d", "required"),
        textTag("title", "required"),
        {
          name: "a",
          explain: "tag.curation-a",
          presence: "required",
          repeatable: true,
          fields: [
            {
              name: "cache",
              type: { type: "addr", kinds: [37516, 37515] },
              explain: "tag.curation-a.cache",
            },
          ],
        },
        textTag("description"),
        imageTag,
        geohashTag("optional"),
        {
          name: "theme",
          explain: "tag.theme",
          presence: "optional",
          repeatable: false,
          fields: [
            {
              name: "theme",
              type: {
                type: "enum",
                values: [{ value: "adventure" }, { value: "mojave" }],
                open: true,
              },
              explain: "tag.theme.value",
            },
          ],
        },
        {
          name: "map",
          explain: "tag.map",
          presence: "optional",
          repeatable: false,
          fields: [
            {
              name: "style",
              type: {
                type: "enum",
                values: [
                  { value: "original" },
                  { value: "dark" },
                  { value: "satellite" },
                  { value: "adventure" },
                ],
                open: true,
              },
              explain: "tag.map.value",
            },
          ],
        },
      ],
      examples: [
        {
          id: "park-trail",
          label: "example.park-trail",
          explain: "example.park-trail.explain",
          signer: "frank",
          template: {
            kind: 37517,
            tags: [
              ["d", "park-trail"],
              ["title", "Park Trail"],
              ["description", "Two caches, one afternoon walk."],
              ["g", "u4x"],
              ["g", "u4xs"],
              ["theme", "adventure"],
              ["map", "satellite"],
              ["a", NIPCC_OAK],
              ["a", LINOCUT],
            ],
            content:
              "Start at the old oak, then follow the river path to the art cache. Wear good shoes.",
          },
        },
      ],
    },
  ],
};
