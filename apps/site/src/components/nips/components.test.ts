import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { getDictionary, plural } from "@nostrschool/i18n";
import { createHybridSearch, type NipSearchHit } from "@nostrschool/nip-search";
import { getNipStrings, type NipListing } from "@nostrschool/nips";
import { listNips } from "@nostrschool/nips/specs";
import { cleanup, fireEvent, render } from "@testing-library/svelte";
import type { CourseMap, SpecSummary } from "./browse.ts";
import Highlight from "./Highlight.svelte";
import NipBrowser from "./NipBrowser.svelte";
import NipResultCard from "./NipResultCard.svelte";

const listings = listNips();
const specs: Record<string, SpecSummary> = Object.fromEntries(
  listings.map((n) => [n.id, { variant: n.variant, todo: n.todo }]),
);
const course: CourseMap = {
  "57": [{ nn: "09", title: "Zaps", href: "/en/learn/zaps/" }],
  "01": [{ nn: "03", title: "Events", href: "/en/learn/events/" }],
};
const en = getDictionary("en").nips.ui;
const tick = (ms = 0) => new Promise((r) => setTimeout(r, ms));

const setUrl = (search: string) => history.replaceState(null, "", `/en/nips/${search}`);
const items = (root: HTMLElement) =>
  [...root.querySelectorAll<HTMLElement>("[data-testid^='nips-item-']")]
    .map((el) => el.dataset["testid"] ?? "")
    .filter((id) => /^nips-item-[0-9A-F]{2}$/.test(id))
    .map((id) => id.slice("nips-item-".length));

const mount = async (search = "") => {
  setUrl(search);
  const view = render(NipBrowser, { locale: "en", specs, course, semantic: false });
  await tick();
  return view;
};

const byTestId = <T extends HTMLElement>(root: HTMLElement, id: string): T => {
  const el = root.querySelector<T>(`[data-testid="${id}"]`);
  if (el === null) throw new Error(`no [data-testid="${id}"]`);
  return el;
};

beforeEach(() => setUrl(""));
afterEach(() => cleanup());

describe("NipBrowser", () => {
  test("lists every NIP by number once mounted, with enabled controls", async () => {
    const { container } = await mount();
    expect(items(container)).toEqual(listings.map((n) => n.id));
    expect(byTestId<HTMLInputElement>(container, "nips-search").disabled).toBe(false);
    expect(byTestId(container, "nips").dataset["ready"]).toBe("true");
    expect(byTestId(container, "nips-count").textContent).toContain(String(listings.length));
    // Semantic search is off here: the status line says keyword-only.
    expect(byTestId(container, "nips-semantic").textContent).toContain(
      en.search.semanticUnavailable,
    );
  });

  test("typing searches instantly, highlights terms and writes the query string", async () => {
    const { container } = await mount();
    const input = byTestId<HTMLInputElement>(container, "nips-search");
    await fireEvent.input(input, { target: { value: "zap" } });
    await tick();
    const ids = items(container);
    expect(ids[0]).toBe("57");
    expect(ids.length).toBeLessThan(listings.length);
    expect(
      byTestId(container, "nips-item-57").querySelector("mark")?.textContent?.toLowerCase(),
    ).toMatch(/^zap/);
    expect(byTestId(container, "nips-count").textContent).toBe(
      plural("en", ids.length, en.search.results),
    );
    expect(location.search).toBe("?q=zap");
    // "Best match" is offered (and chosen) only while searching.
    expect(byTestId<HTMLSelectElement>(container, "nips-sort").value).toBe("relevance");
  });

  test("a NIP number is pinned; clearing the search restores the full list", async () => {
    const { container } = await mount();
    await fireEvent.input(byTestId(container, "nips-search"), { target: { value: "44" } });
    await tick();
    expect(items(container)[0]).toBe("44");
    expect(byTestId(container, "nips-item-44-pinned").textContent).toBe(en.search.pinned);
    await fireEvent.click(byTestId(container, "nips-search-clear"));
    await tick();
    expect(items(container)).toHaveLength(listings.length);
    expect(location.search).toBe("");
  });

  test("filters narrow the list, show an active count and are deep-linked", async () => {
    const { container } = await mount();
    const toggle = byTestId(container, "nips-filters-toggle");
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    await fireEvent.click(toggle);
    expect(toggle.getAttribute("aria-expanded")).toBe("true");

    await fireEvent.click(byTestId(container, "nips-status-final"));
    await tick();
    const finals = listings.filter((n) => n.status === "final").map((n) => n.id);
    expect(items(container)).toEqual(finals);
    expect(location.search).toBe("?status=final");
    expect(toggle.textContent).toContain(plural("en", 1, en.filters.active));

    await fireEvent.click(byTestId(container, "nips-clear"));
    await tick();
    expect(items(container)).toHaveLength(listings.length);
    expect(location.search).toBe("");
  });

  test("course, kind and kind-type facets", async () => {
    const { container } = await mount();
    await fireEvent.click(byTestId(container, "nips-course"));
    await tick();
    expect(items(container)).toEqual(["01", "57"]);
    await fireEvent.click(byTestId(container, "nips-course"));

    await fireEvent.input(byTestId(container, "nips-kind"), { target: { value: "9735" } });
    await tick();
    expect(items(container)).toContain("57");
    expect(location.search).toBe("?kind=9735");
    // Non-numbers are ignored; an empty box clears the facet.
    await fireEvent.input(byTestId(container, "nips-kind"), { target: { value: "97x" } });
    await tick();
    expect(location.search).toBe("?kind=9735");
    await fireEvent.input(byTestId(container, "nips-kind"), { target: { value: "" } });
    await tick();
    expect(location.search).toBe("");

    await fireEvent.click(byTestId(container, "nips-category-ephemeral"));
    await tick();
    expect(items(container).length).toBeGreaterThan(0);
    expect(items(container).length).toBeLessThan(listings.length);
    expect(location.search).toBe("?type=ephemeral");
  });

  test("variant, editor and relay facets combine with AND", async () => {
    const { container } = await mount();
    await fireEvent.click(byTestId(container, "nips-variant-http"));
    await fireEvent.click(byTestId(container, "nips-editor"));
    await fireEvent.click(byTestId(container, "nips-relay"));
    await tick();
    const expected = listings
      .filter((n) => n.variant === "http" && !n.todo && n.relay)
      .map((n) => n.id);
    expect(items(container)).toEqual(expected);
    expect(location.search).toBe("?defines=http&relay=1&editor=1");
  });

  test("sort and layout switch, and come back from a shared link", async () => {
    const { container } = await mount("?sort=title&view=list&status=draft");
    expect(byTestId<HTMLSelectElement>(container, "nips-sort").value).toBe("title");
    expect(byTestId(container, "nips-list").dataset["view"]).toBe("list");
    expect(byTestId(container, "nips-view-list").getAttribute("aria-pressed")).toBe("true");
    // Filters in the link open the panel on phones.
    expect(byTestId(container, "nips-filters-toggle").getAttribute("aria-expanded")).toBe("true");
    const titles = items(container).map((id) => listings.find((n) => n.id === id)?.title ?? "");
    expect(titles).toEqual([...titles].sort((a, b) => a.localeCompare(b, "en")));

    await fireEvent.click(byTestId(container, "nips-view-grid"));
    const select = byTestId<HTMLSelectElement>(container, "nips-sort");
    select.value = "updated";
    await fireEvent.change(select);
    await tick();
    expect(location.search).toBe("?status=draft&sort=updated");
    // An unknown option value is ignored.
    const bogus = document.createElement("option");
    bogus.value = "sideways";
    select.append(bogus);
    select.value = "sideways";
    await fireEvent.change(select);
    await tick();
    expect(location.search).toBe("?status=draft&sort=updated");
  });

  test("a shared query shows keyword results at once", async () => {
    const { container } = await mount("?q=relay%20information");
    expect(byTestId<HTMLInputElement>(container, "nips-search").value).toBe("relay information");
    expect(items(container)[0]).toBe("11");
  });

  test("no match: empty state with both ways out", async () => {
    const { container } = await mount("?q=xqzvbnm&editor=1");
    const empty = byTestId(container, "nips-empty");
    expect(empty.textContent).toContain("xqzvbnm");
    const buttons = [...empty.querySelectorAll("button")];
    expect(buttons.map((b) => b.textContent?.trim())).toEqual([en.search.clear, en.filters.clear]);
    await fireEvent.click(buttons[1] as HTMLButtonElement);
    await tick();
    await fireEvent.click(byTestId(container, "nips-empty").querySelector("button") as HTMLElement);
    await tick();
    expect(items(container)).toHaveLength(listings.length);
  });

  test("filters alone can empty the list too", async () => {
    const { container } = await mount("?status=final&type=ephemeral&kind=1");
    expect(byTestId(container, "nips-empty").textContent).toContain(en.empty.title);
  });

  test("with meaning search on but the model unavailable, typing still answers (keyword fallback)", async () => {
    setUrl("");
    const { container } = render(NipBrowser, {
      locale: "en",
      specs,
      course,
      semantic: true,
      // A real engine whose semantic side reports "offline" (what the browser build does when
      // navigator.onLine is false), so the hybrid path runs end to end without a model.
      createSearch: (l: readonly NipListing[]) =>
        createHybridSearch({ listings: l, semantic: { status: "unavailable", reason: "offline" } }),
    });
    await tick();
    expect(byTestId(container, "nips-semantic").textContent).toContain(en.search.semanticOffline);
    const input = byTestId(container, "nips-search");
    await fireEvent.input(input, { target: { value: "zap" } });
    // A second keystroke inside the debounce replaces the first search.
    await fireEvent.input(input, { target: { value: "zaps" } });
    expect(byTestId(container, "nips-list").dataset["pending"]).toBe("true");
    await tick(400);
    expect(byTestId(container, "nips-list").dataset["pending"]).toBe("false");
    expect(items(container)[0]).toBe("57");
  });

  test("Spanish page: typing the Spanish card title finds that NIP first", async () => {
    setUrl("");
    const { container } = render(NipBrowser, { locale: "es", specs, course, semantic: false });
    await tick();
    const input = byTestId(container, "nips-search");
    for (const [id, title] of [
      ["88", "Encuestas"],
      ["36", "Contenido sensible"],
    ] as const) {
      expect(getNipStrings("es", id)?.title).toBe(title);
      await fireEvent.input(input, { target: { value: title } });
      expect(items(container)[0]).toBe(id);
    }
    // English wording still works on the Spanish page.
    await fireEvent.input(input, { target: { value: "polls" } });
    expect(items(container)[0]).toBe("88");
  });

  test("the in-field clear button empties the query and keeps focus in the box", async () => {
    const { container } = await mount("?q=zaps");
    const input = byTestId<HTMLInputElement>(container, "nips-search");
    expect(input.value).toBe("zaps");
    const clear = byTestId(container, "nips-search-clear");
    expect(clear.getAttribute("aria-label")).toBe(en.search.clear);
    await fireEvent.click(clear);
    expect(input.value).toBe("");
    expect(document.activeElement).toBe(input);
    expect(container.querySelector("[data-testid='nips-search-clear']")).toBeNull();
  });

  test("Spanish UI", async () => {
    setUrl("");
    const { container } = render(NipBrowser, { locale: "es", specs, course, semantic: false });
    await tick();
    const es = getDictionary("es").nips.ui;
    expect(container.textContent).toContain(es.search.label);
    expect(container.textContent).toContain(es.statuses.draft);
  });
});

describe("NipResultCard", () => {
  const nip57 = listings.find((n) => n.id === "57");
  if (nip57 === undefined) throw new Error("NIP-57 missing");
  const hit = (snippet?: NipSearchHit["snippet"]): NipSearchHit => ({
    id: "57",
    score: 1,
    pinned: false,
    terms: ["zap"],
    ...(snippet === undefined ? {} : { snippet }),
  });

  test("shows id, status, variant, kinds, and the editor/course flags", () => {
    const { container } = render(NipResultCard, {
      locale: "en",
      nip: { ...nip57, todo: false },
      href: "/en/nips/57/",
      terms: [],
      inCourse: true,
      testid: "card",
    });
    expect(container.textContent).toContain("NIP-57");
    expect(container.textContent).toContain(en.statuses[nip57.status]);
    expect(byTestId(container, "card-editor").textContent).toBe(en.card.editor);
    expect(byTestId(container, "card-course").textContent).toBe(en.card.course);
    expect(byTestId<HTMLAnchorElement>(container, "card-link").getAttribute("href")).toBe(
      "/en/nips/57/",
    );
  });

  test("a matched passage replaces the summary and names its section", () => {
    const { container } = render(NipResultCard, {
      locale: "en",
      nip: {
        ...nip57,
        todo: true,
        kinds: [
          ...nip57.kinds,
          { kind: 1, description: "a" },
          { kind: 2, description: "b" },
          { kind: 3, description: "c" },
          { kind: 4, description: "d" },
        ],
      },
      href: "/en/nips/57/",
      hit: hit({ sectionId: "appendix-e", heading: "Appendix E", text: "split zap amounts" }),
      terms: ["zap"],
      inCourse: false,
      testid: "card",
    });
    expect(byTestId(container, "card-snippet").textContent).toContain("Appendix E");
    expect(container.querySelector(".summary")?.textContent).toContain("split zap amounts");
    expect(container.querySelector("[data-testid='card-editor']")).toBeNull();
    expect(container.textContent).toMatch(/\+\d+/);
  });

  test("heading-only matches keep the summary; intro passages are not repeated", () => {
    const heading = render(NipResultCard, {
      locale: "en",
      nip: nip57,
      href: "/x/",
      hit: hit({ sectionId: "zap-receipt", heading: "Zap Receipt", text: "" }),
      terms: ["zap"],
      inCourse: false,
      testid: "a",
    });
    expect(byTestId(heading.container, "a-snippet").textContent).toContain("Zap Receipt");
    expect(heading.container.querySelector(".summary")?.textContent?.length).toBeGreaterThan(0);
    cleanup();
    const intro = render(NipResultCard, {
      locale: "en",
      nip: { ...nip57, kinds: [], relay: false, todo: true },
      href: "/x/",
      hit: { ...hit({ sectionId: "intro", heading: "Lightning Zaps", text: "x" }), pinned: true },
      terms: [],
      inCourse: false,
      testid: "b",
    });
    expect(intro.container.querySelector("[data-testid='b-snippet']")).toBeNull();
    expect(byTestId(intro.container, "b-pinned").textContent).toBe(en.search.pinned);
    expect(intro.container.querySelector(".facts")).toBeNull();
  });
});

describe("Highlight", () => {
  test("wraps matches in <mark>", () => {
    const { container } = render(Highlight, { text: "Zap the zapper", terms: ["zap"] });
    expect([...container.querySelectorAll("mark")].map((m) => m.textContent)).toEqual([
      "Zap",
      "zap",
    ]);
    expect(container.textContent).toBe("Zap the zapper");
  });

  test("marks only meaningful terms, never stop words", () => {
    const { container } = render(Highlight, {
      text: "Zap with the relay de la red",
      terms: ["with", "the", "de", "la", "zap", "relay"],
    });
    expect([...container.querySelectorAll("mark")].map((m) => m.textContent)).toEqual([
      "Zap",
      "relay",
    ]);
  });
});
