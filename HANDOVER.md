# HANDOVER — Website Prospect Asia (myprospect.asia)

> Dokumen serah-terima untuk **agent/session berikutnya**. Tulis untuk dibaca cepat tapi lengkap.
> Dibuat: 29 Okt 2026 · Revisi visual terakhir: `0197853` (Broadcast/Scoreboard) · Deploy produksi: `myprospect-7uk.pages.dev`
> Semua fakta di bawah diverifikasi dari repo & live site (bukan dari ingatan).

---

## 1. Ringkasan satu paragraf

Website **WA-first** untuk **Prospect Asia (PT Kita Berani Bicara)** — program *Sports Communication* (public speaking + bahasa Inggris khusus atlet). Semua konversi via **WhatsApp 0859-2404-1004** (deep-link pesan pre-filled), plus lead form yang disimpan ke D1. Stack: **Astro 7 static + Svelte 5 islands + Tailwind v4**, hosting **Cloudflare Pages** (Functions + D1). Admin password-protected (HMAC cookie) untuk leads, konten (CRUD live tanpa deploy), pengaturan. Tema saat ini: **light warm-white + oranye `#ff7a1a` dominan** + aksen merah `#c8232b` + **background sport** (garis lapangan, bola, k-court, jaring gawang) + sistem animasi (GSAP SplitText/ScrollTrigger, Lenis smooth scroll, magnetic button, reveal on-scroll, curtain wipe, mouse spotlight, progress bar). Arah desain sejak Okt 2026: **"Broadcast / Scoreboard"** (pita ticker, papan skor, tiket sobek, kartu pemain ala jersey).

---

## 2. Akses & URL

| Item | Nilai |
|---|---|
| Produksi | `https://myprospect.asia` (domain kustom — canonical, `og:url`, sitemap, robots semua ikut) · fallback `https://myprospect-7uk.pages.dev` |
| Admin | `https://myprospect.asia/admin` (password ada di `.env.admin` — gitignored) |
| Preview deploy | `https://<hash>.myprospect-7uk.pages.dev` (hash dicetak tiap `wrangler pages deploy`) |
| Domain kustom (LIVE) | `https://myprospect.asia` + `https://www.myprospect.asia` → Pages project `myprospect`, CNAME → `myprospect-7uk.pages.dev`, status `active` (lihat §22.1) |
| Pages project | `myprospect` · D1 database `prospect-db` (id `cf06163c-557d-4625-aedb-d4b9dd1b4514`) |
| Remote git | `git@github.com:ReqTimeout/myprospect.asia.git` (SSH! HTTPS+PAT ditolak 403) |
| Akun CF | ID ada di `.env.cf` (gitignored) |
| Secret Pages | `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET` (sudah di-set) |

---

## 3. Data bisnis (WA-first, angka-fix)

| Item | Data |
|---|---|
| Legalitas | PT Kita Berani Bicara (Bandung, aktif ~Okt 2025) |
| Founder | Ferri Ahrial — ex-media PERSIB Bandung & PSSI |
| Proof | 2.175 atlet · 25 akademi · 6 coach |
| WA | `6285924041004` → tampil `0859-2404-1004` (`src/data/site.ts`) |
| Program B2C | **Elite 1-on-1** Rp1.299.000 (coret 2.300.000) · **Premium 1-on-1** Rp2.499.000 (coret 3.500.000) · **Small Group** Rp299.000/atlet (coret 750.000) · **Membership** (Coming Soon) |
| Workshop B2B | **Starter** Rp1.999.000/90mnt (catatan: 50 peserta → IDR 40.000/atlet) · **Premium** Rp3.899.000/120mnt (catatan: 100 peserta → IDR 38.900/atlet) · **Pro** Custom (harga belum ada) |
| Klub B2B | Djanur Football Academy, Dream Baller ID, PB Jaya Raya Ragunan, Akademi Futsal Margahayu Raya, MFC Marunda, SSBRBC · Mitra: Little Pep, Pep Sports, Exortive, RS Limijati |
| Leveling | Basic → Development → Impact (tes penempatan) |
| Sumber kebenaran | **`Website Material/` = acuan** (harga, copy, logo, foto). Poster Small Group & deck workshop menang atas `Web Material.pdf` bila beda. |

---

## 4. Arsitektur & routing (penting, sudah diverifikasi)

```
Astro static (dist) ──► Cloudflare Pages
        │
        └── functions/  (Pages Functions, auto-_routes.json)
              ├── _middleware.ts            auth guard /admin* & /api/admin*
              ├── api/leads.ts              POST lead → D1 → 302 ke wa.me (pesan pre-filled)
              ├── api/click.ts              beacon klik CTA → wa_clicks
              ├── api/settings.ts           GET publik (WA/popup/GA4)
              ├── api/posts.ts              GET publik daftar berita published
              ├── api/content/[kind].ts     GET publik content_items aktif
              ├── api/admin/*               stats, leads, settings, posts CRUD, content CRUD, login/logout
              └── berita/[slug].ts          DETAIL berita (HTML template mandiri, marked, OG/NewsArticle, GA)
```

- **Pages Functions menang atas static asset** untuk path yang sama. Detail berita dilayani `functions/berita/[slug].ts` (file `src/pages/berita/[slug].astro` **sudah dihapus**). `env.ASSETS.fetch()` dipakai sebagai fallback saat slug kosong.
- **Detail berita = halaman HTML mandiri, BUKAN halaman Astro.** Tidak memakai `Base.astro`, Tailwind, `Header.astro`, `Footer.astro`, atau island Svelte — semua CSS ditulis inline di dalam template function. Konsekuensi: **header, footer, dock, dan token warna harus dibuat manual di sana**. Kalau desain header situs berubah, halaman ini TIDAK ikut berubah otomatis. Lihat §21.
- Admin HTML-nya page statis `src/pages/admin/index.astro` + island `AdminApp.svelte` (tab Dashboard/Leads/Konten/Media/Pengaturan).
- Konten publik **live-hydrate**: island ambil JSON dari `/api/posts` & `/api/content/[kind]` lewat `src/lib/live.ts` (cache per page-load, dedupe). Edit di admin → tampil tanpa deploy.
- Auth admin: password → `ADMIN_PASSWORD`; cookie `pa_admin` = `exp.HMAC-SHA256(exp)`, HttpOnly/Secure/SameSite=Lax, 7 hari (`functions/_lib/auth.ts`).

---

## 5. Peta repo

```
src/
  layouts/Base.astro         shell: meta/OG/JSON-LD, GA4 runtime loader, page-curtain, scroll-progress, motion-toggle, <script src="../scripts/fx.ts">
  pages/                     index, tentang, faq, berita/index, program/[slug], workshop/[slug], admin/{index,login}
  components/                AboutSection, ProgramSection, WorkshopSection, StatsBar, CoachesSection, BlogPreview, FaqSection, CtaBand, Header, Footer, Marquee, LeadForm
  components/islands/        AdminApp, AdminKonten, BeritaList, Counter, Dock, FaqAccordion, FaqGroups, LevelJourney, StatsList, Testimonials, WaPopup
  scripts/fx.ts              SEMUA runtime motion (Lenis, GSAP, motion, reveal, spotlight, progress, toggle)
  styles/global.css          @theme tokens (Tailwind v4) + utilitas (card-soft, card-lift, btn-pop, ghost-word, eyebrow, art-*, sport-ball, hero anim keyframes)
  lib/wa.ts                  waLink() deep-link   |  lib/seo.ts jsonLd/organization/FAQ/Course  |  lib/live.ts cache fetch
  data/                      site, programs, workshops, faq, coaches, partners, testimonials
  content/berita/*.md        koleksi MDX (seed lama; konten live kini di D1)
functions/                   Pages Functions (lihat §4)
migrations/                  0001_init.sql, 0002_content.sql, 0003_seed_posts.sql, 0004_posts_cover.sql, 0005_seed_covers.sql
scripts/gen-posts-seed.mjs   generator SQL seed dari MDX
public/media/                aset gambar hasil proses (lihat §8)
docs/preview/                bukti visual animasi (gif + filmstrip)
plan.md                      master plan (status F1–F5 di baris 341–348) · docs/wireframes.md
```

---

## 6. Design system (SETELAH pivot tema light — jangan revert ke dark)

Token di `src/styles/global.css` (`@theme`):

| Token | Nilai | Pakai untuk |
|---|---|---|
| `--color-paper` | `#fffcf7` | background halaman |
| `--color-paper-deep` | `#fff3e4` | section alt / kartu hangat |
| `--color-ink` | `#241a12` | teks utama (hangat, bukan hitam pekat) |
| `--color-ink-2` | `#17110b` | teks di permukaan gelap (footer, banner) — **bukan** lagi panel admin (panel admin sudah putih, Okt 2026) |
| `--color-bone` | `#f7f5f2` | teks di atas permukaan gelap — **bukan** lagi panel admin (panel admin sudah putih, Okt 2026) |
| `--color-brand` | `#ff7a1a` | **oranye utama** (CTA, harga, band, aksen) |
| `--color-brand-dark` | `#bc4c00` | teks oranye (kontras), hover — Okt 2026 digelapkan 2× dari `#e05e00` → `#c04f00` → `#bc4c00` supaya teks kecil oranye lolos 4.5:1 di atas putih **dan** di atas `paper-deep` (footer) |
| `--color-brand-soft` | `#ffe3c4` | chip, badge, tint |
| `--color-gold` | `#ffc32e` | badge tier, aksen kuning |
| `--color-crimson` | `#c8232b` | **aksen merah** (titik eyebrow, ring, diamond, stiker) |

- Font: **Anton** (display, `.display` + `skew-mark`) & **Plus Jakarta Sans Variable** (body) — keduanya via `@fontsource`, bukan CDN.
- **Logo**: materi `Website Material/Images/Logo Black.png` = 2539×591, **hitam polos 100%** (chip "ASIA" TIDAK ada di materi — jangan karang lagi). Dipakai `public/media/logo-prospect-black.png` di header terang. Logo putih (`logo-prospect-white.png`) masih ada untuk usage gelap.
- Utilitas: `card-soft` (kartu putih + shadow), `card-lift` (hover lift), `btn-pop`, `eyebrow` (titik merah via ::before), `ghost-word` (kata besar transparan), `art-dots`, `art-blob`, `art-pitch`, `art-pitch-orange`, `art-court`, `art-balls`, `art-balls-orange`, `art-net`, `art-track`, `art-stripes`, `sport-ball` (bola CSS), `art-ring`, `art-diamond`.
- Utilitas premium baru (Okt 2026): `.gallery` + `.gallery img` (crossfade autoplay murni CSS, durasi via `--gallery-step`), `.ken-burns` (zoom 20s untuk background foto), `.rail-wrap` + `.rail` (rail horizontal autoplay, `translateX(-50%)`, pause saat hover/focus, `--rail-speed`), `.art-panel` (radial glow premium).
- Utilitas arah desain **"Broadcast / Scoreboard"** (Okt 2026): `.split-word` (kata tetap utuh saat GSAP SplitText), `.spot` + `.spot::before` (sorotan kartu ikut kursor, butuh atribut `data-spot`), `.ticket` + `.ticket::before/::after` + `.ticket-perf` (notch sobek ala tiket), `.score-digits` (angka tabular ala papan skor), `.jersey` (art kartu pemain: gradasi oranye + garis diagonal + highlight), `.ribbon` + `.ribbon-pill` (pita berjalan), `.ticker-fade` (mask tepi yang memudar untuk ticker).
- Mask rail/ticker: `.rail-wrap` memakai `mask-image` linear-gradient 9%/91%; `.ticker-fade` 12%/88% (mobile 26%/74%). `.ticker-fade` **wajib ditulis setelah** `.rail-wrap` agar menang by source order (seleksi specificity sama).
- **Jebakan Tailwind v4 (penting)**: CSS kustom yang tidak diberi `@layer` **mengalahkan** utility Tailwind (utility ada di `@layer utilities`). Contoh nyata: `position: relative` di `.jersey` menimpa utility `absolute inset-0` → tinggi elemen jadi 0 → banner coach tampak hitam. Kalau utility yang harus menang, bungkus CSS kustom dengan `@layer components`.
- Komponen reusable baru: `src/components/SportArt.astro` (SVG inline varian `stadium|court|net`, prop `stroke` + `opacity`) dan `src/components/AutoGallery.astro` (galeri foto autoplay props `images`, `step`, `class`, `imgClass`). Dipakai di Level & Journey, Program, Testimonials, Coaches, Berita, Workshop, dan CTA.
- Komponen baru: `src/components/TickerRibbon.astro` — pita ticker berjalan (props `items`, `speed`, `tone` = `ink|brand|none`, `class`). Root = `.rail-wrap ticker-fade overflow-hidden`. Dipakai di StatsBar (scoreboard) dan section lain.
- Utilitas & komponen homepage (Okt 2026, revisi "Mitra + Program"): `.crest*` (lencana mitra SVG), `.live-badge` + `.live-dot` (badge "Online" hijau berdenyut), `.prog-bg*` + `.prog-card` (kartu program yang menyatu dengan latar), `.vip-card*` + `.vip-rule` + `.vip-cta` (kartu Membership premium). Komponen: `src/components/PartnerLogo.astro`, `src/components/ProgramBackdrop.astro`, tipe `CrestShape` di `src/data/crest.ts`.
- **Warna kategori berita** (Okt 2026): `src/data/categories.ts` → `categoryStyle(kategori)` mengembalikan `{ tone, text, border, dot, wash }`. Tiga tone: `Bintang` = emas, `Kolaborasi` = oranye, `Berita` = merah; kategori lain otomatis jatuh ke tone default (tidak error). Dipakai bareng di `functions/berita/[slug].ts` (HTML mandiri) dan `src/components/islands/BeritaList.svelte` — **satu sumber kebenaran** untuk warna label. Kontras chip sudah diuji: bintang 7.4:1, kolaborasi 5.2:1, berita 6.1:1.
- **Jebakan kontras kartu di section gelap**: `.surface-ink` memberi `color:#fff` ke seluruh turunannya. Kartu terang (`.card-soft`, `.prog-card`) **wajib** mendeklarasikan `color` sendiri — kalau tidak, judul kartu ikut putih dan hilang di atas gradient krem. `.prog-card` sudah mengaturnya (`color: var(--color-ink)`).
- ~~Admin **tetap dark** (pakai `bg-ink`/`text-bone`) — jangan di-sweep saat ganti tema.~~ **TIDAK LAGI BERLAKU (30 Okt 2026)**: permintaan klien "jangan hitam dong adminnya putih saja yang clean dan terlihat profesional saas" → panel admin sekarang **light/putih**. Lihat §25. Jangan revert ke dark.

---

## 7. Sistem animasi (semua di `src/scripts/fx.ts` + CSS)

| fitur | Implementasi |
|---|---|
| Curtain wipe | `.page-curtain` CSS, gradient oranye→kuning + wordmark "PROSPECT", 0.85s, auto selesai walau JS mati |
| Hero intro | CSS `@keyframes hero-up/hero-title/hero-photo` pada `[data-hero="badge|title|sub|photo|cta"]` (delay 0.12→0.9s) |
| Judul section | GSAP **SplitText** (`type: 'chars,words'`, `mask: 'chars'`, `wordsClass: 'split-word'`, `autoSplit: true`) + ScrollTrigger `once` — hanya heading `.display` yang **tidak** punya `data-reveal`/`data-hero` dan bukan di dalam `astro-island`. `words` itu wajib: tanpa itu kata patah di tengah ("KABAR TERBA/RU") |
| Reveal on-scroll | IntersectionObserver → `.rd-in`; stagger otomatis per `[data-reveal-group]` (90ms/EL, max 540ms) |
| Smooth scroll | **Lenis** (lerp 0.1) + anchor scroll offset −76px |
| Magnetic button | `motion` (spring) + pointermove pada `[data-magnetic]` |
| Mouse spotlight | `.hero-glow` radial gradient mengikuti kursor (`--mx/--my`, lerp 0.08) |
| Spotlight kartu | `initCardSpotlight()` — pointermove pada `[data-spot]` mengisi `--mx`/`--my` (persen), dipakai kelas `.spot`; hanya di pointer halus (desktop) |
| Scroll progress | `.scroll-progress` `scaleX` di atas (lerp 0.12) |
| Gerak kontinu | Semua motif sport bergerak: `stripe-move`, `motif-drift`, `pitch-drift`, `track-drift`, `float` pada bola, ring dashed berputar, plus rail autoplay (`rail-slide`), galeri crossfade (`gallery-fade`), dan ken-burns (`ken-burns`) |
| Toggle animasi | **Dihapus (Okt 2026)** — tombol "Animasi" di kiri bawah sudah dihapus dari `Base.astro` + `fx.ts` + CSS. User: "ko malah aneh ada nyalakan animasi gimana sih" |
| Reduced motion | `prefers-reduced-motion` **diabaikan** sejak Okt 2026 (user mengeluh "animasi ga jalan di desktop" — ternyata macOS Reduce Motion ON). `fx.ts` sekarang `const reduced = false;` dan blok `@media (prefers-reduced-motion: reduce)` di CSS sudah dihapus |

**Catatan penting untuk agent berikutnya:** user sempatyskali melaporkan "animasi ga jalan" → 3 penyebab nyata: (1) cache browser → hard refresh, (2) ~~toggle diklik ke OFF~~ (toggle sudah dihapus), (3) OS Reduce Motion ON (sudah diabaikan). Karena itu motion intro dipindah dari GSAP ke **CSS murni** (tidak bergantung JS). Kalau menambah motion baru, jangan pernah reinstate gate `prefers-reduced-motion`.

---

## 8. Aset gambar (`Website Material/` → `public/media/`)

Semua foto materi sudah terpasang. Sumber = `Website Material/Images/`:

| File public | Sumber | Dipakai di |
|---|---|---|
| `athletes-cutout.webp` (910×405, alpha) | `Managed by (1).png` | hero home (potong alpha bbox → webp) |
| `mic-kid.jpg` | `Workshop/Prospect (1).png` | kartu About "Berani Bicara." |
| `interview-zone.jpg` | `Workshop/Prospect 2 (1).png` | hero detail Workshop Premium |
| `workshop-crowd.jpg` | `Workshop/WhatsApp Image ...jpeg` | hero detail Workshop Starter + hero Berita |
| `session-online.jpg` | `Student's Bright Video Study Call (1).png` | hero Tentang |
| `docs-1..8.jpg` | 8× `Workshop/BIA_*.JPG` | galeri "Suasana di lapangan" (detail workshop) |
| `workshop-live.jpg`, `workshop-live-2.jpg` | BIA_0403, BIA_0358 | section Workshop (home) |
| `session-{elite,premium,smallgroup}.jpg` | stock session photos | backdrop hero detail program **+ header kartu program (home)** |
| `program-elite.jpg` | crop `Website Material/Program - Product/1.png` (foto klien asli) | background band "Membership Program" (home) |
| `logo-prospect-black.png` | `Logo Black.png` | header (light) |
| `logo-prospect-white.png` | konversi Logo Black | footer/band gelap |
| `hero-athletes.jpg` | studio shot 7 atlet | fallback hero program detail |
| `workshop-hero.jpg` | — | fallback hero detail workshop "Pro" |

Belum dipakai & masih ada: `Online Soccer Coaching Session (1).png`, `Teenager's Sunny Video Session (1).png`, `Video Call at the Sports Academy (1).png`, `src/assets/generated/*` (a1–a5 MiniMax; sebagian sudah dilepas dari halaman).

---

## 9. Database (D1 `prospect-db`)

| Tabel | Isi |
|---|---|
| `leads` | lead dari form (nama, wa, program, catatan, sumber, status, created_at) |
| `settings` | key-value (wa_number, popup aktif, ga4_id, ...) |
| `wa_clicks` | tracking klik CTA (slug, created_at) |
| `pageviews` | beacon trafik pihak-pertama (path, ref_domain, device, visitor-hash, ts) — migration `0006_traffic.sql` |
| `posts` | berita: slug, title, desc, kategori, pub_date, body(markdown), status, cover, updated_at |
| `content_items` | id, kind(`testimonials`/`faq`/`stats`), title, body, meta(JSON), sort, active |

Tabel `programs/workshops/testimonials/coaches/partners` ada di migration 0001 tapi **data sumber kini ada di `src/data/*.ts`** (statis) — content_items yang dipakai admin.

Perintah:
```bash
npm run db:migrate:remote   # apply migrations ke D1 produksi
npx wrangler d1 execute prospect-db --remote --file migrations/0002_content.sql
npx wrangler d1 execute prospect-db --remote --command "SELECT count(*) FROM posts"
```

---

## 10. API surface

**Publik**: `GET /api/posts` · `GET /api/content/{testimonials|faq|stats}` · `GET /api/settings` · `POST /api/leads` (dual-mode) · `POST /api/click` · `POST /api/pv` (beacon trafik, tanpa cookie) · `GET /media/{file}` (pengiriman objek R2, lihat §24.2).
`POST /api/leads` dual-mode:
- `content-type: application/json` → balas `{ ok: true, waUrl }` (dipakai popup pendaftaran, tidak pindah halaman).
- form-encoded (classic) → 302 redirect ke `wa.me` (dipakai `LeadForm.astro` di `/tentang`).
Isi JSON: `{ nama, wa, program, catatan, sumber }`. Insert ke D1 `leads` + balas link `wa.me` bernomor admin. Kegagalan DB/settings **tidak** menggagalkan handoff ke WhatsApp (di-`try/catch`).
**Admin** (butuh cookie `pa_admin`): `POST /api/admin/login` · `POST /api/admin/logout` · `GET /api/admin/stats` · `GET/PATCH /api/admin/leads` · `GET/PUT /api/admin/settings` · `GET/POST /api/admin/posts` · `PUT/DELETE /api/admin/posts/{slug}` · `GET/POST /api/admin/content/{kind}` · `PUT/DELETE /api/admin/content/{kind}/{id}` · `GET /api/admin/media` (status R2) · `GET/POST /api/admin/upload` (butuh bucket R2 ter-bind).
Validator bersama: `functions/_lib/content.ts` (KINDS, FAQ_GRUP, KATEGORI, POST_STATUS, parsePost/parseContent, coverPath).

### 10.1 Cover / featured image berita (Okt 2026)

**Dua sumber data berita** — jangan dicampur:
- `src/content/berita/*.mdx` (collection Astro) → dipakai **halaman list** `/berita/` (static, punya frontmatter `cover`).
- D1 `posts` → dipakai **halaman detail** `/berita/{slug}` yang di-render oleh **Pages Function `functions/berita/[slug].ts`** (bukan halaman Astro).

Kolom `cover` ditambahkan ke tabel `posts` lewat `migrations/0004_posts_cover.sql`; nilainya diisi `migrations/0005_seed_covers.sql` (dari frontmatter MDX). **Ordering penting**: `0003_seed_posts.sql` (seed lama) jalan sebelum `0004`, jadi file seed itu tidak boleh menyebut kolom `cover`.
Regenerasi dua-duanya: `node scripts/gen-posts-seed.mjs` (menulis 0003 + 0005).

Alur data cover:
1. Admin isi kolom "Gambar utama" di panel admin → `POST/PUT /api/admin/posts` → `parsePost` → `coverPath()` (hanya path `/media/...` yang diterima, sisanya jadi string kosong).
2. `GET /api/posts` mengirim `cover` → dipakai kartu di `/berita/`.
3. `functions/berita/[slug].ts` SELECT `cover` → render `<figure class="hero">` + `og:image`/`twitter:image` + JSON-LD `image`.
4. Kalau `cover` kosong → fallback per kategori (`Kolaborasi` → `workshop-crowd.jpg`, `Bintang` → `hero-athletes.jpg`, `Berita` → `interview-zone.jpg`).

---

## 11. Admin panel

`/admin` → island `AdminApp.svelte` (panel **putih/clean SaaS** sejak 30 Okt 2026 — lihat §25.1, 6 tab):
- **Dashboard** — hero ringkasan N hari + 4 kartu KPI (sparkline + chip delta vs periode lalu), grafik SVG trafik harian interaktif (hover kolom + tooltip), corong konversi (kunjungan→klik WA→lead), halaman terpopuler, lead terbaru, plus kartu "Sedang aktif" realtime di sidebar. Rentang 7/14/30 hari.
- **Analitik** — sumber trafik (referrer), perangkat pengunjung (stacked bar), tabel semua halaman (PV/UV), ranking tombol WhatsApp paling diklik, 4 mini-stat.
- **Leads** — filter status, ubah status, catatan, tombol buka WA.
- **Konten** (`AdminKonten.svelte`) — sub-tab Berita / Testimoni / FAQ / Statistik; slug otomatis dari judul, body markdown, delete dengan konfirmasi, simpan ke D1 (tanpa deploy). Kolom **"Gambar utama"** di form Berita bukan lagi kolom path manual: ada **drop-zone unggah** (file → R2 → path terisi otomatis), pratinjau 16:9, dan **"Pustaka media"** untuk memilih berkas yang sudah ada. Detail di §25.2.
- **Media** — status R2 live via `/api/admin/media` (`siap` + nama bucket). Selama R2 belum aktif, tab menampilkan pesan blocker + langkah aktivasi jujur; begitu bucket ter-bind, UI unggah (`/api/admin/upload`) + daftar berkas (grid kartu: thumbnail, ukuran, tanggal, tombol "Salin path" yang berubah jadi "Tersalin", dan "Buka") langsung aktif tanpa ubah kode.
- **Pengaturan** — nomor WA, aktif/nonaktif popup, GA4 ID (validasi `/^G-[A-Z0-9]{6,20}$/`).

---

## 12. Operasional (perintah & jebakan)

```bash
# WAJIB: env Cloudflare harus di-export, `source` saja TIDAK cukup
set -a && source .env.cf && set +a
npx wrangler pages deploy dist --project-name myprospect --branch main --commit-dirty=true

npm run build          # 12 halaman, ~15s
npm run dev            # lokal
```

Jebakan penting:
1. **`.env.cf` tidak ter-export** → `source .env.cf && npx wrangler ...` memakai OAuth login account yang salah → error `Authentication error [code: 10000]`. Selalu pakai `set -a; source .env.cf; set +a`.
2. Cloudflare cache asset 7 hari (`s-maxage=604800`) tapi nama file hashed → aman. HTML `max-age=0, must-revalidate` → selalu fresh.
3. Remote git **harus SSH** (HTTPS+PAT 403).
4. `functions/berita/[slug].ts` = template HTML mandiri → **warna hardcode**, tidak ikut Tailwind. Kalau ganti tema, edit CSS inline file itu.
5. Halaman admin pakai `bg-ink`/`text-bone` (gelap) — jangan ikut disweep saat restyle.
6. Astro build = **static**; perubahan di `src/data/*.ts` butuh deploy (konten D1 tidak).
7. Svelte 5: props read-only (salin ke `$state` lokal untuk override live-fetch), `oninit` bukan `on:init`, tidak boleh `class:foo/bar` (pakai array class), island di `src/components/islands/` → import `../../lib/...`.
8. Tailwind v4: token via `@theme` di CSS (tanpa `tailwind.config`), utility arbitrary opacity perlu `!` bila mau mengalahkan class unlayered (mis. `!text-crimson/[0.08]`).
9. Komentar di kode **hanya untuk pitfall non-obvious** (mis. konflik layer Tailwind v4, alasan `position: relative` dilarang di `.jersey`). Jangan menambah komentar naratif.
10. Semua copy situs berbahasa Indonesia.

---

## 13. Verifikasi

### 13.1 Tool in-repo (WAJIB setiap perubahan visual)

| Tool | Lokasi | Cara |
|---|---|---|
| Audit frame + overflow + reveal | `scripts/audit-frames.mjs` | `node scripts/audit-frames.mjs <base-url> <tag>` → screenshot per viewport-slice ke `/tmp/f-<tag>-<view>-<NN>.png` (desktop 1440×900 + mobile 390×844), plus laporan `horizontalOverflow`, elemen meluber, `revealNotIn`, dan error console. **Frame-nya lalu dibaca lewat vision** — wajib, angka saja tidak menangkap "kepotong"/"ga rapih" |
| Deteksi kepotong / tumpang tindih | `scripts/audit-clip.mjs` | `node scripts/audit-clip.mjs <base-url>` → 10 halaman × 2 viewport; cek (1) teks terpotong di elemen `overflow:hidden`, (2) elemen keluar viewport tanpa mask ancestor, (3) elemen `fixed` menutupi elemen interaktif >30%. Target **0 overflow & 0 covered** |
| Chromium headless | `/Users/maabook/Library/Caches/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-mac-arm64/chrome-headless-shell` | dipakai kedua script di atas (`playwright-core` di `node_modules`, gitignored) |
| Screenshot + audit kontras | `scripts/verify-home.mjs` | `node scripts/verify-home.mjs <base-url>` → screenshot per area (partners/badge/vip/level/program + full page) ke `~/Downloads/vc-*.png` untuk desktop 1440×900 + mobile 390×844, sekaligus audit kontras WCAG (kirim `oklab()` + compositing alpha + sampling gradient). **Screenshot wajib dibaca via vision** — angka kontras tidak menangkap "kepotong"/"tidak premium" |
| Screenshot + kontras (home + detail berita) | `scripts/verify-revisi.mjs` | `node scripts/verify-revisi.mjs <base-url>` → **2 halaman** (home & `/berita/bintang-gohan`) × 2 viewport; screenshot per area ke `~/Downloads/rv-*.png`, audit kontras WCAG dengan selector per halaman, plus cek overflow (`docScrollW` vs viewport). Elemen yang **sengaja disembunyikan** di viewport itu (mis. `.dock` yang `display:none` di ≥1024px) otomatis ditandai *skip*, bukan gagal — kalau tidak, screenshot-nya timeout dan muncul alarm palsu. Untuk revisi yang menyentuh header/footer/program/mitra **dan** halaman detail berita |
| E2E domain + admin guard | `scripts/verify-domain.mjs` | `set -a && . ./.env.admin && set +a && node scripts/verify-domain.mjs [base-url]` → **39 cek**: guard admin (401 + 302 `/admin/`→login), login benar/salah + atribut cookie (`HttpOnly`/`Secure`/`SameSite=Lax`), semua endpoint admin 200+JSON, logout, API publik, canonical/`og:url` pakai domain kustom, **www → apex 301**, sitemap + robots, plus alur lead (302 → `wa.me` + validasi 400). **Wajib tiap kali domain/SEO/admin/alur lead diubah** |
| E2E UI panel admin (browser sungguhan) | `scripts/verify-admin-ui.mjs` | `set -a && . ./.env.admin && set +a && node scripts/verify-admin-ui.mjs [base-url]` → **64 cek** di desktop 1440×900 + mobile 390×844: `/admin/` tanpa login terlempar ke login, password salah memunculkan "Password salah.", password benar masuk, **tiap tab menegaskan nav menyorot tab yang benar + kontennya benar-benar termuat**, dashboard (KPI/corong/halaman/lead benar-benar ter-render, 6 jalur SVG chart, 14 kolom grafik, ganti periode 30 hari, hover tooltip), tulis beneran (klik Simpan pengaturan lalu bandingkan API sebelum/sesudah — idempoten karena PUT settings per-key upsert), Keluar balik ke login, console error + request gagal. Assertion hover tooltip **kondisional**: kalau periode ini ada hari berp-data → tooltip wajib muncul; kalau kosong → yang diperiksa pesan keadaan kosong ("Belum ada trafik"), bukan tooltip. Password dibaca dari env dan **tidak pernah dicetak**. Screenshot `ad-*.png` **wajib dibaca via vision** |
| E2E analitik + CRUD berita | `scripts/verify-analitik.mjs` | `set -a && . ./.env.admin && set +a && node scripts/verify-analitik.mjs [base-url]` → **46 cek**: beacon `/api/pv` (204, body rusak ditoleransi, path non-relatif ditolak), angka stats (pv/uv, deret 7 hari terisi per hari), `/admin` tersaring, trafik bot/CLI **tidak** dihitung, perangkat desktop/mobile/tablet terklasifikasi, referrer `google.com`/`instagram.com` terparse, referrer internal tidak dihitung, `hari` asing → fallback 14, 401 tanpa login, klik WA masuk KPI + daftar CTA, plus **CRUD berita penuh** (POST 201 → halaman publik 200 + cover + canonical + `og:url` + beacon → PUT edit → status draft → publik 404 → ganti slug ditolak 400 → DELETE → 404 → 3 berita asli tetap utuh → POST tanpa auth 401). Skrip menulis baris uji ke D1 → **wajib bersihkan** (perintah ada di footer keluarannya) |
| E2E R2 (unggah → URL publik) | `scripts/verify-media.mjs` | `set -a && . ./.env.admin && set +a && node scripts/verify-media.mjs [base-url]` → **18 cek**: login → `/api/admin/media` (siap + nama bucket + tidak ada langkah aktivasi lagi) → daftar berkas → **unggah nyata** (PNG asli dari repo via multipart `FormData` + `Blob`) → format kunci `media/YYYYMMDD-<slug>-<8hex>.<ext>` → nama asli di-slug-kan → ukuran dikembalikan → **URL publik `/media/<file>` 200 + content-type + magic bytes PNG + cache-control jangka panjang** → 3 gambar bawaan `public/media/` tetap 200 → media tak dikenal 404 → berkas uji muncul di daftar admin. Berkas uji diunggah ke bucket **sungguhan** → **wajib dihapus** (perintah ada di footer keluarannya) |
| E2E kontrol unggah gambar utama | `scripts/verify-konten.mjs` | `set -a && . ./.env.admin && set +a && node scripts/verify-konten.mjs [base-url]` → **13 cek**: form berita terbuka → kolom "Gambar utama" **berupa kontrol unggah** (bukan kolom path manual) → path manual tetap ada sebagai fallback → label lama "Gambar utama (path …)" sudah hilang → **unggah berkas nyata** → path `/media/YYYYMMDD-<slug>-<hex>.<ext>` terisi otomatis → pesan sukses tampil → **pratinjau benar-benar termuat** (`naturalWidth > 0`, bukan cuma `src` terpasang) → **pustaka media** menampilkan berkas dan bisa dipilih untuk mengganti gambar → layout mobile: zona unggah & tombol "Terbitkan" **tidak tertutup nav fixed** → tanpa console error & tanpa request gagal. Sengaja **tidak menyimpan berita** → tidak ada data uji di D1; yang tertinggal hanya satu berkas di R2 → **wajib dihapus** (perintah ada di footer keluarannya) + purge edge |

Alur wajib: `npm run build` → serve `dist/` → `audit-frames.mjs` → **baca frame via vision** → perbaiki → ulangi → `audit-clip.mjs` → deploy → audit live → commit+push.

> Catatan: laporan "clipped" dari `audit-clip.mjs` bisa false-positive (wrapper mask per-karakter GSAP SplitText, pita ticker yang memang lebih lebar, `line-clamp-2`). Yang jadi acuan: **overflow** dan **covered**.

### 13.2 Tool luar repo (opsional/lengkap)

| Tool | Lokasi | Cara |
|---|---|---|
| Audit 22 kombinasi (overflow/small tap/console) | `/Volumes/miniex/Users/maabook/.config/opencode/skills/pw-vision/scripts/myprospect-audit.mjs` | `node myprospect-audit.mjs <base-url> <out.json> <shotdir>` → target **0 bug** |
| E2E konten | `.../pw-vision/scripts/mp-konten-e2e.mjs` | 24/24 (create/edit/delete post live + hidrasi publik) |
| E2E admin | `.../mp-admin-e2e.mjs` | login/leads/settings |
| E2E form | `.../mp-form-e2e.mjs` | lead → D1 → WA 302 |
| Bukti visual animasi | `docs/preview/desktop-intro.gif`, `desktop-intro-filmstrip.png` | rekaman 1440×810 |

Status terakhir: **audit 22/22 · 0 bug**, e2e konten 24/24, motion probe (title opacity 0→1, curtain 794px→0, progress bar 0→0.33, spotlight `--mx` 50%→25%, 2.268 piksel berubah dalam 2 detik = gerak kontinu). Okt 2026 (revisi Broadcast/Scoreboard): `audit-clip.mjs` → **0 overflow & 0 covered** di 10 halaman × 2 viewport (local & live); `audit-frames.mjs` di live → `horizontalOverflow:false`, `revealNotIn 0/12`, console error `[]`.

---

## 14. SEO & analytics

- `src/lib/seo.ts`: `organizationSchema` (EducationalOrganization), `faqSchema` (FAQPage), `courseSchema` (Course), `jsonLd()`.
- JSON-LD terpasang di: home (Organization+FAQ), `/faq` (FAQ), detail program & workshop (Course), detail berita (NewsArticle, di dalam function template).
- OG image dari `src/assets/generated/a2-og-bg.jpg` (masih nuansa gelap — **belum** di-regenerate ke tema terang).
- `og:url` **ditambahkan Okt 2026** (sebelumnya tidak ada sama sekali) + `og:site_name` + `twitter:title/description/image`. `canonicalUrl` dihitung sekali di `src/layouts/Base.astro` lalu dipakai bersama untuk `<link rel="canonical">` **dan** `og:url` supaya tidak pernah beda host.
- GA4: loader runtime di `Base.astro` ambil `/api/settings`, injeksi gtag bila ID valid. **Belum ada ID GA4** (menunggu klien).
- Sitemap: `@astrojs/sitemap` (aktif). `plan.md` menyebut `astro:transitions` sudah diuji.

### 14.1 Analitik trafik sendiri (Okt 2026) — tanpa GA4

GA4 butuh ID klien yang belum ada, jadi trafik diukur sendiri lewat beacon milik sendiri (tanpa cookie pihak ketiga):
- `functions/api/pv.ts` — `POST /api/pv` menerima `{ p: path }` → simpan baris `pageviews` (path, ref_domain, device, visitor, ts).
- Pemanggil: `src/layouts/Base.astro` (semua halaman, kecuali `/admin`) + beacon tambahan di `functions/berita/[slug].ts` (halaman detail berita sebelumnya **tidak** punya tracking klik sama sekali).
- **Privasi**: tidak ada IP mentah & tidak ada cookie. `visitor` = SHA-256(`hari|ip|user-agent`) dipotong 32 hex → gunanya hanya menghitung pengunjung unik per hari.
- **Bot/CLI dikecualikan** dari angka dashboard lewat kelas `device='bot'` (filter `MANUSIA` di semua query `pageviews`) — kalau tidak, `curl`/`wget` dari monitoring akan gelembungkan angka.
- Pembagian hari memakai **WIB** (`+7 hours`), sama dengan zona waktu lokal klien.
- Query dashboard: `functions/api/admin/stats.ts` → 16 query paralel → KPI + perbandingan periode lalu, deret waktu harian, top halaman, sumber/referrer, perangkat, corong konversi, realtime 30 menit, CTA ranking, lead terbaru. Kunci lama (`leadsTotal`, `leadsHariIni`, `klikWa7Hari`, `leadsBaru`) **dipertahankan** supaya konsumen API lama tidak rusak.
- Angka **dapat sedikit berbeda dari GA4** (beacon bisa hilang saat tab ditutup cepat, bot tidak dihitung, tidak ada cross-device join).

---

## 15. Blocker (butuh klien)

1. ~~**R2 belum aktif**~~ → **SELESAI (30 Okt 2026)**: klien sudah klik **Activate** di dashboard Cloudflare. Bucket `prospect-media` dibuat, di-bind lewat blok `r2_buckets` di `wrangler.jsonc` (binding `MEDIA_BUCKET`), route pengiriman publik `/media/*` ditambahkan, dan tab Media kini menampilkan banner hijau "R2 AKTIF — SIAP UNGGAH". Detail, bukti, dan jebakannya di **§24**.
2. **ID GA4** belum ada (loader sudah siap).
3. ~~**Domain kustom**~~ → **SELESAI (Okt 2026)**: `myprospect.asia` + `www.myprospect.asia` sudah ter-attach ke Pages project dan `verification_data.status = active`. Lihat §22.1 untuk langkah & jebakan DNS-nya.
4. **Harga Workshop Pro** belum ada (tampil "Custom").
5. **Folder kosong** di `Website Material/`: `Coaches Picture/`, `Copywriting/`, `Testimonials/` — menunggu file klien.
6. **Handle IG/TikTok** resmi belum ada (teks di program menyebut "Konten atlet di Instagram Prospect Asia").
7. Foto klien final untuk program/coaches (yang dipakai sekarang mix foto workshop + stock session).
8. **Logo resmi mitra** (Djanur Football Academy, Dream Baller ID, PB Jaya Raya Ragunan, Akademi Futsal Margahayu Raya, MFC Marunda, SSBRBC, Little Pep, Pep Sports, Exortive, RS Limijati) — **sudah dicek ulang di Okt 2026**: nol file logo di repo, `public/media/`, `Website Material/`, ZIP klien, dan PDF klien (PDF-nya **0 objek gambar** — 0 `/Subtype /Image`). Poster `Website Material/Program - Product/1-3.png` juga sudah dibuka satu per satu: hanya berisi logo Prospect Asia, bukan logo mitra. **Putaran audit kedua (Okt 2026)** menambahkan: `Program - Product/Workshop.pdf` punya **24 objek gambar**, tapi setelah diekstrak hanya **6 gambar unik** (logo Prospect Asia ×2, logo "P" putih, satu gradien oranye polos, 2 foto) — **tetap tidak ada logo mitra**; dan ZIP klien (25 entri) identik dengan folder hasil ekstrak, jadi tidak ada file tersembunyi. Detail di §22.3. Jadi lencana SVG tetap dipakai. Taruh file asli di `public/media/partners/<slug>.png|svg|jpg|webp` → otomatis terpakai tanpa ubah kode.

---

## 16. Sisa pekerjaan yang disarankan (urut prioritas)

> Arah desain aktif sejak Okt 2026 = **"Broadcast / Scoreboard"**: pita ticker, papan skor, tiket sobek, kartu pemain ala jersey, spotlight kursor. Artwork coach saat ini **CSS/SVG art** (bukan foto) karena ImageGen kehabisan kredit dan `Website Material/Coaches Picture/` masih kosong.

1. Regenerasi OG image + aset generated ke nuansa terang (MiniMax image-01) — `src/assets/generated/a2-og-bg.jpg` dst.
2. ~~Pasang custom domain~~ → **SELESAI (Okt 2026)**, lihat §22.1. `SITE.url` & canonical sudah `https://myprospect.asia` sejak awal.
3. ~~Aktifkan R2~~ → **SELESAI (30 Okt 2026)**, lihat **§24**. Jalur unggah **dan** pengiriman publiknya sudah jalan teruji end-to-end (18 cek): unggah di tab Media → objek R2 → `/media/<file>` 200 → siap ditempel ke kolom "Gambar utama".
4. Masukkan GA4 ID via admin Pengaturan (tanpa deploy).
5. Selesaikan klaim "SPEAK LOUD!"-style copy atau formalkan bahasa (copy sekarang playful; klien mungkin mau lebih formal).
6. Tambah halaman artikel berita dari MDX lama ke D1 (agar bisa diedit admin) — `scripts/gen-posts-seed.mjs` sudah disiapkan.
7. Checklist a11y: kontras teks oranye di atas putih (`brand-dark` untuk teks kecil), target sentuh ≥44px (audit terakhir 0 masalah). `prefers-reduced-motion` **tidak** lagi dipakai sebagai gate animasi (user minta animasi selalu jalan).
8. Ganti artwork `.jersey` kartu coach dengan foto asli begitu `Website Material/Coaches Picture/` terisi (struktur kartu sudah siap: banner `aspect-16/11`, inisial, badge posisi, skill bar, footer booking WA).

---

## 17. Git & alur kerja

- Branch: `main` (langsung ke produksi via Pages). Remote: SSH `git@github.com:ReqTimeout/myprospect.asia.git`.
- Commit style (dipakai repo): `feat(scope): ...` / `fix(scope): ...` / `docs(scope): ...` — Bahasa Indonesia.
- Wajib: `npm run build` → deploy → audit → commit+push. Jangan commit `dist/`, `.env*`, `*.zip`.
- Semua aset asli klien ada di `Website Material/` (**tidak** di-commit? — folder ini tracked di repo, tapi file `.zip` di-ignore).

---

## 18. Ringkasan untuk agent yang lanjut

1. Baca §4 (routing) & §6 (tokens) sebelum menyentuh kode.
2. Kalau ganti tema: ubah `@theme` di `src/styles/global.css`, **kecuali** `ink-2`/`bone` (hanya teks di permukaan gelap), dan **kecuali** `functions/berita/[slug].ts` (CSS inline). Panel admin **tidak** lagi memakai `ink-2`/`bone` — sekarang putih (lihat §25.1).
3. Kalau menambah motion: taruh di `src/scripts/fx.ts` (JS) atau keyframes CSS. **Jangan** reintroduce gate `prefers-reduced-motion` — user minta animasi selalu hidup.
4. Kalau menambah konten: pakai API admin + D1 (tanpa deploy) — jangan tambah file MDX kecuali seed.
5. Verifikasi selalu: `npm run build` → `wrangler pages deploy` → `myprospect-audit.mjs` (harus 0 bug) → screenshot → commit+push.
6. Kalau user bilang "animasi ga jalan": cek (a) hard refresh, (b) aset JS/CSS lama di cache. Toggle animasi **sudah dihapus** — jangan cari lagi.
7. Kalau menambah heading baru: jangan pakai kelas `.hl-brand` (gradient `background-clip:text`) di dalam elemen yang kena GSAP SplitText — SplitText memecah karakter dan gradient pecah → teks jadi tak terlihat. Pakai `text-brand-dark`.
8. Kalau menambah utility CSS kustom: beware **Tailwind v4 layering** — CSS tanpa `@layer` mengalahkan utility Tailwind. Bungkus dengan `@layer components` bila memang mau utility yang menang (contoh kasus `.jersey` + `absolute inset-0`).
9. Setiap perubahan visual **wajib** diverifikasi dua viewport (desktop 1440×900 & mobile 390×844) lewat `scripts/audit-frames.mjs` → **baca frame via vision** → lalu `scripts/audit-clip.mjs` (target 0 overflow & 0 covered). Cek khusus mobile: bubble WhatsApp **tidak boleh muncul** (Dock mobile sudah punya tombol Chat) supaya tidak menutupi CTA/judul.
10. Popup WA desktop auto-muncul lalu **menyempit sendiri** ke bubble setelah 6,5 detik (`collapse()` di `WaPopup.svelte`) supaya tidak terus menutupi isi kartu. Kalau user sudah klik CTA, timer dibatalkan dan kartu tetap terbuka. Di mobile kartu **tidak pernah** muncul otomatis — bubble kecil + tombol Chat di Dock saja.
11. Kalau menambah field gambar/berkas di admin: **jangan** minta admin mengetik path. Pakai `POST /api/admin/upload` → isi field dengan `'/' + key` + tampilkan pustaka berkas yang ada (pola yang sudah dipakai di kolom "Gambar utama", §25.2).

---

## 19. Pendaftaran pop-up + sistem section (Okt 2026)

### 19.1 Popup pendaftaran (`src/components/islands/RegisterModal.svelte`)

- Island Svelte 5, dipasang **satu kali** di `src/layouts/Base.astro` → otomatis aktif di semua halaman.
- CTA mendaftarkan diri cukup diberi atribut:
  ```html
  <a href={waLink(...)} data-register data-program="Elite 1-on-1" data-source="program-elite-1on1">…</a>
  ```
  `href` tetap `wa.me` sebagai fallback kalau JS mati; island Delegate click `document` → `closest('[data-register]')` → `preventDefault()` → buka modal.
- `data-program` yang nilainya di luar daftar program tetap **masuk** sebagai opsi select (state `programTambahan`).
- Submit → `POST /api/leads` (JSON) → state sukses menampilkan tombol **Buka WhatsApp** (`href` = `waUrl` dari API). Tidak pakai `window.open` karena kena popup-blocker.
- Modal: bottom sheet di mobile (`items-end`, `rounded-t-3xl`, `animate-slide-up`), dialog centered di `sm:`. `ESC` tutup, klik backdrop tutup, `body` overflow dikunci saat terbuka.
- **Jebakan Svelte**: atribut HTML berisi kurung kurawal (`pattern="[0-9\s+()-]{10,18}"`) diparse sebagai **ekspresi** sehingga atributnya dibuang diam-diam → validasi format WA dilakukan manual di JS (`wa.replace(/\D/g,'')`).
- **Jebakan Svelte**: tanpa `bind:value`, isi `<input>` tidak masuk ke state → payload kosong. Semua field wajib `bind:value`.

### 19.2 Latar per-section + penanda chapter

- `src/styles/global.css` → kelas `.surface-warm` (paper-deep), `.surface-ink` (hitam = **highlight utama**), `.surface-hair` (garis rambut atas/bawah), `.surface-ink-hair`.
- Section dibungkus `<div class="surface-*">` penuh lebar di `src/pages/index.astro` (tanpa mengubah isi komponen).
- `src/components/Chapter.astro` → penanda `01`–`10` (nomor + label + garis). Props: `num`, `label`, `tone` (`ink`/`light`), `class`. Pakai `tone="light"` di atas latar gelap.

### 19.3 Ikon cabang olahraga

- `src/components/SportIcon.astro` → 9 SVG inline (sepak-bola, futsal, basket, voli, bulu-tangkis, renang, atletik, tinju, piala) dengan animasi per cabang.
- `src/data/sports.ts` → tipe `Sport` + data `cabangOlahraga`. **Wajib**: komponen Astro tidak bisa export type dari frontmatter → taruh di modul `src/data/*` lalu import.
- Kelas animasi CSS: `.si-roll .si-bounce .si-float .si-swing .si-wave .si-run .si-punch .si-shine` (keyframes dengan nama sama di `global.css`).

---

## 20. Revisi homepage: Mitra + Program (Okt 2026)

Enam permintaan klien via anotasi browser, semuanya sudah di-deploy & diverifikasi di desktop 1440×900 + mobile 390×844.

### 20.1 Lencana mitra (bukan logo asli)

- **Realita**: logo asli mitra **tidak ada** di repo, `public/media/`, `Website Material/`, ZIP klien, maupun PDF — dan tidak bisa di-scrape (Instagram memblokir). Jadi tidak dikarang warna brand palsu.
- Solusi: sistem **lencana SVG** di palet ink + aksen brand (`src/components/PartnerLogo.astro`), bentuk varies per mitra via `crest` (`shield|hex|round|banner|oval`, tipe di `src/data/crest.ts`). Monogram 2 huruf, stroke oranye, inner hairline putih.
- **Jalur logo asli sudah siap**: `PartnerLogo` checking `public/media/partners/<slug>.{svg,png,jpg,jpeg,webp,avif}` saat build (`existsSync`). Taruh file asli di folder itu → otomatis dipakai, **tanpa ubah kode**.
- Data: `src/data/partners.ts` → `Partner = { nama, slug, jenis, crest }`.

### 20.2 Badge "Online" hijau berdenyut

- `.live-badge` (hijau tua + border hijau + backdrop blur) + `.live-dot` dengan `::after` animasi `live-ring` (scale 1→3.4, opacity .8→0, 2s infinite).
- Dipakai di kanan-atas foto kartu program. Badge lama "ONLINE" oranye di kartu Small Group **dihapus** (duplikat kata) → diganti badge "KELOMPOK".

### 20.3 Kartu Membership premium

- `.vip-card`: border gradien emas (mask-composite) + 4 `.vip-card__corner` + `.vip-rule` + chip "Batch 01 · Kuota awal" + `.vip-cta` gradien emas→oranye + `.vip-card__shine` (sweep 5.5s).

### 20.4 Foto di Level & Journey

- `src/components/islands/LevelJourney.svelte`: `levelMeta` & `months` sekarang punya `foto`/`alt`; blok foto besar dibungkus `{#key active}` + `in:fade` (320ms) → foto berganti saat tab ditekan; thumbnail bulan 48×48.

### 20.5 Latar sporty pada section Program

- `src/components/ProgramBackdrop.astro` (z-0, `pointer-events:none`) + konten `relative z-10`: garis lapangan (drift), 4 bola (drift), sapuan cahaya (beam), vignette **yang gelapnya di tepi** supaya tengah tetap bersih.
- Kartu pakai `.prog-card` (gradient krem + rim + backdrop blur) → kartu terlihat menyatu dengan scene tapi tetap titik fokus.

### 20.6 Perbaikan kontras (harus dibaca!)

- **Judul kartu program sebelumnya putih di atas kartu krem → tidak terbaca sama sekali.** Penyebab: `.surface-ink` memberi `color:#fff` ke semua turunan, dan `.prog-card` tidak mendeklarasikan `color` sendiri. Fix: `.prog-card { color: var(--color-ink); }` + `text-ink` eksplisit di `<h3>`.
- `--color-brand-dark` digelapkan `#e05e00` → `#c04f00` (teks kecil oranye di atas putih kini 4.8:1, sebelumnya 3.6:1 gagal), lalu `#c04f00` → `#bc4c00` di revisi berikutnya karena label footer di atas `paper-deep` mentok di 4.49:1. Ini memengaruhi ~117 pemakaian `brand-dark` di seluruh situs.
- Harga utama `text-brand` → `text-brand-dark` (2.4:1 → 3.4:1), chip "Hemat" jadi `bg-brand text-ink`, angka indeks `01/02/03` → `text-brand-dark`, harga coret & "/6 sesi/bulan" → `text-ink/65`.
- Verifikasi: `scripts/verify-home.mjs` → audit kontras WCAG (harus 0 pelanggaran nyata; yang tersisa hanya false-positive teks di atas foto).

---

## 21. Revisi Okt 2026: 4 anotasi homepage + redesign detail berita

Menutup 4 anotasi browser di homepage + permintaan redesign halaman `/berita/<slug>`. Semua ter-deploy & terverifikasi di desktop 1440×900 + mobile 390×844: audit kontras bersih, 0 overflow, 0 console error, 0 request gagal.

### 21.1 Empat anotasi homepage

| Anotasi | Solusi | File |
|---|---|---|
| Mitra di mobile jangan terlalu panjang untuk di-scroll | Grid **2 kolom** di mobile (kartu vertikal: logo atas, nama bawah), 3 kolom di `lg`. Tinggi section mitra turun ~50% | `src/components/PartnersSection.astro` |
| "yang paling murah di atas" | Array `programs` diurutkan **murah → mahal** (Small Group 299k → Elite 1.299k → Premium 2.499k). Nomor 01/02/03 ikut berubah otomatis karena dihitung dari index array | `src/data/programs.ts` |
| Footer 2 kolom di mobile | `grid-cols-2` + blok brand `col-span-2`; `md:grid-cols-3` seperti sebelumnya. Nomor WA turun ke `text-xl` di mobile | `src/components/Footer.astro` |
| Logo header di tengah di mobile | Container header `justify-center sm:justify-between` (sebelum `lg` cuma logo yang tampil, jadi otomatis tengah) | `src/components/Header.astro` |

> **Konsekuensi urutan program**: `src/pages/program/[slug].astro` memetakan `programs[idx]` ke testimonial (`testimonials[idx % testimonials.length]`). Testimonial bersifat generik jadi pergantian pasangan tidak masalah.

### 21.2 Kenapa header detail berita berubah

Halaman `/berita/<slug>` dilayani `functions/berita/[slug].ts` — **HTML template mandiri**, bukan halaman Astro. `Header.astro`, `Footer.astro`, Tailwind, dan island Svelte **tidak** ikut; header lamanya cuma logo teks + link "Semua berita →". Itulah sebabnya klien bertanya "kenapa ga ada menu".

### 21.3 Tampilan baru detail berita

- **Header situs yang sama**: logo PNG, nav (Program / Workshop / Berita / Tentang / FAQ) dengan `aria-current` di Berita, tombol "Chat WA", plus **baris menu pill yang bisa di-scroll** untuk mobile (logo tetap di tengah) dan **dock bawah** (Home / Program / Berita / Chat) yang meniru `Dock.svelte`.
- **Sidebar paket program** (desktop kolom kanan, `position:sticky`): 3 kartu dari `src/data/programs.ts` — **harga asli, tidak dikarang** — lengkap dengan badge, titik "Online" hijau berdenyut, harga coret, dan CTA WhatsApp per paket. Paket termurah dapat pita **"Paling hemat"**.
- **Mobile**: paket jadi **rail horizontal scroll-snap** di atas artikel (bukan 3 kartu menumpuk) supaya tetap ringkas. Blok `.post-side` mendahului `.post-main` di DOM, lalu di desktop dipindah ke kolom kanan lewat `grid-column`/`grid-row` eksplisit.
- **Label kategori berwarna** per kategori (emas / oranye / merah) memakai `src/data/categories.ts`; chip yang sama dipakai di kartu halaman daftar berita.
- **"Baca juga"** dipindah ke bawah (full width), plus footer dan dock mobile.

### 21.4 Jebakan baru yang sempat terlewat

- **Grid 2 kolom tanpa placement eksplisit** → sidebar otomatis menempati kolom 1 dan artikel kolom 2 (terbalik). Fix: `.post-main{grid-column:1}` + `.post-side{grid-column:2}` di `min-width:1024px`. **Wajib cek screenshot desktop** — audit DOM dan audit overflow tidak menangkap urutan kolom.
- **Footer di atas `paper-deep`** menyisakan margin tipis: teks oranye kecil (`brand-dark` 4.49:1) dan abu-abu `text-ink/40`–`/45` (2.4–2.8:1, gagal WCAG). Semua dinaikkan ke `/65`–`/70` dan `brand-dark` digelapkan ke `#bc4c00`.
- `safeCover` dipindah ke atas `page()` supaya urutan deklarasinya jelas (menghindari TDZ).

---

## 22. Domain kustom + verifikasi E2E (Okt 2026)

### 22.1 Domain kustom: apa yang sebenarnya terjadi

`myprospect.asia` **sudah** ada di DNS Cloudflare, tapi **tidak pernah diarahkan ke Pages**:

| Temuan | Bukti |
|---|---|
| `A myprospect.asia → 2.57.91.91` (IP parking Hostinger), `proxied: true` | `GET /zones/{zone}/dns_records` |
| `https://myprospect.asia/` membalas **"Parked Domain name on Hostinger DNS system"** | `curl -sI` |
| Halaman `pages.dev` **tidak punya** `myprospect.asia` di daftar domain-nya | `GET /accounts/{acc}/pages/projects/myprospect/domains` → `domains: ["myprospect-7uk.pages.dev"]` |
| `SITE.url` + `canonical` + `sitemap` **sudah** menunjuk ke domain kustom | `src/data/site.ts`, `src/lib/seo.ts` |

Jadi situsnya sebenarnya **belum pernah** tampil di `myprospect.asia` — canonical/sitemap menunjuk ke halaman parked (bahaya SEO).

**Langkah perbaikan (semua via Cloudflare API, token di `.env.cf`)**:

1. Hapus `A myprospect.asia → 2.57.91.91` (ID `5a41222cc2a661215f31fb02925a8542`) — ini yang bikin domain parked.
2. Hapus `CNAME www.myprospect.asia → myprospect.asia` (ID `6a79a0355f99b6cc5867c1042e7ac14b`).
3. `POST /accounts/{acc}/pages/projects/myprospect/domains` dengan `{name: "myprospect.asia"}` → status `initializing`, lalu `{name: "www.myprospect.asia"}` → `pending`.
4. **Jebakan**: Pages melaporkan `verification_data.error_message = "CNAME record not set"` dan **tidak** membuatkan record otomatis → harus bikin manual.
5. Bikin `CNAME myprospect.asia → myprospect-7uk.pages.dev` (`proxied: true`) dan `CNAME www.myprospect.asia → myprospect-7uk.pages.dev` (`proxied: true`).
6. ±45 detik kedua domain jadi `verification_data.status = active`. `https://myprospect.asia/` dan `https://www.myprospect.asia/` sama-sama membalas 200 dengan situs asli.

> **Jangan** pakai `A` record untuk custom domain Pages — Pages butuh CNAME → `{subdomain}.pages.dev`. Record yang dihapus (parking Hostinger) **tidak** otomatis dibikin ulang oleh Pages.

**Redirect `www` → apex (Okt 2026)**: keduanya sama-sama menyajikan situs identik = duplikat konten, padahal `canonical`/`og:url`/`sitemap` menunjuk ke apex. Solusinya **di dalam kode**, bukan di dashboard: `functions/_middleware.ts` memotong host `www.myprospect.asia` dan membalas **301** ke apex dengan path + query utuh.

```ts
const APEX = 'myprospect.asia';
if (url.hostname === `www.${APEX}`) { url.hostname = APEX; url.protocol = 'https:'; return Response.redirect(url.toString(), 301); }
```

Penting: blok ini **di atas** cek admin, supaya `www.../admin/` ikut dipindah (301) dan bukan minta login lebih dulu di host yang salah. `myprospect-7uk.pages.dev` dan preview deploy **tidak** kena (hostname-nya bukan `www.myprospect.asia`).

### 22.2 Yang sempat rusak & sudah diperbaiki

| Gejala | Penyebab | Fix |
|---|---|---|
| `og:url` tidak ada sama sekali di homepage | `src/layouts/Base.astro` tidak pernah menulis meta itu | Tambah `og:url` + `og:site_name` + `twitter:title/description/image`; `canonicalUrl` dipakai bersama untuk `canonical` & `og:url` |
| Copyright footer detail berita dobel: "© 2026 PT Kita Berani Bicara — PT Kita Berani Bicara" | `functions/berita/[slug].ts` menempelkan `— PT Kita Berani Bicara` ke `SITE_CFG.legal` yang isinya sudah nama itu | `© ${year} ${SITE_CFG.legal}. All rights reserved.` — sama persis dengan `Footer.astro` |
| Tahun di footer detail berita tampil **1970** | **Di runtime Cloudflare Workers, `Date.now()` = 0 di module scope** (belum ada I/O), jadi `new Date().getFullYear()` di top-level menghasilkan 1970 | Hitung tahun **di dalam handler** (request time → sudah benar). Dibuktikan probe: `modYear:1970, modNow:0` vs `beforeIo:2026, reqNow:1793361081430` |

> **Jebakan Workers ini berlaku untuk semua `functions/`**: jangan pernah memanggil `new Date()` / `Date.now()` di module scope — hitung di dalam handler.

### 22.3 Audit ulang `Website Material/` (Okt 2026, putaran kedua)

- **24 file** dalam folder + **3 folder kosong** (`Coaches Picture/`, `Copywriting/`, `Testimonials/` — masih placeholder `.gitkeep`).
- ZIP klien `Website Material-20261027T121107Z-1-001.zip` = **25 entri, identik** dengan folder hasil ekstrak → **tidak ada file tersembunyi** yang terlewat.
- `Web Material.pdf` = **0 objek gambar** (`/Subtype /Image` = 0) → **teks saja**. Isinya persis: "Kerja sama klub & akademi: Djanur Football Academy, Dream Baller ID, PB Jaya Raya Ragunan, Akademi Futsal Margahayu Raya, MFC Marunda, SSBRBC" + "Mitra resmi: Little Pep, Pep Sports, Exortive, RS Limijati" → **nama saja, tanpa logo**.
- `Program - Product/Workshop.pdf` = **24 objek gambar**, tapi setelah diekstrak (PyMuPDF) hanya **6 gambar unik**: logo Prospect Asia (×2), logo "P" putih, satu gradien oranye polos, dan 2 foto. **Tidak ada logo mitra.**
- **Kesimpulan**: lencana SVG yang dipakai sekarang tetap; drop-in path `public/media/partners/<slug>.{svg,png,jpg,jpeg,webp,avif}` tetap berlaku (deteksi otomatis via `existsSync` saat build).

**Data yang sudah cocok dengan PDF klien (tidak dikarang)**:

| Data | Isi | Cocok dengan PDF? |
|---|---|---|
| `src/data/workshops.ts` | Starter **1.999.000** (90 menit, "50 peserta → IDR 40.000/atlet") · Premium **3.899.000** (120 menit fun practical, "100 peserta → IDR 38.900/atlet") | Ya |
| `src/data/coaches.ts` | Ferri Ahrial, Ilham Ahmad, Fathur Fathurrahman, Farhana Ayya, Salim, Ido | Ya |
| `src/data/testimonials.ts` | Gohan, Hudzaifah, Zio | Ya |

**Aset belum terpakai**: `Online Soccer Coaching Session (1).png`, `Teenager's Sunny Video Session (1).png`, `Video Call at the Sports Academy (1).png`.

### 22.4 Alur lead diuji end-to-end di domain kustom

`functions/api/leads.ts` diverifikasi langsung di `https://myprospect.asia`:

| Skenario | Hasil |
|---|---|
| Form native (`nama` + `wa` valid) | **302 → `https://wa.me/6285924041004?text=...`** (pesan ter-pre-fill) |
| JSON valid | **200** `{ok:true, waUrl}` |
| Tanpa `wa` | **400** "Data belum lengkap — mohon isi nama dan nomor WhatsApp." |
| `wa` pendek | **400** "Nomor WhatsApp belum valid. Contoh: 081234567890." |
| Baris benar-benar masuk D1 | Ya — `wa` ternormalisasi jadi `6281234567890`, `status = 'baru'` (dicek via `wrangler d1 execute prospect-db --remote`) |
| Baris tes dibersihkan | Ya — `DELETE ... WHERE sumber LIKE 'verify-domain%'` → tabel `leads` kembali 0 baris |

> **Honeypot**: field `website` di form native **mencegah** penyimpanan ke D1, tapi redirect ke WhatsApp tetap jalan → dipakai `scripts/verify-domain.mjs` supaya tes lead **tidak mengotori** D1. Jalur JSON **tidak** membaca honeypot (selalu simpan) — itu jalur `RegisterModal.svelte` untuk pengguna sungguhan.

### 22.5 UI panel admin diuji di browser (bukan cuma API)

`scripts/verify-admin-ui.mjs` → **SEMUA PASS (38/38)** di desktop + mobile. Yang terverifikasi:

| Area | Hasil |
|---|---|
| Login | `/admin/` tanpa sesi → `/admin/login/`; password salah → "Password salah." dan tetap di login; password benar → masuk dashboard |
| Dashboard | 4 kartu statistik terisi (Lead hari ini 0, Belum dikontak 0, Total lead 0, Klik WA 7 hari 7) |
| Leads | Filter status tampil + empty state "Belum ada lead dengan filter ini." |
| Konten | 3 berita tampil lengkap dengan chip kategori berwarna, badge PUBLISHED, tanggal, slug, tombol sunting/hapus |
| Media | State benar: instruksi mengaktifkan bucket `prospect-media` (R2 memang belum aktif — blocker #1) |
| Pengaturan | Form terisi dari API; **klik Simpan benar-benar mengirim PUT dan berhasil**, nilai sebelum = sesudah (round-trip idempoten) |
| Keluar | Balik ke `/admin/login/` |
| Runtime | 0 console error, 0 request gagal |

> **Pelajaran penting soal assertion.** Versi pertama tes ini **lulus palsu**: cek "panjang teks `main` > 10 karakter" membuat tab Konten dan Leads dianggap ter-render padahal isinya masih `Memuat…`. Ketahuan **hanya** karena screenshot-nya dibaca lewat vision. Perbaikannya: (1) sinyal siap = nav sudah menyorot tab yang diklik **dan** teks `main` tidak lagi mengandung kata `Memuat`; (2) regex awal salah karena panel leads menulis **`Memuat leads…`**, bukan `Memuat…`; (3) tiap tab punya `EXPECT` kontennya sendiri. Angka PASS tanpa melihat gambar **tidak** cukup untuk UI.

### 22.6 Status verifikasi 30 Okt 2026 (domain kustom, produksi)

- `scripts/verify-admin-ui.mjs https://myprospect.asia` → **SEMUA PASS (38/38)** — lihat §22.5.
- `scripts/verify-domain.mjs https://myprospect.asia` → **SEMUA PASS (39/39)**, termasuk `www → apex 301` dan `www /admin -> 301`.
- `scripts/verify-revisi.mjs https://myprospect.asia` → 4 kombinasi (home + `/berita/bintang-gohan` × 1440×900 + 390×844), `docW == vw`, **0 error, 0 request gagal, 0 pelanggaran kontras**.
- `https://www.myprospect.asia/` → **301 → `https://myprospect.asia/`** (1 redirect, lalu 200 — tidak ada loop).
- `https://myprospect-7uk.pages.dev/` → 200, **tidak** ikut ke-redirect.
- 3 slug berita (`2175-atlet-berani-bicara`, `bintang-gohan`, `kolaborasi-workshop-starter`) → 200 semua.
- Successor: audit panel admin & analitik terbaru → lihat **§23** (dashboard dibangun ulang + 46 cek analitik/berita baru).

---

## 23. Dashboard pro + analitik trafik + uji berita (Okt 2026)

### 23.1 Permintaan klien & status

Permintaan: *"dashboardnya ko jelek ya ? ga kaya dashboard pro ? tolong dong dan r2 kamu enablekan sendiri test buat berita dan ga ada analitics traffic ?/ lead test masuk ga"*

| Permintaan | Status | Bukti |
|---|---|---|
| Dashboard dibikin "pro" | **SELESAI** | `AdminApp.svelte` dibangun ulang jadi konsol analitik lengkap: hero ringkasan, 4 kartu KPI + sparkline + chip delta, grafik SVG interaktif, corong konversi, top halaman, lead terbaru, tab **Analitik** baru. Dibaca via vision di desktop 1440×900 + mobile 390×844. *(Versi awalnya gelap; 30 Okt 2026 dipivot ke **putih/clean SaaS** — lihat §25.1)* |
| R2 diaktifkan sendiri | **SELESAI (30 Okt 2026)** | Klien klik **Activate** → bucket `prospect-media` dibuat & di-bind (`MEDIA_BUCKET`), route publik `/media/*` ditambahkan, unggah nyata → URL publik 200 (18 cek). Detail di **§24** |
| Tes buat berita | **SELESAI** | CRUD penuh diuji ke produksi: POST → halaman publik 200 → edit → draft (publik 404) → ganti slug ditolak → DELETE → 404. 3 berita asli tetap utuh |
| Analitik trafik | **SELESAI** | Beacon sendiri → D1 `pageviews` → `/api/admin/stats` → dashboard + tab Analitik. **Tanpa GA4** (ID-nya belum ada) dan tanpa cookie |
| Lead test masuk ga? | **YA, terbukti** | `POST /api/leads` → HTTP 200 → baris nyata di D1: `id 10`, `wa` ternormalisasi `6281234567890`, `status baru`, `created_at 2026-10-30 13:31:11`. Baris uji lalu dibersihkan |

### 23.2 Yang baru di panel admin

`src/components/islands/AdminApp.svelte` (495 → 1377 baris):
- **6 tab**: Dashboard · Analitik · Leads · Konten · Media · Pengaturan.
- **Hero ringkasan** — rentang 7/14/30 hari (segmented control), angka pengunjung unik besar + chip delta vs periode lalu.
- **4 kartu KPI** (pengunjung unik, halaman dilihat, klik WhatsApp, lead masuk) masing-masing dengan **sparkline SVG** dan chip `+N vs periode lalu`.
- **Grafik trafik harian** — SVG murni (tanpa library): area + garis, `pathLength=1` untuk animasi gambar garis, kolom hover transparan + tooltip, titik per hari yang punya data.
- **Corong konversi** — kunjungan → klik WA → lead, lengkap dengan persentase lanjut.
- **Kartu "Sedang aktif"** di sidebar (pengunjung 30 menit terakhir + jumlah halaman dilihat).
- **Tab Analitik** — sumber trafik (referrer), perangkat pengunjung (stacked bar + legenda), tabel semua halaman (PV/UV), ranking tombol WhatsApp paling diklik, 4 mini-stat.
- **Tab Media** — status R2 live dari `/api/admin/media`; menampilkan pesan blocker + langkah aktivasi selama R2 belum aktif, dan form unggah otomatis aktif setelah bucket ter-bind. Naik kelas di Okt 2026 → grid kartu berkas + tombol "Salin path"/"Buka" (lihat §24).
- Refresh tanpa kedip skeleton (state `menyegarkan` terpisah dari `loading`), animasi masuk (`naik`, `muncul`, `putar`, `detak`).

### 23.3 Uji CRUD berita (produksi, data asli aman)

`scripts/verify-analitik.mjs` → **SEMUA PASS (46/46)**. Rantai yang dibuktikan: `POST /api/admin/posts` (201) → `GET /berita/<slug>` (200, berisi `<h2>`, `<li>`, `<blockquote>`, cover, `canonical` + `og:url` domain kustom, footer bukan 1970, beacon pv + click ikut ter-suntik) → `PUT` edit (200, `slug` tidak boleh berubah → 400) → ubah status jadi draft → halaman publik 404 → `DELETE` (200) → 404. Plus: `POST` tanpa login → 401, slug invalid → 400, slug duplikat → 400, berita asli 3 entri tetap utuh.

> Halaman detail berita dirender oleh **Pages Function** `functions/berita/[slug].ts` (bukan halaman Astro) → beacon pv + klik WA harus disuntik manual di file itu. Sebelum Okt 2026 halaman ini **tidak** punya tracking klik sama sekali.

### 23.4 Jebakan yang muncul di sesi ini (penting)

1. **Semua angka analitik diam-diam 0** — helper SQL ditulis `rows(env: Env, ...)` tapi dipanggil `rows(env.DB, ...)` → `env.DB.prepare` melempar error → tertelan `try/catch` → API balas 200 dengan angka nol. **Hanya ketahuan karena skrip verifikasi asserting angka positif.** Perbaikan: parameter harus `D1Database`, dan `.bind()` **hanya** dipanggil kalau ada parameter (`db.prepare(sql).bind(...params)` vs `db.prepare(sql)`).
2. **Perbandingan periode lalu selalu 0** — query `deretKlik`/`deretLead` memakai `sinceNow`, padahal total periode lalu butuh `sincePrev`.
3. **Island Svelte kosong total** (tanpa error build) — `{#each Array(4) as _ (0)}` memakai kunci duplikat → runtime throw. Perbaikan: `{#each Array(4) as _, i (i)}`.
4. **`{@const}` hanya boleh anak langsung sebuah block** — kalau ditaruh di `<div>` biasa → error build. Diangkat ke `$derived`.
5. **`text-transform: uppercase` merusak assertion** — `innerText` Chromium ikut mengembalikan teks kapital → regex case-sensitive gagal palsu. Regex E2E harus `case-insensitive`.
6. **Screenshot diambil saat animasi masih jalan** → kartu terlihat "kosong" padahal isinya ada. Fix: tunggu ~900 ms sebelum screenshot + konfirmasi lewat probe DOM (`getComputedStyle(el).opacity`).
7. **Edge cache stale setelah deploy** → screenshot masih markup versi lama. Verifikasi lewat probe DOM, bukan lewat screenshot.
8. **Trafik bot/CLI menggelembungkan angka** — `curl`/`wget` ikut terhitung sebagai kunjungan. Fix: kelas device `bot` + filter `MANUSIA` (`device <> 'bot'`) di **semua** query `pageviews`.

### 23.5 Kebersihan data uji

Semua baris uji dihapus dari D1 produksi setelah pembuktian: lead `sumber='verify-answer'` (id 10), `wa_clicks` slug `zz-uji-cta`, berita `zz-uji-berita-api`, serta probe `pageviews` sintetis. Tabel `leads` produksi kembali **0 baris** (hanya lead sungguhan yang akan muncul). Assertion verifikasi **tidak** bergantung pada keberadaan lead uji — bentuk array yang diuji, bukan jumlahnya.

---

## 24. R2 aktif: bucket, route publik, dan panel Media (30 Okt 2026)

### 24.1 Kronologi

1. Klien klik **Activate** di dashboard Cloudflare (ToS R2 hanya bisa diterima manusia — API tetap balas `10042`).
2. `npx wrangler r2 bucket create prospect-media` → bucket dibuat.
3. `wrangler.jsonc` dapat blok `r2_buckets`: `{ "binding": "MEDIA_BUCKET", "bucket_name": "prospect-media" }`.
4. Deploy → binding hidup di runtime → `/api/admin/media` membalas `siap: true` → tab Media berubah dari pesan blocker jadi banner hijau "R2 AKTIF — SIAP UNGGAH" **tanpa ubah kode**.
5. Route pengiriman publik `functions/media/[[path]].ts` ditambahkan — sebelumnya **tidak ada**, jadi objek R2 tidak bisa diambil lewat `/media/...`.
6. Tab Media naik kelas: grid kartu berkas (thumbnail `object-contain`, ukuran, tanggal, "Salin path" → "Tersalin", "Buka"), ikon `HardDrive` (sebelumnya `Smartphone` — tidak nyambung dengan penyimpanan objek), dan state kosong yang jujur saat bucket kosong.

### 24.2 Kenapa route `/media/*` wajib ada, dan bagaimana caranya aman

- `coverPath()` di `functions/_lib/content.ts` **hanya menerima** path `/media/<nama>` → objek R2 harus bisa diakses persis di URL itu, kalau tidak kolom "Gambar utama" tidak bisa dipakai.
- **Pages Functions jalan SEBELUM aset statis** (dokumentasi Cloudflare: *"static assets are the fallback"*). Jadi route `/media/*` **membayangi** 22 gambar bawaan di `public/media/`. Karena itu route mencoba **R2 dulu**, lalu fallenya ke `env.ASSETS.fetch(request)` supaya gambar bawaan tetap hidup.
- Tanpa `dist/404.html`, Pages membalas `index.html` (HTML) untuk path tak dikenal → route mengembalikan **404 jujur** (`text/plain`) kalau respons ASSETS berupa HTML.
- Parameter `params.path` pada route catch-all **sudah memotong segmen `/media/`**, sedangkan kunci R2 berawalan `media/` → awalan harus ditambahkan kembali (`const kunci = \`media/${nama}\``).
- `httpMetadata` pada `R2Object` itu **properti**, bukan method (method-nya `writeHttpMetadata()`).

### 24.3 Verifikasi & bukti

- `scripts/verify-media.mjs` → **18/18 SEMUA PASS** di produksi: unggah nyata → URL publik 200 + magic bytes PNG + `cache-control: public, max-age=31536000, immutable` → 3 gambar bawaan tetap 200 → media tak dikenal 404.
- **Regresi gambar dibantah**: 17 URL gambar unik di 6 halaman → semuanya 200 dengan byte & content-type benar. 5 gambar dengan `naturalWidth === 0` adalah **lazy-load** (belum masuk viewport), dibuktikan lewat **A/B test dua deployment** (`a1dc6520` tanpa route vs `c61c58b6` dengan route) → hasil identik, jadi **bukan** regresi.
- **Vision**: tab Media dibaca di desktop 1440×900 + mobile 390×844 — banner hijau, nama bucket satu baris (tidak lagi wrap di tanda hubung), thumbnail logo **tidak terpotong** (`object-contain`; sebelumnya `object-cover` memotong jadi "OSPE"), tombol "Salin path"/"Buka" tidak tertutup nav bawah fixed (tombol y=176–201, nav mulai y=783).
- **Kebersihan**: berkas uji dihapus dari bucket (`npx wrangler r2 object delete prospect-media/<key> --remote`) → bucket **0 berkas**. Salinan edge ikut dibersihkan lewat purge cache zone (`POST /zones/{zone}/purge_cache`) karena header `immutable` membuat berkas yang dihapus tetap dilayani edge sampai TTL habis.

### 24.4 Jebakan yang muncul saat mengaktifkan R2

1. **Fungsi membayangi aset statis** — route catch-all `/media/*` tanpa fallback ASSETS mematikan semua gambar bawaan. Utamakan uji lokal `npx wrangler pages dev dist --port 8788` **sebelum** deploy.
2. **Kunci R2 vs parameter route** — key `media/x.png`, param route `x.png` → objek tidak ketemu; gejala drawback-nya objek R2 terkirim sebagai **HTML** karena jatuh ke fallback index.
3. **`httpMetadata` bukan method** — `objek.httpMetadata()` melempar TypeError.
4. **Debug header pada respons ASSETS** — header respons immutable → `headers.set()` melempar *"Can't modify immutable headers"*. Pakai respons JSON debug, jangan modifikasi header.
5. **Ikon `Smartphone` untuk status R2** — tidak nyambung dengan penyimpanan objek; diganti `HardDrive`.
6. **Teks `prospect-media` wrap di tanda hubung** — flex shrink memecah kata di hyphen; perbaiki dengan `whitespace-nowrap` + `shrink-0`.
7. **Klik tab sebelum island ter-hidrasi** — klik pertama hilang (belum ada handler). Tunggu dashboard selesai memuat (`/pengunjung unik/` && bukan "Memuat") sebelum mengklik tab.
8. **Verifier visual salah alarm pada elemen tersembunyi** — `.dock` `display:none` di ≥1024px → `scrollIntoViewIfNeeded` timeout → `verify-revisi.mjs` kini menandai elemen tak terlihat sebagai *skip*, bukan gagal.
9. **Assertion yang bergantung pada isi data** — hover tooltip grafik **hanya** muncul untuk hari yang punya data. Kalau panel dibersihkan dari data uji, assertion tooltip gagal padahal tidak ada bug. Pola yang benar (dipakai juga untuk `leadsTerbaru`): **bentuk/kondisi datanya yang diuji**, bukan datanya.

### 24.5 Kebersihan data produksi (penting untuk kejujuran dashboard)

Seluruh trafik yang tercatat sampai 30 Okt 2026 **100% berasal dari pengujian otomatis** — dibuktikan dari isi D1: referrer palsu `google.com` / `instagram.com` / `example.com` (probe parser referrer), path palsu `/zz-uji-tidak-ada`, dan sisanya UA/IP browser pengujian. Situs belum punya pengunjung nyata. Supaya klien tidak salah melihat "9 pengunjung unik" sebagai trafik nyata, tabel `pageviews` (101 baris) dan `wa_clicks` (11 baris) **dikosongkan** — dashboard kini menampilkan **nol yang jujur** + pesan keadaan kosong yang rapi ("Belum ada trafik tercatat pada periode ini…", "Belum ada data halaman.", "Belum ada lead…"). Angka nol itu **memang** kondisi produksi saat ini, bukan kegagalan.

> Pembersihan manual: `npx wrangler d1 execute prospect-db --remote --command "DELETE FROM pageviews"` (dan `wa_clicks`). Perintah ini **menghapus semua** baris, jadi jalankan hanya kalau memang tidak ada trafik asli yang harus dijaga.

State produksi saat ini: `pageviews` 0 · `wa_clicks` 0 · `leads` 0 · `posts` 3 (berita asli) · bucket R2 0 berkas (semua berkas uji dihapus + edge di-purge).

---

## 25. Panel admin jadi putih + kontrol unggah gambar utama (30 Okt 2026)

Permintaan klien: *"Gambar utama di artikel kenapa path bukan upload ? dan jangan hitam dong adminnya putih saja yang clean dan terlihat profesional saas"*.

### 25.1 Admin: dark → putih / clean SaaS

Semua token gelap di dua island admin (`AdminApp.svelte`, `AdminKonten.svelte`) dipetakan ke palet terang:

| Lama (dark) | Baru (light) |
|---|---|
| `bg-ink` / `bg-ink-85` / `bg-ink-95` | `bg-white` / `bg-white/90` / `bg-white/95` |
| `bg-white/5` / `bg-white/10` / `bg-white/15` | `bg-white` / `bg-slate-100` / `bg-slate-200` |
| `text-bone` | `text-slate-900` |
| `text-bone/35…40` | `text-slate-400` |
| `text-bone/45…70` | `text-slate-500` |
| `text-bone/75…80` | `text-slate-600` |
| `text-bone/85…90` | `text-slate-700` |
| `border-white/10…15` | `border-slate-200` |
| `border-white/30` | `border-slate-300` |
| `text-gold` | `text-amber-700` |
| `text-brand` (teks) | `text-brand-dark` (oranye kontras) |
| `bg-gold/10…15` | `bg-amber-50` |
| `bg-gold/20` | `bg-amber-100` |
| `border-gold*` | `border-amber-300` |
| `focus:border-gold` / `ring-gold` | `focus:border-brand` / `ring-brand/40` |

Latar halaman `bg-slate-50`, kartu `bg-white` + `border-slate-200`. Nilai CSS/SVG yang dibalik: `.kartu` (border + shadow), `.hero-band` (gradient), `.kolom`/`.sumbu` (sumbu chart), `.skel` (skeleton), `box-shadow` `.detak`, dan literal `stroke` chart → `rgba(15,23,42,.08)` / `#ffffff` (halo titik).

**Verifikasi**: bundle JS admin di `dist/` searched → **nol** token gelap tersisa; CSS hasil build memuat semua utilitas baru (`bg-slate-50`, `text-brand-dark`, `focus-visible:ring-brand/40`, `focus:ring-brand/20`, `hover:bg-brand/5`, `border-crimson`, `text-crimson`). Vision: dashboard, tab Konten, tab Media (desktop 1440×900) + dashboard & form (mobile 390×844) — semua putih, rapi, kontras terbaca.

### 25.2 "Gambar utama" jadi kontrol unggah sungguhan

`src/components/islands/AdminKonten.svelte`:

- **Drop-zone** (`<label>` + `input[type=file]` `sr-only`, `accept="image/*"`) → `POST /api/admin/upload` (multipart) → `postForm.cover` terisi otomatis dengan `'/' + key`.
- **Pratinjau 16:9** di kiri (fallback ikon `Image` saat kosong), **pesan sukses/error**, tombol state "Mengunggah…".
- **Pustaka media** — grid thumbnail berkas gambar yang sudah ada di R2 (diambil dari `GET /api/admin/upload`); klik → ganti gambar utama; berkas terpilih diberi ring oranye.
- **Path manual** tetap ada tapi diturunkan jadi **"Path manual (opsional)"** — jadi fallback, bukan cara utama.
- Daftar berita di bawah kini menampilkan **thumbnail cover**.

Semua state (`pustaka`, `coverBusy`, `coverMsg`, `coverErr`) di `AdminKonten.svelte`; `muatPustaka()` dipanggil saat `onMount`, `newPost()`, `editPost()`.

### 25.3 Jebakan yang muncul di sesi ini

1. **Remap token Tailwind v4 = prefix bertabrakan.** `bg-white/4` adalah prefix dari `bg-white/4.5`; `border-gold` dari `border-gold/50`; `focus:border-gold` dari `border-gold`; `text-brand` dari `text-brand-dark`. Kalau pakai `replace_all`, token **lebih panjang/spesifik harus diganti lebih dulu**, atau string sudah benar jadi rusak.
2. **Efek berantai** — aturan `text-brand` → `text-brand-dark` ikut mengenai string yang **baru saja** ditulis `text-brand-dark` → muncul `text-brand-dark-dark` (3 tempat). Perbaikan: ganti targeted.
3. **Urutan `await` menentukan apa yang terlihat.** `coverMsg` di-set **sebelum** `await muatPustaka()` → `waitForFunction` berbasis pesan sukses resolve **sebelum** pustaka selesai dimuat. Verifier harus menunggu **dua sinyal terpisah** (pesan sukses **dan** `button[title]` > 0).
4. **`naturalWidth === 0` bukan berarti gambar rusak.** Gambar bisa masih downloading. `curl` ke URL publik mengembalikan 200 `image/jpeg` → tunggu `img.complete && naturalWidth > 0`.
5. **`scrollIntoViewIfNeeded` scroll-nya minimal** — tidak cukup untuk membuktikan elemen bisa melewati nav fixed. Pakai `scrollIntoView({ block: 'center' })`, lalu bandingkan `getBoundingClientRect().bottom` vs `navTop`.
6. **Selector `main label` bisa mengenai wrapper**, bukan drop-zone yang dimaksud — pakai `.filter({ hasText: 'Unggah gambar' }).first()`.

### 25.4 Status verifikasi & kebersihan

- `scripts/verify-konten.mjs` → **13/13 PASS** di produksi `https://myprospect.asia` (path terisi `/media/20261030-kt-unggah-uji-78d2f850.jpg`, pratinjau 1600×1066 termuat, pustaka 1 berkas, zona unggah & tombol Terbitan bebas nav di mobile, nol console error & nol request gagal).
- `scripts/verify-admin-ui.mjs` → **64/64 PASS** di produksi setelah perubahan tema.
- `npm run build` → 12 halaman, bersih.
- **Kebersihan**: berkas uji dihapus dari R2 (`npx wrangler r2 object delete prospect-media/media/20261030-kt-unggah-uji-78d2f850.jpg --remote`) → bucket **0 berkas**; edge di-purge untuk URL tersebut → link lama **404**. Tidak ada berita uji yang disimpan (skrip sengaja tidak pernah menyentuh D1).

> Catatan: build Astro sempat memunculkan galat IDE *"Cannot find native binding … npm has a bug related to optional dependencies"* pada file `.svelte` — itu masalah lingkungan esbuild/svelte, **bukan** galat sintaks; `npm run build` tetap sukses.

---

## 26. Sistem pattern FORGE — oranye jadi aksen, hitam jadi bidang (30 Okt 2026)

Permintaan klien: *"oke di home page masih dominan orang kamu cari warna pattern yang detailing yang blend dengan orange hitam tolong vision semuanya pake skill design yan g benar rapih di mobile dan desktop"*.

### 26.1 Prinsip: membalik peran oranye

Sebelum perubahan, oranye berperan sebagai **bidang luas** — kartu StatsBar penuh oranye, pita CTA seluruh oranye, 3 jersey coach gradasi oranye, harga & badge oranye. Sesudahnya oranye jadi **aksen dan penanda**, hitam jadi **bidang**.

| Section | Sebelum | Sesudah |
|---|---|---|
| StatsBar | kartu gradasi oranye penuh | **scoreboard hitam** (`bg-ink-2` + `ring-brand/30`) + angka oranye |
| Pita CTA | band gradasi oranye penuh | **band hitam** + grid/halftone + satu kata oranye ("Bicara?") |
| Jersey coach | gradasi oranye | **kit hitam** + jahitan diagonal oranye + halftone + cahaya sudut |
| Hero "MODERN" | oranye → emas | gradien **hitam → oranye → emas** (`.hl-brand`) |
| Harga program/workshop | `text-brand-dark` | `text-ink` (hitam) |
| Badge "Hemat" | `bg-brand` | `bg-ink` + teks oranye |
| Heading Coach/About/Workshop/Level | oranye pekat | **ink + sapuan marker oranye** (`.hl-swash`) |
| Heading Program | oranye pekat | putih + `.hl-swash--dark` (marker oranye diredupkan) |
| Band Membership | emas (gold) | oranye penuh (emas dibuang dari palet) |

### 26.2 Pustaka pattern FORGE (`src/styles/global.css`)

Semua pattern murni CSS/SVG — tanpa aset gambar baru, tanpa ImageGen.

| Kelas | Efek | Dipakai di |
|---|---|---|
| `.pat-halftone` | titik-titik oranye (halftone) | sudut scoreboard, hero, pita CTA, Testimoni |
| `.pat-halftone-ink` | halftone gelap | field terang |
| `.pat-grid` / `.pat-grid-light` | grid blueprint | About, Program, scoreboard, pita CTA |
| `.pat-hatch` / `.pat-hatch-ink` | arsir 45° | detail teknis |
| `.pat-noise` / `.pat-noise-light` | butiran film (feTurbulence SVG) | hero, scoreboard, pita CTA |
| `.pat-fade-tr` / `.pat-fade-bl` | mask untuk memudarkan pattern ke arah sudut | semua layer pattern |
| `.pat-dash` | garis oranye putus-putus | garis teknis kartu |
| `.hl-swash` | **sapuan marker oranye di belakang teks** | Coach, About, Workshop, Level & Journey |
| `.hl-swash--dark` | varian diredupkan untuk latar gelap | heading Program |

Ukuran pattern diatur inline lewat `style="--pat-gap: 9px"` (jarak titik default 7px).

### 26.3 Kenapa `.hl-swash` (teknik penanda oranye)

```
.hl-swash { position: relative; display: inline-block; isolation: isolate; }
.hl-swash::before { content:""; position:absolute; left:-0.05em; right:-0.05em;
                    bottom:0.12em; height:0.28em; border-radius:999px;
                    background: linear-gradient(90deg, rgba(255,122,26,.45), rgba(255,195,46,.55));
                    z-index:-1; }
```

`isolation: isolate` + `z-index:-1` membuat sapuan tetap **di belakang teks** tapi **di atas background parent** — tanpa perlu elemen tambahan.

### 26.4 Kontras yang dijaga (angka, bukan perkiraan)

| Pasangan | Rasio | Status |
|---|---|---|
| `text-brand` (#ff7a1a) di atas paper | 2.55:1 | ❌ gagal → ganti `text-brand-dark` (4.98:1) |
| `text-brand` di atas `bg-ink` | 5.67:1 | ✅ |
| ink di atas sapuan `.hl-swash` (terang) | ~10.6:1 | ✅ |
| putih di atas `.hl-swash--dark` (gelap) | ~6:1 | ✅ (swash diredupkan dari 0.78 → 0.58 supaya tetap lolos) |
| `bg-brand` + `text-ink` (tombol) | tinggi | ✅ |

### 26.5 Jebakan yang ditemukan lewat vision (bukan lewat angka)

1. **Mask `.rail-wrap` terlalu lebar (9%)** membuat kartu coach di ujung rail ter-wash putih — nama jadi pucat dan tidak terbaca, dan jersey gelap berubah jadi gradien putih. Diperbaiki ke **2%**. Baru terlihat setelah baca screenshot, bukan lewat audit angka.
2. **Foto warms di pita CTA** terlihat cokel muddy di atas overlay ink → diberi `grayscale` supaya field benar-benar hitam; oranye dikembalikan lewat halftone + satu kata aksen.
3. **Grid pattern menembus angka scoreboard** karena tile stats semi-transparan (`bg-white/6`) → tile dibuat opak (`bg-ink`).
4. **`.hl-swash` terbaca sebagai garis bawah** saat `bottom: 0.06em; height: 0.24em` → dinaikkan ke `bottom: 0.12em; height: 0.28em` supaya jadi sapuan, bukan garis bawah.
5. **CSS kustom tanpa `@layer` mengalahkan utility Tailwind.** Aturan `.jersey` **tidak boleh** diberi `position: relative`; kalau diberi, `absolute inset-0` ikut tertimpa dan tinggi elemen jadi 0. Peringatan ini ditulis sebagai komentar di `global.css`.
6. **`/api/settings` & `/api/pv` balas 404 di `astro preview`** — itu normal, keduanya Cloudflare Pages Function yang tidak jalan di preview statis. Di produksi keduanya 200.

### 26.6 Skill yang dipakai

`design` **tidak bisa dipakai** — symlink `~/.config/opencode/skills/design` → `~/.opencode/skills/design/` target-nya hilang (dead symlink; `ui-styling` & `ui-ux-pro-max` juga mati). Yang dipakai yang resolve:

- **`pw-vision`** — audit visual lokal pakai Playwright, screenshot tidak keluar dari mesin; semua pengukuran lewat JS.
- **`looks-expensive`** — Less is More, maksimal 2–3 warna, white space = kemewahan, detail mattered, grid 8px, transisi 200–300ms.
- **`design-system`** — konsistensi, atoms → molecules → organisms, dokumentasi tiap keputusan, aksesibilitas.

### 26.7 Status verifikasi

- `npm run build` → **12 halaman**, bersih.
- `scripts/audit-frames.mjs` (desktop 1440×900 + mobile 390×844) → `horizontalOverflow: false`, `over: []`, `revealNotIn: 0 / 30`. 404 lokal hanya `/api/settings` + `/api/pv` (fungsi Cloudflare, normal di preview).
- `scripts/audit-clip.mjs` → **0 overflow, 0 covered** di 10 halaman × 2 viewport. Total issue 1670 (build baru) **lebih sedikit** dari produksi lama 1695; 280 sisanya `clipped` dari `line-clamp` yang memang disengaja (identik dengan produksi lama).
- **Vision** (desktop 1440×900 + mobile 390×844, lokal lalu produksi): hero "MODERN" gradasi hitam→oranye→emas; scoreboard hitam + angka oranye + grid + hairline oranye; pita CTA hitam dengan grid & halftone oranye di sudut; kit coach hitam dengan jahitan oranye; heading Coach/About/Workshop memakai sapuan marker; heading Program putih dengan marker diredupkan; harga & badge "Hemat" hitam; band Membership hitam + foto grayscale + aksen oranye penuh.
- Deploy: `npx wrangler pages deploy dist --project-name myprospect --commit-dirty=true --branch=main` (butuh `set -a && . ./.env.cf` — token OAuth bawaan wrangler menunjuk akun lain, jadi harus pakai `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` dari `.env.cf`).
- Produksi `https://myprospect.asia` → `/api/settings` 200, `/api/pv` 200, screenshot identik dengan build lokal.

---

## 27. Menu "Media" disembunyikan di panel admin, upload Berita tetap hidup (31 Okt 2026)

Permintaan klien: *"tolong media di hide dulu di menu admin tapi fungsi upload gambar di berita tetap bisa, bisa kan ? cuma hide menu saja media nya"*.

### 27.1 Yang diubah (satu filter)

`src/components/islands/AdminApp.svelte`:

```js
// Tab "Media" sementara disembunyikan dari menu (desktop + mobile).
// Halaman dan endpoint-nya tetap utuh — hanya tidak tampil di navigasi.
const menuTabs = tabs.filter((t) => t.id !== 'media');
```

Array `tabs` (6 entri) **tidak diubah** — hanya `menuTabs` (5 entri) yang dipakai untuk merender dua navigasi:

- sidebar desktop → `nav[aria-label="Menu admin"]`
- bar bawah mobile → `nav[aria-label="Menu admin mobile"]`

Halaman tab Media sendiri (kode, state, `loadMedia()`, blok `{:else if tab === 'media'}`) **tidak dihapus**, jadi mengembalikannya nanti cukup menghapus satu baris filter.

### 27.2 Kenapa upload Berita tidak terganggu

Upload gambar di Berita tidak pernah lewat tab Media — keduanya memang memakai endpoint yang sama:

| Kebutuhan | Dipanggil dari | Endpoint |
|---|---|---|
| Unggah gambar utama | `AdminKonten.svelte` (tab Konten → Berita) | `POST /api/admin/upload` |
| Pustaka media (pilih berkas lama) | `AdminKonten.svelte` | `GET /api/admin/upload` |
| Unggah dari tab Media | `AdminApp.svelte` (tab Media) | `POST /api/admin/upload` |

Menyembunyikan menu hanya menyentuh lapisan navigasi — endpoint dan state R2 tidak berubah.

### 27.3 Verifikasi

`scripts/verify-admin-ui.mjs` diperbarui: `Media` dikeluarkan dari daftar tab yang dites, ditambah langkah baru **4b** yang menguji dua hal sekaligus — menu `Media` **tidak ada** di nav (desktop + mobile) dan zona unggah gambar utama di tab Konten **masih ada** dengan `/api/admin/upload` balas 200.

Hasil di produksi `https://myprospect.asia`:

- `verify-admin-ui.mjs` → **SEMUA PASS** (desktop 1440×900 + mobile 390×844), termasuk `4b menu Media tidak tampil di nav` → 0 tombol, `4b Konten: zona unggah gambar utama tetap ada` → 1 zona, `4b endpoint pustaka media /api/admin/upload hidup`.
- `verify-konten.mjs` → **SEMUA PASS**: unggah gambar sungguhan ke R2 (`/media/20261031-kt-unggah-uji-5cf39177.jpg`), kolom gambar utama terisi otomatis, pratinjau termuat (`1600×1066`), pustaka media menampilkan berkas, zona unggah & tombol Terbitkan tidak tertutup nav fixed di mobile.
- Berkas uji R2 **dihapus** setelah verifikasi (`wrangler r2 object delete … --remote`).
- **Jebakan cache edge Cloudflare:** setelah objek R2 dihapus, `GET /media/<nama>.jpg` **masih balas 200** — responsnya masih dilayani cache edge karena `cache-control: public, max-age=31536000, immutable`. Originya sudah hilang (`/api/admin/upload` → `{"berkas":[]}`), tapi URL publiknya masih hidup. Baru bersih setelah purge: `POST https://api.cloudflare.com/client/v4/zones/{zone_id}/purge_cache` dengan `{"files":[...]}`. Setelah purge → **404**, sedangkan aset asli (`/media/workshop-hero.jpg`, `/media/hero-athletes.jpg`) tetap **200**.
- Vision desktop + mobile: sidebar dan bar bawah sudah 5 menu tanpa "Media", form Berita tetap punya drop-zone "Unggah gambar (jpg/png/webp/avif) · maks 5 MB" + "atau pilih dari pustaka media di bawah".

---

## 28. Dock mobile: label selalu tampil, seragam di semua halaman + single post, WhatsApp hijau (31 Okt 2026)

Permintaan: *"di mobile menu dock yang iphone ko ga ada text menu nya… tolong seragamkan di semua halaman dan single post, tolong icon whatsapp dan juga hijau khusus whatsapp"*.

### 28.1 Tiga akar masalah

| # | Temuan | Sebab |
|---|---|---|
| 1 | Teks menu tidak muncul di iPhone | `Dock.svelte` memberi `class:opacity-0={!isActive}` pada label — hanya item **aktif** yang teksnya terlihat, sisanya transparan. |
| 2 | Dock single post beda sendiri | `functions/berita/[slug].ts` menyimpan salinan markup dock sendiri: cuma **4 item** (Workshop hilang), geometri SVG berbeda, tanpa scroll-hide, dan tanpa titik state aktif. |
| 3 | State aktif salah di hampir semua halaman | Deteksi hanya lewat `location.hash`, jadi `/berita`, `/faq`, `/tentang`, `/program/x`, `/workshop/x` semuanya menyorot **Home**. |

### 28.2 Satu sumber kebenaran: `src/lib/dock.ts`

Dock hidup di dua teknologi berbeda (island Svelte untuk halaman Astro, dan template HTML mandiri di Pages Function). Selama markup ditulis dua kali hasilnya pasti bergeser — itu persis yang terjadi. Sekarang `src/lib/dock.ts` memegang `DOCK_ITEMS` (5 item + urutan label), `DOCK_ICONS` (path lucide diambil apa adanya dari `node_modules/@lucide/svelte/dist/icons/*` supaya render identik), `dockMarkup()`, `DOCK_CSS`, `DOCK_JS`, dan `dockActiveFor()`.

- `Dock.svelte` tinggal membaca `DOCK_ITEMS` dan menambah reaktivitas (scroll-hide, hashchange).
- `functions/berita/[slug].ts` memanggil `${dockMarkup({ waUrl, active: 'berita' })}`, menyisipkan `${DOCK_CSS}` di `<style>` dan `${DOCK_JS}` di `<script>` — Pages Function boleh mengimpor dari `src/lib/` (sudah dilakukan `waLink` sebelumnya), dan `esbuild --bundle` mengonfirmasi function tetap ter-bundle bersih.
- State aktif kini **prop** (`<Dock client:load active="berita" />`) sehingga sudah benar sejak SSR; hash hanya menggesernya saat user pindah seksi di homepage. `/faq` dan `/tentang` memang tidak punya item di dock → tidak ada yang disorot (dulu salah sorot Home).
- Layout item diganti dari `min-w-15 px-2.5` (akan jebol begitu label tampil) menjadi `flex-1 min-w-0` + label `text-[9px]`. Terukur **66px per item**, item terakhir berhenti di x=369 dari 390px — "Workshop" utuh tanpa terpotong.

### 28.3 Hijau khusus WhatsApp: glif asli + warna resmi

Ikon chat generik (`MessageCircle` lucide) diganti **glif WhatsApp asli** dari Simple Icons (CC0-1.0), disimpan di `src/lib/whatsapp.ts`.

Warna dasar: `--color-wa: #25d366` (hijau resmi WhatsApp), `--color-wa-deep: #1fbf59` (hover), `--color-wa-ink: #0b3d2e` (untuk teks hijau di dasar terang).

**Teks di atas petak hijau = `ink`, bukan putih.** Putih di atas `#25d366` hanya **1.98:1** — gagal bahkan aturan 3:1 untuk objek grafis (WCAG 1.4.11), sedangkan `ink #241a12` di atasnya **8.60:1** (hover `#1fbf59` → 7.03:1). Ini mengikuti konvensi yang sudah dipakai situs: tombol `bg-brand` juga memakai `text-ink`.

Yang dijadikan hijau adalah **permukaan khusus WhatsApp**: petak Chat di dock, bubble mengambang + kartu popup WhatsApp, tombol "Chat WA" di header, tombol `hdr-wa` single post, dan tautan nomor WA di footer (pil hijau kecil + glif). CTA situs yang bukan WhatsApp (Isi Formulir, section CTA, form lead, akordeon FAQ, kartu program/workshop) **tetap oranye brand** supaya palet FORGE tidak encer dan hijau langsung terbaca sebagai "ini jalur ke WhatsApp".

### 28.4 Jebakan: string `d` disisipkan sebagai innerHTML

`WA_GLYPH` hanya berisi atribut `d`, bukan markup. Disisipkan apa adanya lewat `{@html}` / `set:html` / template literal, hasilnya jadi **text node di dalam `<svg>`** — tidak ada yang tergambar, tapi `svg.innerHTML` tetap mengandung string `M17.472…` sehingga pemeriksaan naif "glif ada" tetap lolos. Solusinya `WA_ICON = '<path d="…"/>'` (markup siap pakai) yang kini dipakai semua konsumen. Verifier diperketat: yang dihitung adalah **jumlah elemen `<path>/<rect>`**, dan `svg.textContent` yang mengandung `M<angka>` dianggap kegagalan.

### 28.5 Verifikasi

Dua skrip baru, keduanya jalan di desktop 1440×900 **dan** mobile 390×844:

- `scripts/verify-dock.mjs` → **SEMUA PASS** di `https://myprospect.asia`. 7 halaman (beranda, daftar berita, detail program, detail workshop, tentang, faq, **single post hasil Pages Function**) × 11 pemeriksaan: 5 item seragam, urutan label `Home,Program,Workshop,Berita,Chat`, semua label terbaca (opacity 1 + lebar ≥ 8px), item aktif sesuai harapan tiap halaman, petak Chat `rgb(37, 211, 102)`, glif = 1 path utuh, tiap ikon tergambar sebagai bentuk SVG, dock tidak keluar layar, tidak ada overflow horizontal, plus scroll-hide single post (`dock` → `dock is-hidden` saat turun → `dock` lagi saat naik).
- `scripts/verify-wa-green.mjs` → **SEMUA PASS**: header, bubble, tombol popup, footer (desktop + mobile), dan `hdr-wa` single post semuanya `rgb(37, 211, 102)` dengan 1 `<path>`.
- Regresi: `verify-home.mjs` (0 console error, 0 request gagal, semua kontras `ok:true`) dan `verify-admin-ui.mjs` (**SEMUA PASS**, termasuk langkah 4b dari §27) tidak terganggu.
- Vision 390×844 per halaman: `dock-home`, `dock-berita`, `dock-program-elite-1on1`, `dock-workshop-pro`, `dock-tentang`, `dock-faq`, `dock-berita-2175-atlet-berani-bicara` + `wa-desktop-{header,bubble,popup,footer}`, `wa-mobile-footer`, `wa-post-header`. Dock single post kini tidak bisa dibedakan dari dock halaman lain.

---

## 29. Testimoni tidak bisa digeser jari di mobile (31 Okt 2026)

Permintaan: *"bagian terstimoni gabisa di geser di mobile pake tangan touch"*. Ciri khasnya penting: **di desktop mouse drag tetap jalan**, jadi kerusakan ada di jalur sentuhan, bukan di logika carousel.

### 29.1 Empat akar masalah

| # | Sebab | Efek |
|---|---|---|
| 1 | `use:emblaCarouselSvelte` ditempel di **`.embla`** (pembungkus terluar), bukan `.embla__viewport`. Embla memakai `root.children[0]` sebagai *container* dan `container.children` sebagai *slide* — sehingga "container" = `.embla__viewport` dan "slide" = `.embla__container`: **1 slide saja**. | Tidak ada posisi snap kedua, jadi tidak ada yang bisa digeser. Terukur: sapuan jari hanya menggeser viewport **−0,02px**. |
| 2 | Tidak ada `touch-action` di viewport. Embla **tidak** memasangnya sendiri; itu tanggung jawab CSS. | Di perangkat sentuh browser mengklaim gestur horizontal lebih dulu (dianggap scroll/zoom), pointer Embla tidak pernah sempat mengejar. `pan-y` memulihkan hak carousel untuk sumbu X dan tetap menyerahkan sumbu Y ke halaman. |
| 3 | Kelas pola `.pat-*` **tidak punya `pointer-events: none`**, tidak seperti `.art-blob` / `.art-ribbon` / `.sport-ball` yang sudah. `src/pages/index.astro` menaruh cakram `pat-halftone` 288px di `-bottom-24 -left-24` dalam `<section>` testimoni yang sama — persis di titik ibu jari mulai menggeser. | Elemen dekoratif menelan sentuhan sebelum sampai ke slide. Terbukti dari Playwright: *"`<div class="pat-halftone …">` intercepts pointer events"*. |
| 4 | `oninit={onInit}` (sintaks lama) **tidak pernah dipanggil** di Svelte 5, jadi pegangan `embla` selalu `null`. | Auto-play, klik titik, dan `reInit()` setelah data live semuanya mati diam-diam — tanpa error di konsol, hanya diam. |

### 29.2 Perbaikan

- Aksi pindah ke node viewport, plus `touch-pan-y`: `<div class="embla__viewport touch-pan-y overflow-hidden" use:emblaCarouselSvelte={{…}} onemblaInit={onInit}>`.
- Sintaks event: `on:emblaInit` **ditolak** compiler (*"Mixing old and new syntaxes for event handling is not allowed"*), jadi ditulis `onemblaInit={onInit}`. Urutan hasil kompilasi diverifikasi: `u('emblaInit', …)` muncul **sebelum** aksi dipasang (`c(n, z)`), jadi penangkap API sempat terdaftar.
- `pointer-events: none` diberikan **sekaligus** ke 9 kelas pola (`.pat-halftone`, `.pat-halftone-ink`, `.pat-grid`, `.pat-grid-light`, `.pat-hatch`, `.pat-hatch-ink`, `.pat-noise`, `.pat-noise-light`, `.pat-dash`). Semua pemakaian `pat-*` di proyek ini adalah `div` dekoratif `aria-hidden`, jadi aturan global aman dan sekaligus menutup lubang yang sama di seksi lain.
- Auto-play kini sadar sentuh: `holdAuto` pada `pointerdown` (jari menahan = jangan rebut gestur) dan `releaseAuto` pada `pointerup`/`pointercancel` dengan jatah lanjut **4 detik**; `scrollTo()` dari klik titik juga memakai jalur yang sama.

### 29.3 Verifikasi — `scripts/verify-testimoni.mjs`, 17 pemeriksaan **SEMUA PASS**

Mobile 390×844 (`isMobile` + `hasTouch`, gestur dikirim lewat CDP `Input.dispatchTouchEvent` — bukan mouse event) dan desktop 1440×900 sebagai kontrol:

- Struktur: transform Embla sekarang di `.embla__container` (bukan `.embla__viewport`), **3 slide** anak langsung, `touch-action: pan-y`, `overflow-x: hidden`, track **977px > viewport 358px**.
- Grid 4×3 `document.elementFromPoint` di atas carousel: **tidak ada** elemen di luar `.embla` yang ikut tertunjuk.
- Sapuan jari kiri **Δ=−331px**, kanan **+331px**, titik indikator ikut berpindah (`aktif=1`), gestur vertikal tetap menggulir halaman (10813 → 10978) — `pan-y` tidak merampas sumbu Y.
- Auto-play hidup lagi (**Δ=−331px**) dan klik titik memindahkan slide.
- Desktop: drag mouse **Δ=−452px**, slide melebar 508px dari viewport 1104px, 0 error JS, 0 overflow horizontal.
- Regresi **tidak** terganggu oleh perubahan CSS global: `verify-home` (0 error, semua kontras `ok:true`), `verify-dock`, `verify-wa-green`, `verify-admin-ui` (SEMUA PASS), `audit-modal` (field form tetap bisa diklik di kedua viewport).

### 29.4 Jebakan alat uji (bukan bug produksi)

Dua kali verifier melaporkan angka palsu sebelum penyebabnya ada di sisi tes:

- **`Δ=NaNpx`**: fungsi pengukur ditulis sebagai *template literal string* lalu dioper ke `page.evaluate`. Playwright mengevaluasi string sebagai **ekspresi**, tidak bisa menyerialisasi fungsi, dan mengembalikan `undefined` tanpa error — arithmetic di atasnya jadi `NaN`. Harus fungsi sungguhan (`(sel) => page.evaluate(…)`).
- **`Δ=0px` palsu pada auto-play dan klik titik**: jeda 6,5 detik lebih pendek daripada `resumeAuto` 4s + interval 5s, dan klik "Slide 1" saat slide 1 memang sedang aktif. Tes dibuat deterministik: tunggu 11 detik, dan klik titik yang **bukan** sedang aktif.
- Chrome melaporkan `translate3d` Embla sebagai **`matrix()` 2D** (tx di indeks 4), bukan selalu `matrix3d()` (indeks 12) — parser harus menangani keduanya.

---

## 30. "Terlihat dikembangkan AI" — favicon, tanda pisah, animasi/gradien, oranye pudar (4 Nov 2026)

Permintaan klien: *"ada revisi… katanya ini terlihat di development oleh ai: 1. favicon harusnya P seperti logo, 2. `—` banyak tanda ini harusnya koma, pake skill human copywriting, 3. terlalu ramai animasi dia pengen flat dan gradient2 di buat flat, 4. warna oranye ga cerah… malah jatuhnya ke abu2, pelajari lagi."* Empat keluhan ini satu akar: efek "AI default" (ikon glossy, em dash di semua copy, gradien + blur + animasi latar, oranye dicampur alpha di atas krem).

### 30.1 Peta keluhan → akar masalah

| # | Keluhan | Akar teknis |
|---|---|---|
| 1 | Favicon bukan "P" logo | `favicon.png`/`.svg` lama berupa letterform 3D glossy bergradien — khas hasil generator, bukan logo Prospect. |
| 2 | Terlalu banyak `—` | 30-an em dash tersebar di komponen visitor-facing, data statis, 3 MDX, **dan konten tersimpan di D1** (`posts` + `content_items`). |
| 3 | Ramai animasi + gradien | Gradien dekoratif di ~15 titik, `backdrop-blur` di header/dock/admin, animasi latar (blob, liveRing, curtain), scrim foto bergradien. |
| 4 | Oranye jatuh ke abu | Warna inti `#ff7a1a` terlalu lembut **dan** dipakai sebagai *alpha wash* (`bg-brand/10`, `border-gold/40`) di atas krem — hasilnya jadi warna "cangkang telur" kusam, bukan oranye. |

### 30.2 Favicon: letterform P datar

`public/favicon.svg` + `public/favicon.png` (180px) dibuat ulang jadi kotak oranye **solid** `#ff6a00` sudut membulat dengan huruf **miring** "P" hitam `#241a12` — mengikuti bentuk logo, tanpa gradien/shadow/gloss. `Base.astro` menambahkan `apple-touch-icon` (PNG baru) dan menghapus `favicon.svg` lama dari head.

### 30.3 Copy manusiawi: `—` → koma (atau titik/restruktur)

Aturan yang disepakati: **koma** sebagai default; **titik atau kalimat dirombak** kalau lebih enak dibaca. Yang dibersihkan:

- Komponen + data statis (`src/components/*`, `src/data/*`) lewat menyapu skrip per-file.
- 3 MDX di `src/content/berita/` dan `migrations/0003_seed_posts.sql` supaya basis seed ikut bersih.
- **D1 produksi**: `0003_seed_posts.sql` memuat 21 em dash, jadi dibuat `.tmp/db-copy-fix.sql` (10 statement: 3 `UPDATE posts`, 5 `UPDATE content_items`, 2 `SELECT` pembuktian) dijalankan `wrangler d1 execute prospect-db --remote` → *Processed 10 queries, 8 rows written*, lalu `--local` untuk kecocokan.
- Auditor `.tmp/dash-audit.mjs` mengulang **semua tabel × semua kolom** dari `D1_SCHEMA`: hasil **BERSIH**, tidak ada `—`/`–` tersisa. Di `dist/` hasil build: **0** tanda pisah terlihat.

### 30.4 Flat: gradien dan animasi latar dimatikan

- **Gradien dekoratif → warna solid**: token `@theme`, latar seksi, `bg-gradient-to-*` pada chip/kartu/pita, teks bergradien (`background-clip:text`) di judul single post, dan `radial-gradient` pada `body` semuanya dihapus.
- **Scrim foto → rata-padat**: bukan gradien, tapi satu warna translucen pekat (`rgba(36,26,18,.42)` pada hero post) atau **chip solid** `bg-ink` untuk label "Live"/caption — foto tetap penuh warna (vet `bg-ink/70` selebar gambar dan efek `grayscale` di CtaBand + ProgramSection dihapus).
- **`backdrop-filter: blur` → 0**: header, `Dock.svelte`, `.dock-in` di `src/lib/dock.ts`, `.hdr` single post, dan 3 tempat di `AdminApp.svelte` kini memakai `var(--paper)`/`bg-white` solid.
- **Animasi latar yang berulang dimatikan**: `@keyframes` blob/`liveRing` dihapus dan `.art-blob` tidak lagi ada di `global.css` (tinggal `.art-ribbon` + `.sport-ball` sebagai bentuk statis). Yang tersisa di halaman visitor hanya **2 animasi `infinite` yang memang disengaja** (dua marquee rail `rail-slide`) — animasi entrance satu kali (`hero-*`, `curtain-out`, `rd-in`) dipertahankan karena client mengeluh *ramai*, bukan *gerak sama sekali*. Catatan penting dari §29: penyapu `pat-*` harus `pointer-events: none`, kalau tidak ia menyita gestur swipe testimoni.
- **Latar jadi flat**: pita oranye `page-curtain` kini satu warna rata (tidur gradasi ke kuning), dan setiap section memakai warna blok solid tanpa gambar latar bergerak.
- **Blend antar seksi tetap ada tanpa gradien**: pemisahan dilakukan lewat warna blok solid bergantian (`--paper` / `--paper-deep` / `--ink`), bukan campuran alpha atau lapisan gradien.
- `.tmp/gold-flat.pl` menangani residu gold: `bg-gold/10 border-gold/40 text-brand-dark` → `bg-brand-soft border-brand text-ink`, `open:border-gold/40` → `open:border-brand`, `bg-crimson/10` → solid `#f9e1e2`, plus typo "wartawanan" → "wartawan".

### 30.5 Oranye: satu warna, tanpa wash

| Token | Lama | Baru | Alasan |
|---|---|---|---|
| `--color-brand` | `#ff7a1a` | **`#ff6a00`** | Saturasi 100%, lebih menyala, tetap satu familia dengan `Logo Black.png`. |
| `--color-brand-dark` | `#d95a00` | **`#bc4c00`** | Naik ke **4.92:1** di atas `--paper` → lolos AA untuk teks kecil. |
| `--color-brand-soft` | — | **`#ffe3c4`** | Dasar blok warna solid menggantikan `bg-brand/10`. |
| `--color-brand-line` | — | **`#ffc49a`** | Garis tepi solid menggantikan `border-brand/30`. |

Yang membuat oranye "jadi abu" adalah **campuran alpha di atas krem** (`bg-brand/10`–`/20`, `border-gold/40`, `text-brand-line` pada angka display). Semua diganti permukaan solid, dan teks yang sebelumnya `text-brand` di atas krem dipindah ke `text-ink`/`text-brand-dark` karena `#ff6a00` di atas `#fffcf7` hanya **2.81:1** — sementara `ink` di atas `brand` = **5.94:1** (dipakai di tombol).

Bersamaan itu kontras yang senyap dinaikkan: `text-ink/40|45|50|55|60` → **`text-ink/70`** di 19 file visitor (≈53 penggantian, dari 2.48–4.47:1 menjadi ≈5.5–6.3:1). Angka display oranye/gold yang murni dekoratif diberi `aria-hidden="true"` dan dinaikkan ke `text-brand` supaya tak lagi dibaca screen reader sebagai teks samar.

### 30.6 Verifikasi — `scripts/verify-ai.mjs` (2 viewport × 7 halaman)

Desktop 1440×900 dan mobile 390×844. Verifier dipromosikan jadi permanen di `scripts/verify-ai.mjs` (cetak JSON ke stdout; arahkan ke `.tmp/ai-report.json` kalau mau disimpan). Hasil: **0 error**.

- Tanda pisah: **0**. Gradien berwarna (computed): **0**. `backdrop-filter`: **0**. Animasi `infinite`: **2** di halaman visitor (keduanya `rail-slide` pada marquee logo); tiga sisanya tinggal di `AdminApp.svelte` sebagai indikator loading, bukan halaman publik.
- Favicon terverifikasi terbaca sebagai kotak oranye solid + "P" hitam di kedua viewport.
- `scripts/audit-palette.mjs`: semua token oranye asli — `#ff6a00`, `#bc4c00`, gold `#ffc32e`, brand-soft `#ffe3c4` — tetap **S=100%, L=50%** saat digambar (alpha penuh, tanpa wash). Catatan pembacaan laporan: auditor menyaring per-hue (12–52°, S≥70%), dan `#fff9f4` (skrim putih-krem translucen) lolos penyaring karena HSL menggelembungkan saturasi warna nyaris-putih. Baris `#fff9f4 @0.85 -> S 15%` di laporan adalah **skrim putih lembut yang memang disengaja**, bukan oranye brand yang pudar.
- Kontras `body *`: **22** flag mentah, seluruhnya masuk tiga kerumunan yang memang diterima desainya — (a) 14× angka display `01/02/03` ber`aria-hidden` dengan `text-brand` (oranye `#ff6a00` di krem = 2.81:1, sengaja dekoratif besar, bukan teks isi), (b) 3–4× *ghost word* `aria-hidden`, (c) 4× teks terang di atas foto (kartu coach `text-white/85`). Motor kontras membaca latar dari warna saja, tidak bisa menyaring piksel foto, jadi (c) positif palsu. Tidak ada teks isi (bukan `aria-hidden`, bukan di atas foto) yang gagal AA.
- Regresi tetap hijau: `verify-dock`, `verify-testimoni` (17 pemeriksaan), `verify-wa-green`, `verify-home` (0 error), `audit-frames` (0 overflow), `audit-modal`.
- `npm run build`: 12 halaman, ±13 detik, tanpa peringatan.

### 30.7 Jebakan yang terlewat sekali

`functions/berita/[slug].ts` menyimpan **CSS inline sendiri** (bukan Tailwind), sehingga tidak tersentuh penyapuan `global.css` — di sana masih ada teks bergradien pada `h1`, `backdrop-blur` 14px pada header, dua `radial-gradient` di `body`, `@keyframes liveRing` tak berujung, dan scrim gradien di hero. Semua diratakan di jalur yang sama (`--brand` ikut disesuaikan ke `#ff6a00`). Pelajaran: setiap kali ada permukaan visual baru, cek **tiga** sumber gaya — `global.css`, kelas Tailwind komponen, dan string CSS di `functions/`.

### 30.8 Jebakan deploy: branch produksi = `main`, bukan `production`

Deploy pertama memakai `--branch=production` dan **berhasil tanpa error**, tetapi Cloudflare mencatatnya sebagai environment **Preview** karena `production_branch` proyek adalah `main` (cek: `GET /pages/projects/myprospect` → `production_branch`). Domain `myprospect.asia` hanya menyajikan environment Production, jadi ia tetap menampilkan build lama — lengkap dengan wash `bg-brand/10`/`border-gold/40` yang sudah kita hapus. `audit-palette` terhadap domain live langsung membongkar ini (oranye masih pudar), padahal build lokal & URL preview sudah bersih.

Perintah yang benar (sudah tercatat di §Depan, baris deploy): `set -a && . ./.env.cf` (token OAuth bawaan wrangler menunjuk akun lain) lalu `npx wrangler pages deploy dist --project-name myprospect --branch=main --commit-dirty=true`. Setelah benar, deployment list menunjukkan Environment **Production** / branch `main` / source `fabd3af`, dan `myprospect.asia` menjadi: 0 wash class, `bg-brand-soft` 28×, `text-ink/70` 145×, `#ff6a00 @1 → S 100%`, favicon `/favicon.svg`. **Selalu verifikasi domain live, bukan hanya URL preview**, karena preview bisa hijau sementara produksi masih basi.

## 31. Oranye masih gelap + anotasi browser belum dikerjakan (4 Nov 2026)

Klien mengelak dua hal: (1) oranye **masih gelap/kurang fresh** — ternyata working tree sempat **di-revert** dari `#ff7a00` kembali ke `#ff6a00`/`#bc4c00`, jadi yang dilihat klien adalah oranye merah-berat; (2) **anotasi browser tidak dikerjakan sama sekali** ("masih sama aja").

### 31.1 Oranye dipersegar (penolakan ke-3)

`#ff6a00` (hue 25) dan `#ff7a00`/`#cc5400` sama-sama ditolak "gelap". Token final: `--color-brand: #ff8000` (bidang solid — badge, tombol, chip) dan `--color-brand-dark: #d96a00` (teks/heading oranye), `brand-soft #ffe6cc`, `brand-line #ffcba3`. Semua pola dekoratif hardcoded `rgb(255 106 0)`/`rgb(255 122 0)` di `global.css` disinkron ke `rgb(255 128 0)`; `categories.ts` dan CSS inline `functions/berita/[slug].ts` ikut. Trade-off kontras kecil pada label uppercase (≈3.4:1) diterima sesuai keputusan estetika klien.

### 31.2 Anotasi browser (8 butir)

| Anotasi | Tindakan |
| --- | --- |
| Hero "Modern" jangan di-highlight, teks oranye | `hl-brand` → `text-brand` (`index.astro`) |
| Hapus section "Cabang Olahraga" | blok `surface-warm > SportBranches` dihapus; `SportBranches.astro` dihapus |
| Ticker ribbon → text cabang olahraga | `items` jadi `cabangOlahraga.map(c=>c.nama)` |
| Hapus chapter (01..10) di semua section | `Chapter.astro` dijadikan no-op (satu titik, 10 pemanggil aman) |
| Section Mitra pindah paling bawah sebelum footer | blok `surface-hair > PartnersSection` dipindah ke akhir `<main>` |
| Logo akademi & mitra pakai gambar asli | `PartnerLogo` sudah auto-pakai `public/media/partners/<slug>.png|svg|...`; **masih perlu file logo asli** — tidak bisa unduh dari Google. Fallback lencana tetap tampil. |
| Garis stripe swash hapus semua | `.hl-swash::before { content: none }` (varian `--dark` ikut mati) |
| Hapus svg dekoratif (net) di Level & Journey | `SportArt variant="net"` di section 04 dihapus |

Verifikasi: `npm run build` 12 halaman; `verify-ai` desktop+mobile → 0 gradien, 0 blur, 0 tanda pisah, `infinite` tetap 2; 404 hanya `/api/pv` & `/api/settings` (Functions, tak ada di `astro dev`). Screenshot: "MODERN" oranye terang, Mitra jadi section terakhir sebelum footer, tanpa banner chapter.

## 32. "Semua foto jangan ada overlay" + 7 anotasi browser, kerja lokal dulu (4 Nov 2026)

Klien meminta **semua foto tampil tanpa overlay gelap** dan menambah 7 anotasi browser. Sesuai permintaan "bisa ga kerjain di local dulu", seluruh perubahan sesi ini **hanya diverifikasi lokal** (`astro dev` port 4321 + `npm run build`) — **belum di-commit dan belum di-deploy**.

### 32.1 Overlay foto dihapus (audit menyeluruh)

| Komponen | Sebelum | Sesudah |
| --- | --- | --- |
| `ProgramSection.astro` kartu | scrim `bg-ink/70` di atas foto tiket | scrim dihapus |
| `ProgramSection.astro` banner Membership | scrim `bg-ink/70` | scrim dihapus; foto diturunkan ke `opacity-25` sebagai tekstur di atas bidang `#1c1208` (teks putih tetap terbaca) |
| `CoachesSection.astro` foto mic-kid | scrim `bg-ink/70` + `SportArt net` | scrim & net dihapus; caption pindah ke plat solid `bg-ink` |
| `islands/Testimonials.svelte` | scrim `bg-ink/70` di foto | scrim dihapus; ikon kutip pindah ke chip bulat `bg-ink` solid |
| `CtaBand.astro` | scrim `bg-ink/80` + foto `opacity-40` | keduanya dihapus — `workshop-crowd.jpg` tampil penuh/terang; blok teks "Berani Bicara?" duduk di kartu `bg-ink` solid `rounded-3xl` (foto aslinya terang/siang, teks putih langsung di atasnya tak akan terbaca) |

Yang **dipertahankan** (bukan foto, jadi bukan pelanggaran): `bg-ink/70` di blok jersey `CoachesSection` (pola CSS `.jersey` coret-oranye), chip caption `bg-ink/80` pada kartu program, dan backdrop modal `bg-ink/65` di `RegisterModal`. Audit `grep` memastikan tidak ada lagi `absolute inset-0 bg-ink/*` atau `bg-gradient` di atas `<img>` di seluruh `src/`.

### 32.2 Anotasi browser (7 butir)

| Anotasi | Tindakan |
| --- | --- |
| 3× kartu program "jangan ada overlay" | lihat 32.1 |
| Ribbon "semua cabang olah raga dong" | `sports.ts` diperluas 8 → 23 cabor (Tenis, Tenis meja, Panahan, Taekwondo, Karate, Pencak silat, Senam, Balap sepeda, E-sports, Hoki, Sepak takraw, Panjat tebing, Judo, Angkat besi, Dayung); tipe `Sport` ikut diperluas; `SportIcon` fallback piala untuk cabor baru |
| "marquee ini hapus, double dengan di atas" | baris marquee "Scoreboard" dihapus dari `StatsBar.astro` (+ `const ticker` + import `TickerRibbon`) |
| "hapus section ini" (Level & Journey) | blok `surface-warm` Level & Journey dihapus dari `index.astro`; `LevelJourney.svelte` **dihapus** (tak ada pemanggil lain); import `SportArt` & `LevelJourney` dibersihkan |
| "backgroundnya ko ga full width?" | `ProgramSection` direstruktur: section `w-full` (latar `prog-bg` full-bleed), konten dibungkus `mx-auto max-w-6xl px-4` di dalam `surface-ink` |

### 32.3 Verifikasi lokal

`npm run build` 12 halaman OK. HTML hasil build/dev: `Scoreboard` hanya tersisa di komentar HTML (tak tampil), 23 nama cabor muncul di ribbon, `bg-ink/70` tinggal 12× semunya pola jersey `CoachesSection`, `bg-ink/80` tinggal 3× chip caption. **Langkah berikutnya bila klien setuju: commit → L3 → deploy `--branch=main`.**

---

## 33. Selesaikan §32 di lokal: bug foto escape + kartu OG baru (4 Nov 2026)

Sesi ini **hanya lokal** (`astro dev` :4321 + `wrangler pages dev dist` :8788). **Belum di-push dan belum di-deploy** — push ke `main` = deploy produksi, jadi harus jelas dulu ke klien.

### 33.1 Bug: foto banner Membership lepas dari kotaknya

Gejala: di section Program, **foto atlet besar transparan menimpa seluruh section** (kelihatan di atas teks kartu "Progress paling cepat…") dan membuat judul "PRIVATE 1-ON-1 BUAT NAIK LEVEL" terlihat pudar seperti bergradien.

Penyebab: `<img class="absolute inset-0 …">` di dalam banner Membership — tapi banner itu **tidak punya `position: relative`**. Containing block-nya jadi wrapper `.relative z-10 mx-auto max-w-6xl` (seluruh section), **bukan** banner. Dan `overflow-hidden` di banner **tidak memotong** anak yang containing block-nya di luar banner (aturan CSS: clipping hanya berlaku kalau containing block berada di dalam elemen yang di-clip).

Akibatnya foto (opacity-25, 1152×1203) menimpa 3 kartu program + judul.

Fix: tambah `relative` pada banner → `src/components/ProgramSection.astro:152`.

```html
<!-- SEBELUM -->
<div class="mt-6 overflow-hidden rounded-3xl bg-[#1c1208] …">
<!-- SESUDAH -->
<div class="relative mt-6 overflow-hidden rounded-3xl bg-[#1c1208] …">
```

**Pelajaran (penting untuk agent berikutnya):** setiap `absolute inset-0` wajib dicek apakah induknya `relative`. Kalau tidak, elemen itu keluar dari kotak yang dimaksud dan `overflow-hidden` tidak menolong. Verifikasi cepat: `.tmp/probe-escape.mjs` (semua elemen `position:absolute` yang melebar >12px di luar parent langsung) — jalankan di setiap halaman.

### 33.2 Kartu OG di-regenerate ke tema terang (item §16.1)

OG lama = `src/assets/generated/a2-og-bg.jpg` (MiniMax, nuansa **hitam-merah glossy**) — sama sekali tidak cocok dengan tema paper+oranye yang sekarang. Diganti.

- **Latar** = MiniMax `image-01`, prompt: *"flat minimal, warm off-white cream, semua dekorasi hanya di sudut kanan bawah, garis lapangan + basket oranye, tanpa gradien/3D/teks"*. Kandidat terbaik `.tmp/og2/image_1_*.jpg`; kandidat dengan teks gibberish ("FROM FLOR") dibuang.
- **Komposisi** = `scripts/gen-og.mjs` (baru): render HTML 1200×630 di Chromium headless, font asli situs (Anton + Plus Jakarta Sans dari `@fontsource`, di-inline sebagai data URL) + logo `public/media/logo-prospect-black.png` + judul + chip `#JADIATLETMODERN` + `myprospect.asia`, lalu screenshot → `src/assets/generated/og-cover.jpg`.
- `Base.astro` sekarang mengimpor `og-cover.jpg` (bukan `a2-og-bg.jpg`); `a2-og-bg.jpg` **dihapus**.
- Detail berita tetap pakai `cover` berita sebagai og:image (tidak berubah).

Regenerasi ulang: `node scripts/gen-og.mjs [path-latar]`.

### 33.3 Perbaikan alat uji

- `scripts/verify-home.mjs` → area `level` (selector `img[class*="aspect-16"]`) sudah tidak ada karena section Level & Journey dihapus (§32.2) → diganti area `workshop` (`#workshop`). sebelumnya area itu selalu `ok:false`.

### 33.4 Status verifikasi lokal (semua PASS)

Dijalankan terhadap `wrangler pages dev dist --port 8788` (fungsi Pages aktif, D1 lokal ter-seed 3 berita):

| Verifier | Hasil |
|---|---|
| `audit-frames.mjs` | desktop + mobile: `horizontalOverflow:false`, `over:[]`, `revealNotIn 0/22`, **0 console error** |
| `audit-clip.mjs` | 10 halaman × 2 viewport → **0 overflow, 0 covered** (sisanya `clipped` false-positive dari `line-clamp` + wrapper SplitText) |
| `verify-ai.mjs` | 7 halaman × 2 viewport → **0 gradien, 0 blur, 0 tanda pisah**, `infinite` tetap 2 (`rail-slide`), 0 error, 0 request gagal |
| `verify-dock.mjs` | **SEMUA PASS** (termasuk single post + scroll-hide) |
| `verify-wa-green.mjs` | **SEMUA PASS** (termasuk `hdr-wa` single post) |
| `verify-testimoni.mjs` | **SEMUA PASS** (swipe jari Δ=±331px, autoplay, klik titik) |
| `verify-home.mjs` | 0 console error, 0 request gagal; 18 flag kontras = 3 angka `01/02/03` ber`aria-hidden` + 15 `✓` ber`aria-hidden` (kategori yang memang diterima desain) |

> Di `astro dev` (:4321) `verify-dock`/`verify-wa-green` **gagal** pada single post karena `functions/berita/[slug].ts` tidak jalan di dev — itu artefak alat uji, bukan bug. Verifikasi halaman yang dilayani Function **harus** lewat `wrangler pages dev dist`.

### 33.5 Sisa pekerjaan (belum dikerjakan, butuh klien)

1. **GA4 ID** — loader siap, ID belum diberikan (§15.2).
2. **Harga Workshop Pro** — masih "Custom" (§15.4).
3. **Logo mitra & foto coach asli** — `Website Material/Coaches Picture/` masih kosong; lencana SVG dipakai sebagai ganti (§15.8).
4. **Copy "SPEAK LOUD!"** — masih playful; klien mungkin mau lebih formal (§16.5).
5. Push + deploy (`--branch=main`) **setelah klien setuju**.

---

## 34. Arah warna "Putih dominan" — akar masalah "kumal" ditemukan (4 Nov 2026)

Keluhan klien: *"gimana ya warna orange dan hitam dark jadinya kumal, kamu ada ide warna ga.. orange fresh dengan putih?"*

### 34.1 Akar masalahnya: hue oranye = hue "hitam"

Token lama diuji dengan HSL:

| Token | Nilai | HSL | Hue |
|---|---|---|---|
| `--color-brand` (oranye) | `#ff8000` | 30, 100%, 50% | **30.1** |
| `--color-ink-2` ("hitam") | `#17110b` | 30, 35%, 7% | **30.0** |
| `--color-ink` (teks) | `#241a12` | 27, 33%, 11% | 26.7 |

"Hitam" yang dipakai situs **bukan hitam** — dia cokelat gelap di **hue yang sama persis** dengan oranye. Dua warna hue-30 berdampingan = tanah liat/terakota, hasilnya persis "kumal". Oranye yang sama akan teriak kalau field gelapnya **netral**.

### 34.2 Arah yang dipilih klien: A — Putih dominan, dark minimal

Sudah diterapkan di localhost (belum di-deploy). Prinsipnya:

| Token | Lama | Baru | Alasan |
|---|---|---|---|
| `--color-paper` | `#fffcf7` | **`#ffffff`** | putih jadi field utama |
| `--color-paper-deep` | `#fff3e4` | **`#fff5ea`** | krem sangat tipis untuk section/kaki |
| `--color-ink` | `#241a12` | **`#1b1b1f`** | arang netral, bukan cokelat → teks lebih tajam |
| `--color-ink-2` | `#17110b` | **`#121316`** | hitam netral (bukan cokelat) |
| `--color-brand` | `#ff8000` | **`#ff8000` (tidak diubah)** | sudah disetujui klien 3×; kesegaran datang dari putih dominannya |
| `--color-brand-dark` | `#d96a00` | `#d96a00` (tidak diubah) | hanya untuk teks besar/decor |
| **`--color-brand-text`** | — | **`#ad5000`** (BARU) | teks oranye **kecil**: `#d96a00` cuma 3.4:1, `#ad5000` tembus **5.3:1 di putih & 5.0:1 di krem** (AA) |
| `--color-brand-soft` | `#ffe6cc` | `#ffe8d1` | |
| `--color-bone` | `#f7f5f2` | tidak diubah | teks di atas permukaan gelap |

Semua warna hardcoded cokelat ikut disinkronkan: `rgba(36,26,18,…)` → `rgba(27,27,31,…)` (21 file), SVG data-URI `%23241a12` → `%231b1b1f`, `%23ff6a00` → `%23ff8000`, `.crest-stop-*` → `#1b1b1f`.

### 34.3 Blok gelap direduksi

Dulu ada 5 blok gelap penuh; sekarang **3** (+ 2 kartu, bukan field):

| Blok | Status |
|---|---|
| ticker + scoreboard (`surface-ink`) | **tetap gelap** — momen 1 |
| Section Program | **jadi terang** (`bg-paper-deep`, kartu putih, judul tinta) |
| Banner Membership | tetap gelap (`#121316`) — kartu premium, foto turun ke opacity-15 |
| Kartu jersey coach | tetap gelap — kartu, bukan field |
| Pita CTA (`CtaBand`) | **tetap gelap** — momen 2 |
| Footer | terang sejak dulu (`bg-paper-deep`) |
| Strip mitra | terang (lencana ink di kartu putih) |

`ProgramBackdrop` (garis lapangan) digambar dari putih → tinta netral, `prog-bg__vignette` dihapus.

### 34.4 Teks kecil oranye → `text-brand-text`

Sweep 21 file: `text-brand-dark` → `text-brand-text` **kecuali** yang berawalan `display` (teks besar, 3.4:1 sudah cukup untuk ≥24px). Yang kena: eyebrow, label form, link "Detail →", caption harga, centang `✓`, label kategori berita, dock label aktif.

### 34.5 Tiga sumber gaya (jebakan §30.7) — semuanya disinkronkan

1. `src/styles/global.css` (token + utilitas)
2. `src/lib/dock.ts` (`DOCK_CSS` — dipakai island + Function)
3. `functions/berita/[slug].ts` (CSS inline halaman detail berita): `:root` → `--ink:#1b1b1f; --paper:#ffffff; --paper-deep:#fff5ea; --brand-text:#ad5000`, semua `rgba(36,26,18,…)` → `rgba(27,27,31,…)`

### 34.6 Trade-off yang diterima

`text-brand` (#ff8000) di atas putih = **2.52:1**, jadi kata "MODERN" di hero (96px) dan angka dekoratif `01/02/03` di kartu program masih di bawah ambang 3:1. Ini **meminta klien secara eksplisit** (§31.2: "Modern jangan di-highlight, teks oranye"), jadi tidak diubah — sama seperti catatan §31.1. Semua teks isi kecil sudah naik ke AA lewat `brand-text`.

### 34.7 Verifikasi lokal (semua PASS, `wrangler pages dev dist` :8788)

| Verifier | Hasil |
|---|---|
| `npm run build` | 12 halaman, bersih |
| `audit-frames.mjs` | desktop+mobile: `horizontalOverflow:false`, `over:[]`, `revealNotIn 0/22`, **0 console error** |
| `audit-clip.mjs` | 10 halaman × 2 viewport → **0 overflow, 0 covered** |
| `verify-ai.mjs` | 7 halaman × 2 viewport → 0 gradien, 0 blur, 0 tanda pisah, 0 error, 0 request gagal; 18 flag kontras = **semua dekoratif** (`ghost-word`, angka `01-03`, "MODERN" besar) |
| `verify-home.mjs` | 0 console error, 0 request gagal |
| `verify-dock.mjs` | **SEMUA PASS** |
| `verify-wa-green.mjs` | **SEMUA PASS** |
| `verify-testimoni.mjs` | **SEMUA PASS** (17 pemeriksaan) |
| `verify-admin-ui.mjs` | **SEMUA PASS** (desktop + mobile) |
| pw-vision 22 kombinasi | **22/22, 0 bug struktural, 0 overflow, 0 small target** |
| Vision (desktop 1440×900 + mobile 390×844) | hero putih + judul tinta + "MODERN" oranye; scoreboard arang + angka oranye; section Program krem + kartu putih + judul tinta; kartu jersey tetap gelap; pita CTA & footer bersih |

### 34.8 Alat uji yang diperbaiki

- `scripts/verify-admin-ui.mjs` → `requestfailed` untuk `POST /api/admin/login|logout` **tidak** lagi dihitung sebagai kegagalan..ini balapan timing antara navigasi dan fetch yang selesai (di edge produksi respons cepat, di wrangler dev lokal navigasi menang). Sebelum diperbaiki, verifier gagal lokal padahal produknya benar.
- **Prasyarat lokal**: `wrangler pages dev` butuh secret admin. Buat `.dev.vars` (sudah masuk `.gitignore`):
  ```
  ADMIN_PASSWORD=<isi .env.admin>
  ADMIN_SESSION_SECRET=<apa saja, untuk lokal>
  ```
  Tanpa itu, `/admin/` balas **503** (middleware butuh `ADMIN_PASSWORD`).

### 34.9 Preview 3 arah (dipakai untuk memilih arah)

`~/Downloads/palet-preview.png` + `palet-preview.html` (bisa dibuka di browser) berisi 3 mock arah: A Putih dominan, B Arang netral + oranye, C Jeruk lebih kuning. Klien memilih **A**.

---

## 35. Animasi galeri + ken-burns dikembalikan (4 Nov 2026)

Klien: *"ini sebelumnya slide foto dan kenburn bagus ko jadi engga"* (menunjuk `<img src="/media/workshop-crowd.jpg" … style="animation-delay:10s; animation-duration:15s">`).

### 35.1 Kenapa mati

Revisi "flat" (§30.4) menghapus **animasi latar** (blob, liveRing, ken-burns, crossfade galeri) karena klien mengeluh *"terlalu ramai animasi"*. Yang ikut terbuang adalah `gallery-fade` — padahal itu **transisi antar foto di galeri**, bukan animasi latar. Efeknya:

- `src/styles/global.css` → `.gallery img` jadi `opacity: 0` **tanpa** `animation`, lalu `.gallery img:first-child { position: relative; opacity: 1 }` menampilkan hanya foto pertama.
- `style="animation-delay:…; animation-duration:…"` di `AutoGallery.astro:27` jadi **sisa mati** (nilai delay/duration masih benar, tapi tidak ada `animation-name`).
- `@keyframes ken-burns` dihapus, dan `.ken-burns` tidak lagi dipakai di `CtaBand.astro` maupun banner Membership.

### 35.2 Yang dikembalikan

| Aset | Status |
|---|---|
| `@keyframes gallery-fade` (crossfade + zoom 1.08→1) | **hidup lagi** di `.gallery img`; aturan `:first-child` yang membekukan galeri **dihapus** |
| `@keyframes ken-burns` (zoom 1.04→1.16 + geser 1.6%) | **hidup lagi**, dipakai di foto pita CTA (`CtaBand.astro`) & foto banner Membership (`ProgramSection.astro`) |
| grayscale pada foto itu | **tidak** dikembalikan (klien minta foto penuh warna) |

Yang tetap mati: animasi latar (blob / liveRing / curtain). Rail marquee tetap hidup seperti sebelumnya, jadi "terlalu ramai" yang dulu dikeluhkan klien **belum** terjadi.

### 35.3 Verifikasi (terukur, bukan dikira)

Probe opacity 18 detik (`performance.now()`), galeri 3 foto step 5s:

| t | img1 | img2 | img3 | ken-burns CTA |
|---|---|---|---|---|
| 2s | 0.97 (scale 1.073) | 0 | 0 | scale 1.040 |
| 6s | 0.73 | 0 | 0 | scale 1.055 |
| 10s | 0 | **1** | 0 | scale 1.089 |
| 14s | 0 | 0 | **1** | scale 1.129 |
| 18s | **1** | 0 | 0 | scale 1.154 |

Siklus 15s (3 foto × 5s) + zoom kontinu; foto berganti benar, tidak pernah frame kosong (screenshot 3 momen: `workshop-live` → `workshop-live-2` → `workshop-crowd`).

Lainnya: `audit-frames` 0 overflow + 0 console error · `audit-clip` **0 overflow / 0 covered** · `verify-ai` 0 gradien/blur/pisah, 0 error, 0 request gagal (animasi `infinite` sekarang: `gallery-fade`, `ken-burns`, `rail-slide`) · `verify-dock` / `verify-wa-green` / `verify-testimoni` **SEMUA PASS**.

---

## 36. Scoreboard jadi panel terang (4 Nov 2026)

Klien (paste HTML blok stats): *"ini tolong kamu pikirkan pake image background apa yang seperti scoreboard jangan kelihatan gelap jelek dan tetap profesional"*.

### 36.1 Keputusan: bukan foto, tapi struktur

Pertanyaan "pakai image background apa" dijawab **tanpa foto**: kalau foto stadion dipakai sebagai latar, teks di atasnya pasti perlu scrim → hasilnya justru kembali ke "gelap & jelek" (persis keluhan §32). Yang bikin terasa scoreboard itu **strukturnya**, bukan fotonya:

| Elemen | Peran |
|---|---|
| Panel putih + garis rambut (`ring-ink/10`) | bidang "papan" |
| `pat-grid` (grid blueprint, tinta netral, opacity 60) + `art-pitch` | tekstur teknis, tetap putih |
| `pat-halftone` di sudut kiri bawah | detail halftone oranye |
| Kepala papan: titik oranye + `PROSPECT ASIA · SPORTS COMMUNICATION` + `ANGKA PROGRAM` | header scoreboard |
| 3 panel dipisah `divide-x divide-ink/10` | kolom papan |
| Angka `score-digits` (tabular) + strip oranye `w-9` di bawahnya + label kecil tracked | sel papan |

Foto **tidak** dipakai. Alasannya: foto + teks = butuh scrim = gelap. Client sendiri sudah menolak "foto dengan overlay" di §32.

### 36.2 Perubahan

- `src/components/StatsBar.astro` → tulis ulang: `bg-paper` + `ring-ink/10` + grid/pitch/halftone terang + kepala papan. `bg-ink-2`, `pat-grid-light`, `art-track`, dan garis oranye atas dihapus.
- `src/components/islands/StatsList.svelte` → tile gelap (`bg-ink`) diganti panel terang: `grid divide-x divide-ink/10`, angka `text-brand-dark` (3.41:1, lolos AA untuk teks besar), strip oranye `h-1 w-9`, label `text-ink/60` tracked.
- `src/pages/index.astro` → wrapper `<div class="surface-ink">` di scoreboard **dihapus** (blok gelap terakhir di section atas halaman).

### 36.3 Jebakan mobile: label jadi yatim

"COACH BERPENGALAMAN" pecah jadi `BERPENGALAMA` + `N` (huruf terakhir sendirian) karena `break-words` memotong di tengah kata. Fix: tracking label dikecilkan di mobile (`tracking-[0.05em]`, desktop tetap `0.18em`) → diukur: tinggi label 1 baris (11px) untuk "Atlet teredukasi", 2 baris (23px) untuk dua label panjang, **tanpa huruf yatim**.

### 36.4 Verifikasi lokal

`audit-frames` 0 overflow + 0 console error · `audit-clip` **0 overflow / 0 covered** · `verify-ai` 0 gradien/blur/pisah, 0 error, 0 request gagal, angka scoreboard **tidak** masuk daftar flag kontras (3.41:1 ≥ 3:1 untuk teks besar) · pw-vision 22/22, 0 overflow, 0 small target · vision desktop 1440×900 + mobile 390×844.

> Pita ticker di atas scoreboard **tetap gelap** (strip tipis 36px) — ritme kontras yang disengaja. Kalau klien mau 100% putih, cukup ganti `tone="ink"` → `tone="brand"` di `index.astro` (1 baris).

---

## 37. Scoreboard jadi papan LED seven-segment (4 Nov 2026)

Klien: *"sy kira kaya scoreboard beneran art gitu entah image km generate atau art paham ga sih"*.

### 37.1 Keputusan: bukan foto, tapi Seven-Segment sungguhan

Versi §36 (panel putih + angka Anton) ditolak karena masih terasa "panel SaaS", bukan papan skor. Diputuskan: pakai **art seven-segment asli**:

- **Bukan gambar** — angka digambar dari 7 segmen polygonal (`a`…`g`) di dalam SVG, jadi Seven-Segment asli.
- **Segmen mati tetap terlihat** (`rgba(255,128,0,.09)`) — seperti LED papan stadion yang belum menyala.
- **Miring satu baris** (`skewX(-5)` pada seluruh baris angka, bukan per digit).
- Angka ikut **menghitung naik** (rAF + easing 1200 ms) → saat data masuk, papannya berdenyut seperti LED yang di-update. Terbukti: jumlah polygon berubah 35 → 49 saat digit bertambah.

### 37.2 File baru

`src/components/islands/LedNumber.svelte` (baru):
- `SEG_POINTS` = 7 polygon segmen; `LIT` = peta digit → segmen yang menyala.
- `DIGIT_OFFSET` = pergeseran per digit (lihat jebakan 37.4).
- Glyph: digit · titik (pemisah ribuan `id-ID`) · tanda `+`.
- Teks untuk screen reader memakai **nilai final** (`to`), bukan angka yang sedang berdenyut, dan warnanya `text-white/75` supaya audit kontras tidak salah baca papan gelap.

`src/components/islands/StatsList.svelte` → memakai `LedNumber` (angka `Counter` dihapus dari sini; `Counter.svelte` masih dipakai tak lagi di tempat lain — boleh dihapus).

`src/components/StatsBar.astro` → papan:
- Field **arang netral `#0b0c0e`** (bukan cokelat — itu sebab "kumal" di §34), `ring-white/10`, shadow lembut.
- **Grid piksel LED**: `radial-gradient(rgb(255 128 0 / .09) 1px, transparent 1.15px)`every 5px.
- **Sudut papan**: 4 pojok oranye (L-shape) + garis oranye 1px di atas.
- Kepala papan: `● PROSPECT ASIA` di kiri, `SPORTS COMMUNICATION` di kanan.
- 3 kolom dipisah `divide-x divide-white/10`, label `text-white/55` tracked.

### 37.3 Kenapa tidak pakai foto

Papan LED harus **hitam** — itu nature-nya. Yang bikin "terlihatdeveloped by AI" itu bukan warnanya, tapi **detail yangMurahan**: gradien glossy, blur, glow. Papan ini kebalikannya: field rata, satu warna, geometri presisi (7 segmen), tanpa glow. Jadi "hitam" di sini terbaca sebagai *objek*, bukan *bajakan*.

### 37.4 Jebakan geometri (3 bug yang hanya terlihat lewat vision)

1. **Digit '1' nabrak '7'** — segmen '1' hanya menyala di sisi kanan sel, jadi glifnya menempel ke digit berikutnya. Fix: `DIGIT_OFFSET = { '1': -33 }` (geser ke tengah sel).
2. **Angka tidak center** — koordinat segmen meleset 6 unit dari tengah sel 108. Fix: semua koordinat digeser +6.
3. **Tanda '+' melayang di tengah atas** — harus di garis dasar. Fix: digeser ke `y=115..148`.
4. Plus: **skew per digit** bikin digit saling menabrak di bawah → skew dipindah ke satu `<g>` untuk seluruh baris.

### 37.5 Verifikasi lokal (semua PASS)

`audit-frames` 0 overflow + 0 console error · `audit-clip` **0 overflow / 0 covered** · `verify-ai` 0 gradien/blur/pisah, 0 error, 0 request gagal; 18 flag kontras = **sama seperti sebelum** (ghost-word, angka 01-03, "MODERN") — tidak ada flag baru dari papan LED · `verify-home` 0 console error, 0 request gagal · `verify-dock` / `verify-wa-green` / `verify-testimoni` / `verify-admin-ui` **SEMUA PASS** · pw-vision 22/22, 0 overflow, 0 small target · vision desktop 1440×900 + mobile 390×844 (zoom 4× untuk cek geometri digit).

### 37.6 Revisi setelah kritik klien: "jelek ga kebaca"

Klien menilai versi §37 pertama: **"jelek ga kebaca"** — dan itu memang bener. Tiga masalah nyata (terlihat hanya dari screenshot, bukan dari angka):

| Masalah | Sebab | Fix |
|---|---|---|
| "2.175" susah dibaca, angka "1" dan "7" tenggelam di kabut | **segmen mati terlalu terang** (`rgba(255,128,0,.09)`) → di belakang "1" dan "7" muncul bentuk "8" gelap yang mengotorkan | segmen mati diredupkan ke `rgba(255,128,0,.045)` |
| Terlihat seperti bentuk oranye datar, bukan LED yang menyala | tidak ada cahaya | kelas `.led-lit` → `filter: drop-shadow(0 0 5px rgb(255 128 0 / .4))`, **1 filter per digit** (bukan per polygon) |
| Di mobile "2.175+" meluber ke kolom sebelah | `w-auto` → lebar SVG = tinggi × aspect, jadi 4 digit melebihi kolom | `w-full` + `preserveAspectRatio="xMidYMid meet"` → konten skala-tayang di dalam kotak |
| "2.175+" jauh lebih kecil dari "25"/"6" | 4 digit memang butuh 4× lebar sel | glif dirapatkan (x diskale ~0.72), `DIGIT_W` 108→82, `DOT_W` 32→24, `PLUS_W` 56→42, `DIGIT_OFFSET['1']` -33→-27. Tinggi semua angka di HP kini ~39px vs 44px (dari 30 vs 44) |

Papan LED Seven-Segment memang ramping — jadi ini bukan kompromi, tapi memang bentuk aslinya.

### 37.7 Verifikasi revisi

`audit-frames` 0 overflow + 0 console error · `audit-clip` **0 overflow / 0 covered** · `verify-ai` 18 flag (sama seperti sebelumnya, tanpa flag baru) · `verify-home` 0 error · `verify-dock` / `verify-wa-green` / `verify-testimoni` **SEMUA PASS** · pw-vision 22/22, 0 overflow, 0 small target · **pengukuran overlap antar kolom SVG: 0** (mobile & desktop) · tinggi kotak SVG seragam: mobile 44px, desktop 64px.

---

## 38. CTA band dirombak + art background dipangkas (4 Nov 2026)

Permintaan klien: *"ini jelek banget, dan di setiap section kurangi background art buat flat design dan sedikit art saja agar tidak terlalu ramai dan terlihat premium"*.

### 38.1 Pita CTA: dari "dua blok gelap" jadi kartu tenang

| | Lama | Baru |
|---|---|---|
| Field | `bg-ink` (hitam penuh, 2 blok hitam berturut-turut dengan ticker) | `bg-paper-deep` (krem) |
| Foto | full-bleed + **kartu hitam** `bg-ink` mengambang di atasnya | di dalam bingkai bulat `rounded-3xl`, **tanpa scrim, tanpa kartu gelap** |
| Pita ticker | ada (`tone="ink"`, isi "Gratis konsultasi…") | **dihapus** — isinya dobel dengan ticker 23 cabang olahraga di bawah hero (§32.2) pernah dikeluhkan klien |
| Judul | putih | tinta, "Bicara?" oranye |
| Chip | garis putih | chip putih `border-ink/15` di atas krem |
| Art | SportArt + pat-grid-light + pat-halftone + 2 bola = **6 lapisan** | **1** (`art-pitch` di tepi bawah) |

Layout jadi 2 kolom (teks kiri, foto kanan) di `lg`, susun ke bawah di mobile. Tombol tetap oranye solid + `data-magnetic` + `data-register`.

### 38.2 Art background dipangkas: 41 → 7 elemen

Dihitung dari HTML build (`dist/index.html`), jumlah elemen dekoratif per homepage:

| | Sebelum | Sesudah |
|---|---|---|
| `sport-ball` | 13 | **0** |
| `prog-bg__*` (bola backdrop) | 8 | **1** (garis lapangan saja) |
| `art-dots` | 3 | 0 |
| `pat-halftone` | 3 | **1** (pojok hero) |
| `pat-grid` | 2 | 0 |
| `art-ring` / `art-diamond` | 2 / 1 | 0 / 0 |
| `art-pitch` / `art-balls` / `art-track` | 2 / 2 / 2 | 1 / 1 / 1 |
| `ghost-word` | 3 | **2** (About "Speak", Coach "Coach") |
| **TOTAL** | **41** | **7** |

Aturan baru yang dipakai: **maksimal 1 lapisan art per section**, dan itu harus tipis. Section yang art-nya dihapus total: Testimoni (halftone), Coach (court + diamond + bola), About (grid + pitch + 2 bola), Program (ring + balls + bola + ghost word), Blog (dots + ring), Hero (dots + pitch + 2 bola + 2 dekor kecil), Workshop (dots + track + bola).

Yang **dipertahankan** karena itu "isi", bukan latar: foto atlet di hero, jersey coach (CSS art kartu), papan LED scoreboard, grid piksel LED, dan 2 stiker hero.

`SportArt` yang tersisa: `stadium` (Workshop) + `net` (Blog). Stroke-nya ikut disinkronkan `#241a12` → `#1b1b1f` (netral).

### 38.3 Verifikasi lokal (semua PASS)

`audit-frames` 0 overflow + 0 console error · `audit-clip` **0 overflow / 0 covered** · `verify-ai` 17 flag (17 = dekoratif saja: ghost-word ×2, angka 01-03 ×6, "MODERN" ×2, dan angka display lain); teks kecil CTA yang tadinya `text-ink/60` (4.41:1) dinaikkan ke `/70` → lolos AA · `verify-dock` / `verify-wa-green` / `verify-testimoni` / `verify-admin-ui` **SEMUA PASS** · pw-vision 22/22, 0 overflow, 0 small target · vision desktop 1440×900 + mobile 390×844.

---

## 39. Mitra: 2 logo asli + grid compact 3 kolom (4 Nov 2026)

Permintaan klien: *"bagian ini kamu bisa cari logo realnya dan buat kecil2 compact dan di mobile 3 kolom buat yang rapih"*.

### 39.1 Dua logo asli berhasil didapat

| Mitra | Sumber | File |
|---|---|---|
| **RSIA Limijati** | situs resmi `rsia-limijati.com` → berkas "Logo Lengkap.png" (Wix CDN) | `public/media/partners/rs-limijati.png` (900×330, alpha) |
| **Little Pep** | Linktree resmi `linktr.ee/littlepep` → OG image, **dipotong** jadi bulatan logo | `public/media/partners/little-pep.png` (320×320) |

Sisanya **tidak** punya logo yang bisa diambil tanpa login:

| Mitra | Kenapa gagal |
|---|---|
| Djanur Football Academy, Akademi Futsal Margahayu Raya, MFC Marunda, PB Jaya Raya Ragunan, SSBRBC, Dream Baller ID, Pep Sports, Exortive | akun Instagram saja. `webfetch` ke IG mengembalikan **login wall** (500 KB HTML shell, tidak ada `profile_pic_url`/`og:image`). `linktr.ee/og/image/<handle>.jpg` hanya 200 untuk handle yang memang punya Linktree — hasil yang ketemu (`djanur` → "objkt.com", `dreamballer` → "Contact admin") **bukan brand yang benar**, jadi dibuang. `ssbrbc.com` (ada di bio IG-nya) tidak bisa diakses (connection 000) |

Sisa 8 mitra tetap pakai **lencana SVG** (satu keluarga desain, bukan logo palsu). Cara drop-in logo asli sudah aktif dan otomatis: taruh file di `public/media/partners/<slug>.png|jpg|webp|svg` → dipakai tanpa ubah kode.

### 39.2 Bug: mekanisme drop-in tidak pernah jalan

`PartnerLogo.astro` mencari file logo dengan `new URL('../public/…', import.meta.url)` — jalur relatif dari `src/components/` menunjuk `src/public/` (hanya **satu** tingkat ke atas, seharusnya **dua**). Akibatnya `existsSync()` selalu false, jadi **tidak ada** logo asli yang pernah terdeteksi sejak mekanismenya dibuat (§20.1).

Perbaikan: pakai `path.join(process.cwd(), 'public', 'media', 'partners', …)`. Alasannya `import.meta.url` saat build Vite menunjuk URL modul di graf Vite, bukan file sumber — jadi even dengan `../../` pun tetap bisa salah.

### 39.3 Layout: compact + 3 kolom di HP

| | Lama | Baru |
|---|---|---|
| Kolom HP | 2 (akademi), 3 (mitra) | **3** (akademi, 6 item = 2 baris penuh) · **2** (mitra, 4 item = 2×2 penuh) |
| Kolom desktop | 3 | **6** (akademi satu baris) · **4** (mitra satu baris) |
| Isi kartu | logo + nama + label "AKADEMI/MITRA" | **logo + nama saja** (label redundant, sudah ada di judul kelompok) |
| Ukuran | logo 48–56px, kartu `p-3.5`, `rounded-2xl`, `shadow-soft` | logo **40–48px**, kartu `p-2.5`, `rounded-xl`, tanpa shadow |
| Label jumlah | "6 mitra" (salah untuk kelompok akademi) | "6 akademi" / "4 mitra" |

Jumlah kolom per kelompok disimpan di `grup[].cols` supaya **barisnya terisi penuh** di HP (6 → 3 kolom, 4 → 2 kolom).

### 39.4 Verifikasi lokal

`audit-frames` 0 overflow + 0 console error · `audit-clip` **0 overflow / 0 covered** · `verify-ai` 17 flag (dekoratif saja) · pw-vision 22/22, 0 overflow, 0 small target · vision desktop 1440×900 + mobile 390×844 (logo asli terbaca jelas, tile rapi).

### 39.5 Revisi: tile mitra tanpa box

Klien: *"bisa ga gausah pake box jadi kelihatan penuh"*. Kartu (`rounded-xl border bg-white`) dihapus — logo + nama langsung di atas latar putih, seperti logo wall biasa. Logo box dinaikkan 40/48 → 48/56px. Hover cukup naik 2px + nama jadi oranye.

---

## 40. Hero + About memakai copy resmi klien (4 Nov 2026)

Klien mengirim copy resmi (dokumen teks) untuk dua banner. **Semua dipakai verbatim** — bahasa klien, bukan parafrase.

### 40.1 Banner paling atas (hero)

| Bagian | Copy klien | Implementasi |
|---|---|---|
| Headline | "Kini #JadiAtletModern Harus Bisa Bahasa Inggris & Public Speaking!" | h1 display 3 baris; **#JadiAtletModern** oranye (`text-brand`) |
| Sub headline | [English for Athletes] [Public Speaking for Athletes] [Digital Literacy & Personal Branding] | **3 chip** `bg-brand-soft border-brand` |

- Chip `#JadiAtletModern` yang dulu di atas headline **dihapus** — hashtag sekarang ada di dalam headline, jadi dobel.
- Sub paragraf lama ("Public speaking & bahasa Inggris khusus atlet…") **dihapus** — diganti 3 chip sesuai spec.
- Ukuran h1 diturunkan 8xl → 7xl karena headline baru ±2× lebih panjang (3 baris tetap muat).
- Stiker "SPEAK LOUD!" dan pill "2.175+ atlet" dipertahankan (flair brand, bukan latar).

### 40.2 Banner lainnya (section About)

| Bagian | Copy klien |
|---|---|
| Headline | "Kenapa Sports Communication Penting?" |
| Paragraf 1 | "Karena Sports Communication mengajarkan keterampilan fundamental bagi **anak dan calon atlet** modern untuk berkembang dan naik ke level berikutnya." |
| Paragraf 2 | "Melalui **Public Speaking** dan **Bahasa Inggris** khusus atlet, anak akan belajar berkomunikasi dengan percaya diri, menghadapi media, berbicara dengan pelatih asing, wasit, serta ofisial, sehingga dapat membuka peluang lebih besar di dunia olahraga." |

- Eyebrow jadi "Tentang Sports Communication"; heading = pertanyaan klien.
- Perhatikan perubahan nada: klien memakai "**anak dan calon atlet**" (bukan "atlet") — audiens meluas. Jangan "perbaiki" kembali ke copy lama.
- Chip lama About ("Fun Communication for Active Kids" dst.) **dihapus** — tidak ada di copy klien dan konsepnya sudah dipindah ke hero.

### 40.3 Verifikasi lokal

`audit-frames` 0 overflow + 0 console error · `audit-clip` **0 overflow / 0 covered** · `verify-ai` 17 flag (dekoratif; tambahannya "Modern" → "#JadiAtletModern", kategori sama: teks display besar oranye) · `verify-dock` / `verify-wa-green` / `verify-testimoni` / `verify-admin-ui` **SEMUA PASS** · pw-vision 22/22, 0 overflow, 0 small target · vision desktop + mobile.

---

## 41. "Copy AI banget, ga suka background gambar, orange bukan coklat" (4 Nov 2026)

Tiga keluhan klien sekaligus. Semua dikerjakan di lokal.

### 41.1 Warna: semua oranye "coklat" dimatikan

Akar masalahnya BUKAN `--color-brand` (#ff8000 — itu terang), tapi dua token turunannya yang dipakai buat teks:

| Token | Lama | Dipakai di | Kenapa terbaca coklat |
|---|---|---|---|
| `--color-brand-dark` | `#d96a00` | heading display ("AKADEMI & MITRA", "Bicara?", harga) | hue 30 + L 43 = cokelat |
| `--color-brand-text` | `#ad5000` | eyebrow, link, ✓, label kecil | lebih gelap lagi |

Perubahan:
- **Semua `text-brand-dark` → `text-brand`** (#ff8000, terang) — 7 pemakaian heading.
- **Semua `text-brand-text` → `text-ink`** — 40+ pemakaian teks kecil (24 file). Teks kecil oranye memang tidak akan pernah lolos kontras, jadi teks kecil = tinta.
- `--color-brand-dark` nilainya jadi `#e87300` dan **hanya** dipakai untuk hover (tetap oranye terang, bukan coklat).
- Token `--color-brand-text` dihapus dari `@theme` dan dari `:root` template single post; `var(--brand-text)` → `var(--ink)`; `.prose-custom a` → tinta; label dock aktif → tinta.
- Heading grup FAQ (24px, teks fungsional) → tinta + strip oranye `w-9` (bukan teks oranye 2.5:1 yang susah dibaca).

Sisa teks oranye di seluruh situs sekarang hanya **heading display besar** ("#JadiAtletModern" 72px, "Bicara?" 72px) — pilihan estetika klien yang sudah 4× ditegaskan. Flag `verify-ai`: 23 (8 non-dekoratif = 2 heading display besar itu, diulang di 3 halaman yang sama karena CtaBand global).

### 41.2 Foto sebagai background dihapus total

Yang dikeluhkan bukan foto dalam bingkai (itu konten), tapi **foto yang dipudarkan di belakang teks** (`opacity-25..35`). Semuanya dihapus:

| Halaman | Foto latar yang dihapus |
|---|---|
| Detail program (`program/[slug]`) | `session-*.jpg` opacity-30 |
| Detail workshop (`workshop/[slug]`) | `workshop-*.jpg` opacity-30 |
| Tentang | `session-online.jpg` opacity-35 |
| Daftar berita | `workshop-crowd.jpg` opacity-25 |
| Banner Membership | `program-elite.jpg` tekstur opacity-15 → kartu gelap rata |

Hero halaman detail sekarang bidang rata + 1 art tipis (`art-pitch`). Foto tetap dipakai di dalam bingkai: kartu About, galeri workshop, testimoni, cover berita, CTA, cover post.

### 41.3 Copy: nada template AI dibuang

Kata-kata yang jadi ciri tulisan AI di situs ini: superlatif kosong ("Progres paling cepat"), frasa "naik ke level berikutnya" di luar konteks, pola kalimat paralel di tiap kartu, dan kata "buat" yang diulang di semua heading. Semua diganti kalimat konkret dengan fakta yang benar:

| Sebelum | Sesudah |
|---|---|
| "Progres paling cepat. Coach khusus menemani atlet dari nol sampai siap wawancara media." | "Satu atlet, satu coach. Latihan dari nol sampai berani wawancara media dan tampil di depan kamera." |
| "Cocok untuk rekan setim atau atlet lintas cabang. Belajar bareng, harga lebih ringan." | "Kelas kecil 6–10 atlet lintas cabang. Latihan bicara bareng, biaya per orang jadi lebih ringan." |
| "Semua benefit Elite, plus eksposur profil atletmu di portal berita nasional." | "Semua sesi Elite, plus profil atletmu diberitakan di portal berita nasional." |
| "Benefit berkelanjutan buat atlet, daftar early access dulu biar dapat slot lebih awal." | "Satu langganan untuk sesi rutin, tanpa perlu booking ulang. Daftar early access buat dapat slot di batch pertama." |
| "Mulai dari chat singkat. Ceritakan atlet & akademimu, kami bantu susun programnya." | "Ceritakan dulu atlet atau akademimu, nanti kami bantu arahkan ke program yang pas." |
| Heading "Private 1-on-1 buat naik level" | "Private 1-on-1 & Small Group" (isi aslinya) |
| Heading "Workshop buat atlet binaanmu" | "Workshop untuk akademi & klub" |
| "Level up: simulasi interview bersama 3+ assessor…" | "Simulasi interview di depan 3+ assessor, tiap atlet dapat assessment, e-certificate, dan e-book." |
| FAQ "Keterampilan fundamental buat atlet modern…" | "Kemampuan bicara di depan orang dan media, plus bahasa Inggris khusus olahraga. Latihannya nyata: wawancara media, konferensi pers, sampai bicara dengan pelatih asing, wasit, dan ofisial." |

Copy klien (hero, chips, "Kenapa Sports Communication Penting?") **tidak disentuh**.

### 41.4 Verifikasi lokal (semua PASS)

`audit-frames` 0 overflow + 0 console error · `audit-clip` **0 overflow / 0 covered** · `verify-ai` 23 flag = 15 dekoratif + 8 (2 heading display besar × 4 halaman) · `verify-dock` / `verify-wa-green` / `verify-testimoni` / `verify-admin-ui` **SEMUA PASS** · pw-vision 22/22, 0 overflow, 0 small target · vision desktop + mobile.

---

## 42. Art CSS diganti foto tipis yang melebur + jarak hero (4 Nov 2026)

Permintaan klien: *"art di background di setiap section bisa ga di ganti image background sedikit tapi blend dengan section dan di hero text mepet dengan header menu, verif visual di mobile pastikan rapih"*.

### 42.1 Komponen `SectionImage.astro` (baru)

Menggantikan sisa art CSS dengan **foto asli klien** yang dipasang full-bleed:

- **opacity sangat rendah** (5–9%, default 8%) via `--sec-img-o`
- **mask** dari preset `pos`: `b` (bawah, linear) / `bl|br|tr|tl` (radial 75% di sudut tsb)
- jadi foto muncul di satu sisi lalu **hilang ke warna latar** — "blend", bukan foto yang dipudarkan di belakang teks (itu beda, dan sudah dihapus di §41)

CSS: `.sec-img` di `global.css` (absolute inset-0, object-cover, pointer-events-none).
Konten section harus `relative` supaya berada di atas foto (elemen absolute menggambar di atas konten statis).

### 42.2 Pemetaan section → foto

| Section | Foto | pos | op |
|---|---|---|---|
| Hero | docs-6.jpg | tr | .07 |
| Tentang (home) | docs-2.jpg | tr | .07 |
| Program (krem) | session-smallgroup.jpg | br | .07 |
| Workshop | workshop-live-2.jpg | bl | .07 |
| Testimoni | docs-5.jpg | br | .06 |
| Coach | interview-zone.jpg | tr | .06 |
| Kabar terbaru | docs-7.jpg | bl | .06 |
| FAQ | session-online.jpg | tr | .06 |
| CTA (krem) | workshop-crowd.jpg | bl | .09 |
| Mitra | docs-4.jpg | tl | .05 |
| Hero detail program / workshop | heroFoto masing-masing | tr | .09 |
| Hero tentang / daftar berita | session-online / workshop-crowd | br / tr | .07 |
| Kartu Membership (gelap) | session-premium.jpg | tr | .10 |

Art CSS yang tersisa dari §38 kini **nol**: ghost-word "Speak"/"Coach", SportArt stadium/net, art-balls, art-track, pat-halftone, ProgramBackdrop — semuanya diganti foto tipis. `SportArt.astro` dan `ProgramBackdrop.astro` tidak lagi dipakai di mana pun (file boleh dihapus nanti).

### 42.3 Hero: teks tidak lagi mepet dengan header

Hero `pt-14` (56px — persis tinggi header) → **`pt-24 pb-24 sm:pt-28`**. Karena `min-h-dvh` + `justify-center`, konten yang tingginya melebihi viewport tidak pernah terpotong, tapi `pt` lama membuat headline menempel di bawah header (jarak ~0px). Sekarang jarak desktop ±55px, mobile ±40px.

### 42.4 Jebakan saat pemasangan

1. **Import hilang saat mengganti import lama**: mengganti baris `import ProgramBackdrop` dengan `import SectionImage` membuat `SportArt` (yang masih dipakai di banner Membership) jadi tidak terdefinisi → build error "SectionImage/SportArt is not defined" di 3 halaman. Pelajaran: selalu `rg` pemakaian komponen sebelum mengganti importnya.
2. **Replace multi-baris vs satu baris**: `ringkasan:` di workshops.ts ada yang multi-baris, ada yang satu baris → replace dengan string ber-indent tertentu gagal diam-diam. Solusi: assert + cek `rg` setelah replace.
3. Mask di inline `style` aman (bukan background-image), jadi tidak menambah flag gradien di `verify-ai`.

### 42.5 Verifikasi lokal (semua PASS)

`audit-frames` 0 overflow + 0 console error (desktop + mobile) · `audit-clip` **0 overflow / 0 covered** · `verify-ai` 20 flag = 12 dekoratif + 8 (2 heading display besar × 4 halaman yang memakai CtaBand) · `verify-home` 0 error · `verify-dock` / `verify-wa-green` / `verify-testimoni` / `verify-admin-ui` **SEMUA PASS** · pw-vision 22/22, 0 overflow, 0 small target · **vision mobile 390×844 frame-by-frame** (hero, scoreboard, tentang, program, workshop, testimoni, CTA, mitra) + desktop.

---

## 43. Aset section digenerate MiniMax + palet dirapatkan + eyebrow serif (4 Nov 2026)

Permintaan klien: *"generate asset2 pendukung pake minimax tapi jangan terlalu over, setiap section… feels premium, tidak over, warna font copywriting bukan terlihat seperti ai, mobile dan desktop harus rapih"*.

### 43.1 Aset section dari MiniMax (`public/media/sections/*.jpg`)

12 aset dibuat pakai `image-01`, disaring lewat **contact sheet** (montage 4×3) supaya tidak perluAssess 12 file satu per satu.

**Pelajaran penting: MiniMax image-01 menambahkan gloss/shadow/3D** — justru yang disliked klien ("terlihat AI"). Prompt ronde 1 ("minimal flat background texture…") masih menghasilkan benda 3D (kertas bertumpuk, bar oranye glossy, balon). Ronde 2 dengan prompt lebih ketat berhasil:

```
[NAME] pure 2D technical line drawing printed on plain warm cream paper.
Uniform 2 pixel thin charcoal strokes plus one or two bright orange accents: …
Absolutely flat: no shadow, no reflection, no gradient, no glow, no 3D, no
perspective, no realistic object, no texture, no noise, no text, no letters,
no numbers, no people. 16:9 wide.
```

Aset yang dipakai (semua 8–14 KB setelah resize 1600×900 + mozjpeg q72):

| File | Motif | Dipakai di | pos | op |
|---|---|---|---|---|
| `hero.jpg` | garis lintasan lari | Hero | tr | .14 |
| `tentang.jpg` | lingkaran + titik | Tentang (home + /tentang) | tr/br | .13 |
| `program.jpg` | lingkaran + garis | Program + hero detail | br/tr | .13 |
| `workshop.jpg` | kotak + tick oranye | Workshop | bl | .13 |
| `testimoni.jpg` | lengkung kutip | Testimoni | br | .13 |
| `coach.jpg` | halftone titik | Coach | tr | .12 |
| `blog.jpg` | halftone titik | Kabar terbaru | bl | .12 |
| `faq.jpg` | garis + titik oranye | FAQ | tr | .13 |
| `cta.jpg` | panah ke atas | CTA | bl | .14 |
| `mitra.jpg` | grid kotak + lingkaran | Mitra | tl | .12 |

Opacity dinaikkan dari 5–9% (foto client) ke 12–14% (garis tipis) supaya motifnya **terlihat** tanpabuat ramai. Kartu Membership (gelap) tetap pakai foto client asli (session-premium.jpg) — aset krem akan jadi blok terang di atas gelap.

### 43.2 Palet dirapatkan

Sisa aksen warna yang bikin tampilan terasa "template": emas (#ffc32e) dan merah (#c8232b). Keduanya kini **tidak dipakai dekoratif**:

- emas → oranye/tinta di: badge MEDIA NASIONAL (jadi `bg-ink text-brand`), ikon bulat, pill BONUS, titik timeline, border tombol, badge workshop, kartu 2.175+, hover kartu berita, bintang testimoni, focus login, dan `.pkg-flag` di template single post.
- merah → oranye di: titik eyebrow, stiker "GO!", diamond art.
- Yang **dipertahankan**: chip 3 kategori berita (emas/oranye/merah — semantik) dan hijau WhatsApp (kanal konversi).

Palet akhir situs: **putih/krem + arang + oranye #ff8000**, plus hijau WA. Tidak ada warna aksen lain.

### 43.3 Eyebrow jadi serif editorial

"Huruf sans kapital kecil + tracking lebar" adalah ciri template AI. Semua eyebrow (7 file) diganti:

```
eyebrow font-serif text-[15px] italic leading-tight text-ink/80
```

- Font: **Instrument Serif** (`@fontsource/instrument-serif`, 400 + italic) — self-hosted, token baru `--font-serif`.
- `.eyebrow::before` (titik) mengecil jadi 6px dan berubah dari merah → oranye.

### 43.4 Jebakan: `npm i` memangkas `playwright-core`

`npm i @fontsource/instrument-serif` menghapus `playwright-core` (dipakai skrip audit tapi tidak terdaftar di package.json) → semua skrip audit langsung `ERR_MODULE_NOT_FOUND`. Perbaikan: `npm i -D playwright-core@1.61.0` (sekarang terdaftar di devDependencies, jadi aman).

### 43.5 Verifikasi lokal (semua PASS)

`audit-frames` 0 overflow + 0 console error (desktop + mobile) · `audit-clip` **0 overflow / 0 covered** · `verify-ai` 20 flag (12 dekoratif + 8 = 2 heading display × 4 halaman) · `verify-home` 0 error · `verify-dock` / `verify-wa-green` / `verify-testimoni` / `verify-admin-ui` **SEMUA PASS** · pw-vision 22/22, 0 overflow, 0 small target · vision desktop 1440×900 + mobile 390×844 (hero, tentang, program, workshop, testimoni, CTA, mitra).

### 43.6 Revisi "mana ga berubah": aset dibuat transparan + diposisikan ulang

Klien: *"mana ga berubah"*. Dua sebab:

1. **Aset hasil generate masih berupa kanvas krem** — di opacity 12–14% garisnya tidak kelihatan. Fix: **difference matte** (bandingkan piksel dengan versi blur σ28, selisih → alpha) → latar krem hilang, tinggal line art transparan (webp + alpha). Setelah itu opacity bisa naik ke 0.45–0.62 dan motifnya **kelihatan jelas** tanpa menutup section.
2. **Motif ketutupan kartu putih.** Section yang penuh kartu (program, workshop, coach, blog) menutupi 80% area — motif yang diletakkan di sudut bawah tidak terlihat. Fix: motif dipindah ke **sudut atas, di belakang heading** (heading Anton tebal tetap terbaca di atas garis tipis — gaya watermark editorial). Pemosisian ulang dilakukan otomatis: **alpha-bbox** (cari kotak berisi piksel non-transparan) → crop → scale ~42% lebar → composite ke sudut sesuai `pos` mask. Jadi mask dan motif **tidak pernah tidak cocok** lagi.

Eyebrow dinaikkan ke 17px + `text-ink` penuh (dari ink/80).

> Pelajaran: asset yang "hampir tak terlihat" itu gagal, bukan berhasil. Kalau menambah latar tipis, langsung **verifikasi di screenshot** apakah dia kelihatan — jangan hanya cek kode.

### 43.7 Revisi: papan LED dihapus + benefit workshop masuk toggle

Klien: papan LED *"jelek sekali, gimana ya biar ga ai banget"* + kartu workshop *"detailnya di toggle saja buat yang premium"*.

1. **Papan LED seven-segment dihapus total** (StatsBar + StatsList ditulis ulang). Penggantinya: tiga angka besar tinta (Counter, tetap menghitung naik) + strip oranye kecil + label tracked, dipisah garis rambut, di atas putih dengan border-y halus. Tanpa dot grid, tanpa corner bracket, tanpa kepala papan. `LedNumber.svelte` dihapus.
   > Pelajaran: seven-segment + dot grid + corner bracket adalah "stadium UI kit" yang juga jadi ciri template AI. Statistik premium = tipografi besar + whitespace, bukan chrome.

2. **Benefit workshop masuk `<details>` toggle**: ringkasan "Lihat detail program +" (rotate 45° saat terbuka), daftar ✓ bergaris kiri oranye. Kartu jadi rampat; chip "N benefit" di header tetap memberi tahu isinya. `group` + `group-open:rotate-45`.

Verifikasi: audit-frames 0 overflow + 0 console error (mobile 17 — 1 lebih sedikit), audit-clip 0 overflow/0 covered, verify-ai 20 flag (heading display saja), dock/wa-green/testimoni/admin-ui SEMUA PASS, pw-vision 22/22 0 bug. Vision: statistik di atas putih + toggle terbuka di mobile.

### 43.8 Kartu workshop hanya header + toggle semua; teks di atas oranye jadi PUTIH; oranye dicerahkan

Klien: *"Workshop Starter / 01 / 1 sesi · 90 menit / 5 benefit — ini yang tampil hanya ini saja, ada detail toggle untuk buka semuanya bukan pindah halaman"*, *"kalau background orange tulisan harus putih jangan hitam"*, *"cerahkan lagi oranye nya"*.

1. **Kartu workshop**: hanya nama + nomor + chip (durasi, N benefit) yang tampil. **Harga, catatan, ringkasan, dan daftar benefit semuanya masuk satu toggle** "Lihat detail & harga". Link "Detail →" (pindah halaman) **dihapus** — yang tersisa CTA "Booking Sekarang ↗" (WA, tetap terlihat). min-h penyejajar kartu dihapus; tombol `mt-auto` supaya menempel di bawah kartu.

2. **Teks di atas bidang oranye → PUTIH** (permintaan eksplisit, 2×): sweep 17 file — `bg-brand text-ink` → `text-white`, `hover:bg-brand` + `hover:text-ink` → `hover:text-white`, `'bg-brand text-ink'` (class:list JS) → `text-white`, `.hl-brand` → putih. Chip kategori Kolaborasi (categories.ts) → teks putih.

3. **Oranye dicerahkan**: `--color-brand` #ff8000 → **#ff8c00** (hue 33), hover `#ef7e00`, pola hardcoded `rgb(255 128 0)` → `rgb(255 140 0)`, template single post & chip Kolaborasi ikut.

**Trade-off kontras (putih di atas #ff8c00 = 2.33:1)**: gagal WCAG 4.5:1 — ini keputusan estetika klien yang diminta eksplisit dua kali. `verify-ai` kini 134 flag yang seluruhnya pola ini. Teks panjang/fungsional (harga, isi, FAQ) tetap tinta di atas putih ✓.

Verifikasi: audit-frames 0 overflow + 0 console error, verify-home 0 error, dock/testimoni SEMUA PASS.

### 43.9 Eyebrow serif dihapus total — "jangan ada huruf sambung, font harus nyaming"

Klien: *"Tentang Sports Communication hapus ini dan jangan ada huruf sambung, font harus nyaming"*. Instrument Serif *italic* dibaca klien sebagai **huruf sambung** (cursive) — eksperimen editorial gagal.

- **16 eyebrow serif italic dihapus** (About "Tentang Sports Communication", FAQ, berita, tentang, program detail ×5, workshop detail ×4). Section kini langsung dibuka heading Anton.
- **3 dipertahankan tapi ganti Anton** (fungsional): label bulan journey (`display text-sm text-brand`) dan heading kolom footer ("Jelajahi"/"Kontak" → `display text-base text-ink`).
- **Instrument Serif dicabut total**: import di Base.astro, token `--font-serif`, dan package-nya dihapus dari package.json.
- `.eyebrow` CSS kini tak berpemakai (sisa mati, boleh dihapus).
- Identitas font akhir: **Anton** (display, nyaming) + **Plus Jakarta Sans** (teks). Tidak ada lagi font ketiga.

### 43.10 Kartu "Slot terbatas" dihapus — banner Membership jadi satu blok bersih

Klien: *"hapus bagian ini dan card buat lebih premium tapi jangan terlihat seperti ai"* (menunjuk vip-card EARLY ACCESS/SLOT TERBATAS/Batch 01).

- vip-card (corner bracket + Early Access + Slot terbatas + Batch 01 + vip-cta) **dihapus semua**.
- Banner jadi satu blok: chip COMING SOON, heading MEMBERSHIP PROGRAM (Anton 4xl/5xl), satu paragraf, CTA oranye teks putih, dan **benefit jadi 4 tile ber-border** di kolom kanan (2×2).
- Tanpa SectionImage tambahan, tanpa chrome. `.vip-card*`/`.vip-rule`/`.vip-cta` kini tak berpemakai (CSS boleh dibersihkan nanti).

### 43.11 "Warna font semuanya abu-abu, tulisan kecil kurang kelihatan"

Klien: *"kurang premium dan warna font ini semuanya abu2 ya kalau tulisan kecil kurang kelihatan, kamu pikirkan warnanya harus terlihat"*.

Akar: semua teks sekunder memakai **alpha pudar** (`text-ink/60..85`, `text-white/55..90`, rgba 0.7 di template/dock) → kelihatan abu-abu.

Fix: **sweep global** (27 file, kecuali admin) — semua `text-ink/NN` & `text-white/NN` (NN ≤ 90) → **penuh**; rgba template/dock 0.7–0.78 → 0.95. Hierarki kini dari **ukuran & ketebalan**, bukan opacity. Placeholder input tetap pudar (memang seharusnya).

> Pelajaran: alpha-wash teks = ciri desain AI. Print premium memakai kontras penuh; hierarki dari tipografi.

Verifikasi: audit-frames 0 overflow + 0 console error (desktop + mobile), audit-clip 0 overflow/0 covered (1855 clipped false-positive).

### 43.12 Aset section jadi foto asli klien (tema nyambung) + Membership jadi card putih

MiniMax **limit tercapai** ("Token Plan usage limit has reached 2067") — generate baru tidak mungkin sampai klien upgrade. Solusi: pakai **foto asli klien** di `public/media/` yang temanya memang nyambung per section (lebih bagus: real photography = bukan AI):

| Section | Foto |
|---|---|
| Hero | hero-athletes.jpg |
| Tentang | mic-kid.jpg |
| Program | session-elite.jpg |
| Workshop | workshop-crowd.jpg |
| Testimoni | interview-zone.jpg |
| Coach | docs-1.jpg |
| Kabar terbaru | workshop-live.jpg |
| FAQ | session-online.jpg |
| CTA | workshop-live-2.jpg |
| Mitra | docs-3.jpg |
| Detail program/workshop | session-premium / workshop-crowd |
| Tentang & Berita hero | session-online / workshop-crowd |

Opacity 0.12–0.14 + mask tetap (blend seperti §43.6).

**Membership Program jadi card putih**: border ink/10 + shadow, chip COMING SOON oranye teks putih, heading tinta, CTA oranye teks putih, foto atlet berpiala (hero-athletes.jpg) di bingkai kanan dengan chip "SPORT · COMMUNICATION", dan 4 benefit jadi strip 4 kolom ber-border di bawah. Kartu gelap #121316 dihapus.

Jebakan: replace blok membuat satu `</div>` orphan → build error; hitung ulang penutup div.

### 43.13 Foto section di opacity rendah = NODA (revisi)

Klien: *"jelek sekaliii"*. Penyebab: foto asli klien dipakai sebagai background section di opacity 13% → karena foto dicekup/diperkecil lalu dipudarkan, hasilnya **noda blur besar** (bayang laptop + watermark terbaca di section Program). Bukan premium.

Fix: background section **dikembalikan ke line art** (aset MiniMax, tajam, transparan — §43.6), foto asli tetap dipakai di tempat yang terbaca sebagai foto (bingkai Membership, kartu About, galeri, cover berita, hero).

Bingkai foto Membership: `object-contain object-bottom` di dasar krem (aset `hero-athletes.jpg` punya area kosong di atas, jadi `object-cover`olo membuat bingkai kosong).

### 43.14 Membership = kartu dengan bahasa desain kartu program

Permintaan klien: *"bagian Membership Program ini juga seperti card design dong premium jangan over harus tema sport"* —含义: bagian itu harus berbentuk **kartu** seperti kartu program lain, bukan banner khusus.

Implementasi: `<article class="spot prog-card group relative mt-6 flex flex-col overflow-hidden rounded-3xl">` dengan:
- header foto banner `aspect-21/9` (pas untuk aset atlet 910×405) + chip "COMING SOON" oranye + caption "MEMBERSHIP · SESI RUTIN";
- isi `grid lg:grid-cols-[1.05fr_0.95fr]`: kiri heading MEMBERSHIP PROGRAM + nomor 04 + deskripsi + CTA oranye teks putih; kanan 4 benefit ✓ (2×2).

Struktur ini identik dengan kartu program (foto atas + chip + caption + isi + tombol oranye) → konsisten, premium, tidak over.

### 43.15 Background section: foto CLIENT dengan teknik multiply (bukan opacity)

Klien: *"maksud sy ini kamu imagenya generate yang bener paham ga? kok setiap section ga pake image background yang blend agar terasa premium"*.

**Masalah sebelumnya**: foto sebagai background dengan opacity rendah → **noda abu-abu** (foto jadi kabut, bukan Merge).technique yang benar: **`mix-blend-mode: multiply`** — foto diperlakukan seperti tinta di atas kertas: bagian gelap memberi tekstur, bagian terang menyatu dengan warna section. Tidak pernah jadi noda abu-abu, dan opacity bisa dinaikkan (0.26–0.3) tanpa merusak keterbacaan teks.

`SectionImage.astro` sekarang punya prop `blend` (default `multiply`) + `.sec-img` default `mix-blend-mode: multiply`. Dipakai di 14 section dengan foto asli klien (hero-athletes, mic-kid, session-elite, workshop-crowd, interview-zone, docs-1, workshop-live, session-online, workshop-live-2, docs-3, session-premium).

**MiniMax masih terkunci** ("2067 Token Plan usage limit has been reached") — generate baru butuh upgrade plan. Setelah kuota tersedia, tinggal ganti `src` dengan aset bertema sport per section (piala / mic / laptop / interview) tanpa mengubah teknik blend-nya.

### 43.16 Membership: art "membership pass" oranye, tanpa foto, tanpa "early access"

Permintaan klien: ganti foto atlet dengan *card premium*, buang "early access", dan buat art yang bagus di desktop & mobile.

- Foto `hero-athletes.jpg` **dihapus** dari kartu Membership.
- Diganti **art "membership pass"**: bidang oranye (`bg-brand`) + `pat-grid` tinta 45% + `art-pitch` 30%, isi: label "PROSPECT ASIA" (ink), angka "04" Anton besar (ink), label "MEMBERSHIP PASS" (ink). Flat, tanpa foto, tanpa efek AI.
- Copy: "Daftar **early access**…" → "Daftar **duluan**…"; label program di link WA `Membership (early access)` → `Membership Program`; tombol → "Daftar Duluan ↗".
- Struktur kartu: grid 2 kolom (kiri chip+heading+deskripsi+CTA, kanan art pass) + strip 4 benefit di bawah.

### 43.17 Kartu foto Coach disembunyikan di mobile + dock jadi melayang premium

Permintaan klien: img `mic-kid.jpg` (alt "Atlet muda siap berbicara di depan mikrofon") **hide di mobile**; dock mobile "sebelumnya sedikit transparant tapi tetap jelas… feel premium".

- Foto tersebut ada di **kartu Coach** (`CoachesSection.astro`, `<aside>` 300px di samping rail), bukan di About — penargetan mengikuti alt text yang klien kutip.
- `<aside>` → `hidden lg:block` → di mobile rail coach saja (foto tidak lagi menduplikasi foto About).
- Dock mobile: `bg-paper` (solid) → **`bg-paper/90` + `backdrop-blur-md backdrop-saturate-150`** + bayangan lebih lembut → terasa melayang & premium, teks tetap jelas. `src/lib/dock.ts` (`DOCK_CSS`, dipakai template single post) disamakan: `rgba(255,255,255,.9)` + `blur(12px) saturate(150%)`.
- Catatan: `backdrop-filter` dipakai lagi — ini **permintaan klien**, bukan gaya "flat" §30.4.

Terukur: dock mobile `background: oklab(... / 0.9)` + `backdrop-filter: blur(12px) saturate(1.5)`; aside coach `display: none` di 390px.

### 43.18 Blur dock naik + Membership jadi kartu ringkas tanpa tombol

Permintaan klien: *"blur naikan"*, *"Membership Program… ini kecil saja berupa card jangan terlalu panjang dan button hilangkan hanya comingsoon"*.

- Dock: `backdrop-blur-md` (12px) → **`backdrop-blur-xl` (24px)** + `saturate-175`; `DOCK_CSS` di `lib/dock.ts` disamakan.
- Membership: paragraf panjang diganti **kartu kecil** (pill-card `border-ink/10 bg-paper-deep`, 13px): "● Sesi rutin, tanpa booking ulang". **Tombol "Daftar Duluan" dihapus** (link WA `data-wa-cta="membership"` ikut hilang), menyisakan COMING SOON + art membership pass + strip benefit.

### 43.19 Membership = satu objek "pass" oranye (semua teks ditata seperti tiket)

Permintaan: *"Coming Soon / Membership Program / Sesi rutin, tanpa booking ulang — ini saja textnya pikirkan designnya"*. Tanpa tombol & tanpa foto, teksnya sendiri yang jadi desainnya.

Final: **satu kartu pass oranye** (bukan kartu putih + panel gambar terpisah):
- notch tiket di tepi kiri & kanan (kelas `.ticket` + `--notch-bg` = warna section);
- header: "PROSPECT ASIA" (kiri) · "MEMBERSHIP PASS" (kanan), 10px tracked tinta 70%;
- chip "● COMING SOON" **kebalik**: arang bg + teks putih + titik oranye;
- heading Anton "MEMBERSHIP PROGRAM" tinta + sub-teks "Sesi rutin, tanpa booking ulang";
- garis tinta 20% + 4 benefit (✓ tinta, bukan oranye — di atas oranye oranye tidak terlihat);
- watermark angka "04" tinta 15% di kanan bawah.

### 43.20 Benefit Membership dihapus + animasi interaktif halus

Permintaan klien: hapus daftar 4 benefit, *"pake animasi yang interaktif sedikit agar feel premium keluar"*.

- 4 benefit (Sesi rutin tanpa ribet booking ulang / Materi & e-library eksklusif atlet / Priority support dari coach / Community atlet lintas cabang) **dihapus** beserta garis pemisah. Kartu kini: PROSPECT ASIA · MEMBERSHIP PASS → chip COMING SOON → MEMBERSHIP PROGRAM → "Sesi rutin, tanpa booking ulang" → watermark 04.
- Interaksi premium (ringan, bukan ramai):
  - hover: kartu naik 1px + bayangan menguat (0.5s ease);
  - `pat-grid` di dalam pass **drift sangat lambat** 28s (seamless, 26px) + terang saat hover;
  - watermark "04" naik 2px & makin tegas saat hover (0.7s);
  - titik chip COMING SOON berdenyut halus (`pulse-dot`, 2.6s, scale .82 di tengah).

### 43.21 Aturan warna teks di atas latar gelap: selalu putih

Kritik klien: *"kelemahan km warna font nyatu di background gelap, kalau [background gelap] harusnya putih fontnya, tapi kamu variasikan agar look premium"*.

Audit DOM (7 halaman, walking ancestor mencari background solid, hitung rasio WCAG) menemukan **6 tempat background gelap (`bg-ink`) membawa teks non-putih**:

| Tempat | Lama | Baru |
|---|---|---|
| Badge "★ MEDIA NASIONAL" (kartu program + detail program) | `bg-ink text-brand` | `bg-ink text-white` |
| Pill "HEMAT 60%" | `bg-ink text-brand` | `bg-ink text-white` |
| Ikon bulat (program + workshop detail) | `bg-ink text-brand` | `bg-ink text-white` |
| Badge workshop detail | `bg-ink text-brand` | `bg-ink text-white` |
| `.pkg-flag` di template single post | `color: var(--brand)` | `color: #ffffff` |

Aturan baru yang dipakai: **di atas bidang gelap → teks putih polos** (oranye/emas/merah tidak dipakai sebagai warna teks di atas arang). Yang tetap oranye hanya **latar**-nya. Verifikasi audit: 0 teks non-putih di atas latar gelap di 7 halaman.

### 43.22 Kartu workshop diberi pita kepala tiket

Kritik klien: *"ini masih kurang designnya"* (kartu workshop). Penyebabnya: kartu program punya header foto, kartu workshop polos putih → dua kartu berbeda级别 dalam satu grid.

Fix: kartu workshop dapat **pita kepala arang** (sama dengan kelas `.ticket` di situs) berisi durasi + nomor besar, **teks putih di atas arang** (sesuai aturan §43.21):

```
┌ 1 SESI · 90 MENIT            01 ┐  ← pita arang, teks putih
│ WORKSHOP STARTER                 │
│ 5 benefit · untuk akademi & klub │
│ ─────────────────────────────────│
│ Lihat detail & harga           + │
│ [     Booking Sekarang ↗      ] │
└───────────────────────────────────┘
```

Tambahan: chip "1 sesi · 90 menit" + chip oranye "5 benefit" lama diganti pita kepala + satu baris meta plain (lebih tenang); toggle jadi baris teks dengan garis rambut di atas (bukan kotak); CTA full-width di dasar kartu (`mt-auto pt-5`).

---

## 38. Mobile-first: homepage ringkas & fokus ke Program (5 Nov 2026)

Permintaan: *"mobile version harus compact tapi rapih, fokus untuk user, tidak terlalu banyak scroll, dan langsung order / berhenti di Private 1-on-1 & Small Group karena section ini yang harus menjual"*.

**Backup dulu** (permintaan klien): branch `backup/pre-mobile-compact` + tag `pre-mobile-compact-20261104` (commit `e1212a4`) + snapshot `~/backups/myprospect-20261104-pre-mobile.tar.gz`. Revert: `git reset --hard backup/pre-mobile-compact`.

### 38.1 Yang dikerjakan (L1–L4 + L6)

| # | Perubahan | Efek |
|---|---|---|
| L1 | Hero mobile: `min-h-[72svh]` (bukan dvh), foto atlet `max-h-28 object-contain`, sembunyikan "SCROLL", headline 8.5vw, chip lebih rapat, padding ↓ | 844 → **681px** |
| L2 | **Program section naik ke atas**: urutan mobile = Hero → Ticker → Stats → **Program** → About → Workshop → … (About dipindah ke bawah Program) | Program di y=896 = **1,06 layar** (dari 2,2) |
| L3 | Kartu program: ringkasan + benefit masuk `<details>` "Lihat detail program" (pola kartu workshop); harga + tombol **selalu terlihat** | kartu 404px (dari ~700) |
| L4 | Foto About disembunyikan di mobile (sudah ada foto serupa di Coach) | About 764 → ~430px |
| L6 | Padding section mobile `py-14` → `py-10` (desktop tetap `py-14`); galeri Workshop `aspect-16/9` di mobile | −620px |

### 38.2 Angka

| | Sebelum | Sesudah |
|---|---|---|
| Total scroll mobile | 11.340px (13,4 layar) | **10.010px (11,9 layar)** |
| Section Program mulai | y=1.823 (2,2 layar) | **y=896 (1,06 layar)** |
| Harga + tombol kartu pertama terlihat | – | **y=1.151 (1,36 layar)** |

### 38.3 Yang MASIH perlu keputusan klien

1. Kartu program/workshop mobile: **A)** tetap ditumpuk (semua harga terlihat) atau **B)** rail swipe (1 kartu, paling hemat)?
2. Section bawah (Blog/Mitra/FAQ ≈ 1.900px): **A)** tetap terbuka atau **B)** jadi toggle tertutup?
3. Sisa scroll 11,9 layar → target ~8 layar butuh combination di atas (B+B ≈ −3.800px).

### 38.4 Verifikasi

`audit-frames` 0 overflow + 0 console error (desktop + mobile) · build 12 halaman bersih · vision mobile 390×844: ticker → stats → heading "PRIVATE 1-ON-1 & SMALL GROUP" → kartu pertama (nama + harga) langsung terlihat dalam 1,4 layar ✓

### 38.5 Polish: background About dihapus, art tiket dianimasikan, scroll hint hidup, marquee dilambat

- **Background image section About dihapus** (SectionImage mic-kid) — section itu sekarang murni teks + kartu foto (foto sudah disembunyikan di mobile, §38.1 L4).
- **Art tiket Membership** diberi gerak premium: `.pass-lines` (garis lapangan bergeser 44s), `.pass-num` (angka 04 melayang 7s), grid drift diperlambat 28s → 36s, chip "COMING SOON" tetap berdenyut, hover: kartu naik + grid terang + 04 makin tegas.
- **Scroll hint dianimasikan**: titik turun-naik halus (`scroll-dot` 2.2s, opacity .35→1). Sebelumnya sengaja diam (§30.4) — sekarang diminta klien.
- **Teks hero "Isi formulir 30 detik · admin balas di jam kerja" dihapus.**
- **Marquee dilambat**: ticker cabang olahraga 34s → **62s**; default `.rail` 46s → 58s, rail coach/blog 40s → 52s.

Catatan jebakan: `SectionImage` di About dihapus **bareng import-nya** — kalau hanya salah satu, build error "SectionImage is not defined" (terjadi sekali di sesi ini).

### 38.6 Kartu program: pill kecil, foto lebih tinggi, pill HEMAT hijau

Permintaan klien: *"terlalu besar pill ini, image kurang tinggi tapi sesuaikan yang penting semuanya rapih cardnya, pill hemat harus hijau stand out agar tau itu potongan harga persen"*.

- **Pill caption foto** diperkecil: `px-3 py-1.5 text-[11px] tracking-[0.16em] rounded-2xl` → `px-2 py-1 text-[9px] tracking-[0.1em] rounded-lg`, dan teks sub Small Group dipendekkan ("Belajar bareng 6–10 atlet lintas cabor") supaya **1 baris** di HP. Caption galeri workshop + badge testimoni ikut diperkecil.
- **Foto kartu lebih tinggi**: `aspect-16/10` → **`aspect-4/3`**.
- **Pill "HEMAT n%" jadi HIJAU** — token baru `--color-discount: #0d7f3e` (putih di atasnya 4.9:1). Oranje tetap khusus CTA, hijau = diskon, jadi "potongan harga persen" langsung terbaca.

### 38.7 Kartu program/workshop: link Detail dihapus, CTA full-width + 1 animasi per kartu

Permintaan klien: *"gausah ada ini [Detail →] kan sudah di toggle, tolong card, pill, badge semuanya harus rapih, menarik dan pastikan di mobile compact mudah convert, boleh pake animasi agar makin hidup hanya 1 titik saja di card yang di animasikan, designnya buat lebih jelas, premium dan high convert"*.

- **Link "Detail →" dihapus** dari kartu program (detail sudah tersedia di toggle; halaman detail program tetap ada & bisa diakses dari nav/URL).
- **CTA full-width** (308px dari lebar kartu 358px) + `py-4` — jadi satu tombol besar yang jelas, tanpa buttons bersebelahan.
- **Satu-satunya elemen beranimasi per kartu**: `.cta-halo` — halo oranye yang napasnya pelan (3.2s, `box-shadow` 0→7px→0). Probe DOM: tepat **1** elemen `animation-iteration-count: infinite` di dalam tiap kartu (titik ONLINE sengaja diam).
- Kartu workshop ikut memakai `.cta-halo` (konsistensi).
- Pill & badge: caption foto 9px/rounded-lg, badge program `px-3 py-1 text-[10px]`, pill ONLINE pill, pill HEMAT hijau — semua radius & tracking seragam.

### 38.8 Background image section jadi FULL-BLEED (tidak berhenti di max-w-6xl)

Permintaan klien: *"perhatikan lebar image background semua section, ga full jadi jelek di desktop ini penting"*.

Penyebab: `.sec-img` (`absolute inset-0`) berada di dalam section `mx-auto max-w-6xl` → gambarnya **hanya selebar container (1152px)**, jadi di desktop ada tepi container yang kelihatan → sumber "jelek".

Fix (di `.sec-img`):
```css
position: absolute; top: 0; bottom: 0;
left: 50%; width: 100vw; max-width: none;
transform: translateX(-50%);
height: 100%; object-fit: cover;
```
Jebakan: **preflight Tailwind** `img { max-width: 100% }` meng-clamp `100vw` kembali ke lebar container — harus dilepas dengan `max-width: none` (kalau tidak, tetap 1152px).

Terukur: 9 gambar di homepage → semua **1440@0** (desktop) & **390@0** (mobile); `docW == vw` (tanpa scrollbar horizontal) di kedua viewport.

---

## 39. DEPLOY ke produksi (5 Nov 2026)

Deployment: `e1e71995-a58f-4135-b52e-c948c9b45d66` · Environment **Production** · Branch **main** · Source `882015a` · preview `https://e1e71995.myprospect-7uk.pages.dev` · **domain kustom `https://myprospect.asia` = build yang sama** (diverifikasi langsung ke domain, bukan ke URL preview — §30.8).

Perintah:
```bash
npm run build
set -a && . ./.env.cf && set +a
npx wrangler pages deploy dist --project-name myprospect --branch=main --commit-dirty=true
git push origin main   # d488b78..882015a
```

Verifikasi domain live: apex 200 · www → apex 200 (301) · /berita/ 200 · /program/elite-1on1/ 200 · /api/settings 200 · `audit-frames` 0 overflow + 0 console error (desktop + mobile) · probe DOM: background image full-bleed 390@0 (mobile) & 1440@0 (desktop) · animasi `cta-halo` aktif · eyebrow tidak ada · link "Detail →" tidak ada · pill HEMAT bg `rgb(13,127,62)` (hijau diskon) · "MEMBERSHIP PASS" + "COMING SOON" ada · hero 653px · total scroll mobile 9.994px.

Yang **tidak** ikut ter-deploy: perubahan data (D1 tidak disentuh), dan MiniMax belum bisa dipakai (kuota 2067) — aset section tetap foto asli klien + blend `multiply`.

### 39.1 Koreksi harga Small Group (5 Nov 2026)

Klien: *"ada salah harga small group bukan Rp. 299.000 tapi Rp. 325.000"*.

- `src/data/programs.ts` → `harga: 299_000` → **`325_000`** (Small Group). Harga coret tetap Rp750.000.
- Badge diskon **dihitung otomatis** → **HEMAT 57%** (sebelumnya 60%). Komentar urutan harga ikut disinkronkan.
- Deploy ulang: `a60748a6` (Production/main) → live terverifikasi: `Rp325.000` + `Hemat 57%` di homepage & `/program/small-group/` (200).

### 39.2 Headline hero baru + sumber WA di dock disembunyikan (5 Nov 2026)

- Hero h1: "Kini #JadiAtletModern Harus Bisa Bahasa Inggris & Public Speaking!" → **"SAATNYA #JADIATLETMODERN YANG JAGO BAHASA INGGRIS & PUBLIC SPEAKING!"** (hashtag tetap oranye). Hero mobile 653 → 685px.
- `waLink()` dapat opsi baru **`showSource?: boolean`** (default `true`) → baris `_sumber: …` bisa disembunyikan.
- **Dock** (homepage `Dock.svelte` + template single post `functions/berita/[slug].ts` → `waUrlDock`) memakai `showSource: false` → pesan WA dari dock **tanpa "_sumber: dock"**. CTA lain (header, hero, kartu, form, CTA band) **tetap menyimpan sumber** untuk atribusi.

Deploy `ce524151` (Production/main) → live terverifikasi: h1 = "SAATNYA #JADIATLETMODERN YANG JAGO BAHASA INGGRIS & PUBLIC SPEAKING!", dock tanpa "_sumber" ✓.

### 39.3 Saklar global sumber WhatsApp (5 Nov 2026)

Permintaan: *"kalau nanti mau sumber disembunyikan juga di tombol lain kerjakan ini"*.

`waLink()` (`src/lib/wa.ts`) kini punya 3 tingkat kontrol:

| Pemakaian | Perilaku |
|---|---|
| `showSource: false` | **paksa sembunyikan** baris `_sumber: …` (dipakai dock) |
| `showSource: true` | **paksa tampilkan**, walau saklar global mati |
| tidak diisi | ikut saklar global **`SITE.waShowSource`** (`src/data/site.ts`) |

Jadi untuk menyembunyikan sumber di **semua** tombol nanti: ubah 1 baris di `src/data/site.ts`:

```ts
waShowSource: false,   // semua tombol jadi tanpa "_sumber"
```

Perilaku **saat ini tidak berubah** (dock tanpa sumber, 23 CTA lain dengan sumber). Uji performed: saklar `false` → 0 pesan bersumber; saklar `true` → 23 bersumber + 1 tanpa.

## 44. Favicon set Prospect Asia dirapikan (5 Nov 2026)

Sesi sebelumnya meninggalkan working tree berisi aset ikon baru (belum di-commit, belum terdokumentasi): `favicon.png` 512×512 (mark P miring hitam di atas kotak oranye `#ff8c00` sudut membulat, sesuai wordmark PROSPECT), `apple-touch-icon.png` 180×180, `favicon-32.png` baru, dan `favicon.svg` versi embed-raster.

### 44.1 Perbaikan

- **`favicon.svg` cacat → diperbaiki.** Versi lama menempel PNG master 512×512 ke dalam kotak 252×348 (`x=130 y=82`) — mark P jadi **kurus/terstretch vertikal** dan ukurannya berbeda dari PNG. Sekarang PNG di-embed penuh kanvas (`x=0 y=0 512×512`) sehingga SVG ≡ PNG (21,8 KB). Alternatif vector murni tidak dipakai karena glyph vektor lama (fabd3af) sudah **beda bentuk** dengan mark brand baru, dan tidak ada tracer (potrace/vtracer) di mesin.
- **`favicon-32.png` yang tak dirujuk → di-wire** ke `Base.astro` sebagai `<link rel="icon" type="image/png" sizes="32x32">`. Template single post (`functions/berita/[slug].ts`) tetap pakai `/favicon.png` (PNG master) — tidak berubah.

### 44.2 Verifikasi lokal (belum deploy)

Render `favicon.svg` (qlmanage) identik dengan `favicon.png` — distorsi hilang. `npm run build` 12 halaman OK; `dist/index.html` memuat 4 link ikon (svg, 32px, png, apple-touch). Dev server: `/favicon.svg` 200 (sama byte per byte dengan sumber), `/favicon-32.png` 200. **Belum di-commit/deploy** — menunggu persetujuan klien.

## 45 — Materi terbaru klien diterapkan: foto coach, testimoni asli, logo mitra (5 Nov)

Materi di `/Volumes/macmini/Downloads/Website Material` diperiksa dulu (md5 vs materi lama: file lama identik, tidak ada duplikat kerja). Copywriting PDF sudah sesuai dengan home — tidak diubah. Yang diterapkan:

### 45.1 Aset baru (webp, hasil optimasi PIL)

- `public/media/coaches/*.webp` — 7 foto coach (6 yang ada di `coaches.ts` + `azka.webp` disiapkan, belum dipakai karena data Azka belum dikonfirmasi; statistik "6 coach" tetap konsisten).
- `public/media/testimoni/*.webp` — Gohan, Haidar, Hudzaifah (maks 800px).
- `public/media/partners/*.webp` — 8 logo; background dibuang via flood-fill kecuali `mfc-marunda` (teks putih → navy dipertahankan). Diverifikasi visual di atas background terang: semua bersih.

### 45.2 Data & UI

- `coaches.ts`: field `foto?` + isi; `CoachesSection.astro`: plat jersey/no/pill posisi diganti foto asli (`object-cover object-top`), jersey tetap cadangan bila coach tanpa foto.
- `testimonials.ts`: 3 testimoni **asli** dari Testimonial.pdf (Gohan TC Ajax & NAC Breda 10 th; Haidar kapten KFA Lamongan 12 th; Hudzaifah eks Timnas Qatar U-16 17 th). Zio dihapus (tidak ada di materi). Bentuk tipe `{nama,asal,olahraga,kutipan}` dipertahankan agar kontrak admin/D1 tidak berubah; `foto?` opsional — data live dari admin fallback ke foto generik.
- `Testimonials.svelte`: foto per-orang (`t.foto ??` fallback), tanda kutip “…” dilepas karena teks materi bergaya deskriptif.
- `partners.ts`: **+Knuckles Basketball** (`knuckles-basketball`, akademi) — `PartnerLogo.astro` otomatis memakai file webp per-slug. Mitra tanpa logo masih 3: margahayu-raya, little-pep, rs-limijati (fallback crest).

### 45.3 Verifikasi lokal (belum deploy)

`npm run build` 12 halaman OK. `dist/index.html`: 6 foto coach, 3 foto testimoni, 8 logo mitra + Knuckles ter-referensi; dev server 200 untuk aset baru. **Menunggu konfirmasi klien**: data lengkap Azka (peran/olahraga/IELTS), nasib Zio, jenis keanggotaan Knuckles.

**Deploy (5 Nov):** commit `81395cd` (favicon) + `fddbc07` (materi) → L3 deep review 0 temuan → push `origin/main` → `wrangler pages deploy --branch=main` (preview `eee79314`). Verifikasi domain live `myprospect.asia`: 6 foto coach, 3 testimoni, logo Knuckles, favicon-32 — semua 200. ✅ Production.

## 46 — Kartu Coach: compact, foto face-align, detail satu baris (5 Nov, live)

Komplain klien: kartu coach jelek — foto terpotong, terlalu panjang, detail panel mengganggu.

- **Foto**: keenam `public/media/coaches/*.webp` di-crop ulang per-foto (PIL) — ubun-ubun ±12% dari atas, pusat muka di 34%, tinggi kepala ±38% frame → garis mata sejajar lintas kartu. Ayya & Ido (muka kecil/rendah) di-zoom ke wajah; keluaran 512×512, nama file tetap.
- **Kartu**: `w-48/sm:w-56`, foto `aspect-1/1 object-top`, skill bar fiktif (88/74/62) + chip IELTS/Coach Senior/cabang olahraga **dihapus** (tidak ada di materi klien — lihat §45 catatan konfirmasi). Headline intro diperbaiki: "Enam coach pendamping, dipimpin ex-media PERSIB Bandung & PSSI" (klaim "berlisensi"/"atlet JPN" dihapus, tak ber-sumber).
- **Detail**: eksperimen toggle panel (details absolute) ditolak klien "mengganggu" → final: satu baris kecil `detail?` di bawah peran (10px, `text-ink/70`), hanya coach dengan detail terkonfirmasi. Ferri: "Ex-media PERSIB Bandung & PSSI · 2.175+ atlet teredukasi". Booking `mt-auto` → tinggi kartu seragam.
- **Deploy**: commit `64db42a` → L3 review 0 temuan → push → `wrangler pages deploy --branch=main` (preview `16debc49`). Verifikasi live: foto 512×512, baris detail ada, IELTS/skill-bar lama 0. ✅

## 47 — Bug 500 berita diperbaiki + full-bleed background section + judul testimoni (5 Nov, live)

- **`/berita/<slug>` 500 di production** (regresi commit saklar `waShowSource` 3b2455f): template `page()` di `functions/berita/[slug].ts` memakai `waUrlDock` yang tidak pernah masuk opts/destructuring → ReferenceError. Fix: teruskan `waUrlDock` ke `page()`. Tidak terdeteksi lokal karena `astro dev` tidak menjalankan Functions (pelajaran: route functions hanya bisa diverifikasi post-deploy). Live kini 200 untuk ketiga post, dock utuh.
- **Full-bleed background**: akar masalah `.sec-img` 100vw selama ini di-clip oleh section root `max-w-6xl overflow-hidden`. 6 section (Mitra, Berita, FAQ, Coach, Workshop, Testimoni-home) direstruktur: root full-width, konten di wrapper `mx-auto max-w-6xl px-4 sm:px-6` (`relative` agar badge absolut tidak bergeser). Halaman tentang/berita-list/program/workshop-detail memang sudah full-width.
- **Judul**: "Kata mereka" → **"Atlet Binaan Kami"** (hl-brand di "Kami").
- Catatan QA: form lead gagal di localhost itu normal (Functions tidak jalan di dev); production `/api/leads` 200. Ada lead tes "QA TEST" di D1 — abaikan.
- **Deploy**: commit `90e7514` → L3 0 temuan → push → deploy `--branch=main` (preview `a3e0c9b2`). Verifikasi live: 3 halaman berita 200, "Atlet Binaan" tampil, 5 section root baru. ✅

## 48 — Testimonial dummy tuntas: D1 disentuh, foto disambung by nama (6 Nov, live)

Akar: §45 hanya mengganti data statis `testimonials.ts`, padahal island `Testimonials.svelte` saat hydration **menimpa** dengan data live `/api/content/testimonials` (D1 `content_items`) yang masih berisi seed dummy 0002 (quote karangan + Zio). Pelajaran umum: dua sumber data (statis vs D1) harus diubah sepasang.

- **`migrations/0004_testimonials_real.sql`** dieksekusi `wrangler d1 execute --remote`: DELETE semua kind=testimonials, INSERT Gohan/Haidar/Hudzaifah sesuai Testimonial.pdf (Zio hilang). Berlaku seketika tanpa deploy.
- **Foto**: D1 tidak punya field foto → mapping live di island kini `foto: items.find(s => s.nama === t.title)?.foto` (join by nama ke data statis). Testimoni admin baru tanpa nama cocok tetap aman: fallback foto generik.
- **Deploy**: commit `7f86b91` → L3 0 temuan → push → `--branch=main` (preview `acb0c548`). Verifikasi live: API mengembalikan 3 asli, HTML 0 dummy, chunk `Testimonials.*.js` memuat logika join, `media/testimoni/*.webp` 200. ✅

## 49 — Akademi Futsal Margahayu Raya dihapus total (6 Nov, live)

- Permintaan klien: hapus dari daftar mitra **dan** beritanya.
- **Mitra**: entri `partners.ts` dihapus → penghitung otomatis jadi 6 akademi; placeholder form lead "cth: Akademi Futsal Margahayu Raya" → "cth: Akademi Sepak Bola Kota". Logo `media/partners/akademi-futsal-margahayu-raya.webp` dibiarkan (tidak direferensikan).
- **Berita dua sumber** (pelajaran §48 diterapkan sejak awal): MDX `kolaborasi-workshop-starter.mdx` dihapus (list home+/berita+sitemap), seed `0003`/`0005` dibersihkan dari post itu (agar tidak hidup di environment baru), migration `0006_delete_kolaborasi_post.sql` dieksekusi `--remote` ke D1 production (detail page + /api/posts).
- **Deploy**: commit `cd6b387` → L3 0 temuan → push → `--branch=main` (preview `ab13cb5b`). Verifikasi live: home & /berita 0 kata "margahayu", `/berita/kolaborasi-workshop-starter` 404, sitemap bersih, ">6 akademi<" tampil. ✅
