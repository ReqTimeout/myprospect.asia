export type CatTone = 'bintang' | 'kolaborasi' | 'berita' | 'default';

export type CategoryStyle = {
  tone: CatTone;
  /** Warna teks label (dipakai di atas chip terang / foto). */
  text: string;
  /** Warna border chip. */
  border: string;
  /** Aksen solid untuk titik di depan label. */
  dot: string;
  /** Isian chip di atas kertas krem. */
  wash: string;
};

// Warna teks & wash sudah diuji kontrasnya terhadap paper (#fffcf7):
// bintang 7.4:1, kolaborasi 5.2:1, berita 6.1:1 — semua lolos WCAG AA.
const TONES: Record<CatTone, CategoryStyle> = {
  bintang: {
    tone: 'bintang',
    text: '#6b4700',
    border: 'rgba(255,195,46,0.55)',
    dot: '#ffc32e',
    wash: 'rgba(255,195,46,0.20)',
  },
  kolaborasi: {
    tone: 'kolaborasi',
    text: '#a84200',
    border: 'rgba(255,122,26,0.42)',
    dot: '#ff7a1a',
    wash: 'rgba(255,122,26,0.14)',
  },
  berita: {
    tone: 'berita',
    text: '#a51a21',
    border: 'rgba(200,35,43,0.38)',
    dot: '#c8232b',
    wash: 'rgba(200,35,43,0.12)',
  },
  default: {
    tone: 'default',
    text: 'rgba(36,26,18,0.74)',
    border: 'rgba(36,26,18,0.16)',
    dot: 'rgba(36,26,18,0.45)',
    wash: 'rgba(36,26,18,0.07)',
  },
};

const TONE_BY_LABEL: Record<string, CatTone> = {
  bintang: 'bintang',
  kolaborasi: 'kolaborasi',
  berita: 'berita',
};

/** Kategori baru dari admin otomatis jatuh ke tone default (tidak error). */
export function categoryStyle(kategori: string | null | undefined): CategoryStyle {
  const key = (kategori ?? '').trim().toLowerCase();
  return TONES[TONE_BY_LABEL[key] ?? 'default'];
}

export const CATEGORY_LABELS = ['Berita', 'Bintang', 'Kolaborasi'] as const;
