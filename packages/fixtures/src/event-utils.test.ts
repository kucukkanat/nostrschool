import { describe, expect, test } from "bun:test";
import { verifyEvent } from "nostr-tools/pure";
import raw from "./data/events.json" with { type: "json" };
import { newestFirst, parseFixtureFile, signFixture } from "./event-utils.ts";
import { getPersona } from "./personas.ts";

const alice = getPersona("alice");
const template = { kind: 1, created_at: 5, tags: [["t", "x"]], content: "hi" } as const;

describe("parseFixtureFile", () => {
  test("accepts the committed file", () => {
    const r = parseFixtureFile(raw);
    expect(r.ok && r.value.events.length).toBe(raw.events.length);
  });

  test("keeps only NIP-01 fields of each event", () => {
    const first: unknown = raw.events[0];
    const r = parseFixtureFile({ ...raw, events: [{ ...raw.events[0], extra: 1 }] });
    expect<unknown>(r.ok && r.value.events[0]).toEqual(first);
  });

  test.each([
    [null, "invalid-file"],
    [[], "invalid-file"],
    [{ fixtureNow: "x", events: [], placement: {} }, "invalid-file"],
    [{ fixtureNow: 1, events: {}, placement: {} }, "invalid-file"],
    [{ fixtureNow: 1, events: [], placement: [] }, "invalid-file"],
    [{ fixtureNow: 1, events: [], placement: { a: [1] } }, "invalid-file"],
    [{ fixtureNow: 1, events: [{ id: "x" }], placement: {} }, "invalid-event"],
  ])("rejects %j with %s", (input, code) => {
    const r = parseFixtureFile(input);
    expect(r.ok ? "ok" : r.error.code).toBe(code);
  });
});

describe("signFixture", () => {
  const signed = signFixture(template, alice.secretKey);

  test("produces a valid event (checked independently by nostr-tools)", () => {
    expect(signed.pubkey).toBe(alice.pubkey);
    expect(verifyEvent({ ...signed, tags: signed.tags.map((t) => [...t]) })).toBe(true);
  });

  test("is deterministic: fixed aux data gives the same signature every time", () => {
    expect(signFixture(template, alice.secretKey)).toEqual(signed);
  });

  test("newestFirst breaks ties by lowest id", () => {
    const a = { ...signed, id: "a".repeat(64) };
    const b = { ...signed, id: "b".repeat(64) };
    expect([b, a].sort(newestFirst)).toEqual([a, b]);
    expect([a, { ...b, created_at: 9 }].sort(newestFirst)[0]?.created_at).toBe(9);
  });
});
