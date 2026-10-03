/** Owner: chapter 04 agent. */

import { expectNoA11yViolations } from "../helpers/a11y.ts";
import { pagePath, useLiveTestRelay } from "../helpers/site.ts";
import { expect, test } from "../helpers/test.ts";

const url = pagePath("en", "learn/relays");

test.describe("chapter 04 (relays)", () => {
  test("renders and hydrates its interactive", async ({ page }) => {
    await page.goto(url);
    await expect(page.getByTestId("chapter-title")).toBeVisible();
    await expect(page.getByTestId("ch04-theater")).toBeVisible();
  });

  test("wire theater: step, jump via legend, switch conversation, play to the end", async ({
    page,
  }) => {
    await page.goto(url);
    const theater = page.getByTestId("ch04-theater");
    await theater.scrollIntoViewIfNeeded();
    const forward = page.getByTestId("ch04-wire-controls-forward");
    await forward.click();
    await expect(page.getByTestId("ch04-detail")).toHaveAttribute("data-verb", "REQ");
    await expect(page.getByTestId("ch04-wire-narration")).toContainText("Relay Alpha");
    await expect(page.getByTestId("ch04-nb-open")).toHaveText("Relay Alpha");

    await page.getByTestId("ch04-legend-EOSE").click();
    await expect(page.getByTestId("ch04-detail")).toHaveAttribute("data-verb", "EOSE");
    await expect(page.getByTestId("ch04-nb-unique")).toContainText("2");
    await expect(page.getByTestId("ch04-detail-frame")).toContainText('"EOSE"');

    await page.getByTestId("ch04-scenario-tab-auth").click();
    await expect(theater).toHaveAttribute("data-scenario", "auth");
    await expect(page.getByTestId("ch04-detail")).toHaveCount(0);
    await page.getByTestId("ch04-wire-controls-play").click();
    await expect(page.getByTestId("ch04-done")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId("ch04-nb-authed")).toHaveText("Relay Delta (paid)");
  });

  test("wire theater is keyboard operable", async ({ page }) => {
    await page.goto(url);
    await page.getByTestId("ch04-scenario-tab-read").focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByTestId("ch04-theater")).toHaveAttribute("data-scenario", "publish");
    await page.getByTestId("ch04-legend-OK").focus();
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("ch04-nb-accepted")).toHaveText("Relay Alpha");
  });

  test("redundancy lab: outages until the note is lost", async ({ page }) => {
    await page.goto(url);
    const lab = page.getByTestId("ch04-redundancy");
    await lab.scrollIntoViewIfNeeded();
    await expect(lab).toHaveAttribute("data-verdict", "safe");
    await page.getByTestId("ch04-redundancy-chaos").click();
    await expect(lab).toHaveAttribute("data-verdict", "safe");
    await page.getByTestId("ch04-redundancy-chaos").click();
    await expect(lab).toHaveAttribute("data-verdict", "lost");
    await page.getByTestId("ch04-relay-gamma-publish").check();
    await expect(lab).toHaveAttribute("data-verdict", "safe");
    await page.getByTestId("ch04-redundancy-reset").click();
    await expect(page.getByTestId("ch04-redundancy-copies")).toContainText("2 of 2");
  });

  test("frame log on practice relays: REQ, EVENTs, EOSE, CLOSE", async ({ page }) => {
    await page.goto(url);
    const live = page.getByTestId("ch04-live");
    await live.scrollIntoViewIfNeeded();
    await expect(live).toHaveAttribute("data-mode", "fixture");
    await page.getByTestId("ch04-live-send").click();
    await expect(live).toHaveAttribute("data-status", "done", { timeout: 10_000 });
    const frames = page.getByTestId("ch04-live-frame");
    await expect(frames.first()).toHaveAttribute("data-verb", "REQ");
    await expect(frames.last()).toHaveAttribute("data-verb", "CLOSE");
    await expect(
      page.locator('[data-testid="ch04-live-frame"][data-verb="EOSE"]').first(),
    ).toBeVisible();
  });

  test("live mode shows real frames from the local test relay (read-only)", async ({ page }) => {
    test.skip(process.env["E2E_NO_RELAY"] === "1", "test relay disabled");
    await useLiveTestRelay(page);
    await page.goto(url);
    const live = page.getByTestId("ch04-live");
    await live.scrollIntoViewIfNeeded();
    await expect(live).toHaveAttribute("data-mode", "live");
    await expect(page.getByTestId("ch04-live-badge")).toBeVisible();
    await page.getByTestId("ch04-live-send").click();
    await expect(live).toHaveAttribute("data-status", "done", { timeout: 15_000 });
    await expect(page.getByTestId("ch04-live-frame").first()).toContainText("127.0.0.1:7447");
    await expect(
      page.locator('[data-testid="ch04-live-frame"][data-verb="EVENT"]').first(),
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="ch04-live-frame"][data-direction="out"][data-verb="EVENT"]'),
    ).toHaveCount(0);
  });

  test("quiz answers give feedback", async ({ page }) => {
    await page.goto(url);
    await page.getByTestId("ch04-quiz-eose-option-a").click();
    await page.getByTestId("ch04-quiz-eose-check").click();
    await expect(page.getByTestId("ch04-quiz-eose-feedback")).toBeVisible();
  });

  test("no horizontal page scroll at phone width", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto(url);
    await page.getByTestId("ch04-theater").scrollIntoViewIfNeeded();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test("has no a11y violations (also after interacting)", async ({ page }) => {
    await page.goto(url);
    await expectNoA11yViolations(page);
    await page.getByTestId("ch04-legend-EVENT").click();
    await page.getByTestId("ch04-live-send").click();
    await expect(page.getByTestId("ch04-live")).toHaveAttribute("data-status", "done", {
      timeout: 10_000,
    });
    await expectNoA11yViolations(page, { include: '[data-testid="ch04-theater"]' });
    await expectNoA11yViolations(page, { include: '[data-testid="ch04-live"]' });
  });
});
