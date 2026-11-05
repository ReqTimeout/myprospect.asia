import { SITE } from '../data/site';

type WaOptions = {
  program?: string;
  source?: string;
  number?: string;
  /** false = jangan tampilkan baris "_sumber: …" di pesan WhatsApp (dipakai
      dock, yang bersumberan sudah jelas dari posisinya). */
  showSource?: boolean;
};

export function waLink({ program, source, number, showSource = true }: WaOptions = {}): string {
  const lines = ['Halo Prospect Asia! 👋'];
  if (program) {
    lines.push(`Saya tertarik dengan program *${program}*.`);
    lines.push('Boleh info jadwal, harga, dan cara daftarnya?');
  } else {
    lines.push('Saya tertarik dengan Sports Communication Program.');
    lines.push('Boleh info lebih lanjut?');
  }
  if (source && showSource) lines.push(`_sumber: ${source}_`);
  return `https://wa.me/${number || SITE.waNumber}?text=${encodeURIComponent(lines.join('\n'))}`;
}
