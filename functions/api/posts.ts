type Env = { DB: D1Database };

export const onRequestGet = async (context: { env: Env }): Promise<Response> => {
  const rows = await context.env.DB.prepare(
    `SELECT slug, title, "desc" AS "desc", kategori, pub_date, status
     FROM posts WHERE status = 'published' ORDER BY pub_date DESC, slug DESC LIMIT 100`,
  ).all();

  return new Response(JSON.stringify(rows.results ?? []), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=30' },
  });
};
