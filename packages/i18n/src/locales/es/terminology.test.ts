import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { glossaryEs } from "../../glossary/es.ts";

// Guards Spanish terminology drift: one translation per glossary term, and no regional words that
// break the "neutral Latin-American/European Spanish" promise in common.ts.
const ROOT = join(import.meta.dir, "../../../../..");
const MDX_DIR = join(ROOT, "apps/site/src/content/chapters/es");
const LOCALE_DIR = import.meta.dir;

const read = (dir: string, ext: string): readonly (readonly [string, string])[] =>
  readdirSync(dir, { recursive: true, encoding: "utf8" })
    .filter((f) => f.endsWith(ext) && !f.endsWith(".test.ts"))
    .map((f) => [f, readFileSync(join(dir, f), "utf8")] as const);

const sources = [
  ...read(MDX_DIR, ".mdx"),
  ...read(LOCALE_DIR, ".ts"),
  ["glossary/es.ts", readFileSync(join(LOCALE_DIR, "../../glossary/es.ts"), "utf8")] as const,
];

const BANNED: readonly (readonly [RegExp, string])[] = [
  [/firmador/i, "use «firmante»"],
  [/billetera/i, "use «wallet»"],
  [/ordenador/i, "use «computadora»"],
  [/\bgafete/i, "use «credencial»"],
  [/trastea/i, "use «experimentar»"],
  [/\bustedes\b|\bvosotros\b/i, "address the reader as «tú»"],
];

describe("Spanish terminology", () => {
  for (const [pattern, hint] of BANNED)
    test(`no ${pattern.source} (${hint})`, () => {
      const hits = sources.filter(([, text]) => pattern.test(text)).map(([file]) => file);
      expect(hits).toEqual([]);
    });

  test("glossary terms match the prose wording", () => {
    expect(glossaryEs.signer.term).toBe("Firmante");
    expect(glossaryEs["key-loss"].term).toBe("Pérdida de claves");
    expect(glossaryEs.privkey.term).toContain("Clave secreta");
  });

  test("<Term> text for signer and key-loss uses the glossary wording", () => {
    const mdx = read(MDX_DIR, ".mdx")
      .map(([, text]) => text)
      .join("\n");
    const texts = (id: string): readonly string[] =>
      [...mdx.matchAll(new RegExp(`<Term id="${id}"[^>]*>([^<]+)</Term>`, "g"))].map((m) =>
        (m[1] ?? "").toLowerCase(),
      );
    expect(texts("signer").every((t) => t.startsWith("firmante"))).toBe(true);
    expect(texts("key-loss").every((t) => t === "pérdida de claves")).toBe(true);
  });
});
