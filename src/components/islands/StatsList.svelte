<script lang="ts">
  import { onMount } from 'svelte';
  import Counter from './Counter.svelte';
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

<ul class="grid grid-cols-3 gap-2 sm:gap-4">
  {#each list as s (s.label)}
    <li class="min-w-0 overflow-hidden rounded-2xl bg-white px-2 py-5 text-center shadow-soft sm:rounded-3xl sm:px-5 sm:py-6">
      <p class="score-digits text-2xl text-brand-dark sm:text-5xl">
        <Counter to={s.to} suffix={s.suffix} />
      </p>
      <p class="mt-1.5 text-[9px] leading-tight font-bold tracking-wide text-ink/55 uppercase break-words sm:text-xs sm:tracking-wider">
        {s.label}
      </p>
    </li>
  {/each}
</ul>