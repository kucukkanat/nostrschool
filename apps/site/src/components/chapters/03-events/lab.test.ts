import { describe, expect, test } from "bun:test";
import { getDictionary } from "@nostrschool/i18n";
import { verifyEvent } from "@nostrschool/protocol";
import {
  createdAtText,
  finalStage,
  kindSummary,
  pipelineStages,
  shapeErrorText,
  tagLabel,
  verdictText,
} from "./describe.ts";
import {
  countChanged,
  diffMask,
  EVENT_FIELDS,
  fieldFromPath,
  flipHexChar,
  flipTextChar,
  inspectJson,
  isEventField,
  isIndexedTag,
  type LabState,
  prettyEvent,
  reduceLab,
  shortHex,
  suspectFields,
  tagKind,
  verifyView,
} from "./lab.ts";
import { LAB_AUTHOR, sampleNote, sampleReply } from "./sample.ts";

const t = getDictionary("en").chapters.ch03;
const note = sampleNote("Hello Nostr!");
const author: LabState = { mode: "author", event: note };
const forger: LabState = { mode: "forger", event: note };
const sk = LAB_AUTHOR.secretKeyHex;

const step = (s: LabState, a: Parameters<typeof reduceLab>[1]): LabState => {
  const r = reduceLab(s, a, sk);
  if (!r.ok) throw new Error(r.error.message);
  return r.value;
};

describe("samples", () => {
  test("sample note is a valid, deterministic kind-1 by Alice with t + p tags", () => {
    expect(verifyEvent(note).ok).toBe(true);
    expect(note.pubkey).toBe(LAB_AUTHOR.pubkey);
    expect(note.tags.map((tag) => tag[0])).toEqual(["t", "p"]);
    expect(sampleNote("Hello Nostr!").sig).toBe(note.sig);
  });
  test("sample reply is a real fixture with an e tag", () => {
    const reply = sampleReply();
    expect(reply.tags.some((tag) => tag[0] === "e")).toBe(true);
    expect(verifyEvent(reply).ok).toBe(true);
  });
});

describe("field helpers", () => {
  test("isEventField / fieldFromPath", () => {
    expect(EVENT_FIELDS).toHaveLength(7);
    expect(isEventField("sig")).toBe(true);
    expect(isEventField("nope")).toBe(false);
    expect(fieldFromPath("tags.0.1")).toBe("tags");
    expect(fieldFromPath("content")).toBe("content");
    expect(fieldFromPath("")).toBeUndefined();
    expect(fieldFromPath("x.y")).toBeUndefined();
  });
  test("flipHexChar flips exactly one digit, and is its own inverse", () => {
    expect(flipHexChar("a0", 0)).toBe("b0");
    expect(flipHexChar("a0", 1)).toBe("a1");
    expect(flipHexChar(flipHexChar("ff"))).toBe("ff");
    expect(flipHexChar("ab", 5)).toBe("ab");
    expect(countChanged(note.sig, flipHexChar(note.sig))).toBe(1);
  });
  test("flipTextChar swaps case of the first letter or appends", () => {
    expect(flipTextChar("hello")).toBe("Hello");
    expect(flipTextChar("12 Ab")).toBe("12 ab");
    expect(flipTextChar("👋")).toBe("👋!");
    expect(flipTextChar("")).toBe("!");
  });
  test("diffMask / countChanged", () => {
    expect(diffMask("abcd", "abzd")).toEqual([false, false, true, false]);
    expect(countChanged("abcd", "abcd")).toBe(0);
  });
  test("tags: kind, indexed, labels", () => {
    expect(tagKind(["e", "x"])).toBe("e");
    expect(tagKind(["imeta", "url x"])).toBe("imeta");
    expect(tagKind(["zzz"])).toBe("other");
    expect(isIndexedTag(["t", "nostr"])).toBe(true);
    expect(isIndexedTag(["T", "x"])).toBe(true);
    expect(isIndexedTag(["client", "x"])).toBe(false);
    expect(tagLabel("en", ["t", "nostr"])).toBe(t.tags.names.t);
    expect(tagLabel("en", ["emoji", "x"])).toContain("emoji:");
  });
  test("shortHex", () => {
    expect(shortHex("abc")).toBe("abc");
    expect(shortHex("0123456789abcdef")).toBe("01234567…cdef");
  });
});

describe("reduceLab", () => {
  test("author edits are re-signed and stay valid; the id changes", () => {
    const next = step(author, { type: "edit-content", content: "Hello Nostr?" });
    expect(next.event.content).toBe("Hello Nostr?");
    expect(next.event.id).not.toBe(note.id);
    expect(verifyView(next.event).status).toBe("ok");
    const later = step(author, { type: "shift-time", seconds: 1 });
    expect(later.event.created_at).toBe(note.created_at + 1);
    expect(verifyView(later.event).status).toBe("ok");
  });
  test("forger edits keep the stale id: id-mismatch", () => {
    const next = step(forger, { type: "edit-content", content: "Pay Bob 1000 sats" });
    expect(next.event.id).toBe(note.id);
    expect(verifyView(next.event)).toMatchObject({
      status: "error",
      code: "id-mismatch",
      errorAt: 2,
    });
    const later = step(forger, { type: "shift-time", seconds: -1 });
    expect(verifyView(later.event).code).toBe("id-mismatch");
  });
  test("tampering never re-signs, even for the author", () => {
    expect(verifyView(step(author, { type: "tamper", target: "content" }).event).code).toBe(
      "id-mismatch",
    );
    expect(verifyView(step(author, { type: "tamper", target: "created_at" }).event).code).toBe(
      "id-mismatch",
    );
    expect(verifyView(step(author, { type: "tamper", target: "id" }).event).code).toBe(
      "id-mismatch",
    );
    const sig = verifyView(step(author, { type: "tamper", target: "sig" }).event);
    expect(sig).toMatchObject({ status: "error", code: "bad-signature", errorAt: 3 });
  });
  test("resign fixes tampering for the author, is refused for the forger", () => {
    const broken = step(author, { type: "tamper", target: "content" });
    expect(verifyView(step(broken, { type: "resign" }).event).status).toBe("ok");
    const refused = reduceLab({ ...broken, mode: "forger" }, { type: "resign" }, sk);
    expect(refused.ok).toBe(false);
    if (!refused.ok) expect(refused.error.code).toBe("no-key");
  });
  test("set-mode and reset", () => {
    expect(step(author, { type: "set-mode", mode: "forger" }).mode).toBe("forger");
    const broken = step(forger, { type: "tamper", target: "sig" });
    expect(step(broken, { type: "reset", event: note }).event).toEqual(note);
  });
  test("an invalid author key surfaces as invalid-key", () => {
    const r = reduceLab(author, { type: "resign" }, "zz");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe("invalid-key");
  });
});

describe("verifyView + describe", () => {
  test("valid view", () => {
    const v = verifyView(note);
    expect(v).toMatchObject({ status: "ok", computedId: note.id, claimedId: note.id });
    expect(v.serialized.startsWith(`[0,"${note.pubkey}"`)).toBe(true);
    expect(suspectFields(v)).toEqual([]);
    expect(finalStage(v)).toBe(3);
    expect(verdictText("en", v)).toBe(t.verdict.valid);
  });
  test("invalid pubkey and malformed events", () => {
    // The id check runs before the key check, so an edited (even off-curve) pubkey is an id mismatch.
    const badPub = verifyView({ ...note, pubkey: `${"0".repeat(63)}7` });
    expect(badPub.code).toBe("id-mismatch");
    const malformed = verifyView({ ...note, kind: -1 });
    expect(malformed).toMatchObject({ code: "malformed", errorAt: 0 });
    expect(suspectFields(malformed)).toEqual(EVENT_FIELDS);
    expect(finalStage(malformed)).toBe(0);
    expect(suspectFields(verifyView({ ...note, sig: flipHexChar(note.sig) }))).toEqual(["sig"]);
  });
  test("invalid-pubkey blames the pubkey", () => {
    // Re-hash with an off-curve pubkey so the id matches and only the key check fails.
    const pubkey = `${"0".repeat(63)}5`;
    const off = verifyView({ ...note, pubkey });
    const fixed = { ...note, pubkey, id: off.computedId };
    const v = verifyView(fixed);
    expect(v.code).toBe("invalid-pubkey");
    expect(suspectFields(v)).toEqual(["pubkey"]);
    expect(verdictText("en", v)).toBe(t.verdict["invalid-pubkey"]);
  });
  test("pipelineStages reveals values progressively", () => {
    const v = verifyView(note);
    expect(pipelineStages("en", v, -1).every((s) => s.value === undefined)).toBe(true);
    const all = pipelineStages("en", v, 3);
    expect(all.map((s) => s.id)).toEqual(["serialize", "hash", "compare", "schnorr"]);
    expect(all.map((s) => s.value)).toEqual([
      v.serialized,
      note.id,
      t.pipeline.idMatch,
      t.pipeline.sigValid,
    ]);
    const mismatch = verifyView({ ...note, content: "x" });
    expect(pipelineStages("en", mismatch, 3).map((s) => s.value)).toEqual([
      mismatch.serialized,
      mismatch.computedId,
      t.pipeline.idMismatch,
      t.pipeline.skipped,
    ]);
    const badSig = verifyView({ ...note, sig: flipHexChar(note.sig) });
    expect(pipelineStages("en", badSig, 3)[3]?.value).toBe(t.pipeline.sigInvalid);
  });
  test("kindSummary for known and unknown kinds", () => {
    expect(kindSummary("en", 1)).toMatchObject({ category: "regular" });
    expect(kindSummary("en", 1).name.length).toBeGreaterThan(0);
    expect(kindSummary("en", 4242).name).toContain("4242");
    expect(kindSummary("en", 4242).category).toBeUndefined();
  });
  test("createdAtText formats UTC", () => {
    expect(createdAtText("en", 1735689600)).toContain("2025");
  });
});

describe("inspectJson", () => {
  test("valid and tampered JSON", () => {
    const ok = inspectJson(prettyEvent(note));
    expect(ok.ok && ok.value.view.status).toBe("ok");
    const bad = inspectJson(prettyEvent({ ...note, content: "nope" }));
    expect(bad.ok && bad.value.view.code).toBe("id-mismatch");
  });
  test("shape errors are localized", () => {
    const cases: readonly [string, string][] = [
      ["{", "invalid-json"],
      ["[]", "not-an-object"],
      [JSON.stringify({ ...note, sig: undefined }), "missing-field"],
      [JSON.stringify({ ...note, kind: "1" }), "invalid-field"],
      [JSON.stringify({ ...note, tags: [[1]] }), "invalid-tags"],
    ];
    for (const [json, code] of cases) {
      const r = inspectJson(json);
      expect(r.ok).toBe(false);
      if (r.ok) continue;
      expect(r.error.code).toBe(code as typeof r.error.code);
      expect(shapeErrorText("en", r.error).length).toBeGreaterThan(0);
    }
    const missing = inspectJson(JSON.stringify({ ...note, sig: undefined }));
    if (!missing.ok) expect(shapeErrorText("en", missing.error)).toBe("The sig field is missing.");
    const notObj = inspectJson("[]");
    if (!notObj.ok)
      expect(shapeErrorText("en", notObj.error)).toBe(t.inspector.errors["not-an-object"]);
  });
  test("prettyEvent keeps NIP-01 field order", () => {
    expect(Object.keys(JSON.parse(prettyEvent(note)) as object)).toEqual([...EVENT_FIELDS]);
  });
});
