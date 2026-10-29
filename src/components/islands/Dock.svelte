<script lang="ts">
  import { onMount } from 'svelte';
  import { Home, LayoutGrid, Presentation, Newspaper, MessageCircle } from '@lucide/svelte';
  import { waLink } from '../../lib/wa';

  type Item = {
    id: string;
    label: string;
    href: string;
    icon: typeof Home;
    wa?: boolean;
  };

  const items: Item[] = [
    { id: 'home', label: 'Home', href: '/', icon: Home },
    { id: 'program', label: 'Program', href: '/#program', icon: LayoutGrid },
    { id: 'workshop', label: 'Workshop', href: '/#workshop', icon: Presentation },
    { id: 'berita', label: 'Berita', href: '/berita', icon: Newspaper },
    { id: 'chat', label: 'Chat', href: waLink({ source: 'dock' }), icon: MessageCircle, wa: true },
  ];

  let active = $state('home');
  let hidden = $state(false);
  let ready = $state(false);

  onMount(() => {
    ready = true;
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
      const h = window.location.hash.replace('#', '');
      if (h) active = h;
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('hashchange', onHash);
    onHash();

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('hashchange', onHash);
    };
  });
</script>

<nav
  aria-label="Navigasi utama"
  class={[
    'fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] transition-transform duration-300 ease-out lg:hidden',
    hidden && ready ? 'translate-y-[130%]' : 'translate-y-0',
  ]}
>
  <div
    class="flex items-end gap-1 rounded-3xl border border-ink/10 bg-paper/85 px-2 py-2 shadow-[0_18px_40px_-12px_rgba(36,26,18,0.28)] backdrop-blur-xl"
  >
    {#each items as item (item.id)}
      {@const isActive = active === item.id && !item.wa}
      {#if item.wa}
        <a
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          data-wa-cta="dock"
          class="ml-1 flex h-13 w-13 items-center justify-center rounded-2xl bg-brand text-ink shadow-[0_10px_22px_-8px_rgba(255,122,26,0.7)] transition active:scale-90 focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
          aria-label="Chat WhatsApp admin"
        >
          <item.icon size={24} strokeWidth={2.2} />
        </a>
      {:else}
        <a
          href={item.href}
          data-dock={item.id}
          class={[
            'relative flex min-w-15 flex-col items-center gap-0.5 rounded-2xl px-2.5 pt-1.5 pb-1 transition focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none',
            isActive ? 'text-brand-dark' : 'text-ink/60',
          ]}
          aria-current={isActive ? 'page' : undefined}
        >
          <span
            class="transition-transform duration-300"
            class:scale-110={isActive}
            class:-translate-y-0.5={isActive}
          >
            <item.icon size={21} strokeWidth={isActive ? 2.4 : 1.8} />
          </span>
          <span class="text-[10px] font-semibold tracking-wide" class:opacity-100={isActive} class:opacity-0={!isActive}>
            {item.label}
          </span>
          <span
            class={[
              'absolute -bottom-0.5 h-1 w-1 rounded-full bg-gold transition-all duration-300',
              isActive ? 'scale-100 opacity-100' : 'scale-0 opacity-0',
            ]}
          ></span>
        </a>
      {/if}
    {/each}
  </div>
</nav>
