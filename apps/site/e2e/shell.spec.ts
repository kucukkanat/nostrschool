/** Owner: shell agent. Site shell: navigation, theme, language, live mode, progress, a11y. */

import { expectNoA11yViolations } from "./helpers/a11y.ts";
import { pagePath } from "./helpers/site.ts";
import { expect, type Page, test } from "./helpers/test.ts";

/** Below lg the nav and controls live in the header's menu sheet; open it when its toggle shows. */
const openMenu = async (page: Page): Promise<void> => {
  const toggle = page.getByTestId("header-menu-toggle");
  if (await toggle.isVisible()) {
    await toggle.click();
    await expect(page.getByTestId("header-menu")).toBeVisible();
  }
};

test.describe("navigation", () => {
  test("root redirects to English home", async ({ page }) => {
    await page.goto("./");
    await expect(page).toHaveURL(/\/en\/$/);
    await expect(page.getByTestId("home-title")).toBeVisible();
  });

  test("home → course → chapter → next chapter", async ({ page }) => {
    await page.goto(pagePath("en"));
    await openMenu(page);
    await page.getByTestId("nav-learn").click();
    await expect(page).toHaveURL(/\/en\/learn\/$/);
    await expect(page.getByTestId("nav-learn")).toHaveAttribute("aria-current", "page");
    await expect(page.locator("[data-testid^='chapter-link-']")).toHaveCount(12);

    await page.getByTestId("chapter-link-01").click();
    await expect(page).toHaveURL(/\/en\/learn\/why-nostr\/$/);
    await expect(page.getByTestId("chapter-title")).toBeVisible();
    await expect(page.getByTestId("chapter-takeaways")).toBeVisible();
    await expect(page.getByTestId("chapter-prev")).toHaveCount(0);

    await page.getByTestId("chapter-next").click();
    await expect(page).toHaveURL(/\/en\/learn\/keys\/$/);
    await expect(page.getByTestId("chapter-prev")).toBeVisible();
  });

  test("home CTA starts at chapter 1; course map and tools link out", async ({ page }) => {
    await page.goto(pagePath("en"));
    await expect(page.getByTestId("home-start")).toHaveAttribute(
      "href",
      /\/en\/learn\/why-nostr\/$/,
    );
    await expect(page.locator("[data-testid^='course-map-']")).toHaveCount(12);
    await expect(page.getByTestId("tool-link-keys")).toHaveAttribute(
      "href",
      /\/en\/tools\/keys\/$/,
    );
    await openMenu(page);
    await page.getByTestId("nav-tools").click();
    await expect(page.getByTestId("tools-title")).toBeVisible();
    await expect(page.getByTestId("tool-link-glossary")).toBeVisible();
  });

  test("skip link moves focus to the main content", async ({ page }) => {
    await page.goto(pagePath("en", "learn"));
    await page.keyboard.press("Tab");
    await expect(page.getByTestId("skip-link")).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("main")).toBeFocused();
  });

  test("unknown pages show the 404 with the mascot", async ({ page }) => {
    const response = await page.goto("en/no-such-page/");
    expect(response?.status()).toBe(404);
    await expect(page.getByTestId("not-found-title")).toBeVisible();
    await expect(page.getByTestId("not-found-mascot")).toBeVisible();
    await page.getByTestId("not-found-home").click();
    await expect(page.getByTestId("home-title")).toBeVisible();
  });
});

test.describe("preferences", () => {
  test("theme toggle forces dark/light, persists, and returns to system", async ({ page }) => {
    await page.goto(pagePath("en"));
    const html = page.locator("html");
    await openMenu(page);
    await page.getByTestId("theme-dark").click();
    await expect(html).toHaveAttribute("data-theme", "dark");
    await page.reload();
    await expect(html).toHaveAttribute("data-theme", "dark");
    await expect(page.getByTestId("theme-dark-input")).toBeChecked();

    await openMenu(page);
    await page.getByTestId("theme-light").click();
    await expect(html).toHaveAttribute("data-theme", "light");
    await page.getByTestId("theme-system").click();
    await expect(html).not.toHaveAttribute("data-theme", /.+/);
    expect(await page.evaluate(() => localStorage.getItem("nostrschool:theme"))).toBeNull();
  });

  test("language switcher keeps the current page", async ({ page }) => {
    await page.goto(pagePath("en", "learn/keys"));
    await openMenu(page);
    await page.getByTestId("locale-es").click();
    await expect(page).toHaveURL(/\/es\/learn\/keys\/$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "es-ES");
    await expect(page.getByTestId("locale-es")).toHaveAttribute("aria-current", "true");
    await openMenu(page);
    await page.getByTestId("locale-en").click();
    await expect(page).toHaveURL(/\/en\/learn\/keys\/$/);
  });

  test("live toggle shows the LIVE badge and persists", async ({ page }) => {
    await page.goto(pagePath("en"));
    const toggle = page.getByTestId("live-toggle");
    const menuTag = page.getByTestId("header-menu-live");
    await expect(toggle).toHaveAttribute("aria-pressed", "false");
    await expect(page.getByTestId("live-badge")).toHaveCount(0);
    await expect(menuTag).toBeHidden();

    await openMenu(page);
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByTestId("live-badge")).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("data-live", "on");
    expect(await page.evaluate(() => localStorage.getItem("nostrschool:live"))).toBe("1");

    await page.goto(pagePath("en", "learn"));
    // With the menu sheet closed (phones), the Menu button itself says LIVE.
    const menuToggle = page.getByTestId("header-menu-toggle");
    await expect(
      (await menuToggle.isVisible()) ? menuTag : page.getByTestId("live-badge"),
    ).toBeVisible();
    await openMenu(page);
    await expect(page.getByTestId("live-toggle")).toContainText("Live");
    await page.getByTestId("live-toggle").click();
    await expect(page.getByTestId("live-badge")).toHaveCount(0);
    await expect(menuTag).toBeHidden();
  });

  test("completing a chapter updates the rail, the course and the CTA", async ({ page }) => {
    await page.goto(pagePath("en", "learn/why-nostr"));
    await page.getByTestId("chapter-complete").click();
    await expect(page.getByTestId("chapter-complete")).toHaveAttribute("aria-pressed", "true");
    // On phones the rail list is collapsed; the count is always visible.
    await expect(page.getByTestId("chapter-rail-count")).toContainText("1");
    await expect(page.getByTestId("chapter-rail-01")).toHaveAttribute("data-done", "true");

    await page.goto(pagePath("en", "learn"));
    await expect(page.getByTestId("chapter-link-01")).toHaveAttribute("data-status", "done");
    await expect(page.getByTestId("chapter-link-02")).toHaveAttribute("data-status", "current");

    await page.goto(pagePath("en"));
    await expect(page.getByTestId("home-start")).toHaveAttribute("href", /\/learn\/keys\/$/);
  });
});

test.describe("small screens", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("the sticky header is one compact row and anchors land below it", async ({ page }) => {
    await page.goto(pagePath("en", "glossary"));
    const header = page.getByTestId("site-header");
    const height = (await header.boundingBox())?.height ?? Number.POSITIVE_INFINITY;
    expect(height).toBeLessThanOrEqual(64);
    await expect(page.getByTestId("header-menu-toggle")).toBeVisible();
    await expect(page.getByTestId("header-menu")).toBeHidden();
    await expect(page.getByTestId("nav-glossary")).toBeHidden();

    // pagePath appends a trailing slash, so the hash goes after it.
    await page.goto(`${pagePath("en", "glossary")}#keypair`);
    const target = page.locator("#keypair");
    await expect(target).toBeInViewport();
    const top = (await target.boundingBox())?.y ?? 0;
    expect(top).toBeGreaterThanOrEqual(height);
  });

  test("the menu sheet holds the nav plus labelled live, theme and language controls", async ({
    page,
  }) => {
    await page.goto(pagePath("en", "glossary"));
    await openMenu(page);
    await expect(page.getByTestId("nav-glossary")).toHaveAttribute("aria-current", "page");
    await expect(page.getByTestId("live-toggle")).toContainText("Live");
    await expect(page.getByTestId("theme-dark")).toBeVisible();
    await expect(page.getByTestId("locale-es")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("header-menu")).toBeHidden();
    await openMenu(page);
    await page.getByTestId("header-menu-close").click();
    await expect(page.getByTestId("header-menu")).toBeHidden();
  });

  test("the chapter list opens as a bottom sheet and closes with Escape", async ({ page }) => {
    await page.goto(pagePath("en", "learn/keys"));
    const sheet = page.getByTestId("chapter-rail-sheet");
    await expect(sheet).toBeHidden();
    await page.getByTestId("chapter-rail-toggle").click();
    await expect(sheet).toBeVisible();
    await expect(page.getByTestId("chapter-rail-02")).toHaveAttribute("aria-current", "page");
    // The sheet slides up from below: measure where it lands, not a frame mid-slide.
    await sheet.evaluate((el) => Promise.all(el.getAnimations().map((a) => a.finished)));
    const box = await sheet.boundingBox();
    const viewport = page.viewportSize();
    // Pinned to the bottom edge of the screen.
    expect((box?.y ?? 0) + (box?.height ?? 0)).toBeCloseTo(viewport?.height ?? 0, 0);
    await page.keyboard.press("Escape");
    await expect(sheet).toBeHidden();
    await expect(page.getByTestId("chapter-rail-toggle")).toBeFocused();
  });

  test("no page scrolls sideways at 360px", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    for (const path of ["", "learn", "learn/keys", "tools", "glossary"]) {
      await page.goto(pagePath("en", path));
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `/${path}`).toBeLessThanOrEqual(0);
    }
  });

  test("the chapter intro keeps Nos and the bubble in one short row", async ({ page }) => {
    await page.goto(pagePath("en", "learn/relays"));
    const intro = page.getByTestId("chapter-mascot-container");
    await expect(intro).toBeVisible();
    expect((await intro.boundingBox())?.height ?? Number.POSITIVE_INFINITY).toBeLessThanOrEqual(
      130,
    );
  });
});

test.describe("accessibility", () => {
  for (const path of ["", "learn", "learn/keys", "tools"]) {
    test(`/${path} has no axe violations`, async ({ page }) => {
      await page.goto(pagePath("en", path));
      await expectNoA11yViolations(page);
    });
  }

  test("home has no axe violations in forced dark theme with live mode on", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("nostrschool:theme", "dark");
    });
    await page.goto(pagePath("en"));
    await openMenu(page);
    await page.getByTestId("live-toggle").click();
    await expect(page.getByTestId("live-badge")).toBeVisible();
    await expectNoA11yViolations(page);
  });

  test("404 has no axe violations", async ({ page }) => {
    await page.goto("en/no-such-page/");
    await expectNoA11yViolations(page);
  });

  test("the hero animation can be paused (and is still under reduced motion)", async ({
    page,
  }, testInfo) => {
    await page.goto(pagePath("en"));
    const hero = page.getByTestId("hero-network");
    const pause = page.getByTestId("hero-network-pause");
    if (testInfo.project.name === "chromium-reduced-motion") {
      await expect(hero).toHaveAttribute("data-animating", "false");
      await expect(pause).toHaveCount(0);
      return;
    }
    await pause.click();
    await expect(pause).toHaveAttribute("aria-pressed", "true");
    await expect(hero).toHaveAttribute("data-animating", "false");
  });
});

test.describe("home hero layout", () => {
  for (const width of [768, 1280, 1920]) {
    test(`Nos and the bubble never overlap the network diagram at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(pagePath("en"));
      const mascot = await page.getByTestId("hero-mascot-container").boundingBox();
      const diagram = await page.getByTestId("hero-network").boundingBox();
      if (mascot === null || diagram === null) throw new Error("hero parts are not rendered");
      const overlaps =
        mascot.x < diagram.x + diagram.width &&
        mascot.x + mascot.width > diagram.x &&
        mascot.y < diagram.y + diagram.height &&
        mascot.y + mascot.height > diagram.y;
      expect(overlaps).toBe(false);
    });
  }
});
