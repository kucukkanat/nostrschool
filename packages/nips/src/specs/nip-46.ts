// Owner: spec author r3 (NIPs 40–59). NIP-46: Nostr Remote Signing.
// Explanations: packages/i18n/src/locales/en/nips/r3.ts → n46.text.
//
// Demo cast: Carol's demo key plays the disposable client keypair, Alice's demo key is both the
// remote-signer key and the user key (allowed by the NIP). Payloads are real NIP-44 v2
// ciphertexts between those two demo keys, so the editor can decrypt them.
import type { NipSpec } from "../spec.ts";

const ALICE = "e550c6e92808f358382b7b8c14345344f5ef9a299529834d1c26d57b6ace44cc";
const CAROL = "9445888d3235f73f8b627df1fb1d498f2eb3fa76337679c1176965a73d3b68b4";

/** nip44(carol → alice, {"id":"4f2a91c3","method":"sign_event","params":["{kind 1 template}"]}) */
const SIGN_REQUEST =
  "AvSu2xu4jy8IDL6SZ1uJ3hAgSvjPDEY4p9CwUqJhwqL97vxLtes1k4Yz9TUeHW03V35six/G3/3ybqWl3vJshQ/+VMaiCZ2OxOxp8xWAEV8Xo7gdNwvDycO6SfK59KhmirxZFHsk/RkxXuFfQtEh4R0onRzW9F/uF7vS9vhTOKLZ6YCS9L75zA8zsrYUsYExG11TurlqCZp9aTNH+OmX8eSLBU9bfIwyTfjX1XlQJibWAepHJTDP5fHYeMnPqvuM6i/c8McJ1U1KnnStRz4tAY3foUvJ+s/IelqdcR6bofQ243Y=";
/** nip44(carol → alice, {"id":"9b1e07d2","method":"connect","params":[alice, "0s8j2djs", "nip44_encrypt,sign_event:1"]}) */
const CONNECT_REQUEST =
  "AoXET/w86tkE9UY88recCO5fZ3SzDvu7T61D5snaZ4pyWj7/Ol+lLjVwa+h+2Jd6paFj77AIwxJPd25icHO1GUh6ibuLOE5hUhetm7DXWW9rs4a4kAsmVQb8xa4K25DIehonAfdrBuh5bsnZL1zNWeq2Du2Nc4JZ/uQqedJ8SycXDzNN2KMxHNi1UcHQXqjqLQAQuteHmxfyK3Q7JNlG4u4//LYycXb+IxBgbKXbdZg2yxrukiAsLbE778y0Q33aNszcAbZSLqezvqzBHAEKLmgRzLq4xcZXsMTphkn08IVyuYg=";
/** nip44(alice → carol, {"id":"4f2a91c3","result":"{signed kind 1 event}"}) */
const SIGN_RESPONSE =
  "AlrLOoVXl+daOPHbQtra6eRESlPavykTMs1LCfTtO01OhR1qWz8ZduWl6XvIT3VTZD0e/zLgwuTWZhfNeXzqPNu3xa5/RgYkqkuu3jCsW7yJuwByvzKvwsjgWroKii2DtUxDMKFox4CtLWt0x0xsVuGtOQKx96sfCRmL8c4zxU4qadImAd/S+hUWz0PqWESe1uDyXt0ByZICzEdKpA6hPzNgIh8AEWGOQv7+Y//Gsjn6ZeMSAScVMLbmg/Wk4EU+ove9En3wKK/qZEDI6nvw0kzwayXviXqVDDXVN5xwTyOpOoXfzCZgQYbsuPzlDyEYTV61A+qsNy3wfx166c4kIVLOu4WUfH2GGBc/n/xv6ls2/nUmJDq9NLn1oG+cbQUJbo//WHPpqgimVjCRs5SRuDk6HHRvEATzS7IJpPQyC7Jf3JkhdRD227fZTwpqKAHjqXgFZ8rOLqsSgZGS0mRZzDtE6LS8//ziJVYfsfcXEfqv65HaTAL5Q/6p8BbwYlEIGG1/Ga9vLPAiy/btZsi4s4G3mPr6riS3/5f8XNcIjTwaYnqjSfkE0KNTyMwcW9givQMaSIOwxozhcANwI66QGZaDI8O5mq52yXw1Devh4qvgNWyhvQxmNQzqrljMbRDpzeiHXo4tbOMBan71MR7g7QWJZp+oJ2sdaIkWTbAz+SepRDs=";
/** nip44(alice → carol, {"id":"9b1e07d2","result":"ack"}) */
const ACK_RESPONSE =
  "AtdouPxQPW0O0JG8gw0TupHIvt6aq+vuI2rj7b9gFa3wE/pH5vhophfyGqQW8Z8hXLngQTguVG8abOO8w/H8ojHb9CZJCzlo3AxsrQK/yWpUnuOxYwOegnD7O5NVCWIBGvC7";
/** nip44(alice → carol, {"id":"4f2a91c3","result":"auth_url","error":"https://bunker.alpha.example/approve/4f2a91c3"}) */
const AUTH_URL_RESPONSE =
  "AjDDcC12k3/Ro+TaMx5zlLGxstzBAPhTDEjwjujf5VjGBN3wtMxHiFkoINiLmVKjT9SE+e/ozuRs1ZUTjo2CNXji2TQOlLKg2/w3g6o4dIULaeWaHuBr+KoIvD2eZtsVYMYNEkWyXia7UPD2G7YzWW66RGv6XXI6KANyzV4WI2E8vcrffx58wKd29mrkH7vLzoVylFbDaWxw8jRGo9mMqIHseg==";

const METHODS = [
  "connect",
  "sign_event",
  "ping",
  "get_public_key",
  "nip04_encrypt",
  "nip04_decrypt",
  "nip44_encrypt",
  "nip44_decrypt",
  "switch_relays",
  "logout",
] as const;

export const nip46: NipSpec = {
  nip: "46",
  variant: "event",
  events: [
    {
      id: "request",
      label: "request.label",
      explain: "request.explain",
      kinds: [24133],
      content: {
        format: "encrypted",
        explain: "request.content",
        scheme: "nip44",
        plaintext: {
          format: "json",
          explain: "request.plaintext",
          schema: {
            type: "object",
            properties: {
              id: { type: "string", field: { type: "text", minLength: 1 }, explain: "request.id" },
              method: {
                type: "string",
                explain: "request.method",
                field: {
                  type: "enum",
                  values: METHODS.map((m) => ({ value: m, explain: `method.${m}` })),
                },
              },
              params: {
                type: "array",
                items: { type: "string" },
                explain: "request.params",
              },
            },
            required: ["id", "method", "params"],
            additionalProperties: false,
          },
        },
      },
      tags: [
        {
          name: "p",
          explain: "request.tag.p",
          presence: "required",
          repeatable: false,
          fields: [
            {
              name: "remote-signer-pubkey",
              type: { type: "pubkey" },
              explain: "request.tag.p.pubkey",
            },
          ],
        },
      ],
      examples: [
        {
          id: "sign-event",
          label: "example.sign-request",
          explain: "example.sign-request.explain",
          signer: "carol",
          template: { kind: 24133, tags: [["p", ALICE]], content: SIGN_REQUEST },
        },
        {
          id: "connect",
          label: "example.connect",
          explain: "example.connect.explain",
          signer: "carol",
          template: { kind: 24133, tags: [["p", ALICE]], content: CONNECT_REQUEST },
        },
      ],
    },
    {
      id: "response",
      label: "response.label",
      explain: "response.explain",
      kinds: [24133],
      content: {
        format: "encrypted",
        explain: "response.content",
        scheme: "nip44",
        plaintext: {
          format: "json",
          explain: "response.plaintext",
          schema: {
            type: "object",
            properties: {
              id: { type: "string", explain: "response.id" },
              result: { type: "string", explain: "response.result" },
              error: { type: "string", explain: "response.error" },
            },
            required: ["id", "result"],
            additionalProperties: false,
          },
        },
      },
      tags: [
        {
          name: "p",
          explain: "response.tag.p",
          presence: "required",
          repeatable: false,
          fields: [
            { name: "client-pubkey", type: { type: "pubkey" }, explain: "response.tag.p.pubkey" },
          ],
        },
      ],
      examples: [
        {
          id: "signed",
          label: "example.signed",
          explain: "example.signed.explain",
          signer: "alice",
          template: { kind: 24133, tags: [["p", CAROL]], content: SIGN_RESPONSE },
        },
        {
          id: "ack",
          label: "example.ack",
          signer: "alice",
          template: { kind: 24133, tags: [["p", CAROL]], content: ACK_RESPONSE },
        },
        {
          id: "auth-url",
          label: "example.auth-url",
          explain: "example.auth-url.explain",
          signer: "alice",
          template: { kind: 24133, tags: [["p", CAROL]], content: AUTH_URL_RESPONSE },
        },
      ],
    },
  ],
  documents: [
    {
      id: "discovery",
      label: "discovery.label",
      explain: "discovery.explain",
      mediaType: "application/json",
      urlTemplate: "https://<signer-domain>/.well-known/nostr.json?name=_",
      schema: {
        type: "object",
        properties: {
          names: {
            type: "object",
            properties: {
              _: { type: "string", field: { type: "pubkey" }, explain: "discovery.names._" },
            },
            required: ["_"],
            additionalProperties: { type: "string", field: { type: "pubkey" } },
            explain: "discovery.names",
          },
          nip46: {
            type: "object",
            properties: {
              relays: {
                type: "array",
                items: { type: "string", field: { type: "relay-url" } },
                explain: "discovery.relays",
              },
              nostrconnect_url: {
                type: "string",
                field: { type: "text", pattern: "https://.*<nostrconnect>.*" },
                explain: "discovery.nostrconnect-url",
              },
            },
            explain: "discovery.nip46",
          },
        },
        required: ["names"],
      },
      examples: [
        {
          id: "bunker-alpha",
          label: "example.discovery",
          value: {
            names: { _: ALICE },
            nip46: {
              relays: ["wss://relay.alpha.example", "wss://relay.beta.example"],
              nostrconnect_url: "https://bunker.alpha.example/connect/<nostrconnect>",
            },
          },
        },
      ],
    },
  ],
  flows: [
    {
      id: "remote-sign",
      label: "flow.sign.label",
      explain: "flow.sign.explain",
      steps: [
        { part: { kind: "document", id: "discovery" }, explain: "flow.sign.discover" },
        { part: { kind: "event", id: "request" }, explain: "flow.sign.request" },
        { part: { kind: "event", id: "response" }, explain: "flow.sign.response" },
      ],
    },
  ],
  howItWorks: [
    {
      id: "keys",
      title: "how.keys.title",
      body: "how.keys.body",
    },
    {
      id: "connect",
      title: "how.connect.title",
      body: "how.connect.body",
      focus: { part: { kind: "event", id: "request" }, path: ["content"] },
    },
    {
      id: "request",
      title: "how.request.title",
      body: "how.request.body",
      focus: { part: { kind: "event", id: "request" }, path: ["tags", 0] },
    },
    {
      id: "response",
      title: "how.response.title",
      body: "how.response.body",
      focus: { part: { kind: "event", id: "response" }, path: ["content"] },
    },
    {
      id: "auth-challenge",
      title: "how.auth-challenge.title",
      body: "how.auth-challenge.body",
    },
    {
      id: "relays-logout",
      title: "how.relays-logout.title",
      body: "how.relays-logout.body",
    },
  ],
  related: [
    { nip: "44", relation: "depends-on", explain: "related.44" },
    { nip: "05", relation: "see-also", explain: "related.05" },
    { nip: "89", relation: "see-also", explain: "related.89" },
    { nip: "07", relation: "see-also", explain: "related.07" },
    { nip: "55", relation: "see-also", explain: "related.55" },
  ],
};
