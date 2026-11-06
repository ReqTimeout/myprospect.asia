-- 0006: Hapus berita kolaborasi Akademi Futsal Margahayu Raya atas permintaan klien
-- (akademi juga dihapus dari daftar mitra; MDX-nya ikut dihapus dari repo).
-- Seed 0003/0005 sudah dibersihkan supaya post ini tidak hidup lagi di environment baru.

DELETE FROM posts WHERE slug = 'kolaborasi-workshop-starter';
