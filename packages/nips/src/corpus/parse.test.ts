import { describe, expect, test } from "bun:test";
import { NIP_CORPUS } from "../corpus.ts";
import {
  buildCorpus,
  extractBodyMessages,
  extractExampleKinds,
  extractIdents,
  extractMentions,
  extractSummary,
  extractTags,
  parseKindCell,
  parseKindsTable,
  parseMessageTables,
  parseNipHeader,
  parseReadmeList,
  parseSections,
  slugifyHeading,
  stripInlineMarkdown,
  stripNipHeader,
  toIndex,
} from "./parse.ts";

// Inputs are the real NIP texts from the committed snapshot (no hand-made stand-ins), plus small
// literal snippets for the edge cases the real repo does not exercise at this commit.
const md = (id: string): string => {
  const doc = NIP_CORPUS.nips.find((n) => n.id === id);
  if (doc === undefined) throw new Error(`NIP-${id} missing from the corpus`);
  return doc.markdown;
};

const README = `# NIPs

## List

- [NIP-01: Basic protocol flow description](01.md)
- ~~[NIP-04: Encrypted Direct Message](04.md) --- **unrecommended**: deprecated in favor of [NIP-17](17.md)~~
- [NIP-34: \`git\` stuff](34.md)
- ~~[NIP-BE: Nostr BLE](BE.md) --- **unrecommended**: only implemented once~~

## Event Kinds

| kind          | description      | NIP                      |
| ------------- | ---------------- | ------------------------ |
| \`0\`           | User Metadata    | [01](01.md)              |
| \`1630\`-\`1633\` | Status           | [34](34.md)              |
| \`39000-9\`     | Group metadata   | [29](29.md)              |
| \`10096\`       | File servers     | [96](96.md) (deprecated) |
| \`30040\`       | Curated index    | [NKBIP-01]               |
| \`32267\`       | Software App     |                          |

## Message types

### Client to Relay

| type    | description          | NIP         |
| ------- | -------------------- | ----------- |
| \`REQ\`   | used to request      | [01](01.md) |

### Relay to Client

| type     | description         | NIP         |
| -------- | ------------------- | ----------- |
| \`AUTH\`   | used to challenge   | [42](42.md) |

## License
`;

describe("README", () => {
  test("list entries, titles without markdown, unrecommended reasons and replacements", () => {
    expect(parseReadmeList(README)).toEqual([
      { id: "01", title: "Basic protocol flow description" },
      {
        id: "04",
        title: "Encrypted Direct Message",
        unrecommended: { reason: "deprecated in favor of NIP-17", replacedBy: ["17"] },
      },
      { id: "34", title: "git stuff" },
      {
        id: "BE",
        title: "Nostr BLE",
        unrecommended: { reason: "only implemented once", replacedBy: [] },
      },
    ]);
  });

  test("kind cells: single, backtick range, short-tail range", () => {
    expect(parseKindCell("`0`")).toEqual({ kind: 0 });
    expect(parseKindCell("`1630`-`1633`")).toEqual({ kind: 1630, to: 1633 });
    expect(parseKindCell("`39000-9`")).toEqual({ kind: 39000, to: 39009 });
    expect(parseKindCell("`9000`-`9030`")).toEqual({ kind: 9000, to: 9030 });
    expect(parseKindCell("`5`-`5`")).toEqual({ kind: 5 });
    expect(parseKindCell("kind")).toBeUndefined();
  });

  test("kinds table keeps external specs and rows without a NIP", () => {
    expect(parseKindsTable(README)).toEqual([
      { kind: 0, description: "User Metadata", nips: ["01"] },
      { kind: 1630, to: 1633, description: "Status", nips: ["34"] },
      { kind: 39000, to: 39009, description: "Group metadata", nips: ["29"] },
      { kind: 10096, description: "File servers", nips: ["96"] },
      { kind: 30040, description: "Curated index", nips: [], external: "NKBIP-01" },
      { kind: 32267, description: "Software App", nips: [] },
    ]);
  });

  test("message tables by direction", () => {
    expect(parseMessageTables(README)).toEqual([
      { type: "REQ", direction: "client-to-relay", description: "used to request", nips: ["01"] },
      {
        type: "AUTH",
        direction: "relay-to-client",
        description: "used to challenge",
        nips: ["42"],
      },
    ]);
  });

  test("a README without the sections yields empty lists", () => {
    expect(parseReadmeList("# nothing")).toEqual([]);
    expect(parseKindsTable("# nothing")).toEqual([]);
    expect(parseMessageTables("# nothing")).toEqual([]);
    expect(parseMessageTables("## Message types\n\nno tables")).toEqual([]);
  });
});

describe("NIP files", () => {
  test("headers: usual, warning-first, status-less and bold-status shapes", () => {
    expect(parseNipHeader(md("01"))).toEqual({
      title: "Basic protocol flow description",
      statusTags: ["draft", "mandatory", "relay"],
    });
    expect(parseNipHeader(md("96")).statusTags).toEqual(["draft", "unrecommended", "optional"]);
    expect(parseNipHeader(md("46"))).toEqual({ title: "Nostr Remote Signing", statusTags: [] });
    expect(parseNipHeader(md("A0"))).toEqual({ title: "Voice Messages", statusTags: ["draft"] });
    expect(parseNipHeader(md("34")).title).toBe("git stuff");
    expect(parseNipHeader("no header at all")).toEqual({
      title: "no header at all",
      statusTags: [],
    });
  });

  test("sections: intro, GitHub slugs, fenced headings ignored, duplicates numbered", () => {
    const s01 = parseSections(md("01"));
    expect(s01[0]?.id).toBe("intro");
    expect(s01.map((s) => s.id)).toContain("events-and-signatures");
    const synthetic = parseSections(
      "NIP-99\n======\n\nTitle\n-----\n\n`draft`\n\nIntro text.\n\n## A b\n\n```\n## not a heading\n```\n\n## A b\n\nSetext\n======\n\nbody",
    );
    expect(synthetic.map((s) => [s.id, s.level])).toEqual([
      ["intro", 0],
      ["a-b", 2],
      ["a-b-1", 2],
      ["setext", 1],
    ]);
    expect(synthetic[1]?.markdown).toContain("## not a heading");
  });

  test("slugs follow GitHub", () => {
    expect(slugifyHeading("Request Events `{kind: 24133}`")).toBe("request-events-kind-24133");
    expect(slugifyHeading("Methods/Commands")).toBe("methodscommands");
  });

  test("summary: first real paragraph, cut at a sentence, stubs keep their one line", () => {
    expect(extractSummary(md("01"))).toStartWith("This NIP defines the basic protocol");
    expect(extractSummary(md("12"))).toBe("Moved to NIP-01.");
    expect(extractSummary(md("05"))).toContain("<local-part>");
    const long = extractSummary(md("44"), 120);
    expect(long.length).toBeLessThanOrEqual(120);
    expect(extractSummary(`${"word ".repeat(100)}`, 50)).toEndWith("…");
    expect(extractSummary("")).toBe("");
  });

  test("tags, kinds and mentions from examples", () => {
    expect(extractTags(md("57"))).toEqual(expect.arrayContaining(["amount", "bolt11", "e", "p"]));
    expect(extractTags(md("01"))).not.toContain("EVENT");
    expect(extractTags(md("70"))).toContain("-");
    expect(extractExampleKinds(md("57"))).toEqual([9734, 9735]);
    const known = new Set(NIP_CORPUS.nips.map((n) => n.id));
    expect(extractMentions(md("17"), "17", known)).toEqual(expect.arrayContaining(["44", "59"]));
    expect(extractMentions("see NIP-1 and nip 5a and NIP-17 and (17.md)", "17", known)).toEqual([
      "01",
      "5A",
    ]);
  });

  test("inline markdown stripping keeps placeholders", () => {
    expect(stripInlineMarkdown("**bold** `code` [link](x) <b>tag</b> <event-id> ~~gone~~")).toBe(
      "bold code link tag <event-id> gone",
    );
    expect(stripNipHeader(md("01"))).not.toContain("======");
    expect(stripNipHeader("plain")).toBe("plain");
  });
});

describe("extractBodyMessages", () => {
  test("NIP-77: NEG-* verbs with the direction from the heading above each block", () => {
    expect(extractBodyMessages(md("77"))).toEqual([
      { type: "NEG-OPEN", direction: "client-to-relay", description: "Initial message" },
      { type: "NEG-ERR", direction: "relay-to-client", description: "Error message" },
      { type: "NEG-MSG", direction: "client-to-relay", description: "Subsequent messages" },
      { type: "NEG-MSG", direction: "relay-to-client", description: "Subsequent messages" },
      { type: "NEG-CLOSE", direction: "client-to-relay", description: "Close message" },
    ]);
  });

  test("buildCorpus adds body-only verbs to the NIP and to the registry after the README rows", () => {
    const source = { repo: "r", commit: "c", committedAt: "x", snapshotAt: "y" };
    const files = ["01", "77"].map((id) => ({ id, markdown: md(id), updatedAt: null }));
    const corpus = buildCorpus({ source, readme: README, files });
    const nip77 = corpus.nips.find((n) => n.id === "77");
    expect(nip77?.messages.map((m) => `${m.type} ${m.direction}`)).toEqual([
      "NEG-OPEN client-to-relay",
      "NEG-ERR relay-to-client",
      "NEG-MSG client-to-relay",
      "NEG-MSG relay-to-client",
      "NEG-CLOSE client-to-relay",
    ]);
    const readmeRows = [...parseMessageTables(README)];
    expect(corpus.messages.slice(0, readmeRows.length)).toEqual(readmeRows);
    expect(corpus.messages.find((m) => m.type === "NEG-OPEN")?.nips).toEqual(["77"]);
    // NIP-01's body uses REQ/EVENT…, which the README registry already owns: no duplicates.
    expect(corpus.messages.filter((m) => m.type === "REQ")).toHaveLength(
      parseMessageTables(README).filter((m) => m.type === "REQ").length,
    );
  });

  test("skips registered verbs, nested tag arrays and blocks with no stated direction", () => {
    // NIP-34 has `["HEAD", …]` inside "tags" (nested, so not a message).
    expect(extractBodyMessages(md("34"))).toEqual([]);
    expect(
      extractBodyMessages(md("42"), new Set(["AUTH", "REQ", "CLOSED", "OK", "EVENT"])),
    ).toEqual([]);
    const snippet = (heading: string, code: string) =>
      `## ${heading}\n\n\`\`\`json\n${code}\n\`\`\`\n`;
    expect(extractBodyMessages(snippet("Ping", '["PING", "x"]'))).toEqual([]);
    expect(
      extractBodyMessages(snippet("Ping (relay to client)", '["PING", "a]b\\"c"]\n["PING"]')),
    ).toEqual([{ type: "PING", direction: "relay-to-client", description: "Ping" }]);
    expect(extractBodyMessages(snippet("Talk (client-to-relay)", '["x", 1]\n["A", 2]'))).toEqual(
      [],
    );
  });
});

describe("buildCorpus", () => {
  const files = ["01", "04", "12", "34"].map((id) => ({ id, markdown: md(id), updatedAt: null }));
  const source = {
    repo: "https://github.com/nostr-protocol/nips",
    commit: "abc",
    committedAt: "x",
    snapshotAt: "y",
  };
  const corpus = buildCorpus({ source, readme: README, files });

  test("statuses: listed draft, unrecommended, moved stub", () => {
    const by = Object.fromEntries(corpus.nips.map((n) => [n.id, n]));
    expect(by["01"]?.status).toBe("draft");
    expect(by["01"]?.relay).toBe(true);
    expect(by["01"]?.requirement).toBe("mandatory");
    expect(by["04"]?.status).toBe("unrecommended");
    expect(by["04"]?.unrecommended?.replacedBy).toEqual(["17"]);
    expect(by["12"]?.status).toBe("deprecated");
    expect(by["12"]?.movedTo).toBe("01");
    expect(by["12"]?.listed).toBe(false);
    expect(by["34"]?.kinds).toEqual([{ kind: 1630, to: 1633, description: "Status" }]);
    expect(by["01"]?.url).toBe("https://github.com/nostr-protocol/nips/blob/abc/01.md");
  });

  test("mentionedBy is the reverse of mentions; the index drops markdown", () => {
    const by = Object.fromEntries(corpus.nips.map((n) => [n.id, n]));
    expect(by["01"]?.mentionedBy).toEqual(expect.arrayContaining(["12"]));
    const index = toIndex(corpus);
    expect(index.nips[0]).not.toHaveProperty("markdown");
    expect(index.nips[0]).not.toHaveProperty("sections");
    expect(index.kinds).toBe(corpus.kinds);
  });

  test("a deprecated kind is flagged only for the NIP marked deprecated", () => {
    const c = buildCorpus({
      source,
      readme: README,
      files: [{ id: "96", markdown: md("96"), updatedAt: "2025-01-01" }],
    });
    expect(c.nips[0]?.kinds).toEqual([
      { kind: 10096, description: "File servers", deprecated: true },
    ]);
    expect(c.nips[0]?.status).toBe("deprecated");
  });
});

describe("extractIdents", () => {
  test("keeps identifier-like inline code outside code blocks, unique, in order", () => {
    const md = [
      "Relays list `supported_nips` and `max_message_length`; see `supported_nips` again.",
      "Connect with `nostrconnect://`, not `a sentence with spaces`, `12345` or `1.2`.",
      "```json",
      '{ "`hidden_in_code`": 1 }',
      "```",
    ].join("\n");
    expect(extractIdents(md)).toEqual(["supported_nips", "max_message_length", "nostrconnect://"]);
  });

  test("the snapshot carries NIP-11's field names", () => {
    expect(NIP_CORPUS.nips.find((n) => n.id === "11")?.idents).toContain("max_message_length");
  });
});
