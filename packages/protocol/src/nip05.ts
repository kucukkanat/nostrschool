/** NIP-05 DNS-based identifiers (`name@domain`). Pure: fetching is the caller's job. */
import { fail, ok, type ProtocolError, type Result } from "./result.ts";
import type { Hex, RelayUrl } from "./types.ts";

export interface Nip05Address {
  /** Local part, lowercased. `_` means "the domain itself". */
  readonly name: string;
  readonly domain: string;
  /** `https://${domain}/.well-known/nostr.json?name=${name}` */
  readonly wellKnownUrl: string;
  /** How clients display it: just `domain` when name is `_`, else `name@domain`. */
  readonly display: string;
}

export type Nip05ErrorCode =
  | "invalid-format"
  | "invalid-document"
  | "name-not-found"
  | "pubkey-mismatch";
export type Nip05Error = ProtocolError<Nip05ErrorCode>;

/** NIP-05 restricts the local part to a-z0-9-_. (case-insensitive). */
const NAME = /^[a-z0-9._-]+$/;
const DOMAIN =
  /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9-]{2,63}(?::\d{1,5})?$/;

/** Parses `name@domain` (or a bare `domain`, meaning `_@domain`). */
export const parseNip05 = (identifier: string): Result<Nip05Address, Nip05Error> => {
  const lower = identifier.trim().toLowerCase();
  const parts = lower.split("@");
  const [name, domain] = parts.length === 1 ? ["_", parts[0] ?? ""] : parts;
  if (parts.length > 2 || name === undefined || domain === undefined || !NAME.test(name))
    return fail("invalid-format", `"${identifier}" is not a valid name@domain identifier`);
  if (!DOMAIN.test(domain)) return fail("invalid-format", `"${domain}" is not a valid domain`);
  return ok({
    name,
    domain,
    wellKnownUrl: `https://${domain}/.well-known/nostr.json?name=${encodeURIComponent(name)}`,
    display: name === "_" ? domain : `${name}@${domain}`,
  });
};

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

export interface Nip05Verification {
  readonly pubkey: Hex;
  /** Relays advertised for this pubkey in the document's optional `relays` map. */
  readonly relays: readonly RelayUrl[];
}

/** Checks a fetched `nostr.json` document against an address and the expected pubkey. */
export const verifyNip05Document = (
  document: unknown,
  address: Nip05Address,
  expectedPubkey: Hex,
): Result<Nip05Verification, Nip05Error> => {
  if (!isRecord(document) || !isRecord(document["names"]))
    return fail("invalid-document", 'nostr.json must be an object with a "names" object');
  const pubkey = document["names"][address.name];
  if (pubkey === undefined) return fail("name-not-found", `"${address.name}" is not listed`);
  // NIP-05 mandates hex (not npub) keys in nostr.json.
  if (typeof pubkey !== "string" || !/^[0-9a-f]{64}$/.test(pubkey))
    return fail("invalid-document", `Pubkey for "${address.name}" must be 64 lowercase hex chars`);
  if (pubkey !== expectedPubkey.toLowerCase())
    return fail("pubkey-mismatch", "The domain lists a different pubkey for this name");
  const relayMap = document["relays"];
  if (relayMap === undefined) return ok({ pubkey, relays: [] });
  const relays = isRecord(relayMap) ? (relayMap[pubkey] ?? []) : null;
  if (!Array.isArray(relays) || !relays.every((r) => typeof r === "string"))
    return fail("invalid-document", '"relays" must map pubkeys to lists of URLs');
  return ok({ pubkey, relays });
};
