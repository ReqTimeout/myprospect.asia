type Env = { DB: D1Database };

import { getSettings } from './settings';

function normWa(raw: string): string {
  let d = raw.replace(/\D/g, '');
  if (d.startsWith('0')) d = '62' + d.slice(1);
  else if (d.startsWith('8')) d = '62' + d;
  return d;
}

export const onRequestPost = async (context: { request: Request; env: Env }): Promise<Response> => {
  const { request, env } = context;
  const form = await request.formData();

  const nama = String(form.get('nama') ?? '').trim().slice(0, 80);
  const waRaw = String(form.get('wa') ?? '').trim().slice(0, 30);
  const program = String(form.get('program') ?? '').trim().slice(0, 120) || 'Tidak disebutkan';
  const sumber = String(form.get('sumber') ?? '').trim().slice(0, 80) || 'web';
  const catatan = String(form.get('catatan') ?? '').trim().slice(0, 200);
  const honeypot = String(form.get('website') ?? '');

  if (!nama || !waRaw) {
    return new Response('Data belum lengkap — mohon isi nama dan nomor WhatsApp.', { status: 400 });
  }

  const wa = normWa(waRaw);
  if (wa.length < 10) {
    return new Response('Nomor WhatsApp belum valid. Contoh: 081234567890.', { status: 400 });
  }

  if (!honeypot) {
    await env.DB.prepare(
      'INSERT INTO leads (nama, wa, program, sumber, status, catatan) VALUES (?, ?, ?, ?, ?, ?)',
    )
      .bind(nama, wa, program, sumber, 'baru', catatan || null)
      .run();
  }

  const text =
    `Halo Prospect Asia! Saya ${nama} (WA: ${waRaw}) — tertarik dengan ${program}.` +
    (catatan ? ` Catatan: ${catatan}.` : '') +
    ` Sumber: ${sumber}. Boleh info jadwal & detailnya?`;

  const settings = await getSettings(env);
  const waNumber = settings.wa_number || '6285924041004';

  return Response.redirect(`https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`, 302);
};
