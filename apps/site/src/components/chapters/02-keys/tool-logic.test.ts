import { describe, expect, test } from "bun:test";
import {
  encodeNaddr,
  encodeNevent,
  encodeNote,
  encodeNprofile,
  encodeNpub,
  encodeNsec,
  unwrap,
} from "@nostrschool/protocol";
import { sampleKeypair } from "./keys-logic.ts";
import {
  buildPointer,
  type ConversionRow,
  encodePointer,
  entityRows,
  hexReadings,
  type PointerForm,
  parseToolInput,
  splitRelays,
  tlvDisplay,
} from "./tool-logic.ts";

const kp = sampleKeypair();
const PK = kp.publicKey;
const ID = "a".repeat(64);
const RELAY = "wss://relay.example.com";
// NIP-19 example nprofile (pubkey 3bf0…459d with two relays).
const NIP19_NPROFILE =
  "nprofile1qqsrhuxx8l9ex335q7he0f09aej04zpazpl0ne2cgukyawd24mayt8gpp4mhxue69uhhytnc9e3k7mgpz4mhxue69uhkg6nzv9ejuumpv34kytnrdaksjlyr9p";

const ids = (rows: readonly ConversionRow[]) => rows.map((r) => r.id);
const value = (rows: readonly ConversionRow[], id: ConversionRow["id"]) =>
  rows.find((r) => r.id === id)?.value;

describe("parseToolInput", () => {
  test("empty", () => {
    const r = parseToolInput("   ");
    expect(r.ok ? "" : r.error.code).toBe("empty");
  });
  test("64-char hex (any case) becomes lowercase hex", () => {
    const r = unwrap(parseToolInput(` ${PK.toUpperCase()} `));
    expect(r).toEqual({ kind: "hex", hex: PK });
  });
  test("short hex explains the length", () => {
    const r = parseToolInput("abcd");
    expect(r.ok ? "" : r.error.code).toBe("invalid-hex");
  });
  test("random text", () => {
    const r = parseToolInput("hello world");
    expect(r.ok ? "" : r.error.code).toBe("not-hex-or-nip19");
  });
  test("decodes NIP-19 strings, with or without nostr:", () => {
    const npub = unwrap(encodeNpub(PK));
    for (const input of [npub, `nostr:${npub}`]) {
      const r = unwrap(parseToolInput(input));
      expect(r.kind === "nip19" ? r.decoded.entity : undefined).toEqual({ type: "npub", data: PK });
    }
  });
  test("bad checksum is reported", () => {
    const npub = unwrap(encodeNpub(PK));
    const typo = `${npub.slice(0, -1)}${npub.endsWith("q") ? "p" : "q"}`;
    const r = parseToolInput(typo);
    expect(r.ok ? "" : r.error.code).toBe("bad-checksum");
  });
});

describe("hexReadings", () => {
  test("a valid pubkey gets every reading", () => {
    const r = hexReadings(PK, [RELAY]);
    expect(ids(r.asPubkey)).toEqual(["npub", "nprofile"]);
    expect(value(r.asPubkey, "nprofile")).toBe(
      unwrap(encodeNprofile({ pubkey: PK, relays: [RELAY] })),
    );
    expect(ids(r.asEventId)).toEqual(["note", "nevent"]);
    expect(ids(r.asSecret)).toEqual(["nsec", "hex-pubkey", "npub"]);
    expect(r.asSecret[0]?.secret).toBe(true);
  });
  test("relays are optional", () => {
    const r = hexReadings(PK);
    expect(value(r.asPubkey, "nprofile")).toBe(unwrap(encodeNprofile({ pubkey: PK })));
    expect(value(r.asEventId, "nevent")).toBe(unwrap(encodeNevent({ id: PK })));
  });
  test("not every hex is on the curve or a valid secret", () => {
    // 0xff…ff is above both the field prime and the curve order.
    const r = hexReadings("f".repeat(64));
    expect(r.asPubkey).toEqual([]);
    expect(r.asSecret).toEqual([]);
    expect(ids(r.asEventId)).toEqual(["note", "nevent"]);
  });
});

describe("entityRows", () => {
  const decode = (s: string) => {
    const r = unwrap(parseToolInput(s));
    if (r.kind !== "nip19") throw new Error("expected nip19");
    return entityRows(r.decoded.entity);
  };
  test("npub", () => {
    expect(ids(decode(unwrap(encodeNpub(PK))))).toEqual(["hex-pubkey", "nprofile"]);
  });
  test("nsec reveals the pubkey and flags the secret", () => {
    const rows = decode(unwrap(encodeNsec(kp.secretKey)));
    expect(ids(rows)).toEqual(["hex-secret", "hex-pubkey", "npub"]);
    expect(rows[0]).toEqual({ id: "hex-secret", value: kp.secretKeyHex, secret: true });
    expect(value(rows, "hex-pubkey")).toBe(PK);
  });
  test("nsec outside the curve order still shows its hex", () => {
    const rows = entityRows({ type: "nsec", data: new Uint8Array(32) });
    expect(ids(rows)).toEqual(["hex-secret"]);
  });
  test("note", () => {
    expect(ids(decode(unwrap(encodeNote(ID))))).toEqual(["hex-id", "nevent"]);
  });
  test("nprofile from the NIP-19 spec", () => {
    const rows = decode(NIP19_NPROFILE);
    expect(value(rows, "hex-pubkey")).toBe(
      "3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d",
    );
    expect(rows.filter((r) => r.id === "relay").map((r) => r.value)).toEqual([
      "wss://r.x.com",
      "wss://djbas.sadkb.com",
    ]);
  });
  test("nevent with and without extras", () => {
    const full = decode(unwrap(encodeNevent({ id: ID, author: PK, kind: 1, relays: [RELAY] })));
    expect(ids(full)).toEqual(["hex-id", "note", "author", "kind", "relay"]);
    expect(ids(decode(unwrap(encodeNevent({ id: ID }))))).toEqual(["hex-id", "note"]);
  });
  test("naddr shows its coordinate", () => {
    const rows = decode(unwrap(encodeNaddr({ identifier: "hello", pubkey: PK, kind: 30023 })));
    expect(value(rows, "coordinate")).toBe(`30023:${PK}:hello`);
    expect(ids(rows)).toEqual(["coordinate", "identifier", "author", "kind"]);
  });
});

describe("pointer builder", () => {
  const form = (over: Partial<PointerForm>): PointerForm => ({
    type: "nprofile",
    hex: PK,
    relays: "",
    author: "",
    kind: "",
    identifier: "",
    ...over,
  });
  test("splitRelays accepts lines and commas", () => {
    expect(splitRelays(` ${RELAY}\n\nwss://b.example , wss://c.example`)).toEqual([
      RELAY,
      "wss://b.example",
      "wss://c.example",
    ]);
  });
  test("nprofile", () => {
    expect(unwrap(buildPointer(form({ relays: RELAY })))).toEqual({
      type: "nprofile",
      data: { pubkey: PK, relays: [RELAY] },
    });
    expect(unwrap(encodePointer(form({ hex: PK.toUpperCase() }))).encoded).toBe(
      unwrap(encodeNprofile({ pubkey: PK })),
    );
  });
  test("nevent with optional author and kind", () => {
    expect(unwrap(buildPointer(form({ type: "nevent", hex: ID })))).toEqual({
      type: "nevent",
      data: { id: ID },
    });
    expect(
      unwrap(buildPointer(form({ type: "nevent", hex: ID, author: PK, kind: " 1 " }))),
    ).toEqual({
      type: "nevent",
      data: { id: ID, author: PK, kind: 1 },
    });
  });
  test("naddr requires a kind", () => {
    const steps = unwrap(
      encodePointer(form({ type: "naddr", kind: "30023", identifier: "hi", relays: RELAY })),
    );
    expect(steps.encoded).toBe(
      unwrap(encodeNaddr({ identifier: "hi", pubkey: PK, kind: 30023, relays: [RELAY] })),
    );
    expect(steps.tlv?.map((e) => e.type)).toEqual([0, 1, 2, 3]);
  });
  const fieldOf = (f: PointerForm) => {
    const r = buildPointer(f);
    return r.ok ? "ok" : `${r.error.code}:${r.error.field ?? ""}`;
  };
  test("field errors", () => {
    expect(fieldOf(form({ hex: "abc" }))).toBe("invalid-field:hex");
    expect(fieldOf(form({ relays: "https://nope" }))).toBe("invalid-field:relays");
    expect(fieldOf(form({ type: "nevent", hex: "x" }))).toBe("invalid-field:hex");
    expect(fieldOf(form({ type: "nevent", hex: ID, author: "x" }))).toBe("invalid-field:author");
    expect(fieldOf(form({ type: "nevent", hex: ID, kind: "-1" }))).toBe("invalid-field:kind");
    expect(fieldOf(form({ type: "nevent", hex: ID, kind: "99999999999" }))).toBe(
      "invalid-field:kind",
    );
    expect(fieldOf(form({ type: "naddr", hex: "x" }))).toBe("invalid-field:hex");
    expect(fieldOf(form({ type: "naddr" }))).toBe("invalid-field:kind");
    expect(fieldOf(form({ type: "naddr", kind: "1.5" }))).toBe("invalid-field:kind");
  });
  test("encodePointer surfaces both form and encoder errors", () => {
    const formErr = encodePointer(form({ hex: "" }));
    expect(formErr.ok ? "" : formErr.error.code).toBe("invalid-field");
    const long = encodePointer(form({ type: "naddr", kind: "1", identifier: "x".repeat(300) }));
    expect(long.ok ? "" : long.error.code).toBe("invalid-tlv");
  });
});

describe("tlvDisplay", () => {
  const steps = unwrap(
    encodePointer({
      type: "naddr",
      hex: PK,
      relays: RELAY,
      author: "",
      kind: "30023",
      identifier: "hello",
    }),
  );
  const tlv = steps.tlv ?? [];
  test("naddr: identifier text, relay text, author hex, kind number", () => {
    expect(tlv.map((e) => tlvDisplay(e, "naddr"))).toEqual(["hello", RELAY, PK, "30023"]);
  });
  test("nprofile special is hex; malformed kind falls back to hex", () => {
    const special = tlv[0];
    expect(special === undefined ? "" : tlvDisplay(special, "nprofile")).toBe(
      Buffer.from("hello").toString("hex"),
    );
    expect(tlvDisplay({ type: 3, length: 1, value: Uint8Array.of(7) }, "nevent")).toBe("07");
  });
});
