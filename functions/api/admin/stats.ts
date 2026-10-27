type Env = { DB: D1Database };

export const onRequestGet = async (context: { env: Env }): Promise<Response> => {
  const { env } = context;

  const [totalRow, hariIniRow, klik7Row, draftRow] = await Promise.all([
    env.DB.prepare("SELECT COUNT(*) AS n FROM leads").first<{ n: number }>(),
    env.DB.prepare("SELECT COUNT(*) AS n FROM leads WHERE date(created_at) = date('now')").first<{ n: number }>(),
    env.DB.prepare("SELECT COUNT(*) AS n FROM wa_clicks WHERE ts >= datetime('now', '-7 days')").first<{
      n: number;
    }>(),
    env.DB.prepare('SELECT COUNT(*) AS n FROM leads WHERE status = \'baru\'').first<{ n: number }>(),
  ]);

  return new Response(
    JSON.stringify({
      leadsTotal: totalRow?.n ?? 0,
      leadsHariIni: hariIniRow?.n ?? 0,
      klikWa7Hari: klik7Row?.n ?? 0,
      leadsBaru: draftRow?.n ?? 0,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
};
