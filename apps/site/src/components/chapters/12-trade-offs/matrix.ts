/**
 * Comparison matrix data + scoring. Ratings are editorial judgements (explained per cell in i18n),
 * kept here as numbers so ranking is pure and testable.
 */

export const PLATFORMS = ["nostr", "x", "mastodon", "bluesky"] as const;
export type PlatformId = (typeof PLATFORMS)[number];

export const CRITERIA = [
  "identity",
  "censorship",
  "portability",
  "spam",
  "discovery",
  "moderation",
  "availability",
  "recovery",
  "openness",
] as const;
export type CriterionId = (typeof CRITERIA)[number];

/** 0 = weak, 1 = mixed, 2 = strong. */
export type Rating = 0 | 1 | 2;
export type RatingName = "poor" | "mixed" | "good";
export const RATING_NAMES: Readonly<Record<Rating, RatingName>> = {
  0: "poor",
  1: "mixed",
  2: "good",
};

export const RATINGS: Readonly<Record<CriterionId, Readonly<Record<PlatformId, Rating>>>> = {
  identity: { nostr: 2, x: 0, mastodon: 1, bluesky: 1 },
  censorship: { nostr: 2, x: 0, mastodon: 1, bluesky: 1 },
  portability: { nostr: 2, x: 0, mastodon: 1, bluesky: 2 },
  spam: { nostr: 0, x: 1, mastodon: 1, bluesky: 1 },
  discovery: { nostr: 0, x: 2, mastodon: 1, bluesky: 2 },
  moderation: { nostr: 2, x: 0, mastodon: 1, bluesky: 2 },
  availability: { nostr: 1, x: 2, mastodon: 1, bluesky: 2 },
  recovery: { nostr: 0, x: 2, mastodon: 2, bluesky: 2 },
  openness: { nostr: 2, x: 0, mastodon: 2, bluesky: 2 },
};

export const PRESETS = {
  balanced: [],
  dissident: ["identity", "censorship", "portability"],
  casual: ["discovery", "spam", "recovery"],
  builder: ["openness", "portability", "identity"],
} as const satisfies Record<string, readonly CriterionId[]>;
export type PresetId = keyof typeof PRESETS;
export const PRESET_IDS = Object.keys(PRESETS) as readonly PresetId[];

/** A ticked criterion weighs this much more than an unticked one. */
export const PRIORITY_WEIGHT = 4;

export interface PlatformScore {
  readonly platform: PlatformId;
  /** 0–100, rounded. */
  readonly score: number;
}

/** Weighted share of the maximum possible rating; highest first, ties keep PLATFORMS order. */
export const rankPlatforms = (priorities: ReadonlySet<CriterionId>): readonly PlatformScore[] => {
  const weight = (c: CriterionId) => (priorities.has(c) ? PRIORITY_WEIGHT : 1);
  const max = CRITERIA.reduce((sum, c) => sum + 2 * weight(c), 0);
  return PLATFORMS.map((platform) => ({
    platform,
    score: Math.round(
      (100 * CRITERIA.reduce((s, c) => s + RATINGS[c][platform] * weight(c), 0)) / max,
    ),
  })).toSorted((a, b) => b.score - a.score);
};

export const togglePriority = (
  priorities: ReadonlySet<CriterionId>,
  criterion: CriterionId,
): ReadonlySet<CriterionId> => {
  const next = new Set(priorities);
  if (!next.delete(criterion)) next.add(criterion);
  return next;
};

/** The preset whose selection equals the current one, if any (for aria-pressed on preset chips). */
export const matchingPreset = (priorities: ReadonlySet<CriterionId>): PresetId | undefined =>
  PRESET_IDS.find((id) => {
    const preset: readonly CriterionId[] = PRESETS[id];
    return preset.length === priorities.size && preset.every((c) => priorities.has(c));
  });
