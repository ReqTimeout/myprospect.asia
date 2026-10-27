type Env = { DB: D1Database };

const STATUS = ['baru', 'dikontak', 'terjadwal', 'daftar', 'gagal'] as const;

export const onRequestGet = async (context: { request: Request; env: Env }): Promise<Response> => {
  const { request, env } = context;
  const url = new URL(request.url);
  const status = url.searchParams.get('status');

  const rows = status
    ? await env.DB.prepare(
        'SELECT id, nama, wa, program, sumber, status, catatan, created_at FROM leads WHERE status = ? ORDER BY created_at DESC LIMIT 200',
      )
        .bind(status)
        .all()
    : await env.DB.prepare(
        'SELECT id, nama, wa, program, sumber, status, catatan, created_at FROM leads ORDER BY created_at DESC LIMIT 200',
      ).all();

  return new Response(JSON.stringify(rows.results ?? []), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const onRequestPatch = async (context: { request: Request; env: Env }): Promise<Response> => {
  const { request, env } = context;

  let body: { id?: unknown; status?: unknown; catatan?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return new Response('Bad request', { status: 400 });
  }

  const id = Number(body.id);
  if (!Number.isInteger(id) || id < 1) return new Response('id tidak valid', { status: 400 });

  if (body.status !== undefined) {
    if (!STATUS.includes(body.status as (typeof STATUS)[number])) {
      return new Response('status tidak valid', { status: 400 });
    }
    await env.DB.prepare('UPDATE leads SET status = ? WHERE id = ?').bind(body.status, id).run();
  }

  if (body.catatan !== undefined) {
    const catatan = String(body.catatan).slice(0, 500);
    await env.DB.prepare('UPDATE leads SET catatan = ? WHERE id = ?').bind(catatan, id).run();
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
