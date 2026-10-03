# Site shell (`apps/site/src/components/shell`)

Header, footer, course rail, theme/live toggles and landing-page islands. Layouts live in
`src/layouts/` (`BaseLayout.astro`, `ChapterLayout.astro`).

## Using the layouts

```astro
---
import BaseLayout from "~/layouts/BaseLayout.astro";
import { assertLocale, localeStaticPaths } from "~/lib/locale";
export const getStaticPaths = localeStaticPaths;
const locale = assertLocale(Astro.params.locale);
---
<BaseLayout locale={locale} title="Key tool" description="Generate demo keys">
  <h1 data-testid="tool-title">Key tool</h1>
</BaseLayout>
```

`BaseLayout` props: `locale`, `title`, `description?`, `fullBleed?` (skip the centred container),
`ogImage?` (public path, default `og-default.png`). A `top` slot renders above `<main>`.

## Progress store (shared by every island on the page)

```ts
import { progress, nextChapter } from "~/components/shell/lib/progress";

progress.setCompleted("keys", true);           // Result<Completed, StorageError>
progress.$completed.get();                     // ["keys"] (course order, persisted)
nextChapter(progress.$completed.get()).slug;   // "why-nostr"
```

Persisted under `localStorage["nostrschool:completed"]` (JSON array of slugs); theme under
`nostrschool:theme` (`light` | `dark`, absent = system); live mode is `$liveMode` from
`@nostrschool/data`. Every storage access is guarded and returns a `Result`.

## Test ids

`site-header`, `site-logo`, `nav-{learn,tools,glossary}`, `locale-{en,es}`, `theme-toggle`,
`theme-{light,dark,system}` (+ `-input`), `live-toggle`, `live-badge`, `skip-link`, `main`,
`site-footer`, `reading-progress`, `chapter-rail` (`-count`, `-toggle`, `-NN`), `chapter-title`,
`chapter-takeaways`, `chapter-complete`, `chapter-prev`, `chapter-next`, `home-title`,
`home-start`, `course-map-NN`, `hero-network` (`-pause`), `hero-mascot`, `chapter-list`,
`chapter-link-NN`, `tool-list`, `tool-link-<id>`, `not-found-title`, `not-found-home`.

## Tests

```sh
bun test apps/site/src/components/shell      # unit + component tests (happy-dom, no mocks)
cd apps/site && bunx playwright test shell    # E2E (after a build)
```
