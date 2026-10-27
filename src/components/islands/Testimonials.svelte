<script lang="ts">
  import { onMount } from 'svelte';
  import emblaCarouselSvelte from 'embla-carousel-svelte';
  import { Quote } from '@lucide/svelte';
  import type { Testimonial } from '../../data/testimonials';

  interface Props {
    items: Testimonial[];
  }

  let { items }: Props = $props();

  let embla = $state<any>(null);
  let selected = $state(0);

  const onInit = (event: CustomEvent) => {
    embla = event.detail;
    embla.on('select', () => selected = embla.selectedScrollSnap());
  };

  const scrollTo = (i: number) => embla?.scrollTo(i);
</script>

<div class="embla" use:emblaCarouselSvelte={{ options: { loop: true, align: 'start' }, plugins: [] }} oninit={onInit}>
  <div class="embla__viewport overflow-hidden">
    <div class="embla__container flex gap-4">
      {#each items as t (t.nama)}
        <figure class="embla__slide min-w-[85%] shrink-0 rounded-3xl border border-white/10 bg-white/5 p-6 sm:min-w-[60%] lg:min-w-[45%]">
          <Quote size={22} class="mb-3 text-gold" aria-hidden="true" />
          <blockquote class="text-sm leading-relaxed text-bone/85 sm:text-base">
            “{t.kutipan}”
          </blockquote>
          <figcaption class="mt-5 flex items-center gap-3">
            <span class="flex h-10 w-10 items-center justify-center rounded-full bg-brand/20 text-sm font-black text-brand italic">
              {t.nama[0]}
            </span>
            <div class="leading-tight">
              <p class="text-sm font-bold">{t.nama}</p>
              <p class="text-xs text-bone/50">{t.asal} · {t.olahraga}</p>
            </div>
          </figcaption>
        </figure>
      {/each}
    </div>
  </div>

  <div class="mt-5 flex justify-center gap-1">
    {#each items as _, i (i)}
      <button
        type="button"
        aria-label={`Slide ${i + 1}`}
        onclick={() => scrollTo(i)}
        class="flex h-6 w-6 items-center justify-center rounded-full transition-all focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
      >
        <span
          class={[
            'h-2 rounded-full transition-all',
            selected === i ? 'w-6 bg-gold' : 'w-2 bg-white/25',
          ]}
        ></span>
      </button>
    {/each}
  </div>
</div>
