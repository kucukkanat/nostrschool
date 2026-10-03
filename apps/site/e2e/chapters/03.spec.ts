/** Owner: chapter 03 agent. */

import { expectNoA11yViolations } from "../helpers/a11y.ts";
import { pagePath } from "../helpers/site.ts";
import { expect, test } from "../helpers/test.ts";

test.describe("chapter 03 (events)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(pagePath("en", "learn/events"));
    await expect(page.getByTestId("chapter-title")).toBeVisible();
    await page.getByTestId("ch03-lab").scrollIntoViewIfNeeded();
  });

  test("lab starts valid and explains fields", async ({ page }) => {
    await expect(page.getByTestId("ch03-lab-verdict")).toHaveAttribute("data-status", "ok");
    await page.getByTestId("ch03-exploded-field-tags").click();
    await expect(page.getByTestId("ch03-detail")).toHaveAttribute("data-field", "tags");
    await expect(page.getByTestId("ch03-detail-tag-0")).toContainText("hashtag");
  });

  test("author edits stay valid; the id avalanches", async ({ page }) => {
    await page.getByTestId("ch03-lab-content").fill("Hello Nostr? Edited!");
    await expect(page.getByTestId("ch03-lab-verdict")).toHaveAttribute("data-status", "ok");
    await expect(page.getByTestId("ch03-lab-avalanche-count")).toContainText("of 64");
    await expect(page.getByTestId("ch03-pipeline-wrap")).toHaveAttribute("data-status", "ok");
  });

  test("forger edit breaks the id, mascot panics, re-sign is refused", async ({ page }) => {
    await page.getByTestId("ch03-lab-mode-forger").click();
    await page.getByTestId("ch03-lab-content").fill("Send all sats to Mallory");
    await expect(page.getByTestId("ch03-lab-verdict")).toHaveAttribute("data-code", "id-mismatch");
    await expect(page.getByTestId("ch03-pipeline-wrap")).toHaveAttribute("data-status", "error");
    await expect(page.getByTestId("ch03-pipeline-stage-compare")).toHaveAttribute(
      "data-state",
      "error",
    );
    await expect(page.getByTestId("ch03-mascot")).toHaveAttribute("data-pose", "panic");
    await page.getByTestId("ch03-lab-resign").click();
    await expect(page.getByTestId("ch03-lab-narration")).toContainText("Forgers can't re-sign");
  });

  test("tampering the sig fails at the last stage; keyboard works", async ({ page }) => {
    await page.getByTestId("ch03-lab-tamper-sig").focus();
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("ch03-lab-verdict")).toHaveAttribute(
      "data-code",
      "bad-signature",
    );
    await expect(page.getByTestId("ch03-pipeline-stage-schnorr")).toHaveAttribute(
      "data-state",
      "error",
    );
    await expect(page.getByTestId("ch03-exploded-flag-sig")).toBeVisible();
    await page.getByTestId("ch03-lab-resign").click();
    await expect(page.getByTestId("ch03-lab-verdict")).toHaveAttribute("data-status", "ok");
  });

  test("quiz answers give feedback", async ({ page }) => {
    await page.getByTestId("ch03-quiz-id-option-a").click();
    await page.getByTestId("ch03-quiz-id-check").click();
    await expect(page.getByTestId("ch03-quiz-id-feedback")).toBeVisible();
  });

  test("has no a11y violations (also after tampering)", async ({ page }) => {
    await expectNoA11yViolations(page);
    await page.getByTestId("ch03-lab-tamper-content").click();
    await expect(page.getByTestId("ch03-lab-verdict")).toHaveAttribute("data-status", "error");
    await expectNoA11yViolations(page, { include: '[data-testid="ch03-lab"]' });
  });
});

test.describe("tool: event inspector", () => {
  test("validates a sample, catches tampering and bad JSON", async ({ page }) => {
    await page.goto(pagePath("en", "tools/event-inspector"));
    await expect(page.getByTestId("tool-title")).toBeVisible();
    await page.getByTestId("ch03-inspector-sample").click();
    await expect(page.getByTestId("ch03-inspector-verdict")).toHaveAttribute("data-status", "ok");
    await page.getByTestId("ch03-inspector-tampered").click();
    await expect(page.getByTestId("ch03-inspector-verdict")).toHaveAttribute(
      "data-code",
      "id-mismatch",
    );
    await page.getByTestId("ch03-inspector-input").fill("{ not json");
    await page.getByTestId("ch03-inspector-inspect").click();
    await expect(page.getByTestId("ch03-inspector-error")).toHaveAttribute(
      "data-code",
      "invalid-json",
    );
    await expectNoA11yViolations(page);
  });
});
