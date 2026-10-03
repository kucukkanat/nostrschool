/**
 * Tests for scripts/snapshot-ecosystem.ts (kept here because the chapter 11 agent owns this dir).
 * No mocks: events are really signed, the relay is the real in-memory test relay and the NIPs
 * "repo" is a real git repository created in a temp dir.
 */
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { chmodSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { deriveSecretKey, type NostrEvent, ok, signEvent, unwrap } from "@nostrschool/protocol";
import { startTestRelay, type TestRelay } from "@nostrschool/test-relay";
import {
  aggregateRelays,
  buildSnapshot,
  CURATED_CLIENTS,
  collectNips,
  collectRelays,
  countKinds,
  countNipFiles,
  countUnrecommended,
  nipGrowth,
  nipId,
  normalizeRelayUrl,
  OUTPUT,
  readSnapshot,
  requestEvents,
  softwareName,
  topWithOther,
  withFallback,
} from "../../../../../../scripts/snapshot-ecosystem.ts";
import { parseEcosystem } from "./schema.ts";

// Bun's built-in `ws` module gives real sockets; the preload's happy-dom WebSocket throws on refused
// ports. Loaded by a computed specifier because apps/site has no `ws` type declarations.
const WS_MODULE = "ws";
const { WebSocket: BunWebSocket } = (await import(WS_MODULE)) as { WebSocket: typeof WebSocket };

const NOW = 1_790_000_000;
const MONITOR = deriveSecretKey("ch11:monitor");
const STRANGER = deriveSecretKey("ch11:stranger");

const sign = (
  sk: Uint8Array,
  kind: number,
  tags: readonly (readonly [string, ...string[]])[],
  content = "",
  createdAt = NOW - 60,
): NostrEvent =>
  unwrap(
    signEvent({ kind, created_at: createdAt, tags, content }, sk, { auxRand: new Uint8Array(32) }),
  ).event;

const announce = (sk: Uint8Array, createdAt = NOW - 60) =>
  sign(sk, 10166, [["frequency", "3600"]], "", createdAt);
const observe = (
  url: string,
  extra: readonly (readonly [string, ...string[]])[] = [],
  content = "",
  createdAt = NOW - 60,
  sk = MONITOR,
) => sign(sk, 30166, [["d", url], ...extra], content, createdAt);

const monitorPubkey = announce(MONITOR).pubkey;

describe("normalizeRelayUrl", () => {
  test("lowercases the host and drops trailing slashes", () => {
    expect(normalizeRelayUrl("wss://Relay.Example.COM/")).toBe("wss://relay.example.com");
    expect(normalizeRelayUrl("ws://a.b/path//")).toBe("ws://a.b/path");
  });
  test("rejects non-websocket and unparseable URLs", () => {
    expect(normalizeRelayUrl("https://a.b")).toBeUndefined();
    expect(normalizeRelayUrl("not a url")).toBeUndefined();
  });
});

describe("softwareName", () => {
  test("reduces repo URLs to a project name", () => {
    expect(softwareName("git+https://github.com/hoytech/strfry.git")).toBe("strfry");
    expect(softwareName("https://git.sr.ht/~gheartsfield/nostr-rs-relay/")).toBe("nostr-rs-relay");
    expect(softwareName("NFDB")).toBe("nfdb");
  });
  test("falls back to unknown", () => {
    expect(softwareName(undefined)).toBe("unknown");
    expect(softwareName(42)).toBe("unknown");
    expect(softwareName("  ")).toBe("unknown");
    expect(softwareName("https://x/.git")).toBe("unknown");
  });
});

describe("topWithOther", () => {
  const counts = new Map([
    ["b", 5],
    ["a", 5],
    ["c", 1],
    ["d", 2],
  ]);
  test("sorts, keeps n and sums the rest", () => {
    expect(topWithOther(counts, 2, "rest")).toEqual([
      { id: "a", label: "a", value: 5 },
      { id: "b", label: "b", value: 5 },
      { id: "other", label: "rest", value: 3 },
    ]);
  });
  test("no other bucket when everything fits", () => {
    expect(topWithOther(counts, 10).map((c) => c.id)).toEqual(["a", "b", "d", "c"]);
  });
});

test("nipId pads numeric ids and keeps hex ids", () => {
  expect(nipId("1")).toBe("01");
  expect(nipId(" 42 ")).toBe("42");
  expect(nipId("5a")).toBe("5A");
});

describe("README and tree counters", () => {
  const readme = [
    "# NIPs",
    "## List",
    "- [NIP-01: Basic](01.md)",
    "- ~~[NIP-04: DMs](04.md)~~",
    "- ~~[NIP-08: Mentions](08.md)~~",
    "## Event Kinds",
    "| kind | description |",
    "| --- | --- |",
    "| `0` | Metadata |",
    "| `1` | Note |",
    "| `1630`-`1633` | Status |",
    "## License",
  ].join("\n");
  test("counts NIP files only", () => {
    expect(countNipFiles(["01.md", "5A.md", "README.md", "BREAKING.md", "1.md"])).toBe(2);
  });
  test("counts unrecommended NIPs and kind rows", () => {
    expect(countUnrecommended(readme)).toBe(2);
    expect(countKinds(readme)).toBe(3);
  });
  test("missing sections count zero; a last section runs to the end", () => {
    expect(countKinds("# nothing")).toBe(0);
    expect(countKinds("## Event Kinds\n| `7` | Reaction |")).toBe(1);
  });
});

describe("nipGrowth", () => {
  test("cumulative first-added counts per quarter, ending at `until`", () => {
    const log = [
      "@2022-05-01T00:00:00Z",
      "01.md",
      "README.md",
      "@not-a-date",
      "09.md",
      "@2023-01-15T00:00:00Z",
      "02.md",
      "01.md",
      "@2022-04-01T00:00:00Z",
      "02.md",
    ].join("\n");
    expect(nipGrowth(log, new Date("2022-08-01T00:00:00Z"))).toEqual([
      { date: "2022-06-30", count: 2 },
      { date: "2022-08-01", count: 2 },
    ]);
  });
  test("empty history → no points", () => {
    expect(nipGrowth("", new Date())).toEqual([]);
  });
});

describe("aggregateRelays", () => {
  const monitors = new Set([monitorPubkey]);
  const info = (o: Record<string, unknown>) => JSON.stringify(o);
  const events = [
    // Newest observation of relay a: wins for NIPs/software; adds the tor network.
    observe(
      "wss://a.example/",
      [
        ["n", "tor"],
        ["N", "1"],
        ["N", "11"],
        ["R", "payment"],
      ],
      info({ software: "git+https://x/strfry.git" }),
      NOW - 10,
    ),
    observe(
      "wss://A.example",
      [
        ["n", "clearnet"],
        ["N", "42"],
      ],
      "not json",
      NOW - 20,
    ),
    observe(
      "wss://b.example",
      [["N", "1"]],
      info({ limitation: { auth_required: true, payment_required: false } }),
    ),
    observe("wss://c.example", [], "[1,2]"),
    observe("wss://d.example", [["R", "auth"]], info({ limitation: "weird" })),
    observe("https://not-a-relay", [["N", "1"]]),
    observe("wss://old.example", [], "", NOW - 48 * 3600),
    observe("wss://stranger.example", [], "", NOW - 60, STRANGER),
    announce(MONITOR),
  ];
  const stats = aggregateRelays(events, monitors, NOW, 24, "nip66");

  test("counts fresh relays from announced monitors only", () => {
    expect(stats.online).toBe(4);
    expect(stats.monitors).toBe(1);
    expect(stats.windowHours).toBe(24);
    expect(stats.sourceId).toBe("nip66");
  });
  test("merges observations newest-first", () => {
    expect(stats.withNipList).toBe(2);
    expect(stats.nipSupport).toEqual([
      { id: "01", label: "NIP-01", value: 2 },
      { id: "11", label: "NIP-11", value: 1 },
    ]);
    expect(stats.networks).toEqual([
      { id: "clearnet", label: "clearnet", value: 4 },
      { id: "tor", label: "tor", value: 1 },
    ]);
  });
  test("reads payment/auth from R tags and NIP-11 limitations", () => {
    expect(stats.paid).toBe(1);
    expect(stats.authRequired).toBe(2);
  });
  test("software falls back to unknown", () => {
    expect(stats.software).toEqual([
      { id: "unknown", label: "unknown", value: 3 },
      { id: "strfry", label: "strfry", value: 1 },
    ]);
  });
});

describe("relay I/O against the real test relay", () => {
  let relay: TestRelay;
  let slow: TestRelay;
  const now = Math.floor(Date.now() / 1000);
  const io = { WebSocketImpl: BunWebSocket };
  beforeAll(async () => {
    relay = await startTestRelay({
      seed: [
        announce(MONITOR, now - 30),
        observe("wss://one.example", [["N", "1"]], "", now - 30),
        observe("wss://two.example", [["N", "1"]], "", now - 40),
      ],
    });
    slow = await startTestRelay({ latencyMs: 300 });
  });
  afterAll(async () => {
    await relay.stop();
    await slow.stop();
  });

  test("requestEvents returns events until EOSE", async () => {
    const r = await requestEvents(relay.url, { kinds: [30166] }, io);
    expect(r.ok && r.value.length).toBe(2);
  });
  test("requestEvents times out explicitly", async () => {
    const r = await requestEvents(slow.url, { kinds: [1] }, { timeoutMs: 50, ...io });
    expect(r.ok ? "" : r.error.message).toContain("timed out");
  });
  test("collectRelays verifies, filters and reports partial failures", async () => {
    const r = await collectRelays(now, [relay.url, "ws://127.0.0.1:1"], io);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.stats.online).toBe(2);
    expect(r.value.warnings).toContainEqual({
      relay: "ws://127.0.0.1:1",
      reason: expect.stringContaining("socket error"),
    });
  });
  test("collectRelays with nothing reachable is a no-data error", async () => {
    const r = await collectRelays(now, ["ws://127.0.0.1:1"], io);
    expect(r.ok ? "" : r.error.code).toBe("no-data");
  });
});

describe("collectNips against a real local git repo", () => {
  const dir = mkdtempSync(join(tmpdir(), "ch11-nips-"));
  const run = (...args: string[]) =>
    Bun.spawnSync(["git", "-c", "user.name=t", "-c", "user.email=t@t", ...args], {
      cwd: dir,
      env: { ...process.env, GIT_AUTHOR_DATE: "2023-02-01T00:00:00Z" },
    });
  beforeAll(() => {
    run("init", "-q");
    writeFileSync(join(dir, "01.md"), "NIP-01");
    writeFileSync(
      join(dir, "README.md"),
      "## List\n- ~~[NIP-04: x](04.md)~~\n## Event Kinds\n| `1` | Note |\n",
    );
    run("add", ".");
    run("commit", "-q", "-m", "init");
  });
  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  test("counts files, README sections and growth", () => {
    const r = collectNips(new Date("2023-03-01T00:00:00Z"), dir);
    expect(r).toEqual(
      ok({
        sourceId: "nips-repo",
        total: 1,
        unrecommended: 1,
        kinds: 1,
        growth: [{ date: "2023-03-01", count: 1 }],
      }),
    );
  });
  test("git failures are typed errors", () => {
    const r = collectNips(new Date(), join(dir, "missing"));
    expect(r.ok ? "" : r.error.code).toBe("git-failed");
  });
});

describe("snapshot assembly", () => {
  const read = readSnapshot(OUTPUT);
  const committed = read.ok ? read.value : undefined;

  test("the committed snapshot is valid and carries capturedAt + sources", () => {
    expect(committed).toBeDefined();
    expect(committed?.sources.map((s) => s.id)).toEqual(["nip66", "nips-repo", "clients"]);
    expect(committed?.clients.items).toEqual(CURATED_CLIENTS);
  });
  test("readSnapshot: only a missing file means 'no snapshot yet'", () => {
    const dir = mkdtempSync(join(tmpdir(), "ch11-snap-"));
    writeFileSync(join(dir, "bad.json"), JSON.stringify({ capturedAt: 1 }));
    writeFileSync(join(dir, "broken.json"), "{");
    expect(readSnapshot(join(dir, "nope.json"))).toEqual(ok(undefined));
    const invalid = readSnapshot(join(dir, "bad.json"));
    expect(invalid.ok ? "" : invalid.error.code).toBe("invalid-previous");
    expect(invalid.ok ? "" : invalid.error.message).toContain("bad.json: ecosystem.capturedAt");
    const broken = readSnapshot(join(dir, "broken.json"));
    expect(broken.ok ? "" : broken.error.message).toContain("broken.json");
    rmSync(dir, { recursive: true, force: true });
  });
  test("readSnapshot rethrows filesystem errors other than ENOENT", () => {
    const dir = mkdtempSync(join(tmpdir(), "ch11-snap-"));
    mkdirSync(join(dir, "folder.json"));
    expect(() => readSnapshot(join(dir, "folder.json"))).toThrow(/EISDIR/);
    writeFileSync(join(dir, "locked.json"), "{}");
    chmodSync(join(dir, "locked.json"), 0o000);
    // root ignores file modes, so only assert EACCES when the read is actually denied
    const denied = (() => {
      try {
        readSnapshot(join(dir, "locked.json"));
        return undefined;
      } catch (error) {
        return error;
      }
    })();
    if (process.getuid?.() !== 0) expect(String(denied)).toContain("EACCES");
    rmSync(dir, { recursive: true, force: true });
  });
  test("withFallback: live, stale, or a loud error", () => {
    const failure = {
      ok: false as const,
      error: { code: "fetch-failed" as const, message: "down" },
    };
    expect(withFallback(ok(1), 2)).toEqual(ok({ value: 1 }));
    expect(withFallback(failure, 2)).toEqual(ok({ value: 2, stale: "down" }));
    expect(withFallback(failure, undefined).ok).toBe(false);
  });

  const now = new Date("2026-10-03T12:00:00Z");
  test("buildSnapshot with live data marks sources ok and validates", () => {
    if (committed === undefined) throw new Error("no committed snapshot");
    const r = buildSnapshot({
      now,
      previous: undefined,
      relays: ok({ stats: committed.relays, warnings: [{ relay: "x", reason: "socket error" }] }),
      nips: ok(committed.nips),
      monitorRelays: ["x"],
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(parseEcosystem(r.value).ok).toBe(true);
    expect(r.value.capturedAt).toBe(now.toISOString());
    expect(r.value.sources[0]?.status).toBe("ok");
    expect(r.value.sources[0]?.detail).toEqual({
      kind: "nip66",
      monitorRelays: ["x"],
      windowHours: 24,
      partial: [{ relay: "x", reason: "socket error" }],
    });
    expect(r.value.sources.map((s) => s.detail.kind)).toEqual(["nip66", "github-head", "curated"]);
    expect(r.value.sources.every((s) => s.lastError === null)).toBe(true);
  });
  test("buildSnapshot falls back to the previous snapshot, marked stale", () => {
    const failure = {
      ok: false as const,
      error: { code: "no-data" as const, message: "nobody home" },
    };
    const r = buildSnapshot({ now, previous: committed, relays: failure, nips: failure });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.sources.map((s) => s.status)).toEqual(["stale", "stale", "curated"]);
    expect(r.value.sources[0]?.retrievedAt).toBe(committed?.sources[0]?.retrievedAt ?? "");
    expect(r.value.sources[1]?.lastError).toBe("nobody home");
    expect(r.value.sources[0]?.detail).toEqual(committed?.sources[0]?.detail);
  });
  test("buildSnapshot errors without data or previous snapshot", () => {
    const failure = { ok: false as const, error: { code: "no-data" as const, message: "x" } };
    expect(buildSnapshot({ now, previous: undefined, relays: failure, nips: failure }).ok).toBe(
      false,
    );
    if (committed === undefined) return;
    const nipsOnly = buildSnapshot({
      now,
      previous: undefined,
      relays: ok({ stats: committed.relays, warnings: [] }),
      nips: failure,
    });
    expect(nipsOnly.ok ? "" : nipsOnly.error.code).toBe("no-data");
  });
  test("buildSnapshot refuses to write invalid output", () => {
    if (committed === undefined) return;
    const r = buildSnapshot({
      now,
      previous: undefined,
      relays: ok({ stats: { ...committed.relays, online: -1 }, warnings: [] }),
      nips: ok(committed.nips),
    });
    expect(r.ok ? "" : r.error.code).toBe("invalid-output");
  });
});
