import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const berita = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/berita' }),
  schema: z.object({
    title: z.string(),
    desc: z.string(),
    pubDate: z.coerce.date(),
    kategori: z.enum(['Berita', 'Bintang', 'Kolaborasi']),
    cover: z.string().optional(),
    status: z.enum(['draft', 'published']).default('published'),
  }),
});

export const collections = { berita };
