import {
  bytesToHex,
  deriveSecretKey,
  encodeNpub,
  encodeNsec,
  getPublicKey,
  type Hex,
  type RelayUrl,
  unwrap,
} from "@nostrschool/protocol";
import type { Persona, PersonaId, RelayListEntry } from "./types.ts";

/** All persona ids in cast order. */
export const PERSONA_IDS: readonly PersonaId[] = [
  "alice",
  "bob",
  "carol",
  "dave",
  "erin",
  "frank",
  "grace",
];

/** Fixed "now" (unix seconds, 2025-01-01T00:00:00Z) that every fixture timestamp is relative to. */
export const FIXTURE_NOW: number = 1735689600;

/**
 * Deterministic demo key: sha256(utf8(label)). Every label we use yields a valid secp256k1
 * scalar (asserted by tests), so no retry loop is needed.
 */
export const deriveFixtureKey = (label: string): Uint8Array => deriveSecretKey(label);

const ALPHA: RelayUrl = "wss://relay.alpha.example";
const BETA: RelayUrl = "wss://relay.beta.example";
const GAMMA: RelayUrl = "wss://relay.gamma.example";
const DELTA: RelayUrl = "wss://relay.delta.example";

const rw = (url: RelayUrl): RelayListEntry => ({ url, read: true, write: true });
const readOnly = (url: RelayUrl): RelayListEntry => ({ url, read: true, write: false });
const writeOnly = (url: RelayUrl): RelayListEntry => ({ url, read: false, write: true });

interface PersonaSpec {
  readonly displayName: string;
  readonly about: string;
  /** Avatar background. Data (baked into an SVG data URI), not UI styling, so no tokens here. */
  readonly color: string;
  readonly walletDomain: WalletDomain;
  readonly relays: readonly RelayListEntry[];
}

// Relay lists are chosen so the outbox model has something to teach: nobody shares exactly the
// same set, Gamma is only reachable through bob/carol/erin/grace, and the paid Delta relay is
// write-only for its members (nobody uses a paid relay as an inbox).
const SPECS: Readonly<Record<PersonaId, PersonaSpec>> = {
  alice: {
    displayName: "Alice",
    about: "Protocol nerd. I explain Nostr one event at a time.",
    color: "#7c3aed",
    walletDomain: "wallet.alpha.example",
    relays: [rw(ALPHA), rw(BETA)],
  },
  bob: {
    displayName: "Bob",
    about: "Bitcoin farmer. Asks the questions everyone is thinking.",
    color: "#f97316",
    walletDomain: "wallet.beta.example",
    relays: [rw(BETA), readOnly(GAMMA)],
  },
  carol: {
    displayName: "Carol",
    about: "Photographer. Morning walks, film cameras, long threads.",
    color: "#0d9488",
    walletDomain: "wallet.beta.example",
    relays: [rw(GAMMA), writeOnly(ALPHA)],
  },
  dave: {
    displayName: "Dave",
    about: "I run relay.delta.example. Ask me about relays, uptime and spam.",
    color: "#2563eb",
    walletDomain: "wallet.beta.example",
    relays: [writeOnly(DELTA), rw(ALPHA)],
  },
  erin: {
    displayName: "Erin",
    about: "Artist. Drawing one weird animal per day. Zaps keep me caffeinated.",
    color: "#db2777",
    walletDomain: "wallet.alpha.example",
    relays: [rw(ALPHA), rw(GAMMA)],
  },
  frank: {
    displayName: "Frank",
    about: "Journalist. Long-form essays about the open web.",
    color: "#65a30d",
    walletDomain: "wallet.beta.example",
    relays: [rw(BETA), writeOnly(DELTA)],
  },
  grace: {
    displayName: "Grace",
    about: "New here! Learning Nostr and loving it.",
    color: "#ca8a04",
    walletDomain: "wallet.alpha.example",
    relays: [rw(GAMMA)],
  },
};

const avatarFor = (initials: string, color: string): string =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="32" fill="${color}"/><text x="32" y="42" font-family="sans-serif" font-size="28" font-weight="700" text-anchor="middle" fill="#ffffff">${initials}</text></svg>`,
  )}`;

const buildPersona = (id: PersonaId): Persona => {
  const spec = SPECS[id];
  const secretKey = deriveFixtureKey(`nostrschool:persona:${id}`);
  const pubkey = unwrap(getPublicKey(secretKey));
  const initials = spec.displayName.slice(0, 1).toUpperCase();
  return {
    id,
    name: id,
    displayName: spec.displayName,
    about: spec.about,
    secretKeyHex: bytesToHex(secretKey),
    secretKey,
    pubkey,
    npub: unwrap(encodeNpub(pubkey)),
    nsec: unwrap(encodeNsec(secretKey)),
    avatar: avatarFor(initials, spec.color),
    initials,
    lud16: `${id}@${spec.walletDomain}`,
    nip05: `${id}@${spec.walletDomain.replace(/^wallet\./, "")}`,
    relays: spec.relays,
  };
};

const BY_ID: Readonly<Record<PersonaId, Persona>> = {
  alice: buildPersona("alice"),
  bob: buildPersona("bob"),
  carol: buildPersona("carol"),
  dave: buildPersona("dave"),
  erin: buildPersona("erin"),
  frank: buildPersona("frank"),
  grace: buildPersona("grace"),
};

/** Every persona, in `PERSONA_IDS` order. */
export const PERSONAS: readonly Persona[] = PERSONA_IDS.map((id) => BY_ID[id]);

export const getPersona = (id: PersonaId): Persona => BY_ID[id];

export const personaByPubkey = (pubkey: Hex): Persona | undefined =>
  PERSONAS.find((p) => p.pubkey === pubkey);

export const isPersonaId = (x: string): x is PersonaId =>
  (PERSONA_IDS as readonly string[]).includes(x);

export type WalletDomain = "wallet.alpha.example" | "wallet.beta.example";

/** A Lightning wallet's LNURL server: it signs the zap receipts (kind 9735) for its users. */
export interface ZapService {
  readonly domain: WalletDomain;
  readonly secretKey: Uint8Array;
  readonly pubkey: Hex;
}

const zapService = (domain: WalletDomain): ZapService => {
  const secretKey = deriveFixtureKey(`nostrschool:zapper:${domain}`);
  return { domain, secretKey, pubkey: unwrap(getPublicKey(secretKey)) };
};

const SERVICES: Readonly<Record<WalletDomain, ZapService>> = {
  "wallet.alpha.example": zapService("wallet.alpha.example"),
  "wallet.beta.example": zapService("wallet.beta.example"),
};

/** The fake wallet providers behind the personas' `lud16` addresses. */
export const ZAP_SERVICES: readonly ZapService[] = Object.values(SERVICES);

export const zapServiceFor = (id: PersonaId): ZapService => SERVICES[SPECS[id].walletDomain];
