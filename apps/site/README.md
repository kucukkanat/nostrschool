# @nostrschool/site

Astro (static) + MDX + Svelte 5 islands. See the root README and CONTRACTS.md.

```bash
bun run dev          # from repo root (builds tokens first)
bun run build && bun run preview
bun test apps/site   # href/chapters unit tests + built-HTML integration tests
bun run test:e2e     # from root: build + Playwright (preview server + test relay)
```

Adding a chapter or a locale: see the step-by-step guides in the
[root README](../../README.md#adding-a-chapter).
