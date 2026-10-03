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
  await page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter((a) => a.effect?.getComputedTiming().iterations !== Number.POSITIVE_INFINITY)
        .map((a) => a.finished.catch(() => undefined)),
    ),
  );
  let builder = new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]);
  if (options.include !== undefined) builder = builder.include(options.include);
  for (const selector of options.exclude ?? []) builder = builder.exclude(selector);
  const { violations } = await builder.analyze();
  expect(violations.map((v) => `${v.id}: ${v.help} (${v.nodes.length} nodes)`)).toEqual([]);
};
