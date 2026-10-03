/**
 * Pure state + logic for the /nips browser: the URL query string ↔ state round trip, the extra
 * facets the site adds on top of `NipFilters` (kind type, has-editor, taught-in-course), result
 * ordering and highlight segmentation. No DOM, so every rule is unit-tested in Bun.
 */
import { format, formatNumber, getDictionary, type Locale } from "@nostrschool/i18n";
import { isStopWord, type SemanticState } from "@nostrschool/nip-search";
import {
  isNipId,
  matchesFilters,
  NIP_SORTS,
  NIP_SPEC_VARIANTS,
  NIP_STATUSES,
  type NipFilters,
  type NipId,
  type NipListing,
  type NipMeta,
  type NipSort,
  type NipSpecVariant,
  type NipStatus,
  sortNips,
} from "@nostrschool/nips";
import { classifyKind, KIND_CATEGORIES, type KindCategory } from "@nostrschool/protocol";

export type BrowseSort = NipSort | "relevance";
export const BROWSE_SORTS: readonly BrowseSort[] = ["relevance", ...NIP_SORTS];
export type BrowseView = "grid" | "list";
export const BROWSE_VIEWS: readonly BrowseView[] = ["grid", "list"];

export interface BrowseState {
  readonly q: string;
  readonly statuses: readonly NipStatus[];
  readonly variants: readonly NipSpecVariant[];
  readonly categories: readonly KindCategory[];
  readonly kind?: number;
  readonly relay: boolean;
  readonly editor: boolean;
  readonly course: boolean;
  /** Undefined = automatic: best match while searching, NIP number otherwise. */
  readonly sort?: BrowseSort;
  readonly view: BrowseView;
}

export const DEFAULT_BROWSE_STATE: BrowseState = {
  q: "",
  statuses: [],
  variants: [],
  categories: [],
  relay: false,
  editor: false,
  course: false,
  view: "grid",
};

/** What the list page knows about each spec, passed to the island instead of the whole spec. */
export interface SpecSummary {
  readonly variant: NipSpecVariant;
  readonly todo: boolean;
}

/** Same join as `listNips()` (build-time only), done in the browser from the light index. */
export const buildListings = (
  nips: readonly NipMeta[],
  specs: { readonly [id: NipId]: SpecSummary },
): readonly NipListing[] =>
  nips.flatMap((meta) => {
    const spec = specs[meta.id];
    return spec === undefined ? [] : [{ ...meta, variant: spec.variant, todo: spec.todo }];
  });

// ── Query string ─────────────────────────────────────────────────────────────────────────────

const PARAM = {
  q: "q",
  statuses: "status",
  variants: "defines",
  categories: "type",
  kind: "kind",
  relay: "relay",
  editor: "editor",
  course: "course",
  sort: "sort",
  view: "view",
} as const;

const listParam = <T extends string>(
  params: URLSearchParams,
  name: string,
  allowed: readonly T[],
): readonly T[] => {
  const values = new Set(
    params
      .getAll(name)
      .flatMap((v) => v.split(","))
      .map((v) => v.trim()),
  );
  // Keep the canonical order so equal states serialise identically.
  return allowed.filter((a) => values.has(a));
};

const oneOf = <T extends string>(value: string | null, allowed: readonly T[]): T | undefined =>
  allowed.find((a) => a === value);

const flag = (params: URLSearchParams, name: string): boolean => params.get(name) === "1";

/** Tolerant parse: unknown or malformed values are dropped, never thrown on (it's a URL). */
export const parseBrowseState = (search: string): BrowseState => {
  const params = new URLSearchParams(search);
  const kindText = params.get(PARAM.kind) ?? "";
  const kind = /^\d{1,5}$/.test(kindText) ? Number(kindText) : undefined;
  const sort = oneOf(params.get(PARAM.sort), BROWSE_SORTS);
  return {
    q: (params.get(PARAM.q) ?? "").slice(0, 200),
    statuses: listParam(params, PARAM.statuses, NIP_STATUSES),
    variants: listParam(params, PARAM.variants, NIP_SPEC_VARIANTS),
    categories: listParam(params, PARAM.categories, KIND_CATEGORIES),
    ...(kind === undefined ? {} : { kind }),
    relay: flag(params, PARAM.relay),
    editor: flag(params, PARAM.editor),
    course: flag(params, PARAM.course),
    ...(sort === undefined ? {} : { sort }),
    view: oneOf(params.get(PARAM.view), BROWSE_VIEWS) ?? "grid",
  };
};

/** Only non-default values, so the plain page keeps a clean URL. "" or "?…". */
export const serializeBrowseState = (state: BrowseState): string => {
  const params = new URLSearchParams();
  const q = state.q.trim();
  if (q !== "") params.set(PARAM.q, q);
  if (state.statuses.length > 0) params.set(PARAM.statuses, state.statuses.join(","));
  if (state.variants.length > 0) params.set(PARAM.variants, state.variants.join(","));
  if (state.categories.length > 0) params.set(PARAM.categories, state.categories.join(","));
  if (state.kind !== undefined) params.set(PARAM.kind, String(state.kind));
  if (state.relay) params.set(PARAM.relay, "1");
  if (state.editor) params.set(PARAM.editor, "1");
  if (state.course) params.set(PARAM.course, "1");
  if (state.sort !== undefined) params.set(PARAM.sort, state.sort);
  if (state.view !== "grid") params.set(PARAM.view, state.view);
  const text = params.toString();
  return text === "" ? "" : `?${text}`;
};

/** Adds (on) or removes (off) one value of a multi-value facet. */
export const toggleValue = <T>(list: readonly T[], value: T, on: boolean): readonly T[] =>
  on ? [...list.filter((v) => v !== value), value] : list.filter((v) => v !== value);

/** Sets or removes the kind facet (an optional property can't be "set to undefined"). */
export const withKind = (state: BrowseState, kind: number | undefined): BrowseState => {
  const { kind: _previous, ...rest } = state;
  return kind === undefined ? rest : { ...rest, kind };
};

/** Number of narrowing facets in use (the query and sort/view don't count). */
export const activeFilterCount = (state: BrowseState): number =>
  [
    state.statuses.length > 0,
    state.variants.length > 0,
    state.categories.length > 0,
    state.kind !== undefined,
    state.relay,
    state.editor,
    state.course,
  ].filter(Boolean).length;

export const clearFilters = (state: BrowseState): BrowseState => ({
  ...DEFAULT_BROWSE_STATE,
  q: state.q,
  view: state.view,
  ...(state.sort === undefined ? {} : { sort: state.sort }),
});

// ── Filtering ────────────────────────────────────────────────────────────────────────────────

/** Storage types of every kind a NIP defines (ranges at both ends) or shows in its examples. */
export const kindCategoriesOf = (meta: NipMeta): ReadonlySet<KindCategory> =>
  new Set(
    [
      ...meta.kinds.flatMap((k) => (k.to === undefined ? [k.kind] : [k.kind, k.to])),
      ...meta.exampleKinds,
    ].map(classifyKind),
  );

export const toNipFilters = (state: BrowseState): NipFilters => ({
  statuses: state.statuses,
  variants: state.variants,
  relay: state.relay,
  ...(state.kind === undefined ? {} : { kind: state.kind }),
});

/** Every facet (NipFilters + the site's own), AND across facets, OR within one. */
export const matchesBrowse = (
  nip: NipListing,
  state: BrowseState,
  courseIds: ReadonlySet<NipId>,
): boolean =>
  matchesFilters(nip, toNipFilters(state)) &&
  (!state.editor || !nip.todo) &&
  (!state.course || courseIds.has(nip.id)) &&
  (state.categories.length === 0 ||
    [...kindCategoriesOf(nip)].some((c) => state.categories.includes(c)));

/** The sort actually applied: "relevance" only means something while there is a query. */
export const effectiveSort = (state: BrowseState): BrowseSort => {
  const searching = state.q.trim() !== "";
  if (state.sort === undefined) return searching ? "relevance" : "id";
  return state.sort === "relevance" && !searching ? "id" : state.sort;
};

/**
 * The visible NIPs in display order. `rankedIds` is the search result order (undefined = no
 * query: everything matches); NIPs the search didn't return are dropped.
 */
export const orderNips = <T extends NipListing>(
  nips: readonly T[],
  state: BrowseState,
  courseIds: ReadonlySet<NipId>,
  rankedIds: readonly NipId[] | undefined,
  locale: string,
): readonly T[] => {
  const allowed = nips.filter((n) => matchesBrowse(n, state, courseIds));
  const sort = effectiveSort(state);
  if (rankedIds === undefined) return sortNips(allowed, sort === "relevance" ? "id" : sort, locale);
  const byId = new Map(allowed.map((n) => [n.id, n]));
  const hits = rankedIds.flatMap((id) => {
    const nip = byId.get(id);
    return nip === undefined ? [] : [nip];
  });
  return sort === "relevance" ? hits : sortNips(hits, sort, locale);
};

/** A course chapter that teaches a NIP (from chapter frontmatter `nips`). */
export interface CourseLink {
  readonly nn: string;
  readonly title: string;
  readonly href: string;
}

export type CourseMap = { readonly [id: NipId]: readonly CourseLink[] };

/** NIP ids at least one chapter teaches. */
export const courseNipIds = (course: CourseMap): ReadonlySet<NipId> =>
  new Set(Object.keys(course).filter((id) => isNipId(id) && (course[id]?.length ?? 0) > 0));

// ── Highlighting ─────────────────────────────────────────────────────────────────────────────

export interface Segment {
  readonly text: string;
  readonly match: boolean;
}

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Splits `text` into plain and matched runs for `<mark>`. Terms shorter than 2 characters and
 * English/Spanish stop words ("with", "the", "de", "la") are ignored: they would light up half
 * the text (inside other words too) and the search ignores them anyway. Longest terms win where
 * they overlap.
 */
export const highlightSegments = (text: string, terms: readonly string[]): readonly Segment[] => {
  const usable = [...new Set(terms.map((t) => t.trim().toLowerCase()))]
    .filter((t) => t.length >= 2 && !isStopWord(t))
    .sort((a, b) => b.length - a.length);
  if (usable.length === 0 || text === "") return text === "" ? [] : [{ text, match: false }];
  const pattern = new RegExp(`(${usable.map(escapeRegExp).join("|")})`, "gi");
  return text
    .split(pattern)
    .filter((part) => part !== "")
    .map((part) => ({ text: part, match: usable.includes(part.toLowerCase()) }));
};

/**
 * Meaningful words of the free-text query, for highlighting alongside the engine's matched terms
 * (stop words in either language dropped, see `highlightSegments`).
 */
export const queryWords = (q: string): readonly string[] =>
  q
    .split(/\s+/)
    .map((w) => w.replace(/^(?:#|tag:|k(?:ind)?:|nip[-_]?)/i, ""))
    .filter((w) => w.length >= 2 && !isStopWord(w));

// ── Semantic status ──────────────────────────────────────────────────────────────────────────

/** The status line under the search box for each state of the on-device model. */
export const semanticMessage = (locale: Locale, s: SemanticState): string => {
  const t = getDictionary(locale).nips.ui.search;
  if (s.status === "idle") return t.semanticIdle;
  if (s.status === "loading")
    return s.progress === undefined
      ? t.semanticLoading
      : format(t.semanticProgress, { percent: formatNumber(locale, Math.round(s.progress * 100)) });
  if (s.status === "ready") return t.semanticReady;
  if (s.reason === "offline") return t.semanticOffline;
  if (s.reason === "save-data") return t.semanticSaveData;
  return t.semanticUnavailable;
};
