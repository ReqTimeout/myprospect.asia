import { chromium } from 'playwright-core';

const EXEC =
  '/Users/maabook/Library/Caches/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-mac-arm64/chrome-headless-shell';
const BASE = process.argv[2] || 'http://localhost:8099/';
const TAG = process.argv[3] || 'modal';

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
  await page.goto(BASE, { waitUntil: 'load' });
  await page.waitForTimeout(1400);

  // buka modal lewat CTA hero
  await page.click('[data-register][data-source="hero"]');
  await page.waitForTimeout(700);
  await page.screenshot({ path: `/tmp/m-${TAG}-${v.name}-hero.png` });

  const diag = await page.evaluate(() => {
    const dlg = document.querySelector('[role="dialog"]');
    if (!dlg) return { ok: false };
    const r = dlg.getBoundingClientRect();
    const vw = document.documentElement.clientWidth;
    const vh = document.documentElement.clientHeight;
    const fields = [...dlg.querySelectorAll('input,select,textarea,button')].map((el) => {
      const b = el.getBoundingClientRect();
      return {
        id: el.id || el.tagName,
        w: Math.round(b.width),
        h: Math.round(b.height),
        right: Math.round(b.right),
        bottom: Math.round(b.bottom),
      };
    });
    return {
      ok: true,
      vw,
      vh,
      top: Math.round(r.top),
      left: Math.round(r.left),
      right: Math.round(r.right),
      bottom: Math.round(r.bottom),
      w: Math.round(r.width),
      h: Math.round(r.height),
      insideViewport: r.top >= -1 && r.bottom <= vh + 1 && r.left >= -1 && r.right <= vw + 1,
      bodyOverflow: getComputedStyle(document.body).overflow,
      fields,
    };
  });
  console.log(v.name, JSON.stringify(diag));

  // isi form lalu submit (tanpa API lokal -> cek error state)
  await page.fill('#reg-nama', 'Ahmad Fauzi');
  await page.fill('#reg-wa', '081234567890');
  await page.selectOption('#reg-program', { index: 1 }).catch(() => {});
  await page.waitForTimeout(200);
  await page.screenshot({ path: `/tmp/m-${TAG}-${v.name}-filled.png` });

  await page.click('button[type="submit"]');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `/tmp/m-${TAG}-${v.name}-after.png` });

  // tutup dengan ESC lalu cek body overflow balik normal
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  const closed = await page.evaluate(() => ({
    dlg: !!document.querySelector('[role="dialog"]'),
    bodyOverflow: document.body.style.overflow,
  }));
  console.log(v.name, 'after-esc', JSON.stringify(closed), 'errors:', JSON.stringify(errs.slice(0, 3)));
  await ctx.close();
}

await browser.close();
