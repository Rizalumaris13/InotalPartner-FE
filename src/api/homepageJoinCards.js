import api from './axios'
import { isJoinCardsRecord, toJoinCardsPayload } from '../utils/homepageJoinCards'

export const JOIN_CARDS_PATH = '/homepage/join-cards'

const readResponse = ({ data: body }) => {
  if (body?.success === false && typeof body.message === 'string' && body.message.trim()) {
    throw new Error(body.message)
  }
  if (body?.success !== true || (body.data !== null && !isJoinCardsRecord(body.data))) {
    throw new Error('Format data kartu Mengapa Bergabung tidak sesuai kontrak.')
  }
  return body.data === null ? null : [...body.data].sort((a, b) => a.position - b.position)
}

export const getPublicJoinCardsApi = (options = {}) =>
  api.get(`/public${JOIN_CARDS_PATH}`, options).then(readResponse)

export const getJoinCardsApi = (options = {}) =>
  api.get(JOIN_CARDS_PATH, options).then(readResponse)

export const saveJoinCardsApi = (cards) => {
  const payload = toJoinCardsPayload(cards)
  if (!isJoinCardsRecord(payload.cards)) throw new Error('Enam kartu wajib berisi posisi, judul, dan deskripsi yang valid.')
  return api.put(JOIN_CARDS_PATH, payload).then(({ data: body }) => {
    if (body?.success !== true) {
      throw new Error(typeof body?.message === 'string' && body.message.trim()
        ? body.message : 'Backend belum mengonfirmasi penerimaan kartu.')
    }
    // GET ulang oleh editor adalah bukti tersimpan, bukan respons PUT ini.
  })
}
