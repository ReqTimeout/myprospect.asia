import { isKind, json } from '../../_lib/content';

type Env = { DB: D1Database };

export const onRequestGet = async (context: { params: { kind?: string }; env: Env }): Promise<Response> => {
  const kind = context.params.kind;
  if (!isKind(kind)) return json({ error: 'kind tidak valid' }, 404);

  const rows = await context.env.DB.prepare(
    'SELECT id, title, body, meta, sort FROM content_items WHERE kind = ? AND active = 1 ORDER BY sort ASC, id ASC LIMIT 200',
  )
    .bind(kind)
    .all<{ id: string; title: string; body: string; meta: string; sort: number }>();

  const items = (rows.results ?? []).map((r) => {
    let meta: Record<string, unknown> = {};
    try {
      meta = JSON.parse(r.meta) as Record<string, unknown>;
    } catch {
      meta = {};
    }
    return { id: r.id, title: r.title, body: r.body, meta, sort: r.sort };
  });

  return new Response(JSON.stringify(items), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=30' },
  });
};
