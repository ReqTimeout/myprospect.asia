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

<ul class="grid grid-cols-3 divide-x divide-ink/10">
  {#each list as s (s.label)}
    <li class="min-w-0 px-2 py-2 text-center sm:px-4 sm:py-3">
      <p class="score-digits text-4xl leading-none text-ink sm:text-6xl">
        <Counter to={s.to} suffix={s.suffix} />
      </p>
      <span class="mx-auto mt-3 block h-0.5 w-9 bg-brand" aria-hidden="true"></span>
      <p class="mt-2 text-[9px] leading-tight font-bold tracking-[0.1em] text-ink uppercase break-words sm:text-[11px] sm:tracking-[0.16em]">
        {s.label}
      </p>
    </li>
  {/each}
</ul>
