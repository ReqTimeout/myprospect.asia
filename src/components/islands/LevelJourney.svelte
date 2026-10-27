<script lang="ts">
  import { Check } from '@lucide/svelte';

  const levels = ['Basic', 'Development', 'Impact'] as const;

  const levelInfo: Record<(typeof levels)[number], string> = {
    Basic: 'Mulai dari nol — fondasi public speaking & English atlet.',
    Development: 'Kembangkan kemampuan — gaya komunikasi & storytelling.',
    Impact: 'Komunikasi dengan percaya diri — siap wawancara media & panggung.',
  };

  const months = [
    { bulan: 'Bulan 1', teks: 'Atlet bisa berkomunikasi' },
    { bulan: 'Bulan 2', teks: 'Atlet bisa mengekspresikan diri' },
    { bulan: 'Bulan 3', teks: 'Atlet bisa mewakili diri & tim' },
    { bulan: 'Bulan 4', teks: 'Atlet bisa membangun identitas diri' },
  ];

  let active = $state<(typeof levels)[number]>('Basic');
</script>

<div class="flex flex-col gap-8 md:flex-row md:items-start md:gap-12">
  <div class="md:w-1/2">
    <div
      class="inline-flex rounded-2xl border border-white/10 bg-white/5 p-1"
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
            'rounded-xl px-3.5 py-2.5 text-xs font-bold tracking-wide transition focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none sm:text-sm',
            active === level ? 'bg-brand text-white' : 'text-bone/60',
          ]}
        >
          {level}
        </button>
      {/each}
    </div>

    <p class="mt-5 text-sm leading-relaxed text-bone/70 md:text-base">
      {levelInfo[active]}
    </p>

    <p class="mt-4 inline-block rounded-full border border-gold/40 bg-gold/10 px-3.5 py-1.5 text-xs font-semibold text-gold">
      Level ditentukan lewat tes penempatan
    </p>
  </div>

  <ol class="relative md:w-1/2">
    <span class="absolute top-2 bottom-2 left-[11px] w-px bg-gradient-to-b from-gold via-gold/40 to-transparent" aria-hidden="true">
    </span>
    {#each months as m, i (m.bulan)}
      <li class="relative flex gap-4 pb-6 last:pb-0">
        <span
          class="relative z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-gold/50 bg-ink text-gold"
        >
          {#if i < 3}
            <Check size={12} strokeWidth={3} />
          {:else}
            <span class="h-1.5 w-1.5 rounded-full bg-gold"></span>
          {/if}
        </span>
        <div>
          <p class="text-[11px] font-bold tracking-widest text-gold uppercase">{m.bulan}</p>
          <p class="mt-0.5 text-sm text-bone/85 sm:text-base">{m.teks}</p>
        </div>
      </li>
    {/each}
  </ol>
</div>
