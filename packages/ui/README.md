# @nostrschool/ui

Svelte 5 (runes) primitives, the mascot event bus, motion helpers and riso-style microinteractions
for Nostr School. Everything is styled with `@nostrschool/tokens` CSS variables only (light + dark
themes come for free), honors `prefers-reduced-motion`, is keyboard operable, and carries
`data-testid`s (`testid` prop + documented `${testid}-<part>` ids, see `src/types.ts`).

Text comes from `@nostrschool/i18n` through the `locale` prop, so components never hard-code copy.

## Components

| Component | What it does | Test-id parts |
|---|---|---|
| `Button` | primary/secondary/ghost/danger, sizes, `loading`, `pressed` (toggle), `href` (link); riso press: hover lifts off a hard ink shadow, press collapses it (pure CSS) | `-spinner` |
| `Card` | plain/raised/outlined/highlight surface with `header`/`footer` snippets | `-header -footer` |
| `Drawer` / `UnderTheHood` | "Under the hood" disclosure; "Always expand for me" persists in localStorage | `-toggle -content -always` |
| `Term` | inline glossary link + hover/focus card (Escape closes, hoverable); on touch the first tap opens the card, a second tap or a tap outside closes it, "Read more" navigates | `-card -more` |
| `Toggle` | accessible switch (`role="switch"`) | `-input` |
| `Tabs` | WAI-ARIA tabs, arrows/Home/End, skips disabled tabs | `-tab-<id> -panel` |
| `CodeBlock` | token-colored JSON/TS/JS/bash, highlighted lines, copy with confetti | `-caption -copy -line-<n>` |
| `JsonView` | collapsible JSON tree, highlight + select paths like `"tags.0.1"` | `-root -path-<path> -toggle-<path> -select-<path> -summary-<path>` |
| `Callout` | info/tip/warning/danger/safety note | `-title` |
| `Takeaway` | "Key takeaways" card | `-point-<i>` |
| `Quiz` | single/multiple choice, feedback, retry; emits `quiz:correct`/`quiz:wrong` | `-option-<id> -check -feedback -retry -explanation-<id>` |
| `CopyButton` | clipboard copy with typed error handling and optional confetti | `-status` |
| `Badge` | tones incl. `live` and kind categories | — |
| `Stepper` | clickable steps (`aria-current="step"`), arrow-key focus | `-step-<id>` |
| `PlaybackControls` | play/pause/step/scrub/speed for diagrams (owns no timer) | `-play -back -forward -reset -scrub -speed -status` |
| `Tooltip` | plain-text tooltip on hover/focus, Escape dismisses | `-content` |
| `VisuallyHidden` | screen-reader-only text (`as="span"\|"div"\|…`, attrs pass through): `<VisuallyHidden role="status">Copied</VisuallyHidden>` | — |

## Usage

```svelte
<script lang="ts">
  import {
    Button, CodeBlock, Drawer, JsonView, PlaybackControls, Quiz, Tabs, Term, emit,
  } from "@nostrschool/ui";

  let step = $state(0);
  let playing = $state(false);
  const event = { kind: 1, tags: [["p", "ab12…"]], content: "gm" };
</script>

<p>Your note travels through <Term id="relay" locale="en" glossaryHref="/en/glossary/#relay">relays</Term>.</p>

<Button testid="ch02-generate" onclick={() => emit("keys:generated", { pubkey: "ab12…" })}>
  Generate keys
</Button>

<Drawer testid="ch03-uth-json" locale="en">
  <JsonView testid="ch03-json" locale="en" value={event} highlightPaths={["tags.0.1"]}
    onselectpath={(path) => console.log("explain", path)} />
</Drawer>

<CodeBlock testid="ch03-code" locale="en" lang="json" caption="A kind-1 note"
  code={JSON.stringify(event, null, 2)} highlightLines={[2]} />

<Tabs testid="ch02-format" label="Key format" tabs={[{ id: "hex", label: "Hex" }, { id: "npub", label: "npub" }]}>
  {#snippet panel(id)}<p>Showing {id}</p>{/snippet}
</Tabs>

<PlaybackControls testid="ch04-playback" locale="en" totalSteps={5} bind:step bind:playing speed={1} />

<Quiz testid="ch02-quiz" locale="en" question="Who holds your nsec?"
  options={[
    { id: "you", label: "Only you", correct: true, explanation: "It never leaves your device." },
    { id: "relay", label: "The relay", correct: false, explanation: "Relays only see public data." },
  ]} />
```

## Event bus, motion and actions

```ts
import { animate } from "motion";
import { $reducedMotion, mascotBus, pop, spring, squish, tween } from "@nostrschool/ui";

const off = mascotBus.on("quiz:wrong", ({ quizId }) => console.log("wrong answer in", quizId));
animate(document.body, { scale: [0.98, 1] }, spring("bouncy")); // { duration: 0 } under reduced motion
console.log(tween("fast"), $reducedMotion.get());
off();
```

```svelte
<!-- Reuse the same microinteractions in your own components. -->
<script lang="ts">
  import { pop, shake, squish } from "@nostrschool/ui";
</script>

<button use:squish>Firm press</button>
<p use:pop>Pops in</p>
```

## Pure helpers

```ts
import { copyText, gradeQuiz, highlightLines, resolveTerm, toJsonTree, viewportShift } from "@nostrschool/ui";

const copied = await copyText("npub1…");           // Result<void, { code: "unavailable" | "write-failed" }>
if (!copied.ok) console.warn(copied.error.code);

resolveTerm("es", "relay");                         // { status: "ok", term, short, source } | { status: "pending", term }
toJsonTree({ tags: [["p", "x"]] });                 // tree with paths "tags", "tags.0", "tags.0.1"
highlightLines('{"kind": 1}', "json");              // tokens per line → --color-code-* classes
gradeQuiz([{ id: "a", label: "A", correct: true }], ["a"]); // true
viewportShift(299, 280, 375, 16);                   // -220: px to slide a popover back on-screen
```

`Result` without loading any components (used by mascot and charts, which don't depend on protocol):

```ts
import { err, ok, type Result } from "@nostrschool/ui/result.ts";

const half = (n: number): Result<number, string> => (n % 2 === 0 ? ok(n / 2) : err("odd"));
console.log(half(4)); // { ok: true, value: 2 }
```

## Notes

- **Glossary gaps**: `Term` reads `getGlossaryEntry(locale, id)`. If the locale has no definition it
  falls back to English; if there is none at all it renders a "pending" card with the term name and
  the glossary link (`data-status="pending"`), never a blank card or a crash.
- **Always expand**: `$alwaysExpandDrawers` (localStorage `nostrschool:always-expand`). Turning it on
  opens every drawer on the page; turning it off never collapses what the reader has open.
- **Look**: the "riso field notebook" brand (CONTRACTS.md §2 Brand). Every surface has a 1.5px ink
  outline (`--color-border-strong`); orange/teal/blue are outlined fills with ink text, never lines
  or text; "selected" is ink outline + `--shadow-accent`; hit areas are ≥ `--size-touch-target` on
  touch (`@media (pointer: coarse)`), hover effects only apply under `@media (hover: hover)`, and
  form controls use ≥16px text so iOS doesn't zoom.
- **Confetti** is flat paper squares in the riso inks, resolved from the live theme tokens; it is skipped under reduced motion or
  when tokens CSS isn't loaded. `canvas-confetti` is lazy-loaded so it never ships in SSR.
- **Syntax highlighting** is a tiny synchronous lexer (`src/lib/highlight.ts`), not Shiki: Shiki is
  async (WASM + grammars), which Svelte SSR can't await and which would bloat every island.

## Scripts

```sh
bun test packages/ui                  # unit + component tests (happy-dom, real Svelte runtime)
bun test --coverage packages/ui
bun run --cwd packages/ui typecheck   # svelte-check
bunx biome check packages/ui
```
