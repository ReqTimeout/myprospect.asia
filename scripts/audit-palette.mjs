// Audit palet: warna APAKAH YANG BENAR-BENAR TERLIHAT di layar, bukan hex di token.
// Setiap elemen yang memakai oranye brand dikompositkan dulu ke latar belakangnya,
// lalu dikonversi ke HSL supaya saturasi/lightness bisa dibandingkan langsung.
// Ini menjawab klaim "oranye jatuh ke abu-abu" dengan angka, bukan tebakan.
import { chromium } from 'playwright-core';
import { existsSync } from 'node:fs';

const URL_BASE = (process.argv[2] || 'https://myprospect.asia').replace(/\/+$/, '');
const CANDIDATES = [
  '/Users/maabook/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
  '/Users/maabook/Library/Caches/ms-playwright/chromium-1228/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
  '/Users/miniex/Users/maabook/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
];
const exe = CANDIDATES.find((p) => existsSync(p));
if (!exe) { console.error('NO_BROWSER'); process.exit(1); }

const browser = await chromium.launch({ executablePath: exe, headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(URL_BASE, { waitUntil: 'networkidle', timeout: 60000 });
// paksa semua reveal selesai supaya warna akhirnya yang terukur
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await page.waitForTimeout(1200);
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(600);

const report = await page.evaluate(() => {
  const oklabToRgb = (L, a, b) => {
    let l_ = L + 0.3963377774 * a + 0.2158037573 * b;
    let m_ = L - 0.1055613458 * a - 0.0638541728 * b;
    let s_ = L - 0.0894841775 * a - 1.291485548 * b;
    [l_, m_, s_] = [l_, m_, s_].map((v) => Math.pow(v, 3));
    const enc = (v) => {
      v = v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
      return Math.round(Math.min(1, Math.max(0, v)) * 255);
    };
    return [enc(3.2409699419 * l_ - 1.5373831776 * m_ - 0.49861076 * s_),
            enc(-0.9692436363 * l_ + 1.8759675015 * m_ + 0.0415550574 * s_),
            enc(0.0556300797 * l_ - 0.2039769589 * m_ + 1.0569715142 * s_)];
  };
  const parse = (s) => {
    if (!s || s === 'none' || s === 'transparent') return null;
    let m = s.match(/^rgba?\(([^)]+)\)$/);
    if (m) {
      const p = m[1].split(/[,\s/]+/).filter(Boolean).map(parseFloat);
      return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
    }
    m = s.match(/^oklab\(([^)]+)\)$/);
    if (m) {
      const p = m[1].split(/[,\s/]+/).filter(Boolean).map(parseFloat);
      const [r, g, b] = oklabToRgb(p[0], p[1], p[2]);
      return { r, g, b, a: p.length > 3 ? p[3] : 1 };
    }
    m = s.match(/^#([0-9a-f]{6})$/i);
    if (m) return { r: parseInt(m[1].slice(0,2),16), g: parseInt(m[1].slice(2,4),16), b: parseInt(m[1].slice(4,6),16), a: 1 };
    return null;
  };
  const over = (fg, bg) => {
    if (!bg) return fg;
    const a = fg.a;
    return { r: fg.r * a + bg.r * (1 - a), g: fg.g * a + bg.g * (1 - a), b: fg.b * a + bg.b * (1 - a), a: 1 };
  };
  const hex = (c) => '#' + [c.r, c.g, c.b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
  const hsl = (c) => {
    const r = c.r / 255, g = c.g / 255, b = c.b / 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
    let h = 0;
    if (d) {
      if (mx === r) h = ((g - b) / d) % 6;
      else if (mx === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h *= 60; if (h < 0) h += 360;
    }
    const l = (mx + mn) / 2;
    const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
    return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
  };
  const bgOf = (el) => {
    for (let n = el; n; n = n.parentElement) {
      const c = parse(getComputedStyle(n).backgroundColor);
      if (c && c.a > 0.01) return over(c, n.parentElement ? bgOf(n.parentElement) : null);
      const bi = getComputedStyle(n).backgroundImage;
      if (bi && bi !== 'none') {
        const m = bi.match(/rgba?\([^)]+\)|#[0-9a-f]{6}/i);
        const g = m && parse(m[0]);
        if (g) return over(g, { r: 255, g: 252, b: 247, a: 1 });
      }
      if (!n.parentElement) break;
    }
    return { r: 255, g: 252, b: 247, a: 1 };
  };

  const out = [];
  const seen = new Set();
  for (const el of document.querySelectorAll('body *')) {
    const r = el.getBoundingClientRect();
    if (r.width < 4 || r.height < 4) continue;
    const cs = getComputedStyle(el);
    const label = (() => {
      const cls = (el.className || '').toString().split(/\s+/).filter((c) => /brand|gold|accent|text-|bg-|border-/.test(c)).slice(0, 3).join('.');
      return `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${cls ? '.' + cls : ''}`;
    })();
    for (const [prop, val] of [['bg', cs.backgroundColor], ['color', cs.color], ['border', cs.borderTopColor]]) {
      const c = parse(val);
      if (!c || c.a <= 0.01) continue;
      // hanya oranye/kuning yang memang jenuh di tokennya (brand, brand-dark, gold).
      // ink (#281814) juga berhue 12 tapi S-nya cuma 33% -> itu teks abu, bukan objek keluhan.
      const pure = hsl(c);
      if (pure.h < 14 || pure.h > 52 || pure.s < 70) continue;
      const final = over(c, bgOf(el.parentElement));
      const f = hsl(final);
      const key = `${label}|${prop}|${f.s}|${f.l}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ el: label, prop, token: hex(c), tokenS: pure.s, shown: hex(final), h: f.h, s: f.s, l: f.l, alpha: +c.a.toFixed(2) });
    }
  }
  return out;
});

// ringkas: kelompokkan berdasarkan saturasi akhir yang terlihat
const rows = report.sort((a, b) => a.s - b.s);
console.log('HEX_AKHIR  S%  L%  H   alpha  token_asli  elemen');
for (const r of rows) {
  const flag = r.s < 45 ? '  << PUDAR' : '';
  console.log(`${r.shown}  ${String(r.s).padStart(3)} ${String(r.l).padStart(3)} ${String(r.h).padStart(3)}  ${String(r.alpha).padStart(5)}  ${r.token}  ${r.el.slice(0, 62)}${flag}`);
}
const pudar = rows.filter((r) => r.s < 45).length;
console.log(`\ntotal sampel oranye: ${rows.length} — yang jatuh ke abu (S<45%): ${pudar}`);

// rangkuman per token: seberapa jauh saturasi turun dari token ke layar
const perToken = {};
for (const r of rows) {
  const k = `${r.token} @${r.alpha}`;
  (perToken[k] ||= []).push(r.s);
}
console.log('\nTOKEN        n   S_asli -> S_terlihat (min/median)');
for (const [k, arr] of Object.entries(perToken).sort((a, b) => b[1].length - a[1].length).slice(0, 18)) {
  const tokenS = report.find((r) => `${r.token} @${r.alpha}` === k).tokenS;
  const med = arr.slice().sort((a, b) => a - b)[Math.floor(arr.length / 2)];
  console.log(`${k.padEnd(14)}${String(arr.length).padStart(3)}   ${String(tokenS).padStart(3)}% -> ${String(Math.min(...arr)).padStart(3)}% / ${String(med).padStart(3)}%`);
}
await browser.close();
