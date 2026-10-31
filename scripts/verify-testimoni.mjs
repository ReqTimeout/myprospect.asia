// Verifikasi carousel Testimonials: swipe jari benar-benar menggeser track di mobile,
// Embla mengenali 3 slide (bukan 1), dan scroll vertikal halaman tidak dirampas.
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

let gagal = 0;
const check = (name, ok, info = '') => {
  if (!ok) gagal++;
  console.log(`${ok ? 'PASS' : 'GAGAL'}  ${name}${info ? '  — ' + info : ''}`);
};

// ambil offset-X transform. Embla memakai translate3d tapi Chrome bisa melaporkannya
// sebagai matrix() 2D maupun matrix3d(); tx ada di indeks 4 masing-masing.
// PENTING: harus fungsi sungguhan — string fungsi dievaluasi Playwright sebagai
// ekspresi dan tidak bisa diserialisasi, hasilnya undefined (bukan error).
const tx = (sel = '.embla__container') =>
  page.evaluate((s) => {
    const e = document.querySelector(s);
    if (!e) return null;
    const t = getComputedStyle(e).transform;
    if (!t || t === 'none') return 0;
    const m3 = t.match(/matrix3d\(([^)]+)\)/);
    if (m3) return parseFloat(m3[1].split(',')[12]);
    const m = t.match(/matrix\(([^)]+)\)/);
    return m ? parseFloat(m[1].split(',')[4]) : NaN;
  }, sel);

const browser = await chromium.launch({ executablePath: exe, headless: true, args: ['--hide-scrollbars'] });
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
});
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });

await page.goto(URL_BASE, { waitUntil: 'networkidle', timeout: 60000 });
// carousel memakai client:visible — harus dimasuki viewport dulu sebelum island jalan
await page.evaluate(() => document.querySelector('.embla__viewport')?.scrollIntoView({ block: 'center' }));
await page.waitForTimeout(2500);

// ---- 1. struktur yang dikenali Embla ----
const struktur = await page.evaluate(() => {
  const c = document.querySelector('.embla__container');
  const v = document.querySelector('.embla__viewport');
  return {
    containerPunyaInlineTransform: !!c?.style.transform,
    viewportPunyaInlineTransform: !!v?.style.transform,
    slideDalamContainer: c ? c.querySelectorAll(':scope > .embla__slide').length : 0,
    touchActionViewport: v ? getComputedStyle(v).touchAction : '',
    overflowViewport: v ? getComputedStyle(v).overflowX : '',
    lebarContainer: c ? Math.round(c.getBoundingClientRect().width) : 0,
    scrollWidthContainer: c ? c.scrollWidth : 0,
  };
});
check('Embla menggerakkan .embla__container (bukan .embla__viewport)', struktur.containerPunyaInlineTransform && !struktur.viewportPunyaInlineTransform, JSON.stringify({ c: struktur.containerPunyaInlineTransform, v: struktur.viewportPunyaInlineTransform }));
check('container = 3 slide anak langsung', struktur.slideDalamContainer === 3, `${struktur.slideDalamContainer} slide`);
check('viewport punya touch-action pan-y', /pan-y/.test(struktur.touchActionViewport), struktur.touchActionViewport);
check('viewport memotong overflow', struktur.overflowViewport === 'hidden', struktur.overflowViewport);
check('track lebih lebar dari viewport (bisa digeser)', struktur.scrollWidthContainer > struktur.lebarContainer, `${struktur.scrollWidthContainer} > ${struktur.lebarContainer}`);

// elemen dekoratif tidak boleh menelan sentuhan di atas carousel
const halangan = await page.evaluate(() => {
  const v = document.querySelector('.embla__viewport');
  if (!v) return ['viewport tidak ada'];
  const r = v.getBoundingClientRect();
  const kena = [];
  for (const fx of [0.15, 0.4, 0.65, 0.9]) {
    for (const fy of [0.25, 0.5, 0.75]) {
      const el = document.elementFromPoint(r.left + r.width * fx, r.top + r.height * fy);
      if (!el) continue;
      if (!v.contains(el) && !el.closest('.embla')) {
        kena.push(`${Math.round(r.left + r.width * fx)},${Math.round(r.top + r.height * fy)}=${el.tagName.toLowerCase()}.${(el.className || '').toString().split(' ').slice(0, 2).join('.')}`);
      }
    }
  }
  return [...new Set(kena)];
});
check('tidak ada elemen dekoratif yang menutupi carousel', halangan.length === 0, halangan.slice(0, 4).join(' | '));

// bukti visual: carousel + titik dalam kondisi awal sebelum gestur apa pun
await page.locator('.embla').screenshot({ path: `${OUT}/testi-00-mobile-awal.png` });

const cdp = await ctx.newCDPSession(page);
const swipe = async (dariX, y, dx, langkah = 12) => {
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: dariX, y, id: 1 }] });
  for (let i = 1; i <= langkah; i++) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: dariX + (dx * i) / langkah, y, id: 1 }] });
    await page.waitForTimeout(16);
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
};

const box = await page.locator('.embla__container .embla__slide').first().boundingBox();
const yTengah = box.y + box.height / 2;

// ---- 2. swipe kiri (maju) ----
const awal = await tx();
await swipe(box.x + box.width - 25, yTengah, -190);
await page.waitForTimeout(1200);
const maju = await tx();
check('swipe jari ke kiri menggeser track', Math.abs(maju - awal) > 150, `Δ=${(maju - awal).toFixed(1)}px`);

const dots = page.locator('button[aria-label^="Slide"]');
const jmlDot = await dots.count();
const aktifDot = async () =>
  page.evaluate(() =>
    [...document.querySelectorAll('button[aria-label^="Slide"] span')].findIndex((s) => s.className.includes('bg-brand')),
  );
const dotSetelahMaju = await aktifDot();
check('titik indikator ikut berpindah', jmlDot === 3 && dotSetelahMaju > 0, `${jmlDot} dots, aktif=${dotSetelahMaju}`);

await page.screenshot({ path: `${OUT}/testi-01-setelah-swipe-kiri.png` });

// ---- 3. swipe kanan (mundur) ----
const sebelumMundur = await tx();
const box2 = await page.locator('.embla__container .embla__slide').nth(1).boundingBox();
await swipe(box2.x + 25, box2.y + box2.height / 2, 190);
await page.waitForTimeout(1200);
const mundur = await tx();
check('swipe jari ke kanan menggeser balik', Math.abs(mundur - sebelumMundur) > 150, `Δ=${(mundur - sebelumMundur).toFixed(1)}px`);

// ---- 4. scroll vertikal halaman tidak dirampas carousel ----
await page.evaluate(() => document.querySelector('.embla__viewport')?.scrollIntoView({ block: 'center' }));
await page.waitForTimeout(400);
const scrollAwal = await page.evaluate(() => window.scrollY);
const b3 = await page.locator('.embla__container .embla__slide').first().boundingBox();
{
  const y0 = b3.y + b3.height / 2;
  const x0 = b3.x + b3.width / 2;
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x0, y: y0, id: 1 }] });
  for (let i = 1; i <= 10; i++) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x0, y: y0 - i * 18, id: 1 }] });
    await page.waitForTimeout(16);
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}
await page.waitForTimeout(900);
const scrollAkhir = await page.evaluate(() => window.scrollY);
check('gestur vertikal tetap menggulir halaman', scrollAkhir !== scrollAwal, `${Math.round(scrollAwal)} → ${Math.round(scrollAkhir)}`);

// ---- 5. auto-play jalan ----
// Jari terakhir melepas slide -> holdAuto/resumeAuto menjadwalkan ulang 4 detik,
// lalu interval 5 detik. Jadi butuh >9 detik setelah gestur terakhir sebelum
// slide benar-benar bergerak; 6,5 detik akan terbaca sebagai kegagalan palsu.
await page.evaluate(() => document.querySelector('.embla__viewport')?.scrollIntoView({ block: 'center' }));
await page.waitForTimeout(500);
const autoAwal = await tx();
await page.waitForTimeout(11000);
const autoAkhir = await tx();
check('auto-play memajukan slide sendiri', Math.abs(autoAkhir - autoAwal) > 50, `Δ=${(autoAkhir - autoAwal).toFixed(1)}px`);

// ---- 6. tombol titik memindahkan slide ----
// Harus klik titik yang BUKAN sedang aktif, karena kalau titik yang sudah
// aktif yang diklik Embla tidak punya alasan bergerak dan Δ=0 walau sehat.
const dotAktif = await aktifDot();
const target = dotAktif === 0 ? 2 : 0;
const dotAwal = await tx();
await page.locator(`button[aria-label="Slide ${target + 1}"]`).click();
await page.waitForTimeout(1500);
const dotAkhir = await tx();
const dotJadi = await aktifDot();
check(
  'klik titik memindahkan slide',
  Math.abs(dotAkhir - dotAwal) > 50 || dotJadi === target,
  `Δ=${(dotAkhir - dotAwal).toFixed(1)}px, aktif=${dotAktif} → ${dotJadi} (target ${target})`,
);

// ---- 7. tidak ada overflow horizontal & tidak ada error JS ----
const overflow = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth }));
check('tidak ada overflow horizontal', overflow.sw <= overflow.iw + 1, `scrollW=${overflow.sw} innerW=${overflow.iw}`);
check('tidak ada error JS', errs.length === 0, errs.slice(0, 3).join(' | '));

await page.screenshot({ path: `${OUT}/testi-03-akhir.png` });

// ---- 8. desktop: drag mouse dan layout dua kolom tidak boleh rusak ----
// Perbaikan touch-action/Embla node hanya menyentuh jalur sentuhan, jadi desktop
// dipakai sebagai kontrol bahwa bug ini spesifik mobile seperti laporan awal.
const desk = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errsDesk = [];
desk.on('pageerror', (e) => errsDesk.push('PAGEERROR ' + e.message));
await desk.goto(URL_BASE, { waitUntil: 'networkidle', timeout: 60000 });
await desk.evaluate(() => document.querySelector('.embla__viewport')?.scrollIntoView({ block: 'center' }));
await desk.waitForTimeout(2000);
const txDesk = () =>
  desk.evaluate(() => {
    const t = getComputedStyle(document.querySelector('.embla__container')).transform;
    const m = t && t.match(/matrix(?:3d)?\(([^)]+)\)/);
    if (!m) return t === 'none' ? 0 : NaN;
    const p = m[1].split(',');
    return parseFloat(p.length > 6 ? p[12] : p[4]);
  });
const deskAwal = await txDesk();
const slideDesk = await desk.locator('.embla__container .embla__slide').first().boundingBox();
await desk.mouse.move(slideDesk.x + slideDesk.width - 40, slideDesk.y + slideDesk.height / 2);
await desk.mouse.down();
for (let i = 1; i <= 10; i++) {
  await desk.mouse.move(slideDesk.x + slideDesk.width - 40 - i * 24, slideDesk.y + slideDesk.height / 2);
  await desk.waitForTimeout(16);
}
await desk.mouse.up();
await desk.waitForTimeout(1200);
const deskAkhir = await txDesk();
check('desktop: drag mouse menggeser track', Math.abs(deskAkhir - deskAwal) > 150, `Δ=${(deskAkhir - deskAwal).toFixed(1)}px`);
const deskLayout = await desk.evaluate(() => {
  const s = document.querySelector('.embla__slide');
  const v = document.querySelector('.embla__viewport');
  return { slide: Math.round(s.getBoundingClientRect().width), viewport: Math.round(v.getBoundingClientRect().width) };
});
check('desktop: slide melebar mengikuti viewport', deskLayout.slide > 500, `${deskLayout.slide}px dari viewport ${deskLayout.viewport}px`);
check('desktop: tidak ada error JS', errsDesk.length === 0, errsDesk.slice(0, 3).join(' | '));
await desk.screenshot({ path: `${OUT}/testi-04-desktop.png` });

await browser.close();
console.log(`\n${gagal === 0 ? 'SEMUA PASS' : gagal + ' MASALAH TERDETEKSI'}`);
process.exit(gagal === 0 ? 0 : 1);
