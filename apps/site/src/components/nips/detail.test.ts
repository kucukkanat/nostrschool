import { describe, expect, test } from "bun:test";
import { getNipMeta, NIP_IDS } from "@nostrschool/nips";
import { getSpec } from "@nostrschool/nips/specs";
import {
  buildCourseMap,
  groupRelated,
  nipNeighbors,
  RELATION_ORDER,
  relatedEntries,
} from "./detail.ts";

describe("buildCourseMap", () => {
  test("maps each NIP to its chapters in course order, normalising ids", () => {
    const map = buildCourseMap([
      { nn: "09", title: "Zaps", href: "/z/", nips: ["57", "01"] },
      { nn: "02", title: "Keys", href: "/k/", nips: ["01", "19", "nip-5a", "01", "zz"] },
    ]);
    expect(map["01"]?.map((c) => c.nn)).toEqual(["02", "09"]);
    expect(map["57"]).toEqual([{ nn: "09", title: "Zaps", href: "/z/" }]);
    expect(map["5A"]?.map((c) => c.nn)).toEqual(["02"]);
    expect(Object.keys(map).sort()).toEqual(["01", "19", "57", "5A"]);
  });
});

describe("nipNeighbors", () => {
  test("first, middle, last and unknown ids", () => {
    const ids = ["01", "02", "5A"];
    expect(nipNeighbors(ids, "01")).toEqual({ next: "02" });
    expect(nipNeighbors(ids, "02")).toEqual({ prev: "01", next: "5A" });
    expect(nipNeighbors(ids, "5A")).toEqual({ prev: "02" });
    expect(nipNeighbors(ids, "99")).toEqual({});
  });

  test("every corpus NIP but the ends has both", () => {
    const middle = NIP_IDS.slice(1, -1);
    for (const id of middle)
      expect(Object.keys(nipNeighbors(NIP_IDS, id))).toEqual(["prev", "next"]);
  });
});

describe("related NIPs", () => {
  const meta = { id: "57", mentions: ["01", "65", "99", "57"], mentionedBy: ["47", "01"] };
  const known = new Set(["01", "47", "65", "57", "10"]);

  test("curated relations first with explanations, then corpus links as see-also / used-by", () => {
    const entries = relatedEntries(
      [
        { nip: "01", relation: "depends-on", explain: "k.base" },
        { nip: "10", relation: "see-also" },
        { nip: "98", relation: "extends" },
        { nip: "57", relation: "see-also" },
      ],
      meta,
      known,
      (key) => (key === "k.base" ? "Events come from NIP-01." : undefined),
    );
    expect(entries).toEqual([
      { nip: "01", relation: "depends-on", explain: "Events come from NIP-01." },
      { nip: "47", relation: "used-by" },
      { nip: "10", relation: "see-also" },
      { nip: "65", relation: "see-also" },
    ]);
  });

  test("a missing explanation text is left out rather than shown as a key", () => {
    const [entry] = relatedEntries(
      [{ nip: "01", relation: "extends", explain: "missing" }],
      { id: "02", mentions: [], mentionedBy: [] },
      known,
      () => undefined,
    );
    expect(entry).toEqual({ nip: "01", relation: "extends" });
  });

  test("groupRelated follows RELATION_ORDER and skips empty groups", () => {
    const groups = groupRelated([
      { nip: "65", relation: "see-also" },
      { nip: "01", relation: "depends-on" },
      { nip: "10", relation: "see-also" },
    ]);
    expect(groups.map((g) => g.relation)).toEqual(["depends-on", "see-also"]);
    expect(groups[1]?.entries.map((e) => e.nip)).toEqual(["65", "10"]);
    expect(RELATION_ORDER).toHaveLength(6);
  });

  test("works on every real spec: only corpus ids, never the NIP itself", () => {
    const all = new Set(NIP_IDS);
    for (const id of NIP_IDS) {
      const spec = getSpec(id);
      const m = getNipMeta(id);
      if (spec === undefined || m === undefined) throw new Error(`missing ${id}`);
      for (const e of relatedEntries(spec.related, m, all, () => undefined)) {
        expect(all.has(e.nip)).toBe(true);
        expect(e.nip).not.toBe(id);
      }
    }
  });
});
