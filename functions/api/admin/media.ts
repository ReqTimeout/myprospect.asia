type Env = { DB: D1Database; MEDIA_BUCKET?: R2Bucket };

// Status bucket R2 dibaca dari binding yang benar-benar ada di runtime, jadi panel
// Media tidak lagi menebak-nebak. Selama R2 belum diaktifkan di dashboard Cloudflare,
// binding tidak dibuat dan siap = false.
export const onRequestGet = async (context: { env: Env }): Promise<Response> => {
  const { env } = context;
  const siap = !!env.MEDIA_BUCKET;

  return new Response(
    JSON.stringify({
      siap,
      bucket: siap ? 'prospect-media' : null,
      langkah: siap
        ? []
        : [
            'Buka dash.cloudflare.com → R2 → Explore R2 → Activate (butuh sekali klik setuju, tidak lewat API)',
            'Setelah aktif, bucket prospect-media dibuat dan di-binding ke project Pages',
            'Muat ulang tab Media — status otomatis jadi siap',
          ],
    }),
    { status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } },
  );
};
