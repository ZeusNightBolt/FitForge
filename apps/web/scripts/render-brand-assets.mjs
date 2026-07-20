/**
 * Brand asset render pipeline (§3.3).
 *
 * Rasterizes the hand-authored SVG/HTML sources into the committed binary
 * assets the static export ships:
 *   - assets-src/og.html      -> public/og.png            (1200x630)
 *   - public/favicon.svg      -> public/favicon-32.png    (32)
 *                                public/apple-touch-icon.png (180, padded)
 *                                public/icon-192.png       (192)
 *                                public/icon-512.png       (512)
 *
 * Uses the preinstalled Chromium via playwright-core (loaded through
 * createRequire so it works from an ESM module). Run manually / in CI with
 * `npm run assets:render` — it is NOT part of `next build`, and the rendered
 * PNGs are committed so the GitHub Pages build never needs Playwright.
 *
 *   node scripts/render-brand-assets.mjs
 */
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';
import { readFileSync } from 'node:fs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright-core');

const __dirname = dirname(fileURLToPath(import.meta.url));
const webRoot = resolve(__dirname, '..');
const publicDir = resolve(webRoot, 'public');
const ogHtml = resolve(webRoot, 'assets-src', 'og.html');

const CHROME =
  process.env.PW_CHROMIUM_PATH ||
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const INK = '#0A0D14';

/** Icon PNGs derived from favicon.svg. `pad` = fraction of size as padding. */
const ICONS = [
  { file: 'favicon-32.png', size: 32, pad: 0 },
  { file: 'icon-192.png', size: 192, pad: 0 },
  { file: 'icon-512.png', size: 512, pad: 0 },
  { file: 'apple-touch-icon.png', size: 180, pad: 0.2 },
];

function iconHtml(svg, size, pad) {
  const inner = Math.round(size * (1 - 2 * pad));
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    *{margin:0;padding:0;box-sizing:border-box}
    html,body{width:${size}px;height:${size}px}
    .tile{width:${size}px;height:${size}px;background:${INK};
      display:flex;align-items:center;justify-content:center}
    .mark{width:${inner}px;height:${inner}px}
    .mark svg{width:100%;height:100%;display:block}
  </style></head><body><div class="tile"><div class="mark">${svg}</div></div></body></html>`;
}

async function main() {
  const faviconSvg = readFileSync(resolve(publicDir, 'favicon.svg'), 'utf8');

  const browser = await chromium.launch({
    executablePath: CHROME,
    headless: true,
    args: ['--no-sandbox', '--disable-gpu', '--force-color-profile=srgb'],
  });

  try {
    // ── OG card ───────────────────────────────────────────
    {
      const page = await browser.newPage({
        viewport: { width: 1200, height: 630 },
        deviceScaleFactor: 1,
      });
      await page.goto(pathToFileURL(ogHtml).href, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({
        path: resolve(publicDir, 'og.png'),
        clip: { x: 0, y: 0, width: 1200, height: 630 },
      });
      await page.close();
      console.log('rendered public/og.png (1200x630)');
    }

    // ── Icon set ──────────────────────────────────────────
    for (const { file, size, pad } of ICONS) {
      const page = await browser.newPage({
        viewport: { width: size, height: size },
        deviceScaleFactor: 1,
      });
      await page.setContent(iconHtml(faviconSvg, size, pad), {
        waitUntil: 'networkidle',
      });
      await page.screenshot({
        path: resolve(publicDir, file),
        clip: { x: 0, y: 0, width: size, height: size },
      });
      await page.close();
      console.log(`rendered public/${file} (${size}x${size})`);
    }
  } finally {
    await browser.close();
  }
  console.log('brand assets rendered.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
