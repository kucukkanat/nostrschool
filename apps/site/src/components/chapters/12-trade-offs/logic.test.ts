import { describe, expect, test } from "bun:test";
import { getDictionary } from "@nostrschool/i18n";
import { computeEventId, signEvent, verifyEvent } from "@nostrschool/protocol";
import {
  CRITERIA,
  type CriterionId,
  matchingPreset,
  PLATFORMS,
  PRESET_IDS,
  PRESETS,
  RATINGS,
  rankPlatforms,
  togglePriority,
} from "./matrix.ts";
import {
  countLeadingZeroBits,
  DEFAULT_DIFFICULTY,
  expectedAttempts,
  humanizeSeconds,
  MAX_DIFFICULTY,
  mineChunk,
  POW_AUTHOR,
  powEvent,
  spamSeconds,
  splitZeroPrefix,
  validateDifficulty,
} from "./pow.ts";
import { RESOURCE_LINKS, TOOL_LINKS } from "./resources.ts";
import {
  evaluate,
  mascotMood,
  outcomeFor,
  PREPS,
  type PrepId,
  SCENARIOS,
  type ScenarioId,
  SEVERITIES,
  severityLevel,
  toggleIn,
  worst,
} from "./scenarios.ts";

const t = getDictionary("en").chapters.ch12;
const none = new Set<never>();

describe("matrix", () => {
  test("every cell has a rating and a localized note", () => {
    for (const c of CRITERIA)
      for (const p of PLATFORMS) {
        expect([0, 1, 2]).toContain(RATINGS[c][p]);
        expect(t.matrix.notes[c][p].length).toBeGreaterThan(10);
      }
  });

  test("balanced ranking: Bluesky first, Nostr is not the automatic winner", () => {
    const ranking = rankPlatforms(none);
    expect(ranking.map((r) => r.platform)).toEqual(["bluesky", "nostr", "mastodon", "x"]);
    expect(ranking[0]?.score).toBe(83);
    expect(ranking.every((r) => r.score >= 0 && r.score <= 100)).toBe(true);
  });

  test("priorities reshuffle the ranking", () => {
    const dissident = rankPlatforms(new Set<CriterionId>(PRESETS.dissident));
    expect(dissident.map((r) => [r.platform, r.score])).toEqual([
      ["nostr", 81],
      ["bluesky", 75],
      ["mastodon", 56],
      ["x", 19],
    ]);
    const casual = rankPlatforms(new Set<CriterionId>(PRESETS.casual));
    expect(casual[0]?.platform).toBe("bluesky");
    expect(casual.at(-1)?.platform).toBe("nostr");
  });

  test("togglePriority adds and removes immutably", () => {
    const empty = new Set<CriterionId>();
    const one = togglePriority(empty, "spam");
    expect([...one]).toEqual(["spam"]);
    expect(empty.size).toBe(0);
    expect(togglePriority(one, "spam").size).toBe(0);
  });

  test("matchingPreset recognizes exact preset selections only", () => {
    expect(matchingPreset(none)).toBe("balanced");
    for (const id of PRESET_IDS) expect(matchingPreset(new Set<CriterionId>(PRESETS[id]))).toBe(id);
    expect(matchingPreset(new Set<CriterionId>(["spam"]))).toBeUndefined();
    expect(
      matchingPreset(new Set<CriterionId>(["identity", "censorship", "spam"])),
    ).toBeUndefined();
  });
});

describe("scenarios", () => {
  test("lost key: disaster on Nostr unless backed up; others reset by email", () => {
    expect(outcomeFor("nostr", "lostKey", none)).toEqual({
      scenario: "lostKey",
      severity: "disaster",
      key: "lostKey",
    });
    expect(outcomeFor("nostr", "lostKey", new Set<PrepId>(["backup"]))).toEqual({
      scenario: "lostKey",
      severity: "fine",
      key: "lostKeyBackup",
    });
    expect(outcomeFor("x", "lostKey", none).severity).toBe("bumpy");
  });

  test("key leak has no Nostr remedy (no key rotation)", () => {
    const all = new Set<PrepId>(PREPS);
    expect(outcomeFor("nostr", "keyLeak", all).severity).toBe("disaster");
  });

  test("relay ban: multi-relay saves Nostr, X is a disaster", () => {
    const multi = new Set<PrepId>(["multiRelay"]);
    expect(outcomeFor("nostr", "relayBan", multi).key).toBe("relayBanMulti");
    expect(outcomeFor("nostr", "serverGone", multi).severity).toBe("fine");
    expect(outcomeFor("x", "relayBan", none).severity).toBe("disaster");
    expect(outcomeFor("nostr", "spamFlood", new Set<PrepId>(["wot"])).severity).toBe("bumpy");
  });

  test("every outcome key has localized text", () => {
    const all = new Set<PrepId>(PREPS);
    for (const prepSet of [none, all])
      for (const p of PLATFORMS)
        for (const s of SCENARIOS) {
          const o = outcomeFor(p, s, prepSet);
          const text =
            p === "nostr" ? t.scenarios.outcomes.nostr[o.key] : t.scenarios.outcomes[p][s];
          expect(text.length).toBeGreaterThan(10);
        }
  });

  test("worst and severityLevel order severities", () => {
    expect(worst([])).toBe("fine");
    expect(worst(["bumpy", "disaster", "ouch"])).toBe("disaster");
    expect(worst(["ouch", "bumpy"])).toBe("ouch");
    expect(SEVERITIES.map(severityLevel)).toEqual([0, 1 / 3, 2 / 3, 1]);
  });

  test("evaluate reports in canonical scenario order with an overall severity", () => {
    const reports = evaluate(new Set<ScenarioId>(["spamFlood", "lostKey"]), none);
    expect(reports.map((r) => r.platform)).toEqual([...PLATFORMS]);
    expect(reports[0]?.outcomes.map((o) => o.scenario)).toEqual(["lostKey", "spamFlood"]);
    expect(reports[0]?.overall).toBe("disaster");
    expect(evaluate(none, none).every((r) => r.overall === "fine" && r.outcomes.length === 0)).toBe(
      true,
    );
  });

  test("mascotMood", () => {
    expect(mascotMood("disaster", new Set<PrepId>(PREPS))).toBe("panic");
    expect(mascotMood("fine", new Set<PrepId>(PREPS))).toBe("prepared");
    expect(mascotMood("fine", none)).toBe("calm");
    expect(mascotMood("ouch", none)).toBe("worried");
  });

  test("toggleIn is immutable", () => {
    const a = new Set(["x"]);
    expect([...toggleIn(a, "y", true)]).toEqual(["x", "y"]);
    expect([...toggleIn(a, "x", false)]).toEqual([]);
    expect([...a]).toEqual(["x"]);
  });
});

describe("pow", () => {
  test("countLeadingZeroBits (re-exported from protocol) counts bits, not hex characters", () => {
    expect(
      countLeadingZeroBits("000000000e9d97a1ab09fc381030b346cdd7a142ad57e6df0b46dc9bef6c7e2d"),
    ).toBe(36);
    expect(
      countLeadingZeroBits("000006d8c378af1779d2feebc7603a125d99eca0ccf1085959b307f64e5dd358"),
    ).toBe(21);
    expect(countLeadingZeroBits("f0")).toBe(0);
    expect(countLeadingZeroBits("0000")).toBe(16);
  });

  test("validateDifficulty", () => {
    expect(validateDifficulty(DEFAULT_DIFFICULTY)).toEqual({ ok: true, value: DEFAULT_DIFFICULTY });
    for (const bad of [-1, MAX_DIFFICULTY + 1, 1.5, Number.NaN]) {
      const r = validateDifficulty(bad);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.code).toBe("invalid-difficulty");
    }
  });

  test("powEvent carries the NIP-13 nonce tag", () => {
    const e = powEvent("hi", 42, 8);
    expect(e.tags).toEqual([["nonce", "42", "8"]]);
    expect(e.pubkey).toBe(POW_AUTHOR.pubkey);
    expect(e.kind).toBe(1);
  });

  test("mineChunk finds a real id with enough zero bits (deterministic)", () => {
    const p = mineChunk("Hello from Nostr School!", 8, 0, 100_000);
    const found = p.found;
    expect(found).toBeDefined();
    if (found === undefined) return;
    expect(found.bits).toBeGreaterThanOrEqual(8);
    expect(computeEventId(powEvent("Hello from Nostr School!", found.nonce, 8)).id).toBe(found.id);
    expect(p.best).toEqual(found);
    expect(p.nextNonce).toBe(found.nonce + 1);
    // Same inputs, same answer.
    expect(mineChunk("Hello from Nostr School!", 8, 0, 100_000).found).toEqual(found);
  });

  test("a mined note signs and verifies with real crypto, keeping its id", () => {
    const found = mineChunk("gm", 6, 0, 10_000).found;
    if (found === undefined) throw new Error("expected a hit");
    const signed = signEvent(powEvent("gm", found.nonce, 6), POW_AUTHOR.secretKey);
    if (!signed.ok) throw new Error(signed.error.message);
    expect(signed.value.event.id).toBe(found.id);
    expect(verifyEvent(signed.value.event).ok).toBe(true);
  });

  test("mineChunk respects the budget and carries the best attempt across chunks", () => {
    const a = mineChunk("x", 30, 0, 5);
    expect(a.found).toBeUndefined();
    expect(a.nextNonce).toBe(5);
    expect(a.last.nonce).toBe(4);
    const b = mineChunk("x", 30, a.nextNonce, 1, a.best);
    expect(b.nextNonce).toBe(6);
    expect(b.best.bits).toBeGreaterThanOrEqual(a.best.bits);
    const zero = mineChunk("x", 0, 7, 10);
    expect(zero.found?.nonce).toBe(7);
  });

  test("mineChunk reports the real last attempt and keeps a better previous best", () => {
    const a = mineChunk("x", 30, 0, 3);
    expect(a.last.id).toBe(computeEventId(powEvent("x", 2, 30)).id);
    expect(a.last.bits).toBe(countLeadingZeroBits(a.last.id));
    const lucky = { nonce: -1, id: "00".repeat(32), bits: 256 };
    expect(mineChunk("x", 30, 3, 2, lucky).best).toBe(lucky);
    // A zero budget is clamped to one try rather than returning no attempt.
    expect(mineChunk("x", 30, 9, 0).nextNonce).toBe(10);
  });

  test("mineChunk fails loud on a difficulty the protocol rejects", () => {
    expect(() => mineChunk("x", -1, 0, 5)).toThrow();
  });

  test("cost helpers", () => {
    expect(expectedAttempts(10)).toBe(1024);
    expect(spamSeconds(10, 100, 1024)).toBe(100);
    expect(spamSeconds(1, 1, 0)).toBe(2);
    expect(humanizeSeconds(0.0123)).toEqual({ value: 12.3, unit: "ms" });
    expect(humanizeSeconds(5)).toEqual({ value: 5, unit: "s" });
    expect(humanizeSeconds(90)).toEqual({ value: 1.5, unit: "min" });
    expect(humanizeSeconds(7200)).toEqual({ value: 2, unit: "h" });
    expect(humanizeSeconds(3 * 86400)).toEqual({ value: 3, unit: "d" });
    expect(humanizeSeconds(2 * 365 * 86400)).toEqual({ value: 2, unit: "y" });
  });

  test("splitZeroPrefix", () => {
    expect(splitZeroPrefix("000abc")).toEqual({ zeros: "000", rest: "abc" });
    expect(splitZeroPrefix("abc")).toEqual({ zeros: "", rest: "abc" });
  });
});

describe("resources", () => {
  test("every link has a label and an https target", () => {
    for (const l of TOOL_LINKS) expect(t.complete.tools[l.id].length).toBeGreaterThan(0);
    for (const l of RESOURCE_LINKS) {
      expect(l.url.startsWith("https://")).toBe(true);
      expect(t.complete.resources[l.id].label.length).toBeGreaterThan(0);
    }
  });
});
