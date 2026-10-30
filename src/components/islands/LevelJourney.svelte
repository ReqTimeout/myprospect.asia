<script lang="ts">
  import { Check, ClipboardCheck, Target } from '@lucide/svelte';

  const levels = ['Basic', 'Development', 'Impact'] as const;
  type Level = (typeof levels)[number];

  const levelInfo: Record<Level, string> = {
    Basic: 'Mulai dari nol — fondasi public speaking & English atlet.',
    Development: 'Kembangkan kemampuan — gaya komunikasi & storytelling.',
    Impact: 'Komunikasi dengan percaya diri — siap wawancara media & panggung.',
  };

  const levelMeta: Record<Level, { no: string; judul: string; fokus: string[]; target: string }> = {
    Basic: {
      no: '01',
      judul: 'Bangun Fondasi',
      fokus: ['Public speaking dasar', 'Grammar & pronunciation', 'Body language', 'Perkenalan diri'],
      target: 'Siap tampil 1–2 menit di depan kamera',
    },
    Development: {
      no: '02',
      judul: 'Kembangkan Diri',
      fokus: ['Storytelling atlet', 'Simulasi wawancara', 'Bahasa Inggris situasi nyata', 'Konten & branding diri'],
      target: 'Siap tampil 3–5 menit & latihan media',
    },
    Impact: {
      no: '03',
      judul: 'Siak Panggung',
      fokus: ['Konferensi pers', 'On-camera presence', 'Media kit & bio', 'Sponsorship & personal branding'],
      target: 'Siap tampil di panggung & depan wartawanan',
    },
  };

  const months = [
    { bulan: 'Bulan 1', teks: 'Atlet bisa berkomunikasi' },
    { bulan: 'Bulan 2', teks: 'Atlet bisa mengekspresikan diri' },
    { bulan: 'Bulan 3', teks: 'Atlet bisa mewakili diri & tim' },
    { bulan: 'Bulan 4', teks: 'Atlet bisa membangun identitas diri' },
  ];

  let active = $state<Level>('Basic');
  const meta = $derived(levelMeta[active]);
</script>

<div class="flex flex-col gap-8 md:flex-row md:items-start md:gap-12">
  <div class="md:w-1/2">
    <div
      class="inline-flex rounded-2xl border border-ink/10 bg-white p-1 shadow-sm"
      role="tablist"
      aria-label="Level program"
    >
      {#each levels as level (level)}
        <button
          type="button"
          role="tab"
          aria-selected={active === level}
          onclick={() => (active = level)}
          class={[
            'rounded-xl px-3.5 py-2.5 text-xs font-bold tracking-wide transition focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none sm:text-sm',
            active === level ? 'bg-brand text-ink' : 'text-ink/60',
          ]}
        >
          {level}
        </button>
      {/each}
    </div>

    <div class="mt-6 flex items-start gap-4">
      <span class="display shrink-0 text-6xl leading-none text-brand/25 sm:text-7xl">{meta.no}</span>
      <div class="min-w-0">
        <p class="display text-2xl leading-none text-brand-dark sm:text-3xl">{meta.judul}</p>
        <p class="mt-2 text-sm leading-relaxed text-ink/70 md:text-base">{levelInfo[active]}</p>
      </div>
    </div>

    <ul class="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
      {#each meta.fokus as f (f)}
        <li class="flex items-center gap-2 rounded-xl border border-ink/10 bg-white/70 px-3 py-2 text-[12px] font-semibold text-ink/75">
          <span class="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brand/20 text-brand-dark" aria-hidden="true">
            <Check size={10} strokeWidth={3.5} />
          </span>
          <span class="min-w-0 break-words">{f}</span>
        </li>
      {/each}
    </ul>

    <div class="mt-5 space-y-2">
      <p class="flex items-center gap-2 rounded-2xl border border-gold/40 bg-gold/10 px-3.5 py-2.5 text-xs font-bold text-brand-dark">
        <ClipboardCheck size={15} strokeWidth={2.4} class="shrink-0" aria-hidden="true" />
        Level ditentukan lewat tes penempatan
      </p>
      <p class="flex items-start gap-2 rounded-2xl border border-ink/10 bg-white px-3.5 py-2.5 text-xs leading-relaxed text-ink/65">
        <Target size={15} strokeWidth={2.4} class="mt-0.5 shrink-0 text-brand-dark" aria-hidden="true" />
        {meta.target}
      </p>
    </div>
  </div>

  <div class="md:w-1/2">
    <p class="mb-4 flex items-center gap-2 text-[11px] font-black tracking-[0.2em] text-ink/45 uppercase">
      <span class="h-px w-6 bg-ink/25"></span>
      Target 4 bulan
    </p>
    <ol class="relative">
      <span class="absolute top-2 bottom-2 left-[11px] w-px bg-gradient-to-b from-brand via-brand/40 to-transparent" aria-hidden="true">
      </span>
      {#each months as m, i (m.bulan)}
        <li class="relative flex gap-4 pb-6 last:pb-0">
          <span
            class="relative z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-gold/50 bg-paper text-brand-dark"
          >
            {#if i < 3}
              <Check size={12} strokeWidth={3} />
            {:else}
              <span class="h-1.5 w-1.5 rounded-full bg-gold"></span>
            {/if}
          </span>
          <div>
            <p class="text-[11px] font-bold tracking-widest text-brand-dark uppercase">{m.bulan}</p>
            <p class="mt-0.5 text-sm text-ink/85 sm:text-base">{m.teks}</p>
          </div>
        </li>
      {/each}
    </ol>
  </div>
</div>