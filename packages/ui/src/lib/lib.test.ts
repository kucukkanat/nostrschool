import { describe, expect, test } from "bun:test";
import { prefersReducedMotion } from "../motion.ts";
import { withReducedMotion } from "../test-helpers.ts";
import { copyText } from "./clipboard.ts";
import { burstFrom, burstOptions, CONFETTI_COLOR_VARS, themeColors } from "./confetti.ts";
import { resolveTerm } from "./glossary.ts";
import { highlightLines } from "./highlight.ts";
import { containsHighlight, toJsonTree } from "./json.ts";
import { viewportShift } from "./popover.ts";
import { gradeQuiz, toggleSelection } from "./quiz.ts";
import { rovingIndex } from "./roving.ts";

describe("resolveTerm", () => {
  test("always yields a term name, with a typed status", () => {
    const card = resolveTerm("en", "relay");
    expect(card.term.length).toBeGreaterThan(0);
    if (card.status === "ok") expect(card.short.length).toBeGreaterThan(0);
    else expect(card.status).toBe("pending");
  });
  test("es falls back to English definitions (or pending) instead of blank", () => {
    const card = resolveTerm("es", "nostr");
    expect(card.term.length).toBeGreaterThan(0);
    if (card.status === "ok") expect(["es", "en"]).toContain(card.source);
  });
  test("unknown ids at runtime degrade to a pending card named after the id", () => {
    // Simulates an id added to ids.ts before its entry lands (parallel authoring).
    const card = resolveTerm("en", "not-yet-written" as "relay");
    expect(card).toEqual({ status: "pending", term: "not-yet-written" });
  });
});

describe("quiz", () => {
  const options = [
    { id: "a", label: "A", correct: true },
    { id: "b", label: "B", correct: false },
    { id: "c", label: "C", correct: true },
  ];
  test("grades exact set equality", () => {
    expect(gradeQuiz(options, ["c", "a"])).toBe(true);
    expect(gradeQuiz(options, ["a"])).toBe(false);
    expect(gradeQuiz(options, ["a", "b", "c"])).toBe(false);
    expect(gradeQuiz(options, ["a", "b"])).toBe(false);
  });
  test("radios replace, checkboxes add/remove", () => {
    expect(toggleSelection(["a"], "b", true, false)).toEqual(["b"]);
    expect(toggleSelection(["a"], "a", false, false)).toEqual([]);
    expect(toggleSelection(["a"], "b", true, true)).toEqual(["a", "b"]);
    expect(toggleSelection(["a", "b"], "a", false, true)).toEqual(["b"]);
    expect(toggleSelection(["a"], "a", true, true)).toEqual(["a"]);
  });
});

describe("rovingIndex", () => {
  const disabled = (i: number) => i === 1;
  test("moves, wraps and skips disabled items", () => {
    expect(rovingIndex(3, 0, "ArrowRight", disabled)).toBe(2);
    expect(rovingIndex(3, 2, "ArrowDown", disabled)).toBe(0);
    expect(rovingIndex(3, 0, "ArrowLeft", disabled)).toBe(2);
    expect(rovingIndex(3, 2, "ArrowUp")).toBe(1);
    expect(rovingIndex(3, 1, "Home", disabled)).toBe(0);
    expect(rovingIndex(3, 0, "End")).toBe(2);
  });
  test("ignores other keys and fully-disabled lists", () => {
    expect(rovingIndex(3, 0, "Enter")).toBeUndefined();
    expect(rovingIndex(2, 0, "ArrowRight", () => true)).toBeUndefined();
    expect(rovingIndex(0, 0, "Home")).toBeUndefined();
  });
});

describe("copyText", () => {
  test("writes to the real (happy-dom) clipboard", async () => {
    const r = await copyText("npub1hello");
    expect(r.ok).toBe(true);
    expect(await navigator.clipboard.readText()).toBe("npub1hello");
  });
  test("reports a typed error when the API is missing", async () => {
    expect(await copyText("x", null)).toMatchObject({ ok: false, error: { code: "unavailable" } });
  });
  test("a rejecting clipboard becomes write-failed", async () => {
    const denied = {
      writeText: () => Promise.reject(new Error("NotAllowedError")),
    };
    const r = await copyText("x", denied);
    expect(r).toMatchObject({ ok: false, error: { code: "write-failed" } });
  });
});

describe("toJsonTree", () => {
  test("builds paths, kinds and JSON text", () => {
    const tree = toJsonTree({
      kind: 1,
      tags: [["p", "ab"]],
      ok: true,
      none: null,
      skip: undefined,
    });
    expect(tree.kind).toBe("branch");
    if (tree.kind !== "branch") return;
    expect(tree.children.map((c) => c.path)).toEqual(["kind", "tags", "ok", "none"]);
    const tags = tree.children[1];
    expect(tags?.kind === "branch" && tags.type).toBe("array");
    const inner = tags?.kind === "branch" ? tags.children[0] : undefined;
    const leaf = inner?.kind === "branch" ? inner.children[1] : undefined;
    expect(leaf).toMatchObject({
      kind: "leaf",
      type: "string",
      path: "tags.0.1",
      text: '"ab"',
      depth: 3,
    });
  });
  test("normalizes dates and non-JSON values", () => {
    expect(toJsonTree(new Date(0))).toMatchObject({
      type: "string",
      text: '"1970-01-01T00:00:00.000Z"',
    });
    expect(toJsonTree(undefined)).toMatchObject({ type: "null", text: "null" });
    expect(toJsonTree(false)).toMatchObject({ type: "boolean", text: "false" });
  });
  test("containsHighlight keeps ancestors of highlighted paths open", () => {
    expect(containsHighlight("tags", ["tags.0.1"])).toBe(true);
    expect(containsHighlight("tags.0.1", ["tags.0.1"])).toBe(true);
    expect(containsHighlight("", ["kind"])).toBe(true);
    expect(containsHighlight("tag", ["tags.0"])).toBe(false);
    expect(containsHighlight("", [])).toBe(false);
  });
});

describe("highlightLines", () => {
  const flat = (lines: ReturnType<typeof highlightLines>) =>
    lines.map((l) => l.map((t) => `${t.type}:${t.text}`));
  test("json keys, strings, numbers, literals, punctuation", () => {
    const lines = highlightLines('{"kind": 1, "ok": true, "x": null, "s": "a"}', "json");
    expect(flat(lines)[0]).toEqual([
      "punctuation:{",
      'key:"kind"',
      "punctuation::",
      "plain: ",
      "number:1",
      "punctuation:,",
      "plain: ",
      'key:"ok"',
      "punctuation::",
      "plain: ",
      "boolean:true",
      "punctuation:,",
      "plain: ",
      'key:"x"',
      "punctuation::",
      "plain: ",
      "null:null",
      "punctuation:,",
      "plain: ",
      'key:"s"',
      "punctuation::",
      "plain: ",
      'string:"a"',
      "punctuation:}",
    ]);
  });
  test("ts keywords, comments (multi-line split), template strings", () => {
    const lines = highlightLines("/* a\nb */ const x = `t`; // c", "ts");
    expect(flat(lines)).toEqual([
      ["comment:/* a"],
      [
        "comment:b */",
        "plain: ",
        "keyword:const",
        "plain: x ",
        "punctuation:=",
        "plain: ",
        "string:`t`",
        "punctuation:;",
        "plain: ",
        "comment:// c",
      ],
    ]);
    expect(flat(highlightLines("({ kind: 1 })", "js"))[0]).toContain("key:kind");
  });
  test("bash comments, vars, strings; text passthrough", () => {
    expect(flat(highlightLines('echo "$HOME" # hi', "bash"))[0]).toEqual([
      "keyword:echo",
      "plain: ",
      'string:"$HOME"',
      "plain: ",
      "comment:# hi",
    ]);
    expect(flat(highlightLines("a\n\nb", "text"))).toEqual([["plain:a"], [], ["plain:b"]]);
  });
});

describe("confetti", () => {
  test("themeColors resolves token custom properties and drops missing ones", () => {
    const el = document.createElement("div");
    el.style.setProperty("--color-primary", "#7A2EF5");
    document.body.append(el);
    expect(themeColors(["--color-primary", "--nope"], el)).toEqual(["#7A2EF5"]);
    expect(CONFETTI_COLOR_VARS).toContain("--color-primary");
    el.remove();
  });
  test("skips without theme tokens and under reduced motion", async () => {
    const el = document.createElement("button");
    expect(await burstFrom(el)).toBe("no-theme");
    await withReducedMotion(async () => {
      expect(prefersReducedMotion()).toBe(true);
      expect(await burstFrom(el)).toBe("reduced-motion");
    });
  });
  test("with theme tokens but no 2D canvas context (happy-dom), skips instead of throwing", async () => {
    const root = document.documentElement;
    root.style.setProperty("--color-primary", "#7A2EF5");
    try {
      expect(await burstFrom(document.createElement("button"))).toBe("no-canvas");
    } finally {
      root.style.removeProperty("--color-primary");
    }
  });
  test("burstOptions centers the burst on the element and copies the palette", () => {
    const colors = ["#7A2EF5"];
    const opts = burstOptions({ left: 100, top: 50, width: 20, height: 10 }, colors, {
      width: 220,
      height: 110,
    });
    expect(opts.origin).toEqual({ x: 0.5, y: 0.5 });
    expect(opts.colors).toEqual(colors);
    expect(opts.colors).not.toBe(colors);
    expect(opts.disableForReducedMotion).toBe(true);
  });
});

describe("viewportShift", () => {
  test("leaves a box that fits alone", () => {
    expect(viewportShift(20, 280, 375, 16)).toBe(0);
  });
  test("slides a box overflowing the end back inside the margin", () => {
    // 'keypair' at x=299 on a 375px phone with a 280px card → card ends at 359.
    expect(viewportShift(299, 280, 375, 16)).toBe(-220);
  });
  test("pushes a box past the start margin inward; too-wide boxes pin to the start", () => {
    expect(viewportShift(4, 100, 375, 16)).toBe(12);
    expect(viewportShift(100, 400, 375, 16)).toBe(-84);
  });
});
