CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nama TEXT NOT NULL,
  wa TEXT NOT NULL,
  program TEXT,
  sumber TEXT DEFAULT 'web',
  status TEXT NOT NULL DEFAULT 'baru'
    CHECK (status IN ('baru', 'dikontak', 'terjadwal', 'daftar', 'gagal')),
  catatan TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_leads_status ON leads (status);
CREATE INDEX IF NOT EXISTS idx_leads_created ON leads (created_at);

CREATE TABLE IF NOT EXISTS settings (
  k TEXT PRIMARY KEY,
  v TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS wa_clicks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL,
  ts TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_wa_clicks_slug ON wa_clicks (slug);

CREATE TABLE IF NOT EXISTS programs (
  slug TEXT PRIMARY KEY,
  nama TEXT NOT NULL,
  tier TEXT,
  harga_coret INTEGER,
  harga INTEGER,
  ringkasan TEXT,
  benefit TEXT,
  poin_dikuasai TEXT,
  journey TEXT,
  badge TEXT,
  cta_label TEXT DEFAULT 'Daftar via WhatsApp',
  urutan INTEGER DEFAULT 0,
  aktif INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS workshops (
  slug TEXT PRIMARY KEY,
  nama TEXT NOT NULL,
  durasi TEXT,
  harga INTEGER,
  ringkasan TEXT,
  benefit TEXT,
  urutan INTEGER DEFAULT 0,
  aktif INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS testimonials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nama TEXT NOT NULL,
  akademi TEXT,
  olahraga TEXT,
  kutipan TEXT NOT NULL,
  foto TEXT,
  urutan INTEGER DEFAULT 0,
  aktif INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS coaches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nama TEXT NOT NULL,
  peran TEXT,
  bio TEXT,
  ielts TEXT,
  stat TEXT,
  olahraga TEXT,
  foto TEXT,
  urutan INTEGER DEFAULT 0,
  aktif INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS partners (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nama TEXT NOT NULL,
  jenis TEXT NOT NULL DEFAULT 'akademi'
    CHECK (jenis IN ('akademi', 'mitra')),
  logo TEXT,
  urutan INTEGER DEFAULT 0,
  aktif INTEGER NOT NULL DEFAULT 1
);

INSERT OR IGNORE INTO settings (k, v) VALUES
  ('wa_number', '6285924041004'),
  ('popup_enabled', '1'),
  ('popup_text', 'Hai! Mau tanya lebih jauh tentang program?'),
  ('popup_delay_sec', '8');
