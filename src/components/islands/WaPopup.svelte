<script lang="ts">
  import { onMount } from 'svelte';
  import { X, MessageCircle } from '@lucide/svelte';
  import { waLink } from '../../lib/wa';

  let open = $state(false);
  let dismissed = $state(false);
  let fired = $state(false);
  let popupText = $state('Hai! Mau tanya lebih jauh soal program? Chat aja langsung, gratis kok. 😊');
  let waNumber = $state('');

  const KEY = 'pa_popup_seen';

  function show() {
    if (fired || dismissed) return;
    fired = true;
    open = true;
    try {
      sessionStorage.setItem(KEY, '1');
    } catch {}
    window.dispatchEvent(new CustomEvent('pa:popup_open'));
  }

  function close() {
    open = false;
    dismissed = true;
  }

  onMount(() => {
    let cancelled = false;
    let timer = 0;

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

      timer = window.setTimeout(show, Math.min(Number(delay) || 8, 120) * 1000);
      window.addEventListener('scroll', onScroll, { passive: true });
    })();

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      window.removeEventListener('scroll', onScroll);
    };
  });
</script>

{#if open}
  <div
    class="fixed right-4 bottom-24 z-40 w-64 origin-bottom-right animate-slide-up lg:bottom-6"
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
        class="flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-[13px] font-bold text-ink transition hover:bg-brand-dark focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none active:scale-95"
      >
        <MessageCircle size={16} strokeWidth={2.4} />
        Chat admin sekarang
      </a>
    </div>
  </div>
{/if}
