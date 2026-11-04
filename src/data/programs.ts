export type Program = {
  slug: string;
  nama: string;
  sub: string;
  hargaCoret?: number;
  harga: number;
  satuan: string;
  badge?: string;
  badgeTone?: 'red' | 'gold';
  ringkasan: string;
  dikuasai: string[];
  didapat: string[];
  journey: { bulan: string; teks: string }[];
  online: boolean;
};

// Urutan array = urutan tampil di seluruh situs.
// Diurut dari harga paling murah ke termahal (Small Group 299k → Elite 1,299k → Premium 2,499k)
// supaya nomor urut (01/02/03) di kartu program = urutan termurah, bukan urutan premium.
export const programs: Program[] = [
  {
    slug: 'small-group',
    nama: 'Small Group',
    sub: 'Belajar bareng 6–10 atlet lintas cabor',
    hargaCoret: 750_000,
    harga: 299_000,
    satuan: '/ 6 sesi / bulan',
    badge: 'KELOMPOK',
    badgeTone: 'red',
    ringkasan: 'Kelas kecil 6–10 atlet lintas cabang. Latihan bicara bareng, biaya per orang jadi lebih ringan.',
    dikuasai: [
      'Percaya diri memperkenalkan diri',
      'Mengenal gaya komunikasi atlet',
      'Menghadapi interview pertandingan',
      'Public speaking & body language',
      'Storytelling sebagai atlet',
    ],
    didapat: [
      '6 sesi live coaching (60 menit/sesi)',
      'E-book Public Speaking & English',
      '2 video masterclass',
      'Latihan bareng atlet dari cabang lain',
      'Dibimbing coach Sports Communication',
      'Classroom group report',
    ],
    journey: [
      { bulan: 'Bulan 1', teks: 'Atlet bisa berkomunikasi' },
      { bulan: 'Bulan 2', teks: 'Atlet bisa mengekspresikan diri' },
      { bulan: 'Bulan 3', teks: 'Atlet bisa mewakili diri & tim' },
      { bulan: 'Bulan 4', teks: 'Atlet bisa membangun identitas diri' },
    ],
    online: true,
  },
  {
    slug: 'elite-1on1',
    nama: 'Elite 1-on-1',
    sub: 'Private dengan Personal Coach',
    hargaCoret: 2_300_000,
    harga: 1_299_000,
    satuan: '/ 6 sesi / bulan',
    badge: 'PROMO',
    badgeTone: 'red',
    ringkasan: 'Satu atlet, satu coach. Latihan dari nol sampai berani wawancara media dan tampil di depan kamera.',
    dikuasai: [
      'Percaya diri memperkenalkan diri',
      'Mengenal gaya komunikasi atlet',
      'Menghadapi interview pertandingan',
      'Public speaking & body language',
      'Storytelling sebagai atlet',
    ],
    didapat: [
      '6 sesi live coaching (60 menit/sesi)',
      'E-book Public Speaking & English',
      '2 video masterclass',
      'Konten atlet di Instagram Prospect Asia',
      'Bebas pilih jadwal',
      'E-certificate',
      'Individual report',
    ],
    journey: [
      { bulan: 'Bulan 1', teks: 'Atlet bisa berkomunikasi' },
      { bulan: 'Bulan 2', teks: 'Atlet bisa mengekspresikan diri' },
      { bulan: 'Bulan 3', teks: 'Atlet bisa mewakili diri & tim' },
      { bulan: 'Bulan 4', teks: 'Atlet bisa membangun identitas diri' },
    ],
    online: true,
  },
  {
    slug: 'premium-1on1',
    nama: 'Premium 1-on-1',
    sub: 'Private + Pemberitaan Media Nasional',
    hargaCoret: 3_500_000,
    harga: 2_499_000,
    satuan: '/ 6 sesi / bulan',
    badge: '★ MEDIA NASIONAL',
    badgeTone: 'gold',
    ringkasan: 'Semua sesi Elite, plus profil atletmu diberitakan di portal berita nasional.',
    dikuasai: [
      'Percaya diri memperkenalkan diri',
      'Mengenal gaya komunikasi atlet',
      'Menghadapi interview pertandingan',
      'Public speaking & body language',
      'Storytelling sebagai atlet',
    ],
    didapat: [
      '6 sesi live coaching (60 menit/sesi)',
      'E-book Public Speaking & English',
      '2 video masterclass',
      'Konten atlet di Instagram Prospect Asia',
      'Bebas pilih jadwal',
      'E-certificate',
      'Individual report',
      'Pemberitaan di portal berita nasional',
    ],
    journey: [
      { bulan: 'Bulan 1', teks: 'Atlet bisa berkomunikasi' },
      { bulan: 'Bulan 2', teks: 'Atlet bisa mengekspresikan diri' },
      { bulan: 'Bulan 3', teks: 'Atlet bisa mewakili diri & tim' },
      { bulan: 'Bulan 4', teks: 'Atlet bisa membangun identitas diri' },
    ],
    online: true,
  },
];

export function formatIdr(n: number): string {
  return new Intl.NumberFormat('id-ID').format(n);
}
