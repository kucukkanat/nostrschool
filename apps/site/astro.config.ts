import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import svelte from "@astrojs/svelte";
import { defineConfig } from "astro/config";

/**
 * GitHub Pages serves the site under /<repo>/, so the base path comes from the environment
 * (deploy.yml sets BASE_PATH from the repo name). All internal links go through `href()`.
 */
const base = process.env["BASE_PATH"] ?? "/understanding-nostr";
const site = process.env["SITE_URL"] ?? "https://nostrschool.github.io";

export default defineConfig({
  site,
  base,
  output: "static",
  trailingSlash: "always",
  build: { format: "directory" },
  i18n: {
    locales: ["en", "es"],
    defaultLocale: "en",
    // Root "/" is our own redirect page (src/pages/index.astro), so Astro must not emit one.
    routing: { prefixDefaultLocale: true, redirectToDefaultLocale: false },
  },
  integrations: [
    mdx(),
    svelte(),
    sitemap({ i18n: { defaultLocale: "en", locales: { en: "en-US", es: "es-ES" } } }),
  ],
  // Also used by `astro preview` (Playwright webServer).
  server: { port: 4321 },
  vite: {
    // The NIP search worker uses import.meta and dynamic imports, which the default iife worker
    // format rejects.
    worker: { format: "es" },
    // transformers.js ships its own wasm loader; pre-bundling it in dev breaks the worker.
    optimizeDeps: { exclude: ["@huggingface/transformers"] },
  },
});
