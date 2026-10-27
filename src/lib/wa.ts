import { SITE } from '../data/site';

type WaOptions = {
  program?: string;
  source?: string;
};

export function waLink({ program, source }: WaOptions = {}): string {
  const lines = ['Halo Prospect Asia! 👋'];
  if (program) {
    lines.push(`Saya tertarik dengan program *${program}*.`);
    lines.push('Boleh info jadwal, harga, dan cara daftarnya?');
  } else {
    lines.push('Saya tertarik dengan Sports Communication Program.');
    lines.push('Boleh info lebih lanjut?');
  }
  if (source) lines.push(`_sumber: ${source}_`);
  return `https://wa.me/${SITE.waNumber}?text=${encodeURIComponent(lines.join('\n'))}`;
}
