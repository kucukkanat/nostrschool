/** Owner: chapter 07 agent. */

import { expectNoA11yViolations } from "../helpers/a11y.ts";
import { pagePath } from "../helpers/site.ts";
import { expect, type Page, test } from "../helpers/test.ts";

const open = async (page: Page) => {
  await page.goto(pagePath("en", "learn/social-graph"));
  await expect(page.getByTestId("chapter-title")).toBeVisible();
};

test.describe("chapter 07 (social-graph)", () => {
  test("follow graph: hover highlights, select shows the follow list", async ({ page }) => {
    await open(page);
    const grace = page.getByTestId("ch07-force-node-grace");
    await grace.scrollIntoViewIfNeeded();
    await expect(page.getByTestId("ch07-stats")).toContainText("7 people");
    await grace.hover();
    await expect(page.getByTestId("ch07-hover-note")).toContainText("Grace follows");
    await page.getByTestId("ch07-lens-followers").click();
    await grace.hover();
    await expect(page.getByTestId("ch07-hover-note")).toContainText("Carol and Erin");
    await grace.click();
    await expect(page.getByTestId("ch07-person")).toHaveAttribute("data-person", "grace");
    await expect(page.getByTestId("ch07-raw")).toBeVisible();
  });

  test("follow graph is keyboard operable", async ({ page }) => {
    await open(page);
    const alice = page.getByTestId("ch07-force-node-alice");
    await alice.scrollIntoViewIfNeeded();
    await alice.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("ch07-person")).toHaveAttribute("data-person", "alice");
  });

  test("outbox model reaches everyone; one relay misses people", async ({ page }) => {
    await open(page);
    const map = page.getByTestId("ch07-map");
    await map.scrollIntoViewIfNeeded();
    const forward = page.getByTestId("ch07-playback-forward");
    for (let i = 0; i < 5; i++) await forward.click();
    await expect(map).toHaveAttribute("data-step", "notes");
    await expect(page.getByTestId("ch07-coverage")).toHaveAttribute("data-reached", "4");
    await expect(page.getByTestId("ch07-frames")).toContainText('"REQ"');

    await page.getByTestId("ch07-mode-single").click();
    for (let i = 0; i < 3; i++) await forward.click();
    await expect(page.getByTestId("ch07-narration")).toContainText("Missing: Frank and Grace");
    await expect(page.getByTestId("ch07-person-node-frank")).toHaveAttribute(
      "data-state",
      "missed",
    );
  });

  test("overwrite trap: the stale tablet wins", async ({ page }) => {
    await open(page);
    const phone = page.getByTestId("ch07-publish-phone");
    await phone.scrollIntoViewIfNeeded();
    await phone.click();
    await expect(page.getByTestId("ch07-kept")).toHaveAttribute("data-version", "1");
    await page.getByTestId("ch07-publish-tablet").click();
    await expect(page.getByTestId("ch07-lost")).toContainText("Bob and Erin");
    await page.getByTestId("ch07-sync").click();
    await expect(page.getByTestId("ch07-follow-bob")).not.toBeChecked();
  });

  test("has no a11y violations", async ({ page }) => {
    await open(page);
    // Hydrate every island before scanning.
    for (const id of ["ch07-graph", "ch07-outbox", "ch07-replace", "ch07-quiz"]) {
      await page.getByTestId(id).scrollIntoViewIfNeeded();
      await expect(page.getByTestId(id)).toBeVisible();
    }
    await expectNoA11yViolations(page);
  });
});
