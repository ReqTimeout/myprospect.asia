import { isKind, json, bad, parseContent } from '../../../_lib/content';

type Env = { DB: D1Database };

export const onRequestGet = async (context: { params: { kind?: string }; env: Env }): Promise<Response> => {
  const kind = context.params.kind;
  if (!isKind(kind)) return json({ error: 'kind tidak valid' }, 404);

  const rows = await context.env.DB.prepare(
    'SELECT id, title, body, meta, sort, active, updated_at FROM content_items WHERE kind = ? ORDER BY sort ASC, id ASC LIMIT 300',
  )
    .bind(kind)
    .all<{ id: string; title: string; body: string; meta: string; sort: number; active: number; updated_at: string }>();

  const items = (rows.results ?? []).map((r) => {
    let meta: Record<string, unknown> = {};
    try {
      meta = JSON.parse(r.meta) as Record<string, unknown>;
    } catch {
      meta = {};
    }
    return { ...r, meta };
  });

  return json(items);
};

export const onRequestPost = async (context: { params: { kind?: string }; request: Request; env: Env }): Promise<Response> => {
  const kind = context.params.kind;
  if (!isKind(kind)) return json({ error: 'kind tidak valid' }, 404);

  let raw: unknown;
  try {
    raw = await context.request.json();
  } catch {
    return bad('Bad request');
  }
  const parsed = parseContent(kind, raw);
  if (typeof parsed === 'string') return bad(parsed);
  const c = parsed;

  const id = `${kind.slice(0, 1)}-${Date.now().toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`;
  await context.env.DB.prepare(
    'INSERT INTO content_items (id, kind, title, body, meta, sort, active) VALUES (?, ?, ?, ?, ?, ?, ?)',
  )
    .bind(id, kind, c.title, c.body, JSON.stringify(c.meta), c.sort, c.active)
    .run();

  return json({ ok: true, id }, 201);
};
