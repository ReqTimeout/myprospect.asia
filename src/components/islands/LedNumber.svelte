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

  const SEG_POINTS: Record<string, string> = {
    a: '20,8 92,8 84,25 28,25',
    g: '22,80 90,80 82,97 30,97',
    d: '24,152 88,152 80,169 32,169',
    f: '14,12 33,12 33,78 14,78',
    b: '79,12 98,12 98,78 79,78',
    e: '14,99 33,99 33,165 14,165',
    c: '79,99 98,99 98,165 79,165',
  };

  /* Digit '1' hanya menyalakan segmen kanan, jadi glifnya harus digeser ke
     tengah sel — kalau tidak dia menempel ke digit berikutnya ("2175" jadi
     "21 75" dan huruf '1' nabrak '7'). */
  const DIGIT_OFFSET: Record<string, number> = { '1': -33 };

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
  const DIGIT_W = 108;
  const DOT_W = 32;
  const PLUS_W = 56;

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
            <polygon
              points={pts}
              fill={LIT[g.ch].includes(name) ? 'var(--color-brand)' : 'rgba(255,128,0,0.09)'}
            />
          {/each}
        </g>
      {:else if g.kind === 'dot'}
        <circle cx={g.x + 16} cy="162" r="7" fill="var(--color-brand)" />
      {:else}
        <g transform={`translate(${g.x + (DIGIT_OFFSET[g.ch] ?? 0)},0)`}>
          <rect x="12" y="126" width="34" height="13" fill="var(--color-brand)" />
          <rect x="23" y="115" width="13" height="35" fill="var(--color-brand)" />
        </g>
      {/if}
    {/each}
    </g>
  </svg>
</span>
