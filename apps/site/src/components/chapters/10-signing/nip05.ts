/**
 * NIP-05 verification as a step-by-step flow over an in-memory "internet" of demo domains
 * (no network: the demo never fetches real servers). Parsing and checking use the real
 * protocol functions. Spec: https://github.com/nostr-protocol/nips/blob/master/05.md
 */
import { getPersona, type PersonaId } from "@nostrschool/fixtures";
import {
  fail,
  type Hex,
  type Nip05Address,
  type Nip05ErrorCode,
  ok,
  type ProtocolError,
  parseNip05,
  type Result,
  verifyNip05Document,
} from "@nostrschool/protocol";

export type Nip05FlowErrorCode = Nip05ErrorCode | "fetch-failed";
export type Nip05FlowError = ProtocolError<Nip05FlowErrorCode>;

const pk = (id: PersonaId): Hex => getPersona(id).pubkey;

/** Each demo domain serves this `/.well-known/nostr.json` (hex keys, as NIP-05 requires). */
export const DEMO_DOCUMENTS: Readonly<Record<string, unknown>> = {
  "alpha.example": {
    names: { _: pk("alice"), alice: pk("alice"), erin: pk("erin"), grace: pk("grace") },
    relays: { [pk("alice")]: ["wss://relay.alpha.example", "wss://relay.beta.example"] },
  },
  "beta.example": {
    names: { bob: pk("bob"), carol: pk("carol"), dave: pk("dave"), frank: pk("frank") },
  },
};

export const fetchDemoDocument = (domain: string): Result<unknown, Nip05FlowError> => {
  const doc = DEMO_DOCUMENTS[domain];
  return doc === undefined
    ? fail("fetch-failed", `No server answered at https://${domain}/.well-known/nostr.json`)
    : ok(doc);
};

export interface Nip05Scenario {
  readonly id: "match" | "root" | "impostor" | "missing" | "nodomain" | "garbage";
  readonly identifier: string;
}

/** Every scenario is "Alice's profile (kind 0) claims this nip05". */
export const NIP05_SCENARIOS: readonly Nip05Scenario[] = [
  { id: "match", identifier: "alice@alpha.example" },
  { id: "root", identifier: "_@alpha.example" },
  { id: "impostor", identifier: "bob@beta.example" },
  { id: "missing", identifier: "zoe@alpha.example" },
  { id: "nodomain", identifier: "alice@nowhere.example" },
  { id: "garbage", identifier: "not an address!" },
];

export const NIP05_STAGES = ["parse", "url", "fetch", "compare"] as const;
export type Nip05Stage = (typeof NIP05_STAGES)[number];

export interface Nip05Flow {
  /** How far the check got: index into NIP05_STAGES of the last stage reached. */
  readonly reached: number;
  readonly address?: Nip05Address;
  readonly document?: unknown;
  readonly outcome: Result<{ pubkey: Hex; relays: readonly string[] }, Nip05FlowError>;
}

export const verifyNip05Flow = (
  identifier: string,
  claimedPubkey: Hex,
  fetchDocument: (domain: string) => Result<unknown, Nip05FlowError> = fetchDemoDocument,
): Nip05Flow => {
  const address = parseNip05(identifier);
  if (!address.ok) return { reached: 0, outcome: address };
  const doc = fetchDocument(address.value.domain);
  if (!doc.ok) return { reached: 2, address: address.value, outcome: doc };
  return {
    reached: 3,
    address: address.value,
    document: doc.value,
    outcome: verifyNip05Document(doc.value, address.value, claimedPubkey),
  };
};

/** What the domain's document says for `name` (whatever it is), for display next to the claim. */
export const listedPubkey = (document: unknown, name: string): string | undefined => {
  const names =
    typeof document === "object" && document !== null && "names" in document
      ? document.names
      : undefined;
  const value =
    typeof names === "object" && names !== null
      ? (names as Record<string, unknown>)[name]
      : undefined;
  return typeof value === "string" ? value : undefined;
};
