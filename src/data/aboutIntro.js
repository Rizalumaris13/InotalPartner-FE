// Kontrak frontend untuk blok "Kenal Kami Lebih Dekat" di halaman Tentang.
// Semua nilai awal di bawah menyalin teks yang sebelumnya hardcoded di TentangPage.
export const ABOUT_INTRO_LIMITS = {
  eyebrow: 60,
  headline: 160,
  headline_accent: 80,
  photo_alt: 160,
  progress_title: 60,
  progress_label: 50,
  card_title: 60,
  card_description: 300,
  item: 120,
  cta_label: 60,
}

// Tujuan CTA dibatasi ke halaman publik yang dikenal router.
// Dipakai Sidebar dan Topbar supaya label menu serta breadcrumb tidak menyimpang.
export const ABOUT_INTRO_NAV = {
  key: 'aboutIntro',
  parent: 'About',
  group: 'Intro Tentang',
  label: 'Intro & Misi Visi',
}

export const ABOUT_INTRO_CTA_TARGETS = [
  { value: 'program', label: 'Program' },
  { value: 'event', label: 'Event' },
  { value: 'berita', label: 'Berita' },
  { value: 'artikel', label: 'Artikel' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'kontak', label: 'Kontak' },
  { value: 'tentang', label: 'Tentang' },
  { value: 'landing', label: 'Beranda' },
]

// Tata letak halaman memakai dua baris progres dan tiga poin per kartu.
export const PROGRESS_ROWS = 2
export const CARD_ITEMS = 3

export const DEFAULT_ABOUT_INTRO = {
  eyebrow: 'Kenal Kami Lebih Dekat',
  headline: 'Menggerakkan kolaborasi yang berdampak untuk',
  headline_accent: 'pertumbuhan bersama.',
  photo_url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&q=80',
  photo_alt: 'Tim INOTAL Partner dalam sesi diskusi kolaborasi',
  progress_title: 'Progres Kemitraan',
  progress: [
    { label: 'Kolaborasi berjalan', percent: 82 },
    { label: 'Kepuasan mitra', percent: 90 },
  ],
  mission: {
    title: 'Misi Kami',
    description: 'Memberdayakan mitra melalui solusi kolaborasi yang terukur dan layanan yang sungguh-sungguh.',
    items: ['Kejelasan arah sejak awal', 'Komunikasi tanpa birokrasi', 'Program yang dituntaskan'],
  },
  vision: {
    title: 'Visi Kami',
    description: 'Menjadi ekosistem kemitraan teknologi paling dipercaya di Indonesia.',
    items: ['Ekosistem mitra terbesar di Indonesia', 'Dampak nyata lintas industri', 'Pertumbuhan bersama jangka panjang'],
  },
  cta_label: 'Lihat Program Kami',
  cta_target: 'program',
}
