import { describe, expect, test } from "bun:test";
import { tokens } from "@nostrschool/tokens";
import {
  barLayout,
  DEFAULT_WIDTH,
  donutLayout,
  lineLayout,
  MARK_CORNER,
  MIN_BAR_LENGTH,
  plotHeight,
  STACKED_LABEL_ROW,
  tickCount,
  treemapLayout,
  truncate,
} from "./layout.ts";

const data = [
  { id: "us", label: "USA", value: 300 },
  { id: "de", label: "Germany", value: 200 },
  { id: "jp", label: "Japan", value: 100 },
];
const close = (a: number, b: number) => expect(Math.abs(a - b)).toBeLessThan(1e-6);

test("plotHeight is 16:9 but clamped between a diagram's min height and 1.5×", () => {
  expect(plotHeight(300)).toBe(320);
  expect(plotHeight(640)).toBe(360);
  expect(plotHeight(4000)).toBe(480);
  expect(DEFAULT_WIDTH).toBe(720);
});

test("tickCount shrinks on narrow screens", () => {
  expect(tickCount(tokens.breakpoint.sm - 1)).toBe(3);
  expect(tickCount(tokens.breakpoint.md - 1)).toBe(5);
  expect(tickCount(tokens.breakpoint.md)).toBe(7);
});

test("truncate keeps short labels and ellipsizes long ones", () => {
  expect(truncate("USA", 100)).toBe("USA");
  const t = truncate("A very long relay name indeed", 40);
  expect(t.endsWith("…")).toBe(true);
  expect(t.length).toBeLessThan(10);
  expect(truncate("Anything", 0)).toBe("A…");
});

describe("barLayout", () => {
  test("vertical: bar heights are proportional and share a baseline", () => {
    const l = barLayout(data, { width: 640 });
    const [us, de, jp] = l.bars;
    if (!us || !de || !jp) throw new Error("missing bars");
    close(us.height / jp.height, 3);
    close(de.height / jp.height, 2);
    for (const b of l.bars) close(b.y + b.height, l.baseline);
    expect(l.baseline).toBe(l.height - l.margin.bottom);
    expect(us.x).toBeLessThan(de.x);
    expect(us.anchor).toEqual({ x: us.x + us.width / 2, y: us.y });
    expect(l.valueTicks[0]?.value).toBe(0);
    expect(l.categories.map((c) => c.value)).toEqual(["USA", "Germany", "Japan"]);
  });

  test("sorted reorders descending without mutating input", () => {
    const input = [...data].reverse();
    const l = barLayout(input, { width: 640, sorted: true });
    expect(l.bars.map((b) => b.id)).toEqual(["us", "de", "jp"]);
    expect(input[0]?.id).toBe("jp");
  });

  test("horizontal: widths proportional, height grows with rows", () => {
    const l = barLayout(data, { width: 640, orientation: "horizontal" });
    const [us, , jp] = l.bars;
    if (!us || !jp) throw new Error("missing bars");
    close(us.width / jp.width, 3);
    expect(us.x).toBe(l.baseline);
    expect(us.anchor).toEqual({ x: us.x + us.width, y: us.y + us.height / 2 });
    const more = barLayout([...data, { id: "fr", label: "France", value: 50 }], {
      width: 640,
      orientation: "horizontal",
    });
    expect(more.height).toBeGreaterThan(l.height);
  });

  test("negative values hang below (vertical) / left of (horizontal) zero", () => {
    const mixed = [
      { id: "a", label: "A", value: 10 },
      { id: "b", label: "B", value: -5 },
    ];
    const v = barLayout(mixed, { width: 640 });
    const neg = v.bars[1];
    expect(neg?.negative).toBe(true);
    expect(neg?.y).toBe(v.baseline);
    const h = barLayout(mixed, { width: 640, orientation: "horizontal" });
    const hneg = h.bars[1];
    close((hneg?.x ?? 0) + (hneg?.width ?? 0), h.baseline);
    expect(hneg?.anchor.x).toBe(h.baseline);
  });

  test("all-zero data still has a usable domain", () => {
    const l = barLayout([{ id: "z", label: "Z", value: 0 }], { width: 640 });
    expect(l.bars[0]?.height).toBe(MIN_BAR_LENGTH);
    expect(l.valueTicks.length).toBeGreaterThan(1);
  });

  test("zero bars keep a visible baseline stub so focus never lands on a 0px mark", () => {
    const rows = [
      { id: "a", label: "A", value: 100 },
      { id: "z", label: "Z", value: 0 },
      { id: "n", label: "N", value: -50 },
    ];
    const v = barLayout(rows, { width: 640 });
    const [, vz] = v.bars;
    expect(MIN_BAR_LENGTH).toBeGreaterThan(0);
    expect(vz?.height).toBe(MIN_BAR_LENGTH);
    close((vz?.y ?? 0) + MIN_BAR_LENGTH, v.baseline);
    expect(vz?.anchor.y).toBe(vz?.y);
    const h = barLayout(rows, { width: 640, orientation: "horizontal" });
    const [, hz] = h.bars;
    expect(hz?.width).toBe(MIN_BAR_LENGTH);
    expect(hz?.x).toBe(h.baseline);
    close(hz?.anchor.x ?? 0, h.baseline + MIN_BAR_LENGTH);
  });

  test("empty data renders an empty plot", () => {
    expect(barLayout([], { width: 640 }).bars).toEqual([]);
  });
});

describe("lineLayout", () => {
  const series = [
    {
      id: "a",
      label: "A",
      points: [
        { x: 3, y: 30 },
        { x: 1, y: 10 },
        { x: 2, y: 20 },
      ],
    },
    { id: "b", label: "B", points: [{ x: 2, y: 5 }] },
  ];

  test("numeric x: points sorted by x and mapped into the plot box", () => {
    const l = lineLayout(series, { width: 640, time: false });
    const a = l.series[0];
    if (!a) throw new Error("missing series");
    expect(a.points.map((p) => p.x)).toEqual([1, 2, 3]);
    expect(a.points[0]?.px).toBe(l.margin.left);
    expect(a.points[2]?.px).toBe(640 - l.margin.right);
    expect(a.points[2]?.py).toBeLessThan(a.points[0]?.py ?? 0);
    expect(a.d.startsWith("M")).toBe(true);
    expect(l.series[1]?.index).toBe(1);
    expect(l.yTicks[0]?.value).toBe(0);
  });

  test("time x uses a time scale with Date ticks", () => {
    const day = 86_400_000;
    const l = lineLayout(
      [
        {
          id: "t",
          label: "T",
          points: [0, 1, 2, 3].map((i) => ({ x: new Date(i * day * 30), y: i })),
        },
      ],
      { width: 640, time: true },
    );
    expect(l.xTicks.length).toBeGreaterThan(1);
    expect(l.xTicks[0]?.value).toBeInstanceOf(Date);
  });

  test("a single x value is centered instead of collapsing the scale", () => {
    const l = lineLayout([{ id: "s", label: "S", points: [{ x: 5, y: 1 }] }], {
      width: 640,
      time: false,
    });
    close(l.series[0]?.points[0]?.px ?? 0, (l.margin.left + 640 - l.margin.right) / 2);
  });
});

describe("treemapLayout", () => {
  const root = {
    id: "root",
    label: "All",
    children: [
      {
        id: "social",
        label: "Social",
        children: [
          { id: "notes", label: "Notes", value: 60 },
          { id: "reactions", label: "Reactions", value: 20 },
        ],
      },
      { id: "dm", label: "DMs", value: 20 },
      { id: "zero", label: "Zero", value: 0 },
    ],
  };

  test("cell areas are proportional to values and fill the box", () => {
    const l = treemapLayout(root, { width: 640 });
    expect(l.total).toBe(100);
    expect(l.cells.map((c) => c.id).sort()).toEqual(["dm", "notes", "reactions"]);
    const area = (id: string) => {
      const c = l.cells.find((x) => x.id === id);
      return (c?.width ?? 0) * (c?.height ?? 0);
    };
    // Rounding + inner padding make it approximate.
    expect(area("notes") / area("dm")).toBeGreaterThan(2.4);
    expect(area("notes") / area("dm")).toBeLessThan(3.6);
    for (const c of l.cells) {
      expect(c.x).toBeGreaterThanOrEqual(0);
      expect(c.x + c.width).toBeLessThanOrEqual(640);
      expect(c.y + c.height).toBeLessThanOrEqual(l.height);
    }
  });

  test("cells know their group (color) and ancestor path", () => {
    const l = treemapLayout(root, { width: 640 });
    const notes = l.cells.find((c) => c.id === "notes");
    const dm = l.cells.find((c) => c.id === "dm");
    expect(notes?.group).toBe(0);
    expect(notes?.path).toEqual(["Social"]);
    expect(dm?.group).toBe(1);
    expect(dm?.path).toEqual([]);
  });

  test("a leaf root becomes a single full cell", () => {
    const l = treemapLayout({ id: "solo", label: "Solo", value: 5 }, { width: 400 });
    expect(l.cells).toHaveLength(1);
    expect(l.cells[0]?.group).toBe(0);
    expect(l.cells[0]?.width).toBe(400);
  });
});

describe("donutLayout", () => {
  test("shares sum to 1, slices keep input order, size is capped", () => {
    const l = donutLayout(data, { width: 900 });
    expect(l.size).toBe(320);
    expect(l.total).toBe(600);
    close(
      l.slices.reduce((s, x) => s + x.share, 0),
      1,
    );
    expect(l.slices.map((s) => s.id)).toEqual(["us", "de", "jp"]);
    expect(l.slices[0]?.share).toBe(0.5);
    expect(l.slices[0]?.d.startsWith("M")).toBe(true);
    // First slice starts at 12 o'clock and runs clockwise: centroid is right of center.
    expect(l.slices[0]?.centroid.x).toBeGreaterThan(0);
  });

  test("narrow containers shrink the donut; zero totals give zero shares", () => {
    expect(donutLayout(data, { width: 200 }).size).toBe(200);
    const z = donutLayout([{ id: "a", label: "A", value: 0 }], { width: 300 });
    expect(z.total).toBe(0);
    expect(z.slices[0]?.share).toBe(0);
  });
});

describe("mark geometry", () => {
  test("bars and cells use the small brand radius", () => {
    expect(MARK_CORNER).toBe(Number.parseFloat(tokens.radius.sm));
    expect(MARK_CORNER).toBeLessThanOrEqual(2);
  });
});

describe("barLayout on phones and with catch-all buckets", () => {
  const relays = [
    { id: "other", label: "everything else", value: 900 },
    { id: "strfry", label: "strfry", value: 500 },
    { id: "rs", label: "nostr-rs-relay", value: 300 },
  ];

  test("pins 'other' last after a separator, even when sorted by value", () => {
    const l = barLayout(relays, { width: 640, orientation: "horizontal", sorted: true });
    expect(l.bars.map((b) => b.id)).toEqual(["strfry", "rs", "other"]);
    const [, rs, other] = l.bars;
    if (!rs || !other || l.separator === undefined) throw new Error("missing layout parts");
    expect(l.separator).toBeGreaterThan(rs.y + rs.height);
    expect(l.separator).toBeLessThan(other.y);
  });

  test("pinned: [] opts out; vertical separator sits between columns", () => {
    const off = barLayout(relays, { width: 640, sorted: true, pinned: [] });
    expect(off.bars.map((b) => b.id)).toEqual(["other", "strfry", "rs"]);
    expect(off.separator).toBeUndefined();
    const v = barLayout(relays, { width: 640 });
    const [a, , c] = v.bars;
    if (!a || !c || v.separator === undefined) throw new Error("missing layout parts");
    expect(v.bars.map((b) => b.id)).toEqual(["strfry", "rs", "other"]);
    expect(v.separator).toBeGreaterThan(a.x);
    expect(v.separator).toBeLessThan(c.x);
    expect(v.categories[0]).toMatchObject({ anchor: "middle", centered: false });
  });

  test("no separator when everything (or nothing) is pinned", () => {
    expect(barLayout(relays.slice(0, 1), { width: 640 }).separator).toBeUndefined();
    expect(barLayout(relays.slice(1), { width: 640 }).separator).toBeUndefined();
  });

  test("below the sm breakpoint horizontal labels sit above their bars, untruncated", () => {
    const wide = barLayout(relays, { width: 640, orientation: "horizontal" });
    expect(wide.stacked).toBe(false);
    expect(wide.categories[1]).toMatchObject({ anchor: "end", centered: true });
    const phone = barLayout(relays, { width: 320, orientation: "horizontal" });
    expect(phone.stacked).toBe(true);
    expect(phone.categories.map((c) => c.value)).toEqual([
      "strfry",
      "nostr-rs-relay",
      "everything else",
    ]);
    for (const [i, cat] of phone.categories.entries()) {
      const bar = phone.bars[i];
      if (!bar) throw new Error("missing bar");
      expect(cat).toMatchObject({ anchor: "start", centered: false, x: phone.margin.left });
      expect(cat.y).toBeLessThan(bar.y);
      expect(cat.y).toBeGreaterThan(bar.y - STACKED_LABEL_ROW);
    }
    expect(phone.height).toBeGreaterThan(wide.height);
  });
});
