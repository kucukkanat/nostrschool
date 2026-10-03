import { afterAll, afterEach, beforeAll, describe, expect, test } from "bun:test";
import { getDictionary } from "@nostrschool/i18n";
import { mascotBus } from "@nostrschool/ui";
import { cleanup, fireEvent, render } from "@testing-library/svelte";
import KindClassifier from "./KindClassifier.svelte";
import KindDetail from "./KindDetail.svelte";
import KindsReference from "./KindsReference.svelte";
import KindsTable from "./KindsTable.svelte";
import { localizeKinds } from "./kinds-logic.ts";
import StorageSimulator from "./StorageSimulator.svelte";

const tick = (ms = 0) => new Promise((r) => setTimeout(r, ms));

interface HappyDomWindow {
  readonly happyDOM: {
    readonly settings: { device: { prefersReducedMotion: string } };
    setViewport(viewport: { width: number; height: number }): void;
  };
}
const happyDOM = (globalThis.window as unknown as HappyDomWindow).happyDOM;
const device = happyDOM.settings.device;

/** Runs `fn` on a phone-sized viewport, where the detail panel stacks below the list. */
const onPhone = async (fn: () => Promise<void>) => {
  const { innerWidth: width, innerHeight: height } = globalThis.window;
  happyDOM.setViewport({ width: 375, height: 812 });
  try {
    await fn();
  } finally {
    happyDOM.setViewport({ width, height });
  }
};

// happy-dom cancels in-flight Web Animations on unmount and rejects their promises; under reduced
// motion every transition has duration 0, which is also the path we must keep lossless.
beforeAll(() => {
  device.prefersReducedMotion = "reduce";
});
afterAll(() => {
  device.prefersReducedMotion = "no-preference";
});
afterEach(() => cleanup());

const celebrations = () => {
  const reasons: string[] = [];
  const off = mascotBus.on("celebrate", (p) => reasons.push(p.reason ?? ""));
  return { reasons, off };
};

describe("KindsTable", () => {
  test("renders all four category groups with kind 1 selected", () => {
    const { getByTestId } = render(KindsTable, { props: { locale: "en" } });
    for (const c of ["regular", "replaceable", "ephemeral", "addressable"])
      expect(getByTestId(`ch06-table-group-${c}`)).toBeTruthy();
    expect(getByTestId("ch06-table-tile-1").getAttribute("aria-pressed")).toBe("true");
    expect(getByTestId("ch06-table-detail-name").textContent).toContain("Short text note");
    expect(getByTestId("ch06-table-detail-source").dataset["source"]).toBe("fixture");
    expect(getByTestId("ch06-table-detail-nip").getAttribute("href")).toContain("/10.md");
  });

  test("selecting tiles narrates and celebrates once all categories are explored", async () => {
    const { reasons, off } = celebrations();
    const { getByTestId } = render(KindsTable, { props: { locale: "en" } });
    await fireEvent.click(getByTestId("ch06-table-tile-0"));
    expect(getByTestId("ch06-table-narration").textContent).toContain("User metadata");
    await fireEvent.click(getByTestId("ch06-table-tile-22242"));
    expect(reasons).toEqual([]);
    await fireEvent.click(getByTestId("ch06-table-tile-30023"));
    expect(reasons).toEqual(["ch06-all-categories"]);
    expect(getByTestId("ch06-table-explored").dataset["count"]).toBe("4");
    expect(getByTestId("ch06-table-narration").textContent).toContain("master");
    await fireEvent.click(getByTestId("ch06-table-tile-30023"));
    expect(reasons).toHaveLength(1);
    off();
  });

  test("filters by chip and search; shows the empty state", async () => {
    const { getByTestId, queryByTestId } = render(KindsTable, { props: { locale: "en" } });
    await fireEvent.click(getByTestId("ch06-table-filters-chip-regular"));
    await tick(10);
    expect(queryByTestId("ch06-table-group-regular")).toBeNull();
    await fireEvent.click(getByTestId("ch06-table-filters-all"));
    const search = getByTestId("ch06-table-filters-search") as HTMLInputElement;
    await fireEvent.input(search, { target: { value: "zap" } });
    await tick(10);
    expect(getByTestId("ch06-table-filters-count").textContent).toContain("3 kinds shown");
    await fireEvent.input(search, { target: { value: "nothing-matches-this" } });
    await tick(10);
    expect(getByTestId("ch06-table-empty")).toBeTruthy();
  });

  test("arrow keys move a roving tab stop between tiles", async () => {
    const { getByTestId } = render(KindsTable, { props: { locale: "en", initialKind: null } });
    const first = getByTestId("ch06-table-tile-1");
    expect(getByTestId("ch06-table-detail-empty")).toBeTruthy();
    expect(first.getAttribute("tabindex")).toBe("0");
    await fireEvent.keyDown(first, { key: "ArrowRight" });
    expect(getByTestId("ch06-table-tile-4").getAttribute("tabindex")).toBe("0");
    expect(first.getAttribute("tabindex")).toBe("-1");
    expect(document.activeElement).toBe(getByTestId("ch06-table-tile-4"));
    await fireEvent.keyDown(getByTestId("ch06-table-tile-4"), { key: "End" });
    expect(getByTestId("ch06-table-tile-34550").getAttribute("tabindex")).toBe("0");
    await fireEvent.keyDown(getByTestId("ch06-table-tile-34550"), { key: "x" });
    expect(getByTestId("ch06-table-tile-34550").getAttribute("tabindex")).toBe("0");
  });
});

describe("KindsTable on small screens", () => {
  test("picking a tile moves focus to the detail heading; the back link returns to the tile", () =>
    onPhone(async () => {
      const { getByTestId } = render(KindsTable, { props: { locale: "en" } });
      await fireEvent.click(getByTestId("ch06-table-tile-7"));
      await tick();
      const heading = getByTestId("ch06-table-detail-name");
      expect(heading.textContent).toContain("Reaction");
      expect(document.activeElement).toBe(heading);
      expect(getByTestId("ch06-table-back").textContent).toContain("Back to the table");
      await fireEvent.click(getByTestId("ch06-table-back"));
      expect(document.activeElement).toBe(getByTestId("ch06-table-tile-7"));
    }));

  test("on wide screens focus stays on the tile", async () => {
    const { getByTestId } = render(KindsTable, { props: { locale: "en" } });
    const tile = getByTestId("ch06-table-tile-7");
    tile.focus();
    await fireEvent.click(tile);
    await tick();
    expect(document.activeElement).toBe(tile);
  });
});

describe("KindDetail", () => {
  const entries = localizeKinds(getDictionary("en").kinds.names);
  test("shows rumor and signed sources", () => {
    const rumor = entries.find((e) => e.kind === 15);
    const { getByTestId } = render(KindDetail, {
      props: { locale: "en", testid: "d", entry: rumor },
    });
    expect(getByTestId("d-source").dataset["source"]).toBe("rumor");
    expect(getByTestId("d-range").textContent).toContain("1000–9999");
    cleanup();
    const signed = entries.find((e) => e.kind === 30009);
    const r2 = render(KindDetail, {
      props: { locale: "en", testid: "d", entry: signed, headingLevel: 2 },
    });
    expect(r2.getByTestId("d-source").dataset["source"]).toBe("signed");
    expect(r2.getByTestId("d-name").tagName).toBe("H2");
    expect(r2.queryByTestId("d-unrecommended")).toBeNull();
  });

  test("flags kinds the NIPs index marks unrecommended", () => {
    const dm = entries.find((e) => e.kind === 4);
    const { getByTestId } = render(KindDetail, { props: { locale: "es", testid: "d", entry: dm } });
    expect(getByTestId("d-unrecommended").textContent?.trim()).toBe("No recomendado");
    expect(getByTestId("d-unrecommended-hint").textContent).toContain("no recomendado");
  });
});

describe("KindClassifier", () => {
  test("classifies known, unknown, out-of-range and invalid input", async () => {
    const { getByTestId } = render(KindClassifier, { props: { locale: "en" } });
    expect(getByTestId("ch06-classifier-known").textContent).toContain("Long-form article");
    expect(getByTestId("ch06-classifier-category").dataset["tone"]).toBe("addressable");
    const input = getByTestId("ch06-classifier-input");
    await fireEvent.input(input, { target: { value: "20001" } });
    expect(getByTestId("ch06-classifier-unknown")).toBeTruthy();
    expect(getByTestId("ch06-classifier-category").dataset["tone"]).toBe("ephemeral");
    await fireEvent.input(input, { target: { value: "500" } });
    expect(getByTestId("ch06-classifier-outside")).toBeTruthy();
    await fireEvent.input(input, { target: { value: "99999" } });
    expect(getByTestId("ch06-classifier-error").dataset["code"]).toBe("out-of-range");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    await fireEvent.input(input, { target: { value: "" } });
    expect(input.getAttribute("aria-invalid")).toBe("false");
  });
});

describe("StorageSimulator", () => {
  test("replaceable: keeps one; a stale resend is ignored and celebrated once", async () => {
    const { reasons, off } = celebrations();
    const { getByTestId } = render(StorageSimulator, { props: { locale: "en" } });
    const publish = getByTestId("ch06-storage-publish");
    expect(getByTestId("ch06-storage-stale").hasAttribute("disabled")).toBe(true);
    await fireEvent.click(publish);
    await fireEvent.click(publish);
    await tick(10);
    expect(getByTestId("ch06-storage-outcome").dataset["outcome"]).toBe("replaced");
    expect(getByTestId("ch06-storage-count").textContent).toBe("1 event stored");
    await fireEvent.click(getByTestId("ch06-storage-stale"));
    expect(getByTestId("ch06-storage-outcome").dataset["outcome"]).toBe("ignored-older");
    await fireEvent.click(getByTestId("ch06-storage-stale"));
    expect(reasons).toEqual(["ch06-stale-ignored"]);
    off();
  });

  test("regular piles up, ephemeral stores nothing, addressable has slots", async () => {
    const { getByTestId } = render(StorageSimulator, { props: { locale: "en" } });
    const publish = getByTestId("ch06-storage-publish");
    await fireEvent.click(getByTestId("ch06-storage-cat-regular"));
    await fireEvent.click(publish);
    await fireEvent.click(publish);
    await tick(10);
    expect(getByTestId("ch06-storage-count").textContent).toBe("2 events stored");
    await fireEvent.click(getByTestId("ch06-storage-stale"));
    expect(getByTestId("ch06-storage-outcome").dataset["outcome"]).toBe("duplicate");

    await fireEvent.click(getByTestId("ch06-storage-cat-ephemeral"));
    await fireEvent.click(publish);
    await tick(10);
    expect(getByTestId("ch06-storage-outcome").dataset["outcome"]).toBe("forwarded");
    expect(getByTestId("ch06-storage-count").textContent).toBe("0 events stored");
    expect(getByTestId("ch06-storage-feed").textContent).toContain("kind 24133");

    await fireEvent.click(getByTestId("ch06-storage-cat-addressable"));
    await fireEvent.click(publish);
    await fireEvent.click(getByTestId("ch06-storage-slot-b"));
    await fireEvent.click(publish);
    await tick(10);
    expect(getByTestId("ch06-storage-count").textContent).toBe("2 events stored");
    await fireEvent.click(getByTestId("ch06-storage-reset"));
    await tick(10);
    expect(getByTestId("ch06-storage-count").textContent).toBe("0 events stored");
    expect(getByTestId("ch06-storage-outcome").dataset["outcome"]).toBe("");
  });
});

describe("KindsReference", () => {
  test("searchable table opens details for a row", async () => {
    const { getByTestId, queryByTestId } = render(KindsReference, { props: { locale: "en" } });
    expect(getByTestId("ch06-reference-row-30023")).toBeTruthy();
    expect(getByTestId("ch06-nip-link-30023").getAttribute("href")).toMatch(/\/23\.md$/);
    expect(getByTestId("ch06-reference-detail-empty")).toBeTruthy();
    await fireEvent.click(getByTestId("ch06-reference-show-10002"));
    await tick();
    expect(getByTestId("ch06-reference-detail-name").textContent).toContain("Relay list");
    expect(getByTestId("ch06-reference-show-10002").getAttribute("aria-pressed")).toBe("true");
    await fireEvent.input(getByTestId("ch06-reference-filters-search"), {
      target: { value: "qqqq" },
    });
    await tick(10);
    expect(queryByTestId("ch06-reference-row-30023")).toBeNull();
    expect(getByTestId("ch06-reference-empty")).toBeTruthy();
  });

  test("wide screens focus the panel; phones focus the heading and can go back", async () => {
    const wide = render(KindsReference, { props: { locale: "en" } });
    await fireEvent.click(wide.getByTestId("ch06-reference-show-7"));
    await tick();
    expect(document.activeElement?.classList.contains("side")).toBe(true);
    cleanup();
    await onPhone(async () => {
      const { getByTestId } = render(KindsReference, { props: { locale: "en" } });
      await fireEvent.click(getByTestId("ch06-reference-show-7"));
      await tick();
      expect(document.activeElement).toBe(getByTestId("ch06-reference-detail-name"));
      await fireEvent.click(getByTestId("ch06-reference-back"));
      expect(document.activeElement).toBe(getByTestId("ch06-reference-show-7"));
    });
  });
});
