export type Workshop = {
  slug: string;
  nama: string;
  durasi: string;
  harga: number;
  ringkasan: string;
  didapat: string[];
  target: string;
  catatan?: string;
};

export const workshops: Workshop[] = [
  {
    slug: 'starter',
    nama: 'Workshop Starter',
    durasi: '1 sesi · 90 menit',
    harga: 1_999_000,
    ringkasan:
      '90 menit langsung praktik: peserta latihan menghadapi press conference dan wawancara media.',
    didapat: [
      'Mini simulasi wawancara media nasional & internasional',
      'Pengenalan public speaking khusus atlet',
      'Praktik bikin konten Sports Communication',
      'Dibimbing coach Sports Communication',
      'Gifts & E-certificate',
    ],
    target: 'Akademi / klub · minimal 10 peserta',
    catatan: '50 peserta → cuma IDR 40.000/atlet',
  },
  {
    slug: 'premium',
    nama: 'Workshop Premium',
    durasi: '1 sesi · 120 menit (fun practical)',
    harga: 3_899_000,
    ringkasan:
      'Simulasi interview di depan 3+ assessor, tiap atlet dapat assessment, e-certificate, dan e-book.',
    didapat: [
      'Simulasi interview bersama 3+ assessor Sports Communication',
      'Individual assessment untuk setiap atlet',
      'E-certificate & e-book',
      'Tips public speaking untuk atlet',
      'Pemberitaan akademi di portal media',
      'Door prize',
    ],
    target: 'Akademi / klub · minimal 10 peserta',
    catatan: '100 peserta → cuma IDR 38.900/atlet',
  },
  {
    slug: 'pro',
    nama: 'Workshop Pro',
    durasi: 'Custom',
    harga: 0,
    ringkasan: 'Program kolaborasi jangka panjang untuk akademi yang ingin pembinaan komunikasi berkelanjutan.',
    didapat: [
      'Kurikulum custom sesuai kebutuhan akademi',
      'Sesi berkala & progress report',
      'Pendampingan coach khusus',
    ],
    target: 'Akademi / klub, diskusi kebutuhan via WhatsApp',
  },
];

export function formatIdr(n: number): string {
  return new Intl.NumberFormat('id-ID').format(n);
}
