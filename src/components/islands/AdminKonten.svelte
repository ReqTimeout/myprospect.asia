<script lang="ts">
  import { onMount } from 'svelte';
  import { Pen, Plus, Trash2 } from '@lucide/svelte';

  type Sub = 'berita' | 'testimoni' | 'faq' | 'statistik';

  type Post = { slug: string; title: string; desc: string; kategori: string; pub_date: string; status: string; body: string; cover: string };
  type PostForm = { slug: string; title: string; desc: string; kategori: string; pub_date: string; body: string; status: string; cover: string; isNew: boolean };

  type Item = { id: string; title: string; body: string; meta: Record<string, unknown>; sort: number; active: number };
  type ItemForm = { id: string | null; title: string; body: string; meta: Record<string, unknown>; sort: number; active: boolean };

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
  }

  function editPost(p: Post) {
    slugTouched = true;
    postForm = { ...p, cover: p.cover ?? '', isNew: false };
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
    'w-full rounded-xl border border-white/15 bg-ink px-3.5 py-3 text-sm focus:border-gold focus:outline-none';
  const labelCls = 'block text-xs font-black tracking-widest text-gold uppercase';
  const btnPrimary =
    'rounded-2xl bg-brand px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-dark focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none active:scale-95 disabled:opacity-50';
  const btnGhost =
    'rounded-2xl border border-white/15 px-5 py-3 text-sm font-bold text-bone/80 transition hover:border-gold focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none';
</script>

<div class="space-y-5">
  <div class="flex flex-wrap items-center justify-between gap-3">
    <div>
      <h2 class="display text-3xl">Konten</h2>
      <p class="mt-1 text-sm text-bone/55">Edit langsung tampil di situs — tanpa deploy.</p>
    </div>
    {#if sub === 'berita' && !postForm}
      <button type="button" onclick={newPost} class="flex items-center gap-2 rounded-2xl bg-gold px-4 py-2.5 text-xs font-black text-ink transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none">
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
          'rounded-full border px-4 py-2 text-xs font-bold transition focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none',
          sub === s.id ? 'border-gold bg-gold/15 text-gold' : 'border-white/15 bg-white/5 text-bone/60 hover:border-white/30',
        ]}
      >
        {s.label}
      </button>
    {/each}
  </div>

  {#if msg}<p class="text-xs text-gold">{msg}</p>{/if}
  {#if err}<p class="text-xs text-brand">{err}</p>{/if}

  {#if !loaded}
    <p class="text-sm text-bone/50">Memuat…</p>
  {:else if sub === 'berita'}
    {#if postForm}
      <div class="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-5">
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
          <label for="p-cover" class={labelCls}>Gambar utama (path /media/...)</label>
          <input id="p-cover" class={inputCls} bind:value={postForm.cover} placeholder="/media/workshop-crowd.jpg" />
          {#if postForm.cover}
            <img
              src={postForm.cover}
              alt="Pratinjau gambar utama"
              class="mt-2 aspect-16/9 w-full rounded-xl object-cover"
              onerror={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')}
            />
          {/if}
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
      <p class="text-sm text-bone/50">Belum ada berita di D1.</p>
    {:else}
      <ul class="space-y-3">
        {#each posts as p (p.slug)}
          <li class="rounded-3xl border border-white/10 bg-white/5 p-4">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-2">
                  <span class="rounded-full border border-gold/40 bg-gold/10 px-2.5 py-0.5 text-[10px] font-black tracking-wider text-gold uppercase">{p.kategori}</span>
                  <span class={[
                    'rounded-full px-2.5 py-0.5 text-[10px] font-black tracking-wider uppercase',
                    p.status === 'published' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-white/10 text-bone/50',
                  ]}>{p.status}</span>
                  <span class="text-[11px] text-bone/45">{p.pub_date}</span>
                </div>
                <p class="mt-2 truncate text-sm font-bold">{p.title}</p>
                <p class="mt-0.5 truncate text-xs text-bone/50">/berita/{p.slug}</p>
              </div>
              <div class="flex shrink-0 gap-2">
                <button
                  type="button"
                  onclick={() => editPost(p)}
                  aria-label={`Edit ${p.title}`}
                  class="rounded-xl border border-white/15 p-2.5 text-bone/70 transition hover:border-gold hover:text-gold focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
                >
                  <Pen size={15} />
                </button>
                <button
                  type="button"
                  onclick={() => deletePost(p.slug)}
                  aria-label={`Hapus ${p.title}`}
                  class="rounded-xl border border-white/15 p-2.5 text-bone/70 transition hover:border-brand hover:text-brand focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          </li>
        {/each}
      </ul>
    {/if}

  {:else if sub === 'testimoni'}
    {#if testiForm}
      <div class="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-5">
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
        <button type="button" onclick={() => (testiForm = newItemForm('testimonials'))} class="flex items-center gap-2 rounded-2xl border border-white/15 px-4 py-2.5 text-xs font-bold text-bone/80 transition hover:border-gold focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none">
          <Plus size={15} /> Tambah testimoni
        </button>
      </div>
      <ul class="space-y-3">
        {#each testi as t (t.id)}
          <li class="rounded-3xl border border-white/10 bg-white/5 p-4">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="text-sm font-bold">{t.title} <span class="font-normal text-bone/50">· {t.meta.olahraga ?? ''}</span></p>
                <p class="mt-1 line-clamp-2 text-xs text-bone/60">“{t.body}”</p>
              </div>
              <div class="flex shrink-0 gap-2">
                <button
                  type="button"
                  onclick={() => (testiForm = { id: t.id, title: t.title, body: t.body, meta: { ...t.meta }, sort: t.sort, active: t.active === 1 })}
                  aria-label={`Edit ${t.title}`}
                  class="rounded-xl border border-white/15 p-2.5 text-bone/70 transition hover:border-gold hover:text-gold focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
                >
                  <Pen size={15} />
                </button>
                <button
                  type="button"
                  onclick={() => deleteItem('testimonials', t.id)}
                  aria-label={`Hapus ${t.title}`}
                  class="rounded-xl border border-white/15 p-2.5 text-bone/70 transition hover:border-brand hover:text-brand focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
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
      <div class="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-5">
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
        <button type="button" onclick={() => (faqForm = newItemForm('faq'))} class="flex items-center gap-2 rounded-2xl border border-white/15 px-4 py-2.5 text-xs font-bold text-bone/80 transition hover:border-gold focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none">
          <Plus size={15} /> Tambah FAQ
        </button>
      </div>
      <ul class="space-y-3">
        {#each faq as f (f.id)}
          <li class="rounded-3xl border border-white/10 bg-white/5 p-4">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <span class="rounded-full border border-gold/40 bg-gold/10 px-2.5 py-0.5 text-[10px] font-black tracking-wider text-gold uppercase">{f.meta.grup ?? 'Umum'}</span>
                <p class="mt-2 text-sm font-bold">{f.title}</p>
                <p class="mt-1 line-clamp-2 text-xs text-bone/60">{f.body}</p>
              </div>
              <div class="flex shrink-0 gap-2">
                <button
                  type="button"
                  onclick={() => (faqForm = { id: f.id, title: f.title, body: f.body, meta: { ...f.meta }, sort: f.sort, active: f.active === 1 })}
                  aria-label={`Edit ${f.title}`}
                  class="rounded-xl border border-white/15 p-2.5 text-bone/70 transition hover:border-gold hover:text-gold focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
                >
                  <Pen size={15} />
                </button>
                <button
                  type="button"
                  onclick={() => deleteItem('faq', f.id)}
                  aria-label={`Hapus ${f.title}`}
                  class="rounded-xl border border-white/15 p-2.5 text-bone/70 transition hover:border-brand hover:text-brand focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
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
    <div class="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-5">
      {#each stats as s (s.id)}
        <div class="flex flex-wrap items-end gap-4 border-b border-white/10 pb-4 last:border-0 last:pb-0">
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
