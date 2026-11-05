import { SITE } from '../data/site';

type WaOptions = {
  program?: string;
  source?: string;
  number?: string;
  /** Override per tombol:
   *  - false → paksa sembunyikan "_sumber: …" (dipakai dock)
   *  - true  → paksa tampilkan, walau saklar global SITE.waShowSource = false
   *  - undefined → ikut saklar global SITE.waShowSource
   */
  showSource?: boolean;
};

export function waLink({ program, source, number, showSource }: WaOptions = {}): string {
  const lines = ['Halo Prospect Asia! 👋'];
  if (program) {
    lines.push(`Saya tertarik dengan program *${program}*.`);
    lines.push('Boleh info jadwal, harga, dan cara daftarnya?');
  } else {
    lines.push('Saya tertarik dengan Sports Communication Program.');
    lines.push('Boleh info lebih lanjut?');
  }
  const tampilSumber = showSource ?? SITE.waShowSource;
  if (source && tampilSumber) lines.push(`_sumber: ${source}_`);
  return `https://wa.me/${number || SITE.waNumber}?text=${encodeURIComponent(lines.join('\n'))}`;
}
