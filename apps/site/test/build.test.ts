/**
 * Integration checks on the built site (`bun run build` first). Skipped — loudly — when dist/
 * is missing, so `bun run test` stays usable before a build; CI builds before testing.
 */
import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { CHAPTERS } from "../src/lib/chapters.ts";

const dist = join(import.meta.dir, "..", "dist");
const hasDist = existsSync(join(dist, "index.html"));
if (!hasDist)
  console.warn(
    "apps/site/test/build.test.ts: dist/ not found — run `bun run build` to enable these tests",
  );
const page = (path: string) => readFileSync(join(dist, path, "index.html"), "utf8");

describe.skipIf(!hasDist)("built site", () => {
  test("root redirects to the default locale under the base path", () => {
    expect(readFileSync(join(dist, "index.html"), "utf8")).toContain(
      "url=/understanding-nostr/en/",
    );
  });
  test.each(["en", "es"])("every %s chapter page renders its title and island", (locale) => {
    for (const c of CHAPTERS) {
      const html = page(`${locale}/learn/${c.slug}`);
      expect(html).toContain('data-testid="chapter-title"');
      expect(html).toContain("<astro-island");
    }
  });
  test("pages declare their language and link with the base path", () => {
    const html = page("es");
    expect(html).toContain('<html lang="es-ES"');
    expect(html).toContain('href="/understanding-nostr/es/learn/"');
  });
  test("404 and sitemap exist", () => {
    expect(existsSync(join(dist, "404.html"))).toBe(true);
    expect(existsSync(join(dist, "sitemap-index.xml"))).toBe(true);
  });
});
