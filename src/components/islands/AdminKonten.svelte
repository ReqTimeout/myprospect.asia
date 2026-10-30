<script lang="ts">
  import { onMount } from 'svelte';
  import { Image as ImageIcon, Pen, Plus, Trash2, Upload } from '@lucide/svelte';

  type Sub = 'berita' | 'testimoni' | 'faq' | 'statistik';

  type Post = { slug: string; title: string; desc: string; kategori: string; pub_date: string; status: string; body: string; cover: string };
  type PostForm = { slug: string; title: string; desc: string; kategori: string; pub_date: string; body: string; status: string; cover: string; isNew: boolean };

  type Item = { id: string; title: string; body: string; meta: Record<string, unknown>; sort: number; active: number };
  type ItemForm = { id: string | null; title: string; body: string; meta: Record<string, unknown>; sort: number; active: boolean };
  type Media = { key: string; ukuran: number; waktu: string };

  let sub = $state<Sub>('berita');

  let posts = $state<Post[]>([]);
  let postForm = $state<PostForm | null>(null);
  let slugTouched = $state(false);

  let testi = $state<Item[]>([]);
  let faq = $state<Item[]>([]);
  let stats = $state<Item[]>([]);
  let testiForm = $state<ItemForm | null>(null);
  let faqForm = $state<ItemForm | null>(null);

  let saving = $state(false);
  let msg = $state('');
  let err = $state('');
  let loaded = $state(false);

  // Pustaka media di R2 — dipakai sebagai pemilih gambar utama di form berita
  // supaya admin tidak perlu mengetik path /media/... secara manual.
  let pustaka = $state<Media[]>([]);
  let coverBusy = $state(false);
  let coverMsg = $state('');
  let coverErr = $state('');

  const subs: { id: Sub; label: string }[] = [
    { id: 'berita', label: 'Berita' },
    { id: 'testimoni', label: 'Testimoni' },
    { id: 'faq', label: 'FAQ' },
    { id: 'statistik', label: 'Statistik' },
  ];

  const kategoriOpts = ['Berita', 'Bintang', 'Kolaborasi'];
  const grupOpts = ['Umum', 'Program', 'Workshop', 'Pembayaran'];

  async function api(path: string, init?: RequestInit): Promise<Response> {
    const res = await fetch(path, {
      ...init,
      headers: { ...(init?.body ? { 'Content-Type': 'application/json' } : {}), ...(init?.headers ?? {}) },
      credentials: 'same-origin',
    });
    if (res.status === 401) {
      err = 'Sesi berakhir — muat ulang halaman untuk login kembali.';
      throw new Error('unauthorized');
    }
    return res;
  }

  function banner(message: string) {
    err = '';
    msg = message;
    setTimeout(() => (msg = ''), 5000);
  }

  async function loadPosts() {
    try {
      const res = await api('/api/admin/posts');
      posts = (await res.json()) as Post[];
    } catch {
      /* pesan ditangani api() */
    }
  }

  async function loadContent(kind: 'testimonials' | 'faq' | 'stats') {
    try {
      const res = await api(`/api/admin/content/${kind}`);
      const rows = (await res.json()) as Item[];
      if (kind === 'testimonials') testi = rows;
      else if (kind === 'faq') faq = rows;
      else stats = rows;
    } catch {
      /* pesan ditangani api() */
    }
  }

  onMount(async () => {
    await Promise.all([loadPosts(), loadContent('testimonials'), loadContent('faq'), loadContent('stats')]);
    loaded = true;
    muatPustaka();
  });

  function slugify(s: string): string {
    return s
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .slice(0, 80);
  }

  function namaBerkas(key: string): string {
    return key.split('/').pop() ?? key;
  }

  function gambar(key: string): boolean {
    return /\.(jpg|jpeg|png|webp|gif|avif)$/i.test(key);
  }

  const pustakaGambar = $derived(pustaka.filter((m) => gambar(m.key)));

  // Daftar berkas yang sudah ada di R2. Dipakai untuk memilih gambar utama
  // tanpa perlu unggah ulang.
  async function muatPustaka() {
    try {
      const res = await fetch('/api/admin/upload', { credentials: 'same-origin' });
      if (!res.ok) return;
      const r = (await res.json()) as { berkas?: Media[] };
      pustaka = r.berkas ?? [];
    } catch {
      pustaka = [];
    }
  }

  // Unggah gambar utama langsung dari form berita: file dikirim ke R2 lewat
  // endpoint yang sama dengan tab Media, lalu key-nya jadi path publik
  // /media/... yang otomatis terisi di kolom gambar utama.
  async function unggahSampul(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    const f = input.files?.[0];
    if (!f) return;
    coverBusy = true;
    coverMsg = '';
    coverErr = '';
    try {
      const fd = new FormData();
      fd.append('file', f);
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: fd,
        credentials: 'same-origin',
      });
      if (res.status === 401) throw new Error('Sesi berakhir — muat ulang halaman untuk login kembali.');
      if (!res.ok) throw new Error(await res.text());
      const r = (await res.json()) as { key: string };
      if (postForm) postForm.cover = '/' + r.key;
      coverMsg = `Tersimpan — gambar utama: /${r.key}`;
      await muatPustaka();
    } catch (err2) {
      coverErr = (err2 as Error).message || 'Upload gagal — periksa tipe & ukuran berkas (maks 5 MB).';
    } finally {
      coverBusy = false;
      input.value = '';
    }
  }

  function pilihSampul(key: string) {
    if (!postForm) return;
    postForm.cover = '/' + key;
    coverMsg = `Gambar utama dipilih: /${key}`;
    coverErr = '';
  }

  function newPost() {
    slugTouched = false;
    postForm = {
      slug: '',
      title: '',
      desc: '',
      kategori: 'Berita',
      pub_date: new Date().toISOString().slice(0, 10),
      body: '',
      status: 'published',
      cover: '',
      isNew: true,
    };
    muatPustaka();
  }

  function editPost(p: Post) {
    slugTouched = true;
    postForm = { ...p, cover: p.cover ?? '', isNew: false };
    muatPustaka();
  }

  async function savePost() {
    if (!postForm) return;
    if (!slugTouched && postForm.isNew) postForm.slug = slugify(postForm.title);
    saving = true;
    try {
      const url = postForm.isNew ? '/api/admin/posts' : `/api/admin/posts/${postForm.slug}`;
      const res = await api(url, { method: postForm.isNew ? 'POST' : 'PUT', body: JSON.stringify(postForm) });
      if (!res.ok) throw new Error(await res.text());
      banner(postForm.isNew ? 'Berita diterbitkan.' : 'Berita diperbarui.');
      postForm = null;
      await loadPosts();
    } catch (e) {
      if ((e as Error).message !== 'unauthorized') err = (e as Error).message || 'Gagal menyimpan berita.';
    } finally {
      saving = false;
    }
  }

  async function deletePost(slug: string) {
    if (!confirm(`Hapus berita "${slug}"? Tidak bisa dibatalkan.`)) return;
    try {
      const res = await api(`/api/admin/posts/${slug}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      banner('Berita dihapus.');
      await loadPosts();
    } catch (e) {
      if ((e as Error).message !== 'unauthorized') err = 'Gagal menghapus berita.';
    }
  }

  function newItemForm(kind: 'testimonials' | 'faq'): ItemForm {
    return {
      id: null,
      title: '',
      body: '',
      meta: kind === 'faq' ? { grup: 'Umum' } : { asal: 'Atlet Prospect Asia', olahraga: '' },
      sort: 0,
      active: true,
    };
  }

  async function saveItem(kind: 'testimonials' | 'faq', form: ItemForm) {
    saving = true;
    try {
      const url = form.id ? `/api/admin/content/${kind}/${form.id}` : `/api/admin/content/${kind}`;
      const res = await api(url, {
        method: form.id ? 'PUT' : 'POST',
        body: JSON.stringify({
          title: form.title,
          body: form.body,
          meta: form.meta,
          sort: form.sort,
          active: form.active ? 1 : 0,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      banner(form.id ? 'Item diperbarui.' : 'Item ditambahkan.');
      if (kind === 'testimonials') testiForm = null;
      else faqForm = null;
      await loadContent(kind);
    } catch (e) {
      if ((e as Error).message !== 'unauthorized') err = (e as Error).message || 'Gagal menyimpan item.';
    } finally {
      saving = false;
    }
  }

  async function deleteItem(kind: 'testimonials' | 'faq', id: string) {
    if (!confirm('Hapus item ini?')) return;
    try {
      const res = await api(`/api/admin/content/${kind}/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      banner('Item dihapus.');
      await loadContent(kind);
    } catch (e) {
      if ((e as Error).message !== 'unauthorized') err = 'Gagal menghapus item.';
    }
  }

  async function saveStats() {
    saving = true;
    try {
      for (const s of stats) {
        const res = await api(`/api/admin/content/stats/${s.id}`, {
          method: 'PUT',
          body: JSON.stringify({ title: s.title, body: s.body, meta: s.meta, sort: s.sort, active: 1 }),
        });
        if (!res.ok) throw new Error(await res.text());
      }
      banner('Statistik diperbarui.');
      await loadContent('stats');
    } catch (e) {
      if ((e as Error).message !== 'unauthorized') err = (e as Error).message || 'Gagal menyimpan statistik.';
    } finally {
      saving = false;
    }
  }

  const inputCls =
    'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none';
  const labelCls = 'block text-xs font-black tracking-widest text-slate-500 uppercase';
  const btnPrimary =
    'rounded-2xl bg-brand px-5 py-3 text-sm font-bold text-ink transition hover:bg-brand-dark focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none active:scale-95 disabled:opacity-50';
  const btnGhost =
    'rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 transition hover:border-brand hover:text-brand-dark focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none';
</script>

<div class="space-y-5">
  <div class="flex flex-wrap items-center justify-between gap-3">
    <div>
      <h2 class="display text-3xl">Konten</h2>
      <p class="mt-1 text-sm text-slate-500">Edit langsung tampil di situs — tanpa deploy.</p>
    </div>
    {#if sub === 'berita' && !postForm}
      <button type="button" onclick={newPost} class="flex items-center gap-2 rounded-2xl bg-brand px-4 py-2.5 text-xs font-black text-ink transition hover:bg-brand-dark focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none">
        <Plus size={15} /> Tulis berita
      </button>
    {/if}
  </div>

  <div class="flex flex-wrap gap-2" role="tablist">
    {#each subs as s (s.id)}
      <button
        type="button"
        role="tab"
        aria-selected={sub === s.id}
        onclick={() => (sub = s.id)}
        class={[
          'rounded-full border px-4 py-2 text-xs font-bold transition focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none',
          sub === s.id ? 'border-brand bg-brand/10 text-brand-dark' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300',
        ]}
      >
        {s.label}
      </button>
    {/each}
  </div>

  {#if msg}<p class="text-xs font-bold text-emerald-600">{msg}</p>{/if}
  {#if err}<p class="text-xs font-bold text-brand-dark">{err}</p>{/if}

  {#if !loaded}
    <p class="text-sm text-slate-500">Memuat…</p>
  {:else if sub === 'berita'}
    {#if postForm}
      <div class="space-y-4 rounded-3xl border border-slate-200 bg-white p-5">
        <div>
          <label for="p-title" class={labelCls}>Judul</label>
          <input id="p-title" class={inputCls} bind:value={postForm.title} oninput={() => { if (!slugTouched && postForm?.isNew) postForm.slug = slugify(postForm.title); }} />
        </div>
        <div class="flex flex-wrap gap-4">
          <div class="min-w-44 flex-1">
            <label for="p-slug" class={labelCls}>Slug URL</label>
            <input id="p-slug" class={inputCls} bind:value={postForm.slug} oninput={() => (slugTouched = true)} placeholder="contoh-berita-atlet" />
          </div>
          <div class="w-36">
            <label for="p-date" class={labelCls}>Tanggal</label>
            <input id="p-date" type="date" class={inputCls} bind:value={postForm.pub_date} />
          </div>
        </div>
        <div class="flex flex-wrap gap-4">
          <div class="flex-1">
            <label for="p-kat" class={labelCls}>Kategori</label>
            <select id="p-kat" class={inputCls} bind:value={postForm.kategori}>
              {#each kategoriOpts as k (k)}<option value={k}>{k}</option>{/each}
            </select>
          </div>
          <div class="flex-1">
            <label for="p-status" class={labelCls}>Status</label>
            <select id="p-status" class={inputCls} bind:value={postForm.status}>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>
        <div>
          <span class={labelCls}>Gambar utama</span>

          <div class="mt-2 flex flex-col gap-3 sm:flex-row sm:items-start">
            <div class="w-full shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 sm:w-56">
              {#if postForm.cover}
                <img
                  src={postForm.cover}
                  alt="Pratinjau gambar utama"
                  class="aspect-16/9 w-full object-cover"
                  onerror={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')}
                />
              {:else}
                <div class="grid aspect-16/9 w-full place-items-center text-slate-300">
                  <ImageIcon size={24} />
                </div>
              {/if}
            </div>

            <div class="min-w-0 flex-1 space-y-3">
              <label class="block cursor-pointer">
                <span class="flex flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-slate-300 bg-white px-4 py-6 text-center transition hover:border-brand hover:bg-brand/5">
                  <Upload size={20} class="text-slate-400" />
                  <span class="text-xs font-bold text-slate-600">
                    {coverBusy ? 'Mengunggah…' : 'Unggah gambar (jpg/png/webp/avif) · maks 5 MB'}
                  </span>
                  <span class="text-[10px] font-semibold text-slate-400">
                    atau pilih dari pustaka media di bawah
                  </span>
                </span>
                <input type="file" class="sr-only" accept="image/*" disabled={coverBusy} onchange={unggahSampul} />
              </label>

              {#if coverErr}<p class="text-xs font-bold text-brand-dark">{coverErr}</p>{/if}
              {#if coverMsg}<p class="text-xs font-bold text-emerald-600">{coverMsg}</p>{/if}

              <div>
                <label for="p-cover" class="block text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                  Path manual (opsional)
                </label>
                <input id="p-cover" class={inputCls} bind:value={postForm.cover} placeholder="/media/workshop-crowd.jpg" />
              </div>

              {#if pustakaGambar.length > 0}
                <div>
                  <p class="mb-1.5 text-[10px] font-bold tracking-widest text-slate-400 uppercase">Pustaka media</p>
                  <div class="grid max-h-44 grid-cols-3 gap-2 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-2 sm:grid-cols-4">
                    {#each pustakaGambar as m (m.key)}
                      <button
                        type="button"
                        onclick={() => pilihSampul(m.key)}
                        title={namaBerkas(m.key)}
                        class="overflow-hidden rounded-xl border bg-white transition focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none {postForm.cover === '/' + m.key ? 'border-brand ring-2 ring-brand/30' : 'border-slate-200 hover:border-brand'}"
                      >
                        <img src={'/' + m.key} alt={namaBerkas(m.key)} loading="lazy" class="aspect-16/9 w-full object-contain p-1" />
                      </button>
                    {/each}
                  </div>
                </div>
              {/if}
            </div>
          </div>
        </div>
        <div>
          <label for="p-desc" class={labelCls}>Deskripsi (ringkas)</label>
          <textarea id="p-desc" rows="2" class={inputCls} bind:value={postForm.desc}></textarea>
        </div>
        <div>
          <label for="p-body" class={labelCls}>Isi berita (Markdown: ## judul, **tebal**, > kutipan)</label>
          <textarea id="p-body" rows="12" class="{inputCls} font-mono text-xs leading-relaxed" bind:value={postForm.body}></textarea>
        </div>
        <div class="flex gap-3">
          <button type="button" disabled={saving} onclick={savePost} class={btnPrimary}>
            {saving ? 'Menyimpan…' : postForm.isNew ? 'Terbitkan' : 'Simpan perubahan'}
          </button>
          <button type="button" onclick={() => (postForm = null)} class={btnGhost}>Batal</button>
        </div>
      </div>
    {:else if posts.length === 0}
      <p class="text-sm text-slate-500">Belum ada berita di D1.</p>
    {:else}
      <ul class="space-y-3">
        {#each posts as p (p.slug)}
          <li class="rounded-3xl border border-slate-200 bg-white p-4">
            <div class="flex items-start gap-3">
              {#if p.cover}
                <img
                  src={p.cover}
                  alt=""
                  loading="lazy"
                  class="h-16 w-24 shrink-0 rounded-xl border border-slate-200 bg-slate-50 object-cover"
                />
              {/if}
              <div class="flex min-w-0 flex-1 items-start justify-between gap-3">
                <div class="min-w-0">
                  <div class="flex flex-wrap items-center gap-2">
                    <span class="rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-[10px] font-black tracking-wider text-amber-700 uppercase">{p.kategori}</span>
                    <span class={[
                      'rounded-full px-2.5 py-0.5 text-[10px] font-black tracking-wider uppercase',
                      p.status === 'published' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500',
                    ]}>{p.status}</span>
                    <span class="text-[11px] text-slate-500">{p.pub_date}</span>
                  </div>
                  <p class="mt-2 truncate text-sm font-bold">{p.title}</p>
                  <p class="mt-0.5 truncate text-xs text-slate-500">/berita/{p.slug}</p>
                </div>
                <div class="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onclick={() => editPost(p)}
                    aria-label={`Edit ${p.title}`}
                    class="rounded-xl border border-slate-200 p-2.5 text-slate-500 transition hover:border-brand hover:text-brand-dark focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none"
                  >
                    <Pen size={15} />
                  </button>
                  <button
                    type="button"
                    onclick={() => deletePost(p.slug)}
                    aria-label={`Hapus ${p.title}`}
                    class="rounded-xl border border-slate-200 p-2.5 text-slate-500 transition hover:border-crimson hover:text-crimson focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          </li>
        {/each}
      </ul>
    {/if}

  {:else if sub === 'testimoni'}
    {#if testiForm}
      <div class="space-y-4 rounded-3xl border border-slate-200 bg-white p-5">
        <div class="flex gap-4">
          <div class="flex-1">
            <label for="t-nama" class={labelCls}>Nama</label>
            <input id="t-nama" class={inputCls} bind:value={testiForm.title} />
          </div>
          <div class="flex-1">
            <label for="t-asal" class={labelCls}>Asal</label>
            <input id="t-asal" class={inputCls} bind:value={testiForm.meta.asal} />
          </div>
          <div class="flex-1">
            <label for="t-olah" class={labelCls}>Olahraga</label>
            <input id="t-olah" class={inputCls} bind:value={testiForm.meta.olahraga} />
          </div>
        </div>
        <div>
          <label for="t-kutip" class={labelCls}>Kutipan</label>
          <textarea id="t-kutip" rows="3" class={inputCls} bind:value={testiForm.body}></textarea>
        </div>
        <div class="flex gap-3">
          <button type="button" disabled={saving} onclick={() => saveItem('testimonials', testiForm)} class={btnPrimary}>
            {saving ? 'Menyimpan…' : 'Simpan'}
          </button>
          <button type="button" onclick={() => (testiForm = null)} class={btnGhost}>Batal</button>
        </div>
      </div>
    {:else}
      <div class="flex justify-end">
        <button type="button" onclick={() => (testiForm = newItemForm('testimonials'))} class="flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 transition hover:border-brand focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none">
          <Plus size={15} /> Tambah testimoni
        </button>
      </div>
      <ul class="space-y-3">
        {#each testi as t (t.id)}
          <li class="rounded-3xl border border-slate-200 bg-white p-4">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="text-sm font-bold">{t.title} <span class="font-normal text-slate-500">· {t.meta.olahraga ?? ''}</span></p>
                <p class="mt-1 line-clamp-2 text-xs text-slate-500">“{t.body}”</p>
              </div>
              <div class="flex shrink-0 gap-2">
                <button
                  type="button"
                  onclick={() => (testiForm = { id: t.id, title: t.title, body: t.body, meta: { ...t.meta }, sort: t.sort, active: t.active === 1 })}
                  aria-label={`Edit ${t.title}`}
                  class="rounded-xl border border-slate-200 p-2.5 text-slate-500 transition hover:border-brand hover:text-amber-700 focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none"
                >
                  <Pen size={15} />
                </button>
                <button
                  type="button"
                  onclick={() => deleteItem('testimonials', t.id)}
                  aria-label={`Hapus ${t.title}`}
                  class="rounded-xl border border-slate-200 p-2.5 text-slate-500 transition hover:border-brand hover:text-brand-dark focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          </li>
        {/each}
      </ul>
    {/if}

  {:else if sub === 'faq'}
    {#if faqForm}
      <div class="space-y-4 rounded-3xl border border-slate-200 bg-white p-5">
        <div class="flex flex-wrap gap-4">
          <div class="w-44">
            <label for="f-grup" class={labelCls}>Grup</label>
            <select id="f-grup" class={inputCls} bind:value={faqForm.meta.grup}>
              {#each grupOpts as g (g)}<option value={g}>{g}</option>{/each}
            </select>
          </div>
          <div class="min-w-56 flex-1">
            <label for="f-q" class={labelCls}>Pertanyaan</label>
            <input id="f-q" class={inputCls} bind:value={faqForm.title} />
          </div>
        </div>
        <div>
          <label for="f-a" class={labelCls}>Jawaban</label>
          <textarea id="f-a" rows="4" class={inputCls} bind:value={faqForm.body}></textarea>
        </div>
        <div class="flex gap-3">
          <button type="button" disabled={saving} onclick={() => saveItem('faq', faqForm)} class={btnPrimary}>
            {saving ? 'Menyimpan…' : 'Simpan'}
          </button>
          <button type="button" onclick={() => (faqForm = null)} class={btnGhost}>Batal</button>
        </div>
      </div>
    {:else}
      <div class="flex justify-end">
        <button type="button" onclick={() => (faqForm = newItemForm('faq'))} class="flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 transition hover:border-brand focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none">
          <Plus size={15} /> Tambah FAQ
        </button>
      </div>
      <ul class="space-y-3">
        {#each faq as f (f.id)}
          <li class="rounded-3xl border border-slate-200 bg-white p-4">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <span class="rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-[10px] font-black tracking-wider text-amber-700 uppercase">{f.meta.grup ?? 'Umum'}</span>
                <p class="mt-2 text-sm font-bold">{f.title}</p>
                <p class="mt-1 line-clamp-2 text-xs text-slate-500">{f.body}</p>
              </div>
              <div class="flex shrink-0 gap-2">
                <button
                  type="button"
                  onclick={() => (faqForm = { id: f.id, title: f.title, body: f.body, meta: { ...f.meta }, sort: f.sort, active: f.active === 1 })}
                  aria-label={`Edit ${f.title}`}
                  class="rounded-xl border border-slate-200 p-2.5 text-slate-500 transition hover:border-brand hover:text-amber-700 focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none"
                >
                  <Pen size={15} />
                </button>
                <button
                  type="button"
                  onclick={() => deleteItem('faq', f.id)}
                  aria-label={`Hapus ${f.title}`}
                  class="rounded-xl border border-slate-200 p-2.5 text-slate-500 transition hover:border-brand hover:text-brand-dark focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          </li>
        {/each}
      </ul>
    {/if}

  {:else}
    <div class="space-y-4 rounded-3xl border border-slate-200 bg-white p-5">
      {#each stats as s (s.id)}
        <div class="flex flex-wrap items-end gap-4 border-b border-slate-200 pb-4 last:border-0 last:pb-0">
          <div class="min-w-48 flex-1">
            <label for="st-{s.id}" class={labelCls}>Label</label>
            <input id="st-{s.id}" class={inputCls} bind:value={s.title} />
          </div>
          <div class="w-32">
            <label for="stv-{s.id}" class={labelCls}>Angka</label>
            <input id="stv-{s.id}" inputmode="numeric" class={inputCls} bind:value={s.meta.to} />
          </div>
          <div class="w-24">
            <label for="sts-{s.id}" class={labelCls}>Suffix</label>
            <input id="sts-{s.id}" class={inputCls} bind:value={s.meta.suffix} placeholder="+" />
          </div>
        </div>
      {/each}
      <button type="button" disabled={saving} onclick={saveStats} class="{btnPrimary} w-full">
        {saving ? 'Menyimpan…' : 'Simpan statistik'}
      </button>
    </div>
  {/if}
</div>
