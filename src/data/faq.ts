export type FaqItem = { q: string; a: string; grup: 'Umum' | 'Program' | 'Workshop' | 'Pembayaran' };

export const faqs: FaqItem[] = [
  {
    grup: 'Umum',
    q: 'Apa itu Sports Communication?',
    a: 'Keterampilan fundamental buat atlet modern: public speaking & bahasa Inggris khusus konteks atlet — biar kamu percaya diri menghadapi media, membuka peluang lebih besar, dan mewakili diri serta tim dengan baik.',
  },
  {
    grup: 'Umum',
    q: 'Programnya online atau offline?',
    a: 'Saat ini semua program (1-on-1 & Small Group) dijalankan online, jadi atlet di mana saja bisa ikut. Workshop untuk akademi/klub bisa disesuaikan — diskusikan via WhatsApp.',
  },
  {
    grup: 'Program',
    q: 'Bedanya Elite dan Premium apa?',
    a: 'Elite fokus ke progres privat dengan personal coach. Premium mendapat semua benefit Elite plus pemberitaan profil atlet di portal berita nasional.',
  },
  {
    grup: 'Program',
    q: 'Kalau belum pede mulai dari mana?',
    a: 'Tenang — ada tes penempatan dulu untuk menentukan level: Basic (mulai dari nol), Development (mengembangkan kemampuan), atau Impact (komunikasi dengan percaya diri).',
  },
  {
    grup: 'Program',
    q: 'Berapa lama sampai kelihatan hasilnya?',
    a: 'Perkembangan dipantau tiap bulan: Bulan 1 atlet bisa berkomunikasi, Bulan 2 mengekspresikan diri, Bulan 3 mewakili diri & tim, Bulan 4 membangun identitas diri.',
  },
  {
    grup: 'Workshop',
    q: 'Workshop untuk siapa?',
    a: 'Untuk akademi/klub olahraga yang ingin membekali atlet binaannya. Minimal 10 peserta per sesi, didampingi coach Sports Communication berpengalaman.',
  },
  {
    grup: 'Workshop',
    q: 'Bedanya Starter dan Premium?',
    a: 'Starter: 90 menit, simulasi wawancara mini. Premium: 120 menit, simulasi interview bersama 3+ assessor, individual assessment, e-certificate, e-book, plus pemberitaan akademi di portal media.',
  },
  {
    grup: 'Pembayaran',
    q: 'Bayarnya gimana?',
    a: 'Semua transaksi & pendaftaran dibantu langsung lewat WhatsApp admin — harga, jadwal, sampai cara bayar dijelaskan di chat. Tidak perlu checkout online.',
  },
];
