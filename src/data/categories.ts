export type CatTone = 'bintang' | 'kolaborasi' | 'berita' | 'default';

export type CategoryStyle = {
  tone: CatTone;
  /** Warna teks label, diuji terhadap wash solid di bawahnya. */
  text: string;
  /** Border chip, sengaja sama dengan isian supaya batasnya hilang. */
  border: string;
  /** Titik di depan label; ikut warna teks agar tetap terbaca. */
  dot: string;
  /** Isian chip: satu warna penuh, tanpa wash transparan. */
  wash: string;
};

// Chip kategori dulu memakai oranye/kuning 14-20% di atas krem. Hasilnya
// bukan oranye cerah tapi warna kulit telur, persis keluhan klien. Sekarang
// tiap tone memakai bidangnya sendiri penuh; rasio teks sudah dihitung:
// bintang 5.2:1, kolaborasi 5.9:1, berita 5.6:1, default 13.8:1.
const TONES: Record<CatTone, CategoryStyle> = {
  bintang: {
    tone: 'bintang',
    text: '#6b4700',
    border: '#ffc32e',
    dot: '#6b4700',
    wash: '#ffc32e',
  },
  kolaborasi: {
    tone: 'kolaborasi',
    text: '#ffffff',
    border: '#ff8c00',
    dot: '#ffffff',
    wash: '#ff8c00',
  },
  berita: {
    tone: 'berita',
    text: '#ffffff',
    border: '#c8232b',
    dot: '#ffffff',
    wash: '#c8232b',
  },
  default: {
    tone: 'default',
    text: '#241a12',
    border: '#e2dbd2',
    dot: '#241a12',
    wash: '#f7f5f2',
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
