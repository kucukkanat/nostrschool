/**
 * Owner: integrator. Mobile audit: every page, both locales, phone portrait (320/375/414) and
 * phone landscape (812×375), light and dark. Guards the brand's mobile rules (CONTRACTS §2):
 * no sideways page scroll, ≥44px touch targets, ≥16px form text (iOS focus zoom), no text clipped
 * by `overflow: hidden`, an operable header menu, and centrepiece widgets that work by tap.
 *
 * It sets its own viewports, so it runs once (in the `chromium` project) instead of per project.
 * Optional env: MOBILE_AUDIT_SHOTS=<dir> saves full-page screenshots; MOBILE_AUDIT_OUT=<dir>
 * writes each page's raw findings as JSON (useful when triaging a red run).
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { LOCALES, type Locale } from "@nostrschool/i18n";
import { pagePath } from "./helpers/site.ts";
import { expect, type Page, test } from "./helpers/test.ts";

const PAGES = [
  "",
  "learn",
  "learn/why-nostr",
  "learn/keys",
  "learn/events",
  "learn/relays",
  "learn/filters",
  "learn/kinds",
  "learn/social-graph",
  "learn/private-messages",
  "learn/zaps",
  "learn/signing",
  "learn/ecosystem",
  "learn/trade-offs",
  "tools",
  "tools/keys",
  "tools/event-inspector",
  "tools/filter-playground",
  "tools/kinds",
  "glossary",
  "nips",
  // One NIP per editor variant: event, encoding, document, message, http, process.
  "nips/01",
  "nips/19",
  "nips/11",
  "nips/45",
  "nips/98",
  "nips/07",
] as const;

const VIEWPORTS = [
  { name: "320", width: 320, height: 640 },
  { name: "375", width: 375, height: 812 },
  { name: "414", width: 414, height: 896 },
  { name: "landscape", width: 812, height: 375 },
] as const;

const THEMES = ["light", "dark"] as const;

/** WCAG 2.5.5 (AAA) target size; the brand's `--size-touch-target`. */
const TOUCH = 44;
/** Below this, iOS Safari zooms the page when a field gets focus. */
const MIN_FIELD_FONT = 16;

const SHOTS = process.env["MOBILE_AUDIT_SHOTS"];
const OUT = process.env["MOBILE_AUDIT_OUT"];

interface Audit {
  readonly overflow: {
    readonly scrollWidth: number;
    readonly innerWidth: number;
    readonly culprits: readonly string[];
  };
  readonly smallTargets: readonly string[];
  readonly smallFields: readonly string[];
  readonly clipped: readonly string[];
}

/** Runs in the page (serialized by Playwright), so it must be self-contained. */
const auditPage = async (opts: {
  readonly touch: number;
  readonly minFont: number;
}): Promise<Audit> => {
  const describe = (el: Element): string => {
    const id = el.closest("[data-testid]")?.getAttribute("data-testid") ?? "";
    const own = el.getAttribute("data-testid");
    const r = el.getBoundingClientRect();
    const label = (el.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 30);
    return `${el.tagName.toLowerCase()}${own === null ? ` in [${id}]` : `[${own}]`} "${label}" ${Math.round(r.width)}x${Math.round(r.height)}`;
  };
  const shown = (el: Element): boolean =>
    el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }) &&
    el.closest("[aria-hidden='true'], [inert]") === null;
  const srOnly = (r: DOMRect): boolean => r.width <= 2 || r.height <= 2;

  // 1. Horizontal overflow, plus the elements that stick out (outside any scroll container).
  const vw = window.innerWidth;
  const scrollsX = (el: Element): boolean => {
    for (let p = el.parentElement; p !== null && p !== document.body; p = p.parentElement) {
      const o = getComputedStyle(p).overflowX;
      if (o !== "visible") return true;
    }
    return false;
  };
  const culprits = [...document.body.querySelectorAll("*")]
    .filter((el) => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.right + window.scrollX > vw + 1 && shown(el) && !scrollsX(el);
    })
    .slice(0, 12)
    .map(describe);

  // 2. Touch targets. Inline links/terms inside running text are exempt (WCAG 2.5.5 inline).
  const controls = [
    ...document.querySelectorAll(
      "a[href], button, input:not([type='hidden']), select, textarea, summary, [role='button'], [role='tab'], [role='switch'], [role='checkbox'], [role='radio'], [role='slider'], [role='option'], [tabindex]:not([tabindex='-1'])",
    ),
  ];
  const inlineInText = (el: Element): boolean => {
    if (
      !getComputedStyle(el).display.startsWith("inline") ||
      getComputedStyle(el).display === "inline-flex"
    )
      return false;
    const block =
      el.parentElement?.closest("p, li, dd, td, blockquote, figcaption, label, span") ??
      el.parentElement;
    const own = (el.textContent ?? "").trim().length;
    return own > 0 && (block?.textContent ?? "").trim().length > own + 3;
  };
  /** Does a tap `d` px from the centre still land on the control (covers ::before hit-area tricks)? */
  const reaches = (el: Element, dx: number, dy: number): boolean => {
    const r = el.getBoundingClientRect();
    const hit = document.elementFromPoint(r.left + r.width / 2 + dx, r.top + r.height / 2 + dy);
    const owner = el.closest("label") ?? el;
    return hit !== null && (owner.contains(hit) || hit.contains(el));
  };
  const smallTargets: string[] = [];
  for (const el of controls) {
    if (!shown(el)) continue;
    const label = el.closest("label");
    const box = (label ?? el).getBoundingClientRect();
    const r = el.getBoundingClientRect();
    if (srOnly(r) && label === null) continue;
    if (box.right < 0 || box.bottom + window.scrollY < 0) continue; // off-screen skip link
    if (Math.round(box.width) >= opts.touch && Math.round(box.height) >= opts.touch) continue;
    if (inlineInText(el)) continue;
    el.scrollIntoView({ block: "center", inline: "center" });
    const half = opts.touch / 2 - 1;
    const wideOk =
      Math.round(box.width) >= opts.touch || (reaches(el, -half, 0) && reaches(el, half, 0));
    const tallOk =
      Math.round(box.height) >= opts.touch || (reaches(el, 0, -half) && reaches(el, 0, half));
    if (!(wideOk && tallOk)) smallTargets.push(describe(label ?? el));
  }
  window.scrollTo(0, 0);

  // 3. Form text size.
  const smallFields = [...document.querySelectorAll("input, select, textarea")]
    .filter((el) => {
      const type = el.getAttribute("type") ?? "text";
      if (
        ["checkbox", "radio", "range", "hidden", "button", "submit", "color", "file"].includes(type)
      )
        return false;
      return shown(el) && Number.parseFloat(getComputedStyle(el).fontSize) < opts.minFont;
    })
    .map((el) => `${describe(el)} font ${getComputedStyle(el).fontSize}`);

  // 4. Text cut off by an `overflow: hidden|clip` ancestor: compare each text run's box with
  //    every clipping ancestor's box.
  const clipped: string[] = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const seen = new Set<Element>();
  for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) {
    const parent = node.parentElement;
    if (parent === null || (node.textContent ?? "").trim() === "" || !shown(parent)) continue;
    if (parent.closest("svg, script, style, noscript, textarea")) continue;
    const range = document.createRange();
    range.selectNodeContents(node);
    const rects = [...range.getClientRects()].filter((q) => q.width > 0 && q.height > 0);
    if (rects.length === 0) continue;
    for (
      let a: HTMLElement | null = parent;
      a !== null && a !== document.body;
      a = a.parentElement
    ) {
      const cs = getComputedStyle(a);
      const clipX = cs.overflowX === "hidden" || cs.overflowX === "clip";
      const clipY = cs.overflowY === "hidden" || cs.overflowY === "clip";
      // A scroll container keeps its text reachable: stop at the first one.
      if ([cs.overflowX, cs.overflowY].some((o) => o === "auto" || o === "scroll")) break;
      if (!clipX && !clipY) continue;
      const box = a.getBoundingClientRect();
      if (srOnly(box)) break; // visually-hidden text is meant to be clipped
      const out = rects.some(
        (q) =>
          (clipX && (q.left < box.left - 1 || q.right > box.right + 1)) ||
          (clipY && (q.top < box.top - 1 || q.bottom > box.bottom + 1)),
      );
      if (out && !seen.has(a)) {
        seen.add(a);
        clipped.push(`${describe(a)} clips "${(node.textContent ?? "").trim().slice(0, 30)}"`);
      }
      break;
    }
  }

  return {
    overflow: {
      scrollWidth: document.scrollingElement?.scrollWidth ?? 0,
      innerWidth: vw,
      culprits,
    },
    smallTargets,
    smallFields,
    clipped,
  };
};

const slug = (path: string): string => (path === "" ? "home" : path.replaceAll("/", "_"));

const phone = (vp: { readonly width: number; readonly height: number }) => ({
  viewport: { width: vp.width, height: vp.height },
  isMobile: true,
  hasTouch: true,
});

// Runs once: it sets its own viewports, so the other projects would only repeat it.
test.beforeEach(async ({ browserName: _browser }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "sets its own phone viewports");
});

for (const vp of VIEWPORTS) {
  test.describe(`phone ${vp.name}`, () => {
    test.use(phone(vp));

    for (const locale of LOCALES) {
      for (const path of PAGES) {
        test(`${locale}/${path} fits a phone`, async ({ page }) => {
          for (const theme of THEMES) {
            await page.emulateMedia({ colorScheme: theme });
            await page.goto(pagePath(locale, path));
            const audit = await page.evaluate(auditPage, { touch: TOUCH, minFont: MIN_FIELD_FONT });
            const name = `${locale}-${slug(path)}-${vp.name}-${theme}`;
            if (OUT !== undefined) {
              mkdirSync(OUT, { recursive: true });
              writeFileSync(join(OUT, `${name}.json`), JSON.stringify(audit, null, 2));
            }
            if (SHOTS !== undefined)
              await page.screenshot({ path: join(SHOTS, `${name}.png`), fullPage: true });
            const where = `${name}:`;
            expect
              .soft(
                audit.overflow.scrollWidth,
                `${where} page scrolls sideways ${audit.overflow.culprits.join(" | ")}`,
              )
              .toBeLessThanOrEqual(audit.overflow.innerWidth);
            expect.soft(audit.smallTargets, `${where} targets under ${TOUCH}px`).toEqual([]);
            expect.soft(audit.smallFields, `${where} fields under ${MIN_FIELD_FONT}px`).toEqual([]);
            expect.soft(audit.clipped, `${where} clipped text`).toEqual([]);
          }
        });
      }

      test(`${locale} header menu and chapter sheet work by tap`, async ({ page }) => {
        await page.goto(pagePath(locale, "learn/keys"));
        const toggle = page.getByTestId("header-menu-toggle");
        await toggle.tap();
        const menu = page.getByTestId("header-menu");
        await expect(menu).toBeVisible();
        for (const id of [
          "nav-learn",
          "nav-tools",
          "nav-nips",
          "nav-glossary",
          "live-toggle",
          "theme-toggle",
          "locale-switcher",
        ]) {
          const box = await page.getByTestId(id).boundingBox();
          expect(box, `${id} is laid out`).not.toBeNull();
          if (box !== null)
            expect(box.x + box.width, `${id} inside the screen`).toBeLessThanOrEqual(vp.width + 1);
        }
        await page.keyboard.press("Escape");
        await expect(menu).toBeHidden();
        await toggle.tap();
        await page.getByTestId("header-menu-close").tap();
        await expect(menu).toBeHidden();

        const railToggle = page.getByTestId("chapter-rail-toggle");
        if (await railToggle.isVisible()) {
          await railToggle.tap();
          await expect(page.getByTestId("chapter-rail-sheet")).toBeVisible();
          await page.getByTestId("chapter-rail-close").tap();
          await expect(page.getByTestId("chapter-rail-sheet")).toBeHidden();
        }

        await toggle.tap();
        await page.getByTestId("nav-tools").tap();
        await expect(page).toHaveURL(new RegExp(`/${locale}/tools/$`));
      });
    }
  });
}

/** One tap per chapter's centrepiece, with the observable result it must produce. */
const CENTREPIECES: readonly {
  readonly path: string;
  readonly tap: readonly string[];
  readonly check: (page: Page) => Promise<void>;
}[] = [
  {
    path: "learn/why-nostr",
    tap: ["ch01-node-platform"],
    check: (p) => expect(p.getByTestId("ch01-node-platform")).toHaveAttribute("data-state", "down"),
  },
  {
    path: "learn/keys",
    tap: ["ch02-generate"],
    check: (p) => expect(p.getByTestId("ch02-demo-badge")).toBeVisible(),
  },
  {
    path: "learn/events",
    tap: ["ch03-exploded-field-tags"],
    check: (p) => expect(p.getByTestId("ch03-detail")).toHaveAttribute("data-field", "tags"),
  },
  {
    path: "learn/relays",
    tap: ["ch04-legend-EOSE"],
    check: (p) => expect(p.getByTestId("ch04-detail")).toHaveAttribute("data-verb", "EOSE"),
  },
  {
    path: "learn/filters",
    tap: ["ch05-builder-field-kinds-chip-1"],
    check: async (p) =>
      expect(
        Number(await p.getByTestId("ch05-builder").getAttribute("data-returned")),
      ).toBeLessThan(60),
  },
  {
    path: "learn/kinds",
    tap: ["ch06-table-filters-chip-ephemeral"],
    check: (p) => expect(p.getByTestId("ch06-table-group-ephemeral")).toHaveCount(0),
  },
  {
    path: "learn/social-graph",
    tap: ["ch07-force-node-grace"],
    check: (p) => expect(p.getByTestId("ch07-person")).toHaveAttribute("data-person", "grace"),
  },
  {
    path: "learn/private-messages",
    tap: ["ch08-scheme-nip17"],
    check: (p) => expect(p.getByTestId("ch08-leak-summary")).toHaveAttribute("data-leaks", "1"),
  },
  {
    path: "learn/zaps",
    tap: ["ch09-swimlane-controls-forward"],
    check: (p) => expect(p.getByTestId("ch09-flow-detail")).toHaveAttribute("data-step", "lnurlp"),
  },
  {
    path: "learn/signing",
    tap: ["ch10-sign", "ch10-approve"],
    check: (p) => expect(p.getByTestId("ch10-result")).toHaveAttribute("data-verdict", "safe"),
  },
  {
    path: "learn/ecosystem",
    tap: ["ch11-tabs-tab-nips"],
    check: (p) => expect(p.getByTestId("ch11-narration")).toContainText("NIPs"),
  },
  {
    path: "learn/trade-offs",
    tap: ["ch12-preset-dissident"],
    check: (p) => expect(p.getByTestId("ch12-rank-nostr")).toHaveAttribute("data-rank", "1"),
  },
];

test.describe("centrepieces by tap at 360px", () => {
  test.use(phone({ width: 360, height: 740 }));
  for (const c of CENTREPIECES) {
    test(`${c.path}`, async ({ page }) => {
      const locale: Locale = "en";
      await page.goto(pagePath(locale, c.path));
      for (const id of c.tap) {
        const target = page.getByTestId(id);
        await target.scrollIntoViewIfNeeded();
        await target.tap();
      }
      await c.check(page);
    });
  }
});
