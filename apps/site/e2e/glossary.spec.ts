/** Owner: glossary agent. */
import { GLOSSARY_IDS, getDictionary, LOCALES } from "@nostrschool/i18n";
import { expectNoA11yViolations } from "./helpers/a11y.ts";
import { pagePath } from "./helpers/site.ts";
import { expect, test } from "./helpers/test.ts";

const t = getDictionary("en").common.glossary;

test.describe("glossary", () => {
  for (const locale of LOCALES) {
    test(`${locale}: lists every term with an anchor and a definition`, async ({ page }) => {
      await page.goto(pagePath(locale, "glossary"));
      await expect(page.locator("[data-term]")).toHaveCount(GLOSSARY_IDS.length);
      for (const id of GLOSSARY_IDS) {
        const term = page.getByTestId(`glossary-term-${id}`);
        await expect(term).toHaveAttribute("id", id);
        await expect(page.getByTestId(`glossary-term-${id}-short`)).not.toBeEmpty();
      }
    });
  }

  test("search narrows the list and shows a message when nothing matches", async ({ page }) => {
    await page.goto(pagePath("en", "glossary"));
    const search = page.getByTestId("glossary-search");

    await search.fill("gift wrap");
    await expect(page.getByTestId("glossary-term-gift-wrap")).toBeVisible();
    await expect(page.getByTestId("glossary-term-relay")).toBeHidden();
    await expect(page.getByTestId("glossary-letter-W")).toBeHidden();

    // NIP numbers are searchable in both "nip-57" and "nip57" spellings.
    await search.fill("NIP57");
    await expect(page.getByTestId("glossary-term-zap")).toBeVisible();

    await search.fill("zzzz-no-such-term");
    await expect(page.locator("[data-term]:visible")).toHaveCount(0);
    await expect(page.getByTestId("glossary-status")).toHaveText(t.noResults);

    await search.press("Escape");
    await expect(search).toHaveValue("");
    await expect(page.locator("[data-term]:visible")).toHaveCount(GLOSSARY_IDS.length);
    await expect(page.getByTestId("glossary-status")).toBeEmpty();
  });

  test("chapter chips filter by where a term is taught and toggle off", async ({ page }) => {
    await page.goto(pagePath("en", "glossary"));
    const chip = page.getByTestId("glossary-filter-ch09");

    await chip.click();
    await expect(chip).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByTestId("glossary-term-zap")).toBeVisible();
    await expect(page.getByTestId("glossary-term-relay")).toBeHidden();

    await page.getByTestId("glossary-filter-ch04").click();
    await expect(chip).toHaveAttribute("aria-pressed", "false");
    await expect(page.getByTestId("glossary-term-relay")).toBeVisible();
    await expect(page.getByTestId("glossary-term-zap")).toBeHidden();

    await page.getByTestId("glossary-filter-ch04").click();
    await expect(page.locator("[data-term]:visible")).toHaveCount(GLOSSARY_IDS.length);
  });

  test("A–Z nav jumps to a letter and empty letters are not links", async ({ page }) => {
    await page.goto(pagePath("en", "glossary"));
    await page.getByTestId("glossary-az-Z").click();
    await expect(page).toHaveURL(/#letter-Z$/);
    await expect(page.getByTestId("glossary-letter-Z")).toBeInViewport();
    await expect(page.getByTestId("glossary-term-zap")).toBeVisible();
    // No English term starts with Q.
    await expect(page.getByTestId("glossary-az-Q")).not.toHaveAttribute("href");
  });

  test("deep links reveal and focus the term, even when filtered out", async ({ page }) => {
    await page.goto(`${pagePath("en", "glossary")}#relay`);
    const relay = page.getByTestId("glossary-term-relay");
    await expect(relay).toBeInViewport();
    await expect(relay).toBeFocused();

    await page.getByTestId("glossary-search").fill("zap");
    await expect(page.getByTestId("glossary-term-nostr")).toBeHidden();
    await page.evaluate(() => {
      location.hash = "nostr";
    });
    await expect(page.getByTestId("glossary-term-nostr")).toBeInViewport();
    await expect(page.getByTestId("glossary-search")).toHaveValue("");
  });

  test("see-also and chapter links lead to the right places", async ({ page }) => {
    await page.goto(pagePath("en", "glossary"));
    await page.getByTestId("glossary-term-seal-see-rumor").click();
    await expect(page).toHaveURL(/glossary\/#rumor$/);
    await expect(page.getByTestId("glossary-term-rumor")).toBeInViewport();

    await page.getByTestId("glossary-term-zap-chapter").click();
    await expect(page).toHaveURL(/\/en\/learn\/zaps\/$/);
  });

  test("has no a11y violations", async ({ page }) => {
    await page.goto(pagePath("en", "glossary"));
    await expectNoA11yViolations(page);
    await page.getByTestId("glossary-search").fill("zzzz-no-such-term");
    await expectNoA11yViolations(page);
  });
});
