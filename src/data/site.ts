export const SITE = {
  name: 'Prospect Asia',
  legal: 'PT Kita Berani Bicara',
  tagline: 'Jadi Atlet Modern',
  hashtag: '#JadiAtletModern',
  waNumber: '6285924041004',
  waDisplay: '0859-2404-1004',
  url: 'https://myprospect.asia',
  /**
   * Tampilkan baris "_sumber: …" di pesan WhatsApp.
   * - true  → semua tombol mengirim sumber (perilaku sekarang)
   * - false → sumber disembunyikan di SEMUA tombol; tombol tertentu masih
   *            bisa memaksa tampil lewat `waLink({ showSource: true })`,
   *            atau memaksa sembunyi lewat `showSource: false` (dipakai dock).
   */
  waShowSource: true,
} as const;
