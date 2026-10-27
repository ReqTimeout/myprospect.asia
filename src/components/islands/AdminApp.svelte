<script lang="ts">
  import { untrack } from 'svelte';
  import { LayoutDashboard, Users, FileText, Image as ImageIcon, Settings, LogOut, ExternalLink } from '@lucide/svelte';

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

  type Stats = { leadsTotal: number; leadsHariIni: number; klikWa7Hari: number; leadsBaru: number };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
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
  let error = $state('');
  let editingCatatan = $state<number | null>(null);
  let catatanDraft = $state('');
  let saving = $state(false);

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
    const res = await api('/api/admin/stats');
    stats = (await res.json()) as Stats;
  }

  async function loadLeads() {
    const q = filter === 'semua' ? '' : `?status=${filter}`;
    const res = await api('/api/admin/leads' + q);
    leads = (await res.json()) as Lead[];
  }

  async function refresh() {
    loading = true;
    error = '';
    try {
      await Promise.all([loadStats(), loadLeads()]);
    } catch (e) {
      if ((e as Error).message !== 'unauthorized') error = 'Gagal memuat data. Coba lagi.';
    } finally {
      loading = false;
    }
  }

  $effect(() => {
    const t = tab;
    if (t === 'dashboard' || t === 'leads') {
      untrack(() => refresh());
    }
  });

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
</script>

<div class="flex min-h-dvh flex-col bg-ink text-bone">
  <header class="sticky top-0 z-30 flex items-center justify-between border-b border-white/10 bg-ink/90 px-4 py-3 backdrop-blur-xl sm:px-6">
    <div class="flex items-baseline gap-3">
      <span class="display skew-mark text-xl">Prospect</span>
      <span class="text-[10px] font-black tracking-widest text-gold uppercase">Admin</span>
    </div>
    <button
      type="button"
      onclick={logout}
      class="flex items-center gap-1.5 rounded-xl border border-white/15 px-3 py-2 text-xs font-bold text-bone/70 transition hover:border-brand hover:text-brand focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
    >
      <LogOut size={14} />
      Keluar
    </button>
  </header>

  <div class="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 pt-6 pb-28 sm:px-6 lg:flex-row lg:pb-8">
    <nav class="hidden w-44 shrink-0 lg:block" aria-label="Menu admin">
      <ul class="space-y-1.5">
        {#each tabs as t (t.id)}
          <li>
            <button
              type="button"
              onclick={() => (tab = t.id)}
              class={[
                'flex w-full items-center gap-2.5 rounded-2xl px-4 py-3 text-sm font-bold transition focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none',
                tab === t.id ? 'bg-brand text-white' : 'text-bone/60 hover:bg-white/5 hover:text-bone',
              ]}
            >
              <t.icon size={16} />
              {t.label}
            </button>
          </li>
        {/each}
      </ul>
    </nav>

    <main class="min-w-0 flex-1">
      {#if error}
        <p class="mb-4 rounded-2xl border border-brand/40 bg-brand/10 px-4 py-3 text-sm text-bone/90">{error}</p>
      {/if}

      {#if tab === 'dashboard'}
        {#if loading && !stats}
          <p class="text-sm text-bone/50">Memuat…</p>
        {:else if stats}
          <div class="grid grid-cols-2 gap-4 xl:grid-cols-4">
            {#each [
              { label: 'Lead hari ini', value: stats.leadsHariIni, tone: 'brand' },
              { label: 'Lead belum dikontak', value: stats.leadsBaru, tone: 'gold' },
              { label: 'Total lead', value: stats.leadsTotal, tone: 'plain' },
              { label: 'Klik WA (7 hari)', value: stats.klikWa7Hari, tone: 'plain' },
            ] as c (c.label)}
              <div
                class={[
                  'rounded-3xl border p-5',
                  c.tone === 'brand'
                    ? 'border-brand/40 bg-brand/10'
                    : c.tone === 'gold'
                      ? 'border-gold/40 bg-gold/10'
                      : 'border-white/10 bg-white/5',
                ]}
              >
                <p class="text-[11px] font-black tracking-widest text-bone/50 uppercase">{c.label}</p>
                <p class="display mt-2 text-4xl">{c.value}</p>
              </div>
            {/each}
          </div>
          <p class="mt-6 text-xs text-bone/45">
            Lead masuk lewat formulir halaman program/workshop → tersimpan di D1 → WhatsApp admin.
          </p>
        {/if}

      {:else if tab === 'leads'}
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
        <div class="rounded-3xl border border-dashed border-white/15 p-8 text-center">
          <p class="display text-2xl">Konten</p>
          <p class="mt-2 text-sm text-bone/60">
            CRUD Program · Workshop · Testimoni · Coach · Blog — menyusul di tahap berikutnya.
          </p>
        </div>
      {:else if tab === 'media'}
        <div class="rounded-3xl border border-dashed border-white/15 p-8 text-center">
          <p class="display text-2xl">Media</p>
          <p class="mt-2 text-sm text-bone/60">
            Upload ke R2 — aktifkan dulu bucket <code class="text-gold">prospect-media</code> di dashboard
            Cloudflare.
          </p>
        </div>
      {:else}
        <div class="rounded-3xl border border-dashed border-white/15 p-8 text-center">
          <p class="display text-2xl">Pengaturan</p>
          <p class="mt-2 text-sm text-bone/60">
            No WA, teks popup, GA4 ID, meta SEO — menyusul (tabel <code class="text-gold">settings</code> sudah
            siap di D1).
          </p>
        </div>
      {/if}
    </main>
  </div>

  <nav class="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-ink/95 backdrop-blur-xl lg:hidden" aria-label="Menu admin mobile">
    <div class="mx-auto flex max-w-md items-stretch justify-around px-2 py-1.5">
      {#each tabs as t (t.id)}
        <button
          type="button"
          onclick={() => (tab = t.id)}
          class={[
            'flex min-w-14 flex-col items-center gap-0.5 rounded-xl px-2 py-2 transition focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none',
            tab === t.id ? 'text-gold' : 'text-bone/50',
          ]}
        >
          <t.icon size={18} />
          <span class="text-[9px] font-bold">{t.label}</span>
        </button>
      {/each}
    </div>
  </nav>
</div>
