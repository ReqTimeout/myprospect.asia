<script lang="ts">
  /**
   * Angka seven-segment (papan skor LED).
   *
   * Render sendiri, bukan font: tiap digit digambar dari 7 segmen polygonal
   * (a..g) supaya benar-benar terlihat seperti papan skor stadion —
   * segmen yang "mati" tetap terlihat redup seperti LED yang tidak menyala.
   *
   * Angka ikut menghitung naik seperti Counter (rAF + easing), jadi saat data
   * masuk angkanya berdenyut seperti papan LED yang di-update.
   */
  import { onMount } from 'svelte';

  interface Props {
    to: number;
    suffix?: string;
    class?: string;
  }

  let { to, suffix = '', class: cls = '' }: Props = $props();

  type Glyph =
    | { kind: 'digit'; ch: string; x: number }
    | { kind: 'dot'; x: number }
    | { kind: 'plus'; x: number };

  /* Glif seven-segment dirapatkan (x discale ~0.72 dari lebar semula) supaya
     angka panjang "2.175+" tetap muat dalam satu kolom di HP dengan tinggi
     yang hampir sama dengan angka pendek. Layar LED Seven-Segment aslinya
     memang ramping. */
  const SEG_POINTS: Record<string, string> = {
    a: '18,8 70,8 64,25 24,25',
    g: '15,80 64,80 58,97 21,97',
    d: '17,152 63,152 57,169 23,169',
    f: '14,12 28,12 28,78 14,78',
    b: '61,12 75,12 75,78 61,78',
    e: '14,99 28,99 28,165 14,165',
    c: '61,99 75,99 75,165 61,165',
  };

  /* Digit '1' hanya menyalakan segmen kanan, jadi glifnya harus digeser ke
     tengah sel — kalau tidak dia menempel ke digit berikutnya ("2175" jadi
     "21 75" dan huruf '1' nabrak '7'). */
  const DIGIT_OFFSET: Record<string, number> = { '1': -27 };

  const LIT: Record<string, string> = {
    '0': 'abcdef',
    '1': 'bc',
    '2': 'abged',
    '3': 'abgcd',
    '4': 'fgbc',
    '5': 'afgcd',
    '6': 'afgecd',
    '7': 'abc',
    '8': 'abcdefg',
    '9': 'abcdfg',
  };

  const SKEW = -5;
  const DIGIT_W = 82;
  const DOT_W = 24;
  const PLUS_W = 42;

  let el = $state<HTMLElement | undefined>(undefined);
  let value = $state(0);

  onMount(() => {
    const node = el;
    if (!node) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      value = to;
      return;
    }

    let started = false;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting || started) return;
        started = true;
        const start = performance.now();
        const duration = 1200;
        const tick = (now: number) => {
          const t = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - t, 3);
          value = Math.round(to * eased);
          if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        io.disconnect();
      },
      { threshold: 0.4 },
    );
    io.observe(node);
    return () => io.disconnect();
  });

  const text = $derived(`${new Intl.NumberFormat('id-ID').format(value)}${suffix}`);
  // Teks untuk screen reader: nilai FINAL (bukan angka yang lagi berdenyut),
  // dan warnanya mengikuti papan gelap supaya audit kontras tidak salah baca.
  const accessible = $derived(`${new Intl.NumberFormat('id-ID').format(to)}${suffix}`);

  const layout = $derived.by(() => {
    let x = 0;
    const items: Glyph[] = [];
    for (const ch of text) {
      if (ch >= '0' && ch <= '9') {
        items.push({ kind: 'digit', ch, x });
        x += DIGIT_W;
      } else if (ch === '.') {
        items.push({ kind: 'dot', x });
        x += DOT_W;
      } else if (ch === '+') {
        items.push({ kind: 'plus', x });
        x += PLUS_W;
      }
    }
    return { items, total: Math.max(x, 1) };
  });
</script>

<span bind:this={el}>
  <span class="sr-only text-white/75">{accessible}</span>
  <svg
    viewBox={`-20 0 ${layout.total + 40} 180`}
    class={cls}
    aria-hidden="true"
    preserveAspectRatio="xMidYMid meet"
    focusable="false"
  >
    <g transform={`skewX(${SKEW})`}>
    {#each layout.items as g (g.x)}
      {#if g.kind === 'digit'}
        <g transform={`translate(${g.x + (DIGIT_OFFSET[g.ch] ?? 0)},0)`}>
          {#each Object.entries(SEG_POINTS) as [name, pts] (name)}
            {#if !LIT[g.ch].includes(name)}
              <polygon points={pts} fill="rgba(255,128,0,0.045)" />
            {/if}
          {/each}
          <g class="led-lit">
            {#each Object.entries(SEG_POINTS) as [name, pts] (name)}
              {#if LIT[g.ch].includes(name)}
                <polygon points={pts} fill="var(--color-brand)" />
              {/if}
            {/each}
          </g>
        </g>
      {:else if g.kind === 'dot'}
        <circle cx={g.x + 12} cy="160" r="6" fill="var(--color-brand)" />
      {:else}
        <g transform={`translate(${g.x + (DIGIT_OFFSET[g.ch] ?? 0)},0)`}>
          <rect x="8" y="126" width="26" height="12" fill="var(--color-brand)" />
          <rect x="15" y="116" width="12" height="32" fill="var(--color-brand)" />
        </g>
      {/if}
    {/each}
    </g>
  </svg>
</span>
