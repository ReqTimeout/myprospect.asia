-- 0004: Testimoni ASLI dari materi klien (Website Material/Testimonials/Testimonial.pdf, Okt 2026).
-- Menggantikan dummy karangan seed 0002 yang masih terpasang di D1 production.
-- Zio dihapus (tidak ada dalam materi). Urutan: Gohan, Haidar, Hudzaifah.

DELETE FROM content_items WHERE kind = 'testimonials';

INSERT INTO content_items (id, kind, title, body, meta, sort, active) VALUES
('t-1', 'testimonials', 'Gohan', 'Join Sports Communication Program sebelum berangkat training camp di Belanda bersama Ajax Amsterdam & NAC Breda.', '{"asal":"TC Belanda — Ajax Amsterdam & NAC Breda","olahraga":"Sepak Bola, 10 tahun"}', 1, 1),
('t-2', 'testimonials', 'Haidar', 'Join Sports Communication Program untuk melatih diri menjadi kapten tim yang punya public speaking bagus bersama KFA Lamongan.', '{"asal":"Kapten Tim KFA Lamongan","olahraga":"Sepak Bola, 12 tahun"}', 2, 1),
('t-3', 'testimonials', 'Hudzaifah', 'Eks pemain Timnas Qatar U-16 mengasah skill komunikasi dan personal branding lewat Sports Communication Program.', '{"asal":"Eks Pemain Timnas Qatar U-16","olahraga":"Sepak Bola, 17 tahun"}', 3, 1);
