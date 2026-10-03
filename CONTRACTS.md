# Nostr School — Contracts (source of truth)

Read this before touching anything. It defines the public APIs, conventions, commands and
**file ownership** for every agent working in parallel. The canonical signatures are the source
files linked below; this document copies them so you can code against them without reading
every file. If the code and this document disagree, the code wins — report it under
"CONTRACT ISSUES".

---

## 0. Stack & versions (installed — do NOT run `bun install`/`bun add`)

| Thing | Version | Notes |
|---|---|---|
| Bun | 1.3.14 | runtime, package manager, test runner. **Isolated linker**: a package can only import deps listed in its *own* `package.json` (no transitive imports). |
| TypeScript | 6.0.3 | NOT 7.x: TS 7 (native) has no JS API, which `svelte-check`/`astro check` need. |
| Astro | 7.3.5 (Vite 8) | content layer (`src/content.config.ts`, `glob` loader), `astro/zod` (zod 4) |
| Svelte | 5.57 | runes only (`$props`, `$state`, `$derived`, `$effect`, `$bindable`) |
| @astrojs/mdx 8, @astrojs/svelte 9, @astrojs/sitemap 3.7, @astrojs/check 0.9 | | |
| nostr-tools 2.25, @noble/hashes 2.4, @noble/curves 2.4, @noble/ciphers 2.x, @scure/base 2.4 | | noble v2 import paths end in `.js`: `@noble/hashes/sha2.js`, `@noble/curves/secp256k1.js` |
| d3 7.9 (+@types/d3), motion 14 (`import { animate } from "motion"`), nanostores 1.5, @nanostores/persistent 1.3 | | |
| @rive-app/canvas 2.44, canvas-confetti 1.9, style-dictionary 5.5 | | |
| Biome 2.5, Playwright 1.63 (+ Chromium installed), @axe-core/playwright 4.13, happy-dom 20, @testing-library/svelte 5.4 | | |
| Fonts | @fontsource-variable/{bricolage-grotesque,jetbrains-mono} | self-hosted, imported in `apps/site/src/styles/global.css` (Bricolage via `opsz.css`: wght + optical size). No Google Fonts calls. |

Who has which dependency (you may only import these from your package):

| Package | Dependencies |
|---|---|
| `@nostrschool/tokens` | (dev) style-dictionary |
| `@nostrschool/i18n` | — |
| `@nostrschool/protocol` | nostr-tools, @noble/hashes, @noble/curves, @noble/ciphers, @scure/base |
| `@nostrschool/fixtures` | protocol, nostr-tools, @noble/hashes |
| `@nostrschool/data` | protocol, fixtures, @nanostores/persistent (test-relay as dev) |
| `@nostrschool/test-relay` | protocol, fixtures |
| `@nostrschool/ui` | tokens, i18n, protocol, svelte, motion, nanostores, @nanostores/persistent, canvas-confetti (+types) |
| `@nostrschool/diagrams` | tokens, ui, i18n, protocol, svelte, d3 (+types), motion |
| `@nostrschool/charts` | tokens, ui, i18n, svelte, d3 (+types) |
| `@nostrschool/mascot` | ui, i18n, svelte, @rive-app/canvas, motion, nanostores |
| `@nostrschool/site` | all packages above (test-relay as dev), astro + integrations, svelte, nanostores, fonts, playwright, axe |
| root (tooling) | typescript, biome, happy-dom, @happy-dom/global-registrator, @testing-library/svelte, svelte, svelte-check, @types/bun, playwright, axe |

Need something else? Don't install it — list it under **NEEDS** in your final report.

---

## 1. Commands

Run from the **repo root** (or from a package root — each package has a `bunfig.toml`; running
`bun test` from a sub-directory like `src/` skips the preload and Svelte tests will fail).

| Command | Scope |
|---|---|
| `bun test packages/<pkg>` / `bun test apps/site` | your tests only (unit + integration) |
| `bun test --coverage packages/<pkg>` | coverage for your package |
| `bun run --cwd packages/<pkg> typecheck` | `tsc --noEmit` (TS pkgs) or `svelte-check` (ui, diagrams, charts, mascot) |
| `bunx biome check <your paths>` / `bunx biome check --write <your paths>` | lint + format your files |
| `bun run --cwd packages/tokens build` | regenerate tokens (tokens owner only) |

Full-repo commands (integrator / CI only — they race with other agents): `bun run typecheck`,
`bun run lint`, `bun run test`, `bun run build`, `bun run test:e2e`.
Agents must NOT run `astro build`, `astro dev`, `astro preview` or Playwright.

`bun test` loads `tooling/test-preload.ts`: happy-dom globals + a Bun plugin compiling `.svelte`
and `.svelte.ts` files with the real Svelte compiler (client mode), so components render in tests.
`**/e2e/**` is excluded from `bun test`. Tests use **no mocks**: real crypto, real fixtures, the
real test relay. Render components with `@testing-library/svelte` (`render`, `fireEvent`, `cleanup`);
snippets in tests via `createRawSnippet` from `svelte`.

---

## 2. Global conventions

### TypeScript
`tsconfig.base.json`: `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`,
`noPropertyAccessFromIndexSignature` (use `obj["key"]` for index signatures, e.g. `process.env["X"]`),
`noUnusedLocals/Parameters`, `verbatimModuleSyntax` (use `import type`), `allowImportingTsExtensions`.
No `any`, no non-null `!` (Biome errors on both). Relative imports include the `.ts` extension.

### Errors: `Result<T, E>`
From `@nostrschool/protocol` (`src/result.ts`) — use it everywhere, not only in protocol:

```ts
type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };
interface ProtocolError<C extends string = string> { readonly code: C; readonly message: string }
ok(value); err(error); fail(code, message); isOk(r); isErr(r);
mapResult(r, f); flatMapResult(r, f); unwrap(r) // unwrap: tests/scripts only
```
Validate inputs at boundaries; no silent `catch` — if you must catch, handle explicitly
(return an `err`, or `console.warn` + documented fallback).

### data-testid
Every interactive/UI element gets `data-testid`. Chapter components prefix with `chNN-`
(e.g. `ch02-generate-button`). Primitive components take a `testid` prop and derive part ids
`${testid}-<part>` (listed in each props interface). Shell: `site-header`, `nav-learn`,
`locale-en`, `chapter-title`, … (see layouts).

### Styling = tokens only
No raw colors/spacing/radii/durations/z-index in components. In CSS use `var(--…)`; in TS/SVG/D3
use `vars.*` from `@nostrschool/tokens` (theme-aware `var()` strings) or `tokens.*` when JS needs a
number (durations ms, breakpoints px). Svelte components use scoped `<style>` with vars.
Breakpoints can't be CSS vars inside `@media`: write the px from `tokens.breakpoint` (sm 480,
md 768, lg 1024, xl 1280) with a comment, or use `mediaUp("md")` in TS.

### Brand: "riso field notebook" (design rules — read before styling anything)
A printed zine / field notebook, not a SaaS landing page.
- **Paper + ink.** Page is `--color-bg` (paper), cards `--color-surface` (paper-2, one sheet darker),
  popovers/inputs `--color-surface-raised` (brightest sheet), wells/code `--color-surface-sunken`.
  Text is ink (`--color-text`, `-muted`, `-subtle`).
- **Ink lines.** Cards, buttons, inputs, chips and every coloured fill get a
  `var(--border-width-medium) solid var(--color-border-strong)` outline (1.5px ink). `--color-border`
  is only a soft hairline/divider.
- **Hard offset shadows** (riso misregistration): `--shadow-pop` (3px ink), `--shadow-pop-sm`,
  `--shadow-accent` (3px orange, featured/selected), `--shadow-lift` (hover), `--shadow-pressed` (active).
  Microinteraction recipe: hover = `translate: calc(var(--size-lift) * -1) calc(var(--size-lift) * -1)`
  + `--shadow-lift`; active = translate by the pop offset + `--shadow-pressed` (the shadow collapses),
  `var(--motion-duration-press) var(--motion-easing-press)`.
- **One fluorescent orange.** `--color-primary` (#FF5C39) is a FILL for the main action/selected
  state, always outlined and always with `--color-on-primary` (ink) text. It is only 2.7:1 on paper,
  so it is **never** a text colour, line, icon stroke or sole state indicator — use
  `--color-text-primary` (accent ink) for orange text/strokes and `--color-border-strong` +
  `--shadow-accent` for "selected". Same for `secondary` (teal) and `accent` (riso blue): fills only;
  `text-secondary` / `text-accent` for text and strokes.
- **Ink text on bright fills**: every `--color-on-*` is ink in both themes.
- **Textures**: paper grain is global (body::before). `.halftone` (or `--pattern-halftone` with
  `background-size: var(--size-halftone-cell) var(--size-halftone-cell)`) for illustration fills;
  `mark` / `.highlight` (`--pattern-highlight`) for highlighter emphasis; `.eyebrow` for mono caps labels.
  These three hard-stop patterns are the ONLY allowed `*-gradient()` uses.
- **Shape**: radii are small (`sm` 2px, `md` 4px, `lg` 6px, `xl` 10px). `--radius-pill` only for
  tags/chips/toggles' track, never for buttons or cards.
- **Type**: Bricolage Grotesque (display + body; headings `--font-weight-bold`/`black`,
  `--font-letter-spacing-display` at 4xl+), JetBrains Mono for code, ids, labels, packets.
  Sizes `lg`+ are fluid `clamp()`; don't add your own `vw` sizes.
- **Don't**: purple/violet/indigo (a test rejects any emitted colour at hue 235°–320°), gradients
  (except the three patterns above), `backdrop-filter`/blur, glows, neon, blurred `box-shadow`,
  `text-shadow`, decorative emoji (✨🚀🎉…), and copy clichés ("unlock", "dive in", "embark",
  "seamless", "revolutionize", "journey"). Functional symbols (✓ ✗ ⚡ for zaps) are fine.
- **Mobile**: design at 360px first; no horizontal page scroll (long ids use
  `overflow-wrap: anywhere`; tables/pre scroll inside themselves); hit areas ≥ `--size-touch-target`.

### Motion & reduced motion
Use `@nostrschool/ui` motion helpers. Under reduced motion every animation becomes an instant
state change; no information may be lost. CSS durations already collapse to `0ms` via tokens.

### Accessibility
Keyboard operable; visible focus (`--color-focus-ring`); animated diagrams narrate via
`aria-live="polite"`; charts have data-table fallbacks; WCAG AA (tokens' contrast is tested).
Reserve island height (no layout shift) — e.g. `min-height: var(--size-diagram-min-height)`.

### i18n
Components are locale-agnostic: take `locale: Locale` and read
`getDictionary(locale).chapters.chNN` / `.ui` / `.common` … Never hard-code user-visible text.
English is the source of truth; `es` files are typed `typeof en…`, so a missing/extra key fails typecheck.
**Adding a key** to an `en` file you own? Also add the same key to the matching `es` file with the
English text and a `// TODO(es)` comment (a minimal, additive edit — never rewrite the es file).
That is the only edit non-translators may make in `es` files.

### Live data
Read-only. Never publish. Live mode is opt-in via `$liveMode`.

---

## 3. Package APIs

### 3.1 `@nostrschool/tokens` (implemented) — `packages/tokens`
Source JSON: `tokens/base/{palette,typography,layout,motion,pattern}.json`, `tokens/themes/{light,dark}.json`.
Generated (committed, don't edit): `src/generated/tokens.{css,ts}`. The raw palette (riso inks) is
private and never emitted. Brand rules: §2 "Brand".

```ts
import "@nostrschool/tokens/tokens.css";               // CSS (site global.css does this)
export const tokens;      // raw base values: tokens.space.md "16px", tokens.motion.duration.fast 120, tokens.motion.spring.bouncy {stiffness,damping,mass}, tokens.breakpoint.md 768, tokens.pattern.grain "url(…)"
export const themes;      // themes.light.color.primary "#FF5C39", themes.dark.color.primary "#FF6A48" …
export const vars;        // vars.color.packetReq "var(--color-packet-req)", vars.space.md, vars.motion.spring.bouncy.stiffness …
export const cssVarNames; // readonly tuple of every CSS var name (without --)
export type ThemeName = "light" | "dark"; ColorToken; CssVarName; SpaceToken; RadiusToken; DurationToken; EasingToken; SpringToken; BreakpointToken;
export const cssVar: (name: CssVarName, fallback?: string) => string;   // "var(--name)"
export const mediaUp: (bp: BreakpointToken) => string;                  // "(min-width: 768px)"
export const contrastRatio, relativeLuminance, parseHex, AA, CONTRAST_PAIRS; // CONTRAST_PAIRS: { text, nonText, focusFills, outlinedFills }
```
CSS variable families (kebab-case; TS keys camelCase):
- paper levels: `bg` (paper #F4EFE6 / #161512) `surface` (paper-2, cards) `surface-raised` (brightest: popovers, inputs) `surface-sunken` (wells, code) `surface-inverse`
- ink levels: `text text-muted text-subtle text-inverse`; lines: `border` (soft hairline, decorative) `border-strong` (the 1.5px ink line)
- focus: `focus-ring` (ink / marker yellow in dark) + `focus-halo` (gap colour; `--shadow-focus-halo` when a ring sits on a fill); `selection`, `highlight` + `on-highlight` (marker), `grain`, `halftone`
- accents (fills, ink text on them): `primary primary-hover primary-active primary-subtle on-primary` (riso orange) · `secondary secondary-hover secondary-subtle on-secondary` (teal) · `accent accent-hover accent-subtle on-accent` (riso blue)
- accent inks (text/strokes on paper): `text-primary text-secondary text-accent`
- status: `success warning danger info` (text) + `-subtle` (bg) + `-solid` (fill) + `on-*`; `live on-live`; `overlay` (flat scrim, never blurred); `shadow` (translucent flat cast shadow), `shadow-pop` (hard shadow colour), `shadow-accent` (orange misregistration)
- code: `code-bg code-text code-key code-string code-number code-boolean code-null code-punctuation code-highlight`
- packets: `packet-{req,event,eose,ok,close,closed,notice,auth,count}` + `on-packet` — mid-tone riso fills tuned so ink text is ≥4.5:1 AND the fill is ≥3:1 on page/surface, so one token works as a pill fill and as a line/dot.
- kinds: `kind-{regular,replaceable,ephemeral,addressable}` (+`-subtle`) + `on-kind` (same dual-use guarantee)
- diagrams: `diagram-{node,node-stroke,node-down,node-down-stroke,edge,edge-active,edge-dead,lane,lane-alt,highlight,label}`, `envelope-{wrap,seal,rumor,stroke}`
- charts: `chart-1 … chart-8` (riso categorical, ≥3:1 on bg/surface/raised), `chart-grid`, `chart-axis`
- mascot: `mascot-{line,body,belly,beak,legs,accent}` (ink linework in both themes; teal body, orange beak/legs, yellow accent; shading = `--pattern-halftone`)
- `--font-family-{display,body,mono}` (Bricolage Grotesque Variable ×2, JetBrains Mono Variable), `--font-size-{2xs,xs,sm,md}` fixed + `{lg,xl,2xl,3xl,4xl,5xl,6xl}` fluid `clamp(rem, rem + vw, rem)`, `--font-weight-{regular,medium,semibold,bold,black}`, `--font-line-height-{tight,snug,normal,relaxed}`, `--font-letter-spacing-{tight,normal,wide,caps,display}`
- `--space-{0,3xs,2xs,xs,sm,md,lg,xl,2xl,3xl,4xl}` (0,2,4,8,12,16,24,32,48,64,96px)
- `--size-{icon-*,control-*,touch-target,avatar-*,mascot-*,content,wide,rail,drawer,diagram-min-height,halftone-cell,halftone-dot,grain-tile,focus-offset,lift}`
- `--radius-{none 0,sm 2px,md 4px,lg 6px,xl 10px,pill,round}`, `--border-width-{thin 1px,medium 1.5px (brand line),thick 3px,heavy 4px}`, `--opacity-{disabled,muted,overlay,subtle,dimmed,grain,halftone}`
- `--shadow-{sm,md,lg,pop,pop-sm,lift,pressed,accent,focus-halo}` — all hard offsets, zero blur (tested)
- `--pattern-{grain,halftone,highlight}` (see §2 Brand)
- `--motion-duration-{instant,press,fast,normal,slow,slower,packet,step}`, `--motion-easing-{standard,emphasized,decelerate,accelerate,bounce,press}` (bounce is a small crafted overshoot), `--motion-spring-{gentle,bouncy,snappy,wobbly}-{stiffness,damping,mass}`
- `--z-{base,raised,dropdown,sticky,drawer,overlay,modal,popover,toast,mascot}`, `--breakpoint-{sm,md,lg,xl}`

**Migration from the purple brand** (token names were already semantic, so nothing was renamed;
meanings changed — restyle call sites accordingly):

| Token | Before | Now / what to do |
|---|---|---|
| `primary` | purple #7A2EF5, white text, usable as border | riso orange fill, **ink** text; not a line/text colour → borders/strokes use `border-strong` or `text-primary` |
| `secondary` | orange | teal fill (ink text); strokes use `text-secondary` |
| `accent` | pink | riso blue fill (ink text); strokes use `text-accent` |
| `on-*` (primary, accent, success, danger, info, live, packet, kind) | white | ink |
| `surface` | white card | paper-2 (darker than page); use `surface-raised` for the brightest sheet |
| `border-strong` | mid grey | ink (the 1.5px brand line) |
| `border-width-medium` | 2px | 1.5px |
| `radius-{sm,md,lg,xl}` | 6/12/20/28px | 2/4/6/10px |
| `shadow-{sm,md,lg}` | soft blurred | hard offsets (1/3/5px); new `lift`, `pressed`, `accent`, `focus-halo` |
| `color-shadow` | purple-tinted rgba | translucent ink (flat cast shadows only) |
| `mascot-body` | dark ink | teal spot fill; new `mascot-line` for linework |
| `font-family-display/body` | Fredoka / Nunito | Bricolage Grotesque |
| new | — | `focus-halo highlight on-highlight grain halftone shadow-accent mascot-line`, `pattern-*`, `size-{halftone-*,grain-tile,focus-offset,lift}`, `opacity-{grain,halftone}`, `motion-duration-press`, `motion-easing-press`, `font-letter-spacing-display` |

Themes: light by default; dark via `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) }`
and forced with `<html data-theme="dark">` (persisted by the shell under localStorage `nostrschool:theme`).
Regenerate the OG card and touch icon after brand changes: `bun run brand:images` (Playwright Chromium).

### 3.2 `@nostrschool/i18n` — `packages/i18n`
```ts
export const LOCALES: readonly ["en", "es"]; export type Locale = "en" | "es";
export const DEFAULT_LOCALE: Locale;            // "en"
export const LOCALE_NAMES: Record<Locale, string>; LOCALE_TAGS: Record<Locale, string>; // "en-US", "es-ES"
export const isLocale: (v: unknown) => v is Locale;
export type Dictionary = typeof en;             // { common, ui, diagrams, charts, mascot, kinds, chapters: { ch01 … ch12 } }
export type MessageKey;                         // "common.nav.learn" | "chapters.ch02.title" | …
export type ChapterKey = "ch01" | … | "ch12";
export interface PluralMessage { one: string; other: string; zero?: string }
export const getDictionary: (locale: Locale) => Dictionary;              // preferred in components
export const useTranslations: (locale: Locale) => (key: MessageKey, params?: MessageParams) => string;
export const format: (template: string, params?: MessageParams) => string; // "{name}" placeholders
export const plural: (locale, count, message: PluralMessage, params?) => string; // injects {count}
export const formatNumber: (locale, n, opts?) => string; formatDate: (locale, date, opts?) => string;
export const GLOSSARY_IDS: readonly [...]; export type GlossaryId;   // FINAL list, see src/glossary/ids.ts
export interface GlossaryEntry { term: string; short: string; long: string; seeAlso?: readonly GlossaryId[]; nips?: readonly string[] }
export type Glossary = Readonly<Record<GlossaryId, GlossaryEntry>>;
export const getGlossary: (locale) => Glossary; getGlossaryEntry: (locale, id) => GlossaryEntry; isGlossaryId;
export const fallbackLocale: (locale) => Locale; // "en"
```
Files: `src/locales/<loc>/{common,ui,diagrams,charts,mascot,kinds}.ts`, `src/locales/<loc>/chapters/NN.ts`
(exports `chNN`, starts with `{ title, summary }` — add your keys), `src/glossary/{ids,en,es}.ts`.
`kinds.ts` = `{ categories, categoryDescriptions, names: { k<kind>: { name, description } } }` for every `KINDS` entry.
GlossaryIds: nostr relay client event kind tag pubkey privkey npub nsec keypair secp256k1 schnorr
signature hash sha256 bech32 nip nip01 nip04 nip05 nip07 nip17 nip19 nip23 nip42 nip44 nip46 nip57 nip59 nip65
filter subscription req eose websocket zap lightning lnurl lud16 outbox-model follow-list gift-wrap seal
rumor bunker replaceable-event ephemeral-event addressable-event federation censorship-resistance
proof-of-work nevent nprofile naddr note metadata reaction repost deletion paid-relay web-of-trust ecdh
encryption direct-message long-form event-id signer key-loss spam.

### 3.3 `@nostrschool/protocol` (stubs; `Result`, encoding helpers, tags, kinds implemented) — `packages/protocol/src`
```ts
// types.ts
type Hex = string; type UnixSeconds = number; type RelayUrl = string;
type Tag = readonly [name: string, ...values: string[]];
interface EventTemplate { kind: number; created_at: UnixSeconds; tags: readonly Tag[]; content: string }
interface UnsignedEvent extends EventTemplate { pubkey: Hex }
interface NostrEvent extends UnsignedEvent { id: Hex; sig: Hex }
interface Rumor extends UnsignedEvent { id: Hex }                    // NIP-59: no sig
type TagFilterKey = `#${string}`;
interface Filter { ids?; authors?; kinds?: readonly number[]; since?; until?; limit?; search?; [tag: TagFilterKey]: readonly string[] | undefined }

// messages.ts
type ClientMessage = ["EVENT", NostrEvent] | ["REQ", subId, ...Filter[]] | ["CLOSE", subId] | ["AUTH", NostrEvent] | ["COUNT", subId, ...Filter[]];
type RelayMessage  = ["EVENT", subId, NostrEvent] | ["OK", eventId, boolean, string] | ["EOSE", subId] | ["CLOSED", subId, string] | ["NOTICE", string] | ["AUTH", challenge] | ["COUNT", subId, { count; approximate? }];
type MessageType = ClientMessage[0] | RelayMessage[0];
parseRelayMessage(raw: string): Result<RelayMessage, MessageParseError>   // codes: invalid-json not-an-array unknown-type invalid-arity invalid-field
parseClientMessage(raw: string): Result<ClientMessage, MessageParseError>
serializeMessage(msg: ClientMessage | RelayMessage): string

// encoding.ts (bytes/hex/utf8 implemented; sha256 stub)
bytesToHex(b): Hex; hexToBytes(hex, expectedBytes?): Result<Uint8Array, HexError>; isHex(s, bytes?): boolean
utf8Encode(s): Uint8Array; utf8Decode(b): string; sha256(input: string | Uint8Array): Uint8Array; sha256Hex(input): Hex

// keys.ts
interface Keypair { secretKey: Uint8Array; secretKeyHex: Hex; publicKey: Hex }
generateKeypair(): Keypair
keypairFromSecret(sk: Uint8Array | Hex): Result<Keypair, KeyError>   // codes: invalid-hex invalid-length out-of-range
getPublicKey(sk: Uint8Array | Hex): Result<Hex, KeyError>
deriveSecretKey(label: string): Uint8Array                           // sha256(utf8(label)) — demos/fixtures only
isValidPublicKey(hex: string): boolean

// event.ts
serializeEvent(e: UnsignedEvent): string                             // [0,pubkey,created_at,kind,tags,content]
interface EventIdSteps { serialized: string; utf8Bytes: Uint8Array; hash: Uint8Array; id: Hex }
computeEventId(e: UnsignedEvent): EventIdSteps
interface SignOptions { auxRand?: Uint8Array }                       // fixed auxRand ⇒ reproducible sig
interface SignSteps extends EventIdSteps { pubkey: Hex; sig: Hex; event: NostrEvent }
signEvent(t: EventTemplate, sk: Uint8Array | Hex, o?: SignOptions): Result<SignSteps, KeyError>
interface VerifySuccess { steps: EventIdSteps }
interface VerifyFailure extends ProtocolError<"malformed" | "id-mismatch" | "bad-signature" | "invalid-pubkey"> { steps?; expectedId?; actualId? }
verifyEvent(e: NostrEvent): Result<VerifySuccess, VerifyFailure>
validateEventShape(x: unknown): Result<NostrEvent, EventShapeError>  // codes: not-an-object missing-field invalid-field invalid-tags invalid-json; field?
parseEventJson(json: string): Result<NostrEvent, EventShapeError>

// nip19.ts
type Nip19Prefix = "npub" | "nsec" | "note" | "nprofile" | "nevent" | "naddr";
interface ProfilePointer { pubkey; relays? } interface EventPointer { id; relays?; author?; kind? } interface AddressPointer { identifier; pubkey; kind; relays? }
type Nip19Entity = { type: "npub"; data: Hex } | { type: "nsec"; data: Uint8Array } | { type: "note"; data: Hex } | { type: "nprofile"; data: ProfilePointer } | { type: "nevent"; data: EventPointer } | { type: "naddr"; data: AddressPointer };
interface TlvEntry { type: 0|1|2|3; length: number; value: Uint8Array }
interface Bech32Steps { hrp; dataBytes: Uint8Array; tlv?: readonly TlvEntry[]; words: readonly number[]; checksumWords: readonly number[]; dataChars: string; encoded: string }
nip19Encode(entity): Result<Bech32Steps, Nip19Error>   // codes: invalid-bech32 bad-checksum unknown-prefix invalid-length invalid-tlv invalid-hex too-long
nip19Decode(s): Result<{ entity: Nip19Entity; steps: Bech32Steps }, Nip19Error>   // accepts "nostr:" prefix
encodeNpub(hex) encodeNsec(sk) encodeNote(id) encodeNprofile(p) encodeNevent(p) encodeNaddr(p): Result<string, Nip19Error>
BECH32_CHARSET = "qpzry9x8gf2tvdw0s3jn54khce6mua7l"

// filter.ts
matchFilter(f: Filter, e: NostrEvent): boolean; matchFilters(fs, e): boolean   // limit/search ignored
type FilterField = "ids" | "authors" | "kinds" | "since" | "until" | TagFilterKey;
explainFilterMatch(f, e): { matches: boolean; checks: readonly { field: FilterField; passed: boolean }[] }
validateFilter(x: unknown): Result<Filter, FilterError>   // codes: not-an-object invalid-field unknown-field; field?
applyFilters(fs, events): readonly NostrEvent[]           // relay semantics: newest first, per-filter limit

// nip44.ts (v2)
type CryptoError = ProtocolError<"invalid-key" | "invalid-payload" | "unsupported-version" | "invalid-mac" | "invalid-padding" | "invalid-length">;
nip44ConversationKey(sk, pubkey): Result<Uint8Array, CryptoError>
interface Nip44MessageKeys { chachaKey; chachaNonce; hmacKey }
nip44Encrypt(plaintext, conversationKey, { nonce? }?): Result<Nip44EncryptSteps, CryptoError>  // steps: conversationKey nonce messageKeys padded ciphertext mac payload
nip44Decrypt(payload, conversationKey): Result<Nip44DecryptSteps, CryptoError>             // steps: version nonce ciphertext mac messageKeys padded plaintext
nip44PaddedLength(len): number

// nip04.ts (deprecated; for contrast in ch08)
nip04Encrypt(plaintext, sk, pubkey, { iv? }?): Result<{ sharedKey; iv; ciphertext; payload }, CryptoError>
nip04Decrypt(payload, sk, pubkey): Result<string, CryptoError>

// nip59.ts
createRumor(t: EventTemplate, authorPubkey: Hex): Rumor
interface GiftWrapInput { template; senderSecretKey; recipientPubkey; ephemeralSecretKey?; sealCreatedAt?; wrapCreatedAt?; sealNonce?; wrapNonce?; auxRand? }
interface GiftWrapSteps { rumor; sealEncryption: Nip44EncryptSteps; seal: NostrEvent /*13*/; ephemeral: Keypair; wrapEncryption: Nip44EncryptSteps; wrap: NostrEvent /*1059*/ }
giftWrap(input): Result<GiftWrapSteps, CryptoError | KeyError>
unwrapGiftWrap(wrap, recipientSk): Result<{ wrap; seal; rumor }, UnwrapError>  // codes: not-a-gift-wrap decrypt-failed invalid-seal invalid-rumor author-mismatch

// nip05.ts
interface Nip05Address { name; domain; wellKnownUrl; display }
parseNip05(id: string): Result<Nip05Address, Nip05Error>           // codes: invalid-format invalid-document name-not-found pubkey-mismatch
verifyNip05Document(doc: unknown, addr, expectedPubkey): Result<{ pubkey; relays: readonly RelayUrl[] }, Nip05Error>

// kinds.ts (implemented)
type KindCategory = "regular" | "replaceable" | "ephemeral" | "addressable"; KIND_CATEGORIES
type KindI18nKey = `k${number}`;
interface KindInfo { kind: number; name: string; category: KindCategory; nip: string; i18nKey: KindI18nKey }
KINDS: readonly KindInfo[]  // 0 1 3 4 5 6 7 8 13 14 16 20 40 42 1059 1063 1111 1311 1984 9734 9735 9802 10000 10002 10050 13194 22242 23194 23195 24133 27235 30000 30008 30009 30023 30311 30402 31922 31923
classifyKind(kind): KindCategory; getKindInfo(kind): KindInfo | undefined; nipUrl(nip): string

// tags.ts (implemented)
getTag(e, name): Tag | undefined; getTagValues(e, name): readonly string[]; eventAddress(e): "kind:pubkey:d"
```

### 3.4 `@nostrschool/fixtures` (stubs) — `packages/fixtures/src`
```ts
type PersonaId = "alice" | "bob" | "carol" | "dave" | "erin" | "frank" | "grace";
interface RelayListEntry { url: RelayUrl; read: boolean; write: boolean }
interface Persona { id; name; displayName; about; secretKeyHex; secretKey: Uint8Array; pubkey; npub; nsec;
  avatar: string /* data:image/svg+xml URI */; initials; lud16; nip05; relays: readonly RelayListEntry[] }
// secret key = sha256(`nostrschool:persona:${id}`) — public by design
interface FixtureRelay { url; name; description; latencyMs: number; paid: boolean }   // wss://relay.{alpha,beta,gamma,delta}.example
interface FollowGraph { nodes: { pubkey; personaId }[]; edges: { from; to }[] }
interface GiftWrapFixture { sender; recipient; rumor: Rumor; seal; wrap }
interface ZapFixture { sender; recipient; amountMsats; request /*9734*/; receipt /*9735*/; bolt11 }
PERSONA_IDS; FIXTURE_NOW = 1735689600; RELAYS; PERSONAS; FIXTURE_EVENTS (newest first)
getPersona(id): Persona; personaByPubkey(pk): Persona | undefined; getRelay(url)
eventsByKind(kind | kinds[]); eventsByAuthor(personaId | pubkey); eventById(id)
followGraph(); relayListFor(personaId | pubkey); eventsOnRelay(url); relaysForEvent(id); giftWraps(); zaps()
```
Committed data: `src/data/events.json` `{ fixtureNow, events: NostrEvent[], placement: { [eventId]: RelayUrl[] } }`
containing kinds 0,1,3,5,6,7,1059,13,14(rumor, inside giftWraps),9734,9735,10002,30023; generator `scripts/generate.ts` (`bun run --cwd packages/fixtures generate`).

### 3.5 `@nostrschool/data` (stubs; stores implemented) — `packages/data/src`
```ts
type DataMode = "fixture" | "live"; type FrameDirection = "out" | "in";
interface DataSourceError { code: "connect-failed" | "connect-timeout" | "eose-timeout" | "invalid-message" | "invalid-event" | "closed-by-relay" | "notice" | "socket-error"; relayUrl; message }
interface SubscribeOptions {
  relays?: readonly RelayUrl[];
  onEvent: (event: NostrEvent, relayUrl: RelayUrl) => void;          // verified events, once per relay
  onEose?: (relayUrl) => void; onAllEose?: () => void;
  onRawMessage?: (direction: FrameDirection, relayUrl, rawFrame: string) => void;
  onError?: (error: DataSourceError) => void;
}
interface Subscription { id: string; close(): void }
interface DataSource { mode: DataMode; relays: readonly RelayUrl[]; subscribe(filters: readonly Filter[], o: SubscribeOptions): Subscription; dispose(): void }  // NO publish
DEFAULT_LIVE_RELAYS = ["wss://relay.damus.io", "wss://nos.lol", "wss://relay.primal.net"]
$liveMode: persistent atom<boolean>   (localStorage "nostrschool:live", "1"/"0", default false)
$liveRelays: persistent atom<readonly RelayUrl[]>  (localStorage "nostrschool:live-relays", JSON; E2E points it at ws://127.0.0.1:7447)
createFixtureSource({ events?, placement?, relays?, latencyMs?: number | ((url) => number) }?): DataSource
createLiveRelaySource({ relays?, connectTimeoutMs? = 5000, eoseTimeoutMs? = 8000, maxEvents? = 500, WebSocketImpl? }?): DataSource
getDataSource(): DataSource   // per $liveMode, cached per mode
```

### 3.6 `@nostrschool/test-relay` (stubs) — `packages/test-relay/src`
```ts
interface TestRelayOptions { port? = 0; hostname?; seed?: readonly NostrEvent[]; verifySignatures? = true; acceptWrites? = true; latencyMs? }
interface TestRelay { url: string /* ws://host:port */; port: number; events(); received(): readonly ClientMessage[]; notice(msg): void; stop(): Promise<void> }
startTestRelay(opts?): Promise<TestRelay>
```
CLI for E2E: `src/cli.ts` (PORT env, default 7447, seeded with `FIXTURE_EVENTS`).

### 3.7 `@nostrschool/ui` — `packages/ui/src` (bus, motion, stores implemented; components are working stubs)
Components (props in `src/types.ts`; `testid` required on interactive ones; part ids `${testid}-…`):

| Component | Key props |
|---|---|
| `Button` | `testid, variant?: primary\|secondary\|ghost\|danger, size?, type?, disabled?, loading?, pressed?, href?, ariaLabel?, onclick?, icon?, children?` |
| `Card` | `testid?, as?, variant?: plain\|raised\|outlined\|highlight, padding?, header?, footer?, children` |
| `Drawer` (alias `UnderTheHood`) | `testid, locale, title?, open? (bindable), children` — honors `$alwaysExpandDrawers`; parts `-toggle -content -always` |
| `Term` | `id: GlossaryId, locale, glossaryHref, testid? = term-<id>, children?` — in MDX use the site wrapper `~/components/shell/Term.astro` |
| `Toggle` | `testid, checked? (bindable), label, description?, disabled?, onchange?` |
| `Tabs` | `testid, tabs: {id,label,disabled?}[], selected? (bindable), label, onchange?, panel: Snippet<[id]>` |
| `CodeBlock` | `testid, locale, code, lang?: json\|ts\|js\|bash\|text, caption?, highlightLines?, copyable?` |
| `JsonView` | `testid, locale, value: unknown, highlightPaths? ("tags.0.1"), collapsedDepth?, onselectpath?` |
| `Callout` | `testid?, locale, tone: info\|tip\|warning\|danger\|safety, title?, children` |
| `Takeaway` | `testid?, locale, title?, points: string[]` |
| `Quiz` | `testid, locale, question, options: {id,label,correct,explanation?}[], multiple?, onanswer?` — emits `quiz:correct/wrong {quizId: testid}`; parts `-option-<id> -check -feedback -retry` |
| `CopyButton` | `testid, locale, value, label?, confetti?, size?` |
| `Badge` | `testid?, tone?: neutral\|primary\|success\|warning\|danger\|info\|live\|regular\|replaceable\|ephemeral\|addressable, size?, children` |
| `Stepper` | `testid, locale, steps: {id,label}[], current? (bindable), onchange?` |
| `PlaybackControls` | `testid, locale, step? (bindable), totalSteps, playing? (bindable), speed? (bindable), onstep?` — owns no timer; parts `-play -back -forward -reset -scrub -status` |
| `Tooltip` | `testid?, content: string, placement?, children` |
| `VisuallyHidden` | `as? (span\|div\|p\|h2\|h3), testid?, children, ...attrs` — the one screen-reader-only primitive (site markup may use the global `.visually-hidden` class instead) |

Pure helpers also exported: `rovingIndex(count, from, key, isDisabled?)` (shared by charts and diagrams), `viewportShift`, `copyText`, `gradeQuiz`, `resolveTerm`, `toJsonTree`, `highlightLines`.
Light entry `@nostrschool/ui/result.ts`: `ok, err, isOk, isErr, mapResult, flatMapResult, Result, Ok, Err` re-exported from protocol, for packages that may not depend on protocol (mascot, charts).

```ts
// bus.ts — mascot/event bus (implemented)
interface MascotEventMap {
  "signature:valid": { eventId?: string }; "signature:invalid": { reason?: string };
  "keys:generated": { pubkey: string }; "chapter:complete": { chapter: number };
  "quiz:correct": { quizId: string }; "quiz:wrong": { quizId: string };
  "live:on": Record<string, never>; "live:off": Record<string, never>; celebrate: { reason?: string };
}
type MascotEventType = keyof MascotEventMap; MASCOT_EVENT_TYPES
createEventBus<M>({ onListenerError? }?): EventBus<M>   // { emit(type, payload), on(type, h) => off, onAny(h) => off }
mascotBus; emit; on; onAny                              // app-wide singleton; emit("live:on", {})
// motion.ts (implemented)
$reducedMotion: ReadableAtom<boolean>; prefersReducedMotion(): boolean
duration(name, reduce?) ms (0 if reduced); durationSeconds(name, reduce?); easing(name) → [x1,y1,x2,y2]
spring(name: "gentle"|"bouncy"|"snappy"|"wobbly", reduce?) → { type:"spring", stiffness, damping, mass } | { duration: 0 }
tween(durationName, easingName?, reduce?) → { duration (s), ease }
// usage: animate(el, { scale: [0.9, 1] }, spring("bouncy"))
// stores.ts
$alwaysExpandDrawers: persistent atom<boolean> (localStorage "nostrschool:always-expand")
```

### 3.8 `@nostrschool/diagrams` (stubs) — `packages/diagrams/src`
All take `testid, locale, title, description?`; narration in `${testid}-narration` (aria-live).
`type PacketType = MessageType | "custom"`.
- `SequenceDiagram`: `lanes: {id,label,kind?: user|client|relay|signer|server|wallet|extension}[]`, `messages: {id,from,to,label,packet?,narration?,payload?}[]`, `step? (bindable, -1 = start)`, `playing? (bindable)`, `stepMs?`, `onstep?(step, msg)`, `detail?: Snippet<[msg]>`. Parts `-lane-<id> -message-<id> -controls-* -detail -scroll` (horizontal strip that follows playback; `data-overflow-start|end`).
- `Pipeline`: `stages: {id,label,value?,description?}[]`, `active? (bindable)`, `status?: idle|running|ok|error`, `errorAt?`. Parts `-stage-<id>` (`data-state=pending|active|done|error`).
- `Swimlane`: `lanes: {id,label}[]`, `steps: {id,lane,label,to?,packet?,narration?,payload?}[]`, `current? (bindable)`, `playing?`, `onstep?`. Part `-scroll` as in SequenceDiagram.
- `ForceGraph`: `nodes: {id,label,group?,avatar?}[]`, `links: {source,target,kind?: follows|mutual|relay}[]`, `selected? (bindable)`, `highlight?`, `width?`, `height?`, `onselect?`. Parts `-node-<id>`, `-node-<id>-focus` (focus halo), `-table`.
- `Packet`: `type: PacketType, label?, size?, testid? = packet-<type>`.
- Pure: `fitToBox(points, box)` (stretches a settled graph layout to the margins), `PACKET_COLORS: Record<PacketType, string>`.
- (Removed: `NetworkTopology` and `Envelope` had no users; ch01's TopologySandbox and ch08's EnvelopeLab are chapter-local.)

### 3.9 `@nostrschool/charts` (stubs) — `packages/charts/src`
All take `testid, locale, title, description?, format?, source?`; table fallback parts `-table-toggle`, `-table`.
`Datum { id; label; value }`.
- `BarChart`: `data, orientation?, xLabel?, yLabel?, highlight?, sorted?` (parts `-bar-<id>`)
- `LineChart`: `series: {id,label,points: {x: Date|number, y}[]}[], xLabel?, yLabel?, formatX?` (parts `-series-<id>`, `-legend`)
- `Treemap`: `root: TreeNode {id,label,value?,children?}` (parts `-cell-<id>`)
- `DonutChart`: `data, centerLabel?` (parts `-slice-<id>`, `-legend`)
- `StatTile`: `testid, locale, label, value: number|string, delta?, hint?, format?` (parts `-value`, `-delta`)
- `seriesColor(i)` (implemented), `niceMax(values)` (stub).

### 3.10 `@nostrschool/mascot` (stubs) — `packages/mascot/src`
```ts
type MascotPose = "idle" | "wave" | "think" | "cheer" | "panic" | "celebrate" | "sleep"; MASCOT_POSES
interface MascotProps { locale; size?: "sm"|"md"|"lg"; pose?: MascotPose; reactive? = true; riveSrc?: string; testid? = "mascot" }
// root: data-testid, data-pose, data-renderer="rive"|"svg", role="img", aria-label = mascot.poses[pose]
RIVE_CONTRACT = { stateMachine: "Mascot", poseInput: "pose" /* index into MASCOT_POSES */, bounceTrigger: "bounce" }
poseForEvent(event: MascotEventType): MascotPose; REACTION_HOLD_MS = 2400
```
Rive file goes to `apps/site/public/mascot/ostrich.riv`; the site passes `riveSrc={assetHref("mascot/ostrich.riv")}`.

---

## 4. Site (`apps/site`)

- `astro.config.ts`: static, `base = BASE_PATH ?? "/understanding-nostr"`, `site = SITE_URL ?? placeholder`,
  `trailingSlash: "always"`, i18n `en`/`es` with `prefixDefaultLocale: true`, mdx, svelte, sitemap.
- Routes: `/` (meta-refresh to `/en/`), `/404`, `/<locale>/`, `/<locale>/learn/`, `/<locale>/learn/<slug>/`,
  `/<locale>/tools/`, `/<locale>/tools/{keys,event-inspector,filter-playground,kinds}/`, `/<locale>/glossary/` (anchors `#<glossaryId>`).
- **Links**: always `href(locale, path)` / `assetHref(path)` from `~/lib/href` (`~` = `apps/site/src`).
  `href("en", "learn/keys")` → `/understanding-nostr/en/learn/keys/`; `href("en", "glossary#relay")` keeps the hash.
  `switchLocale(pathname, to)`. Works in Svelte islands too (falls back to `/` base under bun test).
- **Chapters** (`~/lib/chapters`): `CHAPTER_SLUGS`, `CHAPTERS: { order, slug, nn, dir, key }[]`, `getChapter(slug)`, `neighbors(slug)`.

| NN | slug | dir | tool page |
|---|---|---|---|
| 01 | why-nostr | 01-why-nostr | |
| 02 | keys | 02-keys | tools/keys |
| 03 | events | 03-events | tools/event-inspector |
| 04 | relays | 04-relays | |
| 05 | filters | 05-filters | tools/filter-playground |
| 06 | kinds | 06-kinds | tools/kinds |
| 07 | social-graph | 07-social-graph | |
| 08 | private-messages | 08-private-messages | |
| 09 | zaps | 09-zaps | |
| 10 | signing | 10-signing | |
| 11 | ecosystem | 11-ecosystem | (+ scripts/snapshot-ecosystem.ts, src/data/ecosystem.json) |
| 12 | trade-offs | 12-trade-offs | |

- **Content collection** `chapters` (`src/content.config.ts`): files `src/content/chapters/<locale>/<NN-slug>.mdx`,
  entry id `"<locale>/<NN-slug>"`. Frontmatter (zod): `order` (1–12), `slug` (one of CHAPTER_SLUGS, without NN),
  `title`, `summary`, `estimatedMinutes` (int > 0), `nips` (string[] like `"01"`, `"5A"`), `takeaways` (≥1), `mascotIntro?`.
  Missing `es` MDX → English is rendered with a "not translated" notice.
- **MDX chapter pattern** (components are Svelte 5, hydrated lazily, take `locale`):
  ```mdx
  ---
  order: 2
  slug: keys
  title: "Identity is a keypair"
  summary: "…"
  estimatedMinutes: 12
  nips: ["01", "19"]
  takeaways:
    - "Your identity is a secp256k1 keypair."
  mascotIntro: "No passwords here!"
  ---
  import Term from "~/components/shell/Term.astro";
  import { Drawer, Callout } from "@nostrschool/ui";
  import KeyGenerator from "~/components/chapters/02-keys/KeyGenerator.svelte";

  Your identity is a <Term id="keypair" locale="en">keypair</Term>.

  <KeyGenerator client:visible locale="en" />
  <Drawer client:visible testid="ch02-uth-bytes" locale="en">Raw bytes …</Drawer>
  ```
  Use `client:visible` for below-the-fold islands, `client:idle` for small always-on ones, plain (no directive) for static output.
  Each chapter dir starts with a `<Name>Placeholder.svelte` (delete it when you add the real component and update the MDX import).
- Layouts: `BaseLayout.astro` (`locale`, `title`, `description?`), `ChapterLayout.astro` (`locale`, `chapter: ChapterRef`, `meta`, `isFallback`, `prev?`, `next?`).
- Global CSS: `src/styles/global.css` (imports tokens + fonts; reduced-motion kill switch).
- Tool pages reuse chapter components: `import KeyTool from "~/components/chapters/02-keys/KeyTool.svelte"` then `<KeyTool client:load locale={locale} />`.

---

## 5. Testing

- **Unit/integration** (`bun run test`): colocated `*.test.ts` next to the code (packages and
  `apps/site/src/components/chapters/NN-slug/*.test.ts`), site-level tests in `apps/site/test/`
  (`build.test.ts` inspects `dist/` and skips with a warning when it is absent). Real fixtures,
  real crypto, real test relay (`startTestRelay({ port: 0 })`) — no mocks. Aim for 100% coverage of your logic.
- **E2E** (`bun run test:e2e` = build + Playwright): `apps/site/playwright.config.ts` starts
  `astro preview` on **127.0.0.1:4321** and the test relay on **7447**; `baseURL` includes the base path.
  Projects: `chromium`, `chromium-dark`, `chromium-reduced-motion`, `mobile`.
  Helpers: `e2e/helpers/a11y.ts` → `expectNoA11yViolations(page, { include?, exclude? })` (WCAG 2.1 AA, zero violations);
  `e2e/helpers/site.ts` → `pagePath(locale, path)`, `TEST_RELAY_URL`, `useLiveTestRelay(page)` (sets live mode + relay list in localStorage before load).
  Specs: `e2e/shell.spec.ts`, `e2e/glossary.spec.ts`, `e2e/chapters/NN.spec.ts`.
  Locally: `E2E_NO_RELAY=1 bunx playwright test --project=chromium chapters/02` (from `apps/site`, after a build).
  Astro 7's `astro preview` keeps a lock file; if a stale server blocks, run `bunx astro preview stop` in `apps/site`.

---

## 6. OWNERSHIP

Only create/modify files you own. Everything not listed belongs to the **integrator**.

| Owner | Paths |
|---|---|
| protocol agent | `packages/protocol/**` |
| fixtures agent | `packages/fixtures/**` |
| data agent | `packages/data/**`, `packages/test-relay/**` |
| ui agent | `packages/ui/**`, `packages/i18n/src/locales/en/ui.ts` |
| diagrams agent | `packages/diagrams/**`, `packages/i18n/src/locales/en/diagrams.ts` |
| charts agent | `packages/charts/**`, `packages/i18n/src/locales/en/charts.ts` |
| mascot agent | `packages/mascot/**`, `apps/site/public/mascot/**`, `packages/i18n/src/locales/en/mascot.ts` |
| glossary agent | `packages/i18n/src/glossary/en.ts`, `apps/site/src/pages/[locale]/glossary.astro`, `apps/site/e2e/glossary.spec.ts` |
| shell agent | `apps/site/src/layouts/**`, `apps/site/src/components/shell/**`, `apps/site/src/pages/[locale]/index.astro`, `apps/site/src/pages/[locale]/learn/index.astro`, `apps/site/src/pages/[locale]/learn/[slug].astro`, `apps/site/src/pages/[locale]/tools/index.astro`, `apps/site/src/pages/404.astro`, `packages/i18n/src/locales/en/common.ts`, `apps/site/src/styles/**`, `apps/site/e2e/shell.spec.ts`, `apps/site/public/**` except `public/mascot/**` |
| chapter agent NN | `apps/site/src/content/chapters/en/NN-<slug>.mdx`, `apps/site/src/components/chapters/NN-<slug>/**` (Svelte components + `*.test.ts`), `packages/i18n/src/locales/en/chapters/NN.ts`, `apps/site/e2e/chapters/NN.spec.ts`; plus: 02 → `pages/[locale]/tools/keys.astro`; 03 → `pages/[locale]/tools/event-inspector.astro`; 05 → `pages/[locale]/tools/filter-playground.astro`; 06 → `pages/[locale]/tools/kinds.astro` + `packages/i18n/src/locales/en/kinds.ts`; 11 → `scripts/snapshot-ecosystem.ts` + `apps/site/src/data/ecosystem.json` |
| translation agents | `packages/i18n/src/locales/es/**`, `packages/i18n/src/glossary/es.ts`, `apps/site/src/content/chapters/es/**` |
| integrator | root configs (`package.json`, `tsconfig*.json`, `biome.json`, `bunfig.toml`, `.github/**`, `.gitignore`, `.editorconfig`), every `package.json`/`tsconfig.json`/`bunfig.toml`, `bun.lock`, `tooling/**`, `packages/i18n/src/index.ts`, `packages/i18n/src/{locales,types}.ts`, `packages/i18n/src/locales/*/index.ts`, `packages/i18n/src/glossary/ids.ts`, `packages/i18n/src/i18n.test.ts`, `packages/tokens/**` (implemented; request changes), `apps/site/astro.config.ts`, `apps/site/svelte.config.js`, `apps/site/playwright.config.ts`, `apps/site/src/content.config.ts`, `apps/site/src/lib/**`, `apps/site/src/env.d.ts`, `apps/site/src/pages/index.astro`, `apps/site/e2e/helpers/**`, `apps/site/test/**`, `README.md`, `CONTRACTS.md` |

Exception (only one): when you add a key to an `en` i18n file you own, append the same key to the
matching `es` file (English text + `// TODO(es)`), additively.

Report needs outside your paths (dependencies, contract changes, new glossary ids, new bus events,
new tokens) in your final output under **NEEDS** / **CONTRACT ISSUES** instead of editing.
