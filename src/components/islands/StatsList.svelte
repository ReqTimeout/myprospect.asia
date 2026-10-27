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

<ul class="grid grid-cols-3 gap-3 sm:gap-6">
  {#each list as s (s.label)}
    <li class="rounded-3xl border border-white/10 bg-white/5 px-3 py-6 text-center sm:px-6">
      <p class="display text-3xl text-gold sm:text-5xl">
        <Counter to={s.to} suffix={s.suffix} />
      </p>
      <p class="mt-2 text-[11px] font-semibold tracking-wide text-bone/60 uppercase sm:text-xs">{s.label}</p>
    </li>
  {/each}
</ul>
