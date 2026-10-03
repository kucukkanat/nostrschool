/**
 * NIP-19 bech32 entities, exposing the encoding steps chapter 2 animates:
 * hex bytes → (TLV) → 8-bit to 5-bit regrouping → checksum → bech32 characters.
 */
import { bech32 } from "@scure/base";
import { bytesToHex, concatBytes, hexToBytes, utf8Decode, utf8Encode } from "./encoding.ts";
import { fail, ok, type ProtocolError, type Result } from "./result.ts";
import type { Hex, RelayUrl } from "./types.ts";

export type Nip19Prefix = "npub" | "nsec" | "note" | "nprofile" | "nevent" | "naddr";

export interface ProfilePointer {
  readonly pubkey: Hex;
  readonly relays?: readonly RelayUrl[];
}
export interface EventPointer {
  readonly id: Hex;
  readonly relays?: readonly RelayUrl[];
  readonly author?: Hex;
  readonly kind?: number;
}
export interface AddressPointer {
  readonly identifier: string;
  readonly pubkey: Hex;
  readonly kind: number;
  readonly relays?: readonly RelayUrl[];
}

/** Discriminated union of every NIP-19 payload. `nsec` carries raw bytes, others hex/pointers. */
export type Nip19Entity =
  | { readonly type: "npub"; readonly data: Hex }
  | { readonly type: "nsec"; readonly data: Uint8Array }
  | { readonly type: "note"; readonly data: Hex }
  | { readonly type: "nprofile"; readonly data: ProfilePointer }
  | { readonly type: "nevent"; readonly data: EventPointer }
  | { readonly type: "naddr"; readonly data: AddressPointer };

/** One TLV record (NIP-19 types: 0 special, 1 relay, 2 author, 3 kind). */
export interface TlvEntry {
  readonly type: 0 | 1 | 2 | 3;
  readonly length: number;
  readonly value: Uint8Array;
}

export interface Bech32Steps {
  /** Human-readable part, e.g. "npub". */
  readonly hrp: Nip19Prefix;
  /** Payload bytes before regrouping (raw key/id, or the TLV stream). */
  readonly dataBytes: Uint8Array;
  /** TLV records for nprofile/nevent/naddr; absent for npub/nsec/note. */
  readonly tlv?: readonly TlvEntry[];
  /** `dataBytes` regrouped from 8-bit to 5-bit words (values 0–31). */
  readonly words: readonly number[];
  /** The 6 checksum words (BCH code over hrp + words). */
  readonly checksumWords: readonly number[];
  /** Words + checksum mapped through the bech32 charset, e.g. "qpzry9x8…". */
  readonly dataChars: string;
  /** Final string: `${hrp}1${dataChars}`. */
  readonly encoded: string;
}

export type Nip19ErrorCode =
  | "invalid-bech32"
  | "bad-checksum"
  | "unknown-prefix"
  | "invalid-length"
  | "invalid-tlv"
  | "invalid-hex"
  | "too-long";
export type Nip19Error = ProtocolError<Nip19ErrorCode>;

/** The bech32 alphabet, index = 5-bit value. Handy for the character-by-character animation. */
export const BECH32_CHARSET = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";

/** NIP-19 raises bech32's 90-char limit; 5000 matches nostr-tools and keeps TLVs bounded. */
export const NIP19_MAX_LENGTH = 5000;

const PREFIXES: readonly Nip19Prefix[] = ["npub", "nsec", "note", "nprofile", "nevent", "naddr"];
const GENERATOR = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3] as const;

/**
 * BCH checksum core from BIP-173. Implemented here (not via @scure) because chapter 2 shows the
 * checksum words separately; tests cross-check the result against @scure and nostr-tools.
 */
const polymod = (values: readonly number[]): number =>
  values.reduce((chk, v) => {
    const top = chk >>> 25;
    const next = ((chk & 0x1ffffff) << 5) ^ v;
    return GENERATOR.reduce((c, g, i) => (((top >>> i) & 1) === 1 ? c ^ g : c), next);
  }, 1);

const hrpExpand = (hrp: string): number[] => {
  const codes = Array.from(hrp, (c) => c.charCodeAt(0));
  return [...codes.map((c) => c >>> 5), 0, ...codes.map((c) => c & 31)];
};

const checksumWordsFor = (hrp: string, words: readonly number[]): number[] => {
  const mod = polymod([...hrpExpand(hrp), ...words, 0, 0, 0, 0, 0, 0]) ^ 1;
  return [0, 1, 2, 3, 4, 5].map((i) => (mod >>> (5 * (5 - i))) & 31);
};

const toChars = (words: readonly number[]): string =>
  words.map((w) => BECH32_CHARSET.charAt(w)).join("");

const buildSteps = (
  hrp: Nip19Prefix,
  dataBytes: Uint8Array,
  tlv: readonly TlvEntry[] | undefined,
): Bech32Steps => {
  const words = Array.from(bech32.toWords(dataBytes));
  const checksumWords = checksumWordsFor(hrp, words);
  const dataChars = toChars([...words, ...checksumWords]);
  const base = { hrp, dataBytes, words, checksumWords, dataChars, encoded: `${hrp}1${dataChars}` };
  return tlv === undefined ? base : { ...base, tlv };
};

const entry = (type: TlvEntry["type"], value: Uint8Array): TlvEntry => ({
  type,
  length: value.length,
  value,
});

const kindBytes = (kind: number): Uint8Array => {
  const out = new Uint8Array(4);
  new DataView(out.buffer).setUint32(0, kind, false);
  return out;
};

type Nip19Result<T> = Result<T, Nip19Error>;

const hex32 = (hex: string, what: string): Nip19Result<Uint8Array> => {
  const bytes = hexToBytes(hex, 32);
  return bytes.ok ? bytes : fail("invalid-hex", `${what} must be 64 hex chars`);
};

const isUint32 = (n: number): boolean => Number.isInteger(n) && n >= 0 && n <= 0xffffffff;

/** Collects results, stopping at the first failure. */
const all = <T>(results: readonly Nip19Result<T>[]): Nip19Result<T[]> =>
  results.reduce<Nip19Result<T[]>>(
    (acc, r) => (!acc.ok ? acc : r.ok ? ok([...acc.value, r.value]) : r),
    ok([]),
  );

const relayEntries = (relays: readonly string[] | undefined): Nip19Result<TlvEntry[]> =>
  all(
    (relays ?? []).map((url) => {
      const bytes = utf8Encode(url);
      return bytes.length > 255
        ? fail("invalid-tlv", `Relay URL longer than 255 bytes: ${url}`)
        : ok(entry(1, bytes));
    }),
  );

/** TLV records in canonical type order (0, 1, 2, 3), matching the NIP-19 examples. */
type TlvEntity = Extract<Nip19Entity, { type: "nprofile" | "nevent" | "naddr" }>;
const tlvFor = (entity: TlvEntity): Nip19Result<TlvEntry[]> => {
  switch (entity.type) {
    case "nprofile": {
      const pk = hex32(entity.data.pubkey, "pubkey");
      const relays = relayEntries(entity.data.relays);
      if (!pk.ok) return pk;
      return relays.ok ? ok([entry(0, pk.value), ...relays.value]) : relays;
    }
    case "nevent": {
      const { id, author, kind } = entity.data;
      const idBytes = hex32(id, "id");
      if (!idBytes.ok) return idBytes;
      const relays = relayEntries(entity.data.relays);
      if (!relays.ok) return relays;
      const authorBytes = author === undefined ? ok(undefined) : hex32(author, "author");
      if (!authorBytes.ok) return authorBytes;
      if (kind !== undefined && !isUint32(kind))
        return fail("invalid-tlv", "kind must be a 32-bit unsigned integer");
      return ok([
        entry(0, idBytes.value),
        ...relays.value,
        ...(authorBytes.value === undefined ? [] : [entry(2, authorBytes.value)]),
        ...(kind === undefined ? [] : [entry(3, kindBytes(kind))]),
      ]);
    }
    case "naddr": {
      const { identifier, pubkey, kind } = entity.data;
      const idBytes = utf8Encode(identifier);
      if (idBytes.length > 255) return fail("invalid-tlv", "identifier longer than 255 bytes");
      const relays = relayEntries(entity.data.relays);
      if (!relays.ok) return relays;
      const pk = hex32(pubkey, "pubkey");
      if (!pk.ok) return pk;
      if (!isUint32(kind)) return fail("invalid-tlv", "kind must be a 32-bit unsigned integer");
      return ok([
        entry(0, idBytes),
        ...relays.value,
        entry(2, pk.value),
        entry(3, kindBytes(kind)),
      ]);
    }
  }
};

const rawBytesFor = (
  entity: Extract<Nip19Entity, { type: "npub" | "nsec" | "note" }>,
): Nip19Result<Uint8Array> => {
  if (entity.type !== "nsec") return hex32(entity.data, entity.type === "npub" ? "pubkey" : "id");
  return entity.data.length === 32
    ? ok(entity.data)
    : fail("invalid-length", `nsec must be 32 bytes, got ${entity.data.length}`);
};

/** Encodes any NIP-19 entity and returns every intermediate step. */
export const nip19Encode = (entity: Nip19Entity): Nip19Result<Bech32Steps> => {
  if (entity.type === "npub" || entity.type === "nsec" || entity.type === "note") {
    const bytes = rawBytesFor(entity);
    return bytes.ok ? ok(buildSteps(entity.type, bytes.value, undefined)) : bytes;
  }
  const tlv = tlvFor(entity);
  if (!tlv.ok) return tlv;
  const dataBytes = concatBytes(
    ...tlv.value.map((t) => concatBytes(Uint8Array.of(t.type, t.length), t.value)),
  );
  const steps = buildSteps(entity.type, dataBytes, tlv.value);
  return steps.encoded.length > NIP19_MAX_LENGTH
    ? fail("too-long", `Encoded string exceeds ${NIP19_MAX_LENGTH} chars`)
    : ok(steps);
};

export interface Nip19Decoded {
  readonly entity: Nip19Entity;
  readonly steps: Bech32Steps;
}

const parseTlv = (data: Uint8Array): Nip19Result<TlvEntry[]> => {
  const out: TlvEntry[] = [];
  let i = 0;
  while (i < data.length) {
    const type = data[i];
    const length = data[i + 1];
    if (type === undefined || length === undefined || i + 2 + length > data.length)
      return fail("invalid-tlv", `Truncated TLV record at byte ${i}`);
    // Unknown TLV types must be ignored per NIP-19 (forward compatibility).
    if (type <= 3) out.push(entry(type as TlvEntry["type"], data.slice(i + 2, i + 2 + length)));
    i += 2 + length;
  }
  return ok(out);
};

const values = (tlv: readonly TlvEntry[], type: TlvEntry["type"]): Uint8Array[] =>
  tlv.filter((t) => t.type === type).map((t) => t.value);

const exact32 = (v: Uint8Array | undefined, what: string): Nip19Result<Hex | undefined> =>
  v === undefined
    ? ok(undefined)
    : v.length === 32
      ? ok(bytesToHex(v))
      : fail("invalid-tlv", `${what} must be 32 bytes`);

const kindOf = (v: Uint8Array | undefined): Nip19Result<number | undefined> =>
  v === undefined
    ? ok(undefined)
    : v.length === 4
      ? ok(new DataView(v.buffer, v.byteOffset, 4).getUint32(0, false))
      : fail("invalid-tlv", "kind must be 4 bytes");

const relaysOf = (tlv: readonly TlvEntry[]): string[] => values(tlv, 1).map(utf8Decode);

const withRelays = <T extends object>(data: T, relays: string[]): T =>
  relays.length > 0 ? { ...data, relays } : data;

const entityFromTlv = (
  hrp: "nprofile" | "nevent" | "naddr",
  tlv: readonly TlvEntry[],
): Nip19Result<Nip19Entity> => {
  const special = values(tlv, 0)[0];
  if (special === undefined) return fail("invalid-tlv", `${hrp} is missing TLV type 0`);
  const relays = relaysOf(tlv);
  const author = exact32(values(tlv, 2)[0], "author");
  const kind = kindOf(values(tlv, 3)[0]);
  if (!author.ok) return author;
  if (!kind.ok) return kind;
  if (hrp === "naddr") {
    if (author.value === undefined || kind.value === undefined)
      return fail("invalid-tlv", "naddr needs an author (type 2) and a kind (type 3)");
    const data = { identifier: utf8Decode(special), pubkey: author.value, kind: kind.value };
    return ok({ type: "naddr", data: withRelays(data, relays) });
  }
  const main = exact32(special, hrp === "nprofile" ? "pubkey" : "id");
  if (!main.ok) return main;
  const key = bytesToHex(special);
  if (hrp === "nprofile")
    return ok({ type: "nprofile", data: withRelays({ pubkey: key }, relays) });
  const data = {
    id: key,
    ...(author.value === undefined ? {} : { author: author.value }),
    ...(kind.value === undefined ? {} : { kind: kind.value }),
  };
  return ok({ type: "nevent", data: withRelays(data, relays) });
};

const entityFromBytes = (
  hrp: Nip19Prefix,
  data: Uint8Array,
): Nip19Result<{ entity: Nip19Entity; tlv?: TlvEntry[] }> => {
  if (hrp === "npub" || hrp === "nsec" || hrp === "note") {
    if (data.length !== 32) return fail("invalid-length", `${hrp} must hold 32 bytes`);
    return ok({
      entity: hrp === "nsec" ? { type: hrp, data } : { type: hrp, data: bytesToHex(data) },
    });
  }
  const tlv = parseTlv(data);
  if (!tlv.ok) return tlv;
  const entity = entityFromTlv(hrp, tlv.value);
  return entity.ok ? ok({ entity: entity.value, tlv: tlv.value }) : entity;
};

/** Decodes and validates (checksum, prefix, lengths, TLV). Accepts a `nostr:` URI prefix. */
export const nip19Decode = (encoded: string): Nip19Result<Nip19Decoded> => {
  const input = encoded.trim().replace(/^nostr:/i, "");
  if (input.length > NIP19_MAX_LENGTH)
    return fail("too-long", `Longer than ${NIP19_MAX_LENGTH} chars`);
  if (input !== input.toLowerCase() && input !== input.toUpperCase())
    return fail("invalid-bech32", "Bech32 strings cannot mix upper and lower case");
  const lower = input.toLowerCase();
  const sep = lower.lastIndexOf("1");
  const hrp = lower.slice(0, sep);
  const dataChars = lower.slice(sep + 1);
  if (sep < 1 || dataChars.length < 6)
    return fail("invalid-bech32", "Expected <prefix>1<data> with at least 6 data characters");
  const all5 = Array.from(dataChars, (c) => BECH32_CHARSET.indexOf(c));
  const badIndex = all5.indexOf(-1);
  if (badIndex !== -1)
    return fail("invalid-bech32", `"${dataChars.charAt(badIndex)}" is not a bech32 character`);
  if (polymod([...hrpExpand(hrp), ...all5]) !== 1)
    return fail("bad-checksum", "Checksum mismatch: a character was mistyped or changed");
  if (!PREFIXES.includes(hrp as Nip19Prefix))
    return fail("unknown-prefix", `Unknown prefix "${hrp}"`);
  const prefix = hrp as Nip19Prefix;
  const words = all5.slice(0, -6);
  const bytes = bech32.fromWordsUnsafe(words);
  if (bytes === undefined) return fail("invalid-bech32", "Invalid padding in the data part");
  const decoded = entityFromBytes(prefix, Uint8Array.from(bytes));
  if (!decoded.ok) return decoded;
  const steps: Bech32Steps = {
    hrp: prefix,
    dataBytes: Uint8Array.from(bytes),
    words,
    checksumWords: all5.slice(-6),
    dataChars,
    encoded: lower,
    ...(decoded.value.tlv === undefined ? {} : { tlv: decoded.value.tlv }),
  };
  return ok({ entity: decoded.value.entity, steps });
};

const encodedOnly = (entity: Nip19Entity): Nip19Result<string> => {
  const steps = nip19Encode(entity);
  return steps.ok ? ok(steps.value.encoded) : steps;
};

/** Convenience wrappers returning just the string. */
export const encodeNpub = (pubkey: Hex): Nip19Result<string> =>
  encodedOnly({ type: "npub", data: pubkey });
export const encodeNsec = (secretKey: Uint8Array | Hex): Nip19Result<string> => {
  if (typeof secretKey !== "string") return encodedOnly({ type: "nsec", data: secretKey });
  const bytes = hex32(secretKey, "secret key");
  return bytes.ok ? encodedOnly({ type: "nsec", data: bytes.value }) : bytes;
};
export const encodeNote = (eventId: Hex): Nip19Result<string> =>
  encodedOnly({ type: "note", data: eventId });
export const encodeNprofile = (pointer: ProfilePointer): Nip19Result<string> =>
  encodedOnly({ type: "nprofile", data: pointer });
export const encodeNevent = (pointer: EventPointer): Nip19Result<string> =>
  encodedOnly({ type: "nevent", data: pointer });
export const encodeNaddr = (pointer: AddressPointer): Nip19Result<string> =>
  encodedOnly({ type: "naddr", data: pointer });
