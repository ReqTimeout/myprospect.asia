export type Coach = {
  nama: string;
  peran: string;
  foto?: string;
  /** Satu baris kecil di bawah peran — hanya untuk coach yang punya detail terkonfirmasi. */
  detail?: string;
};

// Hanya memuat fakta yang terkonfirmasi materi klien (Coaches Picture + brief).
// Bio Ferri (ex-media PERSIB & PSSI) dan angka 2.175 atlet sudah tampil di
// intro section & StatsBar home, jadi tidak diulang di kartu.
export const coaches: Coach[] = [
  {
    nama: 'Ferri Ahrial',
    peran: 'Founder & Head Coach',
    foto: '/media/coaches/ferri-ahrial.webp',
    detail: 'Ex-media PERSIB Bandung & PSSI · 2.175+ atlet teredukasi',
  },
  {
    nama: 'Ilham Ahmad',
    peran: 'Sports Communication Coach',
    foto: '/media/coaches/ilham-ahmad.webp',
  },
  {
    nama: 'Fathur Fathurrahman',
    peran: 'Sports Communication Coach',
    foto: '/media/coaches/fathur-fathurrahman.webp',
  },
  {
    nama: 'Farhana Ayya',
    peran: 'Sports Communication Coach',
    foto: '/media/coaches/farhana-ayya.webp',
  },
  {
    nama: 'Salim',
    peran: 'Sports Communication Coach',
    foto: '/media/coaches/salim.webp',
  },
  {
    nama: 'Ido',
    peran: 'Sports Communication Coach',
    foto: '/media/coaches/ido.webp',
  },
];
