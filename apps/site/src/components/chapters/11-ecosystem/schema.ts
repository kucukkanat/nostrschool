/**
 * Shape of `apps/site/src/data/ecosystem.json`, shared by the snapshot script (which validates
 * before writing) and the chapter 11 islands (which validate before rendering). Hand-rolled
 * validation instead of zod so the island doesn't ship a schema library to the browser.
 */
import { err, ok, type Result } from "@nostrschool/protocol";

export const PLATFORMS = ["ios", "android", "web", "desktop"] as const;
export type Platform = (typeof PLATFORMS)[number];

export const FOCI = ["social", "chat", "media", "long-form", "live", "commerce", "apps"] as const;
export type Focus = (typeof FOCI)[number];

export const SOURCE_STATUSES = ["ok", "stale", "curated"] as const;
export type SourceStatus = (typeof SOURCE_STATUSES)[number];

/** Same shape as `Datum` in @nostrschool/charts, so counts plug straight into charts. */
export interface Count {
  readonly id: string;
  readonly label: string;
  readonly value: number;
}

export interface EcosystemSource {
  readonly id: string;
  readonly name: string;
  readonly url: string;
  readonly retrievedAt: string;
  /** ok = fetched this run; stale = fetch failed, previous snapshot kept; curated = hand-researched. */
  readonly status: SourceStatus;
  /** Structured, not prose: the chapter renders it through localized templates. */
  readonly detail: SourceDetail;
  /** Raw error of the last failed refresh (stale only), for maintainers; never shown verbatim. */
  readonly lastError: string | null;
}

/** A monitor relay that stopped answering mid-sweep; its data is partial, not missing. */
export interface PartialFetch {
  readonly relay: string;
  readonly reason: string;
}

export type SourceDetail =
  | {
      readonly kind: "nip66";
      readonly monitorRelays: readonly string[];
      readonly windowHours: number;
      readonly partial: readonly PartialFetch[];
    }
  | { readonly kind: "github-head" }
  | { readonly kind: "curated" };

export interface ClientEntry {
  readonly id: string;
  readonly name: string;
  readonly url: string;
  readonly platforms: readonly Platform[];
  readonly focus: Focus;
}

export interface GrowthPoint {
  /** ISO date (YYYY-MM-DD), end of the quarter. */
  readonly date: string;
  readonly count: number;
}

export interface RelayStats {
  readonly sourceId: string;
  readonly windowHours: number;
  readonly online: number;
  readonly monitors: number;
  readonly withNipList: number;
  readonly paid: number;
  readonly authRequired: number;
  readonly networks: readonly Count[];
  readonly software: readonly Count[];
  /** How many relays advertise each NIP (top N), out of `withNipList`. */
  readonly nipSupport: readonly Count[];
}

export interface NipStats {
  readonly sourceId: string;
  readonly total: number;
  readonly unrecommended: number;
  readonly kinds: number;
  readonly growth: readonly GrowthPoint[];
}

export interface Ecosystem {
  readonly capturedAt: string;
  readonly sources: readonly EcosystemSource[];
  readonly relays: RelayStats;
  readonly nips: NipStats;
  readonly clients: { readonly sourceId: string; readonly items: readonly ClientEntry[] };
}

export interface EcosystemError {
  readonly code: "invalid-shape";
  readonly path: string;
  readonly message: string;
}

type Check<T> = (x: unknown, path: string) => Result<T, EcosystemError>;

const bad = (path: string, expected: string): Result<never, EcosystemError> =>
  err({ code: "invalid-shape", path, message: `${path}: expected ${expected}` });

const isRecord = (x: unknown): x is Record<string, unknown> =>
  typeof x === "object" && x !== null && !Array.isArray(x);

const str: Check<string> = (x, p) => (typeof x === "string" ? ok(x) : bad(p, "a string"));
const isoDate: Check<string> = (x, p) =>
  typeof x === "string" && !Number.isNaN(Date.parse(x)) ? ok(x) : bad(p, "an ISO date");
const count: Check<number> = (x, p) =>
  typeof x === "number" && Number.isInteger(x) && x >= 0 ? ok(x) : bad(p, "a count");
const oneOf =
  <T extends string>(values: readonly T[]): Check<T> =>
  (x, p) =>
    values.some((v) => v === x) ? ok(x as T) : bad(p, `one of ${values.join("|")}`);

const list =
  <T>(item: Check<T>): Check<readonly T[]> =>
  (x, p) => {
    if (!Array.isArray(x)) return bad(p, "an array");
    const out: T[] = [];
    for (const [i, v] of x.entries()) {
      const r = item(v, `${p}.${i}`);
      if (!r.ok) return r;
      out.push(r.value);
    }
    return ok(out);
  };

/** Validates each declared field; the object's static type comes from the field checks. */
const shape =
  <T>(fields: { readonly [K in keyof T]: Check<T[K]> }): Check<T> =>
  (x, p) => {
    if (!isRecord(x)) return bad(p, "an object");
    const out: Partial<Record<keyof T, unknown>> = {};
    for (const key of Object.keys(fields) as (keyof T & string)[]) {
      const r = fields[key](x[key], `${p}.${key}`);
      if (!r.ok) return r;
      out[key] = r.value;
    }
    return ok(out as T);
  };

const nullable =
  <T>(check: Check<T>): Check<T | null> =>
  (x, p) =>
    x === null ? ok(null) : check(x, p);

const nip66Detail = shape<Extract<SourceDetail, { kind: "nip66" }>>({
  kind: oneOf(["nip66"] as const),
  monitorRelays: list(str),
  windowHours: count,
  partial: list(shape<PartialFetch>({ relay: str, reason: str })),
});
const sourceDetail: Check<SourceDetail> = (x, p) => {
  const kind = isRecord(x) ? x["kind"] : undefined;
  if (kind === "nip66") return nip66Detail(x, p);
  if (kind === "github-head" || kind === "curated") return ok({ kind });
  return bad(`${p}.kind`, "one of nip66|github-head|curated");
};

const countItem = shape<Count>({ id: str, label: str, value: count });

const checkEcosystem = shape<Ecosystem>({
  capturedAt: isoDate,
  sources: list(
    shape<EcosystemSource>({
      id: str,
      name: str,
      url: str,
      retrievedAt: isoDate,
      status: oneOf(SOURCE_STATUSES),
      detail: sourceDetail,
      lastError: nullable(str),
    }),
  ),
  relays: shape<RelayStats>({
    sourceId: str,
    windowHours: count,
    online: count,
    monitors: count,
    withNipList: count,
    paid: count,
    authRequired: count,
    networks: list(countItem),
    software: list(countItem),
    nipSupport: list(countItem),
  }),
  nips: shape<NipStats>({
    sourceId: str,
    total: count,
    unrecommended: count,
    kinds: count,
    growth: list(shape<GrowthPoint>({ date: isoDate, count })),
  }),
  clients: shape<Ecosystem["clients"]>({
    sourceId: str,
    items: list(
      shape<ClientEntry>({
        id: str,
        name: str,
        url: str,
        platforms: list(oneOf(PLATFORMS)),
        focus: oneOf(FOCI),
      }),
    ),
  }),
});

/** Validates unknown JSON (the committed snapshot) into a typed `Ecosystem`. */
export const parseEcosystem = (input: unknown): Result<Ecosystem, EcosystemError> =>
  checkEcosystem(input, "ecosystem");
