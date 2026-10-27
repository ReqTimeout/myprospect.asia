export type Coach = {
  nama: string;
  peran: string;
  ielts?: string;
  stat?: string;
  olahraga?: string;
  bio?: string;
};

export const coaches: Coach[] = [
  {
    nama: 'Ferri Ahrial',
    peran: 'Founder & Head Coach',
    stat: '2.175+ atlet teredukasi',
    olahraga: 'Sepak Bola',
    bio: 'Ex-media PERSIB Bandung & PSSI. Mendampingi atlet berbicara di depan media sejak 2025.',
  },
  {
    nama: 'Ilham Ahmad',
    peran: 'Sports Communication Coach',
    stat: 'Coach Senior',
    olahraga: 'Bulu Tangkis',
  },
  {
    nama: 'Fathur Fathurrahman',
    peran: 'Sports Communication Coach',
    stat: 'Coach Senior',
    olahraga: 'Sepak Bola',
  },
  {
    nama: 'Farhana Ayya',
    peran: 'Sports Communication Coach',
    ielts: 'IELTS Certified',
    olahraga: 'Atletik',
  },
  {
    nama: 'Salim',
    peran: 'Sports Communication Coach',
    ielts: 'IELTS Certified',
    olahraga: 'Futsal',
  },
  {
    nama: 'Ido',
    peran: 'Sports Communication Coach',
    ielts: 'IELTS Certified',
    olahraga: 'Basket',
  },
];
