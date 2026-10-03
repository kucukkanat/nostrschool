/** NIP-01 filter matching, with an explanation mode for the chapter 5 filter builder. */
import { err, ok, type ProtocolError, type Result } from "./result.ts";
import type { Filter, NostrEvent, TagFilterKey } from "./types.ts";

/** True if the event satisfies every condition in the filter (`limit`/`search` ignored). */
export const matchFilter = (filter: Filter, event: NostrEvent): boolean =>
  explainFilterMatch(filter, event).matches;

/** True if ANY filter matches (filters in one REQ are OR-ed). */
export const matchFilters = (filters: readonly Filter[], event: NostrEvent): boolean =>
  filters.some((f) => matchFilter(f, event));

export type FilterField = "ids" | "authors" | "kinds" | "since" | "until" | TagFilterKey;

export interface FilterCheck {
  readonly field: FilterField;
  readonly passed: boolean;
}

export interface FilterMatchExplanation {
  readonly matches: boolean;
  /** One entry per condition present in the filter, in a stable order (ids, authors, kinds, since, until, #tags). */
  readonly checks: readonly FilterCheck[];
}

/** Like `matchFilter`, but says which condition passed or failed. */
export const explainFilterMatch = (filter: Filter, event: NostrEvent): FilterMatchExplanation => {
  const { ids, authors, kinds, since, until } = filter;
  const checks: FilterCheck[] = [
    ...(ids === undefined ? [] : [{ field: "ids" as const, passed: ids.includes(event.id) }]),
    ...(authors === undefined
      ? []
      : [{ field: "authors" as const, passed: authors.includes(event.pubkey) }]),
    ...(kinds === undefined
      ? []
      : [{ field: "kinds" as const, passed: kinds.includes(event.kind) }]),
    ...(since === undefined
      ? []
      : [{ field: "since" as const, passed: event.created_at >= since }]),
    ...(until === undefined
      ? []
      : [{ field: "until" as const, passed: event.created_at <= until }]),
    ...tagFilterKeys(filter).map((field) => {
      const wanted = filter[field] ?? [];
      const name = field.slice(1);
      // NIP-01: only a tag's first value is indexed, so `#e` matches ["e", <id>, ...] on t[1].
      const passed = event.tags.some(
        (t) => t[0] === name && t[1] !== undefined && wanted.includes(t[1]),
      );
      return { field, passed };
    }),
  ];
  return { matches: checks.every((c) => c.passed), checks };
};

const TAG_KEY = /^#[a-zA-Z]$/;

/** Single-letter tag keys present in the filter, sorted for a stable explanation order. */
const tagFilterKeys = (filter: Filter): TagFilterKey[] =>
  Object.keys(filter)
    .filter((k): k is TagFilterKey => TAG_KEY.test(k) && filter[k as TagFilterKey] !== undefined)
    .sort();

export type FilterErrorCode = "not-an-object" | "invalid-field" | "unknown-field";
export interface FilterError extends ProtocolError<FilterErrorCode> {
  readonly field?: string;
}

/** Validates unknown input (e.g. a REQ from the wire or the filter playground) as a Filter. */
export const validateFilter = (input: unknown): Result<Filter, FilterError> => {
  if (typeof input !== "object" || input === null || Array.isArray(input))
    return err({ code: "not-an-object", message: "A filter must be a JSON object" });
  const entries = Object.entries(input as Record<string, unknown>);
  const invalid = (field: string, message: string): Result<never, FilterError> =>
    err({ code: "invalid-field", message, field });
  for (const [field, value] of entries) {
    const check = FIELD_CHECKS[field] ?? (TAG_KEY.test(field) ? TAG_CHECK : undefined);
    if (check === undefined)
      return err({ code: "unknown-field", message: `Unknown filter field "${field}"`, field });
    if (!check.test(value)) return invalid(field, `${field} ${check.expected}`);
  }
  return ok(Object.fromEntries(entries) as Filter);
};

interface FieldCheck {
  readonly test: (v: unknown) => boolean;
  readonly expected: string;
}

const isUint = (v: unknown): boolean => typeof v === "number" && Number.isInteger(v) && v >= 0;
const arrayOf =
  (item: (v: unknown) => boolean) =>
  (v: unknown): boolean =>
    Array.isArray(v) && v.every(item);
const isHex64 = (v: unknown): boolean => typeof v === "string" && /^[0-9a-f]{64}$/.test(v);

const HEX_LIST: FieldCheck = {
  test: arrayOf(isHex64),
  expected: "must be a list of 64-char lowercase hex strings",
};
const UINT: FieldCheck = { test: isUint, expected: "must be a non-negative integer" };
const TAG_CHECK: FieldCheck = {
  test: arrayOf((v) => typeof v === "string"),
  expected: "must be a list of strings",
};
const FIELD_CHECKS: Readonly<Record<string, FieldCheck>> = {
  ids: HEX_LIST,
  authors: HEX_LIST,
  // NIP-01: #e and #p are the only tag filters whose values MUST be 64-char lowercase hex.
  "#e": HEX_LIST,
  "#p": HEX_LIST,
  kinds: {
    test: arrayOf((v) => isUint(v) && (v as number) <= 65535),
    expected: "must be a list of integers between 0 and 65535",
  },
  since: UINT,
  until: UINT,
  limit: UINT,
  search: { test: (v) => typeof v === "string", expected: "must be a string" },
};

/**
 * Applies a REQ's filters to a set of events the way a relay would: match any filter,
 * newest first, honoring each filter's `limit` for the initial batch.
 */
export const applyFilters = (
  filters: readonly Filter[],
  events: readonly NostrEvent[],
): readonly NostrEvent[] => {
  const sorted = [...events].sort(newestFirst);
  const picked = new Set(
    filters.flatMap((f) => {
      const matching = sorted.filter((e) => matchFilter(f, e));
      return f.limit === undefined ? matching : matching.slice(0, f.limit);
    }),
  );
  // A Set dedupes events matched by several filters; re-filtering `sorted` keeps global order.
  return sorted.filter((e) => picked.has(e));
};

/** NIP-01 ordering: newest `created_at` first; ties broken by lowest id. */
const newestFirst = (a: NostrEvent, b: NostrEvent): number =>
  b.created_at - a.created_at || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
