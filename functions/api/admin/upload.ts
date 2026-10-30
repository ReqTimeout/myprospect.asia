type Env = { DB: D1Database; MEDIA_BUCKET?: R2Bucket };

const MAKS = 5 * 1024 * 1024;
const BOLEH: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/pjpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
  'video/mp4': 'mp4',
};

function tanpaBucket(): Response {
  return new Response('R2 belum aktif — bucket prospect-media belum tersedia di project ini.', { status: 503 });
}

function kunciAsli(nama: string, ext: string): string {
  const bersih = nama
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  const hari = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `media/${hari}-${bersih || 'berkas'}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
}

export const onRequestGet = async (context: { env: Env }): Promise<Response> => {
  const { env } = context;
  if (!env.MEDIA_BUCKET) return tanpaBucket();
  // Tipe R2 belum tersedia di tsconfig project ini (workers-types tidak dipasang),
  // jadi bentuk respons dipegang manual supaya tidak jadi any.
  const daftar = (await env.MEDIA_BUCKET.list({ limit: 40 })) as unknown as {
    objects: { key: string; size: number; uploaded: Date }[];
  };
  return new Response(
    JSON.stringify({
      siap: true,
      berkas: daftar.objects.map((o) => ({
        key: o.key,
        ukuran: o.size,
        waktu: o.uploaded.toISOString(),
      })),
    }),
    { status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } },
  );
};

export const onRequestPost = async (context: { request: Request; env: Env }): Promise<Response> => {
  const { request, env } = context;
  if (!env.MEDIA_BUCKET) return tanpaBucket();

  const file = (await request.formData().catch(() => null))?.get('file');
  if (!(file instanceof File)) return new Response('Tidak ada berkas yang dikirim.', { status: 400 });

  const ext = BOLEH[file.type];
  if (!ext) return new Response('Tipe berkas tidak didukung: jpg, png, webp, gif, avif, atau mp4.', { status: 400 });
  if (file.size > MAKS) return new Response('Ukuran maksimum 5 MB.', { status: 413 });

  const key = kunciAsli(file.name, ext);
  await env.MEDIA_BUCKET.put(key, file.stream(), {
    httpMetadata: { contentType: file.type },
  });

  return new Response(JSON.stringify({ ok: true, key, nama: file.name, ukuran: file.size }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};
