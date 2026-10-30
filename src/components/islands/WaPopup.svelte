<script lang="ts">
  import { onMount } from 'svelte';
  import { X, MessageCircle } from '@lucide/svelte';
  import { waLink } from '../../lib/wa';

  let open = $state(false);
  let dismissed = $state(false);
  let fired = $state(false);
  let mobile = $state(false);
  let closing = $state(false);
  let autoTimer = 0;
  let closeTimer = 0;
  let popupText = $state('Hai! Mau tanya lebih jauh soal program? Chat aja langsung, gratis kok. 😊');
  let waNumber = $state('');

  const KEY = 'pa_popup_seen';

  function openCard(auto: boolean) {
    fired = true;
    closing = false;
    open = true;
    try {
      sessionStorage.setItem(KEY, '1');
    } catch {}
    window.dispatchEvent(new CustomEvent('pa:popup_open'));
    window.clearTimeout(autoTimer);
    if (auto) autoTimer = window.setTimeout(collapse, 6500);
  }

  function collapse() {
    if (!open) return;
    window.clearTimeout(autoTimer);
    closing = true;
    window.clearTimeout(closeTimer);
    closeTimer = window.setTimeout(() => {
      open = false;
      closing = false;
    }, 220);
  }

  function show() {
    if (fired || dismissed) return;
    openCard(true);
  }

  function close() {
    window.clearTimeout(autoTimer);
    window.clearTimeout(closeTimer);
    open = false;
    closing = false;
    dismissed = true;
  }

  function toggle() {
    if (open) {
      close();
      return;
    }
    openCard(false);
  }

  onMount(() => {
    let cancelled = false;
    let timer = 0;

    mobile = window.matchMedia('(max-width: 1023px)').matches;

    const onScroll = () => {
      const doc = document.documentElement;
      const pct = doc.scrollTop / (doc.scrollHeight - doc.clientHeight || 1);
      if (pct >= 0.4) show();
    };

    (async () => {
      let enabled = '1';
      let delay = '8';
      let text = '';
      let wa = '';
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const s = (await res.json()) as Record<string, string>;
          enabled = s.popup_enabled ?? '1';
          delay = s.popup_delay_sec ?? '8';
          text = s.popup_text ?? '';
          wa = s.wa_number ?? '';
        }
      } catch {}

      if (cancelled || enabled !== '1') return;
      if (text) popupText = text;
      if (wa) waNumber = wa;

      try {
        if (sessionStorage.getItem(KEY)) {
          dismissed = true;
          return;
        }
      } catch {}

      // Di mobile kartu tidak pernah muncul otomatis — hanya bubble kecil yang bisa diklik,
      // supaya CTA dan judul tidak tertutup.
      if (mobile) return;

      timer = window.setTimeout(show, Math.min(Number(delay) || 8, 120) * 1000);
      window.addEventListener('scroll', onScroll, { passive: true });
    })();

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      window.clearTimeout(autoTimer);
      window.clearTimeout(closeTimer);
      window.removeEventListener('scroll', onScroll);
    };
  });
</script>

{#if !open && !dismissed && !mobile}
  <button
    type="button"
    onclick={toggle}
    class="fixed right-4 bottom-6 z-40 hidden h-12 w-12 items-center justify-center rounded-full bg-brand text-ink shadow-[0_14px_30px_-10px_rgba(255,122,26,0.75)] transition hover:bg-brand-dark focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none active:scale-90 lg:flex"
    aria-label="Buka chat WhatsApp admin"
  >
    <span class="pointer-events-none absolute inset-1 animate-ping rounded-full bg-brand/35" aria-hidden="true"></span>
    <MessageCircle class="relative" size={22} strokeWidth={2.2} />
  </button>
{/if}

{#if open}
  <div
    class="fixed right-4 bottom-6 z-40 w-[min(17rem,calc(100vw-2rem))] origin-bottom-right"
    class:animate-slide-up={!closing}
    class:animate-slide-down={closing}
    role="dialog"
    aria-label="Chat admin"
  >
    <div class="rounded-3xl border border-ink/10 bg-paper-deep/95 p-4 shadow-[0_24px_50px_-16px_rgba(36,26,18,0.3)] backdrop-blur-xl">
      <div class="mb-2 flex items-start justify-between gap-2">
        <div class="flex items-center gap-2">
          <span class="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-[11px] font-black text-ink italic">
            P
          </span>
          <div class="leading-tight">
            <p class="text-xs font-bold">Admin Prospect</p>
            <p class="text-[10px] text-ink/50">online · balas cepat</p>
          </div>
        </div>
        <button
          type="button"
          onclick={close}
          class="rounded-full p-1 text-ink/50 transition hover:bg-ink/[0.06] hover:text-ink focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
          aria-label="Tutup"
        >
          <X size={14} />
        </button>
      </div>

      <p class="mb-3 rounded-2xl rounded-tl-md bg-paper-deep px-3 py-2 text-[13px] leading-relaxed text-ink/85">
        {popupText}
      </p>

      <a
        href={waLink({ source: 'popup', number: waNumber })}
        target="_blank"
        rel="noopener noreferrer"
        data-wa-cta="popup"
        onclick={() => window.clearTimeout(autoTimer)}
        class="flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-3 py-2.5 text-[13px] font-bold text-ink transition hover:bg-brand-dark focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none active:scale-95"
      >
        <MessageCircle size={16} strokeWidth={2.4} />
        Chat admin sekarang
      </a>
    </div>
  </div>
{/if}
