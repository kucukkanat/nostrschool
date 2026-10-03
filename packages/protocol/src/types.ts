/** Lowercase hex string. 64 chars for ids/pubkeys/secret keys, 128 for signatures. */
export type Hex = string;

/** Unix timestamp in seconds (NIP-01 `created_at`). */
export type UnixSeconds = number;

/** A tag: `[name, ...values]`, e.g. `["p", "<pubkey>", "wss://relay.example"]`. */
export type Tag = readonly [name: string, ...values: string[]];

/** What a user fills in before the client adds `pubkey`, `id` and `sig`. */
export interface EventTemplate {
  readonly kind: number;
  readonly created_at: UnixSeconds;
  readonly tags: readonly Tag[];
  readonly content: string;
}

/** An event with its author but not yet hashed or signed (the input to `serializeEvent`). */
export interface UnsignedEvent extends EventTemplate {
  readonly pubkey: Hex;
}

/** A complete, signed NIP-01 event as it travels over the wire. */
export interface NostrEvent extends UnsignedEvent {
  readonly id: Hex;
  readonly sig: Hex;
}

/** NIP-59 rumor: an event with an `id` but deliberately no `sig` (deniable). */
export interface Rumor extends UnsignedEvent {
  readonly id: Hex;
}

/** Single-letter tag filter key, e.g. `#e`, `#p`, `#t`. */
export type TagFilterKey = `#${string}`;

/**
 * NIP-01 subscription filter. All present conditions must match (AND); list values match
 * if any element matches (OR). Multiple filters in one REQ are OR-ed.
 */
export interface Filter {
  readonly ids?: readonly Hex[];
  readonly authors?: readonly Hex[];
  readonly kinds?: readonly number[];
  readonly since?: UnixSeconds;
  readonly until?: UnixSeconds;
  readonly limit?: number;
  /** NIP-50 full-text search (only some relays support it; ignored by `matchFilter`). */
  readonly search?: string;
  readonly [tag: TagFilterKey]: readonly string[] | undefined;
}

/** `wss://…` relay URL, normalized (lowercase host, no trailing slash). */
export type RelayUrl = string;
