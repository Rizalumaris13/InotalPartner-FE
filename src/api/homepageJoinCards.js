import api from './axios'
import { readNullableContent, requireContentAcknowledgement } from './contentResponse'
import { withEndpointFallback } from './endpointFallback'
import { isJoinCardsRecord, toJoinCardsPayload } from '../utils/homepageJoinCards'
import { DEFAULT_JOIN_CARDS, JOIN_CARD_COUNT } from '../data/homepageJoinCards'

// Endpoint backend yang sebenarnya untuk alasan / kartu Mengapa Bergabung:
// - Admin: GET /api/homepage/reasons, POST /api/homepage/reasons, PUT /api/homepage/reasons/:id
// - Public: GET /api/public/homepage/reasons
export const REASONS_PATH = '/homepage/reasons'
export const PUBLIC_REASONS_PATH = '/public/homepage/reasons'
export const JOIN_CARDS_PATH = '/homepage/join-cards'

const readResponse = ({ data: body }) => {
  const cards = readNullableContent(body, isJoinCardsRecord, 'Format data kartu Mengapa Bergabung tidak sesuai kontrak.')
  return cards === null ? null : [...cards].sort((a, b) => a.position - b.position)
}

const CONTRACT_ERROR = 'Format data kartu Mengapa Bergabung tidak sesuai kontrak.'

const mapBackendReasonToCard = (reason) => {
  if (!reason || typeof reason !== 'object' || Array.isArray(reason) ||
      !Number.isSafeInteger(reason.id) || reason.id < 1 ||
      (reason.is_active !== undefined && typeof reason.is_active !== 'boolean')) {
    throw new Error(CONTRACT_ERROR)
  }
  let position
  if (reason.number === undefined || reason.number === null || reason.number === '') {
    if (!Number.isInteger(reason.display_order) || reason.display_order < 0 || reason.display_order >= JOIN_CARD_COUNT) {
      throw new Error(CONTRACT_ERROR)
    }
    position = reason.display_order + 1
  } else {
    if (typeof reason.number !== 'string' || !/^0?[1-6]$/.test(reason.number)) throw new Error(CONTRACT_ERROR)
    position = Number(reason.number)
  }
  return {
    id: reason.id,
    position,
    title: reason.title,
    description: reason.description,
  }
}

export const normalizeToSixCards = (backendList) => {
  if (!Array.isArray(backendList) || backendList.length > JOIN_CARD_COUNT) throw new Error(CONTRACT_ERROR)
  const mapped = backendList.map(mapBackendReasonToCard)
  const byPosition = new Map(mapped.map((card) => [card.position, card]))
  if (byPosition.size !== mapped.length) throw new Error(CONTRACT_ERROR)
  const result = DEFAULT_JOIN_CARDS.map((card) => byPosition.get(card.position) ?? { ...card })
  if (!isJoinCardsRecord(result)) throw new Error(CONTRACT_ERROR)
  return result
}

const isBackendReasons = (data) => {
  try {
    normalizeToSixCards(data)
    return true
  } catch {
    return false
  }
}

const readReasons = ({ data: body }) => readNullableContent(body, isBackendReasons, CONTRACT_ERROR)

const readAdminResponse = ({ data: body }) => {
  const reasons = readReasons({ data: body })
  return reasons === null || reasons.length === 0 ? null : normalizeToSixCards(reasons)
}

/**
 * Membaca respons GET public (/api/public/homepage/reasons)
 * Respons backend: { success: true, data: { setting: {...}, reasons: [...] } }
 */
const readPublicResponse = ({ data: body }) => {
  const data = readNullableContent(body, (value) =>
    Boolean(value && typeof value === 'object' && !Array.isArray(value) && isBackendReasons(value.reasons)),
  CONTRACT_ERROR)
  if (data === null || data.reasons.length === 0) return null
  const reasons = data.reasons
  return normalizeToSixCards(reasons)
}

export const getPublicJoinCardsApi = (options = {}) =>
  withEndpointFallback(
    api.get(`/public${JOIN_CARDS_PATH}`, options).then(readResponse),
    () => api.get(PUBLIC_REASONS_PATH, options).then(readPublicResponse),
  )

export const getJoinCardsApi = (options = {}) =>
  withEndpointFallback(
    api.get(JOIN_CARDS_PATH, options).then(readResponse),
    () => api.get(REASONS_PATH, options).then(readAdminResponse),
  )

export const saveJoinCardsApi = (cards) => {
  const payload = toJoinCardsPayload(cards)
  if (!isJoinCardsRecord(payload.cards)) throw new Error('Enam kartu wajib berisi posisi, judul, dan deskripsi yang valid.')
  return withEndpointFallback(
    api.put(JOIN_CARDS_PATH, payload).then(({ data: body }) =>
      requireContentAcknowledgement(body, 'Backend belum mengonfirmasi penerimaan kartu.'),
    ),
    () => saveBackendReasons(payload.cards),
  )
}

const saveBackendReasons = async (cards) => {
  // A failed preflight must never be mistaken for an empty database.
  const existing = await api.get(REASONS_PATH).then(readReasons) ?? []
  const byPosition = new Map(existing.map((reason) => [mapBackendReasonToCard(reason).position, reason]))
  for (const card of cards) {
    const match = byPosition.get(card.position)
    const payload = {
      number: String(card.position).padStart(2, '0'),
      title: card.title,
      description: card.description,
      display_order: card.position - 1,
      is_active: match?.is_active ?? true,
    }
    const { data: body } = match
      ? await api.put(`${REASONS_PATH}/${match.id}`, payload)
      : await api.post(REASONS_PATH, payload)
    requireContentAcknowledgement(body, `Backend belum mengonfirmasi penerimaan kartu ${payload.number}.`)
  }
}
