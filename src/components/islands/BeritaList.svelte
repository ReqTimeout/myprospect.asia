<script lang="ts">
  import { onMount } from 'svelte';
  import { liveJson } from '../../lib/live';

  type Post = { id: string; title: string; desc: string; kategori: string; pubDate: string; cover: string };

  interface Props {
    posts: Post[];
  }

  let { posts }: Props = $props();

  let list = $state<Post[]>(posts);

  const fmt = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

  onMount(async () => {
    const data = await liveJson<
      { slug: string; title: string; desc: string; kategori: string; pub_date: string; cover: string }[]
    >('/api/posts');
    if (data && data.length > 0) {
      list = data.map((p) => ({
        id: p.slug,
        title: p.title,
        desc: p.desc,
        kategori: p.kategori,
        pubDate: `${p.pub_date}T00:00:00Z`,
        cover: p.cover ?? '',
      }));
    }
  });
</script>

<div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
  {#each list as post (post.id)}
    <a
      href={`/berita/${post.id}`}
      class="group flex flex-col overflow-hidden rounded-3xl border border-ink/10 bg-paper-deep transition duration-200 hover:-translate-y-1 hover:border-gold/50 focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
    >
      <div class="relative aspect-16/10 overflow-hidden bg-gradient-to-br from-brand/25 via-brand-soft to-gold/30">
        {#if post.cover}
          <img
            src={post.cover}
            alt=""
            loading="lazy"
            width="640"
            height="400"
            class="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
          <div class="absolute inset-0 bg-gradient-to-t from-ink/45 via-transparent to-transparent"></div>
        {/if}
        <span class="absolute top-3 left-3 rounded-full bg-paper/85 px-2.5 py-1 text-[10px] font-black tracking-wider text-brand-dark uppercase backdrop-blur">
          {post.kategori}
        </span>
      </div>
      <div class="flex flex-1 flex-col p-5">
        <p class="text-[11px] text-ink/45">{fmt.format(new Date(post.pubDate))}</p>
        <h2 class="mt-1.5 text-base leading-snug font-bold transition group-hover:text-brand-dark">{post.title}</h2>
        <p class="mt-2 line-clamp-2 text-[13px] text-ink/60">{post.desc}</p>
      </div>
    </a>
  {/each}
</div>
