/** Owner: chapter 10 agent. */

import { expectNoA11yViolations } from "../helpers/a11y.ts";
import { pagePath } from "../helpers/site.ts";
import { expect, test } from "../helpers/test.ts";

test.describe("chapter 10 (signing)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(pagePath("en", "learn/signing"));
    await expect(page.getByTestId("chapter-title")).toBeVisible();
  });

  test("extension signer: approve signs without leaking the key", async ({ page }) => {
    const playground = page.getByTestId("ch10-playground");
    await playground.scrollIntoViewIfNeeded();
    await page.getByTestId("ch10-sign").click();
    await expect(page.getByTestId("ch10-prompt")).toBeVisible();
    await page.getByTestId("ch10-approve").click();
    await expect(page.getByTestId("ch10-result")).toHaveAttribute("data-verdict", "safe");
    await expect(page.getByTestId("ch10-audit")).toHaveAttribute("data-audit", "safe");
    await expect(page.getByTestId("ch10-wire-publish")).toBeVisible();
    await expect(page.getByTestId("ch10-memory")).not.toContainText("nsec1");
  });

  test("pasting the nsec trips the leak detector", async ({ page }) => {
    await page.getByTestId("ch10-mode-paste").click();
    await page.getByTestId("ch10-sign").click();
    await expect(page.getByTestId("ch10-result")).toHaveAttribute("data-verdict", "leaked");
    await expect(page.getByTestId("ch10-memory-nsec")).toContainText("nsec1");
  });

  test("bunker: encrypted kind 24133 hops, keyboard operable", async ({ page }) => {
    await page.getByTestId("ch10-mode-nip46-input").focus();
    await page.keyboard.press("Space");
    await page.getByTestId("ch10-sign").focus();
    await page.keyboard.press("Enter");
    await page.getByTestId("ch10-approve").focus();
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("ch10-wire-nip46PubkeyReq")).toBeVisible();
    await expect(page.getByTestId("ch10-wire-nip46SignReq")).toBeVisible();
    await page.getByTestId("ch10-wire-nip46SignReq-toggle").click();
    await expect(page.getByTestId("ch10-wire-nip46SignReq")).toContainText("24133");
    await expect(page.getByTestId("ch10-verdict")).toHaveText(/never saw your secret key/);
  });

  test("sequence diagrams step through both flows", async ({ page }) => {
    const seq = page.getByTestId("ch10-sequences");
    await seq.scrollIntoViewIfNeeded();
    await page.getByTestId("ch10-seq-nip07-controls-forward").click();
    await expect(page.getByTestId("ch10-seq-nip07-narration")).toContainText("who is logged in");
    await page.getByTestId("ch10-seq-tabs-tab-nip46").click();
    await page.getByTestId("ch10-seq-nip46-controls-forward").click();
    await expect(page.getByTestId("ch10-seq-nip46-narration")).toContainText("bunker://");
  });

  test("NIP-05 checker verifies and catches a borrowed name", async ({ page }) => {
    await page.getByTestId("ch10-nip05").scrollIntoViewIfNeeded();
    await page.getByTestId("ch10-nip05-verify").click();
    await expect(page.getByTestId("ch10-nip05-result")).toHaveAttribute("data-code", "ok");
    await page.getByTestId("ch10-nip05-scenario-impostor").click();
    await expect(page.getByTestId("ch10-nip05-result")).toHaveAttribute(
      "data-code",
      "pubkey-mismatch",
    );
  });

  test("works at 375px without horizontal scroll", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.getByTestId("ch10-playground").scrollIntoViewIfNeeded();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(overflow).toBe(false);
  });

  test("has no a11y violations (after interacting)", async ({ page }) => {
    await page.getByTestId("ch10-sign").click();
    await page.getByTestId("ch10-approve").click();
    await page.getByTestId("ch10-nip05-verify").click();
    await expectNoA11yViolations(page);
  });
});
