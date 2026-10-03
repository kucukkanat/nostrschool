import { afterEach, describe, expect, spyOn, test } from "bun:test";
import { cleanup, fireEvent, render } from "@testing-library/svelte";
import { tick } from "svelte";
import { BarChart, DonutChart, LineChart, StatTile, Treemap } from "./index.ts";

afterEach(cleanup);

const data = [
  { id: "us", label: "USA", value: 312 },
  { id: "de", label: "Germany", value: 201 },
  { id: "jp", label: "Japan", value: 99 },
];
const base = { locale: "en" as const, title: "Relays by country" };

describe("BarChart", () => {
  test("renders one focusable mark per datum with accessible names", () => {
    const { getByTestId } = render(BarChart, {
      props: { ...base, testid: "bars", data, description: "Top 3", source: "nostr.watch" },
    });
    const us = getByTestId("bars-bar-us");
    expect(us.getAttribute("aria-label")).toBe("USA: 312");
    expect(us.getAttribute("tabindex")).toBe("0");
    expect(getByTestId("bars-bar-de").getAttribute("tabindex")).toBe("-1");
    expect(getByTestId("bars-title").textContent).toBe("Relays by country");
    expect(getByTestId("bars-description").textContent).toBe("Top 3");
    expect(getByTestId("bars-source").textContent).toBe("nostr.watch");
    expect(getByTestId("bars").tagName).toBe("FIGURE");
  });

  test("a zero bar is still a visible, focusable stub", () => {
    const { getByTestId } = render(BarChart, {
      props: {
        ...base,
        testid: "zb",
        data: [{ id: "c", label: "Centralized", value: 0 }, ...data],
      },
    });
    const zero = getByTestId("zb-bar-c");
    expect(zero.getAttribute("tabindex")).toBe("0");
    expect(Number(zero.getAttribute("height"))).toBeGreaterThan(0);
    expect(zero.getAttribute("aria-label")).toBe("Centralized: 0");
  });

  test("hover and focus show a tooltip; leaving hides it", async () => {
    const { getByTestId, queryByTestId } = render(BarChart, {
      props: { ...base, testid: "bars", data },
    });
    await fireEvent.pointerEnter(getByTestId("bars-bar-de"));
    expect(getByTestId("bars-tooltip").textContent?.trim()).toBe("Germany: 201");
    await fireEvent.pointerLeave(getByTestId("bars-bar-de"));
    expect(queryByTestId("bars-tooltip")).toBeNull();
    await fireEvent.focus(getByTestId("bars-bar-jp"));
    expect(getByTestId("bars-tooltip").textContent?.trim()).toBe("Japan: 99");
    await fireEvent.blur(getByTestId("bars-bar-jp"));
    expect(queryByTestId("bars-tooltip")).toBeNull();
  });

  test("arrow keys move focus between marks (roving focus)", async () => {
    const { getByTestId } = render(BarChart, { props: { ...base, testid: "bars", data } });
    const plot = getByTestId("bars-plot");
    getByTestId("bars-bar-us").focus();
    await fireEvent.keyDown(getByTestId("bars-bar-us"), { key: "ArrowRight" });
    expect(document.activeElement).toBe(getByTestId("bars-bar-de"));
    await fireEvent.keyDown(document.activeElement ?? plot, { key: "End" });
    expect(document.activeElement).toBe(getByTestId("bars-bar-jp"));
    await fireEvent.keyDown(document.activeElement ?? plot, { key: "Enter" });
    expect(document.activeElement).toBe(getByTestId("bars-bar-jp"));
    // Keys pressed while no mark is focused are left alone.
    getByTestId("bars-table-toggle").focus();
    await fireEvent.keyDown(plot, { key: "ArrowRight" });
    expect(document.activeElement).toBe(getByTestId("bars-table-toggle"));
  });

  test("table fallback toggles and lists every datum with formatted values", async () => {
    const { getByTestId } = render(BarChart, {
      props: {
        ...base,
        testid: "bars",
        data,
        format: (v: number) => `${v} relays`,
        yLabel: "Relays",
      },
    });
    const toggle = getByTestId("bars-table-toggle");
    const wrap = getByTestId("bars-table").parentElement;
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(toggle.textContent?.trim()).toBe("Show data table");
    expect(wrap?.hidden).toBe(true);
    await fireEvent.click(toggle);
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    expect(toggle.textContent?.trim()).toBe("Hide data table");
    expect(wrap?.hidden).toBe(false);
    expect(getByTestId("bars-row-us").textContent).toContain("312 relays");
    expect(getByTestId("bars-table").querySelector("thead")?.textContent).toContain("Relays");
  });

  test("highlight mutes the others; sorted + horizontal orientation", () => {
    const { getByTestId, container } = render(BarChart, {
      props: {
        ...base,
        testid: "bars",
        data: [...data].reverse(),
        highlight: "de",
        sorted: true,
        orientation: "horizontal",
      },
    });
    expect(getByTestId("bars-bar-de").classList.contains("muted")).toBe(false);
    expect(getByTestId("bars-bar-us").classList.contains("muted")).toBe(true);
    expect(getByTestId("bars-bar-de").getAttribute("fill")).toBe("var(--color-chart-2)");
    const ids = [...container.querySelectorAll("[data-mark]")].map((e) =>
      e.getAttribute("data-testid"),
    );
    expect(ids).toEqual(["bars-bar-us", "bars-bar-de", "bars-bar-jp"]);
    expect(container.querySelector("svg")?.getAttribute("data-orientation")).toBe("horizontal");
  });

  test("catch-all buckets are pinned last behind a dashed rule; pinned=[] opts out", () => {
    const rows = [{ id: "other", label: "everything else", value: 999 }, ...data];
    const { getByTestId, container } = render(BarChart, {
      props: { ...base, testid: "p", data: rows, sorted: true, orientation: "horizontal" },
    });
    const ids = [...container.querySelectorAll("[data-mark]")].map((e) =>
      e.getAttribute("data-testid"),
    );
    expect(ids.at(-1)).toBe("p-bar-other");
    expect(getByTestId("p-separator").tagName.toLowerCase()).toBe("line");
    expect(getByTestId("p-label-other").textContent?.trim()).toBe("everything else");
    cleanup();
    const off = render(BarChart, {
      props: { ...base, testid: "q", data: rows, sorted: true, pinned: [] },
    });
    expect(off.queryByTestId("q-separator")).toBeNull();
    expect(off.container.querySelector("[data-mark]")?.getAttribute("data-testid")).toBe(
      "q-bar-other",
    );
  });

  test("empty data shows the no-data state; invalid data also warns", () => {
    const warn = spyOn(console, "warn");
    const empty = render(BarChart, { props: { ...base, testid: "e", data: [] } });
    expect(empty.getByTestId("e-empty").textContent).toBe("No data");
    expect(warn).not.toHaveBeenCalled();
    const bad = render(BarChart, {
      props: { ...base, testid: "bad", data: [{ id: "x", label: "X", value: Number.NaN }] },
    });
    expect(bad.getByTestId("bad-empty")).toBeTruthy();
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });

  test("Spanish locale formats numbers and labels", () => {
    const { getByTestId } = render(BarChart, {
      props: { ...base, locale: "es", testid: "b", data: [{ id: "a", label: "A", value: 1234.5 }] },
    });
    expect(getByTestId("b-bar-a").getAttribute("aria-label")).toBe("A: 1234,5");
  });
});

describe("LineChart", () => {
  const day = 86_400_000;
  const series = [
    {
      id: "notes",
      label: "Notes",
      points: [0, 1, 2].map((i) => ({
        x: new Date(Date.UTC(2026, 0, 1) + i * day),
        y: 10 * (i + 1),
      })),
    },
    {
      id: "zaps",
      label: "Zaps",
      points: [0, 1, 2].map((i) => ({ x: new Date(Date.UTC(2026, 0, 1) + i * day), y: 5 * i })),
    },
  ];

  test("renders a path per series, a legend and focusable points", async () => {
    const { getByTestId } = render(LineChart, { props: { ...base, testid: "line", series } });
    expect(getByTestId("line-series-notes").querySelector("path")?.getAttribute("d")).toMatch(/^M/);
    expect(getByTestId("line-legend").textContent).toContain("Zaps");
    const p = getByTestId("line-point-zaps-2");
    expect(p.getAttribute("aria-label")).toContain("Zaps");
    expect(p.getAttribute("aria-label")).toContain(": 10");
    await fireEvent.focus(p);
    expect(getByTestId("line-tooltip").textContent).toContain("Zaps");
    await fireEvent.click(getByTestId("line-table-toggle"));
    expect(getByTestId("line-row-notes-0").textContent).toContain("Notes");
  });

  test("custom x formatter, numeric x and invalid mixes", () => {
    const warn = spyOn(console, "warn");
    const { getByTestId } = render(LineChart, {
      props: {
        ...base,
        testid: "n",
        series: [
          {
            id: "s",
            label: "S",
            points: [
              { x: 1, y: 1 },
              { x: 2, y: 4 },
            ],
          },
        ],
        formatX: (x: Date | number) => `kind ${+x}`,
      },
    });
    expect(getByTestId("n-point-s-1").getAttribute("aria-label")).toBe("S, kind 2: 4");
    const plain = render(LineChart, {
      props: { ...base, testid: "p", series: [{ id: "s", label: "S", points: [{ x: 7, y: 1 }] }] },
    });
    expect(plain.getByTestId("p-point-s-0").getAttribute("aria-label")).toBe("S, 7: 1");
    const bad = render(LineChart, {
      props: {
        ...base,
        testid: "bad",
        series: [
          {
            id: "s",
            label: "S",
            points: [
              { x: 1, y: 1 },
              { x: new Date(), y: 2 },
            ],
          },
        ],
      },
    });
    expect(bad.getByTestId("bad-empty")).toBeTruthy();
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });
});

describe("Treemap", () => {
  const root = {
    id: "all",
    label: "All",
    children: [
      {
        id: "social",
        label: "Social",
        children: [
          { id: "notes", label: "Notes", value: 600 },
          { id: "reactions", label: "Reactions", value: 250 },
        ],
      },
      { id: "dm", label: "DMs", value: 150 },
    ],
  };

  test("renders a cell per leaf with path + share in its name", async () => {
    const { getByTestId } = render(Treemap, { props: { ...base, testid: "tm", root } });
    const notes = getByTestId("tm-cell-notes");
    expect(notes.getAttribute("aria-label")).toBe("Social › Notes: 600 (60%)");
    expect(notes.getAttribute("fill")).toBe("var(--color-chart-1)");
    expect(getByTestId("tm-cell-dm").getAttribute("fill")).toBe("var(--color-chart-2)");
    await fireEvent.pointerEnter(notes);
    expect(getByTestId("tm-tooltip").textContent).toContain("Notes");
    expect(getByTestId("tm-row-reactions").textContent).toContain("25%");
    // Big cells get an inline label.
    expect(notes.parentElement?.querySelector("text")?.textContent).toContain("Notes");
    // ...on an ink-outlined paper plate that stays inside its cell (ink text reads on any fill).
    const plate = getByTestId("tm-cell-notes-plate");
    expect(plate.getAttribute("aria-hidden")).toBe("true");
    const n = (el: Element, a: string) => Number(el.getAttribute(a));
    expect(n(plate, "x")).toBeGreaterThan(n(notes, "x"));
    expect(n(plate, "x") + n(plate, "width")).toBeLessThan(n(notes, "x") + n(notes, "width"));
    expect(n(plate, "y") + n(plate, "height")).toBeLessThan(n(notes, "y") + n(notes, "height"));
  });

  test("invalid trees show the empty state and warn", () => {
    const warn = spyOn(console, "warn");
    const { getByTestId } = render(Treemap, {
      props: {
        ...base,
        testid: "bad",
        root: { id: "r", label: "R", children: [{ id: "a", label: "A", value: -1 }] },
      },
    });
    expect(getByTestId("bad-empty")).toBeTruthy();
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });
});

describe("DonutChart", () => {
  test("renders slices, legend with shares, and the total in the hole", async () => {
    const { getByTestId } = render(DonutChart, { props: { ...base, testid: "d", data } });
    expect(getByTestId("d-slice-us").getAttribute("aria-label")).toBe("USA: 312 (51%)");
    expect(getByTestId("d-legend").textContent).toContain("51%");
    expect(getByTestId("d-center").textContent?.trim()).toBe("612");
    await fireEvent.focus(getByTestId("d-slice-de"));
    expect(getByTestId("d-tooltip").textContent).toContain("Germany");
    expect(getByTestId("d-row-__total").textContent).toContain("612");
  });

  test("zero slices stay in legend/table but are not focus targets", () => {
    const withZero = [{ id: "nil", label: "Nil", value: 0 }, ...data];
    const { getByTestId, queryByTestId } = render(DonutChart, {
      props: { ...base, testid: "dz", data: withZero },
    });
    expect(queryByTestId("dz-slice-nil")).toBeNull();
    expect(getByTestId("dz-slice-us").getAttribute("tabindex")).toBe("0");
    expect(getByTestId("dz-legend").textContent).toContain("Nil");
    expect(getByTestId("dz-row-nil").textContent).toContain("0");
  });

  test("custom center label; negative data is rejected; all-zero is empty", () => {
    const warn = spyOn(console, "warn");
    const c = render(DonutChart, { props: { ...base, testid: "c", data, centerLabel: "3 kinds" } });
    expect(c.getByTestId("c-center").textContent?.trim()).toBe("3 kinds");
    const neg = render(DonutChart, {
      props: { ...base, testid: "n", data: [{ id: "a", label: "A", value: -1 }] },
    });
    expect(neg.getByTestId("n-empty")).toBeTruthy();
    expect(warn).toHaveBeenCalledTimes(1);
    const zero = render(DonutChart, {
      props: { ...base, testid: "z", data: [{ id: "a", label: "A", value: 0 }] },
    });
    expect(zero.getByTestId("z-empty")).toBeTruthy();
    warn.mockRestore();
  });
});

describe("StatTile", () => {
  test("formats numbers and announces direction for screen readers", () => {
    const { getByTestId } = render(StatTile, {
      props: {
        testid: "s",
        locale: "en",
        label: "Relays",
        value: 1234,
        delta: 0.12,
        hint: "vs last month",
      },
    });
    expect(getByTestId("s-value").textContent).toBe("1,234");
    expect(getByTestId("s-delta").dataset["tone"]).toBe("up");
    expect(getByTestId("s-delta").textContent).toContain("Up 12%");
    expect(getByTestId("s-hint").textContent).toBe("vs last month");
  });

  test("down, flat, string values, custom format and no delta", async () => {
    const down = render(StatTile, {
      props: {
        testid: "d",
        locale: "en",
        label: "L",
        value: 5,
        delta: -0.5,
        format: (v: number) => `${v}k`,
      },
    });
    expect(down.getByTestId("d-value").textContent).toBe("5k");
    expect(down.getByTestId("d-delta").textContent).toContain("Down 50%");
    const flat = render(StatTile, {
      props: { testid: "f", locale: "en", label: "L", value: "∞", delta: 0 },
    });
    expect(flat.getByTestId("f-value").textContent).toBe("∞");
    expect(flat.getByTestId("f-delta").textContent).toContain("No change");
    const none = render(StatTile, {
      props: { testid: "x", locale: "es", label: "L", value: 1000.5 },
    });
    await tick();
    expect(none.queryByTestId("x-delta")).toBeNull();
    expect(none.getByTestId("x-value").textContent).toBe("1000,5");
  });
});
