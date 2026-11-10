import api from './axios'
import { readNullableContent, requireContentAcknowledgement } from './contentResponse'
import { isJoinCardsRecord, toJoinCardsPayload } from '../utils/homepageJoinCards'

export const JOIN_CARDS_PATH = '/homepage/join-cards'

const readResponse = ({ data: body }) => {
  const cards = readNullableContent(body, isJoinCardsRecord, 'Format data kartu Mengapa Bergabung tidak sesuai kontrak.')
  return cards === null ? null : [...cards].sort((a, b) => a.position - b.position)
}

export const getPublicJoinCardsApi = (options = {}) =>
  api.get(`/public${JOIN_CARDS_PATH}`, options).then(readResponse)

export const getJoinCardsApi = (options = {}) =>
  api.get(JOIN_CARDS_PATH, options).then(readResponse)

export const saveJoinCardsApi = (cards) => {
  const payload = toJoinCardsPayload(cards)
  if (!isJoinCardsRecord(payload.cards)) throw new Error('Enam kartu wajib berisi posisi, judul, dan deskripsi yang valid.')
  return api.put(JOIN_CARDS_PATH, payload).then(({ data: body }) =>
    requireContentAcknowledgement(body, 'Backend belum mengonfirmasi penerimaan kartu.'),
  )
}
