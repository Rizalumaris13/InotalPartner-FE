// Konfigurasi halaman dan submenu; data banner disimpan backend, bukan di modul ini.
export const PAGE_BANNER_PAGES = [
  { key: 'tentang', name: 'Tentang', navKey: 'bannerTentang' },
  { key: 'event', name: 'Event', navKey: 'bannerEvent' },
  { key: 'berita', name: 'Berita', navKey: 'bannerBerita' },
  { key: 'artikel', name: 'Artikel', navKey: 'bannerArtikel' },
  { key: 'kontak', name: 'Kontak', navKey: 'bannerKontak' },
]
export const PAGE_BANNER_ROLES = ['super_admin', 'admin']

// Teks yang sekarang tertanam di halaman publik. Dipakai hanya sebagai isian
// awal/pratinjau selama backend Rijal belum menyediakan resource banner.
export const DEFAULT_PAGE_BANNERS = {
  tentang: {
    label: 'Siapa Kami — Sejak 2019',
    title: 'Tentang Kami',
    description:
      'Ekosistem kemitraan teknologi INOTAL — menghubungkan perusahaan, komunitas, dan talenta digital dalam satu jaringan yang saling menopang.',
    image_url:
      'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1600&q=80',
  },
  event: {
    label: 'Agenda Ecosystem',
    title: 'Event',
    description:
      'Workshop, webinar, dan meetup yang kami buka untuk ekosistem. Sebagian gratis, sebagian berbayar, semuanya diurus oleh tim kami.',
    image_url:
      'https://images.unsplash.com/photo-1511578314322-379afb476865?w=1600&q=80',
  },
  berita: {
    label: 'Kabar Ecosystem',
    title: 'Berita',
    description:
      'Kabar terbaru, pengumuman, dan hal yang perlu lo tahu tentang program INOTAL Partner.',
    image_url:
      'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=1600&q=80',
  },
  artikel: {
    label: 'Tulisan Mendalam',
    title: 'Artikel',
    description:
      'Tulisan panjang tentang kolaborasi, teknologi, dan cara kerja yang kami pakai di ekosistem.',
    image_url:
      'https://images.unsplash.com/photo-1456324504439-367cee3b3c32?w=1600&q=80',
  },
  kontak: {
    label: 'Kontak — Kami Siap Membantu',
    title: 'Hubungi Kami',
    description:
      'Punya pertanyaan tentang kemitraan, program, atau kolaborasi? Tim kami merespons setiap pesan dalam 1×24 jam kerja.',
    image_url:
      'https://images.unsplash.com/photo-1423666639041-f56000c27a9a?w=1600&q=80',
  },
}

export const getPageBannerMeta = (pageKey) =>
  PAGE_BANNER_PAGES.find((page) => page.key === pageKey) || null
