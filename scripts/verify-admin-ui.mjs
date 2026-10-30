/**
 * E2E UI panel admin di browser sungguhan (bukan cuma cek API).
 * Jalankan: set -a && . ./.env.admin && set +a && node scripts/verify-admin-ui.mjs [base-url]
 *
 * Password dibaca dari env ADMIN_PASSWORD dan tidak pernah dicetak ke output.
 *
 * Mencakup tiap viewport (desktop 1440x900 + mobile 390x844):
 *  1) /admin/ tanpa login  -> terlempar ke halaman login
 *  2) password salah       -> pesan error muncul, tidak masuk
 *  3) password benar       -> dashboard tampil, statistik terisi
 *  4) tiap tab (Leads/Konten/Media/Pengaturan) -> kontennya benar-benar dirender
 *  5) tulis beneran: klik "Simpan pengaturan" dengan nilai yang sudah ada
 *     (PUT settings bersifat per-key upsert, jadi round-trip ini tidak mengubah data)
 *  6) Keluar -> kembali ke login
 *  7) console error + request gagal
 *
 * Screenshot ditulis ke OUT, WAJIB dibaca via vision — angka saja tidak menangkap
 * "tab kosong", "form tidak terisi", atau layout yang kepotong.
 */
import { chromium } from 'playwright-core';
import { existsSync, mkdirSync } from 'node:fs';

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

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
];

const TABS = ['Leads', 'Konten', 'Media', 'Pengaturan'];

let fails = 0;
const shots = [];
const check = (name, ok, extra = '') => {
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? '  ' + extra : ''}`);
  if (!ok) fails++;
};

const browser = await chromium.launch({ executablePath: exe });

for (const vp of VIEWPORTS) {
  console.log(`\n########## ${vp.name} ${vp.width}x${vp.height} ##########`);
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
  const page = await ctx.newPage();

  const consoleErrors = [];
  const failedReq = [];
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(m.text());
  });
  page.on('requestfailed', (r) => failedReq.push(`${r.method()} ${r.url()}`));
  page.on('response', (r) => {
    if (r.status() >= 400) failedReq.push(`${r.status()} ${r.url()}`);
  });

  const shot = async (label) => {
    const file = `${OUT}/ad-${vp.name}-${label}.png`;
    await page.screenshot({ path: file, fullPage: true });
    shots.push(file);
  };

  const navSel =
    vp.name === 'desktop'
      ? 'nav[aria-label="Menu admin"]'
      : 'nav[aria-label="Menu admin mobile"]';

  // 1) gerbang: belum login harus dilempar ke login
  await page.goto(`${BASE}/admin/`, { waitUntil: 'networkidle' });
  check('1 /admin/ tanpa login -> ke halaman login', /\/admin\/login/.test(page.url()), page.url());
  await shot('01-login');

  // 2) password salah
  await page.fill('#password', 'password-salah-coba');
  await page.click('button[type="submit"]');
  await page.waitForSelector('#error:not(.hidden)', { timeout: 8000 }).catch(() => {});
  const errText = (await page.locator('#error').textContent().catch(() => '')) || '';
  check('2 password salah -> pesan error muncul', errText.trim().length > 0, JSON.stringify(errText.trim()));
  check('2 password salah -> tetap di halaman login', /\/admin\/login/.test(page.url()), page.url());
  // 401 di atas disengaja dan sudah di-assert -> jangan ikut dihitung di langkah 7
  consoleErrors.length = 0;
  failedReq.length = 0;

  // 3) password benar
  await page.fill('#password', PWD);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/admin\/?$/, { timeout: 15000 }).catch(() => {});
  await page.waitForLoadState('networkidle');
  check('3 password benar -> masuk /admin', /\/admin\/?$/.test(page.url()), page.url());
  const keluar = await page.locator(`button:has-text("Keluar")`).count();
  check('3 header admin tampil (tombol Keluar)', keluar > 0);
  const statsTxt = (await page.locator('main').first().innerText().catch(() => '')) || '';
  check('3 dashboard merender statistik', /Lead hari ini|Total lead/i.test(statsTxt));
  check('3 tidak ada "Memuat…" yang nyangkut', !/^\s*Memuat…?\s*$/.test(statsTxt));
  await shot('02-dashboard');

  // 4) tiap tab: nav harus menyorot tab yang benar DAN kontennya benar-benar selesai dimuat.
  // (cek "panjang teks > 10" saja pernah lolos padahal tab masih "Memuat…" — jangan ulang kesalahan itu)
  const EXPECT = {
    Leads: /Belum ada lead|Nama|WhatsApp|filter/i,
    Konten: /Tulis berita|BERITA|PUBLISHED|Testimoni/i,
    Media: /prospect-media|R2/i,
    Pengaturan: /Nomor WhatsApp|Simpan pengaturan/i,
  };
  for (const t of TABS) {
    const btn = page.locator(`${navSel} button:has-text("${t}")`).first();
    if ((await btn.count()) === 0) {
      check(`4 tab ${t} -> tombolnya ada`, false, 'tombol tidak ditemukan di nav yang terlihat');
      continue;
    }
    await btn.click();
    const settled = await page
      .waitForFunction(
        ({ sel, name }) => {
          const nav = document.querySelector(sel);
          if (!nav) return false;
          const aktif = [...nav.querySelectorAll('button')]
            .filter((b) => /bg-brand|text-gold/.test(b.className))
            .map((b) => b.innerText.trim());
          const m = document.querySelector('main');
          if (aktif.length !== 1 || aktif[0].toLowerCase() !== name.toLowerCase()) return false;
          // tab-panel memakai "Memuat…" dan "Memuat leads…" -> cukup cari kata "Memuat"
          return !!m && !/Memuat/.test(m.innerText);
        },
        { sel: navSel, name: t },
        { timeout: 12000 },
      )
      .then(() => true)
      .catch(() => false);
    const aktif = await page.$$eval(
      `${navSel} button`,
      (b) => b.filter((x) => /bg-brand|text-gold/.test(x.className)).map((x) => x.innerText.trim()),
    );
    check(`4 tab ${t} -> nav menyorot tab yang benar`, settled && aktif.join('|') === t, `aktif="${aktif.join('|')}"`);
    const txt = (await page.locator('main').first().innerText().catch(() => '')) || '';
    check(`4 tab ${t} -> kontennya termuat`, EXPECT[t].test(txt), `${txt.trim().length} char`);
    await shot(`tab-${t.toLowerCase()}`);
  }

  // 5) tulis beneran: simpan pengaturan dengan nilai yang sudah ada
  await page.locator(`${navSel} button:has-text("Pengaturan")`).first().click();
  await page.waitForSelector('#set-wa', { timeout: 12000 }).catch(() => {});
  const before = await page.evaluate(async () => {
    const r = await fetch('/api/admin/settings');
    return r.ok ? await r.json() : null;
  });
  const waVal = await page.locator('#set-wa').inputValue().catch(() => '');
  check('5 form pengaturan terisi dari API', waVal.trim().length > 0, `set-wa="${waVal}"`);
  check(
    '5 nilai form = nilai API (tidak kedaluwarsa)',
    !!before && waVal === (before.wa_number ?? ''),
    `API="${before?.wa_number ?? '?'}"`,
  );

  await page.click('button:has-text("Simpan pengaturan")');
  await page
    .waitForFunction(
      () => {
        const m = document.querySelector('main');
        return !!m && /Tersimpan|tidak valid|gagal|error/i.test(m.innerText);
      },
      { timeout: 12000 },
    )
    .catch(() => {});
  const after1 = (await page.locator('main').first().innerText().catch(() => '')) || '';
  const saved = /Tersimpan/i.test(after1);
  check('5 klik Simpan -> sukses tersimpan', saved, saved ? '' : JSON.stringify(after1.match(/[^\n]*(tidak valid|gagal|error)[^\n]*/i)?.[0] ?? 'tidak ada pesan'));

  const after = await page.evaluate(async () => {
    const r = await fetch('/api/admin/settings');
    return r.ok ? await r.json() : null;
  });
  check('5 data tidak berubah setelah round-trip', JSON.stringify(before) === JSON.stringify(after));
  await shot('03-pengaturan');

  // 6) keluar
  await page.click('button:has-text("Keluar")');
  await page.waitForURL(/\/admin\/login/, { timeout: 12000 }).catch(() => {});
  check('6 Keluar -> balik ke login', /\/admin\/login/.test(page.url()), page.url());

  // 7) kebersihan runtime
  // /cdn-cgi/rum = beacon Real User Monitoring yang disuntik Cloudflare sendiri, bukan kode aplikasi
  const isNoise = (t) => /favicon|robots\.txt|cdn-cgi\/rum/i.test(t);
  const noisyConsole = consoleErrors.filter((t) => !isNoise(t));
  const noisyReq = failedReq.filter((t) => !isNoise(t));
  check('7 tidak ada console error', noisyConsole.length === 0, noisyConsole.slice(0, 3).join(' | '));
  check('7 tidak ada request gagal', noisyReq.length === 0, noisyReq.slice(0, 3).join(' | '));

  await ctx.close();
}

await browser.close();
console.log(`\nScreenshot: ${shots.join('\n            ')}`);
console.log(`\n>>> ${fails === 0 ? 'SEMUA PASS' : fails + ' GAGAL'}\n`);
process.exit(fails === 0 ? 0 : 1);
