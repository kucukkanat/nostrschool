import { describe, expect, test } from "bun:test";
import { parseNipQuery } from "@nostrschool/nips";
import { createLexicalIndex } from "./lexical.ts";
import {
  aggregateByNip,
  DEFAULT_TUNING,
  fuseScores,
  pinnedIds,
  rankResults,
  type SemanticChunkHit,
  type SemanticNipHit,
} from "./rank.ts";
import { ids, LISTINGS } from "./test-support.ts";

const known = new Set(ids(LISTINGS));
const lexicalIndex = createLexicalIndex(LISTINGS);
const chunk = (nip: string, section: string, similarity: number): SemanticChunkHit => ({
  chunk: {
    id: `${nip}:${section}:0`,
    nip,
    sectionId: section,
    heading: section,
    text: `${nip} ${section}`,
  },
  similarity,
});
const rank = (text: string, semantic?: readonly SemanticNipHit[], extra = {}) => {
  const parsed = parseNipQuery(text, known);
  return rankResults({
    query: { text, ...extra },
    parsed,
    listings: LISTINGS,
    lexical: parsed.text === "" ? [] : lexicalIndex.search(parsed.text),
    ...(semantic === undefined ? {} : { semantic }),
  });
};

describe("aggregateByNip", () => {
  test("best chunk per NIP gives similarity + snippet; 2nd chunk adds a little; noise dropped", () => {
    const out = aggregateByNip([
      chunk("57", "b", 0.5),
      chunk("57", "a", 0.6),
      chunk("25", "x", 0.62),
      chunk("01", "y", 0.1),
    ]);
    expect(ids(out)).toEqual(["57", "25"]);
    expect(out[0]).toMatchObject({ similarity: 0.6, snippet: { sectionId: "a" } });
    expect(out[0]?.score).toBeCloseTo(0.6 + DEFAULT_TUNING.secondChunkWeight * 0.5);
    expect(out[1]?.score).toBeCloseTo(0.62);
    expect(aggregateByNip([])).toEqual([]);
  });
});

describe("fuseScores", () => {
  test("each side normalised to its best; semantic floor counts zero", () => {
    const fused = fuseScores(
      [
        { id: "A", score: 10 },
        { id: "B", score: 5 },
      ],
      [
        { id: "B", score: 0.65 },
        { id: "C", score: DEFAULT_TUNING.minSimilarity },
      ],
      { ...DEFAULT_TUNING, weights: [1, 1] },
    );
    expect(fused).toEqual([
      { id: "B", score: 1.5 },
      { id: "A", score: 1 },
      { id: "C", score: 0 },
    ]);
    expect(fuseScores([], [])).toEqual([]);
  });
});

describe("pinnedIds", () => {
  test("ids, then kind definers before kind users, then tag users; deduplicated", () => {
    const pins = pinnedIds(parseNipQuery("nip-57 kind:9735 kind:1 #bolt11", known), LISTINGS);
    expect(pins[0]).toBe("57");
    const kind1 = pins.slice(1);
    expect(kind1[0]).toBe("10"); // defines kind 1 (README kinds table)
    expect(new Set(pins).size).toBe(pins.length);
    expect(pinnedIds(parseNipQuery("kind:39003", known), LISTINGS)).toEqual(["29"]);
  });

  test("an upper-case wire message type pins the NIPs defining it; prose 'ok' does not", () => {
    expect(pinnedIds(parseNipQuery("CLOSED message", known), LISTINGS)).toEqual(["01"]);
    expect(pinnedIds(parseNipQuery("AUTH", known), LISTINGS)).toEqual(["42"]);
    expect(pinnedIds(parseNipQuery("is it ok to repost", known), LISTINGS)).toEqual([]);
    expect(pinnedIds(parseNipQuery("FOO BAR", known), LISTINGS)).toEqual([]);
  });

  test("a typed identifier pins its defining NIP, not the NIPs that mention it", () => {
    const pins = (q: string) => pinnedIds(parseNipQuery(q, known), LISTINGS);
    expect(pins("supported_nips")).toEqual(["11"]);
    expect(pins("relays field of nostr.json")).toEqual(["05"]);
    expect(pins('"d" tag addressable')).toEqual(["01"]);
    expect(pins("lud16")).toEqual(["57"]);
    // Plain words, unknown identifiers and filtered-out definers pin nothing.
    expect(pins("d tag addressable")).toEqual([]);
    expect(pins("some_unknown_field")).toEqual([]);
    const no11 = LISTINGS.filter((n) => n.id !== "11");
    expect(pinnedIds(parseNipQuery("supported_nips", known), no11)).toEqual([]);
    // An explicit table replaces the committed one.
    const table = { version: 1 as const, commit: "", terms: { x_y: [["23", 1]] as const } };
    expect(pinnedIds(parseNipQuery("x_y supported_nips", known), LISTINGS, table)).toEqual(["23"]);
  });
});

describe("rankResults", () => {
  test("empty query browses everything (filtered) in README order", () => {
    const all = rank("");
    expect(all.mode).toBe("lexical");
    expect(all.hits.length).toBe(LISTINGS.length);
    expect(all.hits.slice(0, 3).map((h) => h.id)).toEqual(["01", "02", "03"]);
    const unrec = rank("", undefined, { filters: { statuses: ["unrecommended"] } });
    expect(
      unrec.hits.every((h) => LISTINGS.find((n) => n.id === h.id)?.status === "unrecommended"),
    ).toBe(true);
  });

  test("shortcut-only query returns just the pinned NIPs", () => {
    const r = rank("kind:9735");
    expect(r.hits.map((h) => h.id)).toEqual(["57"]);
    expect(r.hits[0]?.pinned).toBe(true);
  });

  test("bare id is pinned above text matches; limit applies last", () => {
    const r = rank("57 reactions", undefined, { limit: 2 });
    expect(r.hits.map((h) => h.id)).toEqual(["57", "25"]);
    expect(r.hits[0]?.score).toBeGreaterThan(r.hits[1]?.score ?? Infinity);
    expect(rank("zaps", undefined, { limit: -1 }).hits).toEqual([]);
  });

  test("hybrid merges both sides and prefers the semantic snippet", () => {
    const semantic = aggregateByNip([
      chunk("09", "client-usage", 0.7),
      chunk("57", "protocol-flow", 0.3),
    ]);
    const r = rank("zaps", semantic);
    expect(r.mode).toBe("hybrid");
    const zap = r.hits.find((h) => h.id === "57");
    expect(zap).toMatchObject({ lexicalRank: 0, semanticRank: 1, similarity: 0.3 });
    expect(zap?.snippet?.sectionId).toBe("protocol-flow");
    const deletion = r.hits.find((h) => h.id === "09");
    expect(deletion?.lexicalRank).toBeUndefined();
    expect(deletion?.terms).toEqual([]);
  });

  test("filters apply to both sides; semantic depth is capped", () => {
    const semantic = aggregateByNip([chunk("04", "a", 0.9), chunk("17", "a", 0.8)]);
    const r = rank("direct message", semantic, { filters: { statuses: ["unrecommended"] } });
    expect(r.hits.map((h) => h.id)).toContain("04");
    expect(r.hits.map((h) => h.id)).not.toContain("17");
    const capped = rankResults({
      query: { text: "x" },
      parsed: parseNipQuery("x"),
      listings: LISTINGS,
      lexical: [],
      semantic,
      tuning: { ...DEFAULT_TUNING, semanticDepth: 1 },
    });
    expect(capped.hits.map((h) => h.id)).toEqual(["04"]);
  });

  test("meaning-only hits need semanticOnlyMinSimilarity; keyword hits never do", () => {
    const threshold = DEFAULT_TUNING.semanticOnlyMinSimilarity;
    const semantic = aggregateByNip([
      chunk("09", "a", threshold + 0.05),
      chunk("25", "a", threshold - 0.05),
      chunk("57", "a", threshold - 0.1),
    ]);
    const got = rank("zaps", semantic).hits.map((h) => h.id);
    expect(got).toEqual(expect.arrayContaining(["57", "09"]));
    expect(got).not.toContain("25");
    expect(rank("qwrtp", aggregateByNip([chunk("25", "a", threshold - 0.01)])).hits).toEqual([]);
  });

  test("a lexical heading match yields a heading snippet", () => {
    const r = rank("appendix");
    const zap = r.hits.find((h) => h.id === "57");
    expect(zap?.snippet).toMatchObject({ sectionId: "appendix-a-zap-request-event", text: "" });
    // Matched elsewhere (title only) → no snippet.
    expect(rank("zaps").hits.find((h) => h.id === "57")?.snippet).toBeUndefined();
  });
});
