import React from 'react'
import * as Icons from 'lucide-react'
import { Sparkles } from 'lucide-react'

// Daftar opsi ikon Lucide yang umum dipakai untuk poin video profil
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

/**
 * Mencari komponen ikon Lucide yang valid berdasarkan nama.
 * Menangani format: PascalCase ('ShieldCheck'), kebab-case ('shield-check'),
 * snake_case ('shield_check'), lowercase ('video'), atau dengan suffix 'Icon'.
 */
export function resolveLucideIconComponent(name) {
  if (!name || typeof name !== 'string') return null

  const raw = name.trim()
  if (!raw) return null

  // 1. Direct match (PascalCase)
  if (Icons[raw]) {
    return Icons[raw]
  }

  // 2. Normalisasi format kebab-case, snake_case, lowercase ke PascalCase
  const pascal = raw
    .replace(/[-_](\w)/g, (_, c) => c.toUpperCase())
    .replace(/^\w/, (c) => c.toUpperCase())

  if (Icons[pascal]) {
    return Icons[pascal]
  }

  // 3. Coba dengan suffix 'Icon' (beberapa export Lucide menyediakan namaIcon)
  if (Icons[`${pascal}Icon`]) {
    return Icons[`${pascal}Icon`]
  }

  // 4. Case-insensitive matching sebagai fallback cerdas
  const cleanKey = raw.toLowerCase().replace(/[-_]/g, '')
  for (const key of Object.keys(Icons)) {
    const kLower = key.toLowerCase()
    if (kLower === cleanKey || kLower === `${cleanKey}icon`) {
      return Icons[key]
    }
  }

  return null
}

/**
 * Normalisasi nama ikon ke format canonical PascalCase (misal: 'video' -> 'Video').
 */
export function normalizeIconName(name) {
  if (!name || typeof name !== 'string') return 'Sparkles'
  const raw = name.trim()
  if (!raw) return 'Sparkles'

  const pascal = raw
    .replace(/[-_](\w)/g, (_, c) => c.toUpperCase())
    .replace(/^\w/, (c) => c.toUpperCase())

  if (Icons[pascal]) {
    return pascal
  }

  const cleanKey = raw.toLowerCase().replace(/[-_]/g, '')
  for (const key of Object.keys(Icons)) {
    const kLower = key.toLowerCase()
    if (kLower === cleanKey) {
      return key
    }
  }

  return raw
}

/**
 * Komponen untuk merender ikon Lucide secara dinamis dengan fallback aman.
 * Komponen Lucide forwardRef adalah object React element factory (bukan sekadar fungsi murni),
 * sehingga verifikasi memeriksa apakah IconComponent valid.
 */
export function DynamicHighlightIcon({ name, size = 18, className = '' }) {
  const IconComponent = resolveLucideIconComponent(name)

  if (!IconComponent) {
    // Fallback ikon jika nama kosong atau tidak ditemukan di Lucide
    return <Sparkles size={size} className={className} />
  }

  return <IconComponent size={size} className={className} />
}
