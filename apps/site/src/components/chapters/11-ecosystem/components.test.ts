import { afterEach, describe, expect, test } from "bun:test";
import { format, getDictionary } from "@nostrschool/i18n";
import { type MascotEventType, onAny } from "@nostrschool/ui";
import { cleanup, fireEvent, render } from "@testing-library/svelte";
import ChapterQuiz from "./ChapterQuiz.svelte";
import ClientFinder from "./ClientFinder.svelte";
import DataAsOf from "./DataAsOf.svelte";
import { ECOSYSTEM } from "./data.ts";
import EcosystemExplorer from "./EcosystemExplorer.svelte";
import GrowthRewind from "./GrowthRewind.svelte";
import NipAdoption from "./NipAdoption.svelte";
import type { Ecosystem } from "./schema.ts";

const t = getDictionary("en").chapters.ch11;
const tick = (ms = 0) => new Promise((r) => setTimeout(r, ms));
const waitFor = async (check: () => boolean, timeoutMs = 3000) => {
  const start = Date.now();
  while (!check()) {
    if (Date.now() - start > timeoutMs) throw new Error("timed out");
    await tick(10);
  }
};
if (!ECOSYSTEM.ok) throw new Error(`committed snapshot invalid: ${ECOSYSTEM.error.message}`);
const eco: Ecosystem = ECOSYSTEM.value;

afterEach(() => cleanup());

describe("DataAsOf", () => {
  test("shows the capture date and every source with its status", () => {
    const { getByTestId } = render(DataAsOf, {
      props: { locale: "en", capturedAt: "2026-10-03T13:00:00.000Z", sources: eco.sources },
    });
    expect(getByTestId("ch11-data-as-of-badge").textContent).toContain("October 3, 2026");
    expect(getByTestId("ch11-data-as-of-sources").children).toHaveLength(eco.sources.length);
    for (const s of eco.sources) {
      expect(getByTestId(`ch11-data-as-of-source-${s.id}`).textContent).toContain(s.name);
      expect(getByTestId(`ch11-data-as-of-link-${s.id}`).getAttribute("href")).toBe(s.url);
      expect(getByTestId(`ch11-data-as-of-status-${s.id}`).textContent?.trim()).toBe(
        t.dataAsOf.status[s.status],
      );
    }
  });
  test("notes are rendered from localized templates, not stored prose", () => {
    const { getByTestId } = render(DataAsOf, {
      props: { locale: "es", capturedAt: eco.capturedAt, sources: eco.sources },
    });
    const es = getDictionary("es").chapters.ch11.dataAsOf;
    expect(getByTestId("ch11-data-as-of-note-nips-repo").textContent).toBe(es.notes.githubHead);
    expect(getByTestId("ch11-data-as-of-note-clients").textContent).toBe(es.notes.curated);
    expect(getByTestId("ch11-data-as-of-note-nip66").textContent).toContain("últimas 24 h");
  });
  test("partial monitors show a short localized notice, never the raw error", () => {
    const sources: Ecosystem["sources"] = [
      {
        id: "nip66",
        name: "n",
        url: "https://n",
        retrievedAt: eco.capturedAt,
        status: "ok",
        lastError: null,
        detail: {
          kind: "nip66",
          monitorRelays: ["wss://a", "wss://b"],
          windowHours: 24,
          partial: [{ relay: "wss://a", reason: "timed out before EOSE" }],
        },
      },
    ];
    const { getByTestId, container } = render(DataAsOf, {
      props: { locale: "en", capturedAt: eco.capturedAt, sources },
    });
    expect(getByTestId("ch11-data-as-of-note-nip66").textContent).toBe(
      format(t.dataAsOf.notes.nip66, { relays: "wss://a, wss://b", hours: 24 }),
    );
    expect(getByTestId("ch11-data-as-of-partial-nip66").textContent?.trim()).toBe(
      format(t.dataAsOf.partial, { relays: "wss://a" }),
    );
    expect(container.textContent).not.toContain("timed out");
  });
  test("stale sources get a warning badge", () => {
    const stale = [{ ...eco.sources[0], status: "stale" as const }] as Ecosystem["sources"];
    const { getByTestId } = render(DataAsOf, {
      props: { locale: "en", capturedAt: eco.capturedAt, sources: stale, testid: "x" },
    });
    expect(getByTestId("x-status-nip66").dataset["tone"]).toBe("warning");
    expect(getByTestId("x-stale-nip66").textContent).toBe(t.dataAsOf.stale);
  });
});

describe("NipAdoption", () => {
  const support = [
    { id: "01", label: "NIP-01", value: 90 },
    { id: "42", label: "NIP-42", value: 45 },
    { id: "ZZ", label: "NIP-ZZ", value: 0 },
  ];
  test("starts on the most-supported NIP and updates the meter on pick", async () => {
    const { getByTestId } = render(NipAdoption, { props: { locale: "en", support, total: 100 } });
    expect((getByTestId("ch11-nip-01") as HTMLInputElement).checked).toBe(true);
    expect(getByTestId("ch11-nip-meter-value").textContent).toContain("90 of 100 relays (90%)");
    await fireEvent.change(getByTestId("ch11-nip-42"));
    expect(getByTestId("ch11-nip-meter").getAttribute("value")).toBe("45");
    expect(getByTestId("ch11-nip-blurb").textContent).toContain(t.nips.blurbs["42"]);
    expect(getByTestId("ch11-nip-link").getAttribute("href")).toContain("/42.md");
    await fireEvent.change(getByTestId("ch11-nip-ZZ"));
    expect(getByTestId("ch11-nip-blurb").textContent).toContain(t.nips.blurbs.fallback);
  });
  test("an empty list renders the chart without a meter", () => {
    const { queryByTestId } = render(NipAdoption, {
      props: { locale: "en", support: [], total: 0, source: "s" },
    });
    expect(queryByTestId("ch11-nip-meter")).toBeNull();
    expect(queryByTestId("ch11-chart-nips")).not.toBeNull();
  });
});

describe("GrowthRewind", () => {
  const growth = [
    { date: "2022-06-30", count: 2 },
    { date: "2023-06-30", count: 5 },
  ];
  test("starts at today and rewinds with the slider", async () => {
    const { getByTestId } = render(GrowthRewind, { props: { locale: "en", growth, source: "s" } });
    const slider = getByTestId("ch11-growth-slider") as HTMLInputElement;
    expect(slider.value).toBe("1");
    expect(getByTestId("ch11-growth-readout").textContent).toContain("5 NIPs");
    slider.value = "0";
    await fireEvent.input(slider);
    expect(getByTestId("ch11-growth-readout").textContent).toContain("By Jun 30, 2022: 2 NIPs");
    expect(slider.getAttribute("aria-valuetext")).toContain("2 NIPs");
  });
  test("no history → chart only", () => {
    const { queryByTestId } = render(GrowthRewind, { props: { locale: "en", growth: [] } });
    expect(queryByTestId("ch11-growth-slider")).toBeNull();
  });
});

describe("ClientFinder", () => {
  test("filters by platform (OR) and focus, announces counts, resets", async () => {
    const { getByTestId, queryByTestId } = render(ClientFinder, {
      props: { locale: "en", clients: eco.clients.items },
    });
    const count = () => getByTestId("ch11-client-count").textContent ?? "";
    const total = eco.clients.items.length;
    expect(count()).toContain(`${total} clients match`);
    expect(queryByTestId("ch11-clients-reset")).toBeNull();

    await fireEvent.click(getByTestId("ch11-platform-android"));
    expect(getByTestId("ch11-platform-android").getAttribute("aria-pressed")).toBe("true");
    const android = eco.clients.items.filter((c) => c.platforms.includes("android"));
    await waitFor(() => count().includes(`${android.length} clients`));
    expect(getByTestId("ch11-client-amethyst-android").dataset["tone"]).toBe("primary");

    await fireEvent.click(getByTestId("ch11-focus-apps"));
    await waitFor(() => count() === "1 client matches.");
    expect(getByTestId("ch11-client-zapstore")).not.toBeNull();

    await fireEvent.click(getByTestId("ch11-platform-android"));
    await fireEvent.click(getByTestId("ch11-platform-desktop"));
    await waitFor(() => count() === t.clients.results.zero);

    await fireEvent.click(getByTestId("ch11-clients-reset"));
    await waitFor(() => count().includes(`${total} clients`));
    expect(getByTestId("ch11-focus-all").getAttribute("aria-pressed")).toBe("true");
    expect(getByTestId("ch11-chart-clients")).not.toBeNull();
  });
  test("links open the client's site with a descriptive label", () => {
    const { getByTestId } = render(ClientFinder, {
      props: { locale: "en", clients: eco.clients.items, source: "s" },
    });
    const link = getByTestId("ch11-client-link-damus");
    expect(link.getAttribute("href")).toBe("https://damus.io");
    expect(link.getAttribute("aria-label")).toBe(format(t.clients.visit, { name: "Damus" }));
  });
});

describe("EcosystemExplorer", () => {
  test("renders stats from the committed snapshot, counting up to the real values", async () => {
    const { getByTestId } = render(EcosystemExplorer, { props: { locale: "en" } });
    const value = (id: string) => getByTestId(`ch11-stat-${id}-value`).textContent ?? "";
    const n = (x: number) => new Intl.NumberFormat("en-US").format(x);
    await waitFor(() => value("relays") === n(eco.relays.online));
    expect(value("nips")).toBe(n(eco.nips.total));
    expect(value("kinds")).toBe(n(eco.nips.kinds));
    expect(value("clients")).toBe(n(eco.clients.items.length));
    expect(getByTestId("ch11-data-as-of")).not.toBeNull();
    expect(getByTestId("ch11-chart-software")).not.toBeNull();
    expect(getByTestId("ch11-paid-fact").textContent).toContain(n(eco.relays.paid));
  });

  test("touring every view narrates each one and celebrates exactly once", async () => {
    const seen: MascotEventType[] = [];
    const off = onAny((e) => seen.push(e.type));
    const { getByTestId } = render(EcosystemExplorer, { props: { locale: "en", data: eco } });
    const narration = () => getByTestId("ch11-narration").textContent ?? "";
    expect(getByTestId("ch11-tour-text").textContent).toBe(
      format(t.explorer.tour, { done: 1, total: 4 }),
    );

    await fireEvent.click(getByTestId("ch11-tabs-tab-nips"));
    expect(narration()).toContain("NIPs view");
    expect(getByTestId("ch11-nip-meter-card")).not.toBeNull();
    await fireEvent.click(getByTestId("ch11-tabs-tab-growth"));
    expect(narration()).toContain("Growth view");
    expect(getByTestId("ch11-growth-slider")).not.toBeNull();
    expect(seen).not.toContain("celebrate");

    await fireEvent.click(getByTestId("ch11-tabs-tab-clients"));
    expect(narration()).toContain(t.explorer.tourDone);
    expect(getByTestId("ch11-tour").dataset["complete"]).toBe("true");
    expect(seen.filter((s) => s === "celebrate")).toHaveLength(1);

    await fireEvent.click(getByTestId("ch11-tabs-tab-relays"));
    expect(narration()).toContain("Relays view");
    await fireEvent.click(getByTestId("ch11-tabs-tab-clients"));
    expect(seen.filter((s) => s === "celebrate")).toHaveLength(1);
    off();
  });

  test("narration falls back gracefully on sparse data", async () => {
    const sparse: Ecosystem = {
      ...eco,
      relays: {
        ...eco.relays,
        software: [{ id: "other", label: "other", value: 1 }],
        nipSupport: [],
      },
      nips: { ...eco.nips, growth: [] },
    };
    const { getByTestId } = render(EcosystemExplorer, { props: { locale: "en", data: sparse } });
    await fireEvent.click(getByTestId("ch11-tabs-tab-nips"));
    expect(getByTestId("ch11-narration").textContent).toContain("top relay feature is .");
    await fireEvent.click(getByTestId("ch11-tabs-tab-growth"));
    expect(getByTestId("ch11-narration").textContent).toContain("from 0 to 0");
    await fireEvent.click(getByTestId("ch11-tabs-tab-relays"));
    expect(getByTestId("ch11-narration").textContent).toContain(t.relays.unknown);
  });
});

describe("ChapterQuiz", () => {
  test("three questions; the right answers emit quiz:correct", async () => {
    const seen: MascotEventType[] = [];
    const off = onAny((e) => seen.push(e.type));
    const { getByTestId } = render(ChapterQuiz, { props: { locale: "en" } });
    for (const [q, right] of [
      ["q1", "b"],
      ["q2", "c"],
      ["q3", "a"],
    ] as const) {
      expect(getByTestId(`ch11-quiz-${q}`).textContent).toContain(t.quiz[q].question);
      await fireEvent.click(getByTestId(`ch11-quiz-${q}-option-${right}`));
      await fireEvent.click(getByTestId(`ch11-quiz-${q}-check`));
    }
    expect(seen.filter((s) => s === "quiz:correct")).toHaveLength(3);
    off();
  });
});
