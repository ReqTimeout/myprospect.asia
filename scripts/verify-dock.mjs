// Verifikasi dock mobile: label tampil di semua halaman, 5 item seragam,
// WhatsApp hijau dengan glif asli, dan tidak ada overflow horizontal.
// Pakai playwright-core + Chrome for Testing yang sudah terpasang di cache ms-playwright.
import { chromium } from 'playwright-core';
import { existsSync, mkdirSync } from 'node:fs';

const URL_BASE = (process.argv[2] || 'https://myprospect.asia').replace(/\/+$/, '');
const OUT = '/Users/maabook/Downloads';
mkdirSync(OUT, { recursive: true });

const CANDIDATES = [
  '/Users/maabook/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
  '/Users/maabook/Library/Caches/ms-playwright/chromium-1228/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
  '/Users/maabook/Library/Caches/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-mac-arm64/chrome-headless-shell',
];
const exe = CANDIDATES.find((p) => existsSync(p));
if (!exe) { console.error('NO_BROWSER'); process.exit(1); }

const LABELS = ['Home', 'Program', 'Workshop', 'Berita', 'Chat'];
const WA_GREEN = 'rgb(37, 211, 102)';

// halaman Astro + satu single post (dirender Pages Function)
const PAGES = [
  { path: '/', active: 'home', what: 'Beranda' },
  { path: '/berita', active: 'berita', what: 'Daftar berita' },
  { path: '/program/elite-1on1', active: 'program', what: 'Detail program' },
  { path: '/workshop/pro', active: 'workshop', what: 'Detail workshop' },
  { path: '/tentang', active: '', what: 'Tentang' },
  { path: '/faq', active: '', what: 'FAQ' },
];

let failures = 0;
const check = (name, ok, info = '') => {
  if (!ok) failures++;
  console.log(`${ok ? 'PASS' : 'GAGAL'}  ${name}${info ? '  — ' + info : ''}`);
};

const probe = () => {
  const nav = document.querySelector('nav[aria-label="Navigasi utama"]');
  if (!nav) return { missing: true };
  const anchors = [...nav.querySelectorAll('a')];
  const items = anchors.map((a) => {
    const spans = [...a.querySelectorAll('span')];
    // label = span TERAKHIR; span pertama selalu petak ikon (tanpa teks)
    const labelEl = spans[spans.length - 1];
    const tile = spans[0];
    const svg = a.querySelector('svg');
    const r = a.getBoundingClientRect();
    const lr = labelEl ? labelEl.getBoundingClientRect() : { width: 0 };
    return {
      id: a.getAttribute('data-dock') || '',
      label: labelEl ? labelEl.textContent.trim() : '',
      labelW: Math.round(lr.width),
      labelOpacity: labelEl ? getComputedStyle(labelEl).opacity : '0',
      labelVisible: labelEl ? getComputedStyle(labelEl).visibility : 'hidden',
      fontSize: labelEl ? getComputedStyle(labelEl).fontSize : '',
      active: a.getAttribute('aria-current') === 'page',
      tileBg: tile ? getComputedStyle(tile).backgroundColor : '',
      // jumlah elemen <path>/<rect> = ikon benar-benar tergambar, bukan text node
      shapes: svg ? svg.querySelectorAll('path,rect,circle').length : 0,
      hasTextSvg: svg ? /M[0-9.]/.test(svg.textContent || '') : false,
      target: a.getAttribute('target') || '',
      w: Math.round(r.width),
      l: Math.round(r.left),
      rt: Math.round(r.right),
      bottom: Math.round(r.bottom),
    };
  });
  const nr = nav.getBoundingClientRect();
  return {
    display: getComputedStyle(nav).display,
    navL: Math.round(nr.left),
    navR: Math.round(nr.right),
    innerW: window.innerWidth,
    scrollW: document.documentElement.scrollWidth,
    innerH: window.innerHeight,
    items,
  };
};

const browser = await chromium.launch({ executablePath: exe, headless: true, args: ['--hide-scrollbars'] });

// ambil slug single post dari daftar berita
const ctx0 = await browser.newContext({ viewport: { width: 390, height: 844 } });
const p0 = await ctx0.newPage();
await p0.goto(`${URL_BASE}/berita`, { waitUntil: 'networkidle', timeout: 60000 });
const slug = await p0.evaluate(() => {
  const a = document.querySelector('a[href*="/berita/"]');
  return a ? a.getAttribute('href') : '';
});
await ctx0.close();
const postPath = slug && !/\/berita\/?$/.test(slug) ? slug.replace(/\/+$/, '') : null;
console.log('single post yang diuji:', postPath || '(TIDAK DITEMUKAN)');

if (postPath) PAGES.push({ path: postPath, active: 'berita', what: 'Single post (Function)' });

for (const vp of [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'desktop', width: 1440, height: 900 },
]) {
  console.log(`\n================ ${vp.name} ${vp.width}x${vp.height} ================`);
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: 2,
    isMobile: vp.name === 'mobile',
    hasTouch: vp.name === 'mobile',
    reducedMotion: 'no-preference',
  });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message));

  for (const pg of PAGES) {
    await page.goto(URL_BASE + pg.path, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(900);
    const r = await page.evaluate(probe);
    const tag = `${pg.what} (${pg.path})`;

    if (r.missing) { check(`${tag}: dock ada`, false, 'nav[aria-label="Navigasi utama"] tidak ditemukan'); continue; }

    if (vp.name === 'desktop') {
      check(`${tag}: dock disembunyikan di desktop`, r.display === 'none', `display=${r.display}`);
      continue;
    }

    console.log(`\n---- ${tag} ----`);
    check(`${tag}: dock tampil`, r.display !== 'none', `display=${r.display}`);
    check(`${tag}: 5 item seragam`, r.items.length === 5, `${r.items.length} item`);

    const labels = r.items.map((i) => i.label).join(',');
    check(`${tag}: urutan label`, labels === LABELS.join(','), labels);

    const tersembunyi = r.items.filter((i) => i.labelOpacity !== '1' || i.labelVisible === 'hidden' || i.labelW < 8);
    check(`${tag}: semua label teks terbaca`, tersembunyi.length === 0, tersembunyi.map((i) => `${i.label} w=${i.labelW} op=${i.labelOpacity}`).join(' | '));

    const akt = r.items.filter((i) => i.active).map((i) => i.id);
    const exp = pg.active || '(tidak ada)';
    check(`${tag}: item aktif`, JSON.stringify(akt) === JSON.stringify(pg.active ? [pg.active] : []), `${akt.join(',') || '(tidak ada)'} — harapan ${exp}`);

    const wa = r.items.find((i) => i.id === 'chat' || i.target === '_blank');
    check(`${tag}: petak Chat hijau WhatsApp`, !!wa && wa.tileBg === WA_GREEN, wa ? wa.tileBg : 'tidak ada');
    check(`${tag}: Chat buka tab baru`, !!wa && wa.target === '_blank', wa ? wa.target : '');

    const rusak = r.items.filter((i) => i.shapes === 0 || i.hasTextSvg);
    check(`${tag}: tiap ikon tergambar sebagai bentuk SVG`, rusak.length === 0, rusak.map((i) => `${i.label} shapes=${i.shapes}`).join(' | '));
    check(`${tag}: glif WhatsApp = 1 path utuh`, !!wa && wa.shapes === 1 && !wa.hasTextSvg, wa ? `shapes=${wa.shapes}` : '');

    check(`${tag}: dock tidak keluar layar`, r.navL >= 0 && r.navR <= r.innerW + 0.5, `${r.navL}..${r.navR} / ${r.innerW}`);
    check(`${tag}: tidak ada overflow horizontal`, r.scrollW <= r.innerW + 1, `scrollW=${r.scrollW} innerW=${r.innerW}`);

    const last = r.items[r.items.length - 1];
    check(`${tag}: label tidak terpotong (lebar item cukup)`, !last || last.rt <= r.innerW, last ? `item terakhir s/d x=${last.rt}` : '');

    const name = pg.path.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'home';
    const shot = await page.screenshot({
      path: `${OUT}/dock-${name}.png`,
      clip: { x: 0, y: Math.max(0, r.innerH - 120), width: vp.width, height: 120 },
    });
    console.log(`      screenshot: ${OUT}/dock-${name}.png (${shot.length} b), ukuran item ${r.items.map((i) => i.w).join('/')}`);
    if (errs.length) { console.log('      ERROR JS:', errs.slice(0, 3).join(' | ')); errs.length = 0; }
  }

  if (vp.name === 'mobile') {
    // cek perilaku scroll-hide pada dock single post (Function tidak punya Svelte)
    if (postPath) {
      await page.goto(URL_BASE + postPath, { waitUntil: 'networkidle', timeout: 60000 });
      await page.waitForTimeout(700);
      const awal = await page.evaluate(() => document.querySelector('nav[aria-label="Navigasi utama"]')?.className || '');
      await page.evaluate(() => window.scrollTo(0, 900));
      await page.waitForTimeout(600);
      const atas = await page.evaluate(() => {
        const n = document.querySelector('nav[aria-label="Navigasi utama"]');
        return { cls: n?.className || '', t: n ? getComputedStyle(n).transform : '' };
      });
      await page.evaluate(() => window.scrollTo(0, 300));
      await page.waitForTimeout(600);
      const bawah = await page.evaluate(() => {
        const n = document.querySelector('nav[aria-label="Navigasi utama"]');
        return { cls: n?.className || '', t: n ? getComputedStyle(n).transform : '' };
      });
      check('single post: dock ikut scroll-hide saat turun', /is-hidden|translate|matrix/.test(atas.t + atas.cls), `t=${atas.t} cls=${atas.cls}`);
      check('single post: dock muncul lagi saat naik', !/is-hidden/.test(bawah.cls), `cls=${bawah.cls}`);
      console.log(`      awal="${awal}" → turun="${atas.cls}" → naik="${bawah.cls}"`);
    }
  }

  await ctx.close();
}

await browser.close();
console.log(`\n${failures === 0 ? 'SEMUA PASS' : failures + ' MASALAH TERDETEKSI'}`);
process.exit(failures === 0 ? 0 : 1);
