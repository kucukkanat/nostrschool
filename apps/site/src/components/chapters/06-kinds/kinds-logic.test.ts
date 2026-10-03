import { describe, expect, test } from "bun:test";
import { getDictionary } from "@nostrschool/i18n";
import { classifyKind, KIND_CATEGORIES, KINDS } from "@nostrschool/protocol";
import {
  CATEGORY_RANGES,
  countByCategory,
  describeKind,
  exploredCategories,
  filterKinds,
  formatRanges,
  gridColumns,
  gridMove,
  inNip01Range,
  kindSymbol,
  localizeKinds,
  matchesQuery,
  nipLabel,
  parseKindNumber,
  reqForKind,
  toggleCategory,
} from "./kinds-logic.ts";

const entries = localizeKinds(getDictionary("en").kinds.names);
const all = new Set(KIND_CATEGORIES);
const byKind = (k: number) => {
  const e = entries.find((x) => x.kind === k);
  if (e === undefined) throw new Error(`kind ${k} missing`);
  return e;
};

describe("localizeKinds", () => {
  test("every registry kind has a localized name and description (no fallbacks needed)", () => {
    expect(entries).toHaveLength(KINDS.length);
    for (const e of entries) {
      expect(e.label.length).toBeGreaterThan(0);
      expect(e.description.length).toBeGreaterThan(0);
    }
  });
  test("falls back to the registry name when a locale lacks the key", () => {
    const [entry] = localizeKinds(getDictionary("en").kinds.names, [
      { kind: 4242, name: "Made up", category: "regular", nip: "XX", i18nKey: "k4242" },
    ]);
    expect(entry?.label).toBe("Made up");
    expect(entry?.description).toBe("");
    expect(entry?.symbol).toBe("Mu");
  });
});

describe("kindSymbol", () => {
  test.each([
    ["Short text note", "St"],
    ["Reaction", "Re"],
    ["HTTP auth", "Ha"],
    ["Date-based calendar event", "Db"],
    ["", ""],
    ["x", "X"],
  ])("%p → %p", (label, symbol) => expect(kindSymbol(label)).toBe(symbol));
});

describe("matchesQuery / filterKinds", () => {
  test("empty query matches everything", () => {
    expect(matchesQuery(byKind(1), "  ")).toBe(true);
  });
  test("number prefix, name, description and NIP", () => {
    expect(matchesQuery(byKind(30023), "300")).toBe(true);
    expect(matchesQuery(byKind(7), "REACT")).toBe(true);
    expect(matchesQuery(byKind(0), "lud16")).toBe(true);
    expect(matchesQuery(byKind(9735), "nip-57")).toBe(true);
    expect(matchesQuery(byKind(9735), "57")).toBe(true);
    expect(matchesQuery(byKind(1), "nip")).toBe(false);
    expect(matchesQuery(byKind(1), "zzz")).toBe(false);
  });
  test("filters by category and query together", () => {
    const eph = filterKinds(entries, { categories: new Set(["ephemeral"]), query: "" });
    expect(eph.every((e) => e.category === "ephemeral")).toBe(true);
    expect(eph.map((e) => e.kind)).toContain(22242);
    expect(
      filterKinds(entries, { categories: all, query: "relay list" }).map((e) => e.kind),
    ).toEqual([10002, 10050]);
  });
  test("counts per category add up", () => {
    const counts = countByCategory(entries);
    expect(Object.values(counts).reduce((a, b) => a + b, 0)).toBe(entries.length);
    expect(counts.ephemeral).toBe(5);
  });
});

describe("toggleCategory", () => {
  test("toggles off and on", () => {
    const off = toggleCategory(all, "regular");
    expect(off.has("regular")).toBe(false);
    expect(toggleCategory(off, "regular").has("regular")).toBe(true);
  });
  test("never empties the selection", () => {
    const one = new Set(["ephemeral"] as const);
    expect(toggleCategory(one, "ephemeral")).toBe(one);
  });
});

describe("ranges", () => {
  test("format", () => {
    expect(formatRanges(CATEGORY_RANGES.regular)).toBe("1–2, 4–44, 1000–9999");
    expect(formatRanges(CATEGORY_RANGES.replaceable)).toBe("0, 3, 10000–19999");
  });
  test("agree with protocol classifyKind inside every range", () => {
    for (const c of KIND_CATEGORIES)
      for (const [a, b] of CATEGORY_RANGES[c]) {
        expect(classifyKind(a)).toBe(c);
        expect(classifyKind(b)).toBe(c);
      }
  });
  test("gaps outside NIP-01 ranges", () => {
    expect(inNip01Range(45)).toBe(false);
    expect(inNip01Range(999)).toBe(false);
    expect(inNip01Range(40000)).toBe(false);
    expect(inNip01Range(0)).toBe(true);
    expect(inNip01Range(39999)).toBe(true);
  });
  test("nipLabel", () => expect(nipLabel("7D")).toBe("NIP-7D"));
});

describe("parseKindNumber", () => {
  test("valid", () => {
    expect(parseKindNumber(" 30023 ")).toEqual({ ok: true, value: 30023 });
    expect(parseKindNumber("0")).toEqual({ ok: true, value: 0 });
    expect(parseKindNumber("65535")).toEqual({ ok: true, value: 65535 });
  });
  test.each([
    ["", "empty"],
    ["   ", "empty"],
    ["1.5", "not-an-integer"],
    ["abc", "not-an-integer"],
    ["-1", "out-of-range"],
    ["65536", "out-of-range"],
  ])("%p → %p", (input, code) => {
    const r = parseKindNumber(input);
    expect(r.ok).toBe(false);
    if (!r.ok) expect<string>(r.error.code).toBe(code);
  });
});

describe("describeKind / exploredCategories", () => {
  test("known, unknown in-range and out-of-range kinds", () => {
    expect(describeKind(30023)).toMatchObject({ category: "addressable", inRange: true });
    expect(describeKind(30023).info?.nip).toBe("23");
    expect(describeKind(20001)).toMatchObject({
      category: "ephemeral",
      inRange: true,
      info: undefined,
    });
    expect(describeKind(500)).toMatchObject({ category: "regular", inRange: false });
  });
  test("explored categories", () => {
    expect([...exploredCategories([1, 7, 0])].sort()).toEqual(["regular", "replaceable"]);
    expect(exploredCategories([]).size).toBe(0);
  });
});

describe("gridMove", () => {
  test("horizontal moves clamp at the ends", () => {
    expect(gridMove(10, 4, 0, "ArrowLeft")).toBe(0);
    expect(gridMove(10, 4, 0, "ArrowRight")).toBe(1);
    expect(gridMove(10, 4, 9, "ArrowRight")).toBe(9);
  });
  test("vertical moves by a row and stays when no row exists", () => {
    expect(gridMove(10, 4, 1, "ArrowDown")).toBe(5);
    expect(gridMove(10, 4, 7, "ArrowDown")).toBe(7);
    expect(gridMove(10, 4, 5, "ArrowUp")).toBe(1);
    expect(gridMove(10, 4, 1, "ArrowUp")).toBe(1);
  });
  test("home/end, unknown keys, empty grid, bad columns", () => {
    expect(gridMove(10, 4, 5, "Home")).toBe(0);
    expect(gridMove(10, 4, 5, "End")).toBe(9);
    expect(gridMove(10, 4, 5, "a")).toBeUndefined();
    expect(gridMove(0, 4, 0, "ArrowRight")).toBeUndefined();
    expect(gridMove(10, 0, 2, "ArrowDown")).toBe(3);
  });
});

describe("gridColumns", () => {
  test("counts resolved tracks, ignoring spaces inside functions", () => {
    expect(gridColumns("80px 80px 80px")).toBe(3);
    expect(gridColumns("repeat(auto-fill, minmax(64px, 1fr))")).toBe(1);
    expect(gridColumns("none")).toBe(1);
    expect(gridColumns("")).toBe(1);
  });
});

test("reqForKind is a valid REQ message", () => {
  expect(JSON.parse(reqForKind(7))).toEqual(["REQ", "kinds-demo", { kinds: [7], limit: 10 }]);
});
