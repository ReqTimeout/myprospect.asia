type Env = { DB: D1Database };

export const onRequestPost = async (context: { request: Request; env: Env }): Promise<Response> => {
  const { request, env } = context;
  let slug = 'unknown';
  try {
    const body = (await request.json()) as { slug?: unknown };
    slug = String(body.slug ?? 'unknown').slice(0, 80);
  } catch {
    slug = 'unknown';
  }
  await env.DB.prepare('INSERT INTO wa_clicks (slug) VALUES (?)').bind(slug).run();
  return new Response(null, { status: 204 });
};
