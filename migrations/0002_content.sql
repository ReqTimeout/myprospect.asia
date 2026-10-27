CREATE TABLE IF NOT EXISTS posts (
  slug TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  "desc" TEXT NOT NULL,
  kategori TEXT NOT NULL DEFAULT 'Berita',
  pub_date TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'published',
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS content_items (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  meta TEXT NOT NULL DEFAULT '{}',
  sort INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_content_kind ON content_items(kind, sort);

INSERT INTO content_items (id, kind, title, body, meta, sort, active) VALUES
('t-1', 'testimonials', 'Gohan', 'Dulu pas dikasih mic langsung blank. Sekarang wawancara habis pertandingan malah seru — nanya balik ke wartawan juga berani.', '{"asal":"Atlet Prospect Asia","olahraga":"Sepak Bola"}', 1, 1),
('t-2', 'testimonials', 'Hudzaifah', 'English-nya kepake banget waktu turnamen luar. Pelatih luar negri nanya, aku bisa jawab tanpa panik.', '{"asal":"Atlet Prospect Asia","olahraga":"Bulu Tangkis"}', 2, 1),
('t-3', 'testimonials', 'Zio', 'Coach-nya ngajarin cara cerita yang bikin orang denger. Sekarang konten di IG tim lebih pede dibikin sendiri.', '{"asal":"Atlet Prospect Asia","olahraga":"Futsal"}', 3, 1),
('f-1', 'faq', 'Apa itu Sports Communication?', 'Keterampilan fundamental buat atlet modern: public speaking & bahasa Inggris khusus konteks atlet — biar kamu percaya diri menghadapi media, membuka peluang lebih besar, dan mewakili diri serta tim dengan baik.', '{"grup":"Umum"}', 1, 1),
('f-2', 'faq', 'Programnya online atau offline?', 'Saat ini semua program (1-on-1 & Small Group) dijalankan online, jadi atlet di mana saja bisa ikut. Workshop untuk akademi/klub bisa disesuaikan — diskusikan via WhatsApp.', '{"grup":"Umum"}', 2, 1),
('f-3', 'faq', 'Bedanya Elite dan Premium apa?', 'Elite fokus ke progres privat dengan personal coach. Premium mendapat semua benefit Elite plus pemberitaan profil atlet di portal berita nasional.', '{"grup":"Program"}', 3, 1),
('f-4', 'faq', 'Kalau belum pede mulai dari mana?', 'Tenang — ada tes penempatan dulu untuk menentukan level: Basic (mulai dari nol), Development (mengembangkan kemampuan), atau Impact (komunikasi dengan percaya diri).', '{"grup":"Program"}', 4, 1),
('f-5', 'faq', 'Berapa lama sampai kelihatan hasilnya?', 'Perkembangan dipantau tiap bulan: Bulan 1 atlet bisa berkomunikasi, Bulan 2 mengekspresikan diri, Bulan 3 mewakili diri & tim, Bulan 4 membangun identitas diri.', '{"grup":"Program"}', 5, 1),
('f-6', 'faq', 'Workshop untuk siapa?', 'Untuk akademi/klub olahraga yang ingin membekali atlet binaannya. Minimal 10 peserta per sesi, didampingi coach Sports Communication berpengalaman.', '{"grup":"Workshop"}', 6, 1),
('f-7', 'faq', 'Bedanya Starter dan Premium?', 'Starter: 90 menit, simulasi wawancara mini. Premium: 120 menit, simulasi interview bersama 3+ assessor, individual assessment, e-certificate, e-book, plus pemberitaan akademi di portal media.', '{"grup":"Workshop"}', 7, 1),
('f-8', 'faq', 'Bayarnya gimana?', 'Semua transaksi & pendaftaran dibantu langsung lewat WhatsApp admin — harga, jadwal, sampai cara bayar dijelaskan di chat. Tidak perlu checkout online.', '{"grup":"Pembayaran"}', 8, 1),
('s-1', 'stats', 'Atlet teredukasi', '', '{"to":2175,"suffix":"+"}', 1, 1),
('s-2', 'stats', 'Akademi olahraga', '', '{"to":25,"suffix":"+"}', 2, 1),
('s-3', 'stats', 'Coach berpengalaman', '', '{"to":6,"suffix":""}', 3, 1)
ON CONFLICT(id) DO UPDATE SET title=excluded.title, body=excluded.body, meta=excluded.meta, sort=excluded.sort, updated_at=datetime('now');
