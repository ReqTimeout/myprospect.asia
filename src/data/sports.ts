export type Sport =
  | 'sepak-bola'
  | 'futsal'
  | 'basket'
  | 'voli'
  | 'bulu-tangkis'
  | 'renang'
  | 'atletik'
  | 'tinju'
  | 'piala';

export type Cabang = {
  sport: Sport;
  nama: string;
};

export const cabangOlahraga: Cabang[] = [
  { sport: 'sepak-bola', nama: 'Sepak bola' },
  { sport: 'futsal', nama: 'Futsal' },
  { sport: 'basket', nama: 'Basket' },
  { sport: 'voli', nama: 'Voli' },
  { sport: 'bulu-tangkis', nama: 'Bulu tangkis' },
  { sport: 'renang', nama: 'Renang' },
  { sport: 'atletik', nama: 'Atletik' },
  { sport: 'tinju', nama: 'Tinju' },
];