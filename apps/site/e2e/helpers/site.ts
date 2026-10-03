import type { Locale } from "@nostrschool/i18n";
import type { Page } from "@playwright/test";

/** ws:// URL of the E2E test relay (see playwright.config.ts webServer). */
export const TEST_RELAY_URL = "ws://127.0.0.1:7447";

/** Relative to playwright `baseURL` (which already includes the base path). */
export const pagePath = (locale: Locale, path = ""): string => {
  const clean = path.replace(/^\/+|\/+$/g, "");
  return `${locale}/${clean === "" ? "" : `${clean}/`}`;
};

/**
 * Turns live mode on and points it at the local test relay BEFORE the page loads
 * (via the persisted stores in @nostrschool/data), so E2E never touches public relays.
 */
export const useLiveTestRelay = async (page: Page): Promise<void> => {
  await page.addInitScript((url) => {
    localStorage.setItem("nostrschool:live", "1");
    localStorage.setItem("nostrschool:live-relays", JSON.stringify([url]));
  }, TEST_RELAY_URL);
};
