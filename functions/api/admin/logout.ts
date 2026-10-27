import { clearCookieHeader } from '../../_lib/auth';

export const onRequestPost = async (): Promise<Response> => {
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Set-Cookie': clearCookieHeader() },
  });
};
