/** Pure model for the redundancy lab: a note survives while any relay holding it is online. */
export type RelayId = "alpha" | "beta" | "gamma" | "delta";
export const RELAY_IDS: readonly RelayId[] = ["alpha", "beta", "gamma", "delta"];

export interface RelayCard {
  readonly id: RelayId;
  readonly published: boolean;
  readonly online: boolean;
}

export type Verdict = "unpublished" | "safe" | "lost";

/** Starts like a typical client: published to two relays, everything online. */
export const INITIAL_CARDS: readonly RelayCard[] = RELAY_IDS.map((id) => ({
  id,
  published: id === "alpha" || id === "beta",
  online: true,
}));

export const publishedCount = (cards: readonly RelayCard[]): number =>
  cards.filter((c) => c.published).length;

export const aliveCount = (cards: readonly RelayCard[]): number =>
  cards.filter((c) => c.published && c.online).length;

export const verdict = (cards: readonly RelayCard[]): Verdict =>
  publishedCount(cards) === 0 ? "unpublished" : aliveCount(cards) > 0 ? "safe" : "lost";

export const toggle = (
  cards: readonly RelayCard[],
  id: RelayId,
  field: "published" | "online",
): readonly RelayCard[] => cards.map((c) => (c.id === id ? { ...c, [field]: !c[field] } : c));

/** The outage that hurts most: the first online relay that still holds a copy. */
export const nextVictim = (cards: readonly RelayCard[]): RelayId | undefined =>
  cards.find((c) => c.published && c.online)?.id;

/**
 * "Redundancy paid off": at least one relay holding the note is down, yet a copy is still
 * reachable. Triggers the mascot's celebration.
 */
export const survivedOutage = (cards: readonly RelayCard[]): boolean =>
  verdict(cards) === "safe" && cards.some((c) => c.published && !c.online);
