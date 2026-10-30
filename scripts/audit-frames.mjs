import { chromium } from 'playwright-core';

const EXEC = '/Users/maabook/Library/Caches/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-mac-arm64/chrome-headless-shell';
const BASE = process.argv[2] || 'https://myprospect-7uk.pages.dev/';
const TAG = process.argv[3] || 'base';

const browser = await chromium.launch({ executablePath: EXEC, headless: true });

const VIEWS = [
  { name: 'desktop', width: 1440, height: 900, mobile: false },
  { name: 'mobile', width: 390, height: 844, mobile: true },
];

for (const v of VIEWS) {
  const ctx = await browser.newContext({
    viewport: { width: v.width, height: v.height },
    deviceScaleFactor: 1,
    isMobile: v.mobile,
    hasTouch: v.mobile,
  });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
  await page.goto(BASE, { waitUntil: 'load' });
  await page.waitForTimeout(1600);

  // scroll pelan-pelan supaya semua reveal + split terpicu
  await page.evaluate(async () => {
    const h = document.body.scrollHeight;
    for (let y = 0; y <= h; y += 250) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 90));
    }
  });
  await page.waitForTimeout(1200);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(900);

  // deteksi overflow horizontal + elemen terpotong
  const diag = await page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const over = [];
    document.querySelectorAll('body *').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      if (r.right > vw + 2 || r.left < -2) {
        const cs = getComputedStyle(el);
        if (cs.position === 'fixed') return;
        // abaikan elemen yang memang sengaja di-mask / overflow-hidden
        let p = el.parentElement, masked = false;
        while (p) {
          const pcs = getComputedStyle(p);
          if (pcs.overflowX !== 'visible') { masked = true; break; }
          p = p.parentElement;
        }
        if (masked) return;
        over.push({
          tag: el.tagName,
          cls: (el.className || '').toString().slice(0, 70),
          left: Math.round(r.left),
          right: Math.round(r.right),
        });
      }
    });
    return {
      vw,
      docScrollW: document.documentElement.scrollWidth,
      bodyScrollW: document.body.scrollWidth,
      horizontalOverflow: document.documentElement.scrollWidth > vw + 1,
      over: over.slice(0, 12),
      revealNotIn: document.querySelectorAll('[data-reveal]:not(.rd-in)').length,
      revealTotal: document.querySelectorAll('[data-reveal]').length,
    };
  });
  console.log(v.name, JSON.stringify(diag));

  // ambil frame per viewport (bukan fullPage supaya resolusi tetap terbaca)
  const total = await page.evaluate(() => document.body.scrollHeight);
  const step = Math.round(v.height * 0.92);
  let i = 0;
  for (let y = 0; y < total; y += step) {
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await page.waitForTimeout(260);
    await page.screenshot({ path: `/tmp/f-${TAG}-${v.name}-${String(i).padStart(2, '0')}.png` });
    i++;
    if (i > 24) break;
  }
  console.log(v.name, 'frames:', i, 'errors:', JSON.stringify(errs.slice(0, 4)));
  await ctx.close();
}

await browser.close();
