import { afterEach, beforeEach, expect, test } from "bun:test";
import { $liveMode } from "@nostrschool/data";
import { mascotBus } from "@nostrschool/ui/bus.ts";
import { cleanup, fireEvent, render } from "@testing-library/svelte";
import { tick } from "svelte";
import ChapterComplete from "./ChapterComplete.svelte";
import ChapterGrid from "./ChapterGrid.svelte";
import ChapterRail from "./ChapterRail.svelte";
import ContinueLink from "./ContinueLink.svelte";
import CourseMap from "./CourseMap.svelte";
import HeroNetwork from "./HeroNetwork.svelte";
import LiveToggle from "./LiveToggle.svelte";
import { chapterLinks } from "./lib/links.ts";
import { PROGRESS_STORAGE_KEY, progress } from "./lib/progress.ts";
import { THEME_STORAGE_KEY } from "./lib/theme.ts";
import ReadingProgress from "./ReadingProgress.svelte";
import ThemeToggle from "./ThemeToggle.svelte";

const chapters = chapterLinks("en");

const resetProgress = () => {
  localStorage.removeItem(PROGRESS_STORAGE_KEY);
  progress.reload();
};

beforeEach(() => {
  localStorage.clear();
  resetProgress();
  $liveMode.set(false);
  delete document.documentElement.dataset["theme"];
});
afterEach(cleanup);

test("ThemeToggle reads the stored theme, then applies and persists a new choice", async () => {
  localStorage.setItem(THEME_STORAGE_KEY, "dark");
  const { getByTestId } = render(ThemeToggle, { props: { locale: "en" } });
  await tick();
  expect(getByTestId("theme-toggle").dataset["pref"]).toBe("dark");
  expect((getByTestId("theme-dark-input") as HTMLInputElement).checked).toBe(true);

  await fireEvent.click(getByTestId("theme-light-input"));
  expect(document.documentElement.dataset["theme"]).toBe("light");
  expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");

  await fireEvent.click(getByTestId("theme-system-input"));
  expect(document.documentElement.dataset["theme"]).toBeUndefined();
  expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
});

test("ThemeToggle uses an injected storage and root", async () => {
  const root = document.createElement("div");
  const { getByTestId } = render(ThemeToggle, {
    props: { locale: "en", storage: sessionStorage, root },
  });
  await fireEvent.click(getByTestId("theme-dark-input"));
  expect(root.dataset["theme"]).toBe("dark");
  expect(sessionStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
  sessionStorage.clear();
});

test("LiveToggle flips $liveMode, shows the LIVE badge and tells the mascot", async () => {
  const events: string[] = [];
  const off = mascotBus.onAny((e) => events.push(e.type));
  const { getByTestId, queryByTestId } = render(LiveToggle, { props: { locale: "en" } });
  await tick();
  expect(queryByTestId("live-badge")).toBeNull();

  await fireEvent.click(getByTestId("live-toggle"));
  expect($liveMode.get()).toBe(true);
  expect(getByTestId("live-toggle").getAttribute("aria-pressed")).toBe("true");
  expect(getByTestId("live-badge").textContent).toContain("LIVE");
  expect(document.documentElement.dataset["live"]).toBe("on");
  expect(getByTestId("live-announcement").textContent).toContain("Live mode on");

  await fireEvent.click(getByTestId("live-toggle"));
  off();
  expect($liveMode.get()).toBe(false);
  expect(queryByTestId("live-badge")).toBeNull();
  expect(events).toEqual(["live:on", "live:off"]);
});

test("ChapterRail marks the current chapter and shows completed checkmarks", async () => {
  progress.setCompleted("why-nostr", true);
  const { getByTestId } = render(ChapterRail, {
    props: { locale: "en", chapters, current: "keys" },
  });
  await tick();
  expect(getByTestId("chapter-rail-02").getAttribute("aria-current")).toBe("page");
  expect(getByTestId("chapter-rail-01").dataset["done"]).toBe("true");
  expect(getByTestId("chapter-rail-03").dataset["done"]).toBe("false");
  expect(getByTestId("chapter-rail-count").textContent).toBe("1 of 12 chapters complete");

  const toggle = getByTestId("chapter-rail-toggle");
  expect(toggle.getAttribute("aria-expanded")).toBe("false");
  expect(toggle.getAttribute("aria-controls")).toBe(getByTestId("chapter-rail-sheet").id);
  await fireEvent.click(toggle);
  expect(toggle.getAttribute("aria-expanded")).toBe("true");
  expect(getByTestId("chapter-rail").dataset["open"]).toBe("true");
  await fireEvent.click(toggle);
  expect(getByTestId("chapter-rail").dataset["open"]).toBe("false");
});

test("ChapterRail's bottom sheet closes on Escape, Close and outside taps, refocusing the toggle", async () => {
  const { getByTestId } = render(ChapterRail, {
    props: { locale: "en", chapters, current: "keys" },
  });
  const rail = getByTestId("chapter-rail");
  const toggle = getByTestId("chapter-rail-toggle");
  const open = async () => {
    await fireEvent.click(toggle);
    await tick();
    expect(rail.dataset["open"]).toBe("true");
  };

  await open();
  expect(document.activeElement).toBe(getByTestId("chapter-rail-close"));
  await fireEvent.keyDown(document, { key: "Enter" });
  expect(rail.dataset["open"]).toBe("true");
  await fireEvent.keyDown(document, { key: "Escape" });
  expect(rail.dataset["open"]).toBe("false");
  expect(document.activeElement).toBe(toggle);

  await open();
  await fireEvent.click(getByTestId("chapter-rail-close"));
  expect(rail.dataset["open"]).toBe("false");

  await open();
  // A tap inside the sheet keeps it open; one on the scrim (outside the sheet) closes it.
  await fireEvent.click(getByTestId("chapter-rail-02"));
  expect(rail.dataset["open"]).toBe("true");
  await fireEvent.click(getByTestId("chapter-rail-scrim"));
  expect(rail.dataset["open"]).toBe("false");
});

test("ChapterComplete persists completion, celebrates, and can be undone", async () => {
  const events: { type: string; payload: unknown }[] = [];
  const off = mascotBus.onAny((e) => events.push(e));
  const { getByTestId, queryByTestId } = render(ChapterComplete, {
    props: { locale: "en", slug: "keys", order: 2 },
  });
  const button = getByTestId("chapter-complete");
  expect(button.getAttribute("aria-pressed")).toBe("false");

  await fireEvent.click(button);
  expect(button.getAttribute("aria-pressed")).toBe("true");
  expect(localStorage.getItem(PROGRESS_STORAGE_KEY)).toBe('["keys"]');
  expect(getByTestId("chapter-complete-status").textContent).toContain("Chapter complete");
  expect(events).toEqual([{ type: "chapter:complete", payload: { chapter: 2 } }]);

  await fireEvent.click(getByTestId("chapter-complete-undo"));
  off();
  expect(localStorage.getItem(PROGRESS_STORAGE_KEY)).toBe("[]");
  expect(queryByTestId("chapter-complete-undo")).toBeNull();
  expect(events).toHaveLength(1);
});

test("CourseMap shows done / current / upcoming stops linking to chapters", async () => {
  progress.setCompleted("why-nostr", true);
  const { getByTestId } = render(CourseMap, { props: { locale: "en", chapters } });
  await tick();
  expect(getByTestId("course-map-01").dataset["status"]).toBe("done");
  expect(getByTestId("course-map-02").dataset["status"]).toBe("current");
  expect(getByTestId("course-map-12").dataset["status"]).toBe("upcoming");
  expect(getByTestId("course-map-02").getAttribute("href")).toBe("/en/learn/keys/");
  // Notebook index: every entry shows its number (or a tick when done), title and summary.
  expect(getByTestId("course-map-03").textContent).toContain("03");
  expect(getByTestId("course-map-03").textContent).toContain(chapters[2]?.summary ?? "missing");
  expect(getByTestId("course-map-01").querySelector("svg")).not.toBeNull();
});

test("ChapterGrid counts progress and congratulates when everything is done", async () => {
  const { getByTestId } = render(ChapterGrid, { props: { locale: "en", chapters } });
  await tick();
  expect(getByTestId("chapter-grid-count").textContent?.trim()).toBe("0 of 12 chapters complete");
  expect(getByTestId("chapter-link-01").dataset["status"]).toBe("current");
  for (const c of chapters) progress.setCompleted(c.slug, true);
  await tick();
  expect(getByTestId("chapter-grid-count").textContent?.trim()).toBe(
    "You finished the whole course!",
  );
});

test("ContinueLink starts at chapter 1, then resumes at the next unfinished chapter", async () => {
  const { getByTestId } = render(ContinueLink, { props: { locale: "en", chapters } });
  await tick();
  const link = getByTestId("home-start");
  expect(link.getAttribute("href")).toBe("/en/learn/why-nostr/");
  expect(link.textContent).toContain("Start learning");
  progress.setCompleted("why-nostr", true);
  await tick();
  expect(link.getAttribute("href")).toBe("/en/learn/keys/");
  expect(link.textContent).toContain("Continue: ");
});

test("ContinueLink renders nothing without chapters", () => {
  const { queryByTestId } = render(ContinueLink, {
    props: { locale: "en", chapters: [], testid: "x" },
  });
  expect(queryByTestId("x")).toBeNull();
});

test("ReadingProgress exposes a labelled progressbar and updates on scroll", async () => {
  const { getByTestId } = render(ReadingProgress, { props: { locale: "en" } });
  await tick();
  const bar = getByTestId("reading-progress");
  expect(bar.getAttribute("role")).toBe("progressbar");
  expect(bar.getAttribute("aria-label")).toBe("Reading progress");
  // happy-dom has no layout, so the page "fits" in the viewport and counts as fully read.
  expect(bar.getAttribute("aria-valuenow")).toBe("100");
  window.dispatchEvent(new Event("scroll"));
  window.dispatchEvent(new Event("resize"));
  await new Promise((resolve) => requestAnimationFrame(resolve));
  expect(bar.getAttribute("aria-valuenow")).toBe("100");
});

test("HeroNetwork is a labelled image whose animation can be paused", async () => {
  const { getByTestId, container } = render(HeroNetwork, { props: { locale: "en" } });
  await tick();
  const svg = container.querySelector("svg[role='img']");
  expect(svg?.getAttribute("aria-labelledby")).toBe("hero-network-title hero-network-desc");
  expect(container.querySelectorAll(".packet").length).toBeGreaterThan(0);
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  const pause = getByTestId("hero-network-pause");
  expect(getByTestId("hero-network").dataset["animating"]).toBe("true");
  await fireEvent.click(pause);
  expect(pause.getAttribute("aria-pressed")).toBe("true");
  expect(pause.textContent?.trim()).toBe("Play animation");
  expect(getByTestId("hero-network").dataset["animating"]).toBe("false");
});

test("home hero: Nos and the bubble sit beside the diagram sheet, never on it (>= sm)", async () => {
  // No layout engine here (Playwright owns pixels), so guard the hero CSS contract in the source:
  // the mascot is never absolutely positioned over the sheet, and from sm up it is a md-sized row.
  const page = await Bun.file(`${import.meta.dir}/../../pages/[locale]/index.astro`).text();
  const css = page.slice(page.indexOf("<style>"));
  expect(css).not.toMatch(/\.hero-mascot \{[^}]*position: absolute/);
  const desktop = css.slice(css.indexOf("@media (min-width: 480px)"));
  expect(desktop).toMatch(/\.hero-mascot \{[^}]*--mascot-size-override: var\(--size-mascot-md\)/);
  expect(desktop).toMatch(/:global\(\.mascot-container\) \{[^}]*flex-direction: row-reverse/);
});
