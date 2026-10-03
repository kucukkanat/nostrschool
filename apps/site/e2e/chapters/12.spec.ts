/** Owner: chapter 12 agent. */

import { expectNoA11yViolations } from "../helpers/a11y.ts";
import { pagePath } from "../helpers/site.ts";
import { expect, type Page, test } from "../helpers/test.ts";

/** Islands are client:visible: scroll in and wait until Astro drops the `ssr` marker (hydrated). */
const hydrate = async (page: Page, testid: string): Promise<void> => {
  await page.getByTestId(testid).scrollIntoViewIfNeeded();
  await expect(
    page.locator(`astro-island:has([data-testid="${testid}"])`).first(),
  ).not.toHaveAttribute("ssr", "");
};

test.describe("chapter 12 (trade-offs)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(pagePath("en", "learn/trade-offs"));
    await expect(page.getByTestId("chapter-title")).toBeVisible();
  });

  test("comparison matrix re-ranks by priorities and explains cells", async ({ page }) => {
    await hydrate(page, "ch12-matrix");
    await expect(page.getByTestId("ch12-rank-bluesky")).toHaveAttribute("data-rank", "1");
    await page.getByTestId("ch12-preset-dissident").click();
    await expect(page.getByTestId("ch12-rank-nostr")).toHaveAttribute("data-rank", "1");
    await expect(page.getByTestId("ch12-verdict")).toContainText("Nostr comes out on top");

    // Keyboard: focus a cell and activate it with Enter.
    await page.getByTestId("ch12-cell-recovery-nostr").focus();
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("ch12-detail-text")).toContainText("forgot password");
  });

  test("scenario toggles change outcomes; precautions rescue Nostr", async ({ page }) => {
    await hydrate(page, "ch12-scenarios");
    await expect(page.getByTestId("ch12-outcome-nostr")).toHaveAttribute(
      "data-severity",
      "disaster",
    );
    await page.getByTestId("ch12-scenario-relayBan").click();
    await expect(page.getByTestId("ch12-outcome-x")).toHaveAttribute("data-severity", "disaster");
    await page.getByTestId("ch12-prep-backup").click();
    await page.getByTestId("ch12-prep-multiRelay").click();
    await expect(page.getByTestId("ch12-outcome-nostr")).toHaveAttribute("data-severity", "fine");
    await expect(page.getByTestId("ch12-scenarios-narration")).toContainText("Nostr: No big deal");
  });

  test("proof-of-work miner finds and signs a note", async ({ page }) => {
    await hydrate(page, "ch12-pow");
    await page.getByTestId("ch12-pow-difficulty").fill("8");
    await page.getByTestId("ch12-pow-mine").click();
    await expect(page.getByTestId("ch12-pow")).toHaveAttribute("data-status", "found", {
      timeout: 15_000,
    });
    await expect(page.getByTestId("ch12-pow-signed")).toBeVisible();
    await expect(page.getByTestId("ch12-pow-best-id")).toHaveText(/^00/);
  });

  test("course finale celebrates and links onward", async ({ page }) => {
    await hydrate(page, "ch12-complete");
    await page.getByTestId("ch12-celebrate").click();
    await expect(page.getByTestId("ch12-celebrate-status")).not.toBeEmpty();
    await expect(page.getByTestId("ch12-next-keys")).toHaveAttribute(
      "href",
      /\/en\/tools\/keys\/$/,
    );
  });

  test("quiz grades an answer", async ({ page }) => {
    await hydrate(page, "ch12-quiz");
    await page.getByTestId("ch12-quiz-q2-option-a").click();
    await page.getByTestId("ch12-quiz-q2-check").click();
    await expect(page.getByTestId("ch12-quiz-q2-feedback")).not.toBeEmpty();
  });

  test("fits a 375px viewport without horizontal page scroll", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await hydrate(page, "ch12-matrix");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(overflow).toBe(false);
  });

  test("has no a11y violations", async ({ page }) => {
    // Hydrate every island (client:visible) before scanning.
    for (const id of ["ch12-pow", "ch12-scenarios", "ch12-matrix", "ch12-quiz", "ch12-complete"])
      await hydrate(page, id);
    await page.getByTestId("ch12-cell-spam-nostr").click();
    await expectNoA11yViolations(page);
  });
});
