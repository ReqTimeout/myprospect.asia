<script lang="ts">
  import { onMount } from 'svelte';
  import LedNumber from './LedNumber.svelte';
  import { liveJson } from '../../lib/live';

  type Stat = { to: number; suffix: string; label: string };

  interface Props {
    stats: Stat[];
  }

  let { stats }: Props = $props();

  let list = $state<Stat[]>(stats);

  onMount(async () => {
    const data = await liveJson<{ title: string; meta: { to?: number; suffix?: string } }[]>('/api/content/stats');
    if (data && data.length > 0) {
      list = data.map((s) => ({
        to: Number(s.meta.to) || 0,
        suffix: typeof s.meta.suffix === 'string' ? s.meta.suffix : '',
        label: s.title,
      }));
    }
  });
</script>

<!-- Papan skor: tiga kolom dipisah garis, angka seven-segment (LED). -->
<ul class="grid grid-cols-3 divide-x divide-white/10">
  {#each list as s (s.label)}
    <li class="min-w-0 px-2 py-3 text-center sm:px-4 sm:py-4">
      <LedNumber to={s.to} suffix={s.suffix} class="mx-auto h-9 w-auto sm:h-14" />
      <span class="mx-auto mt-3 block h-0.5 w-9 bg-brand/80" aria-hidden="true"></span>
      <p class="mt-2 text-[9px] leading-tight font-bold tracking-[0.1em] text-white/55 uppercase break-words sm:text-[10px] sm:tracking-[0.16em]">
        {s.label}
      </p>
    </li>
  {/each}
</ul>
