import { signSession, cookieHeader } from '../../_lib/auth';

type Env = { ADMIN_PASSWORD?: string; ADMIN_SESSION_SECRET?: string };

export const onRequestPost = async (context: { request: Request; env: Env }): Promise<Response> => {
  const { request, env } = context;
  const password = env.ADMIN_PASSWORD;
  const secret = env.ADMIN_SESSION_SECRET;

  if (!password || !secret) {
    return new Response('Login belum dikonfigurasi (set secret ADMIN_PASSWORD & ADMIN_SESSION_SECRET).', {
      status: 503,
    });
  }

  let input = '';
  try {
    const body = (await request.json()) as { password?: unknown };
    input = String(body.password ?? '');
  } catch {
    return new Response('Bad request', { status: 400 });
  }

  if (input.length < 1 || input !== password) {
    return new Response('Password salah.', { status: 401 });
  }

  const session = await signSession(secret, 60 * 60 * 24 * 7);
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': cookieHeader(session.value, session.maxAge),
    },
  });
};
