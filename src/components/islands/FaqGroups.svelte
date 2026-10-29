<script lang="ts">
  import { onMount } from 'svelte';
  import type { FaqItem } from '../../data/faq';
  import { liveJson } from '../../lib/live';

  interface Props {
    items: FaqItem[];
  }

  let { items }: Props = $props();

  let list = $state<FaqItem[]>(items);

  const grupOrder: FaqItem['grup'][] = ['Umum', 'Program', 'Workshop', 'Pembayaran'];

  let grouped = $derived(
    grupOrder
      .map((g) => ({ grup: g, items: list.filter((f) => f.grup === g) }))
      .filter((g) => g.items.length > 0),
  );

  onMount(async () => {
    const data = await liveJson<{ title: string; body: string; meta: { grup?: string } }[]>('/api/content/faq');
    if (data && data.length > 0) {
      list = data.map((f) => ({
        grup: (f.meta.grup ?? 'Umum') as FaqItem['grup'],
        q: f.title,
        a: f.body,
      }));
    }
  });
</script>

<div class="space-y-10">
  {#each grouped as g (g.grup)}
    <section>
      <h2 class="display mb-4 text-2xl text-brand-dark">{g.grup}</h2>
      <div class="space-y-3">
        {#each g.items as f, i (f.q)}
          <details class="group rounded-2xl border border-ink/10 bg-white shadow-sm open:border-brand/40" open={i === 0 && g.grup === 'Umum'}>
            <summary class="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-sm font-bold transition hover:text-brand-dark focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none sm:text-base">
              {f.q}
              <span class="shrink-0 text-brand-dark transition-transform duration-200 group-open:rotate-45" aria-hidden="true">+</span>
            </summary>
            <p class="px-5 pb-5 text-sm leading-relaxed text-ink/70">{f.a}</p>
          </details>
        {/each}
      </div>
    </section>
  {/each}
</div>
