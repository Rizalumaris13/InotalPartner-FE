import * as Icons from 'lucide-react'

export const HIGHLIGHT_ICON_OPTIONS = [
  { value: 'Video', label: 'Video (Kamera)' },
  { value: 'Users', label: 'Users (Tim / Kolaborasi)' },
  { value: 'Play', label: 'Play (Pemutar)' },
  { value: 'Sparkles', label: 'Sparkles (Keunggulan / Kilau)' },
  { value: 'CheckCircle2', label: 'CheckCircle2 (Terverifikasi)' },
  { value: 'Award', label: 'Award (Penghargaan)' },
  { value: 'Trophy', label: 'Trophy (Piala / Prestasi)' },
  { value: 'ShieldCheck', label: 'ShieldCheck (Keamanan)' },
  { value: 'HeartHandshake', label: 'HeartHandshake (Kemitraan)' },
  { value: 'Lightbulb', label: 'Lightbulb (Inovasi)' },
  { value: 'Target', label: 'Target (Tujuan / Fokus)' },
  { value: 'TrendingUp', label: 'TrendingUp (Pertumbuhan)' },
  { value: 'Globe', label: 'Globe (Global / Jaringan)' },
  { value: 'Clock', label: 'Clock (Tepat Waktu)' },
  { value: 'Star', label: 'Star (Kualitas Bintang)' },
  { value: 'Zap', label: 'Zap (Cepat / Responsif)' },
  { value: 'Link', label: 'Link (Koneksi / Tautan)' },
]

function toPascalCase(name) {
  return name.replace(/[-_](\w)/g, (_, letter) => letter.toUpperCase())
    .replace(/^\w/, (letter) => letter.toUpperCase())
}

export function resolveLucideIconKey(name) {
  if (typeof name !== 'string') return null
  const raw = name.trim()
  if (!raw) return null
  if (Icons[raw]) return raw

  const pascal = toPascalCase(raw)
  if (Icons[pascal]) return pascal
  if (Icons[`${pascal}Icon`]) return `${pascal}Icon`

  const cleanKey = raw.toLowerCase().replace(/[-_]/g, '')
  return Object.keys(Icons).find((key) => {
    const lowerKey = key.toLowerCase()
    return lowerKey === cleanKey || lowerKey === `${cleanKey}icon`
  }) ?? null
}

export function normalizeIconName(name) {
  if (typeof name !== 'string') return 'Sparkles'
  const raw = name.trim()
  if (!raw) return 'Sparkles'

  const pascal = toPascalCase(raw)
  if (Icons[pascal]) return pascal

  // Nama di luar preset tetap dipertahankan untuk data yang sudah tersimpan.
  const cleanKey = raw.toLowerCase().replace(/[-_]/g, '')
  return Object.keys(Icons).find((key) => key.toLowerCase() === cleanKey) ?? raw
}
