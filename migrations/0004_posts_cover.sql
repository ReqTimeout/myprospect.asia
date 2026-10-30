-- Tambah kolom cover (gambar utama berita) di tabel posts.
-- Sebelumnya detail berita (/berita/[slug]) dirender oleh functions/berita/[slug].ts
-- yang membaca tabel ini, sehingga featured image tidak pernah ditampilkan.
ALTER TABLE posts ADD COLUMN cover TEXT NOT NULL DEFAULT '';
