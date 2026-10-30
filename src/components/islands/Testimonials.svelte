<script lang="ts">
  import { onMount } from 'svelte';
  import emblaCarouselSvelte from 'embla-carousel-svelte';
  import { Quote } from '@lucide/svelte';
  import type { Testimonial } from '../../data/testimonials';
  import { liveJson } from '../../lib/live';

  interface Props {
    items: Testimonial[];
  }

  let { items }: Props = $props();

  let list = $state<Testimonial[]>(items);
  let embla = $state<any>(null);
  let selected = $state(0);
  let paused = $state(false);

  const photos = [
    { src: '/media/workshop-crowd.jpg', alt: 'Atlet Prospect Asia berlatih public speaking bersama' },
    { src: '/media/docs-7.jpg', alt: 'Atlet yang siap diwawancara' },
    { src: '/media/workshop-live-2.jpg', alt: 'Coach Prospect Asia mendampingi atlet saat sesi' },
  ];

  let timer: ReturnType<typeof setInterval> | null = null;

  const startAuto = () => {
    if (timer || paused) return;
    timer = setInterval(() => embla?.scrollNext(), 5000);
  };

  const stopAuto = () => {
    if (!timer) return;
    clearInterval(timer);
    timer = null;
  };

  onMount(async () => {
    const data = await liveJson<{ title: string; body: string; meta: { asal?: string; olahraga?: string } }[]>(
      '/api/content/testimonials',
    );
    if (data && data.length > 0) {
      list = data.map((t) => ({
        nama: t.title,
        asal: t.meta.asal ?? 'Atlet Prospect Asia',
        olahraga: t.meta.olahraga ?? '',
        kutipan: t.body,
      }));
      embla?.reInit?.();
    }
    startAuto();
    return () => stopAuto();
  });

  const onInit = (event: CustomEvent) => {
    embla = event.detail;
    embla.on('select', () => (selected = embla.selectedScrollSnap()));
    startAuto();
  };

  const scrollTo = (i: number) => embla?.scrollTo(i);
</script>

<div
  class="embla"
  use:emblaCarouselSvelte={{ options: { loop: true, align: 'start' }, plugins: [] }}
  oninit={onInit}
  onmouseenter={() => {
    paused = true;
    stopAuto();
  }}
  onmouseleave={() => {
    paused = false;
    startAuto();
  }}
  onfocusin={() => {
    paused = true;
    stopAuto();
  }}
  onfocusout={() => {
    paused = false;
    startAuto();
  }}
>
  <div class="embla__viewport overflow-hidden">
    <div class="embla__container flex gap-4">
      {#each list as t, i (t.nama)}
        <figure data-spot class="spot embla__slide card-soft card-lift w-[88%] shrink-0 overflow-hidden rounded-3xl sm:w-[62%] lg:w-[46%]">
          <div class="relative z-10 grid sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <div class="relative aspect-16/10 overflow-hidden bg-paper-deep sm:aspect-auto">
              <img
                src={photos[i % photos.length].src}
                alt={photos[i % photos.length].alt}
                loading="lazy"
                width="1280"
                height="800"
                class="absolute inset-0 h-full w-full object-cover"
              />
              <div class="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-transparent"></div>
              <Quote size={26} class="absolute bottom-3 left-4 text-white/90" aria-hidden="true" />
              <span class="absolute top-3 right-3 rounded-full border border-white/40 bg-white/20 px-2.5 py-1 text-[10px] font-bold tracking-wide text-white uppercase backdrop-blur-sm">
                Atlet Prospect Asia
              </span>
            </div>
            <div class="flex flex-col justify-center p-6">
              <p class="mb-3 flex items-center gap-1 text-gold" aria-label="Rating 5 dari 5">
                {#each Array(5) as _, s (s)}
                  <svg viewBox="0 0 20 20" class="h-3.5 w-3.5 fill-current" aria-hidden="true">
                    <path d="M10 1.6l2.6 5.3 5.8.8-4.2 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.6 7.7l5.8-.8L10 1.6z"></path>
                  </svg>
                {/each}
              </p>
              <blockquote class="text-sm leading-relaxed text-ink/85 sm:text-base">
                “{t.kutipan}”
              </blockquote>
              <figcaption class="mt-5 flex items-center gap-3">
                <span class="flex h-11 w-11 items-center justify-center rounded-full bg-brand/20 text-base font-black text-brand italic">
                  {t.nama[0]}
                </span>
                <div class="leading-tight">
                  <p class="text-sm font-bold">{t.nama}</p>
                  <p class="text-xs text-ink/50">{t.asal}{t.olahraga ? ` · ${t.olahraga}` : ''}</p>
                </div>
              </figcaption>
            </div>
          </div>
        </figure>
      {/each}
    </div>
  </div>

  <div class="mt-6 flex items-center justify-center gap-1">
    {#each list as _, i (i)}
      <button
        type="button"
        aria-label={`Slide ${i + 1}`}
        onclick={() => scrollTo(i)}
        class="flex h-6 w-6 items-center justify-center rounded-full transition-all focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
      >
        <span
          class={[
            'h-2 rounded-full transition-all',
            selected === i ? 'w-6 bg-brand' : 'w-2 bg-ink/20',
          ]}
        ></span>
      </button>
    {/each}
    <span class="ml-3 hidden items-center gap-1.5 text-[11px] font-bold tracking-wide text-ink/40 uppercase sm:inline-flex">
      <span class="h-1.5 w-1.5 animate-pulse rounded-full bg-brand"></span>
      Auto
    </span>
  </div>
</div>
