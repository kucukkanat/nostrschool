/**
 * Pure logic for the /tools/keys converter: classify whatever the user pastes (hex or any NIP-19
 * string), and build nprofile/nevent/naddr pointers from form fields. Nothing here does I/O —
 * pasted values never leave the browser.
 */
import {
  type Bech32Steps,
  bytesToHex,
  encodeNevent,
  encodeNote,
  encodeNprofile,
  encodeNpub,
  encodeNsec,
  fail,
  getPublicKey,
  isHex,
  isValidPublicKey,
  type Nip19Decoded,
  type Nip19Entity,
  type Nip19ErrorCode,
  nip19Decode,
  nip19Encode,
  ok,
  type ProtocolError,
  type Result,
  type TlvEntry,
  utf8Decode,
} from "@nostrschool/protocol";

export type ToolErrorCode = "empty" | "not-hex-or-nip19" | Nip19ErrorCode | "invalid-field";
export type ToolError = ProtocolError<ToolErrorCode> & { readonly field?: string };

export type ParsedInput =
  | { readonly kind: "hex"; readonly hex: string }
  | { readonly kind: "nip19"; readonly decoded: Nip19Decoded };

/** Hex (64 chars) or a NIP-19 string (with or without `nostr:`). */
export const parseToolInput = (raw: string): Result<ParsedInput, ToolError> => {
  const input = raw.trim();
  if (input === "")
    return fail("empty", "Paste a hex key or an npub/nsec/note/nprofile/nevent/naddr");
  const lower = input.toLowerCase();
  if (isHex(lower, 32)) return ok({ kind: "hex", hex: lower });
  if (/^[0-9a-f]+$/.test(lower))
    return fail("invalid-hex", `Hex keys and ids are 64 characters; this one has ${lower.length}`);
  if (!/^(nostr:)?n[a-z]+1/i.test(input))
    return fail("not-hex-or-nip19", "Not 64-char hex and not a NIP-19 string");
  const decoded = nip19Decode(input);
  return decoded.ok ? ok({ kind: "nip19", decoded: decoded.value }) : decoded;
};

/** A labelled output line. `secret` rows are masked by default in the UI. */
export interface ConversionRow {
  readonly id:
    | "hex-pubkey"
    | "hex-secret"
    | "hex-id"
    | "npub"
    | "nsec"
    | "note"
    | "nprofile"
    | "nevent"
    | "naddr"
    | "coordinate"
    | "identifier"
    | "kind"
    | "author"
    | "relay";
  readonly value: string;
  readonly secret?: true;
}

/** Interpretations of a bare 64-char hex string: it could be a pubkey, an event id or a secret key. */
export interface HexReadings {
  readonly asPubkey: readonly ConversionRow[];
  readonly asEventId: readonly ConversionRow[];
  readonly asSecret: readonly ConversionRow[];
}

const row = (id: ConversionRow["id"], r: Result<string, unknown>): readonly ConversionRow[] =>
  r.ok ? [{ id, value: r.value }] : [];
const secretRow = (id: ConversionRow["id"], value: string): ConversionRow => ({
  id,
  value,
  secret: true,
});

const relaysOpt = (relays: readonly string[]) => (relays.length > 0 ? { relays } : {});

export const hexReadings = (hex: string, relays: readonly string[] = []): HexReadings => {
  // Not every 32-byte string is an x coordinate on secp256k1, so only offer npub when it is.
  const asPubkey = isValidPublicKey(hex)
    ? [
        ...row("npub", encodeNpub(hex)),
        ...row("nprofile", encodeNprofile({ pubkey: hex, ...relaysOpt(relays) })),
      ]
    : [];
  const asEventId = [
    ...row("note", encodeNote(hex)),
    ...row("nevent", encodeNevent({ id: hex, ...relaysOpt(relays) })),
  ];
  const pubkey = getPublicKey(hex);
  const asSecret = pubkey.ok
    ? [
        ...row("nsec", encodeNsec(hex)).map((r) => secretRow(r.id, r.value)),
        { id: "hex-pubkey" as const, value: pubkey.value },
        ...row("npub", encodeNpub(pubkey.value)),
      ]
    : [];
  return { asPubkey, asEventId, asSecret };
};

/** What a decoded NIP-19 entity contains, plus its handiest equivalents. */
export const entityRows = (entity: Nip19Entity): readonly ConversionRow[] => {
  switch (entity.type) {
    case "npub":
      return [
        { id: "hex-pubkey", value: entity.data },
        ...row("nprofile", encodeNprofile({ pubkey: entity.data })),
      ];
    case "nsec": {
      const hex = bytesToHex(entity.data);
      const pubkey = getPublicKey(entity.data);
      return [
        secretRow("hex-secret", hex),
        ...(pubkey.ok
          ? [
              { id: "hex-pubkey" as const, value: pubkey.value },
              ...row("npub", encodeNpub(pubkey.value)),
            ]
          : []),
      ];
    }
    case "note":
      return [
        { id: "hex-id", value: entity.data },
        ...row("nevent", encodeNevent({ id: entity.data })),
      ];
    case "nprofile":
      return [
        { id: "hex-pubkey", value: entity.data.pubkey },
        ...row("npub", encodeNpub(entity.data.pubkey)),
        ...relayRows(entity.data.relays),
      ];
    case "nevent": {
      const { id, author, kind, relays } = entity.data;
      return [
        { id: "hex-id", value: id },
        ...row("note", encodeNote(id)),
        ...(author === undefined ? [] : [{ id: "author" as const, value: author }]),
        ...(kind === undefined ? [] : [{ id: "kind" as const, value: String(kind) }]),
        ...relayRows(relays),
      ];
    }
    case "naddr": {
      const { identifier, pubkey, kind, relays } = entity.data;
      return [
        { id: "coordinate", value: `${kind}:${pubkey}:${identifier}` },
        { id: "identifier", value: identifier },
        { id: "author", value: pubkey },
        { id: "kind", value: String(kind) },
        ...relayRows(relays),
      ];
    }
  }
};

const relayRows = (relays: readonly string[] | undefined): readonly ConversionRow[] =>
  (relays ?? []).map((value) => ({ id: "relay", value }));

// ---------------------------------------------------------------------------------------------
// Pointer builder (Build tab).
// ---------------------------------------------------------------------------------------------

export type PointerType = "nprofile" | "nevent" | "naddr";
export const POINTER_TYPES: readonly PointerType[] = ["nprofile", "nevent", "naddr"];

/** Raw form state: every field is a string, exactly as typed. */
export interface PointerForm {
  readonly type: PointerType;
  /** pubkey (nprofile/naddr) or event id (nevent), hex. */
  readonly hex: string;
  /** One relay URL per line (commas also accepted). */
  readonly relays: string;
  /** nevent only, optional. */
  readonly author: string;
  /** Required for naddr, optional for nevent. */
  readonly kind: string;
  /** naddr `d` tag. */
  readonly identifier: string;
}

export const splitRelays = (text: string): readonly string[] =>
  text
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter((s) => s !== "");

const invalid = (field: string, message: string): Result<never, ToolError> => ({
  ok: false,
  error: { code: "invalid-field", message, field },
});

const parseRelays = (text: string): Result<readonly string[], ToolError> => {
  const relays = splitRelays(text);
  const bad = relays.find((r) => !/^wss?:\/\/[^\s]+$/i.test(r));
  return bad === undefined ? ok(relays) : invalid("relays", `Not a ws:// or wss:// URL: ${bad}`);
};

const parseKind = (text: string, required: boolean): Result<number | undefined, ToolError> => {
  const t = text.trim();
  if (t === "") return required ? invalid("kind", "Kind is required for naddr") : ok(undefined);
  const n = Number(t);
  return /^\d+$/.test(t) && n <= 0xffffffff
    ? ok(n)
    : invalid("kind", "Kind must be a whole number");
};

const parseHex = (text: string, field: string): Result<string, ToolError> => {
  const t = text.trim().toLowerCase();
  return isHex(t, 32) ? ok(t) : invalid(field, "Must be 64 hex characters");
};

/** Validates the form into a NIP-19 entity (relays/kind/author omitted when blank). */
export const buildPointer = (form: PointerForm): Result<Nip19Entity, ToolError> => {
  const relays = parseRelays(form.relays);
  if (!relays.ok) return relays;
  const withRelays = relaysOpt(relays.value);
  switch (form.type) {
    case "nprofile": {
      const pubkey = parseHex(form.hex, "hex");
      return pubkey.ok
        ? ok({ type: "nprofile", data: { pubkey: pubkey.value, ...withRelays } })
        : pubkey;
    }
    case "nevent": {
      const id = parseHex(form.hex, "hex");
      if (!id.ok) return id;
      const author = form.author.trim() === "" ? ok(undefined) : parseHex(form.author, "author");
      if (!author.ok) return author;
      const kind = parseKind(form.kind, false);
      if (!kind.ok) return kind;
      return ok({
        type: "nevent",
        data: {
          id: id.value,
          ...withRelays,
          ...(author.value === undefined ? {} : { author: author.value }),
          ...(kind.value === undefined ? {} : { kind: kind.value }),
        },
      });
    }
    case "naddr": {
      const pubkey = parseHex(form.hex, "hex");
      if (!pubkey.ok) return pubkey;
      const kind = parseKind(form.kind, true);
      if (!kind.ok) return kind;
      // parseKind(required) never yields undefined; the check narrows the type for the compiler.
      if (kind.value === undefined) return invalid("kind", "Kind is required for naddr");
      return ok({
        type: "naddr",
        data: {
          identifier: form.identifier,
          pubkey: pubkey.value,
          kind: kind.value,
          ...withRelays,
        },
      });
    }
  }
};

/** Form → encoded steps (string + TLV records), with typed errors either way. */
export const encodePointer = (form: PointerForm): Result<Bech32Steps, ToolError> => {
  const entity = buildPointer(form);
  if (!entity.ok) return entity;
  return nip19Encode(entity.value);
};

/** TLV record type names as NIP-19 defines them. */
export const TLV_NAMES = { 0: "special", 1: "relay", 2: "author", 3: "kind" } as const;

/** Human-readable TLV value: relay URLs and naddr identifiers are UTF-8, kinds are uint32, the rest hex. */
export const tlvDisplay = (entry: TlvEntry, hrp: PointerType): string => {
  if (entry.type === 1 || (entry.type === 0 && hrp === "naddr")) return utf8Decode(entry.value);
  if (entry.type === 3 && entry.value.length === 4)
    return String(new DataView(entry.value.buffer, entry.value.byteOffset, 4).getUint32(0, false));
  return bytesToHex(entry.value);
};
