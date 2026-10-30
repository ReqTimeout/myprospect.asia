export type ContentKind = 'testimonials' | 'faq' | 'stats';

export const KINDS: ContentKind[] = ['testimonials', 'faq', 'stats'];

export const KATEGORI = ['Berita', 'Bintang', 'Kolaborasi'] as const;
export const POST_STATUS = ['draft', 'published'] as const;
export const FAQ_GRUP = ['Umum', 'Program', 'Workshop', 'Pembayaran'] as const;

export function isKind(v: unknown): v is ContentKind {
  return typeof v === 'string' && (KINDS as string[]).includes(v);
}

export function str(v: unknown, min: number, max: number): string | null {
  if (typeof v !== 'string') return null;
  const s = v.trim();
  if (s.length < min || s.length > max) return null;
  return s;
}

export function json(res: unknown, status = 200): Response {
  return new Response(JSON.stringify(res), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function bad(msg: string): Response {
  return new Response(msg, { status: 400 });
}

export type PostInput = {
  slug: string;
  title: string;
  desc: string;
  kategori: string;
  pub_date: string;
  body: string;
  status: string;
  cover: string;
};

// Cover hanya boleh path relatif di dalam /media — mencegah URL javascript: dari input admin.
export function coverPath(v: unknown): string {
  if (typeof v !== 'string') return '';
  const s = v.trim();
  if (!s) return '';
  if (!/^\/media\/[A-Za-z0-9._-]+$/.test(s)) return '';
  return s;
}

export function parsePost(body: unknown): PostInput | string {
  const b = (body ?? {}) as Record<string, unknown>;
  const slug = str(b.slug, 3, 80);
  if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return 'slug tidak valid (huruf kecil/angka/dash)';
  const title = str(b.title, 3, 160);
  if (!title) return 'judul tidak valid (3–160 karakter)';
  const desc = str(b.desc, 10, 300);
  if (!desc) return 'deskripsi tidak valid (10–300 karakter)';
  const kategori = typeof b.kategori === 'string' && (KATEGORI as readonly string[]).includes(b.kategori) ? b.kategori : null;
  if (!kategori) return 'kategori tidak valid';
  const pub_date = typeof b.pub_date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(b.pub_date) ? b.pub_date : null;
  if (!pub_date) return 'tanggal tidak valid (YYYY-MM-DD)';
  const bodyMd = typeof b.body === 'string' ? b.body.trim() : '';
  if (bodyMd.length < 1 || bodyMd.length > 50000) return 'isi berita tidak valid';
  const status = typeof b.status === 'string' && (POST_STATUS as readonly string[]).includes(b.status) ? b.status : null;
  if (!status) return 'status tidak valid';
  return { slug, title, desc, kategori, pub_date, body: bodyMd, status, cover: coverPath(b.cover) };
}

export type ContentInput = {
  title: string;
  body: string;
  meta: Record<string, unknown>;
  sort: number;
  active: number;
};

export function parseContent(kind: string, body: unknown): ContentInput | string {
  const b = (body ?? {}) as Record<string, unknown>;
  const title = str(b.title, 1, kind === 'faq' ? 200 : 160);
  if (!title) return 'judul tidak valid';
  const bodyTxt = typeof b.body === 'string' ? b.body.trim() : '';
  const maxBody = kind === 'faq' ? 800 : kind === 'testimonials' ? 500 : 200;
  if (bodyTxt.length > maxBody) return `isi terlalu panjang (maks ${maxBody})`;
  if (kind === 'faq' && bodyTxt.length < 5) return 'jawaban terlalu pendek';

  let meta: Record<string, unknown> = {};
  if (b.meta !== undefined) {
    if (typeof b.meta === 'string') {
      try {
        const parsed = JSON.parse(b.meta);
        if (!parsed || typeof parsed !== 'object') return 'meta tidak valid';
        meta = parsed as Record<string, unknown>;
      } catch {
        return 'meta bukan JSON valid';
      }
    } else if (b.meta && typeof b.meta === 'object') {
      meta = b.meta as Record<string, unknown>;
    } else {
      return 'meta tidak valid';
    }
  }

  if (kind === 'faq') {
    const grup = str(meta.grup, 1, 40);
    if (!grup || !(FAQ_GRUP as readonly string[]).includes(grup)) return 'grup FAQ tidak valid';
    meta = { grup };
  } else if (kind === 'testimonials') {
    const asal = str(meta.asal ?? '', 1, 80);
    const olahraga = str(meta.olahraga ?? '', 1, 60);
    if (!asal || !olahraga) return 'asal & olahraga wajib diisi';
    if (bodyTxt.length < 5) return 'kutipan terlalu pendek';
    meta = { asal, olahraga };
  } else if (kind === 'stats') {
    const to = Number(meta.to);
    if (!Number.isInteger(to) || to < 0 || to > 999999999) return 'angka statistik tidak valid';
    const suffix = typeof meta.suffix === 'string' ? meta.suffix.slice(0, 4) : '';
    meta = { to, suffix };
  }

  const sort = Number.isInteger(Number(b.sort)) ? Math.max(0, Math.min(9999, Number(b.sort))) : 0;
  const active = b.active === undefined ? 1 : b.active === 0 || b.active === false || b.active === '0' ? 0 : 1;
  return { title, body: bodyTxt, meta, sort, active };
}
