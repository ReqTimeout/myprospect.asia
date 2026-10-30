type Env = { DB: D1Database };

type Row = Record<string, unknown>;

const ANGKA = [7, 14, 30];
const WIB = '+7 hours';
// Trafik bot/cli dikecualikan dari angka dashboard — barisnya tetap tersimpan buat audit.
const MANUSIA = 'AND device <> \'bot\'';

// Tanggal kalender WIB untuk i hari ke belakang — dipakai buat mengisi hari yang kosong
// supaya grafik tidak bolong-bolong.
function dayKey(back: number): string {
  return new Date(Date.now() - back * 86_400_000 + 7 * 3_600_000).toISOString().slice(0, 10);
}

// Tabel baru / query agregat tidak boleh merobohkan seluruh dashboard.
async function rows(db: D1Database, sql: string, params: unknown[] = []): Promise<Row[]> {
  try {
    const stmt = params.length ? db.prepare(sql).bind(...(params as never[])) : db.prepare(sql);
    const r = await stmt.all<Row>();
    return r.results ?? [];
  } catch (e) {
    // jangan sampan tanpa jejak: error masuk log Functions, angka nol yang palsu
    // harus ditangkap test dengan assertion positif (bukan "tidak ada error")
    console.error('stats rows gagal:', sql.slice(0, 72), e);
    return [];
  }
}

async function one(db: D1Database, sql: string, params: unknown[] = []): Promise<Row> {
  try {
    const stmt = params.length ? db.prepare(sql).bind(...(params as never[])) : db.prepare(sql);
    return ((await stmt.first<Row>()) ?? {}) as Row;
  } catch (e) {
    console.error('stats one gagal:', sql.slice(0, 72), e);
    return {};
  }
}

const num = (v: unknown): number => (typeof v === 'number' ? v : Number(v ?? 0) || 0);

export const onRequestGet = async (context: { request: Request; env: Env }): Promise<Response> => {
  const { request, env } = context;

  const asked = Number(new URL(request.url).searchParams.get('hari'));
  const n = ANGKA.includes(asked) ? asked : 14;
  const db = env.DB;

  // Batas periode dibangun dari integer n yang sudah divalidasi, bukan input mentah.
  const sinceNow = `datetime('now', '-${n} days')`;
  const sincePrev = `datetime('now', '-${n * 2} days')`;

  const [
    pvKini,
    pvSebelum,
    deretPv,
    deretKlik,
    deretLead,
    halaman,
    sumber,
    perangkat,
    cta,
    klik7,
    leadsTotal,
    leadsHariIni,
    leadsBaru,
    leadsTerbaru,
    realtime,
    konten,
  ] = await Promise.all([
    one(db, `SELECT COUNT(*) AS pv, COUNT(DISTINCT NULLIF(visitor,'')) AS uv FROM pageviews WHERE ts >= ${sinceNow} ${MANUSIA}`),
    one(
      db,
      `SELECT COUNT(*) AS pv, COUNT(DISTINCT NULLIF(visitor,'')) AS uv FROM pageviews
       WHERE ts >= ${sincePrev} AND ts < ${sinceNow} ${MANUSIA}`,
    ),
    rows(
      db,
      `SELECT date(ts, '${WIB}') AS day, COUNT(*) AS pv, COUNT(DISTINCT NULLIF(visitor,'')) AS uv
       FROM pageviews WHERE ts >= ${sinceNow} ${MANUSIA} GROUP BY day ORDER BY day`,
    ),
    rows(
      db,
      `SELECT date(ts, '${WIB}') AS day, COUNT(*) AS n FROM wa_clicks WHERE ts >= ${sincePrev} GROUP BY day ORDER BY day`,
    ),
    rows(
      db,
      `SELECT date(created_at, '${WIB}') AS day, COUNT(*) AS n FROM leads WHERE created_at >= ${sincePrev} GROUP BY day ORDER BY day`,
    ),
    rows(
      db,
      `SELECT path, COUNT(*) AS pv, COUNT(DISTINCT NULLIF(visitor,'')) AS uv
       FROM pageviews WHERE ts >= ${sinceNow} ${MANUSIA} GROUP BY path ORDER BY pv DESC LIMIT 8`,
    ),
    rows(
      db,
      `SELECT ref_domain AS domain, COUNT(*) AS pv, COUNT(DISTINCT NULLIF(visitor,'')) AS uv
       FROM pageviews WHERE ts >= ${sinceNow} ${MANUSIA} AND ref_domain <> '' GROUP BY domain ORDER BY pv DESC LIMIT 6`,
    ),
    rows(db, `SELECT device, COUNT(*) AS pv FROM pageviews WHERE ts >= ${sinceNow} ${MANUSIA} GROUP BY device ORDER BY pv DESC`),
    rows(db, `SELECT slug, COUNT(*) AS n FROM wa_clicks WHERE ts >= ${sinceNow} GROUP BY slug ORDER BY n DESC LIMIT 6`),
    one(db, `SELECT COUNT(*) AS n FROM wa_clicks WHERE ts >= datetime('now', '-7 days')`),
    one(db, 'SELECT COUNT(*) AS n FROM leads'),
    one(db, `SELECT COUNT(*) AS n FROM leads WHERE date(created_at, '${WIB}') = date('now', '${WIB}')`),
    one(db, "SELECT COUNT(*) AS n FROM leads WHERE status = 'baru'"),
    rows(db, 'SELECT id, nama, wa, program, sumber, status, created_at FROM leads ORDER BY id DESC LIMIT 5'),
    one(db, `SELECT COUNT(*) AS pv, COUNT(DISTINCT NULLIF(visitor,'')) AS uv FROM pageviews WHERE ts >= datetime('now', '-30 minutes') ${MANUSIA}`),
    Promise.all([
      one(db, "SELECT COUNT(*) AS n FROM posts WHERE status = 'published'"),
      one(db, "SELECT COUNT(*) AS n FROM leads WHERE status = 'daftar'"),
    ]),
  ]);

  const pvMap = new Map(deretPv.map((r) => [String(r.day), r]));
  const klikMap = new Map(deretKlik.map((r) => [String(r.day), num(r.n)]));
  const leadMap = new Map(deretLead.map((r) => [String(r.day), num(r.n)]));

  const deret = Array.from({ length: n }, (_, i) => {
    const day = dayKey(n - 1 - i);
    const row = pvMap.get(day);
    return {
      day,
      pv: num(row?.pv),
      uv: num(row?.uv),
      klik: klikMap.get(day) ?? 0,
      lead: leadMap.get(day) ?? 0,
    };
  });

  const pv = num(pvKini.pv);
  const uv = num(pvKini.uv);
  const klik = deret.reduce((a, d) => a + d.klik, 0);
  const lead = deret.reduce((a, d) => a + d.lead, 0);

  return new Response(
    JSON.stringify({
      // kunci lama dipertahankan supaya pemakai yang sudah ada tidak rusak
      leadsTotal: num(leadsTotal.n),
      leadsHariIni: num(leadsHariIni.n),
      klikWa7Hari: num(klik7.n),
      leadsBaru: num(leadsBaru.n),

      hari: n,
      sejak: dayKey(n - 1),
      kpi: {
        pv: { kini: pv, sebelum: num(pvSebelum.pv) },
        uv: { kini: uv, sebelum: num(pvSebelum.uv) },
        klik: { kini: klik, sebelum: deretSebelumCount(deretKlik, n) },
        lead: { kini: lead, sebelum: deretSebelumCount(deretLead, n) },
      },
      konversi: {
        pvKeKlik: pv ? Math.round((klik / pv) * 1000) / 10 : 0,
        klikKeLead: klik ? Math.round((lead / klik) * 1000) / 10 : 0,
        pvKeLead: pv ? Math.round((lead / pv) * 1000) / 10 : 0,
      },
      realtime: { pv30Menit: num(realtime.pv), uv30Menit: num(realtime.uv) },
      konten: { beritaTerbit: num(konten[0]?.n), leadMenang: num(konten[1]?.n) },

      deret,
      halaman,
      sumber,
      perangkat,
      cta,
      leadsTerbaru,
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    },
  );
};

// Total periode sebelumnya dari deret harian: ambil baris yang harinya < hari pertama
// periode berjalan, sampai 2n hari ke belakang.
function deretSebelumCount(rowsSebelum: Row[], n: number): number {
  const batas = dayKey(n - 1);
  const mulai = dayKey(2 * n - 1);
  return rowsSebelum
    .filter((r) => {
      const d = String(r.day);
      return d >= mulai && d < batas;
    })
    .reduce((a, r) => a + num(r.n), 0);
}
