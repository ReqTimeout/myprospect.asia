<script lang="ts">
  import { onMount } from 'svelte';
  import type { FaqItem } from '../../data/faq';
  import { liveJson } from '../../lib/live';

  interface Props {
    items: FaqItem[];
    limit?: number;
  }

  let { items, limit }: Props = $props();

  let list = $state<FaqItem[]>(items);

  onMount(async () => {
    const data = await liveJson<{ title: string; body: string; meta: { grup?: string } }[]>('/api/content/faq');
    if (data && data.length > 0) {
      const mapped = data.map((f) => ({
        grup: (f.meta.grup ?? 'Umum') as FaqItem['grup'],
        q: f.title,
        a: f.body,
      }));
      list = limit ? mapped.slice(0, limit) : mapped;
    }
  });
</script>

<div class="space-y-3">
  {#each list as f, i (f.q)}
    <details class="group rounded-2xl border border-white/10 bg-white/5 open:border-gold/40" open={i === 0}>
      <summary class="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-sm font-bold transition hover:text-gold focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none sm:text-base">
        {f.q}
        <span class="shrink-0 text-gold transition-transform duration-200 group-open:rotate-45" aria-hidden="true">+</span>
      </summary>
      <p class="px-5 pb-5 text-sm leading-relaxed text-bone/70">{f.a}</p>
    </details>
  {/each}
</div>
