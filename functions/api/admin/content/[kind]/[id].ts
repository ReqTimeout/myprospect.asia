import { isKind, json, bad, parseContent } from '../../../../_lib/content';

type Env = { DB: D1Database };

type Ctx = { params: { kind?: string; id?: string }; request: Request; env: Env };

export const onRequestPut = async (context: Ctx): Promise<Response> => {
  const { kind, id } = context.params;
  if (!isKind(kind) || !id) return json({ error: 'tidak valid' }, 404);

  let raw: unknown;
  try {
    raw = await context.request.json();
  } catch {
    return bad('Bad request');
  }
  const parsed = parseContent(kind, raw);
  if (typeof parsed === 'string') return bad(parsed);
  const c = parsed;

  const exists = await context.env.DB.prepare('SELECT 1 FROM content_items WHERE id = ? AND kind = ?')
    .bind(id, kind)
    .first();
  if (!exists) return json({ error: 'tidak ditemukan' }, 404);

  await context.env.DB.prepare(
    'UPDATE content_items SET title = ?, body = ?, meta = ?, sort = ?, active = ?, updated_at = datetime(\'now\') WHERE id = ? AND kind = ?',
  )
    .bind(c.title, c.body, JSON.stringify(c.meta), c.sort, c.active, id, kind)
    .run();

  return json({ ok: true, id });
};

export const onRequestDelete = async (context: Ctx): Promise<Response> => {
  const { kind, id } = context.params;
  if (!isKind(kind) || !id) return json({ error: 'tidak valid' }, 404);
  await context.env.DB.prepare('DELETE FROM content_items WHERE id = ? AND kind = ?').bind(id, kind).run();
  return json({ ok: true });
};
