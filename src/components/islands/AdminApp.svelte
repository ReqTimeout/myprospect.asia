<script lang="ts">
  import { untrack } from 'svelte';
  import {
    Activity,
    AreaChart,
    BarChart3,
    ChevronUp,
    ChevronDown,
    FileText,
    Image as ImageIcon,
    LayoutDashboard,
    LogOut,
    ExternalLink,
    RefreshCw,
    Settings,
    Smartphone,
    Users,
  } from '@lucide/svelte';
  import AdminKonten from './AdminKonten.svelte';

  type Status = 'baru' | 'dikontak' | 'terjadwal' | 'daftar' | 'gagal';

  type Lead = {
    id: number;
    nama: string;
    wa: string;
    program: string | null;
    sumber: string;
    status: Status;
    catatan: string | null;
    created_at: string;
  };

  type Banding = { kini: number; sebelum: number };
  type Titik = { day: string; pv: number; uv: number; klik: number; lead: number };

  type Stats = {
    leadsTotal: number;
    leadsHariIni: number;
    klikWa7Hari: number;
    leadsBaru: number;
    hari: number;
    sejak: string;
    kpi: { pv: Banding; uv: Banding; klik: Banding; lead: Banding };
    konversi: { pvKeKlik: number; klikKeLead: number; pvKeLead: number };
    realtime: { pv30Menit: number; uv30Menit: number };
    konten: { beritaTerbit: number; leadMenang: number };
    deret: Titik[];
    halaman: { path: string; pv: number; uv: number }[];
    sumber: { domain: string; pv: number; uv: number }[];
    perangkat: { device: string; pv: number }[];
    cta: { slug: string; n: number }[];
    leadsTerbaru: {
      id: number;
      nama: string;
      wa: string;
      program: string | null;
      sumber: string;
      status: Status;
      created_at: string;
    }[];
  };

  type StatusMedia = { siap: boolean; bucket: string | null; langkah: string[] };
  type Berkas = { key: string; ukuran: number; waktu: string };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'analitik', label: 'Analitik', icon: BarChart3 },
    { id: 'leads', label: 'Leads', icon: Users },
    { id: 'konten', label: 'Konten', icon: FileText },
    { id: 'media', label: 'Media', icon: ImageIcon },
    { id: 'pengaturan', label: 'Pengaturan', icon: Settings },
  ] as const;

  const statusList: Status[] = ['baru', 'dikontak', 'terjadwal', 'daftar', 'gagal'];
  const statusLabel: Record<Status, string> = {
    baru: 'Baru',
    dikontak: 'Dikontak',
    terjadwal: 'Terjadwal',
    daftar: 'Daftar',
    gagal: 'Gagal',
  };
  const statusClass: Record<Status, string> = {
    baru: 'bg-brand text-white',
    dikontak: 'bg-gold text-ink',
    terjadwal: 'bg-sky-500 text-white',
    daftar: 'bg-emerald-500 text-white',
    gagal: 'bg-white/15 text-bone/60',
  };

  let tab = $state<(typeof tabs)[number]['id']>('dashboard');
  let stats = $state<Stats | null>(null);
  let leads = $state<Lead[]>([]);
  let filter = $state<'semua' | Status>('semua');
  let loading = $state(true);
  let menyegarkan = $state(false);
  let range = $state(14);
  let hover = $state(-1);
  let jam = $state('');
  let error = $state('');
  let editingCatatan = $state<number | null>(null);
  let catatanDraft = $state('');
  let saving = $state(false);

  let media = $state<StatusMedia | null>(null);
  let mediaSedangCek = $state(false);
  let mediaError = $state('');
  let berkas = $state<Berkas[]>([]);
  let sedangKirim = $state(false);
  let pesanMedia = $state('');
  let salahMedia = $state('');

  let settingsForm = $state({
    wa_number: '',
    popup_enabled: '1',
    popup_text: '',
    popup_delay_sec: '8',
    ga4_id: '',
  });
  let settingsLoaded = $state(false);
  let settingsSaving = $state(false);
  let settingsMsg = $state('');
  let settingsErr = $state('');

  async function api(path: string, init?: RequestInit): Promise<Response> {
    const res = await fetch(path, init);
    if (res.status === 401) {
      window.location.href = '/admin/login';
      throw new Error('unauthorized');
    }
    if (!res.ok) throw new Error(await res.text());
    return res;
  }

  async function loadStats() {
    const res = await api('/api/admin/stats?hari=' + range);
    stats = (await res.json()) as Stats;
  }

  async function loadLeads() {
    const q = filter === 'semua' ? '' : `?status=${filter}`;
    const res = await api('/api/admin/leads' + q);
    leads = (await res.json()) as Lead[];
  }

  async function refresh() {
    error = '';
    // data lama tetap tampil saat periode berganti — cuma indikator yang berputar,
    // dashboard tidak berkedip jadi skeleton lagi
    if (!stats) loading = true;
    else menyegarkan = true;
    try {
      await Promise.all([loadStats(), loadLeads()]);
      jam = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      if ((e as Error).message !== 'unauthorized') error = 'Gagal memuat data. Coba lagi.';
    } finally {
      loading = false;
      menyegarkan = false;
    }
  }

  async function loadMedia() {
    mediaSedangCek = true;
    mediaError = '';
    try {
      const res = await api('/api/admin/media');
      media = (await res.json()) as StatusMedia;
      if (media.siap) await daftarBerkas();
    } catch (e) {
      if ((e as Error).message !== 'unauthorized') mediaError = 'Gagal memeriksa status R2.';
    } finally {
      mediaSedangCek = false;
    }
  }

  async function daftarBerkas() {
    try {
      const res = await api('/api/admin/upload');
      berkas = ((await res.json()) as { berkas: Berkas[] }).berkas ?? [];
    } catch {
      berkas = [];
    }
  }

  async function kirimBerkas(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    const f = input.files?.[0];
    if (!f) return;
    sedangKirim = true;
    pesanMedia = '';
    salahMedia = '';
    try {
      const fd = new FormData();
      fd.append('file', f);
      const res = await api('/api/admin/upload', { method: 'POST', body: fd });
      const r = (await res.json()) as { key: string };
      pesanMedia = `Terunggah ke ${r.key}`;
      await daftarBerkas();
    } catch (err) {
      const m = (err as Error).message || '';
      salahMedia = /R2 belum aktif/i.test(m) ? m : 'Upload gagal — periksa tipe & ukuran berkas (maks 5 MB).';
    } finally {
      sedangKirim = false;
      input.value = '';
    }
  }

  function ukuran(v: number): string {
    return v > 1024 * 1024 ? `${(v / 1024 / 1024).toFixed(1)} MB` : `${Math.round(v / 1024)} KB`;
  }

  $effect(() => {
    const t = tab;
    const r = range;
    if (t === 'dashboard' || t === 'analitik' || t === 'leads') {
      untrack(() => refresh());
    } else if (t === 'pengaturan') {
      untrack(() => loadSettings());
    } else if (t === 'media') {
      untrack(() => loadMedia());
    }
    void r;
  });

  async function loadSettings() {
    settingsMsg = '';
    settingsErr = '';
    try {
      const res = await api('/api/admin/settings');
      const s = (await res.json()) as Record<string, string>;
      settingsForm = {
        wa_number: s.wa_number ?? '',
        popup_enabled: s.popup_enabled ?? '1',
        popup_text: s.popup_text ?? '',
        popup_delay_sec: s.popup_delay_sec ?? '8',
        ga4_id: s.ga4_id ?? '',
      };
      settingsLoaded = true;
    } catch (e) {
      if ((e as Error).message !== 'unauthorized') settingsErr = 'Gagal memuat pengaturan.';
    }
  }

  async function saveSettings(e?: Event) {
    e?.preventDefault();
    settingsSaving = true;
    settingsMsg = '';
    settingsErr = '';
    try {
      const res = await api('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsForm),
      });
      if (!res.ok) throw new Error(await res.text());
      settingsMsg = 'Tersimpan. Popup & nomor WA langsung aktif — GA4 aktif di muat halaman berikutnya.';
    } catch (e2) {
      if ((e2 as Error).message !== 'unauthorized') settingsErr = (e2 as Error).message || 'Gagal menyimpan.';
    } finally {
      settingsSaving = false;
    }
  }

  async function setFilter(f: 'semua' | Status) {
    if (filter === f) return;
    filter = f;
    loading = true;
    try {
      await loadLeads();
    } catch (e) {
      if ((e as Error).message !== 'unauthorized') error = 'Gagal memuat leads.';
    } finally {
      loading = false;
    }
  }

  async function setStatus(id: number, status: Status) {
    const prev = leads;
    leads = leads.map((l) => (l.id === id ? { ...l, status } : l));
    try {
      await api('/api/admin/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      await loadStats();
    } catch {
      leads = prev;
      error = 'Gagal menyimpan status.';
    }
  }

  function startCatatan(l: Lead) {
    editingCatatan = l.id;
    catatanDraft = l.catatan ?? '';
  }

  async function saveCatatan(id: number) {
    saving = true;
    try {
      await api('/api/admin/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, catatan: catatanDraft }),
      });
      leads = leads.map((l) => (l.id === id ? { ...l, catatan: catatanDraft } : l));
      editingCatatan = null;
    } catch {
      error = 'Gagal menyimpan catatan.';
    } finally {
      saving = false;
    }
  }

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    window.location.href = '/admin/login';
  }

  function waHref(l: Lead): string {
    const text = `Halo ${l.nama}! Saya admin Prospect Asia (${l.program ?? 'program'}). Balasan untuk pendaftaran Anda.`;
    return `https://wa.me/${l.wa}?text=${encodeURIComponent(text)}`;
  }

  function shortDate(s: string): string {
    return s.slice(0, 10);
  }

  // ---------- grafik: SVG murni, tanpa library, ikut lebar wadah via viewBox ----------
  const GW = 720;
  const GH = 230;
  const GT = 16; // ruang atas
  const GB = 212; // garis dasar

  function batasAtas(deret: Titik[]): number {
    const m = deret.reduce((a, d) => Math.max(a, d.pv, d.uv), 0);
    if (m <= 4) return 4;
    return Math.ceil(m / 4) * 4;
  }

  function xKe(i: number, n: number): number {
    return n <= 1 ? GW / 2 : (i * GW) / (n - 1);
  }

  function yKe(v: number, max: number): number {
    return GB - (Math.max(0, v) / max) * (GB - GT);
  }

  function garis(vals: number[], max: number): string {
    return vals.map((v, i) => `${i ? 'L' : 'M'}${xKe(i, vals.length).toFixed(1)} ${yKe(v, max).toFixed(1)}`).join(' ');
  }

  function wilayah(vals: number[], max: number): string {
    if (!vals.length) return '';
    return `${garis(vals, max)} L${xKe(vals.length - 1, vals.length).toFixed(1)} ${GB} L0 ${GB} Z`;
  }

  function spark(vals: number[]): string {
    if (vals.length < 2) return '';
    const max = Math.max(...vals, 1);
    return vals
      .map((v, i) => `${i ? 'L' : 'M'}${((i * 100) / (vals.length - 1)).toFixed(1)} ${(28 - (v / max) * 24).toFixed(1)}`)
      .join(' ');
  }

  const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

  function labelHari(iso: string): string {
    const [, m, d] = iso.split('-');
    return `${Number(d)} ${BULAN[Number(m) - 1] ?? ''}`;
  }

  function arah(b: Banding): { naik: boolean; turun: boolean; tebal: boolean; teks: string } {
    if (!b.sebelum) return b.kini > 0 ? { naik: true, turun: false, tebal: false, teks: `+${b.kini}` } : { naik: false, turun: false, tebal: true, teks: '0' };
    const p = ((b.kini - b.sebelum) / b.sebelum) * 100;
    if (p > 0.5) return { naik: true, turun: false, tebal: false, teks: `${Math.round(p)}%` };
    if (p < -0.5) return { naik: false, turun: true, tebal: false, teks: `${Math.round(Math.abs(p))}%` };
    return { naik: false, turun: false, tebal: true, teks: 'tetap' };
  }

  const deviceLabel: Record<string, string> = {
    mobile: 'Mobile',
    desktop: 'Desktop',
    tablet: 'Tablet',
    bot: 'Bot/CLI',
    unknown: 'Lainnya',
  };

  function persen(part: number, whole: number): number {
    return whole > 0 ? Math.max(2, Math.round((part / whole) * 100)) : 0;
  }

  function labelPath(p: string): string {
    return p === '/' ? '/ (beranda)' : p.replace(/\/$/, '') || p;
  }

  const titikPv = $derived((stats?.deret ?? []).map((d) => d.pv));
  const titikUv = $derived((stats?.deret ?? []).map((d) => d.uv));
  const titikKlik = $derived((stats?.deret ?? []).map((d) => d.klik));
  const titikLead = $derived((stats?.deret ?? []).map((d) => d.lead));
  const atap = $derived(batasAtas(stats?.deret ?? []));
  const adaTrafik = $derived((stats?.kpi.pv.kini ?? 0) > 0);
  const titikAktif = $derived(hover >= 0 ? (stats?.deret ?? [])[hover] : undefined);
  const corong = $derived(
    stats
      ? [
          { label: 'Kunjungan', nilai: stats.kpi.pv.kini, warna: 'bone' },
          { label: 'Klik WhatsApp', nilai: stats.kpi.klik.kini, warna: 'brand' },
          { label: 'Lead masuk', nilai: stats.kpi.lead.kini, warna: 'gold' },
        ]
      : [],
  );
  const puncakCorong = $derived(corong.reduce((a, c) => Math.max(a, c.nilai), 1));
  const deltaUv = $derived(arah(stats?.kpi.uv ?? { kini: 0, sebelum: 0 }));
</script>

<div class="flex min-h-dvh flex-col bg-ink text-bone">
  <header class="sticky top-0 z-30 border-b border-white/10 bg-ink/85 backdrop-blur-xl">
    <div class="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
      <div class="flex items-center gap-3">
        <span class="grid h-9 w-9 place-items-center rounded-xl bg-brand text-white shadow-[0_8px_24px_-10px_rgba(200,35,43,.9)]">
          <Activity size={17} />
        </span>
        <div class="leading-tight">
          <p class="display skew-mark text-lg">Prospect</p>
          <p class="text-[9px] font-black tracking-[0.22em] text-gold uppercase">Admin Console</p>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <button
          type="button"
          onclick={() => refresh()}
          disabled={menyegarkan || loading}
          class="hidden items-center gap-1.5 rounded-xl border border-white/12 px-3 py-2 text-[11px] font-bold text-bone/60 transition hover:border-gold/45 hover:text-bone focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none disabled:opacity-50 sm:flex"
        >
          <span class={menyegarkan || loading ? 'putar' : ''}><RefreshCw size={13} /></span>
          {jam ? `Diperbarui ${jam}` : 'Muat ulang'}
        </button>
        <button
          type="button"
          onclick={logout}
          class="flex items-center gap-1.5 rounded-xl border border-white/15 px-3 py-2 text-xs font-bold text-bone/70 transition hover:border-brand hover:text-brand focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none active:scale-95"
        >
          <LogOut size={14} />
          Keluar
        </button>
      </div>
    </div>
  </header>

  <div class="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 pt-6 pb-28 sm:px-6 lg:flex-row lg:gap-8 lg:pb-8">
    <nav class="hidden w-56 shrink-0 lg:block" aria-label="Menu admin">
      <p class="mb-3 px-3 text-[10px] font-black tracking-[0.2em] text-bone/35 uppercase">Navigasi</p>
      <ul class="space-y-1">
        {#each tabs as t (t.id)}
          {@const badge =
            t.id === 'leads' ? (stats?.leadsBaru ?? 0) : t.id === 'konten' ? (stats?.konten.beritaTerbit ?? 0) : 0}
          <li class="relative">
            <button
              type="button"
              onclick={() => (tab = t.id)}
              class={[
                'flex w-full items-center gap-2.5 rounded-2xl px-3.5 py-2.5 text-sm font-bold transition focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none active:scale-[0.98]',
                tab === t.id
                  ? 'bg-brand text-white shadow-[0_14px_30px_-16px_rgba(200,35,43,.95)]'
                  : 'text-bone/55 hover:bg-white/5 hover:text-bone',
              ]}
            >
              <t.icon size={16} />
              {t.label}
            </button>
            {#if badge > 0}
              <span
                class="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 rounded-full px-2 py-0.5 text-[10px] font-black {tab ===
                  t.id
                  ? 'bg-white/25 text-white'
                  : 'bg-gold/20 text-gold'}"
              >
                {badge}
              </span>
            {/if}
          </li>
        {/each}
      </ul>

      {#if stats}
        <div class="mt-6 rounded-3xl border border-white/10 bg-white/4 p-4">
          <p class="text-[10px] font-black tracking-[0.2em] text-bone/40 uppercase">Sedang aktif</p>
          <p class="display mt-1 text-3xl leading-none">{stats.realtime.uv30Menit}</p>
          <p class="mt-1 text-[11px] font-bold text-bone/50">pengunjung · 30 menit terakhir</p>
          <p class="mt-2 flex items-center gap-1.5 text-[11px] font-bold text-emerald-400">
            <span class="detak h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
            {stats.realtime.pv30Menit} halaman dilihat
          </p>
        </div>
      {/if}
    </nav>

    <main class="min-w-0 flex-1">
      {#if error}
        <p class="mb-4 rounded-2xl border border-brand/40 bg-brand/10 px-4 py-3 text-sm text-bone/90">{error}</p>
      {/if}

      {#if tab === 'dashboard'}
        {#if loading && !stats}
          <div class="space-y-4" aria-live="polite">
            <div class="skel h-40 rounded-[28px]"></div>
            <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {#each Array(4) as _, i (i)}
                <div class="skel h-36 rounded-3xl"></div>
              {/each}
            </div>
            <div class="skel h-72 rounded-[28px]"></div>
          </div>
        {:else if stats}
          {@const n = stats.deret.length}

          <section class="hero-band rise relative overflow-hidden rounded-[28px] border border-white/10 p-5 sm:p-6">
            <div class="relative flex flex-wrap items-start justify-between gap-5">
              <div class="min-w-0">
                <p class="text-[10px] font-black tracking-[0.22em] text-gold uppercase">
                  Ringkasan {range} hari
                </p>
                <div class="mt-2 flex flex-wrap items-end gap-x-4 gap-y-1">
                  <p class="display text-5xl leading-none sm:text-6xl">{stats.kpi.uv.kini}</p>
                  <div class="pb-1">
                    <p class="text-sm font-bold text-bone/85">pengunjung unik</p>
                    <span
                      class={[
                        'mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-black',
                        deltaUv.naik
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : deltaUv.turun
                            ? 'bg-brand/15 text-brand'
                            : 'bg-white/10 text-bone/55',
                      ]}
                    >
                      {#if deltaUv.naik}<ChevronUp size={12} />{:else if deltaUv.turun}<ChevronDown size={12} />{/if}
                      {deltaUv.teks}
                      {#if !deltaUv.tebal}<span class="font-bold opacity-70">vs periode lalu</span>{/if}
                    </span>
                  </div>
                </div>
                <p class="mt-3 text-xs text-bone/50">
                  {stats.kpi.pv.kini} halaman dilihat · {stats.realtime.uv30Menit} orang aktif 30 menit terakhir ·
                  konversi kunjungan&nbsp;&rarr;&nbsp;lead {stats.konversi.pvKeLead}%
                </p>
              </div>

              <div class="flex shrink-0 items-center gap-1 rounded-2xl border border-white/10 bg-ink/40 p-1" role="group" aria-label="Periode analitik">
                {#each [7, 14, 30] as r (r)}
                  <button
                    type="button"
                    aria-pressed={range === r}
                    onclick={() => (range = r)}
                    class={[
                      'rounded-xl px-3 py-2 text-xs font-bold transition focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none active:scale-95',
                      range === r ? 'bg-gold text-ink' : 'text-bone/55 hover:text-bone',
                    ]}
                  >
                    {r}h
                  </button>
                {/each}
              </div>
            </div>
          </section>

          <div class="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {#each [
              { key: 'uv', label: 'Pengunjung unik', nilai: stats.kpi.uv, deret: titikUv, warna: '#c8232b', ikon: Users },
              { key: 'pv', label: 'Halaman dilihat', nilai: stats.kpi.pv, deret: titikPv, warna: '#f6b93b', ikon: AreaChart },
              { key: 'klik', label: 'Klik WhatsApp', nilai: stats.kpi.klik, deret: titikKlik, warna: '#25d366', ikon: ExternalLink },
              { key: 'lead', label: 'Lead masuk', nilai: stats.kpi.lead, deret: titikLead, warna: '#8b5cf6', ikon: Activity },
            ] as k (k.key)}
              {@const d = arah(k.nilai)}
              <article class="rise kartu bg-white/4.5 p-4 sm:p-5">
                <div class="flex items-start justify-between gap-2">
                  <p class="text-[10px] font-black tracking-[0.16em] text-bone/45 uppercase">{k.label}</p>
                  <k.ikon size={15} class="text-bone/35" />
                </div>
                <p class="display mt-2 text-4xl leading-none">{k.nilai.kini}</p>
                <div class="mt-3 flex items-end justify-between gap-3">
                  <span
                    class={[
                      'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black',
                      d.naik ? 'bg-emerald-500/15 text-emerald-400' : d.turun ? 'bg-brand/15 text-brand' : 'bg-white/10 text-bone/50',
                    ]}
                  >
                    {#if d.naik}<ChevronUp size={11} />{:else if d.turun}<ChevronDown size={11} />{/if}
                    {d.teks}
                  </span>
                  <svg viewBox="0 0 100 30" class="h-8 w-24 shrink-0 overflow-visible" aria-hidden="true">
                    <path d={spark(k.deret)} fill="none" stroke={k.warna} stroke-width="2" stroke-linecap="round" pathLength={1} class="jejak" />
                  </svg>
                </div>
                <p class="mt-2 text-[10px] font-bold text-bone/35">periode lalu {k.nilai.sebelum}</p>
              </article>
            {/each}
          </div>

          <div class="mt-4 grid gap-4 xl:grid-cols-3">
            <section class="rise kartu bg-white/4.5 p-4 sm:p-5 xl:col-span-2">
              <div class="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 class="display text-xl">Trafik harian</h2>
                  <p class="mt-0.5 text-[11px] text-bone/45">{labelHari(stats.sejak)} &rarr; hari ini (WIB)</p>
                </div>
                <div class="flex items-center gap-3 text-[11px] font-bold">
                  <span class="flex items-center gap-1.5 text-bone/70"><i class="h-2 w-4 rounded-full bg-brand"></i>Halaman</span>
                  <span class="flex items-center gap-1.5 text-bone/70"><i class="h-2 w-4 rounded-full bg-gold"></i>Pengunjung</span>
                </div>
              </div>

              <div class="relative mt-4" role="img" aria-label={`Grafik trafik ${range} hari terakhir`}>
                <svg viewBox="0 0 {GW} {GH}" class="h-56 w-full sm:h-64" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="pvWash" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stop-color="#c8232b" stop-opacity="0.42" />
                      <stop offset="100%" stop-color="#c8232b" stop-opacity="0" />
                    </linearGradient>
                  </defs>

                  {#each [0, 0.5, 1] as p (p)}
                    {@const y = GB - p * (GB - GT)}
                    <line x1="0" y1={y} x2={GW} y2={y} stroke="rgba(255,255,255,.09)" stroke-width="1" stroke-dasharray="3 5" />
                    <text x="4" y={y - 4} class="sumbu">{Math.round(atap * p)}</text>
                  {/each}
                  <line x1="0" y1={GB} x2={GW} y2={GB} stroke="rgba(255,255,255,.18)" stroke-width="1" />

                  <path d={wilayah(titikPv, atap)} fill="url(#pvWash)" class="wash" />
                  <path d={garis(titikPv, atap)} fill="none" stroke="#c8232b" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" pathLength={1} class="jejak" />
                  <path d={garis(titikUv, atap)} fill="none" stroke="#f6b93b" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" pathLength={1} class="jejak tebat" />

                  {#each stats.deret as d, i (d.day)}
                    <!-- titik per hari: tanpa ini hari tunggal dengan trafik cuma terlihat
                         sebagai garis datar di dasar grafik -->
                    {#if d.pv > 0}
                      <circle cx={xKe(i, n)} cy={yKe(d.pv, atap)} r="3.6" fill="#c8232b" stroke="rgb(255 252 247 / .85)" stroke-width="1.4" />
                    {/if}
                    {#if d.uv > 0}
                      <circle cx={xKe(i, n)} cy={yKe(d.uv, atap)} r="3" fill="#f6b93b" stroke="rgb(255 252 247 / .85)" stroke-width="1.4" />
                    {/if}
                  {/each}

                  {#if titikAktif}
                    <circle cx={xKe(hover, n)} cy={yKe(titikAktif.pv, atap)} r="5" fill="#c8232b" stroke="#fffcf7" stroke-width="2" />
                    <circle cx={xKe(hover, n)} cy={yKe(titikAktif.uv, atap)} r="4" fill="#f6b93b" stroke="#fffcf7" stroke-width="2" />
                  {/if}

                  {#each stats.deret as d, i (d.day)}
                    <rect
                      class="kolom"
                      x={xKe(i, n) - GW / n / 2}
                      y={GT - 10}
                      width={GW / n}
                      height={GB - GT + 10}
                      onpointerenter={() => (hover = i)}
                      onpointerleave={() => (hover = -1)}
                      onclick={() => (hover = hover === i ? -1 : i)}
                    />
                  {/each}
                </svg>

                {#if titikAktif}
                  <div
                    class="pointer-events-none absolute -top-1 z-10 -translate-x-1/2 rounded-2xl border border-white/15 bg-ink/95 px-3 py-2 text-[11px] font-bold shadow-2xl backdrop-blur"
                    style="left: {Math.min(88, Math.max(12, (hover / Math.max(1, n - 1)) * 100))}%"
                  >
                    <p class="text-bone/60">{labelHari(titikAktif.day)}</p>
                    <p class="mt-0.5 text-brand">{titikAktif.pv} halaman</p>
                    <p class="text-gold">{titikAktif.uv} pengunjung</p>
                    <p class="text-bone/70">{titikAktif.klik} klik WA · {titikAktif.lead} lead</p>
                  </div>
                {:else if !adaTrafik}
                  <p class="absolute inset-0 grid place-items-center text-center text-xs text-bone/45">
                    Belum ada trafik tercatat pada periode ini.<br />Bagikan tautan / cek halaman situs lalu muat ulang panel ini.
                  </p>
                {/if}
              </div>

              <div class="mt-2 flex justify-between text-[10px] font-bold text-bone/35">
                {#each stats.deret.filter((_, i) => i % Math.ceil(n / 5) === 0 || i === n - 1) as d (d.day)}
                  <span>{labelHari(d.day)}</span>
                {/each}
              </div>
            </section>

            <section class="rise kartu bg-white/4.5 p-4 sm:p-5">
              <h2 class="display text-xl">Corong konversi</h2>
              <p class="mt-0.5 text-[11px] text-bone/45">{range} hari terakhir</p>

              <ul class="mt-4 space-y-3.5">
                {#each corong as c, i (c.label)}
                  <li>
                    <div class="flex items-baseline justify-between gap-2">
                      <span class="text-xs font-bold text-bone/75">{i + 1}. {c.label}</span>
                      <span class="display text-xl">{c.nilai}</span>
                    </div>
                    <div class="mt-1.5 h-2.5 overflow-hidden rounded-full bg-white/8">
                      <div
                        class="muluk h-full rounded-full"
                        style="width: {persen(c.nilai, puncakCorong)}%; background: {c.warna === 'bone'
                          ? 'linear-gradient(90deg,#ffb703,#f6b93b)'
                          : c.warna === 'brand'
                            ? 'linear-gradient(90deg,#ff5a5f,#c8232b)'
                            : 'linear-gradient(90deg,#f6b93b,#e0a419)'}"
                      ></div>
                    </div>
                    {#if i < corong.length - 1}
                      <p class="mt-1 text-[10px] font-bold text-bone/40">
                        {persen(corong[i + 1].nilai, Math.max(1, c.nilai))}% lanjut ke langkah berikutnya
                      </p>
                    {/if}
                  </li>
                {/each}
              </ul>

              <div class="mt-4 grid grid-cols-2 gap-2 border-t border-white/10 pt-4 text-center">
                <div>
                  <p class="display text-2xl text-gold">{stats.konversi.pvKeKlik}%</p>
                  <p class="text-[10px] font-bold text-bone/45">kunjungan &rarr; klik WA</p>
                </div>
                <div>
                  <p class="display text-2xl text-brand">{stats.konversi.klikKeLead}%</p>
                  <p class="text-[10px] font-bold text-bone/45">klik WA &rarr; lead</p>
                </div>
              </div>
            </section>
          </div>

          <div class="mt-4 grid gap-4 lg:grid-cols-2">
            <section class="rise kartu bg-white/4.5 p-4 sm:p-5">
              <div class="flex items-center justify-between gap-3">
                <h2 class="display text-xl">Halaman terpopuler</h2>
                <button
                  type="button"
                  onclick={() => (tab = 'analitik')}
                  class="rounded-xl border border-white/15 px-3 py-1.5 text-[11px] font-bold text-gold transition hover:border-gold/50 focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
                >
                  Detail analitik
                </button>
              </div>
              {#if stats.halaman.length === 0}
                <p class="mt-4 rounded-2xl border border-dashed border-white/15 p-6 text-center text-xs text-bone/45">
                  Belum ada data halaman.
                </p>
              {:else}
                <ul class="mt-3 space-y-2.5">
                  {#each stats.halaman.slice(0, 5) as h (h.path)}
                    <li>
                      <div class="flex items-baseline justify-between gap-3">
                        <p class="min-w-0 truncate text-xs font-bold text-bone/85">{labelPath(h.path)}</p>
                        <p class="shrink-0 text-[11px] font-black text-gold">{h.pv}<span class="text-bone/40"> pv</span></p>
                      </div>
                      <div class="mt-1 h-1.5 overflow-hidden rounded-full bg-white/8">
                        <div class="muluk h-full rounded-full bg-brand/80" style="width: {persen(h.pv, stats.halaman[0].pv)}%"></div>
                      </div>
                    </li>
                  {/each}
                </ul>
              {/if}
            </section>

            <section class="rise kartu bg-white/4.5 p-4 sm:p-5">
              <div class="flex items-center justify-between gap-3">
                <h2 class="display text-xl">Lead terbaru</h2>
                <button
                  type="button"
                  onclick={() => (tab = 'leads')}
                  class="rounded-xl border border-white/15 px-3 py-1.5 text-[11px] font-bold text-gold transition hover:border-gold/50 focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
                >
                  Kelola leads
                </button>
              </div>
              {#if stats.leadsTerbaru.length === 0}
                <p class="mt-4 rounded-2xl border border-dashed border-white/15 p-6 text-center text-xs text-bone/45">
                  Belum ada lead. Lead masuk lewat formulir halaman program/workshop.
                </p>
              {:else}
                <ul class="mt-3 divide-y divide-white/8">
                  {#each stats.leadsTerbaru as l (l.id)}
                    <li class="flex items-center justify-between gap-3 py-2.5">
                      <div class="min-w-0">
                        <p class="truncate text-sm font-bold">{l.nama}</p>
                        <p class="truncate text-[11px] text-bone/45">{l.program ?? '—'} · {shortDate(l.created_at)}</p>
                      </div>
                      <span class:list={['shrink-0 rounded-full px-2.5 py-1 text-[9px] font-black tracking-wider uppercase', statusClass[l.status]]}>
                        {statusLabel[l.status]}
                      </span>
                    </li>
                  {/each}
                </ul>
              {/if}
            </section>
          </div>

          <p class="mt-5 text-[11px] text-bone/40">
            Trafik dihitung dari beacon halaman milik sendiri (penyimpanan di D1), tanpa IP mentah & tanpa cookie
            pihak ketiga. Angka dapat sedikit berbeda dari GA4.
          </p>
        {/if}

      {:else if tab === 'analitik'}
        {#if loading && !stats}
          <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {#each Array(6) as _, i (i)}
              <div class="skel h-44 rounded-3xl"></div>
            {/each}
          </div>
        {:else if stats}
          <div class="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 class="display text-3xl sm:text-4xl">Analitik trafik</h1>
              <p class="mt-1 text-sm text-bone/55">Sumber pengunjung, halaman, perangkat, dan CTA WhatsApp.</p>
            </div>
            <div class="flex items-center gap-1 rounded-2xl border border-white/10 bg-ink/40 p-1" role="group" aria-label="Periode analitik">
              {#each [7, 14, 30] as r (r)}
                <button
                  type="button"
                  aria-pressed={range === r}
                  onclick={() => (range = r)}
                  class={[
                    'rounded-xl px-3 py-2 text-xs font-bold transition focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none active:scale-95',
                    range === r ? 'bg-gold text-ink' : 'text-bone/55 hover:text-bone',
                  ]}
                >
                  {r} hari
                </button>
              {/each}
            </div>
          </div>

          <div class="mt-5 grid gap-4 lg:grid-cols-2">
            <section class="rise kartu bg-white/4.5 p-4 sm:p-5">
              <h2 class="display text-xl">Sumber trafik</h2>
              <p class="mt-0.5 text-[11px] text-bone/45">Domain yang mengarahkan pengunjung ke situs</p>
              {#if stats.sumber.length === 0}
                <p class="mt-4 rounded-2xl border border-dashed border-white/15 p-6 text-center text-xs text-bone/45">
                  Semua kunjungan datang langsung (tanpa referrer) — biasanya dari link bio / share chat.
                </p>
              {:else}
                <ul class="mt-3 space-y-2.5">
                  {#each stats.sumber as s (s.domain)}
                    <li class="flex items-center gap-3">
                      <span class="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-white/6 text-[11px] font-black text-gold uppercase">
                        {s.domain.slice(0, 2)}
                      </span>
                      <div class="min-w-0 flex-1">
                        <div class="flex items-baseline justify-between gap-2">
                          <p class="truncate text-xs font-bold">{s.domain}</p>
                          <p class="shrink-0 text-[11px] font-black text-bone/60">{s.pv} pv · {s.uv} uv</p>
                        </div>
                        <div class="mt-1 h-1.5 overflow-hidden rounded-full bg-white/8">
                          <div class="muluk h-full rounded-full bg-gold/85" style="width: {persen(s.pv, stats.sumber[0].pv)}%"></div>
                        </div>
                      </div>
                    </li>
                  {/each}
                </ul>
              {/if}
            </section>

            <section class="rise kartu bg-white/4.5 p-4 sm:p-5">
              <h2 class="display text-xl">Perangkat pengunjung</h2>
              <p class="mt-0.5 text-[11px] text-bone/45">Dipakai untuk memutuskan tata letak mana yang lebih dulu</p>
              {#if stats.perangkat.length === 0}
                <p class="mt-4 rounded-2xl border border-dashed border-white/15 p-6 text-center text-xs text-bone/45">Belum ada data.</p>
              {:else}
                <div class="mt-4 flex h-3 overflow-hidden rounded-full bg-white/8">
                  {#each stats.perangkat as p, i (p.device)}
                    <div
                      class="muluk h-full"
                      style="width: {persen(p.pv, stats.kpi.pv.kini)}%; background: {['#c8232b', '#f6b93b', '#25d366', '#8b5cf6', '#38bdf8'][i % 5]}"
                    ></div>
                  {/each}
                </div>
                <ul class="mt-4 space-y-2">
                  {#each stats.perangkat as p, i (p.device)}
                    <li class="flex items-center justify-between gap-3 text-xs font-bold">
                      <span class="flex items-center gap-2 text-bone/80">
                        <i class="h-2.5 w-2.5 rounded-full" style="background: {['#c8232b', '#f6b93b', '#25d366', '#8b5cf6', '#38bdf8'][i % 5]}"></i>
                        {deviceLabel[p.device] ?? p.device}
                      </span>
                      <span class="text-bone/55">{p.pv} pv · {persen(p.pv, stats.kpi.pv.kini)}%</span>
                    </li>
                  {/each}
                </ul>
              {/if}
            </section>

            <section class="rise kartu bg-white/4.5 p-4 sm:p-5">
              <h2 class="display text-xl">Semua halaman</h2>
              <p class="mt-0.5 text-[11px] text-bone/45">{range} hari terakhir</p>
              {#if stats.halaman.length === 0}
                <p class="mt-4 rounded-2xl border border-dashed border-white/15 p-6 text-center text-xs text-bone/45">Belum ada data.</p>
              {:else}
                <table class="mt-3 w-full text-left text-xs">
                  <thead>
                    <tr class="text-[10px] font-black tracking-wider text-bone/40 uppercase">
                      <th class="pb-2">Halaman</th>
                      <th class="pb-2 text-right">PV</th>
                      <th class="pb-2 text-right">UV</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-white/8">
                    {#each stats.halaman as h (h.path)}
                      <tr>
                        <td class="max-w-0 truncate py-2.5 font-bold text-bone/85">{labelPath(h.path)}</td>
                        <td class="py-2.5 text-right font-black text-gold">{h.pv}</td>
                        <td class="py-2.5 text-right text-bone/55">{h.uv}</td>
                      </tr>
                    {/each}
                  </tbody>
                </table>
              {/if}
            </section>

            <section class="rise kartu bg-white/4.5 p-4 sm:p-5">
              <h2 class="display text-xl">Tombol WhatsApp paling diklik</h2>
              <p class="mt-0.5 text-[11px] text-bone/45">Slug CTA dari tabel wa_clicks</p>
              {#if stats.cta.length === 0}
                <p class="mt-4 rounded-2xl border border-dashed border-white/15 p-6 text-center text-xs text-bone/45">Belum ada klik.</p>
              {:else}
                <ul class="mt-3 space-y-2.5">
                  {#each stats.cta as c (c.slug)}
                    <li class="flex items-center justify-between gap-3">
                      <p class="min-w-0 truncate font-mono text-[11px] font-bold text-bone/80">{c.slug}</p>
                      <div class="flex shrink-0 items-center gap-2">
                        <div class="h-1.5 w-20 overflow-hidden rounded-full bg-white/8">
                          <div class="muluk h-full rounded-full bg-[#25d366]" style="width: {persen(c.n, stats.cta[0].n)}%"></div>
                        </div>
                        <span class="w-6 text-right text-xs font-black">{c.n}</span>
                      </div>
                    </li>
                  {/each}
                </ul>
              {/if}
            </section>
          </div>

          <div class="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {#each [
              { l: 'Pengunjung unik', v: stats.kpi.uv.kini, s: 'uv' },
              { l: 'Halaman dilihat', v: stats.kpi.pv.kini, s: 'pv' },
              { l: 'Klik WhatsApp', v: stats.kpi.klik.kini, s: 'klik' },
              { l: 'Lead masuk', v: stats.kpi.lead.kini, s: 'lead' },
            ] as x (x.s)}
              <div class="rounded-2xl border border-white/10 bg-white/3 px-4 py-3">
                <p class="text-[10px] font-black tracking-widest text-bone/40 uppercase">{x.l}</p>
                <p class="display mt-1 text-2xl">{x.v}<span class="ml-1.5 font-sans text-[10px] font-bold text-bone/35">{x.s}</span></p>
              </div>
            {/each}
          </div>
        {/if}

      {:else if tab === 'leads'}
        <div class="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 class="display text-3xl sm:text-4xl">Leads</h1>
            <p class="mt-1 text-sm text-bone/55">
              {stats ? `${stats.leadsTotal} total · ${stats.leadsBaru} belum dikontak · ${stats.leadsHariIni} hari ini` : 'Prospek yang masuk dari formulir situs.'}
            </p>
          </div>
        </div>
        <div class="mb-4 flex flex-wrap gap-2" role="group" aria-label="Filter status">
          {#each ['semua', ...statusList] as f (f)}
            <button
              type="button"
              onclick={() => setFilter(f as typeof filter)}
              class={[
                'rounded-full px-3.5 py-2 text-xs font-bold transition focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none',
                filter === f ? 'bg-gold text-ink' : 'border border-white/15 text-bone/60 hover:border-gold/40',
              ]}
            >
              {f === 'semua' ? 'Semua' : statusLabel[f as Status]}
            </button>
          {/each}
        </div>

        {#if loading && leads.length === 0}
          <p class="text-sm text-bone/50">Memuat leads…</p>
        {:else if leads.length === 0}
          <p class="rounded-3xl border border-dashed border-white/15 p-10 text-center text-sm text-bone/50">
            Belum ada lead dengan filter ini.
          </p>
        {:else}
          <ul class="space-y-3">
            {#each leads as l (l.id)}
              <li class="rounded-3xl border border-white/10 bg-white/5 p-4 sm:p-5">
                <div class="flex flex-wrap items-center justify-between gap-3">
                  <div class="min-w-0">
                    <p class="truncate text-base font-bold">{l.nama}</p>
                    <p class="mt-0.5 truncate text-xs text-bone/55">
                      {l.program ?? '—'} · {l.sumber} · {shortDate(l.created_at)}
                    </p>
                  </div>
                  <span class:list={['shrink-0 rounded-full px-3 py-1 text-[10px] font-black tracking-wider uppercase', statusClass[l.status]]}>
                    {statusLabel[l.status]}
                  </span>
                </div>

                <div class="mt-3 flex flex-wrap items-center gap-2">
                  <a
                    href={waHref(l)}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-wa-cta="admin-lead-wa"
                    class="inline-flex items-center gap-1.5 rounded-xl bg-brand px-3.5 py-2 text-xs font-bold text-white transition hover:bg-brand-dark focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none active:scale-95"
                  >
                    <ExternalLink size={13} />
                    WA · {l.wa}
                  </a>

                  <select
                    aria-label={`Ubah status ${l.nama}`}
                    value={l.status}
                    onchange={(e) => setStatus(l.id, (e.currentTarget as HTMLSelectElement).value as Status)}
                    class="rounded-xl border border-white/15 bg-ink px-3 py-2 text-xs font-semibold text-bone/80 focus:border-gold focus:outline-none"
                  >
                    {#each statusList as s (s)}
                      <option value={s}>{statusLabel[s]}</option>
                    {/each}
                  </select>

                  <button
                    type="button"
                    onclick={() => startCatatan(l)}
                    class="rounded-xl border border-white/15 px-3 py-2 text-xs font-bold text-gold transition hover:border-gold/50 focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
                  >
                    Catatan
                  </button>
                </div>

                {#if editingCatatan === l.id}
                  <div class="mt-3 flex gap-2">
                    <input
                      bind:value={catatanDraft}
                      placeholder="Catatan internal…"
                      class="min-w-0 flex-1 rounded-xl border border-white/15 bg-ink px-3 py-2.5 text-sm text-bone placeholder:text-bone/35 focus:border-gold focus:outline-none"
                    />
                    <button
                      type="button"
                      disabled={saving}
                      onclick={() => saveCatatan(l.id)}
                      class="rounded-xl bg-gold px-4 py-2.5 text-xs font-bold text-ink transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none disabled:opacity-50"
                    >
                      {saving ? '…' : 'Simpan'}
                    </button>
                  </div>
                {:else if l.catatan}
                  <p class="mt-3 rounded-xl bg-ink/60 px-3 py-2 text-xs text-bone/60">{l.catatan}</p>
                {/if}
              </li>
            {/each}
          </ul>
        {/if}

      {:else if tab === 'konten'}
        <AdminKonten />
      {:else if tab === 'media'}
        <div class="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 class="display text-3xl sm:text-4xl">Media</h1>
            <p class="mt-1 text-sm text-bone/55">Gambar &amp; klip untuk berita dan halaman program — disimpan di R2.</p>
          </div>
          <button
            type="button"
            onclick={() => loadMedia()}
            disabled={mediaSedangCek}
            class="flex items-center gap-1.5 rounded-xl border border-white/15 px-3 py-2 text-xs font-bold text-bone/70 transition hover:border-gold/50 hover:text-bone focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none disabled:opacity-50"
          >
            <span class={mediaSedangCek ? 'putar' : ''}><RefreshCw size={13} /></span>
            Cek status R2
          </button>
        </div>

        <div
          class={[
            'mt-4 rounded-3xl border p-4 sm:p-5',
            media?.siap ? 'border-emerald-500/35 bg-emerald-500/10' : 'border-gold/35 bg-gold/10',
          ]}
        >
          <div class="flex items-center gap-2.5">
            <Smartphone size={16} class={media?.siap ? 'text-emerald-400' : 'text-gold'} />
            <p class="text-sm font-black tracking-wide uppercase">
              {media?.siap ? 'R2 aktif — siap unggah' : 'R2 belum aktif'}
            </p>
            <span class="ml-auto rounded-full bg-ink/50 px-2.5 py-1 font-mono text-[10px] font-bold text-bone/60">
              {media?.bucket ?? 'prospect-media'}
            </span>
          </div>

          {#if mediaError}
            <p class="mt-2 text-xs text-brand">{mediaError}</p>
          {:else if media?.siap}
            <p class="mt-2 text-xs text-bone/70">Bucket sudah ter-binding. Unggah di bawah, key-nya dipakai di form konten.</p>
          {:else}
            <p class="mt-2 text-xs text-bone/70">
              Bucket <code class="text-gold">prospect-media</code> belum bisa dibuat: API Cloudflare menolak dengan
              <code>10042</code> — R2 harus diaktifkan sekali lewat dashboard (tidak ada endpoint API untuk
              menyetujui ToS). Setelah kamu klik aktif, tombol “Cek status R2” di atas berubah jadi siap dan
              unggah berkas langsung jalan.
            </p>
            <ol class="mt-3 space-y-1.5 text-xs text-bone/65">
              {#each (media?.langkah ?? []) as s, i (i)}
                <li class="flex gap-2.5">
                  <span class="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-gold/20 text-[10px] font-black text-gold">
                    {i + 1}
                  </span>
                  {s}
                </li>
              {/each}
            </ol>
          {/if}
        </div>

        {#if media?.siap}
          <div class="mt-4 rounded-3xl border border-white/10 bg-white/4.5 p-4 sm:p-5">
            <label class="block cursor-pointer">
              <span class="text-[10px] font-black tracking-widest text-gold uppercase">Unggah berkas</span>
              <span
                class="mt-2 flex flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-white/15 px-4 py-8 text-center transition hover:border-gold/50"
              >
                <ImageIcon size={22} class="text-bone/40" />
                <span class="text-xs font-bold text-bone/70">
                  {sedangKirim ? 'Mengirim berkas…' : 'Pilih gambar (jpg/png/webp/avif) atau mp4 · maks 5 MB'}
                </span>
              </span>
              <input type="file" class="sr-only" accept="image/*,video/mp4" disabled={sedangKirim} onchange={kirimBerkas} />
            </label>
            {#if pesanMedia}<p class="mt-2 text-xs text-emerald-400">{pesanMedia}</p>{/if}
            {#if salahMedia}<p class="mt-2 text-xs text-brand">{salahMedia}</p>{/if}

            {#if berkas.length > 0}
              <ul class="mt-4 divide-y divide-white/8">
                {#each berkas as b (b.key)}
                  <li class="flex items-center justify-between gap-3 py-2 font-mono text-[11px]">
                    <span class="min-w-0 truncate text-bone/80">{b.key}</span>
                    <span class="shrink-0 text-bone/40">{ukuran(b.ukuran)}</span>
                  </li>
                {/each}
              </ul>
            {/if}
          </div>
        {/if}
      {:else}
        <div class="max-w-xl space-y-5">
          <div>
            <h2 class="display text-3xl">Pengaturan</h2>
            <p class="mt-1 text-sm text-bone/55">Perubahan popup &amp; nomor WA langsung aktif.</p>
          </div>

          {#if !settingsLoaded}
            <p class="text-sm text-bone/50">{settingsErr || 'Memuat…'}</p>
          {:else}
            <div class="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-5">
              <div>
                <label for="set-wa" class="block text-xs font-black tracking-widest text-gold uppercase">Nomor WhatsApp</label>
                <input
                  id="set-wa"
                  bind:value={settingsForm.wa_number}
                  inputmode="numeric"
                  class="mt-2 w-full rounded-xl border border-white/15 bg-ink px-3.5 py-3 text-sm focus:border-gold focus:outline-none"
                  placeholder="6285924041004"
                />
              </div>

              <div>
                <label for="set-text" class="block text-xs font-black tracking-widest text-gold uppercase">Teks popup</label>
                <input
                  id="set-text"
                  bind:value={settingsForm.popup_text}
                  maxlength="200"
                  class="mt-2 w-full rounded-xl border border-white/15 bg-ink px-3.5 py-3 text-sm focus:border-gold focus:outline-none"
                />
              </div>

              <div class="flex flex-wrap items-end gap-4">
                <div>
                  <label for="set-delay" class="block text-xs font-black tracking-widest text-gold uppercase">Delay popup (detik)</label>
                  <input
                    id="set-delay"
                    bind:value={settingsForm.popup_delay_sec}
                    inputmode="numeric"
                    class="mt-2 w-28 rounded-xl border border-white/15 bg-ink px-3.5 py-3 text-sm focus:border-gold focus:outline-none"
                  />
                </div>
                <label class="flex items-center gap-2 pb-3 text-sm font-semibold text-bone/80">
                  <input
                    type="checkbox"
                    checked={settingsForm.popup_enabled === '1'}
                    onchange={(e) =>
                      (settingsForm.popup_enabled = (e.currentTarget as HTMLInputElement).checked ? '1' : '0')}
                    class="h-4 w-4 accent-[#c8232b]"
                  />
                  Popup aktif
                </label>
              </div>

              <div>
                <label for="set-ga" class="block text-xs font-black tracking-widest text-gold uppercase">GA4 Measurement ID</label>
                <input
                  id="set-ga"
                  bind:value={settingsForm.ga4_id}
                  placeholder="G-XXXXXXXXXX (opsional)"
                  class="mt-2 w-full rounded-xl border border-white/15 bg-ink px-3.5 py-3 text-sm focus:border-gold focus:outline-none"
                />
              </div>

              <button
                type="button"
                disabled={settingsSaving}
                onclick={saveSettings}
                class="w-full rounded-2xl bg-brand px-6 py-3.5 text-sm font-bold text-white transition hover:bg-brand-dark focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none active:scale-95 disabled:opacity-50"
              >
                {settingsSaving ? 'Menyimpan…' : 'Simpan pengaturan'}
              </button>

              {#if settingsMsg}
                <p class="text-xs text-gold">{settingsMsg}</p>
              {/if}
              {#if settingsErr}
                <p class="text-xs text-brand">{settingsErr}</p>
              {/if}
            </div>
          {/if}
        </div>
      {/if}
    </main>
  </div>

  <nav class="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-ink/95 backdrop-blur-xl lg:hidden" aria-label="Menu admin mobile">
    <div class="mx-auto flex max-w-md items-stretch justify-around gap-0.5 px-1.5 py-1.5">
      {#each tabs as t (t.id)}
        <button
          type="button"
          onclick={() => (tab = t.id)}
          class={[
            'flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-2 transition focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none active:scale-95',
            tab === t.id ? 'bg-white/6 text-gold' : 'text-bone/50',
          ]}
        >
          <t.icon size={17} />
          <span class="text-[8.5px] font-bold whitespace-nowrap">{t.label}</span>
        </button>
      {/each}
    </div>
  </nav>
</div>

<style>
  .kartu {
    border: 1px solid rgb(255 255 255 / 0.09);
    border-radius: 26px;
    backdrop-filter: blur(6px);
    transition: border-color 0.25s ease, transform 0.25s ease;
  }
  .kartu:hover {
    border-color: rgb(246 185 59 / 0.28);
  }

  .hero-band {
    background:
      radial-gradient(120% 140% at 8% 0%, rgb(200 35 43 / 0.34) 0%, rgb(200 35 43 / 0) 58%),
      linear-gradient(120deg, rgb(255 255 255 / 0.06) 0%, rgb(255 255 255 / 0.015) 60%, rgb(246 185 59 / 0.09) 100%);
  }

  .rise {
    animation: naik 0.55s cubic-bezier(0.2, 0.8, 0.2, 1) both;
  }
  .kartu:nth-child(2) {
    animation-delay: 0.05s;
  }

  @keyframes naik {
    from {
      opacity: 0;
      transform: translateY(14px);
    }
    to {
      opacity: 1;
      transform: none;
    }
  }

  .jejak {
    stroke-dasharray: 1;
    stroke-dashoffset: 1;
    animation: gambar 1.1s ease-out 0.1s forwards;
  }
  .jejak.tebat {
    animation-duration: 1.35s;
  }

  @keyframes gambar {
    to {
      stroke-dashoffset: 0;
    }
  }

  .wash {
    opacity: 0;
    animation: muncul 0.9s ease-out 0.5s forwards;
  }

  @keyframes muncul {
    to {
      opacity: 1;
    }
  }

  .muluk {
    transition: width 0.8s cubic-bezier(0.2, 0.8, 0.2, 1);
  }

  .kolom {
    fill: rgb(255 255 255 / 0);
    pointer-events: all;
    cursor: crosshair;
    transition: fill 0.2s ease;
  }
  .kolom:hover {
    fill: rgb(255 255 255 / 0.06);
  }

  .sumbu {
    fill: rgb(255 255 255 / 0.28);
    font-size: 9px;
    font-weight: 700;
  }

  .putar {
    display: inline-flex;
    animation: putar 0.9s linear infinite;
  }

  @keyframes putar {
    to {
      transform: rotate(360deg);
    }
  }

  .detak {
    animation: detak 1.8s ease-in-out infinite;
  }

  @keyframes detak {
    0%,
    100% {
      opacity: 1;
      box-shadow: 0 0 0 0 rgb(52 211 153 / 0.55);
    }
    50% {
      opacity: 0.55;
      box-shadow: 0 0 0 5px rgb(52 211 153 / 0);
    }
  }

  .skel {
    background: linear-gradient(90deg, rgb(255 255 255 / 0.05) 0%, rgb(255 255 255 / 0.12) 45%, rgb(255 255 255 / 0.05) 90%);
    background-size: 220% 100%;
    animation: geser 1.25s ease-in-out infinite;
  }

  @keyframes geser {
    from {
      background-position: 120% 0;
    }
    to {
      background-position: -120% 0;
    }
  }
</style>
