// Owner: spec author r5 (NIPs 80–99). NIP-87: Cashu and Fedimint Discoverability.
import type { FieldType, NipSpec, TagSpec } from "../spec.ts";

const DAVE = "1c028b39e7f3228444b3261e4b718efa92a91470086b44c9a72ef5357e970148";
const DELTA = "wss://relay.delta.example";
const CASHU_MINT_PUBKEY = "02a9acc1e48c25eeeb9289b5031cc57da9fe72f3fe2861d264bdc074209b107ba2";
const FEDERATION_ID = "15db8cb4f1ec8e484d73b889372bec94812580f929e8148b7437d359af422cd3";
const FED_INVITE =
  "fed11qgqrgvnhwden5te0v9k8q6rp9ekh2arfdeukuet595cr2ttpd3jhq6rzve6zuer9wchxvetyd938gcewvdhk6tcqqysptkuvknc7erjgf4em3zfh90kffqf9srujn6q53d6r056e4apze5cw27h75";
const CASHU_URL = "https://mint.delta.example";

const NETWORK: FieldType = {
  type: "enum",
  values: [
    { value: "mainnet", explain: "network.mainnet" },
    { value: "testnet", explain: "network.testnet" },
    { value: "signet", explain: "network.signet" },
    { value: "regtest", explain: "network.regtest" },
  ],
};

const n: TagSpec = {
  name: "n",
  explain: "tag.n",
  presence: "recommended",
  repeatable: false,
  fields: [{ name: "network", type: NETWORK, explain: "tag.n.network" }],
};

export const nip87: NipSpec = {
  nip: "87",
  variant: "event",
  howItWorks: [
    {
      id: "announce",
      title: "how.announce.title",
      body: "how.announce.body",
      focus: { part: { kind: "event", id: "cashu-mint" } },
    },
    {
      id: "federation",
      title: "how.federation.title",
      body: "how.federation.body",
      focus: { part: { kind: "event", id: "fedimint" }, path: ["tags", 1] },
    },
    {
      id: "recommend",
      title: "how.recommend.title",
      body: "how.recommend.body",
      focus: { part: { kind: "event", id: "recommendation" } },
    },
    {
      id: "discover",
      title: "how.discover.title",
      body: "how.discover.body",
      focus: { part: { kind: "event", id: "recommendation" }, path: ["tags", 0] },
    },
    {
      id: "connect",
      title: "how.connect.title",
      body: "how.connect.body",
      focus: { part: { kind: "event", id: "recommendation" }, path: ["tags", 3] },
    },
  ],
  related: [
    { nip: "01", relation: "depends-on", explain: "related.01" },
    { nip: "60", relation: "used-by", explain: "related.60" },
    { nip: "61", relation: "see-also", explain: "related.61" },
    { nip: "89", relation: "see-also", explain: "related.89" },
  ],
  flows: [
    {
      id: "find-a-mint",
      label: "flow.find-a-mint.label",
      explain: "flow.find-a-mint.explain",
      steps: [
        { part: { kind: "event", id: "cashu-mint" }, explain: "flow.find-a-mint.announce" },
        { part: { kind: "event", id: "recommendation" }, explain: "flow.find-a-mint.recommend" },
      ],
    },
  ],
  events: [
    {
      id: "recommendation",
      label: "event.recommendation.label",
      explain: "event.recommendation.explain",
      kinds: [38000],
      content: { format: "text", explain: "content.review", multiline: true },
      tags: [
        {
          name: "k",
          explain: "tag.k",
          presence: "required",
          repeatable: false,
          fields: [
            {
              name: "kind",
              type: { type: "kind", kinds: [38172, 38173] },
              explain: "tag.k.kind",
            },
          ],
        },
        {
          name: "d",
          explain: "tag.d.recommendation",
          presence: "required",
          repeatable: false,
          fields: [
            {
              name: "identifier",
              type: { type: "text", minLength: 1 },
              explain: "tag.d.identifier",
            },
          ],
        },
        {
          name: "u",
          explain: "tag.u.recommendation",
          presence: "optional",
          repeatable: true,
          fields: [
            { name: "connect", type: { type: "text", minLength: 1 }, explain: "tag.u.connect" },
            {
              name: "mint-type",
              type: {
                type: "enum",
                values: [
                  { value: "cashu", explain: "mint-type.cashu" },
                  { value: "fedimint", explain: "mint-type.fedimint" },
                ],
              },
              explain: "tag.mint-type",
              optional: true,
            },
          ],
        },
        {
          name: "a",
          explain: "tag.a",
          presence: "recommended",
          repeatable: true,
          fields: [
            {
              name: "address",
              type: { type: "addr", kinds: [38172, 38173] },
              explain: "tag.a.address",
            },
            {
              name: "relay",
              type: { type: "relay-url" },
              explain: "tag.a.relay",
              optional: true,
            },
            {
              name: "mint-type",
              type: {
                type: "enum",
                values: [{ value: "cashu" }, { value: "fedimint" }],
              },
              explain: "tag.mint-type",
              optional: true,
            },
          ],
        },
      ],
      examples: [
        {
          id: "recommend-cashu",
          label: "example.recommend-cashu.label",
          explain: "example.recommend-cashu.explain",
          signer: "alice",
          template: {
            kind: 38000,
            tags: [
              ["k", "38172"],
              ["d", CASHU_MINT_PUBKEY],
              ["u", CASHU_URL, "cashu"],
              ["a", `38172:${DAVE}:${CASHU_MINT_PUBKEY}`, DELTA, "cashu"],
            ],
            content: "Fast, honest and run by someone I know. My go-to mint for small payments.",
          },
        },
        {
          id: "recommend-fedimint",
          label: "example.recommend-fedimint.label",
          explain: "example.recommend-fedimint.explain",
          signer: "bob",
          template: {
            kind: 38000,
            tags: [
              ["k", "38173"],
              ["d", FEDERATION_ID],
              ["u", FED_INVITE, "fedimint"],
              ["a", `38173:${DAVE}:${FEDERATION_ID}`, DELTA, "fedimint"],
            ],
            content: "Testing this federation on signet with friends.",
          },
        },
      ],
    },
    {
      id: "cashu-mint",
      label: "event.cashu-mint.label",
      explain: "event.cashu-mint.explain",
      kinds: [38172],
      content: { format: "text", explain: "content.metadata" },
      tags: [
        {
          name: "d",
          explain: "tag.d.cashu",
          presence: "required",
          repeatable: false,
          fields: [
            {
              name: "mint-pubkey",
              type: { type: "hex", bytes: 33 },
              explain: "tag.d.cashu.pubkey",
            },
          ],
        },
        {
          name: "u",
          explain: "tag.u.cashu",
          presence: "recommended",
          repeatable: false,
          fields: [{ name: "url", type: { type: "url" }, explain: "tag.u.cashu.url" }],
        },
        {
          name: "nuts",
          explain: "tag.nuts",
          presence: "recommended",
          repeatable: false,
          fields: [
            {
              name: "list",
              type: { type: "text", pattern: "\\d+(,\\d+)*" },
              explain: "tag.nuts.list",
            },
          ],
        },
        n,
      ],
      examples: [
        {
          id: "cashu",
          label: "example.cashu.label",
          explain: "example.cashu.explain",
          signer: "dave",
          template: {
            kind: 38172,
            tags: [
              ["d", CASHU_MINT_PUBKEY],
              ["u", CASHU_URL],
              ["nuts", "1,2,3,4,5,6,7,8,9,10,11,12"],
              ["n", "mainnet"],
            ],
            content: "",
          },
        },
      ],
    },
    {
      id: "fedimint",
      label: "event.fedimint.label",
      explain: "event.fedimint.explain",
      kinds: [38173],
      content: { format: "text", explain: "content.metadata" },
      tags: [
        {
          name: "d",
          explain: "tag.d.fedimint",
          presence: "required",
          repeatable: false,
          fields: [
            { name: "federation-id", type: { type: "hex32" }, explain: "tag.d.fedimint.id" },
          ],
        },
        {
          name: "u",
          explain: "tag.u.fedimint",
          presence: "recommended",
          repeatable: true,
          fields: [
            {
              name: "invite-code",
              type: { type: "text", pattern: "fed11[02-9ac-hj-np-z]+" },
              explain: "tag.u.fedimint.invite",
            },
          ],
        },
        {
          name: "modules",
          explain: "tag.modules",
          presence: "recommended",
          repeatable: false,
          fields: [
            {
              name: "list",
              type: { type: "text", pattern: "[a-z0-9_-]+(,[a-z0-9_-]+)*" },
              explain: "tag.modules.list",
            },
          ],
        },
        n,
      ],
      examples: [
        {
          id: "fedimint",
          label: "example.fedimint.label",
          explain: "example.fedimint.explain",
          signer: "dave",
          template: {
            kind: 38173,
            tags: [
              ["d", FEDERATION_ID],
              ["u", FED_INVITE],
              ["modules", "lightning,wallet,mint"],
              ["n", "signet"],
            ],
            content: JSON.stringify({
              name: "Delta Signet Federation",
              about: "A small test federation run by Dave's relay crew.",
            }),
          },
        },
      ],
    },
  ],
};
