type Env = { DB: D1Database };

const ALLOWED: Record<string, string> = {
  wa_number: '^\\+?[0-9]{9,15}$',
  popup_enabled: '^[01]$',
  popup_text: '^.{1,200}$',
  popup_delay_sec: '^([1-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])$',
  ga4_id: '^(G-[A-Z0-9]{6,20}|)$',
};

export const onRequestGet = async (context: { request: Request; env: Env }): Promise<Response> => {
  const { env } = context;
  const rows = await env.DB.prepare('SELECT k, v FROM settings').all<{ k: string; v: string }>();
  const out: Record<string, string> = {};
  for (const r of rows.results ?? []) out[r.k] = r.v;
  for (const k of Object.keys(ALLOWED)) out[k] ??= '';
  return new Response(JSON.stringify(out), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const onRequestPut = async (context: { request: Request; env: Env }): Promise<Response> => {
  const { request, env } = context;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return new Response('Bad request', { status: 400 });
  }

  const updates: string[][] = [];
  for (const [k, raw] of Object.entries(body)) {
    const pattern = ALLOWED[k];
    if (!pattern) continue;
    const v = String(raw ?? '');
    if (!new RegExp(pattern).test(v)) {
      return new Response(`Nilai ${k} tidak valid`, { status: 400 });
    }
    updates.push([k, v]);
  }

  if (updates.length === 0) {
    return new Response('Tidak ada field yang dikenali', { status: 400 });
  }

  for (const [k, v] of updates) {
    await env.DB.prepare('INSERT INTO settings (k, v) VALUES (?, ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v').bind(
      k,
      v,
    ).run();
  }

  return new Response(JSON.stringify({ ok: true, updated: updates.map(([k]) => k) }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
