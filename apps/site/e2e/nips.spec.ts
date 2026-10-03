/**
 * Owner: NIP pages agent. The NIP reference: search, filters (deep-linked), the empty state,
 * a detail page with a working editor (form → JSON, validation), the collapsible spec, a11y and
 * no sideways scroll on a 320px phone. Runs in every project (desktop split editor, mobile tabs).
 */
import { getDictionary, LOCALES } from "@nostrschool/i18n";
import { getNipStrings, NIP_IDS, NIP_INDEX } from "@nostrschool/nips";
import { expectNoA11yViolations } from "./helpers/a11y.ts";
import { pagePath } from "./helpers/site.ts";
import { expect, type Page, test } from "./helpers/test.ts";

const ui = getDictionary("en").nips.ui;

/** Below `lg` the filters sit behind a toggle; above it they're always shown. */
const openFilters = async (page: Page) => {
  const toggle = page.getByTestId("nips-filters-toggle");
  if ((await toggle.isVisible()) && (await toggle.getAttribute("aria-expanded")) === "false")
    await toggle.click();
};

/** The editor shows Form | JSON | Explain as tabs on phones and side by side on wide screens. */
const showPane = async (page: Page, pane: "form" | "json" | "explain") => {
  const tab = page.getByTestId(`nip-editor-tab-${pane}`);
  if (await tab.isVisible()) await tab.click();
};

const noSidewaysScroll = async (page: Page) =>
  expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth))
    .toBeLessThanOrEqual(0);

test.describe("NIP list", () => {
  test("lists every NIP and is accessible", async ({ page }) => {
    await page.goto(pagePath("en", "nips"));
    await expect(page.getByTestId("nips-title")).toHaveText(ui.title);
    await expect(page.locator("[data-testid^='nips-item-'][data-status]")).toHaveCount(
      NIP_IDS.length,
    );
    await expect(page.getByTestId("nips-snapshot")).toContainText(
      NIP_INDEX.source.commit.slice(0, 7),
    );
    await expectNoA11yViolations(page);
  });

  test("search ranks, highlights and lands in the URL; a shared link restores it", async ({
    page,
  }) => {
    await page.goto(pagePath("en", "nips"));
    const search = page.getByTestId("nips-search");
    await search.fill("zap");
    const first = page.locator("[data-testid^='nips-item-'][data-status]").first();
    await expect(first).toHaveAttribute("data-testid", "nips-item-57");
    await expect(page.getByTestId("nips-item-57").locator("mark").first()).toBeVisible();
    await expect(page).toHaveURL(/[?&]q=zap\b/);

    // A NIP number is pinned on top.
    await search.fill("44");
    await expect(page.getByTestId("nips-item-44-pinned")).toBeVisible();

    await page.goto(`${pagePath("en", "nips")}?q=relay%20information`);
    await expect(page.getByTestId("nips-search")).toHaveValue("relay information");
    await expect(page.locator("[data-testid^='nips-item-'][data-status]").first()).toHaveAttribute(
      "data-testid",
      "nips-item-11",
    );
  });

  test("search by meaning loads the self-hosted model and never leaves the site", async ({
    page,
    baseURL,
  }) => {
    test.slow(); // first load reads a 23 MB model and a 14 MB wasm runtime
    const site = new URL(baseURL ?? "http://127.0.0.1/").host;
    const foreign: string[] = [];
    page.on("request", (r) => {
      const url = new URL(r.url());
      if (url.protocol.startsWith("http") && url.host !== site) foreign.push(r.url());
    });
    await page.goto(pagePath("en", "nips"));
    // Wording with no keyword overlap with NIP-57's title: only the model can rank it.
    await page.getByTestId("nips-search").fill("send sats to a post");
    await expect(page.getByTestId("nips-semantic")).toHaveAttribute("data-status", "ready", {
      timeout: 60_000,
    });
    const top3 = page.locator("[data-testid^='nips-item-'][data-status]");
    await expect
      .poll(
        async () =>
          await top3.evaluateAll((els) => els.slice(0, 3).map((e) => e.dataset["testid"])),
      )
      .toContain("nips-item-57");
    expect(foreign).toEqual([]);
  });

  test("filters narrow the list and are deep-linkable", async ({ page }) => {
    await page.goto(pagePath("en", "nips"));
    await openFilters(page);
    await page.getByTestId("nips-status-final").check();
    const finals = NIP_INDEX.nips.filter((n) => n.status === "final");
    await expect(page.locator("[data-testid^='nips-item-'][data-status]")).toHaveCount(
      finals.length,
    );
    await expect(page).toHaveURL(/[?&]status=final\b/);
    await page.getByTestId("nips-clear").click();
    await expect(page.locator("[data-testid^='nips-item-'][data-status]")).toHaveCount(
      NIP_IDS.length,
    );

    // Shared link: kind 9735 (zap receipt) + taught in the course.
    await page.goto(`${pagePath("en", "nips")}?kind=9735&course=1&view=list`);
    await expect(page.getByTestId("nips-item-57")).toBeVisible();
    await expect(page.getByTestId("nips-list")).toHaveAttribute("data-view", "list");
    await expect(page.getByTestId("nips-filters-toggle")).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByTestId("nips-kind")).toHaveValue("9735");
  });

  test("the Spanish page finds a NIP by its Spanish title", async ({ page }) => {
    const title = getNipStrings("es", "88")?.title ?? "Encuestas";
    await page.goto(pagePath("es", "nips"));
    await page.getByTestId("nips-search").fill(title);
    await expect(page.locator("[data-testid^='nips-item-'][data-status]").first()).toHaveAttribute(
      "data-testid",
      "nips-item-88",
    );
  });

  test("nothing matches: empty state, then a way back", async ({ page }) => {
    await page.goto(pagePath("en", "nips"));
    await page.getByTestId("nips-search").fill("xqzvbnmq");
    await expect(page.getByTestId("nips-empty")).toBeVisible();
    await expect(page.getByTestId("nips-empty")).toContainText("xqzvbnmq");
    await expectNoA11yViolations(page);
    await page.getByTestId("nips-search-clear").click();
    await expect(page.getByTestId("nips-empty")).toBeHidden();
    await expect(page.locator("[data-testid^='nips-item-'][data-status]")).toHaveCount(
      NIP_IDS.length,
    );
  });

  test("a card opens its NIP", async ({ page }) => {
    await page.goto(pagePath("en", "nips"));
    await page.getByTestId("nips-item-01-link").click();
    await expect(page).toHaveURL(/\/en\/nips\/01\/$/);
    await expect(page.getByTestId("nip-id")).toHaveText("NIP-01");
  });
});

test.describe("NIP detail", () => {
  test("editing the form updates the JSON, and a bad value is flagged", async ({ page }) => {
    await page.goto(pagePath("en", "nips/01"));
    const editor = page.getByTestId("nip-editor");
    await expect(editor).toBeVisible();

    await showPane(page, "form");
    const content = page.getByTestId("nip-editor-form-content-text-input");
    await content.fill("hello from the field notebook");
    await showPane(page, "json");
    await expect(page.getByTestId("nip-editor-json-content")).toContainText(
      "hello from the field notebook",
    );
    await expect(page.getByTestId("nip-editor-validity")).toHaveAttribute("data-state", "valid");

    // A kind must be a number: the badge turns invalid and the JSON view gets a diagnostic.
    await showPane(page, "form");
    await page.getByTestId("nip-editor-form-kind-input").fill("abc");
    await expect(page.getByTestId("nip-editor-validity")).toHaveAttribute("data-state", "invalid");
    await showPane(page, "json");
    await expect(page.getByTestId("nip-editor-json")).not.toHaveAttribute("data-diagnostics", "0");
  });

  test("facts, course link, related NIPs, collapsible spec and prev/next", async ({ page }) => {
    await page.goto(pagePath("en", "nips/57"));
    await expect(page.getByTestId("nip-title")).toBeVisible();
    await expect(page.getByTestId("nip-status")).toBeVisible();
    await expect(page.getByTestId("nip-kinds")).toContainText("9735");
    await expect(page.getByTestId("nip-course-09")).toHaveAttribute("href", /\/en\/learn\/zaps\/$/);
    await expect(page.getByTestId("nip-related")).toBeVisible();

    const details = page.getByTestId("nip-spec-details");
    await expect(details).not.toHaveAttribute("open", "");
    await page.getByTestId("nip-spec-toggle").click();
    await expect(details).toHaveAttribute("open", "");
    await expect(details.locator(".prose h2, .prose h3").first()).toBeVisible();
    await expect(page.getByTestId("nip-github")).toHaveAttribute(
      "href",
      new RegExp(`/blob/${NIP_INDEX.source.commit}/57\\.md$`),
    );

    await page.getByTestId("nip-next").click();
    await expect(page.getByTestId("nip-id")).not.toHaveText("NIP-57");
    await page.getByTestId("nip-prev").click();
    await expect(page.getByTestId("nip-id")).toHaveText("NIP-57");
  });

  test("is accessible with the editor and the spec open", async ({ page }) => {
    await page.goto(pagePath("en", "nips/57"));
    await page.getByTestId("nip-spec-toggle").click();
    await expectNoA11yViolations(page);
  });

  for (const locale of LOCALES) {
    test(`${locale}: UI strings are localized`, async ({ page }) => {
      const t = getDictionary(locale).nips.ui;
      await page.goto(pagePath(locale, "nips/01"));
      await expect(page.getByTestId("nip-back")).toContainText(t.detail.backToList);
      await expect(page.getByTestId("nip-spec")).toContainText(t.detail.readTheSpec);
    });
  }
});

test.describe("NIP reference on a 320px phone", () => {
  test.use({ viewport: { width: 320, height: 640 } });

  test("no sideways scroll on the list (filters open, searching) or a detail page", async ({
    page,
  }) => {
    await page.goto(pagePath("en", "nips"));
    await openFilters(page);
    await page.getByTestId("nips-search").fill("private messages");
    await noSidewaysScroll(page);
    await page.getByTestId("nips-view-list").click();
    await noSidewaysScroll(page);

    for (const id of ["01", "19", "57", "B7"]) {
      await page.goto(pagePath("en", `nips/${id}`));
      await page.getByTestId("nip-spec-toggle").click();
      await noSidewaysScroll(page);
    }
  });
});
