import { describe, expect, test } from "bun:test";
import { getDictionary } from "@nostrschool/i18n";
import { getNipMeta, NIP_INDEX, type NipListing } from "@nostrschool/nips";
import { listNips } from "@nostrschool/nips/specs";
import {
  activeFilterCount,
  type BrowseState,
  buildListings,
  clearFilters,
  courseNipIds,
  DEFAULT_BROWSE_STATE,
  effectiveSort,
  highlightSegments,
  kindCategoriesOf,
  matchesBrowse,
  orderNips,
  parseBrowseState,
  queryWords,
  semanticMessage,
  serializeBrowseState,
  toggleValue,
  withKind,
} from "./browse.ts";

const listings = listNips();
const listing = (id: string): NipListing => {
  const found = listings.find((n) => n.id === id);
  if (found === undefined) throw new Error(`no listing ${id}`);
  return found;
};
const state = (patch: Partial<BrowseState>): BrowseState => ({ ...DEFAULT_BROWSE_STATE, ...patch });
const none: ReadonlySet<string> = new Set();

describe("query string round trip", () => {
  test("the default state is an empty query string", () => {
    expect(serializeBrowseState(DEFAULT_BROWSE_STATE)).toBe("");
    expect(parseBrowseState("")).toEqual(DEFAULT_BROWSE_STATE);
  });

  test("every facet survives serialize → parse", () => {
    const full = state({
      q: "private messages",
      statuses: ["final", "draft"],
      variants: ["event", "http"],
      categories: ["addressable"],
      kind: 9735,
      relay: true,
      editor: true,
      course: true,
      sort: "title",
      view: "list",
    });
    const qs = serializeBrowseState(full);
    expect(qs.startsWith("?")).toBe(true);
    expect(parseBrowseState(qs)).toEqual(full);
  });

  test("values come back in canonical order, so equal states give equal URLs", () => {
    const a = parseBrowseState("?status=draft,final");
    const b = parseBrowseState("?status=final&status=draft");
    expect(a.statuses).toEqual(["final", "draft"]);
    expect(serializeBrowseState(a)).toBe(serializeBrowseState(b));
  });

  test("malformed or unknown values are dropped, never thrown on", () => {
    const s = parseBrowseState(
      "?status=bogus,final&defines=nope&type=weird&kind=abc&sort=sideways&view=3d&relay=yes",
    );
    expect(s).toEqual(state({ statuses: ["final"] }));
    expect(parseBrowseState("?kind=123456").kind).toBeUndefined();
    expect(parseBrowseState(`?q=${"x".repeat(500)}`).q).toHaveLength(200);
  });

  test("a blank query is not serialised", () => {
    expect(serializeBrowseState(state({ q: "   " }))).toBe("");
    expect(serializeBrowseState(state({ q: " zaps " }))).toBe("?q=zaps");
  });
});

describe("facets", () => {
  test("toggleValue adds once and removes", () => {
    expect(toggleValue(["a"], "b", true)).toEqual(["a", "b"]);
    expect(toggleValue(["a", "b"], "b", true)).toEqual(["a", "b"]);
    expect(toggleValue(["a", "b"], "a", false)).toEqual(["b"]);
  });

  test("withKind sets and removes the kind", () => {
    expect(withKind(DEFAULT_BROWSE_STATE, 7).kind).toBe(7);
    expect("kind" in withKind(state({ kind: 7 }), undefined)).toBe(false);
  });

  test("activeFilterCount counts narrowing facets, not the query, sort or view", () => {
    expect(activeFilterCount(state({ q: "x", sort: "title", view: "list" }))).toBe(0);
    expect(
      activeFilterCount(
        state({ statuses: ["final"], kind: 1, relay: true, editor: true, course: true }),
      ),
    ).toBe(5);
    expect(activeFilterCount(state({ variants: ["event"], categories: ["regular"] }))).toBe(2);
  });

  test("clearFilters keeps the query, sort and view", () => {
    const s = state({ q: "zap", statuses: ["final"], editor: true, sort: "title", view: "list" });
    expect(clearFilters(s)).toEqual(state({ q: "zap", sort: "title", view: "list" }));
    expect(clearFilters(state({ relay: true }))).toEqual(DEFAULT_BROWSE_STATE);
  });

  test("kindCategoriesOf covers defined kinds, range ends and example kinds", () => {
    expect(kindCategoriesOf(listing("01")).has("replaceable")).toBe(true);
    expect(kindCategoriesOf(listing("57")).has("regular")).toBe(true);
    expect(kindCategoriesOf(listing("23")).has("addressable")).toBe(true);
    const meta = getNipMeta("29");
    if (meta === undefined) throw new Error("NIP-29 missing");
    // NIP-29 defines the 39000–39009 range: addressable.
    expect(kindCategoriesOf(meta).has("addressable")).toBe(true);
  });

  test("matchesBrowse ANDs facets: status, variant, editor, course, category, kind, relay", () => {
    const nip57 = listing("57");
    expect(matchesBrowse(nip57, DEFAULT_BROWSE_STATE, none)).toBe(true);
    expect(matchesBrowse(nip57, state({ statuses: [nip57.status] }), none)).toBe(true);
    expect(matchesBrowse(nip57, state({ statuses: ["deprecated"] }), none)).toBe(false);
    expect(matchesBrowse(nip57, state({ variants: [nip57.variant] }), none)).toBe(true);
    expect(matchesBrowse(nip57, state({ kind: 9735 }), none)).toBe(true);
    expect(matchesBrowse(nip57, state({ kind: 30023 }), none)).toBe(false);
    expect(matchesBrowse(nip57, state({ course: true }), none)).toBe(false);
    expect(matchesBrowse(nip57, state({ course: true }), new Set(["57"]))).toBe(true);
    expect(matchesBrowse(nip57, state({ categories: ["regular"] }), none)).toBe(true);
    expect(matchesBrowse(nip57, state({ categories: ["ephemeral"] }), none)).toBe(false);
    expect(matchesBrowse({ ...nip57, todo: true }, state({ editor: true }), none)).toBe(false);
    expect(matchesBrowse({ ...nip57, todo: false }, state({ editor: true }), none)).toBe(true);
    expect(matchesBrowse({ ...nip57, relay: false }, state({ relay: true }), none)).toBe(false);
  });
});

describe("ordering", () => {
  test("effectiveSort: best match only while searching", () => {
    expect(effectiveSort(DEFAULT_BROWSE_STATE)).toBe("id");
    expect(effectiveSort(state({ q: "zap" }))).toBe("relevance");
    expect(effectiveSort(state({ sort: "relevance" }))).toBe("id");
    expect(effectiveSort(state({ q: "zap", sort: "title" }))).toBe("title");
    expect(effectiveSort(state({ sort: "updated" }))).toBe("updated");
  });

  test("without a query every matching NIP shows, in the chosen order", () => {
    const byId = orderNips(listings, DEFAULT_BROWSE_STATE, none, undefined, "en");
    expect(byId.map((n) => n.id)).toEqual(listings.map((n) => n.id));
    const byTitle = orderNips(listings, state({ sort: "title" }), none, undefined, "en");
    const titles = byTitle.map((n) => n.title);
    expect(titles).toEqual([...titles].sort((a, b) => a.localeCompare(b, "en")));
  });

  test("with a query, only ranked NIPs show, in rank order unless a sort is chosen", () => {
    const ranked = ["57", "01", "zz", "47"];
    const hits = orderNips(listings, state({ q: "zap" }), none, ranked, "en");
    expect(hits.map((n) => n.id)).toEqual(["57", "01", "47"]);
    const sorted = orderNips(listings, state({ q: "zap", sort: "id" }), none, ranked, "en");
    expect(sorted.map((n) => n.id)).toEqual(["01", "47", "57"]);
    const filtered = orderNips(
      listings,
      state({ q: "zap", course: true }),
      new Set(["57"]),
      ranked,
      "en",
    );
    expect(filtered.map((n) => n.id)).toEqual(["57"]);
  });

  test("an empty ranking (no match) shows nothing", () => {
    expect(orderNips(listings, state({ q: "qqq" }), none, [], "en")).toEqual([]);
  });
});

describe("buildListings", () => {
  test("joins the light index with spec summaries, like listNips()", () => {
    const specs = Object.fromEntries(
      listings.map((n) => [n.id, { variant: n.variant, todo: n.todo }]),
    );
    expect(buildListings(NIP_INDEX.nips, specs)).toEqual(listings);
  });

  test("NIPs without a spec summary are skipped", () => {
    expect(buildListings(NIP_INDEX.nips, { "01": { variant: "event", todo: false } })).toEqual([
      { ...listing("01"), variant: "event", todo: false },
    ]);
  });
});

describe("courseNipIds", () => {
  test("keeps valid ids with at least one chapter", () => {
    const link = { nn: "09", title: "Zaps", href: "/en/learn/zaps/" };
    expect([...courseNipIds({ "57": [link], "01": [], nope: [link] })]).toEqual(["57"]);
  });
});

describe("highlighting", () => {
  test("marks every case-insensitive occurrence of a term", () => {
    expect(highlightSegments("Zap requests and zap receipts", ["zap"])).toEqual([
      { text: "Zap", match: true },
      { text: " requests and ", match: false },
      { text: "zap", match: true },
      { text: " receipts", match: false },
    ]);
  });

  test("longest term wins, 1-letter terms and regex characters are safe", () => {
    expect(
      highlightSegments("Private messages (DMs)", ["e", "message", "messages", "(dms)"]),
    ).toEqual([
      { text: "Private ", match: false },
      { text: "messages", match: true },
      { text: " ", match: false },
      { text: "(DMs)", match: true },
    ]);
  });

  test("no terms or no text", () => {
    expect(highlightSegments("Plain", [])).toEqual([{ text: "Plain", match: false }]);
    expect(highlightSegments("", ["x"])).toEqual([]);
  });

  test("queryWords strips shortcut prefixes and short words", () => {
    expect(queryWords("kind:9735 #imeta nip-57 a zap")).toEqual(["9735", "imeta", "57", "zap"]);
  });

  test("stop words (en + es) are never highlighted, inside other words either", () => {
    expect(queryWords("react to a note with the emoji")).toEqual(["react", "note", "emoji"]);
    expect(queryWords("borrar una nota de la Relé cómo")).toEqual(["borrar", "nota", "Relé"]);
    expect(
      highlightSegments("Delete with the relay", ["with", "the", "de", "la", "delete"]),
    ).toEqual([
      { text: "Delete", match: true },
      { text: " with the relay", match: false },
    ]);
    expect(highlightSegments("Relay lists", ["la", "de"])).toEqual([
      { text: "Relay lists", match: false },
    ]);
  });
});

describe("semanticMessage", () => {
  const t = getDictionary("en").nips.ui.search;
  test("one line per model state", () => {
    expect(semanticMessage("en", { status: "idle" })).toBe(t.semanticIdle);
    expect(semanticMessage("en", { status: "loading" })).toBe(t.semanticLoading);
    expect(semanticMessage("en", { status: "loading", progress: 0.426 })).toBe(
      "Loading the on-device search model… 43%",
    );
    expect(semanticMessage("en", { status: "ready" })).toBe(t.semanticReady);
    expect(semanticMessage("en", { status: "unavailable", reason: "offline" })).toBe(
      t.semanticOffline,
    );
    expect(semanticMessage("en", { status: "unavailable", reason: "save-data" })).toBe(
      t.semanticSaveData,
    );
    expect(semanticMessage("en", { status: "unavailable", reason: "unsupported" })).toBe(
      t.semanticUnavailable,
    );
    expect(semanticMessage("en", { status: "error", reason: "model-failed" })).toBe(
      t.semanticUnavailable,
    );
    expect(semanticMessage("es", { status: "ready" })).toBe(
      getDictionary("es").nips.ui.search.semanticReady,
    );
  });
});
