# Nostr School — Build Plan

An interactive, static website that teaches Nostr through explorable explanations:
you learn by poking at real protocol mechanics (keys, hashes, signatures, relays)
running live in your browser.

## 1. Product decisions (agreed)

| Decision | Choice | Consequence |
|---|---|---|
| Audience | Layered: newcomers + developers | Every section has a plain-language track and an expandable **"Under the hood"** drawer (JSON, NIP refs, code) |
| Format | Course + reference | 12 linear chapters **and** standalone `/tools/*` pages; the same components power both |
| Live data | Opt-in live mode | Fixture data by default (deterministic, testable); a "Go live" toggle swaps in real relays via one `DataSource` interface |
| Look & feel | Playful / vivid | Bold color tokens, spring physics, an animated ostrich mascot that reacts to user actions |
| Brand scope | `@nostrschool/*` | |
| v1 scope | All 12 chapters | Delivered in milestones; each milestone is deployable |
| Mascot | Rive (animated) | Needs illustrated assets; we ship a static-SVG placeholder until they exist |
| Hosting | GitHub Pages | Deploy via GitHub Actions; handle the repo `base` path |
| Extras | i18n, light + dark theme | Both are token/dictionary driven from day one |

## 2. Curriculum

Each chapter = narrative (MDX) + **one centerpiece interactive** + "Under the hood" drawers + a takeaway card + a mini-quiz.

| # | Chapter | Centerpiece interactive | Visual type |
|---|---|---|---|
| 1 | Why Nostr? | Topology sandbox: centralized vs federated vs relay-based; click to "kill" a server, watch who loses access | Animated network diagram |
| 2 | Identity is a keypair | Generate keys live; hex → bech32 (`npub`/`nsec`) transformation animated character-by-character | Step animation |
| 3 | Anatomy of an event | Exploded JSON card; edit `content`, watch serialize → SHA-256 `id` → Schnorr `sig` recompute; tamper a byte → verification fails | Pipeline diagram |
| 4 | Relays & the wire protocol | Packets (`REQ`, `EVENT`, `EOSE`, `OK`, `CLOSE`, `NOTICE`) fly between client and several relays; step/play/scrub | Animated sequence diagram |
| 5 | Filters | Visual filter builder; matching events light up in a sample set | Interactive query UI |
| 6 | Kinds & NIPs | "Periodic table" of event kinds; filter by category, click for anatomy + NIP link | Grid explorer |
| 7 | The social graph | Force-directed follow graph (kind 3); outbox model (NIP-65) shows how clients locate your relays | Force graph + flow |
| 8 | Private messages | Nested envelopes: NIP-04 → NIP-44 → NIP-17 gift wrap (rumor → seal → wrap), peel layers interactively | Layered animation |
| 9 | Zaps | Lightning invoice ↔ LNURL server ↔ zap request/receipt (NIP-57) flow | Swimlane diagram |
| 10 | Signing & login | NIP-07 extension and NIP-46 remote signer: show the key never leaves the signer | Sequence diagram |
| 11 | The ecosystem | Relay counts, client landscape, NIP adoption over time | Charts (bar, line, treemap) from a build-time snapshot |
| 12 | Trade-offs | Spam, discovery, relay economics, key loss; honest pros/cons | Comparison matrix + scenario toggles |

### Reference section (`/tools`, `/reference`)
- **Event inspector**: paste any event JSON, validate id/sig, explain each field
- **Key tool**: generate / convert hex ↔ npub/nsec/nprofile/nevent (NIP-19)
- **Filter playground**: build filters, run against fixtures or live relays
- **Kinds table**: searchable, standalone version of chapter 6
- **Glossary**: every term; the same entries power inline hover-cards site-wide

## 3. UX & interaction system

- **Chapter rail**: sticky progress indicator, completion checkmarks (localStorage, try/catch guarded)
- **Glossary hover-cards**: `<Term id="relay">` anywhere → definition popover + link to glossary
- **"Under the hood" drawer**: remembers user preference ("always expand for me")
- **Live-mode toggle**: global, clearly signposted (🔴 LIVE badge), read-only in v1 (we never publish to relays)
- **Mascot reactions**: driven by a typed event bus (`signature:valid`, `signature:invalid`, `chapter:complete`, …)
- **Microinteractions**: springy buttons, copy-to-clipboard confetti, hash characters "rolling" on recompute
- **Motion policy**: everything respects `prefers-reduced-motion` (instant state changes, no loss of information)
- **Accessibility**: keyboard-operable diagrams, text alternatives/live regions for every animation, WCAG AA contrast in both themes
- **Safety copy**: generated keys are labeled demo keys; clear "never paste your real nsec here" guidance

## 4. Architecture

### Stack
- **Astro** (static output, MDX content collections, built-in i18n routing, islands so only interactive parts ship JS)
- **TypeScript** maximum strictness; **Bun** runtime / package manager / test runner
- **Island framework**: Svelte 5 (proposed — see open questions)
- **nostr-tools**: real crypto + NIP-19 encoding; we wrap it to expose *intermediate steps* for teaching
- **D3** (scales, force simulation, shapes) for graphs and charts; diagrams as hand-built SVG components
- **Motion** for UI/micro animations; **Rive** web runtime for the mascot
- **Style Dictionary** to compile design tokens → CSS custom properties (light + dark)
- **Biome** for lint + format (one tool instead of ESLint + Prettier)
- **Playwright** for E2E, visual regression and axe accessibility checks

### Monorepo layout

```
apps/
  site/                      Astro site (pages, layouts, MDX chapters per locale)
packages/
  tokens/     @nostrschool/tokens     DTCG token JSON → CSS vars + typed TS exports
  protocol/   @nostrschool/protocol   Pure, step-exposing wrappers: serialize, hash, sign, verify, filter-match, NIP-19, NIP-44
  fixtures/   @nostrschool/fixtures   Deterministic personas (Alice, Bob, Carol…) + curated events, relays, follow graph
  data/       @nostrschool/data       DataSource interface: FixtureSource | LiveRelaySource (WebSocket, read-only)
  ui/         @nostrschool/ui         Primitives: Button, Card, Drawer, Term, Toggle, Quiz, CodeBlock, Takeaway
  diagrams/   @nostrschool/diagrams   SequenceDiagram, Topology, Envelope, ForceGraph, Pipeline, Swimlane
  charts/     @nostrschool/charts     Token-themed chart components on D3
  mascot/     @nostrschool/mascot     Rive wrapper with typed state-machine inputs + SVG fallback
  i18n/       @nostrschool/i18n       Typed dictionaries; missing keys fail typecheck
scripts/
  snapshot-ecosystem.ts      Build-time fetch of ecosystem stats → committed JSON (chapter 11)
```

Each package has its own README with runnable examples.

### Key design ideas
- **Protocol lib exposes steps, not just results.** For example `computeEventId(e)` returns
  `{ serialized, bytes, hash }` so the UI can animate each stage. Pure functions, typed `Result` errors.
- **One `DataSource` interface.** Components never know whether data is fixture or live, so
  every component is testable with real fixture data and no mocks.
- **Content vs. components.** Chapters are MDX per locale; interactives are locale-agnostic
  components that take strings from `@nostrschool/i18n`.

## 5. Design system

- Token categories: color (brand, semantic, diagram-specific like `packet.req`, `packet.event`),
  typography, spacing, sizing, radius, border width, opacity, elevation, motion (durations,
  spring presets), z-index, breakpoints
- Playful palette: a vivid purple primary (Nostr's community color) + warm secondary + high-saturation accents per event-kind category
- Dark theme via `@media (prefers-color-scheme)` + manual toggle override (`data-theme`)
- Diagram & chart colors come from the same tokens, so both themes are handled in one place
- Every interactive element has a `data-testid`

## 6. Internationalization

- Astro i18n routing: `/en/...`, `/xx/...` with English as default
- MDX chapter content per locale; UI strings in typed dictionaries
- Fallback to English for untranslated chapters with a visible "not yet translated" notice
- Diagrams/charts take labels via props so they translate for free
- Languages for v1: **TBD** (see open questions)

## 7. Testing strategy

| Layer | Tool | Command | Covers |
|---|---|---|---|
| Unit | `bun test` | `bun run test` | protocol, data, i18n, tokens, chart scales; target 100% |
| Integration | `bun test` + Astro container API | `bun run test` | component rendering with fixture DataSource, i18n completeness |
| E2E | Playwright | `bun run test:e2e` | user journeys per chapter, live-mode toggle against a local test relay, axe a11y, visual regression in both themes and reduced-motion |

No mocks: fixtures are real signed events; live-mode E2E runs against a local relay
started in CI (e.g. a containerized relay) rather than a fake.

## 8. Quality budgets
- Lighthouse ≥ 95 in all categories per page
- JS per chapter page ≤ ~150 KB gz (excluding the Rive runtime, which is lazy-loaded)
- No layout shift from islands hydrating (reserved dimensions)
- Zero axe violations

## 9. Milestones (each ends with a deployed site)

| M | Deliverable |
|---|---|
| **M0 Foundations** | Monorepo, Bun workspaces, strict TS, Biome, tokens → CSS, light/dark, i18n scaffold, Astro shell, CI (lint, typecheck, test, e2e) + GitHub Pages deploy |
| **M1 Design system** | UI primitives, chapter layout, chapter rail, Term hover-cards, Under-the-hood drawer, Quiz, Takeaway, mascot SVG placeholder + event bus |
| **M2 Protocol & data** | `protocol`, `fixtures`, `data` packages with full test coverage; local test relay for E2E |
| **M3 Vertical slice** | Chapters 1–3 + Key tool + Event inspector, polished end-to-end. **Review gate**: lock patterns before scaling |
| **M4** | Chapters 4–6 + Filter playground + Kinds table |
| **M5** | Chapters 7–10 (force graph, envelopes, swimlanes, signer flows) |
| **M6** | Chapters 11–12 + ecosystem snapshot script + charts package |
| **M7 Mascot** | Rive integration with state machine wired to the event bus |
| **M8 Launch polish** | Translations, a11y audit, performance pass, OG images per chapter, sitemap, 404 |

## 10. Risks
- **Rive assets** need an illustrator; mitigated by an SVG fallback that ships first
- **Live relays** are flaky/unmoderated; read-only, opt-in, with timeouts and content-type filtering
- **Protocol drift**: NIPs evolve; each chapter cites NIP revisions, plus a "last verified" date
- **Scope**: 12 chapters × N locales; the M3 review gate keeps patterns cheap to replicate

## 11. Open questions
1. Island framework: Svelte 5 (proposed) vs React vs Solid
2. Which languages besides English for v1?
3. Mascot art: do you have an illustrator, or should I source/commission direction?
4. Ecosystem data source for chapter 11 (which public relay/NIP stats API to trust)
5. GitHub repo name/owner (affects the Pages `base` path)
