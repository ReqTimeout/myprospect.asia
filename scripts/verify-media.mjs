/**
 * Verifikasi R2 end-to-end: status binding -> daftar berkas -> unggah nyata ->
 * ambil dari URL publik -> cek gambar bawaan tidak rusak.
 * Jalankan: set -a && . ./.env.admin && set +a && node scripts/verify-media.mjs [base-url]
 *
 * Berkas uji diunggah ke bucket sungguhan lalu DIHAPUS lagi di bagian cleanup,
 * supaya bucket produksi tidak ketinggalan file percobaan.
 */
import { readFile } from 'node:fs/promises';

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

// -- 1) status R2 dari binding sungguhan --
let siap = false;
{
  const r = await adminGet('/api/admin/media');
  let json = null;
  try {
    json = JSON.parse(r.body);
  } catch {
    /* bukan JSON = bukan respons yang diharapkan */
  }
  siap = json?.siap === true;
  check('1 /api/admin/media -> 200', r.status === 200, { status: r.status });
  check('1 binding R2 terbaca hidup (siap = true)', siap, json?.siap);
  check('1 nama bucket benar', json?.bucket === 'prospect-media', json?.bucket);
  check('1 tidak ada langkah aktivasi lagi', Array.isArray(json?.langkah) && json.langkah.length === 0, json?.langkah);
}

// -- 2) daftar berkas --
{
  const r = await adminGet('/api/admin/upload');
  let json = null;
  try {
    json = JSON.parse(r.body);
  } catch {
    /* bukan JSON = bukan respons yang diharapkan */
  }
  check('2 /api/admin/upload GET -> 200', r.status === 200, { status: r.status });
  check('2 daftar berkas berupa array', Array.isArray(json?.berkas), json?.berkas);
}

// -- 3) unggah berkas nyata (PNG asli dari repo) --
let kunciUji = '';
if (siap) {
  const sumber = await readFile(new URL('../public/media/logo-prospect-black.png', import.meta.url));
  const fd = new FormData();
  fd.append('file', new Blob([sumber], { type: 'image/png' }), 'Logo Prospect Asia.png');

  const r = await fetch(`${BASE}/api/admin/upload`, { method: 'POST', headers: { Cookie: cookie }, body: fd });
  const teks = await r.text();
  let json = null;
  try {
    json = JSON.parse(teks);
  } catch {
    /* bukan JSON = bukan respons yang diharapkan */
  }
  kunciUji = json?.key ?? '';
  check('3 unggah -> 201', r.status === 201, { status: r.status, body: teks.slice(0, 120) });
  check('3 kunci berkas di bucket', /^media\/\d{8}-[a-z0-9-]+\.[a-z0-9]+$/.test(kunciUji), kunciUji);
  check('3 nama asli dipIContenkan (Logo Prospect Asia)', kunciUji.includes('logo-prospect-asia'), kunciUji);
  check('3 ukuran dikembalikan', json?.ukuran === sumber.length, { ukuran: json?.ukuran, asli: sumber.length });
}

// -- 4) berkas hasil unggah bisa diambil dari URL publik --
if (kunciUji) {
  const url = `${BASE}/${kunciUji}`;
  const r = await fetch(url);
  const buf = Buffer.from(await r.arrayBuffer());
  check('4 URL publik -> 200', r.status === 200, { status: r.status, url });
  check('4 content-type gambar', (r.headers.get('content-type') ?? '').startsWith('image/'), r.headers.get('content-type'));
  check('4 isi berkas sama dengan yang diunggah', buf.length > 0 && buf.subarray(0, 8).toString('hex') === '89504e470d0a1a0a', {
    byte: buf.length,
    kepala: buf.subarray(0, 8).toString('hex'),
  });
  check('4 caching jangka panjang', (r.headers.get('cache-control') ?? '').includes('max-age=31536000'), r.headers.get('cache-control'));
}

// -- 5) gambar bawaan public/media/ tetap jalan (route /media/* membayangi statis) --
for (const f of ['hero-athletes.jpg', 'workshop-hero.jpg', 'logo-prospect-black.png']) {
  const r = await fetch(`${BASE}/media/${f}`);
  check(`5 gambar bawaan /media/${f} tetap 200`, r.status === 200, { status: r.status });
}

// -- 6) berkas tak dikenal dibalas 404 (bukan HTML homepage) --
{
  const r = await fetch(`${BASE}/media/zz-tidak-ada-xyz.png`);
  check('6 media tak dikenal -> 404', r.status === 404, { status: r.status });
}

// -- 7) berkas uji muncul di daftar admin --
if (kunciUji) {
  const r = await adminGet('/api/admin/upload');
  let json = null;
  try {
    json = JSON.parse(r.body);
  } catch {
    /* bukan JSON = bukan respons yang diharapkan */
  }
  check('7 berkas uji muncul di daftar', (json?.berkas ?? []).some((b) => b.key === kunciUji), kunciUji);
}

console.log(fails === 0 ? '\n>>> SEMUA PASS' : `\n>>> ${fails} GAGAL`);
if (kunciUji) {
  console.log('\n>>> Bersihkan berkas uji di R2:');
  console.log(`npx wrangler r2 object delete prospect-media/${kunciUji} --remote`);
}
process.exit(fails === 0 ? 0 : 1);
