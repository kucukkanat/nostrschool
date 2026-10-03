/**
 * Corpus types: what `scripts/snapshot-nips.ts` extracts from github.com/nostr-protocol/nips at a
 * pinned commit. Everything here is plain JSON data (no functions, no Dates) so it can be
 * committed, imported at build time and passed to Svelte islands as props.
 */

/** A NIP id exactly as the repo names the file: two upper-case hex chars, e.g. "01", "5A", "C7". */
export type NipId = string;

export const NIP_ID_PATTERN: RegExp = /^[0-9A-F]{2}$/;

export const isNipId = (value: unknown): value is NipId =>
  typeof value === "string" && NIP_ID_PATTERN.test(value);

/**
 * Normalises user input ("1", "nip-01", "NIP 5a", "c7") to a NipId. Returns undefined for
 * anything that cannot be one; it does not check that the NIP exists.
 */
export const normalizeNipId = (input: string): NipId | undefined => {
  const raw = input
    .trim()
    .replace(/^nip[-_\s]?/i, "")
    .toUpperCase();
  const id = /^\d$/.test(raw) ? `0${raw}` : raw;
  return isNipId(id) ? id : undefined;
};

/**
 * One lifecycle label per NIP, the primary filter facet:
 * - `final` / `draft`: the maturity tag in the NIP header, recommended for use.
 * - `unrecommended`: struck through in the README list (reason in `unrecommended.reason`).
 * - `deprecated`: merged into another NIP and dropped from the list ("Moved to NIP-01").
 */
export type NipStatus = "final" | "draft" | "unrecommended" | "deprecated";
export const NIP_STATUSES: readonly NipStatus[] = ["final", "draft", "unrecommended", "deprecated"];

export type NipMaturity = "draft" | "final";
export type NipRequirement = "mandatory" | "optional";

/** A kind the README's kinds table attributes to this NIP. `to` makes it an inclusive range. */
export interface NipKindRef {
  readonly kind: number;
  readonly to?: number;
  readonly description: string;
  /** The table marks this kind "(deprecated)" for this NIP. */
  readonly deprecated?: boolean;
}

export type MessageDirection = "client-to-relay" | "relay-to-client";

/** A wire message type from the README's message tables ("REQ", "EOSE", …). */
export interface NipMessageRef {
  readonly type: string;
  readonly direction: MessageDirection;
  readonly description: string;
}

export interface NipUnrecommended {
  /** README wording after "unrecommended:", e.g. "deprecated in favor of NIP-17". */
  readonly reason: string;
  /** NIPs the reason points to instead. */
  readonly replacedBy: readonly NipId[];
}

/** One heading-delimited chunk of the NIP markdown. `id` is the GitHub-style anchor slug. */
export interface NipSection {
  readonly id: string;
  readonly heading: string;
  /** 1–6; the untitled text before the first heading is level 0 with id "intro". */
  readonly level: number;
  readonly markdown: string;
}

/** Lightweight per-NIP metadata (`data/index.json`): safe to ship to the browser. */
export interface NipMeta {
  readonly id: NipId;
  /** Plain-text title (backticks stripped), from the README list or the NIP header. */
  readonly title: string;
  /** First prose paragraph of the NIP as plain text (English spec prose), ≤ 320 chars. */
  readonly summary: string;
  readonly status: NipStatus;
  readonly maturity: NipMaturity | null;
  readonly requirement: NipRequirement | null;
  /** Header carries the `relay` tag: relays need to implement something. */
  readonly relay: boolean;
  /** Raw header tags, e.g. ["draft", "optional", "relay"]. */
  readonly statusTags: readonly string[];
  /** Present in the README list. */
  readonly listed: boolean;
  readonly unrecommended?: NipUnrecommended;
  /** "Moved to [NIP-01]" stubs point here. */
  readonly movedTo?: NipId;
  /** Kinds attributed to this NIP by the README kinds table. */
  readonly kinds: readonly NipKindRef[];
  /** Every `"kind": N` that appears in the NIP's JSON examples (sorted, unique). */
  readonly exampleKinds: readonly number[];
  readonly messages: readonly NipMessageRef[];
  /** Tag names used in the NIP's examples, e.g. ["e", "p", "relays"] (heuristic, sorted). */
  readonly tags: readonly string[];
  /** Identifier-like inline code from the prose (`supported_nips`, `nostrconnect://`), for keyword search. */
  readonly idents: readonly string[];
  /** Other NIPs this one links to or names ("NIP-19", "(19.md)"), sorted. */
  readonly mentions: readonly NipId[];
  /** Reverse of `mentions`. */
  readonly mentionedBy: readonly NipId[];
  /** Section headings (levels 1–3) in order, for search and the table of contents. */
  readonly headings: readonly string[];
  /** GitHub URL of the file at the snapshot commit. */
  readonly url: string;
  /** ISO date of the last commit touching the file, or null if history was unavailable. */
  readonly updatedAt: string | null;
  readonly wordCount: number;
}

/** Full document (`data/corpus.json`): build-time only — it carries the whole markdown. */
export interface NipDocument extends NipMeta {
  readonly markdown: string;
  readonly sections: readonly NipSection[];
}

export interface NipCorpusSource {
  readonly repo: string;
  /** Full commit SHA the snapshot was taken at. */
  readonly commit: string;
  /** ISO date of that commit. */
  readonly committedAt: string;
  /** ISO date the snapshot script ran. */
  readonly snapshotAt: string;
}

/** A README kinds-table row, including kinds whose spec lives outside the repo (nips empty). */
export interface KindRegistryRow {
  readonly kind: number;
  readonly to?: number;
  readonly description: string;
  readonly nips: readonly NipId[];
  /** Raw "NIP" column when it is not a NIP of this repo, e.g. "NKBIP-03", "Marmot". */
  readonly external?: string;
}

export interface MessageRegistryRow extends NipMessageRef {
  readonly nips: readonly NipId[];
}

export interface NipIndex {
  readonly source: NipCorpusSource;
  readonly nips: readonly NipMeta[];
  readonly kinds: readonly KindRegistryRow[];
  readonly messages: readonly MessageRegistryRow[];
}

export interface NipCorpus {
  readonly source: NipCorpusSource;
  readonly nips: readonly NipDocument[];
  readonly kinds: readonly KindRegistryRow[];
  readonly messages: readonly MessageRegistryRow[];
}
