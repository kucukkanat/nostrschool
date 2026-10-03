/** Owner: chapter 11 agent. */

import ecosystem from "../../src/data/ecosystem.json" with { type: "json" };
import { expectNoA11yViolations } from "../helpers/a11y.ts";
import { pagePath } from "../helpers/site.ts";
import { expect, test } from "../helpers/test.ts";

const n = (x: number) => new Intl.NumberFormat("en-US").format(x);

test.describe("chapter 11 (ecosystem)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(pagePath("en", "learn/ecosystem"));
  });

  test("shows the snapshot date and real stats", async ({ page }) => {
    await expect(page.getByTestId("chapter-title")).toBeVisible();
    await expect(page.getByTestId("ch11-data-as-of-top-badge")).toContainText("Data as of");
    const explorer = page.getByTestId("ch11-explorer");
    await explorer.scrollIntoViewIfNeeded();
    // Count-up settles on the real number (instantly under reduced motion).
    await expect(page.getByTestId("ch11-stat-relays-value")).toHaveText(n(ecosystem.relays.online));
    await expect(page.getByTestId("ch11-stat-nips-value")).toHaveText(n(ecosystem.nips.total));
    await page.getByTestId("ch11-data-as-of-toggle").click();
    await expect(page.getByTestId("ch11-data-as-of-source-nip66")).toBeVisible();
  });

  test("touring all views narrates and completes the tour", async ({ page }) => {
    await page.getByTestId("ch11-explorer").scrollIntoViewIfNeeded();
    await expect(page.getByTestId("ch11-chart-software")).toBeVisible();

    await page.getByTestId("ch11-tabs-tab-nips").click();
    await expect(page.getByTestId("ch11-narration")).toContainText("NIPs view");
    const second = ecosystem.relays.nipSupport[1];
    if (second !== undefined) {
      await page.getByTestId(`ch11-nip-picker`).getByText(second.label, { exact: true }).click();
      await expect(page.getByTestId("ch11-nip-meter-value")).toContainText(
        `${n(second.value)} of ${n(ecosystem.relays.withNipList)}`,
      );
    }

    // Keyboard: arrow keys move between tabs (automatic activation).
    await page.getByTestId("ch11-tabs-tab-nips").focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByTestId("ch11-tabs-tab-growth")).toHaveAttribute("aria-selected", "true");
    const slider = page.getByTestId("ch11-growth-slider");
    await slider.focus();
    await page.keyboard.press("Home");
    const first = ecosystem.nips.growth[0];
    if (first !== undefined)
      await expect(page.getByTestId("ch11-growth-readout")).toContainText(`${first.count} NIPs`);

    await page.getByTestId("ch11-tabs-tab-clients").click();
    await expect(page.getByTestId("ch11-tour")).toHaveAttribute("data-complete", "true");
    await expect(page.getByTestId("ch11-narration")).toContainText("Tour complete");
  });

  test("client finder filters by platform", async ({ page }) => {
    await page.getByTestId("ch11-explorer").scrollIntoViewIfNeeded();
    await page.getByTestId("ch11-tabs-tab-clients").click();
    await page.getByTestId("ch11-platform-android").click();
    await expect(page.getByTestId("ch11-platform-android")).toHaveAttribute("aria-pressed", "true");
    const android = ecosystem.clients.items.filter((c) => c.platforms.includes("android"));
    await expect(page.getByTestId("ch11-client-count")).toContainText(`${android.length} clients`);
    await expect(page.getByTestId("ch11-client-amethyst")).toBeVisible();
    await expect(page.getByTestId("ch11-client-coracle")).toHaveCount(0);
    await page.getByTestId("ch11-clients-reset").click();
    await expect(page.getByTestId("ch11-client-coracle")).toBeVisible();
  });

  test("quiz answers give feedback", async ({ page }) => {
    await page.getByTestId("ch11-quiz-q2").scrollIntoViewIfNeeded();
    await page.getByTestId("ch11-quiz-q2-option-c").click();
    await page.getByTestId("ch11-quiz-q2-check").click();
    await expect(page.getByTestId("ch11-quiz-q2-feedback")).not.toBeEmpty();
  });

  test("fits a 375px viewport without horizontal scroll", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.getByTestId("ch11-explorer").scrollIntoViewIfNeeded();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test("has no a11y violations (each explorer view)", async ({ page }) => {
    await page.getByTestId("ch11-explorer").scrollIntoViewIfNeeded();
    await expect(page.getByTestId("ch11-chart-software")).toBeVisible();
    await expectNoA11yViolations(page);
    for (const view of ["nips", "growth", "clients"]) {
      await page.getByTestId(`ch11-tabs-tab-${view}`).click();
      await expectNoA11yViolations(page, { include: '[data-testid="ch11-explorer"]' });
    }
  });
});
