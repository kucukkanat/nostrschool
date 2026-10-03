import { defineConfig, devices } from "@playwright/test";

/** Fixed ports so specs and the live-mode relay URL are predictable. */
export const SITE_PORT = 4321;
export const RELAY_PORT = 7447;
const BASE_PATH = process.env["BASE_PATH"] ?? "/understanding-nostr";

/**
 * E2E runs against the BUILT site (`astro preview`) — run `bun run build` first
 * (root `bun run test:e2e` does both) — plus the in-memory test relay for live mode.
 */
export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.spec.ts",
  fullyParallel: true,
  forbidOnly: process.env["CI"] !== undefined,
  retries: process.env["CI"] !== undefined ? 2 : 0,
  reporter: process.env["CI"] !== undefined ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://127.0.0.1:${SITE_PORT}${BASE_PATH}/`,
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "chromium-dark", use: { ...devices["Desktop Chrome"], colorScheme: "dark" } },
    {
      name: "chromium-reduced-motion",
      use: { ...devices["Desktop Chrome"], contextOptions: { reducedMotion: "reduce" } },
    },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: [
    {
      // --ignore-lock keeps the server in the foreground: Astro 7 otherwise auto-backgrounds
      // `preview` when it detects an AI agent, and Playwright reads the early exit as a crash.
      command: `bunx astro preview --ignore-lock --host 127.0.0.1 --port ${SITE_PORT}`,
      url: `http://127.0.0.1:${SITE_PORT}${BASE_PATH}/en/`,
      reuseExistingServer: process.env["CI"] === undefined,
      timeout: 120_000,
    },
    // E2E_NO_RELAY=1 skips the relay for quick runs of specs that don't use live mode.
    ...(process.env["E2E_NO_RELAY"] === "1"
      ? []
      : [
          {
            command: "bun ../../packages/test-relay/src/cli.ts",
            port: RELAY_PORT,
            env: { PORT: String(RELAY_PORT) },
            reuseExistingServer: process.env["CI"] === undefined,
            timeout: 30_000,
          },
        ]),
  ],
});
