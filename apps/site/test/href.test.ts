import { describe, expect, test } from "bun:test";
import { createHrefs } from "../src/lib/href.ts";

describe.each(["/understanding-nostr", "/understanding-nostr/", "understanding-nostr"])(
  "base %s",
  (base) => {
    const { href, assetHref, switchLocale } = createHrefs(base);
    test("localized pages get base, locale and a trailing slash", () => {
      expect(href("en")).toBe("/understanding-nostr/en/");
      expect(href("es", "learn/keys")).toBe("/understanding-nostr/es/learn/keys/");
      expect(href("en", "/learn/keys/")).toBe("/understanding-nostr/en/learn/keys/");
    });
    test("hash and query are kept after the slash", () => {
      expect(href("en", "glossary#relay")).toBe("/understanding-nostr/en/glossary/#relay");
      expect(href("en", "tools/keys?npub=x")).toBe("/understanding-nostr/en/tools/keys/?npub=x");
    });
    test("assets and locale switching", () => {
      expect(assetHref("/mascot/ostrich.riv")).toBe("/understanding-nostr/mascot/ostrich.riv");
      expect(switchLocale("/understanding-nostr/en/learn/keys/", "es")).toBe(
        "/understanding-nostr/es/learn/keys/",
      );
      expect(switchLocale("/understanding-nostr/en/", "es")).toBe("/understanding-nostr/es/");
    });
  },
);

test("root base", () => {
  const { href, assetHref, switchLocale } = createHrefs("/");
  expect(href("en", "learn")).toBe("/en/learn/");
  expect(assetHref("favicon.svg")).toBe("/favicon.svg");
  expect(switchLocale("/es/tools/", "en")).toBe("/en/tools/");
});
