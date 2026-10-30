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
| `--color-ink-2` | `#17110b` | **khusus admin panel** (tetap dark) |
| `--color-bone` | `#f7f5f2` | **khusus admin panel** (teks di admin) |
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
- Admin **tetap dark** (pakai `bg-ink`/`text-bone`) — jangan di-sweep saat ganti tema.

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

**Publik**: `GET /api/posts` · `GET /api/content/{testimonials|faq|stats}` · `GET /api/settings` · `POST /api/leads` (dual-mode) · `POST /api/click` · `POST /api/pv` (beacon trafik, tanpa cookie).
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

`/admin` → island `AdminApp.svelte` (konsol analitik gelap, 6 tab):
- **Dashboard** — hero ringkasan N hari + 4 kartu KPI (sparkline + chip delta vs periode lalu), grafik SVG trafik harian interaktif (hover kolom + tooltip), corong konversi (kunjungan→klik WA→lead), halaman terpopuler, lead terbaru, plus kartu "Sedang aktif" realtime di sidebar. Rentang 7/14/30 hari.
- **Analitik** — sumber trafik (referrer), perangkat pengunjung (stacked bar), tabel semua halaman (PV/UV), ranking tombol WhatsApp paling diklik, 4 mini-stat.
- **Leads** — filter status, ubah status, catatan, tombol buka WA.
- **Konten** (`AdminKonten.svelte`) — sub-tab Berita / Testimoni / FAQ / Statistik; slug otomatis dari judul, body markdown, delete dengan konfirmasi, simpan ke D1 (tanpa deploy).
- **Media** — status R2 live via `/api/admin/media` (mengandung `siap`). Selama R2 belum aktif, tab menampilkan pesan blocker + langkah aktivasi jujur; begitu bucket di-bind, UI unggah (`/api/admin/upload`) langsung aktif tanpa ubah kode.
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
| Screenshot + kontras (home + detail berita) | `scripts/verify-revisi.mjs` | `node scripts/verify-revisi.mjs <base-url>` → **2 halaman** (home & `/berita/bintang-gohan`) × 2 viewport; screenshot per area ke `~/Downloads/rv-*.png`, audit kontras WCAG dengan selector per halaman, plus cek overflow (`docScrollW` vs viewport). Untuk revisi yang menyentuh header/footer/program/mitra **dan** halaman detail berita |
| E2E domain + admin guard | `scripts/verify-domain.mjs` | `set -a && . ./.env.admin && set +a && node scripts/verify-domain.mjs [base-url]` → **39 cek**: guard admin (401 + 302 `/admin/`→login), login benar/salah + atribut cookie (`HttpOnly`/`Secure`/`SameSite=Lax`), semua endpoint admin 200+JSON, logout, API publik, canonical/`og:url` pakai domain kustom, **www → apex 301**, sitemap + robots, plus alur lead (302 → `wa.me` + validasi 400). **Wajib tiap kali domain/SEO/admin/alur lead diubah** |
| E2E UI panel admin (browser sungguhan) | `scripts/verify-admin-ui.mjs` | `set -a && . ./.env.admin && set +a && node scripts/verify-admin-ui.mjs [base-url]` → **64 cek** di desktop 1440×900 + mobile 390×844: `/admin/` tanpa login terlempar ke login, password salah memunculkan "Password salah.", password benar masuk, **tiap tab menegaskan nav menyorot tab yang benar + kontennya benar-benar termuat**, dashboard (KPI/corong/halaman/lead benar-benar ter-render, 6 jalur SVG chart, 14 kolom grafik, ganti periode 30 hari, hover tooltip), tulis beneran (klik Simpan pengaturan lalu bandingkan API sebelum/sesudah — idempoten karena PUT settings per-key upsert), Keluar balik ke login, console error + request gagal. Password dibaca dari env dan **tidak pernah dicetak**. Screenshot `ad-*.png` **wajib dibaca via vision** |
| E2E analitik + CRUD berita | `scripts/verify-analitik.mjs` | `set -a && . ./.env.admin && set +a && node scripts/verify-analitik.mjs [base-url]` → **46 cek**: beacon `/api/pv` (204, body rusak ditoleransi, path non-relatif ditolak), angka stats (pv/uv, deret 7 hari terisi per hari), `/admin` tersaring, trafik bot/CLI **tidak** dihitung, perangkat desktop/mobile/tablet terklasifikasi, referrer `google.com`/`instagram.com` terparse, referrer internal tidak dihitung, `hari` asing → fallback 14, 401 tanpa login, klik WA masuk KPI + daftar CTA, plus **CRUD berita penuh** (POST 201 → halaman publik 200 + cover + canonical + `og:url` + beacon → PUT edit → status draft → publik 404 → ganti slug ditolak 400 → DELETE → 404 → 3 berita asli tetap utuh → POST tanpa auth 401). Skrip menulis baris uji ke D1 → **wajib bersihkan** (perintah ada di footer keluarannya) |

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

1. **R2 belum aktif** (error `10042` — *"Please enable R2 through the Cloudflare Dashboard"*) → upload media masih kosong. **Tidak ada endpoint API yang bisa mengaktifkannya** (ToS R2 harus diklik manusia di dashboard), jadi satu-satunya jalan adalah klik manual:
   1. Dashboard Cloudflare → **R2** → **Explore R2** → **Activate** (sekali klik, tanpa API).
   2. Setelah aktif: `npx wrangler r2 bucket create prospect-media` → uncomment blok `r2_buckets` di `wrangler.jsonc` → deploy ulang.
   3. Tab **Media** di panel admin otomatis berubah jadi "R2 aktif — siap unggah" (status dibaca live dari `/api/admin/media`), **tanpa ubah kode**.
   Selama langkah 1 belum dilakukan, tab Media menampilkan pesan blocker + daftar langkah ini (bukan layar kosong).
   > Bukti attempt otomatis: `npx wrangler r2 bucket create prospect-media` → `[code: 10042] Please enable R2 through the Cloudflare Dashboard.`
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
3. Aktifkan R2 (satu klik di dashboard — lihat §15 blocker #1) → bucket dibuat & di-bind → upload media di tab Media **langsung aktif** (jalur unggah sudah ditulis: `/api/admin/upload`, maks 5 MB, jpg/png/webp/gif/avif/mp4, key `media/YYYYMMDD-<slug>-<8hex>.<ext>`).
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
2. Kalau ganti tema: ubah `@theme` di `src/styles/global.css`, **kecuali** `ink-2`/`bone` (admin), dan **kecuali** `functions/berita/[slug].ts` (CSS inline).
3. Kalau menambah motion: taruh di `src/scripts/fx.ts` (JS) atau keyframes CSS. **Jangan** reintroduce gate `prefers-reduced-motion` — user minta animasi selalu hidup.
4. Kalau menambah konten: pakai API admin + D1 (tanpa deploy) — jangan tambah file MDX kecuali seed.
5. Verifikasi selalu: `npm run build` → `wrangler pages deploy` → `myprospect-audit.mjs` (harus 0 bug) → screenshot → commit+push.
6. Kalau user bilang "animasi ga jalan": cek (a) hard refresh, (b) aset JS/CSS lama di cache. Toggle animasi **sudah dihapus** — jangan cari lagi.
7. Kalau menambah heading baru: jangan pakai kelas `.hl-brand` (gradient `background-clip:text`) di dalam elemen yang kena GSAP SplitText — SplitText memecah karakter dan gradient pecah → teks jadi tak terlihat. Pakai `text-brand-dark`.
8. Kalau menambah utility CSS kustom: beware **Tailwind v4 layering** — CSS tanpa `@layer` mengalahkan utility Tailwind. Bungkus dengan `@layer components` bila memang mau utility yang menang (contoh kasus `.jersey` + `absolute inset-0`).
9. Setiap perubahan visual **wajib** diverifikasi dua viewport (desktop 1440×900 & mobile 390×844) lewat `scripts/audit-frames.mjs` → **baca frame via vision** → lalu `scripts/audit-clip.mjs` (target 0 overflow & 0 covered). Cek khusus mobile: bubble WhatsApp **tidak boleh muncul** (Dock mobile sudah punya tombol Chat) supaya tidak menutupi CTA/judul.
10. Popup WA desktop auto-muncul lalu **menyempit sendiri** ke bubble setelah 6,5 detik (`collapse()` di `WaPopup.svelte`) supaya tidak terus menutupi isi kartu. Kalau user sudah klik CTA, timer dibatalkan dan kartu tetap terbuka. Di mobile kartu **tidak pernah** muncul otomatis — bubble kecil + tombol Chat di Dock saja.

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
| Dashboard dibikin "pro" | **SELESAI** | `AdminApp.svelte` dibangun ulang jadi konsol analitik gelap: hero ringkasan, 4 kartu KPI + sparkline + chip delta, grafik SVG interaktif, corong konversi, top halaman, lead terbaru, tab **Analitik** baru. Dibaca via vision di desktop 1440×900 + mobile 390×844 |
| R2 diaktifkan sendiri | **TERBATAS** (butuh 1 klik klien) | API ditolak `10042`; tidak ada endpoint untuk menerima ToS R2. Jalur unggah **sudah ditulis** & status R2 **dibaca live** — begitu bucket di-bind, tab Media langsung siap tanpa ubah kode |
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
- **Tab Media** — status R2 live dari `/api/admin/media`; menampilkan pesan blocker + langkah aktivasi selama R2 belum aktif, dan form unggah otomatis aktif setelah bucket ter-bind.
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
