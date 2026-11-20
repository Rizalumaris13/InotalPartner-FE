// Konfigurasi tampilan awal tugas company. Belum menjadi kontrak API/backend.
export const COMPANY_ROLES = ['company']

const workModes = ['Di kantor', 'Jarak jauh', 'Hibrida']
const education = ['SMK / SMA', 'Diploma', 'Sarjana', 'Tidak dibatasi']
const field = (key, label, type = 'text', extra = {}) => ({ key, label, type, ...extra })
const required = { required: true }
const money = { suffix: 'Rp', min: 0 }

function companySection(titleLabel) {
  return {
    title: 'Informasi utama',
    description: 'Identitas peluang dan perusahaan yang menawarkannya.',
    fields: [
      field('title', titleLabel, 'text', { ...required, placeholder: 'Tulis judul yang jelas', maxLength: 150, wide: true }),
      field('company', 'Nama perusahaan', 'text', { ...required, placeholder: 'Nama resmi perusahaan', maxLength: 150 }),
      field('location', 'Lokasi', 'text', { ...required, placeholder: 'Kota atau wilayah', maxLength: 150 }),
      field('contact_email', 'Email narahubung', 'email', { ...required, placeholder: 'Email untuk informasi lebih lanjut', maxLength: 254, wide: true }),
    ],
  }
}

function descriptionSection(descriptionLabel, requirementsLabel) {
  return {
    title: 'Deskripsi dan ketentuan',
    description: 'Jelaskan ruang lingkup serta apa yang dibutuhkan.',
    fields: [
      field('description', descriptionLabel, 'textarea', { ...required, placeholder: 'Jelaskan tujuan, aktivitas, dan manfaatnya.', maxLength: 5000, wide: true }),
      field('requirements', requirementsLabel, 'textarea', { ...required, placeholder: 'Tulis satu poin per baris.', maxLength: 3000, wide: true }),
    ],
  }
}

export const COMPANY_MENUS = [
  {
    key: 'companyInternships', label: 'Kesempatan Magang', icon: 'graduation',
    description: 'Buka kesempatan belajar dan pengalaman kerja di perusahaan.',
    previewTitle: 'Judul kesempatan magang',
    sections: [
      companySection('Judul lowongan'),
      {
        title: 'Detail magang', description: 'Atur kebutuhan peserta, durasi, dan pelaksanaan.',
        fields: [
          field('department', 'Divisi', 'text', { ...required, placeholder: 'Contoh: Pengembangan perangkat lunak', maxLength: 150 }),
          field('work_mode', 'Sistem kerja', 'select', { ...required, options: workModes }),
          field('education', 'Jenjang pendidikan', 'select', { ...required, options: education }),
          field('quota', 'Jumlah peserta', 'number', { ...required, min: 1, suffix: 'orang' }),
          field('duration', 'Durasi magang', 'number', { ...required, min: 1, suffix: 'bulan' }),
          field('allowance', 'Uang saku per bulan', 'number', { ...money, hint: 'Opsional. Isi 0 jika tanpa uang saku.' }),
          field('start_date', 'Tanggal mulai', 'date', required),
          field('deadline', 'Batas pendaftaran', 'date', required),
        ],
      },
      descriptionSection('Deskripsi magang', 'Persyaratan peserta'),
    ],
    dateOrder: [['deadline', 'start_date']],
    previewFacts: ['department', 'work_mode', 'education', 'quota', 'duration', 'allowance', 'start_date', 'deadline'],
  },
  {
    key: 'companyInvestments', label: 'Investasi', icon: 'investment',
    description: 'Susun penawaran investasi untuk usaha atau proyek yang dituju.',
    previewTitle: 'Judul penawaran investasi',
    sections: [
      companySection('Judul investasi'),
      {
        title: 'Rencana investasi', description: 'Cantumkan nilai dan bentuk penawaran secara transparan.',
        fields: [
          field('target', 'Usaha atau proyek tujuan', 'text', { ...required, placeholder: 'Nama usaha atau proyek', maxLength: 150, wide: true }),
          field('scheme', 'Bentuk investasi', 'select', { ...required, options: ['Penyertaan modal', 'Pendanaan proyek', 'Bagi hasil', 'Lainnya'] }),
          field('amount', 'Nilai investasi', 'number', { ...required, ...money, min: 1 }),
          field('duration', 'Jangka waktu', 'number', { ...required, min: 1, suffix: 'bulan' }),
          field('stage', 'Tahap usaha', 'select', { ...required, options: ['Perencanaan', 'Rintisan', 'Sudah berjalan', 'Ekspansi'] }),
          field('deadline', 'Batas penawaran', 'date', required),
        ],
      },
      descriptionSection('Tujuan penggunaan dana', 'Ketentuan dan risiko investasi'),
    ],
    previewFacts: ['target', 'scheme', 'amount', 'duration', 'stage', 'deadline'],
  },
  {
    key: 'companyJobs', label: 'Lowongan Pekerjaan', icon: 'briefcase',
    description: 'Temukan kandidat yang sesuai untuk kebutuhan tim perusahaan.',
    previewTitle: 'Judul lowongan pekerjaan',
    sections: [
      companySection('Judul posisi'),
      {
        title: 'Detail pekerjaan', description: 'Jelaskan jenis pekerjaan dan kualifikasi kandidat.',
        fields: [
          field('employment', 'Jenis pekerjaan', 'select', { ...required, options: ['Penuh waktu', 'Paruh waktu', 'Kontrak', 'Lepas'] }),
          field('work_mode', 'Sistem kerja', 'select', { ...required, options: workModes }),
          field('education', 'Pendidikan minimum', 'select', { ...required, options: education }),
          field('experience', 'Pengalaman kerja', 'select', { ...required, options: ['Tanpa pengalaman', '1–2 tahun', '3–5 tahun', 'Lebih dari 5 tahun'] }),
          field('salary_min', 'Gaji minimum per bulan', 'number', { ...money, hint: 'Opsional, isi kedua batas jika dicantumkan.' }),
          field('salary_max', 'Gaji maksimum per bulan', 'number', money),
          field('quota', 'Jumlah posisi', 'number', { ...required, min: 1, suffix: 'orang' }),
          field('deadline', 'Batas pendaftaran', 'date', required),
        ],
      },
      descriptionSection('Tanggung jawab pekerjaan', 'Kualifikasi kandidat'),
    ],
    numberRange: ['salary_min', 'salary_max'],
    previewFacts: ['employment', 'work_mode', 'education', 'experience', 'salary_min', 'salary_max', 'quota', 'deadline'],
  },
  {
    key: 'companyCollaborations', label: 'Kolaborasi', icon: 'handshake',
    description: 'Tawarkan kerja sama yang memberi nilai bagi perusahaan dan mitra.',
    previewTitle: 'Judul penawaran kolaborasi',
    sections: [
      companySection('Judul kolaborasi'),
      {
        title: 'Bentuk kerja sama', description: 'Tentukan mitra, kontribusi, dan hasil yang diharapkan.',
        fields: [
          field('category', 'Jenis kolaborasi', 'select', { ...required, options: ['Teknologi', 'Pemasaran', 'Riset dan pengembangan', 'Pelatihan', 'Lainnya'] }),
          field('partner', 'Mitra yang dicari', 'text', { ...required, placeholder: 'Contoh: Perusahaan teknologi', maxLength: 150 }),
          field('budget', 'Anggaran kerja sama', 'number', { ...money, hint: 'Opsional. Dapat dibahas bersama mitra.' }),
          field('benefit', 'Model manfaat', 'select', { ...required, options: ['Bagi hasil', 'Biaya layanan', 'Pertukaran sumber daya', 'Kesepakatan bersama'] }),
          field('start_date', 'Tanggal mulai', 'date', required),
          field('end_date', 'Tanggal selesai', 'date', required),
        ],
      },
      descriptionSection('Ruang lingkup kolaborasi', 'Kontribusi dan hasil yang diharapkan'),
    ],
    dateOrder: [['start_date', 'end_date']],
    previewFacts: ['category', 'partner', 'budget', 'benefit', 'start_date', 'end_date'],
  },
  {
    key: 'companyProjects', label: 'Proyek', icon: 'project',
    description: 'Buka proyek berbayar dengan ruang lingkup dan hasil yang jelas.',
    previewTitle: 'Judul proyek',
    sections: [
      companySection('Judul proyek'),
      {
        title: 'Detail proyek', description: 'Tentukan anggaran, pelaksanaan, dan skema pembayaran.',
        fields: [
          field('category', 'Bidang proyek', 'select', { ...required, options: ['Pengembangan perangkat lunak', 'Desain', 'Infrastruktur TI', 'Konsultasi', 'Lainnya'] }),
          field('budget', 'Anggaran proyek', 'number', { ...required, ...money, min: 1 }),
          field('payment', 'Skema pembayaran', 'select', { ...required, options: ['Per termin', 'Setelah selesai', 'Bulanan', 'Kesepakatan bersama'] }),
          field('work_mode', 'Sistem kerja', 'select', { ...required, options: workModes }),
          field('start_date', 'Tanggal mulai', 'date', required),
          field('end_date', 'Target selesai', 'date', required),
        ],
      },
      descriptionSection('Ruang lingkup proyek', 'Hasil akhir dan keahlian yang dibutuhkan'),
    ],
    dateOrder: [['start_date', 'end_date']],
    previewFacts: ['category', 'budget', 'payment', 'work_mode', 'start_date', 'end_date'],
  },
]
