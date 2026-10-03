import { describe, expect, test } from "bun:test";
import { matchFilter as ntMatchFilter } from "nostr-tools/filter";
import { signEvent } from "./event.ts";
import {
  applyFilters,
  explainFilterMatch,
  matchFilter,
  matchFilters,
  validateFilter,
} from "./filter.ts";
import { deriveSecretKey, keypairFromSecret } from "./keys.ts";
import { unwrap } from "./result.ts";
import type { EventTemplate, Filter, NostrEvent } from "./types.ts";

const alice = unwrap(keypairFromSecret(deriveSecretKey("filter-test:alice")));
const bob = unwrap(keypairFromSecret(deriveSecretKey("filter-test:bob")));
const AUX = new Uint8Array(32);
const make = (t: Partial<EventTemplate>, sk = alice.secretKey): NostrEvent =>
  unwrap(signEvent({ kind: 1, created_at: 100, tags: [], content: "", ...t }, sk, { auxRand: AUX }))
    .event;

const note = make({
  tags: [
    ["t", "nostr"],
    ["p", bob.publicKey, "wss://r.example"],
    ["emoji", "x"],
  ],
});
const reply = make({ created_at: 200, tags: [["e", note.id]] }, bob.secretKey);
const reaction = make(
  { kind: 7, created_at: 300, content: "+", tags: [["e", note.id]] },
  bob.secretKey,
);
const sameTime = make({ created_at: 300, content: "tie" });
const all = [note, reply, reaction, sameTime];

describe("matchFilter (NIP-01 semantics)", () => {
  test.each<[string, Filter, NostrEvent, boolean]>([
    ["empty filter matches anything", {}, note, true],
    ["ids exact", { ids: [note.id] }, note, true],
    ["ids prefix is NOT a match", { ids: [note.id.slice(0, 10)] }, note, false],
    ["authors", { authors: [bob.publicKey] }, note, false],
    ["kinds OR", { kinds: [7, 1] }, note, true],
    ["empty list matches nothing", { kinds: [] }, note, false],
    ["since inclusive", { since: 100 }, note, true],
    ["since excludes older", { since: 101 }, note, false],
    ["until inclusive", { until: 100 }, note, true],
    ["until excludes newer", { until: 99 }, note, false],
    ["#t", { "#t": ["nostr"] }, note, true],
    ["#p first value only", { "#p": ["wss://r.example"] }, note, false],
    ["#p", { "#p": [bob.publicKey] }, note, true],
    ["#e missing tag", { "#e": [note.id] }, note, false],
    ["AND across fields", { kinds: [1], authors: [alice.publicKey], "#t": ["other"] }, note, false],
    ["limit and search are ignored", { limit: 0, search: "zzz" }, note, true],
  ])("%s", (_name, filter, event, expected) => {
    expect(matchFilter(filter, event)).toBe(expected);
    // Cross-check against nostr-tools wherever its semantics agree with NIP-01.
    if (!_name.includes("ignored"))
      expect(ntMatchFilter(filter as never, event as never)).toBe(expected);
  });

  test("an undefined tag key is ignored", () => {
    expect(matchFilter({ "#t": undefined }, note)).toBe(true);
  });

  test("matchFilters ORs filters", () => {
    expect(matchFilters([{ kinds: [7] }, { kinds: [1] }], note)).toBe(true);
    expect(matchFilters([{ kinds: [7] }], note)).toBe(false);
    expect(matchFilters([], note)).toBe(false);
  });
});

describe("explainFilterMatch", () => {
  test("lists every present condition in stable order", () => {
    const f: Filter = {
      "#t": ["nostr"],
      "#p": ["nope"],
      until: 50,
      since: 1,
      kinds: [1],
      authors: [alice.publicKey],
      ids: [note.id],
    };
    expect(explainFilterMatch(f, note)).toEqual({
      matches: false,
      checks: [
        { field: "ids", passed: true },
        { field: "authors", passed: true },
        { field: "kinds", passed: true },
        { field: "since", passed: true },
        { field: "until", passed: false },
        { field: "#p", passed: false },
        { field: "#t", passed: true },
      ],
    });
  });
});

describe("applyFilters (relay semantics)", () => {
  test("newest first, ties by lowest id", () => {
    const out = applyFilters([{}], all);
    expect(out.map((e) => e.created_at)).toEqual([300, 300, 200, 100]);
    const [a, b] = out;
    expect(a && b && a.id < b.id).toBe(true);
  });
  test("per-filter limit, union deduped", () => {
    const out = applyFilters(
      [
        { kinds: [1], limit: 1 },
        { "#e": [note.id], limit: 5 },
      ],
      all,
    );
    // limit 1 keeps only the newest kind-1 (sameTime); the #e filter adds reply + reaction.
    expect(out).toEqual(applyFilters([{}], [sameTime, reply, reaction]));
    expect(applyFilters([{ kinds: [1] }, { kinds: [1] }], all)).toHaveLength(3);
    expect(applyFilters([{ limit: 0 }], all)).toEqual([]);
    expect(applyFilters([{ authors: [bob.publicKey] }, { kinds: [7] }], all)).toEqual([
      reaction,
      reply,
    ]);
  });
});

describe("validateFilter", () => {
  test("accepts a full filter", () => {
    const f = {
      ids: [note.id],
      authors: [alice.publicKey],
      kinds: [0, 65535],
      since: 0,
      until: 9,
      limit: 10,
      search: "x",
      "#e": [note.id],
      "#p": [alice.publicKey],
      "#t": ["nostr"],
      "#T": [],
    };
    expect(validateFilter(f)).toEqual({ ok: true, value: f });
  });
  test.each([
    [null, "not-an-object", undefined],
    [[], "not-an-object", undefined],
    [{ foo: 1 }, "unknown-field", "foo"],
    [{ "#emoji": ["x"] }, "unknown-field", "#emoji"],
    [{ ids: ["abc"] }, "invalid-field", "ids"],
    [{ authors: "x" }, "invalid-field", "authors"],
    [{ kinds: [1.5] }, "invalid-field", "kinds"],
    [{ kinds: [70000] }, "invalid-field", "kinds"],
    [{ since: -1 }, "invalid-field", "since"],
    [{ limit: "5" }, "invalid-field", "limit"],
    [{ search: 1 }, "invalid-field", "search"],
    [{ "#e": [1] }, "invalid-field", "#e"],
    // NIP-01: #e/#p values MUST be exact 64-char lowercase hex, like ids/authors.
    [{ "#e": ["a"] }, "invalid-field", "#e"],
    [{ "#p": ["npub1xyz"] }, "invalid-field", "#p"],
    [{ "#p": ["A".repeat(64)] }, "invalid-field", "#p"],
    [{ "#t": [1] }, "invalid-field", "#t"],
  ])("%j → %s", (input, code, field) => {
    const r = validateFilter(input);
    expect<unknown>(r.ok ? null : { code: r.error.code, field: r.error.field }).toEqual({
      code,
      field,
    });
  });
});
