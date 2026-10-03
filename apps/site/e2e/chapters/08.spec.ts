/** Owner: chapter 08 agent. */

import { expectNoA11yViolations } from "../helpers/a11y.ts";
import { pagePath } from "../helpers/site.ts";
import { expect, test } from "../helpers/test.ts";

test.describe("chapter 08 (private-messages)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(pagePath("en", "learn/private-messages"));
    await expect(page.getByTestId("chapter-title")).toBeVisible();
    await page.getByTestId("ch08-lab").scrollIntoViewIfNeeded();
    await expect(page.getByTestId("ch08-fact-sender")).toBeVisible();
    // Astro drops the `ssr` attribute once an island has hydrated; clicks before that are no-ops.
    await expect(page.locator('astro-island:has([data-testid="ch08-lab"])')).not.toHaveAttribute(
      "ssr",
      /.*/,
    );
  });

  test("NIP-04 leaks metadata; NIP-17 hides all but the recipient", async ({ page }) => {
    await expect(page.getByTestId("ch08-leak-summary")).toHaveAttribute("data-leaks", "5");
    await expect(page.getByTestId("ch08-fact-sender")).toHaveAttribute("data-exposure", "leaked");
    await page.getByTestId("ch08-scheme-nip17").click();
    await expect(page.getByTestId("ch08-scheme-nip17")).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByTestId("ch08-leak-summary")).toHaveAttribute("data-leaks", "1");
    await expect(page.getByTestId("ch08-fact-sender")).toHaveAttribute("data-exposure", "hidden");
    await expect(page.getByTestId("ch08-fact-recipient")).toHaveAttribute(
      "data-exposure",
      "leaked",
    );
  });

  test("Bob peels wrap → seal → rumor and reads the real message", async ({ page }) => {
    await page.getByTestId("ch08-message-input").fill("Bakery at nine");
    await page.getByTestId("ch08-scheme-nip17").click();
    await page.getByTestId("ch08-peel").click();
    await expect(page.getByTestId("ch08-layer-wrap")).toHaveAttribute("data-state", "open");
    await expect(page.getByTestId("ch08-layer-seal")).toBeVisible();
    await page.getByTestId("ch08-peel").click();
    await expect(page.getByTestId("ch08-revealed-text")).toHaveText("Bakery at nine");
    await expect(page.getByTestId("ch08-author-check")).toBeVisible();
    await expect(page.getByTestId("ch08-narration")).toContainText("Bakery at nine");
    await expect(page.getByTestId("ch08-peel")).toBeDisabled();
    await page.getByTestId("ch08-reset").click();
    await expect(page.getByTestId("ch08-stack")).toHaveAttribute("data-opened", "0");
  });

  test("Carol and the relay are locked out (keyboard only)", async ({ page }) => {
    await page.getByTestId("ch08-scheme-nip17").focus();
    await page.keyboard.press("Enter");
    await page.getByTestId("ch08-viewer-carol").focus();
    await page.keyboard.press("Enter");
    await page.getByTestId("ch08-peel").focus();
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("ch08-peel-error")).toBeVisible();
    await expect(page.getByTestId("ch08-revealed")).toHaveCount(0);
    await page.getByTestId("ch08-viewer-relay").click();
    await page.getByTestId("ch08-peel").click();
    await expect(page.getByTestId("ch08-peel-error")).toBeVisible();
  });

  test("resend changes the throwaway key", async ({ page }) => {
    await page.getByTestId("ch08-scheme-nip17").click();
    await page.getByTestId("ch08-raw-toggle").click();
    const pubkey = page.getByTestId("ch08-raw-json-path-pubkey");
    const before = await pubkey.textContent();
    await page.getByTestId("ch08-resend").click();
    await expect(pubkey).not.toHaveText(before ?? "");
  });

  test("padding meter buckets sizes", async ({ page }) => {
    const input = page.getByTestId("ch08-padding-input");
    await input.scrollIntoViewIfNeeded();
    await expect(
      page.locator('astro-island:has([data-testid="ch08-padding"])'),
    ).not.toHaveAttribute("ssr", /.*/);
    await input.fill("x".repeat(40));
    await expect(page.getByTestId("ch08-padding-value-nip44")).toHaveText("64 bytes");
  });

  test("quiz renders", async ({ page }) => {
    await page.getByTestId("ch08-quiz").scrollIntoViewIfNeeded();
    await expect(page.locator('astro-island:has([data-testid="ch08-quiz"])')).not.toHaveAttribute(
      "ssr",
      /.*/,
    );
    await page.getByTestId("ch08-quiz-q1-option-b").check({ force: true });
    await page.getByTestId("ch08-quiz-q1-check").click();
    await expect(page.getByTestId("ch08-quiz-q1")).toHaveAttribute("data-result", "correct");
  });

  test("has no a11y violations (sealed and fully opened)", async ({ page }) => {
    await expectNoA11yViolations(page);
    await page.getByTestId("ch08-scheme-nip17").click();
    await page.getByTestId("ch08-peel").click();
    await page.getByTestId("ch08-peel").click();
    await page.getByTestId("ch08-raw-toggle").click();
    await expectNoA11yViolations(page, { include: '[data-testid="ch08-lab"]' });
  });
});
