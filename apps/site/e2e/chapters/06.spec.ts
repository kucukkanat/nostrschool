/** Owner: chapter 06 agent. */

import { expectNoA11yViolations } from "../helpers/a11y.ts";
import { pagePath } from "../helpers/site.ts";
import { expect, test } from "../helpers/test.ts";

test.describe("chapter 06 (kinds)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(pagePath("en", "learn/kinds"));
  });

  test("periodic table: filter, select, explore all categories", async ({ page }) => {
    await expect(page.getByTestId("chapter-title")).toBeVisible();
    const table = page.getByTestId("ch06-table");
    await table.scrollIntoViewIfNeeded();
    await expect(page.getByTestId("ch06-table-tile-1")).toHaveAttribute("aria-pressed", "true");

    // Category chips hide and restore a whole group.
    await page.getByTestId("ch06-table-filters-chip-ephemeral").click();
    await expect(page.getByTestId("ch06-table-group-ephemeral")).toHaveCount(0);
    await page.getByTestId("ch06-table-filters-all").click();
    await expect(page.getByTestId("ch06-table-group-ephemeral")).toBeVisible();

    // Search narrows the grid.
    await page.getByTestId("ch06-table-filters-search").fill("zap");
    await expect(page.getByTestId("ch06-table-filters-count")).toContainText("3");
    await page.getByTestId("ch06-table-filters-search").fill("");

    for (const kind of [0, 22242, 30023]) await page.getByTestId(`ch06-table-tile-${kind}`).click();
    await expect(page.getByTestId("ch06-table-detail-name")).toContainText("Long-form article");
    await expect(page.getByTestId("ch06-table-detail-nip")).toHaveAttribute(
      "href",
      "https://github.com/nostr-protocol/nips/blob/master/23.md",
    );
    await expect(page.getByTestId("ch06-table-explored")).toHaveAttribute("data-count", "4");
    await expect(page.getByTestId("ch06-table-narration")).toContainText("Long-form article");
  });

  test("periodic table is keyboard operable", async ({ page }) => {
    const first = page.getByTestId("ch06-table-tile-1");
    await first.focus();
    await page.keyboard.press("ArrowRight");
    const next = page.getByTestId("ch06-table-tile-4");
    await expect(next).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(next).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByTestId("ch06-table-detail-name")).toContainText(
      "Encrypted direct message",
    );
  });

  test("storage simulator: replaceable keeps only the newest", async ({ page }) => {
    const sim = page.getByTestId("ch06-storage");
    await sim.scrollIntoViewIfNeeded();
    await page.getByTestId("ch06-storage-cat-replaceable").click();
    await page.getByTestId("ch06-storage-publish").click();
    await page.getByTestId("ch06-storage-publish").click();
    await expect(page.getByTestId("ch06-storage-outcome")).toHaveAttribute(
      "data-outcome",
      "replaced",
    );
    await expect(page.getByTestId("ch06-storage-count")).toHaveText("1 event stored");
    await page.getByTestId("ch06-storage-stale").click();
    await expect(page.getByTestId("ch06-storage-outcome")).toHaveAttribute(
      "data-outcome",
      "ignored-older",
    );
    await page.getByTestId("ch06-storage-cat-regular").click();
    await page.getByTestId("ch06-storage-publish").click();
    await page.getByTestId("ch06-storage-publish").click();
    await expect(page.getByTestId("ch06-storage-count")).toHaveText("2 events stored");
  });

  test("classifier explains any kind number", async ({ page }) => {
    const input = page.getByTestId("ch06-classifier-input");
    await input.scrollIntoViewIfNeeded();
    await input.fill("20001");
    await expect(page.getByTestId("ch06-classifier-category")).toHaveAttribute(
      "data-tone",
      "ephemeral",
    );
    await input.fill("70000");
    await expect(page.getByTestId("ch06-classifier-error")).toHaveAttribute(
      "data-code",
      "out-of-range",
    );
  });

  test("quiz answers", async ({ page }) => {
    await page.getByTestId("ch06-quiz-profile-option-one").click();
    await page.getByTestId("ch06-quiz-profile-check").click();
    await expect(page.getByTestId("ch06-quiz-profile-feedback")).toBeVisible();
  });

  test("has no a11y violations", async ({ page }) => {
    await page.getByTestId("ch06-table-tile-30023").click();
    await expectNoA11yViolations(page);
  });
});

test.describe("tools/kinds", () => {
  test("searchable table opens a detail panel", async ({ page }) => {
    await page.goto(pagePath("en", "tools/kinds"));
    await expect(page.getByTestId("tool-title")).toBeVisible();
    await page.getByTestId("ch06-reference-filters-search").fill("relay list");
    await expect(page.getByTestId("ch06-reference-row-10002")).toBeVisible();
    await expect(page.getByTestId("ch06-reference-row-1")).toHaveCount(0);
    await page.getByTestId("ch06-reference-show-10002").click();
    await expect(page.getByTestId("ch06-reference-detail-name")).toContainText("Relay list");
    await expectNoA11yViolations(page);
  });
});
