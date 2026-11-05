// Tiga posisi tetap pada kolase Mengapa Bergabung, bukan banner atau slider.
export const JOIN_IMAGE_SLOTS = [
  { key: 'top_left_url', label: 'Foto kiri atas', alt: 'Tim diskusi' },
  { key: 'bottom_right_url', label: 'Foto kanan bawah', alt: 'Kemitraan' },
  { key: 'center_url', label: 'Foto tengah (utama)', alt: 'Kolaborasi' },
]

// Pertahankan foto yang sebelumnya tampil selama konfigurasi belum tersedia.
export const DEFAULT_JOIN_IMAGES = {
  top_left_url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=500&q=80',
  bottom_right_url: 'https://images.unsplash.com/photo-1573497491208-6b1acb260507?w=500&q=80',
  center_url: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=500&q=80',
}
