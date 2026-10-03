# @nostrschool/charts

Token-themed, accessible, responsive charts for Nostr School: `BarChart`, `LineChart`,
`Treemap`, `DonutChart` and `StatTile`. D3 does the math (scales, shapes, treemap/pie layouts);
Svelte 5 renders plain SVG, so charts server-render in Astro and hydrate as islands.

Every chart:

- **is themed by tokens only** — series use `--color-chart-1…8`, axes/grid use
  `--color-chart-axis` / `--color-chart-grid`, so light/dark switch automatically. Marks are
  ink-outlined riso fills; hover lifts a mark with a hard ink shadow, and keyboard focus draws a
  thick focus ring inside a `--color-focus-halo` outline so it stays visible on every fill;
- **fills its container** (measured width, 1:1 viewBox; fewer ticks on narrow screens);
- **animates in** with token durations/easings (bars grow, lines draw, slices spin in). Under
  `prefers-reduced-motion` the duration tokens collapse to `0ms`, so the final state shows instantly;
- **has tooltips** on hover *and* keyboard focus;
- **is keyboard explorable**: one Tab stop per chart, then arrow keys / Home / End across data marks
  (each mark has an `aria-label` like `"Germany: 201"`);
- **has a data-table fallback** toggled by `${testid}-table-toggle` (`${testid}-table`);
- **validates its data** (unique ids, finite values; non-negative for donut/treemap). Invalid data
  renders the "No data" state (`${testid}-empty`) and logs a `console.warn` naming the problem.

## Install

Workspace package — add `"@nostrschool/charts": "workspace:*"` and make sure the tokens CSS is
loaded once (`import "@nostrschool/tokens/tokens.css"`; the site's `global.css` already does).

## BarChart

```svelte
<script lang="ts">
  import { BarChart } from "@nostrschool/charts";
</script>

<BarChart
  testid="ch11-relays"
  locale="en"
  title="Relays by country"
  description="Public relays seen in the snapshot"
  source="Snapshot: 2026-10-01, nostr.watch"
  data={[
    { id: "us", label: "USA", value: 312 },
    { id: "de", label: "Germany", value: 201 },
    { id: "jp", label: "Japan", value: 99 },
  ]}
  sorted
  highlight="de"
  orientation="horizontal"
  yLabel="Relays"
/>
```

Parts: `ch11-relays-bar-us`, `ch11-relays-label-us`, `ch11-relays-separator`, `ch11-relays-tooltip`,
`ch11-relays-table-toggle`, `ch11-relays-table`, `ch11-relays-row-us`. Negative values hang below the
zero line.

Catch-all buckets (ids `"other"` and `"unknown"` by default) are always drawn last, after a dashed
ink rule, even with `sorted`. Pass `pinned={["misc"]}` to pin other ids, or `pinned={[]}` to opt out.
Horizontal bars below the `sm` breakpoint (480px) put each label on its own line above its bar,
so long names are not cut off; wider charts size the side label column to the longest label (up to
40% of the width).

## LineChart

```svelte
<script lang="ts">
  import { LineChart } from "@nostrschool/charts";
  const day = 86_400_000;
  const start = Date.UTC(2026, 0, 1);
</script>

<LineChart
  testid="ch11-growth"
  locale="en"
  title="Daily events"
  xLabel="Day"
  yLabel="Events"
  series={[
    { id: "notes", label: "Notes", points: [0, 1, 2].map((i) => ({ x: new Date(start + i * day), y: 100 + i * 40 })) },
    { id: "zaps", label: "Zaps", points: [0, 1, 2].map((i) => ({ x: new Date(start + i * day), y: 20 + i * 15 })) },
  ]}
/>
```

`x` is either all `Date`s (time scale, ticks via `formatDate`) or all numbers (linear scale); pass
`formatX` to customise ticks/labels. Parts: `-series-<id>`, `-point-<seriesId>-<i>`, `-legend`.

## Treemap

```svelte
<script lang="ts">
  import { Treemap } from "@nostrschool/charts";
</script>

<Treemap
  testid="ch06-kinds"
  locale="en"
  title="Events by kind"
  root={{
    id: "all",
    label: "All events",
    children: [
      { id: "social", label: "Social", children: [
        { id: "k1", label: "Notes", value: 600 },
        { id: "k7", label: "Reactions", value: 250 },
      ] },
      { id: "k4", label: "DMs", value: 150 },
    ],
  }}
/>
```

Leaves carry `value`; parents sum their children. Cells are colored by top-level group and labelled
inline when they're big enough, on an ink-outlined paper plate so the label reads on any fill.
Parts: `-cell-<id>`, `-cell-<id>-plate`.

## DonutChart

```svelte
<script lang="ts">
  import { DonutChart } from "@nostrschool/charts";
</script>

<DonutChart
  testid="ch04-software"
  locale="es"
  title="Relay software"
  centerLabel="3"
  data={[
    { id: "strfry", label: "strfry", value: 420 },
    { id: "nostr-rs", label: "nostr-rs-relay", value: 180 },
    { id: "other", label: "Other", value: 90 },
  ]}
/>
```

Without `centerLabel` the hole shows the formatted total. Parts: `-slice-<id>`, `-legend`, `-center`.

## StatTile

```svelte
<script lang="ts">
  import { StatTile } from "@nostrschool/charts";
</script>

<StatTile testid="ch11-relay-count" locale="en" label="Public relays" value={1234} delta={0.12} hint="vs. last month" />
```

`delta` is relative (`0.12` = +12%): rendered as ▲/▼ plus screen-reader text ("Up 12%").
Parts: `-value`, `-delta` (`data-tone="up|down|flat"`), `-label`, `-hint`.

## Pure helpers (no DOM)

```ts
import { barLayout, donutLayout, lineLayout, treemapLayout, niceMax, seriesColor, validateData } from "@nostrschool/charts";

niceMax([3, 87, 12]); // 90
seriesColor(1); // "var(--color-chart-2)"
validateData([{ id: "a", label: "A", value: Number.NaN }]); // { ok: false, error: { code: "non-finite", … } }
barLayout([{ id: "a", label: "A", value: 3 }], { width: 640 }).bars[0]; // { x, y, width, height, anchor, … }
```

All layouts are pure functions of `(data, { width })` returning pixel geometry — the components only
draw what they return, which is what the unit tests cover.

## Common props

| Prop | Type | Notes |
|---|---|---|
| `testid` | `string` | root `data-testid`; parts derive from it |
| `locale` | `"en" \| "es"` | number/date formatting and UI strings |
| `title` | `string` | caption + accessible name |
| `description?` | `string` | shown under the title, linked via `aria-describedby` |
| `format?` | `(n) => string` | value formatter (default `formatNumber(locale, n)`) |
| `source?` | `string` | attribution line |

## Scripts

```bash
bun test packages/charts              # unit + render tests (happy-dom, real Svelte runtime)
bun run --cwd packages/charts typecheck
```
