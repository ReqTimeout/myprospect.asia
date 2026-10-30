import { json, bad, parsePost, type PostInput } from '../../../_lib/content';

type Env = { DB: D1Database };

export const onRequestGet = async (context: { env: Env }): Promise<Response> => {
  const rows = await context.env.DB.prepare(
    'SELECT slug, title, "desc" AS "desc", kategori, pub_date, status, body, cover, updated_at FROM posts ORDER BY pub_date DESC, slug DESC LIMIT 200',
  ).all();
  return json(rows.results ?? []);
};

export const onRequestPost = async (context: { request: Request; env: Env }): Promise<Response> => {
  let raw: unknown;
  try {
    raw = await context.request.json();
  } catch {
    return bad('Bad request');
  }
  const parsed = parsePost(raw);
  if (typeof parsed === 'string') return bad(parsed);

  const p = parsed as PostInput;
  const exists = await context.env.DB.prepare('SELECT 1 FROM posts WHERE slug = ?').bind(p.slug).first();
  if (exists) return bad('Slug sudah dipakai berita lain');

  await context.env.DB.prepare(
    'INSERT INTO posts (slug, title, "desc", kategori, pub_date, body, status, cover) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
  )
    .bind(p.slug, p.title, p.desc, p.kategori, p.pub_date, p.body, p.status, p.cover)
    .run();

  return json({ ok: true, slug: p.slug }, 201);
};
