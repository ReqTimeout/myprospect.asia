type Env = { DB: D1Database };

function classifyDevice(ua: string): string {
  if (/curl|wget|python-requests|okhttp|httpie|go-http-client|libwww|scanner|feedfetcher/i.test(ua)) return 'bot';
  if (/ipad|tablet|sm-[tg]|gt-[pP]|nexus 7|playbook/i.test(ua)) return 'tablet';
  if (/android|iphone|ipod|mobi|windows phone|blackberry|opera mini/i.test(ua)) return 'mobile';
  if (!ua || ua === 'unknown') return 'unknown';
  return 'desktop';
}

// Host pengarah, dibatasi domain sendiri -> '' supaya trafik internal tidak dihitung
// sebagai sumber eksternal. 'direct' dipakai saat header Referer kosong.
function refDomain(referrer: string, ownHost: string): string {
  if (!referrer) return 'direct';
  try {
    const u = new URL(referrer);
    const h = u.hostname.replace(/^www\./, '').toLowerCase();
    if (!h || h === ownHost || h.endsWith('.pages.dev')) return '';
    return h.slice(0, 60);
  } catch {
    return '';
  }
}

async function visitorSeed(request: Request, day: string): Promise<string> {
  const ip = request.headers.get('cf-connecting-ip') ?? request.headers.get('x-forwarded-for') ?? '0';
  const ua = request.headers.get('user-agent') ?? '';
  const data = new TextEncoder().encode(`${day}|${ip}|${ua}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
}

export const onRequestPost = async (context: {
  request: Request;
  env: Env;
}): Promise<Response> => {
  const { request, env } = context;

  let path = '';
  try {
    const body = (await request.json()) as { p?: unknown };
    path = String(body.p ?? '');
  } catch {
    path = '';
  }

  path = path.split('?')[0].split('#')[0];
  if (!path.startsWith('/')) return new Response(null, { status: 204 });
  path = path.slice(0, 120);

  // Panel admin tidak diminati sebagai trafik publik; aset & API juga dibuang.
  if (/^\/(admin|api|_astro|cdn-cgi)/.test(path)) return new Response(null, { status: 204 });

  const now = new Date();
  // Hari kalender dalam WIB, supaya label grafik cocok dengan pengunread Indonesia.
  const day = new Date(now.getTime() + 7 * 3600_000).toISOString().slice(0, 10);
  const ownHost = new URL(request.url).hostname.replace(/^www\./, '').toLowerCase();

  try {
    const visitor = await visitorSeed(request, day);
    await env.DB.prepare(
      'INSERT INTO pageviews (path, ref_domain, device, visitor, ts) VALUES (?, ?, ?, ?, ?)',
    )
      .bind(
        path,
        refDomain(request.headers.get('referer') ?? '', ownHost),
        classifyDevice(request.headers.get('user-agent') ?? ''),
        visitor,
        now.toISOString().slice(0, 19).replace('T', ' '),
      )
      .run();
  } catch {
    // beacon tidak boleh jadi penyebab error di sisi visitor
  }

  return new Response(null, {
    status: 204,
    headers: { 'Cache-Control': 'no-store' },
  });
};
