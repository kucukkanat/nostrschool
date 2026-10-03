# @nostrschool/tokens

Design tokens (DTCG JSON in `tokens/`) compiled by Style Dictionary into CSS custom properties
and a typed TS module. Light + dark themes, AA contrast enforced by tests.

Brand: **riso field notebook** — paper surfaces, 1.5px ink lines, hard offset shadows, one
fluorescent orange (`--color-primary`, a fill with ink text), teal and riso blue as supporting
fills, paper grain and halftone textures. No purple (tested), no blur, no glows.

```bash
bun run --cwd packages/tokens build   # regenerate src/generated/*
bun test packages/tokens              # contrast + output checks
```

## CSS

```css
@import "@nostrschool/tokens/tokens.css";

.card {
  padding: var(--space-md);
  border: var(--border-width-medium) solid var(--color-border-strong);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  box-shadow: var(--shadow-pop);
  transition:
    translate var(--motion-duration-fast) var(--motion-easing-bounce),
    box-shadow var(--motion-duration-fast) var(--motion-easing-bounce);
}
.card:hover {
  translate: calc(var(--size-lift) * -1) calc(var(--size-lift) * -1);
  box-shadow: var(--shadow-lift);
}
.card:active {
  translate: 0 0;
  box-shadow: var(--shadow-pressed);
}

.button-primary {
  background: var(--color-primary);       /* fill only: 2.7:1 on paper, so it is outlined */
  color: var(--color-on-primary);         /* ink */
  border: var(--border-width-medium) solid var(--color-border-strong);
}

.illustration {
  background-image: var(--pattern-halftone);
  background-size: var(--size-halftone-cell) var(--size-halftone-cell);
}
```

Dark theme applies automatically (`prefers-color-scheme`) unless `<html data-theme="light">`;
`data-theme="dark"` forces dark. Under `prefers-reduced-motion` every `--motion-duration-*` is `0ms`.

## TypeScript

```ts
import { contrastRatio, cssVar, mediaUp, themes, tokens, vars } from "@nostrschool/tokens";

vars.color.packetReq;            // "var(--color-packet-req)" — theme-aware, use in SVG/D3
tokens.motion.duration.fast;     // 120 (ms)
tokens.motion.spring.bouncy;     // { stiffness: 300, damping: 12, mass: 1 }
cssVar("space-lg");              // "var(--space-lg)" (name is type-checked)
mediaUp("md");                   // "(min-width: 768px)"
contrastRatio(themes.light.color.text, themes.light.color.bg); // ≈ 15
```

Categories: `color.*` (semantic, packet-*, kind-*, diagram-*, envelope-*, chart-1…8, code-*, mascot-*),
`font.*`, `space.*`, `size.*`, `radius.*`, `border-width.*`, `opacity.*`, `shadow.*`, `pattern.*`, `motion.*`, `z.*`, `breakpoint.*`.
The raw palette is private (not emitted). Full reference and usage rules: CONTRACTS.md §2 "Brand" and §3.1.

Tests (`bun test packages/tokens`) check, in both themes: every text/background pair ≥ 4.5:1, every
line/mark pair ≥ 3:1, the focus ring (or its halo) ≥ 3:1 against every fill, every fill separating
from the page by itself or its ink outline, zero-blur shadows, and that no colour sits in the
purple hue band.
