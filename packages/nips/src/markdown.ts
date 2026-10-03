/**
 * Renders NIP markdown to sanitized HTML at build time (the detail page's "Specification").
 * Links between NIPs ("57.md#appendix-a") become links to our own NIP pages; other relative links
 * point at the file on GitHub at the snapshot commit; headings get stable, prefixed anchor ids
 * (same slugs as `NipSection.id`). Output is sanitized with an allow-list even though the source
 * is a public-domain repo we pin — it is still third-party HTML going into our pages.
 */
import { Marked, type Tokens } from "marked";
import sanitizeHtml from "sanitize-html";
import { slugifyHeading, stripNipHeader } from "./corpus/parse.ts";
import type { NipId } from "./types.ts";

export interface RenderNipOptions {
  /** Our URL for another NIP; `hash` is "" or "#<prefixed-anchor>". */
  readonly nipHref: (id: NipId, hash: string) => string;
  /** Base URL for other relative links, e.g. "https://github.com/nostr-protocol/nips/blob/<sha>/". */
  readonly sourceBase: string;
  /** Prefix for heading ids so they cannot clash with page ids. Default "spec-". */
  readonly headingIdPrefix?: string;
  /** Added to every heading level (clamped to 6) so the spec nests under the page outline. Default 1. */
  readonly headingOffset?: number;
  /** Drop the "NIP-XX / title / status" header block. Default true. */
  readonly stripHeader?: boolean;
}

const NIP_LINK = /^(?:\.\/)?([0-9A-Fa-f]{2})\.md(#.*)?$/;

const SANITIZE: sanitizeHtml.IOptions = {
  allowedTags: [
    ...sanitizeHtml.defaults.allowedTags,
    "img",
    "del",
    "ins",
    "details",
    "summary",
    "input",
  ],
  allowedAttributes: {
    a: ["href", "title", "rel"],
    img: ["src", "alt", "title", "width", "height", "loading"],
    code: ["class"],
    th: ["align"],
    td: ["align"],
    input: ["type", "checked", "disabled"],
    pre: ["tabindex"],
    table: ["tabindex"],
    "*": ["id"],
  },
  allowedClasses: { code: [/^language-[\w-]+$/] },
  allowedSchemes: ["http", "https", "mailto"],
  transformTags: {
    a: (tagName, attribs) => ({
      tagName,
      attribs: /^https?:/i.test(attribs["href"] ?? "")
        ? { ...attribs, rel: "external noopener" }
        : attribs,
    }),
    img: (tagName, attribs) => ({ tagName, attribs: { ...attribs, loading: "lazy" } }),
    // Code blocks and tables scroll sideways on phones; tabindex lets keyboard users scroll them.
    pre: (tagName) => ({ tagName, attribs: { tabindex: "0" } }),
    table: (tagName) => ({ tagName, attribs: { tabindex: "0" } }),
  },
};

export const renderNipMarkdown = (markdown: string, options: RenderNipOptions): string => {
  const prefix = options.headingIdPrefix ?? "spec-";
  const offset = options.headingOffset ?? 1;
  const anchor = (hash: string | undefined) =>
    hash === undefined || hash === "#" ? "" : `#${prefix}${hash.slice(1)}`;
  const seen = new Map<string, number>();
  // A fresh instance per call: the heading slug de-duplication state is per document.
  const marked = new Marked({
    gfm: true,
    walkTokens: (token) => {
      if (token.type !== "link" && token.type !== "image") return;
      const t = token as Tokens.Link | Tokens.Image;
      const nip = NIP_LINK.exec(t.href);
      if (nip !== null && token.type === "link")
        t.href = options.nipHref((nip[1] ?? "").toUpperCase(), anchor(nip[2]));
      else if (t.href.startsWith("#")) t.href = anchor(t.href);
      else if (!/^[a-z][a-z0-9+.-]*:/i.test(t.href) && !t.href.startsWith("/"))
        t.href = new URL(t.href, options.sourceBase).href;
    },
    renderer: {
      heading({ tokens, depth, text }) {
        const base = slugifyHeading(text) || "section";
        const n = seen.get(base) ?? 0;
        seen.set(base, n + 1);
        const id = `${prefix}${n === 0 ? base : `${base}-${n}`}`;
        const level = Math.min(6, depth + offset);
        return `<h${level} id="${id}">${this.parser.parseInline(tokens)}</h${level}>\n`;
      },
    },
  });
  const source = options.stripHeader === false ? markdown : stripNipHeader(markdown);
  return sanitizeHtml(marked.parse(source, { async: false }), SANITIZE);
};
