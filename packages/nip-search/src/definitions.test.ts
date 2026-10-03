import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import { NIP_INDEX } from "@nostrschool/nips";
import { buildDefinitions, definitionsFileText } from "./build.ts";
import {
  buildDefinitionTable,
  DEFINITION_OVERRIDES,
  DEFINITION_WEIGHTS,
  type DefinitionSource,
  extractDefinitions,
  identifierTerms,
  MAX_DEFINERS,
  NIP_DEFINITIONS,
  type NipDefinitions,
  parseDefinitions,
  primaryDefiners,
  termsByNip,
} from "./definitions.ts";
import { DATA_DIR } from "./test-support.ts";

const doc = (id: string, markdown: string, mentions: readonly string[] = []): DefinitionSource => ({
  id,
  markdown,
  mentions,
});

describe("extractDefinitions", () => {
  test("each markdown construct counts with its weight", () => {
    const md = [
      "## The `relay_info` document",
      "### Reasoning for nostr.json format",
      "| `max_limit` | number |",
      "- `lud16` Recommended. A lightning address.",
      "- The `e` tag, used to refer to an event",
      "Events are **addressable** by their `kind` and `d` tag value.",
      "```json",
      '{ "supported_nips": [1], "Name": "x" }',
      "```",
      "A plain `mention_only` in prose, and a list item without code.",
    ].join("\n");
    expect(Object.fromEntries(extractDefinitions(md))).toEqual({
      relay_info: DEFINITION_WEIGHTS.heading,
      "nostr.json": DEFINITION_WEIGHTS.heading,
      max_limit: DEFINITION_WEIGHTS.table,
      lud16: DEFINITION_WEIGHTS.list,
      e: DEFINITION_WEIGHTS.list,
      addressable: DEFINITION_WEIGHTS.bold,
      kind: DEFINITION_WEIGHTS.boldContext,
      d: DEFINITION_WEIGHTS.boldContext,
      supported_nips: DEFINITION_WEIGHTS.json,
      name: DEFINITION_WEIGHTS.json,
    });
  });

  test("repeats add up to two per construct; numbers and long text are not identifiers", () => {
    const md = "**client** **client** **client** **client**\n- `0`: metadata\n- `has spaces here`";
    expect(Object.fromEntries(extractDefinitions(md))).toEqual({
      client: 2 * DEFINITION_WEIGHTS.bold,
    });
    expect(extractDefinitions(`- \`${"x".repeat(41)}\``).size).toBe(0);
  });
});

describe("buildDefinitionTable", () => {
  test("a NIP linking the definer reuses it; NIP-01 is everyone's base; strongest first", () => {
    const table = buildDefinitionTable(
      [
        doc("01", "- `d` the identifier"),
        doc("11", '```\n{ "supported_nips": [], "supported_nips": [] }\n```'),
        doc("29", '```\n{ "supported_nips": [] }\n```', ["11"]),
        doc("96", '```\n{ "supported_nips": [] }\n```'),
        doc("52", "- `d` the identifier\n- `d` again"),
      ],
      "abc",
      {},
    );
    expect(table).toEqual({
      version: 1,
      commit: "abc",
      terms: {
        d: [["01", 2]],
        supported_nips: [
          ["11", 2],
          ["96", 1],
        ],
      },
    });
  });

  test("NIPs linking each other both keep the term; ties sort by id", () => {
    const table = buildDefinitionTable(
      [doc("A0", "- `x_y` one", ["B0"]), doc("B0", "- `x_y` two", ["A0"])],
      "c",
      {},
    );
    expect(table.terms["x_y"]).toEqual([
      ["A0", 2],
      ["B0", 2],
    ]);
  });

  test("generic terms (more than MAX_DEFINERS NIPs) are dropped", () => {
    const docs = Array.from({ length: MAX_DEFINERS + 1 }, (_, i) =>
      doc(String(i + 10), "- `content` text"),
    );
    expect(buildDefinitionTable(docs, "c", {}).terms).toEqual({});
  });

  test("overrides go first, also for terms no structure found, and never via the prototype", () => {
    const table = buildDefinitionTable(
      [
        doc("47", "- `lud16` a param"),
        doc("57", "- `lud16` also listed"),
        doc("02", "**constructor**"),
      ],
      "c",
      { lud16: "57", lud06: "57" },
    );
    expect(table.terms["lud16"]).toEqual([
      ["57", 100],
      ["47", 2],
    ]);
    expect(table.terms["lud06"]).toEqual([["57", 100]]);
    expect(table.terms["constructor"]).toEqual([["02", 2]]);
  });
});

describe("the committed table", () => {
  test("is the pinned corpus' table, byte for byte (`bun run … definitions` rebuilds it)", async () => {
    const committed = await Bun.file(join(DATA_DIR, "definitions.json")).text();
    expect(committed).toBe(definitionsFileText());
    expect(NIP_DEFINITIONS).toEqual(buildDefinitions());
    expect(NIP_DEFINITIONS.commit).toBe(NIP_INDEX.source.commit);
    // Ships to the browser: keep it small.
    expect(committed.length).toBeLessThan(40_000);
  });

  test("defining NIPs, not mentioning ones", () => {
    expect(primaryDefiners(NIP_DEFINITIONS, "supported_nips")).toEqual(["11"]);
    expect(primaryDefiners(NIP_DEFINITIONS, "max_message_length")).toEqual(["11"]);
    expect(primaryDefiners(NIP_DEFINITIONS, "nostr.json")).toEqual(["05"]);
    expect(primaryDefiners(NIP_DEFINITIONS, "d")).toEqual(["01"]);
    expect(primaryDefiners(NIP_DEFINITIONS, "addressable")).toEqual(["01"]);
    for (const [term, id] of Object.entries(DEFINITION_OVERRIDES))
      expect(primaryDefiners(NIP_DEFINITIONS, term)).toEqual([id]);
  });
});

describe("lookups", () => {
  const table: NipDefinitions = {
    version: 1,
    commit: "c",
    terms: {
      a_b: [
        ["01", 3],
        ["02", 3],
        ["03", 1],
      ],
      c: [["02", 2]],
    },
  };

  test("primaryDefiners keeps every top-strength tie; unknown and inherited names are empty", () => {
    expect(primaryDefiners(table, "a_b")).toEqual(["01", "02"]);
    expect(primaryDefiners(table, "nope")).toEqual([]);
    expect(primaryDefiners(table, "constructor")).toEqual([]);
  });

  test("termsByNip inverts the table", () => {
    expect(Object.fromEntries(termsByNip(table))).toEqual({
      "01": ["a_b"],
      "02": ["a_b", "c"],
      "03": ["a_b"],
    });
  });

  test("identifierTerms: identifier-shaped or quoted words only", () => {
    expect(
      identifierTerms(
        "supported_nips, the relays field of nostr.json lud16 \"d\" `relays` 'e' 9735 (x) a.",
      ),
    ).toEqual(["supported_nips", "nostr.json", "lud16", "d", "relays", "e"]);
    expect(identifierTerms("")).toEqual([]);
    expect(identifierTerms('"" ``')).toEqual([]);
  });
});

describe("parseDefinitions", () => {
  test("accepts the table shape, names what is wrong otherwise", () => {
    const good: NipDefinitions = { version: 1, commit: "c", terms: { x: [["01", 2]] } };
    expect(parseDefinitions(good)).toEqual({ ok: true, value: good });
    const code = (x: unknown) => {
      const r = parseDefinitions(x);
      return r.ok ? "ok" : r.error.message;
    };
    expect(code(null)).toBe("not an object");
    expect(code("x")).toBe("not an object");
    expect(code({ version: 2, commit: "c", terms: {} })).toContain("version: 1");
    expect(code({ version: 1, commit: 3, terms: {} })).toContain("version: 1");
    expect(code({ version: 1, commit: "c", terms: null })).toContain("version: 1");
    expect(code({ version: 1, commit: "c", terms: { x: [["01"]] } })).toBe(
      'terms["x"] must be [nip, strength] pairs',
    );
    expect(code({ version: 1, commit: "c", terms: { y: "01" } })).toContain('terms["y"]');
    expect(code({ version: 1, commit: "c", terms: { z: [[1, 2]] } })).toContain('terms["z"]');
  });
});
