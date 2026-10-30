-- Analitik trafik. Diisi dari beacon /api/pv (halaman Astro + halaman berita yang
-- dirender Pages Function). Kolom visitor berisi SIDANG hash SHA-256 (IP+UA+tanggal)
-- yang dipotong 32 karakter: cukup untuk menghitung pengunjung unik, IP mentah
-- maupun UA penuh tidak pernah disimpan.
CREATE TABLE IF NOT EXISTS pageviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  path TEXT NOT NULL,
  ref_domain TEXT NOT NULL DEFAULT '',
  device TEXT NOT NULL DEFAULT 'unknown',
  visitor TEXT NOT NULL DEFAULT '',
  ts TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_pv_ts ON pageviews (ts);
CREATE INDEX IF NOT EXISTS idx_pv_path ON pageviews (path);

-- Klik WhatsApp selama ini cuma punya indeks slug; grafik harian butuh filter waktu.
CREATE INDEX IF NOT EXISTS idx_wa_clicks_ts ON wa_clicks (ts);
