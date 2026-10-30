import { chromium } from 'playwright-core';

const EXEC = '/Users/maabook/Library/Caches/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-mac-arm64/chrome-headless-shell';
const BASE = process.argv[2] || 'http://localhost:8099/';

const PAGES = [
  '/',
  '/program/elite-1on1/',
  '/program/premium-1on1/',
  '/program/small-group/',
  '/workshop/starter/',
  '/workshop/premium/',
  '/workshop/pro/',
  '/tentang/',
  '/faq/',
  '/berita/',
];

const VIEWS = [
  { name: 'desktop', width: 1440, height: 900, mobile: false },
  { name: 'mobile', width: 390, height: 844, mobile: true },
];

const browser = await chromium.launch({ executablePath: EXEC, headless: true });
let total = 0;

for (const v of VIEWS) {
  const ctx = await browser.newContext({
    viewport: { width: v.width, height: v.height },
    deviceScaleFactor: 1,
    isMobile: v.mobile,
    hasTouch: v.mobile,
  });
  const page = await ctx.newPage();

  for (const p of PAGES) {
    await page.goto(BASE.replace(/\/$/, '') + p, { waitUntil: 'load' });
    await page.waitForTimeout(900);
    await page.evaluate(async () => {
      const h = document.body.scrollHeight;
      for (let y = 0; y <= h; y += 300) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 60));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(600);

    const issues = await page.evaluate(() => {
      const out = [];
      const vw = document.documentElement.clientWidth;

      // 1. teks terpotong: scrollWidth > clientWidth pada elemen dengan overflow tersembunyi
      document.querySelectorAll('body *').forEach((el) => {
        const cs = getComputedStyle(el);
        if (cs.overflowX === 'visible' && cs.overflowY === 'visible') return;
        if (cs.display === 'none' || cs.visibility === 'hidden') return;
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) return;
        const dx = el.scrollWidth - el.clientWidth;
        const dy = el.scrollHeight - el.clientHeight;
        if (dx > 2 || dy > 2) {
          const txt = (el.textContent || '').trim();
          if (!txt) return;
          out.push({
            kind: 'clipped',
            tag: el.tagName,
            cls: (el.className || '').toString().slice(0, 60),
            over: `${dx}x${dy}`,
            txt: txt.slice(0, 45),
          });
        }
      });

      // 2. elemen keluar viewport horizontal (bukan fixed, bukan di dalam overflow hidden)
      document.querySelectorAll('body *').forEach((el) => {
        const cs = getComputedStyle(el);
        if (cs.position === 'fixed') return;
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) return;
        if (r.right > vw + 2 || r.left < -2) {
          let p = el.parentElement, hidden = false;
          while (p) {
            const pcs = getComputedStyle(p);
            if (pcs.overflowX !== 'visible') { hidden = true; break; }
            p = p.parentElement;
          }
          if (hidden) return;
          out.push({
            kind: 'overflow',
            tag: el.tagName,
            cls: (el.className || '').toString().slice(0, 60),
            left: Math.round(r.left),
            right: Math.round(r.right),
          });
        }
      });

      // 3. elemen fixed (popup/bubble) menutupi elemen interaktif
      const fixed = [...document.querySelectorAll('body *')].filter((el) => {
        const cs = getComputedStyle(el);
        if (cs.position !== 'fixed' || cs.display === 'none') return false;
        const r = el.getBoundingClientRect();
        return r.width > 20 && r.height > 20 && r.bottom > 0 && r.top < innerHeight;
      });
      fixed.forEach((f) => {
        const fr = f.getBoundingClientRect();
        document.querySelectorAll('a, button, input, textarea').forEach((t) => {
          const cs = getComputedStyle(t);
          if (cs.position === 'fixed' || cs.display === 'none' || cs.visibility === 'hidden') return;
          const tr = t.getBoundingClientRect();
          if (tr.width === 0 || tr.height === 0) return;
          const ox = Math.min(fr.right, tr.right) - Math.max(fr.left, tr.left);
          const oy = Math.min(fr.bottom, tr.bottom) - Math.max(fr.top, tr.top);
          if (ox > 6 && oy > 6) {
            const area = ox * oy;
            if (area > tr.width * tr.height * 0.3) {
              out.push({
                kind: 'covered',
                by: (f.className || '').toString().slice(0, 40),
                target: t.tagName + ':' + (t.textContent || '').trim().slice(0, 25),
                pct: Math.round((area / (tr.width * tr.height)) * 100),
              });
            }
          }
        });
      });

      // dedup
      const seen = new Set();
      return out.filter((o) => {
        const k = JSON.stringify(o);
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });
    });

    if (issues.length) {
      total += issues.length;
      console.log(`\n### ${v.name} ${p} — ${issues.length} issue`);
      issues.slice(0, 14).forEach((i) => console.log('   ', JSON.stringify(i)));
    } else {
      console.log(`OK  ${v.name} ${p}`);
    }
  }
  await ctx.close();
}

console.log(`\nTOTAL ISSUES: ${total}`);
await browser.close();
