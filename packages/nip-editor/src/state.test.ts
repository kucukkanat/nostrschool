import { describe, expect, test } from "bun:test";
import { FIXTURE_NOW } from "@nostrschool/fixtures";
import { findSpecPart, type SpecPart, type ValidationIssue } from "@nostrschool/nips";
import { checkText, checkValue, issueMessage } from "./logic/validate.ts";
import {
  decodeEditorHash,
  encodeEditorHash,
  explainAt,
  formatJson,
  initialValue,
  issueDiagnostics,
  livePath,
  pathAtOffset,
  rangeOfPath,
} from "./state.ts";
import {
  BOB,
  CAROL_PUBKEY,
  documentSpec,
  encodingSpec,
  eventSpec,
  httpSpec,
  messageSpec,
  NOTE_ID,
} from "./test/samples.ts";

const part = (spec: typeof eventSpec, kind: SpecPart["kind"], id: string): SpecPart => {
  const p = findSpecPart(spec, { kind, id });
  if (p === undefined) throw new Error(`${kind}/${id}`);
  return p;
};

describe("initialValue", () => {
  test("events come from the example, signed by its persona, at FIXTURE_NOW", () => {
    const like = initialValue(part(eventSpec, "event", "reaction"));
    expect(like).toEqual({
      pubkey: expect.any(String),
      created_at: FIXTURE_NOW,
      kind: 7,
      tags: [
        ["e", NOTE_ID],
        ["p", BOB.pubkey],
      ],
      content: "+",
    });
    const dislike = initialValue(part(eventSpec, "event", "reaction"), "dislike");
    expect(dislike).toMatchObject({ pubkey: CAROL_PUBKEY, created_at: 1700000000, content: "-" });
    // No examples: a skeleton with the required tags.
    expect(initialValue(part(eventSpec, "event", "dm"))).toMatchObject({ kind: 4, content: "" });
  });
  test("messages, documents, http and encodings", () => {
    expect(initialValue(part(messageSpec, "message", "req"))).toEqual([
      "REQ",
      "feed",
      { kinds: [1], limit: 5 },
    ]);
    const req = part(messageSpec, "message", "req");
    if (req.kind !== "message") throw new Error("kind");
    expect(initialValue({ kind: "message", part: { ...req.part, examples: [] } })).toEqual([
      "REQ",
      "",
      { kinds: [1], limit: 10 },
    ]);
    const doc = part(documentSpec, "document", "nostr-json");
    expect(initialValue(doc)).toEqual({ names: { bob: BOB.pubkey } });
    if (doc.kind !== "document") throw new Error("kind");
    expect(initialValue({ kind: "document", part: { ...doc.part, examples: [] } })).toEqual({
      names: {},
    });
    const http = part(httpSpec, "http", "upload");
    expect(initialValue(http)).toEqual({
      url: "https://files.example/upload",
      headers: { Authorization: "" },
      body: { caption: "hi" },
    });
    if (http.kind !== "http") throw new Error("kind");
    expect(initialValue({ kind: "http", part: { ...http.part, examples: [] } })).toEqual({
      url: "https://<server>/upload",
      headers: { Authorization: "" },
      body: { caption: "" },
    });
    const { body: _b, ...noBody } = http.part;
    expect(
      initialValue({
        kind: "http",
        part: { ...noBody, examples: [{ id: "g", label: "g", url: "u", headers: {} }] },
      }),
    ).toEqual({
      url: "u",
      headers: {},
    });
    expect(initialValue({ kind: "http", part: { ...noBody, examples: [] } })).toEqual({
      url: "https://<server>/upload",
      headers: { Authorization: "" },
    });
    const enc = part(encodingSpec, "encoding", "nprofile");
    expect(initialValue(enc)).toEqual({
      pubkey: BOB.pubkey,
      relays: ["wss://relay.alpha.example"],
    });
    if (enc.kind !== "encoding") throw new Error("kind");
    expect(initialValue({ kind: "encoding", part: { ...enc.part, examples: [] } })).toEqual({
      pubkey: BOB.pubkey,
    });
    expect(
      initialValue({
        kind: "encoding",
        part: {
          ...enc.part,
          examples: [],
          inputs: [{ name: "r", type: { type: "relay-url" }, explain: "", repeatable: true }],
        },
      }),
    ).toEqual({ r: ["wss://relay.alpha.example"] });
  });
});

describe("URL hash", () => {
  const state = {
    part: { kind: "event", id: "reaction" },
    value: { content: "héllo ✓", kind: 7 },
    example: "like",
    signer: "bob",
  } as const;
  test("round-trips, unicode included, and is stable", () => {
    const hash = encodeEditorHash(state);
    expect(hash).toMatch(/^#edit=[A-Za-z0-9_-]+$/);
    expect(encodeEditorHash(state)).toBe(hash);
    const back = decodeEditorHash(hash, eventSpec);
    expect(back.ok && back.value).toEqual(state);
    const minimal = decodeEditorHash(
      encodeEditorHash({ part: state.part, value: null }),
      eventSpec,
    );
    expect(minimal.ok && minimal.value).toEqual({ part: state.part, value: null });
    // Other hash params are ignored.
    expect(decodeEditorHash(`#x=1&${hash.slice(1)}`, eventSpec).ok).toBe(true);
  });
  test("fails with a typed error for each kind of bad link", () => {
    const code = (hash: string) => {
      const r = decodeEditorHash(hash, eventSpec);
      return r.ok ? "ok" : r.error.code;
    };
    const enc = (o: unknown) =>
      `#edit=${btoa(JSON.stringify(o)).replaceAll("=", "").replaceAll("+", "-").replaceAll("/", "_")}`;
    expect(code("")).toBe("no-state");
    expect(code("#edit=")).toBe("no-state");
    expect(code("#edit=$$$")).toBe("invalid-encoding");
    expect(code("#edit=A")).toBe("invalid-encoding");
    expect(code("#edit=_w")).toBe("invalid-encoding"); // 0xff is not UTF-8
    expect(code("#edit=bm9wZQ")).toBe("invalid-json"); // "nope"
    expect(code(enc([1]))).toBe("invalid-json");
    expect(code(enc({ part: { kind: "event", id: "reaction" } }))).toBe("invalid-json");
    expect(code(enc({ part: { kind: "bogus", id: "x" }, value: 1 }))).toBe("invalid-json");
    expect(code(enc({ part: { kind: "event", id: "x" }, value: 1, signer: "mallory" }))).toBe(
      "invalid-json",
    );
    expect(code(enc({ part: { kind: "event", id: "x" }, value: 1, example: 3 }))).toBe(
      "invalid-json",
    );
    expect(code(enc({ part: { kind: "event", id: "nope" }, value: 1 }))).toBe("unknown-part");
  });
});

describe("paths and ranges", () => {
  const json = formatJson({ kind: 7, tags: [["e", "abc", "wss://r"]], content: "+" });
  test("pathAtOffset ↔ rangeOfPath", () => {
    const r = rangeOfPath(json, ["tags", 0, 2]);
    expect(r && json.slice(r.from, r.to)).toBe('"wss://r"');
    expect(r && pathAtOffset(json, r.from + 2)).toEqual(["tags", 0, 2]);
    expect(rangeOfPath(json, ["nope"])).toBeUndefined();
    expect(rangeOfPath("{", [])).toBeUndefined();
    expect(pathAtOffset("{", 0)).toBeUndefined();
  });
});

describe("explainAt", () => {
  const reaction = part(eventSpec, "event", "reaction");
  const value = initialValue(reaction);
  const issue: ValidationIssue = {
    severity: "error",
    code: "invalid-event-id",
    path: ["tags", 0, 1],
  };
  test("event: tags by name, positional fields, content and builtin fields", () => {
    expect(explainAt(reaction, value, [], [])).toMatchObject({
      breadcrumb: [],
      explain: "reaction.explain",
    });
    const field = explainAt(reaction, value, ["tags", 0, 1], [issue]);
    expect(field).toMatchObject({
      breadcrumb: ["tags", "e", "event-id"],
      explain: "tag.e.id",
      field: { type: "event-id" },
    });
    expect(field.tag?.name).toBe("e");
    expect(field.issues).toEqual([issue]);
    expect(explainAt(reaction, value, ["tags", 0], [issue]).issues).toEqual([issue]);
    expect(explainAt(reaction, value, ["tags", 1, 0], [])).toMatchObject({ explain: "tag.p" });
    expect(explainAt(reaction, value, ["tags", 0, 5], [])).toMatchObject({
      breadcrumb: ["tags", "e", "5"],
    });
    const custom = { ...(value as object), tags: [["zz", "1"], [3]] };
    expect(explainAt(reaction, custom, ["tags", 0, 1], [])).toMatchObject({
      breadcrumb: ["tags", "zz"],
      builtin: "tags",
    });
    expect(explainAt(reaction, custom, ["tags", 1], [])).toMatchObject({
      breadcrumb: ["tags", "?"],
    });
    expect(explainAt(reaction, value, ["content"], [])).toMatchObject({
      explain: "content",
      builtin: "content",
      field: { type: "enum" },
    });
    expect(explainAt(reaction, value, ["sig"], [])).toMatchObject({
      builtin: "sig",
      breadcrumb: ["sig"],
    });
    expect(explainAt(reaction, value, ["weird", 1], [])).toMatchObject({
      breadcrumb: ["weird", "1"],
    });
    expect(explainAt(part(eventSpec, "event", "dm"), {}, ["content"], [])).toMatchObject({
      explain: "dm.content",
    });
    const emptyContent = {
      kind: "event",
      part: { ...(reaction.part as object), content: { format: "empty" } },
    } as SpecPart;
    expect(explainAt(emptyContent, value, ["content"], []).explain).toBeUndefined();
  });
  test("event: requireOneOf rules on the tag list and on the tags they name", () => {
    const rule = { explain: "rule.target", tags: ["e", "k"] };
    // The tag list shows every rule, with the tags that satisfy it now.
    expect(explainAt(reaction, value, ["tags"], [])).toMatchObject({
      breadcrumb: ["tags"],
      builtin: "tags",
      rules: [{ ...rule, present: ["e"] }],
    });
    // A tag the rule names shows it (on the row and its values); others do not.
    expect(explainAt(reaction, value, ["tags", 0], []).rules).toEqual([
      { ...rule, present: ["e"] },
    ]);
    expect(explainAt(reaction, value, ["tags", 0, 1], []).rules).toBeUndefined();
    expect(explainAt(reaction, value, ["tags", 1], []).rules).toBeUndefined();
    // Broken rule: no e/k tag left; an unknown "k"-named row still points at the rule.
    const broken = { ...(value as object), tags: [["p", BOB.pubkey], ["k"]] };
    const missing: ValidationIssue = {
      severity: "error",
      code: "missing-one-of",
      path: ["tags"],
      params: { tags: "e, k" },
      explain: "rule.target",
    };
    const list = explainAt(reaction, broken, ["tags"], [missing]);
    expect(list.rules).toEqual([{ ...rule, present: ["k"] }]);
    expect(list.issues).toEqual([missing]);
    expect(explainAt(reaction, broken, ["tags", 1], []).rules).toEqual([
      { ...rule, present: ["k"] },
    ]);
    const none = { ...(value as object), tags: "nope" };
    expect(explainAt(reaction, none, ["tags"], []).rules).toEqual([{ ...rule, present: [] }]);
    // Shapes without rules add nothing.
    expect(explainAt(part(eventSpec, "event", "dm"), {}, ["tags"], []).rules).toBeUndefined();
  });
  test("livePath: a selection is cut at the first array index that no longer exists", () => {
    const v = { tags: [["e", NOTE_ID]], content: '{"a":[1]}', meta: { list: [] } };
    expect(livePath(v, ["tags", 0, 1])).toEqual(["tags", 0, 1]);
    expect(livePath(v, ["tags", 3, 1])).toEqual(["tags"]);
    expect(livePath(v, ["tags", 0, 4])).toEqual(["tags", 0]);
    expect(livePath(v, ["meta", "list", 0])).toEqual(["meta", "list"]);
    // Missing keys stay (they may name a missing required field); inside JSON text is not checked.
    expect(livePath(v, ["missing"])).toEqual(["missing"]);
    expect(livePath(v, ["missing", 0])).toEqual(["missing"]);
    expect(livePath(v, ["content", "a", 5])).toEqual(["content", "a", 5]);
    expect(livePath([1, 2], [1])).toEqual([1]);
    expect(livePath([1, 2], [])).toEqual([]);
  });
  test("message: positional elements, repeatable tail, schema inside", () => {
    const req = part(messageSpec, "message", "req");
    const v = ["REQ", "s", { kinds: [1] }, { kinds: [2] }];
    expect(explainAt(req, v, [0], [])).toMatchObject({
      breadcrumb: ["REQ"],
      explain: "req.explain",
    });
    expect(explainAt(req, v, [], [])).toMatchObject({ breadcrumb: ["REQ"] });
    expect(explainAt(req, v, [1], [])).toMatchObject({
      breadcrumb: ["REQ", "subscription"],
      explain: "req.sub",
      field: { type: "text" },
    });
    expect(explainAt(req, v, [3], [])).toMatchObject({
      breadcrumb: ["REQ", "filter"],
      explain: "req.filter",
      schemaType: "filter",
    });
    expect(explainAt(req, v, [3, "kinds"], [])).toMatchObject({
      breadcrumb: ["REQ", "filter", "kinds"],
    });
    if (req.kind !== "message") throw new Error("kind");
    const fixed = {
      kind: "message",
      part: { ...req.part, elements: req.part.elements.slice(0, 1) },
    } as SpecPart;
    expect(explainAt(fixed, v, [2], [])).toMatchObject({ breadcrumb: ["REQ", "2"] });
  });
  test("document, http and encoding", () => {
    const doc = part(documentSpec, "document", "nostr-json");
    const dv = { names: { bob: BOB.pubkey } };
    expect(explainAt(doc, dv, [], [])).toMatchObject({ explain: "doc.root", schemaType: "object" });
    expect(explainAt(doc, dv, ["names", "bob"], [])).toMatchObject({
      explain: "doc.name",
      field: { type: "pubkey" },
    });
    if (doc.kind !== "document") throw new Error("kind");
    const plain = { kind: "document", part: { ...doc.part, schema: { type: "any" } } } as SpecPart;
    expect(explainAt(plain, dv, [], [])).toMatchObject({ explain: "doc.explain" });
    const http = part(httpSpec, "http", "upload");
    const hv = initialValue(http);
    expect(explainAt(http, hv, ["headers", "authorization"], [])).toMatchObject({
      breadcrumb: ["headers", "Authorization"],
      explain: "http.auth",
    });
    expect(explainAt(http, hv, ["headers", "X-Other"], [])).toMatchObject({
      breadcrumb: ["headers", "X-Other"],
    });
    expect(explainAt(http, hv, ["body", "caption"], [])).toMatchObject({ schemaType: "string" });
    expect(explainAt(http, hv, [], [])).toMatchObject({
      breadcrumb: ["POST"],
      explain: "http.explain",
    });
    expect(explainAt(http, hv, ["url"], [])).toMatchObject({ breadcrumb: ["url"] });
    const enc = part(encodingSpec, "encoding", "nprofile");
    expect(explainAt(enc, {}, ["pubkey"], [])).toMatchObject({
      explain: "enc.pubkey",
      field: { type: "pubkey" },
    });
    expect(explainAt(enc, {}, [], [])).toMatchObject({ explain: "enc.nprofile.explain" });
  });
});

describe("issueDiagnostics", () => {
  const msg = (i: ValidationIssue) => `${i.code}@${i.path.join(".")}`;
  const json = formatJson({ kind: 7, tags: [["e", "bad"]], extra: 1 });
  test("maps each issue to the node range; missing nodes fall back to the nearest parent", () => {
    const d = issueDiagnostics(
      json,
      [
        { severity: "error", code: "invalid-event-id", path: ["tags", 0, 1] },
        {
          severity: "error",
          code: "missing-field",
          path: ["content"],
          params: { field: "content" },
        },
        { severity: "warning", code: "unknown-field", path: ["extra"] },
        { severity: "info", code: "unsigned", path: [] },
      ],
      msg,
    );
    const slice = (i: number) => json.slice(d[i]?.from, d[i]?.to);
    expect(slice(0)).toBe('"bad"');
    expect(slice(1)).toBe("{"); // "content" is missing: anchored on the document's opening brace
    expect(slice(3)).toBe("{"); // document-level notes never underline the whole document
    expect(slice(2)).toBe('"extra"'); // unknown fields point at the key
    expect(d.map((x) => x.severity)).toEqual(["error", "error", "warning", "info"]);
    expect(d[0]?.message).toBe("invalid-event-id@tags.0.1");
  });
  test("invalid JSON points at the parse error", () => {
    const bad = '{"a": }';
    const [d] = issueDiagnostics(bad, [{ severity: "error", code: "invalid-json", path: [] }], msg);
    expect(d).toMatchObject({ from: 6, to: 7 });
    const [end] = issueDiagnostics(
      "[1,",
      [{ severity: "error", code: "invalid-json", path: [] }],
      msg,
    );
    expect(end).toMatchObject({ from: 2, to: 3 });
  });
});

describe("validation glue", () => {
  test("checkText reports parse errors and validates parsed values", () => {
    const reaction = part(eventSpec, "event", "reaction");
    const bad = checkText(eventSpec, reaction, "{");
    expect(bad.value).toBeUndefined();
    expect(bad.report.issues[0]).toMatchObject({ code: "invalid-json", params: { offset: 1 } });
    const ok = checkText(eventSpec, reaction, formatJson(initialValue(reaction)));
    expect(ok.value).toBeDefined();
    expect(ok.report.issues.some((i) => i.code === "unsigned")).toBe(true);
    expect(checkValue(eventSpec, reaction, initialValue(reaction)).valid).toBe(true);
  });
  test("issueMessage formats params into the localized message", () => {
    const en = issueMessage("en")({
      severity: "error",
      code: "missing-tag",
      path: [],
      params: { tag: "e" },
    });
    expect(en).toContain("“e”");
    const es = issueMessage("es")({
      severity: "error",
      code: "missing-tag",
      path: [],
      params: { tag: "e" },
    });
    expect(es).not.toBe(en);
    expect(
      issueMessage("en")({ severity: "info", code: "unsigned", path: [] }).length,
    ).toBeGreaterThan(0);
  });

  test("issueMessage picks the plural form from the min param", () => {
    const tagTooShort = (locale: "en" | "es", min: number) =>
      issueMessage(locale)({
        severity: "error",
        code: "tag-too-short",
        path: ["tags", 0],
        params: { tag: "e", min },
      });
    expect(tagTooShort("en", 1)).toBe("The “e” tag needs at least 1 value.");
    expect(tagTooShort("en", 2)).toBe("The “e” tag needs at least 2 values.");
    expect(tagTooShort("es", 1)).toBe("El tag «e» necesita al menos 1 valor.");
    expect(
      issueMessage("en")({ severity: "error", code: "too-short", path: [], params: { min: 1 } }),
    ).toBe("Must be at least 1 character.");
  });
});
