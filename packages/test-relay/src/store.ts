/**
 * Pure relay storage rules (NIP-01): what to keep and what to replace. Kept free of sockets
 * so the rules are unit-testable on their own; matching/ordering come from the protocol package.
 */
import { classifyKind, eventAddress, type NostrEvent } from "@nostrschool/protocol";

export type InsertOutcome = "stored" | "duplicate" | "ephemeral" | "outdated";

export interface InsertResult {
  readonly events: readonly NostrEvent[];
  readonly outcome: InsertOutcome;
}

/** NIP-01: of two versions with the same `created_at`, the lowest id wins. */
const isNewer = (a: NostrEvent, b: NostrEvent): boolean =>
  a.created_at > b.created_at || (a.created_at === b.created_at && a.id < b.id);

/**
 * Returns the next store after receiving `event`. Ephemeral kinds are never stored;
 * replaceable/addressable kinds keep only the newest version per address.
 */
export const insertEvent = (events: readonly NostrEvent[], event: NostrEvent): InsertResult => {
  if (events.some((e) => e.id === event.id)) return { events, outcome: "duplicate" };
  const category = classifyKind(event.kind);
  if (category === "ephemeral") return { events, outcome: "ephemeral" };
  if (category === "regular") return { events: [...events, event], outcome: "stored" };
  const address = eventAddress(event);
  const sameAddress = (e: NostrEvent): boolean => eventAddress(e) === address;
  const previous = events.find(sameAddress);
  if (previous !== undefined && !isNewer(event, previous)) return { events, outcome: "outdated" };
  return { events: [...events.filter((e) => !sameAddress(e)), event], outcome: "stored" };
};
