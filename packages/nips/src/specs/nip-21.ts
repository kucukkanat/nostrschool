// Owner: spec author r2 (NIPs 20–39). NIP-21: nostr: URI scheme.
import type { NipSpec } from "../spec.ts";

export const nip21: NipSpec = {
  nip: "21",
  variant: "encoding",
  howItWorks: [
    {
      id: "entity",
      title: "how.entity.title",
      body: "how.entity.body",
      focus: { part: { kind: "encoding", id: "uri" }, path: ["entity"] },
    },
    { id: "prefix", title: "how.prefix.title", body: "how.prefix.body" },
    { id: "no-nsec", title: "how.no-nsec.title", body: "how.no-nsec.body" },
    { id: "open", title: "how.open.title", body: "how.open.body" },
    { id: "html", title: "how.html.title", body: "how.html.body" },
  ],
  related: [
    { nip: "19", relation: "depends-on", explain: "related.19" },
    { nip: "27", relation: "used-by", explain: "related.27" },
    { nip: "23", relation: "see-also", explain: "related.23" },
  ],
  encodings: [
    {
      id: "uri",
      label: "enc.uri.label",
      explain: "enc.uri.explain",
      codec: "nostr-uri",
      inputs: [
        {
          name: "entity",
          type: { type: "bech32", prefixes: ["npub", "nprofile", "note", "nevent", "naddr"] },
          explain: "enc.uri.entity",
        },
      ],
      output: "enc.uri.output",
      examples: [
        {
          id: "npub",
          label: "example.npub",
          inputs: { entity: "npub1u4gvd6fgpre4swpt0wxpgdzngn67lx3fj55cxnguym2hk6kwgnxqta308g" },
        },
        {
          id: "nevent",
          label: "example.nevent",
          explain: "example.nevent.explain",
          inputs: {
            entity:
              "nevent1qqsx7a30zsfgdl6fmstlzeeqgp5a7py8tr8s5nxc8khzg40jwujpy5cpr9mhxue69uhhyetvv9ujuctvwp5xztn90psk6urvv5pzp3ch2qq8usjy8ew23s02qzata48gc79fedza6mdnwv7errst2h0tqvzqqqqqqy2utas0",
          },
        },
        {
          id: "naddr",
          label: "example.naddr",
          explain: "example.naddr.explain",
          inputs: {
            entity:
              "naddr1qqthqun0w3hkxmmvwvkkumm594cxcct5vehhymtnqyv8wumn8ghj7un9d3shjtnzv46xztn90psk6urvv5pzpy3wgw6s4mqk450f68kxs4xqtzqk629egjhzl6daec7eysdl4tacqvzqqqr4guhvmfqn",
          },
        },
      ],
    },
  ],
};
