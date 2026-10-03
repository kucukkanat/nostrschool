/**
 * Pure helpers behind the chapter 06 "periodic table" and the /tools/kinds page:
 * localization, search/filtering, NIP-01 ranges, kind-number parsing and grid keyboard moves.
 */
import type { Dictionary } from "@nostrschool/i18n";
import {
  classifyKind,
  fail,
  getKindInfo,
  KIND_CATEGORIES,
  KINDS,
  type KindCategory,
  type KindInfo,
  ok,
  type ProtocolError,
  type Result,
} from "@nostrschool/protocol";
import { mediaUp } from "@nostrschool/tokens";

export interface KindEntry extends KindInfo {
  /** Localized name (falls back to the registry's English name). */
  readonly label: string;
  readonly description: string;
  /** Two-letter "element symbol" for the tile, derived from the localized name. */
  readonly symbol: string;
}

type KindTexts = Dictionary["kinds"]["names"];
type KindText = KindTexts[keyof KindTexts];

/** "Short text note" → "St", "Reaction" → "Re", "HTTP auth" → "Ha". */
export const kindSymbol = (label: string): string => {
  const words = label.split(/[\s-]+/).filter((w) => w !== "");
  const [first = "", second] = words;
  const letters = second === undefined ? first.slice(0, 2) : `${first[0] ?? ""}${second[0] ?? ""}`;
  return `${letters.slice(0, 1).toUpperCase()}${letters.slice(1).toLowerCase()}`;
};

/** Joins the registry with the locale's names; unknown keys fall back to English registry names. */
export const localizeKinds = (
  texts: KindTexts,
  infos: readonly KindInfo[] = KINDS,
): readonly KindEntry[] => {
  // Indexing by `k${number}` needs an index signature; the dictionary literal satisfies it.
  const byKey: Readonly<Record<string, KindText | undefined>> = texts;
  return infos.map((info) => {
    const text = byKey[info.i18nKey];
    const label = text?.name ?? info.name;
    return { ...info, label, description: text?.description ?? "", symbol: kindSymbol(label) };
  });
};

export const nipLabel = (nip: string): string => `NIP-${nip}`;

const normalize = (s: string): string => s.trim().toLowerCase();

/** Matches the kind number (prefix), the localized name/description, or the NIP ("57", "nip-57"). */
export const matchesQuery = (entry: KindEntry, query: string): boolean => {
  const q = normalize(query);
  if (q === "") return true;
  const nip = q.replace(/^nip-?/, "");
  return (
    String(entry.kind).startsWith(q) ||
    normalize(entry.label).includes(q) ||
    normalize(entry.description).includes(q) ||
    (nip !== "" && normalize(entry.nip) === nip)
  );
};

export interface KindQuery {
  readonly categories: ReadonlySet<KindCategory>;
  readonly query: string;
}

export const filterKinds = (
  entries: readonly KindEntry[],
  { categories, query }: KindQuery,
): readonly KindEntry[] =>
  entries.filter((e) => categories.has(e.category) && matchesQuery(e, query));

export const countByCategory = (
  entries: readonly KindEntry[],
): Readonly<Record<KindCategory, number>> =>
  Object.fromEntries(
    KIND_CATEGORIES.map((c) => [c, entries.filter((e) => e.category === c).length]),
  ) as Record<KindCategory, number>;

/** Toggles a category on/off without ever leaving zero categories selected (an empty grid teaches nothing). */
export const toggleCategory = (
  selected: ReadonlySet<KindCategory>,
  category: KindCategory,
): ReadonlySet<KindCategory> => {
  const next = new Set(selected);
  if (next.has(category)) next.delete(category);
  else next.add(category);
  return next.size === 0 ? selected : next;
};

/** Inclusive kind ranges per category, straight from NIP-01. */
export const CATEGORY_RANGES: Readonly<
  Record<KindCategory, readonly (readonly [number, number])[]>
> = {
  regular: [
    [1, 2],
    [4, 44],
    [1000, 9999],
  ],
  replaceable: [
    [0, 0],
    [3, 3],
    [10000, 19999],
  ],
  ephemeral: [[20000, 29999]],
  addressable: [[30000, 39999]],
};

export const formatRanges = (ranges: readonly (readonly [number, number])[]): string =>
  ranges.map(([a, b]) => (a === b ? String(a) : `${a}–${b}`)).join(", ");

export const MAX_KIND = 65535;

/** True when `kind` falls inside one of NIP-01's four ranges (45–999 and 40000+ do not). */
export const inNip01Range = (kind: number): boolean =>
  KIND_CATEGORIES.some((c) => CATEGORY_RANGES[c].some(([a, b]) => kind >= a && kind <= b));

export type KindNumberError = ProtocolError<"empty" | "not-an-integer" | "out-of-range">;

/** Parses user input into a kind (NIP-01: an integer between 0 and 65535). */
export const parseKindNumber = (input: string): Result<number, KindNumberError> => {
  const s = input.trim();
  if (s === "") return fail("empty", "no input");
  if (!/^-?\d+$/.test(s)) return fail("not-an-integer", `"${s}" is not an integer`);
  const n = Number(s);
  if (n < 0 || n > MAX_KIND) return fail("out-of-range", `${n} is outside 0..${MAX_KIND}`);
  return ok(n);
};

export interface KindLookup {
  readonly kind: number;
  readonly category: KindCategory;
  readonly inRange: boolean;
  readonly info: KindInfo | undefined;
}

export const describeKind = (kind: number): KindLookup => ({
  kind,
  category: classifyKind(kind),
  inRange: inNip01Range(kind),
  info: getKindInfo(kind),
});

/** Every category the user has opened at least once (drives the "explored" meter). */
export const exploredCategories = (kinds: Iterable<number>): ReadonlySet<KindCategory> =>
  new Set([...kinds].map(classifyKind));

/**
 * Roving focus inside a wrapping CSS grid: ←/→ move by one, ↑/↓ by a row, Home/End jump.
 * Returns undefined for keys the grid doesn't handle (so the browser keeps them).
 */
export const gridMove = (
  count: number,
  columns: number,
  from: number,
  key: string,
): number | undefined => {
  if (count === 0) return undefined;
  const cols = Math.max(1, columns);
  const clamp = (i: number) => Math.min(count - 1, Math.max(0, i));
  switch (key) {
    case "ArrowRight":
      return clamp(from + 1);
    case "ArrowLeft":
      return clamp(from - 1);
    case "ArrowDown":
      return from + cols < count ? from + cols : from;
    case "ArrowUp":
      return from - cols >= 0 ? from - cols : from;
    case "Home":
      return 0;
    case "End":
      return count - 1;
    default:
      return undefined;
  }
};

/** Number of columns a rendered CSS grid currently has (1 when it can't be measured, e.g. tests). */
export const gridColumns = (template: string): number => {
  // Count top-level tracks: whitespace inside parentheses (repeat(), minmax()) doesn't separate tracks.
  let depth = 0;
  let tracks = 0;
  let inTrack = false;
  for (const ch of template.trim() === "none" ? "" : template) {
    depth += ch === "(" ? 1 : ch === ")" ? -1 : 0;
    const separator = depth === 0 && /\s/.test(ch);
    if (!separator && !inTrack) tracks++;
    inTrack = !separator;
  }
  return Math.max(1, tracks);
};

/** The REQ a client sends to fetch this kind — shown as a copyable snippet. */
export const reqForKind = (kind: number): string =>
  JSON.stringify(["REQ", "kinds-demo", { kinds: [kind], limit: 10 }]);

/**
 * Below `tokens.breakpoint.lg` the detail panel stacks under the whole list (thousands of pixels
 * down on a phone), so picking a kind would otherwise change something the user cannot see.
 */
export const detailStacksBelow = (): boolean =>
  typeof globalThis.matchMedia === "function" && !globalThis.matchMedia(mediaUp("lg")).matches;

/**
 * Scrolls a stacked detail panel into view and focuses its heading (marked `data-detail-heading`),
 * so the tap gets a visible and announced response. Instant under reduced motion.
 */
export const revealDetail = (panel: HTMLElement | undefined, reduceMotion: boolean): void => {
  if (panel === undefined) return;
  panel.scrollIntoView({ block: "start", behavior: reduceMotion ? "auto" : "smooth" });
  panel.querySelector<HTMLElement>("[data-detail-heading]")?.focus({ preventScroll: true });
};
