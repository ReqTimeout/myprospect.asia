/**
 * E2E domain + admin guard.
 * Jalankan: node scripts/verify-domain.mjs [base-url]   (default https://myprospect.asia)
 *
 * Butuh ADMIN_PASSWORD di environment (dari .env.admin):
 *   set -a && . ./.env.admin && set +a && node scripts/verify-domain.mjs
 *
 * Memeriksa:
 *  1) guard admin tertutup (401 + redirect /admin/ -> login)
 *  2) login benar/salah + atribut cookie (HttpOnly/Secure/SameSite)
 *  3) semua endpoint admin terproteksi & jalan setelah login
 *  4) API publik, canonical/og:url, sitemap, robots pakai domain kustom
 *  5) alur lead: validasi 400 + redirect ke wa.me (honeypot -> tanpa simpan ke D1)
 *  6) www -> apex 301 (host kanonik satu pintu)
 */
const HOST = process.argv[2] || 'https://myprospect.asia';
const PWD = process.env.ADMIN_PASSWORD;

let fails = 0;
const check = (name, ok, extra = '') => {
  console.log(`${ok ? '  PASS' : '  FAIL'}  ${name}${extra ? '  ' + extra : ''}`);
  if (!ok) fails++;
};

console.log(`\n########## E2E DOMAIN + ADMIN — ${HOST} ##########`);

if (!PWD) {
  console.log('  ERROR: ADMIN_PASSWORD belum di-set (sourcing .env.admin).');
  process.exit(2);
}

// 1) guard: tanpa cookie harus tertutup
for (const p of ['/api/admin/stats', '/api/admin/leads', '/api/admin/settings', '/api/admin/posts']) {
  const r = await fetch(HOST + p);
  check(`guard ${p} -> 401`, r.status === 401, `got ${r.status}`);
}
{
  const r = await fetch(HOST + '/admin/', { redirect: 'manual' });
  check('guard /admin/ -> 302 ke login', r.status === 302, `got ${r.status} ${r.headers.get('location') ?? ''}`);
}

// 2) password salah harus ditolak
{
  const r = await fetch(HOST + '/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: 'password-salah-123' }),
  });
  check('login password salah -> 401', r.status === 401, `got ${r.status}`);
}

// 3) password benar -> cookie
let cookie = '';
{
  const r = await fetch(HOST + '/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: PWD }),
  });
  const raw = r.headers.get('set-cookie') ?? '';
  cookie = raw.split(';')[0];
  check('login password benar -> 200', r.status === 200, `got ${r.status}`);
  check('cookie pa_admin diterbitkan', cookie.startsWith('pa_admin='));
  check('cookie HttpOnly', /httponly/i.test(raw));
  check('cookie Secure', /secure/i.test(raw));
  check('cookie SameSite=Lax', /samesite=lax/i.test(raw));
}

// 4) endpoint admin dengan session
const H = { Cookie: cookie };
for (const p of [
  '/api/admin/stats',
  '/api/admin/leads',
  '/api/admin/settings',
  '/api/admin/posts',
  '/api/admin/content/testimonials',
  '/api/admin/content/faq',
]) {
  const r = await fetch(HOST + p, { headers: H });
  let isJson = false;
  try {
    isJson = typeof JSON.parse(await r.text()) === 'object';
  } catch {
    isJson = false;
  }
  check(`auth ${p} -> 200 + JSON`, r.status === 200 && isJson, `got ${r.status}`);
}
{
  const r = await fetch(HOST + '/api/admin/logout', { method: 'POST', headers: H });
  check('logout -> 200', r.status === 200, `got ${r.status}`);
}

// 5) API publik
for (const p of [
  '/api/settings',
  '/api/posts',
  '/api/content/testimonials',
  '/api/content/faq',
  '/api/content/stats',
]) {
  const r = await fetch(HOST + p);
  check(`public ${p} -> 200`, r.status === 200, `got ${r.status}`);
}

// 6) halaman + SEO host
{
  const r = await fetch(HOST + '/');
  const html = await r.text();
  check('halaman / -> 200', r.status === 200, `got ${r.status}`);
  check('canonical -> domain kustom', html.includes(`rel="canonical" href="${HOST}/"`));
  check('og:url -> domain kustom', html.includes(`property="og:url" content="${HOST}/"`));
  check('tidak ada bocor URL pages.dev', !html.includes('myprospect-7uk.pages.dev'));
}

// 6b) www -> apex harus 301 (host kanonik satu pintu)
{
  const r = await fetch('https://www.myprospect.asia/', { redirect: 'manual' });
  const loc = r.headers.get('location') ?? '';
  check('www / -> 301 ke apex', r.status === 301 && loc.startsWith('https://myprospect.asia/'), `got ${r.status} ${loc}`);
}
{
  const r = await fetch('https://www.myprospect.asia/berita/bintang-gohan?utm=1', { redirect: 'manual' });
  const loc = r.headers.get('location') ?? '';
  check('www path + query ikut dipindah', r.status === 301 && loc.includes('/berita/bintang-gohan') && loc.includes('utm=1'), loc);
}
{
  // /admin di www harus dipindah dulu, bukan minta login di host yang salah
  const r = await fetch('https://www.myprospect.asia/admin/', { redirect: 'manual' });
  check('www /admin -> 301 ke apex (bukan 302 ke login)', r.status === 301, `got ${r.status} ${r.headers.get('location') ?? ''}`);
}

// 7) sitemap + robots
{
  const r = await fetch(HOST + '/sitemap-index.xml');
  check('sitemap-index.xml -> 200', r.status === 200, `got ${r.status}`);
  const r2 = await fetch(HOST + '/sitemap-0.xml');
  const t2 = r2.status === 200 ? await r2.text() : '';
  check('sitemap-0.xml -> 200', r2.status === 200, `got ${r2.status}`);
  check('sitemap pakai domain kustom', t2.includes(`${HOST}/`));
  const r3 = await fetch(HOST + '/robots.txt');
  const t3 = r3.status === 200 ? await r3.text() : '';
  check('robots.txt -> 200', r3.status === 200, `got ${r3.status}`);
  check('robots sitemap host benar', t3.includes(HOST));
}

// 8) alur lead — form native (honeypot diisi -> tidak tersimpan ke D1, tapi redirect tetap jalan)
{
  const r = await fetch(HOST + '/api/leads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      nama: 'Verifikasi Otomatis',
      wa: '081234567890',
      program: 'Elite 1-on-1',
      sumber: 'verify-domain',
      website: 'honeypot-terisi',
    }).toString(),
    redirect: 'manual',
  });
  const loc = r.headers.get('location') ?? '';
  check('lead form -> 302', r.status === 302, `got ${r.status}`);
  check('lead form -> wa.me', loc.startsWith('https://wa.me/'), loc.slice(0, 40));
}
{
  const r = await fetch(HOST + '/api/leads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nama: 'Tanpa WA' }),
  });
  check('lead JSON tanpa wa -> 400', r.status === 400, `got ${r.status}`);
}
{
  const r = await fetch(HOST + '/api/leads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nama: 'X', wa: '123' }),
  });
  check('lead JSON wa pendek -> 400', r.status === 400, `got ${r.status}`);
}

console.log(`\n>>> ${fails === 0 ? 'SEMUA PASS' : fails + ' GAGAL'}\n`);
process.exit(fails === 0 ? 0 : 1);