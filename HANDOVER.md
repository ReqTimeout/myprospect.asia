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
| Produksi | `https://myprospect-7uk.pages.dev` |
| Admin | `https://myprospect-7uk.pages.dev/admin` (password ada di `.env.admin` — gitignored) |
| Preview deploy | `https://<hash>.myprospect-7uk.pages.dev` (hash dicetak tiap `wrangler pages deploy`) |
| Placeholder domain | `https://myprospect.asia` (belum diarahkan; DNS masih di Hostinger) |
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
migrations/                  0001_init.sql, 0002_content.sql, 0003_seed_posts.sql
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
| `--color-brand-dark` | `#e05e00` | teks oranye (kontras), hover |
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
| `posts` | berita: slug, title, desc, kategori, pub_date, body(markdown), status, updated_at |
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

**Publik**: `GET /api/posts` · `GET /api/content/{testimonials|faq|stats}` · `GET /api/settings` · `POST /api/leads` (dual-mode) · `POST /api/click`.
`POST /api/leads` dual-mode:
- `content-type: application/json` → balas `{ ok: true, waUrl }` (dipakai popup pendaftaran, tidak pindah halaman).
- form-encoded (classic) → 302 redirect ke `wa.me` (dipakai `LeadForm.astro` di `/tentang`).
Isi JSON: `{ nama, wa, program, catatan, sumber }`. Insert ke D1 `leads` + balas link `wa.me` bernomor admin. Kegagalan DB/settings **tidak** menggagalkan handoff ke WhatsApp (di-`try/catch`).
**Admin** (butuh cookie `pa_admin`): `POST /api/admin/login` · `POST /api/admin/logout` · `GET /api/admin/stats` · `GET/PATCH /api/admin/leads` · `GET/PUT /api/admin/settings` · `GET/POST /api/admin/posts` · `PUT/DELETE /api/admin/posts/{slug}` · `GET/POST /api/admin/content/{kind}` · `PUT/DELETE /api/admin/content/{kind}/{id}`.
Validator bersama: `functions/_lib/content.ts` (KINDS, FAQ_GRUP, KATEGORI, POST_STATUS, parsePost/parseContent).

---

## 11. Admin panel

`/admin` → island `AdminApp.svelte`:
- **Dashboard** — kartu statistik (leads, klik, konversi).
- **Leads** — filter status, ubah status, catatan, tombol buka WA.
- **Konten** (`AdminKonten.svelte`) — sub-tab Berita / Testimoni / FAQ / Statistik; slug otomatis dari judul, body markdown, delete dengan konfirmasi, simpan ke D1 (tanpa deploy).
- **Media** — belum terisi (butuh R2).
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
- GA4: loader runtime di `Base.astro` ambil `/api/settings`, injeksi gtag bila ID valid. **Belum ada ID GA4** (menunggu klien).
- Sitemap: `@astrojs/sitemap` (aktif). `plan.md` menyebut `astro:transitions` sudah diuji.

---

## 15. Blocker (butuh klien)

1. **R2 belum aktif** (error 10042) → Media tab kosong. Activate di dashboard → `wrangler r2 bucket create prospect-media` → uncomment blok `r2_buckets` di `wrangler.jsonc`.
2. **ID GA4** belum ada (loader sudah siap).
3. **Domain kustom**: `myprospect.asia` masih di DNS Hostinger; perlu arahkan ke Pages (CNAME `myprospect-7uk.pages.dev`) + set custom domain di dashboard.
4. **Harga Workshop Pro** belum ada (tampil "Custom").
5. **Folder kosong** di `Website Material/`: `Coaches Picture/`, `Copywriting/`, `Testimonials/` — menunggu file klien.
6. **Handle IG/TikTok** resmi belum ada (teks di program menyebut "Konten atlet di Instagram Prospect Asia").
7. Foto klien final untuk program/coaches (yang dipakai sekarang mix foto workshop + stock session).

---

## 16. Sisa pekerjaan yang disarankan (urut prioritas)

> Arah desain aktif sejak Okt 2026 = **"Broadcast / Scoreboard"**: pita ticker, papan skor, tiket sobek, kartu pemain ala jersey, spotlight kursor. Artwork coach saat ini **CSS/SVG art** (bukan foto) karena ImageGen kehabisan kredit dan `Website Material/Coaches Picture/` masih kosong.

1. Regenerasi OG image + aset generated ke nuansa terang (MiniMax image-01) — `src/assets/generated/a2-og-bg.jpg` dst.
2. Pasang custom domain + A-record/CNAME di DNS Hostinger; set domain di Pages; add `myprospect.asia` ke `SITE.url` & canonical.
3. Aktifkan R2 → implementasikan upload media di tab Media (proxy `/media/*`).
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
