<script lang="ts">
  import { onMount } from 'svelte';
  import { X, Send, Check, CircleAlert } from '@lucide/svelte';

  interface Props {
    programs?: string[];
    workshops?: string[];
  }

  let { programs = [], workshops = [] }: Props = $props();

  let open = $state(false);
  let nama = $state('');
  let wa = $state('');
  let program = $state('');
  let programTambahan = $state('');
  let catatan = $state('');
  let sumber = $state('web');
  let sending = $state(false);
  let error = $state('');
  let done = $state(false);
  let waUrl = $state('');
  let namaInput: HTMLInputElement | undefined = $state();

  const opsi = $derived(
    programTambahan && ![...programs, ...workshops].includes(programTambahan)
      ? [...programs, ...workshops, programTambahan]
      : [...programs, ...workshops],
  );

  function openModal(detail: { program?: string; source?: string }) {
    programTambahan = detail.program || '';
    program = detail.program || '';
    sumber = detail.source || 'web';
    error = '';
    done = false;
    waUrl = '';
    open = true;
    document.body.style.overflow = 'hidden';
    setTimeout(() => namaInput?.focus(), 80);
  }

  function close() {
    open = false;
    document.body.style.overflow = '';
  }

  async function submit(e: SubmitEvent) {
    e.preventDefault();
    if (sending) return;
    sending = true;
    error = '';

    // Svelte mem-parse kurung kurawal di dalam attribute sebagai ekspresi,
    // jadi atribut pattern HTML dibuang — validasi format dilakukan di sini.
    const digitWa = wa.replace(/\D/g, '');
    if (digitWa.length < 10 || digitWa.length > 18) {
      error = 'Nomor WhatsApp belum valid. Contoh: 081234567890.';
      sending = false;
      return;
    }

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          nama,
          wa,
          program: program || 'Konsultasi program',
          catatan,
          sumber,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.waUrl) {
        error = data?.message || 'Gagal mengirim. Coba lagi, atau chat langsung via WhatsApp.';
        sending = false;
        return;
      }
      done = true;
      waUrl = data.waUrl;
      (window as any).gtag?.('event', 'lead_submit', { cta: 'register-modal' });
    } catch {
      error = 'Tidak ada koneksi. Coba lagi, atau chat langsung via WhatsApp.';
      sending = false;
    }
  }

  onMount(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const el = target?.closest?.('[data-register]') as HTMLElement | null;
      if (!el) return;
      e.preventDefault();
      openModal({
        program: el.dataset.program || '',
        source: el.dataset.source || el.dataset.waCta || 'web',
      });
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) close();
    };
    document.addEventListener('click', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onClick);
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  });
</script>

{#if open}
  <div
    class="fixed inset-0 z-70 flex items-end justify-center bg-ink/65 backdrop-blur-sm sm:items-center sm:p-6"
    role="presentation"
    onclick={(e) => {
      if (e.target === e.currentTarget) close();
    }}
  >
    <div
      class="animate-slide-up relative w-full max-w-md rounded-t-3xl bg-paper shadow-[0_-18px_60px_-20px_rgba(36,26,18,0.45)] sm:animate-fade-in sm:rounded-3xl sm:shadow-[0_30px_70px_-24px_rgba(36,26,18,0.5)]"
      role="dialog"
      aria-modal="true"
      aria-label="Formulir pendaftaran"
    >
      <div class="flex items-start justify-between gap-3 border-b border-ink/10 px-5 py-4 sm:px-6">
        <div>
          <p class="text-[10px] font-black tracking-[0.24em] text-brand-dark uppercase">Formulir Daftar</p>
          <h2 class="display mt-1 text-2xl leading-tight sm:text-3xl">Ambil slot kamu</h2>
          <p class="mt-1 text-[11px] text-ink/50">Isi 30 detik, admin balas di jam kerja.</p>
        </div>
        <button
          type="button"
          onclick={close}
          aria-label="Tutup formulir"
          class="rounded-full p-1.5 text-ink/50 transition hover:bg-ink/6 hover:text-ink focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
        >
          <X size={16} />
        </button>
      </div>

      {#if done}
        <div class="flex flex-col items-center gap-3 px-6 py-12 text-center">
          <span class="flex h-14 w-14 items-center justify-center rounded-full bg-brand/15 text-brand-dark">
            <Check size={26} strokeWidth={2.6} />
          </span>
          <p class="display text-xl">Data terkirim!</p>
          <p class="text-sm text-ink/60">Lanjutkan pendaftaran lewat WhatsApp.</p>
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            class="mt-2 inline-flex items-center gap-2 rounded-2xl bg-brand px-6 py-3.5 text-sm font-bold text-ink transition hover:bg-brand-dark focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none active:scale-95"
          >
            <Send size={16} strokeWidth={2.4} />
            Buka WhatsApp
          </a>
          <button
            type="button"
            onclick={close}
            class="mt-1 text-xs font-bold text-ink/45 underline transition hover:text-ink focus-visible:outline-none"
          >
            Tutup
          </button>
        </div>
      {:else}
        <form class="px-5 pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-6 sm:pb-6" onsubmit={submit}>
          <label for="reg-nama" class="block text-[11px] font-black tracking-widest text-brand-dark uppercase">
            Nama atlet / wali
          </label>
          <input
            bind:this={namaInput}
            bind:value={nama}
            id="reg-nama"
            name="nama"
            required
            maxlength="80"
            autocomplete="name"
            placeholder="Nama lengkap"
            class="mt-2 w-full rounded-2xl border border-ink/15 bg-white px-4 py-3 text-sm text-ink placeholder:text-ink/35 focus:border-brand focus:outline-none"
          />

          <label for="reg-wa" class="mt-4 block text-[11px] font-black tracking-widest text-brand-dark uppercase">
            Nomor WhatsApp
          </label>
          <input
            id="reg-wa"
            name="wa"
            bind:value={wa}
            type="tel"
            required
            inputmode="tel"
            autocomplete="tel"
            placeholder="08xx xxxx xxxx"
            class="mt-2 w-full rounded-2xl border border-ink/15 bg-white px-4 py-3 text-sm text-ink placeholder:text-ink/35 focus:border-brand focus:outline-none"
          />

          <label for="reg-program" class="mt-4 block text-[11px] font-black tracking-widest text-brand-dark uppercase">
            Program yang diminati
          </label>
          <select
            id="reg-program"
            name="program"
            bind:value={program}
            class="mt-2 w-full rounded-2xl border border-ink/15 bg-white px-4 py-3 text-sm text-ink focus:border-brand focus:outline-none"
          >
            <option value="">Bantu saya pilih dulu</option>
            {#each opsi as o}
              <option value={o}>{o}</option>
            {/each}
          </select>

          <label for="reg-catatan" class="mt-4 block text-[11px] font-black tracking-widest text-brand-dark uppercase">
            Catatan <span class="font-semibold tracking-normal text-ink/40 normal-case">(opsional)</span>
          </label>
          <textarea
            id="reg-catatan"
            name="catatan"
            bind:value={catatan}
            rows="2"
            maxlength="200"
            placeholder="cth: atlet futsal usia 16, ingin ikut workshop"
            class="mt-2 w-full resize-none rounded-2xl border border-ink/15 bg-white px-4 py-3 text-sm text-ink placeholder:text-ink/35 focus:border-brand focus:outline-none"
          ></textarea>

          {#if error}
            <p class="mt-3 flex items-start gap-2 rounded-2xl bg-crimson/10 px-3 py-2 text-[12px] text-crimson">
              <CircleAlert size={15} class="mt-px shrink-0" />
              {error}
            </p>
          {/if}

          <button
            type="submit"
            disabled={sending}
            data-wa-cta="register-modal"
            class="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-brand px-6 py-3.5 text-sm font-bold text-ink transition hover:bg-brand-dark focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none active:scale-95 disabled:opacity-60"
          >
            <Send size={16} strokeWidth={2.4} />
            {sending ? 'Mengirim…' : 'Kirim & buka WhatsApp'}
          </button>
          <p class="mt-3 text-center text-[11px] leading-relaxed text-ink/45">
            Data hanya dipakai admin untuk membalas via WhatsApp.
          </p>
        </form>
      {/if}
    </div>
  </div>
{/if}