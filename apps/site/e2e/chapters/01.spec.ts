/** Owner: chapter 01 agent. */

import { expectNoA11yViolations } from "../helpers/a11y.ts";
import { pagePath } from "../helpers/site.ts";
import { expect, test } from "../helpers/test.ts";

test.describe("chapter 01 (why-nostr)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(pagePath("en", "learn/why-nostr"));
    await expect(page.getByTestId("chapter-title")).toBeVisible();
    const sandbox = page.getByTestId("ch01-sandbox");
    await sandbox.scrollIntoViewIfNeeded();
    await expect(sandbox).toBeVisible();
  });

  test("killing the central server silences everyone, reset restores", async ({ page }) => {
    const health = page.getByTestId("ch01-health");
    await expect(health).toHaveAttribute("data-alive", "20");
    await page.getByTestId("ch01-node-platform").click();
    await expect(page.getByTestId("ch01-node-platform")).toHaveAttribute("data-state", "down");
    await expect(health).toHaveAttribute("data-alive", "0");
    await expect(page.getByTestId("ch01-user-alice")).toHaveAttribute("data-voice", "silenced");
    await expect(page.getByTestId("ch01-narration")).toContainText("BigCo went offline");
    await page.getByTestId("ch01-reset").click();
    await expect(health).toHaveAttribute("data-alive", "20");
  });

  test("federated: a dead instance takes its accounts with it", async ({ page }) => {
    await page.getByTestId("ch01-models-tab-federated").click();
    await page.getByTestId("ch01-node-tea").click();
    await expect(page.getByTestId("ch01-health")).toHaveAttribute("data-alive", "6");
    await expect(page.getByTestId("ch01-user-alice-account")).toContainText("tea.social");
    await expect(page.getByTestId("ch01-user-carol")).toHaveAttribute("data-voice", "partial");
  });

  test("nostr survives a dead relay and a ban, operated by keyboard", async ({ page }) => {
    await page.getByTestId("ch01-models-tab-nostr").click();
    await expect(page.getByTestId("ch01-panel")).toHaveAttribute("data-model", "nostr");
    const alpha = page.getByTestId("ch01-node-alpha");
    await alpha.focus();
    await page.keyboard.press("Enter");
    await expect(alpha).toHaveAttribute("aria-pressed", "true");
    await page.getByTestId("ch01-ban").click();
    await expect(page.getByTestId("ch01-health")).toHaveAttribute("data-alive", "20");
    await expect(page.getByTestId("ch01-user-alice")).toHaveAttribute("data-voice", "full");
    await expect(page.getByTestId("ch01-verdict")).toContainText("resilient");
  });

  test("bluesky: the AppView is a chokepoint", async ({ page }) => {
    await page.getByTestId("ch01-models-tab-bluesky").click();
    await page.getByTestId("ch01-node-appview").click();
    await expect(page.getByTestId("ch01-health")).toHaveAttribute("data-alive", "0");
  });

  test("resilience chart and quiz render", async ({ page }) => {
    await page.getByTestId("ch01-resilience").scrollIntoViewIfNeeded();
    await expect(page.getByTestId("ch01-resilience-chart-bar-nostr")).toBeVisible();
    const quiz = page.getByTestId("ch01-quiz-2");
    await quiz.scrollIntoViewIfNeeded();
    await page.getByTestId("ch01-quiz-2-option-b").click();
    await page.getByTestId("ch01-quiz-2-check").click();
    await expect(page.getByTestId("ch01-quiz-2-feedback")).toBeVisible();
  });

  test("fits a 375px viewport without horizontal scroll", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.getByTestId("ch01-sandbox").scrollIntoViewIfNeeded();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test("has no a11y violations (initial and after damage)", async ({ page }) => {
    await expectNoA11yViolations(page);
    await page.getByTestId("ch01-node-platform").click();
    await page.getByTestId("ch01-ban").click();
    await expectNoA11yViolations(page, { include: '[data-testid="ch01-sandbox"]' });
  });
});
