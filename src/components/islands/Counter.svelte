<script lang="ts">
  import { onMount } from 'svelte';

  interface Props {
    to: number;
    suffix?: string;
    duration?: number;
  }

  let { to, suffix = '', duration = 1200 }: Props = $props();

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
</script>

<span bind:this={el}>{new Intl.NumberFormat('id-ID').format(value)}{suffix}</span>
