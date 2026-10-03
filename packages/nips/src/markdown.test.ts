import { describe, expect, test } from "bun:test";
import { getNipDocument, NIP_CORPUS, renderNipMarkdown } from "./corpus.ts";

const options = {
  nipHref: (id: string, hash: string) => `/en/nips/${id}/${hash}`,
  sourceBase: `${NIP_CORPUS.source.repo}/blob/${NIP_CORPUS.source.commit}/`,
};

describe("renderNipMarkdown", () => {
  const html = renderNipMarkdown(getNipDocument("17")?.markdown ?? "", options);

  test("drops the file header and nests headings under the page", () => {
    expect(html).not.toContain("NIP-17\n======");
    expect(html).not.toMatch(/<h1[ >]/);
    expect(html).toMatch(/<h3 id="spec-[a-z0-9-]+">/);
  });

  test("links between NIPs stay on the site, with prefixed anchors", () => {
    expect(html).toContain('href="/en/nips/44/"');
    expect(html).toContain('href="/en/nips/59/"');
  });

  test("relative, anchor and external links; code language classes survive", () => {
    const out = renderNipMarkdown(
      "# Top\n\n[up](README.md) [same](#top) [nip](./01.md#kinds) [ext](https://example.com) [abs](/x)\n\n```json\n{}\n```\n\n# Top\n",
      { ...options, stripHeader: false, headingIdPrefix: "s-", headingOffset: 0 },
    );
    expect(out).toContain(`href="${options.sourceBase}README.md"`);
    expect(out).toContain('href="#s-top"');
    expect(out).toContain('href="/en/nips/01/#s-kinds"');
    expect(out).toContain('href="https://example.com" rel="external noopener"');
    expect(out).toContain('href="/x"');
    expect(out).toContain('<pre tabindex="0"><code class="language-json">');
    expect(out).toContain('<h1 id="s-top">');
    expect(out).toContain('<h1 id="s-top-1">');
  });

  test("scrollable tables are keyboard-focusable; raw tabindex values are not trusted", () => {
    const out = renderNipMarkdown('| a |\n|---|\n| 1 |\n\n<pre tabindex="-1">x</pre>', {
      ...options,
      stripHeader: false,
    });
    expect(out).toContain('<table tabindex="0">');
    expect(out).toContain('<pre tabindex="0">x</pre>');
  });

  test("sanitizes raw HTML", () => {
    const out = renderNipMarkdown(
      '<script>alert(1)</script><img src="javascript:x" onerror="y"><a href="javascript:z">j</a>\n\n<img src="https://x/y.png">',
      { ...options, stripHeader: false },
    );
    expect(out).not.toContain("<script");
    expect(out).not.toContain("onerror");
    expect(out).not.toContain("javascript:");
    expect(out).toContain('loading="lazy"');
  });

  test("every NIP in the corpus renders", () => {
    for (const n of NIP_CORPUS.nips)
      expect(renderNipMarkdown(n.markdown, options).length).toBeGreaterThan(0);
  });
});
