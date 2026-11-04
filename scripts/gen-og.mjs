/**
 * Generator kartu OG (1200x630) untuk Prospect Asia.
 *
 * Cara kerja: render HTML di Chromium headless memakai font asli situs
 * (Anton + Plus Jakarta Sans dari @fontsource, di-inline sebagai data URL),
 * lalu screenshot jadi JPEG. Hasil disimpan ke src/assets/generated/og-cover.jpg
 * dan dipakai Base.astro sebagai og:image / twitter:image.
 *
 * Jalankan: node scripts/gen-og.mjs [path-foto-latar]
 */
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';

const EXEC =
  '/Users/maabook/Library/Caches/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-mac-arm64/chrome-headless-shell';
const ROOT = path.resolve(import.meta.dirname, '..');
const BG = process.argv[2] || path.join(ROOT, '.tmp/og2/image_1_Flat_min_20261104_111658.jpg');
const OUT = path.join(ROOT, 'src/assets/generated/og-cover.jpg');

const dataUrl = (p) => `data:font/woff2;base64,${fs.readFileSync(p).toString('base64')}`;

const anton = dataUrl(
  path.join(ROOT, 'node_modules/@fontsource/anton/files/anton-latin-400-normal.woff2'),
);
const jakarta = dataUrl(
  path.join(
    ROOT,
    'node_modules/@fontsource-variable/plus-jakarta-sans/files/plus-jakarta-sans-latin-wght-normal.woff2',
  ),
);
const logo = dataUrl(path.join(ROOT, 'public/media/logo-prospect-black.png'));
const bg = dataUrl(BG);

const html = `<!doctype html>
<html><head><meta charset="utf-8"><style>
  @font-face { font-family: 'Anton'; src: url(${anton}) format('woff2'); font-weight: 400; }
  @font-face { font-family: 'Jakarta'; src: url(${jakarta}) format('woff2'); font-weight: 200 800; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: 1200px; height: 630px; background: #fffcf7; overflow: hidden; }
  .card { position: relative; width: 1200px; height: 630px; background: url(${bg}) center/cover no-repeat; }
  .inner { position: absolute; inset: 0; padding: 58px 72px 54px; display: flex; flex-direction: column; }
  .logo { width: 200px; height: auto; display: block; }
  .spacer { flex: 1; }
  h1 {
    font-family: 'Anton', sans-serif; font-size: 80px; line-height: 0.94;
    letter-spacing: -0.01em; color: #241a12; text-transform: uppercase;
  }
  h1 .oranye { color: #ff8000; }
  .sub {
    margin-top: 18px; font-family: 'Jakarta', sans-serif; font-weight: 600;
    font-size: 25px; line-height: 1.4; color: rgba(36,26,18,.78); max-width: 720px;
  }
  .foot { margin-top: 26px; display: flex; align-items: center; gap: 14px; }
  .chip {
    font-family: 'Jakarta', sans-serif; font-weight: 800; font-size: 16px;
    letter-spacing: .18em; text-transform: uppercase; color: #241a12;
    background: #ff8000; padding: 10px 18px; border-radius: 999px;
  }
  .url { font-family: 'Jakarta', sans-serif; font-weight: 700; font-size: 19px; color: rgba(36,26,18,.7); }
  .rule { margin-top: 24px; width: 88px; height: 6px; background: #ff8000; }
</style></head>
<body><div class="card">
  <div class="inner">
    <img class="logo" src="${logo}" alt="" />
    <div class="spacer"></div>
    <h1>Jadi Atlet<br /><span class="oranye">Modern</span> dengan<br />Sports Communication</h1>
    <p class="sub">Public speaking &amp; bahasa Inggris khusus atlet. Online, fleksibel, didampingi coach berpengalaman.</p>
    <div class="foot">
      <span class="chip">#JadiAtletModern</span>
      <span class="url">myprospect.asia</span>
    </div>
    <div class="rule"></div>
  </div>
</div></body></html>`;

const browser = await chromium.launch({ executablePath: EXEC, headless: true });
const ctx = await browser.newContext({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
await page.setContent(html, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(600);
await page.screenshot({ path: OUT, type: 'jpeg', quality: 90 });
await browser.close();
console.log('OG dibuat:', OUT);
