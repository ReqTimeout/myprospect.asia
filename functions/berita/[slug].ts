import { marked } from 'marked';
import { getSettings } from '../api/settings';
import { waLink } from '../../src/lib/wa';

type Env = { DB: D1Database; ASSETS?: { fetch: (req: Request | URL) => Promise<Response> } };

type PostRow = {
  slug: string;
  title: string;
  desc: string;
  kategori: string;
  pub_date: string;
  body: string;
  status: string;
};

const esc = (s: string): string =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const fmtDate = (iso: string): string => {
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(d);
};

const notFound = (): Response =>
  new Response(
    `<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Berita tidak ditemukan — Prospect Asia</title><style>body{background:#0a0a0a;color:#f7f5f2;font-family:system-ui,sans-serif;display:grid;place-items:center;min-height:100vh;margin:0;text-align:center;padding:24px}a{color:#e6a817;font-weight:700;text-decoration:none}</style></head><body><div><p style="font-size:48px;margin:0">404</p><p>Berita ini tidak ada atau sudah dicabut.</p><a href="/berita/">← Semua berita</a></div></body></html>`,
    { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
  );

const page = (opts: {
  post: PostRow;
  related: { slug: string; title: string; kategori: string }[];
  waUrl: string;
  ga4: string;
}): string => {
  const { post, related, waUrl, ga4 } = opts;
  const htmlBody = marked.parse(post.body, { async: false }) as string;
  const canonical = `https://myprospect.asia/berita/${post.slug}`;
  const schema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: post.title,
    description: post.desc,
    datePublished: `${post.pub_date}T00:00:00Z`,
    inLanguage: 'id',
    author: { '@type': 'Organization', name: 'Prospect Asia' },
    publisher: {
      '@type': 'Organization',
      name: 'Prospect Asia',
      logo: { '@type': 'ImageObject', url: 'https://myprospect.asia/favicon.png' },
    },
    mainEntityOfPage: canonical,
  }).replace(/</g, '\\u003c');

  const ga = /^G-[A-Z0-9]{6,20}$/.test(ga4)
    ? `<script>window.dataLayer=window.dataLayer||[];window.gtag=function(){dataLayer.push(arguments)};window.gtag('js',new Date());window.gtag('config','${ga4}');</script><script async src="https://www.googletagmanager.com/gtag/js?id=${ga4}"></script>`
    : '';

  const relatedHtml =
    related.length > 0
      ? `<section class="wrap"><h2 class="h2">Baca juga</h2><div class="grid2">${related
          .map(
            (r) =>
              `<a class="card" href="/berita/${esc(r.slug)}"><p class="chip-mini">${esc(r.kategori)}</p><p class="card-t">${esc(r.title)}</p></a>`,
          )
          .join('')}</div></section>`
      : '';

  return `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(post.title)} — Prospect Asia</title>
<meta name="description" content="${esc(post.desc)}">
<link rel="canonical" href="${canonical}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="Prospect Asia">
<meta property="og:title" content="${esc(post.title)}">
<meta property="og:description" content="${esc(post.desc)}">
<meta property="og:url" content="${canonical}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
<script type="application/ld+json">${schema}</script>
${ga}
<style>
:root{--ink:#0a0a0a;--ink2:#141414;--bone:#f7f5f2;--brand:#c8232b;--brand-dark:#9e1b22;--gold:#e6a817;--display:"Anton",sans-serif;--sans:"Plus Jakarta Sans",system-ui,sans-serif}
*{box-sizing:border-box}
body{margin:0;background:var(--ink);color:var(--bone);font-family:var(--sans);-webkit-font-smoothing:antialiased}
a{color:inherit;text-decoration:none}
.hdr{position:sticky;top:0;z-index:20;background:rgba(10,10,10,.88);backdrop-filter:blur(12px);border-bottom:1px solid rgba(247,245,242,.1)}
.hdr .wrap{max-width:72rem;margin:0 auto;display:flex;align-items:center;justify-content:space-between;padding:14px 16px}
.logo{font-family:var(--display);font-size:20px;letter-spacing:.04em;text-transform:uppercase}
.logo i{color:var(--brand);font-style:normal}
.nav-a{font-size:13px;font-weight:700;color:var(--gold)}
.wrap{max-width:48rem;margin:0 auto;padding:0 16px}
main{padding-top:8px}
.back{display:inline-block;padding:14px 0;font-size:14px;font-weight:700;color:var(--gold)}
.back:hover{text-decoration:underline}
.meta{display:flex;align-items:center;gap:12px;font-size:12px;color:rgba(247,245,242,.5);margin-top:8px}
.chip{border:1px solid rgba(230,168,23,.4);background:rgba(230,168,23,.1);color:var(--gold);border-radius:999px;padding:4px 12px;font-size:11px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}
h1{font-family:var(--display);font-size:clamp(34px,7vw,52px);line-height:1.02;text-transform:none;margin:16px 0 0;font-weight:400}
.lede{font-size:16px;line-height:1.7;color:rgba(247,245,242,.7);margin:16px 0 0}
.prose{margin-top:40px;font-size:16px;line-height:1.75;color:rgba(247,245,242,.8)}
.prose>*+*{margin-top:1.1em}
.prose h2{font-family:var(--display);font-size:28px;text-transform:uppercase;color:var(--bone);margin:2.2em 0 .5em;font-weight:400}
.prose h3{font-size:18px;font-weight:800;color:var(--bone);margin:1.8em 0 .4em}
.prose p{margin:0 0 1.1rem}
.prose strong{color:var(--bone)}
.prose a{color:var(--gold);text-decoration:underline;text-underline-offset:3px}
.prose ul{list-style:none;padding:0;margin:1.4rem 0}
.prose ul li{position:relative;padding-left:1.6rem;margin-bottom:.6rem}
.prose ul li::before{content:"✓";position:absolute;left:0;color:var(--gold)}
.prose ol{padding-left:1.5rem;margin:1.4rem 0}
.prose ol li{margin-bottom:.6rem}
.prose ol li::marker{color:var(--gold)}
.prose blockquote{border-left:3px solid var(--gold);background:rgba(255,255,255,.04);border-radius:0 16px 16px 0;padding:16px 20px;margin:1.75rem 0;font-style:italic;color:rgba(247,245,242,.88)}
.cta-box{margin-top:40px;border:1px solid rgba(230,168,23,.3);background:rgba(230,168,23,.05);border-radius:24px;padding:24px;text-align:center;font-size:14px;color:rgba(247,245,242,.75)}
.btn{display:inline-block;margin-top:12px;background:var(--brand);color:#fff;border-radius:16px;padding:13px 24px;font-size:14px;font-weight:700;transition:background .15s}
.btn:hover{background:var(--brand-dark)}
section.wrap{margin-top:40px;padding-bottom:48px}
.h2{font-family:var(--display);font-size:26px;margin:0 0 20px;font-weight:400}
.grid2{display:grid;gap:16px;grid-template-columns:1fr}
@media(min-width:640px){.grid2{grid-template-columns:1fr 1fr}}
.card{background:var(--ink2);border:1px solid rgba(247,245,242,.1);border-radius:24px;padding:20px;transition:.2s;display:block}
.card:hover{transform:translateY(-3px);border-color:rgba(230,168,23,.5)}
.chip-mini{font-size:10px;font-weight:900;letter-spacing:.1em;color:var(--gold);text-transform:uppercase;margin:0}
.card-t{font-size:14px;font-weight:700;line-height:1.35;margin:8px 0 0}
footer{border-top:1px solid rgba(247,245,242,.1);padding:24px 16px;text-align:center;font-size:12px;color:rgba(247,245,242,.45)}
footer a{color:var(--gold);font-weight:700}
.wa{position:fixed;right:16px;bottom:16px;z-index:30;background:var(--brand);color:#fff;border-radius:999px;padding:12px 18px;font-size:13px;font-weight:800;box-shadow:0 8px 30px rgba(200,35,43,.45)}
.wa:hover{background:var(--brand-dark)}
</style>
</head>
<body>
<header class="hdr"><div class="wrap"><a class="logo" href="/">PROSPECT<i>·</i>ASIA</a><a class="nav-a" href="/berita/">Semua berita →</a></div></header>
<main>
  <div class="wrap">
    <a class="back" href="/berita/">← Semua berita</a>
    <div class="meta"><span class="chip">${esc(post.kategori)}</span><time datetime="${esc(post.pub_date)}">${fmtDate(post.pub_date)}</time></div>
    <h1>${esc(post.title)}</h1>
    <p class="lede">${esc(post.desc)}</p>
    <div class="prose">${htmlBody}</div>
    <div class="cta-box">Mau atletmu tampil seperti ini?<br><a class="btn" href="${waUrl}" target="_blank" rel="noopener noreferrer" data-wa-cta="berita-detail">Chat admin via WhatsApp ↗</a></div>
  </div>
  ${relatedHtml}
</main>
<footer>© 2026 Prospect Asia — PT Kita Berani Bicara · <a href="/">Beranda</a> · <a href="/faq/">FAQ</a></footer>
<a class="wa" href="${waUrl}" target="_blank" rel="noopener noreferrer" data-wa-cta="berita-detail-float">Chat WhatsApp ↗</a>
</body>
</html>`;
};

export const onRequestGet = async (context: {
  params: { slug?: string };
  request: Request;
  env: Env;
}): Promise<Response> => {
  const slug = context.params.slug;

  if (!slug) {
    if (context.env.ASSETS) {
      try {
        return await context.env.ASSETS.fetch(context.request);
      } catch {
        return Response.redirect(new URL('/berita/', context.request.url), 302);
      }
    }
    return Response.redirect(new URL('/berita/', context.request.url), 302);
  }

  const post = await context.env.DB.prepare(
    'SELECT slug, title, "desc" AS "desc", kategori, pub_date, body, status FROM posts WHERE slug = ?',
  )
    .bind(slug)
    .first<PostRow>();

  if (!post || post.status !== 'published') return notFound();

  const [relatedRes, settings] = await Promise.all([
    context.env.DB.prepare(
      `SELECT slug, title, kategori FROM posts WHERE status = 'published' AND slug != ? ORDER BY pub_date DESC, slug DESC LIMIT 2`,
    )
      .bind(slug)
      .all<{ slug: string; title: string; kategori: string }>(),
    getSettings(context.env),
  ]);

  const waUrl = waLink({ program: post.title, source: 'berita-detail', number: settings.wa_number });

  return new Response(
    page({ post, related: relatedRes.results ?? [], waUrl, ga4: settings.ga4_id ?? '' }),
    {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=60' },
    },
  );
};
