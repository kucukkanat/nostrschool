import { describe, expect, test } from "bun:test";
import { getNipDocument, NIP_CORPUS } from "@nostrschool/nips/corpus";
import { chunkCorpus, chunkNip, markdownToPlainText, snippetOf, wordWindows } from "./chunk.ts";

describe("markdownToPlainText", () => {
  test("drops fenced code, keeps list/table/quote words", () => {
    const md = [
      "Intro with `code` and a [link](x.md).",
      "```json",
      '{"kind": 1}',
      "```",
      "- item one",
      "1. item two",
      "> quoted",
      "| a | b |",
      "|---|:-:|",
      "| c | d |",
    ].join("\n");
    expect(markdownToPlainText(md)).toBe(
      "Intro with code and a link. item one item two quoted a b c d",
    );
  });
});

describe("wordWindows", () => {
  test("overlapping windows cover every word; short text is one window; empty is none", () => {
    const text = Array.from({ length: 10 }, (_, i) => `w${i}`).join(" ");
    expect(wordWindows(text, 4, 1)).toEqual(["w0 w1 w2 w3", "w3 w4 w5 w6", "w6 w7 w8 w9"]);
    expect(wordWindows("a b", 4, 1)).toEqual(["a b"]);
    expect(wordWindows("  ", 4, 1)).toEqual([]);
    // overlap ≥ size still advances.
    expect(wordWindows("a b c", 1, 5)).toEqual(["a", "b", "c"]);
  });
});

describe("snippetOf", () => {
  test("keeps short text, cuts long text at a word with an ellipsis", () => {
    expect(snippetOf("short", 10)).toBe("short");
    expect(snippetOf("alpha beta gamma delta", 14)).toBe("alpha beta…");
    expect(snippetOf("abcdefghijklmnop qr", 10)).toBe("abcdefghij…");
  });
});

describe("chunkNip on the real corpus", () => {
  const nip57 = getNipDocument("57");
  test("an about passage first, then section windows with stable ids", () => {
    expect(nip57).toBeDefined();
    if (nip57 === undefined) return;
    const chunks = chunkNip(nip57, {}, { summaries: ["Our summary", ""], hints: ["send sats"] });
    const [about, hint, ...rest] = chunks;
    expect(about?.chunk).toMatchObject({ id: "57:about", nip: "57", sectionId: "intro" });
    expect(about?.embedText).toStartWith("NIP-57 Lightning Zaps. ");
    expect(about?.embedText).toEndWith(". Our summary");
    expect(hint?.chunk).toMatchObject({
      id: "57:hint:0",
      sectionId: "intro",
      text: about?.chunk.text,
    });
    expect(hint?.embedText).toBe("Lightning Zaps: send sats");
    expect(rest.length).toBeGreaterThan(3);
    for (const c of rest) {
      expect(c.chunk.id).toStartWith(`57:${c.chunk.sectionId}:`);
      expect(c.chunk.text.length).toBeLessThanOrEqual(181);
      expect(c.embedText).toStartWith("Lightning Zaps — ");
      expect(nip57.sections.some((s) => s.id === c.chunk.sectionId)).toBe(true);
    }
  });

  test("skips changelog-style and code-only sections; empty summary falls back to title", () => {
    if (nip57 === undefined) return;
    const doc = {
      ...nip57,
      summary: "",
      sections: [
        { id: "changes", heading: "Changes", level: 2, markdown: "lots of words ".repeat(20) },
        { id: "code", heading: "Code", level: 2, markdown: "```\nx\n```" },
        { id: "intro", heading: "", level: 0, markdown: "one two three four five six seven" },
      ],
    };
    const chunks = chunkNip(doc);
    expect(chunks.map((c) => c.chunk.id)).toEqual(["57:about", "57:intro:0"]);
    expect(chunks[0]?.chunk.text).toBe("Lightning Zaps");
    expect(chunks[1]?.chunk.heading).toBe("Lightning Zaps");
  });

  test("chunkCorpus: every NIP, unique ids, extras reach the about passage", () => {
    const chunks = chunkCorpus(NIP_CORPUS.nips, {}, (id) =>
      id === "01" ? { summaries: ["EXTRA"] } : {},
    );
    expect(new Set(chunks.map((c) => c.chunk.id)).size).toBe(chunks.length);
    expect(new Set(chunks.map((c) => c.chunk.nip)).size).toBe(NIP_CORPUS.nips.length);
    expect(chunks.find((c) => c.chunk.id === "01:about")?.embedText).toContain("EXTRA");
    const [first] = NIP_CORPUS.nips;
    if (first === undefined) throw new Error("empty corpus");
    expect(chunkCorpus([first])).toEqual(chunkNip(first));
  });
});
