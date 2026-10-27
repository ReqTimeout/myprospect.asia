-- Generated oleh scripts/gen-posts-seed.mjs dari src/content/berita/*.mdx
INSERT INTO posts (slug, title, "desc", kategori, pub_date, body, status) VALUES ('2175-atlet-berani-bicara', '2.175 Atlet Sudah Berani Bicara — Ini Cerita Mereka', 'Program Sports Communication Prospect Asia menembus 2.175 atlet dari 25 akademi olahraga di Indonesia.', 'Berita', '2026-10-20', 'Angka **2.175 atlet** bukan sekadar statistik — di baliknya ada pemain sepak bola yang dulu blank saat wawancara, pebulu tangkis yang sekarang lancar berbahasa Inggris di turnamen internasional, dan futsaler yang kini percaya diri membuat konten sendiri.

## Dari lapangan ke depan mik

Selama ini atlet dilatih untuk menang. Tapi begitu selesai pertandingan, mikrofon diangkat — banyak yang kehilangan suara. Di situlah Sports Communication masuk: public speaking dan bahasa Inggris yang dikemas khusus konteks atlet.

## Kolaborasi yang terus tumbuh

Saat ini Prospect Asia berjalan bersama akademi seperti Djanur Football Academy, Dream Baller ID, PB Jaya Raya Ragunan, hingga MFC Marunda — ditambah mitra resmi seperti Little Pep dan Pep Sports.

> "Mereka bukan cuma jago main. Mereka bisa mewakili diri, tim, dan negara lewat kata-kata."

Program 1-on-1 dan Small Group berjalan online, sementara workshop untuk akademi digelar langsung di tempat — dari sesi 90 menit sampai level Premium dengan assessor dan individual assessment.', 'published') ON CONFLICT(slug) DO UPDATE SET title=excluded.title, "desc"=excluded."desc", kategori=excluded.kategori, pub_date=excluded.pub_date, body=excluded.body, status=excluded.status, updated_at=datetime('now');
INSERT INTO posts (slug, title, "desc", kategori, pub_date, body, status) VALUES ('bintang-gohan', 'Bintang Baru: Gohan, Atlet yang Kini Langsung Kepo Wartawan', 'Perjalanan Gohan dari blank saat wawancara sampai berani membalik pertanyaan wartawan pasca-pertandingan.', 'Bintang', '2026-10-15', 'Dulu pas dikasih mic, Gohan langsung blank. Sekarang wawancara habis pertandingan justru jadi bagian favoritnya.

## Sebelumnya: panik, sekarang: santai

> "Dulu pas dikasih mic langsung blank. Sekarang wawancara habis pertandingan malah seru — nanya balik ke wartawan juga berani."

Perubahan itu datang dari sesi 1-on-1 bersama personal coach: latihan mikrofon, latihan jawab singkat, sampai simulasi press conference mini dengan rekan sesama atlet.

## Yang dilatih

- Memperkenalkan diri dengan struktur yang jelas
- Menjawab pertanyaan sulit tanpa panik
- Membawa cerita prestasi jadi narasi yang menarik
- Bahasa Inggris dasar untuk media internasional

Ingin atletmu seperti Gohan? Chat admin untuk jadwal tes penempatan.', 'published') ON CONFLICT(slug) DO UPDATE SET title=excluded.title, "desc"=excluded."desc", kategori=excluded.kategori, pub_date=excluded.pub_date, body=excluded.body, status=excluded.status, updated_at=datetime('now');
INSERT INTO posts (slug, title, "desc", kategori, pub_date, body, status) VALUES ('kolaborasi-workshop-starter', 'Kolaborasi: Workshop Starter untuk Akademi Futsal Margahayu Raya', 'Sesi 90 menit Sports Communication Workshop Starter digelar untuk atlet binaan akademi futsal.', 'Kolaborasi', '2026-10-08', 'Workshop **Sports Communication Starter** digelar untuk atlet binaan akademi — sesi 90 menit yang padat dan interaktif.

## Isi sesi

1. **Mini simulasi wawancara** — atlet berlatih menjawab pertandingan layaknya konferensi pers sungguhan.
2. **Public speaking khusus atlet** — struktur bicara, body language, dan cara bawa diri di depan kamera.
3. **Konten bersama** — peserta membuat konten tentang Sports Communication sebagai penutup sesi.

## Kenapa akademi ikut

Kompetisi menuntut atlet tampil ganda: jago di lapangan **dan** bisa bicara di depan media. Workshop ini dirancang untuk minimal 10 peserta, didampingi Sports Communication coach berpengalaman.

Untuk level lebih lengkap — dengan 3+ assessor, individual assessment, dan pemberitaan akademi di portal media — tersedia **Workshop Premium**.

Tertarik menghadirkan ke akademimu? Booking via WhatsApp.', 'published') ON CONFLICT(slug) DO UPDATE SET title=excluded.title, "desc"=excluded."desc", kategori=excluded.kategori, pub_date=excluded.pub_date, body=excluded.body, status=excluded.status, updated_at=datetime('now');
