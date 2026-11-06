// Kontrak frontend blok "Layanan Kami / Partnership" di Beranda.
// Nilai awal menyalin teks dan foto yang sebelumnya hardcoded di LandingPage.
export const HOMEPAGE_SERVICES_NAV = {
  key: 'homeServices',
  parent: 'Home Page',
  group: 'Layanan Kami',
  label: 'Kartu Layanan',
}

export const SERVICE_COUNT = 4

export const HOMEPAGE_SERVICES_LIMITS = {
  eyebrow: 60,
  title: 80,
  description: 500,
  badge_value: 8,
  badge_label: 40,
  service_title: 60,
  service_description: 300,
}

export const DEFAULT_HOMEPAGE_SERVICES = {
  eyebrow: 'Layanan Kami',
  title: 'Partnership',
  description: 'Empat pilar layanan yang kami rancang untuk mendampingi transformasi digital bisnis Anda, dari strategi hingga eksekusi.',
  badge_value: '7+',
  badge_label: 'Partnership Aktif',
  photo_primary_url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80',
  photo_primary_alt: 'Tim berdiskusi',
  photo_secondary_url: 'https://images.unsplash.com/photo-1573497491208-6b1acb260507?w=600&q=80',
  photo_secondary_alt: 'Jabat tangan kemitraan bisnis',
  services: [
    {
      icon: 'monitor-cog',
      title: 'IT CONSULTANT',
      description: 'Layanan konsultasi IT profesional untuk bisnis yang ingin memanfaatkan teknologi secara strategis demi pertumbuhan dan efisiensi operasional.',
    },
    {
      icon: 'layers',
      title: 'SYSTEM INTEGRATION',
      description: 'Memastikan komponen perangkat lunak dan keras dalam ekosistem IT bisnis Anda bekerja secara harmonis dan terpadu.',
    },
    {
      icon: 'settings-2',
      title: 'RESOURCE MANAGEMENT',
      description: 'Layanan konsultasi dan implementasi strategis untuk mengalokasikan sumber daya secara efektif demi efisiensi biaya maksimal.',
    },
    {
      icon: 'code',
      title: 'SOFTWARE DEVELOPMENT',
      description: 'Pengembangan solusi perangkat lunak kustom yang disesuaikan dengan kebutuhan spesifik dan visi bisnis klien.',
    },
  ],
}
