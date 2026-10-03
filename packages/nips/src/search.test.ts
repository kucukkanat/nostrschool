import { describe, expect, test } from "bun:test";
import {
  compareNipIds,
  facetCounts,
  filterNips,
  fuseRankings,
  nipCoversKind,
  parseNipQuery,
  sortNips,
} from "./search.ts";
import { listNips } from "./specs/index.ts";

const nips = listNips();
const ids = (xs: readonly { readonly id: string }[]) => xs.map((x) => x.id);
const known = new Set(ids(nips));

describe("filters", () => {
  test("no filters keeps everything; facets AND, values OR", () => {
    expect(filterNips(nips, {}).length).toBe(nips.length);
    expect(filterNips(nips, { statuses: [], variants: [] }).length).toBe(nips.length);
    const unrec = filterNips(nips, { statuses: ["unrecommended"] });
    expect(ids(unrec)).toContain("04");
    expect(unrec.every((n) => n.status === "unrecommended")).toBe(true);
    const relayDrafts = filterNips(nips, { statuses: ["draft"], relay: true });
    expect(relayDrafts.every((n) => n.relay && n.status === "draft")).toBe(true);
    expect(ids(filterNips(nips, { kind: 9735 }))).toEqual(["57"]);
    expect(ids(filterNips(nips, { kind: 39003 }))).toContain("29");
    expect(ids(filterNips(nips, { tag: "bolt11" }))).toContain("57");
    const variant = nips[0]?.variant ?? "event";
    expect(filterNips(nips, { variants: [variant] }).every((n) => n.variant === variant)).toBe(
      true,
    );
  });

  test("kind coverage uses ranges and examples", () => {
    const n29 = nips.find((n) => n.id === "29");
    expect(n29 !== undefined && nipCoversKind(n29, 9010)).toBe(true);
    expect(n29 !== undefined && nipCoversKind(n29, 1)).toBe(false);
  });

  test("facet counts add up", () => {
    const f = facetCounts(nips);
    expect(Object.values(f.statuses).reduce((a, b) => a + b, 0)).toBe(nips.length);
    expect(Object.values(f.variants).reduce((a, b) => a + b, 0)).toBe(nips.length);
    expect(f.relay).toBe(nips.filter((n) => n.relay).length);
  });
});

describe("sorting", () => {
  test("ids follow README (hex) order", () => {
    expect(compareNipIds("59", "5A")).toBeLessThan(0);
    expect(compareNipIds("5A", "60")).toBeLessThan(0);
    expect(compareNipIds("99", "A0")).toBeLessThan(0);
    const sorted = ids(sortNips([...nips].reverse(), "id"));
    expect(sorted.slice(0, 2)).toEqual(["01", "02"]);
    expect(sorted.indexOf("7D")).toBe(sorted.indexOf("78") + 1);
  });

  test("title and updated", () => {
    const byTitle = sortNips(nips, "title");
    for (let i = 1; i < byTitle.length; i++)
      expect(
        (byTitle[i - 1]?.title ?? "").localeCompare(byTitle[i]?.title ?? "", "en"),
      ).toBeLessThanOrEqual(0);
    const fake = [
      { ...nips[0], id: "02", updatedAt: null },
      { ...nips[0], id: "01", updatedAt: "2024-01-01" },
      { ...nips[0], id: "03", updatedAt: "2025-01-01" },
    ].filter((n): n is (typeof nips)[number] => n.title !== undefined);
    expect(ids(sortNips(fake, "updated"))).toEqual(["03", "01", "02"]);
  });
});

describe("query shortcuts", () => {
  test("kinds, tags and explicit NIPs are consumed", () => {
    expect(parseNipQuery("zap kind:9735 #bolt11 nip-57", known)).toEqual({
      text: "zap",
      ids: ["57"],
      kinds: [9735],
      tags: ["bolt11"],
    });
    expect(parseNipQuery("k:1 tag:imeta NIP5A", known)).toEqual({
      text: "",
      ids: ["5A"],
      kinds: [1],
      tags: ["imeta"],
    });
  });

  test("bare numbers pin but stay searchable; letter ids need capitals", () => {
    expect(parseNipQuery("57", known)).toEqual({ text: "57", ids: ["57"], kinds: [], tags: [] });
    expect(parseNipQuery("7d threads", known).ids).toEqual(["7D"]);
    expect(parseNipQuery("EE mls", known).ids).toEqual(["EE"]);
    expect(parseNipQuery("be quick", known).ids).toEqual([]);
    expect(parseNipQuery("41 nip-41", known)).toEqual({
      text: "41 nip-41",
      ids: [],
      kinds: [],
      tags: [],
    });
    expect(parseNipQuery("41").ids).toEqual(["41"]);
    expect(parseNipQuery("   ").text).toBe("");
    // "kind 9735" (space) is the same shortcut as "kind:9735"; "kind" alone stays text.
    expect(parseNipQuery("zap KIND 9735", known)).toEqual({
      text: "zap",
      ids: [],
      kinds: [9735],
      tags: [],
    });
    expect(parseNipQuery("kind of zap", known).text).toBe("kind of zap");
    expect(parseNipQuery("which kind", known).kinds).toEqual([]);
    // Bare 3+ digit numbers count as kinds only when registered (and stay in the text).
    const isKnownKind = (k: number) => k === 9735 || (k >= 9000 && k <= 9030);
    expect(parseNipQuery("9735", known, isKnownKind)).toEqual({
      text: "9735",
      ids: [],
      kinds: [9735],
      tags: [],
    });
    expect(parseNipQuery("9007 2024", known, isKnownKind).kinds).toEqual([9007]);
    expect(parseNipQuery("9735", known).kinds).toEqual([]);
    expect(parseNipQuery("57", known, isKnownKind)).toEqual({
      text: "57",
      ids: ["57"],
      kinds: [],
      tags: [],
    });
  });
});

describe("rank fusion", () => {
  test("items ranked well by both lists win; weights apply; ties keep order", () => {
    const fused = fuseRankings([
      [{ id: "a" }, { id: "b" }, { id: "c" }],
      [{ id: "b" }, { id: "c" }, { id: "d" }],
    ]);
    expect(fused.map((f) => f.id)).toEqual(["b", "c", "a", "d"]);
    const weighted = fuseRankings([[{ id: "a" }], [{ id: "b" }]], { weights: [1, 2], k: 1 });
    expect(weighted).toEqual([
      { id: "b", score: 1 },
      { id: "a", score: 0.5 },
    ]);
    expect(fuseRankings([])).toEqual([]);
  });
});
