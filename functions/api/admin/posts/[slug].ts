import { json, bad, parsePost, type PostInput } from '../../../_lib/content';

type Env = { DB: D1Database };

type Ctx = { params: { slug?: string }; request: Request; env: Env };

export const onRequestPut = async (context: Ctx): Promise<Response> => {
  const slug = context.params.slug;
  if (!slug) return bad('slug hilang');

  let raw: unknown;
  try {
    raw = await context.request.json();
  } catch {
    return bad('Bad request');
  }
  const parsed = parsePost(raw);
  if (typeof parsed === 'string') return bad(parsed);
  const p = parsed as PostInput;
  if (p.slug !== slug) return bad('slug tidak boleh berubah via edit');

  const exists = await context.env.DB.prepare('SELECT 1 FROM posts WHERE slug = ?').bind(slug).first();
  if (!exists) return json({ error: 'tidak ditemukan' }, 404);

  await context.env.DB.prepare(
    'UPDATE posts SET title = ?, "desc" = ?, kategori = ?, pub_date = ?, body = ?, status = ?, updated_at = datetime(\'now\') WHERE slug = ?',
  )
    .bind(p.title, p.desc, p.kategori, p.pub_date, p.body, p.status, slug)
    .run();

  return json({ ok: true, slug });
};

export const onRequestDelete = async (context: Ctx): Promise<Response> => {
  const slug = context.params.slug;
  if (!slug) return bad('slug hilang');
  await context.env.DB.prepare('DELETE FROM posts WHERE slug = ?').bind(slug).run();
  return json({ ok: true });
};
