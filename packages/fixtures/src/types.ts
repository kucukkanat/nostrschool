import type { Hex, NostrEvent, RelayUrl, Rumor } from "@nostrschool/protocol";

/** The cast. Stable ids; every chapter can rely on these names. */
export type PersonaId = "alice" | "bob" | "carol" | "dave" | "erin" | "frank" | "grace";

export interface RelayListEntry {
  readonly url: RelayUrl;
  readonly read: boolean;
  readonly write: boolean;
}

export interface Persona {
  readonly id: PersonaId;
  /** kind 0 `name` (handle-ish, lowercase). */
  readonly name: string;
  /** kind 0 `display_name`. */
  readonly displayName: string;
  readonly about: string;
  /**
   * Deterministic demo secret key = sha256(`nostrschool:persona:${id}`).
   * PUBLIC BY DESIGN — never use for anything real.
   */
  readonly secretKeyHex: Hex;
  readonly secretKey: Uint8Array;
  readonly pubkey: Hex;
  readonly npub: string;
  readonly nsec: string;
  /** Generated SVG avatar as a `data:image/svg+xml,…` URI (initials on a token-ish color). */
  readonly avatar: string;
  /** Initials shown when images are off, e.g. "A". */
  readonly initials: string;
  /** Lightning address (NIP-57 / LUD-16), e.g. `alice@wallet.alpha.example`. */
  readonly lud16: string;
  /** NIP-05 identifier, e.g. `alice@alpha.example`. */
  readonly nip05: string;
  /** NIP-65 relay list (mirrors the persona's kind 10002 event). */
  readonly relays: readonly RelayListEntry[];
}

export interface FixtureRelay {
  readonly url: RelayUrl;
  /** Short display name, e.g. "Alpha". */
  readonly name: string;
  readonly description: string;
  /** Simulated round-trip latency used by FixtureSource. */
  readonly latencyMs: number;
  /** Paid relays accept writes only from members (chapter 12). */
  readonly paid: boolean;
}

export interface FollowGraphNode {
  readonly pubkey: Hex;
  readonly personaId: PersonaId;
}
export interface FollowGraphEdge {
  /** Follower. */
  readonly from: Hex;
  /** Followed. */
  readonly to: Hex;
}
export interface FollowGraph {
  readonly nodes: readonly FollowGraphNode[];
  readonly edges: readonly FollowGraphEdge[];
}

/** One complete NIP-17 DM: every layer, plus who sent it to whom. */
export interface GiftWrapFixture {
  readonly sender: PersonaId;
  readonly recipient: PersonaId;
  readonly rumor: Rumor;
  readonly seal: NostrEvent;
  readonly wrap: NostrEvent;
}

/** One NIP-57 zap: the request (9734) and the receipt (9735) published by the LNURL server. */
export interface ZapFixture {
  readonly sender: PersonaId;
  readonly recipient: PersonaId;
  readonly amountMsats: number;
  readonly request: NostrEvent;
  readonly receipt: NostrEvent;
  /** The (fake, well-formed-looking) BOLT11 invoice string embedded in the receipt. */
  readonly bolt11: string;
}
