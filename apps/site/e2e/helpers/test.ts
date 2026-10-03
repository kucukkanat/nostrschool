import { test as base, expect, type Page } from "@playwright/test";

export { expect, type Page } from "@playwright/test";

/**
 * Hydrates every displayed Astro island, then resolves. Islands render as static HTML first and
 * Astro removes their `ssr` attribute once hydrated; interacting earlier hits inert markup (a
 * click that does nothing, a key press nobody handles). `client:visible` islands only hydrate
 * when scrolled into view, so each one is brought on screen once. Islands are
 * `display: contents` (no box of their own), so we scroll to their first visible child, and
 * islands with nothing visible (e.g. inside a closed drawer) are skipped: they can't hydrate
 * until the learner opens their container.
 */
export const hydrateIslands = async (page: Page): Promise<void> => {
  // Runs in the page (Playwright serializes it), so it must be self-contained.
  const pendingCount = async (): Promise<number> => {
    const shown = [...document.querySelectorAll("astro-island[ssr]")].flatMap((island) => {
      const child = [...island.children].find((c) => c.checkVisibility());
      return child === undefined ? [] : [child];
    });
    if (shown.length > 0) {
      // Put the page back where it was (deep links land mid-page on purpose).
      const [x, y] = [window.scrollX, window.scrollY];
      const frame = () => new Promise((resolve) => requestAnimationFrame(() => resolve(0)));
      for (const child of shown) {
        child.scrollIntoView({ block: "center" });
        await frame();
        await frame();
      }
      window.scrollTo(x, y);
      // Chrome moves the Tab starting point to scrolled-to content; reset it to the document
      // start so keyboard tests begin where a real visitor would (at the skip link).
      // Skipped when the page focused something itself (e.g. a glossary deep link).
      const { body } = document;
      if (document.activeElement === body) {
        const hadTabIndex = body.hasAttribute("tabindex");
        if (!hadTabIndex) body.tabIndex = -1;
        body.focus({ preventScroll: true });
        body.blur();
        if (!hadTabIndex) body.removeAttribute("tabindex");
      }
    }
    return shown.length;
  };
  // Each poll scrolls whatever is still pending, which also covers pages that navigate late
  // (meta refresh) and islands revealed by another island hydrating.
  await expect.poll(() => page.evaluate(pendingCount), { timeout: 15_000 }).toBe(0);
};

/** Hydrates, retrying once when the page redirected itself mid-way (e.g. the root `/` page). */
const settle = async (page: Page): Promise<void> => {
  try {
    await hydrateIslands(page);
  } catch (error) {
    if (!(error instanceof Error) || !error.message.includes("Execution context was destroyed"))
      throw error;
    await page.waitForLoadState();
    await hydrateIslands(page);
  }
};

/** Same API as Playwright's `test`, but every `page.goto`/`page.reload` waits for hydration. */
export const test = base.extend({
  page: async ({ page }, use) => {
    const goto = page.goto.bind(page);
    const reload = page.reload.bind(page);
    page.goto = async (...args) => {
      const response = await goto(...args);
      await settle(page);
      return response;
    };
    page.reload = async (...args) => {
      const response = await reload(...args);
      await settle(page);
      return response;
    };
    await use(page);
  },
});
