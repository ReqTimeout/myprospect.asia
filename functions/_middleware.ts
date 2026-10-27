import { isAdmin } from './_lib/auth';

const PUBLIC_ADMIN = ['/admin/login', '/api/admin/login'];

export const onRequest: PagesFunction = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname;
  const norm = path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path;

  const needsAuth =
    (norm.startsWith('/admin') || norm.startsWith('/api/admin')) && !PUBLIC_ADMIN.includes(norm);

  if (needsAuth) {
    const secret = (env as { ADMIN_SESSION_SECRET?: string }).ADMIN_SESSION_SECRET;
    if (!secret) {
      return new Response('Admin belum dikonfigurasi (ADMIN_SESSION_SECRET belum di-set).', { status: 503 });
    }
    const ok = await isAdmin(request, secret);
    if (!ok) {
      if (norm.startsWith('/api/')) {
        return new Response('Unauthorized', { status: 401 });
      }
      return Response.redirect(new URL('/admin/login/', url.origin).href, 302);
    }
  }

  return context.next();
};
