import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = new URL('../src/content/berita/', import.meta.url).pathname;
const esc = (s) => s.replace(/'/g, "''");

const rows = [];
for (const f of readdirSync(dir).filter((n) => n.endsWith('.mdx'))) {
  const raw = readFileSync(join(dir, f), 'utf8');
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) throw new Error(`frontmatter tidak terbaca: ${f}`);
  const fm = m[1];
  const body = m[2].trim();
  const pick = (key) => {
    const r = fm.match(new RegExp(`^${key}:\\s*'([^']*)'|^${key}:\\s*(\\S+)$`, 'm'));
    return (r?.[1] ?? r?.[2] ?? '').trim();
  };
  const slug = f.replace(/\.mdx$/, '');
  const title = pick('title');
  const desc = pick('desc');
  const pubDate = pick('pubDate');
  const kategori = pick('kategori') || 'Berita';
  const status = pick('status') || 'published';
  if (!title || !desc || !pubDate) throw new Error(`field hilang di ${f}`);
  rows.push(
    `INSERT INTO posts (slug, title, "desc", kategori, pub_date, body, status) VALUES ('${esc(slug)}', '${esc(title)}', '${esc(desc)}', '${esc(kategori)}', '${pubDate}', '${esc(body)}', '${status}') ON CONFLICT(slug) DO UPDATE SET title=excluded.title, "desc"=excluded."desc", kategori=excluded.kategori, pub_date=excluded.pub_date, body=excluded.body, status=excluded.status, updated_at=datetime('now');`,
  );
}

const out = `-- Generated oleh scripts/gen-posts-seed.mjs dari src/content/berita/*.mdx\n${rows.join('\n')}\n`;
writeFileSync(new URL('../migrations/0003_seed_posts.sql', import.meta.url).pathname, out);
console.log(`OK: ${rows.length} post → migrations/0003_seed_posts.sql`);
