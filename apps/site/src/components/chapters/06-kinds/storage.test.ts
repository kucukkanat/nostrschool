import { describe, expect, test } from "bun:test";
import { FIXTURE_NOW } from "@nostrschool/fixtures";
import type { KindCategory } from "@nostrschool/protocol";
import { KIND_CATEGORIES, type NostrEvent, verifyEvent } from "@nostrschool/protocol";
import {
  type ArticleSlot,
  DEMO_KINDS,
  dTagOf,
  signDemo,
  storeOnRelay,
  supersedes,
  versionOf,
} from "./storage.ts";

const demo = (
  category: KindCategory,
  version: number,
  slot: ArticleSlot = "a",
  createdAt = FIXTURE_NOW + version * 60,
) => {
  const r = signDemo({ category, version, slot, createdAt });
  if (!r.ok) throw new Error(r.error.message);
  return r.value;
};

const publishAll = (events: readonly NostrEvent[]) =>
  events.reduce<{ stored: readonly NostrEvent[]; outcomes: string[] }>(
    (acc, e) => {
      const r = storeOnRelay(acc.stored, e);
      return { stored: r.stored, outcomes: [...acc.outcomes, r.outcome] };
    },
    { stored: [], outcomes: [] },
  );

describe("signDemo", () => {
  test("produces real, verifiable, reproducible events for every category", () => {
    for (const c of KIND_CATEGORIES) {
      const e = demo(c, 1);
      expect(e.kind).toBe(DEMO_KINDS[c]);
      expect(verifyEvent(e).ok).toBe(true);
      expect(demo(c, 1)).toEqual(e);
    }
  });
  test("addressable demo carries the d tag", () => {
    expect(dTagOf(demo("addressable", 1, "b"))).toBe("b");
    expect(dTagOf(demo("regular", 1))).toBeUndefined();
  });
  test("versionOf reads the number back from content", () => {
    for (const c of KIND_CATEGORIES) expect(versionOf(demo(c, 7))).toBe(7);
    expect(versionOf({ ...demo("regular", 1), content: "no digits" })).toBe(0);
  });
});

describe("storeOnRelay (NIP-01)", () => {
  test("regular: keeps every version; exact duplicates are ignored", () => {
    const [a, b] = [demo("regular", 1), demo("regular", 2)];
    const r = publishAll([a, b, a]);
    expect(r.stored).toEqual([a, b]);
    expect(r.outcomes).toEqual(["stored", "stored", "duplicate"]);
  });
  test("replaceable: newest wins; an older copy is ignored", () => {
    const [v1, v2, v3] = [1, 2, 3].map((n) => demo("replaceable", n));
    const r = publishAll([v1, v2, v3].flatMap((e) => (e === undefined ? [] : [e])));
    expect(r.stored).toEqual([v3].flatMap((e) => (e === undefined ? [] : [e])));
    expect(r.outcomes).toEqual(["stored", "replaced", "replaced"]);
    const stale = storeOnRelay(r.stored, demo("replaceable", 9, "a", FIXTURE_NOW));
    expect(stale.outcome).toBe("ignored-older");
  });
  test("ephemeral: forwarded, never stored", () => {
    const r = publishAll([demo("ephemeral", 1), demo("ephemeral", 2)]);
    expect(r.stored).toEqual([]);
    expect(r.outcomes).toEqual(["forwarded", "forwarded"]);
  });
  test("addressable: one slot per d tag", () => {
    const a1 = demo("addressable", 1, "a");
    const b2 = demo("addressable", 2, "b");
    const a3 = demo("addressable", 3, "a");
    const r = publishAll([a1, b2, a3]);
    expect(r.stored).toEqual([a3, b2]);
    expect(r.outcomes).toEqual(["stored", "stored", "replaced"]);
  });
  test("ties on created_at go to the lowest id, whatever the arrival order", () => {
    const x = demo("replaceable", 1, "a", FIXTURE_NOW);
    const y = demo("replaceable", 2, "a", FIXTURE_NOW);
    const [low, high] = x.id < y.id ? [x, y] : [y, x];
    expect(supersedes(low, high)).toBe(true);
    expect(supersedes(high, low)).toBe(false);
    expect(publishAll([high, low]).stored).toEqual([low]);
    expect(publishAll([low, high]).stored).toEqual([low]);
  });
});
