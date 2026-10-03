/**
 * Rasterises the brand images that can't be SVG: the default Open Graph card (1200×630) and the
 * Apple touch icon (180×180). Uses Playwright's Chromium so the real self-hosted fonts render.
 *
 *   bun run brand:images
 *
 * Colours mirror @nostrschool/tokens (light theme); the raw palette is private, so the values are
 * read from the generated theme rather than duplicated here.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "@playwright/test";
import { themes } from "../packages/tokens/src/index.ts";

const root = join(import.meta.dir, "..");
const pub = join(root, "apps/site/public");
const font = (pkg: string, file: string) =>
  readFileSync(
    join(root, "apps/site/node_modules/@fontsource-variable", pkg, "files", file),
  ).toString("base64");
const c = themes.light.color;

const fontFaces = `
@font-face { font-family: "Bricolage"; font-weight: 200 800;
  src: url(data:font/woff2;base64,${font("bricolage-grotesque", "bricolage-grotesque-latin-opsz-normal.woff2")}) format("woff2"); }
@font-face { font-family: "JBM"; font-weight: 100 800;
  src: url(data:font/woff2;base64,${font("jetbrains-mono", "jetbrains-mono-latin-wght-normal.woff2")}) format("woff2"); }`;

/** The N mark, identical to favicon.svg. */
const mark = (size: number) => `
<svg width="${size}" height="${size}" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <rect x="9" y="9" width="51" height="51" rx="3" fill="${c.mascotBody}"/>
  <rect x="3" y="3" width="51" height="51" rx="3" fill="${c.primary}" stroke="${c.text}" stroke-width="3"/>
  <path d="M17 42V16l23 26V16" fill="none" stroke="${c.text}" stroke-width="6" stroke-linecap="square"/>
</svg>`;

const og = `<!doctype html><html><head><style>${fontFaces}
* { box-sizing: border-box; margin: 0; }
body { width: 1200px; height: 630px; background: ${c.bg}; color: ${c.text};
  font-family: "Bricolage"; font-optical-sizing: auto; position: relative; overflow: hidden; }
.dots { position: absolute; right: -40px; top: -40px; width: 520px; height: 520px; border-radius: 50%;
  background-image: radial-gradient(circle, ${c.primary} 3.2px, transparent 3.7px); background-size: 14px 14px; }
.card { position: absolute; left: 72px; top: 72px; right: 72px; bottom: 72px; border: 3px solid ${c.text};
  background: ${c.surfaceRaised}; box-shadow: 10px 10px 0 ${c.text}; padding: 56px 64px; display: flex; flex-direction: column; }
.eyebrow { font-family: "JBM"; font-weight: 600; font-size: 22px; letter-spacing: .12em; text-transform: uppercase; color: ${c.textMuted}; display: flex; gap: 16px; align-items: center; }
h1 { font-size: 120px; font-weight: 800; letter-spacing: -0.04em; line-height: .95; margin-top: 28px; }
mark { background: linear-gradient(176deg, transparent 0 40%, ${c.highlight} 40% 90%, transparent 90%); color: inherit; padding: 0 .08em; }
p { font-size: 34px; line-height: 1.3; margin-top: auto; max-width: 820px; font-weight: 500; }
.wire { font-family: "JBM"; font-size: 22px; position: absolute; right: 64px; top: 64px; display: flex; flex-direction: column; gap: 14px; align-items: flex-end; }
.pk { border: 2px solid ${c.text}; padding: 6px 14px; box-shadow: 4px 4px 0 ${c.text}; color: ${c.onPacket}; font-weight: 700; }
</style></head><body>
<div class="dots"></div>
<div class="card">
  <div class="eyebrow">${mark(44)}<span>A field notebook for the protocol</span></div>
  <h1>Nostr <mark>School</mark></h1>
  <p>Keys, events, relays, filters and zaps, explained with real signed events you can poke at.</p>
  <div class="wire">
    <span class="pk" style="background:${c.packetReq}">["REQ", …]</span>
    <span class="pk" style="background:${c.packetEvent}">["EVENT", …]</span>
    <span class="pk" style="background:${c.packetEose}">["EOSE", …]</span>
  </div>
</div>
</body></html>`;

const touch = `<!doctype html><html><head><style>* { margin: 0; } body { width: 180px; height: 180px;
  background: ${c.bg}; display: grid; place-items: center; }</style></head><body>${mark(150)}</body></html>`;

const browser = await chromium.launch();
try {
  const shoot = async (html: string, width: number, height: number, file: string) => {
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
    await page.setContent(html);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: join(pub, file), type: "png" });
    await page.close();
    console.log(`wrote apps/site/public/${file}`);
  };
  await shoot(og, 1200, 630, "og-default.png");
  await shoot(touch, 180, 180, "apple-touch-icon.png");
} finally {
  await browser.close();
}
