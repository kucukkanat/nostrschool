# @nostrschool/diagrams

Data-driven, accessible, token-themed diagrams for explaining protocols. They are Svelte 5
components and contain no chapter-specific text: you pass the data and they draw it.

| Component | What it shows | Interaction |
|---|---|---|
| `SequenceDiagram` | lanes plus messages over time | play, pause, step, scrub (`PlaybackControls`) |
| `Swimlane` | activities in lanes, with hand-offs | play, pause, step, scrub |
| `Pipeline` | stages of a computation | select a stage, expand long values |
| `ForceGraph` | a d3-force social graph | drag, arrow keys, Enter/Space to select, Esc to clear |
| `Packet` | a colored pill for a wire verb (`REQ`, `EVENT`…) | inline |

What every diagram does:

- **Props.** Each one takes `testid`, `locale`, `title` and an optional `description`. Every part
  gets a test id of the form `${testid}-…`.
- **Live narration.** An `aria-live="polite"` caption (`${testid}-narration`) narrates the current
  state.
- **Text version.** A `<details>` text alternative (`${testid}-text`) holds a table or list of the
  data.
- **Invalid data.** Duplicate ids or unknown references never draw a broken picture. The diagram
  shows a visible typed error (`${testid}-error`, `data-code="duplicate-id" | "unknown-ref"`).
- **Tokens.** Colors, spacing, radii and durations come only from `@nostrschool/tokens`. This
  covers light and dark mode.
- **Reduced motion.** With reduced motion on, animations become instant state changes and
  nothing is lost. `ForceGraph` then shows its settled layout, and dragging moves only the
  dragged node.
- **Phone widths.** SVG diagrams scale with a `viewBox`. Lane diagrams scroll inside their own
  box (`${testid}-scroll`) below a readable minimum width; the edges that hide content fade out
  (`data-overflow-start|end="true"`), and the box scrolls the current step into view as playback
  advances. `ForceGraph` fits its layout to the whole box and counter-scales name labels so they
  stay at least `--font-size-xs` on screen. `Pipeline` stacks its stages vertically below 768px.

## Usage

```svelte
<script lang="ts">
  import { SequenceDiagram } from "@nostrschool/diagrams";

  let step = $state(-1); // -1 = nothing sent yet
</script>

<SequenceDiagram
  testid="ch04-wire"
  locale="en"
  title="A client asks a relay for notes"
  lanes={[
    { id: "client", label: "Client", kind: "client" },
    { id: "relay", label: "Relay", kind: "relay" },
  ]}
  messages={[
    { id: "req", from: "client", to: "relay", label: "REQ", packet: "REQ",
      narration: "The client subscribes.", payload: ["REQ", "sub1", { kinds: [1], limit: 2 }] },
    { id: "ev", from: "relay", to: "client", label: "EVENT", packet: "EVENT" },
    { id: "eose", from: "relay", to: "client", label: "EOSE", packet: "EOSE",
      narration: "That was everything stored." },
  ]}
  bind:step
  onstep={(i, msg) => console.log(i, msg?.id)}
/>
```

You can replace the default JSON detail panel with a snippet:
`detail={myDetail}`, where `{#snippet myDetail(msg)}…{/snippet}`.

```svelte
<script lang="ts">
  import { Pipeline } from "@nostrschool/diagrams";
</script>

<Pipeline
  testid="ch03-id"
  locale="en"
  title="From event to id"
  active={1}
  status="running"
  stages={[
    { id: "ser", label: "Serialize", value: '[0,"79be…",1735689600,1,[],"hi"]' },
    { id: "hash", label: "SHA-256", value: "5c83da77af1dec6d7289834998ad7aafbd9e2191396d75ec3cc27f5a77226f36" },
    { id: "id", label: "Event id" },
  ]}
/>
```

When `status="error"`, also pass `errorAt={1}`: that stage turns red and the narration says
"Failed at …".

```svelte
<script lang="ts">
  import { ForceGraph, Packet, Swimlane } from "@nostrschool/diagrams";
</script>

<ForceGraph testid="ch07-graph" locale="en" title="Who follows whom"
  nodes={[{ id: "a", label: "Alice", group: "core" }, { id: "b", label: "Bob" }, { id: "c", label: "Carol" }]}
  links={[{ source: "a", target: "b" }, { source: "b", target: "c", kind: "mutual" }]}
  onselect={(id) => console.log("selected", id)} />

<Swimlane testid="ch10-flow" locale="en" title="Remote signing"
  lanes={[{ id: "app", label: "App" }, { id: "bunker", label: "Bunker" }]}
  steps={[
    { id: "ask", lane: "app", label: "Ask to sign", to: "bunker", packet: "EVENT" },
    { id: "sign", lane: "bunker", label: "Sign" },
    { id: "back", lane: "bunker", label: "Return sig", to: "app", packet: "EVENT" },
  ]} />

<p>The client sends <Packet type="REQ" /> and gets <Packet type="EOSE" size="sm" />.</p>
```

## Pure helpers

The math behind the components is exported, so you can test it or reuse it without rendering
anything. Run this snippet with `bun`:

```ts
import {
  sequenceLayout, swimlaneLayout, stageState,
  graphStats, neighbors, nearestInDirection, staticLayout, fitToBox,
  tick, play, stepDelay, PACKET_COLORS,
} from "@nostrschool/diagrams";

const people = [{ id: "a", label: "Ann" }, { id: "b", label: "Ben" }];
console.log(graphStats(people, [{ source: "a", target: "b" }]).get("b")); // { following: [], followers: ["a"] }
console.log(fitToBox([{ id: "a", x: 40, y: 5 }, { id: "b", x: 60, y: 5 }], 200, 100, 10));
// [{ id: "a", x: 10, y: 50 }, { id: "b", x: 190, y: 50 }]
console.log(tick({ step: 1, playing: true }, 2));        // { step: 2, playing: false }
console.log(stageState(2, 1, "running"));                // "pending"
console.log(PACKET_COLORS.REQ);                          // "var(--color-packet-req)"
const layout = sequenceLayout([{ id: "a", label: "A" }], [{ id: "m", from: "a", to: "b", label: "?" }]);
console.log(layout.ok ? layout.value : layout.error);    // { code: "unknown-ref", message: 'Unknown lane "b"' }
```

## Development

```bash
bun test packages/diagrams                 # unit + render tests (happy-dom, no mocks)
bun test --coverage packages/diagrams
bun run --cwd packages/diagrams typecheck  # svelte-check
bunx biome check packages/diagrams
```

The UI strings are in `packages/i18n/src/locales/<locale>/diagrams.ts`.
