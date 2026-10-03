/**
 * Every internal link goes through here so the GitHub Pages base path (BASE_PATH) and the
 * locale prefix are always right. Pages use trailing slashes (`trailingSlash: "always"`).
 */
import type { Locale } from "@nostrschool/i18n";

export interface Hrefs {
  /** Localized page link: `href("en", "learn/keys")` → `/understanding-nostr/en/learn/keys/`. Hash/query preserved. */
  readonly href: (locale: Locale, path?: string) => string;
  /** Non-localized public asset: `assetHref("mascot/ostrich.riv")` → `/understanding-nostr/mascot/ostrich.riv`. */
  readonly assetHref: (path: string) => string;
  /** Same page in another locale, from a current pathname (keeps base, swaps the locale segment). */
  readonly switchLocale: (pathname: string, to: Locale) => string;
}

const trimSlashes = (s: string) => s.replace(/^\/+|\/+$/g, "");

/** Pure factory, testable with any base. */
export const createHrefs = (baseUrl: string): Hrefs => {
  const base = trimSlashes(baseUrl);
  const prefix = base === "" ? "" : `/${base}`;
  const href = (locale: Locale, path = "") => {
    const [, pathPart = "", suffix = ""] = /^([^?#]*)(.*)$/.exec(path) ?? [];
    const clean = trimSlashes(pathPart);
    return `${prefix}/${locale}/${clean === "" ? "" : `${clean}/`}${suffix}`;
  };
  const assetHref = (path: string) => `${prefix}/${trimSlashes(path)}`;
  const switchLocale = (pathname: string, to: Locale) => {
    const rest = trimSlashes(
      pathname.startsWith(prefix) ? pathname.slice(prefix.length) : pathname,
    );
    const [, ...segments] = rest.split("/");
    return href(to, segments.join("/"));
  };
  return { href, assetHref, switchLocale };
};

// `import.meta.env` is Vite's; under `bun test` BASE_URL is absent, so fall back to the root.
const env = import.meta.env as { readonly BASE_URL?: string } | undefined;
const hrefs = createHrefs(env?.BASE_URL ?? "/");

export const href: Hrefs["href"] = hrefs.href;
export const assetHref: Hrefs["assetHref"] = hrefs.assetHref;
export const switchLocale: Hrefs["switchLocale"] = hrefs.switchLocale;

/**
 * Spread into `<Mascot {...mascotRive} />`. Stays empty until `public/mascot/ostrich.riv` ships
 * (spec: packages/mascot/README.md): requesting a missing file would log a 404 in every visitor's
 * console, and the SVG fallback is what renders anyway. Flip `RIVE_SHIPPED` when the asset lands.
 */
const RIVE_SHIPPED: boolean = false;
export const mascotRive: { readonly riveSrc?: string } = RIVE_SHIPPED
  ? { riveSrc: assetHref("mascot/ostrich.riv") }
  : {};
