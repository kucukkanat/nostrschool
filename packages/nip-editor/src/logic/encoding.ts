/**
 * Encoding parts (NIP-19, NIP-21, NIP-49, NIP-06, NIP-44/04 payloads): turn the input record
 * into the encoded string and a labelled breakdown of that string, and decode a pasted string
 * back into inputs. Inputs are found by their field type first and name second, so spec authors
 * can name them naturally ("pubkey", "author", "relays", "password", "log_n"…).
 */

import { personaByPubkey } from "@nostrschool/fixtures";
import type { EncodingInputSpec, EncodingSpec } from "@nostrschool/nips";
import {
  BECH32_CHARSET,
  bytesToHex,
  decodeBase64,
  encodeNpub,
  encodeNsec,
  err,
  getPublicKey,
  hexToBytes,
  type Nip19Entity,
  nip19Decode,
  nip19Encode,
  type ProtocolError,
  type Result,
} from "@nostrschool/protocol";
import { privateKeyFromSeedWords } from "nostr-tools/nip06";
import { decrypt as ncryptsecDecrypt, encrypt as ncryptsecEncrypt } from "nostr-tools/nip49";
import { decryptFrom, encryptFor } from "./event.ts";
import { personaOf } from "./fields.ts";

export type EncodingInputs = { readonly [name: string]: string | readonly string[] };

export type EncodingErrorCode =
  | "missing-input"
  | "invalid-input"
  | "unsupported"
  | "crypto"
  | "too-costly";
export type EncodingError = ProtocolError<EncodingErrorCode> & {
  readonly input?: string;
  /** For "too-costly": the scrypt exponent asked for and the memory it needs. */
  readonly logn?: number;
  readonly mib?: number;
};

/**
 * Highest NIP-49 scrypt exponent the demo runs. scrypt needs 2^log_n KiB of memory (log_n 16 =
 * 64 MiB, 20 = 1 GiB, which crashes phones), so above this we explain the cost instead.
 */
export const MAX_DEMO_LOGN = 16;

/** Codecs slow enough (scrypt) that the form runs them on request, not per keystroke. */
export const isCostlyCodec = (codec: EncodingSpec["codec"]): boolean => codec === "ncryptsec";

const tooCostly = (logn: number, input?: string): Result<never, EncodingError> =>
  err({
    code: "too-costly",
    message: `log_n ${logn} needs ${2 ** logn / 1024} MiB`,
    logn,
    mib: 2 ** logn / 1024,
    ...(input === undefined ? {} : { input }),
  });

/** The log_n byte of an ncryptsec string, read from its first bech32 characters (no decryption). */
export const ncryptsecLogN = (encoded: string): number | undefined => {
  const body = encoded
    .trim()
    .toLowerCase()
    .replace(/^ncryptsec1/, "");
  const words = [...body.slice(0, 4)].map((c) => BECH32_CHARSET.indexOf(c));
  if (words.length < 4 || words.some((w) => w < 0)) return undefined;
  // 4 words = 20 bits: version byte, then the log_n byte, then 4 bits of salt.
  return (words.reduce((acc, w) => (acc << 5) | w, 0) >> 4) & 0xff;
};

/** One labelled slice of the encoded string. `role` keys into editor.encoding.parts. */
export interface BreakdownPart {
  readonly role:
    | "prefix"
    | "hrp"
    | "separator"
    | "data"
    | "checksum"
    | "version"
    | "nonce"
    | "ciphertext"
    | "mac"
    | "iv";
  readonly text: string;
}

/** A TLV record inside nprofile/nevent/naddr. `type` 0 special, 1 relay, 2 author, 3 kind. */
export interface TlvRow {
  readonly type: number;
  readonly length: number;
  readonly value: string;
}

export interface EncodingOutput {
  readonly encoded: string;
  readonly parts: readonly BreakdownPart[];
  readonly tlv?: readonly TlvRow[];
  /** Extra derived values (NIP-06: secret key, npub, derivation path). */
  readonly derived?: readonly { readonly name: string; readonly value: string }[];
}

const fail = (
  code: EncodingErrorCode,
  message: string,
  input?: string,
): Result<never, EncodingError> =>
  err(input === undefined ? { code, message } : { code, message, input });

const NAME = {
  secret: /sec|priv|secret/i,
  passphrase: /passphrase/i,
  password: /pass/i,
  logn: /log/i,
  ksb: /security|ksb/i,
  mnemonic: /mnemonic|words|seed/i,
  account: /account|index/i,
  identifier: /ident|^d$/i,
  plaintext: /plain|message|text/i,
  recipient: /recipient|^to$|peer/i,
  sender: /sender|^from$|author/i,
  nonce: /nonce|^iv$/i,
};

/**
 * Who encrypts to whom in a payload codec. The sender is a demo persona: picked by a secret input
 * (its demo key) or by a pubkey input named like "sender" (mapped to that persona's demo key).
 */
const payloadParties = (
  spec: EncodingSpec,
  inputs: EncodingInputs,
): { readonly signer: string; readonly recipient: string | undefined } => {
  const secret = spec.inputs.find(isSecretInput);
  const senderInput = byName(spec, NAME.sender);
  const senderPubkey = one(inputs, senderInput);
  const signer =
    secret !== undefined
      ? personaFromSecret(one(inputs, secret))
      : (personaByPubkey(senderPubkey ?? "")?.id ?? "alice");
  const recipientInput =
    byName(spec, NAME.recipient) ?? byType(spec, "pubkey").find((i) => i !== senderInput);
  return { signer, recipient: one(inputs, recipientInput) };
};

/** True for inputs holding a secret key: the form offers demo personas only. */
export const isSecretInput = (input: EncodingInputSpec): boolean =>
  (input.type.type === "bech32" && input.type.prefixes.includes("nsec")) ||
  NAME.secret.test(input.name);

const byType = (spec: EncodingSpec, type: string) =>
  spec.inputs.filter((i) => i.type.type === type && !isSecretInput(i));
const byName = (spec: EncodingSpec, re: RegExp) => spec.inputs.find((i) => re.test(i.name));

const values = (inputs: EncodingInputs, input: EncodingInputSpec | undefined): string[] => {
  const v = input === undefined ? undefined : inputs[input.name];
  return (typeof v === "string" ? [v] : [...(v ?? [])]).filter((s) => s !== "");
};
const one = (inputs: EncodingInputs, input: EncodingInputSpec | undefined): string | undefined =>
  values(inputs, input)[0];

/** Splits any bech32 string into prefix, separator, data and checksum (no decoding needed). */
export const bech32Parts = (encoded: string): BreakdownPart[] => {
  const uri = encoded.startsWith("nostr:") ? "nostr:" : "";
  const body = encoded.slice(uri.length);
  const sep = body.lastIndexOf("1");
  const parts: BreakdownPart[] = uri === "" ? [] : [{ role: "prefix", text: uri }];
  if (sep < 1) return [...parts, { role: "data", text: body }];
  const data = body.slice(sep + 1);
  return [
    ...parts,
    { role: "hrp", text: body.slice(0, sep) },
    { role: "separator", text: "1" },
    { role: "data", text: data.slice(0, -6) },
    { role: "checksum", text: data.slice(-6) },
  ];
};

/** Secret key bytes from a hex or nsec input value. */
const secretBytes = (value: string): Result<Uint8Array, EncodingError> => {
  if (value.startsWith("nsec1")) {
    const d = nip19Decode(value);
    if (d.ok && d.value.entity.type === "nsec") return { ok: true, value: d.value.entity.data };
    return fail("invalid-input", "Not a valid nsec");
  }
  const b = hexToBytes(value, 32);
  return b.ok ? b : fail("invalid-input", b.error.message);
};

const nip19Output = (entity: Nip19Entity, uri: boolean): Result<EncodingOutput, EncodingError> => {
  const r = nip19Encode(entity);
  if (!r.ok) return fail("invalid-input", r.error.message);
  const encoded = `${uri ? "nostr:" : ""}${r.value.encoded}`;
  const tlv = r.value.tlv?.map((t) => ({
    type: t.type,
    length: t.length,
    value:
      t.type === 1 || (t.type === 0 && entity.type === "naddr")
        ? new TextDecoder().decode(t.value)
        : t.type === 3
          ? String(new DataView(t.value.buffer, t.value.byteOffset).getUint32(0))
          : bytesToHex(t.value),
  }));
  return {
    ok: true,
    value:
      tlv === undefined
        ? { encoded, parts: bech32Parts(encoded) }
        : { encoded, parts: bech32Parts(encoded), tlv },
  };
};

const entityFor = (
  codec: "npub" | "note" | "nprofile" | "nevent" | "naddr" | "nsec",
  spec: EncodingSpec,
  inputs: EncodingInputs,
): Result<Nip19Entity, EncodingError> => {
  const pubkeyInput = byType(spec, "pubkey")[0] ?? byName(spec, /pub|author/i);
  const pubkey = one(inputs, pubkeyInput);
  const relays = byType(spec, "relay-url").flatMap((i) => values(inputs, i));
  const kindRaw = one(inputs, byType(spec, "kind")[0]);
  const kind = kindRaw === undefined ? undefined : Number(kindRaw);
  const need = <T>(v: T | undefined, what: string): Result<T, EncodingError> =>
    v === undefined ? fail("missing-input", `Missing ${what}`, what) : { ok: true, value: v };
  const withRelays = relays.length > 0 ? { relays } : {};
  switch (codec) {
    case "npub": {
      const p = need(pubkey, pubkeyInput?.name ?? "pubkey");
      return p.ok ? { ok: true, value: { type: "npub", data: p.value } } : p;
    }
    case "nsec": {
      const input = spec.inputs.find(isSecretInput) ?? spec.inputs[0];
      const raw = need(one(inputs, input), input?.name ?? "secret");
      if (!raw.ok) return raw;
      const sk = secretBytes(raw.value);
      return sk.ok ? { ok: true, value: { type: "nsec", data: sk.value } } : sk;
    }
    case "note":
    case "nevent": {
      const idInput = byType(spec, "event-id")[0];
      const id = need(one(inputs, idInput), idInput?.name ?? "id");
      if (!id.ok) return id;
      if (codec === "note") return { ok: true, value: { type: "note", data: id.value } };
      return {
        ok: true,
        value: {
          type: "nevent",
          data: {
            id: id.value,
            ...withRelays,
            ...(pubkey === undefined ? {} : { author: pubkey }),
            ...(kind === undefined || Number.isNaN(kind) ? {} : { kind }),
          },
        },
      };
    }
    case "nprofile": {
      const p = need(pubkey, pubkeyInput?.name ?? "pubkey");
      return p.ok
        ? { ok: true, value: { type: "nprofile", data: { pubkey: p.value, ...withRelays } } }
        : p;
    }
    case "naddr": {
      const p = need(pubkey, pubkeyInput?.name ?? "pubkey");
      if (!p.ok) return p;
      if (kind === undefined || Number.isNaN(kind))
        return fail("missing-input", "Missing kind", "kind");
      const idInput =
        byName(spec, NAME.identifier) ?? spec.inputs.find((i) => i.type.type === "text");
      return {
        ok: true,
        value: {
          type: "naddr",
          data: { identifier: one(inputs, idInput) ?? "", pubkey: p.value, kind, ...withRelays },
        },
      };
    }
  }
};

/** Runs a throwing third-party crypto call as a Result (nostr-tools throws on bad input). */
const attempt = <T>(f: () => T): Result<T, EncodingError> => {
  try {
    return { ok: true, value: f() };
  } catch (e) {
    return fail("crypto", e instanceof Error ? e.message : String(e));
  }
};

const payloadParts = (payload: string): BreakdownPart[] => {
  const bytes = decodeBase64(payload);
  if (!bytes.ok || bytes.value.length < 66) return [{ role: "data", text: payload }];
  const b = bytes.value;
  return [
    { role: "version", text: bytesToHex(b.subarray(0, 1)) },
    { role: "nonce", text: bytesToHex(b.subarray(1, 33)) },
    { role: "ciphertext", text: bytesToHex(b.subarray(33, -32)) },
    { role: "mac", text: bytesToHex(b.subarray(-32)) },
  ];
};

/** Encodes the inputs with the part's codec. */
export const encodeInputs = (
  spec: EncodingSpec,
  inputs: EncodingInputs,
): Result<EncodingOutput, EncodingError> => {
  const codec = spec.codec;
  switch (codec) {
    case "npub":
    case "nsec":
    case "note":
    case "nprofile":
    case "nevent":
    case "naddr": {
      const e = entityFor(codec, spec, inputs);
      return e.ok ? nip19Output(e.value, false) : e;
    }
    case "nostr-uri": {
      // Either a ready bech32 entity input, or the pointer fields of one.
      const entityInput = spec.inputs.find((i) => i.type.type === "bech32");
      const entity = one(inputs, entityInput);
      if (entity !== undefined) {
        const bare = entity.replace(/^nostr:/, "");
        const d = nip19Decode(bare);
        if (!d.ok) return fail("invalid-input", d.error.message, entityInput?.name);
        if (d.value.entity.type === "nsec")
          return fail(
            "invalid-input",
            "nsec must never be shared as a nostr: URI",
            entityInput?.name,
          );
        return nip19Output(d.value.entity, true);
      }
      const prefix = byType(spec, "event-id").length > 0 ? "nevent" : "nprofile";
      const e = entityFor(prefix, spec, inputs);
      return e.ok ? nip19Output(e.value, true) : e;
    }
    case "ncryptsec": {
      const secretInput = spec.inputs.find(isSecretInput);
      const sk = secretBytes(one(inputs, secretInput) ?? "");
      if (!sk.ok)
        return {
          ...sk,
          error: { ...sk.error, ...(secretInput ? { input: secretInput.name } : {}) },
        };
      const password = one(inputs, byName(spec, NAME.password)) ?? "";
      const logn = Number(one(inputs, byName(spec, NAME.logn)) ?? 16);
      const ksb = Number(one(inputs, byName(spec, NAME.ksb)) ?? 2);
      if (logn > MAX_DEMO_LOGN) return tooCostly(logn, byName(spec, NAME.logn)?.name);
      if (ksb !== 0 && ksb !== 1 && ksb !== 2)
        return fail(
          "invalid-input",
          "Key security byte must be 0, 1 or 2",
          byName(spec, NAME.ksb)?.name,
        );
      const enc = attempt(() => ncryptsecEncrypt(sk.value, password.normalize("NFKC"), logn, ksb));
      return enc.ok
        ? { ok: true, value: { encoded: enc.value, parts: bech32Parts(enc.value) } }
        : enc;
    }
    case "mnemonic": {
      const words = one(inputs, byName(spec, NAME.mnemonic) ?? spec.inputs[0]);
      if (words === undefined) return fail("missing-input", "Missing mnemonic", "mnemonic");
      const passphrase = one(inputs, byName(spec, NAME.passphrase));
      const account = Number(one(inputs, byName(spec, NAME.account)) ?? 0);
      const sk = attempt(() => privateKeyFromSeedWords(words.trim(), passphrase, account));
      if (!sk.ok) return sk;
      const pub = getPublicKey(sk.value);
      const npub = pub.ok ? encodeNpub(pub.value) : pub;
      const nsec = encodeNsec(sk.value);
      if (!pub.ok || !npub.ok || !nsec.ok) return fail("crypto", "Could not derive keys");
      return {
        ok: true,
        value: {
          encoded: nsec.value,
          parts: bech32Parts(nsec.value),
          derived: [
            { name: "path", value: `m/44'/1237'/${account}'/0/0` },
            { name: "secret-hex", value: bytesToHex(sk.value) },
            { name: "pubkey", value: pub.value },
            { name: "npub", value: npub.value },
          ],
        },
      };
    }
    case "nip44-payload":
    case "nip04-payload": {
      const scheme = codec === "nip44-payload" ? "nip44" : "nip04";
      const plain = one(inputs, byName(spec, NAME.plaintext)) ?? "";
      const { signer, recipient } = payloadParties(spec, inputs);
      if (recipient === undefined) return fail("missing-input", "Missing recipient", "recipient");
      const nonceHex = one(inputs, byName(spec, NAME.nonce));
      const nonce =
        nonceHex === undefined ? undefined : hexToBytes(nonceHex, scheme === "nip44" ? 32 : 16);
      if (nonce !== undefined && !nonce.ok)
        return fail("invalid-input", nonce.error.message, byName(spec, NAME.nonce)?.name);
      const r = encryptFor(scheme, plain, signer, recipient, nonce?.value);
      if (!r.ok) return fail("crypto", r.error.message);
      const [ct, iv] = r.value.split("?iv=");
      return {
        ok: true,
        value: {
          encoded: r.value,
          parts:
            scheme === "nip44"
              ? payloadParts(r.value)
              : [
                  { role: "ciphertext", text: ct ?? "" },
                  { role: "separator", text: "?iv=" },
                  { role: "iv", text: iv ?? "" },
                ],
        },
      };
    }
  }
};

/** The persona whose demo secret (hex or nsec) this is; "alice" when it is none of theirs. */
export const personaFromSecret = (secret: string | undefined): string => {
  for (const id of ["alice", "bob", "carol", "dave", "erin", "frank", "grace"]) {
    const p = personaOf(id);
    if (secret === p.secretKeyHex || secret === p.nsec) return id;
  }
  return "alice";
};

/** Reads a pasted encoded string back into inputs (NIP-19 / nostr: URIs, ncryptsec, payloads). */
export const decodeToInputs = (
  spec: EncodingSpec,
  encoded: string,
  current: EncodingInputs,
): Result<EncodingInputs, EncodingError> => {
  const text = encoded.trim();
  const set = (
    out: Record<string, string | readonly string[]>,
    input: EncodingInputSpec | undefined,
    v: string | readonly string[] | undefined,
  ) => {
    if (input !== undefined && v !== undefined)
      out[input.name] = input.repeatable === true && typeof v === "string" ? [v] : v;
  };
  switch (spec.codec) {
    case "ncryptsec": {
      const logn = ncryptsecLogN(text);
      if (logn !== undefined && logn > MAX_DEMO_LOGN) return tooCostly(logn);
      const password = one(current, byName(spec, NAME.password)) ?? "";
      const sk = attempt(() => ncryptsecDecrypt(text, password.normalize("NFKC")));
      if (!sk.ok) return sk;
      const out: Record<string, string | readonly string[]> = { ...current };
      const secretInput = spec.inputs.find(isSecretInput);
      const asNsec = secretInput?.type.type === "bech32";
      const nsec = encodeNsec(sk.value);
      set(out, secretInput, asNsec && nsec.ok ? nsec.value : bytesToHex(sk.value));
      return { ok: true, value: out };
    }
    case "nip44-payload":
    case "nip04-payload": {
      const scheme = spec.codec === "nip44-payload" ? "nip44" : "nip04";
      const { signer, recipient } = payloadParties(spec, current);
      if (recipient === undefined) return fail("missing-input", "Missing recipient", "recipient");
      const r = decryptFrom(scheme, text, signer, recipient);
      if (!r.ok) return fail("crypto", r.error.message);
      const out: Record<string, string | readonly string[]> = { ...current };
      set(out, byName(spec, NAME.plaintext), r.value);
      return { ok: true, value: out };
    }
    case "mnemonic":
      return fail("unsupported", "A mnemonic cannot be recovered from the keys it derives");
    default: {
      const d = nip19Decode(text.replace(/^nostr:/, ""));
      if (!d.ok) return fail("invalid-input", d.error.message);
      const e = d.value.entity;
      const out: Record<string, string | readonly string[]> = {};
      const pubkeyInput = byType(spec, "pubkey")[0] ?? byName(spec, /pub|author/i);
      const relayInputs = byType(spec, "relay-url");
      const putRelays = (relays: readonly string[] | undefined) => {
        const first = relayInputs[0];
        if (first !== undefined && relays !== undefined)
          out[first.name] = first.repeatable === true ? relays : (relays[0] ?? "");
      };
      if (spec.codec === "nostr-uri") {
        const entityInput = spec.inputs.find((i) => i.type.type === "bech32");
        if (entityInput !== undefined) {
          set(
            out,
            entityInput,
            entityInput.type.type === "bech32" && entityInput.type.uri === true
              ? `nostr:${d.value.steps.encoded}`
              : d.value.steps.encoded,
          );
          return { ok: true, value: out };
        }
      } else if (e.type !== spec.codec) {
        return fail("invalid-input", `Expected ${spec.codec}, got ${e.type}`);
      }
      switch (e.type) {
        case "npub":
          set(out, pubkeyInput, e.data);
          break;
        case "nsec":
          set(out, spec.inputs.find(isSecretInput), bytesToHex(e.data));
          break;
        case "note":
          set(out, byType(spec, "event-id")[0], e.data);
          break;
        case "nprofile":
          set(out, pubkeyInput, e.data.pubkey);
          putRelays(e.data.relays);
          break;
        case "nevent":
          set(out, byType(spec, "event-id")[0], e.data.id);
          set(out, pubkeyInput, e.data.author);
          set(
            out,
            byType(spec, "kind")[0],
            e.data.kind === undefined ? undefined : String(e.data.kind),
          );
          putRelays(e.data.relays);
          break;
        case "naddr":
          set(out, pubkeyInput, e.data.pubkey);
          set(out, byType(spec, "kind")[0], String(e.data.kind));
          set(
            out,
            byName(spec, NAME.identifier) ?? spec.inputs.find((i) => i.type.type === "text"),
            e.data.identifier,
          );
          putRelays(e.data.relays);
          break;
      }
      return { ok: true, value: out };
    }
  }
};

/** Demo secret of a persona in the representation an input expects (nsec or hex). */
export const demoSecretFor = (input: EncodingInputSpec, persona: string): string =>
  input.type.type === "bech32" ? personaOf(persona).nsec : personaOf(persona).secretKeyHex;
