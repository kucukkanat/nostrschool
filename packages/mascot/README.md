# @nostrschool/mascot

**Nos** the ostrich: Nostr School's mascot. Nos reacts to what the learner does (a valid
signature, a wrong quiz answer, a finished chapter) by listening to the `@nostrschool/ui`
event bus, holds the reaction pose for a moment, then goes back to its resting pose.

- **SVG first.** A hand-drawn SVG ostrich with 7 poses, plus ambient life: blinking, a head
  bob and a crest-feather ruffle. All colors come from the `--color-mascot-*` theme tokens, so
  light and dark themes work without extra code.
- **Rive when available.** If you pass `riveSrc` and the `.riv` file exists, the Rive runtime
  is loaded lazily and replaces the SVG. If the file is missing, the runtime is never
  downloaded.
- **Reduced motion.** Poses still change and are still announced, but every loop stops and
  the SVG is always used. A Rive state machine keeps animating, so Rive is skipped.

## Usage (Astro + Svelte island)

```astro
---
import { Mascot } from "@nostrschool/mascot";
import { assetHref } from "~/lib/href";
---
<Mascot client:idle locale="en" size="md" riveSrc={assetHref("mascot/ostrich.riv")} />
```

### Props

| Prop | Type | Default | Notes |
|---|---|---|---|
| `locale` | `"en" \| "es"` | — | Language of the accessible name (`mascot.poses[pose]`) |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | Width from `--size-mascot-*`. Height is reserved by `aspect-ratio`, so the layout does not shift |
| `pose` | `MascotPose` | `"idle"` | Resting pose. Reactions return to it, and changing it updates Nos live |
| `reactive` | `boolean` | `true` | Listen to the bus |
| `say` | `string` | — | Speech bubble text, already localized. It sits in an `aria-live="polite"` region |
| `announce` | `boolean` | `true` | Set to `false` when `say` repeats what your component already narrates in its own live region, so screen readers hear it once |
| `riveSrc` | `string` | — | URL of the `.riv` file. Without it, Nos is SVG only |
| `bus` | `EventBus<MascotEventMap>` | `mascotBus` | Pass your own bus for isolated demos or tests |
| `holdMs` | `number` | `REACTION_HOLD_MS` (2400) | How long a reaction lasts |
| `testid` | `string` | `"mascot"` | Root `data-testid` |

DOM and test ids:

- `testid` is the root element. It has `role="img"`, `aria-label` (the pose description),
  `data-pose` and `data-renderer="svg" | "rive"`.
- The other parts are `-container`, `-figure`, `-svg`, `-canvas`, `-bubble` and `-bubble-region`.
- Reactions are not announced. The mood is the image's alt text only, because the island that
  emitted the bus event already narrates what happened, and a second live region would talk
  over it.

### Making Nos react

Any island can do this, because the bus is shared across islands:

```ts
import { emit } from "@nostrschool/ui";

emit("signature:valid", { eventId: "abc" }); // Nos cheers for 2.4 s, then rests again
```

| Bus event | Pose |
|---|---|
| `signature:valid`, `quiz:correct` | `cheer` |
| `signature:invalid` | `panic` |
| `quiz:wrong` | `think` |
| `keys:generated`, `live:on` | `wave` |
| `live:off` | `sleep` |
| `chapter:complete`, `celebrate` | `celebrate` |

`EVENT_POSES` is a `Record<MascotEventType, MascotPose>`. When a new bus event is added, it
fails typecheck until someone maps it.

### Headless logic (no Svelte)

```ts
import { createEventBus, type MascotEventMap } from "@nostrschool/ui";
import { createPoseController, poseForEvent } from "@nostrschool/mascot";

const bus = createEventBus<MascotEventMap>();
const nos = createPoseController({ base: "idle", holdMs: 1000 });
nos.connect(bus);
nos.$state.subscribe(({ pose, beat }) => console.log(pose, beat));

bus.emit("quiz:wrong", { quizId: "q1" }); // logs "think 1", and after 1 s "idle 1"
console.log(poseForEvent("chapter:complete")); // "celebrate"
nos.destroy();
```

`beat` goes up by one on every reaction. It drives the springy squash (from `motion`) and the
Rive `bounce` trigger, so two `cheer` reactions in a row still visibly bounce.

### Rive helpers

```ts
import { bindRiveInputs, fetchRiveAsset } from "@nostrschool/mascot";

const file = await fetchRiveAsset("/understanding-nostr/mascot/ostrich.riv");
if (!file.ok) console.log(file.error.code); // "not-found" | "not-rive" | "network"

// Rive's StateMachineInput objects satisfy RiveInputLike.
const pose = { name: "pose", value: 0, fire() {} };
const bounce = { name: "bounce", value: false, fire() { console.log("boing") } };
const controls = bindRiveInputs([pose, bounce]);
if (controls.ok) {
  controls.value.setPose("celebrate"); // pose.value === 5
  controls.value.bounce(); // "boing"
}
```

Errors are typed `Result`s. In the component, a missing file or HTML in place of a `.riv` is
the normal case (no asset has shipped yet), so Nos stays SVG and nothing is logged. Network
errors and a file that breaks the contract are logged with `console.warn`, and Nos falls back
to SVG.

---

## Rive asset spec (for illustrators)

Hand this section to the designer. If the file follows it, it drops in with no code changes.

**File.** Save to `apps/site/public/mascot/ostrich.riv`. The site loads it from
`<base>/mascot/ostrich.riv`.

**Artboard.** Use the default artboard, 200 × 220. That is the same aspect ratio as the SVG,
so the reserved space matches. Keep Nos centered, feet on a ground line at about y = 205, with
a soft shadow ellipse under the feet. Leave headroom above the crest for props such as the
thought bubble, "Zzz" and confetti. They may draw outside the bounds; the canvas does not clip
the layout.

**State machine.** It must be named exactly `Mascot` and must autoplay.

| Input | Type | Values |
|---|---|---|
| `pose` | Number | Index into `MASCOT_POSES` (see below) |
| `bounce` | Trigger | Fired on every reaction, even a repeat of the current pose. Play a quick squash and stretch (about 300 ms), then return to the current pose's loop |

| `pose` | Name | Brief | Loop |
|---|---|---|---|
| 0 | `idle` | Standing relaxed, friendly | Blink every ~4 s, gentle 2 px bob, crest feathers sway |
| 1 | `wave` | One wing raised, waving hello, head tilted | Wing waves |
| 2 | `think` | Head and neck tilted, eyes looking up, wing tip at the chin, thought bubble with "…" | Dots pulse |
| 3 | `cheer` | Both wings up, beak open, sparkles | Small hops |
| 4 | `panic` | Big eyes, small pupils, crest spiked up, wings flared, sweat drop and alarm lines | Fast shiver, wings flap |
| 5 | `celebrate` | Wings fully up, beak open, confetti and sparkles | Big jumps with squash, confetti falls |
| 6 | `sleep` | Head drooped, eyes closed (curved lash line), crest flopped, floating "z z Z" | Slow breathing |

Transitions between any two poses should take about 200–400 ms with a slight overshoot
(springy). The runtime may set `pose` while a transition is still running.

**Palette.** Match the tokens so Rive and SVG look the same.

| Part | Light | Dark | Token |
|---|---|---|---|
| Body, neck, head | `#312843` | `#453B59` | `--color-mascot-body` |
| Belly, eye whites | `#F8F5FC` | `#EFEAF6` | `--color-mascot-belly` |
| Beak | `#FF7410` | `#FF8A33` | `--color-mascot-beak` |
| Legs, lower beak | `#E05F00` | `#FF8A33` | `--color-mascot-legs` |
| Crest, wings, tail plumes, neck ruff | `#8B46FF` | `#BD94FF` | `--color-mascot-accent` |

Current values are in `packages/tokens/tokens/themes/{light,dark}.json`. Rive cannot read CSS
variables, so pick colors that read well on both the light and the dark page background.

**Character notes.** Nos is a chubby, round, front-facing chibi ostrich. It has a long neck,
a small round head with two big googly eyes, rosy cheeks and three purple crest feathers. It
has a fluffy scalloped body, a big pale belly, purple wings and tail plumes, and long orange
legs with knobbly knees. Nos should look curious and kind, never mean. Panic is comic, not
scary.

**Accessibility.** The canvas is `aria-hidden`. The component supplies the accessible name and
the announcements, so do not bake text into the file. The `z` letters and `…` are
decoration. Users who prefer reduced motion always get the SVG.

**Runtime notes.** `@rive-app/canvas` is loaded with a dynamic `import()` only after the
`.riv` download succeeds. The runtime fetches its own WASM, from unpkg by default.

## Development

```sh
bun test packages/mascot                 # unit + integration (real bus, real timers, real HTTP server)
bun run --cwd packages/mascot typecheck  # svelte-check
bunx biome check packages/mascot
```

`src/rive-runtime.ts` is the only module not covered by `bun test`. It needs WebAssembly and
a real canvas, which happy-dom does not provide, so it is kept as thin glue: what happens on
`onLoad` and `onLoadError` lives in `settleRiveLoad` and `settleRiveFailure` (`src/rive.ts`),
which are unit-tested. A runtime or WASM failure also settles as a typed `load-failed`.
