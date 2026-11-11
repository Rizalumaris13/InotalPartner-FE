import api from './axios'
import { isJoinCardsRecord, toJoinCardsPayload } from '../utils/homepageJoinCards'
import { DEFAULT_JOIN_CARDS } from '../data/homepageJoinCards'

// Endpoint backend yang sebenarnya untuk alasan / kartu Mengapa Bergabung:
// - Admin: GET /api/homepage/reasons, POST /api/homepage/reasons, PUT /api/homepage/reasons/:id
// - Public: GET /api/public/homepage/reasons
export const REASONS_PATH = '/homepage/reasons'
export const PUBLIC_REASONS_PATH = '/public/homepage/reasons'

/**
 * Normalisasi item kartu dari backend (model HomepageReason)
 * Model backend: { id, number, title, description, display_order, is_active }
 * Format frontend: { position: 1..6, title, description, id? }
 */
const mapBackendReasonToCard = (reason, index) => {
  let pos = parseInt(reason.number, 10)
  if (isNaN(pos) || pos < 1 || pos > 6) {
    pos = (reason.display_order != null && reason.display_order >= 0) ? reason.display_order + 1 : index + 1
  }
  return {
    id: reason.id,
    position: pos,
    title: reason.title || '',
    description: reason.description || '',
  }
}

/**
 * Mengisi array 6 kartu lengkap dari data backend atau default fallback
 */
export const normalizeToSixCards = (backendList) => {
  if (!Array.isArray(backendList) || backendList.length === 0) {
    return DEFAULT_JOIN_CARDS
  }

  const mapped = backendList.map(mapBackendReasonToCard)
  
  // Bentuk array posisi 1..6
  const result = []
  for (let i = 1; i <= 6; i++) {
    const existing = mapped.find((c) => c.position === i)
    if (existing) {
      result.push(existing)
    } else {
      const fallback = DEFAULT_JOIN_CARDS.find((c) => c.position === i)
      result.push({ ...fallback })
    }
  }

  return result.sort((a, b) => a.position - b.position)
}

/**
 * Membaca respons GET admin (/api/homepage/reasons)
 */
const readAdminResponse = ({ data: body }) => {
  if (body?.success === false && typeof body.message === 'string' && body.message.trim()) {
    throw new Error(body.message)
  }
  if (body?.success !== true) {
    throw new Error('Format data kartu Mengapa Bergabung tidak sesuai kontrak.')
  }
  if (!Array.isArray(body.data) || body.data.length === 0) {
    return null
  }
  return normalizeToSixCards(body.data)
}

/**
 * Membaca respons GET public (/api/public/homepage/reasons)
 * Respons backend: { success: true, data: { setting: {...}, reasons: [...] } }
 */
const readPublicResponse = ({ data: body }) => {
  if (body?.success === false && typeof body.message === 'string' && body.message.trim()) {
    throw new Error(body.message)
  }
  if (body?.success !== true) {
    throw new Error('Format data publik Mengapa Bergabung tidak sesuai kontrak.')
  }
  const reasons = body.data?.reasons
  if (!Array.isArray(reasons) || reasons.length === 0) {
    return DEFAULT_JOIN_CARDS
  }
  return normalizeToSixCards(reasons)
}

// GET /api/public/homepage/reasons
export const getPublicJoinCardsApi = (options = {}) =>
  api.get(PUBLIC_REASONS_PATH, options).then(readPublicResponse)

// GET /api/homepage/reasons
export const getJoinCardsApi = (options = {}) =>
  api.get(REASONS_PATH, options).then(readAdminResponse)

/**
 * Menyimpan keenam kartu ke backend.
 * Backend mengelola kartu via POST /api/homepage/reasons atau PUT /api/homepage/reasons/:id.
 */
export const saveJoinCardsApi = async (cards) => {
  const { cards: payloadCards } = toJoinCardsPayload(cards)
  if (!isJoinCardsRecord(payloadCards)) {
    throw new Error('Enam kartu wajib berisi posisi, judul, dan deskripsi yang valid.')
  }

  // Dapatkan seluruh kartu yang ada di database saat ini
  let existingReasons = []
  try {
    const res = await api.get(REASONS_PATH)
    if (res.data?.success && Array.isArray(res.data?.data)) {
      existingReasons = res.data.data
    }
  } catch {
    // Abaikan jika get awal gagal
  }

  // Simpan / update masing-masing 6 kartu secara berurutan
  for (const card of payloadCards) {
    const numberStr = String(card.position).padStart(2, '0')
    const displayOrder = card.position - 1

    // Cari apakah kartu pada posisi ini sudah tersimpan di database
    const match = existingReasons.find((r) => {
      const p = parseInt(r.number, 10)
      return p === card.position || r.display_order === displayOrder
    })

    const bodyPayload = {
      number: numberStr,
      title: card.title,
      description: card.description,
      display_order: displayOrder,
      is_active: true,
    }

    if (match && match.id) {
      // Update kartu yang sudah ada
      const updateRes = await api.put(`${REASONS_PATH}/${match.id}`, bodyPayload)
      if (updateRes.data?.success !== true) {
        throw new Error(updateRes.data?.message || `Gagal memperbarui kartu ${numberStr}.`)
      }
    } else {
      // Buat kartu baru jika belum ada di database
      const createRes = await api.post(REASONS_PATH, bodyPayload)
      if (createRes.data?.success !== true) {
        throw new Error(createRes.data?.message || `Gagal membuat kartu ${numberStr}.`)
      }
    }
  }

  return true
}
