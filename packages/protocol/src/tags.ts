/** Small, pure tag helpers. */
import type { NostrEvent, Tag, UnsignedEvent } from "./types.ts";

/** First tag with this name, e.g. `getTag(e, "d")`. */
export const getTag = (event: Pick<UnsignedEvent, "tags">, name: string): Tag | undefined =>
  event.tags.find((t) => t[0] === name);

/** First value of every tag with this name, e.g. all `p` pubkeys. */
export const getTagValues = (event: Pick<UnsignedEvent, "tags">, name: string): readonly string[] =>
  event.tags.flatMap((t) => (t[0] === name && t[1] !== undefined ? [t[1]] : []));

/**
 * NIP-01 address of a replaceable/addressable event: `kind:pubkey:d-tag`
 * (empty d for plain replaceable kinds).
 */
export const eventAddress = (event: Pick<NostrEvent, "kind" | "pubkey" | "tags">): string =>
  `${event.kind}:${event.pubkey}:${getTag(event, "d")?.[1] ?? ""}`;
