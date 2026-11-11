import React from 'react'
import * as Icons from 'lucide-react'
import { BarChart3 } from 'lucide-react'

// Pilihan icon Lucide yang representatif untuk statistik angka, pertumbuhan, dan pencapaian
export const STATISTIC_ICON_OPTIONS = [
  { value: 'Calendar', label: 'Calendar — Tahun / Kalender' },
  { value: 'Users', label: 'Users — Alumni / Komunitas / Pengguna' },
  { value: 'Handshake', label: 'Handshake — Partnership / Kerja Sama' },
  { value: 'Layers', label: 'Layers — Program / Layanan / Modul' },
  { value: 'Award', label: 'Award — Penghargaan / Sertifikasi' },
  { value: 'Trophy', label: 'Trophy — Prestasi' },
  { value: 'TrendingUp', label: 'TrendingUp — Pertumbuhan / Kenaikan' },
  { value: 'Target', label: 'Target — Pencapaian' },
  { value: 'Rocket', label: 'Rocket — Peluncuran / Inovasi' },
  { value: 'Briefcase', label: 'Briefcase — Proyek / Bisnis' },
  { value: 'Building2', label: 'Building2 — Perusahaan / Mitra' },
  { value: 'Globe', label: 'Globe — Jaringan / Global' },
  { value: 'GraduationCap', label: 'GraduationCap — Edukasi / Alumni' },
  { value: 'CheckCircle2', label: 'CheckCircle2 — Tuntas / Sukses' },
  { value: 'ShieldCheck', label: 'ShieldCheck — Keamanan / Kualitas' },
  { value: 'Clock', label: 'Clock — Jam Terbang / Waktu' },
  { value: 'Star', label: 'Star — Bintang / Rating' },
  { value: 'Sparkles', label: 'Sparkles — Keunggulan' },
  { value: 'BarChart3', label: 'BarChart3 — Statistik / Data' },
]

export function resolveStatisticIconComponent(name) {
  if (!name || typeof name !== 'string') return null
  const raw = name.trim()
  if (!raw) return null

  if (Icons[raw]) return Icons[raw]

  const pascal = raw
    .replace(/[-_](\w)/g, (_, c) => c.toUpperCase())
    .replace(/^\w/, (c) => c.toUpperCase())

  if (Icons[pascal]) return Icons[pascal]
  if (Icons[`${pascal}Icon`]) return Icons[`${pascal}Icon`]

  const cleanKey = raw.toLowerCase().replace(/[-_]/g, '')
  for (const key of Object.keys(Icons)) {
    const kLower = key.toLowerCase()
    if (kLower === cleanKey || kLower === `${cleanKey}icon`) {
      return Icons[key]
    }
  }

  return null
}

export function normalizeStatisticIcon(name) {
  if (!name || typeof name !== 'string') return 'BarChart3'
  const raw = name.trim()
  if (!raw) return 'BarChart3'

  const pascal = raw
    .replace(/[-_](\w)/g, (_, c) => c.toUpperCase())
    .replace(/^\w/, (c) => c.toUpperCase())

  if (Icons[pascal]) return pascal

  const cleanKey = raw.toLowerCase().replace(/[-_]/g, '')
  for (const key of Object.keys(Icons)) {
    if (key.toLowerCase() === cleanKey) return key
  }

  return raw
}

export function DynamicStatisticIcon({ name, size = 18, className = '' }) {
  const IconComponent = resolveStatisticIconComponent(name)
  if (!IconComponent) {
    return <BarChart3 size={size} className={className} />
  }
  return <IconComponent size={size} className={className} />
}

