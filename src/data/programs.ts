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

export const programs: Program[] = [
  {
    slug: 'elite-1on1',
    nama: 'Elite 1-on-1',
    sub: 'Private dengan Personal Coach',
    hargaCoret: 2_300_000,
    harga: 1_299_000,
    satuan: '/ 6 sesi / bulan',
    badge: 'PROMO',
    badgeTone: 'red',
    ringkasan: 'Progres paling cepat. Coach khusus menemani atlet dari nol sampai siap wawancara media.',
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
      '2 masterclass video learning',
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
    ringkasan: 'Semua benefit Elite, plus eksposur profil atletmu di portal berita nasional.',
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
      '2 masterclass video learning',
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
  {
    slug: 'small-group',
    nama: 'Small Group',
    sub: 'Belajar bareng atlet lintas daerah & cabor (6–10 atlet)',
    hargaCoret: 750_000,
    harga: 299_000,
    satuan: '/ 6 sesi / bulan',
    badge: 'KELOMPOK',
    badgeTone: 'red',
    ringkasan: 'Cocok untuk rekan setim atau atlet lintas cabang — belajar bareng, harga lebih ringan.',
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
      '2 masterclass video learning',
      'Berkenalan & belajar bareng atlet lain',
      'Belajar dengan Sports Communication Coach',
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
];

export function formatIdr(n: number): string {
  return new Intl.NumberFormat('id-ID').format(n);
}
