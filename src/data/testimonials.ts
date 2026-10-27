export type Testimonial = {
  nama: string;
  asal: string;
  olahraga: string;
  kutipan: string;
};

export const testimonials: Testimonial[] = [
  {
    nama: 'Gohan',
    asal: 'Atlet Prospect Asia',
    olahraga: 'Sepak Bola',
    kutipan:
      'Dulu pas dikasih mic langsung blank. Sekarang wawancara habis pertandingan malah seru — nanya balik ke wartawan juga berani.',
  },
  {
    nama: 'Hudzaifah',
    asal: 'Atlet Prospect Asia',
    olahraga: 'Bulu Tangkis',
    kutipan:
      'English-nya kepake banget waktu turnamen luar. Pelatih luar negri nanya, aku bisa jawab tanpa panik.',
  },
  {
    nama: 'Zio',
    asal: 'Atlet Prospect Asia',
    olahraga: 'Futsal',
    kutipan:
      'Coach-nya ngajarin cara cerita yang bikin orang denger. Sekarang konten di IG tim lebih pede dibikin sendiri.',
  },
];
