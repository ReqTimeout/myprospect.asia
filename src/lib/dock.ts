import { WA_ICON } from './whatsapp';

/**
 * Dock mobile — SATU sumber kebenaran.
 *
 * Dock dipakai di dua tempat yang berbeda teknologinya:
 *  1. `components/islands/Dock.svelte`  -> halaman Astro (punya state & scroll-hide)
 *  2. `functions/berita/[slug].ts`      -> template HTML mandiri di Pages Function
 *
 * Selama markup-nya ditulis dua kali, hasilnya pasti bergeser (dan itu sudah
 * terjadi: dock single post kehilangan item Workshop). Jadi data + ikon +
 * markup dibangun dari modul ini, dan sisi Svelte tinggal menambah reaktivitas.
 */

/** Isi <svg> untuk tiap ikon. Path diambil apa adanya dari lucide (ISC) supaya
 *  render di Svelte dan di template Function identik piksel per piksel. */
export const DOCK_ICONS = {
  home:
    '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  grid:
    '<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>',
  presentation:
    '<path d="M2 3h20"/><path d="M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3"/><path d="m7 21 5-5 5 5"/>',
  news:
    '<path d="M15 18h-5"/><path d="M18 14h-8"/><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-4 0v-9a2 2 0 0 1 2-2h2"/><rect width="8" height="4" x="10" y="6" rx="1"/>',
} as const;

export type DockItem = {
  id: string;
  label: string;
  href: string;
  /** Isi <svg>: path/rect dengan stroke, atau path filled untuk glif merek. */
  icon: string;
  /** Glif merek (WhatsApp) digambar filled, bukan stroke. */
  filled?: boolean;
  /** Item khusus WhatsApp: petak hijau, target blank, terhitung CTA. */
  wa?: boolean;
};

/** Urutan & label harus sama persis di semua halaman, termasuk single post. */
export const DOCK_ITEMS: DockItem[] = [
  { id: 'home', label: 'Home', href: '/', icon: DOCK_ICONS.home },
  { id: 'program', label: 'Program', href: '/#program', icon: DOCK_ICONS.grid },
  { id: 'workshop', label: 'Workshop', href: '/#workshop', icon: DOCK_ICONS.presentation },
  { id: 'berita', label: 'Berita', href: '/berita', icon: DOCK_ICONS.news },
  { id: 'chat', label: 'Chat', href: '', icon: WA_ICON, filled: true, wa: true },
];

/** Peta awalan path -> id item aktif. Halaman yang tidak terdaftar memang tidak
 *  punya item aktif (mis. /faq dan /tentang bukan bagian dock). */
export const DOCK_ACTIVE_BY_PATH: [string, string][] = [
  ['/berita', 'berita'],
  ['/program', 'program'],
  ['/workshop', 'workshop'],
];

export function dockActiveFor(pathname: string): string {
  const clean = pathname.replace(/\/+$/, '') || '/';
  if (clean === '/') return 'home';
  for (const [prefix, id] of DOCK_ACTIVE_BY_PATH) {
    if (clean === prefix || clean.startsWith(prefix + '/')) return id;
  }
  return '';
}

const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Bingkai <svg> — stroke untuk ikon lucide, filled untuk glif merek. */
export function dockSvg(item: DockItem, active: boolean): string {
  const size = item.filled ? 22 : 21;
  const body = item.filled
    ? `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" aria-hidden="true">${item.icon}</svg>`
    : `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="${active ? 2.4 : 1.8}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${item.icon}</svg>`;
  return body;
}

/**
 * Markup dock lengkap untuk template HTML mandiri (Pages Function).
 * Kelasnya (`dock`, `dock-in`, `dock-item`, `dock-ico`, `dock-lbl`, `dock-wa`)
 * dicocokkan dengan CSS di dalam file Function itu, dan nilai visualnya
 * disamakan dengan utility Tailwind yang dipakai Dock.svelte.
 */
export function dockMarkup(opts: { waUrl: string; active?: string; source?: string }): string {
  const { waUrl, active = '', source = 'berita-dock' } = opts;
  const items = DOCK_ITEMS.map((item) => {
    const on = !!active && item.id === active && !item.wa;
    if (item.wa) {
      return `    <a class="dock-item" href="${esc(waUrl)}" target="_blank" rel="noopener noreferrer" data-wa-cta="${esc(source)}" aria-label="Chat WhatsApp admin">
      <span class="dock-ico dock-wa">${dockSvg(item, false)}</span>
      <span class="dock-lbl dock-lbl--wa">${esc(item.label)}</span>
    </a>`;
    }
    return `    <a class="dock-item" href="${esc(item.href)}" data-dock="${esc(item.id)}"${on ? ' aria-current="page"' : ''} aria-label="${esc(item.label)}">
      <span class="dock-ico"${on ? ' data-on="1"' : ''}>${dockSvg(item, on)}</span>
      <span class="dock-lbl"${on ? ' data-on="1"' : ''}>${esc(item.label)}</span>
    </a>`;
  }).join('\n');

  return `<nav class="dock" aria-label="Navigasi utama">
  <div class="dock-in">
${items}
  </div>
</nav>`;
}

/** CSS dock untuk template Function — cermin dari kelas Tailwind di Dock.svelte. */
export const DOCK_CSS = `
/* ---- Dock mobile (identik dengan Dock.svelte di situs Astro) ---- */
.dock{position:fixed;left:0;right:0;bottom:0;z-index:50;display:flex;justify-content:center;pointer-events:none;padding:0 12px calc(0.75rem + env(safe-area-inset-bottom))}
@media(min-width:1024px){.dock{display:none}}
.dock-in{display:flex;width:100%;max-width:28rem;align-items:stretch;gap:4px;pointer-events:auto;background:rgba(255,252,247,.85);border:1px solid rgba(36,26,18,.1);border-radius:24px;padding:8px;box-shadow:0 18px 40px -12px rgba(36,26,18,.28);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);transition:transform .3s ease-out}
.dock.is-hidden .dock-in{transform:translateY(130%)}
.dock-item{display:flex;min-width:0;flex:1 1 0;flex-direction:column;align-items:center;gap:4px;padding:6px 4px;border-radius:16px;text-decoration:none;color:rgba(36,26,18,.55);transition:color .2s,background-color .2s}
.dock-item[aria-current="page"]{color:var(--brand-dark)}
.dock-ico{display:grid;width:40px;height:40px;place-items:center;border-radius:16px;transition:transform .3s ease}
.dock-item[aria-current="page"] .dock-ico{background:rgba(255,122,26,.1);transform:translateY(-2px) scale(1.1)}
.dock-lbl{font-size:9px;line-height:1;font-weight:600;letter-spacing:-.01em;white-space:nowrap}
.dock-wa{background:#25d366;color:var(--ink);box-shadow:0 8px 18px -8px rgba(37,211,102,.9)}
.dock-wa svg{width:22px;height:22px}
.dock-lbl--wa{color:rgba(36,26,18,.7)}
`;

/** Scroll-hide dock — perilaku yang sama dengan onMount() di Dock.svelte. */
export const DOCK_JS = `
(function () {
  var nav = document.querySelector('.dock');
  if (!nav) return;
  var inner = nav.querySelector('.dock-in');
  if (!inner) return;
  var lastY = window.scrollY, ticking = false, hidden = false;
  function set(v) { if (hidden !== v) { hidden = v; nav.classList.toggle('is-hidden', v); } }
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var y = window.scrollY, dy = y - lastY;
      if (y < 120) set(false);
      else if (dy > 14) set(true);
      else if (dy < -14) set(false);
      lastY = y;
      ticking = false;
    });
  }, { passive: true });
})();
`;
