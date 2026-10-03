# Nostr School

An interactive, static website that teaches [Nostr](https://github.com/nostr-protocol/nips) from
zero to "I could build a client". Twelve chapters (keys, events, relays, filters, kinds, the social
graph, private messages, zaps, remote signing, the ecosystem, trade-offs) are explorable
explanations: every concept has something to poke, such as a key forge, an event lab with live
signature checks, a filter playground, a gift-wrap envelope you peel layer by layer, and zap
receipts you can tamper with. Everything runs in the browser on real, signed fixture events; an
optional read-only **live mode** points the same widgets at public relays.

- English and Spanish (`/en/…`, `/es/…`), light and dark themes, reduced-motion aware
- WCAG 2.1 AA checked with axe in E2E; every widget is keyboard operable and narrated
- A glossary with hover cards, standalone tools (`/tools/keys`, `event-inspector`,
  `filter-playground`, `kinds`), and Nos the ostrich as a guide
- A NIP reference (`/nips/`): search every NIP by meaning or keyword, filter and browse, and
  open any NIP in an editor that shows, validates and explains the JSON it defines (see below)

See [PLAN.md](./PLAN.md) for the product plan and [CONTRACTS.md](./CONTRACTS.md) for package APIs,
conventions and ownership.

## Requirements

- [Bun](https://bun.com) 1.3.14+ (runtime, package manager and test runner)
- For E2E only: Playwright's Chromium, `bunx playwright install chromium`

## Quick start

```bash
bun install
bun run dev        # http://localhost:4321/understanding-nostr/en/
```

## Commands (run from the repo root)

| Command | What it does |
|---|---|
| `bun run dev` | Build design tokens, then start the Astro dev server |
| `bun run build` | Build tokens + the static site into `apps/site/dist` |
| `bun run preview` | Serve the built site |
| `bun run lint` / `bun run format` | Biome check / fix (lint + format, enforced) |
| `bun run typecheck` | `tsc` for TS packages, `svelte-check` for Svelte packages, `astro check` + `svelte-check` for the site |
| `bun run test` | Unit + integration tests (`bun test`, happy-dom, the real Svelte compiler, no mocks) |
| `bun run test:coverage` | Same, with a coverage table |
| `bun run test:e2e` | Build, then Playwright against the preview server + an in-memory test relay (4 projects: desktop, dark, reduced motion, mobile) |
| `bun run tokens` | Regenerate CSS/TS from the design tokens |
| `bun run snapshot:ecosystem` | Refresh chapter 11's ecosystem data (see below) |
| `bun run snapshot:nips` | Refresh the NIP reference corpus from nostr-protocol/nips (`-- --commit <sha>` to pin) |
| `bun run embed:nips` | Rebuild the NIP search embeddings (after a NIP snapshot) |

Unit/integration and E2E are deliberately separate commands. Scoped runs:

```bash
bun test packages/protocol                      # one package
bun run --cwd packages/ui typecheck             # one package's typecheck
cd apps/site && E2E_NO_RELAY=1 bunx playwright test --project=chromium chapters/02   # one spec, no relay
```

### Refreshing the ecosystem snapshot

The site never fetches statistics at runtime. Chapter 11 renders the committed snapshot
`apps/site/src/data/ecosystem.json`, and `bun run snapshot:ecosystem` rebuilds it:

- **Relays**: NIP-66 relay-discovery events (kind 30166), read from monitor relays.
  Only monitors that published a kind 10166 announcement are counted, and every signature is verified.
- **NIPs**: a tree-only clone of `nostr-protocol/nips`: file count, README list and kinds table,
  with git history for the growth curve.
- **Clients**: a hand-curated list.

If a source fails, the script keeps that section from the previous snapshot and marks it `stale`
with the raw error in `lastError`. That error is only for maintainers and is never rendered. If the
previous snapshot itself is unreadable or invalid, the script exits with code 1 instead of
silently starting from scratch. Review the diff and commit the JSON.

## The NIP reference

`/<locale>/nips/` lists every NIP in the pinned snapshot (99 at
`0046368a`): a static list that works without JavaScript, upgraded to instant keyword search,
search by meaning, filters (status, what it defines, kind, relay, has an editor, taught in the
course), sort and grid/list layouts, all mirrored in the query string (`?q=zaps&status=final`).
Query shortcuts: `57`, `nip-5a`, `kind:9735` or `kind 9735`, a bare registered kind (`9735`),
`#imeta`, and upper-case wire messages (`AUTH`, `NEG-OPEN`).

`/<locale>/nips/<id>/` shows one NIP: facts (status, kinds, tags, messages, related NIPs,
chapters that teach it), an interactive editor, and the specification text below it. The editor
is driven by a hand-written `NipSpec` per NIP (`packages/nips/src/specs/nip-<id>.ts`):

- **Form | JSON | Explain**: edit through typed inputs (relay URLs, pubkeys, kinds, timestamps,
  tag rows from templates) or directly in CodeMirror; both stay in sync. Validation runs on
  every change, lints the JSON in place, and each issue jumps to its field.
- **Explain** describes whatever the cursor is on (tag, field, content) in plain words.
- **How it works** walks through the NIP step by step and highlights the JSON each step talks
  about; flows chain parts (zap request → receipt).
- Events are signed with demo persona keys, never a real nsec; the state is shareable via
  `#edit=…`.

Every NIP has a spec (99, none left as `todo`): event 76, process 8, encoding 5, message 5, http 3, document 2 (variant =
what the NIP primarily defines; some add secondary parts such as NIP-42's kind 22242 event).

### Refreshing the NIP snapshot and search model

```bash
bun run snapshot:nips -- --commit <sha>   # clone nostr-protocol/nips → packages/nips/src/data/{corpus,index}.json
bun test packages/nips                    # new NIP ids fail until they get a spec + strings
bun run embed:nips                        # re-embed passages with the same model (needed after a snapshot or summary edit)
bun run embed:nips -- --check             # CI-style: exits 1 when model files or embeddings are stale
```

**Model hosting.** Search by meaning runs `Xenova/all-MiniLM-L6-v2` (quantized ONNX) in a Web
Worker on the visitor's device. The model (~23 MB) and the CPU-only ONNX runtime wasm (~14 MB)
are committed under `apps/site/public/models/` and served from the site itself: no third-party
network calls, `allowRemoteModels = false`. `embed:nips` downloads missing model files once at a
pinned revision (SHA-256 checked) and embeds with the same model in Bun, so query and passage
vectors match. The model loads on first search or focus, never on page load, and is skipped
offline or with Save-Data; keyword search always works.

## Architecture

A Bun-workspace monorepo. Packages are scoped `@nostrschool/*`, and under Bun's isolated linker a
package can import only what its own `package.json` lists (the dependency table is in
CONTRACTS.md §0).

```
apps/site            Astro 7 static site: pages, layouts, MDX chapters (en, es), chapter components
packages/tokens      DTCG design tokens → CSS custom properties + typed TS (every color/space/radius/…)
packages/i18n        Locales, typed dictionaries (es must match en's shape), glossary
packages/protocol    Nostr as small, step-exposing pure functions returning Result (NIP-01/04/13/19/44/57/59…)
packages/fixtures    Personas, fake relays and deterministically signed real events
packages/data        DataSource: fixture mode (default) or read-only live mode against relays
packages/test-relay  In-memory NIP-01 relay used by tests and E2E live mode
packages/ui          Svelte 5 primitives (Term, Quiz, Drawer, Tabs, JsonView, VisuallyHidden, …), mascot event bus, motion
packages/diagrams    Animated protocol diagrams (SequenceDiagram, Swimlane, Pipeline, ForceGraph, Packet)
packages/charts      Token-themed, keyboard-explorable charts (bar, line, donut, treemap, stat tile)
packages/mascot      Nos the ostrich: Rive when an asset is present, SVG otherwise
packages/nips        NIP corpus snapshot, NipSpec schema + one spec per NIP, validator, browse helpers
packages/nip-search  Hybrid NIP search: instant keyword + on-device semantic (self-hosted model)
packages/nip-editor  Spec-driven NIP editor: form, CodeMirror JSON with lint, explanations, walkthrough
tooling/             bun test preload (happy-dom + Svelte compiler plugin)
scripts/             Build-time scripts (ecosystem and NIP snapshots, NIP embeddings)
```

How a page is built: an MDX chapter (`apps/site/src/content/chapters/<locale>/NN-slug.mdx`)
imports Svelte islands from `apps/site/src/components/chapters/NN-slug/`. Those islands compose
`ui`, `diagrams`, `charts` and `mascot` components and call `protocol` for the real cryptography,
reading events through `data` (fixtures by default). All user-visible strings come from `i18n`;
all styling comes from `tokens`. Islands talk to Nos through a typed event bus
(`emit("signature:valid", …)`) instead of importing the mascot.

Conventions that hold everywhere: TypeScript `strict` (no `any`, no `!`), errors modelled as
`Result` values (no silent catches), `data-testid` on interactive elements with `chNN-` prefixes
inside chapters, and no mocks in tests.

## Adding a chapter

1. **Register it.** Append the slug to `CHAPTER_SLUGS` in `apps/site/src/lib/chapters.ts` (order =
   position), and raise `order`'s `max` in `apps/site/src/content.config.ts`.
2. **Strings.** Create `packages/i18n/src/locales/en/chapters/NN.ts` exporting `chNN` and add it
   to `locales/en/index.ts`. Add the same keys to `locales/es/chapters/NN.ts` (and its index). An
   untranslated string may stay English with a `// TODO(es)` marker. The `typeof en` types make
   `bun run typecheck` fail until both locales match.
3. **Content.** Write `apps/site/src/content/chapters/en/NN-<slug>.mdx` with the frontmatter
   schema from `content.config.ts` (`order, slug, title, summary, estimatedMinutes, nips,
   takeaways, mascotIntro?`). Use `<Term id="…" locale="en">` for glossary words,
   `<Drawer title="Under the hood: …">` for developer detail, and a `## Quick check` section of
   `<Quiz>`es with varied correct-answer positions. Add `es/NN-<slug>.mdx`. A missing translation
   falls back to English with a notice.
4. **Widgets.** Put Svelte islands in `apps/site/src/components/chapters/NN-<slug>/`, with
   `data-testid="chNN-…"`, pure logic in `.ts` files, and `components.test.ts` / `logic.test.ts`
   beside them.
5. **E2E.** Add `apps/site/e2e/chapters/NN.spec.ts`. Use `expectNoA11yViolations(page)` from
   `e2e/helpers/a11y.ts` and `useLiveTestRelay(page)` if you exercise live mode.
6. **Glossary.** For a new term, add its id to `packages/i18n/src/glossary/ids.ts`, its entry to
   `glossary/en.ts` and `glossary/es.ts`, and its chapter to `GLOSSARY_CHAPTERS`.
   `glossary/chapters.test.ts` checks that the mapped chapter actually mentions it.

## Adding a locale

1. In `packages/i18n/src/locales.ts`, add the code to `LOCALES`, `LOCALE_NAMES` and `LOCALE_TAGS`.
2. Copy `packages/i18n/src/locales/es/` and `src/glossary/es.ts` to the new code, translate them,
   and register both in `packages/i18n/src/index.ts`. The maps are `Record<Locale, …>`, so the
   compiler lists what is missing.
3. In `apps/site/astro.config.ts`, add the locale to `i18n.locales` and to the sitemap `locales`
   map.
4. Add `apps/site/src/content/chapters/<code>/`. Untranslated chapters fall back to English.
5. Run `bun run typecheck && bun run test`. Parity tests fail on any missing or extra key.

Details and runnable snippets: [packages/i18n/README.md](./packages/i18n/README.md).

## Dropping in the Rive mascot

Nos ships as an SVG with seven poses. A designer-made Rive file replaces it with no code changes:

1. Build the `.riv` to the spec in
   [packages/mascot/README.md § Rive asset spec](./packages/mascot/README.md#rive-asset-spec-for-illustrators):
   200 × 220 artboard, a state machine named `Mascot` that autoplays, a Number input `pose` (0–6,
   in `MASCOT_POSES` order) and a Trigger input `bounce`, with colors matched to the mascot tokens.
2. Save it as `apps/site/public/mascot/ostrich.riv`.
3. In `apps/site/src/lib/href.ts`, set `RIVE_SHIPPED` to `true`, then rebuild. Until then
   `mascotRive` is empty on purpose, so visitors never request a missing file and see a 404 in
   the console.

Every `<Mascot>` (home, 404, chapter intros, ch03, ch12) already spreads `{...mascotRive}`. If the
file is unreachable, isn't a Rive file or lacks an input, the mascot falls back to the SVG with a
typed error and never shows a blank box. Reduced motion always uses the SVG. Once a real asset
exists, add a Playwright check of the `data-renderer="rive"` path in `apps/site/e2e`.

## Deploy

`.github/workflows/deploy.yml` publishes `apps/site/dist` to GitHub Pages with
`BASE_PATH=/<repo-name>`. Locally the base path defaults to `/understanding-nostr`.
`.github/workflows/ci.yml` runs lint, typecheck, tests and E2E.
