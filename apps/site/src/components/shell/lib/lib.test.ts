import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { CHAPTERS } from "~/lib/chapters";
import {
  HERO_EDGES,
  HERO_NODES,
  lerp,
  loopPhase,
  readingProgress,
  resolveEdges,
} from "./geometry.ts";
import { alternateLinks, chapterLinks, TOOL_SLUGS, toolLinks } from "./links.ts";
import {
  chapterStatus,
  createProgressStore,
  nextChapter,
  normalizeCompleted,
  PROGRESS_STORAGE_KEY,
  parseCompleted,
  withCompleted,
} from "./progress.ts";
import { browserStorage, type KeyValueStorage, readItem, writeItem } from "./storage.ts";
import {
  applyTheme,
  isThemePref,
  loadThemePref,
  parseThemePref,
  resolveTheme,
  saveThemePref,
  THEME_STORAGE_KEY,
} from "./theme.ts";

/**
 * Storage that behaves like a browser with site data blocked: every access throws, exactly as
 * Safari private mode / disabled cookies do. It implements the interface; nothing is mocked.
 */
const blockedStorage: KeyValueStorage = {
  getItem: () => {
    throw new DOMException("blocked", "SecurityError");
  },
  setItem: () => {
    throw new DOMException("quota", "QuotaExceededError");
  },
  removeItem: () => {
    throw new DOMException("blocked", "SecurityError");
  },
};

beforeEach(() => localStorage.clear());
afterEach(() => localStorage.clear());

describe("storage", () => {
  test("browserStorage returns the real localStorage under happy-dom", () => {
    const s = browserStorage();
    expect(s.ok && s.value).toBe(localStorage);
  });

  test("read/write/remove round-trip", () => {
    expect(writeItem(localStorage, "k", "v")).toEqual({ ok: true, value: undefined });
    expect(readItem(localStorage, "k")).toEqual({ ok: true, value: "v" });
    writeItem(localStorage, "k", null);
    expect(readItem(localStorage, "k")).toEqual({ ok: true, value: null });
  });

  test("blocked storage yields typed errors instead of throwing", () => {
    const r = readItem(blockedStorage, "k");
    expect(!r.ok && r.error.code).toBe("read-failed");
    const w = writeItem(blockedStorage, "k", "v");
    expect(!w.ok && w.error.code).toBe("write-failed");
    const d = writeItem(blockedStorage, "k", null);
    expect(!d.ok && d.error.message).toBe("blocked");
  });
});

describe("theme", () => {
  test("parse keeps only forced themes", () => {
    expect(parseThemePref("dark")).toBe("dark");
    expect(parseThemePref("light")).toBe("light");
    expect(parseThemePref("system")).toBe("system");
    expect(parseThemePref("purple")).toBe("system");
    expect(parseThemePref(null)).toBe("system");
    expect(isThemePref("system")).toBe(true);
    expect(isThemePref(1)).toBe(false);
  });

  test("resolve follows the OS only for system", () => {
    expect(resolveTheme("system", true)).toBe("dark");
    expect(resolveTheme("system", false)).toBe("light");
    expect(resolveTheme("light", true)).toBe("light");
  });

  test("apply sets or clears data-theme", () => {
    const root = document.createElement("html");
    applyTheme(root, "dark");
    expect(root.dataset["theme"]).toBe("dark");
    applyTheme(root, "system");
    expect(root.dataset["theme"]).toBeUndefined();
  });

  test("save stores forced themes and removes the key for system", () => {
    saveThemePref(localStorage, "dark");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
    expect(loadThemePref(localStorage)).toEqual({ ok: true, value: "dark" });
    saveThemePref(localStorage, "system");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
    const failed = loadThemePref(blockedStorage);
    expect(failed.ok).toBe(false);
  });
});

describe("progress", () => {
  test("normalize orders by course, dedupes and drops unknown slugs", () => {
    expect(normalizeCompleted(["events", "keys", "keys", "nope", 3])).toEqual(["keys", "events"]);
  });

  test("parse handles missing, corrupt and non-array values", () => {
    expect(parseCompleted(null)).toEqual({ ok: true, value: [] });
    expect(parseCompleted('["zaps","why-nostr"]')).toEqual({
      ok: true,
      value: ["why-nostr", "zaps"],
    });
    const bad = parseCompleted("{oops");
    expect(!bad.ok && bad.error.code).toBe("invalid-json");
    const obj = parseCompleted('{"a":1}');
    expect(!obj.ok && obj.error.code).toBe("not-an-array");
  });

  test("withCompleted adds and removes", () => {
    const one = withCompleted([], "keys", true);
    expect(one).toEqual(["keys"]);
    expect(withCompleted(one, "keys", false)).toEqual([]);
  });

  test("nextChapter is the first unfinished one, or chapter 1 when all are done", () => {
    expect(nextChapter([]).slug).toBe("why-nostr");
    expect(nextChapter(["why-nostr", "keys"]).slug).toBe("events");
    expect(nextChapter(CHAPTERS.map((c) => c.slug)).slug).toBe("why-nostr");
  });

  test("chapterStatus", () => {
    expect(chapterStatus(["why-nostr"], "why-nostr")).toBe("done");
    expect(chapterStatus(["why-nostr"], "keys")).toBe("current");
    expect(chapterStatus(["why-nostr"], "zaps")).toBe("upcoming");
  });

  test("store loads, persists and reloads from real localStorage", () => {
    localStorage.setItem(PROGRESS_STORAGE_KEY, '["keys"]');
    const store = createProgressStore(localStorage);
    expect(store.$completed.get()).toEqual(["keys"]);
    expect(store.setCompleted("why-nostr", true)).toEqual({
      ok: true,
      value: ["why-nostr", "keys"],
    });
    expect(localStorage.getItem(PROGRESS_STORAGE_KEY)).toBe('["why-nostr","keys"]');
    localStorage.setItem(PROGRESS_STORAGE_KEY, "[]");
    store.reload();
    expect(store.$completed.get()).toEqual([]);
  });

  test("store survives corrupt data, blocked storage and no storage", () => {
    localStorage.setItem(PROGRESS_STORAGE_KEY, "not json");
    expect(createProgressStore(localStorage).$completed.get()).toEqual([]);

    const blocked = createProgressStore(blockedStorage);
    expect(blocked.$completed.get()).toEqual([]);
    const saved = blocked.setCompleted("keys", true);
    expect(!saved.ok && saved.error.code).toBe("write-failed");
    // The UI still reflects the click for this page view.
    expect(blocked.$completed.get()).toEqual(["keys"]);

    const memory = createProgressStore(undefined);
    expect(memory.setCompleted("zaps", true)).toEqual({ ok: true, value: ["zaps"] });
  });
});

describe("geometry", () => {
  test("readingProgress clamps and treats short pages as read", () => {
    expect(readingProgress({ scrollTop: 0, scrollHeight: 2000, clientHeight: 1000 })).toBe(0);
    expect(readingProgress({ scrollTop: 500, scrollHeight: 2000, clientHeight: 1000 })).toBe(0.5);
    expect(readingProgress({ scrollTop: 5000, scrollHeight: 2000, clientHeight: 1000 })).toBe(1);
    expect(readingProgress({ scrollTop: 0, scrollHeight: 800, clientHeight: 1000 })).toBe(1);
    expect(readingProgress({ scrollTop: Number.NaN, scrollHeight: 2000, clientHeight: 1 })).toBe(0);
  });

  test("lerp and loopPhase", () => {
    expect(lerp({ x: 0, y: 0 }, { x: 10, y: 20 }, 0.5)).toEqual({ x: 5, y: 10 });
    expect(lerp({ x: 0, y: 0 }, { x: 10, y: 20 }, 2)).toEqual({ x: 10, y: 20 });
    expect(loopPhase(1500, 1000)).toBeCloseTo(0.5);
    expect(loopPhase(0, 1000, 0.25)).toBeCloseTo(0.25);
    expect(loopPhase(100, 0)).toBe(0);
  });

  test("hero edges resolve; dangling ones fail loud", () => {
    expect(resolveEdges(HERO_NODES, HERO_EDGES)).toHaveLength(HERO_EDGES.length);
    expect(() => resolveEdges(HERO_NODES, [{ from: "u1", to: "ghost" }])).toThrow("dangling");
  });
});

describe("links", () => {
  test("chapterLinks covers every chapter with localized titles and hrefs", () => {
    const links = chapterLinks("en");
    expect(links).toHaveLength(12);
    expect(links[1]).toMatchObject({ slug: "keys", nn: "02", href: "/en/learn/keys/" });
    expect(links[1]?.title.length).toBeGreaterThan(0);
  });

  test("toolLinks lists the four tools plus the glossary", () => {
    const tools = toolLinks("es");
    expect(tools.map((t) => t.id)).toEqual([...TOOL_SLUGS, "glossary"]);
    expect(tools[0]?.href).toBe("/es/tools/keys/");
    expect(tools.at(-1)?.href).toBe("/es/glossary/");
  });

  test("alternateLinks maps the current page to every locale", () => {
    expect(alternateLinks("/en/learn/keys/")).toEqual([
      { locale: "en", href: "/en/learn/keys/" },
      { locale: "es", href: "/es/learn/keys/" },
    ]);
  });
});
