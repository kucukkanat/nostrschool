/**
 * FINAL list of glossary term ids. `<Term id="…">` and the glossary page are typed against it.
 * Owner: integrator — ask before adding (every locale must then define the new entry).
 */
export const GLOSSARY_IDS = [
  "nostr",
  "relay",
  "client",
  "event",
  "kind",
  "tag",
  "pubkey",
  "privkey",
  "npub",
  "nsec",
  "keypair",
  "secp256k1",
  "schnorr",
  "signature",
  "hash",
  "sha256",
  "bech32",
  "nip",
  "nip01",
  "nip04",
  "nip05",
  "nip07",
  "nip17",
  "nip19",
  "nip23",
  "nip42",
  "nip44",
  "nip46",
  "nip57",
  "nip59",
  "nip65",
  "filter",
  "subscription",
  "req",
  "eose",
  "websocket",
  "zap",
  "lightning",
  "lnurl",
  "lud16",
  "outbox-model",
  "follow-list",
  "gift-wrap",
  "seal",
  "rumor",
  "bunker",
  "replaceable-event",
  "ephemeral-event",
  "addressable-event",
  "federation",
  "censorship-resistance",
  "proof-of-work",
  "nevent",
  "nprofile",
  "naddr",
  "note",
  "metadata",
  "reaction",
  "repost",
  "deletion",
  "paid-relay",
  "web-of-trust",
  "ecdh",
  "encryption",
  "direct-message",
  "long-form",
  "event-id",
  "signer",
  "key-loss",
  "spam",
  "invoice",
  "nip11",
  "ncryptsec",
] as const;

export type GlossaryId = (typeof GLOSSARY_IDS)[number];

export interface GlossaryEntry {
  /** Display name of the term, e.g. "Relay". */
  readonly term: string;
  /** One or two sentences for the hover-card. Plain text. */
  readonly short: string;
  /** Full definition for the glossary page. Plain text; blank lines separate paragraphs. */
  readonly long: string;
  /** Related terms, rendered as links. */
  readonly seeAlso?: readonly GlossaryId[];
  /** Relevant NIP numbers, e.g. ["01", "65"]. */
  readonly nips?: readonly string[];
}

export type Glossary = Readonly<Record<GlossaryId, GlossaryEntry>>;
