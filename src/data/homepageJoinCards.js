// Kontrak frontend untuk enam kartu Mengapa Bergabung; endpoint backend terpisah.
export const JOIN_CARD_COUNT = 6
export const MAX_JOIN_CARD_TITLE_LENGTH = 150
export const MAX_JOIN_CARD_DESCRIPTION_LENGTH = 600

export const JOIN_CARD_FIELDS = [
  { key: 'title', label: 'Judul', maxLength: MAX_JOIN_CARD_TITLE_LENGTH },
  { key: 'description', label: 'Deskripsi', maxLength: MAX_JOIN_CARD_DESCRIPTION_LENGTH },
]

// Teks Beranda sebelumnya dipertahankan saat konfigurasi belum tersedia.
export const DEFAULT_JOIN_CARDS = [
  {
    position: 1,
    title: 'Dunia Cepat Berubah',
    description: 'Perubahan teknologi dan pasar terjadi begitu cepat — mereka yang adaptif akan memimpin gelombang berikutnya.',
  },
  {
    position: 2,
    title: 'Blue Ocean',
    description: 'Masih banyak ruang tak terjamah di ekosistem digital Indonesia. Jadilah yang pertama mengisinya bersama INOTAL.',
  },
  {
    position: 3,
    title: 'Ekonomi Inovasi Bikin Aksi',
    description: 'Inovasi bukan sekadar ide — ia adalah aksi nyata yang menggerakkan roda ekonomi dan menciptakan dampak sosial.',
  },
  {
    position: 4,
    title: 'Momentum Pergerakan',
    description: 'Saat ini adalah waktu terbaik untuk bergerak. Bergabunglah dengan komunitas pemuda yang tidak menunggu.',
  },
  {
    position: 5,
    title: 'Potensi Bangsa',
    description: 'Indonesia memiliki 270 juta jiwa dengan semangat luar biasa. INOTAL hadir untuk mengoptimalkan setiap potensi itu.',
  },
  {
    position: 6,
    title: 'Investasi Masa Depan',
    description: 'Bergabung hari ini adalah investasi terbaik untuk karier, jaringan, dan dampak yang akan kamu rasakan bertahun-tahun ke depan.',
  },
]
