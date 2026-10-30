import type { CrestShape } from './crest';

export type Partner = {
  nama: string;
  slug: string;
  jenis: 'akademi' | 'mitra';
  crest: CrestShape;
};

export const partners: Partner[] = [
  { nama: 'Djanur Football Academy', slug: 'djanur-football-academy', jenis: 'akademi', crest: 'shield' },
  { nama: 'Dream Baller ID', slug: 'dream-baller-id', jenis: 'akademi', crest: 'round' },
  { nama: 'PB Jaya Raya Ragunan', slug: 'pb-jaya-raya-ragunan', jenis: 'akademi', crest: 'banner' },
  {
    nama: 'Akademi Futsal Margahayu Raya',
    slug: 'akademi-futsal-margahayu-raya',
    jenis: 'akademi',
    crest: 'hex',
  },
  { nama: 'MFC Marunda', slug: 'mfc-marunda', jenis: 'akademi', crest: 'oval' },
  { nama: 'SSBRBC', slug: 'ssbrbc', jenis: 'akademi', crest: 'hex' },
  { nama: 'Little Pep', slug: 'little-pep', jenis: 'mitra', crest: 'round' },
  { nama: 'Pep Sports', slug: 'pep-sports', jenis: 'mitra', crest: 'banner' },
  { nama: 'Exortive', slug: 'exortive', jenis: 'mitra', crest: 'oval' },
  { nama: 'RS Limijati', slug: 'rs-limijati', jenis: 'mitra', crest: 'shield' },
];
