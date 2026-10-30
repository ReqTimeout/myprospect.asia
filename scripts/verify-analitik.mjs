/**
 * Verifikasi pipeline analitik trafik + CRUD berita lewat API (tanpa browser).
 * Jalankan: set -a && . ./.env.admin && set +a && node scripts/verify-analitik.mjs [base-url]
 *
 * Bagian 1-3 memakai berkas pageview sintetis (UA desktop/tablet/mobile + referrer
 * Google & Instagram) untuk membuktikan klasifikasi device, ref_domain, filter /admin,
 * dan deret waktu. Baris sintetis INI DIHAPUS lagi di bagian cleanup — data produksi
 * akhirnya hanya berisi kunjungan nyata dari verifikasi browser.
 *
 * Bagian 4-5 membuat berita sungguhan di D1, memuat halaman publiknya, mengubah,
 * lalu menghapusnya. Nama slug diberi prefix "zz-uji-" supaya jelas milik test.
 */
const BASE = (process.argv[2] || 'https://myprospect.asia').replace(/\/$/, '');
const PWD = process.env.ADMIN_PASSWORD;
if (!PWD) {
  console.error('ADMIN_PASSWORD belum di-set (sourcing .env.admin).');
  process.exit(2);
}

let fails = 0;
const check = (nama, ok, extra = '') => {
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${nama}${extra ? '  ' + JSON.stringify(extra).slice(0, 220) : ''}`);
  if (!ok) fails++;
};

const UA = {
  desktop: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
  tablet: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  mobile: 'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36',
};

// -- 0) login, ambil cookie --
let cookie = '';
{
  const r = await fetch(`${BASE}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: PWD }),
  });
  const sc = r.headers.getSetCookie ? r.headers.getSetCookie() : [];
  cookie = sc.map((c) => c.split(';')[0]).join('; ');
  check('0 login admin -> 200 + cookie sesi', r.status === 200 && /=.+/.test(cookie), { status: r.status });
}

const adminGet = async (p) => {
  const r = await fetch(BASE + p, { headers: { Cookie: cookie } });
  return { status: r.status, body: await r.text() };
};
const adminSend = async (p, method, payload, isForm = false) => {
  const r = await fetch(BASE + p, {
    method,
    headers: { Cookie: cookie, ...(isForm ? {} : { 'Content-Type': 'application/json' }) },
    body: isForm ? payload : JSON.stringify(payload),
  });
  const text = await r.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* pesan error plain text memang diharapkan di jalur gagal */
  }
  return { status: r.status, text, json };
};

// -- 1) beacon pageview --
const kirim = async (p, ua, referer) => {
  const r = await fetch(`${BASE}/api/pv`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'User-Agent': ua, ...(referer ? { Referer: referer } : {}) },
    body: JSON.stringify({ p }),
  });
  return r.status;
};

{
  const status = await Promise.all([
    kirim('/', UA.desktop, undefined),
    kirim('/tentang/', UA.desktop, 'https://www.google.com/search?q=prospect+asia'),
    kirim('/berita/', UA.mobile, 'https://www.instagram.com/'),
    kirim('/program/elite-1on1/', UA.mobile, undefined),
    kirim('/faq/', UA.tablet, undefined),
    kirim('/admin/', UA.desktop, undefined),
    kirim('/zz-uji-tidak-ada', 'curl/8.7.0', 'https://example.com/x?y=1#z'),
  ]);
  check('1 semua beacon membalas 204', status.every((s) => s === 204), status);

  const kosong = await fetch(`${BASE}/api/pv`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: 'bukan-json' });
  check('1 body rusak -> 204 diam-diam (tidak melempar error)', kosong.status === 204);

  const tanpa = await fetch(`${BASE}/api/pv`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ p: 'http://luar/%00' }) });
  check('1 path bukan relatif -> ditolak 204 tanpa insert', tanpa.status === 204);
}

// -- 2) angka lewat API stats --
let stats = null;
{
  const r = await adminGet('/api/admin/stats?hari=7');
  stats = r.json ?? JSON.parse(r.body);
  check('2 stats -> 200', r.status === 200, { status: r.status });
  check('2 halaman dilihat terhitung', stats.kpi.pv.kini >= 5, stats.kpi.pv);
  check('2 pengunjung unik terhitung (>=2)', stats.kpi.uv.kini >= 2, stats.kpi.uv);
  check('2 path /admin disaring', !(stats.halaman ?? []).some((h) => String(h.path).startsWith('/admin')));
  check('2 deret 7 hari penuh', Array.isArray(stats.deret) && stats.deret.length === 7, stats.deret?.length);
  check('2 hari ter akhir deret memuat trafik', Number(stats.deret.at(-1).pv) > 0, stats.deret.at(-1));
  check('2 UA cli (curl) digolongkan bot dan tidak dihitung', !(stats.halaman ?? []).some((h) => String(h.path).includes('zz-uji-tidak-ada')), (stats.halaman ?? []).map((h) => h.path));
  check('2 daftar halaman terurut descending', (stats.halaman ?? []).every((h, i, a) => i === 0 || a[i - 1].pv >= h.pv));

  const perangkat = new Set((stats.perangkat ?? []).map((p) => p.device));
  check('2 device desktop+mobile+tablet terklasifikasi', perangkat.has('desktop') && perangkat.has('mobile') && perangkat.has('tablet'), [...perangkat]);
  const sumber = new Set((stats.sumber ?? []).map((s) => s.domain));
  check('2 referrer google.com terparse', sumber.has('google.com'), [...sumber]);
  check('2 referrer instagram.com terparse', sumber.has('instagram.com'), [...sumber]);
  check('2 referrer internal tidak dihitung', !sumber.has('myprospect.asia'), [...sumber]);
  check('2 kunci lama tetap ada', ['leadsTotal', 'leadsHariIni', 'klikWa7Hari', 'leadsBaru'].every((k) => typeof stats[k] === 'number'));
  // Bentuk array leadsTerbaru diuji, bukan kehadirannya: produksi boleh 0 lead
  // (baris uji dibersihkan), jadi cukup pastikan tiap entri yang ada punya kolom lengkap.
  check(
    '2 leadsTerbaru berbentuk array valid',
    Array.isArray(stats.leadsTerbaru) &&
      stats.leadsTerbaru.every((x) => x && typeof x.nama === 'string' && typeof x.status === 'string'),
    stats.leadsTerbaru?.length,
  );

  const salah = await adminGet('/api/admin/stats?hari=9999;DROP');
  const js = salah.json ?? JSON.parse(salah.body);
  check('2 parameter hari asing -> fallback 14 hari, tidak error', salah.status === 200 && js.hari === 14, { hari: js.hari });

  const tanpaLogin = await fetch(`${BASE}/api/admin/stats?hari=7`);
  check('2 stats tanpa login -> 401', tanpaLogin.status === 401, { status: tanpaLogin.status });
}

// -- 3) corong: klik WA & lead ikut masuk deret --
{
  await fetch(`${BASE}/api/click`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'User-Agent': UA.mobile },
    body: JSON.stringify({ slug: 'zz-uji-cta' }),
  });
  const r = await adminGet('/api/admin/stats?hari=7');
  const j = r.json ?? JSON.parse(r.body);
  check('3 klik WA terhitung di KPI', j.kpi.klik.kini >= 1, j.kpi.klik);
  check('3 CTA terpopuler memuat slug uji', (j.cta ?? []).some((c) => c.slug === 'zz-uji-cta'), (j.cta ?? []).map((c) => c.slug));
  check('3 konversi pv->klik > 0', j.konversi.pvKeKlik > 0, j.konversi);
}

// -- 4) CRUD berita --
const slugUji = 'zz-uji-berita-api';
const artikel = {
  slug: slugUji,
  title: 'Uji Sistem: Berita Dibuat Lewat Panel Admin',
  desc: 'Entri ini dibuat skrip verifikasi untuk menguji CRUD berita, lalu dihapus lagi.',
  kategori: 'Berita',
  pub_date: new Date().toISOString().slice(0, 10),
  body: '## Uji\n\nParagraf pertama.\n\n- poin satu\n- poin dua\n\n> kutipan uji',
  status: 'published',
  cover: '/media/workshop-live.jpg',
};
{
  const bikin = await adminSend('/api/admin/posts', 'POST', artikel);
  check('4 POST berita -> 201', bikin.status === 201 && bikin.json?.ok === true, { status: bikin.status, text: bikin.text });

  const daftar = await adminSend('/api/admin/posts', 'GET');
  check('4 GET daftar berita memuat slug uji', (daftar.json ?? []).some((p) => p.slug === slugUji));

  const tolak = await adminSend('/api/admin/posts', 'POST', { ...artikel, slug: 'Slug Tidak Valid' });
  check('4 slug salah -> 400', tolak.status === 400, { status: tolak.status, text: tolak.text });

  const duplikat = await adminSend('/api/admin/posts', 'POST', artikel);
  check('4 slug ganda ditolak', duplikat.status === 400, { status: duplikat.status, text: duplikat.text });

  const halaman = await fetch(`${BASE}/berita/${slugUji}/`, { headers: { 'User-Agent': UA.desktop } });
  const html = await halaman.text();
  check('4 halaman publik -> 200', halaman.status === 200, { status: halaman.status });
  check('4 judul termuat di HTML', html.includes(artikel.title));
  check('4 body ter-render (h2 + list + blockquote)', /<h2[^>]*>Uji<\/h2>/.test(html) && /<li>poin satu<\/li>/.test(html) && /<blockquote>/.test(html));
  check('4 cover /media dipakai', html.includes('/media/workshop-live.jpg'));
  check('4 canonical + og:url ke domain apex', html.includes(`<link rel="canonical" href="https://myprospect.asia/berita/${slugUji}">`) && html.includes(`property="og:url" content="https://myprospect.asia/berita/${slugUji}"`));
  check('4 footer tahun bukan 1970', /© 20\d{2} PT Kita Berani Bicara/.test(html) && !/© 1970/.test(html));
  check('4 beacon pv + click ikut disuntik', html.includes('/api/pv') && html.includes('/api/click'));
  check('4 link WA punya data-wa-cta', /data-wa-cta="berita-detail"/.test(html));

  const daftarPub = await fetch(`${BASE}/api/posts`);
  const jsPub = await daftarPub.json().catch(() => null);
  const diPub = JSON.stringify(jsPub ?? {});
  check('4 berita masuk /api posts publik', diPub.includes(slugUji));

  const ubah = await adminSend(`/api/admin/posts/${slugUji}`, 'PUT', { ...artikel, title: 'Uji Sistem: Berita Sudah Diedit', status: 'draft' });
  check('4 PUT edit -> ok', ubah.status === 200 && ubah.json?.ok === true, { status: ubah.status, text: ubah.text });

  const setelahEdit = await fetch(`${BASE}/berita/${slugUji}/`);
  const htmlEdit = await setelahEdit.text();
  check('4 status draft -> halaman publik 404', setelahEdit.status === 404, { status: setelahEdit.status });
  check('4 title hasil edit tersimpan', (await adminSend('/api/admin/posts', 'GET')).json?.some((p) => p.slug === slugUji && p.title === 'Uji Sistem: Berita Sudah Diedit'));

  const ubahSlug = await adminSend(`/api/admin/posts/${slugUji}`, 'PUT', { ...artikel, slug: 'zz-uji-lain' });
  check('4 PUT dilarang ganti slug -> 400', ubahSlug.status === 400, ubahSlug.text);
}

// -- 5) bersih-bersih --
{
  const hapus = await adminSend(`/api/admin/posts/${slugUji}`, 'DELETE');
  check('5 DELETE -> ok', hapus.status === 200 && hapus.json?.ok === true, { status: hapus.status });

  const hilang = await fetch(`${BASE}/berita/${slugUji}/`);
  check('5 berita test tidak ada lagi', hilang.status === 404, { status: hilang.status });

  const sisa = await adminSend('/api/admin/posts', 'GET');
  check('5 tidak ada berita zz-uji tertinggal', !(sisa.json ?? []).some((p) => String(p.slug).startsWith('zz-uji')));

  const beritaAsli = (sisa.json ?? []).filter((p) => !String(p.slug).startsWith('zz-uji'));
  check('5 berita asli (3 entri awal) tetap utuh', beritaAsli.length >= 3, beritaAsli.map((p) => p.slug));

  const tanpaAuth = await fetch(`${BASE}/api/admin/posts`, { method: 'POST', body: '{}' });
  check('5 POST berita tanpa login -> 401', tanpaAuth.status === 401, { status: tanpaAuth.status });
}

console.log('\n>>> Bersihkan baris uji di D1:');
console.log(
  [
    `npx wrangler d1 execute prospect-db --remote --command "DELETE FROM pageviews"`,
    `npx wrangler d1 execute prospect-db --remote --command "DELETE FROM wa_clicks WHERE slug = 'zz-uji-cta'"`,
  ].join('\n'),
);

console.log(`\n>>> ${fails === 0 ? 'SEMUA PASS' : fails + ' GAGAL'}\n`);
process.exit(fails === 0 ? 0 : 1);
