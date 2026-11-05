export type Testimonial = {
  nama: string;
  asal: string;
  olahraga: string;
  kutipan: string;
  foto?: string;
};

// Isi mengikuti materi resmi klien (Testimonial.pdf, Okt 2026) — jangan dikarang ulang.
export const testimonials: Testimonial[] = [
  {
    nama: 'Gohan',
    asal: 'TC Belanda — Ajax Amsterdam & NAC Breda',
    olahraga: 'Sepak Bola, 10 tahun',
    kutipan:
      'Join Sports Communication Program sebelum berangkat training camp di Belanda bersama Ajax Amsterdam & NAC Breda.',
    foto: '/media/testimoni/gohan.webp',
  },
  {
    nama: 'Haidar',
    asal: 'Kapten Tim KFA Lamongan',
    olahraga: 'Sepak Bola, 12 tahun',
    kutipan:
      'Join Sports Communication Program untuk melatih diri menjadi kapten tim yang punya public speaking bagus bersama KFA Lamongan.',
    foto: '/media/testimoni/haidar.webp',
  },
  {
    nama: 'Hudzaifah',
    asal: 'Eks Pemain Timnas Qatar U-16',
    olahraga: 'Sepak Bola, 17 tahun',
    kutipan:
      'Eks pemain Timnas Qatar U-16 mengasah skill komunikasi dan personal branding lewat Sports Communication Program.',
    foto: '/media/testimoni/hudzaifah.webp',
  },
];
