import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

/** Fails the test on any WCAG 2.1 A/AA axe violation (zero-violation budget). */
export const expectNoA11yViolations = async (
  page: Page,
  options: { readonly include?: string; readonly exclude?: readonly string[] } = {},
): Promise<void> => {
  // Scan the settled UI, not a frame mid-fade: entrance/state transitions briefly render text at
  // partial opacity, which axe reports as low contrast. Looping ambient animations never finish,
  // so only finite ones are awaited.
  // Polled rather than awaited once, because a settling step can start the next one (a pipeline
  // advancing on timers, a {#key} block re-entering), and Motion's JS-driven springs (`pop`) are
  // not in getAnimations() at all: they show up only as an inline opacity between 0 and 1.
  // Motion schedules an action's animation for the next frame, so let two frames pass first or
  // the poll below can see the calm before the entrance starts.
  await page.evaluate(
    () => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))),
  );
  await page.waitForFunction(
    () =>
      document
        .getAnimations()
        .every(
          (a) =>
            a.playState !== "running" ||
            a.effect?.getComputedTiming().iterations === Number.POSITIVE_INFINITY,
        ) &&
      [...document.querySelectorAll<HTMLElement>("[style*='opacity']")].every((el) => {
        const o = Number.parseFloat(el.style.opacity);
        return Number.isNaN(o) || o === 0 || o === 1;
      }),
    undefined,
    { timeout: 10_000 },
  );
  let builder = new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]);
  if (options.include !== undefined) builder = builder.include(options.include);
  for (const selector of options.exclude ?? []) builder = builder.exclude(selector);
  const { violations } = await builder.analyze();
  // Name each offending node (selector + axe's summary) so a failure is fixable from the log alone.
  expect(
    violations.map(
      (v) =>
        `${v.id}: ${v.help} (${v.nodes.length} nodes) ${v.nodes
          .map((n) => `${n.target.join(" ")} :: ${n.failureSummary ?? ""}`)
          .join(" | ")}`,
    ),
  ).toEqual([]);
};
