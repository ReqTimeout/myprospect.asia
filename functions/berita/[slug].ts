import { marked } from 'marked';
import { getSettings } from '../api/settings';
import { waLink } from '../../src/lib/wa';
import { programs, formatIdr } from '../../src/data/programs';
import { categoryStyle } from '../../src/data/categories';
import { SITE as SITE_CFG } from '../../src/data/site';

type Env = { DB: D1Database; ASSETS?: { fetch: (req: Request | URL) => Promise<Response> } };

type PostRow = {
  slug: string;
  title: string;
  desc: string;
  kategori: string;
  pub_date: string;
  body: string;
  status: string;
  cover: string;
};

// Cover per kategori sebagai cadangan kalau admin belum mengisi kolom cover.
const COVER_FALLBACK: Record<string, string> = {
  Kolaborasi: '/media/workshop-crowd.jpg',
  Bintang: '/media/hero-athletes.jpg',
  Berita: '/media/interview-zone.jpg',
};

const SITE = SITE_CFG.url;

const NAV = [
  { href: '/#program', label: 'Program' },
  { href: '/#workshop', label: 'Workshop' },
  { href: '/berita/', label: 'Berita' },
  { href: '/tentang/', label: 'Tentang' },
  { href: '/faq/', label: 'FAQ' },
];

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

const safeCover = (raw: string | undefined, kategori: string): string => {
  const s = (raw ?? '').trim();
  if (/^\/media\/[A-Za-z0-9._-]+$/.test(s)) return s;
  return COVER_FALLBACK[kategori] ?? '/media/interview-zone.jpg';
};

const notFound = (): Response =>
  new Response(
    `<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Berita tidak ditemukan — Prospect Asia</title><style>body{background:#fffcf7;color:#241a12;font-family:system-ui,sans-serif;display:grid;place-items:center;min-height:100vh;margin:0;text-align:center;padding:24px}a{color:#bc4c00;font-weight:700;text-decoration:none}</style></head><body><div><p style="font-size:48px;margin:0">404</p><p>Berita ini tidak ada atau sudah dicabut.</p><a href="/berita/">← Semua berita</a></div></body></html>`,
    { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
  );

const page = (opts: {
  post: PostRow;
  related: { slug: string; title: string; kategori: string }[];
  waUrl: string;
  waNumber: string;
  ga4: string;
}): string => {
  const { post, related, waUrl, waNumber, ga4 } = opts;
  const htmlBody = marked.parse(post.body, { async: false }) as string;
  const canonical = `${SITE}/berita/${post.slug}`;
  const cover = safeCover(post.cover, post.kategori);
  const coverAbs = `${SITE}${cover}`;
  const cat = categoryStyle(post.kategori);

  const schema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: post.title,
    description: post.desc,
    datePublished: `${post.pub_date}T00:00:00Z`,
    inLanguage: 'id',
    articleSection: post.kategori,
    author: { '@type': 'Organization', name: 'Prospect Asia' },
    publisher: {
      '@type': 'Organization',
      name: 'Prospect Asia',
      logo: { '@type': 'ImageObject', url: `${SITE}/favicon.png` },
    },
    image: coverAbs,
    mainEntityOfPage: canonical,
  }).replace(/</g, '\\u003c');

  const ga = /^G-[A-Z0-9]{6,20}$/.test(ga4)
    ? `<script>window.dataLayer=window.dataLayer||[];window.gtag=function(){dataLayer.push(arguments)};window.gtag('js',new Date());window.gtag('config','${ga4}');</script><script async src="https://www.googletagmanager.com/gtag/js?id=${ga4}"></script>`
    : '';

  // Di runtime Workers, Date.now() = 0 di module scope -> tahun harus dihitung saat request.
  const year = new Date().getFullYear();

  const navHtml = NAV.map(
    (n) =>
      `<a href="${n.href}"${n.label === 'Berita' ? ' aria-current="page"' : ''}>${n.label}</a>`,
  ).join('');

  // Kartu paket diambil dari data program asli — harga & benefits tidak dikarang.
  const pkgCards = programs
    .map((p, i) => {
      const wa = waLink({ program: p.nama, source: 'berita-detail-paket', number: waNumber });
      const coret = p.hargaCoret ? `<s>Rp${formatIdr(p.hargaCoret)}</s>` : '';
      return `<li class="pkg-card">
            ${i === 0 ? '<span class="pkg-flag">Paling hemat</span>' : ''}
            <p class="pkg-name"><a href="/program/${p.slug}">${esc(p.nama)}</a></p>
            <p class="pkg-tags">
              ${p.badge ? `<span class="pkg-badge">${esc(p.badge)}</span>` : ''}
              ${p.online ? '<span class="pkg-live"><i></i>Online</span>' : ''}
            </p>
            <p class="pkg-sub">${esc(p.sub)}</p>
            <p class="pkg-price">${coret}<strong>Rp${formatIdr(p.harga)}</strong></p>
            <p class="pkg-unit">${esc(p.satuan)}</p>
            <a class="pkg-cta" href="${esc(wa)}" target="_blank" rel="noopener noreferrer" data-wa-cta="berita-detail-paket">Ambil paket ini →</a>
          </li>`;
    })
    .join('');

  const relatedHtml =
    related.length > 0
      ? `<section class="wrap post-rel"><h2 class="rel-h">Baca juga</h2><div class="rel-grid">${related
          .map((r) => {
            const rc = categoryStyle(r.kategori);
            return `<a class="rel-card" href="/berita/${esc(r.slug)}">
              <span class="rel-chip" style="background:${rc.wash};color:${rc.text};border-color:${rc.border}"><i style="background:${rc.dot}"></i>${esc(r.kategori)}</span>
              <p class="rel-t">${esc(r.title)}</p>
            </a>`;
          })
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
<meta property="og:image" content="${esc(coverAbs)}">
<meta property="og:image:alt" content="${esc(post.title)}">
<meta property="article:published_time" content="${esc(post.pub_date)}">
<meta property="article:section" content="${esc(post.kategori)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(post.title)}">
<meta name="twitter:description" content="${esc(post.desc)}">
<meta name="twitter:image" content="${esc(coverAbs)}">
<link rel="icon" href="/favicon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
<script type="application/ld+json">${schema}</script>
${ga}
<style>
:root{--ink:#241a12;--paper:#fffcf7;--paper-deep:#fff3e4;--brand:#ff7a1a;--brand-dark:#bc4c00;--gold:#ffc32e;--crimson:#c8232b;--display:"Anton",sans-serif;--sans:"Plus Jakarta Sans",system-ui,sans-serif;--container:72rem}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--paper);color:var(--ink);font-family:var(--sans);-webkit-font-smoothing:antialiased;background-image:radial-gradient(circle at 88% -6%,rgba(255,122,26,.16),transparent 52%),radial-gradient(circle at -4% 18%,rgba(255,195,46,.14),transparent 42%)}
a{color:inherit;text-decoration:none}
img{max-width:100%}
.wrap{max-width:var(--container);margin:0 auto;padding:0 16px}
@media(min-width:640px){.wrap{padding:0 24px}}

/* ---- Header: sama dengan situs utama (logo + menu + CTA), plus baris menu pill untuk mobile ---- */
.hdr{position:sticky;top:0;z-index:40;background:rgba(255,252,247,.88);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border-bottom:1px solid rgba(36,26,18,.08)}
.hdr-in{max-width:var(--container);margin:0 auto;display:flex;align-items:center;justify-content:center;gap:12px;min-height:56px;padding:8px 16px}
@media(min-width:640px){.hdr-in{justify-content:space-between;padding:8px 24px}}
.hdr-logo img{display:block;height:24px;width:auto}
.hdr-nav{display:none}
@media(min-width:1024px){.hdr-nav{display:flex;align-items:center;gap:24px}}
.hdr-nav a{position:relative;font-size:14px;font-weight:600;color:rgba(36,26,18,.72);padding:8px 0;transition:color .2s}
.hdr-nav a::after{content:"";position:absolute;left:0;right:0;bottom:2px;height:2px;border-radius:99px;background:linear-gradient(90deg,var(--brand),var(--gold));transform:scaleX(0);transform-origin:left;transition:transform .3s}
.hdr-nav a:hover,.hdr-nav a[aria-current]{color:var(--ink)}
.hdr-nav a:hover::after,.hdr-nav a[aria-current]::after{transform:scaleX(1)}
.hdr-wa{display:none}
@media(min-width:640px){.hdr-wa{display:inline-block;background:var(--brand);color:var(--ink);font-size:12px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;padding:10px 16px;border-radius:12px;box-shadow:0 10px 24px -10px rgba(255,122,26,.55);transition:background .15s,transform .2s}}
.hdr-wa:hover{background:var(--brand-dark);transform:translateY(-1px)}
.hdr-mnav{border-top:1px solid rgba(36,26,18,.06)}
@media(min-width:1024px){.hdr-mnav{display:none}}
.hdr-mnav ul{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;-ms-overflow-style:none;max-width:var(--container);margin:0 auto;padding:8px 16px}
.hdr-mnav ul::-webkit-scrollbar{display:none}
.hdr-mnav a{flex:0 0 auto;font-size:12px;font-weight:700;color:rgba(36,26,18,.66);background:rgba(36,26,18,.05);border-radius:999px;padding:6px 13px;white-space:nowrap;transition:background .2s,color .2s}
.hdr-mnav a:hover,.hdr-mnav a[aria-current]{background:var(--brand);color:var(--ink)}

/* ---- Kepala artikel ---- */
.post-head{padding-top:14px}
.back{display:inline-flex;align-items:center;gap:6px;font-size:13px;font-weight:700;color:var(--brand-dark);padding:10px 0}
.back:hover{text-decoration:underline}
.hero{position:relative;margin:8px 0 18px;border-radius:24px;overflow:hidden;background:var(--paper-deep);box-shadow:0 22px 50px -28px rgba(36,26,18,.45)}
.hero img{display:block;width:100%;height:auto;aspect-ratio:16/9;object-fit:cover}
.hero::after{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(to top,rgba(36,26,18,.58),rgba(36,26,18,0) 60%)}
.hero figcaption{position:absolute;left:14px;bottom:12px;z-index:1;display:inline-flex;align-items:center;gap:8px;font-size:11px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.95);text-shadow:0 2px 8px rgba(0,0,0,.55)}
.hero figcaption i{width:8px;height:8px;border-radius:99px;display:block;box-shadow:0 0 0 3px rgba(255,255,255,.22)}
.meta{display:flex;align-items:center;gap:12px;flex-wrap:wrap;font-size:12px;color:rgba(36,26,18,.68)}
.chip{display:inline-flex;align-items:center;gap:6px;border:1px solid transparent;border-radius:999px;padding:5px 12px;font-size:11px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}
.chip i{width:7px;height:7px;border-radius:99px;display:block;flex:0 0 auto}
h1{font-family:var(--display);font-size:clamp(32px,7vw,54px);line-height:1.02;margin:14px 0 0;font-weight:400;background:linear-gradient(92deg,var(--ink) 55%,var(--brand));-webkit-background-clip:text;background-clip:text;color:transparent}
.lede{font-size:16px;line-height:1.7;color:rgba(36,26,18,.72);margin:14px 0 0;max-width:46rem}

/* ---- Grid: artikel + sidebar paket ---- */
.post-grid{display:grid;gap:26px;grid-template-columns:minmax(0,1fr);margin-top:26px}
@media(min-width:1024px){.post-grid{grid-template-columns:minmax(0,1fr) 330px;gap:34px 44px;align-items:start;margin-top:34px}}
.post-side{display:flex;flex-direction:column;gap:14px}
@media(min-width:1024px){.post-main{grid-column:1;grid-row:1}.post-side{grid-column:2;grid-row:1;position:sticky;top:76px}}

/* ---- Sidebar paket program ---- */
.pkg{background:#fff;border:1px solid rgba(36,26,18,.09);border-radius:24px;padding:16px;box-shadow:0 14px 34px -22px rgba(36,26,18,.28)}
.pkg-eyebrow{margin:0;font-size:10px;font-weight:900;letter-spacing:.2em;text-transform:uppercase;color:var(--brand-dark)}
.pkg-title{font-family:var(--display);font-size:21px;line-height:1.05;margin:4px 0 0;font-weight:400}
.pkg-note{margin:6px 0 0;font-size:12px;line-height:1.5;color:rgba(36,26,18,.68)}
.pkg-list{display:flex;gap:12px;overflow-x:auto;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;list-style:none;margin:0;padding:14px 2px 6px}
.pkg-list::-webkit-scrollbar{height:4px}
.pkg-list::-webkit-scrollbar-thumb{background:rgba(36,26,18,.16);border-radius:99px}
@media(min-width:1024px){.pkg-list{display:grid;grid-template-columns:1fr;overflow:visible;padding:14px 0 0}}
.pkg-card{flex:0 0 84%;scroll-snap-align:start;position:relative;border:1px solid rgba(36,26,18,.1);border-radius:20px;padding:14px;background:linear-gradient(168deg,#fffdfa 0%,#fff6ea 60%,#ffeeDC 100%);color:var(--ink)}
@media(min-width:1024px){.pkg-card{flex:1 1 auto;width:auto}}
.pkg-flag{position:absolute;top:-9px;left:14px;background:var(--ink);color:var(--gold);font-size:9px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;padding:3px 9px;border-radius:999px}
.pkg-name{font-family:var(--display);font-size:18px;line-height:1.1;margin:0}
.pkg-name a:hover{color:var(--brand-dark)}
.pkg-tags{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:6px 0 0}
.pkg-badge{display:inline-block;font-size:9px;font-weight:900;letter-spacing:.12em;text-transform:uppercase;padding:3px 8px;border-radius:999px;background:var(--ink);color:var(--paper)}
.pkg-live{display:inline-flex;align-items:center;gap:5px;font-size:10px;font-weight:800;color:#1c7a3f}
.pkg-live i{width:7px;height:7px;border-radius:99px;background:#22a35a;display:block;animation:liveRing 1.8s ease-out infinite}
@keyframes liveRing{0%{box-shadow:0 0 0 0 rgba(34,163,90,.55)}70%{box-shadow:0 0 0 7px rgba(34,163,90,0)}100%{box-shadow:0 0 0 0 rgba(34,163,90,0)}}
.pkg-sub{margin:8px 0 0;font-size:11.5px;line-height:1.45;color:rgba(36,26,18,.68)}
.pkg-price{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap;margin:10px 0 0}
.pkg-price s{font-size:12px;color:rgba(36,26,18,.68)}
.pkg-price strong{font-family:var(--display);font-size:23px;line-height:1;color:var(--brand-dark)}
.pkg-unit{margin:4px 0 0;font-size:11px;color:rgba(36,26,18,.68)}
.pkg-cta{display:inline-flex;align-items:center;justify-content:center;gap:6px;margin-top:12px;width:100%;background:var(--brand);color:var(--ink);font-size:12.5px;font-weight:800;padding:11px 14px;border-radius:14px;transition:background .18s,transform .18s}
.pkg-cta:hover{background:var(--brand-dark);transform:translateY(-2px)}

/* ---- Isi artikel ---- */
.prose{font-size:16px;line-height:1.78;color:rgba(36,26,18,.84)}
.prose>*+*{margin-top:1.1em}
.prose h2{font-family:var(--display);font-size:28px;text-transform:uppercase;color:var(--ink);margin:2.2em 0 .5em;font-weight:400}
.prose h3{font-size:18px;font-weight:800;color:var(--ink);margin:1.8em 0 .4em}
.prose p{margin:0 0 1.1rem}
.prose strong{color:var(--ink)}
.prose a{color:var(--brand-dark);text-decoration:underline;text-underline-offset:3px}
.prose ul{list-style:none;padding:0;margin:1.4rem 0}
.prose ul li{position:relative;padding-left:1.6rem;margin-bottom:.6rem}
.prose ul li::before{content:"✓";position:absolute;left:0;color:var(--brand)}
.prose ol{padding-left:1.5rem;margin:1.4rem 0}
.prose ol li{margin-bottom:.6rem}
.prose ol li::marker{color:var(--brand)}
.prose blockquote{border-left:3px solid var(--brand);background:var(--paper-deep);border-radius:0 16px 16px 0;padding:16px 20px;margin:1.75rem 0;font-style:italic;color:rgba(36,26,18,.88)}
.cta-box{margin-top:40px;border:1px solid rgba(255,122,26,.3);background:rgba(255,122,26,.06);border-radius:24px;padding:24px;text-align:center;font-size:14px;color:rgba(36,26,18,.78)}
.btn{display:inline-block;margin-top:12px;background:var(--brand);color:var(--ink);border-radius:16px;padding:13px 24px;font-size:14px;font-weight:800;transition:background .15s,transform .2s}
.btn:hover{background:var(--brand-dark);transform:translateY(-2px)}

/* ---- Baca juga ---- */
.post-rel{margin-top:44px;padding-bottom:8px}
.rel-h{font-family:var(--display);font-size:26px;margin:0 0 18px;font-weight:400}
.rel-grid{display:grid;gap:14px;grid-template-columns:1fr}
@media(min-width:640px){.rel-grid{grid-template-columns:1fr 1fr}}
.rel-card{display:block;background:#fff;border:1px solid rgba(36,26,18,.09);border-radius:20px;padding:16px;box-shadow:0 14px 34px -22px rgba(36,26,18,.28);transition:transform .2s,border-color .2s}
.rel-card:hover{transform:translateY(-3px);border-color:rgba(255,122,26,.45)}
.rel-chip{display:inline-flex;align-items:center;gap:6px;border:1px solid transparent;border-radius:999px;padding:4px 10px;font-size:9.5px;font-weight:900;letter-spacing:.1em;text-transform:uppercase}
.rel-chip i{width:6px;height:6px;border-radius:99px;display:block;flex:0 0 auto}
.rel-t{font-size:14px;font-weight:700;line-height:1.35;margin:8px 0 0}

/* ---- Footer ---- */
footer{border-top:1px solid rgba(36,26,18,.09);margin-top:48px;padding:26px 16px 104px;text-align:center;font-size:12px;color:rgba(36,26,18,.5)}
footer a{color:var(--brand-dark);font-weight:700;display:inline-block;padding:6px 4px}
footer nav{display:flex;flex-wrap:wrap;gap:4px;justify-content:center;margin-bottom:6px}

/* ---- Dock mobile (paruh dengan situs utama) ---- */
.dock{position:fixed;left:0;right:0;bottom:0;z-index:45;display:flex;justify-content:center;pointer-events:none;padding:0 16px calc(0.75rem + env(safe-area-inset-bottom))}
@media(min-width:1024px){.dock{display:none}}
.dock-in{display:flex;align-items:center;gap:4px;pointer-events:auto;background:rgba(255,252,247,.92);border:1px solid rgba(36,26,18,.1);border-radius:24px;padding:7px;box-shadow:0 18px 40px -12px rgba(36,26,18,.28);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px)}
.dock a{display:flex;flex-direction:column;align-items:center;gap:2px;min-width:54px;padding:6px 8px;border-radius:16px;font-size:10px;font-weight:700;color:rgba(36,26,18,.6);transition:color .2s}
.dock a:hover{color:var(--brand-dark)}
.dock a[aria-current]{color:var(--brand-dark)}
.dock-wa{background:var(--brand);color:var(--ink)!important;margin-left:4px;box-shadow:0 10px 22px -8px rgba(255,122,26,.7)}
.dock-wa:hover{color:var(--ink)!important}
</style>
</head>
<body>
<header class="hdr">
  <div class="hdr-in">
    <a class="hdr-logo" href="/" aria-label="Prospect Asia — Beranda"><img src="/media/logo-prospect-black.png" alt="Prospect" width="1000" height="233" /></a>
    <nav class="hdr-nav" aria-label="Navigasi atas">${navHtml}</nav>
    <a class="hdr-wa" href="${esc(waUrl)}" target="_blank" rel="noopener noreferrer" data-wa-cta="berita-header">Chat WA · ${SITE_CFG.waDisplay}</a>
  </div>
  <nav class="hdr-mnav" aria-label="Navigasi mobile"><ul>${navHtml}</ul></nav>
</header>

<main>
  <section class="wrap post-head">
    <a class="back" href="/berita/">← Semua berita</a>
    <figure class="hero">
      <img src="${esc(cover)}" alt="Gambar utama: ${esc(post.title)}" width="1280" height="720" loading="eager" fetchpriority="high" decoding="async" />
      <figcaption><i style="background:${cat.dot}"></i>${esc(post.kategori)}</figcaption>
    </figure>
    <div class="meta">
      <span class="chip" style="background:${cat.wash};color:${cat.text};border-color:${cat.border}"><i style="background:${cat.dot}"></i>${esc(post.kategori)}</span>
      <time datetime="${esc(post.pub_date)}">${fmtDate(post.pub_date)}</time>
    </div>
    <h1>${esc(post.title)}</h1>
    <p class="lede">${esc(post.desc)}</p>
  </section>

  <div class="wrap post-grid">
    <aside class="post-side">
      <section class="pkg">
        <p class="pkg-eyebrow">Paket program</p>
        <h2 class="pkg-title">Pilih paket<br />sesuai kebutuhan</h2>
        <p class="pkg-note">Semua paket online, jadwal fleksibel. Urutan dari yang paling hemat.</p>
        <ul class="pkg-list">${pkgCards}</ul>
      </section>
    </aside>

    <article class="post-main">
      <div class="prose">${htmlBody}</div>
      <div class="cta-box">Mau atletmu tampil seperti ini?<br /><a class="btn" href="${esc(waUrl)}" target="_blank" rel="noopener noreferrer" data-wa-cta="berita-detail">Chat admin via WhatsApp ↗</a></div>
    </article>
  </div>

  ${relatedHtml}
</main>

<footer>
  <nav aria-label="Navigasi footer">
    <a href="/">Beranda</a><a href="/#program">Program</a><a href="/#workshop">Workshop</a><a href="/berita/">Berita</a><a href="/tentang/">Tentang</a><a href="/faq/">FAQ</a>
  </nav>
  © ${year} ${SITE_CFG.legal}. All rights reserved.
</footer>

<nav class="dock" aria-label="Navigasi utama">
  <div class="dock-in">
    <a href="/" aria-label="Beranda"><svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/></svg><span>Home</span></a>
    <a href="/#program" aria-label="Program"><svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"><rect x="3" y="3" width="7.5" height="7.5" rx="1.6"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.6"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.6"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.6"/></svg><span>Program</span></a>
    <a href="/berita/" aria-label="Berita" aria-current="page"><svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h13v14H5a1 1 0 0 1-1-1V5z"/><path d="M17 9h3v9a1 1 0 0 1-1 1h-2"/><path d="M7 9h6M7 13h6M7 17h4"/></svg><span>Berita</span></a>
    <a class="dock-wa" href="${esc(waUrl)}" target="_blank" rel="noopener noreferrer" data-wa-cta="berita-dock" aria-label="Chat WhatsApp admin"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9 9 0 0 1-3.9-.9L3 21l1.9-4.6A8.4 8.4 0 0 1 12 3.1a8.4 8.4 0 0 1 9 8.4z"/></svg><span>Chat</span></a>
  </div>
</nav>
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
    'SELECT slug, title, "desc" AS "desc", kategori, pub_date, body, status, cover FROM posts WHERE slug = ?',
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
    page({
      post,
      related: relatedRes.results ?? [],
      waUrl,
      waNumber: settings.wa_number,
      ga4: settings.ga4_id ?? '',
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=60' },
    },
  );
};
