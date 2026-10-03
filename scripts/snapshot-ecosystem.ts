/**
 * Owner: chapter 11 agent. Fetches ecosystem stats and writes the committed snapshot
 * apps/site/src/data/ecosystem.json (the site never fetches stats at runtime).
 *
 *   bun run snapshot:ecosystem
 *
 * Sources (researched 2026-10):
 * - Relays: NIP-66 relay-discovery events (kind 30166) read straight off the protocol from the
 *   monitor relays nostr.watch runs. Its HTTP API (api.nostr.watch/v1) returns 502 and v2 is
 *   paywalled, and nostr.band's stats API is offline, so Nostr itself is the most reliable source.
 *   NIP-66 warns monitors can lie, so only events from pubkeys that published a kind 10166
 *   monitor announcement are counted, and every signature is verified.
 * - NIPs: a tree-only clone of github.com/nostr-protocol/nips (count files, README list and kinds
 *   table; first-added dates from git history give the growth curve).
 * - Clients: hand-curated from nostrapps.com plus each project's site (no machine-readable list exists).
 *
 * When a live source fails, the previous snapshot's section is kept and its source is marked
 * "stale" with the error, so the page always says how fresh each number is.
 */
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  type ClientEntry,
  type Count,
  type Ecosystem,
  type EcosystemSource,
  type GrowthPoint,
  type NipStats,
  type PartialFetch,
  parseEcosystem,
  type RelayStats,
} from "../apps/site/src/components/chapters/11-ecosystem/schema.ts";
import {
  err,
  type NostrEvent,
  ok,
  parseRelayMessage,
  type Result,
  verifyEvent,
} from "../packages/protocol/src/index.ts";

export const OUTPUT = join(import.meta.dir, "../apps/site/src/data/ecosystem.json");
export const MONITOR_RELAYS = [
  "wss://relay.nostr.watch",
  "wss://monitorlizard.nostr1.com",
  "wss://relaypag.es",
] as const;
export const NIPS_REPO = "https://github.com/nostr-protocol/nips";
const WINDOW_HOURS = 24;
const TOP_SOFTWARE = 8;
const TOP_NIPS = 15;

export interface SnapshotError {
  readonly code: "fetch-failed" | "no-data" | "git-failed" | "invalid-output" | "invalid-previous";
  readonly message: string;
}

// ---------------------------------------------------------------------------------------------
// Pure aggregation (exported for tests)
// ---------------------------------------------------------------------------------------------

/** Lowercase scheme+host, no trailing slash: monitors disagree on `wss://x/` vs `wss://x`. */
export const normalizeRelayUrl = (raw: string): string | undefined => {
  const parsed = URL.canParse(raw) ? new URL(raw) : undefined;
  if (parsed === undefined || (parsed.protocol !== "wss:" && parsed.protocol !== "ws:"))
    return undefined;
  const path = parsed.pathname.replace(/\/+$/, "");
  return `${parsed.protocol}//${parsed.host.toLowerCase()}${path}`;
};

/** NIP-11 `software` is free text (usually a repo URL); reduce it to a readable project name. */
export const softwareName = (raw: unknown): string => {
  if (typeof raw !== "string" || raw.trim() === "") return "unknown";
  const last = raw.trim().replace(/\/+$/, "").split(/[/:]/).pop() ?? "";
  const name = last
    .replace(/\.git$/i, "")
    .toLowerCase()
    .trim();
  return name === "" ? "unknown" : name;
};

/** Sorted descending by value (ties by label), first `n` kept, the rest summed into "other". */
export const topWithOther = (
  counts: ReadonlyMap<string, number>,
  n: number,
  otherLabel = "other",
): readonly Count[] => {
  const sorted = [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const head = sorted.slice(0, n).map(([id, value]) => ({ id, label: id, value }));
  const rest = sorted.slice(n).reduce((sum, [, v]) => sum + v, 0);
  return rest > 0 ? [...head, { id: "other", label: otherLabel, value: rest }] : head;
};

const tagValues = (e: NostrEvent, name: string): readonly string[] =>
  e.tags.filter((t) => t[0] === name && t[1] !== undefined).map((t) => t[1] ?? "");

const parseInfo = (content: string): Record<string, unknown> | undefined => {
  if (content.trim() === "") return undefined;
  // Monitors may put anything in content; unparseable info just means "no NIP-11 details".
  const parsed: unknown = (() => {
    try {
      return JSON.parse(content);
    } catch {
      return undefined;
    }
  })();
  return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)
    ? (parsed as Record<string, unknown>)
    : undefined;
};

interface RelayRecord {
  readonly networks: ReadonlySet<string>;
  readonly nips?: readonly string[];
  readonly software?: string;
  readonly paid: boolean;
  readonly auth: boolean;
}

/** Folds one monitor observation into what we know about a relay; newer events come first. */
const merge = (prev: RelayRecord | undefined, e: NostrEvent): RelayRecord => {
  const info = parseInfo(e.content);
  const reqs = tagValues(e, "R");
  const limitation = info?.["limitation"];
  const lim =
    typeof limitation === "object" && limitation !== null
      ? (limitation as Record<string, unknown>)
      : {};
  const nips = tagValues(e, "N");
  const nets = new Set([...(prev?.networks ?? []), ...tagValues(e, "n")]);
  const software =
    prev?.software ?? (info === undefined ? undefined : softwareName(info["software"]));
  const nipList = prev?.nips ?? (nips.length > 0 ? nips : undefined);
  return {
    networks: nets,
    ...(nipList === undefined ? {} : { nips: nipList }),
    ...(software === undefined ? {} : { software }),
    paid: prev?.paid ?? (reqs.includes("payment") || lim["payment_required"] === true),
    auth: prev?.auth ?? (reqs.includes("auth") || lim["auth_required"] === true),
  };
};

/**
 * Aggregates verified 30166 events into relay stats. Only monitors in `monitors` count and only
 * observations newer than `now - windowHours` (a relay seen recently by a monitor = alive).
 */
export const aggregateRelays = (
  events: readonly NostrEvent[],
  monitors: ReadonlySet<string>,
  now: number,
  windowHours = WINDOW_HOURS,
  sourceId = "nip66",
): RelayStats => {
  const since = now - windowHours * 3600;
  const fresh = events
    .filter((e) => e.kind === 30166 && monitors.has(e.pubkey) && e.created_at >= since)
    .toSorted((a, b) => b.created_at - a.created_at);
  const relays = new Map<string, RelayRecord>();
  const seenMonitors = new Set<string>();
  for (const e of fresh) {
    const url = normalizeRelayUrl(tagValues(e, "d")[0] ?? "");
    if (url === undefined) continue;
    seenMonitors.add(e.pubkey);
    relays.set(url, merge(relays.get(url), e));
  }
  const records = [...relays.values()];
  const tally = (keys: (r: RelayRecord) => readonly string[]): Map<string, number> =>
    records.reduce((m, r) => {
      for (const k of keys(r)) m.set(k, (m.get(k) ?? 0) + 1);
      return m;
    }, new Map<string, number>());
  const withNips = records.filter((r) => r.nips !== undefined);
  const nipCounts = tally((r) => [...new Set((r.nips ?? []).map(nipId))]);
  return {
    sourceId,
    windowHours,
    online: records.length,
    monitors: seenMonitors.size,
    withNipList: withNips.length,
    paid: records.filter((r) => r.paid).length,
    authRequired: records.filter((r) => r.auth).length,
    networks: topWithOther(
      tally((r) => (r.networks.size === 0 ? ["clearnet"] : [...r.networks])),
      4,
    ),
    software: topWithOther(
      tally((r) => [r.software ?? "unknown"]),
      TOP_SOFTWARE,
    ),
    nipSupport: [...nipCounts]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, TOP_NIPS)
      .map(([id, value]) => ({ id, label: `NIP-${id}`, value })),
  };
};

/** NIP ids are two hex chars ("01", "5A"); relays advertise them as numbers (1, 11, 42). */
export const nipId = (raw: string): string => {
  const trimmed = raw.trim().toUpperCase();
  return /^\d+$/.test(trimmed) ? trimmed.padStart(2, "0").slice(-2) : trimmed;
};

const NIP_FILE = /^[0-9A-F]{2}\.md$/;

/** Counts NIP documents (`01.md`…`FF.md`) in a repo file listing. */
export const countNipFiles = (files: readonly string[]): number =>
  files.filter((f) => NIP_FILE.test(f)).length;

/** README "## List": NIPs struck through (~~…~~) are marked unrecommended. */
export const countUnrecommended = (readme: string): number =>
  sectionLines(readme, "List").filter((l) => /^- ~~\[NIP-/.test(l)).length;

/** README "## Event Kinds" table: one row per documented kind (or kind range). */
export const countKinds = (readme: string): number =>
  sectionLines(readme, "Event Kinds").filter((l) => /^\| `/.test(l)).length;

const sectionLines = (readme: string, heading: string): readonly string[] => {
  const lines = readme.split("\n");
  const start = lines.findIndex((l) => l.trim() === `## ${heading}`);
  if (start < 0) return [];
  const end = lines.findIndex((l, i) => i > start && l.startsWith("## "));
  return lines.slice(start + 1, end < 0 ? undefined : end);
};

/**
 * `git log --diff-filter=A --name-only --format=@%aI` output → first-added date per NIP file →
 * cumulative count at the end of each calendar quarter.
 */
export const nipGrowth = (gitLog: string, until: Date): readonly GrowthPoint[] => {
  const firstAdded = new Map<string, number>();
  let current: number | undefined;
  for (const line of gitLog.split("\n").map((l) => l.trim())) {
    if (line.startsWith("@")) current = Date.parse(line.slice(1));
    else if (NIP_FILE.test(line) && current !== undefined && !Number.isNaN(current)) {
      const known = firstAdded.get(line);
      if (known === undefined || current < known) firstAdded.set(line, current);
    }
  }
  const dates = [...firstAdded.values()].sort((a, b) => a - b);
  const first = dates[0];
  if (first === undefined) return [];
  const start = new Date(first);
  // Quarters as a single counter (year * 4 + quarter); Date.UTC rolls month 12 into next year.
  const firstQuarter = start.getUTCFullYear() * 4 + Math.floor(start.getUTCMonth() / 3);
  const lastQuarter = until.getUTCFullYear() * 4 + Math.floor(until.getUTCMonth() / 3);
  const points = Array.from({ length: lastQuarter - firstQuarter + 1 }, (_, i) => {
    const k = firstQuarter + i;
    const quarterEnd = Date.UTC(Math.floor(k / 4), (k % 4) * 3 + 3, 0, 23, 59, 59);
    const end = Math.min(quarterEnd, until.getTime());
    return {
      date: new Date(end).toISOString().slice(0, 10),
      count: dates.filter((d) => d <= end).length,
    };
  });
  return points;
};

/** When the curated client list below was last checked against its sources. */
export const CLIENTS_RESEARCHED_AT = "2026-10-03T00:00:00.000Z";

/** Hand-researched (nostrapps.com + project sites, 2026-10). Not exhaustive by design. */
export const CURATED_CLIENTS: readonly ClientEntry[] = [
  {
    id: "damus",
    name: "Damus",
    url: "https://damus.io",
    platforms: ["ios", "desktop"],
    focus: "social",
  },
  {
    id: "primal",
    name: "Primal",
    url: "https://primal.net",
    platforms: ["ios", "android", "web"],
    focus: "social",
  },
  {
    id: "amethyst",
    name: "Amethyst",
    url: "https://github.com/vitorpamplona/amethyst",
    platforms: ["android"],
    focus: "social",
  },
  { id: "nostur", name: "Nostur", url: "https://nostur.com", platforms: ["ios"], focus: "social" },
  { id: "nos", name: "Nos", url: "https://nos.social", platforms: ["ios"], focus: "social" },
  {
    id: "yakihonne",
    name: "YakiHonne",
    url: "https://yakihonne.com",
    platforms: ["ios", "android", "web", "desktop"],
    focus: "social",
  },
  {
    id: "coracle",
    name: "Coracle",
    url: "https://coracle.social",
    platforms: ["web"],
    focus: "social",
  },
  { id: "iris", name: "Iris", url: "https://iris.to", platforms: ["web"], focus: "social" },
  { id: "snort", name: "Snort", url: "https://snort.social", platforms: ["web"], focus: "social" },
  {
    id: "nostrudel",
    name: "noStrudel",
    url: "https://nostrudel.ninja",
    platforms: ["web"],
    focus: "social",
  },
  {
    id: "jumble",
    name: "Jumble",
    url: "https://jumble.social",
    platforms: ["web"],
    focus: "social",
  },
  {
    id: "gossip",
    name: "Gossip",
    url: "https://github.com/mikedilger/gossip",
    platforms: ["desktop"],
    focus: "social",
  },
  {
    id: "olas",
    name: "Olas",
    url: "https://olas.app",
    platforms: ["ios", "android", "web"],
    focus: "media",
  },
  {
    id: "0xchat",
    name: "0xchat",
    url: "https://0xchat.com",
    platforms: ["ios", "android"],
    focus: "chat",
  },
  {
    id: "flotilla",
    name: "Flotilla",
    url: "https://flotilla.social",
    platforms: ["web"],
    focus: "chat",
  },
  { id: "habla", name: "Habla", url: "https://habla.news", platforms: ["web"], focus: "long-form" },
  {
    id: "zapstream",
    name: "zap.stream",
    url: "https://zap.stream",
    platforms: ["web", "android", "ios"],
    focus: "live",
  },
  {
    id: "shopstr",
    name: "Shopstr",
    url: "https://shopstr.store",
    platforms: ["web"],
    focus: "commerce",
  },
  {
    id: "zapstore",
    name: "Zapstore",
    url: "https://zapstore.dev",
    platforms: ["android"],
    focus: "apps",
  },
  { id: "yakbak", name: "YakBak", url: "https://yakbak.app", platforms: ["web"], focus: "media" },
];

// ---------------------------------------------------------------------------------------------
// I/O
// ---------------------------------------------------------------------------------------------

export interface ReqOptions {
  readonly timeoutMs?: number;
  /** Injectable for tests running under happy-dom, whose global WebSocket differs from Bun's. */
  readonly WebSocketImpl?: typeof WebSocket;
}

/** One REQ → events until EOSE (or timeout, which is an error: partial pages would skew counts). */
export const requestEvents = (
  relayUrl: string,
  filter: Readonly<Record<string, unknown>>,
  { timeoutMs = 45_000, WebSocketImpl = WebSocket }: ReqOptions = {},
): Promise<Result<readonly NostrEvent[], SnapshotError>> =>
  new Promise((resolve) => {
    const events: NostrEvent[] = [];
    const ws = new WebSocketImpl(relayUrl);
    const finish = (r: Result<readonly NostrEvent[], SnapshotError>): void => {
      clearTimeout(timer);
      ws.close();
      resolve(r);
    };
    const timer = setTimeout(
      () => finish(err({ code: "fetch-failed", message: `${relayUrl}: timed out before EOSE` })),
      timeoutMs,
    );
    ws.onopen = () => ws.send(JSON.stringify(["REQ", "snap", filter]));
    ws.onerror = () => finish(err({ code: "fetch-failed", message: `${relayUrl}: socket error` }));
    ws.onmessage = (m) => {
      const parsed = parseRelayMessage(String(m.data));
      // A malformed frame (or event) is skipped, not fatal: one bad monitor shouldn't sink the sweep.
      if (!parsed.ok) return;
      const msg = parsed.value;
      if (msg[0] === "EVENT") events.push(msg[2]);
      else if (msg[0] === "EOSE") finish(ok(events));
      else if (msg[0] === "CLOSED")
        finish(err({ code: "fetch-failed", message: `${relayUrl}: CLOSED ${msg[2]}` }));
    };
  });

/** Pages backwards with `until` because relays cap `limit` (often 500–5000). */
const pagedEvents = async (
  relayUrl: string,
  base: Readonly<Record<string, unknown>>,
  since: number,
  warnings: PartialFetch[],
  options: ReqOptions,
  maxPages = 40,
): Promise<Result<readonly NostrEvent[], SnapshotError>> => {
  const all: NostrEvent[] = [];
  let until: number | undefined;
  for (let page = 0; page < maxPages; page += 1) {
    const r = await requestEvents(
      relayUrl,
      { ...base, since, limit: 5000, ...(until === undefined ? {} : { until }) },
      options,
    );
    if (!r.ok) {
      if (all.length === 0) return r;
      warnings.push({
        relay: relayUrl,
        reason: `${r.error.message} (kept ${all.length} events from earlier pages)`,
      });
      return ok(all);
    }
    if (r.value.length === 0) break;
    all.push(...r.value);
    const oldest = Math.min(...r.value.map((e) => e.created_at));
    if (oldest <= since) break;
    until = oldest - 1;
  }
  return ok(all);
};

export interface RelayCollection {
  readonly stats: RelayStats;
  /** Per-monitor-relay failures: a partial sweep is still useful but must be disclosed. */
  readonly warnings: readonly PartialFetch[];
}

/** Sweeps monitor relays for NIP-66 announcements (10166) and observations (30166). */
export const collectRelays = async (
  now: number,
  relays: readonly string[] = MONITOR_RELAYS,
  options: ReqOptions = {},
): Promise<Result<RelayCollection, SnapshotError>> => {
  const since = now - WINDOW_HOURS * 3600;
  const warnings: PartialFetch[] = [];
  const perRelay = await Promise.all(
    relays.map(async (url) => {
      const [announcements, discoveries] = await Promise.all([
        requestEvents(url, { kinds: [10166] }, options),
        pagedEvents(url, { kinds: [30166] }, since, warnings, options),
      ]);
      for (const r of [announcements, discoveries])
        if (!r.ok) warnings.push({ relay: url, reason: r.error.message });
      return [
        ...(announcements.ok ? announcements.value : []),
        ...(discoveries.ok ? discoveries.value : []),
      ];
    }),
  );
  const unique = new Map(perRelay.flat().map((e) => [e.id, e]));
  const verified = [...unique.values()].filter((e) => verifyEvent(e).ok);
  const monitors = new Set(verified.filter((e) => e.kind === 10166).map((e) => e.pubkey));
  const stats = aggregateRelays(verified, monitors, now);
  return stats.online === 0
    ? err({
        code: "no-data",
        message: `no NIP-66 observations from announced monitors${warnings.length > 0 ? ` (${warnings.map((w) => w.reason).join("; ")})` : ""}`,
      })
    : ok({ stats, warnings });
};

const git = (args: readonly string[], cwd?: string): Result<string, SnapshotError> => {
  const p = Bun.spawnSync(["git", ...args], {
    ...(cwd === undefined ? {} : { cwd }),
    stderr: "pipe",
  });
  return p.exitCode === 0
    ? ok(p.stdout.toString())
    : err({ code: "git-failed", message: `git ${args[0]}: ${p.stderr.toString().trim()}` });
};

/** Clones the NIPs repo (tree-only: history + names, no blobs up front) and counts. */
export const collectNips = (now: Date, repoUrl = NIPS_REPO): Result<NipStats, SnapshotError> => {
  const dir = mkdtempSync(join(tmpdir(), "nips-"));
  const repo = join(dir, "nips");
  const steps = [
    () => git(["clone", "-q", "--filter=blob:none", "--no-checkout", repoUrl, repo]),
    () => git(["ls-tree", "--name-only", "HEAD"], repo),
    () => git(["show", "HEAD:README.md"], repo),
    // --first-parent -m: files added inside merged PR branches surface on the merge commit;
    // --no-renames: a renamed NIP counts as added under its new name.
    () =>
      git(
        [
          "log",
          "--first-parent",
          "-m",
          "--no-renames",
          "--diff-filter=A",
          "--name-only",
          "--format=@%aI",
          "HEAD",
        ],
        repo,
      ),
  ];
  const outputs: string[] = [];
  for (const step of steps) {
    const r = step();
    if (!r.ok) {
      rmSync(dir, { recursive: true, force: true });
      return r;
    }
    outputs.push(r.value);
  }
  rmSync(dir, { recursive: true, force: true });
  const [, files = "", readme = "", log = ""] = outputs;
  return ok({
    sourceId: "nips-repo",
    total: countNipFiles(files.split("\n")),
    unrecommended: countUnrecommended(readme),
    kinds: countKinds(readme),
    growth: nipGrowth(log, now),
  });
};

const isMissingFile = (error: unknown): boolean =>
  error instanceof Error && "code" in error && error.code === "ENOENT";

/**
 * The committed snapshot: `undefined` only when there is no file yet (first run). Unreadable,
 * malformed or schema-invalid files are errors, so a corrupt snapshot is never silently ignored.
 */
export const readSnapshot = (path: string): Result<Ecosystem | undefined, SnapshotError> => {
  const text = (() => {
    try {
      return readFileSync(path, "utf8");
    } catch (error) {
      if (isMissingFile(error)) return undefined;
      throw error; // EACCES, EISDIR…: a real problem, not "no snapshot yet"
    }
  })();
  if (text === undefined) return ok(undefined);
  const json = (() => {
    try {
      return ok<unknown>(JSON.parse(text));
    } catch (error) {
      return err<SnapshotError>({
        code: "invalid-previous",
        message: `${path}: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  })();
  if (!json.ok) return json;
  const parsed = parseEcosystem(json.value);
  return parsed.ok
    ? ok(parsed.value)
    : err({ code: "invalid-previous", message: `${path}: ${parsed.error.message}` });
};

/** Live result, or the previous snapshot's section marked stale; an error if neither exists. */
export const withFallback = <T>(
  live: Result<T, SnapshotError>,
  previous: T | undefined,
): Result<{ readonly value: T; readonly stale?: string }, SnapshotError> =>
  live.ok
    ? ok({ value: live.value })
    : previous === undefined
      ? err({
          code: live.error.code,
          message: `${live.error.message}; no previous snapshot to fall back on`,
        })
      : ok({ value: previous, stale: live.error.message });

export interface SnapshotInputs {
  readonly now: Date;
  readonly previous: Ecosystem | undefined;
  readonly relays: Result<RelayCollection, SnapshotError>;
  readonly nips: Result<NipStats, SnapshotError>;
  readonly monitorRelays?: readonly string[];
}

/** Assembles (and validates) the snapshot from collected sections, falling back per section. */
export const buildSnapshot = ({
  now,
  previous,
  relays: liveRelays,
  nips: liveNips,
  monitorRelays = MONITOR_RELAYS,
}: SnapshotInputs): Result<Ecosystem, SnapshotError> => {
  const iso = now.toISOString();
  const relays = withFallback(
    liveRelays.ok ? ok(liveRelays.value.stats) : liveRelays,
    previous?.relays,
  );
  if (!relays.ok) return relays;
  const nips = withFallback(liveNips, previous?.nips);
  if (!nips.ok) return nips;
  const warnings = liveRelays.ok ? liveRelays.value.warnings : [];

  const source = (
    base: Pick<EcosystemSource, "id" | "name" | "url" | "detail">,
    stale: string | undefined,
  ): EcosystemSource => {
    const before = previous?.sources.find((s) => s.id === base.id);
    return stale === undefined
      ? { ...base, retrievedAt: iso, status: "ok", lastError: null }
      : {
          ...base,
          // A stale section keeps the detail it was captured with (e.g. which monitors were partial).
          detail: before?.detail.kind === base.detail.kind ? before.detail : base.detail,
          retrievedAt: before?.retrievedAt ?? iso,
          status: "stale",
          lastError: stale,
        };
  };

  const snapshot: Ecosystem = {
    capturedAt: iso,
    sources: [
      source(
        {
          id: "nip66",
          name: "NIP-66 relay monitors (nostr.watch)",
          url: "https://github.com/nostr-protocol/nips/blob/master/66.md",
          detail: {
            kind: "nip66",
            monitorRelays: [...monitorRelays],
            windowHours: WINDOW_HOURS,
            partial: warnings,
          },
        },
        relays.value.stale,
      ),
      source(
        {
          id: "nips-repo",
          name: "nostr-protocol/nips",
          url: NIPS_REPO,
          detail: { kind: "github-head" },
        },
        nips.value.stale,
      ),
      {
        id: "clients",
        name: "nostrapps.com + project sites",
        url: "https://nostrapps.com",
        retrievedAt: CLIENTS_RESEARCHED_AT,
        status: "curated",
        detail: { kind: "curated" },
        lastError: null,
      },
    ],
    relays: relays.value.value,
    nips: nips.value.value,
    clients: { sourceId: "clients", items: CURATED_CLIENTS },
  };
  // Round-trip through JSON so we validate exactly what gets written.
  const valid = parseEcosystem(JSON.parse(JSON.stringify(snapshot)));
  return valid.ok ? ok(snapshot) : err({ code: "invalid-output", message: valid.error.message });
};

const partialFetches = (e: Ecosystem): readonly PartialFetch[] =>
  e.sources.flatMap((s) => (s.detail.kind === "nip66" ? s.detail.partial : []));

const main = async (): Promise<void> => {
  const now = new Date();
  console.log("relays: querying NIP-66 monitors…");
  const relays = await collectRelays(Math.floor(now.getTime() / 1000));
  console.log("nips: cloning the NIPs repo…");
  const nips = collectNips(now);
  for (const r of [relays, nips]) if (!r.ok) console.warn(`  failed: ${r.error.message}`);
  const previous = readSnapshot(OUTPUT);
  if (!previous.ok) {
    console.error(`snapshot-ecosystem: ${previous.error.code}: ${previous.error.message}`);
    process.exit(1);
  }
  const snapshot = buildSnapshot({ now, previous: previous.value, relays, nips });
  if (!snapshot.ok) {
    console.error(`snapshot-ecosystem: ${snapshot.error.code}: ${snapshot.error.message}`);
    process.exit(1);
  }
  writeFileSync(OUTPUT, `${JSON.stringify(snapshot.value, null, 2)}\n`);
  const { relays: r, nips: n, sources } = snapshot.value;
  console.log(`wrote ${OUTPUT}: ${r.online} relays, ${n.total} NIPs`);
  for (const s of sources)
    console.log(`  ${s.id}: ${s.status}${s.lastError ? ` — ${s.lastError}` : ""}`);
  for (const w of partialFetches(snapshot.value))
    console.warn(`  partial: ${w.relay}: ${w.reason}`);
};

if (import.meta.main) await main();
