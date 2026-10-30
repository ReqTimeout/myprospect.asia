import { isAdmin } from './_lib/auth';

const PUBLIC_ADMIN = ['/admin/login', '/api/admin/login'];

// Host kanonik satu pintu: canonical, og:url, dan sitemap semuanya memakai apex.
// Diletakkan sebelum cek admin supaya halaman /admin di www ikut dipindah,
// bukan minta login lebih dulu di host yang salah.
const APEX = 'myprospect.asia';

export const onRequest: PagesFunction = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname;
  const norm = path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path;

  if (url.hostname === `www.${APEX}`) {
    url.hostname = APEX;
    url.protocol = 'https:';
    return Response.redirect(url.toString(), 301);
  }

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
