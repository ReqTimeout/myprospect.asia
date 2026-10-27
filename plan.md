# PLAN — Website myprospect.asia (Prospect Asia)

> Client: **Prospect Asia — PT Kita Berani Bicara** · **#JadiAtletModern**
> Sports Communication: Public Speaking + English khusus atlet — *tautan singkat: "atlet modern = bisa bicara, bukan cuma bisa main"*
> Model konversi: **WA-first (semua by WhatsApp 0859-2404-1004)** — belum ada materi online/checkout.
> Status repo: remote git akan disediakan klien (TBD). Domain parked di Hostinger DNS → pindah ke Cloudflare.

---

## 1. Konteks Bisnis (hasil riset material klien + LinkedIn)

| Item | Data |
|---|---|
| Legalitas | PT Kita Berani Bicara (Bandung, mulai aktif ~Okt 2025) |
| Founder | **Ferri Ahrial** — Founder; ex-Media PERSIB Bandung & PSSI (headline LinkedIn: "Sports Communication Trainer for Athletes") |
| Proof | **2.175 atlet teredukasi · 25 akademi olahraga · 6 coach** |
| Klien (B2B) | Djanur Football Academy, Dream Baller ID, PB Jaya Raya Ragunan, Akademi Futsal Margahayu Raya, MFC Marunda, SSBRBC |
| Mitra resmi | Little Pep, Pep Sports, Exortive, RS Limijati |
| Coaches | Ferri Ahrial, Ilham Ahmad, Fathur Fathurrahman, Farhana Ayya, Salim, Ido (profil: IELTS Certified, jumlah atlet teredukasi, sports favorite) |
| Produk B2C | **Private 1on1 Elite** (promo 1.299.000 dari 2.300.000 / 6 sesi / bulan, online), **Private 1on1 Premium** (promo 2.499.000 dari 3.500.000 — + Pemberitaan di portal berita nasional), **Small Group** 6–10 atlet (online; harga TBD), **Membership** (Coming Soon) |
| Produk B2B | Workshop Akademi/Klub — **Starter** 1 sesi 90 mnt (1.999.000), **Premium** 1 sesi 120 mnt + 3 assessor + e-cert (3.899.000) + pemberitaan akademi di portal media, **Pro** (TBD) |
| Leveling | Basic → Development → Impact (tes penempatan) + journey Bulan 1–4: komunikasi → ekspresi diri → mewakili diri & tim → identitas diri |
| Blog | "Berita Atlet Modern" — kategori Berita, Bintang, Kolaborasi |
| Catatan klien (PDF) | Popup untuk chat admin · CTA join "ada waktu utk checkout" (urgensi slot) |

---

## 2. Konsep Website — "Ruangguru DNA, tapi WA-First & Atletik"

- Pengalaman edutech ala Ruangguru: hero berwarna, kartu program, level journey, stats, testimoni, blog.
- Tapi seluruh **"beli/daftar/tanya" = WhatsApp deep-link** dengan pesan pre-filled per program (+ lead form tersimpan di D1).
- Tidak ada login/LMS/konten-online — tiap halaman bertugas **meyakinkan** lalu **menyodorkan WA**.
- Human touch: foto REAL dari klien, coach asli, testimoni atlet bernama, mikrocopy gaya chat WA (gaya berbahasa dekat, pakai "Kamu", emoji secukupnya).

---

## 3. Design DNA (dari aset klien — vision-verified)

| Token | Nilai | Sumber |
|---|---|---|
| Base | `#0A0A0A` black, `#F7F5F2` off-white | Aset studio shot 7 atlet + logo Putih/Hitam |
| Primary | `#C8232B` red (tracksuit, banner promo, ikon) | Aset program card |
| Accent | `#E6A817` gold (tier Premium, bintang, piala) | Aset program card |
| Tipografi display | **Anton** / Barlow Condensed — italic-skew ala wordmark `PROSPECT` | Logo Black.png |
| Tipografi body | **Plus Jakarta Sans** (variable) — vibe edutech ID | Aset program card (Inter-like) |
| Bahasa visual | Angle-cut (skew -8°), speed lines, blok kontras merah/hitam/emas, foto gelap dramatis, kartu miring 1–2° | Logo + aset workshop |
| Wajib | Wordmark `PROSPECT` dibuat ulang sebagai teks HTML/CSS (crisp di semua ukuran, bukan PNG) | — |

---

## 4. Tech Stack (Cloudflare Free — kuota terverifikasi)

| Layer | Pilihan | Kuota CF Free |
|---|---|---|
| Framework | **Astro 5 static** + MDX + Content Collections + `astro:transitions` | — |
| Interaktivitas | **Svelte 5 islands** (`@astrojs/svelte`) — popup, form, dock, admin | — |
| Styling | **Tailwind v4** + @tailwindcss/typography (MDX blog) | — |
| Hosting | **Cloudflare Pages** (+ Functions) | request static ∞ · fungsi 100k/hari · 500 build/bln |
| DB | **D1** (SQLite) — leads, konten dinamis | 5GB · 5M read/hari · 100k write/hari |
| Media | **R2** (upload admin + aset) — image situs di-optimasi saat build (sharp/astro:assets); upload admin disimpan R2 & diserve via `/media/*` proxy | 10GB · egress ∞ |
| Auth admin | **Cloudflare Access** (OTP email ≤50 seat) di depan `/admin/*` + verifikasi JWT di Functions | Rp 0 |
| Semantik/animasi | GSAP (ScrollTrigger — kini full free), lenis (smooth scroll), embla-carousel (svelte), lucide-svelte | — |
| Fungsi | Pages Functions `/api/*` (CRUD admin, leads, R2 upload proxy, click event) | — |
| Biaya ops | **Rp 0/bln** (+ domain) | — |

**Kenapa Astro bukan SvelteKit:** publik 100% statis & SEO-heavy → Astro unggul performa/kesederhanaan; admin cukup 1 island. SvelteKit dipertimbangkan jika fase 2 naik ke LSS/materi online (jalur upgrade disiapkan di struktur folder).

**Libs final:** `astro`, `@astrojs/svelte`, `@astrojs/mdx`, `@astrojs/sitemap`, `tailwindcss@4`, `@tailwindcss/typography`, `gsap`, `lenis`, `embla-carousel-svelte` (atau vanilla embla), `lucide-svelte`, `@fontsource-variable/plus-jakarta-sans`, `@fontsource/anton`. *Tanpa* Swiper/alpine/jQuery.

---

## 5. Mobile-First UI — **Dock Menu ala iPhone**

- Nav utama = **dock floating bottom** (mobile): `blur(24px)` glass hitam, rounded-2xl, ikon 5 app: **Home · Program · Workshop · Berita · Chat(WA)** — item aktif: ikon membesar + bounce (spring), titik indikator gold di bawah ikon, label 10px muncul saat aktif.
- Tombol **WA = lingkaran merah berlegh** terpisah di kanan dock (aksen dunia DNA), pulse halus setiap 6 dtk.
- `env(safe-area-inset-bottom)` untuk iPhone; dock hilang saat hero scroll down >80px (biar foto lega), muncul lagi saat scroll up.
- Desktop (≥1024px): dock pindah ke top navbar dengan gaya sama; WA tetap floating kiri-bawah.
- Semua tap target ≥44px; “dock” ikut scroll paling bawah biar tetap reachable dengan jempol.

---

## 6. Wireframes (Mobile-First · ASCII)

### 6.1 HOME

```
┌─────────────────────────────┐
│ ● PROSPECT ⌄      (blur top)│  ← strip tipis logo + tautan kecil/CTA
│                             │
│      #JADIATLETMODERN        │  ← eyebrow chip gold
│   JADI ATLET                 │
│   MODERN DGN                 │
│   SPORTS COMM.               │  ← headline 3 baris, reveal per kata
│            [foto atlet]      │
│  ┌────────────────────────┐  │
│  │ 2.175 ATLET · 25 AKADEMI│ │  ← chip-stats counter
│  └────────────────────────┘  │
│ [CTA WA MERAH ↗ DAFTAR SEKARANG]│ ← sticky di bawah hero
└─ dock ─────────────────────────┘

── marquee partner (logo strip, kecepatan 30s, pause on hover) ──

┌ Apa itu Sports Communication? ┐
│  [foto workshop REAL]         │
│  paragraf 2 kalimat + 3 chips │
│  (Fun Comm Kids · Young Athletes│
│   Digital Literacy & Branding)│
│  "Public speaking +
│  English khusus atlet"        │
└───────────────────────────────┘

┌ LEVEL & JOURNEY (tab interaktif)┐
│ [Basic][Development][Impact]    │ ← segmented control, garis gold
│ ─ Bulan 1: berkomunikasi        │
│ ─ Bulan 2: ekspresi diri        │
│ ─ Bulan 3: mewakili diri & tim  │
│ ─ Bulan 4: identitas diri       │ ← stepper swipeable
└─────────────────────────────────┘

┌ PROGRAM UNGGULAN (swipe) ┐
│ ┌─ Kartu Elite 1-on-1 ─┐ │
│ │ strikethrough 2.3jt  │ │
│ │ PROMO 1.299.000 (red)│ │
│ │ • 6 sesi 60 mnt      │ │
│ │ • e-cert + report    │ │
│ │ [CTA WA]             │ │
│ └──────────────────────┘ │
│ ┌─ Kartu Premium 1-on-1 ┐│
│ │ + badge "media nasional│
│ │ PROMO 2.499.000 gold  │
│ └───────────────────────┘│
│ ┌─ Small Group 6–10 ────┐│
│ └───────────────────────┘│
│ • dot pagination gold    │
└──────────────────────────┘

┌ MEMBERSHIP (locked card) ┐
│ grayscale + ikon gembok   │
│ "Coming Soon" + CTA early │
│ access via WA             │
└───────────────────────────┘

┌ WORKSHOP UNTUK AKADEMI ┐
│ 3 tier: Starter-Prem-Pro │
│ + CTA "Booking Workshop" │
│ (form lead → WA)         │
└──────────────────────────┘

┌ KATA MEREKA (carousel) ┐
│ [foto] nama, akademi, sport │
│ quote 2 baris, swipe      │
└────────────────────────────┘

┌ COACHES (scroll-x)          │
│ card foto + chip gold       │
│ + info IELTS/pengalaman     │
│ (scroll snap)               │
└─────────────────────────────┘

┌ BERITA ATLET MODERN ┐
│ [tab Berita|Bintang|Kolab] │
│ grid 2 kolom card + foto  │
└──────────────────────────┘

┌ FAQ (accordion 3-5) ──────────┐
└──────────────────────────────┘

┌ CTA AKHIR besar: "Jadi Atlet Modern, Mulai Hari Ini" + WA │
└ footer: PT Kita Berani Bicara + sosmed (IG/TikTok TBD) ─┘
[ + POPUP WA bubble melayang kanan (klik → chat mini →wa.me) ]
```

### 6.2 PROGRAM DETAIL (`/program/[slug]`)

```
┌ back ← kembali             │
│ HERO: foto atlet + badge    │
│ H1: "Elite 1-on-1"         │
│ (strikethrough promo red)  │
│ chips: Online · 6 sesi ·  │
│        tes penempatan      │
│ [CTA WA besar + jam ops]   │
├─ "Apa yang akan dikuasai"  │  ← checklist ikon lucide
├─ "Yang didapatkan"         │  ← bullets + badge media (gold)
├─ "Peningkatan bulanan"     │  ← stepper journey
├─ testimonial 1 kartu       │
├─ FAQ mini 3                │
└ sticky dock + CTA WA       │
```

### 6.3 WORKSHOP DETAIL (B2B, `/workshop/[slug]`): sama struktur, target CTA = "Booking Workshop untuk Akademi" (form nama akademi+PIC).

### 6.4 BLOG (`/berita` + `/berita/[slug]`)

```
berita: tab kategori + grid 2 kolom + card (foto, judul, tag, tgl)
detail : hero foto → prose (typography) → CTA WA inline "Mau profil atletmu diberitakan? WA kami" → related 2 kartu
```

### 6.5 Popup WA (floating)

```
   [○×]
  ┌───────────────┐
   │ Hai 👋        │  ← masuk slide-up + fade (bukan 3d)
   │ Mau tanya     │
   │ lebih jauh    │
   │ tentang       │
   │ program?      │
  │ [Chat admin    │
  │  sekarang ↗]   │  ← wa.me + utm + prefilled
  └───────────────┘
   bubble muncul 8 dtk / scroll 40% / sweep setelah klik
```

### 6.6 ADMIN (`/admin`, island Svelte — mobile friendly)

```
login: sederhana → redirect ke Cloudflare Access OTP email.
Layout: sidebar kiri desktop; tab bawah mobile seperti dock admin.
Tab: [Dashboard] [Leads] [Konten] [Media] [Pengaturan]
Dashboard: kartu angka (leads hari ini, klik-WA 7 hari, artikel draft)
Leads : tabel + filter status (Baru→Dikontak→Terjadwal→Daftar)
        → tombol [WA] per baris (wa.me pre-fill) + edit catatan
Konten: Program · Workshop · Testimoni · Coach · Blog (MDX-ready)
Media : upload ke R2 (drag&drop, progress, copy URL)
Pengaturan: no WA, teks popup, GA4 ID, meta SEO, jadwal workshop
```

---

## 7. Titik generate asset (MiniMax MCP)

> Prinsip: **foto REAL klien = bintang utama** (workshop BIA_*.JPG, studio 7 atlet, sesi online). AI hanya untuk background/dekorasi konsisten dengan DNA (hitam-merah-emas):

| # | Asset | Tool | Prompt inti |
|---|---|---|---|
| A1 | **Hero backdrop texture** (grain dark stadium, red/gold rim light, abstrak) 9:16 & 16:9 | `minimax_text_to_image` | "dark abstract sports stadium backdrop, red and gold rim lighting, grainy, cinematic, no people, no text" |
| A2 | **OG image template** 1200×630 tiap halaman (logo present + headline dinamis) | `minimax_text_to_image` + komposit di Astro | satu generik warna + overlay teks build-time |
| A3 | **Ilustrasi Membership Coming-Soon** (locked card, gold, grain) | `minimax_text_to_image` | "minimal locked golden card illustration on black, no text" |
| A4 | **Ilustrasi Workshop B2B** (panggung coach + banyak atlet abstrak, flat riso style) | `minimax_text_to_image` | "flat risograph illustration, coach with megaphone, young athletes, black red gold" |
| A5 | **Pattern dekoratif** (speed-lines gold transparan utk CTA band, sudut section) | `minimax_text_to_image` | subtle repeating speed lines |
| A6 | **Favicon/social avatar** (huruf "P" skew merah/gold pada hitam) | tool + export SVG manual | wordmark P italic |
| A7 | *(Ops fase 2)* **Hero video 6–10s** loop muted (atlet abstrak, cinematic red/gold) | `minimax_generate_video` | gunakan hemat (biaya API) |
| — | **Tidak** digenerate: foto atlet asli, logo klien (pakai aset real), ikon (lucide-svelte) | — | — |

Semua hasil generate disimpan `src/assets/generated/` + di-optimasi (`astro:assets`, w/h, `format=webp/avif`, lazy kecuali hero).

---

## 8. Animasi & Human-Touch (katalog micro-interactions, aman performa)

| # | Lokasi | Trigger | Implementasi | Durasi/Ease |
|---|---|---|---|---|
| M1 | Headline hero | on-load | GSAP stagger per kata (translateY+skew) + mask | 0.6s expo.out |
| M2 | Chip-stats (2.175/25) | masuk viewport sekali | counter (rAF) + shimmer gold | 1.2s |
| M3 | Marquee partner | terus | CSS keyframes + `will-change`, pause on hover | 30s linear |
| M4 | Kartu program | hover/tap | CSS lift + glow border merah; tap: spring scale 0.98→1 | 180ms |
| M5 | Level & journey | ganti tab | Svelte `transition:fly` + garis gold grow | 220ms |
| M6 | Carousel testimoni | swipe | Embla drag physics + snap | — |
| M7 | Popup WA | idle 8s / scroll 40% | CSS translateY+fade via class; sekali per sesi (sessionStorage) | 240ms |
| M8 | Dock iOS | tap item | spring bounce + dot gold; scroll-hide (translateY 100%) | 200ms spring |
| M9 | Reveal section | masuk viewport | IO + CSS (opacity/8px up), klasik, digunakan selektif (hero, program, CTA) | 300ms |
| M10 | FAQ accordion | klik | `<details>` + grid-template-rows animasi polos | 240ms |
| M11 | Foto workshop | hover/tap | subtle tilt (CSS transform) + zoom-in foto dalam frame | 200ms |
| M12 | Sticky CTA WA band | scroll | slide-up band, sinematik sekali per section | 260ms |

**Guardrails performa/a11y (wajib):**
- Semua motion hormat `prefers-reduced-motion` → fallback langsung state final
- Anim only via *transform/opacity* (no layout thrash); `content-visibility: auto` utk section bawah
- JS interaktif <100KB gz; island hanya `/admin` + komponen micro (popup, embla, dock)
- Hero: **no autoplay video wajib**; image priority fetch `eager` + `fetchpriority="high"` untuk hero saja
- Skor target: Lighthouse ≥95 mobile, CLS <0.1, INP <200ms

---

## 9. WA Flow (jantung konversi)

1. **Deep-link**: `https://wa.me/6285924041004?text=Halo,%20saya%20tertarik%20[PROGRAM].%20Boleh%20info%20jadwal?` — per program/level/workshop + `utm_content` di teks (atau link via `/p/share?to=program` bila perlu analytics)
2. **Popup chat admin** (disetel di admin): bubble gaya chat 8 dtk / 40% scroll; klik → WA.
3. **Form lead** (halaman program/workshop & footer): nama, sebut WA, program, sumber → POST `/api/leads` (D1) → **redirect WA dengan pre-filled** + teks sudah berisi data form (biar admin tahu konteks).
4. **Pipeline admin**: status Baru → Dikontak → Terjadwal → Daftar; tombol [WA] langsung dari baris leads; notif ringan (badge angka di dashboard).
5. Diskon/urgensi: badge "Kuota batch terbatas" dikelola lewat admin (angka slot) — sinkron dengan note PDF "ada waktu utk checkout".

---

## 10. Arsitektur & Setup Infra (checklist)

**Repo (struktur):**
```
myprospect.asia/
├─ astro.config.mjs · wrangler.jsonc · wrangler.types.d.ts
├─ public/ (favicon, robots, _headers)
├─ src/
│  ├─ pages/  index.astro, program/[slug].astro, workshop/[slug].astro,
│  │          berita/[slug].astro, faq.astro, tentang.astro, admin/index.astro
│  ├─ functions/api/ [[route]].ts   (leads, settings, media, click)
│  ├─ components/ (Astro static) + islands/ (Svelte: Dock, WaPopup, AdminApp, FAQsIsland?)
│  ├─ content/ berita/*.mdx + collections config
│  ├─ layouts/ Base.astro, Prose.astro
│  ├─ styles/global.css (tailwind v4 + tokens DNA)
│  └─ assets/ (foto klien + generated/)
├─ migrations/ (D1 SQL)
└─ plan.md
```

**D1 schema (ringkas):** `posts` (MDX konten blog boleh dari file, opsional sinkron DB) · `programs` · `workshops` · `testimonials` · `coaches` · `partners` · `leads(id, nama, wa, program, sumber, status, catatan, created_at)` · `settings(k,v)` · `wa_clicks(slug, ts)`

**API Pages Functions:** `POST /api/leads` · `GET/PATCH /api/leads` (header JWT Access) · `POST /api/media` (proxy R2 presign/put) · `POST /api/click` · `GET/PUT /api/settings`

**Provisioning (sekali, login CF):**
```bash
npm i -D wrangler@latest
npx wrangler login            # OAuth browser → akun CF klien
npx wrangler whoami
npx wrangler pages project create myprospect
npx wrangler d1 create prospect-db && npx wrangler d1 migrations apply prospect-db --remote
npx wrangler r2 bucket create prospect-media
# Access: dashboard Zero Trust → Self-hosted app (path /admin*) → policy email OTP
# DNS: Cloudflare → add zone myprospect.asia → ganti NS di Hostinger → custom domain Pages
npx wrangler pages deploy ./dist --project-name myprospect
```
Output awal = `*.pages.dev` preview dulu; production domain aktif setelah NS propagate.

**Environment vars (Wrangler secret):** `ADMIN_EMAIL`, `R2_TOKEN*` via binding, `CF_ACCESS_JWKS_URL` (untuk verifikasi JWT di Functions), GA4 ID opsional.

---

## 11. SEO · Tracking · a11y

- Meta per page + `OG image` A2; schema.org: `EducationalOrganization` (home), `Course`/`EducationEvent` (program/workshop), `NewsArticle` (blog), `FAQPage`
- Sitemap + canonical + `robots.txt`; sapaan `lang="id-ID"`
- Kinerja: `preload` font display, `font-display: swap`, `astro:transitions` untuk rasa SPA
- **GA4** + event custom: `wa_click` (per program), `lead_submit`, `popup_open` (via gtag dataLayer — tanpa GTM dulu utk jaga bobot)
- Lighthouse budget + `prefers-reduced-motion`; focus-visible; kontras AA; alt foto klien wajib (nama atlet/akademi kalau diketahui)

---

## 12. Roadmap

| Fase | Isi | Est. |
|---|---|---|
| **F1 — Fondasi** | scaffold repo + design tokens + deploy preview ke pages.dev | — |
| **F2 — Halaman publik** | Home (13 section, bab 6.1) + program/workshop/blog/tentang/faq, dock iOS | — |
| **F3 — Wa-first konversi** | popup, form lead→D1→wa.deep-link, click GA events | — |
| **F4 — Admin island** | Leads + Konten + Media/R2 + Pengaturan + Access login | — |
| **F5 — Produksi** | assets generate (MiniMax A1–A6), foto klien final, SEO schema, GA4, custom domain live | — |
| **F2b (fase 2)** | Membership aktif, materi online/LMS, WA Cloud API auto-reply, EN (opsional) | — |

**Butuhan dari klien (masih open):** URL Git; handle IG/TikTok resmi; harga Small Group & Workshop Pro; konfirmasi copy Premium vs Elite; foto tambahan coach + profil lengkap per coach (IELTS cert, jumlah atlet teredukasi, sports favorite); logo partner versi PNG transparan.

---

*Doc ini single source of truth — update tiap keputusan baru. Ditulis oleh opencode — plan mode resolved.*
