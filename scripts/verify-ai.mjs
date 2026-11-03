// Verifikasi revisi "terlihat AI": flat (tanpa gradien warna), minim animasi
// berjalan, oranye solid, tanpa tanda pisah, plus audit kontras menyeluruh.
// Pakai playwright-core + Chrome for Testing yang sudah ada di cache ms-playwright.
import { chromium } from 'playwright-core';
import { existsSync, mkdirSync } from 'node:fs';

const BASE = process.argv[2] || 'http://localhost:8788';
const OUT = new URL('../.tmp/shots/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

const CANDIDATES = [
  '/Users/maabook/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
  '/Users/maabook/Library/Caches/ms-playwright/chromium-1228/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
  '/Users/maabook/Library/Caches/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-mac-arm64/chrome-headless-shell',
];
const exe = CANDIDATES.find((p) => existsSync(p));
if (!exe) { console.error('NO_BROWSER'); process.exit(1); }

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
];

const PAGES = [
  { name: 'home', path: '/' },
  { name: 'tentang', path: '/tentang' },
  { name: 'faq', path: '/faq' },
  { name: 'berita', path: '/berita' },
  { name: 'post', path: '/berita/bintang-gohan' },
  { name: 'program', path: '/program/premium-1on1' },
  { name: 'workshop', path: '/workshop/premium' },
];

// Ambillah fungsi kontras dari verify-revisi: parsing rgb/oklab/hex + komposit
// latar bertingkat, lalu bandingkan dengan AA (4.5 normal, 3 besar).
const CONTRAST_FN = `
const oklabToRgb = (L, a, b) => {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3, m = m_ ** 3, s = s_ ** 3;
  const enc = (v) => { const c = v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(Math.max(v, 0), 1 / 2.4) - 0.055; return Math.min(255, Math.max(0, c * 255)); };
  return [enc(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s), enc(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s), enc(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s)];
};
const parse = (s) => {
  if (!s) return null;
  const t = s.trim();
  if (t === 'transparent' || t === 'none') return null;
  let m = t.match(/^rgba?\\(([^)]+)\\)$/);
  if (m) { const p = m[1].split(/[\\s,/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1]; }
  m = t.match(/^oklab\\(([^)]+)\\)$/);
  if (m) { const p = m[1].split(/[\\s/]+/).filter(Boolean).map(Number); const [r, g, b] = oklabToRgb(p[0], p[1], p[2]); return [r, g, b, p.length > 3 ? p[3] : 1]; }
  m = t.match(/^#([0-9a-f]{3,8})$/i);
  if (m) { let h = m[1]; if (h.length === 3) h = h.split('').map((c) => c + c).join(''); const n = parseInt(h.slice(0, 6), 16); const a = h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1; return [(n >> 16) & 255, (n >> 8) & 255, n & 255, a]; }
  return null;
};
const over = (fg, bg) => [0, 1, 2].map((i) => fg[i] * fg[3] + bg[i] * (1 - fg[3])).concat(1);
const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
const ratio = (a, b) => { const l1 = lum(a), l2 = lum(b); const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1]; return (hi + 0.05) / (lo + 0.05); };
const stops = (bi) => {
  if (!bi || !bi.includes('gradient')) return null;
  const re = /rgba?\\([^)]+\\)|oklab\\([^)]+\\)|#[0-9a-f]{3,8}/gi;
  const parts = bi.match(re) || [];
  const out = [];
  parts.forEach((c, i) => { const p = parse(c); if (p) out.push([parts.length === 1 ? 1 : i / (parts.length - 1), p]); });
  return out.length ? out : null;
};
const bgOf = (el) => {
  let n = el; const stack = [];
  while (n && n !== document.documentElement) {
    const cs = getComputedStyle(n);
    const st = stops(cs.backgroundImage);
    if (st) {
      const rect = n.getBoundingClientRect();
      const rel = rect.height > 0 ? Math.min(1, Math.max(0, (el.getBoundingClientRect().top - rect.top) / rect.height)) : 0.5;
      let chosen = st[0][1];
      for (const [pos, c] of st) if (pos <= rel + 0.001) chosen = c;
      stack.push(chosen);
    } else {
      const bc = parse(cs.backgroundColor);
      if (bc && bc[3] > 0.001) stack.push(bc);
    }
    n = n.parentElement;
  }
  stack.push([255, 255, 255, 1]);
  let acc = stack[stack.length - 1];
  for (let i = stack.length - 2; i >= 0; i--) acc = over(stack[i], acc);
  return acc;
};
`;

const browser = await chromium.launch({ executablePath: exe, headless: true, args: ['--hide-scrollbars'] });
const report = {};

for (const vp of VIEWPORTS) {
  report[vp.name] = {};
  for (const p of PAGES) {
    const ctx = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2,
      isMobile: vp.name === 'mobile',
      hasTouch: vp.name === 'mobile',
      reducedMotion: 'no-preference',
    });
    const page = await ctx.newPage();
    const errors = [];
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 120)); });
    page.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message.slice(0, 120)));
    const failed = [];
    page.on('response', (r) => { if (r.status() >= 400) failed.push(r.status() + ' ' + r.url()); });

    await page.goto(BASE + p.path, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(2500);
    await page.evaluate(() => {
      document.querySelectorAll('[data-reveal]').forEach((e) => e.classList.add('rd-in'));
      document.querySelectorAll('img[loading="lazy"]').forEach((i) => { i.loading = 'eager'; });
      const c = document.querySelector('.page-curtain'); if (c) c.remove();
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(1200);

    const r = { errors, failed: [...new Set(failed)].slice(0, 8) };

    // --- animasi yang masih berjalan ---
    r.motion = await page.evaluate(() => {
      const seen = {};
      const inf = [];
      for (const a of document.getAnimations()) {
        const el = a.effect?.target;
        if (!el || el === document.documentElement) continue;
        const cs = getComputedStyle(el);
        const name = cs.animationName || '(web-animation)';
        if (cs.animationIterationCount === 'infinite') {
          const key = name + ' :: ' + el.className.toString().slice(0, 46);
          inf.push(key);
        }
        if (name !== 'none') seen[name] = (seen[name] || 0) + 1;
      }
      return { named: seen, infinite: [...new Set(inf)] };
    });

    // --- latar gradien dua-warna yang masih tersisa ---
    r.colorGradients = await page.evaluate(() => {
      const hue = (c) => {
        const [r, g, b] = c.map((v) => v / 255);
        const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
        if (!d) return -1;
        const h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
        return Math.round(h * 60);
      };
      const out = [];
      document.querySelectorAll('body *').forEach((el) => {
        const bi = getComputedStyle(el).backgroundImage;
        if (!bi || !bi.includes('gradient(')) return;
        const re = /rgba?\([^)]+\)|#[0-9a-f]{3,8}/gi;
        const cols = (bi.match(re) || []).map((s) => {
          const m = s.match(/^rgba?\(([^)]+)\)$/);
          if (m) { const p = m[1].split(/[,\s/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p[3] ?? 1]; }
          const h = s.slice(1); const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h.slice(0, 6), 16);
          const a = h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1;
          return [(n >> 16) & 255, (n >> 8) & 255, n & 255, a];
        });
        const opaque = cols.filter((c) => c[3] > 0.05 && (c[0] + c[1] + c[2]) > 6);
        const distinct = new Set(opaque.map((c) => hue(c) === -1 ? 'gray' : Math.floor(hue(c) / 20)));
        if (distinct.size >= 2) {
          out.push(el.tagName + '.' + el.className.toString().slice(0, 40) + ' :: ' + bi.slice(0, 90));
        }
      });
      return [...new Set(out)].slice(0, 10);
    });

    r.blurs = await page.evaluate(() =>
      [...new Set([...document.querySelectorAll('body *')]
        .map((e) => getComputedStyle(e))
        .filter((cs) => cs.backdropFilter && cs.backdropFilter !== 'none')
        .map((cs) => cs.backdropFilter))].slice(0, 6));

    r.dashes = await page.evaluate(() => (document.body.innerText.match(/\u2014/g) || []).length);

    r.favicon = await page.evaluate(() => {
      const l = document.querySelector('link[rel="icon"]');
      return l ? l.getAttribute('href') : null;
    });

    r.contrast = await page.evaluate('(() => {' + CONTRAST_FN + `
const out = [];
document.querySelectorAll('body *').forEach((el) => {
  const txt = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join('').trim();
  if (txt.length < 2) return;
  const rect = el.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  const cs = getComputedStyle(el);
  const fg = parse(cs.color);
  if (!fg) return;
  const bg = bgOf(el);
  const fgFlat = fg[3] < 1 ? over(fg, bg) : fg;
  const rr = ratio(fgFlat, bg);
  const px = parseFloat(cs.fontSize);
  const bold = parseInt(cs.fontWeight, 10) >= 700;
  const large = px >= 24 || (px >= 18.66 && bold);
  const need = large ? 3 : 4.5;
  if (rr < need) out.push({ text: txt.slice(0, 34), size: cs.fontSize, color: cs.color, ratio: +rr.toFixed(2), need, cls: el.className.toString().slice(0, 34) });
});
return out;
})()`);

    r.overflow = await page.evaluate(() => ({
      docW: document.documentElement.scrollWidth,
      vw: window.innerWidth,
      offenders: [...document.querySelectorAll('body *')]
        .filter((e) => e.getBoundingClientRect().right > window.innerWidth + 2 && getComputedStyle(e).position !== 'fixed')
        .slice(0, 4)
        .map((e) => e.tagName + '.' + e.className.toString().slice(0, 36)),
    }));

    const full = `${OUT}ai-${p.name}-full-${vp.name}.png`;
    await page.screenshot({ path: full, fullPage: true, timeout: 40000 });
    r.shot = full;

    report[vp.name][p.name] = r;
    await ctx.close();
  }
}

await browser.close();
console.log(JSON.stringify(report, null, 1));
