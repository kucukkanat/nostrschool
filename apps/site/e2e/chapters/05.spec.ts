/** Owner: chapter 05 agent. */

import { expectNoA11yViolations } from "../helpers/a11y.ts";
import { pagePath, useLiveTestRelay } from "../helpers/site.ts";
import { expect, test } from "../helpers/test.ts";

// Alice's fixture pubkey (sha256("nostrschool:persona:alice") → secp256k1), public by design.
const ALICE = "e550c6e92808f358382b7b8c14345344f5ef9a299529834d1c26d57b6ace44cc";

test.describe("chapter 05 (filters)", () => {
  test("building a filter lights up matching events and updates the JSON", async ({ page }) => {
    await page.goto(pagePath("en", "learn/filters"));
    await expect(page.getByTestId("chapter-title")).toBeVisible();
    const builder = page.getByTestId("ch05-builder");
    await builder.scrollIntoViewIfNeeded();
    await expect(builder).toHaveAttribute("data-returned", "60");

    await page.getByTestId(`ch05-builder-field-authors-chip-${ALICE}`).click();
    await page.getByTestId("ch05-builder-field-kinds-chip-1").click();
    await expect(page.getByTestId("ch05-builder-narration")).toContainText("written by Alice");
    await expect(page.getByTestId("ch05-builder-req")).toContainText(`"authors":["${ALICE}"]`);
    const returned = Number(await builder.getAttribute("data-returned"));
    expect(returned).toBeGreaterThan(0);
    expect(returned).toBeLessThan(60);
    await expect(
      page.locator('[data-testid^="ch05-builder-card-"][data-state="match"]'),
    ).toHaveCount(returned);

    // Keyboard: pick a lit card and ask why it matched.
    const lit = page.locator('[data-testid^="ch05-builder-card-"][data-state="match"]').first();
    await lit.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("ch05-builder-explain-verdict")).toContainText("relay sends it");
    await expect(page.getByTestId("ch05-builder-explain-check-kinds")).toHaveAttribute(
      "data-passed",
      "true",
    );

    await page.getByTestId("ch05-builder-reset").click();
    await expect(builder).toHaveAttribute("data-returned", "60");
  });

  test("solving a quest marks it solved", async ({ page }) => {
    await page.goto(pagePath("en", "learn/filters"));
    const quest = page.getByTestId("ch05-quest");
    await quest.scrollIntoViewIfNeeded();
    await page.getByTestId("ch05-quest-builder-field-kinds-chip-0").click();
    await page.getByTestId("ch05-quest-builder-field-limit-enable").check();
    await page.getByTestId("ch05-quest-builder-field-limit-slider").fill("3");
    await expect(page.getByTestId("ch05-quest-quest-profiles")).toHaveAttribute(
      "data-solved",
      "true",
    );
    await expect(page.getByTestId("ch05-quest-progress")).toContainText("1 of 4");
  });

  test("has no a11y violations", async ({ page }) => {
    await page.goto(pagePath("en", "learn/filters"));
    await page.getByTestId("ch05-builder").scrollIntoViewIfNeeded();
    await page.getByTestId("ch05-quest").scrollIntoViewIfNeeded();
    await expectNoA11yViolations(page);
  });
});

test.describe("tool: filter playground", () => {
  test("runs the filter against the sample relays", async ({ page }) => {
    await page.goto(pagePath("en", "tools/filter-playground"));
    await expect(page.getByTestId("tool-title")).toBeVisible();
    await page.getByTestId("ch05-playground-builder-preset-hashtag").click();
    await page.getByTestId("ch05-playground-runner-send").click();
    const runner = page.getByTestId("ch05-playground-runner");
    await expect(runner).toHaveAttribute("data-mode", "fixture");
    await expect(runner).toHaveAttribute("data-status", "done", { timeout: 10_000 });
    await expect(
      page.locator('[data-testid^="ch05-playground-runner-frame-"][data-type="EOSE"]').first(),
    ).toBeVisible();
    await expect(
      page.locator('[data-testid^="ch05-playground-runner-result-"]').first(),
    ).toBeVisible();
  });

  test("the JSON editor drives the builder", async ({ page }) => {
    await page.goto(pagePath("en", "tools/filter-playground"));
    const editor = page.getByTestId("ch05-playground-builder-editor-input");
    await editor.fill('{"kinds":[0],"limit":3}');
    await page.getByTestId("ch05-playground-builder-editor-apply").click();
    await expect(page.getByTestId("ch05-playground-builder")).toHaveAttribute("data-returned", "3");
    await editor.fill("{nope");
    await page.getByTestId("ch05-playground-builder-editor-apply").click();
    await expect(page.getByTestId("ch05-playground-builder-editor-status")).toContainText("JSON");
  });

  test("live mode queries the local test relay", async ({ page }) => {
    test.skip(process.env["E2E_NO_RELAY"] === "1", "test relay disabled");
    await useLiveTestRelay(page);
    await page.goto(pagePath("en", "tools/filter-playground"));
    const runner = page.getByTestId("ch05-playground-runner");
    await expect(runner).toHaveAttribute("data-mode", "live");
    await page.getByTestId("ch05-playground-builder-field-kinds-chip-1").click();
    await page.getByTestId("ch05-playground-runner-send").click();
    await expect(runner).toHaveAttribute("data-status", "done", { timeout: 15_000 });
    await expect(page.getByTestId("ch05-playground-runner-safe-limit")).toBeVisible();
    await expect(
      page.locator('[data-testid^="ch05-playground-runner-result-"]').first(),
    ).toBeVisible();
  });

  test("has no a11y violations", async ({ page }) => {
    await page.goto(pagePath("en", "tools/filter-playground"));
    await expectNoA11yViolations(page);
  });
});
