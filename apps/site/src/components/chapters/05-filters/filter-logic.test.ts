import { describe, expect, test } from "bun:test";
import { FIXTURE_EVENTS, getPersona } from "@nostrschool/fixtures";
import {
  encodeNevent,
  encodeNote,
  encodeNprofile,
  encodeNpub,
  matchFilter,
  type NostrEvent,
  unwrap,
} from "@nostrschool/protocol";
import {
  addValue,
  describeDraft,
  draftToFilter,
  EMPTY_DRAFT,
  evaluate,
  eventPreview,
  type FilterDraft,
  formatTimestamp,
  isEmptyDraft,
  kindLabel,
  NEW_YEARS_EVE,
  PRESET_IDS,
  PRESETS,
  parseFilterJson,
  parseValue,
  pubkeyLabel,
  QUEST_IDS,
  QUEST_SOLUTIONS,
  QUICK_HASHTAGS,
  QUICK_KINDS,
  questTarget,
  removeValue,
  reqMessage,
  sameIds,
  setNumber,
  shortHex,
  solvedQuests,
  THREAD_ROOT,
  TIME_RANGE,
  TIME_STEP,
  toggleValue,
  valueLabel,
  withSafeLimit,
} from "./filter-logic.ts";

const alice = getPersona("alice");
const bob = getPersona("bob");
const value = <T>(r: { ok: true; value: T } | { ok: false; error: unknown }): T => unwrap(r);

describe("parseValue", () => {
  test("ids/#e accept hex (case-insensitive), note and nevent", () => {
    const id = THREAD_ROOT.id;
    expect(value(parseValue("ids", id.toUpperCase()))).toBe(id);
    expect(value(parseValue("#e", unwrap(encodeNote(id))))).toBe(id);
    expect(value(parseValue("ids", unwrap(encodeNevent({ id }))))).toBe(id);
    expect(parseValue("ids", alice.npub)).toMatchObject({
      ok: false,
      error: { code: "invalid-id" },
    });
    expect(parseValue("ids", "abc")).toMatchObject({ ok: false, error: { code: "invalid-id" } });
  });

  test("authors/#p accept hex, npub and nprofile, not notes", () => {
    expect(value(parseValue("authors", alice.npub))).toBe(alice.pubkey);
    expect(value(parseValue("#p", unwrap(encodeNprofile({ pubkey: bob.pubkey }))))).toBe(
      bob.pubkey,
    );
    expect(value(parseValue("authors", ` ${alice.pubkey} `))).toBe(alice.pubkey);
    expect(parseValue("authors", unwrap(encodeNote(THREAD_ROOT.id)))).toMatchObject({
      ok: false,
      error: { code: "invalid-pubkey" },
    });
    expect(unwrap(encodeNpub(alice.pubkey))).toBe(alice.npub);
  });

  test("kinds are integers in 0..65535, normalized", () => {
    expect(value(parseValue("kinds", "007"))).toBe("7");
    expect(parseValue("kinds", "1.5")).toMatchObject({
      ok: false,
      error: { code: "not-an-integer" },
    });
    expect(parseValue("kinds", "65536")).toMatchObject({
      ok: false,
      error: { code: "out-of-range" },
    });
  });

  test("hashtags lose the # and are lowercased; spaces are rejected", () => {
    expect(value(parseValue("#t", "#Nostr"))).toBe("nostr");
    expect(parseValue("#t", "#")).toMatchObject({ ok: false, error: { code: "invalid-hashtag" } });
    expect(parseValue("#t", "two words")).toMatchObject({
      ok: false,
      error: { code: "invalid-hashtag" },
    });
    expect(parseValue("#t", "   ")).toMatchObject({ ok: false, error: { code: "empty" } });
  });
});

describe("draft editing", () => {
  test("add, duplicate, toggle, remove, numbers", () => {
    const d1 = value(addValue(EMPTY_DRAFT, "kinds", "1"));
    expect(d1.lists.kinds).toEqual(["1"]);
    expect(addValue(d1, "kinds", "01")).toMatchObject({ ok: false, error: { code: "duplicate" } });
    expect(addValue(d1, "kinds", "x")).toMatchObject({
      ok: false,
      error: { code: "not-an-integer" },
    });
    const d2 = toggleValue(d1, "kinds", "7");
    expect(d2.lists.kinds).toEqual(["1", "7"]);
    expect(toggleValue(d2, "kinds", "1").lists.kinds).toEqual(["7"]);
    expect(removeValue(d2, "kinds", "7").lists.kinds).toEqual(["1"]);
    expect(setNumber(d2, "limit", 3).limit).toBe(3);
    expect(EMPTY_DRAFT.lists.kinds).toEqual([]);
  });

  test("draftToFilter omits empty fields and converts kinds", () => {
    expect(draftToFilter(EMPTY_DRAFT)).toEqual({});
    expect(isEmptyDraft(EMPTY_DRAFT)).toBe(true);
    const draft: FilterDraft = {
      lists: {
        ids: [THREAD_ROOT.id],
        authors: [alice.pubkey],
        kinds: ["1", "7"],
        "#e": [THREAD_ROOT.id],
        "#p": [bob.pubkey],
        "#t": ["nostr"],
      },
      since: 1,
      until: 2,
      limit: 3,
    };
    const filter = draftToFilter(draft);
    expect(Object.keys(filter)).toEqual([
      "ids",
      "authors",
      "kinds",
      "#e",
      "#p",
      "#t",
      "since",
      "until",
      "limit",
    ]);
    expect(filter.kinds).toEqual([1, 7]);
    expect(isEmptyDraft(draft)).toBe(false);
    expect(value(parseFilterJson(JSON.stringify(filter)))).toEqual(draft);
  });

  test("parseFilterJson reports typed errors", () => {
    expect(parseFilterJson("{nope")).toMatchObject({ ok: false, error: { code: "invalid-json" } });
    expect(parseFilterJson('{"kinds":"1"}')).toMatchObject({
      ok: false,
      error: { code: "invalid-filter", field: "kinds" },
    });
    expect(parseFilterJson("[]")).toMatchObject({ ok: false, error: { code: "invalid-filter" } });
    expect(parseFilterJson('{"search":"zap"}')).toMatchObject({
      ok: false,
      error: { code: "unsupported-field", field: "search" },
    });
    expect(parseFilterJson('{"#d":["x"]}')).toMatchObject({
      ok: false,
      error: { code: "unsupported-field", field: "#d" },
    });
    expect(value(parseFilterJson("{}"))).toEqual(EMPTY_DRAFT);
  });
});

describe("evaluate", () => {
  test("empty filter returns every event, newest first", () => {
    const r = evaluate({}, FIXTURE_EVENTS);
    expect(r.matching).toBe(FIXTURE_EVENTS.length);
    expect(r.returnedIds).toHaveLength(FIXTURE_EVENTS.length);
    expect(r.rows.every((row) => row.state === "match" && row.checks.length === 0)).toBe(true);
  });

  test("states agree with matchFilter, and limit marks the rest as limited", () => {
    const filter = { kinds: [1], limit: 2 };
    const r = evaluate(filter, FIXTURE_EVENTS);
    const notes = FIXTURE_EVENTS.filter((e) => e.kind === 1);
    expect(r.matching).toBe(notes.length);
    expect(r.returnedIds).toEqual(notes.slice(0, 2).map((e) => e.id));
    expect(r.rows.filter((row) => row.state === "limited")).toHaveLength(notes.length - 2);
    for (const row of r.rows) expect(row.state !== "miss").toBe(matchFilter(filter, row.event));
    const miss = r.rows.find((row) => row.state === "miss");
    expect(miss?.checks).toEqual([{ field: "kinds", passed: false }]);
  });

  test("sameIds ignores order", () => {
    expect(sameIds(["a", "b"], ["b", "a"])).toBe(true);
    expect(sameIds(["a"], ["a", "b"])).toBe(false);
    expect(sameIds(["a", "c"], ["a", "b"])).toBe(false);
  });

  test("withSafeLimit caps or adds a limit, keeps smaller ones", () => {
    expect(withSafeLimit({ kinds: [1] }, 30)).toEqual({ kinds: [1], limit: 30 });
    expect(withSafeLimit({ limit: 100 }, 30)).toEqual({ limit: 30 });
    const small = { limit: 5 };
    expect(withSafeLimit(small, 30)).toBe(small);
  });

  test("reqMessage is the NIP-01 wire format", () => {
    expect(JSON.parse(reqMessage("sub", { kinds: [1] }))).toEqual(["REQ", "sub", { kinds: [1] }]);
  });
});

describe("labels", () => {
  test("shortHex, pubkeyLabel, kindLabel, valueLabel", () => {
    expect(shortHex("abc")).toBe("abc");
    expect(shortHex(THREAD_ROOT.id)).toBe(
      `${THREAD_ROOT.id.slice(0, 6)}…${THREAD_ROOT.id.slice(-4)}`,
    );
    expect(pubkeyLabel(alice.pubkey)).toBe("Alice");
    expect(pubkeyLabel("f".repeat(64))).toBe("ffffff…ffff");
    expect(kindLabel("en", 1)).toBe("Short text note");
    expect(kindLabel("en", 4242)).toBe("4242");
    expect(valueLabel("en", "authors", alice.pubkey)).toBe("Alice");
    expect(valueLabel("en", "#p", bob.pubkey)).toBe("Bob");
    expect(valueLabel("en", "kinds", "7")).toBe("7 · Reaction");
    expect(valueLabel("en", "#t", "nostr")).toBe("#nostr");
    expect(valueLabel("en", "ids", "abc")).toBe("abc");
    expect(valueLabel("en", "#e", "abc")).toBe("abc");
    expect(formatTimestamp("en", NEW_YEARS_EVE)).toContain("2024");
  });

  test("describeDraft reads like a sentence", () => {
    expect(describeDraft("en", EMPTY_DRAFT)).toBe("An empty filter: give me everything you have!");
    expect(describeDraft("en", PRESETS.aliceNotes)).toBe(
      "Give me events written by Alice, of kind 1 · Short text note.",
    );
    expect(describeDraft("en", PRESETS.newest)).toBe(
      "Give me the newest 5 events, whatever they are.",
    );
    const both = setNumber(
      setNumber(toggleValue(EMPTY_DRAFT, "#t", "nostr"), "since", 0),
      "until",
      0,
    );
    const text = describeDraft("en", toggleValue(both, "#t", "art"));
    expect(text).toContain("tagged #nostr or #art");
    expect(text).toContain("from ");
    expect(text).toContain("up to ");
    expect(describeDraft("en", setNumber(PRESETS.hashtag, "limit", 2))).toBe(
      "Give me the newest 2 events tagged #nostr.",
    );
  });

  test("eventPreview covers every fixture kind", () => {
    const byKind = (kind: number): NostrEvent => {
      const e = FIXTURE_EVENTS.find((x) => x.kind === kind);
      if (e === undefined) throw new Error(`no kind ${kind}`);
      return e;
    };
    expect(eventPreview("en", byKind(0))).toBe("Profile: name, picture, bio");
    expect(eventPreview("en", byKind(3))).toMatch(/^Follow list \(\d+ people\)$/);
    expect(eventPreview("en", byKind(5))).toBe("Deletion request");
    expect(eventPreview("en", byKind(6))).toBe("Repost of another note");
    expect(eventPreview("en", byKind(1059))).toContain("Sealed");
    expect(eventPreview("en", byKind(9735))).toContain("Zap receipt");
    expect(eventPreview("en", byKind(10002))).toMatch(/^Relay list \(\d+ relays\)$/);
    expect(eventPreview("en", byKind(30023))).toBe("Protocols, not platforms");
    const untitled = { ...byKind(30023), tags: [] };
    expect(eventPreview("en", untitled)).toBe("Long-form article");
    expect(eventPreview("en", byKind(7))).toBe("+");
    const long = { ...byKind(1), content: "x".repeat(200) };
    expect(eventPreview("en", long)).toHaveLength(90);
  });
});

describe("presets, quests and quick picks", () => {
  test("every preset returns something", () => {
    for (const id of PRESET_IDS)
      expect(
        evaluate(draftToFilter(PRESETS[id]), FIXTURE_EVENTS).returnedIds.length,
      ).toBeGreaterThan(0);
  });

  test("each quest has a non-empty, distinct target solved by its reference filter", () => {
    const targets = QUEST_IDS.map(questTarget);
    for (const target of targets) expect(target.length).toBeGreaterThan(0);
    expect(new Set(targets.map((t) => [...t].sort().join())).size).toBe(QUEST_IDS.length);
    for (const id of QUEST_IDS) {
      const ids = evaluate(draftToFilter(QUEST_SOLUTIONS[id]), FIXTURE_EVENTS).returnedIds;
      expect(solvedQuests(ids)).toEqual([id]);
    }
    expect(solvedQuests([])).toEqual([]);
  });

  test("the reactions quest is exactly the kind 7 events pointing at the thread", () => {
    const ids = questTarget("reactions");
    const expected = FIXTURE_EVENTS.filter(
      (e) => e.kind === 7 && e.tags.some((t) => t[0] === "e" && t[1] === THREAD_ROOT.id),
    ).map((e) => e.id);
    expect(sameIds(ids, expected)).toBe(true);
  });

  test("quick picks and time range come from the fixtures", () => {
    expect(QUICK_KINDS).toContain("1");
    expect(QUICK_KINDS).toContain("30023");
    expect(QUICK_HASHTAGS).toContain("nostr");
    expect(TIME_RANGE.min % TIME_STEP).toBe(0);
    expect((NEW_YEARS_EVE - TIME_RANGE.min) % TIME_STEP).toBe(0);
    for (const e of FIXTURE_EVENTS) {
      expect(e.created_at).toBeGreaterThanOrEqual(TIME_RANGE.min);
      expect(e.created_at).toBeLessThanOrEqual(TIME_RANGE.max);
    }
  });
});
