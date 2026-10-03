# @nostrschool/tokens

Design tokens (DTCG JSON in `tokens/`) compiled by Style Dictionary into CSS custom properties
and a typed TS module. Light + dark themes, AA contrast enforced by tests.

```bash
bun run --cwd packages/tokens build   # regenerate src/generated/*
bun test packages/tokens              # contrast + output checks
```

## CSS

```css
@import "@nostrschool/tokens/tokens.css";

.card {
  padding: var(--space-md);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: var(--shadow-pop);
  transition: transform var(--motion-duration-fast) var(--motion-easing-bounce);
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
contrastRatio(themes.light.color.text, themes.light.color.bg); // ≈ 17
```

Categories: `color.*` (semantic, packet-*, kind-*, diagram-*, envelope-*, chart-1…8, code-*, mascot-*),
`font.*`, `space.*`, `size.*`, `radius.*`, `border-width.*`, `opacity.*`, `shadow.*`, `motion.*`, `z.*`, `breakpoint.*`.
The raw palette is private (not emitted).
