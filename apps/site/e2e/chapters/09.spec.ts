/** Owner: chapter 09 agent. */

import { expectNoA11yViolations } from "../helpers/a11y.ts";
import { pagePath } from "../helpers/site.ts";
import { expect, test } from "../helpers/test.ts";

test.describe("chapter 09 (zaps)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(pagePath("en", "learn/zaps"));
    await expect(page.getByTestId("chapter-title")).toBeVisible();
  });

  test("steps a zap from profile lookup to a published receipt", async ({ page }) => {
    const flow = page.getByTestId("ch09-flow");
    await flow.scrollIntoViewIfNeeded();
    const detail = page.getByTestId("ch09-flow-detail");
    await expect(detail).toHaveAttribute("data-step", "profile");
    await expect(page.getByTestId("ch09-flow-detail-body")).toContainText(
      "erin@wallet.alpha.example",
    );

    const forward = page.getByTestId("ch09-swimlane-controls-forward");
    for (let i = 0; i < 8; i += 1) await forward.click();
    await expect(detail).toHaveAttribute("data-step", "receipt");
    await expect(page.getByTestId("ch09-flow-toast")).toBeVisible();
    await expect(page.getByTestId("ch09-swimlane-narration")).toContainText("zap receipt");

    await forward.click();
    await expect(page.getByTestId("ch09-flow-counter-value")).toContainText("2,100 sats");
  });

  test("the zap picker is keyboard operable and resets the flow", async ({ page }) => {
    await page.getByTestId("ch09-swimlane-controls-forward").click();
    await page.getByTestId("ch09-flow-pick-0-input").focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByTestId("ch09-flow-pick-1")).toHaveClass(/active/);
    await expect(page.getByTestId("ch09-flow-detail")).toHaveAttribute("data-step", "profile");
  });

  test("lud16 lookup turns an address into the well-known URL", async ({ page }) => {
    const input = page.getByTestId("ch09-lookup-input");
    await input.scrollIntoViewIfNeeded();
    await input.fill("satoshi@example.com");
    await expect(page.getByTestId("ch09-lookup-url")).toContainText(
      "example.com/.well-known/lnurlp/satoshi",
    );
    await input.fill("nope");
    await expect(page.getByTestId("ch09-lookup-error")).toHaveAttribute("data-code", "format");
  });

  test("receipt checker rejects forgeries and exposes the lying wallet", async ({ page }) => {
    const verdict = page.getByTestId("ch09-checker-verdict");
    await verdict.scrollIntoViewIfNeeded();
    await expect(verdict).toHaveAttribute("data-valid", "true");

    await page.getByTestId("ch09-checker-scenario-impostor").click();
    await expect(verdict).toHaveAttribute("data-valid", "false");
    await expect(page.getByTestId("ch09-checker-check-signer")).toHaveAttribute(
      "data-passed",
      "false",
    );

    await page.getByTestId("ch09-checker-scenario-liar").click();
    await expect(verdict).toHaveAttribute("data-valid", "true");
    await expect(page.getByTestId("ch09-checker-liar")).toBeVisible();
  });

  test("quiz accepts the right answer", async ({ page }) => {
    await page.getByTestId("ch09-quiz-1-option-wallet").click();
    await page.getByTestId("ch09-quiz-1-check").click();
    await expect(page.getByTestId("ch09-quiz-1-feedback")).toBeVisible();
  });

  test("fits a 375px phone without horizontal page scroll", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.getByTestId("ch09-flow").scrollIntoViewIfNeeded();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test("has no a11y violations (after interacting)", async ({ page }) => {
    await page.getByTestId("ch09-flow").scrollIntoViewIfNeeded();
    await page.getByTestId("ch09-swimlane-controls-forward").click();
    await page.getByTestId("ch09-checker-scenario-tampered").click();
    await expectNoA11yViolations(page);
  });
});
