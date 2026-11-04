export type Sport =
  | 'sepak-bola'
  | 'futsal'
  | 'basket'
  | 'voli'
  | 'bulu-tangkis'
  | 'renang'
  | 'atletik'
  | 'tinju'
  | 'tenis'
  | 'tenis-meja'
  | 'panahan'
  | 'taekwondo'
  | 'karate'
  | 'pencak-silat'
  | 'senam'
  | 'balap-sepeda'
  | 'e-sports'
  | 'hoki'
  | 'sepak-takraw'
  | 'panjat-tebing'
  | 'judo'
  | 'angkat-besi'
  | 'dayung'
  | 'piala';

export type Cabang = {
  sport: Sport;
  nama: string;
};

// Ribbon homepage menampilkan seluruh cabang olahraga (permintaan klien:
// "semua cabang olah raga dong"). Cabor di luar daftar SportIcon memakai
// ikon piala sebagai fallback.
export const cabangOlahraga: Cabang[] = [
  { sport: 'sepak-bola', nama: 'Sepak bola' },
  { sport: 'futsal', nama: 'Futsal' },
  { sport: 'basket', nama: 'Basket' },
  { sport: 'voli', nama: 'Voli' },
  { sport: 'bulu-tangkis', nama: 'Bulu tangkis' },
  { sport: 'renang', nama: 'Renang' },
  { sport: 'atletik', nama: 'Atletik' },
  { sport: 'tinju', nama: 'Tinju' },
  { sport: 'tenis', nama: 'Tenis' },
  { sport: 'tenis-meja', nama: 'Tenis meja' },
  { sport: 'panahan', nama: 'Panahan' },
  { sport: 'taekwondo', nama: 'Taekwondo' },
  { sport: 'karate', nama: 'Karate' },
  { sport: 'pencak-silat', nama: 'Pencak silat' },
  { sport: 'senam', nama: 'Senam' },
  { sport: 'balap-sepeda', nama: 'Balap sepeda' },
  { sport: 'e-sports', nama: 'E-sports' },
  { sport: 'hoki', nama: 'Hoki' },
  { sport: 'sepak-takraw', nama: 'Sepak takraw' },
  { sport: 'panjat-tebing', nama: 'Panjat tebing' },
  { sport: 'judo', nama: 'Judo' },
  { sport: 'angkat-besi', nama: 'Angkat besi' },
  { sport: 'dayung', nama: 'Dayung' },
];