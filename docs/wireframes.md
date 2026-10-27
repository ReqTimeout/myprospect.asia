# WIREFRAMES — myprospect.asia (Mobile-First)

> Referensi: `plan.md` (design DNA, libs). Grid acuan **375px**, breakpoint utama: 380 / 768 / 1024.
> Notasi: `[M#]` = katalog animasi (plan.md bab 8) · `[A#]` = asset generate (plan.md bab 7) · `[WA]` = CTA WhatsApp.
> Prinsip: semua halaman end-to-end bertugas memperlihatkan nilai lalu menyodorkan WA. Dock ada di SEMUA halaman publik.

---

## 0. Dock Menu ala iPhone (komponen global)

```
┌──────────────────────────────────────────────┐
│  (160px konten … scroll)                     │
│                                              │
│ ╭──────────────────────────────────────────╮ │
│ │ ◉HOME │ ◎PROGRAM │ ◎WORKSHOP │ ◎BERITA │●➤│ │  ← dock glass
│ ╰──────────────────────────────────────────╯ │
│              ⌃ ________ safe area ⌃          │
└──────────────────────────────────────────────┘

Close-up dock (32px radius, blur 24px, bg rgba(10,10,10,.72), border rgba(255,255,255,.08)):
┌─────────┬──────────┬──────────┬─────────┬─────────┐
│   ⌂     │   ☰ ▤    │    ▦     │   ✎     │  (  WA  )│
│  HOME   │ PROGRAM  │ WORKSHOP │ BERITA  │   CHAT  │
└─────────┴──────────┴──────────┴─────────┴─────────┘
  aktif ikon naik 2px + scale 1.12 + dot gold ▮ di bawah ikon
  non-aktif: ikon outline putih 70% opacity, label tersembunyi
  WA-Action (tombol utama): lingkaran merah #C8232B, ikon WA putih,
  ring pulse lembut setiap 6s [M8], selalu sedikit lebih besar (tap magnet).
```

**State dock:**

| State | Perlakuan |
|---|---|
| default | translate-Y 0, muncul setelah hero (mulai selalu render, `opacity 0→1` saat halaman siap) |
| scroll-down cepat (>80px) | translateY(110%) + opacity 0 (mikro [M8]) |
| scroll-up / near-bottom | slide-in kembali |
| item tap | spring bounce (scale .96 → 1.06 → 1) + dot gold berpindah |

**Tombol WA besar** (terpisah di ujung kanan dock): lingkaran merah #C8232B, ikon WA putih, ring pulse halus tiap 6s [M8], selalu sedikit lebih besar sebagai "tap magnet".
| keyboard/focus (a11y) | dock `role="navigation"` + `aria-current="page"` |
| prefers-reduced-motion | tanpa spring; perpindahan instan |

**Desktop ≥1024px:** dock jadi top navbar sticky (gaya sama, layout horizontal), WA tetap floating kiri-bawah + popup bubble jadi kanan-bawah.

---

## 1. HOME — 13 Section

```
┌────────────────────────────────────┐
│ STRIP ATAS (transparan→blur saat   │
│ scroll ≥40px)                      │
│   [PROSPECT wordmark CSS italic]   │  ← bukan PNG
│   kiri: logo · kanan: [✆ WA kecil] │
├────────────────────────────────────┤
│ HERO ( layar penuh, bg [A1] 9:16 ) │
│   ┌──────────────────────────┐     │
│   │ ● #JADIATLETMODERN (gold)│     │  [M1] eyebrow muncul pertama
│   │                          │     │
│   │ JADI ATLET               │     │  [M1] reveal per kata,
│   │ MODERN DENGAN            │     │       skew -8deg, Anton
│   │ SPORTS COMM.             │     │
│   │                          │     │
│   │ Foto atlet studio hitam  │     │  ← aset klien (7 atlet + piala)
│   │ (cut-out + grain, mask)  │     │
│   └──────────────────────────┘     │
│   ┌──────────────────────────────┐ │
│   │ 2.175 ATLET ✦ 25 AKADEMI ✦ 6 │ │  [M2] counter
│   │ COACHES (chip-stats gold)    │ │
│   └──────────────────────────────┘ │
│   [ █ WA MERAH: DAFTAR SEKARANG ]  │  [WA] sticky tinta merah
│   sub: "Konsultasi via WhatsApp"   │
├────────────────────────────────────┤  ← dock slide-in
│ MARQUEE PARTNER [M3]               │
│  Djanur FA ⇄ Dream Baller ⇄ Jaya   │
│  Raya ⇄ MFC ⇄ SSBRBC ⇄ Little Pep  │
├────────────────────────────────────┤
│ APA ITU SPORTS COMMUNICATION [M9]  │
│   [foto workshop REAL, tilt M11]   │
│   2 kalimat ringkas                │
│   chip: Fun Comm Kids              │
│   chip: Young Athletes             │
│   chip: Digital Literacy + Brand   │
├────────────────────────────────────┤
│ LEVEL & JOURNEY [M5]               │
│  ┌──────┬──────────────┬─────────┐ │
│  │Basic │ Development  │ Impact  │ │  segmented (garis gold)
│  └──────┴──────────────┴─────────┘ │
│   ● Bulan 1  Berkomunikasi    ✔    │
│   ● Bulan 2  Expresi diri     ✔    │
│   ● Bulan 3  Mewakili tim          │
│   ● Bulan 4  Identitas diri        │  swipeable, auto-highlight
│   catatan: "via tes penempatan"    │
├────────────────────────────────────┤
│ PROGRAM UNGGULAN [M4] (swiper)     │
│   ┌── kartu Elite 1on1 ──────┐     │
│   │ chip "ONLINE"            │     │
│   │ 2.300.000 (strike)       │     │
│   │ ▇ PROMO 1.299.000 ▇ red  │     │
│   │ • 6 sesi · 60 mnt/ sesi  │     │
│   │ • e-cert + report        │     │
│   │ [WA →]                   │     │
│   └──────────────────────────┘     │
│   ┌── kartu Premium 1on1 ─────┐    │
│   │ badge ★ MEDIA NASIONAL    │    │
│   │ ▇ PROMO 2.499.000 ▇ gold  │    │
│   │ [WA →]                    │    │
│   └──────────────────────────┘    │
│   ┌── kartu Small Group 6-10 ─┐    │
│   │ harga TBD chip "via WA"   │    │
│   └──────────────────────────┘    │
│   ● ○ ○ (pagination embla)         │
├────────────────────────────────────┤
│ MEMBERSHIP (locked) [A3]           │
│   [ilustrasi gembok gold grain]    │
│   "Coming Soon"                    │
│   [WA: info early access]          │
├────────────────────────────────────┤
│ WORKSHOP AKADEMI [M9] [A4]         │
│   ilustrasi flat riso coach        │
│   Starter 90mnt · Premium 120mnt · │
│   Pro                              │
│   [WA: Booking Workshop]           │
│   micro-benefit: "pemberitaan di   │
│   portal media nasional"           │
├────────────────────────────────────┤
│ KATA MEREKA [M6] (embla)           │
│  [foto atlet] quote pendek         │
│  — Gohan · Akademi X · Sepakbola   │
│  swipe, 2-3 slide                  │
├────────────────────────────────────┤
│ COACHES [M9] (scroll-x snap)       │
│  [foto] Ferri (IELTS ✦ · 2.175     │
│  atlet)  [foto] Ilham … [foto] Ido │
├────────────────────────────────────┤
│ BERITA ATLET MODERN                │
│  [tab: Berita | Bintang | Kolab]   │
│  grid 2 kolom card [M9]            │
├────────────────────────────────────┤
│ FAQ [M10] (3-5)                    │
│   ▸ Apa itu Sports Communication?  │
│   ▸ Formatnya online/offline?      │
│   ▸ Berapa biaya?                  │
├────────────────────────────────────┤
│ CTA AKHIR [A5 pattern] [M12]       │
│   "Berani Bicara?" (Anton italic)  │
│   [ █ WA MERAH: Mulai via WhatsApp]│
│   footer: PT Kita Berani Bicara    │
│   IG/TikTok (link TBD)             │
└────────────────────────────────────┘
[ popup WA bubble [M7] — muncul 8 dtk / 40% scroll, 1x per sesi ]
```

**Penempatan WA berbeda di tiap section** (bukan satu tombol): Dock (5), strip atas, hero, tiap kartu program, membership, workshop, CTA akhir, popup — semuanya deep-link dgn pesan pre-filled spesifik & utm per sumber.

---

## 2. PROGRAM DETAIL — `/program/[slug]` (Elite-1on1 / premium-1on1 / small-group / membership)

```
┌────────────────────────────────────┐
│ ← back                           ⤴ │  share copy utm otomatis
│ HERO (bg [A1])                     │
│   chip ONline · 6 sesi             │
│   H1 Elite 1-on-1                  │
│   2.300.000 strike → PROMO red     │
│   ★ kalau Premium: badge media     │
│   [ █ WA: Konsultasi program ini ] │
├────────────────────────────────────┤
│ APA YANG AKAN DIKUASAI             │  checklist lucide ✓
├────────────────────────────────────┤
│ YANG DIDAPATKAN                    │  bullets + badge gold utk
│                                    │  pemberitaan media (Premium)
├────────────────────────────────────┤
│ JENJANG BULANAN (stepper 1-4) [M5] │
├────────────────────────────────────┤
│ TES PENEMPATAN: "level Basic/      │
│ Development/Impact dipilih via     │
│ tes penempatan sebelum sesi"       │
├────────────────────────────────────┤
│ TESTIMONI 1 kartu [M6]             │
├────────────────────────────────────┤
│ FAQ mini 3                         │
├────────────────────────────────────┤
│ CTA BAND: "Slot batch terbatas"    │
│ [ █ WA MERAH: Amankan slot ]       │
└─ dock ─────────────────────────────┘
```

## 3. WORKSHOP DETAIL — `/workshop/[slug]` (starter / premium / pro) — B2B

```
┌────────────────────────────────────┐
│ HERO [A4]                          │
│   chip: 1 sesi · 90/120 mnt        │
│   H1 Starter / Premium Workshop    │
│   harga per kelompok               │
│   benefit list + foto real aset    │
│ [ █ WA: Booking Workshop ]         │
├────────────────────────────────────┤
│ Cara membentuk program:            │
│  1. Konsultasi kebutuhan (WA)      │
│  2. Custom proposal & jadwal       │
│  3. Pelaksanaan + challenge        │
│  4. Report + pemberitaan media     │
├────────────────────────────────────┤
│ PARTNER YANG PERNAH KERJASAMA      │
│ (logo strip statis)                │
├────────────────────────────────────┤
│ FORM LEAD singkat (nama akademi,   │
│ PIC, jumlah atlet) [WA → redirect] │
└─ dock ─────────────────────────────┘
```

## 4. BERITA — `/berita` & `/berita/[slug]`

```
list:  header + tab kategori + grid 2 kolom card (foto, tag, tgl [M9])
detail: hero foto (cover real) → title (Anton) → prose (Plus Jakarta Sans)
        → prose typography → CTA inline band [WA]
        → related 2 kartu → dock
```

## 5. TENTANG — `/tentang`

```
hero: "Kenapa Berani Bicara?" → asal-usul (Ferri, ex-PERSIB/PSSI)
  → visi #JadiAtletModern
grid coaches 2 kolom (foto + chip IELTS + stats)
list partner + mitra (logo)
stats besar (counter) + CTA WA
```

## 6. FAQ / KONTAK — `/faq`

```
accordion 8-10 item [M10] grouped:
  Umum · Program · Workshop · Pembayaran via WA
CTA bawah: "Masih ragu? Tanya admin [WA]"
```

## 7. ADMIN — `/admin` (island Svelte, Access-protected)

### Mobile (tab-bawah gaya dock)
```
┌────────────────────────────────────┐
│ prospect ADMIN          (blur top) │
│ ┌─DASHBOARD─────────────────────┐  │
│ │ 12 leads hr ini  │ 46 klik WA │  │
│ │ 3 draft blog    │ 2 jadwal   │  │
│ └────────────────────────────────┘  │
│ Leads terbaru (3): [Baru][WA][…]    │
├─ tab: [D][L][K][M][S] ──────────────┤  dock admin mini
└─────────────────────────────────────┘
```

### Leads (inti!)
```
┌ Leads ────────────────── [⌄ filter] ┐
│ ● Baru  ◐ Dikontak  ◑ Terjadwal ✔ Daftar │
├───────────────────────────────────────┤
│ Nama (chip program)               ✆ WA │
│ catatan [edit inline]  [status pill]  │
│ "slot batch 3, tanya WO agustus"     │
├───────────────────────────────────────┤
│ + tombol [Export CSV] [Follow-up WA]  │
└───────────────────────────────────────┘
```

### Konten / Media / Pengaturan
```
Konten: tabs Program · Workshop · Testimoni · Coach · Blog
        editor inline sederhana (title, chip, harga, list,
        upload cover). Blog = MDX via form/editor minimal.
Media:  uploader drag&drop → R2 [progress] [copy URL]
Pengaturan: no WA, teks popup, toggle popup, GA4 ID, meta SEO,
        jadwal workshop, angka slot urgency.
```

### Desktop
```
┌ sidebar ──┬─ konten utamanya ───────────────────────────┐
│ DASHBRD   │ table lebar, form 2 kolom, preview ponsel    │
│ Leads ★5  │                                                │
│ Konten    │                                                │
│ Media     │                                                │
│ Pengaturan│                                                │
└───────────┴────────────────────────────────────────────────┘
```

## 8. Popup WA — tiga state

```
state 1 idle : tidak terlihat
state 2 show   : bubble muncul slide-up + fade (0.24s)
   ┌● admin ─────────────┐
   │ "Hai 👋 Mau tanya    │
   │  lebih jauh tentang  │
   │  program?"           │  ← teks disetel di Admin→Pengaturan
   │  [ Chat admin ↗ ]    │  ← WA deep-link + utm popup-copy
   └──────────────────────┘
state 3 dismiss: bubble hilang setelah klik-WA / tombol [×] (1x per sesi)
   popup sekali per sesi; tombol [×] dibubble; z di atas dock.
```

## 9. Peta halaman

| URL | Fungsi |
|---|---|
| `/` | Home 13 section |
| `/program/[slug]` | elite-1on1 · premium-1on1 · small-group · membership |
| `/workshop/[slug]` | starter · premium · pro |
| `/berita` + `/berita/[slug]` | blog (kategori Berita/Bintang/Kolaborasi) |
| `/tentang` | profil PT + coach + partner |
| `/faq` | FAQ + kontak |
| `/admin` | dashboard konten + leads |
| `/api/*` | leads · click · media · settings |

## 10. Catatan implementasi UI

- **Wordmark `PROSPECT`** dibangun pakai Anton + `transform: skewX(-8deg)`; letter-spacing -2%; bukan file gambar → ketajaman maksimal & bisa dibalik warna (putih di nav blur, hitam di footer terang).
- Kartu program memakai **angle-cut**: `clip-path: polygon(...)` sudut 8°, banner promo strip merah miring (ala aset).
- Foto klien pakai `object-fit: cover` + `object-position` top/bottom per crop; grain overlay tipis via CSS `mix-blend-mode: soft-light`.
- Sticky CTA WA hanya di halaman detail (program/workshop), bukan di seluruh situs (dock + popup sudah cukup di home) agar tidak baku.
- Semua ikon dari `lucide-svelte` konsisten stroke 2px.
- Dark mode default (DNA), tanpa toggle terang — kecuali blog yang bisa mau mode terang untuk kesederhanaan baca (lakukan belakangan kalau diminta).
