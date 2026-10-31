// Foto khusus permukaan WhatsApp (header, popup, bubble, footer) di desktop + mobile.
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

const browser = await chromium.launch({ executablePath: exe, headless: true, args: ['--hide-scrollbars'] });
let gagal = 0;

for (const vp of [{ n: 'desktop', w: 1440, h: 900 }, { n: 'mobile', w: 390, h: 844 }]) {
  const ctx = await browser.newContext({
    viewport: { width: vp.w, height: vp.h },
    deviceScaleFactor: 2,
    isMobile: vp.n === 'mobile',
    hasTouch: vp.n === 'mobile',
  });
  const page = await ctx.newPage();
  await page.goto(URL_BASE, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(1200);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(400);

  // tombol header (hanya tampil >= sm)
  const hdr = page.locator('a[data-wa-cta="header"]');
  if (await hdr.count()) {
    const vis = await hdr.first().isVisible();
    if (vp.n === 'desktop' || vp.w >= 640) {
      if (!vis) { console.log(`GAGAL  ${vp.n}: tombol header tidak tampil`); gagal++; }
      else {
        await hdr.first().screenshot({ path: `${OUT}/wa-${vp.n}-header.png` });
        const bg = await hdr.first().evaluate((e) => getComputedStyle(e).backgroundColor);
        const hasPath = await hdr.first().evaluate((e) => e.querySelectorAll('svg path').length);
        console.log(`PASS  ${vp.n}: header bg=${bg} path=${hasPath} -> wa-${vp.n}-header.png`);
        if (bg !== 'rgb(37, 211, 102)' || hasPath !== 1) { console.log(`GAGAL  ${vp.n}: header tidak hijau/glif salah`); gagal++; }
      }
    } else {
      console.log(`info ${vp.n}: tombol header memang disembunyikan (<640px), count=${await hdr.count()} vis=${vis}`);
    }
  }

  // bubble WhatsApp desktop: tampil sejak load sampai popup auto-buka (~8s)
  if (vp.n === 'desktop') {
    await page.waitForTimeout(3000);
    const bub = page.locator('button[aria-label="Buka chat WhatsApp admin"]');
    if (await bub.count()) {
      await bub.first().screenshot({ path: `${OUT}/wa-desktop-bubble.png` });
      const bg = await bub.first().evaluate((e) => getComputedStyle(e).backgroundColor);
      const p1 = await bub.first().evaluate((e) => e.querySelectorAll('svg path').length);
      console.log(`PASS  desktop: bubble bg=${bg} path=${p1} -> wa-desktop-bubble.png`);
      if (bg !== 'rgb(37, 211, 102)' || p1 !== 1) { console.log('GAGAL  desktop: bubble tidak hijau/glif salah'); gagal++; }
    } else { console.log('GAGAL  desktop: bubble WhatsApp tidak muncul'); gagal++; }

    // kartu popup butuh sesi baru (sessionStorage membuat popup hanya sekali per sesi)
    const ctx2 = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: 2 });
    const p2page = await ctx2.newPage();
    await p2page.goto(URL_BASE, { waitUntil: 'networkidle', timeout: 60000 });
    await p2page.waitForTimeout(10000);
    const cta = p2page.locator('a[data-wa-cta="popup"]');
    if (await cta.count()) {
      await cta.first().evaluate((e) => e.closest('div').scrollIntoView());
      await p2page.waitForTimeout(400);
      await cta.first().locator('xpath=..').screenshot({ path: `${OUT}/wa-desktop-popup.png` });
      const bg2 = await cta.first().evaluate((e) => getComputedStyle(e).backgroundColor);
      const p2 = await cta.first().evaluate((e) => e.querySelectorAll('svg path').length);
      console.log(`PASS  desktop: tombol popup bg=${bg2} path=${p2} -> wa-desktop-popup.png`);
      if (bg2 !== 'rgb(37, 211, 102)' || p2 !== 1) { console.log('GAGAL  desktop: tombol popup tidak hijau'); gagal++; }
    } else { console.log('GAGAL  desktop: kartu popup tidak muncul'); gagal++; }
    await ctx2.close();
  }

  // footer — reload dengan popup dianggap sudah pernah muncul supaya kartunya tidak menutupi
  await page.evaluate(() => { try { sessionStorage.setItem('pa_popup_seen', '1'); } catch {} });
  await page.reload({ waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(900);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(700);
  const ft = page.locator('a[data-wa-cta="footer"]');
  if (await ft.count()) {
    await ft.first().screenshot({ path: `${OUT}/wa-${vp.n}-footer.png` });
    const info = await ft.first().evaluate((e) => ({
      bg: getComputedStyle(e.querySelector('span')).backgroundColor,
      path: e.querySelectorAll('svg path').length,
      teks: e.textContent.trim(),
    }));
    console.log(`PASS  ${vp.n}: footer "${info.teks}" pil bg=${info.bg} path=${info.path} -> wa-${vp.n}-footer.png`);
    if (info.bg !== 'rgb(37, 211, 102)' || info.path !== 1) { console.log(`GAGAL  ${vp.n}: footer pil/glif salah`); gagal++; }
  } else { console.log(`GAGAL  ${vp.n}: link footer tidak ada`); gagal++; }

  await ctx.close();
}

// single post: tombol header hijau dari Pages Function
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.goto(URL_BASE + '/berita', { waitUntil: 'networkidle', timeout: 60000 });
const href = await page.evaluate(() => {
  const a = document.querySelector('a[href*="/berita/"]');
  return a && !/\/berita\/?$/.test(a.getAttribute('href')) ? a.getAttribute('href') : null;
});
if (href) {
  await page.goto(URL_BASE + href, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(800);
  const hw = page.locator('a.hdr-wa');
  await hw.first().screenshot({ path: `${OUT}/wa-post-header.png` });
  const info = await hw.first().evaluate((e) => ({
    bg: getComputedStyle(e).backgroundColor,
    path: e.querySelectorAll('svg path').length,
    teks: e.textContent.trim(),
  }));
  console.log(`PASS  post: hdr-wa "${info.teks}" bg=${info.bg} path=${info.path} -> wa-post-header.png`);
  if (info.bg !== 'rgb(37, 211, 102)' || info.path !== 1) { console.log('GAGAL  post: hdr-wa tidak hijau/glif salah'); gagal++; }
} else { console.log('GAGAL  slug single post tidak ditemukan'); gagal++; }
await ctx.close();

await browser.close();
console.log(gagal === 0 ? 'SEMUA PASS' : gagal + ' MASALAH');
process.exit(gagal === 0 ? 0 : 1);
