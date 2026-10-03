/** Pure helpers behind the chapter 11 islands: filtering, chart shaping and the view tour. */
import {
  type ClientEntry,
  type Count,
  type Focus,
  type GrowthPoint,
  PLATFORMS,
  type Platform,
} from "./schema.ts";

export const VIEWS = ["relays", "nips", "growth", "clients"] as const;
export type View = (typeof VIEWS)[number];

export const isView = (x: string): x is View => VIEWS.some((v) => v === x);

/** Fraction in [0, 1]; 0 for an empty total so meters never show NaN. */
export const share = (part: number, total: number): number =>
  total <= 0 ? 0 : Math.min(1, Math.max(0, part / total));

/** Returns a new set with `value` toggled (sets in $state are replaced, never mutated). */
export const toggleIn = <T>(set: ReadonlySet<T>, value: T): ReadonlySet<T> => {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
};

/**
 * Clients available on ANY selected platform (an empty selection means "any platform"),
 * optionally narrowed to one focus. Input order is preserved.
 */
export const filterClients = (
  items: readonly ClientEntry[],
  platforms: ReadonlySet<Platform>,
  focus: Focus | "all",
): readonly ClientEntry[] =>
  items.filter(
    (c) =>
      (platforms.size === 0 || c.platforms.some((p) => platforms.has(p))) &&
      (focus === "all" || c.focus === focus),
  );

/** Foci that actually occur, in first-seen order (so the chips never offer an empty filter). */
export const fociOf = (items: readonly ClientEntry[]): readonly Focus[] => [
  ...new Set(items.map((c) => c.focus)),
];

export interface ClientTreeNode {
  readonly id: string;
  readonly label: string;
  readonly value?: number;
  readonly children?: readonly ClientTreeNode[];
}

/** Platform → client tiles (value 1 each); ids are `platform-client` because apps repeat. */
export const clientTree = (
  items: readonly ClientEntry[],
  rootLabel: string,
  label: (p: Platform) => string,
): ClientTreeNode => ({
  id: "clients",
  label: rootLabel,
  children: PLATFORMS.map((p) => ({
    id: p,
    label: label(p),
    children: items
      .filter((c) => c.platforms.includes(p))
      .map((c) => ({ id: `${p}-${c.id}`, label: c.name, value: 1 })),
  })).filter((n) => n.children.length > 0),
});

/** Growth points as a LineChart series (dates parsed once here, not in the template). */
export const growthSeries = (
  growth: readonly GrowthPoint[],
  id: string,
  label: string,
): { id: string; label: string; points: readonly { x: Date; y: number }[] } => ({
  id,
  label,
  points: growth.map((g) => ({ x: new Date(`${g.date}T00:00:00Z`), y: g.count })),
});

/** The point at a slider index, clamped into range; undefined only for an empty series. */
export const growthAt = (growth: readonly GrowthPoint[], index: number): GrowthPoint | undefined =>
  growth[Math.min(Math.max(0, Math.round(index)), growth.length - 1)];

/** Replaces raw ids ("other", "unknown", "tor") with localized labels where we have one. */
export const relabel = (
  counts: readonly Count[],
  labels: Readonly<Record<string, string>>,
): readonly Count[] => counts.map((c) => ({ ...c, label: labels[c.id] ?? c.label }));

/** Largest bucket that is a real name (not "other"/"unknown"), for the narration sentence. */
export const topNamed = (counts: readonly Count[]): Count | undefined =>
  counts
    .filter((c) => c.id !== "other" && c.id !== "unknown")
    .reduce<Count | undefined>(
      (best, c) => (best === undefined || c.value > best.value ? c : best),
      undefined,
    );

/** Link to a NIP's text; ids are two hex chars ("01", "5A"). */
export const nipHref = (id: string): string =>
  `https://github.com/nostr-protocol/nips/blob/master/${id}.md`;

/** Records a visited view; returns the same set when nothing changed (keeps $state stable). */
export const markVisited = (visited: ReadonlySet<View>, view: View): ReadonlySet<View> =>
  visited.has(view) ? visited : new Set([...visited, view]);

/** True exactly once: the moment the last unseen view is visited. */
export const justCompleted = (before: ReadonlySet<View>, after: ReadonlySet<View>): boolean =>
  before.size < VIEWS.length && after.size === VIEWS.length;

/** Ease-out cubic: fast start, gentle landing — numbers "settle" onto their value. */
export const easeOutCubic = (t: number): number => 1 - (1 - Math.min(1, Math.max(0, t))) ** 3;

/** Count-up frame value at progress t ∈ [0, 1], rounded because counts are integers. */
export const countAt = (target: number, t: number): number => Math.round(target * easeOutCubic(t));
