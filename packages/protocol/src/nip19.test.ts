import { describe, expect, test } from "bun:test";
import { bech32 } from "@scure/base";
import * as nt from "nostr-tools/nip19";
import { bytesToHex, concatBytes, hexToBytes } from "./encoding.ts";
import {
  BECH32_CHARSET,
  encodeNaddr,
  encodeNevent,
  encodeNote,
  encodeNprofile,
  encodeNpub,
  encodeNsec,
  type Nip19Entity,
  nip19Decode,
  nip19Encode,
} from "./nip19.ts";
import { unwrap } from "./result.ts";

// Examples straight from NIP-19 (https://github.com/nostr-protocol/nips/blob/master/19.md).
const SPEC = {
  npub: "npub10elfcs4fr0l0r8af98jlmgdh9c8tcxjvz9qkw038js35mp4dma8qzvjptg",
  pubkey: "7e7e9c42a91bfef19fa929e5fda1b72e0ebc1a4c1141673e2794234d86addf4e",
  nsec: "nsec1vl029mgpspedva04g90vltkh6fvh240zqtv9k0t9af8935ke9laqsnlfe5",
  secret: "67dea2ed018072d675f5415ecfaed7d2597555e202d85b3d65ea4e58d2d92ffa",
  nprofile:
    "nprofile1qqsrhuxx8l9ex335q7he0f09aej04zpazpl0ne2cgukyawd24mayt8gpp4mhxue69uhhytnc9e3k7mgpz4mhxue69uhkg6nzv9ejuumpv34kytnrdaksjlyr9p",
  nprofilePubkey: "3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d",
  nprofileRelays: ["wss://r.x.com", "wss://djbas.sadkb.com"],
};

const codeOf = (r: { ok: boolean; error?: { code: string } }): string =>
  r.ok ? "ok" : (r.error?.code ?? "");

const ID = "b".repeat(64);
const PK = SPEC.pubkey;

describe("NIP-19 spec vectors", () => {
  test("npub / nsec encode to the exact spec strings", () => {
    expect(encodeNpub(SPEC.pubkey)).toEqual({ ok: true, value: SPEC.npub });
    expect(encodeNsec(SPEC.secret)).toEqual({ ok: true, value: SPEC.nsec });
    expect(encodeNsec(unwrap(hexToBytes(SPEC.secret)))).toEqual({ ok: true, value: SPEC.nsec });
  });

  test("decode spec npub/nsec/nprofile", () => {
    expect(unwrap(nip19Decode(SPEC.npub)).entity).toEqual({ type: "npub", data: SPEC.pubkey });
    const nsec = unwrap(nip19Decode(SPEC.nsec)).entity;
    expect(nsec.type === "nsec" && bytesToHex(nsec.data)).toBe(SPEC.secret);
    expect(unwrap(nip19Decode(SPEC.nprofile)).entity).toEqual({
      type: "nprofile",
      data: { pubkey: SPEC.nprofilePubkey, relays: SPEC.nprofileRelays },
    });
  });

  test("nprofile re-encodes to the spec string (canonical TLV order)", () => {
    expect(encodeNprofile({ pubkey: SPEC.nprofilePubkey, relays: SPEC.nprofileRelays })).toEqual({
      ok: true,
      value: SPEC.nprofile,
    });
  });
});

describe("exposed bech32 steps", () => {
  test("words, checksum and chars are consistent with @scure/base", () => {
    const steps = unwrap(nip19Encode({ type: "npub", data: PK }));
    expect(steps.hrp).toBe("npub");
    expect(bytesToHex(steps.dataBytes)).toBe(PK);
    expect(steps.words).toEqual(Array.from(bech32.toWords(steps.dataBytes)));
    expect(steps.checksumWords).toHaveLength(6);
    expect(steps.dataChars).toBe(
      [...steps.words, ...steps.checksumWords].map((w) => BECH32_CHARSET[w]).join(""),
    );
    expect(steps.encoded).toBe(bech32.encode("npub", [...steps.words], 5000));
    expect(steps.tlv).toBeUndefined();
  });

  test("decode returns the same steps as encode", () => {
    const enc = unwrap(nip19Encode({ type: "nevent", data: { id: ID, author: PK, kind: 1 } }));
    const dec = unwrap(nip19Decode(enc.encoded));
    expect(dec.steps).toEqual(enc);
    expect(enc.tlv?.map((t) => [t.type, t.length])).toEqual([
      [0, 32],
      [2, 32],
      [3, 4],
    ]);
  });
});

describe("round trips and nostr-tools interop", () => {
  const entities: Nip19Entity[] = [
    { type: "note", data: ID },
    { type: "nprofile", data: { pubkey: PK } },
    {
      type: "nevent",
      data: { id: ID, relays: ["wss://relay.alpha.example"], author: PK, kind: 30023 },
    },
    { type: "nevent", data: { id: ID } },
    {
      type: "naddr",
      data: { identifier: "my-article", pubkey: PK, kind: 30023, relays: ["wss://a.example"] },
    },
    { type: "naddr", data: { identifier: "", pubkey: PK, kind: 0 } },
  ];
  test.each(entities.map((e) => [e.type, e] as const))("%s", (_t, entity) => {
    const encoded = unwrap(nip19Encode(entity)).encoded;
    expect(unwrap(nip19Decode(encoded)).entity).toEqual(entity);
    const theirs = nt.decode(encoded);
    expect(theirs.type).toBe(entity.type);
    // nostr-tools writes TLVs in reverse type order; we must still read its output.
    const ntEncoded =
      entity.type === "nevent"
        ? nt.neventEncode({ ...entity.data, relays: [...(entity.data.relays ?? [])] })
        : entity.type === "naddr"
          ? nt.naddrEncode({ ...entity.data, relays: [...(entity.data.relays ?? [])] })
          : entity.type === "nprofile"
            ? nt.nprofileEncode({ pubkey: entity.data.pubkey })
            : nt.noteEncode(ID);
    expect(unwrap(nip19Decode(ntEncoded)).entity).toEqual(entity);
  });

  test("convenience wrappers", () => {
    expect(unwrap(encodeNote(ID))).toBe(nt.noteEncode(ID));
    expect(unwrap(encodeNevent({ id: ID }))).toStartWith("nevent1");
    expect(unwrap(encodeNaddr({ identifier: "x", pubkey: PK, kind: 30023 }))).toStartWith("naddr1");
  });

  test("accepts nostr: URIs, whitespace and all-uppercase", () => {
    expect(unwrap(nip19Decode(`nostr:${SPEC.npub}`)).entity.data).toBe(SPEC.pubkey);
    expect(unwrap(nip19Decode(` ${SPEC.npub.toUpperCase()} `)).entity.data).toBe(SPEC.pubkey);
  });

  test("ignores unknown TLV types", () => {
    const data = concatBytes(Uint8Array.of(0, 32), unwrap(hexToBytes(PK)), Uint8Array.of(9, 1, 7));
    const encoded = bech32.encode("nprofile", bech32.toWords(data), 5000);
    expect(unwrap(nip19Decode(encoded)).entity).toEqual({ type: "nprofile", data: { pubkey: PK } });
  });
});

const encodeRaw = (hrp: string, bytes: Uint8Array): string =>
  bech32.encode(hrp, bech32.toWords(bytes), 5000);
const tlvBytes = (...records: [number, Uint8Array][]): Uint8Array =>
  concatBytes(...records.map(([t, v]) => concatBytes(Uint8Array.of(t, v.length), v)));
const pkBytes = unwrap(hexToBytes(PK));

describe("decode errors", () => {
  test.each([
    ["mixed case", "nPub1abc", "invalid-bech32"],
    ["no separator", "npub", "invalid-bech32"],
    ["too short", "npub1qqq", "invalid-bech32"],
    ["bad char", `${SPEC.npub.slice(0, -1)}b`, "invalid-bech32"],
    ["checksum", `${SPEC.npub.slice(0, -1)}q`, "bad-checksum"],
    ["prefix", encodeRaw("nfoo", pkBytes), "unknown-prefix"],
    ["npub length", encodeRaw("npub", new Uint8Array(31)), "invalid-length"],
    ["too long", `npub1${"q".repeat(5000)}`, "too-long"],
    ["truncated tlv", encodeRaw("nprofile", Uint8Array.of(0, 32, 1)), "invalid-tlv"],
    ["missing type 0", encodeRaw("nprofile", tlvBytes([1, Uint8Array.of(97)])), "invalid-tlv"],
    ["short pubkey", encodeRaw("nprofile", tlvBytes([0, Uint8Array.of(1)])), "invalid-tlv"],
    [
      "short author",
      encodeRaw("nevent", tlvBytes([0, pkBytes], [2, Uint8Array.of(1)])),
      "invalid-tlv",
    ],
    [
      "short kind",
      encodeRaw("nevent", tlvBytes([0, pkBytes], [3, Uint8Array.of(1)])),
      "invalid-tlv",
    ],
    [
      "naddr w/o kind",
      encodeRaw("naddr", tlvBytes([0, Uint8Array.of(97)], [2, pkBytes])),
      "invalid-tlv",
    ],
  ])("%s", (_name, input, code) => {
    expect(codeOf(nip19Decode(input))).toBe(code);
  });

  test("non-zero padding bits are rejected", () => {
    // 32 bytes → 52 words with 4 padding bits; force one of them on.
    const words = Array.from(bech32.toWords(pkBytes));
    words[words.length - 1] = (words[words.length - 1] ?? 0) | 1;
    expect(codeOf(nip19Decode(bech32.encode("npub", words, 5000)))).toBe("invalid-bech32");
  });
});

describe("encode errors", () => {
  test.each<[string, Nip19Entity, string]>([
    ["npub hex", { type: "npub", data: "xyz" }, "invalid-hex"],
    ["note hex", { type: "note", data: "ab" }, "invalid-hex"],
    ["nsec length", { type: "nsec", data: new Uint8Array(3) }, "invalid-length"],
    ["nprofile pubkey", { type: "nprofile", data: { pubkey: "x" } }, "invalid-hex"],
    [
      "relay > 255 bytes",
      { type: "nprofile", data: { pubkey: PK, relays: [`wss://${"a".repeat(260)}`] } },
      "invalid-tlv",
    ],
    ["nevent id", { type: "nevent", data: { id: "x" } }, "invalid-hex"],
    [
      "nevent relay",
      { type: "nevent", data: { id: ID, relays: ["a".repeat(256)] } },
      "invalid-tlv",
    ],
    ["nevent author", { type: "nevent", data: { id: ID, author: "x" } }, "invalid-hex"],
    ["nevent kind", { type: "nevent", data: { id: ID, kind: -1 } }, "invalid-tlv"],
    [
      "naddr identifier",
      { type: "naddr", data: { identifier: "a".repeat(256), pubkey: PK, kind: 1 } },
      "invalid-tlv",
    ],
    [
      "naddr relay",
      { type: "naddr", data: { identifier: "", pubkey: PK, kind: 1, relays: ["a".repeat(256)] } },
      "invalid-tlv",
    ],
    [
      "naddr pubkey",
      { type: "naddr", data: { identifier: "", pubkey: "x", kind: 1 } },
      "invalid-hex",
    ],
    [
      "naddr kind",
      { type: "naddr", data: { identifier: "", pubkey: PK, kind: 2 ** 32 } },
      "invalid-tlv",
    ],
    [
      "too long",
      { type: "nprofile", data: { pubkey: PK, relays: Array(20).fill("a".repeat(250)) } },
      "too-long",
    ],
  ])("%s", (_name, entity, code) => {
    expect(codeOf(nip19Encode(entity))).toBe(code);
  });

  test("encodeNsec with bad hex", () => {
    expect(codeOf(encodeNsec("zz"))).toBe("invalid-hex");
    expect(codeOf(encodeNpub("zz"))).toBe("invalid-hex");
  });
});
