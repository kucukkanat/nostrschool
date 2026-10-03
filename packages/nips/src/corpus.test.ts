import { describe, expect, test } from "bun:test";
import { toIndex } from "./corpus/parse.ts";
import { getNipDocument, NIP_CORPUS } from "./corpus.ts";
import { getNipMeta, kindRegistryRows, NIP_IDS, NIP_INDEX } from "./index.ts";
import { isNipId, NIP_STATUSES, normalizeNipId } from "./types.ts";

// corpus.ts / index.ts widen the imported JSON to the corpus types; these checks are what make
// that widening safe after every `bun run snapshot:nips`.
const isStringArray = (x: unknown): boolean =>
  Array.isArray(x) && x.every((v) => typeof v === "string");

describe("committed snapshot", () => {
  test("source is pinned to a full commit SHA", () => {
    expect(NIP_CORPUS.source.commit).toMatch(/^[0-9a-f]{40}$/);
    expect(NIP_CORPUS.source.repo).toBe("https://github.com/nostr-protocol/nips");
    expect(Number.isNaN(Date.parse(NIP_CORPUS.source.committedAt))).toBe(false);
  });

  test("every NIP has the documented shape", () => {
    expect(NIP_CORPUS.nips.length).toBeGreaterThan(90);
    for (const n of NIP_CORPUS.nips) {
      expect(isNipId(n.id)).toBe(true);
      expect(n.title.length).toBeGreaterThan(0);
      expect(typeof n.summary).toBe("string");
      expect(NIP_STATUSES).toContain(n.status);
      expect([null, "draft", "final"]).toContain(n.maturity);
      expect([null, "mandatory", "optional"]).toContain(n.requirement);
      expect(typeof n.relay).toBe("boolean");
      expect(typeof n.listed).toBe("boolean");
      for (const arr of [n.statusTags, n.tags, n.mentions, n.mentionedBy, n.headings])
        expect(isStringArray(arr)).toBe(true);
      expect(n.exampleKinds.every(Number.isInteger)).toBe(true);
      for (const k of n.kinds) {
        expect(Number.isInteger(k.kind)).toBe(true);
        expect(typeof k.description).toBe("string");
      }
      for (const m of n.messages)
        expect(["client-to-relay", "relay-to-client"]).toContain(m.direction);
      expect(n.url).toBe(`${NIP_CORPUS.source.repo}/blob/${NIP_CORPUS.source.commit}/${n.id}.md`);
      expect(n.updatedAt === null || !Number.isNaN(Date.parse(n.updatedAt))).toBe(true);
      expect(n.markdown.length).toBeGreaterThan(0);
      expect(n.sections.length).toBeGreaterThan(0);
      if (n.status === "deprecated") expect(n.listed && n.movedTo === undefined).toBe(false);
    }
  });

  test("index.json is exactly the corpus without markdown", () => {
    expect(JSON.parse(JSON.stringify(toIndex(NIP_CORPUS)))).toEqual(
      JSON.parse(JSON.stringify(NIP_INDEX)),
    );
  });

  test("lookups", () => {
    expect(NIP_IDS[0]).toBe("01");
    expect(getNipMeta("57")?.title).toBe("Lightning Zaps");
    expect(getNipMeta("ZZ")).toBeUndefined();
    expect(getNipDocument("01")?.markdown).toContain("NIP-01");
    expect(getNipDocument("ZZ")).toBeUndefined();
    expect(kindRegistryRows(9735).flatMap((r) => r.nips)).toEqual(["57"]);
    expect(kindRegistryRows(39005).flatMap((r) => r.nips)).toEqual(["29"]);
  });
});

describe("NIP ids", () => {
  test("guards and normalisation", () => {
    expect(isNipId("01")).toBe(true);
    expect(isNipId("7D")).toBe(true);
    expect(isNipId("7d")).toBe(false);
    expect(isNipId(1)).toBe(false);
    expect(normalizeNipId("1")).toBe("01");
    expect(normalizeNipId(" nip-57 ")).toBe("57");
    expect(normalizeNipId("NIP 5a")).toBe("5A");
    expect(normalizeNipId("nip_c7")).toBe("C7");
    expect(normalizeNipId("100")).toBeUndefined();
    expect(normalizeNipId("zz")).toBeUndefined();
  });
});
