/**
 * Pure model behind the chapter 05 filter builder and the /tools/filter-playground page.
 * The UI edits a `FilterDraft` (always-present, easy-to-toggle fields); `draftToFilter` turns it
 * into the exact NIP-01 filter a client would send, so what you see in the JSON view is the wire format.
 */
import { FIXTURE_EVENTS, getPersona, personaByPubkey } from "@nostrschool/fixtures";
import { format, formatDate, getDictionary, type Locale } from "@nostrschool/i18n";
import {
  applyFilters,
  err,
  explainFilterMatch,
  type Filter,
  type FilterCheck,
  getKindInfo,
  type NostrEvent,
  nip19Decode,
  ok,
  type ProtocolError,
  parseJson,
  type Result,
  type TagFilterKey,
  validateFilter,
} from "@nostrschool/protocol";

export const LIST_FIELDS = ["ids", "authors", "kinds", "#e", "#p", "#t"] as const;
export type ListField = (typeof LIST_FIELDS)[number];
const TAG_FIELDS = ["#e", "#p", "#t"] as const satisfies readonly ListField[];
export const NUMBER_FIELDS = ["since", "until", "limit"] as const;
export type NumberField = (typeof NUMBER_FIELDS)[number];

export interface FilterDraft {
  /** Normalized values; kinds are stored as decimal strings so every list shares one shape. */
  readonly lists: Readonly<Record<ListField, readonly string[]>>;
  readonly since: number | null;
  readonly until: number | null;
  readonly limit: number | null;
}

export const EMPTY_DRAFT: FilterDraft = {
  lists: { ids: [], authors: [], kinds: [], "#e": [], "#p": [], "#t": [] },
  since: null,
  until: null,
  limit: null,
};

export type ValueErrorCode =
  | "empty"
  | "invalid-id"
  | "invalid-pubkey"
  | "not-an-integer"
  | "out-of-range"
  | "invalid-hashtag"
  | "duplicate";
export type ValueError = ProtocolError<ValueErrorCode>;

const HEX64 = /^[0-9a-f]{64}$/;
const MAX_KIND = 65535;

/** Accepts 64-char hex or a NIP-19 entity that carries the wanted kind of value. */
const decodeHexOr = (
  raw: string,
  code: "invalid-id" | "invalid-pubkey",
): Result<string, ValueError> => {
  const value = raw.toLowerCase();
  if (HEX64.test(value)) return ok(value);
  const decoded = nip19Decode(raw);
  const fail = err<ValueError>({ code, message: `"${raw}" is not a valid value` });
  if (!decoded.ok) return fail;
  const { entity } = decoded.value;
  if (code === "invalid-id") {
    if (entity.type === "note") return ok(entity.data);
    if (entity.type === "nevent") return ok(entity.data.id);
    return fail;
  }
  if (entity.type === "npub") return ok(entity.data);
  if (entity.type === "nprofile") return ok(entity.data.pubkey);
  return fail;
};

/** Validates and normalizes one user-typed value for a list field. */
export const parseValue = (field: ListField, raw: string): Result<string, ValueError> => {
  const input = raw.trim();
  if (input === "") return err({ code: "empty", message: "Nothing to add" });
  switch (field) {
    case "ids":
    case "#e":
      return decodeHexOr(input, "invalid-id");
    case "authors":
    case "#p":
      return decodeHexOr(input, "invalid-pubkey");
    case "kinds": {
      if (!/^\d+$/.test(input))
        return err({ code: "not-an-integer", message: "Kinds are integers" });
      const kind = Number(input);
      return kind > MAX_KIND
        ? err({ code: "out-of-range", message: "Kinds go from 0 to 65535" })
        : ok(String(kind));
    }
    case "#t": {
      // NIP-24: hashtags in `t` tags are lowercase, written without the leading "#".
      const tag = input.replace(/^#/, "").toLowerCase();
      return tag === "" || /\s/.test(tag)
        ? err({ code: "invalid-hashtag", message: "A hashtag is one word" })
        : ok(tag);
    }
  }
};

const withList = (
  draft: FilterDraft,
  field: ListField,
  values: readonly string[],
): FilterDraft => ({
  ...draft,
  lists: { ...draft.lists, [field]: values },
});

/** Parses and appends a value; refuses duplicates so the UI can tell the user. */
export const addValue = (
  draft: FilterDraft,
  field: ListField,
  raw: string,
): Result<FilterDraft, ValueError> => {
  const parsed = parseValue(field, raw);
  if (!parsed.ok) return err(parsed.error);
  return draft.lists[field].includes(parsed.value)
    ? err({ code: "duplicate", message: "Already in the filter" })
    : ok(withList(draft, field, [...draft.lists[field], parsed.value]));
};

export const removeValue = (draft: FilterDraft, field: ListField, value: string): FilterDraft =>
  withList(
    draft,
    field,
    draft.lists[field].filter((v) => v !== value),
  );

/** Chip behavior: add if absent, remove if present (values are already normalized). */
export const toggleValue = (draft: FilterDraft, field: ListField, value: string): FilterDraft =>
  draft.lists[field].includes(value)
    ? removeValue(draft, field, value)
    : withList(draft, field, [...draft.lists[field], value]);

export const setNumber = (
  draft: FilterDraft,
  field: NumberField,
  value: number | null,
): FilterDraft => ({
  ...draft,
  [field]: value,
});

/** The NIP-01 filter object, with empty fields omitted (an empty list would match nothing). */
export const draftToFilter = (draft: FilterDraft): Filter => {
  const { lists } = draft;
  const tags = TAG_FIELDS.filter((k) => lists[k].length > 0).map((k) => [k, lists[k]] as const);
  return {
    ...(lists.ids.length > 0 ? { ids: lists.ids } : {}),
    ...(lists.authors.length > 0 ? { authors: lists.authors } : {}),
    ...(lists.kinds.length > 0 ? { kinds: lists.kinds.map(Number) } : {}),
    ...(Object.fromEntries(tags) as Readonly<Record<TagFilterKey, readonly string[]>>),
    ...(draft.since === null ? {} : { since: draft.since }),
    ...(draft.until === null ? {} : { until: draft.until }),
    ...(draft.limit === null ? {} : { limit: draft.limit }),
  };
};

export const isEmptyDraft = (draft: FilterDraft): boolean =>
  Object.keys(draftToFilter(draft)).length === 0;

export type DraftErrorCode = "invalid-json" | "invalid-filter" | "unsupported-field";
export interface DraftError extends ProtocolError<DraftErrorCode> {
  readonly field?: string;
}

const SUPPORTED = new Set<string>([...LIST_FIELDS, ...NUMBER_FIELDS]);

/** Turns a pasted filter (JSON text) back into a draft; only fields the builder can show are accepted. */
export const parseFilterJson = (text: string): Result<FilterDraft, DraftError> => {
  const parsed = parseJson(text);
  if (!parsed.ok) return parsed;
  const valid = validateFilter(parsed.value);
  if (!valid.ok) {
    const { field, message } = valid.error;
    return err({ code: "invalid-filter", message, ...(field === undefined ? {} : { field }) });
  }
  const filter = valid.value;
  const unsupported = Object.keys(filter).find((k) => !SUPPORTED.has(k));
  if (unsupported !== undefined)
    return err({
      code: "unsupported-field",
      message: `The builder can't show "${unsupported}"`,
      field: unsupported,
    });
  const strings = (v: readonly (string | number)[] | undefined) => (v ?? []).map(String);
  return ok({
    lists: {
      ids: strings(filter.ids),
      authors: strings(filter.authors),
      kinds: strings(filter.kinds),
      "#e": strings(filter["#e"]),
      "#p": strings(filter["#p"]),
      "#t": strings(filter["#t"]),
    },
    since: filter.since ?? null,
    until: filter.until ?? null,
    limit: filter.limit ?? null,
  });
};

/** What happened to one event under the current filter. */
export type RowState = "match" | "limited" | "miss";

export interface EvaluatedRow {
  readonly event: NostrEvent;
  readonly state: RowState;
  readonly checks: readonly FilterCheck[];
}

export interface Evaluation {
  readonly rows: readonly EvaluatedRow[];
  /** Events satisfying every condition, before `limit`. */
  readonly matching: number;
  /** Events the relay would actually send back (after `limit`), newest first. */
  readonly returnedIds: readonly string[];
}

/** Runs the filter like a relay would and keeps per-event explanations for the "why?" panel. */
export const evaluate = (filter: Filter, events: readonly NostrEvent[]): Evaluation => {
  const returned = applyFilters([filter], events);
  const returnedSet = new Set(returned.map((e) => e.id));
  const rows = applyFilters([{}], events).map((event): EvaluatedRow => {
    const { matches, checks } = explainFilterMatch(filter, event);
    const state: RowState = returnedSet.has(event.id) ? "match" : matches ? "limited" : "miss";
    return { event, state, checks };
  });
  return {
    rows,
    matching: rows.filter((r) => r.state !== "miss").length,
    returnedIds: returned.map((e) => e.id),
  };
};

export const sameIds = (a: readonly string[], b: readonly string[]): boolean =>
  a.length === b.length && a.every((id) => b.includes(id));

/** Public relays cap unbounded queries anyway; asking politely keeps live mode fast and cheap. */
export const withSafeLimit = (filter: Filter, max: number): Filter =>
  filter.limit === undefined || filter.limit > max ? { ...filter, limit: max } : filter;

export const reqMessage = (subId: string, filter: Filter): string =>
  JSON.stringify(["REQ", subId, filter]);

// ---------- labels & descriptions ----------

export const shortHex = (hex: string): string =>
  hex.length > 12 ? `${hex.slice(0, 6)}…${hex.slice(-4)}` : hex;

/** Persona name for fixture pubkeys, short hex otherwise. */
export const pubkeyLabel = (pubkey: string): string =>
  personaByPubkey(pubkey)?.displayName ?? shortHex(pubkey);

export const kindLabel = (locale: Locale, kind: number): string => {
  const info = getKindInfo(kind);
  const names: Readonly<Record<string, { readonly name: string } | undefined>> =
    getDictionary(locale).kinds.names;
  return info === undefined ? String(kind) : (names[info.i18nKey]?.name ?? info.name);
};

export const valueLabel = (locale: Locale, field: ListField, value: string): string => {
  switch (field) {
    case "authors":
    case "#p":
      return pubkeyLabel(value);
    case "kinds":
      return `${value} · ${kindLabel(locale, Number(value))}`;
    case "#t":
      return `#${value}`;
    case "ids":
    case "#e":
      return shortHex(value);
  }
};

export const formatTimestamp = (locale: Locale, seconds: number): string =>
  formatDate(locale, seconds * 1000, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  });

/** A plain-language sentence for the filter, used as the aria-live narration and the headline. */
export const describeDraft = (locale: Locale, draft: FilterDraft): string => {
  const t = getDictionary(locale).chapters.ch05.describe;
  if (isEmptyDraft(draft)) return t.everything;
  const join = (field: ListField) =>
    draft.lists[field].map((v) => valueLabel(locale, field, v)).join(t.or);
  const parts = [
    ...LIST_FIELDS.filter((f) => draft.lists[f].length > 0).map((f) =>
      format(t.fields[f], { values: join(f) }),
    ),
    ...(draft.since === null
      ? []
      : [format(t.since, { date: formatTimestamp(locale, draft.since) })]),
    ...(draft.until === null
      ? []
      : [format(t.until, { date: formatTimestamp(locale, draft.until) })]),
  ];
  const body = parts.join(t.and);
  if (draft.limit === null) return format(t.sentence, { body });
  return parts.length === 0
    ? format(t.newestOnly, { limit: draft.limit })
    : format(t.sentenceLimited, { body, limit: draft.limit });
};

/** A short, human preview of an event's content for the result cards. */
export const eventPreview = (locale: Locale, event: NostrEvent): string => {
  const t = getDictionary(locale).chapters.ch05.preview;
  const count = (name: string) => event.tags.filter((tag) => tag[0] === name).length;
  switch (event.kind) {
    case 0:
      return t.profile;
    case 3:
      return format(t.follows, { count: count("p") });
    case 5:
      return t.deletion;
    case 6:
      return t.repost;
    case 1059:
      return t.giftWrap;
    case 9735:
      return t.zapReceipt;
    case 10002:
      return format(t.relayList, { count: count("r") });
    case 30023:
      return event.tags.find((tag) => tag[0] === "title")?.[1] ?? t.article;
    default:
      return event.content.length > 90 ? `${event.content.slice(0, 89)}…` : event.content;
  }
};

// ---------- presets & quests (all derived from real fixture events) ----------

const alice = getPersona("alice").pubkey;
const bob = getPersona("bob").pubkey;

const find = (what: string, pick: (e: NostrEvent) => boolean): NostrEvent => {
  const found = FIXTURE_EVENTS.find(pick);
  // Fixtures are committed data: a missing anchor event is a build bug, so fail loudly.
  if (found === undefined) throw new Error(`chapter 05: fixture "${what}" not found`);
  return found;
};

const hasTag = (e: NostrEvent, name: string, value: string): boolean =>
  e.tags.some((t) => t[0] === name && t[1] === value);

/** Alice's "how relays work" thread: the root most replies/reactions point at. */
export const THREAD_ROOT = find(
  "alice thread",
  (e) => e.pubkey === alice && e.kind === 1 && hasTag(e, "t", "nostr"),
);

const draftOf = (
  lists: Partial<Record<ListField, readonly string[]>>,
  numbers: Partial<Record<NumberField, number>> = {},
): FilterDraft => ({
  lists: { ...EMPTY_DRAFT.lists, ...lists },
  since: numbers.since ?? null,
  until: numbers.until ?? null,
  limit: numbers.limit ?? null,
});

export const PRESET_IDS = ["aliceNotes", "thread", "mentionsBob", "hashtag", "newest"] as const;
export type PresetId = (typeof PRESET_IDS)[number];

export const PRESETS: Readonly<Record<PresetId, FilterDraft>> = {
  aliceNotes: draftOf({ authors: [alice], kinds: ["1"] }),
  thread: draftOf({ "#e": [THREAD_ROOT.id] }),
  mentionsBob: draftOf({ "#p": [bob] }),
  hashtag: draftOf({ "#t": ["nostr"] }),
  newest: draftOf({}, { limit: 5 }),
};

export const QUEST_IDS = ["reactions", "hotTake", "profiles", "aliceToday"] as const;
export type QuestId = (typeof QUEST_IDS)[number];

/** One timestamp the "today" quest needs: 2024-12-31 00:00 UTC, a whole hour step on the slider. */
export const NEW_YEARS_EVE = 1735603200;

/** Reference solutions: a quest is solved when the user's results equal these, whatever filter they used. */
export const QUEST_SOLUTIONS: Readonly<Record<QuestId, FilterDraft>> = {
  reactions: draftOf({ kinds: ["7"], "#e": [THREAD_ROOT.id] }),
  hotTake: draftOf({ authors: [bob], kinds: ["1"], "#t": ["nostr"] }),
  profiles: draftOf({ kinds: ["0"] }, { limit: 3 }),
  aliceToday: draftOf({ authors: [alice] }, { since: NEW_YEARS_EVE }),
};

export const questTarget = (id: QuestId): readonly string[] =>
  evaluate(draftToFilter(QUEST_SOLUTIONS[id]), FIXTURE_EVENTS).returnedIds;

export const solvedQuests = (returnedIds: readonly string[]): readonly QuestId[] =>
  QUEST_IDS.filter((id) => sameIds(questTarget(id), returnedIds));

/** Quick-pick chips: values that actually occur in the fixtures, so every chip lights something up. */
export const QUICK_KINDS: readonly string[] = [...new Set(FIXTURE_EVENTS.map((e) => e.kind))]
  .sort((a, b) => a - b)
  .map(String);

export const QUICK_HASHTAGS: readonly string[] = [
  ...new Set(
    FIXTURE_EVENTS.flatMap((e) => e.tags.filter((t) => t[0] === "t").map((t) => t[1] ?? "")),
  ),
].sort();

const times = FIXTURE_EVENTS.map((e) => e.created_at);
/** Slider bounds, snapped to whole hours so every quest timestamp is reachable. */
export const TIME_STEP = 3600;
export const TIME_RANGE = {
  min: Math.floor(Math.min(...times) / TIME_STEP) * TIME_STEP,
  max: Math.ceil(Math.max(...times) / TIME_STEP) * TIME_STEP,
} as const;
export const LIMIT_MAX = 20;
