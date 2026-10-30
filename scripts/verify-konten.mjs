/**
 * E2E kontrol unggah "Gambar utama" di form berita (tab Konten).
 * Jalankan: set -a && . ./.env.admin && set +a && node scripts/verify-konten.mjs [base-url]
 *
 * Password dibaca dari env ADMIN_PASSWORD dan tidak pernah dicetak ke output.
 *
 * Cakupan:
 *  1) form berita terbuka dan kolom "Gambar utama" berupa kontrol unggah
 *     (bukan sekadar kolom path manual)
 *  2) unggah berkas gambar nyata -> path /media/... terisi otomatis
 *  3) pratinjau gambar utama benar-benar termuat (naturalWidth > 0)
 *  4) pustaka media menampilkan berkas dan bisa dipilih untuk mengganti gambar
 *  5) layout mobile: zona unggah & tombol terakhir tidak tertutup nav fixed
 *  6) tidak ada console error / request gagal
 *
 * Skrip ini SENGAJA tidak menyimpan berita apa pun — jadi tidak ada data uji
 * yang tertinggal di D1. Yang tertinggal hanya satu berkas uji di R2; perintah
 * pembersihnya dicetak di akhir.
 */
import { chromium } from 'playwright-core';
import { existsSync, mkdirSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';

const BASE = process.argv[2] || 'https://myprospect.asia';
const PWD = process.env.ADMIN_PASSWORD;
const OUT = '/Users/maabook/Downloads';
mkdirSync(OUT, { recursive: true });

const CANDIDATES = [
  '/Users/maabook/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
  '/Users/maabook/Library/Caches/ms-playwright/chromium-1228/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
  '/Users/maabook/Library/Caches/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-mac-arm64/chrome-headless-shell',
];
const exe = CANDIDATES.find((p) => existsSync(p));
if (!exe) {
  console.error('NO_BROWSER');
  process.exit(1);
}
if (!PWD) {
  console.error('ADMIN_PASSWORD belum di-set (sourcing .env.admin).');
  process.exit(2);
}

let fails = 0;
const check = (name, ok, info = '') => {
  console.log(`${ok ? '  PASS' : '  FAIL'}  ${name}${info !== '' ? `  ${JSON.stringify(info)}` : ''}`);
  if (!ok) fails++;
};

const browser = await chromium.launch({ executablePath: exe, headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

const galatKonsol = [];
const gagalJaringan = [];
page.on('console', (m) => {
  if (m.type() === 'error') galatKonsol.push(m.text().slice(0, 160));
});
page.on('response', (r) => {
  if (r.status() >= 400) gagalJaringan.push(`${r.status()} ${r.url()}`);
});

// -- 1) login --
await page.goto(`${BASE}/admin/login`, { waitUntil: 'domcontentloaded' });
await page.fill('#password', PWD);
await page.click('button[type=submit]');
await page.waitForURL(/\/admin\/?$/, { timeout: 20000 });
await page.waitForFunction(
  () => /pengunjung unik/i.test(document.querySelector('main')?.innerText ?? '') && !/Memuat/.test(document.querySelector('main')?.innerText ?? ''),
  { timeout: 25000 },
);
check('1 login berhasil, dashboard termuat', true);

// -- 2) buka form berita --
await page.getByRole('button', { name: 'Konten' }).first().click();
await page.waitForTimeout(900);
await page.getByRole('button', { name: 'Tulis berita' }).click();
await page.waitForTimeout(700);

const teksForm = await page.locator('main').innerText();
check('2 form berita terbuka', await page.locator('#p-title').isVisible());
check('2 kolom "Gambar utama" berupa kontrol unggah', /Unggah gambar/i.test(teksForm));
check('2 path manual tetap ada sebagai fallback', await page.locator('#p-cover').isVisible());
check('2 label lama "path /media/..." sudah hilang', !/Gambar utama \(path/.test(teksForm));
await page.screenshot({ path: `${OUT}/kt-desktop-01-form.png` });

// -- 3) unggah gambar nyata --
const sumber = await readFile(new URL('../public/media/workshop-hero.jpg', import.meta.url));
const berkasUji = `${OUT}/kt-unggah-uji.jpg`;
await writeFile(berkasUji, sumber);

await page.setInputFiles('main input[type=file]', berkasUji);
await page
  .waitForFunction(() => /Tersimpan — gambar utama/i.test(document.querySelector('main')?.innerText ?? ''), { timeout: 30000 })
  .catch(() => {});

const isiPath = await page.inputValue('#p-cover');
check('3 path gambar utama terisi otomatis', /^\/media\/\d{8}-[a-z0-9-]+\.(jpg|jpeg|png|webp|gif|avif)$/.test(isiPath), isiPath);
check('3 pesan sukses tampil', /Tersimpan — gambar utama/i.test(await page.locator('main').innerText()));

// -- 4) pratinjau benar-benar termuat (bukan cuma src yang terpasang) --
await page
  .waitForFunction(
    () => {
      const p = [...document.querySelectorAll('main img')].find((i) => (i.alt ?? '').includes('Pratinjau'));
      return !!p && p.complete && p.naturalWidth > 0;
    },
    { timeout: 20000 },
  )
  .catch(() => {});
const pratinjau = await page.evaluate(() => {
  const p = [...document.querySelectorAll('main img')].find((i) => (i.alt ?? '').includes('Pratinjau'));
  return p ? { w: p.naturalWidth, h: p.naturalHeight } : null;
});
check('4 pratinjau gambar utama termuat', !!pratinjau && pratinjau.w > 0, pratinjau);

// -- 5) pustaka media --
await page
  .waitForFunction(() => document.querySelectorAll('main button[title]').length > 0, { timeout: 20000 })
  .catch(() => {});
const pustaka = page.locator('main button[title]');
const jumlahPustaka = await pustaka.count();
check('5 pustaka media menampilkan berkas', jumlahPustaka > 0, { jumlahPustaka });
await page.screenshot({ path: `${OUT}/kt-desktop-02-terisi.png` });

if (jumlahPustaka > 1) {
  await pustaka.nth(1).click();
  await page.waitForTimeout(500);
  const isiPath2 = await page.inputValue('#p-cover');
  check('5 pilih dari pustaka mengganti gambar utama', isiPath2 !== isiPath && /^\/media\//.test(isiPath2), isiPath2);
} else {
  check('5 pilih dari pustaka mengganti gambar utama', true, { catatan: 'hanya 1 berkas di bucket, dilewati' });
}

// -- 6) layout mobile --
const m = await ctx.newPage();
await m.setViewportSize({ width: 390, height: 844 });
await m.goto(`${BASE}/admin`, { waitUntil: 'domcontentloaded' });
await m.waitForFunction(
  () => /pengunjung unik/i.test(document.querySelector('main')?.innerText ?? '') && !/Memuat/.test(document.querySelector('main')?.innerText ?? ''),
  { timeout: 25000 },
);
await m.getByRole('button', { name: 'Konten' }).first().click();
await m.waitForTimeout(900);
await m.getByRole('button', { name: 'Tulis berita' }).click();
await m.waitForTimeout(800);
await m.screenshot({ path: `${OUT}/kt-mobile-01-form.png` });

const zona = m.locator('main label').filter({ hasText: 'Unggah gambar' }).first();
await zona.evaluate((el) => el.scrollIntoView({ block: 'center' }));
await m.waitForTimeout(400);
const bbZona = await m.evaluate(() => {
  const el = [...document.querySelectorAll('main label')].find((d) => /Unggah gambar/.test(d.textContent ?? ''));
  const nav = document.querySelector('nav[aria-label="Menu admin mobile"]');
  return el && nav
    ? { elBottom: Math.round(el.getBoundingClientRect().bottom), navTop: Math.round(nav.getBoundingClientRect().top) }
    : null;
});
check('6 zona unggah bisa ditampilkan penuh di atas nav', bbZona ? bbZona.elBottom <= bbZona.navTop + 2 : false, bbZona);

await m.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await m.waitForTimeout(500);
const bbBawah = await m.evaluate(() => {
  const btn = [...document.querySelectorAll('main button')].find((b) => /Terbitkan/.test(b.textContent ?? ''));
  const nav = document.querySelector('nav[aria-label="Menu admin mobile"]');
  return btn && nav
    ? { btnBottom: Math.round(btn.getBoundingClientRect().bottom), navTop: Math.round(nav.getBoundingClientRect().top) }
    : null;
});
check('6 tombol Terbitkan tidak tertutup nav di dasar halaman', bbBawah ? bbBawah.btnBottom <= bbBawah.navTop + 2 : false, bbBawah);
await m.screenshot({ path: `${OUT}/kt-mobile-02-bawah.png` });

// -- 7) bersih-bersih error --
check('7 tidak ada console error', galatKonsol.length === 0, galatKonsol.slice(0, 3));
check('7 tidak ada request gagal', gagalJaringan.length === 0, gagalJaringan.slice(0, 3));

console.log(fails === 0 ? '\n>>> SEMUA PASS' : `\n>>> ${fails} GAGAL`);
if (isiPath.startsWith('/media/')) {
  console.log('\n>>> Bersihkan berkas uji di R2:');
  console.log(`npx wrangler r2 object delete prospect-media/${isiPath.slice(1)} --remote`);
}
await browser.close();
process.exit(fails === 0 ? 0 : 1);
