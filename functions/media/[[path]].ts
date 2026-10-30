type Env = {
  MEDIA_BUCKET?: R2Bucket;
  ASSETS?: { fetch: (req: Request) => Promise<Response> };
};

// Pages Functions jalan SEBELUM aset statis, jadi route /media/* ini membayangi
// gambar bawaan di public/media/. Karena itu: coba R2 dulu, kalau tidak ada
// objeknya serahkan ke binding ASSETS supaya gambar bawaan tetap tampil.
//
// Kunci R2 memakai awalan "media/" (lihat functions/api/admin/upload.ts),
// sedangkan parameter route sudah memotong segmen /media/ — jadi awalan
// ditambahkan kembali di sini. URL publiknya: /media/<nama-berkas>.
export const onRequest = async (context: {
  request: Request;
  env: Env;
  params: Record<string, string | string[]>;
}): Promise<Response> => {
  const { request, env, params } = context;
  const mentah = params.path;
  const sisa = Array.isArray(mentah) ? mentah.join('/') : (mentah ?? '');
  const nama = decodeURIComponent(sisa).replace(/^\/+/, '');

  if (env.MEDIA_BUCKET && nama) {
    const kunci = `media/${nama}`;
    const objek = await env.MEDIA_BUCKET.get(kunci);
    if (objek) {
      // httpMetadata itu PROPERTI pada R2Object (method-nya writeHttpMetadata).
      const tipe = objek.httpMetadata?.contentType ?? 'application/octet-stream';
      return new Response(objek.body, {
        status: 200,
        headers: {
          'Content-Type': tipe,
          'Content-Length': String(objek.size),
          'Cache-Control': 'public, max-age=31536000, immutable',
          ETag: objek.httpEtag,
        },
      });
    }
  }

  // Bukan objek R2 -> teruskan ke bundel aset statis Pages (gambar bawaan).
  if (env.ASSETS) {
    const statis = await env.ASSETS.fetch(request);
    const tipe = statis.headers.get('Content-Type') ?? '';
    // Tanpa 404.html, Pages mengembalikan index.html untuk path yang tak dikenal.
    // Path /media/* tidak boleh menghasilkan HTML, jadi dibalas 404 yang jujur.
    if (statis.status === 404 || tipe.includes('text/html')) {
      return new Response('Media tidak ditemukan.', {
        status: 404,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }
    return statis;
  }

  return new Response('Media tidak ditemukan.', { status: 404 });
};
