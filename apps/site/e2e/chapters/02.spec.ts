/** Owner: chapter 02 agent. */

import { expectNoA11yViolations } from "../helpers/a11y.ts";
import { pagePath } from "../helpers/site.ts";
import { expect, test } from "../helpers/test.ts";

const BECH32 = "[02-9ac-hj-np-z]";

test.describe("chapter 02 (keys)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(pagePath("en", "learn/keys"));
    await expect(page.getByTestId("chapter-title")).toBeVisible();
  });

  test("forge a demo key and encode it into an npub", async ({ page }) => {
    const forge = page.getByTestId("ch02-forge");
    await forge.scrollIntoViewIfNeeded();
    await expect(page.getByTestId("ch02-sample-badge")).toBeVisible();
    const samplePub = await page.getByTestId("ch02-public-hex").innerText();

    await page.getByTestId("ch02-generate").click();
    await expect(page.getByTestId("ch02-demo-badge")).toBeVisible();
    await expect(page.getByTestId("ch02-public-hex")).not.toHaveText(samplePub);
    await expect(page.getByTestId("ch02-public-hex")).toHaveText(/^[0-9a-f]{64}$/);
    await expect(page.getByTestId("ch02-secret-hex")).toHaveAttribute("data-masked", "true");

    // Generating autoplays; pause, rewind, step once, then skip to the end.
    await expect(page.getByTestId("ch02-playback")).toHaveAttribute("data-playing", "true");
    // Let autoplay advance at least one character so there is something to rewind.
    await expect(page.getByTestId("ch02-playback-reset")).toBeEnabled();
    await page.getByTestId("ch02-playback-play").click();
    await page.getByTestId("ch02-playback-reset").click();
    await page.getByTestId("ch02-playback-forward").click();
    await expect(page.getByTestId("ch02-narration")).toContainText("Character 1 of 58");
    await page.getByTestId("ch02-skip").click();
    await expect(page.getByTestId("ch02-encoded")).toHaveAttribute("data-done", "true");
    await expect(page.getByTestId("ch02-encoded-text")).toHaveText(
      new RegExp(`^npub1${BECH32}{58}$`),
    );
    await expect(page.getByTestId("ch02-copy-npub")).toBeVisible();
  });

  test("a finished npub never widens the page at phone width", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.getByTestId("ch02-forge").scrollIntoViewIfNeeded();
    await page.getByTestId("ch02-skip").click();
    await expect(page.getByTestId("ch02-encoded")).toHaveAttribute("data-done", "true");
    const overflow = await page.evaluate(() => {
      const root = document.documentElement;
      return root.scrollWidth - root.clientWidth;
    });
    expect(overflow).toBeLessThanOrEqual(0);
    const forge = await page.getByTestId("ch02-forge").boundingBox();
    expect(forge?.width ?? Number.POSITIVE_INFINITY).toBeLessThanOrEqual(375);
  });

  test("peek and nsec encoding are keyboard operable", async ({ page }) => {
    await page.getByTestId("ch02-peek").focus();
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("ch02-secret-hex")).toHaveAttribute("data-masked", "false");
    await page.getByTestId("ch02-target-nsec").focus();
    await page.keyboard.press("Space");
    await expect(page.getByTestId("ch02-encoder")).toHaveAttribute("data-target", "nsec");
    await page.getByTestId("ch02-skip").click();
    await expect(page.getByTestId("ch02-encoded-text")).toHaveText(
      new RegExp(`^nsec1${BECH32}{58}$`),
    );
  });

  test("one-way clock: hop forward, brute-force backward", async ({ page }) => {
    const clock = page.getByTestId("ch02-clock");
    await clock.scrollIntoViewIfNeeded();
    await page.getByTestId("ch02-clock-slider").fill("4");
    await page.getByTestId("ch02-clock-hop").click();
    await expect(clock).toHaveAttribute("data-mode", "landed");
    await page.getByTestId("ch02-clock-reverse").click();
    await expect(page.getByTestId("ch02-clock-found")).toHaveText("Found it after 4 guesses.");
  });

  test("signature stamp breaks when the message changes", async ({ page }) => {
    const stamp = page.getByTestId("ch02-stamp");
    await stamp.scrollIntoViewIfNeeded();
    await page.getByTestId("ch02-stamp-sign").click();
    await expect(stamp).toHaveAttribute("data-state", "valid");
    await page.getByTestId("ch02-stamp-message").fill("gm nostr, edited");
    await expect(stamp).toHaveAttribute("data-state", "invalid");
  });

  test("nsec guard: sharing an nsec is flagged", async ({ page }) => {
    await page.getByTestId("ch02-guard").scrollIntoViewIfNeeded();
    await page.getByTestId("ch02-guard-support-share").click();
    await expect(page.getByTestId("ch02-guard-support")).toHaveAttribute("data-verdict", "danger");
    await page.getByTestId("ch02-guard-reset").click();
    for (const [id, choice] of [
      ["friend", "share"],
      ["support", "refuse"],
      ["podcast", "share"],
      ["giveaway", "refuse"],
    ] as const)
      await page.getByTestId(`ch02-guard-${id}-${choice}`).click();
    await expect(page.getByTestId("ch02-guard-score")).toContainText("Perfect");
  });

  test("quiz answers", async ({ page }) => {
    await page.getByTestId("ch02-quiz").scrollIntoViewIfNeeded();
    await page.getByTestId("ch02-quiz-q2-option-a").click();
    await page.getByTestId("ch02-quiz-q2-check").click();
    await expect(page.getByTestId("ch02-quiz-q2")).toHaveAttribute("data-result", "correct");
  });

  test("has no a11y violations", async ({ page }) => {
    // Hydrate every island first so axe audits the interactive markup, not just SSR.
    for (const id of ["ch02-forge", "ch02-clock", "ch02-stamp", "ch02-guard", "ch02-quiz"])
      await page.getByTestId(id).scrollIntoViewIfNeeded();
    await expectNoA11yViolations(page);
  });
});

test.describe("tool: keys", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(pagePath("en", "tools/keys"));
    await expect(page.getByTestId("tool-title")).toBeVisible();
  });

  test("generate, then convert the npub back to hex", async ({ page }) => {
    await page.getByTestId("ch02-tool-generate").click();
    const npub = await page.getByTestId("ch02-tool-value-gen-npub").innerText();
    const hex = await page.getByTestId("ch02-tool-value-gen-hex-pubkey").innerText();
    await page.getByTestId("ch02-tool-input").fill(npub);
    await expect(page.getByTestId("ch02-tool-detected")).toContainText("npub");
    await expect(page.getByTestId("ch02-tool-value-dec-hex-pubkey")).toHaveText(hex);
    await page.getByTestId("ch02-tool-input").fill(`${npub.slice(0, -1)}b`);
    await expect(page.getByTestId("ch02-tool-error")).toBeVisible();
  });

  test("build an naddr and see its TLV records", async ({ page }) => {
    await page.getByTestId("ch02-tool-tabs-tab-build").click();
    await page.getByTestId("ch02-tool-type-naddr").check();
    await page.getByTestId("ch02-tool-fill-sample").click();
    await expect(page.getByTestId("ch02-tool-value-build-naddr")).toHaveText(/^naddr1/);
    await expect(page.getByTestId("ch02-tool-tlv").locator("tbody tr")).toHaveCount(4);
  });

  test("has no a11y violations", async ({ page }) => {
    await page.getByTestId("ch02-tool-generate").click();
    await expectNoA11yViolations(page);
  });
});
