import { describe, expect, test } from "bun:test";
import { ECOSYSTEM } from "./data.ts";
import {
  clientTree,
  countAt,
  easeOutCubic,
  filterClients,
  fociOf,
  growthAt,
  growthSeries,
  isView,
  justCompleted,
  markVisited,
  nipHref,
  relabel,
  share,
  toggleIn,
  topNamed,
  VIEWS,
  type View,
} from "./ecosystem.ts";
import { type ClientEntry, parseEcosystem } from "./schema.ts";

const clients: readonly ClientEntry[] = [
  { id: "a", name: "A", url: "https://a", platforms: ["ios", "android"], focus: "social" },
  { id: "b", name: "B", url: "https://b", platforms: ["web"], focus: "chat" },
  { id: "c", name: "C", url: "https://c", platforms: ["web", "desktop"], focus: "social" },
];
const label = (p: string) => p.toUpperCase();

describe("committed snapshot", () => {
  test("parses, with real numbers and a capture date", () => {
    expect(ECOSYSTEM.ok).toBe(true);
    if (!ECOSYSTEM.ok) return;
    expect(ECOSYSTEM.value.relays.online).toBeGreaterThan(0);
    expect(ECOSYSTEM.value.nips.total).toBeGreaterThan(0);
    expect(Number.isNaN(Date.parse(ECOSYSTEM.value.capturedAt))).toBe(false);
  });
});

describe("parseEcosystem", () => {
  test("reports the first offending path", () => {
    const r = parseEcosystem({ capturedAt: "nope" });
    expect(r.ok ? "" : r.error.path).toBe("ecosystem.capturedAt");
    expect(parseEcosystem(null).ok).toBe(false);
    expect(parseEcosystem([]).ok).toBe(false);
  });
  test("checks nested lists, enums and counts", () => {
    if (!ECOSYSTEM.ok) throw new Error("snapshot invalid");
    const base = ECOSYSTEM.value;
    const bad = (patch: object) => {
      const r = parseEcosystem({ ...base, ...patch });
      return r.ok ? "" : r.error.path;
    };
    expect(bad({ sources: "x" })).toBe("ecosystem.sources");
    expect(bad({ sources: [{ ...base.sources[0], status: "maybe" }] })).toBe(
      "ecosystem.sources.0.status",
    );
    const src = base.sources[0];
    expect(bad({ sources: [{ ...src, detail: { kind: "rumor" } }] })).toBe(
      "ecosystem.sources.0.detail.kind",
    );
    expect(bad({ sources: [{ ...src, detail: null }] })).toBe("ecosystem.sources.0.detail.kind");
    expect(
      bad({ sources: [{ ...src, detail: { kind: "nip66", monitorRelays: [], windowHours: 1 } }] }),
    ).toBe("ecosystem.sources.0.detail.partial");
    expect(bad({ sources: [{ ...src, lastError: 3 }] })).toBe("ecosystem.sources.0.lastError");
    expect(parseEcosystem({ ...base, sources: [{ ...src, lastError: "down" }] }).ok).toBe(true);
    expect(bad({ relays: { ...base.relays, online: 1.5 } })).toBe("ecosystem.relays.online");
    expect(bad({ nips: { ...base.nips, sourceId: 3 } })).toBe("ecosystem.nips.sourceId");
  });
});

test("isView", () => {
  expect(VIEWS.every(isView)).toBe(true);
  expect(isView("nope")).toBe(false);
});

test("share clamps and survives zero totals", () => {
  expect(share(1, 4)).toBe(0.25);
  expect(share(5, 4)).toBe(1);
  expect(share(-1, 4)).toBe(0);
  expect(share(1, 0)).toBe(0);
});

test("toggleIn is immutable", () => {
  const s = new Set(["a"]);
  const added = toggleIn(s, "b");
  const removed = toggleIn(added, "a");
  expect([...s]).toEqual(["a"]);
  expect([...added]).toEqual(["a", "b"]);
  expect([...removed]).toEqual(["b"]);
});

describe("filterClients", () => {
  test("no filters → everything", () => {
    expect(filterClients(clients, new Set(), "all")).toEqual(clients);
  });
  test("platforms are OR-ed; focus narrows", () => {
    expect(filterClients(clients, new Set(["ios", "desktop"]), "all").map((c) => c.id)).toEqual([
      "a",
      "c",
    ]);
    expect(filterClients(clients, new Set(["web"]), "social").map((c) => c.id)).toEqual(["c"]);
    expect(filterClients(clients, new Set(["android"]), "chat")).toEqual([]);
  });
  test("fociOf lists occurring foci once", () => {
    expect(fociOf(clients)).toEqual(["social", "chat"]);
  });
});

test("clientTree groups clients under platforms and drops empty ones", () => {
  const tree = clientTree([clients[1] as ClientEntry], "All", label);
  expect(tree).toEqual({
    id: "clients",
    label: "All",
    children: [{ id: "web", label: "WEB", children: [{ id: "web-b", label: "B", value: 1 }] }],
  });
});

describe("growth", () => {
  const growth = [
    { date: "2022-06-30", count: 10 },
    { date: "2022-09-30", count: 20 },
  ];
  test("growthSeries parses dates as UTC", () => {
    const s = growthSeries(growth, "n", "NIPs");
    expect(s.points[1]?.x.toISOString()).toBe("2022-09-30T00:00:00.000Z");
    expect(s.points.map((p) => p.y)).toEqual([10, 20]);
  });
  test("growthAt clamps and rounds", () => {
    expect(growthAt(growth, -3)?.count).toBe(10);
    expect(growthAt(growth, 0.6)?.count).toBe(20);
    expect(growthAt(growth, Number.POSITIVE_INFINITY)?.count).toBe(20);
    expect(growthAt([], 0)).toBeUndefined();
  });
});

test("relabel swaps known ids only", () => {
  expect(
    relabel(
      [
        { id: "tor", label: "tor", value: 1 },
        { id: "x", label: "x", value: 2 },
      ],
      { tor: "Tor" },
    ).map((c) => c.label),
  ).toEqual(["Tor", "x"]);
});

test("topNamed skips the other/unknown buckets", () => {
  expect(
    topNamed([
      { id: "unknown", label: "?", value: 9 },
      { id: "a", label: "a", value: 1 },
      { id: "b", label: "b", value: 3 },
      { id: "other", label: "o", value: 8 },
    ])?.id,
  ).toBe("b");
  expect(topNamed([])).toBeUndefined();
});

test("nipHref", () => {
  expect(nipHref("5A")).toBe("https://github.com/nostr-protocol/nips/blob/master/5A.md");
});

describe("tour", () => {
  test("markVisited keeps identity when nothing changes", () => {
    const s: ReadonlySet<View> = new Set(["relays"]);
    expect(markVisited(s, "relays")).toBe(s);
    expect([...markVisited(s, "nips")]).toEqual(["relays", "nips"]);
  });
  test("justCompleted fires only on the transition to all views", () => {
    const three: ReadonlySet<View> = new Set(["relays", "nips", "growth"]);
    const all = markVisited(three, "clients");
    expect(justCompleted(three, all)).toBe(true);
    expect(justCompleted(all, all)).toBe(false);
    expect(justCompleted(three, three)).toBe(false);
  });
});

test("count-up easing", () => {
  expect(easeOutCubic(0)).toBe(0);
  expect(easeOutCubic(1)).toBe(1);
  expect(easeOutCubic(2)).toBe(1);
  expect(easeOutCubic(-1)).toBe(0);
  expect(easeOutCubic(0.5)).toBeGreaterThan(0.5);
  expect(countAt(1000, 1)).toBe(1000);
  expect(countAt(1000, 0)).toBe(0);
});
