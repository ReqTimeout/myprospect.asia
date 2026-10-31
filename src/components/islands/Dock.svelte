<script lang="ts">
  import { onMount } from 'svelte';
  import { DOCK_ITEMS, type DockItem } from '../../lib/dock';
  import { waLink } from '../../lib/wa';

  // `active` dikirim halaman Astro supaya state aktif sudah benar sejak SSR —
  // tanpa prop ini, /berita dan /faq sempat merender "Home" sebagai item aktif.
  let { active = '' }: { active?: string } = $props();

  const items: DockItem[] = DOCK_ITEMS.map((i) =>
    i.wa ? { ...i, href: waLink({ source: 'dock' }) } : i,
  );

  let current = $state(active);
  let hidden = $state(false);
  let ready = $state(false);

  function detect(): string {
    const h = window.location.hash.replace('#', '');
    if (h && items.some((i) => i.id === h && !i.wa)) return h;
    return active;
  }

  onMount(() => {
    ready = true;
    current = detect();
    let lastY = window.scrollY;
    let ticking = false;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        const dy = y - lastY;
        if (y < 120) hidden = false;
        else if (dy > 14) hidden = true;
        else if (dy < -14) hidden = false;
        lastY = y;
        ticking = false;
      });
    };

    const onHash = () => {
      current = detect();
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('hashchange', onHash);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('hashchange', onHash);
    };
  });
</script>

<nav
  aria-label="Navigasi utama"
  class={[
    'fixed inset-x-0 bottom-0 z-50 flex justify-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] transition-transform duration-300 ease-out lg:hidden',
    hidden && ready ? 'translate-y-[130%]' : 'translate-y-0',
  ]}
>
  <div
    class="flex w-full max-w-md items-stretch gap-1 rounded-3xl border border-ink/10 bg-paper/85 px-2 py-2 shadow-[0_18px_40px_-12px_rgba(36,26,18,0.28)] backdrop-blur-xl"
  >
    {#each items as item (item.id)}
      {@const isActive = item.id === current && !item.wa}
      <a
        href={item.href}
        data-dock={item.id}
        target={item.wa ? '_blank' : undefined}
        rel={item.wa ? 'noopener noreferrer' : undefined}
        data-wa-cta={item.wa ? 'dock' : undefined}
        aria-label={item.wa ? 'Chat WhatsApp admin' : item.label}
        aria-current={isActive ? 'page' : undefined}
        class={[
          'flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl px-1 py-1.5 transition focus-visible:ring-2 focus-visible:outline-none active:scale-95',
          item.wa ? 'focus-visible:ring-wa' : 'focus-visible:ring-brand',
          isActive ? 'text-brand-dark' : 'text-ink/55',
        ]}
      >
        <span
          class={[
            'grid h-10 w-10 place-items-center rounded-2xl transition-transform duration-300',
            item.wa
              ? 'bg-wa text-ink shadow-[0_8px_18px_-8px_rgba(37,211,102,0.9)]'
              : isActive
                ? 'scale-110 -translate-y-0.5 bg-brand/10'
                : '',
          ]}
        >
          {#if item.filled}
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">{@html item.icon}</svg>
          {:else}
            <svg
              viewBox="0 0 24 24"
              width="21"
              height="21"
              fill="none"
              stroke="currentColor"
              stroke-width={isActive ? 2.4 : 1.8}
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              {@html item.icon}
            </svg>
          {/if}
        </span>
        <span
          class={[
            'text-[9px] leading-none font-semibold tracking-tight whitespace-nowrap',
            item.wa ? 'text-ink/70' : isActive ? 'text-brand-dark' : 'text-ink/55',
          ]}
        >
          {item.label}
        </span>
      </a>
    {/each}
  </div>
</nav>
